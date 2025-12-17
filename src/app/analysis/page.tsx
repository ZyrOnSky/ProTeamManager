import Link from 'next/link';
import { Search, BarChart3, List, Swords, Map, Layers } from 'lucide-react';

export default function AnalysisPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Centro de Datos y Scouting</h1>
        <p className="text-slate-400">Herramientas avanzadas para el análisis de rivales y planificación estratégica.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link href="/analysis/scouting" className="group block p-6 bg-slate-900/80 backdrop-blur-sm rounded-xl border border-slate-800 hover:border-blue-500 transition-all">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-blue-500/10 rounded-lg text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-colors">
              <Search size={24} />
            </div>
            <h2 className="text-xl font-semibold">Enemy Dashboard</h2>
          </div>
          <p className="text-slate-400 text-sm">Base de datos de rivales, historial de enfrentamientos y análisis de drafts enemigos.</p>
        </Link>

        <Link href="/analysis/stats" className="group block p-6 bg-slate-900/80 backdrop-blur-sm rounded-xl border border-slate-800 hover:border-green-500 transition-all">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-green-500/10 rounded-lg text-green-500 group-hover:bg-green-500 group-hover:text-white transition-colors">
              <BarChart3 size={24} />
            </div>
            <h2 className="text-xl font-semibold">Global Stats</h2>
          </div>
          <p className="text-slate-400 text-sm">Estadísticas centralizadas de tu equipo. Winrates, KDA y métricas de rendimiento.</p>
        </Link>

        <Link href="/analysis/meta" className="group block p-6 bg-slate-900/80 backdrop-blur-sm rounded-xl border border-slate-800 hover:border-purple-500 transition-all">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-purple-500/10 rounded-lg text-purple-500 group-hover:bg-purple-500 group-hover:text-white transition-colors">
              <List size={24} />
            </div>
            <h2 className="text-xl font-semibold">Meta & Tier Lists</h2>
          </div>
          <p className="text-slate-400 text-sm">Gestiona Tier Lists internas, bans obligatorios y prioridades del meta actual.</p>
        </Link>

        <Link href="/analysis/patches" className="group block p-6 bg-slate-900/80 backdrop-blur-sm rounded-xl border border-slate-800 hover:border-pink-500 transition-all">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-pink-500/10 rounded-lg text-pink-500 group-hover:bg-pink-500 group-hover:text-white transition-colors">
              <Layers size={24} />
            </div>
            <h2 className="text-xl font-semibold">Gestor de Parches</h2>
          </div>
          <p className="text-slate-400 text-sm">Administra versiones del juego, notas del parche y estadísticas por versión.</p>
        </Link>

        <Link href="/analysis/draft" className="group block p-6 bg-slate-900/80 backdrop-blur-sm rounded-xl border border-slate-800 hover:border-orange-500 transition-all">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-orange-500/10 rounded-lg text-orange-500 group-hover:bg-orange-500 group-hover:text-white transition-colors">
              <Swords size={24} />
            </div>
            <h2 className="text-xl font-semibold">Draft Planner</h2>
          </div>
          <p className="text-slate-400 text-sm">Simulador de drafts con integración de estadísticas y planificación de escenarios.</p>
        </Link>

        <Link href="/analysis/lineup" className="group block p-6 bg-slate-900/80 backdrop-blur-sm rounded-xl border border-slate-800 hover:border-red-500 transition-all">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-red-500/10 rounded-lg text-red-500 group-hover:bg-red-500 group-hover:text-white transition-colors">
              <Map size={24} />
            </div>
            <h2 className="text-xl font-semibold">Lineup Planner</h2>
          </div>
          <p className="text-slate-400 text-sm">Visualización de mapa y cálculo de valor de jugadores por rol.</p>
        </Link>
      </div>
    </div>
  );
}
