import { DamageCode, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const damageTypes = [
  {
    code: DamageCode.routine,
    name: "Routine",
    description: "Steady, predictable work with low volatility."
  },
  {
    code: DamageCode.overload,
    name: "Overload",
    description: "High-pressure work that risks cognitive overload."
  },
  {
    code: DamageCode.chaos,
    name: "Chaos",
    description: "Unclear, fragmented work with constant interruptions."
  }
] as const;

const tools = [
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

async function main() {
  for (const damageType of damageTypes) {
    await prisma.damageType.upsert({
      where: { code: damageType.code },
      create: {
        code: damageType.code,
        name: damageType.name,
        description: damageType.description,
        isActive: true
      },
      update: {
        name: damageType.name,
        description: damageType.description,
        isActive: true
      }
    });
  }

  for (const tool of tools) {
    await prisma.tool.upsert({
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
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
