import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { DashboardShell } from "@/components/dashboard/DashboardShell";

export default async function DashboardPage(): Promise<JSX.Element> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const profile = await prisma.profile.findUnique({
    where: { userId: user.id },
    select: { id: true }
  });

  if (!profile) {
    redirect("/survey");
  }

  return <DashboardShell />;
}
