"use client";

import { useState } from "react";
import { Plus, Trash2, Star, BookOpen, GraduationCap } from "lucide-react";
import { useRouter } from "next/navigation";

type ChampionPoolEntry = {
  id: string;
  championName: string;
  mastery: "MAIN" | "POCKET" | "LEARNING";
  notes: string | null;
};

interface ChampionPoolManagerProps {
  userId: string;
  initialPool: ChampionPoolEntry[];
}

const MasteryConfig = {
  MAIN: { label: "Main", icon: Star, color: "text-yellow-500", bg: "bg-yellow-500/10", border: "border-yellow-500/20" },
  POCKET: { label: "Pocket", icon: BookOpen, color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/20" },
  LEARNING: { label: "Learning", icon: GraduationCap, color: "text-green-500", bg: "bg-green-500/10", border: "border-green-500/20" },
};

export function ChampionPoolManager({ userId, initialPool }: ChampionPoolManagerProps) {
  const [pool, setPool] = useState<ChampionPoolEntry[]>(initialPool);
  const [isAdding, setIsAdding] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const [newChamp, setNewChamp] = useState({
    championName: "",
    mastery: "MAIN" as const,
    notes: "",
  });

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch(`/api/players/${userId}/champion-pool`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newChamp),
      });

      if (!res.ok) throw new Error("Error adding champion");

      const addedEntry = await res.json();
      setPool([...pool, addedEntry]);
      setIsAdding(false);
      setNewChamp({ championName: "", mastery: "MAIN", notes: "" });
      router.refresh();
    } catch (error) {
      console.error(error);
      alert("Error al agregar campeón");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (poolId: string) => {
    if (!confirm("¿Estás seguro de eliminar este campeón del pool?")) return;

    try {
      const res = await fetch(`/api/players/${userId}/champion-pool?poolId=${poolId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Error deleting champion");

      setPool(pool.filter((p) => p.id !== poolId));
      router.refresh();
    } catch (error) {
      console.error(error);
      alert("Error al eliminar campeón");
    }
  };

  return (
    <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-800 rounded-xl p-6 shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Star className="text-yellow-500" size={20} />
          Champion Pool
        </h2>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="text-sm bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded-lg transition-colors flex items-center gap-2"
        >
          <Plus size={16} />
          {isAdding ? "Cancelar" : "Agregar Campeón"}
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleAdd} className="mb-6 p-4 bg-slate-950/50 rounded-lg border border-slate-800 animate-in fade-in slide-in-from-top-2">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Campeón</label>
              <input
                type="text"
                required
                placeholder="Ej: Aatrox"
                className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm focus:border-blue-500 outline-none"
                value={newChamp.championName}
                onChange={(e) => setNewChamp({ ...newChamp, championName: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Maestría</label>
              <select
                className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm focus:border-blue-500 outline-none"
                value={newChamp.mastery}
                onChange={(e) => setNewChamp({ ...newChamp, mastery: e.target.value as any })}
              >
                <option value="MAIN">Main (Confort)</option>
                <option value="POCKET">Pocket Pick</option>
                <option value="LEARNING">Learning (Practicando)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Notas</label>
              <input
                type="text"
                placeholder="Ej: Solo vs Tanques"
                className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm focus:border-blue-500 outline-none"
                value={newChamp.notes}
                onChange={(e) => setNewChamp({ ...newChamp, notes: e.target.value })}
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded text-sm font-medium transition-colors"
          >
            {isLoading ? "Guardando..." : "Guardar Campeón"}
          </button>
        </form>
      )}

      <div className="space-y-3">
        {pool.map((entry) => {
          const config = MasteryConfig[entry.mastery];
          const Icon = config.icon;

          return (
            <div
              key={entry.id}
              className={`flex items-center justify-between p-3 rounded-lg border ${config.border} ${config.bg} transition-all hover:bg-opacity-20`}
            >
              <div className="flex items-center gap-4">
                <div className={`p-2 rounded-md ${config.bg} ${config.color}`}>
                  <Icon size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-200">{entry.championName}</h3>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium ${config.color}`}>
                      {config.label}
                    </span>
                    {entry.notes && (
                      <span className="text-xs text-slate-400 border-l border-slate-700 pl-2">
                        {entry.notes}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <button
                onClick={() => handleDelete(entry.id)}
                className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                title="Eliminar"
              >
                <Trash2 size={16} />
              </button>
            </div>
          );
        })}

        {pool.length === 0 && !isAdding && (
          <div className="text-center py-8 text-slate-500 text-sm">
            No hay campeones registrados en el pool.
          </div>
        )}
      </div>
    </div>
  );
}
