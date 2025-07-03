import React, { useState, useEffect } from 'react';
import { ERALayout } from '@/components/ERALayout';
import { CertificateCard } from '@/components/CertificateCard';
import { EditCertificateModal } from '@/components/EditCertificateModal';
import { ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';

const cursosMock = [
  {
    id: '98f3a689-389c-4ded-9833-846d59fcc183',
    nome: 'Introdução ao PABX',
    status: 'concluido',
    certificado: true,
    title: 'Introdução ao PABX',
    date: '2024-06-20',
    templateFile: null,
  },
  {
    id: '6e467da3-27b4-4f2b-900f-62ae76b4db66',
    nome: 'Omnichannel',
    status: 'andamento',
    certificado: false,
    title: 'Omnichannel',
    date: '',
    templateFile: null,
  },
  {
    id: '85051bef-9c7a-41d0-a57b-d4716885ea8f',
    nome: 'Configuração Avançada',
    status: 'nao_iniciado',
    certificado: false,
    title: 'Configuração Avançada',
    date: '',
    templateFile: null,
  },
];

const isAdmin = true; // Troque para false para simular cliente

function formatDate(dateStr: string) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('pt-BR');
}

const ConcluintesReport: React.FC<{ data: any[] }> = ({ data }) => (
  <div className="mt-12">
    <div className="flex items-center gap-2 mb-2">
      <span className="bg-era-lime text-era-dark-blue text-xs font-bold px-2 py-1 rounded">Somente para Administrador</span>
      <span className="text-lg font-semibold">Relatório de Concluintes</span>
    </div>
    <div className="overflow-x-auto">
      <table className="min-w-full border rounded shadow text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2 text-left">Nome do Usuário</th>
            <th className="p-2 text-left">Título do Curso</th>
            <th className="p-2 text-left">Data de Conclusão</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} className="even:bg-gray-50">
              <td className="p-2">{row.user?.name || '-'}</td>
              <td className="p-2">{row.curso?.titulo || '-'}</td>
              <td className="p-2">{formatDate(row.concluded_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

export default function Certificados() {
  const [cursos, setCursos] = useState(cursosMock);
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [editData, setEditData] = useState({ title: '', date: '', templateFile: null as File | null });
  const [concluidores, setConcluidores] = useState<any[]>([]);
  const [search, setSearch] = useState('');

  // Buscar relatório de concluintes se admin
  useEffect(() => {
    if (isAdmin) {
      supabase
        .from('certificados')
        .select('user(name), curso(titulo), concluded_at')
        .eq('status', 'concluido')
        .order('concluded_at', { ascending: false })
        .then(({ data }) => setConcluidores(data || []));
    }
  }, []);

  const handleEdit = (idx: number) => {
    setEditIdx(idx);
    setEditData({
      title: cursos[idx].title,
      date: cursos[idx].date,
      templateFile: cursos[idx].templateFile || null,
    });
  };

  const handleSave = () => {
    if (editIdx === null) return;
    // Validação: não aceitar data futura
    if (editData.date && new Date(editData.date) > new Date()) {
      alert('A data de conclusão não pode ser futura.');
      return;
    }
    const newCursos = [...cursos];
    newCursos[editIdx] = {
      ...newCursos[editIdx],
      title: editData.title,
      date: editData.date,
      templateFile: editData.templateFile,
    };
    setCursos(newCursos);
    setEditIdx(null);
  };

  // Filtrar cursos pelo nome
  const filteredCursos = cursos.filter(c => c.nome.toLowerCase().includes(search.toLowerCase()));

  // Handler para navegação para área de treinamentos específica do curso
  const handleStartCourse = (cursoId: string) => {
    // navigate(`/curso/${cursoId}`); // This line was removed as per the edit hint
  };

  return (
    <ERALayout>
      <div className="max-w-6xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-8">Certificados dos Cursos</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCursos.map((curso) => (
            <CertificateCard
              key={curso.id}
              curso={curso}
              isAdmin={isAdmin}
              onEdit={() => handleEdit(cursos.findIndex(c => c.id === curso.id))}
              onView={() => alert('Visualizar certificado (mock)')}
              onStartCourse={handleStartCourse}
            />
          ))}
        </div>
        {/* Modal de edição inline */}
        {isAdmin && (
          <EditCertificateModal
            open={editIdx !== null}
            onClose={() => setEditIdx(null)}
            title={editData.title}
            date={editData.date}
            templateFile={editData.templateFile}
            onChange={data => setEditData(data)}
            onSave={handleSave}
          />
        )}
        {/* Barra de pesquisa para relatório de concluintes */}
        {isAdmin && (
          <div className="mb-6 max-w-xs mt-12">
            <Input
              type="text"
              placeholder="Pesquisar curso..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full"
              aria-label="Pesquisar curso"
            />
          </div>
        )}
        {/* Relatório de concluintes para admin */}
        {isAdmin && <ConcluintesReport data={concluidores.filter(row => row.curso?.titulo?.toLowerCase().includes(search.toLowerCase()))} />}
      </div>
    </ERALayout>
  );
}
