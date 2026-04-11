"use server";

import { prisma } from "@/lib/prisma";
import type { DamageTypeCode, TaskPriority, TaskStatus } from "@/types/models";

// JSON‑описание вопросов онбординг‑теста.
// Можно отдать на клиент как есть.
export const SURVEY_QUESTIONS = [
  {
    id: "focus_1",
    metric: "focus",
    text: "Как часто вы отвлекаетесь в течение рабочего блока (30–60 минут)?",
    options: [1, 2, 3, 4, 5]
  },
  {
    id: "energy_1",
    metric: "energy",
    text: "Как вы оцениваете свой уровень энергии во второй половине дня?",
    options: [1, 2, 3, 4, 5]
  },
  {
    id: "selfControl_1",
    metric: "selfControl",
    text: "Как часто вы доводите задачи до конца без прокрастинации?",
    options: [1, 2, 3, 4, 5]
  },
  {
    id: "creativity_1",
    metric: "creativity",
    text: "Насколько легко вам придумывать нестандартные решения?",
    options: [1, 2, 3, 4, 5]
  }
] as const;

export type SurveyMetric = "focus" | "energy" | "selfControl" | "creativity";

export interface SurveyAnswer {
  questionId: string;
  metric: SurveyMetric;
  value: number; // 1–5
}

/**
 * calculateProfile
 * Принимает ответы опроса и userId, вычисляет профиль (0–100 по каждой метрике)
 * и сохраняет/обновляет его в таблице Profile.
 */
export async function calculateProfile(userId: string, answers: SurveyAnswer[]) {
  if (!userId) {
    throw new Error("userId is required");
  }

  const grouped: Record<SurveyMetric, number[]> = {
    focus: [],
    energy: [],
    selfControl: [],
    creativity: []
  };

  for (const a of answers) {
    if (a.value < 1 || a.value > 5) continue;
    grouped[a.metric].push(a.value);
  }

  const toScore = (values: number[]): number => {
    if (!values.length) return 50;
    const avg = values.reduce((s, v) => s + v, 0) / values.length;
    // 1–5 → 0–100
    return Math.round(((avg - 1) / 4) * 100);
  };

  const profileData = {
    focus: toScore(grouped.focus),
    energy: toScore(grouped.energy),
    selfControl: toScore(grouped.selfControl),
    creativity: toScore(grouped.creativity)
  };

  const profile = await prisma.profile.upsert({
    where: { userId },
    create: {
      userId,
      focus: profileData.focus,
      energy: profileData.energy,
      selfControl: profileData.selfControl,
      creativity: profileData.creativity
    },
    update: {
      focus: profileData.focus,
      energy: profileData.energy,
      selfControl: profileData.selfControl,
      creativity: profileData.creativity
    }
  });

  return profile;
}

type DamageContext = {
  damageType: DamageTypeCode;
  complexity: number; // 1–5
  priority: TaskPriority;
};

type ProfileContext = {
  focus: number;
  energy: number;
  selfControl: number;
  creativity: number;
};

/**
 * getRecommendation(taskId)
 *
 * 1. Берёт задачу и профиль пользователя.
 * 2. Считает score для доступных инструментов.
 * 3. Создаёт запись Recommendation и возвращает лучший Tool.
 */
export async function getRecommendation(taskId: string) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      user: {
        include: { profile: true }
      },
      damageType: true
    }
  });

  if (!task) {
    throw new Error("Task not found");
  }
  if (!task.user.profile) {
    throw new Error("Profile not found for user");
  }

  const damageContext: DamageContext = {
    damageType: task.damageType.code as DamageTypeCode,
    complexity: Math.max(1, Math.min(5, task.description ? task.description.length / 80 : 3)),
    priority: task.priority as TaskPriority
  };

  const p: ProfileContext = {
    focus: task.user.profile.focus,
    energy: task.user.profile.energy,
    selfControl: task.user.profile.selfControl,
    creativity: task.user.profile.creativity
  };

  // Поддерживаемый набор инструментов (по имени в БД).
  const tools = await prisma.tool.findMany();
  if (!tools.length) {
    throw new Error("No tools configured");
  }

  const nameIndex = (name: string) =>
    tools.find((t) => t.name.toLowerCase() === name.toLowerCase()) ?? tools[0];

  const candidates = [
    nameIndex("Pomodoro"),
    nameIndex("Тайм-боксинг"),
    nameIndex("Бюджетирование времени"),
    nameIndex("Матрица Эйзенхауэра")
  ];

  const scored = candidates.map((tool) => {
    let score = 0;

    // База от damageType
    switch (damageContext.damageType) {
      case "routine":
        if (/pomodoro/i.test(tool.name)) score += 35;
        if (/матрица/i.test(tool.name)) score += 15;
        break;
      case "overload":
        if (/тайм-боксинг/i.test(tool.name)) score += 35;
        if (/матрица/i.test(tool.name)) score += 20;
        break;
      case "chaos":
        if (/бюджетирование/i.test(tool.name)) score += 35;
        if (/deep work/i.test(tool.name)) score += 25;
        break;
    }

    // Сложность задачи
    if (damageContext.complexity >= 4 && /deep work/i.test(tool.name)) {
      score += 20;
    } else if (damageContext.complexity <= 2 && /pomodoro/i.test(tool.name)) {
      score += 10;
    }

    // Профиль пользователя
    if (p.focus < 40 && /pomodoro/i.test(tool.name)) {
      score += 20;
    }
    if (p.selfControl < 40 && /бюджетирование/i.test(tool.name)) {
      score += 25;
    }
    if (p.energy < 40 && /тайм-боксинг/i.test(tool.name)) {
      score += 15;
    }
    if (p.creativity > 60 && /матрица/i.test(tool.name)) {
      score += 10;
    }

    // Приоритет
    if (damageContext.priority === "high" && /матрица/i.test(tool.name)) {
      score += 10;
    }

    return { tool, score };
  });

  const best = scored.sort((a, b) => b.score - a.score)[0];

  // Сохраняем Recommendation
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
      reasonText: buildReason(damageContext, p, best.tool.name)
    },
    update: {
      score: best.score,
      reasonText: buildReason(damageContext, p, best.tool.name)
    }
  });

  return {
    toolId: best.tool.id,
    name: best.tool.name,
    score: best.score,
    reason: buildReason(damageContext, p, best.tool.name)
  };
}

function buildReason(ctx: DamageContext, p: ProfileContext, toolName: string): string {
  if (/бюджетирование/i.test(toolName) && ctx.damageType === "chaos" && p.selfControl < 40) {
    return "Задача хаотичная, а уровень самоконтроля низкий — бюджетирование времени помогает зафиксировать слоты и убрать хаос из календаря.";
  }
  if (/pomodoro/i.test(toolName) && p.focus < 40) {
    return "Низкий фокус — короткие спринты Pomodoro снижают риск отвлечений и дают частую обратную связь по прогрессу.";
  }
  if (/тайм-боксинг/i.test(toolName) && ctx.damageType === "overload") {
    return "При перегрузе по задачам тайм-боксинг помогает ограничить время на каждую активность и снять ощущение бесконечного списка дел.";
  }
  return "Инструмент подобран с учётом типа задачи и вашего профиля продуктивности.";
}

