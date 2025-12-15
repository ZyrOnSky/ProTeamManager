import { prisma } from "@/lib/prisma";
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { DraftForm } from "./DraftForm";

export default async function NewDraftPage() {
  const teams = await prisma.team.findMany({ orderBy: { name: 'asc' } });
  const lineups = await prisma.lineup.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } });
  const tierLists = await prisma.tierList.findMany({ orderBy: { updatedAt: 'desc' } });

  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/analysis/draft" className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
          <ArrowLeft size={24} />
        </Link>
        <h1 className="text-2xl font-bold">Nueva Simulación de Draft</h1>
      </div>

      <DraftForm teams={teams} lineups={lineups} tierLists={tierLists} />
    </div>
  );
}
