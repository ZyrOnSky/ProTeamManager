import Link from 'next/link';
import { Users, Swords, Map, Calendar, BarChart3 } from 'lucide-react';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { UserMenu } from '@/components/UserMenu';

export default async function Home() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect("/login");
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-8">
      <header className="mb-12 flex justify-between items-start max-w-6xl mx-auto">
        <div>
          <h1 className="text-4xl font-bold text-blue-500 mb-2">LoL Team Manager</h1>
          <p className="text-slate-400">Sistema de Gestión de Alto Rendimiento para Esports</p>
        </div>
        <UserMenu />
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {/* Módulo de Scrims */}
        <Link href="/scrims" className="group block p-6 bg-slate-900 rounded-xl border border-slate-800 hover:border-blue-500 transition-all">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-blue-500/10 rounded-lg text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-colors">
              <Swords size={24} />
            </div>
            <h2 className="text-xl font-semibold">Gestión de Scrims</h2>
          </div>
          <p className="text-slate-400 text-sm">Registra partidas, drafts y resultados. Analiza el rendimiento por etapas.</p>
        </Link>

        {/* Módulo de Jugadores */}
        <Link href="/players" className="group block p-6 bg-slate-900 rounded-xl border border-slate-800 hover:border-green-500 transition-all">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-green-500/10 rounded-lg text-green-500 group-hover:bg-green-500 group-hover:text-white transition-colors">
              <Users size={24} />
            </div>
            <h2 className="text-xl font-semibold">Roster & Perfiles</h2>
          </div>
          <p className="text-slate-400 text-sm">Gestiona el Champion Pool, estadísticas individuales y evolución.</p>
        </Link>

        {/* Módulo de Estrategia */}
        <Link href="/strategy" className="group block p-6 bg-slate-900 rounded-xl border border-slate-800 hover:border-purple-500 transition-all">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-purple-500/10 rounded-lg text-purple-500 group-hover:bg-purple-500 group-hover:text-white transition-colors">
              <Map size={24} />
            </div>
            <h2 className="text-xl font-semibold">Pizarra Táctica</h2>
          </div>
          <p className="text-slate-400 text-sm">Diseña jugadas de nivel 1, rotaciones y planifica composiciones.</p>
        </Link>

        {/* Módulo de Calendario */}
        <Link href="/schedule" className="group block p-6 bg-slate-900 rounded-xl border border-slate-800 hover:border-orange-500 transition-all">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-orange-500/10 rounded-lg text-orange-500 group-hover:bg-orange-500 group-hover:text-white transition-colors">
              <Calendar size={24} />
            </div>
            <h2 className="text-xl font-semibold">Agenda & Trabajo</h2>
          </div>
          <p className="text-slate-400 text-sm">Calendario de scrims, reviews y registro de actividades diarias.</p>
        </Link>

        {/* Módulo de Análisis */}
        <Link href="/analysis" className="group block p-6 bg-slate-900 rounded-xl border border-slate-800 hover:border-red-500 transition-all">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-red-500/10 rounded-lg text-red-500 group-hover:bg-red-500 group-hover:text-white transition-colors">
              <BarChart3 size={24} />
            </div>
            <h2 className="text-xl font-semibold">Data & Scouting</h2>
          </div>
          <p className="text-slate-400 text-sm">Base de datos de rivales, estadísticas globales y meta análisis.</p>
        </Link>
      </div>
    </main>
  );
}
