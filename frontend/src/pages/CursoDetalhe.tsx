import React, { useState, useEffect } from 'react';
import { CheckCircle, Video, Settings, Phone, PlusCircle, Star, User } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';

const mockModules = [
  {
    id: 'mod1',
    name: 'PABX',
    icon: <Video className="h-4 w-4 mr-1 text-pana-teal" />,
    videos: [
      { id: 'v1', title: 'Introdução ao PABX', description: 'Conceitos básicos e história dos sistemas PABX', youtubeId: 'dQw4w9WgXcQ', imported: true, watched: true, duracao: 12 },
      { id: 'v2', title: 'Instalação e configuração inicial', description: 'Como instalar e configurar um sistema PABX básico', youtubeId: '9bZkp7q19f0', imported: false, watched: false, duracao: 8 },
    ],
  },
  {
    id: 'mod2',
    name: 'Omnichannel',
    icon: <Video className="h-4 w-4 mr-1 text-pana-grape" />,
    videos: [
      { id: 'v3', title: 'Visão geral do omnichannel', description: 'O que é omnichannel e como aplicar', youtubeId: '', imported: false, watched: false, duracao: 15 },
    ],
  },
  {
    id: 'mod3',
    name: 'Configuração avançada',
    icon: <Settings className="h-4 w-4 mr-1 text-pana-teal" />,
    videos: [
      { id: 'v4', title: 'Ajustes avançados', description: 'Configurações avançadas para especialistas', youtubeId: '', imported: false, watched: false, duracao: 20 },
    ],
  },
];

const cursoInfo = {
  titulo: 'Curso completo de telefonia PABX',
  instrutor: 'João Silva',
  avaliacao: 4.7,
};

export default function CursoDetalhe() {
  const [selected, setSelected] = useState<{ module: number; video: number } | null>(null);

  useEffect(() => {
    if (!selected) {
      for (let m = 0; m < mockModules.length; m++) {
        for (let v = 0; v < mockModules[m].videos.length; v++) {
          const vid = mockModules[m].videos[v];
          if (vid.imported && vid.youtubeId) {
            setSelected({ module: m, video: v });
            return;
          }
        }
      }
    }
  }, [selected]);

  const currentVideo = selected ? mockModules[selected.module].videos[selected.video] : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-hero rounded-xl p-8 flex flex-col md:flex-row items-center gap-6">
        <div className="bg-white/20 rounded-full p-4">
          <Video className="w-10 h-10 text-pana-bone" />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl md:text-3xl font-heading font-bold text-pana-bone mb-2">{cursoInfo.titulo}</h1>
          <Badge className="bg-pana-teal text-white font-semibold px-3 py-1 mb-2">PABX</Badge>
          <p className="text-pana-bone/80 mb-3">Curso introdutório sobre sistemas PABX e suas funcionalidades</p>
          <div className="flex items-center gap-3">
            <span className="text-pana-bone/70 text-sm">Progresso geral:</span>
            <div className="w-40 bg-white/20 rounded-full h-2.5">
              <div className="bg-pana-teal h-2.5 rounded-full" style={{ width: '40%' }} />
            </div>
            <span className="text-pana-bone font-semibold text-sm">40%</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col md:flex-row gap-6">
        {/* Module sidebar */}
        <aside className="w-full md:w-1/3">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <h2 className="text-lg font-heading font-semibold text-pana-indigo mb-4">Módulos</h2>
            <ul className="space-y-3">
              {mockModules.map((mod, modIdx) => (
                <li key={mod.id}>
                  <div className="flex items-center gap-2 mb-1">
                    {mod.icon}
                    <span className="font-medium text-pana-text text-sm">{mod.name}</span>
                  </div>
                  {(() => {
                    const importedVideos = mod.videos.filter(v => v.imported && v.youtubeId);
                    const watchedCount = importedVideos.filter(v => v.watched).length;
                    const progress = importedVideos.length > 0 ? (watchedCount / importedVideos.length) * 100 : 0;
                    return (
                      <div className="mb-1">
                        <div className="w-full bg-gray-100 rounded-full h-1.5">
                          <div className="bg-pana-teal h-1.5 rounded-full transition-all" style={{ width: `${progress}%` }} />
                        </div>
                        <span className="text-xs text-pana-teal font-semibold">{Math.round(progress)}%</span>
                      </div>
                    );
                  })()}
                  <ul className="flex flex-col gap-1 mt-1">
                    {mod.videos.filter(vid => vid.imported && vid.youtubeId).map((vid, vidIdx) => (
                      <li
                        key={vid.id}
                        className={`flex items-center gap-2 cursor-pointer rounded-lg px-3 py-2 transition-all text-sm border ${
                          selected && selected.module === modIdx && selected.video === vidIdx
                            ? 'bg-pana-grape/10 border-pana-grape font-semibold text-pana-indigo'
                            : 'hover:bg-pana-background border-transparent text-pana-text'
                        }`}
                        onClick={() => setSelected({ module: modIdx, video: vidIdx })}
                      >
                        <Video className="h-4 w-4 text-pana-grape flex-shrink-0" />
                        <span className="truncate flex-1">{vid.title}</span>
                        <Badge className="bg-gray-100 text-pana-text-secondary font-medium text-xs">{vid.duracao} min</Badge>
                        {vid.watched && <CheckCircle className="h-4 w-4 text-pana-teal ml-1" />}
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        {/* Player */}
        <main className="flex-1 space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <div className="aspect-video bg-pana-indigo rounded-lg overflow-hidden mb-4 flex items-center justify-center">
              {currentVideo && currentVideo.youtubeId ? (
                <iframe
                  className="w-full h-full border-none"
                  src={`https://www.youtube.com/embed/${currentVideo.youtubeId}`}
                  title={currentVideo.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <span className="text-pana-bone text-lg">Selecione um vídeo para começar</span>
              )}
            </div>
            {currentVideo && (
              <>
                <h2 className="text-xl font-heading font-bold text-pana-indigo mb-1">{currentVideo.title}</h2>
                <p className="text-pana-text-secondary mb-3 text-sm">{currentVideo.description}</p>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className="bg-pana-teal h-2 rounded-full transition-all" style={{ width: currentVideo.watched ? '100%' : '0%' }} />
                </div>
              </>
            )}
          </div>

          {/* Comments */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <h3 className="text-base font-heading font-semibold text-pana-indigo mb-3">Comentários</h3>
            <p className="text-pana-text-secondary text-sm mb-3">Nenhum comentário ainda.</p>
            <div className="flex gap-2">
              <input className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pana-grape/50 focus:border-pana-grape" placeholder="Escreva um comentário..." />
              <button className="bg-pana-teal text-white font-semibold px-5 py-2 rounded-lg hover:bg-pana-teal/90 transition text-sm">Enviar</button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
