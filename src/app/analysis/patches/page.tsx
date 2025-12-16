'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, ExternalLink, Save, X, Calendar, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Patch {
  id: string;
  version: string;
  description: string | null;
  startDate: string | null;
  officialLink: string | null;
  _count: {
    matches: number;
    tierLists: number;
  };
}

export default function PatchManagerPage() {
  const [patches, setPatches] = useState<Patch[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPatch, setEditingPatch] = useState<Patch | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    version: '',
    description: '',
    startDate: '',
    officialLink: ''
  });

  useEffect(() => {
    fetchPatches();
  }, []);

  const fetchPatches = async () => {
    try {
      const res = await fetch('/api/patches');
      if (res.ok) {
        const data = await res.json();
        setPatches(data);
      }
    } catch (error) {
      console.error('Error fetching patches:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (patch?: Patch) => {
    if (patch) {
      setEditingPatch(patch);
      setFormData({
        version: patch.version,
        description: patch.description || '',
        startDate: patch.startDate ? new Date(patch.startDate).toISOString().split('T')[0] : '',
        officialLink: patch.officialLink || ''
      });
    } else {
      setEditingPatch(null);
      setFormData({
        version: '',
        description: '',
        startDate: new Date().toISOString().split('T')[0],
        officialLink: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingPatch ? `/api/patches/${editingPatch.id}` : '/api/patches';
      const method = editingPatch ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        setIsModalOpen(false);
        fetchPatches();
      } else {
        const errorData = await res.json().catch(() => ({ error: 'Error desconocido' }));
        alert(`Error al guardar el parche: ${errorData.error || res.statusText}`);
      }
    } catch (error) {
      console.error('Error saving patch:', error);
      alert('Error de conexión al guardar el parche');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este parche?')) return;
    try {
      const res = await fetch(`/api/patches/${id}`, { method: 'DELETE' });
      if (res.ok) fetchPatches();
    } catch (error) {
      console.error('Error deleting patch:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-blue-500">Gestor de Parches</h1>
          <p className="text-slate-400">Administra las versiones del juego para organizar tus estadísticas.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition-colors"
        >
          <Plus size={20} /> Nuevo Parche
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-500">Cargando parches...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {patches.map((patch) => (
            <div key={patch.id} className="bg-slate-900 border border-slate-800 rounded-xl p-6 hover:border-blue-500/50 transition-all group">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-2xl font-bold text-white">v{patch.version}</h3>
                  {patch.startDate && (
                    <div className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                      <Calendar size={12} />
                      {format(new Date(patch.startDate), "d 'de' MMMM, yyyy", { locale: es })}
                    </div>
                  )}
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => handleOpenModal(patch)}
                    className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-blue-400"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button 
                    onClick={() => handleDelete(patch.id)}
                    className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-red-400"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {patch.description && (
                <p className="text-slate-400 text-sm mb-4 line-clamp-2">{patch.description}</p>
              )}

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <div className="text-xs text-slate-500 mb-1">Partidas</div>
                  <div className="text-xl font-bold text-white">{patch._count.matches}</div>
                </div>
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <div className="text-xs text-slate-500 mb-1">Tier Lists</div>
                  <div className="text-xl font-bold text-white">{patch._count.tierLists}</div>
                </div>
              </div>

              {patch.officialLink && (
                <a 
                  href={patch.officialLink} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 mt-2"
                >
                  <ExternalLink size={12} /> Ver Notas del Parche
                </a>
              )}
            </div>
          ))}
          
          {patches.length === 0 && (
            <div className="col-span-full text-center py-12 bg-slate-900/50 rounded-xl border border-dashed border-slate-800">
              <p className="text-slate-500 mb-4">No hay parches registrados.</p>
              <button 
                onClick={() => handleOpenModal()}
                className="text-blue-500 hover:underline"
              >
                Crear el primer parche
              </button>
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">
                {editingPatch ? 'Editar Parche' : 'Nuevo Parche'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Versión (Ej. 14.24)</label>
                <input
                  type="text"
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-blue-500 outline-none"
                  value={formData.version}
                  onChange={e => setFormData({...formData, version: e.target.value})}
                  placeholder="14.24"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Fecha de Inicio</label>
                <input
                  type="date"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-blue-500 outline-none"
                  value={formData.startDate}
                  onChange={e => setFormData({...formData, startDate: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Enlace Oficial</label>
                <input
                  type="url"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-blue-500 outline-none"
                  value={formData.officialLink}
                  onChange={e => setFormData({...formData, officialLink: e.target.value})}
                  placeholder="https://www.leagueoflegends.com/..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Descripción / Notas</label>
                <textarea
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-blue-500 outline-none h-24 resize-none"
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  placeholder="Cambios importantes en el meta..."
                />
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-2 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-bold transition-colors flex justify-center items-center gap-2"
                >
                  <Save size={18} /> Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
