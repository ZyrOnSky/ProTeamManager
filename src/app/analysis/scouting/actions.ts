'use server';

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { Position } from "@prisma/client";

export async function updateTeamDetails(teamId: string, data: { opggUrl?: string; notes?: string }) {
  await prisma.team.update({
    where: { id: teamId },
    data
  });
  revalidatePath(`/analysis/scouting/${teamId}`);
}

export async function addEnemyPlayer(teamId: string, data: { name: string; role: Position; opggUrl?: string; notes?: string }) {
  await prisma.enemyPlayer.create({
    data: {
      teamId,
      ...data
    }
  });
  revalidatePath(`/analysis/scouting/${teamId}`);
}

export async function updateEnemyPlayer(playerId: string, data: { name?: string; role?: Position; opggUrl?: string; notes?: string }) {
  await prisma.enemyPlayer.update({
    where: { id: playerId },
    data
  });
  revalidatePath(`/analysis/scouting/${teamIdByPlayerId(playerId)}`);
}

export async function deleteEnemyPlayer(playerId: string) {
  const player = await prisma.enemyPlayer.findUnique({ where: { id: playerId } });
  if (player) {
    await prisma.enemyPlayer.delete({ where: { id: playerId } });
    revalidatePath(`/analysis/scouting/${player.teamId}`);
  }
}

export async function addEnemyBan(teamId: string, data: { championName: string; count: number; notes?: string }) {
  await prisma.enemyBan.create({
    data: {
      teamId,
      ...data
    }
  });
  revalidatePath(`/analysis/scouting/${teamId}`);
}

export async function updateEnemyBan(banId: string, data: { count?: number; notes?: string }) {
  const ban = await prisma.enemyBan.update({
    where: { id: banId },
    data
  });
  revalidatePath(`/analysis/scouting/${ban.teamId}`);
}

export async function deleteEnemyBan(banId: string) {
  const ban = await prisma.enemyBan.findUnique({ where: { id: banId } });
  if (ban) {
    await prisma.enemyBan.delete({ where: { id: banId } });
    revalidatePath(`/analysis/scouting/${ban.teamId}`);
  }
}

// Helper to get teamId for revalidation if needed, though usually we have it in context
async function teamIdByPlayerId(playerId: string) {
  const player = await prisma.enemyPlayer.findUnique({ where: { id: playerId }, select: { teamId: true } });
  return player?.teamId;
}

export async function createTeam(data: { name: string; isRival: boolean; notes?: string }) {
  await prisma.team.create({
    data
  });
  revalidatePath('/analysis/scouting');
}

export async function deleteTeam(teamId: string) {
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: { 
      _count: { 
        select: { matchesAsEnemy: true } 
      } 
    }
  });

  if (!team) return;

  // If team has matches, we only hide it (Soft Delete)
  if (team._count.matchesAsEnemy > 0) {
    await prisma.team.update({
      where: { id: teamId },
      data: { isVisible: false }
    });
  } else {
    // If no matches, try to hard delete
    try {
      await prisma.team.delete({
        where: { id: teamId }
      });
    } catch (error) {
      // If hard delete fails (e.g. due to other relations like TierLists), fallback to soft delete
      console.error("Failed to hard delete team, falling back to soft delete:", error);
      await prisma.team.update({
        where: { id: teamId },
        data: { isVisible: false }
      });
    }
  }
  
  revalidatePath('/analysis/scouting');
}
