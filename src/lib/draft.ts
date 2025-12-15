import { prisma } from "@/lib/prisma";

export async function getDraftPlans() {
  return await prisma.draftPlan.findMany({
    orderBy: { updatedAt: 'desc' },
    include: {
      enemyTeam: true,
      lineup: true
    }
  });
}

export async function getDraftPlan(id: string) {
  return await prisma.draftPlan.findUnique({
    where: { id },
    include: {
      enemyTeam: true,
      lineup: true
    }
  });
}
