import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

export default async function ProfilePage(): Promise<JSX.Element> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY) {
    return (
      <main className="min-h-screen bg-background px-4 py-16">
        <p className="text-center text-sm text-textMuted">Настройте Supabase env переменные.</p>
      </main>
    );
  }

  const supabase = createSupabaseServerClient();
  const {
    data: { session }
  } = await supabase.auth.getSession();

  const userId = session?.user?.id;
  if (!userId) {
    return (
      <main className="min-h-screen bg-background px-4 py-16">
        <p className="text-center text-sm text-textMuted">Сначала выполните вход.</p>
      </main>
    );
  }

  const profile = await prisma.profile.findUnique({
    where: { userId }
  });

  return (
    <main className="min-h-screen bg-background px-4 py-10 md:px-6">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-xl font-semibold text-textMain">Профиль</h1>

        {!profile ? (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-surface p-6 text-sm text-textMuted">
            Профиль не найден. Пройдите опрос в онбординге.
          </div>
        ) : (
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {[
              ["Уровень фокуса", profile.focus],
              ["Уровень энергии", profile.energy],
              ["Самоконтроль", profile.selfControl],
              ["Креативность", profile.creativity]
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-slate-200 bg-surface p-5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-textMuted">{label}</span>
                  <span className="font-medium text-textMain">{value as number}%</span>
                </div>
                <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div className="h-2 rounded-full bg-neutral-800" style={{ width: `${value}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 rounded-2xl border border-slate-200 bg-surface p-6 text-sm text-textMuted">
          Здесь в следующих итерациях подключим список задач, результаты и рекомендуемые инструменты.
        </div>
      </div>
    </main>
  );
}

