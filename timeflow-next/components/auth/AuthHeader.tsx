import { signOutAction } from "@/app/actions/authActions";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

export async function AuthHeader(): Promise<JSX.Element | null> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY) {
    return null;
  }

  const supabase = createSupabaseServerClient();
  const {
    data: { session }
  } = await supabase.auth.getSession();

  const userEmail = session?.user?.email;
  if (!session || !userEmail) return null;

  return (
    <div className="border-b border-slate-200 bg-surface/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:px-6">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-slate-100" aria-hidden />
          <div className="leading-tight">
            <div className="text-sm font-medium text-textMain">{userEmail}</div>
            <div className="text-xs text-textMuted">Вход выполнен</div>
          </div>
        </div>

        <form action={signOutAction}>
          <button
            type="submit"
            className="rounded-xl border border-slate-200 bg-surface px-4 py-2 text-sm font-medium text-textMain hover:bg-slate-50"
          >
            Выйти
          </button>
        </form>
      </div>
    </div>
  );
}

