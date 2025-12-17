"use client";

import { useState, useEffect } from "react";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addDays, addMonths, subMonths, addWeeks, subWeeks } from "date-fns";
import { es } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, Users, Plus, MapPin, Link as LinkIcon, MoreVertical, Trash2, Edit2, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import EventForm from "./EventForm";
import AttendanceStatsModal from "./AttendanceStatsModal";
import { BarChart2 } from "lucide-react";

interface Lineup {
  id: string;
  name: string;
  scheduleLink?: string;
}

interface Event {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime?: string;
  type: "SCRIM" | "TOURNAMENT" | "TRAINING" | "ACTIVITY_LOG";
  opponentName?: string;
  opponentContact?: string;
  scrimType?: "WARMUP" | "EVALUATION" | "SCRIM";
  modality?: string;
  activityType?: string;
  attendances: Attendance[];
}

interface Attendance {
  userId: string;
  status: "PRESENT" | "ABSENT" | "LATE" | "EXCUSED" | "PENDING";
  user: {
    id: string;
    name: string;
    image?: string;
    role: string;
  };
}

export default function ScheduleClient() {
  const [lineups, setLineups] = useState<Lineup[]>([]);
  const [selectedLineupId, setSelectedLineupId] = useState<string>("");
  const [view, setView] = useState<"month" | "week">("month");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEventModal, setShowEventModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [editingLink, setEditingLink] = useState(false);
  const [scheduleLink, setScheduleLink] = useState("");
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [userTimezone, setUserTimezone] = useState("GMT-5"); // Default

  const TIMEZONE_OFFSETS: Record<string, number> = {
    "GMT-5": -5,
    "GMT-6": -6,
    "GMT-4": -4,
    "GMT-3": -3,
    "GMT+1": 1,
    "UTC": 0,
  };

  useEffect(() => {
    fetchSettings();
    fetchLineups();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/settings");
      if (res.ok) {
        const data = await res.json();
        if (data.timezone) setUserTimezone(data.timezone);
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    }
  };

  const getShiftedDate = (dateStr: string | Date) => {
    const date = new Date(dateStr);
    const targetOffset = TIMEZONE_OFFSETS[userTimezone] ?? -5;
    const localOffset = -date.getTimezoneOffset() / 60; // in hours. e.g. GMT-5 is -5.
    const diff = targetOffset - localOffset;
    return new Date(date.getTime() + diff * 60 * 60 * 1000);
  };

  useEffect(() => {
    if (selectedLineupId) {
      fetchEvents();
      const lineup = lineups.find(l => l.id === selectedLineupId);
      if (lineup) setScheduleLink(lineup.scheduleLink || "");
    }
  }, [selectedLineupId, currentDate, view]);

  const fetchLineups = async () => {
    try {
      const res = await fetch("/api/lineups");
      const data = await res.json();
      setLineups(data);
      if (data.length > 0) {
        setSelectedLineupId(data[0].id);
        setScheduleLink(data[0].scheduleLink || "");
      }
    } catch (error) {
      console.error("Error fetching lineups:", error);
    }
  };

  const saveScheduleLink = async () => {
    try {
      await fetch(`/api/lineups/${selectedLineupId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scheduleLink }),
      });
      setEditingLink(false);
      // Update local state
      setLineups(prev => prev.map(l => l.id === selectedLineupId ? { ...l, scheduleLink } : l));
    } catch (error) {
      console.error("Error saving schedule link:", error);
    }
  };


  const fetchEvents = async () => {
    setLoading(true);
    try {
      let start, end;
      if (view === "month") {
        start = startOfMonth(currentDate);
        end = endOfMonth(currentDate);
      } else {
        start = startOfWeek(currentDate, { weekStartsOn: 1 });
        end = endOfWeek(currentDate, { weekStartsOn: 1 });
      }

      // Add some buffer to fetch events from adjacent days if needed
      // Actually, for month view, we might want to see days from prev/next month in the grid
      const gridStart = startOfWeek(start, { weekStartsOn: 1 });
      const gridEnd = endOfWeek(end, { weekStartsOn: 1 });

      const res = await fetch(
        `/api/schedule/events?lineupId=${selectedLineupId}&start=${gridStart.toISOString()}&end=${gridEnd.toISOString()}`
      );
      const data = await res.json();
      setEvents(data);
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrev = () => {
    if (view === "month") {
      setCurrentDate(subMonths(currentDate, 1));
    } else {
      setCurrentDate(subWeeks(currentDate, 1));
    }
  };

  const handleNext = () => {
    if (view === "month") {
      setCurrentDate(addMonths(currentDate, 1));
    } else {
      setCurrentDate(addWeeks(currentDate, 1));
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setSelectedEvent(null);
    setShowEventModal(true);
  };

  const handleEventClick = (event: Event, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedEvent(event);
    setShowEventModal(true);
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case "SCRIM":
        return "bg-blue-500/20 border-blue-500 text-blue-300";
      case "TOURNAMENT":
        return "bg-yellow-500/20 border-yellow-500 text-yellow-300";
      case "TRAINING":
        return "bg-purple-500/20 border-purple-500 text-purple-300";
      case "ACTIVITY_LOG":
        return "bg-green-500/20 border-green-500 text-green-300";
      default:
        return "bg-slate-700 border-slate-600 text-slate-300";
    }
  };

  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const dateFormat = "d";
    const rows = [];
    let days = [];
    let day = startDate;
    let formattedDate = "";

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        formattedDate = format(day, dateFormat);
        const cloneDay = day;
        
        const dayEvents = events.filter(e => isSameDay(getShiftedDate(e.startTime), cloneDay));

        days.push(
          <div
            className={`min-h-[120px] p-2 border border-slate-800 relative transition-colors hover:bg-slate-900/70 cursor-pointer ${
              !isSameMonth(day, monthStart)
                ? "text-slate-600 bg-slate-950/40"
                : "text-slate-300 bg-slate-900/60 backdrop-blur-sm"
            } ${isSameDay(day, new Date()) ? "bg-blue-900/20 border-blue-500/30" : ""}`}
            key={day.toString()}
            onClick={() => handleDateClick(cloneDay)}
          >
            <div className="flex justify-between items-start mb-2">
              <span className={`text-sm font-medium ${isSameDay(day, new Date()) ? "text-blue-400" : ""}`}>
                {formattedDate}
              </span>
              {dayEvents.length > 0 && (
                <span className="text-xs text-slate-500">{dayEvents.length}</span>
              )}
            </div>
            <div className="space-y-1">
              {dayEvents.map((event) => (
                <div
                  key={event.id}
                  onClick={(e) => handleEventClick(event, e)}
                  className={`text-xs p-1.5 rounded border truncate ${getEventColor(event.type)}`}
                >
                  <div className="font-semibold truncate">{event.title}</div>
                  {event.startTime && (
                    <div className="text-[10px] opacity-75">
                      {format(getShiftedDate(event.startTime), "HH:mm")}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div className="grid grid-cols-7" key={day.toString()}>
          {days}
        </div>
      );
      days = [];
    }
    return <div className="border border-slate-800 rounded-lg overflow-hidden">{rows}</div>;
  };

  const renderWeekView = () => {
    const start = startOfWeek(currentDate, { weekStartsOn: 1 });
    const end = endOfWeek(currentDate, { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start, end });

    return (
      <div className="grid grid-cols-1 md:grid-cols-7 gap-4 md:gap-px bg-transparent md:bg-slate-800/50 md:border md:border-slate-800 md:rounded-lg md:overflow-hidden">
        {days.map((day) => {
          const dayEvents = events.filter(e => isSameDay(getShiftedDate(e.startTime), day));
          const isToday = isSameDay(day, new Date());
          
          return (
            <div 
              key={day.toString()} 
              className={`
                min-h-[100px] md:min-h-[500px] p-4 md:p-2 
                rounded-xl md:rounded-none
                border md:border-none border-slate-800
                transition-colors cursor-pointer backdrop-blur-sm
                ${isToday 
                  ? "bg-slate-900/60 ring-1 ring-blue-500/50" 
                  : "bg-slate-900/60 hover:bg-slate-900/80"
                }
              `}
              onClick={() => handleDateClick(day)}
            >
              <div className={`flex md:block justify-between items-center md:text-center mb-3 pb-2 border-b border-slate-800/50 ${
                 isToday ? "text-blue-400" : "text-slate-400"
              }`}>
                <div className="flex items-center gap-2 md:block">
                    <span className="text-sm md:text-xs uppercase font-bold">{format(day, "EEEE", { locale: es })}</span>
                    <span className="md:hidden text-slate-600">•</span>
                    <span className="text-lg md:text-xl font-bold">{format(day, "d")}</span>
                </div>
                <div className="md:hidden text-xs text-slate-500">
                    {dayEvents.length > 0 ? `${dayEvents.length} eventos` : 'Sin eventos'}
                </div>
              </div>

              <div className="space-y-2">
                {dayEvents.map((event) => (
                  <div
                    key={event.id}
                    onClick={(e) => handleEventClick(event, e)}
                    className={`text-xs p-3 md:p-2 rounded-lg border shadow-sm hover:scale-[1.02] transition-transform ${getEventColor(event.type)}`}
                  >
                    <div className="font-bold mb-1 line-clamp-1">{event.title}</div>
                    <div className="flex items-center gap-1 opacity-75">
                      <Clock size={12} />
                      {format(getShiftedDate(event.startTime), "HH:mm")}
                      {event.opponentName && (
                        <span className="truncate ml-1">- vs {event.opponentName}</span>
                      )}
                    </div>
                  </div>
                ))}
                {dayEvents.length === 0 && (
                    <div className="hidden md:block text-center text-slate-600 text-xs py-8 italic">
                        Sin actividad
                    </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="bg-slate-900/80 backdrop-blur-sm p-4 rounded-xl border border-slate-800 space-y-4">
        
        {/* Top Controls: Lineup & View */}
        <div className="flex flex-col md:flex-row justify-between gap-4">
            <select
                value={selectedLineupId}
                onChange={(e) => setSelectedLineupId(e.target.value)}
                className="w-full md:w-auto bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500"
            >
                {lineups.map((lineup) => (
                <option key={lineup.id} value={lineup.id}>
                    {lineup.name}
                </option>
                ))}
            </select>
            
            <div className="flex items-center bg-slate-950 rounded-lg border border-slate-700 p-1 w-full md:w-auto">
                <button
                onClick={() => setView("month")}
                className={`flex-1 md:flex-none px-3 py-1 rounded text-sm font-medium transition-colors ${
                    view === "month" ? "bg-slate-800 text-white" : "text-slate-400 hover:text-white"
                }`}
                >
                Mes
                </button>
                <button
                onClick={() => setView("week")}
                className={`flex-1 md:flex-none px-3 py-1 rounded text-sm font-medium transition-colors ${
                    view === "week" ? "bg-slate-800 text-white" : "text-slate-400 hover:text-white"
                }`}
                >
                Semana
                </button>
            </div>
        </div>

        {/* Middle Controls: Date Navigation */}
        <div className="flex items-center justify-between bg-slate-950/50 rounded-lg p-2 border border-slate-800/50">
            <button onClick={handlePrev} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white">
              <ChevronLeft size={20} />
            </button>
            
            <div className="flex flex-col items-center">
                <h2 className="text-lg font-bold capitalize text-center">
                    {format(currentDate, "MMMM yyyy", { locale: es })}
                </h2>
                <button onClick={handleToday} className="text-xs text-blue-400 hover:text-blue-300 font-medium">
                    Volver a Hoy
                </button>
            </div>

            <button onClick={handleNext} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white">
              <ChevronRight size={20} />
            </button>
        </div>

        {/* Bottom Controls: Actions & Link */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            {/* Schedule Link */}
            <div className="w-full md:w-auto flex justify-center md:justify-start">
                {editingLink ? (
                <div className="flex items-center gap-2 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 w-full md:w-auto">
                    <input
                    type="text"
                    value={scheduleLink}
                    onChange={(e) => setScheduleLink(e.target.value)}
                    placeholder="Link de Drive..."
                    className="bg-transparent border-none focus:outline-none text-sm w-full md:w-40"
                    />
                    <button onClick={saveScheduleLink} className="text-green-500 hover:text-green-400">
                    <CheckCircle size={16} />
                    </button>
                    <button onClick={() => setEditingLink(false)} className="text-red-500 hover:text-red-400">
                    <XCircle size={16} />
                    </button>
                </div>
                ) : (
                <div className="flex items-center gap-2 w-full md:w-auto justify-center md:justify-start">
                    {scheduleLink ? (
                    <a
                        href={scheduleLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm font-medium px-3 py-2 rounded-lg hover:bg-slate-800 transition-colors"
                    >
                        <LinkIcon size={16} />
                        Ver Horario
                    </a>
                    ) : (
                    <span className="text-slate-500 text-sm px-3 py-2">Sin horario</span>
                    )}
                    <button
                    onClick={() => setEditingLink(true)}
                    className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                    >
                    <Edit2 size={16} />
                    </button>
                </div>
                )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 w-full md:w-auto">
                <button
                    onClick={() => setShowStatsModal(true)}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium border border-slate-700"
                    title="Ver Estadísticas"
                >
                    <BarChart2 size={16} />
                    <span className="md:hidden lg:inline">Estadísticas</span>
                </button>

                <button
                    onClick={() => {
                    setSelectedEvent(null);
                    setSelectedDate(new Date());
                    setShowEventModal(true);
                    }}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
                >
                    <Plus size={16} />
                    <span>Nuevo Evento</span>
                </button>
            </div>
        </div>
      </div>

      {/* Calendar Grid */}
      {view === "month" ? (
        <>
          <div className="grid grid-cols-7 mb-2">
            {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((day) => (
              <div key={day} className="text-center text-sm font-medium text-slate-500 py-2">
                {day}
              </div>
            ))}
          </div>
          {renderMonthView()}
        </>
      ) : (
        renderWeekView()
      )}

      {/* Event Modal Placeholder */}
      {showEventModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900/95 backdrop-blur-md rounded-xl border border-slate-800 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold">
                  {selectedEvent ? "Editar Evento" : "Nuevo Evento"}
                </h3>
                <button onClick={() => setShowEventModal(false)} className="text-slate-400 hover:text-white">
                  <XCircle size={24} />
                </button>
              </div>
              
              {/* Form will go here */}
              <EventForm
                event={selectedEvent}
                selectedDate={selectedDate}
                lineupId={selectedLineupId}
                userTimezone={userTimezone}
                onClose={() => setShowEventModal(false)}
                onSave={() => {
                  fetchEvents();
                  setShowEventModal(false);
                }}
              />
            </div>
          </div>
        </div>
      )}

      <AttendanceStatsModal
        isOpen={showStatsModal}
        onClose={() => setShowStatsModal(false)}
        lineupId={selectedLineupId}
      />
    </div>
  );
}
