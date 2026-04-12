import { NextResponse } from "next/server";
import { ensureAppUser, ensureDefaultTools } from "@/lib/appBootstrap";
import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

async function getCurrentUserId(): Promise<string | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (user) {
    await ensureAppUser(user);
  }
  return user?.id ?? null;
}

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await ensureDefaultTools();
  const tools = await prisma.tool.findMany({
    orderBy: [{ isActive: "desc" }, { name: "asc" }]
  });

  return NextResponse.json({
    items: tools.map((tool) => ({
      id: tool.id,
      name: tool.name,
      description: tool.description,
      instructions: tool.instructions,
      isActive: tool.isActive
    }))
  });
}
