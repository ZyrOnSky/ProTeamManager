import { prisma } from "@/lib/prisma";
import { ChampionClass, ChampionRole, LaneAllocation, Position } from "@prisma/client";

export interface ChampionStatsFilter {
  role?: Position | 'ALL';
  gameVersion?: string;
  compStyle?: ChampionRole;
  laneStyle?: LaneAllocation;
  championClass?: ChampionClass;
}

export async function getChampionStatsList(filters?: ChampionStatsFilter) {
  // 1. Fetch all champions played in matches
  const participations = await prisma.matchParticipant.findMany({
    where: {
      match: {
        gameVersion: filters?.gameVersion ? { equals: filters.gameVersion } : undefined
      },
      position: filters?.role && filters.role !== 'ALL' ? filters.role : undefined,
    },
    include: {
      match: {
        select: {
          result: true,
          gameVersion: true
        }
      }
    }
  });

  // 1.5 Fetch Bans (Global)
  const matchesWithBans = await prisma.match.findMany({
    where: {
      gameVersion: filters?.gameVersion ? { equals: filters.gameVersion } : undefined
    },
    select: {
      blueBans: true,
      redBans: true
    }
  });

  const banCounts = new Map<string, number>();
  matchesWithBans.forEach(m => {
    [...m.blueBans, ...m.redBans].forEach(ban => {
      if (ban) banCounts.set(ban, (banCounts.get(ban) || 0) + 1);
    });
  });

  // 2. Fetch Champion Definitions (Metadata)
  const definitions = await prisma.championDefinition.findMany();
  const definitionsMap = new Map(definitions.map(d => [d.name, d]));

  // 3. Aggregate Stats
  const statsMap = new Map<string, {
    name: string;
    games: number;
    wins: number;
    kills: number;
    deaths: number;
    assists: number;
    cs: number;
    damage: number;
    playedAgainst: number;
    bans: number;
  }>();

  // Initialize statsMap with bans even if not played
  banCounts.forEach((count, name) => {
    if (!statsMap.has(name)) {
      statsMap.set(name, {
        name,
        games: 0,
        wins: 0,
        kills: 0,
        deaths: 0,
        assists: 0,
        cs: 0,
        damage: 0,
        playedAgainst: 0,
        bans: count
      });
    } else {
      statsMap.get(name)!.bans = count;
    }
  });

  for (const p of participations) {
    // Filter by metadata if needed
    const def = definitionsMap.get(p.championName);
    if (filters?.championClass && def?.class !== filters.championClass) continue;
    if (filters?.compStyle && def?.compStyle !== filters.compStyle) continue;
    if (filters?.laneStyle && def?.laneStyle !== filters.laneStyle) continue;

    if (!statsMap.has(p.championName)) {
      statsMap.set(p.championName, {
        name: p.championName,
        games: 0,
        wins: 0,
        kills: 0,
        deaths: 0,
        assists: 0,
        cs: 0,
        damage: 0,
        playedAgainst: 0,
        bans: banCounts.get(p.championName) || 0
      });
    }

    const stat = statsMap.get(p.championName)!;

    // CRITICAL FIX: Only aggregate performance stats for OUR players (playerProfileId is not null)
    // If it's an enemy or untracked player, we count it as "Played Against" if isEnemy is true
    
    if (p.playerProfileId) {
      stat.games++;
      if (p.match.result === 'WIN') stat.wins++;
      stat.kills += p.kills || 0;
      stat.deaths += p.deaths || 0;
      stat.assists += p.assists || 0;
      stat.cs += p.cs || 0;
      stat.damage += p.damageDealt || 0;
    } else if (p.isEnemy) {
      stat.playedAgainst++;
    }
  }

  // 4. Format Result
  return Array.from(statsMap.values())
    .filter(stat => stat.games > 0 || stat.playedAgainst > 0 || stat.bans > 0) // Show if relevant
    .map(stat => {
    const def = definitionsMap.get(stat.name);
    return {
      ...stat,
      winrate: stat.games > 0 ? Math.round((stat.wins / stat.games) * 100) : 0,
      kda: stat.games > 0 && stat.deaths === 0 ? (stat.kills + stat.assists) : (stat.games > 0 ? Number(((stat.kills + stat.assists) / stat.deaths).toFixed(2)) : 0),
      avgKills: stat.games > 0 ? (stat.kills / stat.games).toFixed(1) : "0.0",
      avgDeaths: stat.games > 0 ? (stat.deaths / stat.games).toFixed(1) : "0.0",
      avgAssists: stat.games > 0 ? (stat.assists / stat.games).toFixed(1) : "0.0",
      avgCs: stat.games > 0 ? Math.round(stat.cs / stat.games) : 0,
      avgDamage: stat.games > 0 ? Math.round(stat.damage / stat.games) : 0,
      class: def?.class,
      laneStyle: def?.laneStyle,
      compStyle: def?.compStyle
    };
  }).sort((a, b) => b.games - a.games);
}

