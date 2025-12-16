'use server';

import { updateChampionMeta, getChampionStatsList, ChampionStatsFilter } from '@/lib/stats';
import { ChampionClass, ChampionRole, LaneAllocation, Position } from '@prisma/client';
import { revalidatePath } from 'next/cache';

export async function updateChampionMetaAction(championName: string, data: {
  laneStyle?: LaneAllocation | null;
  compStyle?: ChampionRole | null;
  compStyleSecondary?: ChampionRole | null;
  class?: ChampionClass | null;
  primaryRole?: Position | null;
  secondaryRole?: Position | null;
  notes?: string;
}) {
  await updateChampionMeta(championName, data);
  revalidatePath(`/analysis/stats/${championName}`);
  revalidatePath('/analysis/stats');
}

export async function getChampionStatsListAction(filters?: ChampionStatsFilter) {
  return await getChampionStatsList(filters);
}
