"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Settings, Check, X } from "lucide-react";
import { UserStatusBadge } from "./UserStatusBadge";

type UserStatus = "ACTIVE" | "INACTIVE" | "DELETED" | "SUBSTITUTE";

interface UserStatusManagerProps {
  userId: string;
  currentStatus: UserStatus;
  userRole: string;
  currentUserRole: string;
  currentUserId: string;
  userName: string;
}

export function UserStatusManager({ 
  userId, 
  currentStatus, 
  userRole,
  currentUserRole,
  currentUserId,
  userName 
}: UserStatusManagerProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [status, setStatus] = useState(currentStatus);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Determinar permisos
  const canEdit = () => {
    // Un usuario puede editar su propio estado (excepto DELETED)
    if (currentUserId === userId) return true;
    
    // ADMIN puede cambiar cualquier estado
    if (currentUserRole === "ADMIN") return true;
    
    // COACH/STAFF pueden cambiar estado de jugadores
    if (["COACH", "STAFF"].includes(currentUserRole) && userRole === "PLAYER") return true;
    
    return false;
  };

  const getAvailableStatuses = () => {
    const statuses: UserStatus[] = ["ACTIVE", "SUBSTITUTE", "INACTIVE"];
    
    // Solo ADMIN puede usar DELETED
    if (currentUserRole === "ADMIN" && currentUserId !== userId) {
      statuses.push("DELETED");
    }
    
    return statuses;
  };

  const handleSave = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (status === currentStatus) {
      setIsEditing(false);
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch(`/api/users/${userId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al actualizar el estado");
      }

      setIsEditing(false);
      router.refresh();
    } catch (error) {
      console.error("Error updating status:", error);
      alert(error instanceof Error ? error.message : "Error al actualizar el estado");
      setStatus(currentStatus);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setStatus(currentStatus);
    setIsEditing(false);
  };

  if (!canEdit()) {
    return <UserStatusBadge status={currentStatus} />;
  }

  const stopPropagation = (e: React.SyntheticEvent) => {
    e.stopPropagation();
  };

  if (!isEditing) {
    return (
      <div 
        className="flex items-center gap-2" 
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onMouseDown={stopPropagation}
        onMouseUp={stopPropagation}
      >
        <UserStatusBadge status={currentStatus} />
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsEditing(true);
          }}
          onMouseDown={stopPropagation}
          className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
          title="Cambiar estado"
        >
          <Settings size={14} />
        </button>
      </div>
    );
  }

  return (
    <div 
      className="flex items-center gap-2" 
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onMouseDown={stopPropagation}
      onMouseUp={stopPropagation}
    >
      <select
        value={status}
        onChange={(e) => {
          e.stopPropagation();
          setStatus(e.target.value as UserStatus);
        }}
        onClick={stopPropagation}
        onMouseDown={stopPropagation}
        onMouseUp={stopPropagation}
        disabled={isLoading}
        className="text-xs font-bold px-2 py-1 rounded bg-slate-800 border border-slate-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {getAvailableStatuses().map((statusOption) => (
          <option key={statusOption} value={statusOption}>
            {statusOption === "ACTIVE" && "Activo"}
            {statusOption === "SUBSTITUTE" && "Suplente"}
            {statusOption === "INACTIVE" && "Inactivo"}
            {statusOption === "DELETED" && "Eliminado"}
          </option>
        ))}
      </select>
      
      <div className="flex gap-1">
        <button
          onClick={handleSave}
          onMouseDown={stopPropagation}
          onMouseUp={stopPropagation}
          disabled={isLoading}
          className="p-1 text-green-400 hover:text-green-300 hover:bg-green-500/10 rounded transition-colors disabled:opacity-50"
          title="Guardar"
        >
          <Check size={12} />
        </button>
        <button
          onClick={handleCancel}
          onMouseDown={stopPropagation}
          onMouseUp={stopPropagation}
          disabled={isLoading}
          className="p-1 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-colors disabled:opacity-50"
          title="Cancelar"
        >
          <X size={12} />
        </button>
      </div>
    </div>
  );
}