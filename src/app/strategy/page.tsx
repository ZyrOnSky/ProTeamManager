import { getAllLineups, getPlaybooks } from '@/app/actions/strategy';
import { StrategyDashboardHeader } from '@/components/strategy/StrategyDashboardHeader';
import { PlaybookCard } from '@/components/strategy/PlaybookCard';
import { Book } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function StrategyPage() {
  const [lineupsResult, playbooksResult] = await Promise.all([
    getAllLineups(),
    getPlaybooks(),
  ]);

  const lineups = lineupsResult.success ? lineupsResult.data : [];
  const playbooks = playbooksResult.success ? playbooksResult.data : [];

  return (
    <div className="min-h-screen bg-slate-950 relative overflow-hidden">
      {/* Video Background */}
      <div className="absolute inset-0 z-0">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover"
        >
          <source src="/videos/8-bg.mp4" type="video/mp4" />
        </video>
      </div>

      <div className="relative z-10 p-8">
        <StrategyDashboardHeader lineups={lineups || []} />

        {/* Playbooks Grid */}
        {playbooks && playbooks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {playbooks.map((playbook: any) => (
              <PlaybookCard key={playbook.id} playbook={playbook} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-slate-900/80 backdrop-blur-sm rounded-xl border border-dashed border-slate-800">
            <div className="inline-flex p-4 rounded-full bg-slate-800/50 mb-4 text-slate-500">
              <Book size={32} />
            </div>
            <h3 className="text-xl font-bold text-slate-300 mb-2">No Playbooks Yet</h3>
            <p className="text-slate-500 max-w-md mx-auto">
              Create your first playbook to start documenting your team's strategies and macro plays.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
