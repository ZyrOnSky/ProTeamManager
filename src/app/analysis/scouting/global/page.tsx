import { getGlobalChampionStats } from "@/lib/scouting";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export const dynamic = 'force-dynamic';

export default async function GlobalStatsPage() {
  const stats = await getGlobalChampionStats();

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/analysis/scouting" className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
          <ArrowLeft size={24} />
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Estadísticas Globales de Campeones</h1>
          <p className="text-slate-400">Rendimiento acumulado de todos los campeones jugados por nuestro equipo.</p>
        </div>
      </div>

      <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-950/50 text-slate-400">
              <tr>
                <th className="p-4">Campeón</th>
                <th className="p-4 text-center">Juegos</th>
                <th className="p-4 text-center">Win Rate</th>
                <th className="p-4 text-center">KDA</th>
                <th className="p-4 text-center">K / D / A (Promedio)</th>
                <th className="p-4 text-center">CS (Promedio)</th>
                <th className="p-4 text-center">Daño (Promedio)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {stats.map((stat) => (
                <tr key={stat.name} className="hover:bg-slate-800/50 transition-colors">
                  <td className="p-4 font-bold">{stat.name}</td>
                  <td className="p-4 text-center">{stat.games}</td>
                  <td className="p-4 text-center">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                      stat.winrate >= 60 ? 'bg-green-500/10 text-green-500' :
                      stat.winrate <= 40 ? 'bg-red-500/10 text-red-500' :
                      'bg-slate-500/10 text-slate-500'
                    }`}>
                      {stat.winrate}%
                    </span>
                  </td>
                  <td className="p-4 text-center font-medium text-blue-400">{stat.kda}</td>
                  <td className="p-4 text-center text-slate-400">
                    {stat.avgKills} / {stat.avgDeaths} / {stat.avgAssists}
                  </td>
                  <td className="p-4 text-center text-slate-400">{stat.avgCs}</td>
                  <td className="p-4 text-center text-slate-400">{stat.avgDamage.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
