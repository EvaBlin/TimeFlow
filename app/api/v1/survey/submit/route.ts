import { NextResponse } from "next/server";
import { ensureAppUser } from "@/lib/appBootstrap";
import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { updateTwentyUser } from "@/lib/twenty";

export const dynamic = "force-dynamic";

type SubmitItem = {
  question_id: string;
  answer_id: string;
};

type MetricKey = "focus" | "energy" | "selfControl" | "creativity";

const metricMap: Record<string, MetricKey> = {
  focus: "focus",
  energy: "energy",
  self_control: "selfControl",
  creativity: "creativity"
};

const toPercentage = (avg: number): number => {
  return Math.max(0, Math.min(100, Math.round(avg)));
};

export async function POST(req: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await ensureAppUser(user);

    const body = (await req.json()) as SubmitItem[];
    if (!Array.isArray(body) || !body.length) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const answerIds = body.map((x) => x.answer_id);
    const answers = await prisma.surveyAnswer.findMany({
      where: { id: { in: answerIds } },
      include: { question: true }
    });

    const answerById = new Map(answers.map((a) => [a.id, a]));
    const metricBuckets: Record<MetricKey, number[]> = {
      focus: [],
      energy: [],
      selfControl: [],
      creativity: []
    };

    const rowsToUpsert = body.map((item) => {
      const answer = answerById.get(item.answer_id);
      if (!answer || answer.questionId !== item.question_id) {
        throw new Error("Invalid question/answer pair");
      }

      const metric = metricMap[answer.question.targetMetric];
      if (!metric) throw new Error("Unsupported target metric");
      
      metricBuckets[metric].push(answer.scoreValue);

      return {
        userId: user.id,
        questionId: item.question_id,
        answerId: item.answer_id
      };
    });

    await prisma.$transaction(async (tx) => {
      for (const row of rowsToUpsert) {
        await tx.userSurveyResult.upsert({
          where: { userId_questionId: { userId: row.userId, questionId: row.questionId } },
          create: { userId: row.userId, questionId: row.questionId, answerId: row.answerId },
          update: { answerId: row.answerId, completedAt: new Date() }
        });
      }

      const calculateFinalMetric = (values: number[]): number => {
        if (!values.length) return 50; // Дефолт 50%
        const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
        return toPercentage(avg);
      };

      await tx.profile.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          focus: calculateFinalMetric(metricBuckets.focus),
          energy: calculateFinalMetric(metricBuckets.energy),
          selfControl: calculateFinalMetric(metricBuckets.selfControl),
          creativity: calculateFinalMetric(metricBuckets.creativity)
        },
        update: {
          focus: calculateFinalMetric(metricBuckets.focus),
          energy: calculateFinalMetric(metricBuckets.energy),
          selfControl: calculateFinalMetric(metricBuckets.selfControl),
          creativity: calculateFinalMetric(metricBuckets.creativity)
        }
      });
    });

    const profile = await prisma.profile.findUnique({ where: { userId: user.id } });

    if (user.email && profile) {
      try {
        await updateTwentyUser({
          email: { primaryEmail: user.email },
          focus: profile.focus / 10,
          energy: profile.energy / 10,
          selfControl: profile.selfControl / 10,
          creativity: profile.creativity / 10
        });
      } catch (crmError) {
        console.error("CRM Sync Error:", crmError);
      }
    }

    return NextResponse.json({ success: true, profile });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Survey submit failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}