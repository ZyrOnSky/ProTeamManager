'use server';

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Side } from "@prisma/client";

export async function createDraftPlan(formData: FormData) {
  const name = formData.get('name') as string;
  const enemyTeamId = formData.get('enemyTeamId') as string || null;
  const lineupId = formData.get('lineupId') as string || null;
  const allyTierListId = formData.get('allyTierListId') as string || null;
  const enemyTierListId = formData.get('enemyTierListId') as string || null;
  const ourSideRaw = formData.get('ourSide') as string;
  const ourSide = ourSideRaw === 'RED' ? Side.RED : Side.BLUE;

  const draft = await prisma.draftPlan.create({
    data: {
      name,
      enemyTeam: enemyTeamId ? { connect: { id: enemyTeamId } } : undefined,
      lineup: lineupId ? { connect: { id: lineupId } } : undefined,
      allyTierList: allyTierListId ? { connect: { id: allyTierListId } } : undefined,
      enemyTierList: enemyTierListId ? { connect: { id: enemyTierListId } } : undefined,
      ourSide,
      blueBans: [],
      redBans: [],
      bluePicks: [],
      redPicks: []
    }
  });

  revalidatePath('/analysis/draft');
  redirect(`/analysis/draft/${draft.id}`);
}

export async function deleteDraftPlan(id: string) {
  await prisma.draftPlan.delete({
    where: { id }
  });
  revalidatePath('/analysis/draft');
}

export async function updateDraftPlan(id: string, data: any) {
  await prisma.draftPlan.update({
    where: { id },
    data
  });
  revalidatePath(`/analysis/draft/${id}`);
}
