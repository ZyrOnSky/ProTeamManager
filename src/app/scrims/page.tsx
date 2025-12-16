import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus } from "lucide-react";
import { ScrimsListClient } from "./ScrimsListClient";

export const dynamic = 'force-dynamic';

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

        <ScrimsListClient matches={matches} />
      </div>
    </main>
  );
}
