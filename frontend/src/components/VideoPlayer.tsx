import React, { useEffect, useRef } from 'react';
import { VideoFile } from '@/hooks/useVideos';
import { useAuth } from '@/hooks/useAuth';
import { useVideoProgress } from '@/hooks/useVideoProgress';

interface VideoPlayerProps {
  video: VideoFile;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ video }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { user } = useAuth();
  const { progress, saveProgress, loading } = useVideoProgress(user?.id, video.id);

  useEffect(() => {
    if (videoRef.current && progress.resumeTime > 0) {
      videoRef.current.currentTime = progress.resumeTime;
    }
  }, [progress.resumeTime]);

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      saveProgress(videoRef.current.currentTime);
    }
  };

  const handleMarkWatched = () => {
    if (videoRef.current) {
      saveProgress(videoRef.current.duration, true);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <video
        ref={videoRef}
        src={video.url}
        controls
        className="w-full rounded-2xl shadow-lg bg-black"
        onTimeUpdate={handleTimeUpdate}
      />
      <button
        className="bg-era-lime text-white rounded-2xl px-4 py-2 font-semibold shadow hover:bg-era-lime/90 transition"
        onClick={handleMarkWatched}
        disabled={loading}
      >
        Marcar como assistido
      </button>
    </div>
  );
}; 