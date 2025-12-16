export default function Loading() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-slate-950">
      <div className="flex flex-col items-center gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-800 border-t-blue-500"></div>
        <p className="text-sm font-medium text-slate-400 animate-pulse">Cargando...</p>
      </div>
    </div>
  );
}
