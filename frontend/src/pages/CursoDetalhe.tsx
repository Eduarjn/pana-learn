import React, { useState } from 'react';
import { CheckCircle, Video, Settings, Phone, PlusCircle } from 'lucide-react';
import { Button } from '../components/ui/button';

// Mock de vídeos e módulos
const mockModules = [
  {
    id: 'mod1',
    name: 'PABX',
    icon: <Phone className="h-4 w-4 mr-1 text-blue-600" />,
    videos: [
      {
        id: 'v1',
        title: 'Introdução ao PABX',
        description: 'Conceitos básicos e história dos sistemas PABX',
        youtubeId: 'dQw4w9WgXcQ',
        imported: true,
        watched: true,
      },
      {
        id: 'v2',
        title: 'Instalação e Configuração Inicial',
        description: 'Como instalar e configurar um sistema PABX básico',
        youtubeId: '9bZkp7q19f0',
        imported: false,
        watched: false,
      },
    ],
  },
  {
    id: 'mod2',
    name: 'Omnichannel',
    icon: <Video className="h-4 w-4 mr-1 text-purple-600" />,
    videos: [
      {
        id: 'v3',
        title: 'Visão Geral do Omnichannel',
        description: 'O que é Omnichannel e como aplicar',
        youtubeId: '',
        imported: false,
        watched: false,
      },
    ],
  },
  {
    id: 'mod3',
    name: 'Configuração Avançada',
    icon: <Settings className="h-4 w-4 mr-1 text-green-600" />,
    videos: [
      {
        id: 'v4',
        title: 'Ajustes Avançados',
        description: 'Configurações avançadas para especialistas',
        youtubeId: '',
        imported: false,
        watched: false,
      },
    ],
  },
];

export default function CursoDetalhe() {
  const [selected, setSelected] = useState({ module: 0, video: 0 });
  const [showImport, setShowImport] = useState(false);
  const [youtubeLink, setYoutubeLink] = useState('');

  const currentModule = mockModules[selected.module];
  const currentVideo = currentModule.videos[selected.video];

  const handleImport = () => {
    // Aqui você pode integrar com backend ou lógica real
    setShowImport(false);
    setYoutubeLink('');
    alert('Vídeo importado! (mock)');
  };

  return (
    <div className="flex min-h-screen bg-pana-background">
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r p-4 flex flex-col gap-4">
        <h2 className="text-lg font-bold mb-2">Vídeos do Curso</h2>
        <div className="flex flex-col gap-4">
          {mockModules.map((mod, modIdx) => (
            <div key={mod.id}>
              <div className="flex items-center font-semibold text-pana-text mb-1">
                {mod.icon}
                {mod.name}
              </div>
              <ul className="ml-5 flex flex-col gap-2">
                {mod.videos.map((vid, vidIdx) => (
                  <li
                    key={vid.id}
                    className={`flex items-center gap-2 cursor-pointer rounded px-2 py-1 hover:bg-pana-light-gray transition-colors ${selected.module === modIdx && selected.video === vidIdx ? 'bg-pana-light-gray font-bold' : ''}`}
                    onClick={() => setSelected({ module: modIdx, video: vidIdx })}
                  >
                    <input
                      type="checkbox"
                      checked={vid.imported}
                      readOnly
                      className="accent-pana-accent"
                    />
                    <span className="truncate">{vid.title}</span>
                    {vid.watched && <CheckCircle className="h-4 w-4 text-green-500 ml-auto" />}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </aside>

      {/* Área principal */}
      <main className="flex-1 flex flex-col items-start p-8 gap-6">
        <div className="w-full max-w-2xl">
          {/* Player */}
          <div className="aspect-video bg-black rounded-lg overflow-hidden mb-4 flex items-center justify-center">
            {currentVideo.youtubeId ? (
              <iframe
                className="w-full h-full"
                src={`https://www.youtube.com/embed/${currentVideo.youtubeId}`}
                title={currentVideo.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <span className="text-white text-lg">Vídeo não disponível</span>
            )}
          </div>
          {/* Título e descrição */}
          <h1 className="text-2xl font-bold text-pana-text mb-1">{currentVideo.title}</h1>
          <p className="text-pana-text-secondary mb-4 line-clamp-2">{currentVideo.description}</p>

          {/* Botão de importar vídeo */}
          {!currentVideo.imported && !showImport && (
            <Button
              className="bg-lime-400 hover:bg-lime-500 text-black font-bold px-6 py-2 rounded flex items-center gap-2"
              onClick={() => setShowImport(true)}
            >
              <PlusCircle className="h-5 w-5" />
              Importar vídeo
            </Button>
          )}

          {/* Campo de importação */}
          {showImport && (
            <form
              className="flex flex-col gap-2 mt-2"
              onSubmit={e => {
                e.preventDefault();
                handleImport();
              }}
            >
              <input
                type="text"
                placeholder="Cole o link do vídeo do YouTube aqui"
                className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pana-accent"
                value={youtubeLink}
                onChange={e => setYoutubeLink(e.target.value)}
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
                  onClick={() => setShowImport(false)}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  );
} 