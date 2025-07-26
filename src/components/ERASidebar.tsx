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
import { useState } from "react";

const menuItems = [
  { title: "Dashboard", icon: Home, path: "/dashboard", roles: ["admin", "cliente", "admin_master"] },
  { title: "Treinamentos", icon: BookOpen, path: "/treinamentos", roles: ["admin", "cliente", "admin_master"] },
  { title: "Relatórios", icon: PieChart, path: "/relatorios", roles: ["admin", "admin_master"] },
  { title: "Usuários", icon: UserCheck, path: "/usuarios", roles: ["admin", "admin_master"] },
  { title: "Domínios", icon: Globe, path: "/dominios", roles: ["admin_master"] },
  { title: "Configurações", icon: Cog, path: "/configuracoes", roles: ["admin", "cliente", "admin_master"] },
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
        className={`w-full flex items-center justify-between text-left text-sm p-3 rounded-lg transition-all duration-200 ${
          isAnySubmenuActive 
            ? 'text-green-500 bg-white/10' 
            : 'text-white hover:bg-white/10'
        }`}
        onClick={() => setOpen((v) => !v)}
        type="button"
        style={{ background: 'none' }}
      >
        <span className="flex items-center gap-3">
          <Icon className={`h-5 w-5 flex-shrink-0 ${
            isAnySubmenuActive ? 'text-green-500' : 'text-white'
          }`} />
          <span className={`${
            isAnySubmenuActive ? 'text-green-500' : 'text-white'
          }`}>{label}</span>
        </span>
        <ChevronDown className={`transition-transform duration-200 ${open ? 'rotate-180' : ''} h-4 w-4 ${
          isAnySubmenuActive ? 'text-green-500' : 'text-white'
        }`} />
      </button>
      {open && (
        <div className="pl-8 mt-1 space-y-1">
          {visibleSubmenu.map((item) => {
            const isSpecialActive = item.path === '/configuracoes/preferencias' && location.pathname === '/configuracoes';
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => `w-full block text-left text-sm p-2 rounded-md transition-all duration-200 ${
                  (isActive || isSpecialActive)
                    ? 'text-green-500 font-medium bg-white/10' 
                    : 'text-white/80 hover:text-green-500 hover:bg-white/10'
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

  const handleSignOut = async () => {
    await signOut();
  };

  const visibleMenuItems = menuItems.filter(item => 
    userProfile?.tipo_usuario && item.roles.includes(userProfile.tipo_usuario)
  );

  return (
    <div className="flex flex-col h-full bg-gray-900 text-white">
      {/* Logo ERA Learn */}
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">ERA Learn</h2>
            <p className="text-xs text-gray-400">Smart Training</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        <ul className="flex flex-col gap-2">
          {visibleMenuItems.map((item) => {
            if (item.title === "Configurações") {
              return (
                <SidebarItem
                  key={item.path}
                  icon={item.icon}
                  label={item.title}
                  userType={userProfile?.tipo_usuario}
                  submenu={[
                    { label: 'Preferências', path: '/configuracoes/preferencias' },
                    { label: 'Conta', path: '/configuracoes/conta' },
                    { label: 'White-Label', path: '/configuracoes/whitelabel', roles: ['admin'] },
                    { label: 'Certificado', path: '/configuracoes/certificado', roles: ['admin'] },
                    { label: 'Quiz de Conclusão', path: '/configuracoes/quiz', roles: ['admin'] },
                    { label: 'Integrações & API', path: '/configuracoes/integracoes', roles: ['admin'] },
                    { label: 'Segurança', path: '/configuracoes/seguranca', roles: ['admin'] },
                  ]}
                />
              );
            }
            const isActive = location.pathname === item.path;
            return (
              <li key={item.path} className="relative">
                <Button
                  variant="ghost"
                  className={`w-full justify-start text-left text-sm p-3 rounded-lg transition-all duration-200
                    ${isActive
                      ? "bg-green-500 text-white font-semibold"
                      : "text-white hover:bg-white/10"}
                  `}
                  onClick={() => navigate(item.path)}
                >
                  <item.icon className={`mr-3 h-5 w-5 flex-shrink-0 ${isActive ? 'text-white' : 'text-white'}`} />
                  <span className={isActive ? 'text-white' : 'text-white'}>{item.title}</span>
                </Button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User section */}
      <div className="p-4 border-t border-gray-700">
        <div className="flex items-center space-x-3 mb-3">
          <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium text-white">
              {userProfile?.nome ? userProfile.nome.charAt(0).toUpperCase() : 'U'}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-white truncate">
              {userProfile?.nome || 'Usuário'}
            </p>
            <p className="text-xs text-gray-400 truncate">
              {userProfile?.tipo_usuario === 'admin' ? 'Administrador' : 'Cliente'}
            </p>
          </div>
        </div>
        <Button 
          variant="ghost" 
          className="w-full justify-start text-white hover:bg-white/10 text-sm p-3"
          onClick={handleSignOut}
        >
          <LogOut className="mr-3 h-4 w-4" />
          Sair
        </Button>
      </div>
    </div>
  );
}
