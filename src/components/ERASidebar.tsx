import { 
  Home, 
  Video, 
  Award, 
  BarChart3, 
  Users, 
  Settings, 
  LogOut, 
  GraduationCap, 
  BookOpen, 
  FileText, 
  PieChart, 
  UserCheck, 
  Cog,
  ChevronDown,
  Globe
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useBranding } from "@/context/BrandingContext";
import { useState } from "react";
import { ERALogo } from './ERALogo';

const menuItems = [
  { title: "Dashboard", icon: Home, path: "/dashboard", roles: ["admin", "cliente", "admin_master"] },
  { title: "Treinamentos", icon: BookOpen, path: "/treinamentos", roles: ["admin", "cliente", "admin_master"] },
  { title: "Quizzes", icon: FileText, path: "/quizzes", roles: ["admin", "admin_master"] },
  { title: "Certificados", icon: Award, path: "/certificados", roles: ["admin", "cliente", "admin_master"] },
  { title: "Relatórios", icon: PieChart, path: "/relatorios", roles: ["admin", "admin_master"] },
  { title: "Usuários", icon: UserCheck, path: "/usuarios", roles: ["admin", "admin_master"] },
  { title: "Domínios", icon: Globe, path: "/dominios", roles: ["admin_master"] },
  { 
    title: "Configurações", 
    icon: Cog, 
    path: "/configuracoes", 
    roles: ["admin", "cliente", "admin_master"],
    submenu: [
      { label: "Preferências", path: "/configuracoes/preferencias", roles: ["admin", "cliente", "admin_master"] },
      { label: "Conta", path: "/configuracoes/conta", roles: ["admin", "cliente", "admin_master"] },
      { label: "White-Label", path: "/configuracoes/whitelabel", roles: ["admin", "admin_master"] },
      { label: "Integrações & API", path: "/configuracoes/integracoes", roles: ["admin", "admin_master"] },
      { label: "Segurança", path: "/configuracoes/seguranca", roles: ["admin", "admin_master"] }
    ]
  },
];

