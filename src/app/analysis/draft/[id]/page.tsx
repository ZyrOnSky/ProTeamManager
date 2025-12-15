import { getDraftPlan } from "@/lib/draft";
import { getDraftContext } from "@/lib/draft-stats";
import { DraftSimulator } from "../DraftSimulator";
import { notFound } from "next/navigation";
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function DraftSimulatorPage({ params }: PageProps) {
  const { id } = await params;
  const draft = await getDraftPlan(id);

  if (!draft) {
    notFound();
  }

  const context = await getDraftContext(draft);

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-4 mb-4">
        <Link href="/analysis/draft" className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
          <ArrowLeft size={24} />
        </Link>
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            {draft.name}
            <span className="text-sm font-normal text-slate-400 bg-slate-900 px-2 py-1 rounded">
              vs {draft.enemyTeam?.name || 'Desconocido'}
            </span>
          </h1>
        </div>
      </div>
      
      <div className="flex-1 min-h-0">
        <DraftSimulator 
          draftId={draft.id}
          initialData={draft}
          ourSide={draft.ourSide}
          context={context}
        />
      </div>
    </div>
  );
}
