"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Plus, Loader2 } from "lucide-react";

type Team = {
  id: string;
  name: string;
};

type Lineup = {
  id: string;
  name: string;
};

export default function NewScrimPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [teams, setTeams] = useState<Team[]>([]);
  const [lineups, setLineups] = useState<Lineup[]>([]);
  
  // Form States
  const [date, setDate] = useState("");
  const [selectedTeamId, setSelectedTeamId] = useState("");
  const [selectedLineupId, setSelectedLineupId] = useState("");
  const [ourSide, setOurSide] = useState("BLUE");
  
  // New Team State
  const [isCreatingTeam, setIsCreatingTeam] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");

  useEffect(() => {
    // Establecer fecha/hora actual local por defecto
    const now = new Date();
    const localIso = new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
    setDate(localIso);

    fetchTeams();
    fetchLineups();
  }, []);

  const fetchTeams = async () => {
    try {
      const res = await fetch("/api/teams");
      if (res.ok) {
        const data = await res.json();
        setTeams(data);
      }
    } catch (error) {
      console.error("Error fetching teams:", error);
    }
  };

  const fetchLineups = async () => {
    try {
      const res = await fetch("/api/lineups");
      if (res.ok) {
        const data = await res.json();
        setLineups(data);
        // Select first lineup by default if available
        if (data.length > 0) {
          setSelectedLineupId(data[0].id);
        }
      }
    } catch (error) {
      console.error("Error fetching lineups:", error);
    }
  };

  const handleCreateTeam = async () => {
    if (!newTeamName.trim()) return;
    
    try {
      const res = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newTeamName }),
      });

      if (res.ok) {
        const newTeam = await res.json();
        setTeams([...teams, newTeam]);
        setSelectedTeamId(newTeam.id);
        setIsCreatingTeam(false);
        setNewTeamName("");
      }
    } catch (error) {
      alert("Error creando equipo");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeamId) {
      alert("Selecciona un equipo rival");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/matches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          enemyTeamId: selectedTeamId,
          ourSide,
          type: "SCRIM",
          lineupId: selectedLineupId || null,
        }),
      });

      if (!res.ok) throw new Error("Error creating match");

      const match = await res.json();
      router.push(`/scrims/${match.id}`); // Redirigir al detalle de la scrim
    } catch (error) {
      console.error(error);
      alert("Error al crear la scrim");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-8">
      <div className="max-w-2xl mx-auto">
        <header className="mb-8">
          <Link 
            href="/scrims" 
            className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft size={20} />
            Cancelar y Volver
          </Link>
          <h1 className="text-3xl font-bold text-white">Registrar Nueva Scrim</h1>
          <p className="text-slate-400">Configura los detalles iniciales de la partida.</p>
        </header>

        <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
          
          {/* Fecha y Hora */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Fecha y Hora
            </label>
            <input
              type="datetime-local"
              required
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          {/* Nuestro Equipo (Lineup) */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Nuestro Equipo (Lineup)
            </label>
            <select
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
              value={selectedLineupId}
              onChange={(e) => setSelectedLineupId(e.target.value)}
            >
              <option value="">-- Seleccionar Lineup --</option>
              {lineups.map((lineup) => (
                <option key={lineup.id} value={lineup.id}>
                  {lineup.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-slate-500 mt-1">
              Selecciona qué alineación jugará esta scrim.
            </p>
          </div>

          {/* Equipo Rival */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Equipo Rival
            </label>
            
            {!isCreatingTeam ? (
              <div className="flex gap-2">
                <select
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                  value={selectedTeamId}
                  onChange={(e) => setSelectedTeamId(e.target.value)}
                >
                  <option value="">-- Seleccionar Equipo --</option>
                  {teams.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setIsCreatingTeam(true)}
                  className="bg-slate-800 hover:bg-slate-700 text-white px-4 rounded-lg transition-colors"
                  title="Crear Nuevo Equipo"
                >
                  <Plus size={20} />
                </button>
              </div>
            ) : (
              <div className="flex gap-2 animate-in fade-in slide-in-from-left-2">
                <input
                  type="text"
                  placeholder="Nombre del nuevo equipo..."
                  className="flex-1 bg-slate-950 border border-blue-500 rounded-lg px-4 py-3 text-white focus:outline-none"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleCreateTeam}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 rounded-lg transition-colors font-medium"
                >
                  Guardar
                </button>
                <button
                  type="button"
                  onClick={() => setIsCreatingTeam(false)}
                  className="bg-slate-800 hover:bg-slate-700 text-white px-4 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
              </div>
            )}
          </div>

          {/* Lado del Mapa */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Nuestro Lado (Side Selection)
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setOurSide("BLUE")}
                className={`p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${
                  ourSide === "BLUE"
                    ? "bg-blue-500/20 border-blue-500 text-blue-400"
                    : "bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700"
                }`}
              >
                <span className="font-bold">BLUE SIDE</span>
                <span className="text-xs opacity-70">First Pick</span>
              </button>
              <button
                type="button"
                onClick={() => setOurSide("RED")}
                className={`p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${
                  ourSide === "RED"
                    ? "bg-red-500/20 border-red-500 text-red-400"
                    : "bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700"
                }`}
              >
                <span className="font-bold">RED SIDE</span>
                <span className="text-xs opacity-70">Last Pick (Counter)</span>
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-bold text-lg transition-colors flex justify-center items-center gap-2 mt-8"
          >
            {isLoading ? (
              <>
                <Loader2 size={24} className="animate-spin" />
                Creando Scrim...
              </>
            ) : (
              <>
                <Save size={24} />
                Comenzar Scrim
              </>
            )}
          </button>

        </form>
      </div>
    </main>
  );
}
