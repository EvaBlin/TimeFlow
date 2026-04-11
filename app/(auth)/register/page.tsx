import { registerAction } from "@/app/actions/authActions";

export default function RegisterPage(props: { searchParams?: { error?: string } }): JSX.Element {
  const error = props.searchParams?.error;

  return (
    <div className="min-h-screen bg-background py-10">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mx-auto w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-surface shadow-card">
          <div className="grid grid-cols-2">
            <div className="rounded-tl-2xl bg-primary px-4 py-3 text-center text-sm font-medium text-white">
              Регистрация
            </div>
            <div className="rounded-tr-2xl bg-surface px-4 py-3 text-center text-sm text-textMuted">Вход</div>
          </div>

          <div className="space-y-5 px-8 py-8">
            <form action={registerAction}>
              <label className="flex flex-col gap-1 text-sm text-textMuted">
                Email
                <input
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 outline-none"
                />
              </label>

              <label className="mt-4 flex flex-col gap-1 text-sm text-textMuted">
                Пароль
                <input
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 outline-none"
                />
              </label>

              {error && (
                <p className="mt-4 text-sm text-rose-600" role="alert">
                  {error}
                </p>
              )}

              <button
                type="submit"
                className="mt-4 w-full rounded-xl bg-primary py-2.5 text-sm font-medium text-white hover:bg-indigo-500"
              >
                Создать аккаунт
              </button>
            </form>

            <div className="pt-1 text-center text-sm text-textMuted">
              Уже есть аккаунт?{" "}
              <a href="/login" className="font-medium text-textMain underline">
                Войти
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

