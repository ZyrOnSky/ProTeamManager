'use server';

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createTierList(formData: FormData) {
  const name = formData.get('name') as string;
  const description = formData.get('description') as string;
  const enemyTeamId = formData.get('enemyTeamId') as string | null;
  const lineupId = formData.get('lineupId') as string | null;
  const patchId = formData.get('patchId') as string | null;
  
  const tierList = await prisma.tierList.create({
    data: {
      name,
      description,
      isActive: false,
      enemyTeamId: enemyTeamId || undefined,
      lineupId: lineupId || undefined,
      patchId: patchId || undefined
    }
  });

  revalidatePath('/analysis/meta');
  if (enemyTeamId) {
    revalidatePath(`/analysis/scouting/${enemyTeamId}`);
  }
  redirect(`/analysis/meta/${tierList.id}`);
}

export async function updateTierList(id: string, data: any) {
  // data should contain name, description, and champions array
  // We'll do a transaction to update the list and replace champions
  
  await prisma.$transaction(async (tx) => {
    // 1. Update basic info
    await tx.tierList.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        isActive: data.isActive,
        patchId: data.patchId || null,
        enemyTeamId: data.enemyTeamId || null,
        lineupId: data.lineupId || null
      }
    });

    // 2. Delete existing champions
    await tx.tierListChampion.deleteMany({
      where: { tierListId: id }
    });

    // 3. Create new champions
    if (data.champions && data.champions.length > 0) {
      await tx.tierListChampion.createMany({
        data: data.champions.map((c: any) => ({
          tierListId: id,
          championName: c.championName,
          tier: c.tier,
          role: c.role,
          notes: c.notes
        }))
      });
    }
  });

  revalidatePath('/analysis/meta');
  revalidatePath(`/analysis/meta/${id}`);
}

export async function deleteTierList(id: string) {
  await prisma.tierList.delete({
    where: { id }
  });
  
  revalidatePath('/analysis/meta');
  redirect('/analysis/meta');
}

export async function toggleTierListActive(id: string, isActive: boolean) {
  // If setting to active, we might want to deactivate others? 
  // For now let's allow multiple active or just one. Let's assume just one active per type if we had types, but here just toggle.
  
  await prisma.tierList.update({
    where: { id },
    data: { isActive }
  });
  
  revalidatePath('/analysis/meta');
}
