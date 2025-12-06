import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Swords, Calendar, Trophy, Skull, Clock } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default async function ScrimsPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect("/login");
  }

  const matches = await prisma.match.findMany({
    where: {
      type: "SCRIM"
    },
    orderBy: { date: 'desc' },
    include: {
      enemyTeam: true,
      lineup: true,
      participants: {
        select: {
          kills: true,
          deaths: true,
          assists: true,
          isEnemy: true,
        }
      }
    },
  });

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/" className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
              <ArrowLeft size={24} />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-blue-500">Gestión de Scrims</h1>
              <p className="text-slate-400">Historial de partidas y entrenamientos</p>
            </div>
          </div>
          
          {(session.user.role === 'ADMIN' || session.user.role === 'COACH') && (
             <Link 
               href="/scrims/new"
               className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors font-medium"
             >
               <Plus size={20} />
               Registrar Scrim
             </Link>
          )}
        </header>

        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950 text-slate-400 text-xs uppercase font-bold border-b border-slate-800">
                  <th className="p-4">Fecha</th>
                  <th className="p-4">Rival</th>
                  <th className="p-4 text-center">Resultado</th>
                  <th className="p-4 text-center">KDA Equipo</th>
                  <th className="p-4 text-center">VOD</th>
                  <th className="p-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-slate-800">
                {matches.map((match) => {
                  const ourParticipants = match.participants.filter(p => !p.isEnemy);
                  const kills = ourParticipants.reduce((acc, p) => acc + (p.kills || 0), 0);
                  const deaths = ourParticipants.reduce((acc, p) => acc + (p.deaths || 0), 0);
                  const assists = ourParticipants.reduce((acc, p) => acc + (p.assists || 0), 0);
                  
                  const resultColor = match.result === 'WIN' ? 'text-green-400' : match.result === 'LOSS' ? 'text-red-400' : 'text-slate-400';
                  const resultBg = match.result === 'WIN' ? 'bg-green-500/10' : match.result === 'LOSS' ? 'bg-red-500/10' : 'bg-slate-800';

                  return (
                    <tr key={match.id} className="hover:bg-slate-800/50 transition-colors">
                      <td className="p-4 text-white font-medium">
                        <div className="flex flex-col">
                          <span>{format(new Date(match.date), "dd MMM yyyy", { locale: es })}</span>
                          <span className="text-xs text-slate-500">{format(new Date(match.date), "HH:mm", { locale: es })}</span>
                        </div>
                      </td>
                      <td className="p-4 text-slate-300">
                        {match.enemyTeam?.name || "Equipo Desconocido"}
                      </td>
                      <td className="p-4 text-center">
                        {match.result ? (
                          <span className={`inline-block px-2 py-1 rounded text-xs font-bold ${resultColor} ${resultBg}`}>
                            {match.result}
                          </span>
                        ) : (
                          <span className="text-slate-500">-</span>
                        )}
                      </td>
                      <td className="p-4 text-center font-mono text-slate-300">
                        <span className="text-blue-400">{kills}</span> / <span className="text-red-400">{deaths}</span> / <span className="text-yellow-400">{assists}</span>
                      </td>
                      <td className="p-4 text-center">
                        {match.vodLink ? (
                          <a 
                            href={match.vodLink} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-800 hover:bg-blue-600 hover:text-white text-blue-400 transition-colors"
                            title="Ver VOD"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                          </a>
                        ) : (
                          <span className="text-slate-600">-</span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <Link 
                          href={`/scrims/${match.id}`}
                          className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-white transition-colors"
                        >
                          Ver Detalles
                          <ArrowLeft size={16} className="rotate-180" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
                {matches.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500">
                      No hay scrims registradas.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}
