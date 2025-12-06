import Link from 'next/link';
import { ArrowLeft, Map } from 'lucide-react';
import { UserMenu } from '@/components/UserMenu';

export default function StrategyPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-8">
      <header className="mb-8 flex justify-between items-start max-w-6xl mx-auto">
        <div className="flex items-center gap-4">
          <Link 
            href="/" 
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white"
          >
            <ArrowLeft size={24} />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-purple-500 flex items-center gap-3">
              <Map className="w-8 h-8" />
              Pizarra Táctica
            </h1>
            <p className="text-slate-400">Diseña jugadas, rotaciones y planifica composiciones</p>
          </div>
        </div>
        <UserMenu />
      </header>

      <div className="max-w-6xl mx-auto">
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-12 text-center">
          <div className="w-20 h-20 bg-purple-500/10 rounded-full flex items-center justify-center mx-auto mb-6 text-purple-500">
            <Map size={40} />
          </div>
          <h2 className="text-2xl font-bold mb-2">Módulo en Desarrollo</h2>
          <p className="text-slate-400 max-w-md mx-auto">
            Estamos construyendo las herramientas para diseñar tus estrategias. 
            Pronto podrás crear pizarras interactivas y planificar tus partidas.
          </p>
        </div>
      </div>
    </main>
  );
}
