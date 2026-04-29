import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import Link from "next/link";

export default async function ProfilePage(): Promise<JSX.Element> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <main className="min-h-screen bg-background px-4 py-16 text-center">
        <p className="text-sm text-textMuted">Сначала выполните вход.</p>
      </main>
    );
  }

  const profile = await prisma.profile.findUnique({
    where: { userId: user.id }
  });

  const reflections = await prisma.reflectionNote.findMany({
    where: {
      session: {
        userId: user.id
      }
    },
    orderBy: {
      createdAt: "desc"
    },
    take: 10,
    include: {
      session: {
        select: {
          mode: true,
          workSeconds: true,
          breakSeconds: true,
          finishedAt: true,
          task: {
            select: {
              title: true
            }
          }
        }
      }
    }
  });

  const formatDateTime = (value: Date | null) => {
    if (!value) return "Без даты";

    return new Intl.DateTimeFormat("ru-RU", {
      dateStyle: "medium",
      timeStyle: "short"
    }).format(value);
  };

  return (
    <main className="min-h-screen bg-background px-4 py-10 md:px-6">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-surface px-4 py-2 text-sm font-medium text-textMain hover:bg-slate-50"
        >
          <span aria-hidden>←</span>
          Вернуться на главную
        </Link>

        <h1 className="mt-6 text-xl font-semibold text-textMain">Профиль</h1>

        {!profile ? (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-surface p-6 text-sm text-textMuted text-center">
            Профиль не найден. Пройдите опрос в онбординге.
          </div>
        ) : (
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {[
              ["Уровень фокуса", profile.focus],
              ["Уровень энергии", profile.energy],
              ["Самоконтроль", profile.selfControl],
              ["Креативность", profile.creativity]
            ].map(([label, value]) => {
              const score = Number(value)

              return (
                <div key={String(label)} className="rounded-2xl border border-slate-200 bg-surface p-5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-textMuted">{String(label)}</span>
                    <span className="font-medium text-textMain">{score}/10</span>
                  </div>
                  <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div className="h-2 rounded-full bg-neutral-800" style={{ width: `${score * 10}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <section className="mt-8 rounded-2xl border border-slate-200 bg-surface p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-textMain">Рефлексия по сессиям</h2>
              <p className="mt-1 text-sm text-textMuted">Сохраняем заметки из Pomodoro и тайм-боксинга прямо в профиль.</p>
            </div>
            <div className="text-xs text-textMuted">{reflections.length} записей</div>
          </div>

          {!reflections.length ? (
            <div className="mt-5 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-textMuted">
              Пока нет сохраненных заметок. Завершите таймер и добавьте рефлексию.
            </div>
          ) : (
            <div className="mt-5 space-y-4">
              {reflections.map((note) => (
                <article key={note.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="text-sm font-medium text-textMain">{note.session.task.title}</div>
                    <div className="text-xs text-textMuted">{formatDateTime(note.session.finishedAt ?? note.createdAt)}</div>
                  </div>
                  <div className="mt-2 text-xs uppercase tracking-[0.14em] text-textMuted">
                    {note.session.mode === "work" ? "Pomodoro" : "Перерыв"} · {Math.round(note.session.workSeconds / 60)} мин работы ·{" "}
                    {Math.round(note.session.breakSeconds / 60)} мин отдыха
                  </div>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-textMain">{note.content}</p>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
