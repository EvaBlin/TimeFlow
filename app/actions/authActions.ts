"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

export async function loginAction(formData: FormData): Promise<void> {
  let redirectUrl: string;

  try {
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    if (!email || !password) {
      redirectUrl = `/login?error=${encodeURIComponent("Введите email и пароль")}`;
    } else {
      const supabase = createSupabaseServerClient();
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error || !data.session) {
        redirectUrl = `/login?error=${encodeURIComponent(error?.message ?? "Не удалось выполнить вход")}`;
      } else {
        redirectUrl = "/dashboard";
      }
    }
  } catch {
    redirectUrl = `/login?error=${encodeURIComponent("Сервис временно недоступен. Попробуйте еще раз.")}`;
  }

  if (redirectUrl) {
    redirect(redirectUrl);
  }

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.session) {
    redirect(`/login?error=${encodeURIComponent(error?.message ?? "Не удалось выполнить вход")}`);
  }

  redirect("/dashboard");

}

export async function registerAction(formData: FormData): Promise<void> {
  let redirectUrl: string;

  try {
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    if (!email || !password) {
      redirectUrl = `/register?error=${encodeURIComponent("Введите email и пароль")}`;
    } else {
      const supabase = createSupabaseServerClient();
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 
                      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://time-flow-fgzm.vercel.app");

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${siteUrl}/api/auth/callback`
        }
      });
      
      if (error) {
        redirectUrl = `/register?error=${encodeURIComponent(error.message)}`;
      } else {
        const userId = data.user?.id;
        if (userId) {
          await prisma.user.upsert({
            where: { id: userId },
            create: { id: userId, email, fullName: null, avatarUrl: null },
            update: { email }
          });
        }
        redirectUrl = "/survey";
      }
    }
  } catch {
    redirectUrl = `/register?error=${encodeURIComponent("Сервис временно недоступен. Попробуйте еще раз.")}`;
  }

  if (redirectUrl) {
    redirect(redirectUrl);
  }

  const supabase = createSupabaseServerClient();
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ||
                  process.env.VERCEL_URL ?
                  `https://${process.env.VERCEL_URL}` :
                  "https://time-flow-fgzm.vercel.app";

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

  const userId = data.user?.id;
  if (userId) {
    await prisma.user.upsert({
      where: { id: userId },
      create: { id: userId, email, fullName: null, avatarUrl: null },
      update: { email }
    });
  }

  redirect("/survey");
}

export async function signOutAction(): Promise<void> {
  const supabase = createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/");
}
