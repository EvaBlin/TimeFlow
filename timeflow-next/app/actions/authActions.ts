"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

export async function loginAction(formData: FormData): Promise<void> {
  try {
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    if (!email || !password) {
      redirect(`/login?error=${encodeURIComponent("Введите email и пароль")}`);
    }

    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.session) {
      redirect(`/login?error=${encodeURIComponent(error?.message ?? "Не удалось выполнить вход")}`);
    }

    redirect("/dashboard");
  } catch {
    redirect(`/login?error=${encodeURIComponent("Сервис временно недоступен. Попробуйте еще раз.")}`);
  }
}

export async function registerAction(
  formData: FormData
): Promise<void> {
  try {
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    if (!email || !password) {
      redirect(`/register?error=${encodeURIComponent("Введите email и пароль")}`);
    }

    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
      redirect(`/register?error=${encodeURIComponent(error.message)}`);
    }

    const userId = data.user?.id;
    if (userId) {
      await prisma.user.upsert({
        where: { id: userId },
        create: { id: userId, email, fullName: null, avatarUrl: null },
        update: { email }
      });
    }

    redirect("/survey");
  } catch {
    redirect(`/register?error=${encodeURIComponent("Сервис временно недоступен. Попробуйте еще раз.")}`);
  }
}

export async function signOutAction(): Promise<void> {
  const supabase = createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/");
}

