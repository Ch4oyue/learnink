import React, { useState, useEffect, useRef } from 'react';
import { GlassCard } from './GlassCard';
import { Play, Pause, SkipForward, SkipBack, Heart, Volume2, VolumeX } from 'lucide-react';
import { Song } from '../types';

const PLAYLIST: Song[] = [
  {
    title: "Synthwave Dreams",
    artist: "SoundHelix",
    cover: "https://picsum.photos/400/400?random=1",
    duration: 312,
    genre: ["Electronic", "Synth-pop"],
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
  },
  {
    title: "Neon Horizon",
    artist: "SoundHelix",
    cover: "https://picsum.photos/400/400?random=2",
    duration: 375,
    genre: ["Synthwave", "Retro"],
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3"
  },
  {
    title: "Digital Love",
    artist: "SoundHelix",
    cover: "https://picsum.photos/400/400?random=3",
    duration: 350,
    genre: ["Pop", "Ambient"],
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3"
  }
];

export const MusicPlayer: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [isMuted, setIsMuted] = useState(false);

  const audioRef = useRef<HTMLAudioElement>(null);
  const currentSong = PLAYLIST[currentSongIndex];

  // Handle Play/Pause
  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(e => console.log("Playback prevented:", e));
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, currentSongIndex]);

  // Handle Volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      setDuration(audioRef.current.duration || 0);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const handleNext = () => {
    setCurrentSongIndex((prev) => (prev + 1) % PLAYLIST.length);
  };

  const handlePrev = () => {
    if (currentTime > 5) {
      if (audioRef.current) audioRef.current.currentTime = 0;
    } else {
      setCurrentSongIndex((prev) => (prev - 1 + PLAYLIST.length) % PLAYLIST.length);
    }
  };

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercent = duration ? (currentTime / duration) * 100 : 0;

  return (
    <GlassCard className="h-full min-h-[240px] flex flex-col relative overflow-hidden group">
      <audio 
        ref={audioRef}
        src={currentSong.url}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleNext}
        onLoadedMetadata={handleTimeUpdate}
      />

      {/* Background Album Blur */}
      <div 
        key={currentSong.cover} 
        className="absolute inset-0 bg-cover bg-center opacity-30 blur-2xl scale-125 transition-all duration-1000"
        style={{ backgroundImage: `url("${currentSong.cover}")` }}
      ></div>
      
      <div className="relative z-10 flex gap-4">
        <div className="w-24 h-24 rounded-2xl overflow-hidden shadow-lg border border-white/20 shrink-0 relative group/img">
          <img src={currentSong.cover} alt="Album Art" className="w-full h-full object-cover transition-transform duration-700 group-hover/img:scale-110" />
          {isPlaying && (
             <div className="absolute inset-0 flex items-end justify-center pb-2 gap-1 bg-black/20">
                <div className="w-1 bg-white animate-[bounce_1s_infinite] h-3"></div>
                <div className="w-1 bg-white animate-[bounce_1.2s_infinite] h-5"></div>
                <div className="w-1 bg-white animate-[bounce_0.8s_infinite] h-2"></div>
             </div>
          )}
        </div>
        <div className="flex flex-col justify-center overflow-hidden min-w-0 flex-1">
          <h3 className="text-white font-bold text-lg truncate leading-tight">{currentSong.title}</h3>
          <p className="text-white/60 text-sm truncate mt-1">{currentSong.artist}</p>
          <div className="flex items-center gap-1 mt-2 flex-wrap">
             {currentSong.genre.map(g => (
                <span key={g} className="px-2 py-0.5 rounded-full bg-white/10 text-[10px] text-white/90 border border-white/10 whitespace-nowrap shadow-sm">
                  {g}
                </span>
             ))}
          </div>
        </div>
      </div>

      <div className="relative z-10 mt-auto pt-4 space-y-4">
        {/* Controls */}
        <div className="flex justify-between items-center px-2">
            <button 
                onClick={() => setIsMuted(!isMuted)} 
                className="p-2 rounded-full glass-button text-white/50 hover:text-white transition-colors"
            >
                {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>

            <div className="flex items-center gap-4">
                <button onClick={handlePrev} className="p-3 rounded-full glass-button text-white/70 hover:text-white transition-colors hover:scale-110 active:scale-95">
                    <SkipBack size={20} />
                </button>
                <button 
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="w-14 h-14 flex items-center justify-center rounded-full bg-white text-black hover:scale-105 transition-transform shadow-[0_0_25px_rgba(255,255,255,0.25)] active:scale-95 border-4 border-white/10 backdrop-blur-md"
                >
                    {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-1" />}
                </button>
                <button onClick={handleNext} className="p-3 rounded-full glass-button text-white/70 hover:text-white transition-colors hover:scale-110 active:scale-95">
                    <SkipForward size={20} />
                </button>
            </div>

            <button 
                onClick={() => setIsLiked(!isLiked)}
                className={`p-2 rounded-full glass-button transition-colors hover:scale-110 ${isLiked ? 'text-pink-500' : 'text-white/50 hover:text-pink-400'}`}
            >
                <Heart size={18} fill={isLiked ? "currentColor" : "none"} />
            </button>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5 group/bar">
          <div className="relative h-1.5 bg-white/10 rounded-full cursor-pointer overflow-hidden border border-white/5">
             {/* Background track */}
             <div className="absolute top-0 left-0 h-full bg-white/5 w-full"></div>
             {/* Progress fill */}
             <div 
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 rounded-full transition-all duration-100 ease-linear shadow-[0_0_10px_rgba(168,85,247,0.5)]" 
                style={{ width: `${progressPercent}%` }}
             ></div>
             {/* Draggable Input */}
             <input 
                type="range" 
                min="0" 
                max={duration || 100}
                value={currentTime} 
                onChange={handleSeek}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-20"
             />
          </div>
          <div className="flex justify-between text-[10px] text-white/40 font-medium tracking-wide font-mono">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
      </div>
    </GlassCard>
  );
};