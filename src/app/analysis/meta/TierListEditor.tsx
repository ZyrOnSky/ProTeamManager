'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Save, Trash2, Plus, X, Search, Check, Filter, Settings, Circle, Square, Rows, LayoutGrid } from 'lucide-react';
import { updateTierList, deleteTierList } from './actions';
import ChampionIcon from '@/components/ChampionIcon';

interface Champion {
  id: string;
  name: string;
}

interface TierListChampion {
  championName: string;
  tier: string;
  role?: string;
  notes?: string;
}

interface TierListEditorProps {
  initialData?: {
    id: string;
    name: string;
    description: string | null;
    isActive: boolean;
    patchId?: string | null;
    enemyTeamId?: string | null;
    lineupId?: string | null;
    champions: TierListChampion[];
  };
  teams?: any[];
  lineups?: any[];
  patches?: any[];
}

const TIERS = ['S+', 'S', 'A', 'B', 'C', 'D'];
const ROLES = ['TOP', 'JUNGLE', 'MID', 'ADC', 'SUPPORT'];

export function TierListEditor({ initialData, teams = [], lineups = [], patches = [] }: TierListEditorProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  // Form State
  const [name, setName] = useState(initialData?.name || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [isActive, setIsActive] = useState(initialData?.isActive || false);
  const [patchId, setPatchId] = useState(initialData?.patchId || '');
  const [enemyTeamId, setEnemyTeamId] = useState(initialData?.enemyTeamId || '');
  const [lineupId, setLineupId] = useState(initialData?.lineupId || '');
  
  // View Settings
  const [viewMode, setViewMode] = useState<'TIER' | 'ROLE'>('TIER');
  const [viewRole, setViewRole] = useState<string>('ALL');
  const [iconSize, setIconSize] = useState<'sm' | 'md' | 'lg'>('md');
  const [iconShape, setIconShape] = useState<'square' | 'rounded' | 'circle'>('rounded');

  // Adding Settings
  const [targetRole, setTargetRole] = useState<string>('TOP'); // Default to TOP to encourage role assignment

  // Tier State
  const [tierChampions, setTierChampions] = useState<Record<string, TierListChampion[]>>(() => {
    const initial: Record<string, TierListChampion[]> = {};
    TIERS.forEach(t => initial[t] = []);
    
    if (initialData?.champions) {
      initialData.champions.forEach(c => {
        if (!initial[c.tier]) initial[c.tier] = [];
        initial[c.tier].push(c);
      });
    }
    return initial;
  });

  // Champion Selection State
  const [allChampions, setAllChampions] = useState<Champion[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTier, setSelectedTier] = useState<string>('S');

  // Fetch Champions
  useEffect(() => {
    const fetchChampions = async () => {
      try {
        const versionRes = await fetch("https://ddragon.leagueoflegends.com/api/versions.json");
        const versions = await versionRes.json();
        const latestVersion = versions[0];
        const res = await fetch(`https://ddragon.leagueoflegends.com/cdn/${latestVersion}/data/es_ES/champion.json`);
        const data = await res.json();
        const champList = Object.values(data.data).map((c: any) => ({
          id: c.id,
          name: c.name
        })).sort((a: any, b: any) => a.name.localeCompare(b.name));
        setAllChampions(champList);
      } catch (error) {
        console.error("Failed to fetch champions", error);
      }
    };
    fetchChampions();
  }, []);

  const handleAddChampion = (championName: string) => {
    // Check if already exists in any tier WITH THE SAME ROLE
    // Actually, a champion can appear multiple times if in different roles (e.g. Flex picks)
    const exists = Object.values(tierChampions).some(list => 
      list.some(c => c.championName === championName && c.role === targetRole)
    );

    if (exists) {
      // If it exists in the exact same role, remove it (toggle behavior)
      handleRemoveChampion(championName, targetRole);
      return;
    }

    setTierChampions(prev => ({
      ...prev,
      [selectedTier]: [...prev[selectedTier], { championName, tier: selectedTier, role: targetRole }]
    }));
  };

  const handleRemoveChampion = (championName: string, role?: string) => {
    setTierChampions(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(tier => {
        next[tier] = next[tier].filter(c => !(c.championName === championName && c.role === role));
      });
      return next;
    });
  };

  const handleSave = async () => {
    if (!initialData?.id) return;
    setSaving(true);

    // Flatten champions
    const championsToSave = Object.entries(tierChampions).flatMap(([tier, champs]) => 
      champs.map(c => ({ ...c, tier }))
    );

    try {
      await updateTierList(initialData.id, {
        name,
        description,
        isActive,
        patchId,
        enemyTeamId,
        lineupId,
        champions: championsToSave
      });
      router.refresh();
    } catch (error) {
      console.error("Error saving tier list", error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!initialData?.id || !confirm("¿Estás seguro de eliminar esta Tier List?")) return;
    await deleteTierList(initialData.id);
  };

  const filteredChampions = allChampions.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getIconSizeClass = () => {
    switch(iconSize) {
      case 'sm': return 'w-10 h-10';
      case 'lg': return 'w-20 h-20';
      default: return 'w-14 h-14';
    }
  };

  const getIconShapeClass = () => {
    switch(iconShape) {
      case 'circle': return 'rounded-full';
      case 'square': return 'rounded-none';
      default: return 'rounded-lg';
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[calc(100vh-100px)]">
      {/* Left Column: Editor */}
      <div className="lg:col-span-2 flex flex-col h-full overflow-hidden">
        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 space-y-4 mb-4 flex-shrink-0">
            <div className="flex flex-col md:flex-row justify-between items-start gap-4">
            <div className="space-y-4 flex-1 w-full">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-slate-400 mb-1">Nombre</label>
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="flex items-end pb-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-slate-300">Activa</span>
                  </label>
                </div>
              </div>
              
              {/* View Controls */}
              <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-slate-800">
                {/* View Mode Toggle */}
                <div className="flex bg-slate-950 rounded-lg p-1">
                  <button 
                    onClick={() => setViewMode('TIER')}
                    className={`p-2 rounded ${viewMode === 'TIER' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                    title="Vista por Tier"
                  >
                    <Rows size={18} />
                  </button>
                  <button 
                    onClick={() => setViewMode('ROLE')}
                    className={`p-2 rounded ${viewMode === 'ROLE' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                    title="Vista por Rol"
                  >
                    <LayoutGrid size={18} />
                  </button>
                </div>

                {viewMode === 'TIER' && (
                  <div className="flex items-center gap-2">
                    <Filter size={16} className="text-slate-500" />
                    <div className="flex bg-slate-950 rounded-lg p-1 overflow-x-auto max-w-[200px] md:max-w-none no-scrollbar">
                      <button 
                        onClick={() => setViewRole('ALL')}
                        className={`px-3 py-1 text-xs rounded whitespace-nowrap ${viewRole === 'ALL' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                      >
                        ALL
                      </button>
                      {ROLES.map(role => (
                        <button 
                          key={role}
                          onClick={() => setViewRole(role)}
                          className={`px-3 py-1 text-xs rounded whitespace-nowrap ${viewRole === role ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                          {role}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2 ml-auto">
                  <Settings size={16} className="text-slate-500" />
                  <div className="flex bg-slate-950 rounded-lg p-1 gap-1">
                    <button onClick={() => setIconSize('sm')} className={`p-1 rounded ${iconSize === 'sm' ? 'bg-slate-800 text-white' : 'text-slate-500'}`} title="Pequeño">S</button>
                    <button onClick={() => setIconSize('md')} className={`p-1 rounded ${iconSize === 'md' ? 'bg-slate-800 text-white' : 'text-slate-500'}`} title="Mediano">M</button>
                    <button onClick={() => setIconSize('lg')} className={`p-1 rounded ${iconSize === 'lg' ? 'bg-slate-800 text-white' : 'text-slate-500'}`} title="Grande">L</button>
                    <div className="w-px bg-slate-800 mx-1" />
                    <button onClick={() => setIconShape('square')} className={`p-1 rounded ${iconShape === 'square' ? 'bg-slate-800 text-white' : 'text-slate-500'}`}><Square size={14} /></button>
                    <button onClick={() => setIconShape('rounded')} className={`p-1 rounded ${iconShape === 'rounded' ? 'bg-slate-800 text-white' : 'text-slate-500'}`}><Square size={14} className="rounded-sm" /></button>
                    <button onClick={() => setIconShape('circle')} className={`p-1 rounded ${iconShape === 'circle' ? 'bg-slate-800 text-white' : 'text-slate-500'}`}><Circle size={14} /></button>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-row md:flex-col gap-2 w-full md:w-auto">
              <button 
                onClick={() => setShowSettings(true)}
                className="flex-1 md:flex-none bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors"
                title="Editar detalles"
              >
                <Settings size={18} />
                <span className="hidden md:inline">Detalles</span>
              </button>
              <button 
                onClick={handleSave}
                disabled={saving}
                className="flex-1 md:flex-none bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                <Save size={18} />
                {saving ? '...' : 'Guardar'}
              </button>
              {initialData?.id && (
                <button 
                  onClick={handleDelete}
                  className="flex-1 md:flex-none bg-red-500/10 hover:bg-red-500/20 text-red-500 px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors"
                >
                  <Trash2 size={18} />
                  Eliminar
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pr-2">
          {viewMode === 'TIER' ? (
            <div className="space-y-2">
              {TIERS.map(tier => (
                <div 
                  key={tier} 
                  onClick={() => setSelectedTier(tier)}
                  className={`flex rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                    selectedTier === tier ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className={`w-16 flex-shrink-0 flex items-center justify-center text-xl font-bold ${
                    tier === 'S+' ? 'bg-red-500 text-white' :
                    tier === 'S' ? 'bg-orange-500 text-white' :
                    tier === 'A' ? 'bg-yellow-500 text-black' :
                    tier === 'B' ? 'bg-green-500 text-white' :
                    tier === 'C' ? 'bg-blue-500 text-white' :
                    'bg-slate-600 text-white'
                  }`}>
                    {tier}
                  </div>
                  <div className="flex-1 bg-slate-900/50 p-2 min-h-[80px] flex flex-wrap gap-2 content-start">
                    {tierChampions[tier]
                      ?.filter(c => viewRole === 'ALL' || c.role === viewRole)
                      .map((champ, idx) => (
                      <div 
                        key={`${champ.championName}-${champ.role}-${idx}`} 
                        className={`relative group ${getIconSizeClass()} ${getIconShapeClass()} overflow-hidden border border-slate-700 bg-slate-800`}
                      >
                        <ChampionIcon 
                          championName={champ.championName}
                          fill
                          className="object-cover"
                        />
                        {/* Role Badge */}
                        {champ.role && (
                          <div className="absolute bottom-0 right-0 bg-black/80 text-[8px] text-white px-1 rounded-tl">
                            {champ.role.substring(0, 1)}
                          </div>
                        )}
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleRemoveChampion(champ.championName, champ.role); }}
                          className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={20} className="text-white" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-5 gap-2 h-full min-w-[800px]">
              {ROLES.map(role => (
                <div key={role} className="flex flex-col bg-slate-900/30 rounded-lg border border-slate-800 overflow-hidden">
                  <div className="bg-slate-900 p-2 text-center font-bold border-b border-slate-800 text-slate-300">
                    {role}
                  </div>
                  <div className="flex-1 overflow-y-auto p-1 space-y-1">
                    {TIERS.map(tier => {
                      const champsInTierAndRole = tierChampions[tier]?.filter(c => c.role === role) || [];
                      if (champsInTierAndRole.length === 0) return null;
                      
                      return (
                        <div key={tier} className="flex gap-1 bg-slate-950/50 rounded border border-slate-800/50 overflow-hidden">
                          <div className={`w-6 flex-shrink-0 flex items-center justify-center text-xs font-bold ${
                            tier === 'S+' ? 'bg-red-500 text-white' :
                            tier === 'S' ? 'bg-orange-500 text-white' :
                            tier === 'A' ? 'bg-yellow-500 text-black' :
                            tier === 'B' ? 'bg-green-500 text-white' :
                            tier === 'C' ? 'bg-blue-500 text-white' :
                            'bg-slate-600 text-white'
                          }`}>
                            {tier}
                          </div>
                          <div className="flex-1 p-1 flex flex-wrap gap-1">
                            {champsInTierAndRole.map((champ, idx) => (
                              <div 
                                key={`${champ.championName}-${idx}`}
                                className={`relative group w-8 h-8 ${getIconShapeClass()} overflow-hidden border border-slate-700 bg-slate-800`}
                              >
                                <ChampionIcon 
                                  championName={champ.championName}
                                  fill
                                  className="object-cover"
                                />
                                <button 
                                  onClick={(e) => { e.stopPropagation(); handleRemoveChampion(champ.championName, champ.role); }}
                                  className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <X size={12} className="text-white" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Champion Selector */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 flex flex-col h-full overflow-hidden">
        <div className="p-4 border-b border-slate-800 space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="font-bold">Añadir a Tier {selectedTier}</h3>
            <div className="flex bg-slate-950 rounded-lg p-1">
              {ROLES.map(role => (
                <button 
                  key={role}
                  onClick={() => setTargetRole(role)}
                  className={`w-8 h-8 flex items-center justify-center rounded text-[10px] font-bold ${
                    targetRole === role ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-800'
                  }`}
                  title={`Asignar a ${role}`}
                >
                  {role.substring(0, 1)}
                </button>
              ))}
            </div>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar campeón..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-4 gap-2">
            {filteredChampions.map(champ => {
              // Check if selected in current target role
              const isSelected = Object.values(tierChampions).some(list => 
                list.some(c => c.championName === champ.id && c.role === targetRole)
              );

              return (
                <button
                  key={champ.id}
                  onClick={() => handleAddChampion(champ.id)}
                  className={`relative aspect-square rounded-lg overflow-hidden border transition-all ${
                    isSelected 
                      ? 'border-blue-500 opacity-50' 
                      : 'border-slate-700 hover:border-blue-400'
                  }`}
                >
                  <ChampionIcon 
                    championName={champ.id}
                    fill
                    className="object-cover"
                  />
                  {isSelected && (
                    <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                      <Check size={24} className="text-white drop-shadow-md" />
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-[10px] text-center text-white truncate px-1">
                    {champ.name}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-xl border border-slate-800 w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center">
              <h2 className="text-xl font-bold">Detalles de Tier List</h2>
              <button onClick={() => setShowSettings(false)} className="text-slate-400 hover:text-white">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Nombre</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Descripción</label>
                <textarea 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500 h-24 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Parche</label>
                  <select 
                    value={patchId}
                    onChange={(e) => setPatchId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
                  >
                    <option value="">Seleccionar Parche</option>
                    {patches.map(p => (
                      <option key={p.id} value={p.id}>{p.version}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Equipo (Scouting)</label>
                  <select 
                    value={enemyTeamId}
                    onChange={(e) => setEnemyTeamId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
                  >
                    <option value="">Ninguno</option>
                    {teams.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Lineup</label>
                <select 
                  value={lineupId}
                  onChange={(e) => setLineupId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
                >
                  <option value="">Ninguno</option>
                  {lineups.map(l => (
                    <option key={l.id} value={l.id}>{l.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input 
                  type="checkbox" 
                  id="isActiveModal"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="isActiveModal" className="text-sm text-slate-300 cursor-pointer">Marcar como Activa</label>
              </div>
            </div>

            <div className="p-6 border-t border-slate-800 flex justify-end gap-2">
              <button 
                onClick={() => setShowSettings(false)}
                className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={() => { setShowSettings(false); handleSave(); }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
