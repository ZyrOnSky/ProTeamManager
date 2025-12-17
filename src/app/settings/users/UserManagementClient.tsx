"use client";

import { useState } from "react";
import { Plus, User, Shield, Sword, Zap, Crosshair, Heart, Trash2, Edit2, Save, X } from "lucide-react";

interface UserManagementClientProps {
  users: any[];
  lineups: any[];
}

export function UserManagementClient({ users, lineups }: UserManagementClientProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    realName: "",
    nationality: "",
    email: "",
    password: "",
    role: "PLAYER",
    position: "MID", // For players
    lineupId: "", // For assignment
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error("Failed to create user");
      
      alert("Usuario creado correctamente");
      window.location.reload();
    } catch (error) {
      console.error(error);
      alert("Error al crear usuario");
    }
  };

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex justify-end">
        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-bold transition-colors shadow-md"
        >
          <Plus size={20} />
          Nuevo Usuario
        </button>
      </div>

      {/* Create Modal */}
      {isCreating && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">Crear Nuevo Usuario</h2>
              <button onClick={() => setIsCreating(false)} className="text-slate-400 hover:text-white">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Game ID / Nombre</label>
                  <input
                    type="text"
                    required
                    className="w-full bg-slate-950/50 border border-slate-800 rounded px-3 py-2 text-white focus:border-blue-500 outline-none"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Nombre Real</label>
                  <input
                    type="text"
                    className="w-full bg-slate-950/50 border border-slate-800 rounded px-3 py-2 text-white focus:border-blue-500 outline-none"
                    value={formData.realName}
                    onChange={(e) => setFormData({ ...formData, realName: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Nacionalidad (Ej: MX, AR)</label>
                <input
                  type="text"
                  className="w-full bg-slate-950/50 border border-slate-800 rounded px-3 py-2 text-white focus:border-blue-500 outline-none"
                  value={formData.nationality}
                  onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                  placeholder="Código de país (2 letras)"
                  maxLength={2}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Email</label>
                <input
                  type="email"
                  required
                  className="w-full bg-slate-950/50 border border-slate-800 rounded px-3 py-2 text-white focus:border-blue-500 outline-none"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Contraseña</label>
                <input
                  type="password"
                  required
                  className="w-full bg-slate-950/50 border border-slate-800 rounded px-3 py-2 text-white focus:border-blue-500 outline-none"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Rol</label>
                <select
                  className="w-full bg-slate-950/50 border border-slate-800 rounded px-3 py-2 text-white focus:border-blue-500 outline-none"
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
                  <label className="block text-sm font-medium text-slate-400 mb-1">Posición Principal</label>
                  <select
                    className="w-full bg-slate-950/50 border border-slate-800 rounded px-3 py-2 text-white focus:border-blue-500 outline-none"
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  >
                    <option value="TOP">Top</option>
                    <option value="JUNGLE">Jungle</option>
                    <option value="MID">Mid</option>
                    <option value="ADC">ADC</option>
                    <option value="SUPPORT">Support</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Asignar a Equipo (Opcional)</label>
                <select
                  className="w-full bg-slate-950/50 border border-slate-800 rounded px-3 py-2 text-white focus:border-blue-500 outline-none"
                  value={formData.lineupId}
                  onChange={(e) => setFormData({ ...formData, lineupId: e.target.value })}
                >
                  <option value="">- Sin Equipo -</option>
                  {lineups.map(l => (
                    <option key={l.id} value={l.id}>{l.name}</option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-bold mt-4"
              >
                Crear Usuario
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Users List */}
      <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-800 rounded-xl overflow-hidden shadow-lg">
        <table className="w-full text-left text-sm text-slate-400">
          <thead className="bg-slate-950/50 text-slate-200 uppercase font-bold">
            <tr>
              <th className="px-6 py-4">Nombre</th>
              <th className="px-6 py-4">Rol</th>
              <th className="px-6 py-4">Equipo</th>
              <th className="px-6 py-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-slate-800/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="font-medium text-white">{user.name}</div>
                  <div className="text-xs">{user.email}</div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded text-xs font-bold border ${
                    user.role === 'ADMIN' ? 'bg-red-500/10 border-red-500 text-red-400' :
                    user.role === 'COACH' ? 'bg-purple-500/10 border-purple-500 text-purple-400' :
                    user.role === 'PLAYER' ? 'bg-green-500/10 border-green-500 text-green-400' :
                    'bg-slate-500/10 border-slate-500 text-slate-400'
                  }`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {user.playerProfile?.lineupId ? (
                    <span className="text-blue-400">
                      {lineups.find(l => l.id === user.playerProfile.lineupId)?.name || "Unknown"}
                    </span>
                  ) : user.assignedLineup ? (
                    <span className="text-purple-400">
                      {user.assignedLineup.name} (Staff)
                    </span>
                  ) : (
                    <span className="text-slate-600">-</span>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="text-slate-500 hover:text-white transition-colors">
                    <Edit2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
