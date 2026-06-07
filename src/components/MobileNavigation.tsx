import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Home, BookOpen, FileText, Award, UserCheck, Building2,
  Cog, ChevronRight, X, Headset, LayoutTemplate,
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { ERALogo } from './ERALogo';

interface MobileNavigationProps {
  isOpen: boolean;
  onClose: () => void;
}

// Espelhar exactamente os mesmos itens do ERASidebar
const menuItems = [
  { title: 'Dashboard', icon: Home, path: '/dashboard', roles: ['admin', 'cliente', 'admin_master'] },
  { title: 'Treinamentos', icon: BookOpen, path: '/treinamentos', roles: ['admin', 'cliente', 'admin_master'] },
  { title: 'Quizzes', icon: FileText, path: '/quizzes', roles: ['admin', 'admin_master'] },
  { title: 'Certificados', icon: Award, path: '/certificados', roles: ['admin', 'cliente', 'admin_master'] },
  { title: 'Templates de cert.', icon: LayoutTemplate, path: '/admin/certificados/templates', roles: ['admin', 'admin_master'] },
  { title: 'Usuários', icon: UserCheck, path: '/usuarios', roles: ['admin', 'admin_master'] },
  { title: 'Empresas', icon: Building2, path: '/empresas', roles: ['admin_master'] },
  { title: 'Configurações', icon: Cog, path: '/configuracoes', roles: ['admin', 'cliente', 'admin_master'] },
  { title: 'Suporte SLA', icon: Headset, path: '/suporte', roles: ['admin', 'admin_master'] },
];

export const MobileNavigation: React.FC<MobileNavigationProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { userProfile } = useAuth();

  const userRole = userProfile?.tipo_usuario || 'cliente';
  const visibleItems = menuItems.filter(item => item.roles.includes(userRole));

  const handleNavigation = (path: string) => {
    navigate(path);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Drawer */}
      <div
        className="fixed left-0 top-0 h-full w-72 max-w-[85vw] shadow-2xl flex flex-col"
        style={{
          background: '#1F2041',
          animation: 'slideIn 0.25s ease-out',
        }}
      >
        <style>{`@keyframes slideIn { from { transform: translateX(-100%) } to { transform: translateX(0) } }`}</style>

        {/* Header */}
        <div className="flex items-center justify-between p-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <ERALogo size="sm" variant="full" />
          <Button variant="ghost" size="sm" onClick={onClose} className="text-white hover:bg-white/10 p-2">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Menu items */}
        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-1">
          {visibleItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => handleNavigation(item.path)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-150"
                style={{
                  background: isActive ? 'rgba(65,123,90,0.2)' : 'transparent',
                  borderLeft: isActive ? '3px solid #417B5A' : '3px solid transparent',
                  color: isActive ? '#D0CEBA' : 'rgba(255,255,255,0.7)',
                }}
              >
                <item.icon className="h-4.5 w-4.5 flex-shrink-0" style={{ width: 18, height: 18 }} />
                <span className="text-sm font-medium flex-1">{item.title}</span>
                {isActive && <ChevronRight className="h-3 w-3 opacity-50" />}
              </button>
            );
          })}
        </nav>

        {/* User footer */}
        <div className="p-4" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
              style={{ background: '#4B3F72' }}
            >
              {userProfile?.nome?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{userProfile?.nome || 'Usuário'}</p>
              <p className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.4)' }}>
                {userRole === 'admin_master' ? 'Admin Master' : userRole === 'admin' ? 'Administrador' : 'Cliente'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileNavigation;
