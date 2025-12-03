"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Users, X, Edit2, Trash2, Save, UserPlus, UserMinus } from "lucide-react";

interface LineupManagementClientProps {
  lineups: any[];
  allUsers: any[];
}

export function LineupManagementClient({ lineups: initialLineups, allUsers }: LineupManagementClientProps) {
  const router = useRouter();
  const [lineups, setLineups] = useState(initialLineups);
  const [isCreating, setIsCreating] = useState(false);
  const [editingLineup, setEditingLineup] = useState<any | null>(null);
  
  // Form states
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  
  // Member assignment state
  const [selectedUserToAdd, setSelectedUserToAdd] = useState("");

  const resetForm = () => {
    setName("");
    setDescription("");
    setEditingLineup(null);
    setIsCreating(false);
    setSelectedUserToAdd("");
  };

  const openCreate = () => {
    resetForm();
    setIsCreating(true);
  };

  const openEdit = (lineup: any) => {
    resetForm();
    setEditingLineup(lineup);
    setName(lineup.name);
    setDescription(lineup.description || "");
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/lineups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description }),
      });

      if (!res.ok) throw new Error("Failed to create lineup");
      
      alert("Equipo creado correctamente");
      window.location.reload(); // Full reload is fine for creation
    } catch (error) {
      console.error(error);
      alert("Error al crear equipo");
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLineup) return;

    try {
      const res = await fetch(`/api/lineups/${editingLineup.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description }),
      });

      if (!res.ok) throw new Error("Failed to update lineup");
      
      const updatedLineup = await res.json();
      
      // Update local state
      setLineups(prev => prev.map(l => l.id === updatedLineup.id ? updatedLineup : l));
      setEditingLineup(updatedLineup);
      
      // Refresh server data in background
      router.refresh();
      
      alert("Equipo actualizado correctamente");
    } catch (error) {
      console.error(error);
      alert("Error al actualizar equipo");
    }
  };

  const handleDelete = async () => {
    if (!editingLineup || !confirm("¿Estás seguro de eliminar este equipo? Esta acción no se puede deshacer.")) return;

    try {
      const res = await fetch(`/api/lineups/${editingLineup.id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete lineup");
      
      alert("Equipo eliminado correctamente");
      window.location.reload();
    } catch (error) {
      console.error(error);
      alert("Error al eliminar equipo");
    }
  };

  const handleAddMember = async () => {
    if (!editingLineup || !selectedUserToAdd) return;

    try {
      const res = await fetch(`/api/lineups/${editingLineup.id}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: selectedUserToAdd }),
      });

      if (!res.ok) throw new Error("Failed to add member");
      
      const updatedLineup = await res.json();
      
      // Update local state
      setLineups(prev => prev.map(l => l.id === updatedLineup.id ? updatedLineup : l));
      setEditingLineup(updatedLineup);
      setSelectedUserToAdd("");
      
      // Refresh server data in background
      router.refresh();
    } catch (error) {
      console.error(error);
      alert("Error al añadir miembro");
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!editingLineup || !confirm("¿Quitar miembro del equipo?")) return;

    try {
      const res = await fetch(`/api/lineups/${editingLineup.id}/members`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      if (!res.ok) throw new Error("Failed to remove member");
      
      const updatedLineup = await res.json();
      
      // Update local state
      setLineups(prev => prev.map(l => l.id === updatedLineup.id ? updatedLineup : l));
      setEditingLineup(updatedLineup);
      
      // Refresh server data in background
      router.refresh();
    } catch (error) {
      console.error(error);
      alert("Error al quitar miembro");
    }
  };

  // Filter users available to add (not already in this lineup)
  // Note: This logic can be complex if users can be in multiple lineups, but assuming 1 lineup per user for now based on schema
  const availableUsers = allUsers.filter(u => {
    if (!editingLineup) return false;
    const isPlayerInLineup = editingLineup.players.some((p: any) => p.userId === u.id);
    const isStaffInLineup = editingLineup.staff.some((s: any) => s.id === u.id);
    return !isPlayerInLineup && !isStaffInLineup;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold transition-colors"
        >
          <Plus size={20} />
          Nuevo Equipo
        </button>
      </div>

      {/* Create Modal */}
      {isCreating && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">Crear Nuevo Equipo</h2>
              <button onClick={resetForm} className="text-slate-400 hover:text-white">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Nombre del Equipo</label>
                <input
                  type="text"
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white focus:border-blue-500 outline-none"
                  placeholder="Ej: Main Roster, Academy..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Descripción</label>
                <textarea
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white focus:border-blue-500 outline-none resize-none h-24"
                  placeholder="Notas opcionales..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-bold mt-4"
              >
                Crear Equipo
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingLineup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 w-full max-w-2xl my-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">Editar Equipo: {editingLineup.name}</h2>
              <button onClick={resetForm} className="text-slate-400 hover:text-white">
                <X size={24} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left Column: Details */}
              <div className="space-y-6">
                <form onSubmit={handleUpdate} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Nombre</label>
                    <input
                      type="text"
                      required
                      className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white focus:border-blue-500 outline-none"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Descripción</label>
                    <textarea
                      className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white focus:border-blue-500 outline-none resize-none h-24"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button
                      type="submit"
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-bold flex items-center justify-center gap-2"
                    >
                      <Save size={16} /> Guardar
                    </button>
                    <button
                      type="button"
                      onClick={handleDelete}
                      className="px-4 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded-lg font-bold flex items-center justify-center"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </form>
              </div>

              {/* Right Column: Members */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-slate-300 uppercase mb-3">Miembros Actuales</h3>
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                    {/* Players */}
                    {editingLineup.players.map((p: any) => (
                      <div key={p.id} className="flex justify-between items-center bg-slate-950 p-2 rounded border border-slate-800">
                        <div>
                          <div className="text-sm font-bold text-white">{p.user.name}</div>
                          <div className="text-xs text-green-400">Player ({p.position})</div>
                        </div>
                        <button 
                          onClick={() => handleRemoveMember(p.userId)}
                          className="text-slate-500 hover:text-red-400"
                        >
                          <UserMinus size={16} />
                        </button>
                      </div>
                    ))}
                    {/* Staff */}
                    {editingLineup.staff.map((s: any) => (
                      <div key={s.id} className="flex justify-between items-center bg-slate-950 p-2 rounded border border-slate-800">
                        <div>
                          <div className="text-sm font-bold text-white">{s.name}</div>
                          <div className="text-xs text-purple-400">Staff / Coach</div>
                        </div>
                        <button 
                          onClick={() => handleRemoveMember(s.id)}
                          className="text-slate-500 hover:text-red-400"
                        >
                          <UserMinus size={16} />
                        </button>
                      </div>
                    ))}
                    
                    {editingLineup.players.length === 0 && editingLineup.staff.length === 0 && (
                      <div className="text-sm text-slate-500 italic text-center py-4">Sin miembros asignados</div>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800">
                  <h3 className="text-sm font-bold text-slate-300 uppercase mb-3">Añadir Miembro</h3>
                  <div className="flex gap-2">
                    <select
                      className="flex-1 bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white text-sm focus:border-blue-500 outline-none"
                      value={selectedUserToAdd}
                      onChange={(e) => setSelectedUserToAdd(e.target.value)}
                    >
                      <option value="">Seleccionar usuario...</option>
                      {availableUsers.map(u => (
                        <option key={u.id} value={u.id}>
                          {u.name} ({u.role})
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={handleAddMember}
                      disabled={!selectedUserToAdd}
                      className="bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-3 rounded-lg"
                    >
                      <Plus size={20} />
                    </button>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    Solo se muestran usuarios que no están en este equipo.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {lineups.map((lineup) => (
          <div key={lineup.id} className="bg-slate-900 border border-slate-800 rounded-xl p-6 hover:border-blue-500 transition-colors relative group">
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={() => openEdit(lineup)}
                className="p-2 bg-slate-800 hover:bg-blue-600 text-white rounded-lg transition-colors"
              >
                <Edit2 size={16} />
              </button>
            </div>

            <div className="flex justify-between items-start mb-4 pr-10">
              <div>
                <h3 className="text-xl font-bold text-white">{lineup.name}</h3>
                <p className="text-sm text-slate-400 line-clamp-2">{lineup.description || "Sin descripción"}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <div className="text-xs text-slate-500 uppercase font-bold mb-2 flex items-center gap-2">
                  <Users size={14} />
                  Jugadores ({lineup.players.length})
                </div>
                <div className="flex flex-wrap gap-2">
                  {lineup.players.length > 0 ? (
                    lineup.players.map((p: any) => (
                      <span key={p.id} className="text-xs bg-slate-950 border border-slate-800 px-2 py-1 rounded text-slate-300">
                        {p.user.name}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-600 italic">Sin jugadores</span>
                  )}
                </div>
              </div>

              <div>
                <div className="text-xs text-slate-500 uppercase font-bold mb-2">Staff ({lineup.staff.length})</div>
                <div className="flex flex-wrap gap-2">
                  {lineup.staff.length > 0 ? (
                    lineup.staff.map((s: any) => (
                      <span key={s.id} className="text-xs bg-purple-500/10 border border-purple-500/20 px-2 py-1 rounded text-purple-300">
                        {s.name}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-600 italic">Sin staff asignado</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
