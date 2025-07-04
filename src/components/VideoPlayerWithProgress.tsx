import React, { useRef, useEffect, useState } from 'react';
import { CheckCircle, Play, Pause } from 'lucide-react';
import { useVideoProgress } from '@/hooks/useVideoProgress';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';

interface VideoPlayerWithProgressProps {
  video: {
    id: string;
    titulo: string;
    url_video: string;
    thumbnail_url?: string;
    duracao?: number;
  };
  cursoId: string;
  moduloId?: string;
  userId?: string;
  onProgressChange?: (progress: number) => void;
  className?: string;
}

export const VideoPlayerWithProgress: React.FC<VideoPlayerWithProgressProps> = ({
  video,
  cursoId,
  moduloId,
  userId,
  onProgressChange,
  className = ''
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showCompletionBadge, setShowCompletionBadge] = useState(false);

  const { progress, saveProgress, markAsCompleted, loading } = useVideoProgress(
    userId,
    video.id,
    cursoId,
    moduloId
  );

  // Carregar tempo salvo quando o vídeo estiver pronto
  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    const handleLoadedMetadata = () => {
      setDuration(videoElement.duration);
      
      // Se há progresso salvo e não está concluído, restaurar posição
      if (progress.tempoAssistido > 0 && !progress.concluido) {
        videoElement.currentTime = progress.tempoAssistido;
        setCurrentTime(progress.tempoAssistido);
      }
    };

    videoElement.addEventListener('loadedmetadata', handleLoadedMetadata);
    return () => {
      videoElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, [progress.tempoAssistido, progress.concluido]);

  // Atualizar tempo atual
  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    const handleTimeUpdate = () => {
      const time = videoElement.currentTime;
      setCurrentTime(time);
      
      // Salvar progresso a cada 5 segundos
      if (Math.floor(time) % 5 === 0 && Math.floor(time) !== Math.floor(progress.tempoAssistido)) {
        saveProgress(time, duration);
      }

      // Verificar se chegou ao fim do vídeo (90% ou mais)
      if (duration > 0 && time >= duration * 0.9 && !progress.concluido) {
        handleVideoCompletion();
      }

      // Notificar mudança de progresso
      if (onProgressChange) {
        const progressPercent = duration > 0 ? (time / duration) * 100 : 0;
        onProgressChange(progressPercent);
      }
    };

    videoElement.addEventListener('timeupdate', handleTimeUpdate);
    return () => {
      videoElement.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, [duration, progress.tempoAssistido, progress.concluido, saveProgress, onProgressChange]);

  // Detectar quando o vídeo termina
  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    const handleEnded = () => {
      handleVideoCompletion();
    };

    videoElement.addEventListener('ended', handleEnded);
    return () => {
      videoElement.removeEventListener('ended', handleEnded);
    };
  }, []);

  const handleVideoCompletion = async () => {
    if (progress.concluido) return;

    try {
      await markAsCompleted();
      setShowCompletionBadge(true);
      
      toast({
        title: "Vídeo concluído!",
        description: `Você completou "${video.titulo}"`,
        variant: "default"
      });

      // Esconder badge após 3 segundos
      setTimeout(() => setShowCompletionBadge(false), 3000);
    } catch (error) {
      console.error('Erro ao marcar vídeo como concluído:', error);
    }
  };

  const togglePlay = () => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    if (isPlaying) {
      videoElement.pause();
    } else {
      videoElement.play();
    }
    setIsPlaying(!isPlaying);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className={`relative ${className}`}>
      {/* Badge de conclusão */}
      {progress.concluido && (
        <div className="absolute top-4 right-4 z-10">
          <Badge variant="default" className="bg-green-500 text-white">
            <CheckCircle className="w-4 h-4 mr-1" />
            Concluído
          </Badge>
        </div>
      )}

      {/* Badge temporário de conclusão */}
      {showCompletionBadge && !progress.concluido && (
        <div className="absolute top-4 right-4 z-10 animate-pulse">
          <Badge variant="default" className="bg-green-500 text-white">
            <CheckCircle className="w-4 h-4 mr-1" />
            Concluído!
          </Badge>
        </div>
      )}

      {/* Player de vídeo */}
      <div className="relative bg-black rounded-lg overflow-hidden">
        <video
          ref={videoRef}
          src={video.url_video}
          className="w-full aspect-video"
          poster={video.thumbnail_url}
          controls={false}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        />
        
        {/* Controles customizados */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={togglePlay}
              className="text-white hover:bg-white/20"
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </Button>
            
            <div className="flex-1">
              <Progress 
                value={progressPercent} 
                className="h-2 bg-white/20"
              />
            </div>
            
            <span className="text-white text-sm font-mono">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>
        </div>
      </div>

      {/* Informações do vídeo */}
      <div className="mt-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{video.titulo}</h3>
        
        {/* Progresso */}
        <div className="flex items-center gap-2 mb-2">
          <Progress 
            value={progress.percentualAssistido} 
            className="flex-1 h-2"
          />
          <span className="text-sm text-gray-600 font-medium">
            {Math.round(progress.percentualAssistido)}%
          </span>
        </div>

        {/* Status */}
        <div className="flex items-center gap-2">
          {progress.concluido ? (
            <Badge variant="default" className="bg-green-100 text-green-800">
              <CheckCircle className="w-3 h-3 mr-1" />
              Vídeo concluído
            </Badge>
          ) : progress.percentualAssistido > 0 ? (
            <Badge variant="secondary">
              Em andamento
            </Badge>
          ) : (
            <Badge variant="outline">
              Não iniciado
            </Badge>
          )}
          
          {progress.dataConclusao && (
            <span className="text-xs text-gray-500">
              Concluído em {new Date(progress.dataConclusao).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
          <div className="text-sm text-gray-600">Carregando progresso...</div>
        </div>
      )}
    </div>
  );
}; 