"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Swords, Shield, Sword, Zap, Crosshair, Heart, Save, Loader2, AlertCircle, Trash2, BarChart2 } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ChampionSelect } from "@/components/ChampionSelect";
import { LogViewer } from "@/components/LogViewer";

// Types
type MatchWithDetails = any; // We will define proper types later or use inferred ones
type RosterPlayer = any;

interface ScrimDetailClientProps {
  match: MatchWithDetails;
  roster: RosterPlayer[];
  userRole: string;
}

const ROLES = ["TOP", "JUNGLE", "MID", "ADC", "SUPPORT"];
const ROLE_ICONS: Record<string, any> = {
  TOP: Shield,
  JUNGLE: Sword,
  MID: Zap,
  ADC: Crosshair,
  SUPPORT: Heart,
};

const LANE_ALLOCATIONS = [
  { value: "NEUTRAL", label: "Neutral" },
  { value: "STRONG_SIDE", label: "Strong Side" },
  { value: "WEAK_SIDE", label: "Weak Side" },
  { value: "ROAMING", label: "Roaming" },
];

const CHAMPION_ROLES = [
  { value: "ENGAGE", label: "Engage" },
  { value: "PICKUP", label: "Pick" },
  { value: "PROTECT", label: "Protect" },
  { value: "SIEGE", label: "Siege" },
  { value: "SPLITPUSH", label: "Split" },
];

