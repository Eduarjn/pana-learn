import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Home, 
  BookOpen, 
  FileText, 
  Award, 
  PieChart, 
  UserCheck, 
  Globe, 
  Cog,
  ChevronRight,
  Menu,
  X
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { ERALogo } from './ERALogo';

interface MobileNavigationProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileNavigation: React.FC<MobileNavigationProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { userProfile } = useAuth();

  const menuItems = [
    { 
      title: "Dashboard", 
      icon: Home, 
      path: "/dashboard", 
      roles: ["admin", "cliente", "admin_master"] 
    },
    { 
      title: "Treinamentos", 
      icon: BookOpen, 
      path: "/treinamentos", 
      roles: ["admin", "cliente", "admin_master"] 
    },
    { 
      title: "Quizzes", 
      icon: FileText, 
      path: "/quizzes", 
      roles: ["admin", "admin_master"] 
    },
    { 
      title: "Certificados", 
      icon: Award, 
      path: "/certificados", 
      roles: ["admin", "cliente", "admin_master"] 
    },
    { 
      title: "Relatórios", 
      icon: PieChart, 
      path: "/relatorios", 
      roles: ["admin", "admin_master"] 
    },
    { 
      title: "Usuários", 
      icon: UserCheck, 
      path: "/usuarios", 
      roles: ["admin", "admin_master"] 
    },
    { 
      title: "Domínios", 
      icon: Globe, 
      path: "/dominios", 
      roles: ["admin_master"] 
    },
    { 
      title: "Configurações", 
      icon: Cog, 
      path: "/configuracoes", 
      roles: ["admin", "cliente", "admin_master"] 
    },
  ];

  const visibleMenuItems = menuItems.filter(item => 
    userProfile?.tipo_usuario && item.roles.includes(userProfile.tipo_usuario)
  );

  const handleNavigation = (path: string) => {
    navigate(path);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      
      {/* Navigation Panel */}
      <div className="fixed left-0 top-0 h-full w-80 max-w-[90vw] bg-gray-900 shadow-xl transform transition-transform duration-300 ease-in-out">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center space-x-2">
            <ERALogo size="sm" variant="full" />
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="text-white hover:bg-white/10">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-2">
            {visibleMenuItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Card 
                  key={item.path}
                  className={`cursor-pointer transition-all duration-200 ${
                    isActive 
                      ? 'bg-era-lime text-white border-era-lime' 
                      : 'bg-white/5 text-white hover:bg-white/10 border-transparent'
                  }`}
                  onClick={() => handleNavigation(item.path)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <item.icon className={`h-4 w-4 ${
                          isActive ? 'text-white' : 'text-white/80'
                        }`} />
                        <span className={`text-sm font-medium ${
                          isActive ? 'text-white' : 'text-white/90'
                        }`}>
                          {item.title}
                        </span>
                      </div>
                      <ChevronRight className={`h-3 w-3 ${
                        isActive ? 'text-white' : 'text-white/60'
                      }`} />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* User Info */}
        <div className="p-4 border-t border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-white">
                {userProfile?.nome ? userProfile.nome.charAt(0).toUpperCase() : 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {userProfile?.nome || 'Usuário'}
              </p>
              <p className="text-xs text-gray-400 truncate">
                {userProfile?.tipo_usuario === 'admin' ? 'Administrador' : 'Cliente'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileNavigation; 