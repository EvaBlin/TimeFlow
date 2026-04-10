import { createServerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export function createSupabaseServerClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

  // Если ключей нет, выведем в консоль терминала инфу, но не будем крашить процесс сразу
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("⚠️ [Supabase] Ключи не найдены в process.env!");
  }

  const cookieStore = cookies();

  const cookieMethods = {
    getAll: () => {
      const all = (cookieStore as any).getAll?.() ?? [];
      return all.map((c: { name: string; value: string }) => ({ name: c.name, value: c.value }));
    },
    setAll: (items: { name: string; value: string; options?: any }[]) => {
      try {
        for (const item of items) {
          (cookieStore as any).set(item.name, item.value, item.options);
        }
      } catch (error) {
        // Это нормально для серверных компонентов, где нельзя менять куки
      }
    }
  };

  return createServerClient(
    supabaseUrl || "", 
    supabaseAnonKey || "", 
    { cookies: cookieMethods as any }
  );
}