"use client";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { CalendarDays, CheckSquare2, Flame, Plus, Sparkles, Trash2, Wand2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type DamageType = "routine" | "overload" | "chaos";
type TaskPriority = "low" | "medium" | "high";
type TaskStatus = "todo" | "in_progress" | "done" | "archived";

type TaskItem = {
  id: string;
  title: string;
  description: string | null;
  deadline: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  damageType: DamageType;
};

type Recommendation = {
  toolId: string;
  name: string;
  score: number;
  reason: string;
};

type CreateTaskForm = {
  title: string;
  description: string;
  priority: TaskPriority;
  damageType: DamageType;
  deadline: string;
};

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

function priorityLabel(priority: TaskPriority): string {
  if (priority === "high") return "Высокий";
  if (priority === "medium") return "Средний";
  return "Низкий";
}

function formatWhen(deadline: string | null): string {
  if (!deadline) return "Без срока";
  const date = new Date(deadline);
  if (Number.isNaN(date.getTime())) return "Без срока";
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

export function DashboardShell(): JSX.Element {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRecommendationModal, setShowRecommendationModal] = useState(false);
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [recommendationLoading, setRecommendationLoading] = useState(false);
  const [createForm, setCreateForm] = useState<CreateTaskForm>({
    title: "",
    description: "",
    priority: "medium",
    damageType: "routine",
    deadline: ""
  });

  const active = useMemo(() => {
    if (!tasks.length) return null;
    return tasks.find((t) => t.id === selectedTaskId) ?? tasks[0];
  }, [selectedTaskId, tasks]);

  async function loadTasks(): Promise<void> {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/tasks", { cache: "no-store" });
      if (res.status === 401) {
        window.location.href = "/login";
        return;
      }
      if (!res.ok) throw new Error("Не удалось загрузить задачи");
      const data = (await res.json()) as { items: TaskItem[] };
      setTasks(data.items ?? []);
      if (!selectedTaskId && data.items?.length) setSelectedTaskId(data.items[0].id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка загрузки");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadTasks();
  }, []);

  async function createTask(): Promise<void> {
    if (!createForm.title.trim()) return;
    setError(null);
    const res = await fetch("/api/v1/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: createForm.title,
        description: createForm.description || undefined,
        priority: createForm.priority,
        damageType: createForm.damageType,
        deadline: createForm.deadline || null
      })
    });
    if (!res.ok) {
      const data = (await res.json()) as { error?: string };
      setError(data.error ?? "Не удалось создать задачу");
      return;
    }
    setShowCreateModal(false);
    setCreateForm({
      title: "",
      description: "",
      priority: "medium",
      damageType: "routine",
      deadline: ""
    });
    await loadTasks();
  }

  async function completeTask(task: TaskItem): Promise<void> {
    const nextStatus: TaskStatus = task.status === "done" ? "todo" : "done";
    await updateTaskStatus(task.id, nextStatus);
  }

  async function updateTaskStatus(taskId: string, status: TaskStatus): Promise<void> {
    const prev = tasks;
    setTasks((items) => items.map((item) => (item.id === taskId ? { ...item, status } : item)));
    const res = await fetch(`/api/v1/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    });
    if (!res.ok) {
      setTasks(prev);
      const data = (await res.json()) as { error?: string };
      setError(data.error ?? "Не удалось обновить статус");
      return;
    }
    await loadTasks();
  }

  async function deleteTask(taskId: string): Promise<void> {
    await fetch(`/api/v1/tasks/${taskId}`, { method: "DELETE" });
    if (selectedTaskId === taskId) setSelectedTaskId(null);
    await loadTasks();
  }

  async function pickRecommendation(taskId: string): Promise<void> {
    setRecommendationLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/tasks/${taskId}/recommendation`, { method: "POST" });
      const data = (await res.json()) as { item?: Recommendation; error?: string };
      if (!res.ok || !data.item) {
        throw new Error(data.error ?? "Не удалось подобрать инструмент");
      }
      setRecommendation(data.item);
      setShowRecommendationModal(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка подбора");
    } finally {
      setRecommendationLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-60 flex-col border-r border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-600 md:flex">
        <div className="mb-6 h-8 w-24 rounded-xl bg-slate-200" />
        <nav className="space-y-1">
          <button className="flex w-full items-center gap-2 rounded-xl bg-surface px-3 py-2 text-left font-medium text-textMain shadow-card">
            <CheckSquare2 className="h-4 w-4" />
            <span>Задачи</span>
          </button>
          <Link href="/methods" className="flex items-center gap-2 rounded-xl px-3 py-2 hover:bg-slate-100">
            <Sparkles className="h-4 w-4" />
            <span>Библиотека методов</span>
          </Link>
          <Link href="/profile" className="flex items-center gap-2 rounded-xl px-3 py-2 hover:bg-slate-100">
            <Flame className="h-4 w-4" />
            <span>Профиль</span>
          </Link>
        </nav>
      </aside>

      <div className="flex-1">
        <header className="flex h-16 items-center justify-between border-b border-slate-200 px-4 md:px-6">
          <div className="flex items-center gap-3">
            <h1 className="text-base font-semibold text-textMain">Дашборд задач</h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-3 py-2 text-sm font-medium text-white"
            >
              <Plus className="h-4 w-4" />
              Новая задача
            </button>
          </div>
        </header>

        <div className="flex h-12 items-center justify-between border-b border-slate-200 px-4 md:px-6">
          <div className="text-sm text-textMuted">Всего задач: {tasks.length}</div>
          <button type="button" onClick={() => void loadTasks()} className="text-sm text-textMain underline">
            Обновить
          </button>
        </div>

        <div className="grid gap-4 px-4 py-4 md:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] md:px-6">
          <div className="space-y-2">
            {loading && <div className="text-sm text-textMuted">Загрузка задач...</div>}
            {!loading && !tasks.length && <div className="text-sm text-textMuted">Пока нет задач. Создайте первую.</div>}
            {tasks.map((task) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.15, delay: 0.03 }}
                className={`flex w-full items-center gap-4 rounded-xl border bg-surface px-4 py-3 text-left text-sm shadow-card ${
                  active?.id === task.id ? "border-primary/60 ring-1 ring-primary/20" : "border-slate-200"
                }`}
              >
                <button
                  type="button"
                  onClick={() => void completeTask(task)}
                  className={`h-5 w-5 rounded border-2 ${
                    task.status === "done" ? "border-emerald-600 bg-emerald-600" : "border-slate-300"
                  }`}
                  title={task.status === "done" ? "Снять отметку выполнения" : "Отметить выполненной"}
                />
                <button type="button" onClick={() => setSelectedTaskId(task.id)} className="min-w-0 flex-1 text-left">
                  <div className="truncate text-sm font-medium text-textMain">{task.title}</div>
                  <div className="flex items-center gap-2 text-xs text-textMuted">
                    <CalendarDays className="h-3 w-3" />
                    <span>{formatWhen(task.deadline)}</span>
                  </div>
                </button>
                <div className="flex flex-col items-end gap-1">
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-medium uppercase tracking-wide text-textMain">
                    {priorityLabel(task.priority)}
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
                <button
                  type="button"
                  onClick={() => void deleteTask(task.id)}
                  className="rounded-lg p-1 text-slate-500 hover:bg-slate-100"
                  title="Удалить задачу"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </motion.div>
            ))}
          </div>

          <div className="space-y-3">
            <div className="rounded-2xl border border-slate-200 bg-surface p-4 shadow-card">
              <div className="mb-2 flex items-center justify-between gap-2">
                <h2 className="text-sm font-semibold text-textMain">Рекомендовано сейчас</h2>
                <span className="text-xs text-textMuted">для задачи</span>
              </div>
              <p className="text-sm font-medium text-textMain">{active?.title ?? "Выберите задачу"}</p>
              <p className="mt-1 text-xs text-textMuted">
                {active ? `${damageLabel(active.damageType)} · ${formatWhen(active.deadline)}` : "—"}
              </p>

              <button
                type="button"
                disabled={!active || recommendationLoading}
                onClick={() => active && void pickRecommendation(active.id)}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
              >
                <Wand2 className="h-4 w-4" />
                {recommendationLoading ? "Подбираем..." : "Подобрать инструмент"}
              </button>

              {active && (
                <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <Link
                    href={`/tools/pomodoro/${active.id}`}
                    className="inline-flex w-full items-center justify-center rounded-xl border border-slate-200 bg-surface px-4 py-2 text-sm font-medium text-textMain hover:bg-slate-50"
                  >
                    Открыть Pomodoro
                  </Link>
                  <Link
                    href={`/tools/timeboxing/${active.id}`}
                    className="inline-flex w-full items-center justify-center rounded-xl border border-slate-200 bg-surface px-4 py-2 text-sm font-medium text-textMain hover:bg-slate-50"
                  >
                    Открыть Тайм-боксинг
                  </Link>
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs text-textMuted">
              <div className="mb-1 flex items-center gap-2 text-[11px] font-medium uppercase tracking-wide text-slate-500">
                <Flame className="h-3 w-3" />
                Фокус дня
              </div>
              <p>Сделайте один большой шаг по ключевой задаче, прежде чем отвлечься на рутину.</p>
            </div>
            {error && <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</div>}
          </div>
        </div>

        <nav className="fixed bottom-0 left-0 right-0 flex items-center justify-around border-t border-slate-200 bg-surface py-2 text-xs text-slate-600 md:hidden">
          <button type="button" className="flex flex-col items-center gap-1 text-textMain">
            <CheckSquare2 className="h-4 w-4" />
            <span>Задачи</span>
          </button>
          <Link href="/methods" className="flex flex-col items-center gap-1">
            <Sparkles className="h-4 w-4" />
            <span>Методы</span>
          </Link>
          <Link href="/profile" className="flex flex-col items-center gap-1">
            <Flame className="h-4 w-4" />
            <span>Профиль</span>
          </Link>
        </nav>

        <AnimatePresence>
          {showRecommendationModal && recommendation && (
            <motion.div
              onClick={() => setShowRecommendationModal(false)}
              className="fixed inset-0 z-40 flex items-center justify-center bg-black/40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                onClick={(e) => e.stopPropagation()}
                initial={{ y: 12, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 12, opacity: 0 }}
                className="w-full max-w-sm rounded-2xl border border-slate-200 bg-surface p-4 shadow-xl"
              >
                <div className="text-sm text-textMuted">Рекомендуемый инструмент</div>
                <h3 className="mt-1 text-lg font-semibold text-textMain">{recommendation.name}</h3>
                <p className="mt-3 text-sm text-textMuted">{recommendation.reason}</p>

                <div className="mt-4 flex items-center gap-2">
                  {active && /pomodoro/i.test(recommendation.name) && (
                    <Link
                      href={`/tools/pomodoro/${active.id}`}
                      className="inline-flex flex-1 items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white"
                    >
                      Запустить Pomodoro
                    </Link>
                  )}
                  {active && /тайм-бокс/i.test(recommendation.name.toLowerCase()) && (
                    <Link
                      href={`/tools/timeboxing/${active.id}`}
                      className="inline-flex flex-1 items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white"
                    >
                      Запустить Тайм-боксинг
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowRecommendationModal(false)}
                    className="inline-flex flex-1 items-center justify-center rounded-xl border border-slate-200 px-4 py-2 text-sm"
                  >
                    Закрыть
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}

          {showCreateModal && (
            <motion.div
              onClick={() => setShowCreateModal(false)}
              className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                onClick={(e) => e.stopPropagation()}
                initial={{ y: 12, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 12, opacity: 0 }}
                className="w-full max-w-lg rounded-2xl border border-slate-200 bg-surface p-5 shadow-xl"
              >
                <h3 className="text-lg font-semibold text-textMain">Новая задача</h3>
                <div className="mt-4 space-y-3">
                  <input
                    value={createForm.title}
                    onChange={(e) => setCreateForm((s) => ({ ...s, title: e.target.value }))}
                    placeholder="Название задачи"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  />
                  <textarea
                    value={createForm.description}
                    onChange={(e) => setCreateForm((s) => ({ ...s, description: e.target.value }))}
                    placeholder="Описание (опционально)"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  />
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                    <select
                      value={createForm.priority}
                      onChange={(e) => setCreateForm((s) => ({ ...s, priority: e.target.value as TaskPriority }))}
                      className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                    >
                      <option value="low">Низкий</option>
                      <option value="medium">Средний</option>
                      <option value="high">Высокий</option>
                    </select>
                    <select
                      value={createForm.damageType}
                      onChange={(e) => setCreateForm((s) => ({ ...s, damageType: e.target.value as DamageType }))}
                      className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                    >
                      <option value="routine">Рутина</option>
                      <option value="overload">Перегруз</option>
                      <option value="chaos">Хаос</option>
                    </select>
                    <input
                      type="datetime-local"
                      value={createForm.deadline}
                      onChange={(e) => setCreateForm((s) => ({ ...s, deadline: e.target.value }))}
                      className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                    />
                  </div>
                </div>
                <div className="mt-5 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => void createTask()}
                    className="inline-flex flex-1 items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white"
                  >
                    Создать
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="inline-flex flex-1 items-center justify-center rounded-xl border border-slate-200 px-4 py-2 text-sm"
                  >
                    Отмена
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

