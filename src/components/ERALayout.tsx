import { useState, useEffect } from 'react';
import { SidebarProvider } from "@/components/ui/sidebar";
import { ERASidebar } from "@/components/ERASidebar";
import { Button } from "@/components/ui/button";
import { Menu, X, GraduationCap, Mail, Phone, MapPin, MessageCircle, User, Home, ChevronRight } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useAuth } from '@/hooks/useAuth';
import { useBranding } from '@/context/BrandingContext';
import { DomainSelector } from './DomainSelector';
import { useLocation, useNavigate } from 'react-router-dom';
import { useDomain } from '@/context/DomainContext';
import { Badge } from '@/components/ui/badge';
import { ERALogo } from './ERALogo';
import { MobileNavigation } from './MobileNavigation';

interface ERALayoutProps {
  children: React.ReactNode;
}

export function ERALayout({ children }: ERALayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const { userProfile } = useAuth();
  const { branding } = useBranding();
  const location = useLocation();
  const navigate = useNavigate();
  const { activeDomain, isViewingClient, currentUserType } = useDomain();

  // Fechar sidebar automaticamente quando a rota mudar ou em desktop
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // Fechar sidebar em desktop (lg breakpoint)
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Executar imediatamente

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Garantir que sidebar esteja fechado em desktop
  const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 1024;
  const shouldShowSidebar = sidebarOpen && !isDesktop;

  // Fechar sidebar ao carregar a página
  useEffect(() => {
    setSidebarOpen(false);
  }, []);

  const handleContactClick = () => {
    setContactOpen(true);
  };

  // Gerar breadcrumbs baseado na rota atual
  const generateBreadcrumbs = () => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const breadcrumbs = [];

    // Sempre começar com o logo
    breadcrumbs.push({ name: '🏠', path: '/dashboard', icon: Home });

    // Adicionar segmentos baseados na rota
    if (pathSegments.includes('dominios')) {
      breadcrumbs.push({ name: 'Domínios', path: '/dominios' });
      
      // Se estiver visualizando um cliente específico
      if (pathSegments.includes('cliente') && activeDomain) {
        breadcrumbs.push({ 
          name: activeDomain.name, 
          path: `/cliente/${activeDomain.id}`,
          isClient: true 
        });
      }
    } else if (pathSegments.includes('dashboard')) {
      breadcrumbs.push({ name: 'Dashboard', path: '/dashboard' });
    } else if (pathSegments.includes('treinamentos')) {
      breadcrumbs.push({ name: 'Treinamentos', path: '/treinamentos' });
    } else if (pathSegments.includes('relatorios')) {
      breadcrumbs.push({ name: 'Relatórios', path: '/relatorios' });
    } else if (pathSegments.includes('usuarios')) {
      breadcrumbs.push({ name: 'Usuários', path: '/usuarios' });
    } else if (pathSegments.includes('configuracoes')) {
      breadcrumbs.push({ name: 'Configurações', path: '/configuracoes' });
    }

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gray-50">
        {/* Mobile sidebar overlay */}
        <div className={`fixed inset-0 z-50 lg:hidden ${shouldShowSidebar ? 'block' : 'hidden'}`} style={{ display: shouldShowSidebar ? 'block' : 'none' }}>
          <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <div className="fixed left-0 top-0 h-full w-80 max-w-[90vw] bg-gray-900 shadow-xl transform transition-transform duration-300 ease-in-out">
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <div className="flex items-center space-x-2">
                <ERALogo 
                  size="md" 
                  variant="full" 
                  className="flex-shrink-0"
                />
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(false)} className="text-white hover:bg-white/10">
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="overflow-y-auto h-full">
              <ERASidebar />
            </div>
          </div>
        </div>

        {/* Desktop sidebar */}
        <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
          <ERASidebar />
        </div>

        <div className="flex-1 lg:pl-64">
          {/* Top bar - Estilo ERA Learn */}
          <div className="bg-white border-b border-gray-200 px-3 lg:px-6 py-3 lg:py-4 flex items-center justify-between shadow-sm">
            <div className="flex items-center space-x-2 lg:space-x-4">
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden text-gray-600 hover:bg-gray-100 p-1.5 lg:p-2 rounded-lg border border-gray-200"
                onClick={() => setSidebarOpen(true)}
                aria-label="Abrir menu"
              >
                <Menu className="h-4 w-4 lg:h-5 lg:w-5" />
              </Button>
              
              {/* Branding ERA Learn */}
              <div className="flex items-center space-x-3">
                <div className="hidden lg:block">
                  <img 
                    src={branding.mainLogoUrl} 
                    alt="ERA Learn Logo" 
                    className="h-10 w-auto object-contain"
                  />
                  <div className="flex items-center space-x-2">
                    <p className="text-xs text-gray-500">Plataforma de Ensino</p>
                    <img 
                      src={branding.subLogoUrl} 
                      alt="ERA Learn Sub Logo" 
                      className="w-4 h-4 object-contain rounded shadow-sm"
                    />
                  </div>
                </div>
                <div className="lg:hidden flex items-center space-x-2">
                  <img 
                    src={branding.mainLogoUrl} 
                    alt="ERA Learn Logo" 
                    className="h-8 w-auto object-contain"
                  />
                  <img 
                    src={branding.subLogoUrl} 
                    alt="ERA Learn Sub Logo" 
                    className="w-3 h-3 object-contain rounded shadow-sm"
                  />
                </div>
              </div>
            </div>
            
            {/* Breadcrumbs */}
            <div className="flex-1 flex justify-center">
              <nav className="flex items-center space-x-1 lg:space-x-2 text-xs lg:text-sm">
                {breadcrumbs.map((crumb, index) => (
                  <div key={index} className="flex items-center">
                    {index > 0 && <ChevronRight className="h-3 w-3 lg:h-4 lg:w-4 text-gray-400 mx-1 lg:mx-2" />}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(crumb.path)}
                      className={`text-xs lg:text-sm hover:text-green-600 ${
                        index === breadcrumbs.length - 1 
                          ? 'text-green-600 font-semibold' 
                          : 'text-gray-600'
                      }`}
                    >
                      {crumb.icon && <crumb.icon className="h-3 w-3 lg:h-4 lg:w-4 mr-0.5 lg:mr-1" />}
                      <span className="hidden sm:inline">{crumb.name}</span>
                      {crumb.isClient && (
                        <Badge variant="outline" className="ml-1 lg:ml-2 text-xs">
                          Cliente
                        </Badge>
                      )}
                    </Button>
                  </div>
                ))}
              </nav>
            </div>
            
            {/* User Actions */}
            <div className="flex items-center space-x-2 lg:space-x-4">
              <DomainSelector />
              
              <Button 
                variant="ghost"
                className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 font-medium px-2 lg:px-4 py-2 rounded-lg flex items-center gap-1 lg:gap-2 text-xs lg:text-sm"
                onClick={handleContactClick}
              >
                <MessageCircle className="h-3 w-3 lg:h-4 lg:w-4" />
                <span className="hidden sm:inline">Fale Conosco</span>
              </Button>
              
              <div className="hidden sm:flex items-center space-x-2 text-xs lg:text-sm text-gray-600">
                <User className="h-3 w-3 lg:h-4 lg:w-4" />
                <span>Bem-vindo, <span className="font-medium text-gray-900">{userProfile?.nome || 'Usuário'}</span></span>
              </div>
            </div>
          </div>

          {/* Breadcrumb Bar */}
          {isViewingClient && activeDomain && (
            <div className="bg-blue-50 border-b border-blue-200 px-3 lg:px-6 py-2 lg:py-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0">
                <div className="flex items-center space-x-2 lg:space-x-3">
                  <div className="flex items-center space-x-1 lg:space-x-2">
                    <GraduationCap className="h-4 w-4 lg:h-5 lg:w-5 text-blue-600" />
                    <span className="text-xs lg:text-sm font-medium text-blue-800">
                      Visualizando Cliente: {activeDomain.name}
                    </span>
                  </div>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs">
                    {currentUserType === 'admin_master' ? 'Admin Master' : 'Administrador'}
                  </Badge>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/dominios')}
                  className="text-blue-600 border-blue-300 hover:bg-blue-50 text-xs lg:text-sm"
                >
                  <Home className="h-3 w-3 lg:h-4 lg:w-4 mr-1 lg:mr-2" />
                  <span className="hidden sm:inline">Voltar aos Domínios</span>
                  <span className="sm:hidden">Voltar</span>
                </Button>
              </div>
            </div>
          )}

          {/* Main Content */}
          <main className="p-3 lg:p-6">
            {children}
          </main>
        </div>
      </div>

      {/* Contact Dialog */}
      <Dialog open={contactOpen} onOpenChange={setContactOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-green-600" />
              Fale Conosco
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <Mail className="h-5 w-5 text-gray-500" />
              <div>
                <p className="font-medium">Email</p>
                <p className="text-sm text-gray-600">contato@eralearn.com</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Phone className="h-5 w-5 text-gray-500" />
              <div>
                <p className="font-medium">Telefone</p>
                <p className="text-sm text-gray-600">+55 (11) 99999-9999</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <MapPin className="h-5 w-5 text-gray-500" />
              <div>
                <p className="font-medium">Endereço</p>
                <p className="text-sm text-gray-600">Rua das Empresas, 123 - São Paulo/SP</p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setContactOpen(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mobile Navigation */}
      <MobileNavigation isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
    </SidebarProvider>
  );
}
