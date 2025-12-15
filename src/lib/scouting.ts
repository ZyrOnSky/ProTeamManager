import { prisma } from "@/lib/prisma";
import { Side } from "@prisma/client";

export async function getScoutingTeams() {
  const teams = await prisma.team.findMany({
    where: {
      isVisible: true
    },
    include: {
      matchesAsEnemy: {
        select: {
          result: true,
          date: true,
        },
        orderBy: {
          date: 'desc'
        }
      }
    }
  });

  return teams.map(team => {
    const totalMatches = team.matchesAsEnemy.length;
    const wins = team.matchesAsEnemy.filter(m => m.result === 'WIN').length; // Our wins
    const losses = team.matchesAsEnemy.filter(m => m.result === 'LOSS').length; // Our losses
    
    const winrate = totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0;
    const lastMatch = team.matchesAsEnemy[0]?.date || null;

    return {
      id: team.id,
      name: team.name,
      isRival: team.isRival,
      totalMatches,
      ourWins: wins,
      ourLosses: losses,
      winrate,
      lastMatch
    };
  });
}

export async function getTeamScoutingReport(teamId: string) {
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: {
      matchesAsEnemy: {
        orderBy: { date: 'desc' },
        include: {
          participants: {
            where: { isEnemy: true }
          }
        }
      },
      players: true,
      manualBans: true,
      tierLists: {
        include: {
          champions: true
        }
      }
    }
  });

  if (!team) return null;

  // Aggregate Stats
  const totalMatches = team.matchesAsEnemy.length;
  const wins = team.matchesAsEnemy.filter(m => m.result === 'WIN').length;
  const losses = team.matchesAsEnemy.filter(m => m.result === 'LOSS').length;
  const winrate = totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0;

  // Bans Analysis
  const banCounts: Record<string, number> = {};
  
  // Add manual bans
  team.manualBans.forEach(ban => {
    banCounts[ban.championName] = (banCounts[ban.championName] || 0) + ban.count;
  });

  // Add match bans
  team.matchesAsEnemy.forEach(match => {
    let enemyBans: string[] = [];
    if (match.ourSide === 'BLUE') {
      enemyBans = match.redBans;
    } else if (match.ourSide === 'RED') {
      enemyBans = match.blueBans;
    }
    
    enemyBans.forEach(ban => {
      if (ban) {
        banCounts[ban] = (banCounts[ban] || 0) + 1;
      }
    });
  });

  const topBans = Object.entries(banCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([champion, count]) => ({ champion, count }));

  // Picks Analysis
  const pickCounts: Record<string, number> = {};
  const rolePicks: Record<string, Record<string, number>> = {
    TOP: {}, JUNGLE: {}, MID: {}, ADC: {}, SUPPORT: {}
  };

  team.matchesAsEnemy.forEach(match => {
    match.participants.forEach(p => {
      pickCounts[p.championName] = (pickCounts[p.championName] || 0) + 1;
      
      let pos = p.position as string;
      if (pos === 'BOT') pos = 'ADC';

      if (rolePicks[pos]) {
        rolePicks[pos][p.championName] = (rolePicks[pos][p.championName] || 0) + 1;
      }
    });
  });

  const topPicks = Object.entries(pickCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([champion, count]) => ({ champion, count }));

  // Most played by role
  const topPicksByRole = Object.entries(rolePicks).map(([role, champs]) => {
    const top = Object.entries(champs)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([champion, count]) => ({ champion, count }));
    return { role, champions: top };
  });

  return {
    team: {
      id: team.id,
      name: team.name,
      isRival: team.isRival,
      notes: team.notes,
      opggUrl: team.opggUrl,
    },
    stats: {
      totalMatches,
      ourWins: wins,
      ourLosses: losses,
      winrate,
      topBans,
      topPicks,
      topPicksByRole
    },
    matches: team.matchesAsEnemy,
    roster: team.players,
    tierLists: team.tierLists
  };
}

export async function getGlobalChampionStats() {
  const matches = await prisma.match.findMany({
    include: {
      participants: {
        where: { isEnemy: false }
      }
    }
  });

  const championStats: Record<string, {
    name: string;
    games: number;
    wins: number;
    kills: number;
    deaths: number;
    assists: number;
    cs: number;
    damage: number;
  }> = {};

  matches.forEach(match => {
    const isWin = match.result === 'WIN';
    
    match.participants.forEach(p => {
      if (!p.championName) return;
      
      if (!championStats[p.championName]) {
        championStats[p.championName] = {
          name: p.championName,
          games: 0,
          wins: 0,
          kills: 0,
          deaths: 0,
          assists: 0,
          cs: 0,
          damage: 0
        };
      }
      
      const stats = championStats[p.championName];
      stats.games += 1;
      if (isWin) stats.wins += 1;
      stats.kills += p.kills || 0;
      stats.deaths += p.deaths || 0;
      stats.assists += p.assists || 0;
      stats.cs += p.cs || 0;
      stats.damage += p.damageDealt || 0;
    });
  });

  return Object.values(championStats).map(stat => ({
    ...stat,
    winrate: Math.round((stat.wins / stat.games) * 100),
    kda: stat.deaths > 0 ? ((stat.kills + stat.assists) / stat.deaths).toFixed(2) : (stat.kills + stat.assists).toFixed(2),
    avgKills: (stat.kills / stat.games).toFixed(1),
    avgDeaths: (stat.deaths / stat.games).toFixed(1),
    avgAssists: (stat.assists / stat.games).toFixed(1),
    avgCs: (stat.cs / stat.games).toFixed(1),
    avgDamage: Math.round(stat.damage / stat.games)
  })).sort((a, b) => b.games - a.games);
}
