import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

type UpdateTaskBody = {
  title?: string;
  description?: string | null;
  priority?: "low" | "medium" | "high";
  status?: "todo" | "in_progress" | "done" | "archived";
  damageType?: "routine" | "overload" | "chaos";
  deadline?: string | null;
};

async function getCurrentUserId(): Promise<string | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

export async function GET(_req: Request, props: { params: { taskId: string } }) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const task = await prisma.task.findFirst({
    where: { id: props.params.taskId, userId },
    include: { damageType: true }
  });
  if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });

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

export async function PATCH(req: Request, props: { params: { taskId: string } }) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const current = await prisma.task.findFirst({
    where: { id: props.params.taskId, userId }
  });
  if (!current) return NextResponse.json({ error: "Task not found" }, { status: 404 });

  const body = (await req.json()) as UpdateTaskBody;

  let damageTypeId: string | undefined;
  if (body.damageType) {
    const damageType = await prisma.damageType.findUnique({ where: { code: body.damageType } });
    if (!damageType) return NextResponse.json({ error: "Invalid damage type" }, { status: 400 });
    damageTypeId = damageType.id;
  }

  const task = await prisma.task.update({
    where: { id: props.params.taskId },
    data: {
      title: body.title?.trim() || undefined,
      description: body.description === undefined ? undefined : body.description,
      priority: body.priority,
      status: body.status,
      deadline: body.deadline === undefined ? undefined : body.deadline ? new Date(body.deadline) : null,
      damageTypeId
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

export async function DELETE(_req: Request, props: { params: { taskId: string } }) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const current = await prisma.task.findFirst({
    where: { id: props.params.taskId, userId }
  });
  if (!current) return NextResponse.json({ error: "Task not found" }, { status: 404 });

  await prisma.task.delete({ where: { id: props.params.taskId } });
  return NextResponse.json({ success: true });
}

