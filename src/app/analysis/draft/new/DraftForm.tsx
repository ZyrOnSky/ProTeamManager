'use client';

import { useState } from 'react';
import { Save } from 'lucide-react';
import { createDraftPlan } from '../actions';

interface DraftFormProps {
  teams: any[];
  lineups: any[];
  tierLists: any[];
}

export function DraftForm({ teams, lineups, tierLists }: DraftFormProps) {
  const [selectedLineupId, setSelectedLineupId] = useState<string>('');
  const [selectedEnemyId, setSelectedEnemyId] = useState<string>('');

  const allyTierLists = tierLists.filter(tl => !tl.enemyTeamId && (!tl.lineupId || tl.lineupId === selectedLineupId));
  const enemyTierLists = tierLists.filter(tl => tl.enemyTeamId === selectedEnemyId);

  return (
    <form action={createDraftPlan} className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
      <div>
        <label className="block text-sm font-medium text-slate-400 mb-2">Nombre de la Simulación</label>
        <input 
          type="text" 
          name="name"
          required
          placeholder="Ej: vs T1 - Game 1"
          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500 transition-colors"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Ally Side */}
        <div className="space-y-4 p-4 bg-blue-950/20 rounded-lg border border-blue-900/30">
          <h3 className="font-bold text-blue-400">Nuestro Equipo</h3>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Lineup</label>
            <select 
              name="lineupId"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500 transition-colors"
              value={selectedLineupId}
              onChange={(e) => setSelectedLineupId(e.target.value)}
            >
              <option value="">-- Seleccionar Lineup --</option>
              {lineups.map(lineup => (
                <option key={lineup.id} value={lineup.id}>{lineup.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Tier List Aliada</label>
            <select 
              name="allyTierListId"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500 transition-colors"
              disabled={!selectedLineupId}
            >
              <option value="">-- Seleccionar Tier List --</option>
              {allyTierLists.map(tl => (
                <option key={tl.id} value={tl.id}>{tl.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Enemy Side */}
        <div className="space-y-4 p-4 bg-red-950/20 rounded-lg border border-red-900/30">
          <h3 className="font-bold text-red-400">Equipo Rival</h3>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Equipo</label>
            <select 
              name="enemyTeamId"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500 transition-colors"
              value={selectedEnemyId}
              onChange={(e) => setSelectedEnemyId(e.target.value)}
            >
              <option value="">-- Seleccionar Rival --</option>
              {teams.map(team => (
                <option key={team.id} value={team.id}>{team.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Tier List Enemiga</label>
            <select 
              name="enemyTierListId"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500 transition-colors"
              disabled={!selectedEnemyId}
            >
              <option value="">-- Seleccionar Tier List --</option>
              {enemyTierLists.map(tl => (
                <option key={tl.id} value={tl.id}>{tl.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-400 mb-2">Nuestro Lado</label>
        <div className="grid grid-cols-2 gap-4">
          <label className="cursor-pointer">
            <input type="radio" name="ourSide" value="BLUE" className="peer sr-only" defaultChecked />
            <div className="text-center p-4 rounded-lg border-2 border-slate-800 peer-checked:border-blue-500 peer-checked:bg-blue-500/10 transition-all">
              <span className="font-bold text-blue-400">BLUE SIDE</span>
              <p className="text-xs text-slate-500 mt-1">First Pick</p>
            </div>
          </label>
          <label className="cursor-pointer">
            <input type="radio" name="ourSide" value="RED" className="peer sr-only" />
            <div className="text-center p-4 rounded-lg border-2 border-slate-800 peer-checked:border-red-500 peer-checked:bg-red-500/10 transition-all">
              <span className="font-bold text-red-400">RED SIDE</span>
              <p className="text-xs text-slate-500 mt-1">Last Pick</p>
            </div>
          </label>
        </div>
      </div>

      <div className="pt-4">
        <button 
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
        >
          <Save size={20} />
          Crear Simulación
        </button>
      </div>
    </form>
  );
}
