"use server";

import { createServerClient } from "@supabase/auth-helpers-nextjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

export async function loginAction(formData: FormData): Promise<void> {
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

  // redirect to dashboard
  redirect("/dashboard");
}

export async function registerAction(
  formData: FormData
): Promise<void> {
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

  // Supabase может не создать session сразу (подтверждение email),
  // но нам нужен user id, чтобы завести запись в нашей таблице.
  const userId = data.user?.id;
  if (userId) {
    await prisma.user.upsert({
      where: { id: userId },
      create: { id: userId, email, fullName: null, avatarUrl: null },
      update: { email }
    });
  }

  redirect("/dashboard");
}

export async function signOutAction(): Promise<void> {
  const supabase = createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/");
}

