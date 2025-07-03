import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCourseModules, useCourses } from '@/hooks/useCourses';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import type { Module } from '@/hooks/useCourses';
import type { Database } from '@/integrations/supabase/types';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

// Adicionar tipo auxiliar para vídeo com modulo_id e categoria
type VideoWithModulo = Database['public']['Tables']['videos']['Row'] & {
  modulo_id?: string;
  categoria?: string;
};

const ModuleEditForm = ({ modulo, onSaved }: { modulo: Module, onSaved: () => void }) => {
  const [link, setLink] = React.useState(modulo.link_video || '');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  const handleSave = async () => {
    setLoading(true);
    setError('');
    const { error } = await supabase
      .from('modulos')
      .update({ link_video: link })
      .eq('id', modulo.id);
    setLoading(false);
    if (error) {
      setError('Erro ao salvar');
    } else {
      onSaved();
    }
  };

  return (
    <div className="p-2 border rounded mb-2 bg-gray-50">
      <label className="block mb-1 font-semibold">Link do vídeo</label>
      <input
        className="border px-2 py-1 w-full mb-2"
        value={link}
        onChange={e => setLink(e.target.value)}
        placeholder="https://youtu.be/..."
      />
      <button
        className="bg-era-lime text-era-dark-blue px-3 py-1 rounded font-bold"
        onClick={handleSave}
        disabled={loading}
      >
        {loading ? 'Salvando...' : 'Salvar'}
      </button>
      {error && <div className="text-red-500 mt-2">{error}</div>}
    </div>
  );
};

// Helper para pegar o link do vídeo
function getVideoUrl(item: Module | { url_video?: string; link_video?: string }) {
  if ('link_video' in item && item.link_video) return item.link_video;
  if ('url_video' in item && item.url_video) return item.url_video;
  return '';
}

function getModuleTitle(item: Module | { titulo?: string; nome_modulo?: string }) {
  if ('nome_modulo' in item && item.nome_modulo) return item.nome_modulo;
  if ('titulo' in item && item.titulo) return item.titulo;
  return '';
}

