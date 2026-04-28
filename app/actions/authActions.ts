"use server";

import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { ensureAppUser } from "@/lib/appBootstrap";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { createTwentyLead } from "@/lib/twenty";

export async function loginAction(formData: FormData): Promise<void> {
  try {
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    if (!email || !password) {
      redirect(`/login?error=${encodeURIComponent("Введите email и пароль")}`);
    }

    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.user) {
      redirect(`/login?error=${encodeURIComponent(error?.message ?? "Не удалось выполнить вход")}`);
    }

    await ensureAppUser(data.user);
    redirect("/dashboard");
  } catch (error) {
    if (isRedirectError(error)) throw error;
    redirect(`/login?error=${encodeURIComponent("Сервис временно недоступен. Попробуйте еще раз.")}`);
  }

}

export async function registerAction(formData: FormData): Promise<void> {
  try {
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    if (!email || !password) {
      redirect(`/register?error=${encodeURIComponent("Введите email и пароль")}`);
    }

    const supabase = await createSupabaseServerClient();
    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://time-flow-fgzm.vercel.app");

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${siteUrl}/api/auth/callback`
      }
    });

    if (error) {
      redirect(`/register?error=${encodeURIComponent(error.message)}`);
    }

    if (data.user) {
      await ensureAppUser(data.user);
      
      try {
        await createTwentyLead({
          email: { primaryEmail: email },
          name: email.split("@")[0]
        });
      } catch (crmError) {
        console.error("Ошибка при создании лида в CRM:", crmError);
      }
    }

    redirect("/dashboard");
  } catch (error) {
    if (isRedirectError(error)) throw error;
    redirect(`/register?error=${encodeURIComponent("Сервис временно недоступен. Попробуйте еще раз.")}`);
  }
}

export async function signOutAction(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/");
}
