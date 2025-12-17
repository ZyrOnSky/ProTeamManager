'use client';

import Link from 'next/link';
import { Book, Users, Clock, ChevronRight, Trash2, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { deletePlaybook } from '@/app/actions/strategy';
import { useRouter } from 'next/navigation';

interface PlaybookCardProps {
    playbook: {
        id: string;
        title: string;
        description: string | null;
        updatedAt: Date;
        lineupId: string | null;
        lineup?: { name: string } | null;
        creator?: { name: string; realName: string | null } | null;
        _count?: { scenes: number };
    };
}

export function PlaybookCard({ playbook }: PlaybookCardProps) {
    const router = useRouter();

    const handleDelete = async (e: React.MouseEvent) => {
        e.preventDefault(); // Prevent navigation
        e.stopPropagation();
        
        if (confirm('Are you sure you want to delete this playbook? This action cannot be undone.')) {
            const result = await deletePlaybook(playbook.id);
            if (result.success) {
                router.refresh();
            } else {
                alert('Failed to delete playbook');
            }
        }
    };

    return (
        <Link
            href={`/strategy/playbook/${playbook.id}`}
            className="group bg-slate-900/80 backdrop-blur-sm border border-slate-800 rounded-xl p-6 hover:bg-slate-900/90 hover:border-blue-500/50 transition-all duration-300 relative overflow-hidden block"
        >
            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <button 
                    onClick={handleDelete}
                    className="p-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-colors"
                    title="Delete Playbook"
                >
                    <Trash2 size={16} />
                </button>
                <div className="p-2 text-blue-500">
                    <ChevronRight />
                </div>
            </div>

            <div className="flex items-start gap-3 mb-4">
                <div className="p-3 bg-blue-500/10 rounded-lg text-blue-400 group-hover:text-blue-300 group-hover:bg-blue-500/20 transition-colors">
                    <Book size={24} />
                </div>
                {playbook.lineup && (
                    <span className="text-xs font-medium px-2 py-1 rounded-full bg-slate-800 text-slate-400 border border-slate-700 flex items-center gap-1 mt-1">
                        <Users size={12} />
                        {playbook.lineup.name}
                    </span>
                )}
            </div>

            <h3 className="text-xl font-bold mb-2 group-hover:text-blue-400 transition-colors pr-16">
                {playbook.title}
            </h3>

            <p className="text-slate-400 text-sm mb-4 line-clamp-2 h-10">
                {playbook.description || 'No description provided.'}
            </p>

            {playbook.creator && (
                <div className="flex items-center gap-2 text-xs text-slate-500 mb-4">
                    <User size={12} />
                    <span>Created by: <span className="text-slate-400">{playbook.creator.realName || playbook.creator.name}</span></span>
                </div>
            )}

            <div className="flex items-center justify-between text-xs text-slate-500 pt-4 border-t border-slate-800/50">
                <div className="flex items-center gap-1">
                    <Clock size={12} />
                    <span>Updated {formatDistanceToNow(new Date(playbook.updatedAt))} ago</span>
                </div>
                <div className="font-medium text-slate-400">
                    {playbook._count?.scenes || 0} Scenes
                </div>
            </div>
        </Link>
    );
}
