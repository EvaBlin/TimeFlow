import { DamageCode } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const DAMAGE_TYPE_METADATA: Record<DamageCode, { name: string; description: string }> = {
  [DamageCode.routine]: {
    name: "Routine",
    description: "Steady, predictable work with low volatility."
  },
  [DamageCode.overload]: {
    name: "Overload",
    description: "High-pressure work that risks cognitive overload."
  },
  [DamageCode.chaos]: {
    name: "Chaos",
    description: "Unclear, fragmented work with constant interruptions."
  }
};

export async function ensureDamageType(code: DamageCode) {
  const meta = DAMAGE_TYPE_METADATA[code];

  return prisma.damageType.upsert({
    where: { code },
    update: {
      isActive: true,
      name: meta.name,
      description: meta.description
    },
    create: {
      code,
      name: meta.name,
      description: meta.description,
      isActive: true
    }
  });
}
