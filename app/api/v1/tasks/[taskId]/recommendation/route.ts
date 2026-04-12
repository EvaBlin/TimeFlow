import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

async function getCurrentUserId(): Promise<string | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

export async function POST(_req: Request, props: { params: Promise<{ taskId: string }> }) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { taskId } = await props.params;

  const task = await prisma.task.findFirst({
    where: { id: taskId, userId },
    include: {
      user: { include: { profile: true } },
      damageType: true
    }
  });
  if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });
  if (!task.user.profile) {
    return NextResponse.json({ error: "Profile not found. Complete survey first." }, { status: 400 });
  }

  try {
    const tools = await prisma.tool.findMany({ where: { isActive: true } });
    if (!tools.length) return NextResponse.json({ error: "No tools configured" }, { status: 400 });

    const complexity = Math.max(1, Math.min(5, task.description ? task.description.length / 80 : 3));
    const profile = task.user.profile;

    const scored = tools.map((tool) => {
      const name = tool.name.toLowerCase();
      let score = 0;

      if (task.damageType.code === "routine") {
        if (name.includes("pomodoro")) score += 35;
        if (name.includes("матрица")) score += 15;
      }
      if (task.damageType.code === "overload") {
        if (name.includes("тайм-бокс")) score += 35;
        if (name.includes("матрица")) score += 20;
      }
      if (task.damageType.code === "chaos") {
        if (name.includes("бюджетирование")) score += 35;
        if (name.includes("тайм-бокс")) score += 10;
      }

      if (complexity <= 2 && name.includes("pomodoro")) score += 10;
      if (profile.focus < 4 && name.includes("pomodoro")) score += 20;
      if (profile.selfControl < 4 && name.includes("бюджетирование")) score += 25;
      if (profile.energy < 4 && name.includes("тайм-бокс")) score += 15;
      if (profile.creativity > 6 && name.includes("матрица")) score += 10;
      if (task.priority === "high" && name.includes("матрица")) score += 10;

      return { tool, score };
    });

    const best = scored.sort((a, b) => b.score - a.score)[0];
    const reason =
      task.damageType.code === "chaos" && profile.selfControl < 4 && best.tool.name.toLowerCase().includes("бюджет")
        ? "Задача хаотичная, а самоконтроль сейчас низкий — метод бюджетирования времени поможет вернуть предсказуемость."
        : "Инструмент подобран с учетом типа задачи и вашего профиля.";

    await prisma.recommendation.upsert({
      where: {
        taskId_toolId: {
          taskId: task.id,
          toolId: best.tool.id
        }
      },
      create: {
        taskId: task.id,
        toolId: best.tool.id,
        score: best.score,
        reasonText: reason
      },
      update: {
        score: best.score,
        reasonText: reason
      }
    });

    return NextResponse.json({
      item: {
        toolId: best.tool.id,
        name: best.tool.name,
        score: best.score,
        reason
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to build recommendation";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
