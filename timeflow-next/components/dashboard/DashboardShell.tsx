"use client";

import { motion, AnimatePresence } from "framer-motion";
import { CalendarDays, CheckSquare2, Flame, Menu, Sparkles, Wand2 } from "lucide-react";
import { useState } from "react";

type DamageType = "routine" | "overload" | "chaos";

type Task = {
  id: string;
  title: string;
  when: string;
  priority: "Высокий" | "Средний" | "Низкий";
  damageType: DamageType;
};

const MOCK_TASKS: Task[] = [
  {
    id: "1",
    title: "Подготовить презентацию",
    when: "Сегодня, 18:00",
    priority: "Высокий",
    damageType: "chaos"
  },
  {
    id: "2",
    title: "Отправить отчёт",
    when: "Завтра, 12:00",
    priority: "Средний",
    damageType: "overload"
  },
  {
    id: "3",
    title: "Провести встречу с командой",
    when: "Среда, 10:00",
    priority: "Высокий",
    damageType: "overload"
  },
  {
    id: "4",
    title: "Ответить на письма",
    when: "Сегодня, 20:00",
    priority: "Низкий",
    damageType: "routine"
  }
];

function damageLabel(d: DamageType): string {
  if (d === "routine") return "Рутина";
  if (d === "overload") return "Перегруз";
  return "Хаос";
}

function damageColor(d: DamageType): string {
  if (d === "routine") return "bg-slate-100 text-slate-700";
  if (d === "overload") return "bg-amber-50 text-amber-700 border border-amber-200";
  return "bg-rose-50 text-rose-700 border border-rose-200";
}

export function DashboardShell(): JSX.Element {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const active = selectedTask ?? MOCK_TASKS[0];

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar (desktop) */}
      <aside className="hidden w-60 flex-col border-r border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-600 md:flex">
        <div className="mb-6 h-8 w-24 rounded-xl bg-slate-200" />
        <nav className="space-y-1">
          {["Задачи", "Библиотека методов", "Статистика", "Настройки"].map((item, idx) => (
            <button
              key={item}
              className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left ${
                idx === 0 ? "bg-surface font-medium text-textMain shadow-card" : "hover:bg-slate-100"
              }`}
              type="button"
            >
              {idx === 0 && <CheckSquare2 className="h-4 w-4" />}
              {idx === 1 && <Sparkles className="h-4 w-4" />}
              {idx === 2 && <Flame className="h-4 w-4" />}
              {idx === 3 && <CalendarDays className="h-4 w-4" />}
              <span>{item}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* Main */}
      <div className="flex-1">
        <header className="flex h-16 items-center justify-between border-b border-slate-200 px-4 md:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-surface text-slate-600 md:hidden"
              onClick={() => setSidebarOpen((v) => !v)}
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="hidden h-9 w-40 rounded-xl bg-slate-100 md:block" />
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-500 sm:flex sm:items-center sm:gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
              <span>Сегодня: 2 задачи выполнено</span>
            </div>
            <button className="h-9 w-9 rounded-full bg-slate-100" type="button" />
          </div>
        </header>

        {/* Filters */}
        <div className="flex h-12 items-center justify-between border-b border-slate-200 px-4 md:px-6">
          <div className="inline-flex rounded-xl border border-slate-200 text-xs sm:text-sm">
            <button className="rounded-l-xl bg-textMain px-3 py-1.5 text-white sm:px-4">Сегодня</button>
            <button className="px-3 py-1.5 text-textMuted sm:px-4">Неделя</button>
            <button className="rounded-r-xl px-3 py-1.5 text-textMuted sm:px-4">Все</button>
          </div>
          <div className="hidden items-center gap-2 text-xs text-textMuted sm:flex">
            <span>Сортировка:</span>
            <div className="h-8 w-24 rounded-xl bg-slate-100" />
          </div>
        </div>

        {/* Content */}
        <div className="grid gap-4 px-4 py-4 md:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] md:px-6">
          {/* Task list */}
          <div className="space-y-2">
            {MOCK_TASKS.map((task) => (
              <motion.button
                key={task.id}
                type="button"
                onClick={() => setSelectedTask(task)}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.15, delay: 0.03 }}
                className={`flex w-full items-center gap-4 rounded-xl border bg-surface px-4 py-3 text-left text-sm shadow-card ${
                  active.id === task.id ? "border-primary/60 ring-1 ring-primary/20" : "border-slate-200"
                }`}
              >
                <span className="h-5 w-5 rounded border-2 border-slate-300" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-textMain">{task.title}</div>
                  <div className="flex items-center gap-2 text-xs text-textMuted">
                    <CalendarDays className="h-3 w-3" />
                    <span>{task.when}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-medium uppercase tracking-wide text-textMain">
                    {task.priority}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] ${damageColor(
                      task.damageType
                    )}`}
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-current" />
                    {damageLabel(task.damageType)}
                  </span>
                </div>
              </motion.button>
            ))}
          </div>

          {/* Recommendation panel */}
          <div className="space-y-3">
            <div className="rounded-2xl border border-slate-200 bg-surface p-4 shadow-card">
              <div className="mb-2 flex items-center justify-between gap-2">
                <h2 className="text-sm font-semibold text-textMain">Рекомендовано сейчас</h2>
                <span className="text-xs text-textMuted">для задачи</span>
              </div>
              <p className="text-sm font-medium text-textMain">{active.title}</p>
              <p className="mt-1 text-xs text-textMuted">{damageLabel(active.damageType)} · {active.when}</p>

              <button
                type="button"
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
              >
                <Wand2 className="h-4 w-4" />
                Подобрать инструмент
              </button>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs text-textMuted">
              <div className="mb-1 flex items-center gap-2 text-[11px] font-medium uppercase tracking-wide text-slate-500">
                <Flame className="h-3 w-3" />
                Фокус дня
              </div>
              <p>Сделайте один большой шаг по ключевой задаче, прежде чем отвлечься на рутину.</p>
            </div>
          </div>
        </div>

        {/* Bottom bar on mobile (instead of sidebar) */}
        <nav className="fixed bottom-0 left-0 right-0 flex items-center justify-around border-t border-slate-200 bg-surface py-2 text-xs text-slate-600 md:hidden">
          <button type="button" className="flex flex-col items-center gap-1 text-textMain">
            <CheckSquare2 className="h-4 w-4" />
            <span>Задачи</span>
          </button>
          <button type="button" className="flex flex-col items-center gap-1">
            <Sparkles className="h-4 w-4" />
            <span>Методы</span>
          </button>
          <button type="button" className="flex flex-col items-center gap-1">
            <Flame className="h-4 w-4" />
            <span>Статистика</span>
          </button>
        </nav>

        {/* Simple recommendation modal placeholder */}
        <AnimatePresence>
          {false && (
            <motion.div
              className="fixed inset-0 z-40 flex items-center justify-center bg-black/40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                initial={{ y: 12, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 12, opacity: 0 }}
                className="w-full max-w-sm rounded-2xl border border-slate-200 bg-surface p-4 shadow-xl"
              >
                {/* Тут можно будет отрендерить данные getRecommendation */}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

