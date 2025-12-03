"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, X, UserCog } from "lucide-react";

interface StaffDetailClientProps {
  user: any;
  allLineups: any[];
  currentUserRole: string;
}

export function StaffDetailClient({ user, allLineups, currentUserRole }: StaffDetailClientProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: user.name,
    realName: user.realName || "",
    email: user.email,
    phone: user.phone || "",
    discordId: user.discordId || "",
    role: user.role,
    assignedLineupId: user.assignedLineupId || "",
  });

  const canEdit = currentUserRole === "ADMIN" || (currentUserRole === "COACH" && user.role !== "ADMIN");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error("Error updating user");

      setIsEditing(false);
      router.refresh();
    } catch (error) {
      console.error(error);
      alert("Error al actualizar el usuario");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isEditing) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <UserCog className="text-blue-500" />
                Información Personal
              </h2>
              {canEdit && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-sm bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded-lg transition-colors"
                >
                  Editar Perfil
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs text-slate-500 uppercase mb-1">Game ID (Riot ID)</label>
                <p className="text-lg font-medium">{user.name}</p>
              </div>
              <div>
                <label className="block text-xs text-slate-500 uppercase mb-1">Nombre Real</label>
                <p className="text-lg font-medium">{user.realName || "-"}</p>
              </div>
              <div>
                <label className="block text-xs text-slate-500 uppercase mb-1">Email</label>
                <p className="text-lg font-medium">{user.email}</p>
              </div>
              <div>
                <label className="block text-xs text-slate-500 uppercase mb-1">Teléfono</label>
                <p className="text-lg font-medium">{user.phone || "-"}</p>
              </div>
              <div>
                <label className="block text-xs text-slate-500 uppercase mb-1">Discord ID</label>
                <p className="text-lg font-medium">{user.discordId || "-"}</p>
              </div>
              <div>
                <label className="block text-xs text-slate-500 uppercase mb-1">Rol</label>
                <p className="text-lg font-medium">{user.role}</p>
              </div>
              <div>
                <label className="block text-xs text-slate-500 uppercase mb-1">Equipo Asignado</label>
                <p className="text-lg font-medium">
                  {user.assignedLineup ? user.assignedLineup.name : "Sin asignar"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="bg-slate-900 rounded-xl border border-slate-800 p-6">
        <h2 className="text-xl font-bold mb-6">Editar Perfil</h2>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Game ID (Riot ID)</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Nombre Real</label>
              <input
                type="text"
                value={formData.realName}
                onChange={(e) => setFormData({ ...formData, realName: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Teléfono</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Discord ID</label>
              <input
                type="text"
                value={formData.discordId}
                onChange={(e) => setFormData({ ...formData, discordId: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Rol</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
              >
                <option value="COACH">Coach</option>
                <option value="STAFF">Staff</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Equipo Asignado</label>
              <select
                value={formData.assignedLineupId}
                onChange={(e) => setFormData({ ...formData, assignedLineupId: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
              >
                <option value="">Ninguno</option>
                {allLineups.map((lineup) => (
                  <option key={lineup.id} value={lineup.id}>
                    {lineup.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-8">
          <button
            type="button"
            onClick={() => setIsEditing(false)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X size={20} />
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg font-bold transition-colors disabled:opacity-50"
          >
            <Save size={20} />
            {isLoading ? "Guardando..." : "Guardar Cambios"}
          </button>
        </div>
      </form>
    </div>
  );
}