import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Mail, Briefcase } from "lucide-react";
import { StaffDetailClient } from "./StaffDetailClient";

export default async function StaffDetailPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: params.id },
    include: {
      assignedLineup: true,
    },
  });

  if (!user) {
    notFound();
  }

  // Ensure we are not viewing a player here
  if (user.role === 'PLAYER') {
      redirect(`/players/${user.id}`);
  }

  const allLineups = await prisma.lineup.findMany();

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <Link 
            href="/players" 
            className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft size={20} />
            Volver al Roster
          </Link>
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-slate-900 p-6 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-6">
              <div className="p-4 bg-slate-800 rounded-xl text-blue-500">
                <Briefcase size={40} />
              </div>
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-3xl font-bold text-white">{user.name}</h1>
                  <span className="px-2 py-0.5 bg-slate-950 text-slate-400 text-xs font-mono rounded border border-slate-800">
                    {user.role}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-slate-400 text-sm">
                  <span className="flex items-center gap-1">
                    <Mail size={14} />
                    {user.email}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </header>

        <StaffDetailClient 
          user={user}
          allLineups={allLineups}
          currentUserRole={session.user.role}
        />
      </div>
    </main>
  );
}