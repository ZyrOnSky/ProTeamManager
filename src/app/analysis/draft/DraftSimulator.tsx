'use client';

import { useState, useEffect } from 'react';
import { Search, RotateCcw, Save, Info } from 'lucide-react';
import { updateDraftPlan } from './actions';

interface DraftSimulatorProps {
  draftId: string;
  initialData: any;
  ourSide: 'BLUE' | 'RED';
  context: {
    tierList: any[];
    ourStats: Record<string, { played: number, winrate: number, kda: string, tier?: string, role?: string }>;
    enemyStats: Record<string, { played: number, winrate: number }>;
  };
}

const DRAFT_ORDER = [
  { side: 'BLUE', type: 'BAN', index: 0 },
  { side: 'RED', type: 'BAN', index: 0 },
  { side: 'BLUE', type: 'BAN', index: 1 },
  { side: 'RED', type: 'BAN', index: 1 },
  { side: 'BLUE', type: 'BAN', index: 2 },
  { side: 'RED', type: 'BAN', index: 2 },
  { side: 'BLUE', type: 'PICK', index: 0 },
  { side: 'RED', type: 'PICK', index: 0 },
  { side: 'RED', type: 'PICK', index: 1 },
  { side: 'BLUE', type: 'PICK', index: 1 },
  { side: 'BLUE', type: 'PICK', index: 2 },
  { side: 'RED', type: 'PICK', index: 2 },
  { side: 'RED', type: 'BAN', index: 3 },
  { side: 'BLUE', type: 'BAN', index: 3 },
  { side: 'RED', type: 'BAN', index: 4 },
  { side: 'BLUE', type: 'BAN', index: 4 },
  { side: 'RED', type: 'PICK', index: 3 },
  { side: 'BLUE', type: 'PICK', index: 3 },
  { side: 'BLUE', type: 'PICK', index: 4 },
  { side: 'RED', type: 'PICK', index: 4 },
];

