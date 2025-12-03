"use client";

type UserStatus = "ACTIVE" | "INACTIVE" | "DELETED" | "SUBSTITUTE";

interface UserStatusBadgeProps {
  status: UserStatus;
  size?: "sm" | "md" | "lg";
}

export function UserStatusBadge({ status, size = "md" }: UserStatusBadgeProps) {
  const getStatusConfig = (status: UserStatus) => {
    switch (status) {
      case "ACTIVE":
        return {
          text: "Activo",
          className: "bg-green-500/10 text-green-400 border-green-500/20",
          dot: "bg-green-500"
        };
      case "SUBSTITUTE":
        return {
          text: "Suplente",
          className: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
          dot: "bg-yellow-500"
        };
      case "INACTIVE":
        return {
          text: "Inactivo",
          className: "bg-orange-500/10 text-orange-400 border-orange-500/20",
          dot: "bg-orange-500"
        };
      case "DELETED":
        return {
          text: "Eliminado",
          className: "bg-red-500/10 text-red-400 border-red-500/20",
          dot: "bg-red-500"
        };
      default:
        return {
          text: "Desconocido",
          className: "bg-slate-500/10 text-slate-400 border-slate-500/20",
          dot: "bg-slate-500"
        };
    }
  };

  const getSizeClasses = (size: string) => {
    switch (size) {
      case "sm":
        return {
          container: "text-xs px-2 py-1",
          dot: "w-1.5 h-1.5"
        };
      case "lg":
        return {
          container: "text-sm px-3 py-2",
          dot: "w-3 h-3"
        };
      default: // md
        return {
          container: "text-xs px-2 py-1",
          dot: "w-2 h-2"
        };
    }
  };

  const config = getStatusConfig(status);
  const sizeClasses = getSizeClasses(size);

  return (
    <div className={`inline-flex items-center gap-2 font-bold rounded border ${config.className} ${sizeClasses.container}`}>
      <div className={`rounded-full ${config.dot} ${sizeClasses.dot}`}></div>
      {config.text}
    </div>
  );
}