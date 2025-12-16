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

  const currentPlaylist = PLAYLISTS.find(p => p.id === currentPlaylistId) || PLAYLISTS[0];
  const currentTrack = currentPlaylist.tracks[currentTrackIndex];

  // Manejo de Volumen
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // 🪄 TRUCO: Autoplay Inteligente
  useEffect(() => {
    const attemptPlay = async () => {
      if (audioRef.current) {
        try {
          // Intentar reproducir inmediatamente
          await audioRef.current.play();
          setIsPlaying(true);
        } catch (err) {
          console.log("Autoplay bloqueado. Esperando interacción del usuario...");
          
          // Si falla, reproducir en el primer clic o tecla
          const enableAudio = () => {
            if (audioRef.current) {
              audioRef.current.play()
                .then(() => {
                  setIsPlaying(true);
                  // Limpiar listeners para que no se ejecute de nuevo
                  document.removeEventListener('click', enableAudio);
                  document.removeEventListener('keydown', enableAudio);
                  document.removeEventListener('touchstart', enableAudio);
                })
                .catch(e => console.error("Interacción insuficiente", e));
            }
          };

          document.addEventListener('click', enableAudio);
          document.addEventListener('keydown', enableAudio);
          document.addEventListener('touchstart', enableAudio);
        }
      }
    };

    // Pequeño delay para asegurar que el DOM esté listo
    const timer = setTimeout(attemptPlay, 1000);
    return () => clearTimeout(timer);
  }, []);

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
    setShowPlaylistSelector(false);
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
          <button 
            onClick={() => setIsExpanded(true)}
            className={`w-full h-full rounded-full flex items-center justify-center shadow-lg shadow-blue-500/20 transition-transform hover:scale-110 ${isPlaying ? 'bg-blue-600 animate-pulse-slow' : 'bg-slate-800 border border-slate-700'}`}
          >
            <Music size={24} className={isPlaying ? "text-white" : "text-slate-400"} />
          </button>
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

            {/* Selector de Playlist (Overlay) */}
            {showPlaylistSelector && (
              <div className="absolute inset-0 bg-slate-900/95 z-10 flex flex-col">
                <div className="p-3 border-b border-slate-800 flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-400 uppercase">Seleccionar Playlist</span>
                  <button onClick={() => setShowPlaylistSelector(false)}><X size={14} className="text-slate-500" /></button>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                  {PLAYLISTS.map(playlist => (
                    <button
                      key={playlist.id}
                      onClick={() => changePlaylist(playlist.id)}
                      className={`w-full text-left p-3 rounded-lg text-sm font-medium transition-colors flex justify-between items-center ${
                        currentPlaylistId === playlist.id 
                          ? 'bg-blue-600 text-white' 
                          : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      {playlist.name}
                      {currentPlaylistId === playlist.id && <div className="w-2 h-2 bg-white rounded-full animate-pulse" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
