import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const DEFAULT_QUESTIONS = [
  {
    text: "Как часто вы испытываете трудности с концентрацией?",
    targetMetric: "focus",
    displayOrder: 1,
    answers: [
      { label: "Редко", scoreValue: 8, displayOrder: 1 },
      { label: "Иногда", scoreValue: 6, displayOrder: 2 },
      { label: "Часто", scoreValue: 4, displayOrder: 3 },
      { label: "Постоянно", scoreValue: 2, displayOrder: 4 }
    ]
  },
  {
    text: "Насколько стабилен ваш уровень энергии в течение дня?",
    targetMetric: "energy",
    displayOrder: 2,
    answers: [
      { label: "Очень стабилен", scoreValue: 8, displayOrder: 1 },
      { label: "Скорее стабилен", scoreValue: 6, displayOrder: 2 },
      { label: "Часто проседает", scoreValue: 4, displayOrder: 3 },
      { label: "Почти всегда низкий", scoreValue: 2, displayOrder: 4 }
    ]
  },
  {
    text: "Как часто вы выполняете задачу до конца без прокрастинации?",
    targetMetric: "self_control",
    displayOrder: 3,
    answers: [
      { label: "Почти всегда", scoreValue: 8, displayOrder: 1 },
      { label: "Часто", scoreValue: 6, displayOrder: 2 },
      { label: "Иногда", scoreValue: 4, displayOrder: 3 },
      { label: "Редко", scoreValue: 2, displayOrder: 4 }
    ]
  },
  {
    text: "Насколько легко вы находите нестандартные решения в задачах?",
    targetMetric: "creativity",
    displayOrder: 4,
    answers: [
      { label: "Очень легко", scoreValue: 8, displayOrder: 1 },
      { label: "Скорее легко", scoreValue: 6, displayOrder: 2 },
      { label: "Иногда сложно", scoreValue: 4, displayOrder: 3 },
      { label: "Почти всегда сложно", scoreValue: 2, displayOrder: 4 }
    ]
  }
] as const;

export async function GET() {
  await prisma.$transaction(async (tx) => {
    const existing = await tx.surveyQuestion.findMany({
      where: { isActive: true },
      select: { displayOrder: true }
    });
    const existingOrders = new Set(existing.map((q) => q.displayOrder));

    for (const q of DEFAULT_QUESTIONS) {
      if (existingOrders.has(q.displayOrder)) {
        continue;
      }
      await tx.surveyQuestion.create({
        data: {
          text: q.text,
          targetMetric: q.targetMetric,
          displayOrder: q.displayOrder,
          answers: {
            create: q.answers.map((a) => ({
              label: a.label,
              scoreValue: a.scoreValue,
              displayOrder: a.displayOrder
            }))
          }
        }
      });
    }
  });

  let questions = await prisma.surveyQuestion.findMany({
    where: { isActive: true },
    orderBy: { displayOrder: "asc" },
    include: {
      answers: {
        where: { isActive: true },
        orderBy: { displayOrder: "asc" }
      }
    }
  });

  // Safety net for legacy duplicated data: keep one question per display_order.
  const uniqueByOrder = new Map<number, (typeof questions)[number]>();
  for (const q of questions) {
    if (!uniqueByOrder.has(q.displayOrder)) {
      uniqueByOrder.set(q.displayOrder, q);
    }
  }
  questions = Array.from(uniqueByOrder.values()).sort((a, b) => a.displayOrder - b.displayOrder);

  const items = questions.map((q) => ({
    id: q.id,
    text: q.text,
    targetMetric: q.targetMetric,
    displayOrder: q.displayOrder,
    answers: q.answers.map((a) => ({
      id: a.id,
      label: a.label,
      scoreValue: a.scoreValue,
      displayOrder: a.displayOrder
    }))
  }));

  return NextResponse.json({ items });
}

