'use client';

import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Shield, User, Lock, Loader2, HelpCircle, ArrowRight, Eye, EyeOff, X } from 'lucide-react';

// --- Helpers: simple WebCrypto wrapper for local encryption (NOT bulletproof) ---
async function getOrCreateKey() {
  const existing = localStorage.getItem('ltm_crypto_key');
  if (existing) {
    try {
      const jwk = JSON.parse(existing);
      return await window.crypto.subtle.importKey('jwk', jwk, { name: 'AES-GCM' }, true, ['encrypt', 'decrypt']);
    } catch (e) {
      console.warn('Failed to import crypto key, regenerating', e);
    }
  }

  const key = await window.crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
  const jwk = await window.crypto.subtle.exportKey('jwk', key);
  try { localStorage.setItem('ltm_crypto_key', JSON.stringify(jwk)); } catch (e) { console.warn('Could not persist crypto key', e); }
  return key;
}

async function encryptString(plain: string) {
  const key = await getOrCreateKey();
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plain);
  const cipher = await window.crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded);
  // store iv + cipher as base64
  const combined = new Uint8Array(iv.byteLength + cipher.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(cipher), iv.byteLength);
  let binary = '';
  combined.forEach((b) => binary += String.fromCharCode(b));
  return btoa(binary);
}

