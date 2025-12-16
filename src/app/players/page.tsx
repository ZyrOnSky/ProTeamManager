import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Network } from "lucide-react";
import { RosterManagementClient } from "./RosterManagementClient";

export const dynamic = 'force-dynamic';

export default async function PlayersPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect("/login");
  }

  const players = await prisma.user.findMany({
    where: {
      role: "PLAYER",
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      playerProfile: {
        include: {
          matchParticipations: {
            include: {
              match: true
            }
          }
        }
      },
    },
  });

  const staff = await prisma.user.findMany({
    where: {
      role: {
        in: ["ADMIN", "COACH", "STAFF"],
      },
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      assignedLineup: true,
    },
  });

  const lineups = await prisma.lineup.findMany();

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/" className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
              <ArrowLeft size={24} />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-green-500">Roster & Staff</h1>
              <p className="text-slate-400">Gestiona tu equipo, jugadores y personal técnico</p>
            </div>
          </div>
          
          <Link 
            href="/hierarchy"
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg transition-colors border border-slate-700"
          >
            <Network size={20} className="text-blue-400" />
            Ver Jerarquía
          </Link>
        </header>

        <RosterManagementClient 
          players={players} 
          staff={staff} 
          lineups={lineups}
          currentUserRole={session.user.role}
          currentUserId={session.user.id}
        />
      </div>
    </main>
  );
}