function SidebarItem({ icon: Icon, label, submenu, userType }: { 
  icon: React.ComponentType<{ className?: string }>, 
  label: string, 
  submenu: { label: string, path: string, roles?: string[] }[],
  userType?: string 
}) {
  const location = useLocation();
  
  const visibleSubmenu = submenu.filter(item => 
    !item.roles || item.roles.includes(userType || '')
  );

  const isAnySubmenuActive = visibleSubmenu.some(item => 
    location.pathname === item.path || 
    location.pathname.startsWith(item.path + '/') ||
    (item.path === '/configuracoes/preferencias' && location.pathname === '/configuracoes')
  );

  const [open, setOpen] = useState(isAnySubmenuActive);

  return (
    <div>
      <button
        className={`w-full flex items-center justify-between text-left text-xs lg:text-sm p-2 lg:p-3 rounded-lg transition-all duration-200 ${
          isAnySubmenuActive 
            ? 'text-era-lime bg-white/10' 
            : 'text-white hover:bg-white/10'
        }`}
        onClick={() => setOpen((v) => !v)}
        type="button"
        style={{ background: 'none' }}
      >
        <span className="flex items-center gap-2 lg:gap-3">
          <Icon className={`h-4 w-4 lg:h-5 lg:w-5 flex-shrink-0 ${
            isAnySubmenuActive ? 'text-era-lime' : 'text-white'
          }`} />
          <span className={`${
            isAnySubmenuActive ? 'text-era-lime' : 'text-white'
          } truncate`}>{label}</span>
        </span>
        <ChevronDown className={`transition-transform duration-200 ${open ? 'rotate-180' : ''} h-3 w-3 lg:h-4 lg:w-4 ${
          isAnySubmenuActive ? 'text-era-lime' : 'text-white'
        }`} />
      </button>
      {open && (
        <div className="pl-6 lg:pl-8 mt-1 space-y-1">
          {visibleSubmenu.map((item) => {
            const isSpecialActive = item.path === '/configuracoes/preferencias' && location.pathname === '/configuracoes';
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => `w-full block text-left text-xs lg:text-sm p-1.5 lg:p-2 rounded-md transition-all duration-200 ${
                  (isActive || isSpecialActive)
                    ? 'text-era-lime font-medium bg-white/10' 
                    : 'text-white/80 hover:text-era-lime hover:bg-white/10'
                }`}
              >
                {item.label}
              </NavLink>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function ERASidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut, userProfile } = useAuth();
  const { branding } = useBranding();

  const handleSignOut = async () => {
    await signOut();
  };

  const visibleMenuItems = menuItems.filter(item => 
    userProfile?.tipo_usuario && item.roles.includes(userProfile.tipo_usuario)
  );



  return (
    <div className="flex flex-col h-full bg-gray-900 text-white min-h-screen">
      {/* Logo ERA Learn */}
      <div className="p-4 lg:p-6 border-b border-gray-700">
        <div className="flex items-center space-x-3">
          <ERALogo 
            size="md" 
            variant="full" 
            className="flex-shrink-0"
          />
          <div className="hidden lg:flex items-center space-x-2">
            <p className="text-xs text-gray-400">Smart Training</p>
            <img 
              src={branding.subLogoUrl} 
              alt="ERA Learn Sub Logo" 
              className="w-6 h-6 object-contain rounded shadow-sm"
            />
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 lg:p-4 space-y-1 lg:space-y-2 overflow-y-auto">
        <ul className="flex flex-col gap-1 lg:gap-2">

          
          {visibleMenuItems.map((item) => {
            // Se o item tem submenu, usar SidebarItem
            if (item.submenu) {
              return (
                <SidebarItem
                  key={item.path}
                  icon={item.icon}
                  label={item.title}
                  userType={userProfile?.tipo_usuario}
                  submenu={item.submenu}
                />
              );
            }
            
            // Se não tem submenu, renderizar normalmente
            const isActive = location.pathname === item.path;
            return (
              <li key={item.path} className="relative">
                <Button
                  variant="ghost"
                  className={`w-full justify-start text-left text-xs lg:text-sm p-2 lg:p-3 rounded-lg transition-all duration-200
                    ${isActive
                      ? "bg-era-lime text-white font-semibold"
                      : "text-white hover:bg-white/10"}
                  `}
                  onClick={() => navigate(item.path)}
                >
                  <item.icon className={`mr-2 lg:mr-3 h-4 w-4 lg:h-5 lg:w-5 flex-shrink-0 ${isActive ? 'text-white' : 'text-white'}`} />
                  <span className={`${isActive ? 'text-white' : 'text-white'} truncate`}>{item.title}</span>
                </Button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User section */}
      <div className="p-3 lg:p-4 border-t border-gray-700">
        <div className="flex items-center space-x-2 lg:space-x-3 mb-2 lg:mb-3">
          <div className="w-6 h-6 lg:w-8 lg:h-8 bg-gray-600 rounded-full flex items-center justify-center">
            <span className="text-xs lg:text-sm font-medium text-white">
              {userProfile?.nome ? userProfile.nome.charAt(0).toUpperCase() : 'U'}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs lg:text-sm font-medium text-white truncate">
              {userProfile?.nome || 'Usuário'}
            </p>
            <p className="text-xs text-gray-400 truncate">
              {userProfile?.tipo_usuario === 'admin' ? 'Administrador' : 'Cliente'}
            </p>
          </div>
        </div>
        <Button 
          variant="ghost" 
          className="w-full justify-start text-white hover:bg-white/10 text-xs lg:text-sm p-2 lg:p-3"
          onClick={handleSignOut}
        >
          <LogOut className="mr-2 lg:mr-3 h-3 w-3 lg:h-4 lg:w-4" />
          Sair
        </Button>
      </div>
    </div>
  );
}
