'use client';

import { useState, useMemo } from 'react';
import { Shield, Sword, Zap, Crosshair, Heart, AlertCircle, Filter, Save, FolderOpen, Trash2 } from 'lucide-react';
import { saveLineupConfiguration, deleteLineupConfiguration } from '@/app/actions/lineup-actions';
import { useRouter } from 'next/navigation';

interface MatchParticipant {
  position: string;
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

  const getPlayerRoleStats = (playerId: string, roleId: string) => {
    if (!playerId) return null;
    const player = players.find(p => p.id === playerId);
    if (!player || !player.playerProfile) return null;

    const filters = roleFilters[roleId];

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
    });

    // 3. Calculate Metrics
    const winRate = (wins / totalMatches) * 100;
    const kda = totalDeaths > 0 ? (totalKills + totalAssists) / totalDeaths : (totalKills + totalAssists);
    const csPerMin = totalMinutes > 0 ? totalCS / totalMinutes : 0;
    const wardsPerMin = totalMinutes > 0 ? totalWards / totalMinutes : 0;

    // 4. Apply FIFA Card Formula (0-10 Scale per stat)
    const wrScore = Math.min(10, (winRate / 70) * 10);
    const kdaScore = Math.min(10, (kda / 5.0) * 10);
    const csScore = Math.min(10, (csPerMin / 10.0) * 10);
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
        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-white">Alineación</h2>
            <p className="text-xs text-slate-400">
              {selectedLineupId ? 'Jugadores de la alineación seleccionada' : 'Todos los jugadores disponibles'}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-xs text-slate-400 uppercase font-bold">Media OVR</div>
              <div className={`text-3xl font-bold ${teamOverall >= 80 ? 'text-yellow-400' : teamOverall >= 60 ? 'text-blue-400' : 'text-slate-500'}`}>
                {teamOverall}
              </div>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => setIsLoadModalOpen(true)}
                className="bg-slate-700 hover:bg-slate-600 text-white p-2 rounded-lg transition-colors"
                title="Cargar Configuración"
              >
                <FolderOpen size={20} />
              </button>
              <button 
                onClick={() => setIsSaveModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-500 text-white p-2 rounded-lg transition-colors"
                title="Guardar Alineación"
              >
                <Save size={20} />
              </button>
            </div>
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
                    <option value="ALL">Lado (Todos)</option>
                    <option value="BLUE">Blue</option>
                    <option value="RED">Red</option>
                  </select>
                  <select 
                    className="bg-slate-900 border border-slate-700 rounded px-1 py-1 text-[10px] text-white outline-none"
                    value={filters.allocation}
                    onChange={(e) => updateRoleFilter(role.id, 'allocation', e.target.value)}
                  >
                    <option value="ALL">Recursos</option>
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
                    <option value="ALL">Estilo</option>
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
                  w-12 h-12 rounded-full flex items-center justify-center border-2 shadow-xl z-10 transition-transform duration-200 group-hover:scale-110
                  ${assignedId ? 'bg-slate-800 border-blue-500' : 'bg-slate-900/80 border-slate-700'}
                `}>
                  <role.icon size={20} className={assignedId ? role.color : 'text-slate-500'} />
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