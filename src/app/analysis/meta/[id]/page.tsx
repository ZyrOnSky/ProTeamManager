import { getTierList } from "@/lib/meta";
import { TierListEditor } from "../TierListEditor";
import { notFound } from "next/navigation";
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { prisma } from "@/lib/prisma";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditTierListPage({ params }: PageProps) {
  const { id } = await params;
  const tierList = await getTierList(id);

  if (!tierList) {
    notFound();
  }

  // Fetch available options
  const teams = await prisma.team.findMany({ orderBy: { name: 'asc' } });
  const lineups = await prisma.lineup.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } });
  const patches = await prisma.patch.findMany({ orderBy: { createdAt: 'desc' } });

  // Transform data to match component props
  const initialData = {
    id: tierList.id,
    name: tierList.name,
    description: tierList.description,
    isActive: tierList.isActive,
    patchId: tierList.patchId,
    enemyTeamId: tierList.enemyTeamId,
    lineupId: tierList.lineupId,
    champions: tierList.champions.map(c => ({
      championName: c.championName,
      tier: c.tier,
      role: c.role || undefined,
      notes: c.notes || undefined
    }))
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/analysis/meta" className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
          <ArrowLeft size={24} />
        </Link>
        <h1 className="text-2xl font-bold">Editor de Tier List</h1>
      </div>
      
      <div className="flex-1">
        <TierListEditor 
          initialData={initialData} 
          teams={teams}
          lineups={lineups}
          patches={patches}
        />
      </div>
    </div>
  );
}
