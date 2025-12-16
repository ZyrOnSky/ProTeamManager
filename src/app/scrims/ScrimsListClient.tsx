"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Filter, TrendingDown, TrendingUp, ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface ScrimsListClientProps {
  matches: any[];
}

export function ScrimsListClient({ matches }: ScrimsListClientProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [filterResult, setFilterResult] = useState<"ALL" | "WIN" | "LOSS">("ALL");
  const [filterSide, setFilterSide] = useState<"ALL" | "BLUE" | "RED">("ALL");
  const [sortOrder, setSortOrder] = useState<"DESC" | "ASC">("DESC");

  const filteredMatches = matches
    .filter((m) => {
      if (filterResult !== "ALL") {
        if (m.result !== filterResult) return false;
      }
      if (filterSide !== "ALL") {
        if (m.ourSide !== filterSide) return false;
      }
      return true;
    })
    .sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return sortOrder === "DESC" ? dateB - dateA : dateA - dateB;
    });

  const totalPages = Math.ceil(filteredMatches.length / itemsPerPage);
  const currentMatches = filteredMatches.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-6">
      {/* Filters Toolbar */}
      <div className="flex flex-wrap items-center gap-4 bg-slate-900 p-4 rounded-xl border border-slate-800">
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

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950 text-slate-400 text-xs uppercase font-bold border-b border-slate-800">
                <th className="p-4">Fecha</th>
                <th className="p-4">Equipo</th>
                <th className="p-4">Rival</th>
                <th className="p-4 text-center">Lado</th>
                <th className="p-4 text-center">Resultado</th>
                <th className="p-4 text-center">KDA Equipo</th>
                <th className="p-4 text-center">VOD</th>
                <th className="p-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-slate-800">
              {currentMatches.map((match) => {
                const ourParticipants = match.participants.filter((p: any) => !p.isEnemy);
                const kills = ourParticipants.reduce((acc: number, p: any) => acc + (p.kills || 0), 0);
                const deaths = ourParticipants.reduce((acc: number, p: any) => acc + (p.deaths || 0), 0);
                const assists = ourParticipants.reduce((acc: number, p: any) => acc + (p.assists || 0), 0);
                
                const resultColor = match.result === 'WIN' ? 'text-green-400' : match.result === 'LOSS' ? 'text-red-400' : 'text-slate-400';
                const resultBg = match.result === 'WIN' ? 'bg-green-500/10' : match.result === 'LOSS' ? 'bg-red-500/10' : 'bg-slate-800';

                return (
                  <tr key={match.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="p-4 text-white font-medium">
                      <div className="flex flex-col">
                        <span>{format(new Date(match.date), "dd MMM yyyy", { locale: es })}</span>
                        <span className="text-xs text-slate-500">{format(new Date(match.date), "HH:mm", { locale: es })}</span>
                      </div>
                    </td>
                    <td className="p-4 text-blue-400 font-medium">
                      {match.lineup?.name || "Nuestro Equipo"}
                    </td>
                    <td className="p-4 text-slate-300">
                      {match.enemyTeam?.name || "Equipo Desconocido"}
                    </td>
                    <td className="p-4 text-center">
                      {match.ourSide ? (
                        <span className={`text-xs font-bold px-2 py-1 rounded ${match.ourSide === 'BLUE' ? 'bg-blue-500/20 text-blue-400' : 'bg-red-500/20 text-red-400'}`}>
                          {match.ourSide}
                        </span>
                      ) : (
                        <span className="text-slate-600">-</span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      {match.result ? (
                        <span className={`inline-block px-2 py-1 rounded text-xs font-bold ${resultColor} ${resultBg}`}>
                          {match.result}
                        </span>
                      ) : (
                        <span className="text-slate-500">-</span>
                      )}
                    </td>
                    <td className="p-4 text-center font-mono text-slate-300">
                      <span className="text-blue-400">{kills}</span> / <span className="text-red-400">{deaths}</span> / <span className="text-yellow-400">{assists}</span>
                    </td>
                    <td className="p-4 text-center">
                      {match.vodLink ? (
                        <a 
                          href={match.vodLink} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-800 hover:bg-blue-600 hover:text-white text-blue-400 transition-colors"
                          title="Ver VOD"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                        </a>
                      ) : (
                        <span className="text-slate-600">-</span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <Link 
                        href={`/scrims/${match.id}`}
                        className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-white transition-colors"
                      >
                        Ver Detalles
                        <ArrowLeft size={16} className="rotate-180" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {filteredMatches.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500">
                    No hay scrims que coincidan con los filtros.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

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
  );
}
