import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';

interface AudioPlayerProps {
  src: string;
  title?: string;
  compact?: boolean;
  className?: string;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ src, title, compact = false, className = '' }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onLoadedMetadata = () => setDuration(audio.duration);
    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onEnded = () => setIsPlaying(false);

    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('ended', onEnded);
    };
  }, [src]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;
    const time = parseFloat(e.target.value);
    audio.currentTime = time;
    setCurrentTime(time);
  };

  const formatTime = (seconds: number) => {
    if (!isFinite(seconds)) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  if (compact) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <audio ref={audioRef} src={src} preload="metadata" />
        <button
          onClick={togglePlay}
          className="w-7 h-7 rounded-full flex items-center justify-center bg-primary/10 hover:bg-primary/20 transition-colors flex-shrink-0"
        >
          {isPlaying
            ? <Pause className="h-3.5 w-3.5 text-primary" />
            : <Play className="h-3.5 w-3.5 text-primary ml-0.5" />
          }
        </button>
        {title && <span className="text-xs text-muted-foreground truncate">{title}</span>}
        <span className="text-xs text-muted-foreground flex-shrink-0">{formatTime(currentTime)}/{formatTime(duration)}</span>
      </div>
    );
  }

  return (
    <div className={`rounded-xl border border-border bg-card p-3 ${className}`}>
      <audio ref={audioRef} src={src} preload="metadata" />

      {title && (
        <div className="flex items-center gap-2 mb-2">
          <Volume2 className="h-3.5 w-3.5 text-primary flex-shrink-0" />
          <span className="text-xs font-medium text-foreground truncate">{title}</span>
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          onClick={togglePlay}
          className="w-9 h-9 rounded-full flex items-center justify-center bg-primary text-primary-foreground hover:opacity-90 transition-opacity flex-shrink-0 shadow-sm"
        >
          {isPlaying
            ? <Pause className="h-4 w-4" />
            : <Play className="h-4 w-4 ml-0.5" />
          }
        </button>

        <div className="flex-1 min-w-0">
          <div className="relative h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="absolute top-0 left-0 h-full bg-primary rounded-full transition-all duration-150"
              style={{ width: `${progress}%` }}
            />
            <input
              type="range"
              min={0}
              max={duration || 0}
              step={0.1}
              value={currentTime}
              onChange={handleSeek}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[10px] text-muted-foreground">{formatTime(currentTime)}</span>
            <span className="text-[10px] text-muted-foreground">{formatTime(duration)}</span>
          </div>
        </div>

        <button
          onClick={toggleMute}
          className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-muted transition-colors flex-shrink-0"
        >
          {isMuted
            ? <VolumeX className="h-3.5 w-3.5 text-muted-foreground" />
            : <Volume2 className="h-3.5 w-3.5 text-muted-foreground" />
          }
        </button>
      </div>
    </div>
  );
};

export default AudioPlayer;
