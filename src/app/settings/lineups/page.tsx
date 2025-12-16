import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { LineupManagementClient } from "./LineupManagementClient";

export const dynamic = 'force-dynamic';

export default async function LineupsPage() {
  const session = await getServerSession(authOptions);
  
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "COACH")) {
    redirect("/");
  }

  const lineups = await prisma.lineup.findMany({
    include: {
      players: {
        include: { user: true }
      },
      staff: true
    }
  });

  const allUsers = await prisma.user.findMany({
    include: {
      playerProfile: true
    }
  });

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8 flex items-center gap-4">
          <Link href="/players" className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white">
            <ArrowLeft size={24} />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Gestión de Equipos (Lineups)</h1>
            <p className="text-slate-400">Crea alineaciones y asigna miembros.</p>
          </div>
        </header>

        <LineupManagementClient lineups={lineups} allUsers={allUsers} />
      </div>
    </main>
  );
}
