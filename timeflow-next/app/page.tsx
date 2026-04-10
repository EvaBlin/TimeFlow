import Link from "next/link";

export default function LandingPage(): JSX.Element {
  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-slate-200 bg-surface/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-xl bg-primary/90" />
            <span className="text-sm font-semibold tracking-tight text-textMain">TimeFlow</span>
          </div>
          <nav className="hidden items-center gap-8 text-sm text-textMuted md:flex">
            <a href="#features" className="hover:text-textMain">
              О сервисе
            </a>
            <a href="#how" className="hover:text-textMain">
              Как работает
            </a>
            <Link href="/login" className="hover:text-textMain">
              Войти
            </Link>
          </nav>
          <Link
            href="/register"
            className="rounded-xl bg-primary px-4 py-2 text-xs font-medium text-white shadow-sm hover:bg-indigo-500 md:px-5 md:text-sm"
          >
            Попробовать бесплатно
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 pb-16 pt-8 md:px-6">
        {/* Hero */}
        <section className="grid gap-10 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] md:items-center">
          <div className="space-y-6">
            <h1 className="text-3xl font-semibold tracking-tight text-textMain md:text-4xl">
              Персональный тайм‑менеджмент
              <br />
              для ваших задач
            </h1>
            <p className="max-w-xl text-sm leading-relaxed text-textMuted md:text-base">
              TimeFlow помогает превращать хаос задач в понятный план: профиль продуктивности, умные рекомендации
              и инструменты вроде Pomodoro, тайм‑боксинга и матрицы Эйзенхауэра.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <Link
                href="/auth"
                className="rounded-xl bg-primary px-6 py-3 text-sm font-medium text-white shadow-sm hover:bg-indigo-500"
              >
              Попробовать бесплатно
              </Link>
              <span className="text-xs text-textMuted md:text-sm">Онбординг меньше 2 минут, без банковской карты.</span>
            </div>
          </div>
          <div className="flex h-64 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 shadow-card">
            <div className="h-[70%] w-[90%] rounded-xl border border-slate-200 bg-surface shadow-card" />
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="mt-16 space-y-8">
          <div className="text-center">
            <h2 className="text-lg font-semibold text-textMain">Как это работает</h2>
            <p className="mt-2 text-sm text-textMuted">
              Три шага от хаоса до понятного плана: профиль → задачи → рекомендация инструмента.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-surface p-4 text-sm shadow-card">
              <div className="mb-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                1
              </div>
              <h3 className="text-sm font-semibold text-textMain">Профиль</h3>
              <p className="mt-2 text-xs text-textMuted">
                Ответьте на короткий опрос, чтобы мы оценили ваш фокус, энергию, самоконтроль и креативность.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-surface p-4 text-sm shadow-card">
              <div className="mb-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                2
              </div>
              <h3 className="text-sm font-semibold text-textMain">Задачи</h3>
              <p className="mt-2 text-xs text-textMuted">
                Создайте задачи, отметьте приоритет, срок и тип «урона»: рутина, перегруз или хаос.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-surface p-4 text-sm shadow-card">
              <div className="mb-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                3
              </div>
              <h3 className="text-sm font-semibold text-textMain">Рекомендация</h3>
              <p className="mt-2 text-xs text-textMuted">
                Алгоритм сопоставляет задачу с вашим профилем и предлагает подходящий инструмент тайм‑менеджмента.
              </p>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="mt-16 space-y-6">
          <h2 className="text-lg font-semibold text-textMain">Возможности сервиса</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-surface p-4 text-sm shadow-card">
              <div className="h-8 w-8 rounded-xl bg-slate-100" />
              <h3 className="mt-4 text-sm font-semibold text-textMain">Персональные рекомендации</h3>
              <p className="mt-2 text-xs text-textMuted">Методы, подобранные под ваши задачи и психотип.</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-surface p-4 text-sm shadow-card">
              <div className="h-8 w-8 rounded-xl bg-slate-100" />
              <h3 className="mt-4 text-sm font-semibold text-textMain">Управление задачами</h3>
              <p className="mt-2 text-xs text-textMuted">Список задач с приоритетами, сроками и типом «урона».</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-surface p-4 text-sm shadow-card">
              <div className="h-8 w-8 rounded-xl bg-slate-100" />
              <h3 className="mt-4 text-sm font-semibold text-textMain">Инструменты продуктивности</h3>
              <p className="mt-2 text-xs text-textMuted">Pomodoro, тайм‑боксинг, бюджетирование времени и другие.</p>
            </div>
          </div>
        </section>

        {/* CTA footer */}
        <section className="mt-16 rounded-2xl border border-slate-200 bg-slate-50 px-6 py-8 text-center shadow-card">
          <h2 className="text-lg font-semibold text-textMain">Попробуйте TimeFlow бесплатно</h2>
          <p className="mt-2 text-sm text-textMuted">Начните управлять временем осознаннее уже сегодня.</p>
          <Link
            href="/register"
            className="mt-5 inline-flex rounded-xl bg-primary px-8 py-3 text-sm font-medium text-white hover:bg-indigo-500"
          >
            Создать аккаунт
          </Link>
        </section>
      </div>
    </main>
  );
}

