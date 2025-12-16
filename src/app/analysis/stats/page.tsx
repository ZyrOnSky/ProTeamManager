'use client';

import { useState, useEffect } from 'react';
import { ChampionStatsFilter } from '@/lib/stats';
import { getChampionStatsListAction } from './actions';
import { ChampionFilterBar } from './ChampionFilterBar';
import Link from 'next/link';
import ChampionIcon from '@/components/ChampionIcon';

export default function ChampionStatsPage() {
  const [stats, setStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStats = async (filters: ChampionStatsFilter) => {
    setLoading(true);
    try {
      const data = await getChampionStatsListAction(filters);
      setStats(data);
    } catch (error) {
      console.error("Failed to fetch stats", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats({});
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-blue-500">Estadísticas de Campeones</h1>
        <p className="text-slate-400">Análisis detallado del rendimiento por campeón.</p>
      </div>

      <ChampionFilterBar onFilterChange={fetchStats} />

      {loading ? (
        <div className="text-center py-12 text-slate-500">Cargando estadísticas...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <Link 
              key={stat.name} 
              href={`/analysis/stats/${stat.name}`}
              className="bg-slate-900 border border-slate-800 rounded-xl p-4 hover:border-blue-500 transition-all group flex items-center gap-4"
            >
              <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-slate-700 group-hover:border-blue-400 transition-colors">
                 <ChampionIcon 
                   championName={stat.name}
                   fill
                   className="object-cover"
                 />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg group-hover:text-blue-400 transition-colors">{stat.name}</h3>
                <div className="flex justify-between items-end mt-1">
                  <div className="text-xs text-slate-400 space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-300">{stat.games}</span> Jugadas
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-orange-400">{stat.playedAgainst || 0}</span> Vs
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-lg font-bold leading-none ${
                      stat.winrate >= 60 ? 'text-green-400' :
                      stat.winrate <= 40 ? 'text-red-400' :
                      'text-slate-200'
                    }`}>
                      {stat.winrate}%
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">{stat.kda} KDA</div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
          
          {stats.length === 0 && (
            <div className="col-span-full text-center py-12 text-slate-500">
              No se encontraron campeones con los filtros seleccionados.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
