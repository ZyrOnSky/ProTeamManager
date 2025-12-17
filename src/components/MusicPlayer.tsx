"use client";

import { useState, useRef, useEffect } from 'react';
import { Play, Pause, SkipForward, SkipBack, Volume2, VolumeX, Music, ListMusic, X, Disc, Shuffle, Repeat } from 'lucide-react';

// 🎵 CONFIGURACIÓN DE PLAYLISTS
// NOTA: Debes crear la carpeta 'public/music' y añadir archivos reales.
const PLAYLISTS = [
  {
    id: 'worlds',
    name: 'Worlds Orchestral',
    tracks: [
      { title: "Worlds 2023 Theme", artist: "League of Legends", src: "/music/Worlds 2023  Orchestral Theme - League Of Legends.mp3" },
      { title: "Worlds 2025 Theme", artist: "League of Legends", src: "/music/Worlds 2025  Orchestral Theme - League Of Legends.mp3" },
      { title: "Worlds 2024 Theme", artist: "League of Legends", src: "/music/Worlds 2024  Orchestral Theme - League Of Legends.mp3" },
      { title: "Worlds 2022 Theme", artist: "League of Legends", src: "/music/WORLDS 2022  ORCHESTRAL THEME  - League of Legends.mp3" },
      { title: "Worlds 2021 Theme", artist: "League of Legends", src: "/music/Worlds 2021  Orchestral Theme - League of Legends.mp3" },
      { title: "Worlds 2020 Theme", artist: "League of Legends", src: "/music/Worlds 2020  Orchestral Theme - League of Legends.mp3" },
      { title: "Worlds 2019 Theme", artist: "League of Legends", src: "/music/2019 World Championship  Orchestral Theme - League of Legends.mp3" },
      { title: "Worlds 2018 Theme", artist: "League of Legends", src: "/music/2018 World Championship (ft. HEALTH)  Login Screen - League of Legends.mp3" },
      { title: "Worlds 2017 Theme", artist: "League of Legends", src: "/music/2017 World Championship  Login Screen - League of Legends.mp3" },
      { title: "Worlds 2016 Theme", artist: "League of Legends", src: "/music/2016 World Championship  Login Screen - League of Legends.mp3" },
      { title: "Worlds 2015 Theme", artist: "League of Legends", src: "/music/2015 World Championship (wo Vocals)  Login Screen - League of Legends.mp3" },
      { title: "Season 3 Finals", artist: "League of Legends", src: "/music/Season 3 Finals _ Login Screen - League of Legends [vd66qPdq5Vg].mp3" },
      { title: "Season 2 World Championship", artist: "League of Legends", src: "/music/League of Legends SEASON 2 WORLD CHAMPIONSHIP Login Theme.mp3" },
    ]
  },
  {
    id: 'anthems',
    name: 'Worlds Music (Anthems)',
    tracks: [
      { title: "Heavy Is The Crown", artist: "Linkin Park (Worlds 2024)", src: "/music/Heavy Is the Crown (Official Audio) - Linkin Park [ZAt8oxY0GQo].mp3" },
      { title: "GODS", artist: "NewJeans (Worlds 2023)", src: "/music/GODS ft. NewJeans (뉴진스) (Official Music Video)  Worlds 2023 Anthem - League of Legends.mp3" },
      { title: "STAR WALKIN'", artist: "Lil Nas X (Worlds 2022)", src: "/music/Lil Nas X - STAR WALKIN' (League of Legends Worlds Anthem).mp3" },
      { title: "Burn It All Down", artist: "PVRIS (Worlds 2021)", src: "/music/Burn It All Down (ft. PVRIS)  Worlds 2021 - League of Legends.mp3" },
      { title: "Take Over", artist: "Jeremy McKinnon, MAX, Henry (Worlds 2020)", src: "/music/Take Over (ft. Jeremy McKinnon (A Day To Remember), MAX, Henry)  Worlds 2020 - League of Legends.mp3" },
      { title: "Phoenix", artist: "Cailin Russo, Chrissy Costanza (Worlds 2019)", src: "/music/Phoenix (ft. Cailin Russo and Chrissy Costanza)  Worlds 2019 - League of Legends.mp3" },
      { title: "RISE", artist: "The Glitch Mob, Mako, The Word Alive (Worlds 2018)", src: "/music/RISE (ft. The Glitch Mob, Mako, and The Word Alive)  Worlds 2018 - League of Legends.mp3" },
      { title: "Legends Never Die", artist: "Against The Current (Worlds 2017)", src: "/music/Legends Never Die (ft. Against The Current)  Worlds 2017 - League of Legends.mp3" },
      { title: "Ignite", artist: "Zedd (Worlds 2016)", src: "/music/Ignite (ft. Zedd)  Worlds 2016 - League of Legends.mp3" },
      { title: "Warriors", artist: "Imagine Dragons (Worlds 2014)", src: "/music/Warriors (ft. Imagine Dragons)  Worlds 2014 - League of Legends.mp3" },
    ]
  }
];

