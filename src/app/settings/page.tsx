"use client";

import { useState, useEffect } from "react";
import { Save, Loader2, Globe, Clock, ArrowLeft, Lock, Shield, UserCog } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";

export default function SettingsPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [settings, setSettings] = useState({
    timezone: "GMT-5",
    language: "es",
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Admin User Management State
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [adminNewPassword, setAdminNewPassword] = useState("");
  const [isAdminResetting, setIsAdminResetting] = useState(false);

  useEffect(() => {
    fetchSettings();
    if (session?.user?.role === "ADMIN") {
      fetchUsers();
    }
  }, [session]);

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/admin/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const handleAdminResetPassword = async () => {
    if (!selectedUser || !adminNewPassword) {
      alert("Selecciona un usuario e ingresa una nueva contraseña");
      return;
    }

    setIsAdminResetting(true);
    try {
      const res = await fetch("/api/admin/users/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: selectedUser, newPassword: adminNewPassword }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Error al restablecer contraseña");
      
      alert("Contraseña restablecida correctamente");
      setAdminNewPassword("");
      setSelectedUser("");
    } catch (error: any) {
      console.error(error);
      alert(error.message);
    } finally {
      setIsAdminResetting(false);
    }
  };

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/settings");
      if (res.ok) {
        const data = await res.json();
        setSettings({
          timezone: data.timezone || "GMT-5",
          language: data.language || "es",
        });
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (!res.ok) throw new Error("Error saving settings");
      
      alert("Ajustes guardados correctamente");
      router.refresh();
    } catch (error) {
      console.error(error);
      alert("Error al guardar ajustes");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert("Las contraseñas nuevas no coinciden");
      return;
    }
    
    setIsChangingPassword(true);
    try {
      const res = await fetch("/api/settings/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(passwordForm),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Error al cambiar contraseña");
      
      alert("Contraseña actualizada correctamente");
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (error: any) {
      console.error(error);
      alert(error.message);
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-500">
        <Loader2 className="animate-spin" size={32} />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-8">
      <div className="max-w-2xl mx-auto">
        <header className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link 
              href="/" 
              className="p-2 bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white border border-slate-800"
            >
              <ArrowLeft size={24} />
            </Link>
            <h1 className="text-3xl font-bold text-white">Ajustes de Usuario</h1>
          </div>
          <p className="text-slate-400 ml-14">Personaliza tu experiencia en la plataforma.</p>
        </header>

        <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-8">
          
          {/* Zona Horaria */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-blue-400 mb-2">
              <Clock size={24} />
              <h2 className="text-xl font-semibold text-white">Zona Horaria</h2>
            </div>
            <p className="text-sm text-slate-400">
              Define la zona horaria para visualizar correctamente los horarios de las scrims.
            </p>
            <select
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
              value={settings.timezone}
              onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
            >
              <option value="GMT-5">GMT-5 (Bogotá, Lima, Panamá, EST)</option>
              <option value="GMT-6">GMT-6 (CDMX, Costa Rica, CST)</option>
              <option value="GMT-4">GMT-4 (Santiago, La Paz, VET)</option>
              <option value="GMT-3">GMT-3 (Buenos Aires, Sao Paulo)</option>
              <option value="GMT+1">GMT+1 (Madrid, CET)</option>
              <option value="UTC">UTC (Universal Coordinated Time)</option>
            </select>
          </div>

          <hr className="border-slate-800" />

          {/* Idioma */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-green-400 mb-2">
              <Globe size={24} />
              <h2 className="text-xl font-semibold text-white">Idioma del Sistema</h2>
            </div>
            <p className="text-sm text-slate-400">
              Selecciona el idioma de la interfaz (actualmente en desarrollo).
            </p>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setSettings({ ...settings, language: "es" })}
                className={`p-4 rounded-lg border transition-all text-center ${
                  settings.language === "es"
                    ? "bg-green-500/20 border-green-500 text-green-400"
                    : "bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700"
                }`}
              >
                Español
              </button>
              <button
                type="button"
                onClick={() => setSettings({ ...settings, language: "en" })}
                className={`p-4 rounded-lg border transition-all text-center ${
                  settings.language === "en"
                    ? "bg-blue-500/20 border-blue-500 text-blue-400"
                    : "bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700"
                }`}
              >
                English
              </button>
            </div>
          </div>

          <hr className="border-slate-800" />

          {/* Seguridad */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-red-400 mb-2">
              <Lock size={24} />
              <h2 className="text-xl font-semibold text-white">Seguridad</h2>
            </div>
            <p className="text-sm text-slate-400">
              Actualiza tu contraseña para mantener tu cuenta segura.
            </p>
            
            <div className="space-y-3">
              <input
                type="password"
                placeholder="Contraseña Actual"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-red-500 transition-colors"
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
              />
              <input
                type="password"
                placeholder="Nueva Contraseña"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-red-500 transition-colors"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
              />
              <input
                type="password"
                placeholder="Confirmar Nueva Contraseña"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-red-500 transition-colors"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
              />
              <button
                type="button"
                onClick={handlePasswordChange}
                disabled={isChangingPassword}
                className="w-full bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-600/50 py-3 rounded-lg font-bold transition-colors flex justify-center items-center gap-2"
              >
                {isChangingPassword ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Actualizando...
                  </>
                ) : (
                  "Actualizar Contraseña"
                )}
              </button>
            </div>
          </div>

          {/* Admin Panel - User Management */}
          {session?.user?.role === "ADMIN" && (
            <>
              <hr className="border-slate-800" />
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-purple-400 mb-2">
                  <UserCog size={24} />
                  <h2 className="text-xl font-semibold text-white">Administración de Usuarios</h2>
                </div>
                <p className="text-sm text-slate-400">
                  Restablecer contraseña de usuarios (Solo Administradores).
                </p>
                
                <div className="space-y-3 bg-slate-950/50 p-4 rounded-lg border border-slate-800">
                  <div className="space-y-2">
                    <label className="text-sm text-slate-400">Seleccionar Usuario</label>
                    <select
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors"
                      value={selectedUser}
                      onChange={(e) => setSelectedUser(e.target.value)}
                    >
                      <option value="">-- Seleccionar Usuario --</option>
                      {users.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.name} ({user.email}) - {user.role}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm text-slate-400">Nueva Contraseña para el Usuario</label>
                    <input
                      type="text"
                      placeholder="Ingresa la nueva contraseña"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors"
                      value={adminNewPassword}
                      onChange={(e) => setAdminNewPassword(e.target.value)}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleAdminResetPassword}
                    disabled={isAdminResetting || !selectedUser || !adminNewPassword}
                    className="w-full bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 border border-purple-600/50 py-3 rounded-lg font-bold transition-colors flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isAdminResetting ? (
                      <>
                        <Loader2 size={20} className="animate-spin" />
                        Restableciendo...
                      </>
                    ) : (
                      <>
                        <Shield size={20} />
                        Restablecer Contraseña de Usuario
                      </>
                    )}
                  </button>
                </div>
              </div>
            </>
          )}

          <div className="pt-4">
            <button
              type="submit"
              disabled={isSaving}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-bold transition-colors flex justify-center items-center gap-2"
            >
              {isSaving ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save size={20} />
                  Guardar Cambios
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </main>
  );
}
