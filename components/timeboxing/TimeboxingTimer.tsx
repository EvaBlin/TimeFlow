"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CalendarClock, Pause, Play, RotateCcw, SquareCheck, X } from "lucide-react";
import { completeTimerSession, createTimerSession, saveReflectionNote } from "@/app/actions/timerActions";

type BoxMode = "work" | "short_break";

export function TimeboxingTimer(props: { taskId: string }): JSX.Element {
  const [taskTitle, setTaskTitle] = useState("Задача");
  const [workMinutes, setWorkMinutes] = useState(50);
  const [breakMinutes, setBreakMinutes] = useState(10);
  const [mode, setMode] = useState<BoxMode>("work");
  const [running, setRunning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(workMinutes * 60);

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [workElapsed, setWorkElapsed] = useState(0);
  const [breakElapsed, setBreakElapsed] = useState(0);

  const [showReflection, setShowReflection] = useState(false);
  const [reflectionText, setReflectionText] = useState("");
  const [savingReflection, setSavingReflection] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const workSeconds = useMemo(() => Math.max(5, workMinutes) * 60, [workMinutes]);
  const breakSeconds = useMemo(() => Math.max(1, breakMinutes) * 60, [breakMinutes]);

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

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setSecondsLeft((s) => s - 1);
    }, 1000);
    return () => clearInterval(id);
  }, [running]);

  useEffect(() => {
    if (!running || secondsLeft > 0) return;

    if (mode === "work") {
      setWorkElapsed((prev) => prev + workSeconds);
      setMode("short_break");
      setSecondsLeft(breakSeconds);
      return;
    }

    setBreakElapsed((prev) => prev + breakSeconds);
    setRunning(false);
    void finishSession("short_break");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft, running, mode, workSeconds, breakSeconds]);

  const formatMMSS = (totalSeconds: number) => {
    const mm = String(Math.floor(Math.max(0, totalSeconds) / 60)).padStart(2, "0");
    const ss = String(Math.max(0, totalSeconds) % 60).padStart(2, "0");
    return `${mm}:${ss}`;
  };

  const resetCurrent = () => {
    if (running) return;
    setSecondsLeft(mode === "work" ? workSeconds : breakSeconds);
  };

  const switchMode = (next: BoxMode) => {
    if (running) return;
    setMode(next);
    setSecondsLeft(next === "work" ? workSeconds : breakSeconds);
  };

  const startPause = async () => {
    setError(null);
    if (!running && !sessionId) {
      try {
        const created = await createTimerSession(props.taskId);
        setSessionId(created.sessionId);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Не удалось создать сессию");
        return;
      }
    }
    setRunning((v) => !v);
  };

  const finishSession = async (finalMode: BoxMode = mode) => {
    try {
      if (sessionId) {
        await completeTimerSession({
          sessionId,
          finalMode,
          workSeconds: workElapsed + (finalMode === "work" ? workSeconds - secondsLeft : 0),
          breakSeconds: breakElapsed + (finalMode === "short_break" ? breakSeconds - secondsLeft : 0)
        });
      }
      setShowReflection(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось завершить сессию");
    }
  };

  const saveReflection = async () => {
    if (!sessionId) {
      setShowReflection(false);
      return;
    }
    const text = reflectionText.trim();
    if (!text) {
      setError("Введите заметку");
      return;
    }
    setSavingReflection(true);
    setError(null);
    try {
      await saveReflectionNote({ sessionId, content: text });
      setShowReflection(false);
      setReflectionText("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось сохранить заметку");
    } finally {
      setSavingReflection(false);
    }
  };

  return (
    <main className="min-h-screen bg-background px-4 py-8 md:px-6">
      <div className="mx-auto max-w-4xl">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-textMain hover:underline">
          <span aria-hidden>←</span>
          Вернуться на главную
        </Link>

        <div className="mt-4 rounded-2xl border border-slate-200 bg-surface p-6 shadow-card">
          <div className="flex items-center gap-2">
            <CalendarClock className="h-5 w-5 text-textMuted" />
            <h1 className="text-lg font-semibold text-textMain">Тайм-боксинг</h1>
          </div>
          <p className="mt-1 text-sm text-textMuted">Задача: {taskTitle}</p>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <label className="text-sm text-textMuted">
              Работа, минут
              <input
                type="number"
                min={5}
                value={workMinutes}
                disabled={running}
                onChange={(e) => setWorkMinutes(Math.max(5, Number(e.target.value) || 5))}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-textMain"
              />
            </label>
            <label className="text-sm text-textMuted">
              Перерыв, минут
              <input
                type="number"
                min={1}
                value={breakMinutes}
                disabled={running}
                onChange={(e) => setBreakMinutes(Math.max(1, Number(e.target.value) || 1))}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-textMain"
              />
            </label>
          </div>

          <div className="mt-4 flex items-center gap-2">
            <button
              type="button"
              onClick={() => switchMode("work")}
              disabled={running}
              className={`rounded-xl border px-4 py-2 text-sm ${
                mode === "work" ? "border-primary/50 bg-primary/10 text-textMain" : "border-slate-200 text-textMuted"
              }`}
            >
              Рабочий блок
            </button>
            <button
              type="button"
              onClick={() => switchMode("short_break")}
              disabled={running}
              className={`rounded-xl border px-4 py-2 text-sm ${
                mode === "short_break"
                  ? "border-primary/50 bg-primary/10 text-textMain"
                  : "border-slate-200 text-textMuted"
              }`}
            >
              Перерыв
            </button>
          </div>

          <div className="mt-6 flex flex-col items-center">
            <div className="flex h-44 w-44 items-center justify-center rounded-full border-4 border-slate-200 text-4xl font-semibold text-textMain">
              {formatMMSS(secondsLeft)}
            </div>
            <div className="mt-2 text-sm text-textMuted">{running ? "Таймер запущен" : "Таймер на паузе"}</div>

            <div className="mt-4 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={() => void startPause()}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2 text-sm font-medium text-white"
              >
                {running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                {running ? "Пауза" : "Старт"}
              </button>
              <button
                type="button"
                onClick={resetCurrent}
                disabled={running}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-5 py-2 text-sm"
              >
                <RotateCcw className="h-4 w-4" />
                Сброс
              </button>
              <button
                type="button"
                onClick={() => void finishSession()}
                className="rounded-xl border border-slate-200 px-5 py-2 text-sm"
              >
                Завершить
              </button>
            </div>
          </div>

          {error && <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</div>}
        </div>
      </div>

      {showReflection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-surface p-6 shadow-xl">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-base font-semibold text-textMain">Рефлексия по тайм-боксингу</h2>
                <p className="mt-1 text-sm text-textMuted">Коротко зафиксируйте результат блока.</p>
              </div>
              <button type="button" onClick={() => setShowReflection(false)} className="text-textMuted hover:text-textMain">
                <X className="h-5 w-5" />
              </button>
            </div>
            <textarea
              value={reflectionText}
              onChange={(e) => setReflectionText(e.target.value)}
              className="mt-4 min-h-[120px] w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
              placeholder="Что успели в этом блоке?"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setShowReflection(false)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm">
                Позже
              </button>
              <button
                type="button"
                onClick={() => void saveReflection()}
                disabled={savingReflection}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white"
              >
                <SquareCheck className="h-4 w-4" />
                Сохранить
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

