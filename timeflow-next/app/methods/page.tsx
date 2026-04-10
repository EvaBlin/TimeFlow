"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { BookOpen, Search, Sparkles } from "lucide-react";

type MethodItem = {
  id: string;
  name: string;
  description: string;
  instructions: string | null;
  isActive: boolean;
};

export default function MethodsPage(): JSX.Element {
  const [methods, setMethods] = useState<MethodItem[]>([]);
  const [query, setQuery] = useState("");
  const [activeOnly, setActiveOnly] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/v1/methods", { cache: "no-store" });
        if (res.status === 401) {
          window.location.href = "/login";
          return;
        }
        if (!res.ok) throw new Error("Не удалось загрузить библиотеку методов");
        const data = (await res.json()) as { items: MethodItem[] };
        setMethods(data.items ?? []);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Ошибка загрузки");
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return methods.filter((m) => {
      if (activeOnly && !m.isActive) return false;
      if (!q) return true;
      return (
        m.name.toLowerCase().includes(q) ||
        m.description.toLowerCase().includes(q) ||
        (m.instructions ?? "").toLowerCase().includes(q)
      );
    });
  }, [methods, query, activeOnly]);

  return (
    <main className="min-h-screen bg-background px-4 py-8 md:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-4">
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-textMain hover:underline">
            <span aria-hidden>←</span>
            Вернуться на главную
          </Link>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-surface p-4 shadow-card md:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="flex items-center gap-2 text-xl font-semibold text-textMain">
                <BookOpen className="h-5 w-5" />
                Библиотека методов
              </h1>
              <p className="mt-1 text-sm text-textMuted">Подборка техник тайм-менеджмента и инструкции по применению.</p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <label className="relative">
                <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-textMuted" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Поиск метода..."
                  className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm outline-none sm:w-64"
                />
              </label>
              <button
                type="button"
                onClick={() => setActiveOnly((v) => !v)}
                className={`rounded-xl border px-3 py-2 text-sm ${
                  activeOnly ? "border-primary bg-primary/5 text-primary" : "border-slate-200 text-textMain"
                }`}
              >
                {activeOnly ? "Только активные" : "Все методы"}
              </button>
            </div>
          </div>
        </div>

        {error && <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</div>}

        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {loading ? (
            <div className="text-sm text-textMuted">Загрузка библиотеки...</div>
          ) : filtered.length ? (
            filtered.map((method) => (
              <article key={method.id} className="rounded-2xl border border-slate-200 bg-surface p-4 shadow-card">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-base font-semibold text-textMain">{method.name}</h2>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] ${
                      method.isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {method.isActive ? "Активен" : "Неактивен"}
                  </span>
                </div>

                <p className="mt-2 text-sm text-textMuted">{method.description}</p>

                <details className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <summary className="cursor-pointer select-none text-sm font-medium text-textMain">Как применять</summary>
                  <p className="mt-2 whitespace-pre-line text-sm text-textMuted">
                    {method.instructions?.trim() || "Инструкция для этого метода пока не заполнена."}
                  </p>
                </details>

                <div className="mt-3 inline-flex items-center gap-1 text-xs text-textMuted">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Используйте метод на дашборде при выборе инструмента.</span>
                </div>
              </article>
            ))
          ) : (
            <div className="text-sm text-textMuted">Ничего не найдено по текущему фильтру.</div>
          )}
        </div>
      </div>
    </main>
  );
}

