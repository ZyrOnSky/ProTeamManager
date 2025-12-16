'use client';

import { useState } from 'react';
import { ArrowLeft, Ban, Swords, Trophy, Users, Plus, Trash2, Edit2, Save, X, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  addEnemyPlayer, updateEnemyPlayer, deleteEnemyPlayer, 
  addEnemyBan, updateEnemyBan, deleteEnemyBan, 
  addEnemyPick, updateEnemyPick, deleteEnemyPick,
  updateTeamDetails 
} from '../actions';
import { ManualStatsModal } from './ManualStatsModal';

interface TeamReportProps {
  report: any;
}

export function TeamReport({ report }: TeamReportProps) {
  const { team, stats, matches, roster, manualBans, manualPicks, tierLists } = report;
  const [activeTab, setActiveTab] = useState<'overview' | 'roster' | 'tierlists'>('overview');
  const [isEditingTeam, setIsEditingTeam] = useState(false);
  const [teamForm, setTeamForm] = useState({ opggUrl: team.opggUrl || '', notes: team.notes || '' });

  const handleSaveTeam = async () => {
    await updateTeamDetails(team.id, teamForm);
    setIsEditingTeam(false);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/analysis/scouting" className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
            <ArrowLeft size={24} />
          </Link>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              {team.name}
              {team.isRival && (
                <span className="text-sm font-medium bg-red-500/10 text-red-500 px-3 py-1 rounded-full">
                  RIVAL
                </span>
              )}
            </h1>
            <div className="flex items-center gap-2 text-slate-400">
              {isEditingTeam ? (
                <div className="flex items-center gap-2">
                  <input 
                    className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-sm"
                    placeholder="OP.GG URL"
                    value={teamForm.opggUrl}
                    onChange={e => setTeamForm({...teamForm, opggUrl: e.target.value})}
                  />
                  <button onClick={handleSaveTeam} className="p-1 hover:text-green-500"><Save size={16} /></button>
                  <button onClick={() => setIsEditingTeam(false)} className="p-1 hover:text-red-500"><X size={16} /></button>
                </div>
              ) : (
                <>
                  {team.opggUrl && (
                    <a href={team.opggUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-blue-400">
                      <ExternalLink size={14} /> OP.GG
                    </a>
                  )}
                  <button onClick={() => setIsEditingTeam(true)} className="ml-2 p-1 hover:text-blue-500">
                    <Edit2 size={14} />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-slate-800">
        <button 
          onClick={() => setActiveTab('overview')}
          className={`pb-3 px-2 font-medium transition-colors ${activeTab === 'overview' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-slate-400 hover:text-white'}`}
        >
          Resumen & Stats
        </button>
        <button 
          onClick={() => setActiveTab('roster')}
          className={`pb-3 px-2 font-medium transition-colors ${activeTab === 'roster' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-slate-400 hover:text-white'}`}
        >
          Roster Manual
        </button>
        <button 
          onClick={() => setActiveTab('tierlists')}
          className={`pb-3 px-2 font-medium transition-colors ${activeTab === 'tierlists' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-slate-400 hover:text-white'}`}
        >
          Tier Lists
        </button>
      </div>

      {/* Content */}
      {activeTab === 'overview' && (
        <OverviewTab 
          stats={stats} 
          team={team} 
          matches={matches} 
          manualBans={manualBans} 
          manualPicks={manualPicks} 
        />
      )}
      
      {activeTab === 'roster' && (
        <RosterTab teamId={team.id} roster={roster} />
      )}

      {activeTab === 'tierlists' && (
        <TierListsTab teamId={team.id} tierLists={tierLists} />
      )}
    </div>
  );
}

function OverviewTab({ stats, team, matches, manualBans, manualPicks }: any) {
  const [showBansModal, setShowBansModal] = useState(false);
  const [showPicksModal, setShowPicksModal] = useState(false);

  return (
    <div className="space-y-8">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
          <div className="text-slate-400 text-sm mb-1">Winrate vs Nosotros</div>
          <div className="text-3xl font-bold text-blue-500">{stats.winrate}%</div>
          <div className="text-xs text-slate-500 mt-1">
            {stats.ourWins}W - {stats.ourLosses}L
          </div>
        </div>
        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
          <div className="text-slate-400 text-sm mb-1">Partidas Totales</div>
          <div className="text-3xl font-bold text-white">{stats.totalMatches}</div>
        </div>
        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
          <div className="text-slate-400 text-sm mb-1">Último Enfrentamiento</div>
          <div className="text-lg font-bold text-white">
            {matches[0] 
              ? format(new Date(matches[0].date), "d MMM yyyy", { locale: es })
              : '-'}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Bans Analysis */}
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Ban className="text-red-500" size={20} />
              Sus Bans Más Frecuentes
            </h3>
            <button 
              onClick={() => setShowBansModal(true)}
              className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors"
              title="Editar Bans Manuales"
            >
              <Edit2 size={16} />
            </button>
          </div>
          <div className="space-y-4">
            {stats.topBans.map((ban: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center text-xs font-bold">
                    {idx + 1}
                  </div>
                  <span className="font-medium">{ban.champion}</span>
                </div>
                <div className="text-sm text-slate-400">
                  {ban.count} veces
                </div>
              </div>
            ))}
            {stats.topBans.length === 0 && (
              <div className="text-slate-500 text-center py-4">No hay datos de bans suficientes.</div>
            )}
          </div>
        </div>

        {/* Picks Analysis */}
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Swords className="text-blue-500" size={20} />
              Sus Picks Más Frecuentes
            </h3>
            <button 
              onClick={() => setShowPicksModal(true)}
              className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors"
              title="Editar Picks Manuales"
            >
              <Edit2 size={16} />
            </button>
          </div>
          <div className="space-y-4">
            {stats.topPicks.map((pick: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center text-xs font-bold">
                    {idx + 1}
                  </div>
                  <span className="font-medium">{pick.champion}</span>
                </div>
                <div className="text-sm text-slate-400">
                  {pick.count} veces
                </div>
              </div>
            ))}
            {stats.topPicks.length === 0 && (
              <div className="text-slate-500 text-center py-4">No hay datos de picks suficientes.</div>
            )}
          </div>
        </div>
      </div>

      <ManualStatsModal 
        isOpen={showBansModal}
        onClose={() => setShowBansModal(false)}
        title="Gestionar Bans Manuales"
        items={manualBans || []}
        onAdd={async (name) => { await addEnemyBan(team.id, { championName: name, count: 1 }); }}
        onUpdate={async (id, count) => { await updateEnemyBan(id, { count }); }}
        onDelete={async (id) => { await deleteEnemyBan(id); }}
      />

      <ManualStatsModal 
        isOpen={showPicksModal}
        onClose={() => setShowPicksModal(false)}
        title="Gestionar Picks Manuales"
        items={manualPicks || []}
        onAdd={async (name) => { await addEnemyPick(team.id, { championName: name, count: 1 }); }}
        onUpdate={async (id, count) => { await updateEnemyPick(id, { count }); }}
        onDelete={async (id) => { await deleteEnemyPick(id); }}
      />

      {/* Role Analysis */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
        <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
          <Users className="text-purple-500" size={20} />
          Prioridad por Rol
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {stats.topPicksByRole.map((roleData: any) => (
            <div key={roleData.role} className="bg-slate-950/50 p-4 rounded-lg">
              <div className="text-xs font-bold text-slate-500 mb-3 uppercase tracking-wider">
                {roleData.role}
              </div>
              <div className="space-y-2">
                {roleData.champions.map((champ: any, idx: number) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span>{champ.champion}</span>
                    <span className="text-slate-500">{champ.count}</span>
                  </div>
                ))}
                {roleData.champions.length === 0 && (
                  <div className="text-xs text-slate-600 italic">Sin datos</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Match History */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
        <div className="p-6 border-b border-slate-800">
          <h3 className="text-xl font-bold">Historial de Enfrentamientos</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-950/50 text-slate-400">
              <tr>
                <th className="p-4">Fecha</th>
                <th className="p-4">Resultado</th>
                <th className="p-4">Lado (Nuestro)</th>
                <th className="p-4">Duración</th>
                <th className="p-4">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {matches.map((match: any) => (
                <tr key={match.id} className="hover:bg-slate-800/50 transition-colors">
                  <td className="p-4">
                    {format(new Date(match.date), "d MMM yyyy", { locale: es })}
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                      match.result === 'WIN' ? 'bg-green-500/10 text-green-500' :
                      match.result === 'LOSS' ? 'bg-red-500/10 text-red-500' :
                      'bg-slate-500/10 text-slate-500'
                    }`}>
                      {match.result === 'WIN' ? 'VICTORIA' : match.result === 'LOSS' ? 'DERROTA' : 'EMPATE'}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                      match.ourSide === 'BLUE' ? 'text-blue-400' : 'text-red-400'
                    }`}>
                      {match.ourSide || '-'}
                    </span>
                  </td>
                  <td className="p-4">
                    {match.duration ? `${Math.floor(match.duration / 60)}:${(match.duration % 60).toString().padStart(2, '0')}` : '-'}
                  </td>
                  <td className="p-4">
                    <Link href={`/scrims/${match.id}`} className="text-blue-500 hover:underline">
                      Ver Detalles
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function RosterTab({ teamId, roster }: any) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', role: 'MID', opggUrl: '', notes: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      await updateEnemyPlayer(editingId, form as any);
      setEditingId(null);
    } else {
      await addEnemyPlayer(teamId, form as any);
    }
    setIsAdding(false);
    setForm({ name: '', role: 'MID', opggUrl: '', notes: '' });
  };

  const handleEdit = (player: any) => {
    setForm({
      name: player.name,
      role: player.role,
      opggUrl: player.opggUrl || '',
      notes: player.notes || ''
    });
    setEditingId(player.id);
    setIsAdding(true);
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingId(null);
    setForm({ name: '', role: 'MID', opggUrl: '', notes: '' });
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de eliminar este jugador?')) {
      await deleteEnemyPlayer(id);
    }
  };

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold">Roster Conocido</h3>
        <button 
          onClick={() => { setIsAdding(true); setEditingId(null); setForm({ name: '', role: 'MID', opggUrl: '', notes: '' }); }}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={16} /> Agregar Jugador
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleSubmit} className="bg-slate-950/50 p-4 rounded-lg mb-6 border border-slate-800">
          <h4 className="text-sm font-bold text-slate-400 mb-3">{editingId ? 'Editar Jugador' : 'Nuevo Jugador'}</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <input 
              placeholder="Nombre / Riot ID" 
              className="bg-slate-900 border border-slate-700 rounded px-3 py-2"
              value={form.name}
              onChange={e => setForm({...form, name: e.target.value})}
              required
            />
            <select 
              className="bg-slate-900 border border-slate-700 rounded px-3 py-2"
              value={form.role}
              onChange={e => setForm({...form, role: e.target.value})}
            >
              <option value="TOP">TOP</option>
              <option value="JUNGLE">JUNGLE</option>
              <option value="MID">MID</option>
              <option value="ADC">ADC</option>
              <option value="SUPPORT">SUPPORT</option>
            </select>
            <input 
              placeholder="OP.GG URL" 
              className="bg-slate-900 border border-slate-700 rounded px-3 py-2"
              value={form.opggUrl}
              onChange={e => setForm({...form, opggUrl: e.target.value})}
            />
            <input 
              placeholder="Notas" 
              className="bg-slate-900 border border-slate-700 rounded px-3 py-2"
              value={form.notes}
              onChange={e => setForm({...form, notes: e.target.value})}
            />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={handleCancel} className="px-3 py-1 text-slate-400 hover:text-white">Cancelar</button>
            <button type="submit" className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-white">Guardar</button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {roster?.map((player: any) => (
          <div key={player.id} className="bg-slate-950/50 p-4 rounded-lg border border-slate-800 flex justify-between items-start group">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-bold text-lg">{player.name}</span>
                <span className="text-xs font-bold bg-slate-800 px-2 py-0.5 rounded text-slate-300">{player.role}</span>
              </div>
              {player.opggUrl && (
                <a href={player.opggUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:underline flex items-center gap-1 mb-2">
                  <ExternalLink size={10} /> OP.GG
                </a>
              )}
              {player.notes && <p className="text-sm text-slate-400">{player.notes}</p>}
            </div>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={() => handleEdit(player)}
                className="p-1 text-slate-600 hover:text-blue-500"
              >
                <Edit2 size={16} />
              </button>
              <button 
                onClick={() => handleDelete(player.id)}
                className="p-1 text-slate-600 hover:text-red-500"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
        {(!roster || roster.length === 0) && !isAdding && (
          <div className="col-span-full text-center py-8 text-slate-500">
            No hay jugadores registrados manualmente.
          </div>
        )}
      </div>
    </div>
  );
}

function TierListsTab({ teamId, tierLists }: any) {
  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold">Tier Lists Asociadas</h3>
        <Link 
          href={`/analysis/meta/new?enemyTeamId=${teamId}`}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={16} /> Crear Tier List
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tierLists?.map((tl: any) => (
          <Link key={tl.id} href={`/analysis/meta/${tl.id}`} className="block bg-slate-950/50 p-4 rounded-lg border border-slate-800 hover:border-blue-500 transition-colors">
            <h4 className="font-bold text-lg mb-1">{tl.name}</h4>
            <p className="text-sm text-slate-400 mb-3">{tl.description || 'Sin descripción'}</p>
            <div className="flex gap-2">
              <span className="text-xs bg-slate-900 px-2 py-1 rounded text-slate-300">
                {tl.champions?.length || 0} Campeones
              </span>
              <span className="text-xs bg-slate-900 px-2 py-1 rounded text-slate-300">
                {format(new Date(tl.updatedAt), "d MMM", { locale: es })}
              </span>
            </div>
          </Link>
        ))}
        {(!tierLists || tierLists.length === 0) && (
          <div className="col-span-full text-center py-8 text-slate-500">
            No hay Tier Lists asociadas a este equipo.
          </div>
        )}
      </div>
    </div>
  );
}