export function DraftSimulator({ draftId, initialData, ourSide, context }: DraftSimulatorProps) {
  const [step, setStep] = useState(0);
  const [blueBans, setBlueBans] = useState<string[]>(initialData.blueBans || Array(5).fill(null));
  const [redBans, setRedBans] = useState<string[]>(initialData.redBans || Array(5).fill(null));
  const [bluePicks, setBluePicks] = useState<string[]>(initialData.bluePicks || Array(5).fill(null));
  const [redPicks, setRedPicks] = useState<string[]>(initialData.redPicks || Array(5).fill(null));
  
  const [champions, setChampions] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [saving, setSaving] = useState(false);
  const [hoveredChampion, setHoveredChampion] = useState<string | null>(null);

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
          name: c.name,
          tags: c.tags
        })).sort((a: any, b: any) => a.name.localeCompare(b.name));
        setChampions(champList);
      } catch (error) {
        console.error("Failed to fetch champions", error);
      }
    };
    fetchChampions();
  }, []);

  const currentAction = DRAFT_ORDER[step] || { side: 'END', type: 'END', index: -1 };
  const isComplete = step >= DRAFT_ORDER.length;

  const handleSelectChampion = (championId: string) => {
    if (isComplete) return;

    // Check if already picked or banned
    const isTaken = [...blueBans, ...redBans, ...bluePicks, ...redPicks].includes(championId);
    if (isTaken) return;

    const { side, type, index } = currentAction;

    if (side === 'BLUE') {
      if (type === 'BAN') {
        const newBans = [...blueBans];
        newBans[index] = championId;
        setBlueBans(newBans);
      } else {
        const newPicks = [...bluePicks];
        newPicks[index] = championId;
        setBluePicks(newPicks);
      }
    } else {
      if (type === 'BAN') {
        const newBans = [...redBans];
        newBans[index] = championId;
        setRedBans(newBans);
      } else {
        const newPicks = [...redPicks];
        newPicks[index] = championId;
        setRedPicks(newPicks);
      }
    }

    // Auto advance
    setStep(prev => Math.min(prev + 1, DRAFT_ORDER.length));
  };

  const handleUndo = () => {
    if (step === 0) return;
    const prevStep = step - 1;
    const { side, type, index } = DRAFT_ORDER[prevStep];

    if (side === 'BLUE') {
      if (type === 'BAN') {
        const newBans = [...blueBans];
        newBans[index] = null as any; // Reset
        setBlueBans(newBans);
      } else {
        const newPicks = [...bluePicks];
        newPicks[index] = null as any;
        setBluePicks(newPicks);
      }
    } else {
      if (type === 'BAN') {
        const newBans = [...redBans];
        newBans[index] = null as any;
        setRedBans(newBans);
      } else {
        const newPicks = [...redPicks];
        newPicks[index] = null as any;
        setRedPicks(newPicks);
      }
    }
    setStep(prevStep);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateDraftPlan(draftId, {
        blueBans: blueBans.filter(Boolean),
        redBans: redBans.filter(Boolean),
        bluePicks: bluePicks.filter(Boolean),
        redPicks: redPicks.filter(Boolean),
      });
    } catch (error) {
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const filteredChampions = champions.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Helper to get stats for a champion
  const getChampionStats = (champId: string) => {
    const tierInfo = context.tierList.find(c => c.championName === champId);
    const ourStat = context.ourStats[champId];
    const enemyStat = context.enemyStats[champId];
    return { tierInfo, ourStat, enemyStat };
  };

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Header / Status Bar */}
      <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className={`px-4 py-2 rounded-lg font-bold ${
            isComplete ? 'bg-slate-800 text-slate-400' :
            currentAction.side === 'BLUE' ? 'bg-blue-900/50 text-blue-400 border border-blue-500/50' : 
            'bg-red-900/50 text-red-400 border border-red-500/50'
          }`}>
            {isComplete ? 'DRAFT COMPLETO' : (
              <>
                {currentAction.side === 'BLUE' ? 'BLUE' : 'RED'} {currentAction.type}
              </>
            )}
          </div>
          <div className="text-slate-400 text-sm">
            Paso {step + 1} / {DRAFT_ORDER.length}
          </div>
        </div>
        
        <div className="flex gap-2">
          <button 
            onClick={handleUndo}
            disabled={step === 0}
            className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white disabled:opacity-50"
            title="Deshacer último paso"
          >
            <RotateCcw size={20} />
          </button>
          <button 
            onClick={handleSave}
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 disabled:opacity-50"
          >
            <Save size={18} />
            {saving ? 'Guardando...' : 'Guardar Progreso'}
          </button>
        </div>
      </div>

      {/* Main Draft Area */}
      <div className="flex-1 flex gap-4 min-h-0">
        {/* Blue Side */}
        <div className="w-64 flex flex-col gap-2">
          <div className="bg-blue-900/20 p-2 rounded text-center font-bold text-blue-400 border border-blue-500/30">
            BLUE SIDE
          </div>
          
          {/* Bans */}
          <div className="flex gap-1 justify-center mb-4">
            {blueBans.map((ban, i) => (
              <div key={i} className="w-10 h-10 bg-slate-900 border border-slate-800 rounded overflow-hidden relative">
                {ban && (
                  <>
                    <img src={`https://ddragon.leagueoflegends.com/cdn/14.24.1/img/champion/${ban}.png`} className="w-full h-full object-cover opacity-60 grayscale" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-full h-0.5 bg-red-500 rotate-45 absolute" />
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>

          {/* Picks */}
          <div className="flex-1 space-y-2">
            {bluePicks.map((pick, i) => (
              <div key={i} className={`h-24 bg-slate-900 border ${
                currentAction.side === 'BLUE' && currentAction.type === 'PICK' && currentAction.index === i && !isComplete
                  ? 'border-blue-500 animate-pulse' 
                  : 'border-slate-800'
              } rounded-lg overflow-hidden relative group`}>
                {pick ? (
                  <>
                    <img src={`https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${pick}_0.jpg`} className="w-full h-full object-cover" />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-2">
                      <span className="font-bold text-white">{pick}</span>
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-700 font-bold text-2xl">
                    {i + 1}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Champion Select Area (Center) */}
        <div className="flex-1 bg-slate-900 rounded-xl border border-slate-800 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex items-center gap-4">
            <div className="relative flex-1">
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar campeón..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:border-blue-500 text-lg"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={20} />
            </div>
            
            {/* Stats Panel (Contextual) */}
            <div className="w-96 bg-slate-950 rounded-lg border border-slate-800 p-3 flex items-center gap-4 shadow-xl">
              {hoveredChampion ? (
                <>
                  <div className="w-14 h-14 rounded-lg overflow-hidden border border-slate-700 shrink-0">
                    <img src={`https://ddragon.leagueoflegends.com/cdn/14.24.1/img/champion/${hoveredChampion}.png`} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-lg leading-none">{hoveredChampion}</span>
                        {getChampionStats(hoveredChampion).ourStat?.role && (
                          <span className="text-xs text-slate-400 uppercase font-medium bg-slate-900 px-1.5 py-0.5 rounded">
                            {getChampionStats(hoveredChampion).ourStat?.role}
                          </span>
                        )}
                      </div>
                      {getChampionStats(hoveredChampion).tierInfo && (
                         <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                           getChampionStats(hoveredChampion).tierInfo.tier.startsWith('S') ? 'bg-orange-500/20 text-orange-400 border border-orange-500/50' : 
                           getChampionStats(hoveredChampion).tierInfo.tier === 'A' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50' : 
                           'bg-slate-800 text-slate-400 border border-slate-700'
                         }`}>
                           Tier {getChampionStats(hoveredChampion).tierInfo.tier}
                         </span>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 text-xs">
                       <div className="bg-slate-900 rounded px-2 py-1.5 text-center border border-slate-800">
                          <div className="text-slate-500 text-[10px] uppercase font-bold mb-0.5">Win Rate</div>
                          <div className={`font-bold text-sm ${
                             (getChampionStats(hoveredChampion).ourStat?.winrate || 0) >= 50 ? 'text-green-400' : 'text-red-400'
                          }`}>
                             {getChampionStats(hoveredChampion).ourStat?.winrate || 0}%
                          </div>
                       </div>
                       <div className="bg-slate-900 rounded px-2 py-1.5 text-center border border-slate-800">
                          <div className="text-slate-500 text-[10px] uppercase font-bold mb-0.5">KDA</div>
                          <div className="font-bold text-sm text-blue-300">
                             {getChampionStats(hoveredChampion).ourStat?.kda || '0.0'}
                          </div>
                       </div>
                       <div className="bg-slate-900 rounded px-2 py-1.5 text-center border border-slate-800">
                          <div className="text-slate-500 text-[10px] uppercase font-bold mb-0.5">Games</div>
                          <div className="font-bold text-sm text-slate-300">
                             {getChampionStats(hoveredChampion).ourStat?.played || 0}
                          </div>
                       </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-3 text-slate-500 text-sm w-full justify-center py-2">
                  <Info size={20} />
                  <span>Pasa el mouse sobre un campeón para ver estadísticas</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4">
            <div className="grid grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
              {filteredChampions.map(champ => {
                const isTaken = [...blueBans, ...redBans, ...bluePicks, ...redPicks].includes(champ.id);
                const stats = getChampionStats(champ.id);
                
                return (
                  <button
                    key={champ.id}
                    onClick={() => handleSelectChampion(champ.id)}
                    onMouseEnter={() => setHoveredChampion(champ.id)}
                    onMouseLeave={() => setHoveredChampion(null)}
                    disabled={isTaken || isComplete}
                    className={`relative aspect-square rounded-lg overflow-hidden border transition-all group ${
                      isTaken 
                        ? 'border-slate-800 opacity-30 grayscale cursor-not-allowed' 
                        : 'border-slate-700 hover:border-blue-400 hover:scale-105 z-0 hover:z-10'
                    }`}
                  >
                    <img 
                      src={`https://ddragon.leagueoflegends.com/cdn/14.24.1/img/champion/${champ.id}.png`} 
                      alt={champ.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    
                    {/* Tier Badge */}
                    {stats.tierInfo && !isTaken && (
                      <div className={`absolute top-0 right-0 px-1.5 py-0.5 text-[10px] font-bold rounded-bl ${
                        stats.tierInfo.tier === 'S+' ? 'bg-red-600 text-white' :
                        stats.tierInfo.tier === 'S' ? 'bg-orange-500 text-white' :
                        stats.tierInfo.tier === 'A' ? 'bg-yellow-500 text-black' :
                        'bg-slate-600 text-white'
                      }`}>
                        {stats.tierInfo.tier}
                      </div>
                    )}

                    {/* Winrate Badge (if high) */}
                    {stats.ourStat && stats.ourStat.winrate >= 60 && !isTaken && (
                      <div className="absolute top-0 left-0 px-1.5 py-0.5 text-[10px] font-bold bg-blue-600 text-white rounded-br">
                        {stats.ourStat.winrate}%
                      </div>
                    )}

                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-[10px] text-center text-white truncate px-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {champ.name}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Red Side */}
        <div className="w-64 flex flex-col gap-2">
          <div className="bg-red-900/20 p-2 rounded text-center font-bold text-red-400 border border-red-500/30">
            RED SIDE
          </div>

          {/* Bans */}
          <div className="flex gap-1 justify-center mb-4">
            {redBans.map((ban, i) => (
              <div key={i} className="w-10 h-10 bg-slate-900 border border-slate-800 rounded overflow-hidden relative">
                {ban && (
                  <>
                    <img src={`https://ddragon.leagueoflegends.com/cdn/14.24.1/img/champion/${ban}.png`} className="w-full h-full object-cover opacity-60 grayscale" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-full h-0.5 bg-red-500 rotate-45 absolute" />
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>

          {/* Picks */}
          <div className="flex-1 space-y-2">
            {redPicks.map((pick, i) => (
              <div key={i} className={`h-24 bg-slate-900 border ${
                currentAction.side === 'RED' && currentAction.type === 'PICK' && currentAction.index === i && !isComplete
                  ? 'border-red-500 animate-pulse' 
                  : 'border-slate-800'
              } rounded-lg overflow-hidden relative group`}>
                {pick ? (
                  <>
                    <img src={`https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${pick}_0.jpg`} className="w-full h-full object-cover" />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-2">
                      <span className="font-bold text-white">{pick}</span>
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-700 font-bold text-2xl">
                    {i + 1}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
