"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  LayoutDashboard, 
  Swords, 
  BookOpen, 
  BarChart2, 
  User, 
  ClipboardList,
  Save,
  X,
  Pencil,
  Trophy,
  Target,
  Activity,
  TrendingUp,
  TrendingDown,
  Minus,
  Trash2,
  Plus,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Filter
} from "lucide-react";
import { ChampionPoolManager } from "./ChampionPoolManager";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Bar,
  Legend
} from "recharts";

interface PlayerDetailClientProps {
  player: any;
  profile: any;
  championPool: any[];
  evaluations: any[];
  matches: any[];
  attendances: any[];
  userRole: string;
  currentUserId: string;
}

export function PlayerDetailClient({ 
  player, 
  profile, 
  championPool, 
  evaluations, 
  matches,
  attendances,
  userRole,
  currentUserId
}: PlayerDetailClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"OVERVIEW" | "MATCHES" | "POOL" | "STATS" | "INFO" | "EVAL">("OVERVIEW");
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: player.name,
    realName: player.realName || "",
    nationality: player.nationality || "",
    email: player.email,
    phone: player.phone || profile?.phone || "",
    discordId: player.discordId || "",
    opggUrl: profile?.opggUrl || "",
    role: player.role, // Keep role to pass validation
    position: profile?.position || "FILL",
  });

  // Pagination & Filter State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [filterSide, setFilterSide] = useState<"ALL" | "BLUE" | "RED">("ALL");
  const [filterResult, setFilterResult] = useState<"ALL" | "WIN" | "LOSS">("ALL");
  const [sortOrder, setSortOrder] = useState<"DESC" | "ASC">("DESC");

  // Filter Matches Logic
  const filteredMatches = matches
    .filter((m: any) => {
      if (filterSide !== "ALL") {
        if (m.match.ourSide !== filterSide) return false;
      }
      if (filterResult !== "ALL") {
        if (m.match.result !== filterResult) return false;
      }
      return true;
    })
    .sort((a: any, b: any) => {
      const dateA = new Date(a.match.date).getTime();
      const dateB = new Date(b.match.date).getTime();
      return sortOrder === "DESC" ? dateB - dateA : dateA - dateB;
    });

  const totalPages = Math.ceil(filteredMatches.length / itemsPerPage);
  const currentMatches = filteredMatches.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Evaluation State
  const [evaluationsList, setEvaluationsList] = useState(evaluations);
  const [isAddingEval, setIsAddingEval] = useState(false);
  const [editingEval, setEditingEval] = useState<any>(null);
  const [evalForm, setEvalForm] = useState({
    communication: 5,
    mental: 5,
    mechanics: 5,
    gameKnowledge: 5,
    teamplay: 5,
    notes: "",
    strengths: "",
    weaknesses: "",
    improvementGoal: ""
  });

  const handleSaveEval = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const url = editingEval 
        ? `/api/evaluations/${editingEval.id}` 
        : `/api/players/${player.id}/evaluations`;
      
      const method = editingEval ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(evalForm),
      });

      if (!res.ok) throw new Error("Error saving evaluation");

      const savedEval = await res.json();

      if (editingEval) {
        setEvaluationsList(evaluationsList.map((ev: any) => ev.id === savedEval.id ? savedEval : ev));
      } else {
        // Add coach info if missing (optimistic update might lack it, but API returns it)
        if (!savedEval.coach) {
            // In a real app we might need to fetch or construct this, but the API include: { coach: true } handles it
        }
        setEvaluationsList([savedEval, ...evaluationsList]);
      }

      setIsAddingEval(false);
      setEditingEval(null);
      setEvalForm({
        communication: 5,
        mental: 5,
        mechanics: 5,
        gameKnowledge: 5,
        teamplay: 5,
        notes: "",
        strengths: "",
        weaknesses: "",
        improvementGoal: ""
      });
      router.refresh();
    } catch (error) {
      console.error(error);
      alert("Error al guardar la evaluación");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteEval = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar esta evaluación?")) return;
    
    try {
      const res = await fetch(`/api/evaluations/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Error deleting evaluation");

      setEvaluationsList(evaluationsList.filter((ev: any) => ev.id !== id));
      router.refresh();
    } catch (error) {
      console.error(error);
      alert("Error al eliminar la evaluación");
    }
  };

  const startEditEval = (ev: any) => {
    setEditingEval(ev);
    setEvalForm({
      communication: ev.communication,
      mental: ev.mental,
      mechanics: ev.mechanics,
      gameKnowledge: ev.gameKnowledge,
      teamplay: ev.teamplay,
      notes: ev.notes || "",
      strengths: ev.strengths || "",
      weaknesses: ev.weaknesses || "",
      improvementGoal: ev.improvementGoal || ""
    });
    setIsAddingEval(true);
  };

  const canEdit = userRole === "ADMIN" || userRole === "COACH";

  // --- Statistics Calculation ---
  const totalGames = matches.length;
  const wins = matches.filter((m: any) => m.match.result === "WIN").length;
  const losses = matches.filter((m: any) => m.match.result === "LOSS").length;
  const winRate = totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0;

  const totalKills = matches.reduce((acc: number, m: any) => acc + (m.kills || 0), 0);
  const totalDeaths = matches.reduce((acc: number, m: any) => acc + (m.deaths || 0), 0);
  const totalAssists = matches.reduce((acc: number, m: any) => acc + (m.assists || 0), 0);
  
  const avgKills = totalGames > 0 ? (totalKills / totalGames).toFixed(1) : "0.0";
  const avgDeaths = totalGames > 0 ? (totalDeaths / totalGames).toFixed(1) : "0.0";
  const avgAssists = totalGames > 0 ? (totalAssists / totalGames).toFixed(1) : "0.0";
  const kdaRatio = totalDeaths > 0 ? ((totalKills + totalAssists) / totalDeaths).toFixed(2) : totalGames > 0 ? "Perfect" : "0.00";

  // Calculate Per Minute Stats (CS/m & Wards/m)
  let totalMinutes = 0;
  let totalCSForMin = 0;
  let totalWardsForMin = 0;

  matches.forEach((m: any) => {
    // Duration is in seconds, convert to minutes. Default to 30m if missing/zero to avoid skewing too much or division by zero
    const durationSec = m.match.duration || 0;
    if (durationSec > 0) {
      const minutes = durationSec / 60;
      totalMinutes += minutes;
      totalCSForMin += (m.cs || 0);
      totalWardsForMin += (m.visionWards || 0) + (m.wardsPlaced || 0);
    }
  });

  const avgCSPerMin = totalMinutes > 0 ? (totalCSForMin / totalMinutes).toFixed(1) : "0.0";
  const avgWardsPerMin = totalMinutes > 0 ? (totalWardsForMin / totalMinutes).toFixed(2) : "0.00";
  
  // --- Attendance Stats ---
  const validAttendances = attendances.filter((a: any) => a.event.type !== "ACTIVITY_LOG");
  const totalAttendanceEvents = validAttendances.length;
  
  const presentCount = validAttendances.filter((a: any) => a.status === "PRESENT").length;
  const lateCount = validAttendances.filter((a: any) => a.status === "LATE").length;
  const absentCount = validAttendances.filter((a: any) => a.status === "ABSENT").length;
  const excusedCount = validAttendances.filter((a: any) => a.status === "EXCUSED").length;

  const attendanceRate = totalAttendanceEvents > 0 
    ? Math.round(((presentCount + lateCount) / totalAttendanceEvents) * 100) 
    : 0;

  // --- FIFA Card Calculation ---
  const winRateScore = Math.min(10, (winRate / 70) * 10);
  
  const kdaValue = kdaRatio === "Perfect" ? 10 : parseFloat(kdaRatio);
  const kdaScore = Math.min(10, (kdaValue / 5.0) * 10);
  
  // Calculate Weighted CS Score
  let totalTargetCS = 0;
  filteredMatches.forEach((m: any) => {
    const duration = m.match.duration ? m.match.duration / 60 : 30;
    let targetCSPerMin = 10.0;
    const role = m.position || profile?.position || "MID";
    
    if (role === "JUNGLE") targetCSPerMin = 8.0;
    else if (role === "SUPPORT") targetCSPerMin = 2.0;
    
    totalTargetCS += (duration * targetCSPerMin);
  });

  const csScore = totalTargetCS > 0 ? Math.min(10, (totalCSForMin / totalTargetCS) * 10) : 0;
  
  const visionScore = Math.min(10, (parseFloat(avgWardsPerMin) / 0.60) * 10);
  
  const overallRating = Math.round((winRateScore + kdaScore + csScore + visionScore) * 2.5);

  // Display values for Card (0-100)
  const cardWR = Math.round(winRateScore * 10);
  const cardKDA = Math.round(kdaScore * 10);
  const cardCS = Math.round(csScore * 10);
  const cardVIS = Math.round(visionScore * 10);

  // Card Styling based on Rating
  let cardBgClass = "bg-gradient-to-b from-slate-700 via-slate-800 to-slate-900 border-slate-600";
  let cardTextClass = "text-slate-200";
  
  if (overallRating >= 90) {
    // Diamond/Special
    cardBgClass = "bg-gradient-to-b from-cyan-300 via-blue-500 to-purple-600 border-cyan-400";
    cardTextClass = "text-white";
  } else if (overallRating >= 75) {
    // Gold
    cardBgClass = "bg-gradient-to-b from-yellow-200 via-yellow-500 to-yellow-700 border-yellow-400";
    cardTextClass = "text-yellow-950";
  } else if (overallRating >= 60) {
    // Silver
    cardBgClass = "bg-gradient-to-b from-gray-200 via-gray-400 to-gray-600 border-gray-300";
    cardTextClass = "text-gray-900";
  } else {
    // Bronze
    cardBgClass = "bg-gradient-to-b from-orange-200 via-orange-400 to-orange-700 border-orange-400";
    cardTextClass = "text-orange-950";
  }

  // Calculate Ratings for Radar Chart
  const ratingFields = [
    { key: "microRating", label: "Micro" },
    { key: "macroRating", label: "Macro" },
    { key: "communicationRating", label: "Comms" },
    { key: "mentalRating", label: "Mental" },
    { key: "positioningRating", label: "Posición" },
    { key: "laningRating", label: "Laning" },
    { key: "teamfightRating", label: "Teamfight" },
  ];

  const radarData = ratingFields.map(field => {
    const validMatches = matches.filter((m: any) => m[field.key] !== null);
    const total = validMatches.reduce((acc: number, m: any) => acc + (m[field.key] || 0), 0);
    const average = validMatches.length > 0 ? parseFloat((total / validMatches.length).toFixed(1)) : 0;
    return { subject: field.label, A: average, fullMark: 10 };
  });

  // Champion Stats with Trends
  const championStatsMap = matches.reduce((acc: any, m: any) => {
    const champ = m.championName;
    if (!acc[champ]) {
      acc[champ] = { name: champ, matches: [] };
    }
    acc[champ].matches.push(m);
    return acc;
  }, {});

  const topChampions = Object.values(championStatsMap)
    .map((champ: any) => {
      const totalGames = champ.matches.length;
      
      // Overall Stats
      const wins = champ.matches.filter((m: any) => m.match.result === "WIN").length;
      const totalK = champ.matches.reduce((sum: number, m: any) => sum + (m.kills || 0), 0);
      const totalD = champ.matches.reduce((sum: number, m: any) => sum + (m.deaths || 0), 0);
      const totalA = champ.matches.reduce((sum: number, m: any) => sum + (m.assists || 0), 0);
      
      let totalCS = 0;
      let totalMinutes = 0;
      champ.matches.forEach((m: any) => {
        totalCS += (m.cs || 0);
        totalMinutes += (m.match.duration ? m.match.duration / 60 : 30);
      });

      const winRate = (wins / totalGames) * 100;
      const kda = totalD > 0 ? (totalK + totalA) / totalD : (totalK + totalA);
      const csPerMin = totalMinutes > 0 ? totalCS / totalMinutes : 0;

      // Recent Stats Calculation (Comparing Recent vs Previous)
      const sortedMatches = [...champ.matches].sort((a: any, b: any) => new Date(b.match.date).getTime() - new Date(a.match.date).getTime());
      
      // Determine split: Try to take last 5, but ensure we have at least 1 previous match to compare against.
      // If total is 1, recentCount is 0 (no trend).
      // If total is 2, recentCount is 1 (1 vs 1).
      // If total is 6, recentCount is 5 (5 vs 1).
      const recentCount = Math.min(5, Math.max(0, sortedMatches.length - 1));
      
      let trendWR = 0;
      let trendKDA = 0;
      let trendCS = 0;

      if (recentCount > 0) {
        const recentMatches = sortedMatches.slice(0, recentCount);
        const previousMatches = sortedMatches.slice(recentCount);

        const calcStats = (matchList: any[]) => {
          if (matchList.length === 0) return { wr: 0, kda: 0, cs: 0 };
          
          const w = matchList.filter((m: any) => m.match.result === "WIN").length;
          const wr = (w / matchList.length) * 100;

          const k = matchList.reduce((s: number, m: any) => s + (m.kills || 0), 0);
          const d = matchList.reduce((s: number, m: any) => s + (m.deaths || 0), 0);
          const a = matchList.reduce((s: number, m: any) => s + (m.assists || 0), 0);
          const kda = d > 0 ? (k + a) / d : (k + a);

          let tCS = 0;
          let tMin = 0;
          matchList.forEach((m: any) => {
            tCS += (m.cs || 0);
            tMin += (m.match.duration ? m.match.duration / 60 : 30);
          });
          const cs = tMin > 0 ? tCS / tMin : 0;

          return { wr, kda, cs };
        };

        const recentStats = calcStats(recentMatches);
        const previousStats = calcStats(previousMatches);

        trendWR = recentStats.wr - previousStats.wr;
        trendKDA = recentStats.kda - previousStats.kda;
        trendCS = recentStats.cs - previousStats.cs;
      }

      return {
        name: champ.name,
        games: totalGames,
        winRate,
        kda,
        csPerMin,
        trendWR,
        trendKDA,
        trendCS
      };
    })
    .sort((a: any, b: any) => b.games - a.games)
    .slice(0, 5);

  // Trend Data (Last 20 games)
  const trendData = [...matches]
    .sort((a: any, b: any) => new Date(a.match.date).getTime() - new Date(b.match.date).getTime())
    .slice(-20)
    .map((m: any, index: number) => {
      const durationMin = m.match.duration ? m.match.duration / 60 : 30; // Default to 30 if missing
      const csPerMin = m.cs ? parseFloat((m.cs / durationMin).toFixed(1)) : 0;
      const kda = m.deaths > 0 ? parseFloat(((m.kills + m.assists) / m.deaths).toFixed(2)) : (m.kills + m.assists);
      return {
        date: new Date(m.match.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        uniqueId: `${new Date(m.match.date).getTime()}-${index}`,
        csPerMin,
        kda
      };
    });

  // Role Stats (Winrate by Tactical Role)
  const roleStatsMap = matches.reduce((acc: any, m: any) => {
    const role = m.championRole || "UNKNOWN"; // Handle legacy data
    if (!acc[role]) {
      acc[role] = { name: role, games: 0, wins: 0 };
    }
    acc[role].games += 1;
    if (m.match.result === "WIN") acc[role].wins += 1;
    return acc;
  }, {});

  const roleStats = Object.values(roleStatsMap).map((r: any) => ({
    name: r.name,
    winRate: Math.round((r.wins / r.games) * 100),
    games: r.games
  })).filter((r: any) => r.name !== "UNKNOWN");

  // Lane Allocation Stats (Winrate by Resource Allocation)
  const allocationStatsMap = matches.reduce((acc: any, m: any) => {
    const allocation = m.laneAllocation || "UNKNOWN";
    if (!acc[allocation]) {
      acc[allocation] = { name: allocation, games: 0, wins: 0 };
    }
    acc[allocation].games += 1;
    if (m.match.result === "WIN") acc[allocation].wins += 1;
    return acc;
  }, {});

  const allocationStats = Object.values(allocationStatsMap).map((r: any) => {
    let displayName = r.name;
    if (r.name === "STRONG_SIDE") displayName = "Strong Side";
    if (r.name === "WEAK_SIDE") displayName = "Weak Side";
    if (r.name === "NEUTRAL") displayName = "Neutral";
    
    return {
      name: displayName,
      winRate: Math.round((r.wins / r.games) * 100),
      games: r.games,
      originalName: r.name
    };
  }).filter((r: any) => r.originalName !== "UNKNOWN");

  // Historical Progress Data (Cumulative Stats over time)
  // Sort matches by date ascending
  const sortedMatches = [...matches].sort((a: any, b: any) => new Date(a.match.date).getTime() - new Date(b.match.date).getTime());
  
  const progressData = sortedMatches.map((match, index) => {
    // Get all matches up to this point (inclusive)
    const currentHistory = sortedMatches.slice(0, index + 1);
    const gamesCount = currentHistory.length;
    
    // Calculate cumulative stats
    const wins = currentHistory.filter((m: any) => m.match.result === "WIN").length;
    const winRate = (wins / gamesCount) * 100;
    
    const totalK = currentHistory.reduce((acc: number, m: any) => acc + (m.kills || 0), 0);
    const totalD = currentHistory.reduce((acc: number, m: any) => acc + (m.deaths || 0), 0);
    const totalA = currentHistory.reduce((acc: number, m: any) => acc + (m.assists || 0), 0);
    const kda = totalD > 0 ? (totalK + totalA) / totalD : (totalK + totalA); // Avoid infinity
    
    // Calculate CS/m and Vis/m cumulatively
    let totalMins = 0;
    let totalCS = 0;
    let totalVis = 0;
    
    currentHistory.forEach((m: any) => {
      const duration = m.match.duration ? m.match.duration / 60 : 30;
      totalMins += duration;
      totalCS += (m.cs || 0);
      totalVis += (m.visionWards || 0) + (m.wardsPlaced || 0);
    });
    
    const csPerMin = totalMins > 0 ? totalCS / totalMins : 0;
    const visPerMin = totalMins > 0 ? totalVis / totalMins : 0;
    
    // Calculate Scores (0-100) based on same logic as Card
    // WR: 70% = 100pts
    const wrScore = Math.min(100, Math.round((winRate / 70) * 100));
    
    // KDA: 5.0 = 100pts
    const kdaScore = Math.min(100, Math.round((kda / 5.0) * 100));
    
    // CS: 10.0 = 100pts
    const csScore = Math.min(100, Math.round((csPerMin / 10.0) * 100));
    
    // Vis: 0.60 = 100pts
    const visScore = Math.min(100, Math.round((visPerMin / 0.60) * 100));
    
    // Overall
    const overall = Math.round((wrScore + kdaScore + csScore + visScore) / 4);
    
    return {
      date: new Date(match.match.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      uniqueId: `${new Date(match.match.date).getTime()}-${index}`,
      overall,
      wrScore,
      kdaScore,
      csScore,
      visScore,
      // Raw values for tooltip
      rawWR: Math.round(winRate),
      rawKDA: kda.toFixed(2),
      rawCS: csPerMin.toFixed(1),
      rawVIS: visPerMin.toFixed(2)
    };
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch(`/api/users/${player.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error("Error updating player");

      setIsEditing(false);
      router.refresh();
    } catch (error) {
      console.error(error);
      alert("Error al actualizar el jugador");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!confirm("¿Estás seguro de que quieres eliminar este usuario? Esta acción cambiará su estado a ELIMINADO.")) return;
    
    setIsLoading(true);
    try {
      const res = await fetch(`/api/users/${player.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "DELETED" }),
      });

      if (!res.ok) throw new Error("Error deleting user");

      router.push("/players");
      router.refresh();
    } catch (error) {
      console.error(error);
      alert("Error al eliminar el usuario");
      setIsLoading(false);
    }
  };

  const tabs = [
    { id: "OVERVIEW", label: "Resumen", icon: LayoutDashboard },
    { id: "MATCHES", label: "Partidas", icon: Swords },
    { id: "POOL", label: "Champion Pool", icon: BookOpen },
    { id: "STATS", label: "Estadísticas", icon: BarChart2 },
    { id: "INFO", label: "Información", icon: User },
    { id: "EVAL", label: "Evaluaciones", icon: ClipboardList, restricted: true },
  ];

  return (
    <div className="space-y-6">
      {/* Tabs Navigation */}
      <div className="flex overflow-x-auto border-b border-slate-800 pb-1 gap-2">
        {tabs.map((tab) => {
          if (tab.restricted && userRole !== "ADMIN" && userRole !== "COACH") return null;
          
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`
                flex items-center gap-2 px-4 py-3 font-medium transition-colors relative whitespace-nowrap
                ${isActive ? "text-green-500" : "text-slate-400 hover:text-slate-200"}
              `}
            >
              <Icon size={18} />
              {tab.label}
              {isActive && (
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-green-500 rounded-t-full" />
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === "OVERVIEW" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Quick Stats & Recent Activity */}
            <div className="lg:col-span-2 space-y-6">
              {/* Season Summary Card */}
              <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-800 rounded-xl p-6 shadow-lg">
                <h3 className="text-lg font-bold mb-4 text-slate-200 flex items-center gap-2">
                  <Trophy size={20} className="text-yellow-500" />
                  Resumen de Temporada
                </h3>
                
                <div className="flex flex-col md:flex-row gap-8 items-center">
                  {/* FIFA Card */}
                  <div className={`relative w-48 h-72 flex-shrink-0 rounded-t-2xl rounded-b-xl p-1 shadow-xl border ${cardBgClass}`}>
                    {/* Inner Border/Content */}
                    <div className="h-full w-full border-2 border-opacity-20 border-black rounded-t-xl rounded-b-lg relative flex flex-col items-center pt-4 pb-2">
                        
                        {/* Rating & Pos */}
                        <div className="absolute top-4 left-4 flex flex-col items-center">
                            <span className={`text-3xl font-bold leading-none ${cardTextClass}`}>{overallRating}</span>
                            <span className={`text-sm font-bold uppercase ${cardTextClass}`}>
                              {(() => {
                                const pos = profile?.position || "N/A";
                                if (pos === "JUNGLE") return "JGL";
                                if (pos === "SUPPORT") return "SUP";
                                return pos;
                              })()}
                            </span>
                            {player.nationality && (
                              <span className={`text-xs font-bold uppercase mt-1 opacity-80 ${cardTextClass}`}>{player.nationality}</span>
                            )}
                        </div>

                        {/* Face/Image Placeholder */}
                        <div className="mt-4 mb-2">
                            <User size={64} className={`opacity-90 ${cardTextClass}`} />
                        </div>

                        {/* Name */}
                        <div className="w-full text-center mb-2 px-2 mt-auto">
                            <div className={`text-lg font-bold uppercase truncate ${cardTextClass}`}>{player.name}</div>
                            <div className={`h-0.5 w-10/12 mx-auto bg-black/20 my-1`}></div>
                        </div>

                        {/* Stats Grid */}
                        <div className={`grid grid-cols-2 gap-x-4 gap-y-1 text-xs font-bold w-full px-4 mb-2 ${cardTextClass}`}>
                            <div className="flex justify-between">
                                <span>{cardWR}</span> <span className="font-normal opacity-80">WR</span>
                            </div>
                            <div className="flex justify-between">
                                <span>{cardKDA}</span> <span className="font-normal opacity-80">KDA</span>
                            </div>
                            <div className="flex justify-between">
                                <span>{cardCS}</span> <span className="font-normal opacity-80">CS</span>
                            </div>
                            <div className="flex justify-between">
                                <span>{cardVIS}</span> <span className="font-normal opacity-80">VIS</span>
                            </div>
                        </div>
                    </div>
                  </div>

                  {/* Stats Grid (Right Side) */}
                  <div className="flex-1 w-full">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 text-center">
                        <div className="text-xs text-slate-500 uppercase font-bold mb-1">Win Rate</div>
                        <div className={`text-2xl font-bold ${winRate >= 50 ? 'text-green-400' : 'text-red-400'}`}>
                          {winRate}%
                        </div>
                        <div className="text-xs text-slate-500">{wins}W - {losses}L</div>
                      </div>
                      <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 text-center">
                        <div className="text-xs text-slate-500 uppercase font-bold mb-1">KDA Ratio</div>
                        <div className="text-2xl font-bold text-blue-400">{kdaRatio}</div>
                        <div className="text-xs text-slate-500">{avgKills} / {avgDeaths} / {avgAssists}</div>
                      </div>
                      <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 text-center">
                        <div className="text-xs text-slate-500 uppercase font-bold mb-1">Avg CS/m</div>
                        <div className="text-2xl font-bold text-yellow-400">{avgCSPerMin}</div>
                        <div className="text-xs text-slate-500">CS per min</div>
                      </div>
                      <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 text-center">
                        <div className="text-xs text-slate-500 uppercase font-bold mb-1">Avg W/m</div>
                        <div className="text-2xl font-bold text-purple-400">{avgWardsPerMin}</div>
                        <div className="text-xs text-slate-500">Wards per min</div>
                      </div>
                      <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 text-center col-span-2">
                        <div className="text-xs text-slate-500 uppercase font-bold mb-1">Partidas</div>
                        <div className="text-2xl font-bold text-white">{totalGames}</div>
                        <div className="text-xs text-slate-500">Total</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Matches List (Simplified) */}
              <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-800 rounded-xl p-6 shadow-lg">
                <h3 className="text-lg font-bold mb-4 text-slate-200">Partidas Recientes</h3>
                {matches.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">No hay partidas registradas.</div>
                ) : (
                  <div className="space-y-2">
                    {matches.slice(0, 5).map((m: any) => {
                      const result = m.match.result;
                      const resultColor = result === 'WIN' ? 'bg-green-500' : result === 'LOSS' ? 'bg-red-500' : 'bg-slate-500';
                      
                      return (
                        <div key={m.id} className="flex justify-between items-center bg-slate-950 p-3 rounded border border-slate-800">
                          <div className="flex items-center gap-3">
                            <div className={`w-2 h-12 rounded-full ${resultColor}`} />
                            <div>
                              <div className="font-bold text-white">{m.championName}</div>
                              <div className="text-xs text-slate-400">{m.match.type} - {new Date(m.match.date).toLocaleDateString()}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-mono text-sm text-slate-200">{m.kills}/{m.deaths}/{m.assists}</div>
                            <div className="text-xs text-slate-500">KDA</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Recent Eval & Pool Preview */}
            <div className="space-y-6">
              {/* Latest Evaluation */}
              <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-800 rounded-xl p-6 shadow-lg">
                <h3 className="text-lg font-bold mb-4 text-slate-200">Última Evaluación</h3>
                {evaluations.length > 0 ? (
                  <div className="space-y-4">
                    {evaluations[0].improvementGoal && (
                      <div className="bg-slate-950/50 p-3 rounded border border-slate-800/50">
                        <div className="text-xs font-bold text-purple-400 uppercase mb-1 flex items-center gap-2">
                          <Target size={14} /> Objetivo Principal
                        </div>
                        <div className="text-sm text-slate-200">{evaluations[0].improvementGoal}</div>
                      </div>
                    )}

                    <div className="space-y-3">
                       {evaluations[0].strengths && (
                        <div>
                          <div className="text-xs font-bold text-green-400 uppercase mb-1 flex items-center gap-2">
                            <TrendingUp size={14} /> Fortalezas
                          </div>
                          <p className="text-sm text-slate-300 line-clamp-2">{evaluations[0].strengths}</p>
                        </div>
                       )}
                       
                       {evaluations[0].weaknesses && (
                        <div>
                          <div className="text-xs font-bold text-red-400 uppercase mb-1 flex items-center gap-2">
                            <TrendingDown size={14} /> A Mejorar
                          </div>
                          <p className="text-sm text-slate-300 line-clamp-2">{evaluations[0].weaknesses}</p>
                        </div>
                       )}
                    </div>

                    {evaluations[0].notes && (
                        <div className="pt-2 border-t border-slate-800/50">
                            <p className="text-xs text-slate-400 italic line-clamp-3">"{evaluations[0].notes}"</p>
                        </div>
                    )}

                    <div className="text-xs text-slate-600 text-right">
                      Por: {evaluations[0].coach?.name || "Coach"} - {new Date(evaluations[0].date).toLocaleDateString()}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-500">Sin evaluaciones aún.</div>
                )}
              </div>

              {/* Attendance Summary */}
              <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-800 rounded-xl p-6 shadow-lg">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-bold text-slate-200">Asistencia</h3>
                  <div className={`text-2xl font-bold ${attendanceRate >= 80 ? 'text-green-400' : attendanceRate >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                    {attendanceRate}%
                  </div>
                </div>

                <div className="w-full bg-slate-950 rounded-full h-2 mb-6 overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${attendanceRate >= 80 ? 'bg-green-500' : attendanceRate >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                    style={{ width: `${attendanceRate}%` }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-950 p-3 rounded border border-slate-800 text-center">
                    <div className="text-xl font-bold text-white">{presentCount}</div>
                    <div className="text-xs text-slate-500 uppercase">Presente</div>
                  </div>
                  <div className="bg-slate-950 p-3 rounded border border-slate-800 text-center">
                    <div className="text-xl font-bold text-yellow-400">{lateCount}</div>
                    <div className="text-xs text-slate-500 uppercase">Atrasos</div>
                  </div>
                  <div className="bg-slate-950 p-3 rounded border border-slate-800 text-center">
                    <div className="text-xl font-bold text-red-400">{absentCount}</div>
                    <div className="text-xs text-slate-500 uppercase">Ausente</div>
                  </div>
                  <div className="bg-slate-950 p-3 rounded border border-slate-800 text-center">
                    <div className="text-xl font-bold text-blue-400">{excusedCount}</div>
                    <div className="text-xs text-slate-500 uppercase">Justificado</div>
                  </div>
                </div>
                
                <div className="mt-4 text-center text-xs text-slate-600">
                  Total Eventos: {totalAttendanceEvents}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "POOL" && (
          <ChampionPoolManager userId={player.id} initialPool={championPool} />
        )}

        {activeTab === "INFO" && (
          <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-800 rounded-xl p-6 max-w-2xl shadow-lg">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-200">Información Personal</h3>
              {canEdit && !isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 text-sm bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded-lg transition-colors shadow-md"
                >
                  <Pencil size={16} />
                  Editar
                </button>
              )}
            </div>

            {isEditing ? (
              <form onSubmit={handleSave} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Game ID (Riot ID)</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 focus:outline-none focus:border-green-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Posición</label>
                    <select
                      value={formData.position}
                      onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 focus:outline-none focus:border-green-500"
                    >
                      <option value="TOP">TOP</option>
                      <option value="JUNGLE">JUNGLE</option>
                      <option value="MID">MID</option>
                      <option value="ADC">ADC</option>
                      <option value="SUPPORT">SUPPORT</option>
                      <option value="FILL">FILL</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Nombre Real</label>
                  <input
                    type="text"
                    value={formData.realName}
                    onChange={(e) => setFormData({ ...formData, realName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 focus:outline-none focus:border-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Nacionalidad</label>
                  <input
                    type="text"
                    value={formData.nationality}
                    onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 focus:outline-none focus:border-green-500"
                    placeholder="Ej: MX, AR, KR"
                    maxLength={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 focus:outline-none focus:border-green-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Teléfono</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 focus:outline-none focus:border-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Discord ID</label>
                    <input
                      type="text"
                      value={formData.discordId}
                      onChange={(e) => setFormData({ ...formData, discordId: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 focus:outline-none focus:border-green-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">OP.GG URL</label>
                  <input
                    type="url"
                    value={formData.opggUrl}
                    onChange={(e) => setFormData({ ...formData, opggUrl: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 focus:outline-none focus:border-green-500"
                    placeholder="https://www.op.gg/summoners/..."
                  />
                </div>

                <div className="flex justify-between items-center mt-6 pt-6 border-t border-slate-800">
                  <div>
                    {userRole === "ADMIN" && (
                      <button
                        type="button"
                        onClick={handleDeleteUser}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 transition-colors border border-red-500/20"
                      >
                        <Trash2 size={20} />
                        Eliminar Usuario
                      </button>
                    )}
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors text-slate-300"
                    >
                      <X size={20} />
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white px-6 py-2 rounded-lg font-bold transition-colors disabled:opacity-50"
                    >
                      <Save size={20} />
                      {isLoading ? "Guardando..." : "Guardar"}
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-slate-500 uppercase font-bold mb-1">Game ID (Riot ID)</label>
                    <div className="text-slate-200">{player.name}</div>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 uppercase font-bold mb-1">Posición</label>
                    <div className="text-slate-200">{profile?.position || "FILL"}</div>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 uppercase font-bold mb-1">Nombre Real</label>
                    <div className="text-slate-200">{player.realName || "-"}</div>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 uppercase font-bold mb-1">Nacionalidad</label>
                    <div className="text-slate-200">{player.nationality || "-"}</div>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 uppercase font-bold mb-1">Email</label>
                    <div className="text-slate-200">{player.email}</div>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 uppercase font-bold mb-1">Teléfono</label>
                    <div className="text-slate-200">{player.phone || profile?.phone || "-"}</div>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 uppercase font-bold mb-1">Discord ID</label>
                    <div className="text-slate-200">{player.discordId || "-"}</div>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 uppercase font-bold mb-1">OP.GG</label>
                    <a href={profile?.opggUrl} target="_blank" className="text-blue-400 hover:underline truncate block">
                      {profile?.opggUrl || "-"}
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Matches Tab */}
        {activeTab === "MATCHES" && (
          <div className="space-y-6">
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-white">Historial de Partidas</h3>
                {(canEdit || player.id === currentUserId) && (
                  <button
                    onClick={() => router.push(`/players/${player.id}/matches/new`)}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-md"
                  >
                    <Swords size={18} />
                    Registrar Partida SoloQ
                  </button>
                )}
              </div>

              {/* Filters Toolbar */}
              <div className="flex flex-wrap items-center gap-4 bg-slate-900/80 backdrop-blur-sm p-4 rounded-xl border border-slate-800 shadow-lg">
                <div className="flex items-center gap-2">
                  <Filter size={16} className="text-slate-400" />
                  <span className="text-sm font-medium text-slate-300">Filtros:</span>
                </div>
                
                <select 
                  value={filterResult}
                  onChange={(e) => {
                    setFilterResult(e.target.value as any);
                    setCurrentPage(1);
                  }}
                  className="bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2"
                >
                  <option value="ALL">Todos los Resultados</option>
                  <option value="WIN">Victorias</option>
                  <option value="LOSS">Derrotas</option>
                </select>

                <select 
                  value={filterSide}
                  onChange={(e) => {
                    setFilterSide(e.target.value as any);
                    setCurrentPage(1);
                  }}
                  className="bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2"
                >
                  <option value="ALL">Todos los Lados</option>
                  <option value="BLUE">Lado Azul</option>
                  <option value="RED">Lado Rojo</option>
                </select>

                <button
                  onClick={() => setSortOrder(prev => prev === "DESC" ? "ASC" : "DESC")}
                  className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-sm text-slate-200 transition-colors"
                >
                  {sortOrder === "DESC" ? <TrendingDown size={16} /> : <TrendingUp size={16} />}
                  {sortOrder === "DESC" ? "Más Recientes" : "Más Antiguas"}
                </button>
              </div>
            </div>

            {filteredMatches.length === 0 ? (
              <div className="text-center py-12 text-slate-500 bg-slate-900/80 backdrop-blur-sm rounded-xl border border-dashed border-slate-800 shadow-lg">
                No hay partidas que coincidan con los filtros.
              </div>
            ) : (
              <div className="grid gap-4">
                {currentMatches.map((m: any) => {
                  const result = m.match.result;
                  const isWin = result === 'WIN';
                  const resultColor = isWin ? 'border-green-500/50 bg-green-500/10' : result === 'LOSS' ? 'border-red-500/50 bg-red-500/10' : 'border-slate-800 bg-slate-900/80';
                  const textColor = isWin ? 'text-green-400' : result === 'LOSS' ? 'text-red-400' : 'text-slate-400';
                  
                  return (
                    <div key={m.id} className={`flex items-center justify-between p-4 rounded-xl border backdrop-blur-sm shadow-md ${resultColor} transition-all hover:scale-[1.01]`}>
                      <div className="flex items-center gap-6">
                        <div className={`p-3 rounded-lg ${isWin ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                          <Swords size={24} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-lg text-white">{m.championName}</span>
                            <span className={`text-xs font-bold px-2 py-0.5 rounded border ${isWin ? 'border-green-500/30 bg-green-500/10 text-green-400' : 'border-red-500/30 bg-red-500/10 text-red-400'}`}>
                              {result}
                            </span>
                            <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded border border-slate-700">
                              {m.match.type}
                            </span>
                          </div>
                          <div className="text-sm text-slate-400">
                            {new Date(m.match.date).toLocaleDateString()} • {m.position}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-8 text-right">
                        <div>
                          <div className="text-xs text-slate-500 uppercase font-bold">KDA</div>
                          <div className="font-mono text-lg text-white">
                            {m.kills}/{m.deaths}/{m.assists}
                          </div>
                        </div>
                        <div className="hidden md:block">
                          <div className="text-xs text-slate-500 uppercase font-bold">CS</div>
                          <div className="font-mono text-slate-300">{m.cs}</div>
                        </div>
                        
                        {(canEdit || (player.id === currentUserId && m.match.type === 'SOLOQ')) && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/players/${player.id}/matches/${m.match.id}`);
                            }}
                            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                            title="Editar Partida"
                          >
                            <Pencil size={18} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-4 mt-6">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft size={20} />
                </button>
                <span className="text-sm text-slate-400">
                  Página <span className="text-white font-medium">{currentPage}</span> de <span className="text-white font-medium">{totalPages}</span>
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            )}
          </div>
        )}
        
        {activeTab === "STATS" && (
          <div className="space-y-6">
            {/* Row 1: Radar, Role & Allocation Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Radar Chart */}
              <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-800 rounded-xl p-6 shadow-lg">
                <h3 className="text-lg font-bold mb-4 text-slate-200 flex items-center gap-2">
                  <Target size={20} className="text-purple-400" />
                  Evaluación (Radar)
                </h3>
                <div className="h-[300px] w-full flex items-center justify-center">
                  {totalGames > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                        <PolarGrid stroke="#334155" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 10]} tick={false} axisLine={false} />
                        <Radar
                          name="Rating"
                          dataKey="A"
                          stroke="#8b5cf6"
                          strokeWidth={2}
                          fill="#8b5cf6"
                          fillOpacity={0.3}
                        />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f1f5f9' }}
                          itemStyle={{ color: '#8b5cf6' }}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="text-slate-500 text-sm">No hay suficientes datos para el gráfico.</div>
                  )}
                </div>
              </div>

              {/* Role Winrate Chart */}
              <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-800 rounded-xl p-6 shadow-lg">
                <h3 className="text-lg font-bold mb-4 text-slate-200 flex items-center gap-2">
                  <Swords size={20} className="text-red-400" />
                  Winrate por Rol
                </h3>
                <div className="h-[300px] w-full flex items-center justify-center">
                  {roleStats.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={roleStats} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                        <XAxis type="number" domain={[0, 100]} stroke="#94a3b8" />
                        <YAxis dataKey="name" type="category" stroke="#94a3b8" width={80} />
                        <Tooltip 
                          cursor={{ fill: '#1e293b' }}
                          contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f1f5f9' }}
                        />
                        <Bar dataKey="winRate" fill="#3b82f6" radius={[0, 4, 4, 0]} name="Win Rate %" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="text-slate-500 text-sm">No hay datos de roles tácticos aún.</div>
                  )}
                </div>
              </div>

              {/* Lane Allocation Chart */}
              <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-800 rounded-xl p-6 shadow-lg">
                <h3 className="text-lg font-bold mb-4 text-slate-200 flex items-center gap-2">
                  <Activity size={20} className="text-orange-400" />
                  Winrate por Recursos
                </h3>
                <div className="h-[300px] w-full flex items-center justify-center">
                  {allocationStats.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={allocationStats} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                        <XAxis type="number" domain={[0, 100]} stroke="#94a3b8" />
                        <YAxis dataKey="name" type="category" stroke="#94a3b8" width={80} />
                        <Tooltip 
                          cursor={{ fill: '#1e293b' }}
                          contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f1f5f9' }}
                        />
                        <Bar dataKey="winRate" fill="#f97316" radius={[0, 4, 4, 0]} name="Win Rate %" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="text-slate-500 text-sm">No hay datos de asignación de línea.</div>
                  )}
                </div>
              </div>
            </div>

            {/* Row 2: Trends */}
            <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-800 rounded-xl p-6 shadow-lg">
              <h3 className="text-lg font-bold mb-4 text-slate-200 flex items-center gap-2">
                <Activity size={20} className="text-green-400" />
                Tendencias Recientes (Últimas 20 Partidas)
              </h3>
              <div className="h-[300px] w-full">
                {trendData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                      <XAxis 
                        dataKey="uniqueId" 
                        stroke="#94a3b8" 
                        tick={{ fontSize: 12 }} 
                        tickFormatter={(value) => {
                          const timestamp = parseInt(value.split('-')[0]);
                          return new Date(timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                        }}
                      />
                      <YAxis yAxisId="left" stroke="#fbbf24" label={{ value: 'CS/min', angle: -90, position: 'insideLeft', fill: '#fbbf24' }} />
                      <YAxis yAxisId="right" orientation="right" stroke="#3b82f6" label={{ value: 'KDA', angle: 90, position: 'insideRight', fill: '#3b82f6' }} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f1f5f9' }}
                        labelFormatter={(value) => {
                          const timestamp = parseInt(value.split('-')[0]);
                          return new Date(timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                        }}
                      />
                      <Legend />
                      <Line yAxisId="left" type="monotone" dataKey="csPerMin" stroke="#fbbf24" activeDot={{ r: 8 }} name="CS/min" />
                      <Line yAxisId="right" type="monotone" dataKey="kda" stroke="#3b82f6" activeDot={{ r: 8 }} name="KDA" />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-500 text-sm">
                    No hay suficientes datos para tendencias.
                  </div>
                )}
              </div>
            </div>

            {/* Row 3: Historical Progress (FIFA Ratings) */}
            <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-800 rounded-xl p-6 shadow-lg">
              <h3 className="text-lg font-bold mb-4 text-slate-200 flex items-center gap-2">
                <Trophy size={20} className="text-yellow-500" />
                Progreso Histórico (Valor del Jugador)
              </h3>
              <div className="h-[350px] w-full">
                {progressData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={progressData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                      <XAxis 
                        dataKey="uniqueId" 
                        stroke="#94a3b8" 
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => {
                          const timestamp = parseInt(value.split('-')[0]);
                          return new Date(timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                        }}
                      />
                      <YAxis domain={[0, 100]} stroke="#94a3b8" label={{ value: 'Puntaje (0-100)', angle: -90, position: 'insideLeft', fill: '#94a3b8' }} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f1f5f9' }}
                        labelFormatter={(value) => {
                          const timestamp = parseInt(value.split('-')[0]);
                          return new Date(timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                        }}
                        formatter={(value: number, name: string, props: any) => {
                          const { rawWR, rawKDA, rawCS, rawVIS } = props.payload;
                          if (name === "Valor General") return [`${value} pts`, name];
                          if (name === "Win Rate") return [`${value} pts (${rawWR}%)`, name];
                          if (name === "KDA") return [`${value} pts (${rawKDA})`, name];
                          if (name === "CS/m") return [`${value} pts (${rawCS})`, name];
                          if (name === "Visión") return [`${value} pts (${rawVIS})`, name];
                          return [value, name];
                        }}
                      />
                      <Legend />
                      <Line type="monotone" dataKey="overall" stroke="#ffffff" strokeWidth={3} dot={{ r: 4 }} name="Valor General" />
                      <Line type="monotone" dataKey="wrScore" stroke="#4ade80" strokeDasharray="5 5" dot={false} name="Win Rate" />
                      <Line type="monotone" dataKey="kdaScore" stroke="#60a5fa" strokeDasharray="5 5" dot={false} name="KDA" />
                      <Line type="monotone" dataKey="csScore" stroke="#facc15" strokeDasharray="5 5" dot={false} name="CS/m" />
                      <Line type="monotone" dataKey="visScore" stroke="#c084fc" strokeDasharray="5 5" dot={false} name="Visión" />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-500 text-sm">
                    No hay suficientes datos para el historial.
                  </div>
                )}
              </div>
            </div>

            {/* Row 4: Champion Stats */}
            <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-800 rounded-xl p-6 shadow-lg">
              <h3 className="text-lg font-bold mb-4 text-slate-200 flex items-center gap-2">
                <Trophy size={20} className="text-yellow-500" />
                Estadísticas por Campeón
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="text-xs text-slate-500 uppercase border-b border-slate-800">
                      <th className="py-3 px-4">Campeón</th>
                      <th className="py-3 px-4 text-center">Juegos</th>
                      <th className="py-3 px-4 text-center">Win Rate</th>
                      <th className="py-3 px-4 text-center">KDA</th>
                      <th className="py-3 px-4 text-center">CS/m</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {topChampions.length > 0 ? (
                      topChampions.map((champ: any) => {
                        const wr = Math.round(champ.winRate);
                        const kda = champ.kda.toFixed(2);
                        const cs = champ.csPerMin.toFixed(1);
                        
                        const renderTrend = (value: number) => {
                          if (value > 0.5) return <TrendingUp size={14} className="text-green-400 inline ml-1" />;
                          if (value < -0.5) return <TrendingDown size={14} className="text-red-400 inline ml-1" />;
                          return <Minus size={14} className="text-slate-600 inline ml-1" />;
                        };

                        return (
                          <tr key={champ.name} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                            <td className="py-3 px-4 font-bold text-white">{champ.name}</td>
                            <td className="py-3 px-4 text-center text-slate-300">{champ.games}</td>
                            <td className="py-3 px-4 text-center">
                              <span className={`${wr >= 50 ? 'text-green-400' : 'text-red-400'}`}>{wr}%</span>
                              {renderTrend(champ.trendWR)}
                            </td>
                            <td className="py-3 px-4 text-center font-mono text-blue-300">
                              {kda}
                              {renderTrend(champ.trendKDA)}
                            </td>
                            <td className="py-3 px-4 text-center text-yellow-500">
                              {cs}
                              {renderTrend(champ.trendCS)}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-500">No hay datos de campeones.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === "EVAL" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-white">Evaluaciones de Coach</h3>
              {canEdit && !isAddingEval && (
                <button
                  onClick={() => {
                    setEditingEval(null);
                    setEvalForm({
                      communication: 5,
                      mental: 5,
                      mechanics: 5,
                      gameKnowledge: 5,
                      teamplay: 5,
                      notes: "",
                      strengths: "",
                      weaknesses: "",
                      improvementGoal: ""
                    });
                    setIsAddingEval(true);
                  }}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-md"
                >
                  <Plus size={18} />
                  Nueva Evaluación
                </button>
              )}
            </div>

            {isAddingEval && (
              <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-800 rounded-xl p-6 shadow-lg">
                <h4 className="text-lg font-bold text-slate-200 mb-4">
                  {editingEval ? "Editar Evaluación" : "Nueva Evaluación"}
                </h4>
                <form onSubmit={handleSaveEval} className="space-y-6">
                  {/* Numeric Ratings */}
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    {[
                      { key: "mechanics", label: "Mecánicas" },
                      { key: "gameKnowledge", label: "Conocimiento" },
                      { key: "communication", label: "Comunicación" },
                      { key: "teamplay", label: "Juego en Equipo" },
                      { key: "mental", label: "Mental" },
                    ].map((field) => (
                      <div key={field.key}>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                          {field.label} ({evalForm[field.key as keyof typeof evalForm]})
                        </label>
                        <input
                          type="range"
                          min="1"
                          max="10"
                          step="0.5"
                          value={evalForm[field.key as keyof typeof evalForm] as number}
                          onChange={(e) => setEvalForm({ ...evalForm, [field.key]: parseFloat(e.target.value) })}
                          className="w-full accent-green-500"
                        />
                        <div className="flex justify-between text-xs text-slate-600 mt-1">
                          <span>1</span>
                          <span>10</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Text Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-400 mb-2">Fortalezas</label>
                      <textarea
                        value={evalForm.strengths}
                        onChange={(e) => setEvalForm({ ...evalForm, strengths: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 focus:outline-none focus:border-green-500 min-h-[100px]"
                        placeholder="Puntos fuertes del jugador..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-400 mb-2">Debilidades / A mejorar</label>
                      <textarea
                        value={evalForm.weaknesses}
                        onChange={(e) => setEvalForm({ ...evalForm, weaknesses: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 focus:outline-none focus:border-green-500 min-h-[100px]"
                        placeholder="Aspectos que necesitan trabajo..."
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-slate-400 mb-2">Objetivo de Mejora</label>
                      <input
                        type="text"
                        value={evalForm.improvementGoal}
                        onChange={(e) => setEvalForm({ ...evalForm, improvementGoal: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 focus:outline-none focus:border-green-500"
                        placeholder="Meta principal para el próximo periodo..."
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-slate-400 mb-2">Notas Adicionales</label>
                      <textarea
                        value={evalForm.notes}
                        onChange={(e) => setEvalForm({ ...evalForm, notes: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 focus:outline-none focus:border-green-500 min-h-[80px]"
                        placeholder="Comentarios generales..."
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => setIsAddingEval(false)}
                      className="px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors text-slate-300"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white px-6 py-2 rounded-lg font-bold transition-colors disabled:opacity-50"
                    >
                      <Save size={20} />
                      {isLoading ? "Guardando..." : "Guardar Evaluación"}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Evaluations List */}
            <div className="space-y-4">
              {evaluationsList.length === 0 ? (
                <div className="text-center py-12 text-slate-500 bg-slate-900/80 backdrop-blur-sm rounded-xl border border-dashed border-slate-800 shadow-lg">
                  No hay evaluaciones registradas.
                </div>
              ) : (
                evaluationsList.map((ev: any) => (
                  <div key={ev.id} className="bg-slate-900/80 backdrop-blur-sm border border-slate-800 rounded-xl overflow-hidden shadow-lg">
                    <div className="p-4 bg-slate-950/50 border-b border-slate-800 flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
                          <User size={20} />
                        </div>
                        <div>
                          <div className="font-bold text-white">{ev.coach?.name || "Coach"}</div>
                          <div className="text-xs text-slate-500">{new Date(ev.date).toLocaleDateString()}</div>
                        </div>
                      </div>
                      {canEdit && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => startEditEval(ev)}
                            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                          >
                            <Pencil size={18} />
                          </button>
                          <button
                            onClick={() => handleDeleteEval(ev.id)}
                            className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      )}
                    </div>
                    
                    <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
                      {/* Ratings Column */}
                      <div className="space-y-3">
                        <h5 className="text-sm font-bold text-slate-400 uppercase mb-2">Calificaciones</h5>
                        {[
                          { label: "Mecánicas", val: ev.mechanics },
                          { label: "Conocimiento", val: ev.gameKnowledge },
                          { label: "Comunicación", val: ev.communication },
                          { label: "Teamplay", val: ev.teamplay },
                          { label: "Mental", val: ev.mental },
                        ].map((stat) => (
                          <div key={stat.label} className="flex justify-between items-center">
                            <span className="text-sm text-slate-300">{stat.label}</span>
                            <div className="flex items-center gap-2">
                              <div className="w-24 h-2 bg-slate-800 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full rounded-full ${
                                    stat.val >= 8 ? 'bg-green-500' : 
                                    stat.val >= 6 ? 'bg-blue-500' : 
                                    stat.val >= 4 ? 'bg-yellow-500' : 'bg-red-500'
                                  }`}
                                  style={{ width: `${(stat.val / 10) * 100}%` }}
                                />
                              </div>
                              <span className="text-sm font-bold w-6 text-right">{stat.val}</span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Feedback Column */}
                      <div className="lg:col-span-2 space-y-4">
                        {ev.improvementGoal && (
                          <div className="bg-slate-950/50 p-3 rounded border border-slate-800/50">
                            <div className="text-xs font-bold text-purple-400 uppercase mb-1 flex items-center gap-2">
                              <Target size={14} /> Objetivo Principal
                            </div>
                            <div className="text-slate-200">{ev.improvementGoal}</div>
                          </div>
                        )}
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {ev.strengths && (
                            <div>
                              <div className="text-xs font-bold text-green-400 uppercase mb-1 flex items-center gap-2">
                                <TrendingUp size={14} /> Fortalezas
                              </div>
                              <p className="text-sm text-slate-300 whitespace-pre-wrap">{ev.strengths}</p>
                            </div>
                          )}
                          {ev.weaknesses && (
                            <div>
                              <div className="text-xs font-bold text-red-400 uppercase mb-1 flex items-center gap-2">
                                <TrendingDown size={14} /> A Mejorar
                              </div>
                              <p className="text-sm text-slate-300 whitespace-pre-wrap">{ev.weaknesses}</p>
                            </div>
                          )}
                        </div>

                        {ev.notes && (
                          <div className="pt-4 border-t border-slate-800/50">
                            <div className="text-xs font-bold text-slate-500 uppercase mb-1">Notas Adicionales</div>
                            <p className="text-sm text-slate-400 italic">"{ev.notes}"</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
