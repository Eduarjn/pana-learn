import { useAuth } from '@/hooks/useAuth';
import { Users, BookOpen, Award, GraduationCap, TrendingUp, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function Dashboard() {
  const { userProfile, loading } = useAuth();
  if (loading) return null;
  const userName = userProfile?.nome || 'Usuário';
  const cursosEmAndamento = 3;

  const stats = [
    { label: 'Cursos em andamento', value: cursosEmAndamento, icon: BookOpen, color: 'bg-pana-teal' },
    { label: 'Certificados', value: 2, icon: Award, color: 'bg-pana-grape' },
    { label: 'Horas de estudo', value: '14h', icon: Clock, color: 'bg-pana-indigo' },
    { label: 'Progresso geral', value: '68%', icon: TrendingUp, color: 'bg-pana-teal' },
  ];

  return (
    <div className="space-y-6">
      {/* Hero */}
      <section className="page-hero rounded-xl flex justify-between items-center p-8 shadow-lg">
        <div>
          <h2 className="text-2xl font-heading font-bold text-pana-bone">
            Bem-vindo de volta, {userName.split(' ')[0]}!
          </h2>
          <p className="mt-2 text-pana-bone/80">
            Você tem <span className="font-semibold text-pana-petal">{cursosEmAndamento} cursos</span> em andamento.
          </p>
          <button className="mt-4 bg-pana-teal text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-pana-teal/90 transition-all duration-200 text-sm">
            Ver meus cursos
          </button>
        </div>
        <GraduationCap className="h-16 w-16 text-pana-bone/30 hidden sm:block" />
      </section>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="bg-white border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-5 flex items-center space-x-4">
              <div className={`${stat.color} w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0`}>
                <stat.icon className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-heading font-bold text-pana-indigo">{stat.value}</p>
                <p className="text-sm text-pana-text-secondary">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
