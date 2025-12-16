'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-slate-950 text-slate-200">
      <h2 className="text-2xl font-bold mb-4">Algo salió mal</h2>
      <p className="text-slate-400 mb-6 max-w-md text-center">
        Ha ocurrido un error inesperado. Por favor, intenta recargar la página.
      </p>
      <button
        onClick={() => reset()}
        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors font-medium"
      >
        Intentar de nuevo
      </button>
    </div>
  );
}
