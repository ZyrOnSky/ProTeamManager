"use client";

import { useState, useEffect } from "react";
import { Check, X, Clock, AlertCircle, HelpCircle } from "lucide-react";

interface AttendanceManagerProps {
  eventId: string;
  lineupId: string;
}

interface Attendance {
  userId: string;
  status: "PRESENT" | "ABSENT" | "LATE" | "EXCUSED" | "PENDING";
  notes?: string;
  user: {
    id: string;
    name: string;
    role: string;
  };
}

export default function AttendanceManager({ eventId, lineupId }: AttendanceManagerProps) {
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAttendance();
  }, [eventId]);

  const fetchAttendance = async () => {
    try {
      // Fetch event details including current attendances
      const eventRes = await fetch(`/api/schedule/events/${eventId}`);
      const eventData = await eventRes.json();
      
      // Fetch all lineup members
      const membersRes = await fetch(`/api/lineups/${lineupId}/members`);
      const members = await membersRes.json();
      
      // Merge lists
      const mergedAttendances = members
        .filter((member: any) => member.status !== 'DELETED')
        .map((member: any) => {
          const existing = eventData.attendances.find((a: any) => a.userId === member.id);
          
          if (existing) return existing;

          // Default status for INACTIVE users is EXCUSED
          const defaultStatus = member.status === 'INACTIVE' ? 'EXCUSED' : 'PENDING';

          return {
            userId: member.id,
            status: defaultStatus,
            user: member,
          };
        });
      
      setAttendances(mergedAttendances);
    } catch (error) {
      console.error("Error fetching attendance:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateAttendance = async (userId: string, status: string, notes?: string) => {
    try {
      const res = await fetch(`/api/schedule/events/${eventId}/attendance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, status, notes }),
      });
      
      if (!res.ok) throw new Error("Failed to update attendance");
      
      // Update local state
      setAttendances(prev => prev.map(a => 
        a.userId === userId ? { ...a, status: status as any, notes } : a
      ));
    } catch (error) {
      console.error("Error updating attendance:", error);
    }
  };

  if (loading) return <div className="text-center py-4 text-slate-400">Cargando asistencia...</div>;

  return (
    <div className="space-y-4">
      <h4 className="font-medium text-slate-300 flex items-center gap-2">
        <Clock size={16} />
        Control de Asistencia
      </h4>
      
      <div className="space-y-2">
        {attendances.map((attendance) => (
          <div key={attendance.userId} className="flex items-center justify-between bg-slate-950 p-3 rounded-lg border border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold">
                {attendance.user.name.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="font-medium text-sm">{attendance.user.name}</div>
                <div className="text-xs text-slate-500">{attendance.user.role}</div>
              </div>
            </div>
            
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => updateAttendance(attendance.userId, "PRESENT")}
                className={`p-1.5 rounded transition-colors ${
                  attendance.status === "PRESENT" ? "bg-green-500/20 text-green-500" : "text-slate-600 hover:bg-slate-900"
                }`}
                title="Presente"
              >
                <Check size={16} />
              </button>
              <button
                type="button"
                onClick={() => updateAttendance(attendance.userId, "LATE")}
                className={`p-1.5 rounded transition-colors ${
                  attendance.status === "LATE" ? "bg-yellow-500/20 text-yellow-500" : "text-slate-600 hover:bg-slate-900"
                }`}
                title="Tarde"
              >
                <Clock size={16} />
              </button>
              <button
                type="button"
                onClick={() => updateAttendance(attendance.userId, "ABSENT")}
                className={`p-1.5 rounded transition-colors ${
                  attendance.status === "ABSENT" ? "bg-red-500/20 text-red-500" : "text-slate-600 hover:bg-slate-900"
                }`}
                title="Ausente"
              >
                <X size={16} />
              </button>
              <button
                type="button"
                onClick={() => updateAttendance(attendance.userId, "EXCUSED")}
                className={`p-1.5 rounded transition-colors ${
                  attendance.status === "EXCUSED" ? "bg-blue-500/20 text-blue-500" : "text-slate-600 hover:bg-slate-900"
                }`}
                title="Justificado"
              >
                <HelpCircle size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

