'use client';

import { useState } from 'react';
import { updateChampionMetaAction } from '../actions';
import ChampionIcon from '@/components/ChampionIcon';
import { ArrowLeft, Save, Edit2, X } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

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

const Position = {
  TOP: 'TOP',
  JUNGLE: 'JUNGLE',
  MID: 'MID',
  ADC: 'ADC',
  SUPPORT: 'SUPPORT'
};

interface ChampionDetailViewProps {
  championName: string;
  initialData: any;
}

export default function ChampionDetailView({ championName, initialData }: ChampionDetailViewProps) {
  const [data, setData] = useState(initialData);
  const [activeTab, setActiveTab] = useState<'stats' | 'matches' | 'notes'>('stats');
  
  // Edit Mode State
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    laneStyle: data.definition?.laneStyle || '',
    compStyle: data.definition?.compStyle || '',
    compStyleSecondary: data.definition?.compStyleSecondary || '',
    class: data.definition?.class || '',
    primaryRole: data.definition?.primaryRole || '',
    secondaryRole: data.definition?.secondaryRole || '',
    notes: data.definition?.notes || ''
  });

  const handleSaveMeta = async () => {
    await updateChampionMetaAction(championName, {
      laneStyle: editForm.laneStyle as any || null,
      compStyle: editForm.compStyle as any || null,
      compStyleSecondary: editForm.compStyleSecondary as any || null,
      class: editForm.class as any || null,
      primaryRole: editForm.primaryRole as any || null,
      secondaryRole: editForm.secondaryRole as any || null,
      notes: editForm.notes
    });
    
    setData({
      ...data,
      definition: {
        ...data.definition,
        laneStyle: editForm.laneStyle || null,
        compStyle: editForm.compStyle || null,
        compStyleSecondary: editForm.compStyleSecondary || null,
        class: editForm.class || null,
        primaryRole: editForm.primaryRole || null,
        secondaryRole: editForm.secondaryRole || null,
        notes: editForm.notes
      }
    });
    
    setIsEditing(false);
  };

  return (
    <div className="space-y-6">
      {/* Header & Champion Card */}
      <div className="flex items-start gap-6">
        <Link href="/analysis/stats" className="p-2 hover:bg-slate-800 rounded-lg transition-colors mt-2">
          <ArrowLeft size={24} />
        </Link>
        
        <div className="flex-1 bg-slate-900 border border-slate-800 rounded-xl p-6">
          <div className="flex gap-6">
            <div className="relative w-32 h-32 rounded-xl overflow-hidden border-2 border-slate-700 shadow-lg">
              <ChampionIcon 
                championName={championName}
                fill
                className="object-cover"
              />
            </div>
            
            <div className="flex-1 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-4xl font-bold text-white">{championName}</h1>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {data.definition?.class && (
                      <span className="px-2 py-1 bg-purple-500/20 text-purple-400 text-xs font-bold rounded uppercase">
                        {data.definition.class}
                      </span>
                    )}
                    {data.definition?.laneStyle && (
                      <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs font-bold rounded uppercase">
                        {data.definition.laneStyle.replace('_', ' ')}
                      </span>
                    )}
                    {data.definition?.compStyle && (
                      <span className="px-2 py-1 bg-orange-500/20 text-orange-400 text-xs font-bold rounded uppercase">
                        {data.definition.compStyle}
                      </span>
                    )}
                    {data.definition?.compStyleSecondary && (
                      <span className="px-2 py-1 bg-orange-500/10 text-orange-300 text-xs font-bold rounded uppercase border border-orange-500/20">
                        {data.definition.compStyleSecondary}
                      </span>
                    )}
                    {data.definition?.primaryRole && (
                      <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs font-bold rounded uppercase">
                        {data.definition.primaryRole}
                      </span>
                    )}
                    {data.definition?.secondaryRole && (
                      <span className="px-2 py-1 bg-green-500/10 text-green-300 text-xs font-bold rounded uppercase border border-green-500/20">
                        {data.definition.secondaryRole}
                      </span>
                    )}
                  </div>
                </div>
                
                <button 
                  onClick={() => setIsEditing(!isEditing)}
                  className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
                >
                  {isEditing ? <X size={20} /> : <Edit2 size={20} />}
                </button>
              </div>

              {isEditing && (
                <div className="grid grid-cols-3 gap-4 bg-slate-950 p-4 rounded-lg border border-slate-800">
                  <div>
                    <label className="text-xs text-slate-500 uppercase font-bold block mb-1">Clase</label>
                    <select 
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-sm"
                      value={editForm.class}
                      onChange={e => setEditForm({...editForm, class: e.target.value})}
                    >
                      <option value="">Sin asignar</option>
                      {Object.values(ChampionClass).map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 uppercase font-bold block mb-1">Estilo Línea</label>
                    <select 
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-sm"
                      value={editForm.laneStyle}
                      onChange={e => setEditForm({...editForm, laneStyle: e.target.value})}
                    >
                      <option value="">Sin asignar</option>
                      {Object.values(LaneAllocation).map(c => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 uppercase font-bold block mb-1">Estilo Comp (Primario)</label>
                    <select 
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-sm"
                      value={editForm.compStyle}
                      onChange={e => setEditForm({...editForm, compStyle: e.target.value})}
                    >
                      <option value="">Sin asignar</option>
                      {Object.values(ChampionRole).map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 uppercase font-bold block mb-1">Estilo Comp (Secundario)</label>
                    <select 
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-sm"
                      value={editForm.compStyleSecondary}
                      onChange={e => setEditForm({...editForm, compStyleSecondary: e.target.value})}
                    >
                      <option value="">Sin asignar</option>
                      {Object.values(ChampionRole).map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 uppercase font-bold block mb-1">Rol Principal</label>
                    <select 
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-sm"
                      value={editForm.primaryRole}
                      onChange={e => setEditForm({...editForm, primaryRole: e.target.value})}
                    >
                      <option value="">Sin asignar</option>
                      {Object.values(Position).map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 uppercase font-bold block mb-1">Rol Secundario</label>
                    <select 
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-sm"
                      value={editForm.secondaryRole}
                      onChange={e => setEditForm({...editForm, secondaryRole: e.target.value})}
                    >
                      <option value="">Sin asignar</option>
                      {Object.values(Position).map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="col-span-3 flex justify-end">
                    <button 
                      onClick={handleSaveMeta}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1 rounded text-sm font-medium flex items-center gap-2"
                    >
                      <Save size={14} /> Guardar Cambios
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-800 flex gap-6">
        <button 
          onClick={() => setActiveTab('stats')}
          className={`pb-3 font-medium transition-colors ${activeTab === 'stats' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-slate-400 hover:text-white'}`}
        >
          Estadísticas
        </button>
        <button 
          onClick={() => setActiveTab('matches')}
          className={`pb-3 font-medium transition-colors ${activeTab === 'matches' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-slate-400 hover:text-white'}`}
        >
          Lista de Partidas
        </button>
        <button 
          onClick={() => setActiveTab('notes')}
          className={`pb-3 font-medium transition-colors ${activeTab === 'notes' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-slate-400 hover:text-white'}`}
        >
          Notas
        </button>
      </div>

      {/* Content */}
      {activeTab === 'stats' && (
        <div className="space-y-6">
          {/* Key Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900 p-5 rounded-xl border border-slate-800">
              <div className="text-sm text-slate-400 mb-1">Win Rate</div>
              <div className="text-3xl font-bold text-white">{data.stats.winrate}%</div>
              <div className="text-xs text-slate-500 mt-1">{data.stats.wins}W - {data.stats.games - data.stats.wins}L</div>
            </div>
            <div className="bg-slate-900 p-5 rounded-xl border border-slate-800">
              <div className="text-sm text-slate-400 mb-1">KDA</div>
              <div className="text-3xl font-bold text-blue-400">{data.stats.kda}</div>
              <div className="text-xs text-slate-500 mt-1">
                {data.stats.games > 0 ? (data.stats.kills / data.stats.games).toFixed(1) : 0} / {data.stats.games > 0 ? (data.stats.deaths / data.stats.games).toFixed(1) : 0} / {data.stats.games > 0 ? (data.stats.assists / data.stats.games).toFixed(1) : 0}
              </div>
            </div>
            <div className="bg-slate-900 p-5 rounded-xl border border-slate-800">
              <div className="text-sm text-slate-400 mb-1">CS/M</div>
              <div className="text-3xl font-bold text-yellow-400">{data.stats.csm}</div>
              <div className="text-xs text-slate-500 mt-1">Promedio</div>
            </div>
            <div className="bg-slate-900 p-5 rounded-xl border border-slate-800">
              <div className="text-sm text-slate-400 mb-1">Presencia Global</div>
              <div className="flex justify-between items-end gap-1">
                <div>
                  <div className="text-xl font-bold text-white">{data.picks.total} Picks</div>
                  <div className="text-[10px] text-slate-500">Nuestros</div>
                </div>
                <div className="text-center border-l border-r border-slate-800 px-2">
                  <div className="text-xl font-bold text-orange-400">{data.playedAgainst?.total || 0} Vs</div>
                  <div className="text-[10px] text-slate-500">En contra</div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-red-400">{data.bans.total} Bans</div>
                  <div className="text-[10px] text-slate-500">Total</div>
                </div>
              </div>
            </div>
          </div>

          {/* Role Stats */}
          <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
            <h3 className="text-lg font-bold mb-4">Rendimiento por Rol</h3>
            <div className="space-y-4">
              {data.roleStats.map((role: any) => (
                <div key={role.role} className="flex items-center gap-4">
                  <div className="w-16 font-medium text-slate-300">{role.role}</div>
                  <div className="flex-1 bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${role.winrate >= 50 ? 'bg-blue-500' : 'bg-slate-500'}`} 
                      style={{ width: `${role.winrate}%` }}
                    />
                  </div>
                  <div className="w-32 text-right text-sm">
                    <span className="font-bold text-white">{role.winrate}% WR</span>
                    <span className="text-slate-500 ml-2">({role.games} games)</span>
                  </div>
                  <div className="w-16 text-right text-sm font-medium text-blue-400">{role.kda} KDA</div>
                </div>
              ))}
            </div>
          </div>

          {/* Player Stats */}
          <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
            <h3 className="text-lg font-bold mb-4">Top Jugadores</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.playerStats.map((player: any) => (
                <div key={player.name} className="bg-slate-950 p-4 rounded-lg border border-slate-800 flex justify-between items-center">
                  <div>
                    <div className="font-bold text-white">{player.name}</div>
                    <div className="text-xs text-slate-500">{player.games} Partidas</div>
                  </div>
                  <div className="text-right">
                    <div className={`font-bold ${player.winrate >= 60 ? 'text-green-400' : 'text-slate-200'}`}>
                      {player.winrate}% WR
                    </div>
                    <div className="text-xs text-blue-400">{player.kda} KDA</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'matches' && (
        <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-950 text-slate-400">
              <tr>
                <th className="p-4">Jugador</th>
                <th className="p-4">Resultado</th>
                <th className="p-4">KDA</th>
                <th className="p-4">CS/M</th>
                <th className="p-4">Vs Campeón</th>
                <th className="p-4">Fecha</th>
                <th className="p-4">Tipo</th>
                <th className="p-4">Lado</th>
                <th className="p-4">Equipo Rival</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {data.matches.map((match: any) => (
                <tr key={match.id} className="hover:bg-slate-800/50 transition-colors">
                  <td className="p-4 font-medium text-white">{match.player}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                      match.result === 'WIN' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                    }`}>
                      {match.result}
                    </span>
                  </td>
                  <td className="p-4 text-blue-400 font-medium">{match.kda}</td>
                  <td className="p-4 text-yellow-400">{match.csm}</td>
                  <td className="p-4 text-slate-300">{match.opponentChamp}</td>
                  <td className="p-4 text-slate-400">{format(new Date(match.date), 'dd/MM/yyyy', { locale: es })}</td>
                  <td className="p-4 text-slate-400">{match.type}</td>
                  <td className={`p-4 font-medium ${match.side === 'BLUE' ? 'text-blue-400' : 'text-red-400'}`}>
                    {match.side}
                  </td>
                  <td className="p-4 text-slate-300">{match.enemyTeam}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'notes' && (
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold">Notas del Campeón</h3>
            {!isEditing && (
              <button 
                onClick={() => setIsEditing(true)}
                className="text-blue-400 hover:text-blue-300 text-sm font-medium"
              >
                Editar Notas
              </button>
            )}
          </div>
          
          {isEditing ? (
            <div className="space-y-4">
              <textarea
                className="w-full h-64 bg-slate-950 border border-slate-800 rounded-lg p-4 text-slate-200 focus:outline-none focus:border-blue-500"
                value={editForm.notes}
                onChange={e => setEditForm({...editForm, notes: e.target.value})}
                placeholder="Escribe aquí tus notas sobre el campeón, matchups, power spikes, etc..."
              />
              <div className="flex justify-end">
                <button 
                  onClick={handleSaveMeta}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium"
                >
                  Guardar Notas
                </button>
              </div>
            </div>
          ) : (
            <div className="prose prose-invert max-w-none">
              {data.definition?.notes ? (
                <p className="whitespace-pre-wrap text-slate-300">{data.definition.notes}</p>
              ) : (
                <p className="text-slate-500 italic">No hay notas registradas para este campeón.</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
