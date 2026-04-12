import type { User as SupabaseUser } from "@supabase/supabase-js";
import { prisma } from "@/lib/prisma";

const DEFAULT_TOOLS = [
  {
    name: "Pomodoro",
    description: "Короткие фокус-сессии с регулярными перерывами для удержания внимания.",
    instructions: "Работайте 25 минут, затем делайте 5 минут перерыва. После 4 циклов сделайте длинный перерыв."
  },
  {
    name: "Тайм-боксинг",
    description: "Жесткое ограничение времени на задачу, чтобы снизить перегруз и сохранить темп.",
    instructions: "Выделите фиксированный слот в календаре, определите ожидаемый результат и завершите работу по таймеру."
  },
  {
    name: "Бюджетирование времени",
    description: "Планирование времени по слотам для возврата контроля над хаотичным днем.",
    instructions: "Разбейте день на временные блоки, назначьте блок каждой задаче и не допускайте наложений."
  },
  {
    name: "Матрица Эйзенхауэра",
    description: "Приоритизация задач по важности и срочности перед выполнением.",
    instructions: "Разделите задачи на 4 квадранта: важно/срочно, важно/не срочно, не важно/срочно, не важно/не срочно."
  }
] as const;

export async function ensureAppUser(user: SupabaseUser) {
  const email = user.email ?? `${user.id}@users.local`;

  return prisma.user.upsert({
    where: { id: user.id },
    create: {
      id: user.id,
      email,
      fullName: user.user_metadata?.full_name ?? null,
      avatarUrl: user.user_metadata?.avatar_url ?? null
    },
    update: {
      email,
      fullName: user.user_metadata?.full_name ?? undefined,
      avatarUrl: user.user_metadata?.avatar_url ?? undefined
    }
  });
}

export async function ensureDefaultTools() {
  await prisma.$transaction(
    DEFAULT_TOOLS.map((tool) =>
      prisma.tool.upsert({
        where: { name: tool.name },
        create: {
          name: tool.name,
          description: tool.description,
          instructions: tool.instructions,
          isActive: true
        },
        update: {
          description: tool.description,
          instructions: tool.instructions,
          isActive: true
        }
      })
    )
  );
}
