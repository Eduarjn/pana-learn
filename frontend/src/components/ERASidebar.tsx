
import { Home, Video, Award, BarChart3, Users, Settings, LogOut, GraduationCap, BookOpen, FileText, PieChart, UserCheck, Cog } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const menuItems = [
  { title: "Dashboard", icon: Home, path: "/dashboard", roles: ["admin", "cliente"] },
  { title: "Treinamentos", icon: BookOpen, path: "/treinamentos", roles: ["admin", "cliente"] },
  { title: "Vídeos", icon: Video, path: "/youtube", roles: ["admin", "cliente"] },
  { title: "Certificados", icon: Award, path: "/certificados", roles: ["admin", "cliente"] },
  { title: "Relatórios", icon: PieChart, path: "/relatorios", roles: ["admin"] },
  { title: "Usuários", icon: UserCheck, path: "/usuarios", roles: ["admin"] },
  { title: "Configurações", icon: Cog, path: "/configuracoes", roles: ["admin", "cliente"] },
];

export function ERASidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut, userProfile } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  // Filtrar menus baseado no tipo de usuário
  const visibleMenuItems = menuItems.filter(item => 
    userProfile?.tipo_usuario && item.roles.includes(userProfile.tipo_usuario)
  );

  return (
    <div className="flex flex-col h-full pana-gradient text-white">
      {/* Logo */}
      <div className="p-4 md:p-6 border-b border-white/20">
        <div className="flex items-center space-x-2 md:space-x-3">
          <div className="w-6 h-6 md:w-8 md:h-8 bg-pana-accent rounded-lg flex items-center justify-center">
            <img 
              src="/lovable-uploads/92441561-a944-48ee-930e-7e3b16318673.png" 
              alt="Platform Symbol" 
              className="w-3 h-3 md:w-5 md:h-5 filter invert"
            />
          </div>
          <div className="hidden sm:block">
            <h2 className="text-sm md:text-lg font-bold sidebar-text">PANA LEARN</h2>
            <p className="text-xs sidebar-text-muted">Smart Training</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 md:p-4 space-y-1 overflow-y-auto">
        {visibleMenuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Button
              key={item.path}
              variant="ghost"
              className={`w-full justify-start text-left transition-all duration-200 text-sm md:text-base p-3 md:p-4 ${
                isActive 
                  ? "nav-link active font-semibold bg-pana-accent/20 text-pana-accent border-l-4 border-pana-accent" 
                  : "nav-link hover:text-white hover:bg-white/10 font-medium"
              }`}
              onClick={() => navigate(item.path)}
            >
              <item.icon className="mr-2 md:mr-3 h-5 w-5 md:h-6 md:w-6 flex-shrink-0" />
              <span className="hidden sm:inline truncate text-base">{item.title}</span>
            </Button>
          );
        })}
      </nav>

      {/* User section */}
      <div className="p-2 md:p-4 border-t border-white/20">
        <div className="flex items-center space-x-2 md:space-x-3 mb-2 md:mb-3">
          <div className="w-6 h-6 md:w-8 md:h-8 bg-pana-accent rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-xs md:text-sm font-medium text-white">
              {userProfile?.nome ? userProfile.nome.charAt(0).toUpperCase() : 'U'}
            </span>
          </div>
          <div className="min-w-0 flex-1 hidden sm:block">
            <p className="text-xs md:text-sm font-medium sidebar-text truncate">
              {userProfile?.nome || 'Usuário'}
            </p>
            <p className="text-xs sidebar-text-muted truncate">
              {userProfile?.tipo_usuario === 'admin' ? 'Administrador' : 'Cliente'}
            </p>
          </div>
        </div>
        <Button 
          variant="ghost" 
          className="w-full justify-start nav-link hover:text-white hover:bg-white/10 text-sm md:text-base p-3 md:p-4 font-medium"
          onClick={handleSignOut}
        >
          <LogOut className="mr-2 md:mr-3 h-4 w-4 md:h-5 md:w-5 flex-shrink-0" />
          <span className="hidden sm:inline">Sair</span>
        </Button>
      </div>
    </div>
  );
}
