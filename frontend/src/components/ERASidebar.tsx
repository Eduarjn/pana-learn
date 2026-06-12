
import { Home, Video, Award, BarChart3, Users, LogOut, BookOpen, PieChart, UserCheck, Cog } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from '@/hooks/useAuth';
import { useBranding } from '@/context/BrandingContext';

const menuItems = [
  { title: "Dashboard", icon: Home, path: "/dashboard", roles: ["admin", "cliente", "admin_master"] },
  { title: "Treinamentos", icon: BookOpen, path: "/treinamentos", roles: ["admin", "cliente", "admin_master"] },
  { title: "Vídeos", icon: Video, path: "/youtube", roles: ["admin", "cliente", "admin_master"] },
  { title: "Certificados", icon: Award, path: "/certificados", roles: ["admin", "cliente", "admin_master"] },
  { title: "Empresas", icon: Users, path: "/empresas", roles: ["admin_master"] },
  { title: "Logs de auditoria", icon: BarChart3, path: "/audit-logs", roles: ["admin_master"] },
  { title: "Relatórios", icon: PieChart, path: "/relatorios", roles: ["admin", "admin_master"] },
  { title: "Usuários", icon: UserCheck, path: "/usuarios", roles: ["admin", "admin_master"] },
  { title: "Configurações", icon: Cog, path: "/configuracoes", roles: ["admin", "cliente", "admin_master"] },
];

export function ERASidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut, userProfile } = useAuth();
  const { branding } = useBranding();

  const handleSignOut = async () => {
    await signOut();
  };

  const visibleMenuItems = userProfile?.tipo_usuario === 'admin_master'
    ? menuItems
    : menuItems.filter(item => userProfile?.tipo_usuario && item.roles.includes(userProfile.tipo_usuario));

  const defaultLogo = "/era-logo.png";
  const currentLogo = branding.logo_url || defaultLogo;

  return (
    <div className="flex flex-col h-full bg-pana-indigo text-pana-bone font-sans">
      {/* Logo */}
      <div className="p-5 md:p-6 border-b border-white/10">
        <div className="flex items-center space-x-3">
          <img src={currentLogo} alt="Logo da empresa" className="h-10 max-w-[160px] object-contain" />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 md:p-4 space-y-1 overflow-y-auto">
        {visibleMenuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Button
              key={item.path}
              variant="ghost"
              className={`w-full justify-start text-left transition-all duration-200 text-sm p-3 rounded-lg font-medium ${
                isActive
                  ? "bg-pana-grape text-pana-petal shadow-md"
                  : "text-pana-bone hover:bg-white/[0.07]"
              }`}
              onClick={() => navigate(item.path)}
            >
              <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
              <span className="truncate">{item.title}</span>
            </Button>
          );
        })}
      </nav>

      {/* User section */}
      <div className="p-4 border-t border-white/10">
        <div className="flex items-center space-x-3 mb-3">
          <div className="w-9 h-9 bg-pana-grape rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-semibold text-pana-petal">
              {userProfile?.nome ? userProfile.nome.charAt(0).toUpperCase() : 'U'}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-pana-bone truncate">
              {userProfile?.nome ? userProfile.nome.split(' ')[0] : 'Usuário'}
            </p>
            <p className="text-xs text-pana-bone/60">
              {userProfile?.tipo_usuario === 'admin' ? 'Administrador' :
               userProfile?.tipo_usuario === 'admin_master' ? 'Admin master' : 'Cliente'}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          className="w-full justify-start text-pana-bone hover:bg-white/[0.07] text-sm p-3 font-medium"
          onClick={handleSignOut}
        >
          <LogOut className="mr-3 h-4 w-4 flex-shrink-0" />
          <span>Sair</span>
        </Button>
      </div>
    </div>
  );
}