export async function getChampionDetail(championName: string) {
  const definition = await prisma.championDefinition.findUnique({
    where: { name: championName }
  });

  // Fetch all matches for this champion
  const participations = await prisma.matchParticipant.findMany({
    where: { championName },
    include: {
      match: {
        include: {
          enemyTeam: true
        }
      },
      playerProfile: {
        include: {
          user: true
        }
      }
    },
    orderBy: {
      match: {
        date: 'desc'
      }
    }
  });

  // Fetch Bans (This is tricky as bans are arrays of strings in Match)
  // We'll fetch all matches and filter in memory for now, or use raw query if needed.
  // Given the scale, fetching matches is okay.
  const allMatches = await prisma.match.findMany({
    select: {
      blueBans: true,
      redBans: true,
      ourSide: true
    }
  });

  let bans = { total: 0, blue: 0, red: 0 };
  for (const m of allMatches) {
    if (m.blueBans.includes(championName)) {
      bans.total++;
      bans.blue++;
    }
    if (m.redBans.includes(championName)) {
      bans.total++;
      bans.red++;
    }
  }

  // Aggregate Role Stats
  const roleStats = new Map<string, { games: number, wins: number, kills: number, deaths: number, assists: number }>();
  
  // Aggregate Player Stats
  const playerStats = new Map<string, { name: string, games: number, wins: number, kills: number, deaths: number, assists: number }>();

  let totalStats = { games: 0, wins: 0, kills: 0, deaths: 0, assists: 0, cs: 0, duration: 0 };
  let picks = { total: 0, blue: 0, red: 0 };
  let playedAgainst = { total: 0, wins: 0, losses: 0 }; // Track performance AGAINST this champion

  for (const p of participations) {
    // SEPARATION OF CONCERNS:
    // 1. Our Players (Performance Stats)
    if (p.playerProfileId) {
      totalStats.games++;
      if (p.match.result === 'WIN') totalStats.wins++;
      totalStats.kills += p.kills || 0;
      totalStats.deaths += p.deaths || 0;
      totalStats.assists += p.assists || 0;
      totalStats.cs += p.cs || 0;
      totalStats.duration += p.match.duration || 0;

      // Picks by side (Our picks)
      picks.total++;
      if (p.match.ourSide === 'BLUE') picks.blue++;
      else if (p.match.ourSide === 'RED') picks.red++;

      // Role Stats
      if (!roleStats.has(p.position)) {
        roleStats.set(p.position, { games: 0, wins: 0, kills: 0, deaths: 0, assists: 0 });
      }
      const rs = roleStats.get(p.position)!;
      rs.games++;
      if (p.match.result === 'WIN') rs.wins++;
      rs.kills += p.kills || 0;
      rs.deaths += p.deaths || 0;
      rs.assists += p.assists || 0;

      // Player Stats
      const playerName = p.playerProfile?.user.name || p.summonerName || 'Unknown';
      if (!playerStats.has(playerName)) {
        playerStats.set(playerName, { name: playerName, games: 0, wins: 0, kills: 0, deaths: 0, assists: 0 });
      }
      const ps = playerStats.get(playerName)!;
      ps.games++;
      if (p.match.result === 'WIN') ps.wins++;
      ps.kills += p.kills || 0;
      ps.deaths += p.deaths || 0;
      ps.assists += p.assists || 0;
    } 
    // 2. Opponents (Played Against Stats)
    else if (p.isEnemy) {
      playedAgainst.total++;
      // If we played against them and THEY won, it's a LOSS for us.
      // But match.result is usually from OUR perspective?
      // Let's assume match.result is "WIN" if WE won.
      // So if match.result is WIN, we beat them (their loss).
      if (p.match.result === 'WIN') playedAgainst.wins++; // We won against them
      else playedAgainst.losses++; // We lost against them
    }
  }

  return {
    definition,
    stats: {
      ...totalStats,
      winrate: totalStats.games > 0 ? Math.round((totalStats.wins / totalStats.games) * 100) : 0,
      kda: totalStats.deaths === 0 ? (totalStats.kills + totalStats.assists) : ((totalStats.kills + totalStats.assists) / totalStats.deaths).toFixed(2),
      csm: totalStats.duration > 0 ? (totalStats.cs / (totalStats.duration / 60)).toFixed(1) : 0
    },
    bans,
    picks,
    playedAgainst,
    roleStats: Array.from(roleStats.entries()).map(([role, stat]) => ({
      role,
      ...stat,
      winrate: Math.round((stat.wins / stat.games) * 100),
      kda: stat.deaths === 0 ? (stat.kills + stat.assists) : ((stat.kills + stat.assists) / stat.deaths).toFixed(2)
    })),
    playerStats: Array.from(playerStats.values()).map(stat => ({
      ...stat,
      winrate: Math.round((stat.wins / stat.games) * 100),
      kda: stat.deaths === 0 ? (stat.kills + stat.assists) : ((stat.kills + stat.assists) / stat.deaths).toFixed(2)
    })),
    matches: participations.map(p => ({
      id: p.match.id,
      player: p.playerProfile?.user.name || p.summonerName || (p.isEnemy ? 'Oponente' : 'Desconocido'),
      isMyTeam: !!p.playerProfileId, // Flag for UI
      result: p.match.result,
      kda: `${p.kills}/${p.deaths}/${p.assists}`,
      csm: p.match.duration ? (p.cs! / (p.match.duration / 60)).toFixed(1) : 0,
      opponentChamp: p.laneOpponent || 'Unknown', 
      date: p.match.date,
      type: p.match.type,
      side: p.match.ourSide,
      enemyTeam: p.match.enemyTeam?.name || 'SoloQ'
    }))
  };
}

