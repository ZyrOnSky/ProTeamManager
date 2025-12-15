import { prisma } from "@/lib/prisma";

export async function getDraftContext(draft: any) {
  // 1. Get Ally Tier List
  let tierListChampions: any[] = [];
  if (draft.allyTierListId) {
    const tl = await prisma.tierList.findUnique({
      where: { id: draft.allyTierListId },
      include: { champions: true }
    });
    tierListChampions = tl?.champions || [];
  } else {
    const tl = await prisma.tierList.findFirst({
      where: { isActive: true, lineupId: draft.lineupId || undefined },
      include: { champions: true },
      orderBy: { updatedAt: 'desc' }
    });
    tierListChampions = tl?.champions || [];
  }

  // 2. Get our global champion stats (Filtered by Lineup if selected)
  const whereClause: any = {
    type: { in: ['SCRIM', 'TOURNAMENT'] },
    result: { not: null }
  };
  
  if (draft.lineupId) {
    whereClause.lineupId = draft.lineupId;
  }

  const ourMatches = await prisma.match.findMany({
    where: whereClause,
    include: {
      participants: { where: { isEnemy: false } }
    }
  });

  const ourStats: Record<string, { played: number, winrate: number, kda: string, tier?: string, role?: string }> = {};
  
  // Helper for KDA
  const champAgg: Record<string, { kills: number, deaths: number, assists: number, wins: number, played: number }> = {};

  ourMatches.forEach(m => {
    m.participants.forEach(p => {
      if (!champAgg[p.championName]) {
        champAgg[p.championName] = { kills: 0, deaths: 0, assists: 0, wins: 0, played: 0 };
      }
      const agg = champAgg[p.championName];
      agg.played++;
      agg.kills += p.kills || 0;
      agg.deaths += p.deaths || 0;
      agg.assists += p.assists || 0;
      if (m.result === 'WIN') agg.wins++;
    });
  });

  Object.keys(champAgg).forEach(k => {
    const agg = champAgg[k];
    const winrate = Math.round((agg.wins / agg.played) * 100);
    const kdaVal = agg.deaths === 0 ? (agg.kills + agg.assists) : (agg.kills + agg.assists) / agg.deaths;
    
    ourStats[k] = {
      played: agg.played,
      winrate,
      kda: kdaVal.toFixed(1)
    };
  });

  // Merge Tier List info into stats
  tierListChampions.forEach(c => {
    if (!ourStats[c.championName]) {
      ourStats[c.championName] = { played: 0, winrate: 0, kda: "0.0" };
    }
    ourStats[c.championName].tier = c.tier;
    ourStats[c.championName].role = c.role;
  });

  // 3. Get Enemy Stats (if applicable)
  const enemyStats: Record<string, { played: number, winrate: number }> = {};
  
  if (draft.enemyTeamId) {
    // Matches where they were the enemy
    const enemyMatches = await prisma.match.findMany({
      where: { enemyTeamId: draft.enemyTeamId },
      include: {
        participants: { where: { isEnemy: true } }
      }
    });

    enemyMatches.forEach(m => {
      m.participants.forEach(p => {
        if (!enemyStats[p.championName]) enemyStats[p.championName] = { played: 0, winrate: 0 };
        enemyStats[p.championName].played++;
        // If we WON, they LOST. If we LOST, they WON.
        // Match result is from OUR perspective.
        const enemyWon = m.result === 'LOSS'; 
        if (enemyWon) enemyStats[p.championName].winrate++;
      });
    });

    Object.keys(enemyStats).forEach(k => {
      enemyStats[k].winrate = Math.round((enemyStats[k].winrate / enemyStats[k].played) * 100);
    });
  }

  return {
    tierList: tierListChampions,
    ourStats,
    enemyStats
  };
}
