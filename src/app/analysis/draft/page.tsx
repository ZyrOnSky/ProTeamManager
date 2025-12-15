import Link from 'next/link';
import { Plus, Swords, Calendar, Trash2 } from 'lucide-react';
import { getDraftPlans } from '@/lib/draft';
import { deleteDraftPlan } from './actions';

export default async function DraftDashboard() {
  const drafts = await getDraftPlans();

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Draft Planner</h1>
          <p className="text-slate-400">Simula y planifica tus fases de selección y bloqueo</p>
        </div>
        <Link 
          href="/analysis/draft/new" 
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus size={20} />
          Nuevo Draft
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {drafts.map(draft => (
          <div key={draft.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 hover:border-blue-500/50 transition-colors group">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-bold text-lg text-white group-hover:text-blue-400 transition-colors">
                  <Link href={`/analysis/draft/${draft.id}`}>
                    {draft.name}
                  </Link>
                </h3>
                <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
                  <Calendar size={14} />
                  {draft.updatedAt.toLocaleDateString()}
                </div>
              </div>
              <form action={deleteDraftPlan.bind(null, draft.id)}>
                <button className="text-slate-600 hover:text-red-500 transition-colors p-2">
                  <Trash2 size={18} />
                </button>
              </form>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm bg-slate-950 p-2 rounded">
                <span className="text-slate-400">Rival:</span>
                <span className="font-medium text-white">{draft.enemyTeam?.name || 'Sin asignar'}</span>
              </div>
              <div className="flex items-center justify-between text-sm bg-slate-950 p-2 rounded">
                <span className="text-slate-400">Lado:</span>
                <span className={`font-bold ${draft.ourSide === 'BLUE' ? 'text-blue-400' : 'text-red-400'}`}>
                  {draft.ourSide}
                </span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-800 flex justify-between items-center">
              <div className="flex -space-x-2">
                {/* Preview of picks if any */}
                {(draft.ourSide === 'BLUE' ? draft.bluePicks : draft.redPicks).slice(0, 3).map((pick, i) => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-slate-900 bg-slate-800 overflow-hidden">
                    {pick ? (
                      <img 
                        src={`https://ddragon.leagueoflegends.com/cdn/14.24.1/img/champion/${pick}.png`} 
                        alt={pick}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-slate-800" />
                    )}
                  </div>
                ))}
              </div>
              <Link 
                href={`/analysis/draft/${draft.id}`}
                className="text-sm text-blue-500 hover:text-blue-400 font-medium flex items-center gap-1"
              >
                <Swords size={16} />
                Simular
              </Link>
            </div>
          </div>
        ))}

        {drafts.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-12 text-slate-500 border-2 border-dashed border-slate-800 rounded-xl">
            <Swords size={48} className="mb-4 opacity-50" />
            <p className="text-lg font-medium">No hay simulaciones guardadas</p>
            <p className="text-sm">Crea una nueva para empezar a planificar</p>
          </div>
        )}
      </div>
    </div>
  );
}