export async function updateChampionMeta(championName: string, data: {
  laneStyle?: LaneAllocation | null;
  compStyle?: ChampionRole | null;
  compStyleSecondary?: ChampionRole | null;
  class?: ChampionClass | null;
  primaryRole?: Position | null;
  secondaryRole?: Position | null;
  notes?: string;
}) {
  await prisma.championDefinition.upsert({
    where: { name: championName },
    create: {
      name: championName,
      ...data
    },
    update: data
  });
}

export async function getGlobalStats() {
  const matches = await prisma.match.findMany({
    where: {
      type: { in: ['SCRIM', 'TOURNAMENT'] },
      result: { not: null } // Only finished matches
    },
    include: {
      participants: {
        where: { isEnemy: false } // Only our players
      }
    },
    orderBy: { date: 'desc' }
  });

  const totalMatches = matches.length;
  const wins = matches.filter(m => m.result === 'WIN').length;
  const losses = matches.filter(m => m.result === 'LOSS').length;
  const winrate = totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0;

  // Side Stats
  const blueMatches = matches.filter(m => m.ourSide === 'BLUE');
  const redMatches = matches.filter(m => m.ourSide === 'RED');
  
  const blueWins = blueMatches.filter(m => m.result === 'WIN').length;
  const redWins = redMatches.filter(m => m.result === 'WIN').length;

  const blueWinrate = blueMatches.length > 0 ? Math.round((blueWins / blueMatches.length) * 100) : 0;
  const redWinrate = redMatches.length > 0 ? Math.round((redWins / redMatches.length) * 100) : 0;

  // Champion Stats
  const championStats: Record<string, { played: number, wins: number, kills: number, deaths: number, assists: number }> = {};

  matches.forEach(match => {
    match.participants.forEach(p => {
      if (!championStats[p.championName]) {
        championStats[p.championName] = { played: 0, wins: 0, kills: 0, deaths: 0, assists: 0 };
      }
      const stats = championStats[p.championName];
      stats.played++;
      if (match.result === 'WIN') stats.wins++;
      stats.kills += p.kills || 0;
      stats.deaths += p.deaths || 0;
      stats.assists += p.assists || 0;
    });
  });

  const topChampions = Object.entries(championStats)
    .map(([name, stats]) => ({
      name,
      played: stats.played,
      winrate: Math.round((stats.wins / stats.played) * 100),
      kda: stats.deaths > 0 ? ((stats.kills + stats.assists) / stats.deaths).toFixed(2) : (stats.kills + stats.assists).toFixed(2)
    }))
    .sort((a, b) => b.played - a.played)
    .slice(0, 10);

  return {
    overview: {
      totalMatches,
      wins,
      losses,
      winrate
    },
    sides: {
      blue: { played: blueMatches.length, winrate: blueWinrate },
      red: { played: redMatches.length, winrate: redWinrate }
    },
    topChampions
  };
}