export function ScrimDetailClient({ match, roster, userRole }: ScrimDetailClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"DRAFT" | "GAME" | "ANALYSIS" | "STATS" | "LOGS">("DRAFT");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [refreshLogs, setRefreshLogs] = useState(0);

  // Local State for Draft
  const [blueBans, setBlueBans] = useState<string[]>(match.blueBans || ["", "", "", "", ""]);
  const [redBans, setRedBans] = useState<string[]>(match.redBans || ["", "", "", "", ""]);
  const [gameVersion, setGameVersion] = useState(match.gameVersion || "");
  
  // Local State for Participants (Simplified for now)
  // We need to map existing participants to roles
  const getParticipantByRole = (role: string, isEnemy: boolean) => {
    return match.participants.find((p: any) => p.position === role && p.isEnemy === isEnemy);
  };

  const [ourPicks, setOurPicks] = useState<Record<string, { champion: string, playerId: string }>>(() => {
    const picks: any = {};
    ROLES.forEach(role => {
      const p = getParticipantByRole(role, false);
      picks[role] = {
        champion: p?.championName || "",
        playerId: p?.playerProfile?.id || ""
      };
    });
    return picks;
  });

  const [playerStats, setPlayerStats] = useState<Record<string, any>>(() => {
    const stats: any = {};
    ROLES.forEach(role => {
      const p = getParticipantByRole(role, false);
      stats[role] = {
        kills: p?.kills || 0,
        deaths: p?.deaths || 0,
        assists: p?.assists || 0,
        cs: p?.cs || 0,
        visionWards: p?.visionWards || 0,
        wardsPlaced: p?.wardsPlaced || 0,
        laneOpponent: p?.laneOpponent || "",
        laneAllocation: p?.laneAllocation || "NEUTRAL",
        championRole: p?.championRole || "ENGAGE",
        microRating: p?.microRating || 5,
        macroRating: p?.macroRating || 5,
        mentalRating: p?.mentalRating || 5,
        teamfightRating: p?.teamfightRating || 5,
        communicationRating: p?.communicationRating || 5,
        positioningRating: p?.positioningRating || 5,
        laningRating: p?.laningRating || 5,
        notes: p?.matchupNotes || "", // Fixed mapping from API/Schema
      };
    });
    return stats;
  });

  const [enemyPicks, setEnemyPicks] = useState<Record<string, string>>(() => {
    const picks: any = {};
    ROLES.forEach(role => {
      const p = getParticipantByRole(role, true);
      // If no enemy participant found, try to use laneOpponent from our player stats if available
      const ourPlayer = getParticipantByRole(role, false);
      picks[role] = p?.championName || ourPlayer?.laneOpponent || "";
    });
    return picks;
  });

  // Sync helper
  const updateEnemyPick = (role: string, champion: string) => {
    setEnemyPicks(prev => ({ ...prev, [role]: champion }));
    setPlayerStats(prev => ({
      ...prev,
      [role]: { ...prev[role], laneOpponent: champion }
    }));
  };

  // Local State for Result
  const [result, setResult] = useState(match.result || "");
  const [duration, setDuration] = useState(match.duration ? Math.floor(match.duration / 60).toString() : "");
  const [vodLink, setVodLink] = useState(match.vodLink || "");

  // Local State for Analysis
  const [analysis, setAnalysis] = useState({
    winCondition: match.analysis?.winCondition || "",
    earlyNotes: match.analysis?.earlyNotes || "",
    midNotes: match.analysis?.midNotes || "",
    lateNotes: match.analysis?.lateNotes || "",
    keyMistakes: match.analysis?.keyMistakes || "",
  });

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const payload = {
        blueBans,
        redBans,
        ourPicks,
        enemyPicks,
        result,
        duration: duration ? parseInt(duration) * 60 : null,
        vodLink,
        analysis,
        gameVersion,
        playerStats
      };

      const res = await fetch(`/api/matches/${match.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to save");
      alert("Guardado correctamente");
      setRefreshLogs(prev => prev + 1);
      router.refresh();
    } catch (error) {
      console.error(error);
      alert("Error al guardar");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("¿Estás seguro de que quieres eliminar este Scrim? Esta acción no se puede deshacer.")) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/matches/${match.id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete");
      
      router.push("/scrims");
      router.refresh();
    } catch (error) {
      console.error(error);
      alert("Error al eliminar el scrim");
      setIsDeleting(false);
    }
  };

  const isBlueSide = match.ourSide === "BLUE";

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <Link 
            href="/scrims" 
            className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={20} />
            Volver a Scrims
          </Link>
          
          <div className="flex gap-3">
            {(userRole === "ADMIN" || userRole === "COACH") && (
              <button
                onClick={handleDelete}
                disabled={isSaving || isDeleting}
                className="flex items-center gap-2 bg-red-600/20 hover:bg-red-600/40 text-red-400 border border-red-600/50 px-4 py-2 rounded-lg font-bold transition-colors"
              >
                {isDeleting ? <Loader2 className="animate-spin" size={20} /> : <Trash2 size={20} />}
                Eliminar
              </button>
            )}
            {(userRole === "ADMIN" || userRole === "COACH" || userRole === "PLAYER") && (
              <button
                onClick={handleSave}
                disabled={isSaving || isDeleting}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-bold transition-colors"
              >
                {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                Guardar Cambios
              </button>
            )}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-blue-400">NUESTRO EQUIPO</h2>
              <span className={`text-xs font-bold px-2 py-1 rounded ${isBlueSide ? 'bg-blue-500/20 text-blue-400' : 'bg-red-500/20 text-red-400'}`}>
                {match.ourSide} SIDE
              </span>
            </div>
            <div className="text-4xl font-bold text-slate-600">VS</div>
            <div className="text-center">
              <h2 className="text-2xl font-bold text-red-400">{match.enemyTeam?.name}</h2>
              <span className={`text-xs font-bold px-2 py-1 rounded ${!isBlueSide ? 'bg-blue-500/20 text-blue-400' : 'bg-red-500/20 text-red-400'}`}>
                {!isBlueSide ? 'BLUE' : 'RED'} SIDE
              </span>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-slate-400 text-sm mb-1">
              {format(new Date(match.date), "PPP p", { locale: es })}
            </div>
            <div className="flex items-center justify-end gap-2">
              <input 
                type="text" 
                placeholder="Patch (e.g. 14.2)" 
                className="w-24 bg-slate-950 border border-slate-800 rounded px-2 py-1 text-sm focus:border-blue-500 outline-none text-center"
                value={gameVersion}
                onChange={(e) => setGameVersion(e.target.value)}
              />
              <select 
                className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-sm focus:border-blue-500 outline-none"
                value={result}
                onChange={(e) => setResult(e.target.value)}
              >
                <option value="">- Resultado -</option>
                <option value="WIN">VICTORIA</option>
                <option value="LOSS">DERROTA</option>
                <option value="REMAKE">REMAKE</option>
              </select>
              <input 
                type="number" 
                placeholder="Min" 
                className="w-16 bg-slate-950 border border-slate-800 rounded px-2 py-1 text-sm focus:border-blue-500 outline-none text-center"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
              />
              <span className="text-slate-500 text-sm">min</span>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b border-slate-800 pb-1">
        <button
          onClick={() => setActiveTab("DRAFT")}
          className={`pb-3 px-2 font-medium transition-colors relative ${activeTab === "DRAFT" ? "text-blue-500" : "text-slate-400 hover:text-slate-200"}`}
        >
          Fase de Draft
          {activeTab === "DRAFT" && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-500 rounded-t-full" />}
        </button>
        <button
          onClick={() => setActiveTab("STATS")}
          className={`pb-3 px-2 font-medium transition-colors relative ${activeTab === "STATS" ? "text-green-500" : "text-slate-400 hover:text-slate-200"}`}
        >
          Estadísticas
          {activeTab === "STATS" && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-green-500 rounded-t-full" />}
        </button>
        <button
          onClick={() => setActiveTab("ANALYSIS")}
          className={`pb-3 px-2 font-medium transition-colors relative ${activeTab === "ANALYSIS" ? "text-purple-500" : "text-slate-400 hover:text-slate-200"}`}
        >
          Análisis & Notas
          {activeTab === "ANALYSIS" && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-purple-500 rounded-t-full" />}
        </button>
        <button
          onClick={() => setActiveTab("LOGS")}
          className={`pb-3 px-2 font-medium transition-colors relative ${activeTab === "LOGS" ? "text-orange-500" : "text-slate-400 hover:text-slate-200"}`}
        >
          Historial
          {activeTab === "LOGS" && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-orange-500 rounded-t-full" />}
        </button>
      </div>

      {/* Content */}
      <div className="space-y-6">
        
        {/* DRAFT TAB */}
        {activeTab === "DRAFT" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Our Team Draft */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Shield className="text-blue-500" size={20} />
                Nuestro Draft ({match.ourSide})
              </h3>
              
              {/* Bans */}
              <div className="mb-6">
                <label className="text-xs text-slate-500 uppercase font-bold mb-2 block">Bans</label>
                <div className="flex gap-2">
                  {(isBlueSide ? blueBans : redBans).map((ban, idx) => (
                    <ChampionSelect
                      key={`our-ban-${idx}`}
                      placeholder={`Ban ${idx + 1}`}
                      className="w-full"
                      value={isBlueSide ? blueBans[idx] : redBans[idx]}
                      onChange={(val) => {
                        const newBans = [...(isBlueSide ? blueBans : redBans)];
                        newBans[idx] = val;
                        isBlueSide ? setBlueBans(newBans) : setRedBans(newBans);
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Picks */}
              <div className="space-y-3">
                {ROLES.map((role) => {
                  const Icon = ROLE_ICONS[role];
                  return (
                    <div key={`our-${role}`} className="flex items-center gap-3 bg-slate-950 p-3 rounded-lg border border-slate-800">
                      <div className="p-2 bg-slate-900 rounded text-slate-500">
                        <Icon size={16} />
                      </div>
                      <div className="flex-1 grid grid-cols-2 gap-2">
                        <select
                          className="bg-slate-900 border border-slate-800 rounded px-2 py-1 text-sm focus:border-blue-500 outline-none"
                          value={ourPicks[role]?.playerId}
                          onChange={(e) => setOurPicks({
                            ...ourPicks,
                            [role]: { ...ourPicks[role], playerId: e.target.value }
                          })}
                        >
                          <option value="">- Jugador -</option>
                          {roster.map(p => (
                            <option key={p.id} value={p.playerProfile?.id || ""}>{p.name}</option>
                          ))}
                        </select>
                        <ChampionSelect
                          placeholder="Campeón"
                          className="w-full"
                          value={ourPicks[role]?.champion}
                          onChange={(val) => setOurPicks({
                            ...ourPicks,
                            [role]: { ...ourPicks[role], champion: val }
                          })}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Enemy Team Draft */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Swords className="text-red-500" size={20} />
                Draft Rival ({!isBlueSide ? 'BLUE' : 'RED'})
              </h3>

              {/* Bans */}
              <div className="mb-6">
                <label className="text-xs text-slate-500 uppercase font-bold mb-2 block">Bans</label>
                <div className="flex gap-2">
                  {(!isBlueSide ? blueBans : redBans).map((ban, idx) => (
                    <ChampionSelect
                      key={`enemy-ban-${idx}`}
                      placeholder={`Ban ${idx + 1}`}
                      className="w-full"
                      value={!isBlueSide ? blueBans[idx] : redBans[idx]}
                      onChange={(val) => {
                        const newBans = [...(!isBlueSide ? blueBans : redBans)];
                        newBans[idx] = val;
                        !isBlueSide ? setBlueBans(newBans) : setRedBans(newBans);
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Picks */}
              <div className="space-y-3">
                {ROLES.map((role) => {
                  const Icon = ROLE_ICONS[role];
                  return (
                    <div key={`enemy-${role}`} className="flex items-center gap-3 bg-slate-950 p-3 rounded-lg border border-slate-800">
                      <div className="p-2 bg-slate-900 rounded text-slate-500">
                        <Icon size={16} />
                      </div>
                      <div className="flex-1">
                        <ChampionSelect
                          placeholder="Campeón Rival"
                          className="w-full"
                          value={enemyPicks[role]}
                          onChange={(val) => updateEnemyPick(role, val)}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* STATS TAB */}
        {activeTab === "STATS" && (
          <div className="space-y-6">
            {ROLES.map((role) => {
              const Icon = ROLE_ICONS[role];
              const player = roster.find(p => p.playerProfile?.id === ourPicks[role]?.playerId);
              const stats = playerStats[role];

              return (
                <div key={`stats-${role}`} className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
                  <div className="flex items-center gap-4 mb-6 border-b border-slate-800 pb-4">
                    <div className="p-3 bg-slate-900 rounded-lg text-blue-400">
                      <Icon size={24} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">{player?.name || "Sin Asignar"}</h3>
                      <div className="text-sm text-slate-400 flex items-center gap-2">
                        <span className="font-bold text-blue-400">{role}</span>
                        <span>•</span>
                        <span>{ourPicks[role]?.champion || "No Champion"}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Column 1: Basic Stats & Setup */}
                    <div className="space-y-6">
                      <div>
                        <label className="text-xs text-slate-500 uppercase font-bold mb-3 block">KDA & Farm</label>
                        <div className="grid grid-cols-4 gap-2">
                          <div>
                            <label className="text-[10px] text-slate-500 mb-1 block text-center">Kills</label>
                            <input
                              type="number"
                              className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-2 text-center focus:border-blue-500 outline-none"
                              value={stats.kills}
                              onFocus={(e) => e.target.select()}
                              onChange={(e) => setPlayerStats({ ...playerStats, [role]: { ...stats, kills: parseInt(e.target.value) || 0 } })}
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-slate-500 mb-1 block text-center">Deaths</label>
                            <input
                              type="number"
                              className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-2 text-center focus:border-red-500 outline-none"
                              value={stats.deaths}
                              onFocus={(e) => e.target.select()}
                              onChange={(e) => setPlayerStats({ ...playerStats, [role]: { ...stats, deaths: parseInt(e.target.value) || 0 } })}
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-slate-500 mb-1 block text-center">Assists</label>
                            <input
                              type="number"
                              className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-2 text-center focus:border-blue-500 outline-none"
                              value={stats.assists}
                              onFocus={(e) => e.target.select()}
                              onChange={(e) => setPlayerStats({ ...playerStats, [role]: { ...stats, assists: parseInt(e.target.value) || 0 } })}
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-slate-500 mb-1 block text-center">CS</label>
                            <input
                              type="number"
                              className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-2 text-center focus:border-yellow-500 outline-none"
                              value={stats.cs}
                              onFocus={(e) => e.target.select()}
                              onChange={(e) => setPlayerStats({ ...playerStats, [role]: { ...stats, cs: parseInt(e.target.value) || 0 } })}
                            />
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="text-xs text-slate-500 uppercase font-bold mb-3 block">Visión</label>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-[10px] text-slate-500 mb-1 block">Pink Wards</label>
                            <input
                              type="number"
                              className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-2 focus:border-pink-500 outline-none"
                              value={stats.visionWards}
                              onFocus={(e) => e.target.select()}
                              onChange={(e) => setPlayerStats({ ...playerStats, [role]: { ...stats, visionWards: parseInt(e.target.value) || 0 } })}
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-slate-500 mb-1 block">Wards Placed</label>
                            <input
                              type="number"
                              className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-2 focus:border-green-500 outline-none"
                              value={stats.wardsPlaced}
                              onFocus={(e) => e.target.select()}
                              onChange={(e) => setPlayerStats({ ...playerStats, [role]: { ...stats, wardsPlaced: parseInt(e.target.value) || 0 } })}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Column 2: Matchup & Role */}
                    <div className="space-y-6">
                      <div>
                        <label className="text-xs text-slate-500 uppercase font-bold mb-3 block">Matchup & Rol</label>
                        <div className="space-y-3">
                          <div>
                            <label className="text-[10px] text-slate-500 mb-1 block">Lane Opponent</label>
                            <ChampionSelect
                              placeholder="Campeón Rival en Línea"
                              className="w-full"
                              value={stats.laneOpponent}
                              onChange={(val) => {
                                setPlayerStats(prev => ({ ...prev, [role]: { ...prev[role], laneOpponent: val } }));
                                setEnemyPicks(prev => ({ ...prev, [role]: val }));
                              }}
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-[10px] text-slate-500 mb-1 block">Allocation</label>
                              <select
                                className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-2 text-sm focus:border-blue-500 outline-none"
                                value={stats.laneAllocation}
                                onChange={(e) => setPlayerStats({ ...playerStats, [role]: { ...stats, laneAllocation: e.target.value } })}
                              >
                                {LANE_ALLOCATIONS.map(opt => (
                                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="text-[10px] text-slate-500 mb-1 block">Comp Style</label>
                              <select
                                className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-2 text-sm focus:border-blue-500 outline-none"
                                value={stats.championRole}
                                onChange={(e) => setPlayerStats({ ...playerStats, [role]: { ...stats, championRole: e.target.value } })}
                              >
                                {CHAMPION_ROLES.map(opt => (
                                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="text-xs text-slate-500 uppercase font-bold mb-3 block">Notas Individuales</label>
                        <textarea
                          className="w-full h-24 bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm focus:border-blue-500 outline-none resize-none"
                          placeholder="Notas específicas sobre el desempeño..."
                          value={stats.notes}
                          onChange={(e) => setPlayerStats({ ...playerStats, [role]: { ...stats, notes: e.target.value } })}
                        />
                      </div>
                    </div>

                    {/* Column 3: Ratings */}
                    <div>
                      <label className="text-xs text-slate-500 uppercase font-bold mb-3 block">Evaluación (1-10)</label>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
                        {[
                          { key: "laningRating", label: "Laning Phase" },
                          { key: "microRating", label: "Micro / Mechanics" },
                          { key: "macroRating", label: "Macro Game" },
                          { key: "positioningRating", label: "Positioning" },
                          { key: "teamfightRating", label: "Teamfighting" },
                          { key: "communicationRating", label: "Communication" },
                          { key: "mentalRating", label: "Mental" },
                        ].map((rating) => (
                          <div key={rating.key}>
                            <label className="text-[10px] text-slate-400 mb-1 block flex justify-between">
                              {rating.label}
                              <span className={`font-bold ${stats[rating.key] >= 8 ? 'text-green-400' : stats[rating.key] <= 4 ? 'text-red-400' : 'text-yellow-400'}`}>
                                {stats[rating.key]}
                              </span>
                            </label>
                            <input
                              type="range"
                              min="1"
                              max="10"
                              step="0.5"
                              className="w-full accent-blue-500 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                              value={stats[rating.key]}
                              onChange={(e) => setPlayerStats({ ...playerStats, [role]: { ...stats, [rating.key]: parseFloat(e.target.value) } })}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ANALYSIS TAB */}
        {activeTab === "ANALYSIS" && (
          <div className="grid grid-cols-1 gap-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <h3 className="text-lg font-bold mb-4 text-purple-400">Condiciones de Victoria & Errores</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Win Condition (Plan de Juego)</label>
                  <textarea
                    className="w-full h-32 bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm focus:border-purple-500 outline-none resize-none"
                    placeholder="¿Cómo debíamos ganar esta partida?"
                    value={analysis.winCondition}
                    onChange={(e) => setAnalysis({ ...analysis, winCondition: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Errores Clave</label>
                  <textarea
                    className="w-full h-32 bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm focus:border-red-500 outline-none resize-none"
                    placeholder="¿Qué salió mal?"
                    value={analysis.keyMistakes}
                    onChange={(e) => setAnalysis({ ...analysis, keyMistakes: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <h3 className="text-lg font-bold mb-4 text-blue-400">Notas por Fase de Juego</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Early Game (0-15m)</label>
                  <textarea
                    className="w-full h-48 bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm focus:border-blue-500 outline-none resize-none"
                    placeholder="Laning phase, primeros objetivos..."
                    value={analysis.earlyNotes}
                    onChange={(e) => setAnalysis({ ...analysis, earlyNotes: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Mid Game (15-25m)</label>
                  <textarea
                    className="w-full h-48 bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm focus:border-blue-500 outline-none resize-none"
                    placeholder="Rotaciones, control de mapa..."
                    value={analysis.midNotes}
                    onChange={(e) => setAnalysis({ ...analysis, midNotes: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Late Game (25m+)</label>
                  <textarea
                    className="w-full h-48 bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm focus:border-blue-500 outline-none resize-none"
                    placeholder="Teamfights, Baron, Elder..."
                    value={analysis.lateNotes}
                    onChange={(e) => setAnalysis({ ...analysis, lateNotes: e.target.value })}
                  />
                </div>
              </div>
            </div>
            
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
               <label className="block text-sm font-medium text-slate-400 mb-2">Link del VOD (Grabación)</label>
               <input 
                  type="text"
                  placeholder="https://youtube.com/..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:border-blue-500 outline-none"
                  value={vodLink}
                  onChange={(e) => setVodLink(e.target.value)}
               />
            </div>
          </div>
        )}

        {/* LOGS TAB */}
        {activeTab === "LOGS" && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h3 className="text-lg font-bold mb-4 text-orange-400">Historial de Cambios</h3>
            <LogViewer entityId={match.id} refreshTrigger={refreshLogs} />
          </div>
        )}
      </div>
    </div>
  );
}
