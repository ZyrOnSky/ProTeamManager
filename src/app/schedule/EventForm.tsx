"use client";

import { useState, useEffect } from "react";
import { X, Save, Trash2 } from "lucide-react";
import { format } from "date-fns";
import AttendanceManager from "./AttendanceManager";

interface EventFormProps {
  event?: any;
  selectedDate?: Date | null;
  lineupId: string;
  userTimezone?: string;
  onClose: () => void;
  onSave: () => void;
}

export default function EventForm({ event, selectedDate, lineupId, userTimezone = "GMT-5", onClose, onSave }: EventFormProps) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    startTime: "",
    endTime: "",
    type: "SCRIM",
    opponentName: "",
    opponentContact: "",
    scrimType: "SCRIM",
    modality: "BO3",
    activityType: "VOD Review",
  });
  const [loading, setLoading] = useState(false);

  const TIMEZONE_OFFSETS: Record<string, number> = {
    "GMT-5": -5,
    "GMT-6": -6,
    "GMT-4": -4,
    "GMT-3": -3,
    "GMT+1": 1,
    "UTC": 0,
  };

  const getShiftedDate = (date: Date) => {
    const targetOffset = TIMEZONE_OFFSETS[userTimezone] ?? -5;
    const localOffset = -date.getTimezoneOffset() / 60; 
    const diff = targetOffset - localOffset;
    return new Date(date.getTime() + diff * 60 * 60 * 1000);
  };

  const getReverseShiftedISO = (dateStr: string) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    const targetOffset = TIMEZONE_OFFSETS[userTimezone] ?? -5;
    const localOffset = -date.getTimezoneOffset() / 60;
    const diff = targetOffset - localOffset;
    // Reverse the shift to get back to absolute time
    const originalDate = new Date(date.getTime() - diff * 60 * 60 * 1000);
    return originalDate.toISOString();
  };

  useEffect(() => {
    if (event) {
      setFormData({
        title: event.title,
        description: event.description || "",
        startTime: format(getShiftedDate(new Date(event.startTime)), "yyyy-MM-dd'T'HH:mm"),
        endTime: event.endTime ? format(getShiftedDate(new Date(event.endTime)), "yyyy-MM-dd'T'HH:mm") : "",
        type: event.type,
        opponentName: event.opponentName || "",
        opponentContact: event.opponentContact || "",
        scrimType: event.scrimType || "SCRIM",
        modality: event.modality || "BO3",
        activityType: event.activityType || "VOD Review",
      });
    } else if (selectedDate) {
      // selectedDate comes from the calendar click. 
      // If the calendar is already showing shifted dates, selectedDate might be the "visual" date?
      // In ScheduleClient: handleDateClick(cloneDay). cloneDay is derived from iterating days.
      // The iteration logic in ScheduleClient uses startOfMonth(currentDate). 
      // currentDate is just a JS Date.
      // The calendar grid renders days. 
      // When we click a day, we get that day at 00:00 local time usually.
      // If I click "Dec 16", I get Dec 16 00:00 Local.
      // If I want to set the default time to 19:00 "User Time", I just set the string to "2025-12-16T19:00".
      // Since the input is "datetime-local", it will show 19:00.
      // And when we save, getReverseShiftedISO will treat that "19:00" as "User Time 19:00" and shift it back to UTC.
      // So this logic holds.
      
      const dateStr = format(selectedDate, "yyyy-MM-dd");
      setFormData(prev => ({
        ...prev,
        startTime: `${dateStr}T19:00`, // Default to 7 PM User Time
        endTime: `${dateStr}T21:00`,
      }));
    }
  }, [event, selectedDate, userTimezone]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = event ? `/api/schedule/events/${event.id}` : "/api/schedule/events";
      const method = event ? "PUT" : "POST";

      // Convert form times (User Time) back to UTC/ISO
      const payload = {
        ...formData,
        startTime: getReverseShiftedISO(formData.startTime),
        endTime: formData.endTime ? getReverseShiftedISO(formData.endTime) : null,
        lineupId,
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to save event");

      onSave();
      onClose();
    } catch (error) {
      console.error("Error saving event:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("¿Estás seguro de eliminar este evento?")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/schedule/events/${event.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete event");
      onSave();
      onClose();
    } catch (error) {
      console.error("Error deleting event:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="block text-sm font-medium text-slate-400 mb-1">Título</label>
          <input
            type="text"
            required
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
            placeholder="Ej: Scrim vs G2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-400 mb-1">Tipo de Evento</label>
          <select
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
          >
            <option value="SCRIM">Scrim</option>
            <option value="TOURNAMENT">Torneo</option>
            <option value="TRAINING">Entrenamiento</option>
            <option value="ACTIVITY_LOG">Registro Actividad</option>
          </select>
        </div>

        {(formData.type === "SCRIM" || formData.type === "TOURNAMENT") && (
          <>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Oponente</label>
              <input
                type="text"
                value={formData.opponentName}
                onChange={(e) => setFormData({ ...formData, opponentName: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
                placeholder="Nombre del equipo"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Modalidad</label>
              <select
                value={formData.modality}
                onChange={(e) => setFormData({ ...formData, modality: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
              >
                <option value="BO1">BO1</option>
                <option value="BO2">BO2</option>
                <option value="BO3">BO3</option>
                <option value="BO5">BO5</option>
                <option value="TWO_MAPS">2 Mapas</option>
                <option value="THREE_MAPS">3 Mapas</option>
                <option value="FIVE_MAPS">5 Mapas</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Tipo de Scrim</label>
              <select
                value={formData.scrimType}
                onChange={(e) => setFormData({ ...formData, scrimType: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
              >
                <option value="WARMUP">Warmup</option>
                <option value="EVALUATION">Evaluación</option>
                <option value="SCRIM">Scrim Normal</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-400 mb-1">Contacto Oponente</label>
              <input
                type="text"
                value={formData.opponentContact}
                onChange={(e) => setFormData({ ...formData, opponentContact: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
                placeholder="Discord, Twitter, etc."
              />
            </div>
          </>
        )}

        {formData.type === "TRAINING" && (
          <div className="col-span-2">
            <label className="block text-sm font-medium text-slate-400 mb-1">Actividad</label>
            <select
              value={formData.activityType}
              onChange={(e) => setFormData({ ...formData, activityType: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
            >
              <option value="Master Class">Master Class</option>
              <option value="VOD Review">VOD Review</option>
              <option value="Ejercicios">Ejercicios Mecánicos</option>
              <option value="Theory Crafting">Theory Crafting</option>
              <option value="Mental Coaching">Mental Coaching</option>
              <option value="Otro">Otro</option>
            </select>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-400 mb-1">Inicio</label>
          <input
            type="datetime-local"
            required
            value={formData.startTime}
            onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-400 mb-1">Fin</label>
          <input
            type="datetime-local"
            value={formData.endTime}
            onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="col-span-2">
          <label className="block text-sm font-medium text-slate-400 mb-1">Descripción / Notas</label>
          <textarea
            rows={3}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
            placeholder="Detalles adicionales..."
          />
        </div>
      </div>

      {event && formData.type !== "ACTIVITY_LOG" && (
        <div className="pt-4 border-t border-slate-800">
          <AttendanceManager eventId={event.id} lineupId={lineupId} />
        </div>
      )}

      <div className="flex justify-between pt-4 border-t border-slate-800">
        {event ? (
          <button
            type="button"
            onClick={handleDelete}
            className="flex items-center gap-2 text-red-400 hover:text-red-300 px-4 py-2 rounded-lg transition-colors"
          >
            <Trash2 size={18} />
            Eliminar
          </button>
        ) : (
          <div></div>
        )}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg transition-colors disabled:opacity-50"
          >
            <Save size={18} />
            {loading ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>
    </form>
  );
}
