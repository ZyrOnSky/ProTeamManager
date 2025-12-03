'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const res = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });

    if (res?.error) {
      setError('Credenciales inválidas');
    } else {
      router.push('/');
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100">
      <div className="bg-slate-900 p-8 rounded-xl border border-slate-800 w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6 text-blue-500">Iniciar Sesión</h1>
        
        {error && (
          <div className="bg-red-500/10 text-red-500 p-3 rounded-lg mb-4 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-400">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              placeholder="admin@team.gg"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-400">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2 rounded-lg transition-colors"
          >
            Entrar
          </button>
        </form>
        
        <div className="mt-4 text-center text-sm text-slate-500">
          <Link href="/setup" className="hover:text-blue-400 underline">
            ¿Primera vez? Configurar Admin
          </Link>
        </div>
      </div>
    </div>
  );
}
