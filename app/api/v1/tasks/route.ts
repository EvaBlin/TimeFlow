import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

type CreateTaskBody = {
  title: string;
  description?: string;
  priority: "low" | "medium" | "high";
  damageType: "routine" | "overload" | "chaos";
  deadline?: string | null;
};

async function getCurrentUserId(): Promise<string | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tasks = await prisma.task.findMany({
    where: {
      userId,
      status: { not: "archived" }
    },
    include: { damageType: true },
    orderBy: [{ createdAt: "desc" }]
  });

  return NextResponse.json({
    items: tasks.map((t) => ({
      id: t.id,
      title: t.title,
      description: t.description,
      deadline: t.deadline,
      priority: t.priority,
      status: t.status,
      damageType: t.damageType.code
    }))
  });
}

export async function POST(req: Request) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json()) as CreateTaskBody;
  if (!body?.title?.trim()) {
    return NextResponse.json({ error: "Task title is required" }, { status: 400 });
  }

  const damageType = await prisma.damageType.findUnique({
    where: { code: body.damageType }
  });
  if (!damageType) {
    return NextResponse.json({ error: "Invalid damage type" }, { status: 400 });
  }

  const task = await prisma.task.create({
    data: {
      userId,
      title: body.title.trim(),
      description: body.description?.trim() || null,
      priority: body.priority ?? "medium",
      damageTypeId: damageType.id,
      deadline: body.deadline ? new Date(body.deadline) : null
    },
    include: { damageType: true }
  });

  return NextResponse.json({
    item: {
      id: task.id,
      title: task.title,
      description: task.description,
      deadline: task.deadline,
      priority: task.priority,
      status: task.status,
      damageType: task.damageType.code
    }
  });
}

