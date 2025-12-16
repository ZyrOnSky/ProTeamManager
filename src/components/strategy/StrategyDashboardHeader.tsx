'use client';

import { useState } from 'react';
import { Plus, ArrowLeft } from 'lucide-react';
import { CreatePlaybookModal } from './CreatePlaybookModal';
import Link from 'next/link';

interface Lineup {
    id: string;
    name: string;
}

export function StrategyDashboardHeader({ lineups }: { lineups: Lineup[] }) {
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <>
            <div className="flex justify-between items-end mb-8 border-b border-slate-800 pb-6">
                <div>
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-4 text-sm transition-colors"
                    >
                        <ArrowLeft size={16} />
                        Volver al Inicio
                    </Link>
                    <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 mb-2">
                        Pizarra Táctica
                    </h1>
                    <p className="text-slate-400 max-w-2xl">
                        Gestiona las estrategias de tu equipo, invades de nivel 1 y jugadas macro. Crea guías visuales para tus jugadores.
                    </p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-all shadow-lg shadow-blue-900/20"
                >
                    <Plus size={20} />
                    Nuevo Playbook
                </button>
            </div>

            <CreatePlaybookModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                lineups={lineups}
            />
        </>
    );
}
