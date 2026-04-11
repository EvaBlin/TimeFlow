"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Clock3, Pause, Play, SquareCheck, X } from "lucide-react";
import { completeTimerSession, createTimerSession, saveReflectionNote } from "@/app/actions/timerActions";

type TimerMode = "work" | "short_break";

export function PomodoroTimer(props: { taskId: string }): JSX.Element {
  const WORK_SECONDS = 25 * 60;
  const SHORT_BREAK_SECONDS = 5 * 60;

  const [mode, setMode] = useState<TimerMode>("work");
  const [secondsLeft, setSecondsLeft] = useState(WORK_SECONDS);
  const [running, setRunning] = useState(false);

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [workElapsed, setWorkElapsed] = useState(0);
  const [breakElapsed, setBreakElapsed] = useState(0);

  const [showReflection, setShowReflection] = useState(false);
  const [reflectionText, setReflectionText] = useState("");
  const [savingReflection, setSavingReflection] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [taskTitle, setTaskTitle] = useState<string>("Задача");

  useEffect(() => {
    const loadTask = async () => {
      try {
        const res = await fetch(`/api/v1/tasks/${props.taskId}`, { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as { item?: { title?: string } };
        if (data.item?.title) setTaskTitle(data.item.title);
      } catch {
        // noop
      }
    };
    void loadTask();
  }, [props.taskId]);

  const setModeAndReset = (nextMode: TimerMode) => {
    // Чтобы не портить накопленные секунды, режим меняем только когда таймер на паузе.
    if (running) return;
    setMode(nextMode);
    setSecondsLeft(nextMode === "work" ? WORK_SECONDS : SHORT_BREAK_SECONDS);
    setWorkElapsed(0);
    setBreakElapsed(0);
  };

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => {
      setSecondsLeft((s) => s - 1);
    }, 1000);
    return () => clearInterval(t);
  }, [running]);

  // Таймер дошёл до 0
  useEffect(() => {
    if (!running) return;
    if (secondsLeft > 0) return;

    // Запускаем переход в следующий режим / завершение.
    if (mode === "work") {
      setWorkElapsed((prev) => prev + WORK_SECONDS);
      setMode("short_break");
      setSecondsLeft(SHORT_BREAK_SECONDS);
      return;
    }

    // mode === "short_break"
    setRunning(false);

    const finalize = async () => {
      if (!sessionId) {
        // Если пользователь не нажимал "Старт", то сессии нет.
        // В нормальном сценарии создаём её при старте.
        setShowReflection(true);
        return;
      }
      await completeTimerSession({
        sessionId,
        finalMode: "short_break",
        // workElapsed уже накоплен на переходе work -> break
        workSeconds: workElapsed,
        // breakElapsed не содержит финальный отрезок, поэтому добавляем плановое SHORT_BREAK_SECONDS
        breakSeconds: breakElapsed + SHORT_BREAK_SECONDS
      });
      setShowReflection(true);
    };
    void finalize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft, running, mode]);

  const startOrPause = async () => {
    setError(null);
    if (!running) {
      // Старт: создаём TimerSession в БД (привязка к taskId).
      if (!sessionId) {
        try {
          const created = await createTimerSession(props.taskId);
          setSessionId(created.sessionId);
        } catch (e) {
          setError(e instanceof Error ? e.message : "Не удалось создать сессию таймера");
          return;
        }
      }
      setRunning(true);
    } else {
      setRunning(false);
    }
  };

  const resetCurrentMode = () => {
    if (running) return;
    setError(null);
    setSecondsLeft(mode === "work" ? WORK_SECONDS : SHORT_BREAK_SECONDS);
  };

  const finishNow = async () => {
    setError(null);
    setRunning(false);
    try {
      if (sessionId) {
        await completeTimerSession({
          sessionId,
          finalMode: mode,
          workSeconds: workElapsed + (mode === "work" ? WORK_SECONDS - secondsLeft : 0),
          breakSeconds:
            breakElapsed + (mode === "short_break" ? SHORT_BREAK_SECONDS - secondsLeft : 0)
        });
      }
      setShowReflection(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось завершить таймер");
    }
  };

  const formatMMSS = (totalSeconds: number) => {
    const mm = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
    const ss = String(totalSeconds % 60).padStart(2, "0");
    return `${mm}:${ss}`;
  };

  const mmss = formatMMSS(Math.max(0, secondsLeft));

  const saveReflection = async () => {
    setError(null);
    const content = reflectionText.trim();
    if (!content) {
      setError("Введите заметку для рефлексии");
      return;
    }
    if (!sessionId) {
      setError("Сессия таймера не создана");
      return;
    }
    setSavingReflection(true);
    try {
      await saveReflectionNote({ sessionId, content });
      setShowReflection(false);
      setReflectionText("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось сохранить рефлексию");
    } finally {
      setSavingReflection(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex max-w-6xl flex-col px-4 py-10 md:flex-row md:items-start md:gap-8">
        <div className="flex-1">
          <header className="mb-6 space-y-3">
            <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-textMain hover:underline">
              <span aria-hidden>←</span>
              Вернуться на главную
            </Link>
            <div className="flex items-center gap-3">
              <Clock3 className="h-5 w-5 text-textMuted" />
              <h1 className="text-lg font-semibold text-textMain">Pomodoro-таймер</h1>
            </div>
          </header>

          <div className="rounded-2xl border border-slate-200 bg-surface p-6 shadow-card">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setModeAndReset("work")}
                  disabled={running}
                  className={`rounded-xl border px-4 py-2 text-sm ${
                    mode === "work"
                      ? "border-primary/50 bg-primary/10 text-textMain"
                      : "border-slate-200 bg-slate-50 text-textMuted"
                  }`}
                >
                  Работа
                </button>
                <button
                  type="button"
                  onClick={() => setModeAndReset("short_break")}
                  disabled={running}
                  className={`rounded-xl border px-4 py-2 text-sm ${
                    mode === "short_break"
                      ? "border-primary/50 bg-primary/10 text-textMain"
                      : "border-slate-200 bg-slate-50 text-textMuted"
                  }`}
                >
                  Короткий перерыв
                </button>
              </div>
              <div className="text-xs text-textMuted">Связано с задачей: {taskTitle}</div>
            </div>

            <div className="flex flex-col items-center">
              <div className="flex h-48 w-48 items-center justify-center rounded-full bg-zinc-100/30 outline outline-4 outline-offset-[-4px] outline-slate-200">
                <div className="text-4xl font-semibold text-textMain">{mmss}</div>
              </div>
              <div className="mt-5 text-sm text-textMuted">{running ? "В работе" : "Готов к работе"}</div>

              <div className="mt-6 flex gap-4">
                <button
                  type="button"
                  onClick={() => void startOrPause()}
                  className="rounded-xl bg-primary px-6 py-3 text-sm font-medium text-white hover:bg-indigo-500"
                >
                  <span className="inline-flex items-center gap-2">
                    {running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    {running ? "Пауза" : "Старт"}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => void finishNow()}
                  className="rounded-xl border border-slate-200 bg-surface px-6 py-3 text-sm text-textMain hover:bg-slate-50"
                >
                  Завершить
                </button>
                <button
                  type="button"
                  onClick={resetCurrentMode}
                  disabled={running}
                  className="rounded-xl border border-slate-200 bg-surface px-6 py-3 text-sm text-textMain hover:bg-slate-50 disabled:opacity-50"
                >
                  Сброс
                </button>
              </div>
            </div>

            {error && (
              <div className="mt-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700" role="alert">
                {error}
              </div>
            )}

            <div className="mt-10 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-textMuted">
              Режим: {mode === "work" ? "Работа 25 минут" : "Короткий перерыв 5 минут"}.
              После завершения цикла появится окно рефлексии, запись сохранится в историю.
            </div>
          </div>
        </div>
      </div>

      {/* Reflection modal */}
      {showReflection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-surface p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold text-textMain">Рефлексия</h2>
                <p className="mt-1 text-sm text-textMuted">Что получилось? Какие выводы для следующей итерации?</p>
              </div>
              <button type="button" className="text-textMuted hover:text-textMain" onClick={() => setShowReflection(false)} aria-label="Закрыть">
                <X className="h-5 w-5" />
              </button>
            </div>

            <textarea
              className="mt-4 min-h-[140px] w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-primary/60"
              placeholder="Введите заметку..."
              value={reflectionText}
              onChange={(e) => setReflectionText(e.target.value)}
            />

            {error && (
              <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700" role="alert">
                {error}
              </div>
            )}

            <div className="mt-4 flex items-center justify-end gap-3">
              <button
                type="button"
                className="rounded-xl border border-slate-200 bg-surface px-4 py-2 text-sm text-textMain hover:bg-slate-50"
                onClick={() => setShowReflection(false)}
                disabled={savingReflection}
              >
                Позже
              </button>
              <button
                type="button"
                className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60"
                onClick={() => void saveReflection()}
                disabled={savingReflection}
              >
                <span className="inline-flex items-center gap-2">
                  <SquareCheck className="h-4 w-4" />
                  Сохранить
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

