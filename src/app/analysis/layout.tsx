import Link from 'next/link';
import { BarChart3, Search, Swords, Users, Map, List, Home } from 'lucide-react';

export default function AnalysisLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen text-slate-100 relative overflow-hidden">
      {/* Video Background */}
      <div className="absolute inset-0 z-0">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover"
        >
          <source src="/videos/6-bg.mp4" type="video/mp4" />
        </video>
      </div>

      <nav className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center h-16 gap-8 overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-4 flex-shrink-0">
              <Link href="/" className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors" title="Volver al Inicio">
                <Home size={20} />
              </Link>
              <Link href="/analysis" className="flex items-center gap-2 font-bold text-xl text-blue-500 whitespace-nowrap">
                <BarChart3 size={24} />
                <span className="hidden md:inline">Data & Scouting</span>
              </Link>
            </div>
            
            <div className="flex items-center gap-1 flex-1 justify-end md:justify-start">
              <Link 
                href="/analysis/scouting" 
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <Search size={18} />
                <span>Enemy Dashboard</span>
              </Link>
              
              <Link 
                href="/analysis/stats" 
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <BarChart3 size={18} />
                <span>Global Stats</span>
              </Link>
              
              <Link 
                href="/analysis/meta" 
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <List size={18} />
                <span>Meta & Tier Lists</span>
              </Link>
              
              <Link 
                href="/analysis/draft" 
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <Swords size={18} />
                <span>Draft Planner</span>
              </Link>
              
              <Link 
                href="/analysis/lineup" 
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <Map size={18} />
                <span>Lineup Planner</span>
              </Link>
            </div>
          </div>
        </div>
      </nav>
      
      <main className="max-w-7xl mx-auto px-4 py-8 relative z-10">
        {children}
      </main>
    </div>
  );
}
