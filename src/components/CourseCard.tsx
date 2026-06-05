import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, BookOpen, Play } from 'lucide-react';
import { Course } from '@/hooks/useCourses';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

interface CourseCardProps {
  course: Course;
  onStartCourse?: (courseId: string) => void;
}

export function CourseCard({ course, onStartCourse }: CourseCardProps) {
  const [hovered, setHovered] = useState(false);
  const isMock = course.id?.startsWith('mock-');
  const navigate = useNavigate();

  const handleStart = () => {
    if (isMock) return;
    if (onStartCourse) {
      onStartCourse(course.id);
    } else {
      navigate(`/curso/${course.id}`);
    }
  };

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.015 }}
      transition={{ type: 'spring', stiffness: 340, damping: 26 }}
      className="h-full"
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
    >
      <Card
        className="h-full overflow-hidden"
        style={{
          background: '#1F2041',
          border: hovered
            ? '1px solid rgba(75,63,114,0.7)'
            : '1px solid rgba(75,63,114,0.25)',
          boxShadow: hovered
            ? '0 12px 40px rgba(31,32,65,0.55), 0 0 0 1px rgba(75,63,114,0.35)'
            : '0 4px 16px rgba(0,0,0,0.22)',
          transition: 'border 0.25s, box-shadow 0.25s',
          borderRadius: 16,
        }}
      >
        {/* Header com gradiente do design system */}
        <CardHeader
          className="pb-4"
          style={{
            background: 'linear-gradient(135deg, #1F2041 0%, #4B3F72 100%)',
            borderBottom: '1px solid rgba(75,63,114,0.3)',
          }}
        >
          {/* Pill de categoria */}
          <div className="mb-2">
            <span
              className="text-xs font-semibold uppercase tracking-widest px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(65,123,90,0.22)', color: '#D0CEBA', border: '1px solid rgba(65,123,90,0.4)' }}
            >
              {course.categoria}
            </span>
          </div>

          <CardTitle className="text-base font-bold line-clamp-2 leading-snug" style={{ color: '#FFFFFF' }}>
            {course.nome}
          </CardTitle>
          <CardDescription className="mt-1.5 text-xs line-clamp-2 leading-relaxed" style={{ color: 'rgba(208,206,186,0.75)' }}>
            {course.descricao || 'Curso de treinamento profissional'}
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-4" style={{ background: '#1F2041' }}>
          {/* Meta */}
          <div className="flex items-center gap-4 mb-5 text-xs" style={{ color: 'rgba(208,206,186,0.5)' }}>
            <span className="flex items-center gap-1">
              <BookOpen className="h-3.5 w-3.5" />
              Múltiplos módulos
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              2-3 horas
            </span>
          </div>

          {/* Botão CTA */}
          <motion.div whileTap={{ scale: 0.97 }}>
            <Button
              className="w-full font-semibold rounded-xl py-2.5 flex items-center justify-center gap-2 transition-all duration-200"
              style={{
                background: isMock ? 'rgba(65,123,90,0.35)' : '#417B5A',
                color: isMock ? 'rgba(208,206,186,0.5)' : '#FFFFFF',
                border: 'none',
                boxShadow: isMock ? 'none' : '0 4px 14px rgba(65,123,90,0.35)',
                cursor: isMock ? 'not-allowed' : 'pointer',
              }}
              onClick={handleStart}
              disabled={isMock}
              tabIndex={isMock ? -1 : 0}
            >
              <Play className="h-4 w-4" />
              {isMock ? 'Em breve' : 'Iniciar Curso'}
            </Button>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
