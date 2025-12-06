"use client";

import { useState, useEffect } from "react";
import { format, addMonths, subMonths, startOfMonth } from "date-fns";
import { es } from "date-fns/locale";
import { X, ChevronLeft, ChevronRight, BarChart2, User as UserIcon } from "lucide-react";

interface AttendanceStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  lineupId: string;
}

interface StatDetail {
  present: number;
  total: number;
  late: number;
  absent: number;
  excused: number;
}

interface MemberStat {
  user: {
    id: string;
    name: string;
    role: string;
  };
  stats: Record<string, StatDetail>;
}

interface StatsData {
  period: { start: string; end: string };
  eventCounts: Record<string, number>;
  memberStats: MemberStat[];
}

export default function AttendanceStatsModal({ isOpen, onClose, lineupId }: AttendanceStatsModalProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [data, setData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && lineupId) {
      fetchStats();
    }
  }, [isOpen, lineupId, currentDate]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const dateStr = format(currentDate, "yyyy-MM-dd");
      const res = await fetch(`/api/schedule/stats?lineupId=${lineupId}&date=${dateStr}`);
      if (res.ok) {
        const jsonData = await res.json();
        setData(jsonData);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));

  const calculatePercentage = (count: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((count / total) * 100);
  };

  const getPercentageColor = (percentage: number, inverse = false) => {
    if (inverse) {
      if (percentage >= 50) return "text-red-400";
      if (percentage >= 20) return "text-yellow-400";
      return "text-green-400";
    }
    if (percentage >= 80) return "text-green-400";
    if (percentage >= 50) return "text-yellow-400";
    return "text-red-400";
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-slate-900 rounded-xl border border-slate-800 w-full max-w-6xl max-h-[90vh] flex flex-col shadow-2xl">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50 rounded-t-xl">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400">
              <BarChart2 size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Estadísticas de Asistencia</h2>
              <p className="text-sm text-slate-400">Resumen mensual de actividades y participación</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Controls & Summary */}
        <div className="p-6 border-b border-slate-800 bg-slate-900/30">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            
            {/* Month Selector */}
            <div className="flex items-center gap-4 bg-slate-950 p-1 rounded-lg border border-slate-800">
              <button onClick={handlePrevMonth} className="p-2 hover:bg-slate-800 rounded-md text-slate-400 hover:text-white">
                <ChevronLeft size={20} />
              </button>
              <span className="text-lg font-bold min-w-[160px] text-center capitalize text-white">
                {format(currentDate, "MMMM yyyy", { locale: es })}
              </span>
              <button onClick={handleNextMonth} className="p-2 hover:bg-slate-800 rounded-md text-slate-400 hover:text-white">
                <ChevronRight size={20} />
              </button>
            </div>

            {/* Event Counts Summary */}
            {data && (
              <div className="flex gap-4 text-sm">
                <div className="px-4 py-2 bg-slate-800 rounded-lg border border-slate-700">
                  <span className="text-slate-400 block text-xs uppercase tracking-wider">Total Eventos</span>
                  <span className="text-xl font-bold text-white">{data.eventCounts.ALL || 0}</span>
                </div>
                <div className="px-4 py-2 bg-blue-900/20 rounded-lg border border-blue-500/30">
                  <span className="text-blue-300 block text-xs uppercase tracking-wider">Scrims</span>
                  <span className="text-xl font-bold text-blue-400">{data.eventCounts.SCRIM || 0}</span>
                </div>
                <div className="px-4 py-2 bg-yellow-900/20 rounded-lg border border-yellow-500/30">
                  <span className="text-yellow-300 block text-xs uppercase tracking-wider">Torneos</span>
                  <span className="text-xl font-bold text-yellow-400">{data.eventCounts.TOURNAMENT || 0}</span>
                </div>
                <div className="px-4 py-2 bg-purple-900/20 rounded-lg border border-purple-500/30">
                  <span className="text-purple-300 block text-xs uppercase tracking-wider">Training</span>
                  <span className="text-xl font-bold text-purple-400">{data.eventCounts.TRAINING || 0}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Table Content */}
        <div className="flex-1 overflow-auto p-6">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          ) : !data || data.memberStats.length === 0 ? (
            <div className="text-center py-20 text-slate-500">
              <UserIcon size={48} className="mx-auto mb-4 opacity-20" />
              <p>No hay datos disponibles para este periodo.</p>
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-700 text-xs uppercase tracking-wider text-slate-400">
                    <th className="p-4 font-medium sticky left-0 bg-slate-900 z-10">Miembro</th>
                    <th className="p-4 font-medium text-center bg-slate-800/50">Asistencia Global</th>
                    <th className="p-4 font-medium text-center">Atrasos</th>
                    <th className="p-4 font-medium text-center">Inasistencias</th>
                    <th className="p-4 font-medium text-center">Justificadas</th>
                    <th className="p-4 font-medium text-center border-l border-slate-800">Scrims</th>
                    <th className="p-4 font-medium text-center">Torneos</th>
                    <th className="p-4 font-medium text-center">Training</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {data.memberStats.map((member) => {
                    const allStats = member.stats.ALL;
                    const scrimStats = member.stats.SCRIM;
                    const tourneyStats = member.stats.TOURNAMENT;
                    const trainingStats = member.stats.TRAINING;

                    // Calculations based on user request
                    // Asistencia Global: (Present + Late) / Total
                    const attendancePct = calculatePercentage(allStats.present + allStats.late, allStats.total);
                    
                    // Atrasos: Late / Total
                    const latePct = calculatePercentage(allStats.late, allStats.total);
                    
                    // Inasistencias: (Absent + Excused) / Total
                    const absentPct = calculatePercentage(allStats.absent + allStats.excused, allStats.total);
                    
                    // Justificadas: Excused / Total
                    const excusedPct = calculatePercentage(allStats.excused, allStats.total);
                    
                    return (
                      <tr key={member.user.id} className="hover:bg-slate-800/50 transition-colors">
                        <td className="p-4 sticky left-0 bg-slate-900 z-10">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-slate-300 font-bold text-xs">
                              {member.user.name.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-medium text-white">{member.user.name}</div>
                              <div className="text-xs text-slate-500 capitalize">{member.user.role.toLowerCase()}</div>
                            </div>
                          </div>
                        </td>
                        
                        {/* General Stats */}
                        <td className="p-4 text-center bg-slate-800/30">
                          <div className="flex flex-col items-center">
                            <span className={`text-lg font-bold ${getPercentageColor(attendancePct)}`}>
                              {attendancePct}%
                            </span>
                            <span className="text-xs text-slate-500">
                              {allStats.present + allStats.late}/{allStats.total}
                            </span>
                          </div>
                        </td>

                        {/* Atrasos */}
                        <td className="p-4 text-center">
                          <div className="flex flex-col items-center">
                            <span className={`font-medium ${getPercentageColor(latePct, true)}`}>
                              {latePct}%
                            </span>
                            <span className="text-xs text-slate-500">
                              {allStats.late}
                            </span>
                          </div>
                        </td>

                        {/* Inasistencias */}
                        <td className="p-4 text-center">
                          <div className="flex flex-col items-center">
                            <span className={`font-medium ${getPercentageColor(absentPct, true)}`}>
                              {absentPct}%
                            </span>
                            <span className="text-xs text-slate-500">
                              {allStats.absent + allStats.excused}
                            </span>
                          </div>
                        </td>

                        {/* Justificadas */}
                        <td className="p-4 text-center">
                          <div className="flex flex-col items-center">
                            <span className="font-medium text-blue-400">
                              {excusedPct}%
                            </span>
                            <span className="text-xs text-slate-500">
                              {allStats.excused}
                            </span>
                          </div>
                        </td>

                        {/* Scrim Stats */}
                        <td className="p-4 text-center border-l border-slate-800">
                          {scrimStats && scrimStats.total > 0 ? (
                            <div className="flex flex-col items-center">
                              <span className={`font-medium ${getPercentageColor(calculatePercentage(scrimStats.present + scrimStats.late, scrimStats.total))}`}>
                                {calculatePercentage(scrimStats.present + scrimStats.late, scrimStats.total)}%
                              </span>
                              <span className="text-xs text-slate-500 mt-1">
                                {scrimStats.present + scrimStats.late}/{scrimStats.total}
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-600">-</span>
                          )}
                        </td>

                        {/* Tournament Stats */}
                        <td className="p-4 text-center">
                          {tourneyStats && tourneyStats.total > 0 ? (
                            <div className="flex flex-col items-center">
                              <span className={`font-medium ${getPercentageColor(calculatePercentage(tourneyStats.present + tourneyStats.late, tourneyStats.total))}`}>
                                {calculatePercentage(tourneyStats.present + tourneyStats.late, tourneyStats.total)}%
                              </span>
                              <span className="text-xs text-slate-500 mt-1">
                                {tourneyStats.present + tourneyStats.late}/{tourneyStats.total}
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-600">-</span>
                          )}
                        </td>

                        {/* Training Stats */}
                        <td className="p-4 text-center">
                          {trainingStats && trainingStats.total > 0 ? (
                            <div className="flex flex-col items-center">
                              <span className={`font-medium ${getPercentageColor(calculatePercentage(trainingStats.present + trainingStats.late, trainingStats.total))}`}>
                                {calculatePercentage(trainingStats.present + trainingStats.late, trainingStats.total)}%
                              </span>
                              <span className="text-xs text-slate-500 mt-1">
                                {trainingStats.present + trainingStats.late}/{trainingStats.total}
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-600">-</span>
                          )}
                        </td>

                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
        {/* Footer Legend */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/50 rounded-b-xl flex gap-6 text-xs text-slate-400 justify-center">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400"></div>
            <span>Alto (&ge;80%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
            <span>Medio (50-79%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-400"></div>
            <span>Bajo (&lt;50%)</span>
          </div>
        </div>

      </div>
    </div>
  );
}
