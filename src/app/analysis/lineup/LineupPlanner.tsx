'use client';

import { useState, useMemo } from 'react';
import { Shield, Sword, Zap, Crosshair, Heart, AlertCircle, Filter, Save, FolderOpen, Trash2, Wand2, Sparkles, Puzzle, Map, Footprints, Flame, Target } from 'lucide-react';
import { saveLineupConfiguration, deleteLineupConfiguration } from '@/app/actions/lineup-actions';
import { useRouter } from 'next/navigation';

interface MatchParticipant {
  position: string;
  championName: string; // Added championName
  kills: number | null;
  deaths: number | null;
  assists: number | null;
  cs: number | null;
  visionWards: number;
  wardsPlaced: number;
  laneAllocation: string | null;
  championRole: string | null;
  match: {
    result: string | null;
    type: string | null;
    ourSide: string | null;
    duration: number | null;
  } | null;
}

interface PlayerEvaluation {
  communication: number;
  mental: number;
  mechanics: number;
  gameKnowledge: number;
  teamplay: number;
}

interface Player {
  id: string;
  name: string;
  playerProfile: {
    lineupId: string | null;
    matchParticipations: MatchParticipant[];
    evaluations: PlayerEvaluation[];
  } | null;
}

interface Lineup {
  id: string;
  name: string;
}

interface SavedConfig {
  id: string;
  name: string;
  lineupId: string | null;
  assignments: any;
  filters: any;
  createdAt: Date;
  lineup?: { name: string } | null;
}

interface LineupPlannerProps {
  players: Player[];
  lineups: Lineup[];
  savedConfigs: SavedConfig[];
}

// Updated Coordinates: ADC (85,85 -> 75,75) and SUP (75,75 -> 85,85) swapped?
// User request: "el tierador este en la posicion que actualmente ocupa el soporte... y que el soporte este en la ubicacion que ocupa el tirador"
// Original: ADC (85,85), SUP (75,75).
// New: ADC (75,75), SUP (85,85).
const ROLES = [
  { id: 'TOP', label: 'TOP', icon: Shield, x: 15, y: 15, color: 'text-red-400' },
  { id: 'JUNGLE', label: 'JGL', icon: Sword, x: 35, y: 35, color: 'text-green-400' },
  { id: 'MID', label: 'MID', icon: Zap, x: 50, y: 50, color: 'text-yellow-400' },
  { id: 'ADC', label: 'ADC', icon: Crosshair, x: 75, y: 75, color: 'text-blue-400' }, // Swapped
  { id: 'SUPPORT', label: 'SUP', icon: Heart, x: 85, y: 85, color: 'text-purple-400' }, // Swapped
];

type FilterState = {
  side: string;
  allocation: string;
  style: string;
};