const CursoDetalhe = () => {
  const { id } = useParams();
  const { userProfile } = useAuth();
  const isAdmin = userProfile?.tipo_usuario === 'admin';
  const userId = userProfile?.id;
  const navigate = useNavigate();
  const [refresh, setRefresh] = React.useState(0);
  const { data: modules = [], isLoading, error } = useCourseModules(id || '');
  const [videos, setVideos] = React.useState<VideoWithModulo[]>([]);
  const [progress, setProgress] = React.useState<Record<string, Database['public']['Tables']['progresso_usuario']['Row']>>({});
  const [loading, setLoading] = React.useState(false);
  const [selectedVideo, setSelectedVideo] = React.useState<Module | VideoWithModulo | null>(null);
  const [editingModuleId, setEditingModuleId] = React.useState<string | null>(null);
  const [editTitle, setEditTitle] = React.useState('');
  const [editDesc, setEditDesc] = React.useState('');
  const [showImportDialog, setShowImportDialog] = React.useState<string | null>(null);
  const [importUrl, setImportUrl] = React.useState('');
  const [showClientView, setShowClientView] = React.useState<string | null>(null);
  const [attachments, setAttachments] = React.useState<Record<string, unknown[]>>({}); // para anexos futuros
  const [progressAvg, setProgressAvg] = React.useState<Record<string, number>>({});
  const { data: allCourses = [] } = useCourses();
  const currentCourse = allCourses.find(c => c.id === id);
  const currentCategory = currentCourse?.categoria;

  React.useEffect(() => {
    if (!id || !userId) return;
    const fetchVideosAndProgress = async () => {
      setLoading(true);
      const { data: videosData } = await supabase
        .from('videos')
        .select('*')
        .eq('curso_id', id);
      setVideos(videosData || []);
      console.log('Vídeos carregados:', videosData);
      // Buscar progresso do usuário para cada módulo
      const { data: progressData } = await supabase
        .from('progresso_usuario')
        .select('*')
        .eq('curso_id', id)
        .eq('usuario_id', userId);
      // Indexar por modulo_id
      const progressMap: Record<string, Database['public']['Tables']['progresso_usuario']['Row']> = {};
      (progressData || []).forEach((p) => {
        if (p.modulo_id) progressMap[p.modulo_id] = p;
      });
      setProgress(progressMap);
      setLoading(false);
    };
    fetchVideosAndProgress();
  }, [id, userId, refresh, isAdmin]);

  // Buscar média de conclusão por módulo
  useEffect(() => {
    const fetchProgress = async () => {
      if (!id) return;
      const { data } = await supabase
        .from('progresso_usuario')
        .select('modulo_id, percentual_concluido')
        .eq('curso_id', id);
      const map: Record<string, number[]> = {};
      (data || []).forEach((p: { modulo_id: string | null, percentual_concluido: number | null }) => {
        if (p.modulo_id) {
          if (!map[p.modulo_id]) map[p.modulo_id] = [];
          if (typeof p.percentual_concluido === 'number') map[p.modulo_id].push(p.percentual_concluido);
        }
      });
      const avg: Record<string, number> = {};
      Object.entries(map).forEach(([modId, arr]) => {
        avg[modId] = arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0;
      });
      setProgressAvg(avg);
    };
    if (isAdmin) fetchProgress();
  }, [id, isAdmin, refresh]);

  // Dentro do map dos módulos, filtrar vídeos pela categoria do curso
  const filteredVideos = videos.filter(v => v.categoria === currentCategory);

  // Renderização para CLIENTE
  if (!isAdmin) {
    return (
      <div className="p-4 md:p-8">
        <div className="mb-4 flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate('/treinamentos')}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
          </Button>
        </div>
        <h1 className="text-2xl font-bold mb-4">Detalhes do Curso</h1>
        <p className="mb-6">ID do curso: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{id}</span></p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {modules.map((modulo) => {
            // Buscar todos os vídeos do Supabase relacionados ao módulo
            const videosDoModulo = videos.filter(v => String(v.modulo_id).trim() === String(modulo.id).trim());
            console.log('Módulo:', modulo.id, modulo.nome_modulo, 'Vídeos deste módulo:', videosDoModulo);
            // Buscar vídeo do módulo pelo video_id (pode ser removido se não usado)
            const video = videos.find(v => v.id === modulo.video_id);
            const progresso = progress[modulo.id];
            const status = progresso?.status === 'concluido' ? 'Concluído' : (progresso?.status === 'em_andamento' ? 'Em andamento' : 'Não iniciado');
            const percentual = progresso?.percentual_concluido ?? 0;
            const tempoAssistido = progresso?.tempo_total_assistido ?? 0;
            // Handler para continuar de onde parou
            const handleContinue = () => {
              const videoElem = document.getElementById(`video-player-${modulo.id}`) as HTMLVideoElement | null;
              if (videoElem && progresso?.tempo_total_assistido) {
                videoElem.currentTime = progresso.tempo_total_assistido;
                videoElem.play();
              }
            };
            // Handler para marcar como concluído
            const handleMarkDone = async () => {
              if (!progresso) return;
              await supabase
                .from('progresso_usuario')
                .update({ status: 'concluido', percentual_concluido: 100 })
                .eq('id', progresso.id);
              setRefresh(r => r + 1);
            };
            return (
              <div key={modulo.id} className="bg-white rounded shadow p-6 flex flex-col items-center">
                {/* Thumbnails ou players de vídeo */}
                {videosDoModulo.length > 0 ? (
                  videosDoModulo.map(video => (
                    <div key={video.id} className="w-full mb-4 aspect-video max-w-2xl flex flex-col items-center justify-center">
                      {video.thumbnail_url && (
                        <img src={video.thumbnail_url} alt="Miniatura do vídeo" className="mb-2 rounded shadow max-h-40 object-cover" />
                      )}
                      <video
                        id={`video-player-${video.id}`}
                        src={video.url_video}
                        controls
                        className="w-full rounded-md shadow"
                        onLoadedMetadata={e => {
                          if (progresso?.tempo_total_assistido) {
                            (e.target as HTMLVideoElement).currentTime = progresso.tempo_total_assistido;
                          }
                        }}
                        onPause={async e => {
                          // Salvar progresso ao pausar
                          if (progresso) {
                            await supabase
                              .from('progresso_usuario')
                              .update({ tempo_total_assistido: (e.target as HTMLVideoElement).currentTime })
                              .eq('id', progresso.id);
                          }
                        }}
                        onEnded={async () => {
                          // Marcar como concluído automaticamente
                          if (progresso && progresso.status !== 'concluido') {
                            await supabase
                              .from('progresso_usuario')
                              .update({ status: 'concluido', percentual_concluido: 100 })
                              .eq('id', progresso.id);
                            setRefresh(r => r + 1);
                          }
                        }}
                      />
                      <div className="w-full mt-2">
                        <h3 className="text-base font-semibold text-era-dark-blue">{video.titulo}</h3>
                        <p className="text-sm text-era-gray mb-2">{video.descricao}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="w-full mb-4 p-6 bg-gray-100 text-center rounded text-gray-500 font-medium">
                    Vídeo não disponível para este módulo.
                  </div>
                )}
                {/* Título e descrição */}
                <div className="w-full">
                  <h2 className="text-lg font-bold mb-1">{modulo.nome_modulo}</h2>
                  <p className="text-gray-600 mb-2">{modulo.descricao}</p>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-1 rounded bg-gray-200 text-xs font-semibold">{status}</span>
                    <span className="text-xs text-gray-500">{percentual}% assistido</span>
                  </div>
                  {/* Botões de progresso, se desejar */}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Renderização para ADMINISTRADOR
  if (isAdmin) {
    return (
      <div className="p-4 md:p-8">
        <div className="mb-4 flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate('/treinamentos')}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
          </Button>
        </div>
        <h1 className="text-2xl font-bold mb-4">Detalhes do Curso (Admin)</h1>
        <p className="mb-6">ID do curso: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{id}</span></p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {modules.map((modulo) => {
            // Buscar todos os vídeos do Supabase relacionados ao módulo
            const videosDoModulo = videos.filter(v => String(v.modulo_id).trim() === String(modulo.id).trim());
            console.log('Módulo:', modulo.id, modulo.nome_modulo, 'Vídeos deste módulo:', videosDoModulo);
            // Buscar vídeo do módulo pelo video_id (pode ser removido se não usado)
            const video = videos.find(v => v.id === modulo.video_id);
            const progresso = progress[modulo.id];
            const status = progresso?.status === 'concluido' ? 'Concluído' : (progresso?.status === 'em_andamento' ? 'Em andamento' : 'Não iniciado');
            const percentual = progresso?.percentual_concluido ?? 0;
            const tempoAssistido = progresso?.tempo_total_assistido ?? 0;
            // Handler para continuar de onde parou
            const handleContinue = () => {
              const videoElem = document.getElementById(`video-player-${modulo.id}`) as HTMLVideoElement | null;
              if (videoElem && progresso?.tempo_total_assistido) {
                videoElem.currentTime = progresso.tempo_total_assistido;
                videoElem.play();
              }
            };
            // Handler para marcar como concluído
            const handleMarkDone = async () => {
              if (!progresso) return;
              await supabase
                .from('progresso_usuario')
                .update({ status: 'concluido', percentual_concluido: 100 })
                .eq('id', progresso.id);
              setRefresh(r => r + 1);
            };
            return (
              <div key={modulo.id} className="bg-white rounded shadow p-6 flex flex-col items-center">
                {/* Thumbnails ou players de vídeo */}
                {videosDoModulo.length > 0 ? (
                  videosDoModulo.map(video => (
                    <div key={video.id} className="w-full mb-4 aspect-video max-w-2xl flex flex-col items-center justify-center">
                      {video.thumbnail_url && (
                        <img src={video.thumbnail_url} alt="Miniatura do vídeo" className="mb-2 rounded shadow max-h-40 object-cover" />
                      )}
                      <video
                        id={`video-player-${video.id}`}
                        src={video.url_video}
                        controls
                        className="w-full rounded-md shadow"
                      />
                      <div className="w-full mt-2">
                        <h3 className="text-base font-semibold text-era-dark-blue">{video.titulo}</h3>
                        <p className="text-sm text-era-gray mb-2">{video.descricao}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="w-full mb-4 p-6 bg-gray-100 text-center rounded text-gray-500 font-medium">
                    Vídeo não disponível para este módulo.
                  </div>
                )}
                {/* Título e descrição do módulo */}
                <div className="w-full">
                  <h2 className="text-lg font-bold mb-1">{modulo.nome_modulo}</h2>
                  <p className="text-gray-600 mb-2">{modulo.descricao}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Renderização
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar estilo Udemy */}
      <aside style={{ width: 320, background: '#fff', borderRight: '1px solid #eee', padding: 24 }}>
        <Button
          variant="outline"
          className="mb-4"
          onClick={() => navigate(-1)}
        >
          ← Voltar
        </Button>
        <h2 style={{ fontWeight: 'bold', marginBottom: 16 }}>{currentCourse?.nome || 'Curso'}</h2>
        {modules.map(modulo => (
          <div key={modulo.id} style={{ marginBottom: 24 }}>
            <div style={{ fontWeight: 'bold', marginBottom: 8 }}>
              {modulo.nome_modulo}
            </div>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {(videos.filter(v => v.modulo_id === modulo.id) || []).map(video => (
                <li
                  key={video.id}
                  style={{
                    padding: 8,
                    background: selectedVideo?.id === video.id ? '#f0f0f0' : 'transparent',
                    borderRadius: 6,
                    cursor: 'pointer',
                    marginBottom: 4,
                    display: 'flex',
                    alignItems: 'center'
                  }}
                  onClick={() => setSelectedVideo(video)}
                >
                  <input
                    type="checkbox"
                    style={{ marginRight: 8 }}
                    checked={false /* Progresso local, pode salvar no banco depois */}
                    readOnly
                  />
                  <span style={{ flex: 1 }}>{video.titulo || 'Sem título'}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
        <Button
          className="bg-lime-400 hover:bg-lime-500 text-black font-bold w-full mt-4"
          onClick={() => setShowImportDialog(modules[0].id)}
        >
          Importar vídeo
        </Button>
        <Button
          variant="outline"
          className="w-full mt-2"
          onClick={() => setShowClientView(modules[0].id)}
        >
          Visualizar como Cliente
        </Button>
      </aside>
      {/* Área principal */}
      <main style={{ flex: 1, padding: 32 }}>
        {selectedVideo ? (
          <>
            {('titulo' in selectedVideo) && (
              <>
                <h1 style={{ fontSize: 24, fontWeight: 'bold' }}>{selectedVideo.titulo}</h1>
                <p style={{ color: '#666', marginBottom: 16 }}>{selectedVideo.descricao}</p>
                {selectedVideo.url_video?.includes('youtube.com') || selectedVideo.url_video?.includes('youtu.be') ? (
                  <iframe
                    width="100%"
                    height="480"
                    src={selectedVideo.url_video}
                    title={selectedVideo.titulo}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <video width="100%" height="480" src={selectedVideo.url_video} controls />
                )}
              </>
            )}
            {/* Se for um módulo, pode mostrar outras infos se desejar */}
          </>
        ) : (
          <p>Selecione um vídeo</p>
        )}
        {/* Importar vídeo */}
        {showImportDialog && (
          <form
            className="flex flex-col gap-2 mt-6 max-w-md"
            onSubmit={e => {
              e.preventDefault();
              // TODO: implementar handleImport
            }}
          >
            <input
              type="text"
              placeholder="Cole o link do vídeo do YouTube aqui"
              className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-lime-400"
              value={importUrl}
              onChange={e => setImportUrl(e.target.value)}
              required
            />
            <div className="flex gap-2">
              <Button
                type="submit"
                className="bg-lime-400 hover:bg-lime-500 text-black font-bold px-4 py-2 rounded"
              >
                Salvar
              </Button>
              <Button
                type="button"
                variant="outline"
                className="px-4 py-2 rounded"
                onClick={() => setShowImportDialog(null)}
              >
                Cancelar
              </Button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
};

export default CursoDetalhe; 