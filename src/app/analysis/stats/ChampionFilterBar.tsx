'use client';

import { useState } from 'react';
import { Filter, Search } from 'lucide-react';

// Define enums locally to avoid Client Component issues with Prisma
const ChampionClass = {
  FIGHTER: 'FIGHTER',
  MAGE: 'MAGE',
  ASSASSIN: 'ASSASSIN',
  TANK: 'TANK',
  MARKSMAN: 'MARKSMAN',
  SUPPORT: 'SUPPORT',
  SPECIALIST: 'SPECIALIST'
};

const LaneAllocation = {
  STRONG_SIDE: 'STRONG_SIDE',
  WEAK_SIDE: 'WEAK_SIDE',
  NEUTRAL: 'NEUTRAL',
  ROAMING: 'ROAMING'
};

const ChampionRole = {
  ENGAGE: 'ENGAGE',
  PICKUP: 'PICKUP',
  PROTECT: 'PROTECT',
  SIEGE: 'SIEGE',
  SPLITPUSH: 'SPLITPUSH'
};

interface FilterBarProps {
  onFilterChange: (filters: any) => void;
}

export function ChampionFilterBar({ onFilterChange }: FilterBarProps) {
  const [filters, setFilters] = useState({
    role: 'ALL',
    gameVersion: '',
    compStyle: '',
    laneStyle: '',
    championClass: ''
  });

  const handleChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  return (
    <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-4">
      <div className="flex flex-wrap gap-4">
        {/* Role Filter */}
        <div className="space-y-1">
          <label className="text-xs text-slate-400 font-medium uppercase">Rol</label>
          <div className="flex bg-slate-950 rounded-lg p-1 border border-slate-800">
            {['ALL', 'TOP', 'JUNGLE', 'MID', 'ADC', 'SUPPORT'].map(role => (
              <button
                key={role}
                onClick={() => handleChange('role', role)}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  filters.role === role 
                    ? 'bg-blue-600 text-white' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {role === 'ALL' ? 'Todos' : role.substring(0, 3)}
              </button>
            ))}
          </div>
        </div>

        {/* Class Filter */}
        <div className="space-y-1">
          <label className="text-xs text-slate-400 font-medium uppercase">Clase</label>
          <select 
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500 w-32"
            value={filters.championClass}
            onChange={(e) => handleChange('championClass', e.target.value)}
          >
            <option value="">Todas</option>
            {Object.values(ChampionClass).map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Lane Style Filter */}
        <div className="space-y-1">
          <label className="text-xs text-slate-400 font-medium uppercase">Estilo Línea</label>
          <select 
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500 w-32"
            value={filters.laneStyle}
            onChange={(e) => handleChange('laneStyle', e.target.value)}
          >
            <option value="">Todos</option>
            {Object.values(LaneAllocation).map(c => (
              <option key={c} value={c}>{c.replace('_', ' ')}</option>
            ))}
          </select>
        </div>

        {/* Comp Style Filter */}
        <div className="space-y-1">
          <label className="text-xs text-slate-400 font-medium uppercase">Estilo Comp</label>
          <select 
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500 w-32"
            value={filters.compStyle}
            onChange={(e) => handleChange('compStyle', e.target.value)}
          >
            <option value="">Todos</option>
            {Object.values(ChampionRole).map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Version Filter */}
        <div className="space-y-1">
          <label className="text-xs text-slate-400 font-medium uppercase">Versión</label>
          <input 
            type="text" 
            placeholder="Ej: 14.5"
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500 w-24"
            value={filters.gameVersion}
            onChange={(e) => handleChange('gameVersion', e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
