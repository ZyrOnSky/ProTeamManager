'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SetupPage() {
  const router = useRouter();
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSetup = async () => {
    setLoading(true);
    setStatus('Creando administrador...');
    
    try {
      const res = await fetch('/api/setup', { method: 'POST' });
      const data = await res.json();
      
      if (res.ok) {
        setStatus('¡Éxito! Redirigiendo al login...');
        setTimeout(() => router.push('/login'), 2000);
      } else {
        if (data.message === 'Admin already exists') {
           setStatus('El administrador ya existe. Redirigiendo al login...');
           setTimeout(() => router.push('/login'), 2000);
        } else {
           setStatus(`Error: ${data.message}`);
        }
      }
    } catch (error) {
      setStatus('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100">
      <div className="bg-slate-900 p-8 rounded-xl border border-slate-800 max-w-md text-center">
        <h1 className="text-2xl font-bold mb-4 text-blue-500">Configuración Inicial</h1>
        <p className="text-slate-400 mb-6">
          Haz clic abajo para crear el usuario Administrador por defecto.
          <br />
          <span className="text-xs text-slate-500">(Email: admin@team.gg / Pass: admin123)</span>
        </p>
        
        <button
          onClick={handleSetup}
          disabled={loading}
          className="bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-6 rounded-lg transition-colors disabled:opacity-50"
        >
          {loading ? 'Procesando...' : 'Crear Admin & Inicializar'}
        </button>
        
        {status && (
          <div className="mt-4 p-2 bg-slate-800 rounded text-sm">
            {status}
          </div>
        )}
      </div>
    </div>
  );
}
