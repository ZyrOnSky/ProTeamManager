import { prisma } from "@/lib/prisma";

export async function getTierLists() {
  return await prisma.tierList.findMany({
    orderBy: { updatedAt: 'desc' },
    include: {
      _count: {
        select: { champions: true }
      },
      enemyTeam: true,
      lineup: true,
      patch: true
    }
  });
}

export async function getTierList(id: string) {
  return await prisma.tierList.findUnique({
    where: { id },
    include: {
      champions: {
        orderBy: { tier: 'asc' } // We might need custom sorting for tiers S, A, B...
      }
    }
  });
}
