import { useState } from 'react';
import { SidebarProvider } from "@/components/ui/sidebar";
import { ERASidebar } from "@/components/ERASidebar";
import { Button } from "@/components/ui/button";
import { Menu, X, GraduationCap, ChevronRight } from "lucide-react";

interface ERALayoutProps {
  children: React.ReactNode;
  breadcrumbs?: string[]; // Ex: ['Cursos', 'Nome do Curso', 'Aula X']
  cursoNome?: string;
  userNome?: string;
}

export function ERALayout({ children, breadcrumbs = [], cursoNome = '', userNome = 'Admin' }: ERALayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-pana-background">
        {/* Mobile sidebar overlay */}
        <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
          <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <div className="fixed left-0 top-0 h-full w-64 shadow-xl">
            <div className="flex items-center justify-between p-4 border-b border-white/20 pana-gradient">
              <div className="flex items-center space-x-2">
                <GraduationCap className="h-8 w-8 text-pana-accent" />
                <span className="text-xl font-bold sidebar-text">PANA Learn</span>
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
          {/* Top bar fixa */}
          <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between lg:px-6 shadow-sm sticky top-0 z-30">
            {/* Esquerda: logo/menu */}
            <div className="flex items-center space-x-4 min-w-0">
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden text-pana-text hover:bg-gray-100"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              <div className="flex items-center space-x-2 lg:hidden">
                <GraduationCap className="h-6 w-6 text-pana-accent" />
                <span className="text-lg font-bold text-pana-text">PANA Learn</span>
              </div>
            </div>
            {/* Centro: breadcrumbs ou nome do curso */}
            <div className="flex-1 flex justify-center min-w-0">
              {breadcrumbs.length > 0 ? (
                <nav className="flex items-center space-x-2 text-sm text-gray-500 font-medium truncate">
                  {breadcrumbs.map((crumb, idx) => (
                    <span key={idx} className={`truncate ${idx === breadcrumbs.length - 1 ? 'text-pana-text font-semibold' : ''}`}>
                      {crumb}
                      {idx < breadcrumbs.length - 1 && <ChevronRight className="inline mx-1 h-4 w-4 text-gray-400 align-middle" />}
                    </span>
                  ))}
                </nav>
              ) : (
                <h1 className="text-xl font-semibold text-pana-text truncate">{cursoNome || 'Plataforma de Treinamento Corporativo PANA'}</h1>
              )}
            </div>
            {/* Direita: perfil */}
            <div className="flex items-center space-x-4">
              <Button className="pana-primary-button font-medium px-6 py-2 rounded-full hover:shadow-lg transition-all duration-200">
                Fale conosco
              </Button>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full bg-pana-accent flex items-center justify-center text-white font-bold">
                  {userNome?.charAt(0).toUpperCase() || 'A'}
                </div>
                <span className="text-sm text-pana-text-secondary font-medium truncate max-w-[120px]">{userNome}</span>
              </div>
            </div>
          </div>

          {/* Page content */}
          <main className="p-4 lg:p-6">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
