import { getTierLists } from "@/lib/meta";
import Link from 'next/link';
import { Plus, List, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export const dynamic = 'force-dynamic';

export default async function MetaPage() {
  const tierLists = await getTierLists();

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2">Meta & Tier Lists</h1>
          <p className="text-slate-400">Gestiona las prioridades de campeones y bans del equipo.</p>
        </div>
        <Link 
          href="/analysis/meta/new" 
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus size={20} />
          Nueva Tier List
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tierLists.map(list => (
          <Link 
            key={list.id} 
            href={`/analysis/meta/${list.id}`}
            className="group block bg-slate-900 border border-slate-800 rounded-xl p-6 hover:border-blue-500 transition-all"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-purple-500/10 rounded-lg text-purple-500 group-hover:bg-purple-500 group-hover:text-white transition-colors">
                <List size={24} />
              </div>
              {list.isActive && (
                <span className="bg-green-500/10 text-green-500 text-xs font-bold px-2 py-1 rounded">
                  ACTIVA
                </span>
              )}
            </div>
            
            <h3 className="text-xl font-bold mb-2 group-hover:text-blue-400 transition-colors">{list.name}</h3>
            
            <div className="flex flex-wrap gap-2 mb-3">
              {list.patch && (
                <span className="bg-slate-800 text-slate-300 text-xs px-2 py-1 rounded border border-slate-700">
                  v{list.patch.version}
                </span>
              )}
              {list.enemyTeam && (
                <span className="bg-red-500/10 text-red-400 text-xs px-2 py-1 rounded border border-red-500/20">
                  VS {list.enemyTeam.name}
                </span>
              )}
              {list.lineup && (
                <span className="bg-blue-500/10 text-blue-400 text-xs px-2 py-1 rounded border border-blue-500/20">
                  {list.lineup.name}
                </span>
              )}
            </div>

            <p className="text-slate-400 text-sm mb-4 line-clamp-2">{list.description || 'Sin descripción'}</p>
            
            <div className="flex items-center justify-between text-xs text-slate-500 border-t border-slate-800 pt-4">
              <div className="flex items-center gap-2">
                <Calendar size={14} />
                <span>{format(new Date(list.updatedAt), "d MMM yyyy", { locale: es })}</span>
              </div>
              <div>
                {list._count.champions} Campeones
              </div>
            </div>
          </Link>
        ))}

        {tierLists.length === 0 && (
          <div className="col-span-full text-center py-12 bg-slate-900/50 rounded-xl border border-slate-800 border-dashed">
            <p className="text-slate-400 mb-4">No hay Tier Lists creadas aún.</p>
            <Link 
              href="/analysis/meta/new" 
              className="text-blue-500 hover:underline"
            >
              Crear la primera Tier List
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
