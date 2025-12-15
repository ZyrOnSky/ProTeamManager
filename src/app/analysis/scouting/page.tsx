import { getScoutingTeams } from "@/lib/scouting";
import { TeamList } from "./TeamList";
import Link from "next/link";
import { Globe } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function ScoutingPage() {
  const teams = await getScoutingTeams();

  return (
    <div>
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold mb-2">Enemy Dashboard</h1>
          <p className="text-slate-400">Base de datos de equipos rivales y análisis de enfrentamientos.</p>
        </div>
        <Link 
          href="/analysis/scouting/global" 
          className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-lg transition-colors font-medium"
        >
          <Globe size={20} /> Estadísticas Globales
        </Link>
      </div>
      
      <TeamList teams={teams} />
    </div>
  );
}
