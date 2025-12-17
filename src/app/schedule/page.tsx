import Link from 'next/link';
import { ArrowLeft, Calendar } from 'lucide-react';
import { UserMenu } from '@/components/UserMenu';
import ScheduleClient from './ScheduleClient';

export default function SchedulePage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 relative overflow-hidden">
      {/* Video Background */}
      <div className="absolute inset-0 z-0">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover"
        >
          <source src="/videos/7-bg.mp4" type="video/mp4" />
        </video>
      </div>

      <div className="relative z-10 p-8">
        <header className="mb-8 flex justify-between items-start max-w-6xl mx-auto">
          <div className="flex items-center gap-4">
            <Link 
              href="/" 
              className="p-2 hover:bg-slate-800/50 rounded-lg transition-colors text-slate-400 hover:text-white"
            >
              <ArrowLeft size={24} />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-orange-500 flex items-center gap-3">
                <Calendar className="w-8 h-8" />
                Agenda & Trabajo
              </h1>
              <p className="text-slate-400">Calendario de scrims, reviews y actividades</p>
            </div>
          </div>
          <UserMenu />
        </header>

        <div className="max-w-6xl mx-auto">
          <ScheduleClient />
        </div>
      </div>
    </main>
  );
}
