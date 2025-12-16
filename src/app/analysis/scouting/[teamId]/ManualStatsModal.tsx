'use client';

import { useState, useEffect } from 'react';
import { X, Plus, Minus, Search, Trash2 } from 'lucide-react';
import ChampionIcon from '@/components/ChampionIcon';

interface ManualStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  items: Array<{ id: string; championName: string; count: number }>;
  onAdd: (championName: string) => Promise<void>;
  onUpdate: (id: string, count: number) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function ManualStatsModal({ isOpen, onClose, title, items, onAdd, onUpdate, onDelete }: ManualStatsModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [allChampions, setAllChampions] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(false);

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
    if (isOpen) {
      fetchChampions();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredChampions = allChampions.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAdd = async (championName: string) => {
    // Check if already exists
    const existing = items.find(i => i.championName === championName);
    if (existing) {
      await onUpdate(existing.id, existing.count + 1);
    } else {
      await onAdd(championName);
    }
    setSearchQuery('');
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 rounded-xl border border-slate-800 w-full max-w-2xl shadow-2xl flex flex-col max-h-[85vh]">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
          <h2 className="text-xl font-bold">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          {/* Left: Current List */}
          <div className="flex-1 p-4 overflow-y-auto border-r border-slate-800">
            <h3 className="text-sm font-medium text-slate-400 mb-4">Registrados ({items.length})</h3>
            <div className="space-y-3">
              {items.length === 0 && (
                <div className="text-center text-slate-500 py-8">
                  No hay registros manuales aún.
                </div>
              )}
              {items.map(item => (
                <div key={item.id} className="flex items-center justify-between bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded overflow-hidden border border-slate-700 relative">
                      <ChampionIcon championName={item.championName} fill className="object-cover" />
                    </div>
                    <span className="font-medium">{item.championName}</span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col items-center gap-1">
                      <button 
                        onClick={() => onUpdate(item.id, item.count + 1)}
                        className="p-1 hover:bg-slate-800 rounded text-green-500"
                      >
                        <Plus size={14} />
                      </button>
                      <span className="font-bold text-lg leading-none">{item.count}</span>
                      <button 
                        onClick={() => {
                          if (item.count > 1) onUpdate(item.id, item.count - 1);
                          else onDelete(item.id);
                        }}
                        className="p-1 hover:bg-slate-800 rounded text-red-500"
                      >
                        <Minus size={14} />
                      </button>
                    </div>
                    <button 
                      onClick={() => onDelete(item.id)}
                      className="p-2 text-slate-600 hover:text-red-500 transition-colors ml-2"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Add New */}
          <div className="w-full md:w-72 p-4 flex flex-col bg-slate-950/50">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar campeón..."
                className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="grid grid-cols-3 gap-2">
                {filteredChampions.map(champ => (
                  <button
                    key={champ.id}
                    onClick={() => handleAdd(champ.id)}
                    className="relative aspect-square rounded-lg overflow-hidden border border-slate-800 hover:border-blue-500 transition-colors group"
                    title={champ.name}
                  >
                    <ChampionIcon championName={champ.id} fill className="object-cover opacity-70 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-[10px] text-center text-white truncate px-1">
                      {champ.name}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