export function LineupPlanner({ players, lineups, savedConfigs }: LineupPlannerProps) {
  const router = useRouter();
  const [selectedLineupId, setSelectedLineupId] = useState<string>('');
  
  const [assignments, setAssignments] = useState<Record<string, string>>({
    TOP: '',
    JUNGLE: '',
    MID: '',
    ADC: '',
    SUPPORT: '',
  });

  // Per-Role Filters
  const [roleFilters, setRoleFilters] = useState<Record<string, FilterState>>({
    TOP: { side: 'ALL', allocation: 'ALL', style: 'ALL' },
    JUNGLE: { side: 'ALL', allocation: 'ALL', style: 'ALL' },
    MID: { side: 'ALL', allocation: 'ALL', style: 'ALL' },
    ADC: { side: 'ALL', allocation: 'ALL', style: 'ALL' },
    SUPPORT: { side: 'ALL', allocation: 'ALL', style: 'ALL' },
  });

  // UI State for expanding filters
  const [expandedFilters, setExpandedFilters] = useState<Record<string, boolean>>({});

  // Save/Load Modal State
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isLoadModalOpen, setIsLoadModalOpen] = useState(false);
  const [isCompModalOpen, setIsCompModalOpen] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Filter players based on selected lineup
  const availablePlayers = useMemo(() => {
    if (!selectedLineupId) return players;
    return players.filter(p => p.playerProfile?.lineupId === selectedLineupId);
  }, [players, selectedLineupId]);

  const toggleFilter = (roleId: string) => {
    setExpandedFilters(prev => ({ ...prev, [roleId]: !prev[roleId] }));
  };

  const updateRoleFilter = (roleId: string, key: keyof FilterState, value: string) => {
    setRoleFilters(prev => ({
      ...prev,
      [roleId]: { ...prev[roleId], [key]: value }
    }));
  };

  const getPlayerRoleStats = (playerId: string, roleId: string, overrideFilters?: FilterState) => {
    if (!playerId) return null;
    const player = players.find(p => p.id === playerId);
    if (!player || !player.playerProfile) return null;

    const filters = overrideFilters || roleFilters[roleId];

    // 1. Filter Matches
    const matches = player.playerProfile.matchParticipations.filter(m => {
      if (m.position !== roleId) return false;
      if (filters.side !== 'ALL' && m.match?.ourSide !== filters.side) return false;
      if (filters.allocation !== 'ALL' && m.laneAllocation !== filters.allocation) return false;
      if (filters.style !== 'ALL' && m.championRole !== filters.style) return false;
      return true;
    });

    const totalMatches = matches.length;
    if (totalMatches === 0) {
      return { score: '-', matches: 0, winrate: 0, isReliable: false };
    }

    // 2. Calculate Aggregates
    let totalKills = 0;
    let totalDeaths = 0;
    let totalAssists = 0;
    let totalCS = 0;
    let totalTargetCS = 0;
    let totalWards = 0;
    let totalMinutes = 0;
    let wins = 0;

    matches.forEach(m => {
      totalKills += (m.kills || 0);
      totalDeaths += (m.deaths || 0);
      totalAssists += (m.assists || 0);
      totalCS += (m.cs || 0);
      totalWards += (m.visionWards || 0) + (m.wardsPlaced || 0);
      
      const durationMin = m.match?.duration ? m.match.duration / 60 : 30;
      totalMinutes += durationMin;

      if (m.match?.result === 'WIN') wins++;

      // Calculate Target CS based on Role
      let targetCSPerMin = 10.0;
      const role = m.position || "MID"; // Default if unknown
      
      if (role === "JUNGLE") targetCSPerMin = 8.0;
      else if (role === "SUPPORT") targetCSPerMin = 2.0;
      
      totalTargetCS += (durationMin * targetCSPerMin);
    });

    // 3. Calculate Metrics
    const winRate = (wins / totalMatches) * 100;
    const kda = totalDeaths > 0 ? (totalKills + totalAssists) / totalDeaths : (totalKills + totalAssists);
    const wardsPerMin = totalMinutes > 0 ? totalWards / totalMinutes : 0;

    // 4. Apply FIFA Card Formula (0-10 Scale per stat)
    const wrScore = Math.min(10, (winRate / 70) * 10);
    const kdaScore = Math.min(10, (kda / 5.0) * 10);
    
    // CS Score based on Target CS
    const csScore = totalTargetCS > 0 ? Math.min(10, (totalCS / totalTargetCS) * 10) : 0;
    
    const visScore = Math.min(10, (wardsPerMin / 0.60) * 10);

    // Total Stats Score (0-100)
    const statsScore = (wrScore * 2.5) + (kdaScore * 2.5) + (csScore * 2.5) + (visScore * 2.5);

    return {
      score: Math.round(statsScore),
      matches: totalMatches,
      winrate: Math.round(winRate),
      isReliable: totalMatches >= 3
    };
  };

  const handleAssign = (roleId: string, playerId: string) => {
    setAssignments(prev => ({ ...prev, [roleId]: playerId }));
  };

  const recommendLineup = () => {
    const scores: { playerId: string, roleId: string, score: number }[] = [];

    ROLES.forEach(role => {
      availablePlayers.forEach(player => {
        const stats = getPlayerRoleStats(player.id, role.id);
        if (stats && typeof stats.score === 'number') {
          scores.push({ playerId: player.id, roleId: role.id, score: stats.score });
        }
      });
    });

    // Sort by score descending
    scores.sort((a, b) => b.score - a.score);

    const newAssignments: Record<string, string> = {
        TOP: '', JUNGLE: '', MID: '', ADC: '', SUPPORT: ''
    };
    const assignedPlayers = new Set<string>();
    const assignedRoles = new Set<string>();

    for (const item of scores) {
      if (!assignedPlayers.has(item.playerId) && !assignedRoles.has(item.roleId)) {
        newAssignments[item.roleId] = item.playerId;
        assignedPlayers.add(item.playerId);
        assignedRoles.add(item.roleId);
      }
    }
    
    setAssignments(newAssignments);
  };

  const findPeakPerformanceLineup = () => {
    // Define all possible filter options to iterate
    const SIDES = ['ALL', 'BLUE', 'RED'];
    const ALLOCATIONS = ['ALL', 'STRONG_SIDE', 'WEAK_SIDE', 'NEUTRAL', 'ROAMING'];
    const STYLES = ['ALL', 'CARRY', 'UTILITY', 'ENGAGE', 'POKE', 'PROTECT', 'SPLIT_PUSH'];

    const candidates: { playerId: string, roleId: string, score: number, filters: FilterState }[] = [];

    // 1. Find peak for every player in every role
    for (const role of ROLES) {
      for (const player of availablePlayers) {
        let bestScore = -1;
        let bestFilters: FilterState | null = null;

        // Iterate all combinations to find the player's "Peak"
        for (const side of SIDES) {
          for (const alloc of ALLOCATIONS) {
            for (const style of STYLES) {
              const currentFilters = { side, allocation: alloc, style };
              const stats = getPlayerRoleStats(player.id, role.id, currentFilters);
              
              // We only care if they have played enough games to be considered reliable-ish, 
              // or just raw score if we want pure potential. Let's use raw score but prefer > 0 matches.
              if (stats && stats.matches > 0 && stats.score > bestScore) {
                bestScore = stats.score;
                bestFilters = currentFilters;
              }
            }
          }
        }

        if (bestScore > 0 && bestFilters) {
          candidates.push({
            playerId: player.id,
            roleId: role.id,
            score: bestScore,
            filters: bestFilters
          });
        }
      }
    }

    // 2. Sort by Score Descending
    candidates.sort((a, b) => b.score - a.score);

    // 3. Assign greedily
    const newAssignments: Record<string, string> = { TOP: '', JUNGLE: '', MID: '', ADC: '', SUPPORT: '' };
    const newFilters = { ...roleFilters };
    const assignedPlayers = new Set<string>();
    const assignedRoles = new Set<string>();

    for (const cand of candidates) {
      if (!assignedPlayers.has(cand.playerId) && !assignedRoles.has(cand.roleId)) {
        newAssignments[cand.roleId] = cand.playerId;
        newFilters[cand.roleId] = cand.filters;
        
        assignedPlayers.add(cand.playerId);
        assignedRoles.add(cand.roleId);
      }
    }

    // 4. Update State
    setAssignments(newAssignments);
    setRoleFilters(newFilters);
    
    // Expand all filters so the user can see WHY this score was chosen
    const allExpanded: Record<string, boolean> = {};
    ROLES.forEach(r => allExpanded[r.id] = true);
    setExpandedFilters(allExpanded);
  };

  // --- COMPOSITION BUILDER LOGIC ---

  const COMP_DEFINITIONS = {
    ENGAGE: [
      { name: 'Opción A (3 Engage, 2 Pick)', styles: ['ENGAGE', 'ENGAGE', 'ENGAGE', 'PICK', 'PICK'] },
      { name: 'Opción B (3 Engage, 1 Protect, 1 Pick)', styles: ['ENGAGE', 'ENGAGE', 'ENGAGE', 'PROTECT', 'PICK'] }
    ],
    PICK: [
      { name: 'Opción A (3 Pick, 2 Protect)', styles: ['PICK', 'PICK', 'PICK', 'PROTECT', 'PROTECT'] },
      { name: 'Opción B (3 Pick, 2 Split)', styles: ['PICK', 'PICK', 'PICK', 'SPLIT', 'SPLIT'] },
      { name: 'Opción C (3 Pick, 1 Split, 1 Protect)', styles: ['PICK', 'PICK', 'PICK', 'SPLIT', 'PROTECT'] }
    ],
    SIEGE: [
      { name: 'Opción A (3 Siege, 2 Protect)', styles: ['SIEGE', 'SIEGE', 'SIEGE', 'PROTECT', 'PROTECT'] }
    ],
    SPLIT: [
      { name: 'Opción A (2 Split, 3 Protect)', styles: ['SPLIT', 'SPLIT', 'PROTECT', 'PROTECT', 'PROTECT'] },
      { name: 'Opción B (3 Split, 2 Protect)', styles: ['SPLIT', 'SPLIT', 'SPLIT', 'PROTECT', 'PROTECT'] },
      { name: 'Opción C (2 Split, 1 Pick, 2 Protect)', styles: ['SPLIT', 'SPLIT', 'PICK', 'PROTECT', 'PROTECT'] }
    ],
    PROTECT: [
      { name: 'Opción A (4 Protect, 1 Engage)', styles: ['PROTECT', 'PROTECT', 'PROTECT', 'PROTECT', 'ENGAGE'] },
      { name: 'Opción B (3 Protect, 1 Pick, 1 Engage)', styles: ['PROTECT', 'PROTECT', 'PROTECT', 'PICK', 'ENGAGE'] }
    ]
  };

  const getScoreForCompStyle = (playerId: string, roleId: string, compStyle: string) => {
    // Helper to find max score for a player in a role given a "Composition Style"
    // This handles the nuances (e.g. ADC Protect = Hypercarry)
    
    let targetDBStyles: string[] = [];

    switch (compStyle) {
      case 'ENGAGE':
        targetDBStyles = ['ENGAGE'];
        break;
      case 'PICK':
        targetDBStyles = ['PICKUP'];
        break;
      case 'SIEGE':
        targetDBStyles = ['SIEGE'];
        break;
      case 'SPLIT':
        targetDBStyles = ['SPLITPUSH'];
        break;
      case 'PROTECT':
        targetDBStyles = ['PROTECT'];
        break;
      default:
        targetDBStyles = ['ALL'];
    }

    let bestScore = -1;
    let bestFilters: FilterState | null = null;

    // Iterate all DB styles that map to this Comp Style
    for (const dbStyle of targetDBStyles) {
      // Also iterate Side/Allocation to find peak
      const SIDES = ['ALL', 'BLUE', 'RED'];
      const ALLOCATIONS = ['ALL', 'STRONG_SIDE', 'WEAK_SIDE', 'NEUTRAL', 'ROAMING'];

      for (const side of SIDES) {
        for (const alloc of ALLOCATIONS) {
          const currentFilters = { side, allocation: alloc, style: dbStyle };
          const stats = getPlayerRoleStats(playerId, roleId, currentFilters);
          
          if (stats && stats.score > bestScore) {
            bestScore = stats.score;
            bestFilters = currentFilters;
          }
        }
      }
    }

    return { score: bestScore, filters: bestFilters };
  };

  const getTopChampions = (playerId: string, roleId: string, filters: FilterState) => {
    if (!playerId) return [];
    const player = players.find(p => p.id === playerId);
    if (!player || !player.playerProfile) return [];

    const matches = player.playerProfile.matchParticipations.filter(m => {
      if (m.position !== roleId) return false;
      if (filters.side !== 'ALL' && m.match?.ourSide !== filters.side) return false;
      if (filters.allocation !== 'ALL' && m.laneAllocation !== filters.allocation) return false;
      if (filters.style !== 'ALL' && m.championRole !== filters.style) return false;
      return true;
    });

    const champStats: Record<string, { name: string, wins: number, games: number, kills: number, deaths: number, assists: number }> = {};

    matches.forEach(m => {
      const name = m.championName || 'Unknown';
      if (!champStats[name]) {
        champStats[name] = { name, wins: 0, games: 0, kills: 0, deaths: 0, assists: 0 };
      }
      champStats[name].games++;
      if (m.match?.result === 'WIN') champStats[name].wins++;
      champStats[name].kills += m.kills || 0;
      champStats[name].deaths += m.deaths || 0;
      champStats[name].assists += m.assists || 0;
    });

    return Object.values(champStats)
      .sort((a, b) => {
        // Sort by Games then Winrate
        if (b.games !== a.games) return b.games - a.games;
        return (b.wins / b.games) - (a.wins / a.games);
      })
      .slice(0, 3);
  };

  const buildComposition = (compType: keyof typeof COMP_DEFINITIONS) => {
    const options = COMP_DEFINITIONS[compType];
    let bestGlobalScore = -1;
    let bestAssignment: any = null;
    let bestFilters: any = null;

    // 1. Iterate Options (A, B, C...)
    for (const option of options) {
      const requiredStyles = option.styles; // e.g. ['ENGAGE', 'ENGAGE', 'ENGAGE', 'PICK', 'PICK']
      
      // 2. Generate Permutations of Styles to Roles
      // Roles are fixed order: TOP, JUNGLE, MID, ADC, SUPPORT
      // We need to assign the 5 required styles to these 5 roles.
      // Since N=5, we can generate unique permutations.
      const uniquePermutations = getUniquePermutations(requiredStyles);

      for (const stylePermutation of uniquePermutations) {
        // stylePermutation is e.g. ['ENGAGE', 'PICK', 'ENGAGE', 'PICK', 'ENGAGE']
        // corresponding to [TOP, JUNGLE, MID, ADC, SUPPORT]
        
        const currentAssignment: Record<string, string> = {};
        const currentFilters: Record<string, FilterState> = { ...roleFilters };
        const assignedPlayers = new Set<string>();
        let currentTotalScore = 0;
        let validPermutation = true;

        // 3. Greedily assign best player for each Role+Style pair
        // Note: A true optimal solution would be max flow or bipartite matching, 
        // but greedy is okay if we sort roles by scarcity or just iterate.
        // For simplicity, let's just iterate roles in order. 
        // IMPROVEMENT: Sort roles by "difficulty to fill" or just try all player permutations (too expensive).
        // Let's stick to: For each role, find best available player.
        
        // Actually, we need to ensure unique players.
        // Let's collect ALL candidates for (Role, Style) and then pick best combination.
        // Since 5 roles, 5 players, it's small.
        
        // Let's simplify: Just find the best player for each slot independently first.
        // If conflict, we have a problem.
        // Better: Backtracking or just simple greedy with "taken" set.
        
        const roleOrder = ['ADC', 'MID', 'TOP', 'JUNGLE', 'SUPPORT']; // Priority order?
        
        // Map permutation to roles
        const roleStyles: Record<string, string> = {};
        ROLES.forEach((r, i) => roleStyles[r.id] = stylePermutation[i]);

        for (const roleId of roleOrder) {
          const targetStyle = roleStyles[roleId];
          let bestPlayerId = '';
          let bestPlayerScore = -1;
          let bestPlayerFilters = null;

          for (const player of availablePlayers) {
            if (assignedPlayers.has(player.id)) continue;

            const result = getScoreForCompStyle(player.id, roleId, targetStyle);
            if (result.score > bestPlayerScore) {
              bestPlayerScore = result.score;
              bestPlayerId = player.id;
              bestPlayerFilters = result.filters;
            }
          }

          if (bestPlayerId) {
            currentAssignment[roleId] = bestPlayerId;
            if (bestPlayerFilters) currentFilters[roleId] = bestPlayerFilters;
            assignedPlayers.add(bestPlayerId);
            currentTotalScore += bestPlayerScore;
          } else {
            validPermutation = false; // Couldn't fill a role
            break;
          }
        }

        if (validPermutation && currentTotalScore > bestGlobalScore) {
          bestGlobalScore = currentTotalScore;
          bestAssignment = currentAssignment;
          bestFilters = currentFilters;
        }
      }
    }

    if (bestAssignment) {
      setAssignments(bestAssignment);
      setRoleFilters(bestFilters);
      setIsCompModalOpen(false);
      
      // Expand filters
      const allExpanded: Record<string, boolean> = {};
      ROLES.forEach(r => allExpanded[r.id] = true);
      setExpandedFilters(allExpanded);
    } else {
      alert('No se pudo armar una composición válida con los jugadores disponibles.');
    }
  };

  // Helper for permutations
  function getUniquePermutations(arr: string[]): string[][] {
    if (arr.length === 0) return [[]];
    const firstEl = arr[0];
    const rest = arr.slice(1);
    const permsWithoutFirst = getUniquePermutations(rest);
    const allPermutations: string[][] = [];

    permsWithoutFirst.forEach((perm) => {
      for (let i = 0; i <= perm.length; i++) {
        const permWithFirst = [...perm.slice(0, i), firstEl, ...perm.slice(i)];
        allPermutations.push(permWithFirst);
      }
    });

    // Remove duplicates
    const uniqueStrings = new Set(allPermutations.map(p => JSON.stringify(p)));
    return Array.from(uniqueStrings).map(s => JSON.parse(s));
  }

  const teamOverall = useMemo(() => {
    let total = 0;
    let count = 0;
    Object.entries(assignments).forEach(([role, pid]) => {
      const stats = getPlayerRoleStats(pid, role);
      if (stats && typeof stats.score === 'number') {
        total += stats.score;
        count++;
      }
    });
    return count > 0 ? Math.round(total / count) : 0;
  }, [assignments, players, roleFilters]);

  const handleSave = async () => {
    if (!saveName.trim()) return;
    setIsSaving(true);
    
    const result = await saveLineupConfiguration({
      name: saveName,
      lineupId: selectedLineupId || undefined,
      assignments,
      filters: roleFilters
    });

    setIsSaving(false);
    if (result.success) {
      setIsSaveModalOpen(false);
      setSaveName('');
      alert('Configuración guardada correctamente');
      router.refresh();
    } else {
      alert('Error al guardar la configuración');
    }
  };

  const handleLoad = (config: SavedConfig) => {
    if (confirm(`¿Cargar la configuración "${config.name}"? Se perderán los cambios actuales.`)) {
      setSelectedLineupId(config.lineupId || '');
      setAssignments(config.assignments);
      setRoleFilters(config.filters);
      setIsLoadModalOpen(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('¿Estás seguro de eliminar esta configuración?')) {
      await deleteLineupConfiguration(id);
      router.refresh();
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-140px)]">
      
      {/* Left Panel: Controls & Roster */}
      <div className="lg:col-span-4 flex flex-col gap-4 overflow-y-auto pr-2">
        
        {/* Lineup Selection */}
        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
          <label className="text-xs text-slate-400 font-bold uppercase mb-2 block">Seleccionar Alineación Base</label>
          <select 
            className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-white outline-none focus:border-blue-500"
            value={selectedLineupId}
            onChange={(e) => setSelectedLineupId(e.target.value)}
          >
            <option value="">-- Todos los Jugadores --</option>
            {lineups.map(l => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </select>
        </div>

        {/* Team Header & Save */}
        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-bold text-white">Alineación</h2>
              <p className="text-xs text-slate-400 max-w-[200px] leading-tight mt-1">
                {selectedLineupId ? 'Jugadores de la alineación seleccionada' : 'Todos los jugadores disponibles'}
              </p>
            </div>
            <div className="text-right bg-slate-950/50 px-3 py-2 rounded-lg border border-slate-800 min-w-[80px]">
              <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Media</div>
              <div className={`text-2xl font-bold ${teamOverall >= 80 ? 'text-yellow-400' : teamOverall >= 60 ? 'text-blue-400' : 'text-slate-500'}`}>
                {teamOverall}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button 
              onClick={() => setIsCompModalOpen(true)}
              className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-2 px-3 rounded-lg transition-colors shadow-lg shadow-indigo-500/20 flex justify-center items-center group relative"
              title="Armar Composición (Engage, Pick, etc.)"
            >
              <Puzzle size={18} />
              <span className="sr-only">Composición</span>
            </button>
            <button 
              onClick={findPeakPerformanceLineup}
              className="flex-1 bg-yellow-500 hover:bg-yellow-400 text-white py-2 px-3 rounded-lg transition-colors shadow-lg shadow-yellow-500/20 flex justify-center items-center"
              title="Encontrar Máximo Potencial (Ajusta Filtros)"
            >
              <Sparkles size={18} />
            </button>
            <button 
              onClick={recommendLineup}
              className="flex-1 bg-purple-600 hover:bg-purple-500 text-white py-2 px-3 rounded-lg transition-colors flex justify-center items-center"
              title="Recomendar Alineación (Filtros Actuales)"
            >
              <Wand2 size={18} />
            </button>
            
            <div className="w-px bg-slate-700 mx-1"></div>
            
            <button 
              onClick={() => setIsLoadModalOpen(true)}
              className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2 px-3 rounded-lg transition-colors flex justify-center items-center"
              title="Cargar Configuración"
            >
              <FolderOpen size={18} />
            </button>
            <button 
              onClick={() => setIsSaveModalOpen(true)}
              className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2 px-3 rounded-lg transition-colors flex justify-center items-center"
              title="Guardar Alineación"
            >
              <Save size={18} />
            </button>
          </div>
        </div>

        {/* Role Cards */}
        {ROLES.map((role) => {
          const assignedId = assignments[role.id];
          const stats = getPlayerRoleStats(assignedId, role.id);
          const player = players.find(p => p.id === assignedId);
          const isExpanded = expandedFilters[role.id];
          const filters = roleFilters[role.id];

          return (
            <div key={role.id} className="bg-slate-900 border border-slate-800 rounded-xl p-3 transition-all hover:border-slate-600">
              <div className="flex items-center gap-3 mb-2">
                <div className={`w-8 h-8 rounded flex items-center justify-center bg-slate-950 border border-slate-800 ${role.color}`}>
                  <role.icon size={16} />
                </div>
                <span className="font-bold text-slate-300 w-12">{role.label}</span>
                
                <select 
                  className="flex-1 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-sm text-white focus:ring-1 focus:ring-blue-500 outline-none"
                  value={assignedId}
                  onChange={(e) => handleAssign(role.id, e.target.value)}
                >
                  <option value="">-- Vacío --</option>
                  {availablePlayers.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>

                <button 
                  onClick={() => toggleFilter(role.id)}
                  className={`p-1 rounded hover:bg-slate-800 ${isExpanded ? 'text-blue-400' : 'text-slate-500'}`}
                  title="Filtros de Línea"
                >
                  <Filter size={16} />
                </button>
              </div>

              {/* Per-Lane Filters (Collapsible) */}
              {isExpanded && (
                <div className="mb-3 grid grid-cols-3 gap-2 bg-slate-950/30 p-2 rounded border border-slate-800/50">
                  <select 
                    className="bg-slate-900 border border-slate-700 rounded px-1 py-1 text-[10px] text-white outline-none"
                    value={filters.side}
                    onChange={(e) => updateRoleFilter(role.id, 'side', e.target.value)}
                  >
                    <option value="ALL">Lado (Todo)</option>
                    <option value="BLUE">Blue</option>
                    <option value="RED">Red</option>
                  </select>
                  <select 
                    className="bg-slate-900 border border-slate-700 rounded px-1 py-1 text-[10px] text-white outline-none"
                    value={filters.allocation}
                    onChange={(e) => updateRoleFilter(role.id, 'allocation', e.target.value)}
                  >
                    <option value="ALL">Linea(Todo)</option>
                    <option value="STRONG_SIDE">Strong</option>
                    <option value="WEAK_SIDE">Weak</option>
                    <option value="NEUTRAL">Neutral</option>
                    <option value="ROAMING">Roaming</option>
                  </select>
                  <select 
                    className="bg-slate-900 border border-slate-700 rounded px-1 py-1 text-[10px] text-white outline-none"
                    value={filters.style}
                    onChange={(e) => updateRoleFilter(role.id, 'style', e.target.value)}
                  >
                    <option value="ALL">Comp.(Todo)</option>
                    <option value="ENGAGE">Engage</option>
                    <option value="PROTECT">Protect</option>
                    <option value="SIEGE">Siege</option>
                    <option value="SPLITPUSH">Split</option>
                    <option value="PICKUP">Pickup</option>
                  </select>
                </div>
              )}

              {/* Stats Strip */}
              <div className="flex items-center justify-between bg-slate-950/50 rounded px-3 py-2">
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-500 uppercase">OVR</span>
                  <span className={`text-xl font-black ${
                    !stats || stats.score === '-' ? 'text-slate-600' :
                    (stats.score as number) >= 90 ? 'text-yellow-400' :
                    (stats.score as number) >= 80 ? 'text-green-400' :
                    (stats.score as number) >= 70 ? 'text-blue-400' : 'text-slate-300'
                  }`}>
                    {stats ? stats.score : '-'}
                  </span>
                </div>
                
                <div className="h-8 w-px bg-slate-800 mx-2"></div>

                <div className="flex gap-4 text-center">
                  <div>
                    <div className="text-[10px] text-slate-500">WR</div>
                    <div className={`font-bold text-sm ${stats && stats.winrate >= 50 ? 'text-green-400' : 'text-red-400'}`}>
                      {stats ? `${stats.winrate}%` : '-'}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500">Games</div>
                    <div className="font-bold text-sm text-white">
                      {stats ? stats.matches : '-'}
                    </div>
                  </div>
                </div>

                {!stats?.isReliable && assignedId && (
                  <div className="ml-2 text-yellow-600" title="Pocas partidas registradas en este rol">
                    <AlertCircle size={16} />
                  </div>
                )}
              </div>

              {/* Recommended Champions */}
              {assignedId && (
                <div className="mt-2 flex gap-2 justify-center">
                  {getTopChampions(assignedId, role.id, filters).map((champ, idx) => (
                    <div key={idx} className="group relative">
                      <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center overflow-hidden cursor-help">
                        {/* Placeholder for Champion Icon - using first letter if no image */}
                        <span className="text-xs font-bold text-slate-400">{champ.name.substring(0, 2)}</span>
                      </div>
                      {/* Tooltip */}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-slate-900 border border-slate-700 p-2 rounded shadow-xl z-50 w-32 text-center">
                        <div className="font-bold text-white text-xs mb-1">{champ.name}</div>
                        <div className="text-[10px] text-slate-400">
                          <span className="text-green-400">{Math.round((champ.wins / champ.games) * 100)}% WR</span>
                          <span className="mx-1">•</span>
                          <span>{champ.games} G</span>
                        </div>
                        <div className="text-[10px] text-slate-500 mt-1">
                          KDA: {((champ.kills + champ.assists) / Math.max(1, champ.deaths)).toFixed(1)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Center Panel: 2D Map */}
      <div className="lg:col-span-8 bg-[#050505] rounded-xl border border-slate-800 relative flex items-center justify-center p-4 overflow-hidden">
        <div className="relative w-full max-w-[600px] aspect-square">
          {/* Map Image */}
          <img 
            src="/MapExample.png" 
            alt="Summoner's Rift" 
            className="w-full h-full object-contain drop-shadow-2xl opacity-80"
          />

          {/* Player Nodes */}
          {ROLES.map((role) => {
            const assignedId = assignments[role.id];
            const stats = getPlayerRoleStats(assignedId, role.id);
            const player = players.find(p => p.id === assignedId);

            return (
              <div 
                key={role.id}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group"
                style={{ left: `${role.x}%`, top: `${role.y}%` }}
              >
                {/* Icon Circle */}
                <div className={`
                  w-12 h-12 rounded-full flex items-center justify-center border-2 shadow-xl z-10 transition-transform duration-200 group-hover:scale-110 relative
                  ${assignedId ? 'bg-slate-800 border-blue-500' : 'bg-slate-900/80 border-slate-700'}
                `}>
                  <role.icon size={20} className={assignedId ? role.color : 'text-slate-500'} />
                  
                  {/* Allocation Badge */}
                  {roleFilters[role.id].allocation === 'STRONG_SIDE' && (
                    <div className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1 border border-slate-900 shadow-sm" title="Strong Side">
                      <Flame size={10} className="text-white fill-current" />
                    </div>
                  )}
                  {roleFilters[role.id].allocation === 'WEAK_SIDE' && (
                    <div className="absolute -top-2 -right-2 bg-blue-500 rounded-full p-1 border border-slate-900 shadow-sm" title="Weak Side">
                      <Shield size={10} className="text-white fill-current" />
                    </div>
                  )}
                  {roleFilters[role.id].allocation === 'ROAMING' && (
                    <div className="absolute -top-2 -right-2 bg-green-500 rounded-full p-1 border border-slate-900 shadow-sm" title="Roaming">
                      <Footprints size={10} className="text-white fill-current" />
                    </div>
                  )}
                  {roleFilters[role.id].allocation === 'NEUTRAL' && (
                    <div className="absolute -top-2 -right-2 bg-slate-500 rounded-full p-1 border border-slate-900 shadow-sm" title="Neutral">
                      <Target size={10} className="text-white fill-current" />
                    </div>
                  )}

                  {/* Comp Style Badge (Bottom Right - 4 o'clock) */}
                  {roleFilters[role.id].style === 'ENGAGE' && (
                    <div className="absolute bottom-0 -right-2 bg-orange-600 rounded-full p-1 border border-slate-900 shadow-sm" title="Engage">
                      <Sword size={10} className="text-white fill-current" />
                    </div>
                  )}
                  {roleFilters[role.id].style === 'PICKUP' && (
                    <div className="absolute bottom-0 -right-2 bg-purple-600 rounded-full p-1 border border-slate-900 shadow-sm" title="Pick Up">
                      <Crosshair size={10} className="text-white fill-current" />
                    </div>
                  )}
                  {roleFilters[role.id].style === 'SIEGE' && (
                    <div className="absolute bottom-0 -right-2 bg-yellow-600 rounded-full p-1 border border-slate-900 shadow-sm" title="Siege">
                      <Zap size={10} className="text-white fill-current" />
                    </div>
                  )}
                  {roleFilters[role.id].style === 'SPLITPUSH' && (
                    <div className="absolute bottom-0 -right-2 bg-teal-600 rounded-full p-1 border border-slate-900 shadow-sm" title="Split Push">
                      <Map size={10} className="text-white fill-current" />
                    </div>
                  )}
                  {roleFilters[role.id].style === 'PROTECT' && (
                    <div className="absolute bottom-0 -right-2 bg-pink-600 rounded-full p-1 border border-slate-900 shadow-sm" title="Protect">
                      <Heart size={10} className="text-white fill-current" />
                    </div>
                  )}
                </div>

                {/* Player Card on Map */}
                {player && stats && (
                  <div className="absolute top-10 z-20 bg-slate-900/90 backdrop-blur border border-slate-700 rounded-lg p-2 shadow-2xl min-w-[100px] text-center mt-2">
                    <div className="text-xs font-bold text-white truncate max-w-[100px]">{player.name}</div>
                    <div className="flex justify-center items-center gap-1 mt-1">
                      <span className={`text-lg font-black ${
                        (stats.score as number) >= 90 ? 'text-yellow-400' :
                        (stats.score as number) >= 80 ? 'text-green-400' : 'text-slate-300'
                      }`}>
                        {stats.score}
                      </span>
                      <span className="text-[10px] text-slate-500">OVR</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Comp Builder Modal */}
      {isCompModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-800">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Puzzle className="text-indigo-500" />
                Armar Composición
              </h2>
              <p className="text-sm text-slate-400 mt-1">
                Selecciona un estilo de juego y el sistema encontrará la mejor alineación balanceada.
              </p>
            </div>
            <div className="p-6 grid grid-cols-1 gap-3">
              <button 
                onClick={() => buildComposition('ENGAGE')}
                className="flex items-center justify-between p-4 bg-slate-800 hover:bg-indigo-600/20 hover:border-indigo-500 border border-slate-700 rounded-lg transition-all group"
              >
                <div className="text-left">
                  <div className="font-bold text-white group-hover:text-indigo-400">Engage / Teamfight</div>
                  <div className="text-xs text-slate-400">Iniciación dura y peleas grupales.</div>
                </div>
                <Sword size={20} className="text-slate-500 group-hover:text-indigo-400" />
              </button>

              <button 
                onClick={() => buildComposition('PICK')}
                className="flex items-center justify-between p-4 bg-slate-800 hover:bg-indigo-600/20 hover:border-indigo-500 border border-slate-700 rounded-lg transition-all group"
              >
                <div className="text-left">
                  <div className="font-bold text-white group-hover:text-indigo-400">Pick Up / Catch</div>
                  <div className="text-xs text-slate-400">Cazar enemigos aislados y burst.</div>
                </div>
                <Crosshair size={20} className="text-slate-500 group-hover:text-indigo-400" />
              </button>

              <button 
                onClick={() => buildComposition('SIEGE')}
                className="flex items-center justify-between p-4 bg-slate-800 hover:bg-indigo-600/20 hover:border-indigo-500 border border-slate-700 rounded-lg transition-all group"
              >
                <div className="text-left">
                  <div className="font-bold text-white group-hover:text-indigo-400">Siege / Poke</div>
                  <div className="text-xs text-slate-400">Desgaste a distancia y control de zona.</div>
                </div>
                <Zap size={20} className="text-slate-500 group-hover:text-indigo-400" />
              </button>

              <button 
                onClick={() => buildComposition('SPLIT')}
                className="flex items-center justify-between p-4 bg-slate-800 hover:bg-indigo-600/20 hover:border-indigo-500 border border-slate-700 rounded-lg transition-all group"
              >
                <div className="text-left">
                  <div className="font-bold text-white group-hover:text-indigo-400">Split Push / 1-3-1</div>
                  <div className="text-xs text-slate-400">Presión dividida en líneas laterales.</div>
                </div>
                <Map size={20} className="text-slate-500 group-hover:text-indigo-400" />
              </button>

              <button 
                onClick={() => buildComposition('PROTECT')}
                className="flex items-center justify-between p-4 bg-slate-800 hover:bg-indigo-600/20 hover:border-indigo-500 border border-slate-700 rounded-lg transition-all group"
              >
                <div className="text-left">
                  <div className="font-bold text-white group-hover:text-indigo-400">Protect the Carry</div>
                  <div className="text-xs text-slate-400">Jugar alrededor de un Hyper Carry.</div>
                </div>
                <Shield size={20} className="text-slate-500 group-hover:text-indigo-400" />
              </button>
            </div>
            <div className="p-4 border-t border-slate-800 flex justify-end">
              <button 
                onClick={() => setIsCompModalOpen(false)}
                className="text-slate-400 hover:text-white px-4 py-2"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Save Modal */}
      {isSaveModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-white mb-4">Guardar Alineación</h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm text-slate-400 block mb-1">Nombre de la Alineación</label>
                <input 
                  type="text" 
                  className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-white outline-none focus:border-blue-500"
                  placeholder="Ej: Composición Final vs Team X"
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                />
              </div>

              <div className="bg-slate-950 p-3 rounded border border-slate-800 text-sm text-slate-400">
                <p>Se guardará la siguiente configuración:</p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Alineación Base: {selectedLineupId ? lineups.find(l => l.id === selectedLineupId)?.name : 'Ninguna'}</li>
                  <li>Jugadores asignados: {Object.values(assignments).filter(Boolean).length}/5</li>
                  <li>Filtros personalizados por línea</li>
                </ul>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button 
                onClick={() => setIsSaveModalOpen(false)}
                className="px-4 py-2 text-slate-300 hover:text-white"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSave}
                disabled={!saveName.trim() || isSaving}
                className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg flex items-center gap-2"
              >
                {isSaving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Load Modal */}
      {isLoadModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">Cargar Configuración</h3>
              <button onClick={() => setIsLoadModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-2 pr-2">
              {savedConfigs.length === 0 ? (
                <div className="text-center text-slate-500 py-8">
                  No hay configuraciones guardadas.
                </div>
              ) : (
                savedConfigs.map(config => (
                  <div 
                    key={config.id}
                    className="bg-slate-950 border border-slate-800 rounded-lg p-4 hover:border-blue-500 transition-colors cursor-pointer group"
                    onClick={() => handleLoad(config)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-white group-hover:text-blue-400 transition-colors">{config.name}</h4>
                        <div className="text-xs text-slate-400 mt-1 flex gap-3">
                          <span>📅 {new Date(config.createdAt).toLocaleDateString()}</span>
                          <span>👥 {config.lineup?.name || 'Sin alineación base'}</span>
                        </div>
                      </div>
                      <button 
                        onClick={(e) => handleDelete(config.id, e)}
                        className="text-slate-600 hover:text-red-400 p-2"
                        title="Eliminar"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}