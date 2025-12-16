import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { UserManagementClient } from "./UserManagementClient";

export const dynamic = 'force-dynamic';

export default async function UsersPage() {
  const session = await getServerSession(authOptions);
  
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "COACH")) {
    redirect("/");
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      playerProfile: true,
      assignedLineup: true
    }
  });

  const lineups = await prisma.lineup.findMany({
    where: { isActive: true }
  });

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Gestión de Usuarios</h1>
          <p className="text-slate-400">Crea y administra cuentas de jugadores, coaches y staff.</p>
        </header>

        <UserManagementClient users={users} lineups={lineups} />
      </div>
    </main>
  );
}
