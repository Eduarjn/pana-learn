import React, { useState } from 'react';
import { CheckCircle, Video, Settings, Phone, PlusCircle, Star, User } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '../components/ui/accordion';
import { Badge } from '../components/ui/badge';

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
        duracao: 12,
      },
      {
        id: 'v2',
        title: 'Instalação e Configuração Inicial',
        description: 'Como instalar e configurar um sistema PABX básico',
        youtubeId: '9bZkp7q19f0',
        imported: false,
        watched: false,
        duracao: 8,
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
        duracao: 15,
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
        duracao: 20,
      },
    ],
  },
];

const cursoInfo = {
  titulo: 'Curso Completo de Telefonia PABX',
  instrutor: 'João Silva',
  avaliacao: 4.7,
  imagem: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=800&q=80',
  publico: 'Técnicos, Empresas, Iniciantes',
};

export default function CursoDetalhe() {
  const [selected, setSelected] = useState<{ module: number; video: number } | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [youtubeLink, setYoutubeLink] = useState('');

  // Calcular tempo total e número de aulas
  const tempoTotal = mockModules.reduce((acc, m) => acc + m.videos.reduce((a, v) => a + (v.duracao || 0), 0), 0);
  const numAulas = mockModules.reduce((acc, m) => acc + m.videos.length, 0);

  // Aula selecionada
  const currentVideo = selected ? mockModules[selected.module].videos[selected.video] : null;

  const handleImport = () => {
    setShowImport(false);
    setYoutubeLink('');
    alert('Vídeo importado! (mock)');
  };

  return (
    <div className="min-h-screen bg-pana-background flex flex-col">
      {/* Banner do curso */}
      <div className="relative w-full h-64 md:h-80 flex items-center justify-center bg-gray-200 overflow-hidden">
        <img src={cursoInfo.imagem} alt="Banner do curso" className="absolute inset-0 w-full h-full object-cover opacity-80" />
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between w-full max-w-6xl px-8">
          <div className="flex-1 text-center md:text-left py-6">
            <h1 className="text-3xl md:text-4xl font-bold text-white drop-shadow mb-2">{cursoInfo.titulo}</h1>
            <div className="flex items-center justify-center md:justify-start gap-4 mb-2">
              <span className="flex items-center gap-1 text-white/90"><User className="h-5 w-5" /> {cursoInfo.instrutor}</span>
              <span className="flex items-center gap-1 text-yellow-300 font-semibold">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`h-5 w-5 ${i < Math.round(cursoInfo.avaliacao) ? 'fill-yellow-300' : 'stroke-yellow-300'}`} fill={i < Math.round(cursoInfo.avaliacao) ? '#FACC15' : 'none'} />
                ))}
                <span className="ml-1 text-white/80 text-sm">{cursoInfo.avaliacao.toFixed(1)}</span>
              </span>
            </div>
            <Button className="mt-2 bg-lime-400 hover:bg-lime-500 text-black font-bold px-6 py-2 rounded shadow-lg">Iniciar curso</Button>
          </div>
          {/* Badges info */}
          <div className="flex flex-col gap-2 items-center md:items-end mt-6 md:mt-0">
            <Badge className="bg-blue-100 text-blue-800 font-semibold px-4 py-2">{tempoTotal} min de conteúdo</Badge>
            <Badge className="bg-purple-100 text-purple-800 font-semibold px-4 py-2">{numAulas} aulas</Badge>
            <Badge className="bg-green-100 text-green-800 font-semibold px-4 py-2">Público: {cursoInfo.publico}</Badge>
          </div>
        </div>
      </div>

      {/* Grade de módulos/aulas */}
      <div className="max-w-6xl mx-auto w-full px-4 py-10">
        <h2 className="text-2xl font-bold mb-6">Conteúdo do Curso</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockModules.map((mod, modIdx) => (
            <Accordion type="single" collapsible key={mod.id} className="bg-white rounded-lg shadow p-4">
              <AccordionItem value={mod.id}>
                <AccordionTrigger className="font-semibold text-lg flex items-center gap-2">
                  {mod.icon} {mod.name}
                </AccordionTrigger>
                <AccordionContent>
                  <ul className="flex flex-col gap-2 mt-2">
                    {mod.videos.map((vid, vidIdx) => (
                      <li
                        key={vid.id}
                        className={`flex items-center gap-2 cursor-pointer rounded px-2 py-2 transition-colors border ${selected && selected.module === modIdx && selected.video === vidIdx ? 'bg-blue-50 border-blue-400 font-bold' : 'hover:bg-gray-100 border-transparent'}`}
                        onClick={() => setSelected({ module: modIdx, video: vidIdx })}
                      >
                        <Video className="h-4 w-4 text-blue-400" />
                        <span className="truncate flex-1">{vid.title}</span>
                        <Badge className="bg-gray-200 text-gray-700 font-medium min-w-[40px] justify-center">{vid.duracao} min</Badge>
                        {vid.watched && <CheckCircle className="h-4 w-4 text-green-500 ml-1" />}
                      </li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          ))}
        </div>
      </div>

      {/* Player e detalhes do vídeo selecionado */}
      {currentVideo && (
        <div className="w-full max-w-2xl mx-auto mb-12">
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
      )}
    </div>
  );
} 