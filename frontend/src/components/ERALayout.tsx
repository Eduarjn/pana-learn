import { useState } from 'react';
import { SidebarProvider } from "@/components/ui/sidebar";
import { ERASidebar } from "@/components/ERASidebar";
import { Button } from "@/components/ui/button";
import { Menu, X, ChevronRight } from "lucide-react";
import { useBranding } from '@/context/BrandingContext';

interface ERALayoutProps {
  children: React.ReactNode;
  breadcrumbs?: string[];
  cursoNome?: string;
  userNome?: string;
}

export function ERALayout({ children, breadcrumbs = [], cursoNome = '', userNome = 'Admin' }: ERALayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { branding } = useBranding();

  const defaultLogo = "/era-logo.png";
  const currentLogo = branding.logo_url || defaultLogo;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-pana-background font-sans">
        {/* Mobile sidebar overlay */}
        <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <div className="fixed left-0 top-0 h-full w-64 shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-white/10 bg-pana-indigo">
              <img src={currentLogo} alt="Logo da empresa" className="h-8 w-24 object-contain" />
              <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(false)} className="text-pana-bone hover:bg-white/[0.07]">
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
          <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between lg:px-6 shadow-sm sticky top-0 z-30">
            {/* Left: mobile menu */}
            <div className="flex items-center space-x-4 min-w-0">
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden text-pana-indigo hover:bg-pana-background"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              <div className="flex items-center space-x-2 lg:hidden">
                <img src={currentLogo} alt="Logo da empresa" className="h-8 max-w-[120px] object-contain" />
              </div>
            </div>

            {/* Center: breadcrumbs */}
            <div className="flex-1 flex justify-center min-w-0">
              {breadcrumbs.length > 0 ? (
                <nav className="flex items-center space-x-2 text-sm text-pana-text font-medium truncate">
                  {breadcrumbs.map((crumb, idx) => (
                    <span key={idx} className={`truncate ${idx === breadcrumbs.length - 1 ? 'text-pana-indigo font-semibold' : 'text-pana-text-secondary'}`}>
                      {crumb}
                      {idx < breadcrumbs.length - 1 && <ChevronRight className="inline mx-1 h-4 w-4 text-pana-text-secondary align-middle" />}
                    </span>
                  ))}
                </nav>
              ) : (
                <img src={currentLogo} alt="Logo da empresa" className="h-10 max-w-[200px] object-contain mx-auto hidden lg:block" />
              )}
            </div>

            {/* Right: CTA + profile */}
            <div className="flex items-center space-x-4">
              <Button className="bg-pana-teal text-white font-semibold px-5 py-2 rounded-lg hover:bg-pana-teal/90 transition-all duration-200 text-sm">
                Fale conosco
              </Button>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full bg-pana-grape flex items-center justify-center text-pana-petal text-sm font-semibold">
                  {userNome?.charAt(0).toUpperCase() || 'A'}
                </div>
                <span className="text-sm text-pana-text font-medium truncate max-w-[120px] hidden sm:inline">{userNome}</span>
              </div>
            </div>
          </div>

          {/* Page content */}
          <main className="p-4 lg:p-6 bg-pana-background min-h-screen">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
