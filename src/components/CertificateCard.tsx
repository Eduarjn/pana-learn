import React from 'react';
import { Card, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ProgressStepper } from './ProgressStepper';
import { Pencil } from 'lucide-react';

interface CertificateCardProps {
  curso: { nome: string; status: string; certificado: boolean; id: string };
  isAdmin?: boolean;
  onEdit?: () => void;
  onView?: () => void;
  onStartCourse?: (id: string) => void;
}

export const CertificateCard: React.FC<CertificateCardProps> = ({ curso, isAdmin, onEdit, onView, onStartCourse }) => {
  const etapa = curso.status === 'concluido' ? 2 : curso.status === 'andamento' ? 1 : 0;
  return (
    <Card className="relative p-4 shadow-lg rounded-lg">
      {isAdmin && (
        <button
          aria-label="Editar certificado"
          className="absolute top-3 right-3 p-2 rounded-full hover:bg-gray-100 transition"
          onClick={onEdit}
        >
          <Pencil className="h-5 w-5 text-gray-500" />
        </button>
      )}
      <CardTitle className="text-lg font-semibold mb-4">{curso.nome}</CardTitle>
      <CardContent className="py-2">
        <ProgressStepper steps={["Início", "Andamento", "Concluído"]} current={etapa} />
      </CardContent>
      <CardFooter className="pt-4">
        {curso.status === 'concluido' ? (
          <Button className="bg-lime-500 hover:bg-lime-600 text-white font-bold w-full" onClick={onView}>
            Ver Certificado
          </Button>
        ) : curso.status === 'andamento' ? (
          <Button variant="outline" className="text-blue-600 border-blue-400 w-full" onClick={() => onStartCourse?.(curso.id)}>
            Continuar Curso
          </Button>
        ) : (
          <Button variant="outline" className="text-gray-600 border-gray-400 w-full" onClick={() => onStartCourse?.(curso.id)}>
            Começar Curso
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}; 