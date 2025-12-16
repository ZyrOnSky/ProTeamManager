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
            className={`min-h-[120px] p-2 border border-slate-800 relative transition-colors hover:bg-slate-900/50 cursor-pointer ${
              !isSameMonth(day, monthStart)
                ? "text-slate-600 bg-slate-950/30"
                : "text-slate-300 bg-slate-900"
            } ${isSameDay(day, new Date()) ? "bg-blue-900/10 border-blue-500/30" : ""}`}
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
    // Simplified week view implementation
    // Similar to month view but with time slots or just columns
    // For now, let's reuse the grid logic but just for one week
    const start = startOfWeek(currentDate, { weekStartsOn: 1 });
    const end = endOfWeek(currentDate, { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start, end });

    return (
      <div className="grid grid-cols-7 gap-px bg-slate-800 border border-slate-800 rounded-lg overflow-hidden">
        {days.map((day) => {
          const dayEvents = events.filter(e => isSameDay(getShiftedDate(e.startTime), day));
          return (
            <div 
              key={day.toString()} 
              className={`min-h-[400px] bg-slate-900 p-2 cursor-pointer hover:bg-slate-900/80 ${
                isSameDay(day, new Date()) ? "bg-blue-900/10" : ""
              }`}
              onClick={() => handleDateClick(day)}
            >
              <div className="text-center mb-4 py-2 border-b border-slate-800">
                <div className="text-sm text-slate-400">{format(day, "EEE", { locale: es })}</div>
                <div className={`text-lg font-bold ${isSameDay(day, new Date()) ? "text-blue-400" : ""}`}>
                  {format(day, "d")}
                </div>
              </div>
              <div className="space-y-2">
                {dayEvents.map((event) => (
                  <div
                    key={event.id}
                    onClick={(e) => handleEventClick(event, e)}
                    className={`text-xs p-2 rounded border ${getEventColor(event.type)}`}
                  >
                    <div className="font-bold mb-1">{event.title}</div>
                    <div className="flex items-center gap-1 opacity-75 mb-1">
                      <Clock size={10} />
                      {format(getShiftedDate(event.startTime), "HH:mm")}
                    </div>
                    {event.opponentName && (
                      <div className="truncate opacity-75">vs {event.opponentName}</div>
                    )}
                  </div>
                ))}
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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900 p-4 rounded-xl border border-slate-800">
        <div className="flex items-center gap-4">
          <select
            value={selectedLineupId}
            onChange={(e) => setSelectedLineupId(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500"
          >
            {lineups.map((lineup) => (
              <option key={lineup.id} value={lineup.id}>
                {lineup.name}
              </option>
            ))}
          </select>
          
          <div className="flex items-center bg-slate-950 rounded-lg border border-slate-700 p-1">
            <button
              onClick={() => setView("month")}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                view === "month" ? "bg-slate-800 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              Mes
            </button>
            <button
              onClick={() => setView("week")}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                view === "week" ? "bg-slate-800 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              Semana
            </button>
          </div>

          {/* Schedule Link */}
          <div className="relative">
            {editingLink ? (
              <div className="flex items-center gap-2 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1">
                <input
                  type="text"
                  value={scheduleLink}
                  onChange={(e) => setScheduleLink(e.target.value)}
                  placeholder="Link de Drive..."
                  className="bg-transparent border-none focus:outline-none text-sm w-40"
                />
                <button onClick={saveScheduleLink} className="text-green-500 hover:text-green-400">
                  <CheckCircle size={16} />
                </button>
                <button onClick={() => setEditingLink(false)} className="text-red-500 hover:text-red-400">
                  <XCircle size={16} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
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
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <button onClick={handlePrev} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white">
              <ChevronLeft size={20} />
            </button>
            <h2 className="text-xl font-bold min-w-[200px] text-center capitalize">
              {format(currentDate, "MMMM yyyy", { locale: es })}
            </h2>
            <button onClick={handleNext} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white">
              <ChevronRight size={20} />
            </button>
          </div>
          <button onClick={handleToday} className="text-sm text-blue-400 hover:text-blue-300 font-medium">
            Hoy
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowStatsModal(true)}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium border border-slate-700"
            title="Ver Estadísticas"
          >
            <BarChart2 size={16} />
            <span className="hidden md:inline">Estadísticas</span>
          </button>

          <button
            onClick={() => {
              setSelectedEvent(null);
              setSelectedDate(new Date());
              setShowEventModal(true);
            }}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
          >
            <Plus size={16} />
            <span className="hidden md:inline">Nuevo Evento</span>
          </button>
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
          <div className="bg-slate-900 rounded-xl border border-slate-800 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
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