export function MusicPlayer() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const ringRef = useRef<HTMLDivElement>(null); // Nuevo ref para el anillo reactivo
  const prevBassRef = useRef<number>(0); // Último valor normalizado de bajos
  const pulseRef = useRef<number>(0); // Valor de pulso para attack/decay
  const sustainRef = useRef<number>(0); // nivel de energía sostenida para oscilación
  const filterRef = useRef<BiquadFilterNode | null>(null); // Filtro para enfocar bajos
  
  // Estados
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentPlaylistId, setCurrentPlaylistId] = useState('worlds');
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isShuffle, setIsShuffle] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);
  const [volume, setVolume] = useState(0.2); // 20% volumen inicial
  const [isMuted, setIsMuted] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [showPlaylistSelector, setShowPlaylistSelector] = useState(false);
  const [selectorView, setSelectorView] = useState<'playlists' | 'tracks'>('tracks');

  const currentPlaylist = PLAYLISTS.find(p => p.id === currentPlaylistId) || PLAYLISTS[0];
  const currentTrack = currentPlaylist.tracks[currentTrackIndex];

  // Manejo de Volumen
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // 🪄 TRUCO: Autoplay Inteligente & Aleatorio al Inicio
  useEffect(() => {
    // 1. Seleccionar canción aleatoria al montar
    const randomPlaylist = PLAYLISTS[Math.floor(Math.random() * PLAYLISTS.length)];
    const randomTrackIndex = Math.floor(Math.random() * randomPlaylist.tracks.length);
    
    setCurrentPlaylistId(randomPlaylist.id);
    setCurrentTrackIndex(randomTrackIndex);

    // 2. Intentar reproducir
    const attemptPlay = () => {
      if (audioRef.current) {
        // Pequeño timeout para asegurar que el estado se actualizó
        setTimeout(() => {
          const playPromise = audioRef.current?.play();
          
          if (playPromise !== undefined) {
            playPromise
              .then(() => {
                setIsPlaying(true);
              })
              .catch((err) => {
                console.log("Autoplay bloqueado por el navegador. Esperando interacción...", err);
                
                // Si falla, reproducir en el primer clic o tecla
                const enableAudio = () => {
                  if (audioRef.current) {
                    audioRef.current.play()
                      .then(() => {
                        setIsPlaying(true);
                        // Limpiar listeners una vez logrado
                        document.removeEventListener('click', enableAudio);
                        document.removeEventListener('keydown', enableAudio);
                        document.removeEventListener('touchstart', enableAudio);
                      })
                      .catch(e => console.error("Interacción insuficiente aún", e));
                  }
                };

                document.addEventListener('click', enableAudio);
                document.addEventListener('keydown', enableAudio);
                document.addEventListener('touchstart', enableAudio);
              });
          }
        }, 500);
      }
    };

    const timer = setTimeout(attemptPlay, 1000);
    return () => clearTimeout(timer);
  }, []);

  // 🎵 AUDIO VISUALIZER (Real-time Beat Detection)
  useEffect(() => {
    let animationFrameId: number | null = null;

    const setupAudioContext = () => {
      if (!audioContextRef.current) {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        audioContextRef.current = new AudioContext();
      }

      if (audioContextRef.current && !analyserRef.current) {
        analyserRef.current = audioContextRef.current.createAnalyser();
        analyserRef.current.fftSize = 256; // balance rendimiento/reso
      }

      // Crear filtro bandpass para centrarnos en kicks (bajos)
      if (audioContextRef.current && !filterRef.current) {
        try {
          filterRef.current = audioContextRef.current.createBiquadFilter();
          filterRef.current.type = 'bandpass';
          filterRef.current.frequency.value = 100; // center ~100Hz
          filterRef.current.Q.value = 1.2; // ancho de banda razonable
        } catch (e) {
          console.warn('BiquadFilter no disponible:', e);
          filterRef.current = null;
        }
      }

      if (audioRef.current && !sourceRef.current && audioContextRef.current && analyserRef.current) {
        try {
          sourceRef.current = audioContextRef.current.createMediaElementSource(audioRef.current);

          // Conectar fuente directamente al destino para que la reproducción no dependa
          // del filtro/analyser (evita atenuación accidental).
          sourceRef.current.connect(audioContextRef.current.destination);

          // Crear una rama de análisis separada: source -> (filter?) -> analyser
          if (filterRef.current) {
            try {
              sourceRef.current.connect(filterRef.current);
              filterRef.current.connect(analyserRef.current);
            } catch (e) {
              // en caso de error, conectar source directo al analyser
              sourceRef.current.connect(analyserRef.current);
            }
          } else {
            sourceRef.current.connect(analyserRef.current);
          }
        } catch (e) {
          console.error("Error connecting audio source:", e);
        }
      }
    };

    const animate = () => {
      if (!analyserRef.current || !buttonRef.current) return;

      // Resume context if suspended (browser policy)
      if (audioContextRef.current?.state === 'suspended') {
        audioContextRef.current.resume();
      }

      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyserRef.current.getByteFrequencyData(dataArray);

      // Calculate Bass (Low Frequencies) - enfatizar bins más bajos
      const bassBins = 6; // usar menos bins para enfocarnos en sub-bajos
      let bassSum = 0;
      let weightSum = 0;
      for (let i = 0; i < bassBins; i++) {
        // Peso mayor en bins más bajos: (bassBins - i)
        const weight = (bassBins - i);
        bassSum += dataArray[i] * weight;
        weightSum += weight;
      }
      let bassAverage = weightSum > 0 ? (bassSum / weightSum) : 0; // 0-255

      // FALLBACK: Si no hay datos (CORS o error) pero está sonando, simular latido
      if (bassAverage === 0 && isPlaying && !audioRef.current?.paused) {
        const time = Date.now() / 1000;
        const beat = Math.pow(Math.sin(time * Math.PI * 2), 4);
        bassAverage = beat * 50 + 10;
      }

      // Normalizar
      const normalized = Math.min(Math.max(bassAverage / 255, 0), 1);

      // Peak detector (attack/decay) — enfocarnos en golpes de bombo
      const prev = prevBassRef.current || 0;
      // Parámetros ajustados para mayor sensibilidad y pulso rápido
      const attackMultiplier = 8.0; // amplifica subidas rápidas (más sensibilidad)
      const decayFactor = 0.65; // decay más pronunciado para pulso rápido y notorio

      const delta = Math.max(0, normalized - prev);
      const attackBoost = delta * attackMultiplier;

      // pulse crece instantáneamente en subidas (attack) y decae rápido
      pulseRef.current = Math.max(pulseRef.current * decayFactor, normalized + attackBoost);
      const pulse = pulseRef.current; // 0..>1 dependiendo del golpe

      // Sustain detector: media rápida para detectar sonidos continuos (vocales prolongadas)
      sustainRef.current = sustainRef.current * 0.84 + normalized * 0.16;
      const sustain = sustainRef.current;

      // Visual mapping — mantener icono pequeño por defecto y hacer pulsos relativos
      const baseScale = 0.88; // tamaño base ligeramente reducido (88% del original)
      const pulseStrength = Math.min(pulse, 1);

      // Pulsos moderados relativos al tamaño base (no doblar el icono)
      const scale = baseScale + pulseStrength * 0.5; // de 0.88 -> ~1.38 en golpes fuertes

      // Rotación compuesta: jolt por picos + oscilación por sustain
      // Jolt rápido en picos (más agresivo) — puede alcanzar ±60° en picos fuertes
      const joltRotate = pulse > 0.12 ? (Math.random() * 120 - 60) * pulseStrength : 0;
      // Oscilación rápida y notoria si hay energía sostenida (vocales largas)
      const time = Date.now() / 1000;
      // Frecuencia y amplitud aumentadas para un vaivén frenético tipo telemetro
      const oscFreq = 6.0 + sustain * 30.0; // frecuencia mayor (Hz)
      const oscAmp = 60 * Math.min(sustain, 1) * Math.max(0.6, pulseStrength); // amplitud en grados (hasta ~60deg)
      const oscRotate = Math.sin(time * Math.PI * 2 * oscFreq) * oscAmp;

      const rotate = joltRotate + oscRotate;

      // Anillo más discreto: escala y opacidad reducidas
      const ringScale = 1 + pulseStrength * 0.9; // onda comedida
      const ringOpacity = pulseStrength > 0.02 ? `${Math.pow(pulseStrength, 0.45) * 0.5}` : '0';
      const ringBorder = `${Math.max(1, pulseStrength * 2.5)}px`;

      // Glow centrado en el botón para dramatizar el bombo, pero contenido
      const glow = pulseStrength > 0.08 ? `0 0 ${pulseStrength * 48}px ${pulseStrength * 10}px rgba(59,130,246,${Math.min(0.85, pulseStrength * 1)})` : 'none';

      // Aplicar estilos
      buttonRef.current.style.transform = `scale(${scale}) rotate(${rotate}deg)`;
      buttonRef.current.style.boxShadow = glow;

      if (ringRef.current) {
        ringRef.current.style.transform = `scale(${ringScale})`;
        ringRef.current.style.opacity = ringOpacity;
        ringRef.current.style.borderWidth = ringBorder;
      }

      // Guardar último valor de bajos
      prevBassRef.current = normalized;

      if (isPlaying) {
        animationFrameId = requestAnimationFrame(animate);
      } else {
        // Mantener tamaño base pequeño cuando está inactivo
        buttonRef.current.style.transform = `scale(${baseScale}) rotate(0deg)`;
        buttonRef.current.style.boxShadow = 'none';
        if (ringRef.current) {
          ringRef.current.style.transform = 'scale(1)';
          ringRef.current.style.opacity = '0';
          ringRef.current.style.borderWidth = '2px';
        }
      }
    };

      if (isPlaying) {
        setupAudioContext();
        animate();
      } else {
        if (buttonRef.current) buttonRef.current.style.transform = 'scale(1)';
        if (ringRef.current) {
          ringRef.current.style.transform = 'scale(1)';
          ringRef.current.style.opacity = '0';
        }
        if (animationFrameId !== null) cancelAnimationFrame(animationFrameId);
      }

      return () => {
        if (animationFrameId !== null) cancelAnimationFrame(animationFrameId);
      };
  }, [isPlaying, isExpanded, currentTrackIndex]);

  // Notificación de "Ahora Suena"
  useEffect(() => {
    if (isPlaying) {
      setShowNotification(true);
      const timer = setTimeout(() => setShowNotification(false), 4000); // Ocultar tras 4s
      return () => clearTimeout(timer);
    }
  }, [currentTrackIndex, currentPlaylistId, isPlaying]);

  // Reproducir al cambiar de canción (si ya estaba sonando)
  useEffect(() => {
    if (isPlaying && audioRef.current) {
      audioRef.current.play().catch(e => console.log("Esperando interacción..."));
    }
  }, [currentTrackIndex, currentPlaylistId]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    
    // Asegurar que el contexto de audio esté activo (browser policy)
    if (audioContextRef.current?.state === 'suspended') {
      audioContextRef.current.resume();
    }

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(e => console.error("Error play:", e));
    }
    setIsPlaying(!isPlaying);
  };

  const nextTrack = () => {
    if (isShuffle) {
      let nextIndex = Math.floor(Math.random() * currentPlaylist.tracks.length);
      // Evitar repetir la misma canción inmediatamente
      if (currentPlaylist.tracks.length > 1 && nextIndex === currentTrackIndex) {
        nextIndex = (nextIndex + 1) % currentPlaylist.tracks.length;
      }
      setCurrentTrackIndex(nextIndex);
    } else {
      setCurrentTrackIndex((prev) => (prev + 1) % currentPlaylist.tracks.length);
    }
    setIsPlaying(true);
  };

  const prevTrack = () => {
    setCurrentTrackIndex((prev) => (prev - 1 + currentPlaylist.tracks.length) % currentPlaylist.tracks.length);
    setIsPlaying(true);
  };

  const changePlaylist = (playlistId: string) => {
    setCurrentPlaylistId(playlistId);
    setCurrentTrackIndex(0);
    setIsPlaying(true);
    setSelectorView('tracks'); // Switch to tracks view after selecting playlist
  };

  return (
    <>
      <audio 
        ref={audioRef}
        src={currentTrack.src}
        onEnded={nextTrack}
        loop={isRepeat}
      />

      {/* 🔔 NOTIFICACIÓN "AHORA SUENA" (Estilo FIFA) */}
      <div className={`fixed top-24 right-6 z-50 transition-all duration-500 transform ${showNotification ? 'translate-x-0 opacity-100' : 'translate-x-20 opacity-0 pointer-events-none'}`}>
        <div className="bg-slate-900/90 backdrop-blur-md border-l-4 border-green-500 text-white p-4 rounded-r-lg shadow-2xl flex items-center gap-4 min-w-[250px]">
          <div className="bg-slate-800 p-2 rounded-full animate-spin-slow">
            <Disc size={24} className="text-green-400" />
          </div>
          <div>
            <p className="text-xs text-green-400 font-bold uppercase tracking-wider">Ahora Suena</p>
            <h4 className="font-bold text-sm truncate max-w-[180px]">{currentTrack.title}</h4>
            <p className="text-xs text-slate-400 truncate max-w-[180px]">{currentTrack.artist}</p>
          </div>
        </div>
      </div>

      {/* 🎛️ REPRODUCTOR FLOTANTE */}
      <div className={`fixed bottom-6 right-6 z-50 transition-all duration-300 ease-in-out ${isExpanded ? 'w-80' : 'w-14 h-14'}`}>
        
        {/* VISTA MINIMIZADA */}
        {!isExpanded && (
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Ondas de Música (Reactivo Real) */}
            <div 
              ref={ringRef}
              className="absolute inset-0 rounded-full border-2 border-blue-400/50 transition-transform duration-75 ease-out"
              style={{ opacity: 0 }}
            ></div>

            {/* Onda de "Idle" (Solo cuando pausado) */}
            {!isPlaying && (
              <div className="absolute inset-0 rounded-full bg-red-500/20 animate-ping opacity-75 duration-[3000ms]"></div>
            )}
            
            <button 
              ref={buttonRef}
              onClick={() => setIsExpanded(true)}
              className={`relative w-full h-full rounded-full flex items-center justify-center transition-all z-10 flex items-center justify-center`} 
              style={{
                backgroundColor: isPlaying ? 'rgba(15,23,42,0.72)' : 'rgba(15,23,42,0.58)',
                color: isPlaying ? 'rgba(255,255,255,0.78)' : 'rgba(255,255,255,0.6)',
                border: !isPlaying ? '1px solid rgba(63,63,70,0.35)' : undefined,
                boxShadow: '0 6px 18px rgba(0,0,0,0.18)',
                backdropFilter: 'saturate(120%) blur(4px)'
              }}
            >
              <Music size={18} style={{ opacity: 0.92 }} />
            </button>
          </div>
        )}

        {/* VISTA EXPANDIDA */}
        {isExpanded && (
          <div className="bg-slate-900/95 backdrop-blur-xl border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
            
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-4 border-b border-slate-700 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isPlaying ? 'bg-blue-500' : 'bg-slate-700'}`}>
                  <Music size={20} className="text-white" />
                </div>
                <div className="overflow-hidden">
                  <h4 className="text-white font-bold text-sm truncate w-40">{currentTrack.title}</h4>
                  <p className="text-slate-400 text-xs truncate w-40">{currentTrack.artist}</p>
                </div>
              </div>
              <button onClick={() => setIsExpanded(false)} className="text-slate-500 hover:text-white p-1">
                <X size={16} />
              </button>
            </div>

            {/* Controles Principales */}
            <div className="p-4 space-y-4">
              {/* Barra de Progreso (Visual) */}
              <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                <div className={`h-full bg-blue-500 ${isPlaying ? 'animate-progress' : 'w-0'}`} style={{ animationDuration: '180s' }}></div>
              </div>

              <div className="flex justify-center items-center gap-4">
                <button 
                  onClick={() => setIsShuffle(!isShuffle)} 
                  className={`transition-colors ${isShuffle ? 'text-blue-500' : 'text-slate-600 hover:text-slate-400'}`}
                  title="Aleatorio"
                >
                  <Shuffle size={18} />
                </button>

                <button onClick={prevTrack} className="text-slate-400 hover:text-white transition-colors">
                  <SkipBack size={24} />
                </button>
                
                <button 
                  onClick={togglePlay}
                  className="w-12 h-12 rounded-full bg-white text-slate-900 flex items-center justify-center hover:scale-105 transition-transform shadow-lg shadow-white/10"
                >
                  {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-1" />}
                </button>

                <button onClick={nextTrack} className="text-slate-400 hover:text-white transition-colors">
                  <SkipForward size={24} />
                </button>

                <button 
                  onClick={() => setIsRepeat(!isRepeat)} 
                  className={`transition-colors ${isRepeat ? 'text-blue-500' : 'text-slate-600 hover:text-slate-400'}`}
                  title="Repetir"
                >
                  <Repeat size={18} />
                </button>
              </div>

              {/* Footer: Volumen y Playlist */}
              <div className="flex justify-between items-center pt-2 border-t border-slate-800">
                <div className="flex items-center gap-2 group">
                  <button onClick={() => setIsMuted(!isMuted)} className="text-slate-400 hover:text-white">
                    {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                  </button>
                  <input 
                    type="range" 
                    min="0" 
                    max="1" 
                    step="0.05" 
                    value={isMuted ? 0 : volume}
                    onChange={(e) => {
                      setVolume(parseFloat(e.target.value));
                      setIsMuted(false);
                    }}
                    className="w-16 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2 [&::-webkit-slider-thumb]:h-2 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
                  />
                </div>

                <button 
                  onClick={() => setShowPlaylistSelector(!showPlaylistSelector)}
                  className={`flex items-center gap-2 text-xs font-bold px-2 py-1 rounded transition-colors ${showPlaylistSelector ? 'bg-blue-500/20 text-blue-400' : 'text-slate-400 hover:text-white'}`}
                >
                  <ListMusic size={16} />
                  <span>{currentPlaylist.name}</span>
                </button>
              </div>
            </div>

            {/* Selector de Playlist / Canciones (Overlay) */}
            {showPlaylistSelector && (
              <div className="absolute inset-0 bg-slate-900/95 z-20 flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-200">
                {/* Header Tabs */}
                <div className="flex border-b border-slate-800">
                  <button 
                    onClick={() => setSelectorView('tracks')} 
                    className={`flex-1 p-3 text-xs font-bold uppercase tracking-wider transition-colors ${selectorView === 'tracks' ? 'text-white border-b-2 border-blue-500 bg-slate-800/50' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                    Canciones
                  </button>
                  <button 
                    onClick={() => setSelectorView('playlists')} 
                    className={`flex-1 p-3 text-xs font-bold uppercase tracking-wider transition-colors ${selectorView === 'playlists' ? 'text-white border-b-2 border-blue-500 bg-slate-800/50' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                    Playlists
                  </button>
                  <button onClick={() => setShowPlaylistSelector(false)} className="p-3 text-slate-500 hover:text-white border-l border-slate-800">
                    <X size={14} />
                  </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                  {selectorView === 'playlists' ? (
                    // LISTA DE PLAYLISTS
                    PLAYLISTS.map(playlist => (
                      <button
                        key={playlist.id}
                        onClick={() => changePlaylist(playlist.id)}
                        className={`w-full text-left p-3 rounded-lg text-sm font-medium transition-colors flex justify-between items-center group ${
                          currentPlaylistId === playlist.id 
                            ? 'bg-blue-600 text-white' 
                            : 'text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <span>{playlist.name}</span>
                        <span className="text-xs opacity-50 group-hover:opacity-100">{playlist.tracks.length} tracks</span>
                      </button>
                    ))
                  ) : (
                    // LISTA DE CANCIONES (Playlist Actual)
                    currentPlaylist.tracks.map((track, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setCurrentTrackIndex(idx);
                          setIsPlaying(true);
                        }}
                        className={`w-full text-left p-2 rounded-lg text-xs transition-colors flex items-center gap-3 group ${
                          currentTrackIndex === idx 
                            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' 
                            : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                        }`}
                      >
                        <div className={`w-6 h-6 rounded flex items-center justify-center shrink-0 ${currentTrackIndex === idx ? 'bg-blue-500 text-white' : 'bg-slate-800 text-slate-600 group-hover:bg-slate-700'}`}>
                          {currentTrackIndex === idx && isPlaying ? (
                            <div className="flex gap-[2px] items-end h-3">
                              <div className="w-[2px] bg-white animate-[bounce_1s_infinite] h-2"></div>
                              <div className="w-[2px] bg-white animate-[bounce_1.2s_infinite] h-3"></div>
                              <div className="w-[2px] bg-white animate-[bounce_0.8s_infinite] h-1"></div>
                            </div>
                          ) : (
                            <span className="text-[10px] font-bold">{idx + 1}</span>
                          )}
                        </div>
                        <div className="overflow-hidden">
                          <div className="font-bold truncate">{track.title}</div>
                          <div className="opacity-70 truncate">{track.artist}</div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
