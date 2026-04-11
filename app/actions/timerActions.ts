"use server";

import { prisma } from "@/lib/prisma";
import type { TimerMode, TimerSessionStatus } from "@/types/models";

const DEFAULT_WORK_SECONDS = 25 * 60;
const DEFAULT_SHORT_BREAK_SECONDS = 5 * 60;

export async function createTimerSession(taskId: string) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: { id: true, userId: true }
  });

  if (!task) throw new Error("Task not found");

  const session = await prisma.timerSession.create({
    data: {
      userId: task.userId,
      taskId: taskId,
      mode: "work",
      status: "active",
      workSeconds: 0,
      breakSeconds: 0
    },
    select: { id: true }
  });

  return { sessionId: session.id };
}

export async function completeTimerSession(input: {
  sessionId: string;
  workSeconds: number;
  breakSeconds: number;
  finalMode: TimerMode;
}) {
  const existing = await prisma.timerSession.findUnique({
    where: { id: input.sessionId },
    select: { id: true, status: true }
  });
  if (!existing) throw new Error("Timer session not found");

  const session = await prisma.timerSession.update({
    where: { id: input.sessionId },
    data: {
      status: "completed" as TimerSessionStatus,
      finishedAt: new Date(),
      workSeconds: input.workSeconds,
      breakSeconds: input.breakSeconds,
      mode: input.finalMode
    },
    select: { id: true }
  });

  return { sessionId: session.id };
}

export async function saveReflectionNote(input: { sessionId: string; content: string }) {
  const trimmed = input.content.trim();
  if (!trimmed) throw new Error("Note content is empty");

  const note = await prisma.reflectionNote.upsert({
    where: { sessionId: input.sessionId },
    create: {
      sessionId: input.sessionId,
      content: trimmed
    },
    update: {
      content: trimmed
    },
    select: { id: true }
  });

  return { noteId: note.id };
}

