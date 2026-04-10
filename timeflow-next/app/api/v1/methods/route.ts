import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

async function getCurrentUserId(): Promise<string | null> {
  const supabase = createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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

