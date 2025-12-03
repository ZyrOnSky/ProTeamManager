'use client';

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { Settings, LogOut } from "lucide-react";

export function UserMenu() {
  const { data: session } = useSession();

  if (session) {
    return (
      <div className="flex items-center gap-4">
        <div className="text-right hidden md:block">
          <p className="text-sm font-medium text-white">{session.user?.name}</p>
          <p className="text-xs text-slate-500 capitalize">{session.user?.role?.toLowerCase()}</p>
        </div>
        
        <div className="flex items-center gap-2 bg-slate-900 p-1 rounded-lg border border-slate-800">
          <Link 
            href="/settings" 
            className="p-2 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded-md transition-colors"
            title="Ajustes"
          >
            <Settings size={20} />
          </Link>
          
          <div className="w-px h-6 bg-slate-800 mx-1"></div>

          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-md transition-colors"
            title="Cerrar Sesión"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <Link
      href="/login"
      className="text-sm bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded transition-colors"
    >
      Iniciar Sesión
    </Link>
  );
}
