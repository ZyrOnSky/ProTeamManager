import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { ScrimDetailClient } from "./ScrimDetailClient";

export default async function ScrimDetailPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect("/login");
  }

  const match = await prisma.match.findUnique({
    where: { id: params.id },
    include: {
      enemyTeam: true,
      participants: {
        include: {
          playerProfile: {
            include: {
              user: true
            }
          }
        }
      },
      analysis: true,
    },
  });

  if (!match) {
    notFound();
  }

  // Fetch all players for the roster selection
  const roster = await prisma.user.findMany({
    where: { role: "PLAYER" },
    include: {
      playerProfile: true
    }
  });

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8">
      <ScrimDetailClient 
        match={match} 
        roster={roster} 
        userRole={session.user.role}
      />
    </main>
  );
}
