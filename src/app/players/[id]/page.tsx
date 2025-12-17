import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Mail, Shield, Sword, Crosshair, Heart, Zap, Trophy, Target, Skull } from "lucide-react";
import { PlayerDetailClient } from "./PlayerDetailClient";

export const dynamic = 'force-dynamic';

// Mapa de iconos por rol
const RoleIcons: Record<string, any> = {
  TOP: Shield,
  JUNGLE: Sword,
  MID: Zap,
  ADC: Crosshair,
  SUPPORT: Heart,
};

export default async function PlayerDetailPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect("/login");
  }

  const player = await prisma.user.findUnique({
    where: { id: params.id },
    include: {
      eventAttendances: {
        include: {
          event: true
        },
        orderBy: {
          event: {
            startTime: 'desc'
          }
        }
      },
      playerProfile: {
        include: {
          championPool: true,
          evaluations: {
            orderBy: { date: 'desc' },
            include: { coach: true }
          },
          matchParticipations: {
            orderBy: { match: { date: 'desc' } },
            include: { match: true }
          }
        },
      },
    },
  });

  if (!player) {
    notFound();
  }

  const profile = player.playerProfile;
  const position = profile?.position || "FILL";
  const RoleIcon = RoleIcons[position] || Shield;

  // Transformar datos para el componente cliente
  const championPool = profile?.championPool.map(p => ({
    id: p.id,
    championName: p.championName,
    mastery: p.mastery,
    notes: p.notes
  })) || [];

  const evaluations = profile?.evaluations || [];
  const matches = profile?.matchParticipations || [];
  const attendances = player.eventAttendances || [];

  return (
    <main className="relative min-h-screen bg-slate-950 text-slate-100 p-8 overflow-hidden">
      {/* 🎥 VIDEO BACKGROUND */}
      <div className="absolute inset-0 z-0">
        <video 
          autoPlay 
          loop 
          muted 
          playsInline 
          className="w-full h-full object-cover"
        >
          <source src="/videos/6-bg.mp4" type="video/mp4" />
        </video>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto">
        <header className="mb-8">
          <Link 
            href="/players" 
            className="inline-flex items-center gap-2 bg-slate-900/80 backdrop-blur-sm border border-slate-700 shadow-lg px-4 py-2 rounded-lg text-slate-300 hover:text-white mb-4 transition-all hover:scale-105"
          >
            <ArrowLeft size={20} />
            Volver al Roster
          </Link>
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-slate-900/80 backdrop-blur-sm p-6 rounded-2xl border border-slate-800 shadow-xl">
            <div className="flex items-center gap-6">
              <div className="p-4 bg-slate-800 rounded-xl text-green-500">
                <RoleIcon size={40} />
              </div>
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-3xl font-bold text-white">{player.name}</h1>
                  <span className="px-2 py-0.5 bg-slate-950 text-slate-400 text-xs font-mono rounded border border-slate-800">
                    {position}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-slate-400 text-sm">
                  <span className="flex items-center gap-1">
                    <Mail size={14} />
                    {player.email}
                  </span>
                  {profile?.opggUrl && (
                    <a href={profile.opggUrl} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">
                      OP.GG
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </header>

        <PlayerDetailClient 
          player={player}
          profile={profile}
          championPool={championPool}
          evaluations={evaluations}
          matches={matches}
          attendances={attendances}
          userRole={session.user.role}
          currentUserId={session.user.id}
        />
      </div>
    </main>
  );
}
