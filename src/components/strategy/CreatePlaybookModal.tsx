'use client';

import { useState } from 'react';
import { createPlaybook } from '@/app/actions/strategy';
import { X, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Lineup {
    id: string;
    name: string;
}

interface CreatePlaybookModalProps {
    isOpen: boolean;
    onClose: () => void;
    lineups: Lineup[];
}

export function CreatePlaybookModal({ isOpen, onClose, lineups }: CreatePlaybookModalProps) {
    const router = useRouter();
    const [isPending, setIsPending] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsPending(true);
        setError('');

        const formData = new FormData(e.currentTarget);
        const title = formData.get('title') as string;
        const description = formData.get('description') as string;
        const lineupId = formData.get('lineupId') as string;

        if (!title) {
            setError('Title is required');
            setIsPending(false);
            return;
        }

        const result = await createPlaybook({
            title,
            description,
            lineupId: lineupId || undefined,
        });

        if (result.success) {
            router.refresh();
            onClose();
        } else {
            setError(result.error || 'Failed to create playbook');
        }
        setIsPending(false);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-lg w-full max-w-md shadow-xl animate-in fade-in zoom-in duration-200">
                <div className="flex justify-between items-center p-4 border-b border-slate-800">
                    <h2 className="text-lg font-bold text-white">Create New Playbook</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Playbook Title</label>
                        <input
                            name="title"
                            type="text"
                            placeholder="e.g., Level 1 Invades"
                            className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white focus:ring-2 focus:ring-blue-600 outline-none transition-all"
                            autoFocus
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Team (Optional)</label>
                        <select
                            name="lineupId"
                            className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white focus:ring-2 focus:ring-blue-600 outline-none transition-all"
                        >
                            <option value="">Select a team...</option>
                            {lineups.map((lineup) => (
                                <option key={lineup.id} value={lineup.id}>
                                    {lineup.name}
                                </option>
                            ))}
                        </select>
                        <p className="text-xs text-slate-500 mt-1">Assigning a team helps organize strategies.</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Description</label>
                        <textarea
                            name="description"
                            rows={3}
                            placeholder="Brief description of this playbook..."
                            className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white focus:ring-2 focus:ring-blue-600 outline-none transition-all resize-none"
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isPending}
                            className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isPending && <Loader2 size={16} className="animate-spin" />}
                            {isPending ? 'Creating...' : 'Create Playbook'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
