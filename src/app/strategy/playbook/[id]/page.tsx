import { PlaybookViewer } from '@/components/strategy/PlaybookViewer';
import { getPlaybook } from '@/app/actions/strategy';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function PlaybookEditorPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const { data: playbook } = await getPlaybook(id);

    if (!playbook) {
        return <div className="p-8 text-white">Playbook not found</div>;
    }

    return (
        <div className="h-screen flex flex-col bg-slate-950 relative overflow-hidden">
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

            {/* Header / Navigation */}
            <header className="relative z-20 flex items-center gap-4 p-4 border-b border-slate-800 bg-slate-900/80 backdrop-blur-sm">
                <Link
                    href="/strategy"
                    className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white"
                >
                    <ArrowLeft size={20} />
                </Link>
                <div>
                    <h1 className="text-xl font-bold text-white">{playbook.title}</h1>
                    <p className="text-xs text-slate-400">Strategy Module / Playbook Viewer</p>
                </div>
            </header>

            {/* Main Content */}
            <div className="relative z-10 flex-1 overflow-hidden p-4">
                <PlaybookViewer
                    playbookId={playbook.id}
                    initialScenes={playbook.scenes || []}
                    playbookTitle={playbook.title}
                    playbookDescription={playbook.description || ''}
                />
            </div>
        </div>
    );
}
