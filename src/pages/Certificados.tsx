import React from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle, Clock, PlayCircle } from 'lucide-react';

const cursos = [
  {
    nome: 'Introdução ao PABX',
    status: 'concluido',
    certificado: true,
  },
  {
    nome: 'Omnichannel',
    status: 'andamento',
    certificado: false,
  },
  {
    nome: 'Configuração Avançada',
    status: 'nao_iniciado',
    certificado: false,
  },
];

const statusEtapas = [
  { label: 'Início' },
  { label: 'Andamento' },
  { label: 'Concluído' },
];

function getEtapaStatus(status) {
  if (status === 'concluido') return 2;
  if (status === 'andamento') return 1;
  return 0;
}

const CertificadosTimeline = () => {
  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-8">Certificados dos Cursos</h1>
      <div className="space-y-8">
        {cursos.map((curso, idx) => {
          const etapa = getEtapaStatus(curso.status);
          return (
            <div key={curso.nome} className="bg-white rounded-lg shadow p-6">
              <div className="text-lg font-bold mb-2">{curso.nome}</div>
              {/* Timeline visual */}
              <div className="flex items-center justify-between mb-2">
                {statusEtapas.map((etapaObj, i) => (
                  <React.Fragment key={etapaObj.label}>
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold
                          ${i < etapa ? 'bg-lime-500' : i === etapa ? 'bg-blue-500' : 'bg-gray-300'}`}
                      >
                        {i < etapa ? '⬤' : i === etapa ? '⬤' : '○'}
                      </div>
                      <span className="text-xs mt-1 text-gray-600">{etapaObj.label}</span>
                    </div>
                    {i < statusEtapas.length - 1 && (
                      <div className={`flex-1 h-1 mx-1 ${i < etapa ? 'bg-lime-400' : 'bg-gray-200'}`}></div>
                    )}
                  </React.Fragment>
                ))}
                {/* Status final */}
                <span className="ml-4 text-lg">
                  {curso.status === 'concluido' && <span className="text-lime-600">✅</span>}
                  {curso.status === 'andamento' && <span className="text-yellow-500">⌛</span>}
                  {curso.status === 'nao_iniciado' && <span className="text-gray-400">❌</span>}
                </span>
              </div>
              {/* Botão de ação */}
              <div className="mt-4">
                {curso.status === 'concluido' ? (
                  <Button variant="default" className="bg-lime-500 hover:bg-lime-600 text-white font-bold">
                    Ver Certificado
                  </Button>
                ) : curso.status === 'andamento' ? (
                  <Button variant="outline" className="text-blue-600 border-blue-400">
                    Continuar Curso
                  </Button>
                ) : (
                  <Button variant="outline" className="text-gray-600 border-gray-400">
                    Começar Curso
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CertificadosTimeline;
