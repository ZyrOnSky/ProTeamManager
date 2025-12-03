"use client";

import { useState } from "react";
import { Plus, X, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface AddMemberFormProps {
  lineups: any[];
}

export function AddMemberForm({ lineups }: AddMemberFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: "",
    realName: "",
    email: "",
    password: "",
    phone: "",
    discordId: "",
    role: "PLAYER",
    position: "MID", // For players
    lineupId: "", // For assignment
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error("Error al crear usuario");

      setIsOpen(false);
      setFormData({
        name: "",
        realName: "",
        email: "",
        password: "",
        phone: "",
        discordId: "",
        role: "PLAYER",
        position: "MID",
        lineupId: "",
      });
      router.refresh();
    } catch (error) {
      console.error(error);
      alert("Error al crear el usuario");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors font-medium"
      >
        <Plus size={20} />
        Agregar Miembro
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-md p-6 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">Nuevo Miembro</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">
                Game ID (Riot ID)
              </label>
              <input
                type="text"
                required
                placeholder="Faker#KR1"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-green-500 transition-colors"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">
                Nombre Completo
              </label>
              <input
                type="text"
                required
                placeholder="Lee Sang-hyeok"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-green-500 transition-colors"
                value={formData.realName}
                onChange={(e) => setFormData({ ...formData, realName: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">
              Email
            </label>
            <input
              type="email"
              required
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-green-500 transition-colors"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">
                Teléfono
              </label>
              <input
                type="tel"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-green-500 transition-colors"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">
                Discord ID
              </label>
              <input
                type="text"
                placeholder="user#1234"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-green-500 transition-colors"
                value={formData.discordId}
                onChange={(e) => setFormData({ ...formData, discordId: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">
              Contraseña
            </label>
            <input
              type="password"
              required
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-green-500 transition-colors"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Rol</label>
            <select
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-green-500 transition-colors"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            >
              <option value="PLAYER">Jugador</option>
              <option value="COACH">Coach</option>
              <option value="STAFF">Staff</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>

          {formData.role === "PLAYER" && (
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">
                Posición Principal
              </label>
              <select
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-green-500 transition-colors"
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
              >
                <option value="TOP">Top Laner</option>
                <option value="JUNGLE">Jungler</option>
                <option value="MID">Mid Laner</option>
                <option value="ADC">Bot Laner (ADC)</option>
                <option value="SUPPORT">Support</option>
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Asignar a Equipo (Opcional)</label>
            <select
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-green-500 transition-colors"
              value={formData.lineupId}
              onChange={(e) => setFormData({ ...formData, lineupId: e.target.value })}
            >
              <option value="">- Sin Equipo -</option>
              {lineups.map(l => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
          </div>

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-2 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg transition-colors flex justify-center items-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Guardando...
                </>
              ) : (
                "Crear Miembro"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
