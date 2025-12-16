"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Shield, Sword, Crosshair, Heart, Zap, Users, UserCog, Briefcase, Crown } from "lucide-react";
import { AddMemberForm } from "./AddMemberForm";
import { UserStatusManager } from "@/components/UserStatusManager";
import { toggleCaptain } from "./actions";

// Mapa de iconos por rol de juego
const RoleIcons: Record<string, any> = {
  TOP: Shield,
  JUNGLE: Sword,
  MID: Zap,
  ADC: Crosshair,
  SUPPORT: Heart,
};

interface RosterManagementClientProps {
  players: any[];
  staff: any[];
  lineups: any[];
  currentUserRole: string;
  currentUserId: string;
}

export function RosterManagementClient({ players, staff, lineups, currentUserRole, currentUserId }: RosterManagementClientProps) {
  const [activeTab, setActiveTab] = useState<"PLAYERS" | "STAFF" | "DELETED">("PLAYERS");
  const router = useRouter();

  const canManage = currentUserRole === "ADMIN" || currentUserRole === "COACH";
  const isAdmin = currentUserRole === "ADMIN";

  // Filter lists
  const activePlayers = players.filter(p => p.status !== "DELETED");
  const activeStaff = staff.filter(s => s.status !== "DELETED");
  const deletedUsers = [...players, ...staff].filter(u => u.status === "DELETED");

  const calculatePlayerStats = (player: any) => {
    const matches = player.playerProfile?.matchParticipations || [];
    const totalGames = matches.length;
    
    if (totalGames === 0) return { kda: "-", winrate: "-", score: "-" };

    const wins = matches.filter((m: any) => m.match.result === "WIN").length;
    const winRateVal = (wins / totalGames) * 100;
    
    const totalK = matches.reduce((acc: number, m: any) => acc + (m.kills || 0), 0);
    const totalD = matches.reduce((acc: number, m: any) => acc + (m.deaths || 0), 0);
    const totalA = matches.reduce((acc: number, m: any) => acc + (m.assists || 0), 0);
    
    const kdaVal = totalD > 0 ? (totalK + totalA) / totalD : (totalK + totalA);
    
    // Calculate CS/m and Vis/m for Score
    let totalMinutes = 0;
    let totalCS = 0;
    let totalVis = 0;
    
    matches.forEach((m: any) => {
      const duration = m.match.duration ? m.match.duration / 60 : 30;
      totalMinutes += duration;
      totalCS += (m.cs || 0);
      totalVis += (m.visionWards || 0) + (m.wardsPlaced || 0);
    });
    
    const csPerMin = totalMinutes > 0 ? totalCS / totalMinutes : 0;
    const visPerMin = totalMinutes > 0 ? totalVis / totalMinutes : 0;
    
    // Scores (0-10)
    const wrScore = Math.min(10, (winRateVal / 70) * 10);
    const kdaScore = Math.min(10, (kdaVal / 5.0) * 10);
    const csScore = Math.min(10, (csPerMin / 10.0) * 10);
    const visScore = Math.min(10, (visPerMin / 0.60) * 10);
    
    const overallScore = Math.round((wrScore + kdaScore + csScore + visScore) * 2.5);

    return {
      kda: kdaVal.toFixed(2),
      winrate: Math.round(winRateVal) + "%",
      score: overallScore
    };
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-4 border-b border-slate-800">
          <button
            onClick={() => setActiveTab("PLAYERS")}
            className={`pb-2 px-4 font-bold transition-colors ${
              activeTab === "PLAYERS"
                ? "text-green-500 border-b-2 border-green-500"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Jugadores ({activePlayers.length})
          </button>
          <button
            onClick={() => setActiveTab("STAFF")}
            className={`pb-2 px-4 font-bold transition-colors ${
              activeTab === "STAFF"
                ? "text-purple-500 border-b-2 border-purple-500"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Staff & Coaches ({activeStaff.length})
          </button>
          {isAdmin && deletedUsers.length > 0 && (
            <button
              onClick={() => setActiveTab("DELETED")}
              className={`pb-2 px-4 font-bold transition-colors ${
                activeTab === "DELETED"
                  ? "text-red-500 border-b-2 border-red-500"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Papelera ({deletedUsers.length})
            </button>
          )}
        </div>

        {canManage && (
          <div className="flex gap-3">
            <Link 
              href="/settings/lineups"
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg font-bold transition-colors"
            >
              <Users size={20} />
              Gestionar Equipos
            </Link>
            <AddMemberForm lineups={lineups} />
          </div>
        )}
      </div>

      {activeTab === "PLAYERS" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activePlayers.map((player) => {
            const position = player.playerProfile?.position || "FILL";
            const Icon = RoleIcons[position] || Shield;
            const lineupName = lineups.find(l => l.id === player.playerProfile?.lineupId)?.name;
            const stats = calculatePlayerStats(player);
            const isCaptain = player.playerProfile?.isCaptain;

            // Determine score color
            let scoreColor = "text-slate-400";
            if (stats.score !== "-") {
                const score = stats.score as number;
                if (score >= 90) scoreColor = "text-cyan-400";
                else if (score >= 75) scoreColor = "text-yellow-400";
                else if (score >= 60) scoreColor = "text-slate-200";
                else scoreColor = "text-orange-400";
            }

            return (
              <div 
                key={player.id} 
                onClick={() => router.push(`/players/${player.id}`)}
                className="block bg-slate-900 border border-slate-800 rounded-xl p-6 hover:border-green-500 transition-all group relative overflow-hidden cursor-pointer"
              >
                {/* Score Badge */}
                <div className="absolute bottom-6 right-6">
                    <div className="flex flex-col items-center">
                        <span className={`text-5xl font-bold leading-none ${scoreColor}`}>
                            {stats.score}
                        </span>
                        <span className="text-xs uppercase text-slate-500 font-bold mt-1">Valor</span>
                    </div>
                </div>

                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-slate-800 rounded-lg text-slate-400 group-hover:text-green-500 group-hover:bg-green-500/10 transition-colors">
                    <Icon size={24} />
                  </div>
                  <div className="flex flex-col items-end gap-1"> 
                    <UserStatusManager 
                      userId={player.id}
                      currentStatus={player.status}
                      userRole={player.role}
                      currentUserRole={currentUserRole}
                      currentUserId={currentUserId}
                      userName={player.name}
                    />
                    <span className="text-xs font-mono text-slate-500 bg-slate-950 px-2 py-1 rounded">
                      {position}
                    </span>
                    {lineupName && (
                      <span className="text-xs font-bold text-blue-400 bg-blue-500/10 px-2 py-1 rounded">
                        {lineupName}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-xl font-bold text-white">{player.name}</h3>
                  {isCaptain && <Crown size={18} className="text-yellow-500 fill-yellow-500" />}
                  
                  {canManage && (
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        await toggleCaptain(player.id, player.playerProfile?.lineupId, !isCaptain);
                      }}
                      className={`p-1 rounded hover:bg-slate-800 transition-colors ${isCaptain ? 'text-yellow-500/50 hover:text-yellow-500' : 'text-slate-700 hover:text-yellow-500'}`}
                      title={isCaptain ? "Quitar Capitanía" : "Nombrar Capitán"}
                    >
                      <Crown size={14} />
                    </button>
                  )}
                </div>
                <p className="text-slate-400 text-sm mb-4">{player.email}</p>
                
                <div className="flex gap-2 mt-4">
                  <div className="flex flex-col bg-slate-950 px-3 py-1.5 rounded border border-slate-800">
                    <span className="text-[10px] text-slate-500 uppercase font-bold">KDA</span>
                    <span className={`text-sm font-mono font-bold ${stats.kda !== "-" ? "text-blue-300" : "text-slate-600"}`}>
                        {stats.kda}
                    </span>
                  </div>
                  <div className="flex flex-col bg-slate-950 px-3 py-1.5 rounded border border-slate-800">
                    <span className="text-[10px] text-slate-500 uppercase font-bold">Winrate</span>
                    <span className={`text-sm font-mono font-bold ${
                        stats.winrate !== "-" 
                            ? (parseInt(stats.winrate as string) >= 50 ? "text-green-400" : "text-red-400") 
                            : "text-slate-600"
                    }`}>
                        {stats.winrate}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}

          {activePlayers.length === 0 && (
            <div className="col-span-full text-center py-12 bg-slate-900/50 rounded-xl border border-dashed border-slate-800">
              <p className="text-slate-500">No hay jugadores activos en el roster.</p>
            </div>
          )}
        </div>
      )}

      {activeTab === "STAFF" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeStaff.map((member) => {
            const isCoach = member.role === "COACH";
            const Icon = isCoach ? Briefcase : UserCog;
            const lineupName = member.assignedLineup?.name;

            return (
              <div 
                key={member.id} 
                onClick={() => router.push(`/staff/${member.id}`)}
                className="block bg-slate-900 border border-slate-800 rounded-xl p-6 hover:border-purple-500 transition-all group cursor-pointer"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-slate-800 rounded-lg text-slate-400 group-hover:text-purple-500 group-hover:bg-purple-500/10 transition-colors">
                    <Icon size={24} />
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <UserStatusManager 
                      userId={member.id}
                      currentStatus={member.status}
                      userRole={member.role}
                      currentUserRole={currentUserRole}
                      currentUserId={currentUserId}
                      userName={member.name}
                    />
                    <span className={`text-xs font-bold px-2 py-1 rounded ${
                      isCoach ? 'bg-purple-500/10 text-purple-400' : 'bg-slate-500/10 text-slate-400'
                    }`}>
                      {member.role}
                    </span>
                    {lineupName && (
                      <span className="text-xs font-bold text-blue-400 bg-blue-500/10 px-2 py-1 rounded">
                        {lineupName}
                      </span>
                    )}
                  </div>
                </div>
                
                <h3 className="text-xl font-bold mb-1 text-white">{member.name}</h3>
                <p className="text-slate-400 text-sm mb-4">{member.email}</p>
                
                <div className="mt-4 text-sm text-slate-500">
                  {isCoach ? "Entrenador Principal" : "Personal de Apoyo"}
                </div>
              </div>
            );
          })}

          {activeStaff.length === 0 && (
            <div className="col-span-full text-center py-12 bg-slate-900/50 rounded-xl border border-dashed border-slate-800">
              <p className="text-slate-500">No hay staff activo registrado.</p>
            </div>
          )}
        </div>
      )}

      {activeTab === "DELETED" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {deletedUsers.map((user) => {
            const isPlayer = user.role === "PLAYER";
            const position = user.playerProfile?.position || "FILL";
            const Icon = isPlayer ? (RoleIcons[position] || Shield) : (user.role === "COACH" ? Briefcase : UserCog);
            const lineupName = isPlayer 
                ? lineups.find(l => l.id === user.playerProfile?.lineupId)?.name
                : user.assignedLineup?.name;

            return (
              <div 
                key={user.id} 
                onClick={() => router.push(isPlayer ? `/players/${user.id}` : `/staff/${user.id}`)}
                className="block bg-slate-900/50 border border-red-900/30 rounded-xl p-6 hover:border-red-500/50 transition-all group cursor-pointer opacity-75 hover:opacity-100"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-slate-800 rounded-lg text-slate-500 group-hover:text-red-500 group-hover:bg-red-500/10 transition-colors">
                    <Icon size={24} />
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <UserStatusManager 
                      userId={user.id}
                      currentStatus={user.status}
                      userRole={user.role}
                      currentUserRole={currentUserRole}
                      currentUserId={currentUserId}
                      userName={user.name}
                    />
                    <span className="text-xs font-mono text-slate-500 bg-slate-950 px-2 py-1 rounded">
                      {user.role}
                    </span>
                  </div>
                </div>
                
                <h3 className="text-xl font-bold mb-1 text-slate-300 line-through decoration-red-500/50">{user.name}</h3>
                <p className="text-slate-500 text-sm mb-4">{user.email}</p>
                
                <div className="mt-4 text-sm text-red-400 flex items-center gap-2">
                  <Shield size={14} />
                  Usuario Eliminado
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
