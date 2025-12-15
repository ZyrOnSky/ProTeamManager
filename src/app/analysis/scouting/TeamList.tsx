'use client';

import { useState } from 'react';
import { Search, Swords, Calendar, Trophy, Plus, X, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { createTeam, deleteTeam } from './actions';

interface ScoutedTeam {
  id: string;
  name: string;
  isRival: boolean;
  totalMatches: number;
  ourWins: number;
  ourLosses: number;
  winrate: number;
  lastMatch: Date | null;
}

export function TeamList({ teams }: { teams: ScoutedTeam[] }) {
  const [search, setSearch] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [newTeamForm, setNewTeamForm] = useState({ name: '', isRival: false, notes: '' });

  const filteredTeams = teams.filter(team => 
    team.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    await createTeam(newTeamForm);
    setIsCreating(false);
    setNewTeamForm({ name: '', isRival: false, notes: '' });
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Buscar equipo..."
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-10 pr-4 py-3 text-slate-100 focus:outline-none focus:border-blue-500 transition-colors"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button 
          onClick={() => setIsCreating(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 rounded-lg font-medium transition-colors flex items-center gap-2"
        >
          <Plus size={20} />
          Nuevo Equipo
        </button>
      </div>

      {isCreating && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Registrar Nuevo Equipo</h3>
              <button onClick={() => setIsCreating(false)} className="text-slate-400 hover:text-white">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleCreateTeam} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Nombre del Equipo</label>
                <input 
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
                  value={newTeamForm.name}
                  onChange={e => setNewTeamForm({...newTeamForm, name: e.target.value})}
                />
              </div>
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox"
                  id="isRival"
                  className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-blue-600 focus:ring-blue-500"
                  checked={newTeamForm.isRival}
                  onChange={e => setNewTeamForm({...newTeamForm, isRival: e.target.checked})}
                />
                <label htmlFor="isRival" className="text-sm font-medium text-slate-300">Marcar como Rival Directo</label>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Notas Iniciales</label>
                <textarea 
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500 h-24 resize-none"
                  value={newTeamForm.notes}
                  onChange={e => setNewTeamForm({...newTeamForm, notes: e.target.value})}
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => setIsCreating(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium"
                >
                  Crear Equipo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTeams.map(team => (
          <Link 
            key={team.id} 
            href={`/analysis/scouting/${team.id}`}
            className="block bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-blue-500 transition-all group relative"
          >
            <button
              onClick={async (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (confirm('¿Estás seguro de que quieres eliminar este equipo? Si tiene partidas registradas, solo se ocultará de la lista.')) {
                  await deleteTeam(team.id);
                }
              }}
              className="absolute bottom-3 right-3 p-2 text-slate-600 hover:text-red-500 hover:bg-slate-800 rounded-lg transition-colors opacity-0 group-hover:opacity-100 z-10"
              title="Eliminar equipo"
            >
              <Trash2 size={18} />
            </button>

            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-bold text-lg group-hover:text-blue-400 transition-colors pr-8">{team.name}</h3>
                {team.isRival && (
                  <span className="text-xs font-medium bg-red-500/10 text-red-500 px-2 py-1 rounded mt-1 inline-block">
                    RIVAL
                  </span>
                )}
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-slate-200">{team.winrate}%</div>
                <div className="text-xs text-slate-500">Winrate vs Nosotros</div>
              </div>
            </div>

            <div className="space-y-2 text-sm text-slate-400">
              <div className="flex items-center gap-2">
                <Swords size={16} />
                <span>{team.totalMatches} Partidas ({team.ourWins}W - {team.ourLosses}L)</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar size={16} />
                <span>
                  {team.lastMatch 
                    ? format(new Date(team.lastMatch), "d 'de' MMM, yyyy", { locale: es })
                    : 'Sin partidas recientes'}
                </span>
              </div>
            </div>
          </Link>
        ))}

        {filteredTeams.length === 0 && (
          <div className="col-span-full text-center py-12 text-slate-500">
            No se encontraron equipos que coincidan con tu búsqueda.
          </div>
        )}
      </div>
    </div>
  );
}
