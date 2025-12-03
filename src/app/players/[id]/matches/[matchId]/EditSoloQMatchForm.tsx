"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Loader2, Swords, Target, Activity, Brain, Trash2 } from "lucide-react";
import { LogViewer } from "@/components/LogViewer";

interface EditSoloQMatchFormProps {
  match: any;
  participant: any;
  userId: string;
  playerName: string;
  userRole: string;
  currentUserId: string;
}

export default function EditSoloQMatchForm({ 
  match, 
  participant, 
  userId, 
  playerName,
  userRole,
  currentUserId
}: EditSoloQMatchFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [champions, setChampions] = useState<string[]>([]);

  useEffect(() => {
    fetch("https://ddragon.leagueoflegends.com/cdn/14.23.1/data/en_US/champion.json")
      .then(res => res.json())
      .then(data => {
        const champList = Object.keys(data.data).sort();
        setChampions(champList);
      })
      .catch(err => console.error("Error fetching champions:", err));
  }, []);

  const [formData, setFormData] = useState({
    date: new Date(match.date).toISOString().slice(0, 16),
    duration: match.duration ? Math.floor(match.duration / 60).toString() : "",
    result: match.result || "WIN",
    gameVersion: match.gameVersion || "",
    championName: participant.championName,
    position: participant.position,
    championRole: participant.championRole || "ENGAGE",
    laneAllocation: participant.laneAllocation || "NEUTRAL",
    
    // KDA & Farm
    kills: participant.kills?.toString() || "",
    deaths: participant.deaths?.toString() || "",
    assists: participant.assists?.toString() || "",
    cs: participant.cs?.toString() || "",
    
    // Vision
    visionWards: participant.visionWards?.toString() || "",
    wardsPlaced: participant.wardsPlaced?.toString() || "",
    
    // Matchup
    laneOpponent: participant.laneOpponent || "",
    matchupNotes: participant.matchupNotes || "",
    
    // Ratings
    microRating: participant.microRating?.toString() || "5",
    macroRating: participant.macroRating?.toString() || "5",
    communicationRating: participant.communicationRating?.toString() || "5",
    mentalRating: participant.mentalRating?.toString() || "5",
    positioningRating: participant.positioningRating?.toString() || "5",
    laningRating: participant.laningRating?.toString() || "5",
    teamfightRating: participant.teamfightRating?.toString() || "5",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch(`/api/matches/${match.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
        }),
      });

      if (!res.ok) throw new Error("Error updating match");

      router.push(`/players/${userId}`);
      router.refresh();
    } catch (error) {
      console.error(error);
      alert("Error al actualizar la partida");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("¿Estás seguro de que quieres eliminar esta partida? Esta acción no se puede deshacer.")) return;
    
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/matches/${match.id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Error deleting match");

      router.push(`/players/${userId}`);
      router.refresh();
    } catch (error) {
      console.error(error);
      alert("Error al eliminar la partida");
      setIsDeleting(false);
    }
  };

  // Permission check for delete
  const canDelete = userRole === "ADMIN" || userRole === "COACH" || currentUserId === userId;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8 flex justify-between items-start">
          <div>
            <Link 
                href={`/players/${userId}`}
                className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-4 transition-colors"
            >
                <ArrowLeft size={20} />
                Volver al Perfil
            </Link>
            <h1 className="text-3xl font-bold text-white">Editar Partida SoloQ</h1>
            <p className="text-slate-400">Editando registro de {playerName}.</p>
          </div>
          
          {canDelete && (
            <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 px-4 py-2 rounded-lg transition-colors border border-red-500/20"
            >
                {isDeleting ? <Loader2 size={20} className="animate-spin" /> : <Trash2 size={20} />}
                Eliminar Partida
            </button>
          )}
        </header>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* General Info */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4 text-blue-400">
              <Swords size={20} />
              <h2 className="font-bold text-lg">Información General</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Fecha y Hora</label>
                <input
                  type="datetime-local"
                  name="date"
                  required
                  value={formData.date}
                  onChange={handleChange}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Duración (min)</label>
                <input
                  type="number"
                  name="duration"
                  placeholder="Ej. 30"
                  value={formData.duration}
                  onChange={handleChange}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Resultado</label>
                <select
                  name="result"
                  value={formData.result}
                  onChange={handleChange}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 focus:border-blue-500 outline-none"
                >
                  <option value="WIN">Victoria</option>
                  <option value="LOSS">Derrota</option>
                  <option value="REMAKE">Remake</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Parche</label>
                <input
                  type="text"
                  name="gameVersion"
                  placeholder="Ej. 15.15"
                  value={formData.gameVersion}
                  onChange={handleChange}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Campeón</label>
                <input
                  type="text"
                  name="championName"
                  required
                  list="champions-list"
                  placeholder="Ej. Ahri"
                  value={formData.championName}
                  onChange={handleChange}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 focus:border-blue-500 outline-none"
                />
                <datalist id="champions-list">
                  {champions.map(champ => (
                    <option key={champ} value={champ} />
                  ))}
                </datalist>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Posición</label>
                <select
                  name="position"
                  value={formData.position}
                  onChange={handleChange}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 focus:border-blue-500 outline-none"
                >
                  <option value="TOP">TOP</option>
                  <option value="JUNGLE">JUNGLE</option>
                  <option value="MID">MID</option>
                  <option value="ADC">ADC</option>
                  <option value="SUPPORT">SUPPORT</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Estilo (Rol Táctico)</label>
                <select
                  name="championRole"
                  value={(formData as any).championRole}
                  onChange={handleChange}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 focus:border-blue-500 outline-none"
                >
                  <option value="ENGAGE">Engage (Iniciación)</option>
                  <option value="PICKUP">Pickup (Cazar)</option>
                  <option value="PROTECT">Protect (Peel)</option>
                  <option value="SIEGE">Siege (Asedio)</option>
                  <option value="SPLITPUSH">Splitpush</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Recursos (Línea)</label>
                <select
                  name="laneAllocation"
                  value={(formData as any).laneAllocation}
                  onChange={handleChange}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 focus:border-blue-500 outline-none"
                >
                  <option value="NEUTRAL">Neutral (Estándar)</option>
                  <option value="STRONG_SIDE">Strong Side (Prioridad)</option>
                  <option value="WEAK_SIDE">Weak Side (Jugar Seguro)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Performance Stats */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4 text-green-400">
              <Activity size={20} />
              <h2 className="font-bold text-lg">Rendimiento</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs text-slate-500 uppercase font-bold mb-1">Kills</label>
                <input
                  type="number"
                  name="kills"
                  value={formData.kills}
                  onChange={handleChange}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 focus:border-green-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 uppercase font-bold mb-1">Deaths</label>
                <input
                  type="number"
                  name="deaths"
                  value={formData.deaths}
                  onChange={handleChange}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 focus:border-red-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 uppercase font-bold mb-1">Assists</label>
                <input
                  type="number"
                  name="assists"
                  value={formData.assists}
                  onChange={handleChange}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 focus:border-yellow-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 uppercase font-bold mb-1">CS</label>
                <input
                  type="number"
                  name="cs"
                  value={formData.cs}
                  onChange={handleChange}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 focus:border-green-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 uppercase font-bold mb-1">Pink Wards (Control)</label>
                <input
                  type="number"
                  name="visionWards"
                  value={formData.visionWards}
                  onChange={handleChange}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 focus:border-purple-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 uppercase font-bold mb-1">Wards Normales</label>
                <input
                  type="number"
                  name="wardsPlaced"
                  value={formData.wardsPlaced}
                  onChange={handleChange}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 focus:border-purple-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Matchup */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4 text-red-400">
              <Target size={20} />
              <h2 className="font-bold text-lg">Matchup</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Campeón Rival</label>
                <input
                  type="text"
                  name="laneOpponent"
                  list="champions-list"
                  placeholder="Ej. Zed"
                  value={formData.laneOpponent}
                  onChange={handleChange}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 focus:border-red-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Notas del Matchup</label>
                <textarea
                  name="matchupNotes"
                  placeholder="Observaciones sobre el enfrentamiento..."
                  value={formData.matchupNotes}
                  onChange={handleChange}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 focus:border-red-500 outline-none h-[42px] resize-none"
                />
              </div>
            </div>
          </div>

          {/* Ratings */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4 text-purple-400">
              <Brain size={20} />
              <h2 className="font-bold text-lg">Autoevaluación (0-10)</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { name: "laningRating", label: "Laning Phase" },
                { name: "microRating", label: "Micro (Mecánicas)" },
                { name: "macroRating", label: "Macro (Rotaciones)" },
                { name: "teamfightRating", label: "Teamfighting" },
                { name: "positioningRating", label: "Posicionamiento" },
                { name: "communicationRating", label: "Comunicación" },
                { name: "mentalRating", label: "Mental" },
              ].map((field) => {
                const value = parseFloat((formData as any)[field.name]);
                const colorClass = value >= 8 ? "text-green-400" : value >= 5 ? "text-yellow-400" : "text-red-400";
                
                return (
                  <div key={field.name} className="bg-slate-950 p-4 rounded-lg border border-slate-800">
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-sm font-bold text-slate-300">{field.label}</label>
                      <span className={`text-lg font-bold ${colorClass}`}>{value}</span>
                    </div>
                    <div className="flex items-center justify-center h-8">
                      <input
                        type="range"
                        min="0"
                        max="10"
                        step="0.5"
                        name={field.name}
                        value={value}
                        onChange={handleChange}
                        className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                      />
                    </div>
                    <div className="flex justify-between text-xs text-slate-600 mt-1">
                      <span>0</span>
                      <span>5</span>
                      <span>10</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-bold text-lg transition-colors flex justify-center items-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 size={24} className="animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save size={24} />
                Actualizar Partida
              </>
            )}
          </button>

        </form>

        <div className="mt-12 pt-8 border-t border-slate-800">
          <h3 className="text-xl font-bold text-slate-400 mb-6">Historial de Cambios</h3>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <LogViewer entityId={match.id} />
          </div>
        </div>
      </div>
    </main>
  );
}
