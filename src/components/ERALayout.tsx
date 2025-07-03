import { useState } from 'react';
import { SidebarProvider } from "@/components/ui/sidebar";
import { ERASidebar } from "@/components/ERASidebar";
import { Button } from "@/components/ui/button";
import { Menu, X, GraduationCap, Mail, Phone, MapPin } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useAuth } from '@/hooks/useAuth';

interface ERALayoutProps {
  children: React.ReactNode;
}

export function ERALayout({ children }: ERALayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const { userProfile } = useAuth();

  const handleContactClick = () => {
    setShowContactModal(true);
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-era-light-gray-2">
        {/* Mobile sidebar overlay */}
        <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
          <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <div className="fixed left-0 top-0 h-full w-64 shadow-xl">
            <div className="flex items-center justify-between p-4 border-b border-white/20 era-gradient">
              <div className="flex items-center space-x-2">
                <GraduationCap className="h-8 w-8 text-era-lime" />
                <span className="text-xl font-bold sidebar-text">PANA LEARN</span>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(false)} className="text-white hover:bg-white/10">
                <X className="h-4 w-4" />
              </Button>
            </div>
            <ERASidebar />
          </div>
        </div>

        {/* Desktop sidebar */}
        <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
          <ERASidebar />
        </div>

        {/* Main content */}
        <div className="flex-1 lg:pl-64">
          {/* Top bar */}
          <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between lg:px-6 shadow-sm">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden text-era-text-primary hover:bg-gray-100"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              <div className="flex items-center space-x-2 lg:hidden">
                <GraduationCap className="h-6 w-6 text-era-lime" />
                <span className="text-lg font-bold text-era-text-primary">PANA LEARN</span>
              </div>
              <h1 className="text-xl font-bold text-neutral-900 hidden lg:block">
                Plataforma de Treinamento Corporativo
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button 
                className="bg-era-blue hover:bg-era-dark-green text-white font-medium px-6 py-2 rounded-full shadow-sm transition-colors"
                onClick={handleContactClick}
              >
                Fale conosco
              </Button>
              <div className="text-sm text-era-gray">
                Bem-vindo, <span className="font-medium text-era-blue">{userProfile?.nome || 'Usuário'}</span>
              </div>
            </div>
          </div>

          {/* Page content */}
          <main className="p-4 lg:p-6">
            {children}
          </main>
        </div>

        {/* Contact Modal */}
        <Dialog open={showContactModal} onOpenChange={setShowContactModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-center text-xl font-bold text-era-blue">
                Entre em Contato
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <Mail className="h-5 w-5 text-era-lime" />
                <div>
                  <p className="font-medium">Email</p>
                  <p className="text-sm text-gray-600">contato@panalearn.com</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <Phone className="h-5 w-5 text-era-lime" />
                <div>
                  <p className="font-medium">Telefone</p>
                  <p className="text-sm text-gray-600">+55 (11) 99999-9999</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <MapPin className="h-5 w-5 text-era-lime" />
                <div>
                  <p className="font-medium">Endereço</p>
                  <p className="text-sm text-gray-600">Rua das Empresas, 123 - São Paulo/SP</p>
                </div>
              </div>
              <div className="text-center p-4 bg-era-blue/10 rounded-lg">
                <p className="text-sm text-era-dark-green">
                  <strong>Horário de Atendimento:</strong><br />
                  Segunda a Sexta: 8h às 18h<br />
                  Sábado: 9h às 13h
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setShowContactModal(false)}
                className="w-full"
              >
                Fechar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </SidebarProvider>
  );
}
