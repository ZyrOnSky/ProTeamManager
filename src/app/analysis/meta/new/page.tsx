import { createTierList } from "../actions";
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{ enemyTeamId?: string }>;
}

export default async function NewTierListPage({ searchParams }: PageProps) {
  const { enemyTeamId } = await searchParams;

  const teams = await prisma.team.findMany({
    orderBy: { name: 'asc' }
  });

  const lineups = await prisma.lineup.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' }
  });

  const patches = await prisma.patch.findMany({
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <Link href={enemyTeamId ? `/analysis/scouting/${enemyTeamId}` : "/analysis/meta"} className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
          <ArrowLeft size={24} />
        </Link>
        <h1 className="text-3xl font-bold">Nueva Tier List {enemyTeamId ? '(Scouting)' : ''}</h1>
      </div>

      <div className="bg-slate-900 p-8 rounded-xl border border-slate-800">
        <form action={createTierList} className="space-y-6">
          
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Nombre</label>
            <input 
              type="text" 
              name="name"
              required
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500"
              placeholder="Ej: Meta Worlds 2025 - Parche 14.24"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Parche (Opcional)</label>
            <select 
              name="patchId" 
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500"
            >
              <option value="">-- Seleccionar Parche --</option>
              {patches.map(patch => (
                <option key={patch.id} value={patch.id}>v{patch.version}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Asociar a Equipo Rival (Opcional)</label>
              <select 
                name="enemyTeamId" 
                defaultValue={enemyTeamId || ""}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500"
              >
                <option value="">-- Ninguno --</option>
                {teams.map(team => (
                  <option key={team.id} value={team.id}>{team.name} {team.isRival ? '(Rival)' : ''}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Asociar a Nuestro Lineup (Opcional)</label>
              <select 
                name="lineupId" 
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500"
              >
                <option value="">-- Ninguno --</option>
                {lineups.map(lineup => (
                  <option key={lineup.id} value={lineup.id}>{lineup.name}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Descripción (Opcional)</label>
            <textarea 
              name="description"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500 h-32 resize-none"
              placeholder="Notas sobre el contexto de esta Tier List..."
            />
          </div>

          <div className="flex justify-end pt-4">
            <button 
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Crear y Editar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