async function decryptString(dataB64: string) {
  try {
    const key = await getOrCreateKey();
    const binary = atob(dataB64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const iv = bytes.slice(0, 12);
    const cipher = bytes.slice(12);
    const plainBuf = await window.crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, cipher);
    return new TextDecoder().decode(plainBuf);
  } catch (e) {
    console.warn('Decrypt failed', e);
    return '';
  }
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [autoSignIn, setAutoSignIn] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showAutoPrompt, setShowAutoPrompt] = useState(false);

  useEffect(() => {
    const savedEmail = localStorage.getItem('rememberedEmail');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
    const savedAuto = localStorage.getItem('autoSignIn');
    if (savedAuto === 'true') setAutoSignIn(true);

    // If autoSignIn is enabled AND we also have a saved email/password,
    // show a prompt allowing the user to choose to auto-login or change account.
    (async () => {
      try {
        const shouldAuto = localStorage.getItem('autoSignIn') === 'true';
        const saved = localStorage.getItem('rememberedEmail');
        const enc = localStorage.getItem('rememberedPassword');
        // If we have a saved password and the user chose 'remember', pre-fill the password field
        if (saved && enc) {
          try {
            const pwd = await decryptString(enc);
            if (pwd) setPassword(pwd);
          } catch (e) {
            console.warn('Could not decrypt saved password on load', e);
          }
        }

        if (shouldAuto && saved && enc) {
          // don't auto sign-in immediately; prompt the user so they can switch accounts
          setShowAutoPrompt(true);
        }
      } catch (e) {
        console.warn('Auto sign-in check error', e);
      }
    })();
  }, []);

  // handler to perform auto sign-in when user explicitly accepts
  const handleAutoSignIn = async () => {
    try {
      const enc = localStorage.getItem('rememberedPassword');
      const saved = localStorage.getItem('rememberedEmail');
      if (!enc || !saved) return;
      setLoading(true);
      const pwd = await decryptString(enc);
      const res = await signIn('credentials', { email: saved, password: pwd, redirect: false });
      setLoading(false);
      if (!res || (res as any).error) {
        setError('Auto inicio de sesión falló. Verifica tus credenciales.');
      } else {
        setShowAutoPrompt(false);
        router.push('/');
        router.refresh();
      }
    } catch (e) {
      setLoading(false);
      console.warn('handleAutoSignIn error', e);
      setError('Error al intentar el inicio automático.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    if (rememberMe) {
      localStorage.setItem('rememberedEmail', email);
      try {
        const enc = await encryptString(password);
        localStorage.setItem('rememberedPassword', enc);
      } catch (err) {
        console.warn('Could not encrypt password for storage', err);
      }
    } else {
      localStorage.removeItem('rememberedEmail');
      localStorage.removeItem('rememberedPassword');
    }
    if (autoSignIn) {
      localStorage.setItem('autoSignIn', 'true');
      // if user wants auto sign-in but didn't check remember, still save encrypted password
      if (!rememberMe) {
        try {
          const enc = await encryptString(password);
          localStorage.setItem('rememberedPassword', enc);
        } catch (err) { console.warn('Could not encrypt password for storage', err); }
      }
    } else {
      localStorage.removeItem('autoSignIn');
    }

    try {
      const res = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (res?.error) {
        setError('Credenciales inválidas. Contacte a su administrador si el problema persiste.');
      } else {
        router.push('/');
        router.refresh();
      }
    } catch (err) {
      setError('Error de conexión con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 flex flex-col items-center justify-center">
      
      {/* 🎥 VIDEO BACKGROUND */}
      <div className="absolute inset-0 w-full h-full z-0">
        <video 
          autoPlay 
          loop 
          muted 
          playsInline 
          className="w-full h-full object-cover"
        >
          <source src="/videos/login-bg.mp4" type="video/mp4" />
        </video>
      </div>

      {/* CONTENIDO CENTRADO */}
          <div className="relative z-10 w-full max-w-md px-4">
        
        {/* TARJETA DE LOGIN (reducida 85%) */}
        <div style={{ transform: 'scale(0.85)', transformOrigin: 'center' }} className="bg-slate-900/70 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl py-6 px-8 animate-in fade-in zoom-in duration-500">
          
          {/* HEADER */}
          <div className="flex flex-col items-center mb-6">
            <div className="w-36 h-36 mb-4 drop-shadow-2xl hover:scale-105 transition-transform duration-300">
              <img src="/logo.png" alt="Pro Team Manager Logo" className="w-full h-full object-contain" />
            </div>
            <h2 className="text-sm font-semibold text-blue-400 tracking-tight">Pro Team Manager</h2>
            <h1 className="text-2xl font-bold text-white tracking-tight mt-2">Bienvenido de nuevo</h1>
            <p className="text-slate-400 text-sm mt-1">Ingrese sus credenciales de acceso</p>
          </div>

          {error && (
            <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-3 text-red-400 text-sm">
              <Shield size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* PROMPT PARA INICIO AUTOMÁTICO (evita login inmediato tras cerrar sesión) */}
          {showAutoPrompt && (
            <div className="mb-4 p-3 bg-slate-800/70 border border-slate-700 rounded-md text-sm text-slate-200">
              <p className="mb-3">Hemos detectado que tenías inicio automático configurado para <strong>{localStorage.getItem('rememberedEmail') || email}</strong>.</p>
              <div className="flex gap-3">
                <button onClick={handleAutoSignIn} className="px-3 py-1 bg-blue-600 rounded text-white hover:bg-blue-500">Iniciar sesión automáticamente</button>
                <button onClick={() => { setShowAutoPrompt(false); setEmail(''); setPassword(''); }} className="px-3 py-1 bg-slate-700 rounded text-slate-200 hover:bg-slate-600">Cambiar cuenta</button>
                <button onClick={() => setShowAutoPrompt(false)} className="px-3 py-1 bg-transparent border border-slate-700 rounded text-slate-400 hover:text-slate-200">Cerrar</button>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider ml-1">Email Corporativo</label>
              <div className="relative group">
                <User className="absolute left-3 top-3 text-slate-500 group-focus-within:text-blue-400 transition-colors" size={18} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950/50 border border-slate-700 rounded-lg py-2.5 pl-10 pr-4 text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder:text-slate-600"
                  placeholder="usuario@equipo.gg"
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider ml-1">Contraseña</label>
              </div>
              <div className="relative group">
                <Lock className="absolute left-3 top-3 text-slate-500 group-focus-within:text-blue-400 transition-colors" size={18} />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950/50 border border-slate-700 rounded-lg py-2.5 pl-10 pr-10 text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder:text-slate-600"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-500 hover:text-slate-300 transition-colors focus:outline-none"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-700 bg-slate-950/50 text-blue-600 focus:ring-blue-500 focus:ring-offset-0"
                />
                <label htmlFor="remember-me" className="ml-2 text-sm text-slate-400 cursor-pointer select-none hover:text-slate-300">
                  Recordar usuario y contraseña
                </label>
              </div>

              <div className="flex items-center">
                <input
                  id="auto-signin"
                  type="checkbox"
                  checked={autoSignIn}
                  onChange={(e) => setAutoSignIn(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-700 bg-slate-950/50 text-blue-600 focus:ring-blue-500 focus:ring-offset-0"
                />
                <label htmlFor="auto-signin" className="ml-2 text-sm text-slate-400 cursor-pointer select-none hover:text-slate-300">
                  Inicio de sesión automático
                </label>
              </div>
            </div>

            {/* Advertencias de seguridad */}
            <div className="mt-2 text-xs text-amber-300/95 italic">
              <p>Advertencia: Activar estas opciones almacenará credenciales cifradas localmente. Aunque usamos cifrado, este método no sustituye una sesión segura en servidor. No habilite en equipos públicos.</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-2.5 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-900/20"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  <span>Verificando...</span>
                </>
              ) : (
                <>
                  <span>Iniciar Sesión</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          {/* FOOTER LINKS */}
          <div className="mt-6 pt-4 border-t border-slate-800 flex justify-center gap-6 text-xs text-slate-500">
            <button onClick={() => setShowSupportModal(true)} className="hover:text-slate-300 transition-colors flex items-center gap-1">
              <HelpCircle size={12} /> Soporte Técnico
            </button>
            <button onClick={() => setShowPrivacyModal(true)} className="hover:text-slate-300 transition-colors">
              Política de Privacidad
            </button>
          </div>
        </div>

      </div>

      {/* COPYRIGHT EN LA PARTE INFERIOR */}
      <div className="absolute bottom-6 left-0 right-0 z-10 flex justify-center pointer-events-none">
        <div className="text-center pointer-events-auto">
          <p className="text-xs text-slate-500 font-medium">
            &copy; {new Date().getFullYear()} Pro Team Manager. Todos los derechos reservados.
          </p>
          <p className="text-[10px] text-slate-600 mt-1">
            v2.4.0-production
          </p>
        </div>
      </div>

      {/* MODAL: SOPORTE TÉCNICO */}
      {showSupportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowSupportModal(false)} />
          <div className="relative w-full max-w-3xl mx-4 bg-slate-900/95 text-slate-100 rounded-xl shadow-2xl p-6 overflow-auto max-h-[85vh]">
            <div className="flex items-start justify-between">
              <h3 className="text-lg font-semibold">Soporte Técnico</h3>
              <button onClick={() => setShowSupportModal(false)} className="text-slate-400 hover:text-slate-200">
                <X size={20} />
              </button>
            </div>
            <div className="mt-4 text-sm leading-relaxed text-slate-300 space-y-4">
              <p>Gracias por utilizar Pro Team Manager. Si encuentras un error, comportamiento inesperado o quieres solicitar una mejora, sigue estos pasos para que podamos ayudarte de la forma más eficiente posible.</p>
              <p><strong>1) Información mínima necesaria</strong><br />Describe claramente el problema: pasos exactos para reproducirlo, resultado esperado y resultado real. Adjunta capturas o un breve vídeo cuando sea posible (una grabación corta que muestre el fallo ayuda mucho).</p>
              <p><strong>2) Datos técnicos útiles</strong><br />Indica navegador (Chrome/Edge/Firefox), sistema operativo y la URL de la página donde ocurrió. Si es un archivo concreto (vídeo, imagen), menciona su nombre y cuándo ocurre el problema.</p>
              <p><strong>3) Registros y errores</strong><br />Si aparece algo en la consola del navegador (F12 → Consola), copia los mensajes relevantes. Si la app muestra un mensaje de error, copia el texto exacto.</p>
              <p><strong>4) Prioridad y contexto</strong><br />Indica si el problema te impide trabajar (p. ej. no puedes iniciar sesión, no se guardan cambios) o si es un fallo menor de visualización. Añade tu rol en el equipo (coach, jugador, scout) para entender el impacto.</p>
              <p><strong>5) Contacto (cómo enviarnos la solicitud)</strong><br />Actualmente no gestionamos correos de soporte directo. Para contactarme, envíame una solicitud de amistad por Discord a <strong>zyronsky</strong>. Yo aceptaré la solicitud y, una vez seamos amigos, podrás enviarme un mensaje privado con la descripción y los archivos o capturas. No necesitamos un sistema de tickets por ahora: usa la solicitud de amistad + mensaje privado para reportar el problema.</p>
              <p><strong>6) Cómo reportar un bug desde la app</strong><br />- Reproduce el problema y anota los pasos.<br />- Toma capturas o graba la pantalla.<br />- Si puedes, abre la consola del navegador y copia los errores.<br />- Envía todo esto por mensaje privado en Discord a <strong>zyronsky</strong>.</p>
              <p><strong>¿Qué ocurre después? (Explicación simple del triaje)</strong><br />Cuando recibo tu solicitud, la reviso y confirmo que entiendo el problema. Luego la clasifico según cuán grave es (bloquea trabajo o es menor). Las incidencias más graves las atiendo primero; las menos urgentes se programan en cola. Te responderé con los próximos pasos y un estimado de cuándo puedo solucionarlo o darte una alternativa. Si necesito más información, te pediré detalles adicionales por el mismo chat de Discord.</p>
              <p className="text-xs text-slate-400">Nota: No compartas contraseñas ni información sensible en canales públicos. Si necesitas transferir datos sensibles, pregúntame por la vía segura a utilizar.</p>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: POLÍTICA DE PRIVACIDAD */}
      {showPrivacyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowPrivacyModal(false)} />
          <div className="relative w-full max-w-3xl mx-4 bg-slate-900/95 text-slate-100 rounded-xl shadow-2xl p-6 overflow-auto max-h-[85vh]">
            <div className="flex items-start justify-between">
              <h3 className="text-lg font-semibold">Política de Privacidad</h3>
              <button onClick={() => setShowPrivacyModal(false)} className="text-slate-400 hover:text-slate-200">
                <X size={20} />
              </button>
            </div>
            <div className="mt-4 text-sm leading-relaxed text-slate-300 space-y-4">
              <p>En Pro Team Manager la protección de tus datos es una prioridad. A continuación describimos de forma clara y transparente cómo recogemos, usamos y protegemos la información que gestionas en la plataforma.</p>
              <p><strong>Tipos de datos y finalidad</strong><br />Recopilamos información de cuenta (correo electrónico, credenciales cifradas para comodidad local), datos operativos de equipos y sesiones (lineups, scrims, estadísticas) y contenidos cargados por los usuarios (archivos, imágenes, vídeos). Utilizamos estos datos para ofrecer servicios de autenticación, persistencia de configuración, generación de estadísticas y funciones colaborativas esenciales para la gestión del equipo.</p>
              <p><strong>Almacenamiento local de credenciales</strong><br />Existe la opción de almacenar credenciales cifradas localmente para facilitar el inicio automático. Este mecanismo usa cifrado en el navegador pero tiene limitaciones de seguridad comparado con soluciones completamente gestionadas por el servidor. Recomendamos no habilitar el auto-login en dispositivos compartidos o públicos.</p>
              <p><strong>Acceso y responsabilidad</strong><br />Los administradores del equipo pueden ver y gestionar ciertos datos operativos. Los usuarios son responsables de mantener la confidencialidad de sus credenciales y reportar accesos no autorizados. Si detectas una brecha de seguridad, contacta inmediatamente con soporte.</p>
              <p><strong>Conservación y eliminación</strong><br />Retenemos los datos necesarios para la operación del servicio mientras la cuenta esté activa. Si solicitas la eliminación de tu cuenta, procederemos a eliminar los datos personales conforme a la normativa aplicable y a nuestros procesos internos, respetando obligaciones legales que puedan exigir conservación temporal de ciertos registros.</p>
              <p><strong>Transferencias y terceros</strong><br />Podemos utilizar proveedores de infraestructura para almacenar y procesar datos (hosting, CDN, servicios de correo). Nos aseguramos de que dichos proveedores cumplan medidas de seguridad apropiadas y acuerdos contractuales para proteger los datos.</p>
              <p><strong>Tus derechos</strong><br />Dependiendo de tu jurisdicción, puedes tener derechos de acceso, rectificación, portabilidad y supresión de tus datos. Para ejercerlos, contacta al equipo de soporte indicando la acción requerida y la cuenta afectada.</p>
              <p className="text-xs text-slate-400">Al usar esta plataforma aceptas estas prácticas. Para dudas legales o solicitudes formales, contacta a soporte y te orientaremos sobre el procedimiento apropiado.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


