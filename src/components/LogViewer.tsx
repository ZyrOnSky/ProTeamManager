"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { History, Loader2 } from "lucide-react";

interface Log {
  id: string;
  action: string;
  details: string;
  createdAt: string;
  user: {
    name: string;
    role: string;
  };
}

export function LogViewer({ entityId, refreshTrigger }: { entityId: string, refreshTrigger?: number }) {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchLogs();
  }, [entityId, refreshTrigger]);

  const fetchLogs = async () => {
    if (!loading) setRefreshing(true);
    try {
      console.log("🔄 FETCHING LOGS for entityId:", entityId);
      const res = await fetch(`/api/logs/${entityId}?t=${Date.now()}`, { cache: 'no-store' });
      console.log("📡 Response status:", res.status);
      if (res.ok) {
        const data = await res.json();
        console.log("📦 LOGS DATA received:", data);
        setLogs(data);
      } else {
        console.error("❌ Failed to fetch logs, status:", res.status);
      }
    } catch (error) {
      console.error("🔴 Error fetching logs:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  if (loading) return <div className="flex gap-2 text-slate-500"><Loader2 className="animate-spin" /> Cargando historial...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-slate-300 mb-2">
        <div className="flex items-center gap-2">
          <History size={20} />
          <h3 className="font-semibold">Historial de Cambios</h3>
        </div>
        <button 
          onClick={() => fetchLogs()} 
          className="text-xs bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded transition-colors flex items-center gap-1"
          title="Actualizar historial"
          disabled={refreshing}
        >
          <Loader2 size={12} className={refreshing ? "animate-spin" : ""} />
          Actualizar
        </button>
      </div>
      {logs.length === 0 ? (
        <div className="text-slate-500 text-sm italic">No hay historial de cambios.</div>
      ) : (
        <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
          {logs.map((log) => (
            <div key={log.id} className="bg-slate-900/50 p-3 rounded border border-slate-800 text-sm">
              <div className="flex justify-between items-start mb-1">
                <span className="font-medium text-blue-400">{log.user.name} <span className="text-xs text-slate-500">({log.user.role})</span></span>
                <span className="text-xs text-slate-500">{format(new Date(log.createdAt), "dd MMM HH:mm", { locale: es })}</span>
              </div>
              <div className="flex gap-2">
                  <span className={`text-xs font-bold px-1 rounded ${
                      log.action === 'CREATE' ? 'bg-green-500/20 text-green-400' :
                      log.action === 'UPDATE' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-red-500/20 text-red-400'
                  }`}>
                      {log.action}
                  </span>
                  <p className="text-slate-300">{log.details}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
