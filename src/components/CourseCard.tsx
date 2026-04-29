
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, BookOpen, Play, Info } from 'lucide-react';
import { Course } from '@/hooks/useCourses';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface CourseCardProps {
  course: Course;
  onStartCourse?: (courseId: string) => void;
}

export function CourseCard({ course, onStartCourse }: CourseCardProps) {
  const categoryColor = course.categorias?.cor || '#A435F0';
  const [showTooltip, setShowTooltip] = useState(false);
  const isMock = course.id?.startsWith('mock-');
  const navigate = useNavigate();

  // Debug logs para verificar o curso
  console.log('🎯 CourseCard renderizado:', {
    id: course.id,
    nome: course.nome,
    categoria: course.categoria,
    isMock: isMock,
    hasOnStartCourse: !!onStartCourse
  });

  const handleStart = () => {
    console.log('🎯 CourseCard - handleStart chamado');
    console.log('📋 Dados do curso:', {
      id: course.id,
      nome: course.nome,
      categoria: course.categoria,
      isMock: isMock
    });

    if (isMock) {
      console.log('⚠️ Curso mock, não executando ação');
      return;
    }

    if (onStartCourse) {
      console.log('✅ Chamando onStartCourse com ID:', course.id);
      onStartCourse(course.id);
    } else {
      console.log('✅ Navegando diretamente para:', `/curso/${course.id}`);
      navigate(`/curso/${course.id}`);
    }
  };

  return (
    <Card
      className="h-full transition-all duration-200 shadow-md hover:shadow-xl"
      style={{
        background: '#14213D',
        border: '1px solid rgba(252,163,17,0.16)',
        transition: 'all 0.2s ease',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.border = '1px solid rgba(252,163,17,0.40)';
        (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)';
        (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 32px rgba(252,163,17,0.18)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.border = '1px solid rgba(252,163,17,0.16)';
        (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
        (e.currentTarget as HTMLElement).style.boxShadow = '';
      }}
    >
      <CardHeader className="pb-3 rounded-t-lg" style={{ background: 'linear-gradient(to right, #08111f, #14213D, #FCA311)' }}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-bold line-clamp-2" style={{ color: '#FFFFFF' }}>
              {course.nome}
            </CardTitle>
            <CardDescription className="mt-2 font-medium line-clamp-3" style={{ color: 'rgba(229,229,229,0.90)' }}>
              {course.descricao || 'Curso de treinamento profissional'}
            </CardDescription>
          </div>
          {/* Removido badge 'Iniciante' e ícone de telefone */}
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4 text-sm" style={{ color: 'rgba(229,229,229,0.45)' }}>
            <div className="flex items-center">
              <BookOpen className="h-4 w-4 mr-1" />
              <span>Múltiplos módulos</span>
            </div>
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-1" />
              <span>2-3 horas</span>
            </div>
          </div>
        </div>
        <div className="relative group">
          <Button
            className="w-full font-bold transition-all duration-300 rounded-xl py-3 text-base flex items-center justify-center shadow-lg hover:shadow-xl"
            style={{
              background: '#FCA311',
              color: '#000000',
              fontWeight: 700,
            }}
            onClick={handleStart}
            disabled={isMock}
            onMouseEnter={() => isMock && setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            tabIndex={isMock ? -1 : 0}
            aria-disabled={isMock}
          >
            <Play className="h-4 w-4 mr-2" />
            Iniciar Curso
          </Button>
          {isMock && showTooltip && (
            <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 z-10 text-xs rounded-lg px-3 py-2 shadow-lg whitespace-nowrap flex items-center gap-1 animate-fade-in" style={{ background: '#08111f', color: '#FFFFFF' }}>
              <Info className="h-3 w-3 mr-1" />
              Curso em breve
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
