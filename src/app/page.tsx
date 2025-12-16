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
    <main className="relative min-h-screen bg-slate-950 text-slate-100 overflow-hidden">
      
      {/* 🎥 VIDEO BACKGROUND */}
      <div className="absolute inset-0 z-0">
        <video 
          autoPlay 
          loop 
          muted 
          playsInline 
          className="w-full h-full object-cover"
        >
          <source src="/videos/dashboard-bg.mp4" type="video/mp4" />
        </video>

      </div>

      {/* CONTENIDO PRINCIPAL */}
      <div className="relative z-10 p-8">
        <header className="mb-12 flex justify-between items-start max-w-6xl mx-auto">
          <div>
            <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-600 mb-2">Pro Team Manager</h1>
            <p className="text-slate-400">Sistema de Gestión de Alto Rendimiento para Esports</p>
          </div>
          <UserMenu />
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {/* Módulo de Scrims */}
          <Link href="/scrims" className="group block p-6 bg-slate-900/60 backdrop-blur-sm rounded-xl border border-slate-700/50 hover:border-blue-500 hover:bg-slate-800/80 transition-all duration-300 hover:-translate-y-1 shadow-lg hover:shadow-blue-500/20">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-blue-500/10 rounded-lg text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                <Swords size={24} />
              </div>
              <h2 className="text-xl font-semibold group-hover:text-blue-400 transition-colors">Gestión de Scrims</h2>
            </div>
            <p className="text-slate-400 text-sm group-hover:text-slate-300">Registra partidas, drafts y resultados. Analiza el rendimiento por etapas.</p>
          </Link>

          {/* Módulo de Jugadores */}
          <Link href="/players" className="group block p-6 bg-slate-900/60 backdrop-blur-sm rounded-xl border border-slate-700/50 hover:border-green-500 hover:bg-slate-800/80 transition-all duration-300 hover:-translate-y-1 shadow-lg hover:shadow-green-500/20">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-green-500/10 rounded-lg text-green-500 group-hover:bg-green-500 group-hover:text-white transition-colors">
                <Users size={24} />
              </div>
              <h2 className="text-xl font-semibold group-hover:text-green-400 transition-colors">Roster & Perfiles</h2>
            </div>
            <p className="text-slate-400 text-sm group-hover:text-slate-300">Gestiona el Champion Pool, estadísticas individuales y evolución.</p>
          </Link>

          {/* Módulo de Estrategia */}
          <Link href="/strategy" className="group block p-6 bg-slate-900/60 backdrop-blur-sm rounded-xl border border-slate-700/50 hover:border-purple-500 hover:bg-slate-800/80 transition-all duration-300 hover:-translate-y-1 shadow-lg hover:shadow-purple-500/20">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-purple-500/10 rounded-lg text-purple-500 group-hover:bg-purple-500 group-hover:text-white transition-colors">
                <Map size={24} />
              </div>
              <h2 className="text-xl font-semibold group-hover:text-purple-400 transition-colors">Pizarra Táctica</h2>
            </div>
            <p className="text-slate-400 text-sm group-hover:text-slate-300">Diseña jugadas de nivel 1, rotaciones y planifica composiciones.</p>
          </Link>

          {/* Módulo de Calendario */}
          <Link href="/schedule" className="group block p-6 bg-slate-900/60 backdrop-blur-sm rounded-xl border border-slate-700/50 hover:border-orange-500 hover:bg-slate-800/80 transition-all duration-300 hover:-translate-y-1 shadow-lg hover:shadow-orange-500/20">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-orange-500/10 rounded-lg text-orange-500 group-hover:bg-orange-500 group-hover:text-white transition-colors">
                <Calendar size={24} />
              </div>
              <h2 className="text-xl font-semibold group-hover:text-orange-400 transition-colors">Agenda & Trabajo</h2>
            </div>
            <p className="text-slate-400 text-sm group-hover:text-slate-300">Calendario de scrims, reviews y registro de actividades diarias.</p>
          </Link>

          {/* Módulo de Análisis */}
          <Link href="/analysis" className="group block p-6 bg-slate-900/60 backdrop-blur-sm rounded-xl border border-slate-700/50 hover:border-red-500 hover:bg-slate-800/80 transition-all duration-300 hover:-translate-y-1 shadow-lg hover:shadow-red-500/20">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-red-500/10 rounded-lg text-red-500 group-hover:bg-red-500 group-hover:text-white transition-colors">
                <BarChart3 size={24} />
              </div>
              <h2 className="text-xl font-semibold group-hover:text-red-400 transition-colors">Data & Scouting</h2>
            </div>
            <p className="text-slate-400 text-sm group-hover:text-slate-300">Base de datos de rivales, estadísticas globales y meta análisis.</p>
          </Link>
        </div>
      </div>
    </main>
  );
}
