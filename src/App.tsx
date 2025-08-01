import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { DomainProvider } from "@/context/DomainContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Treinamentos from "./pages/Treinamentos";
import Relatorios from "./pages/Relatorios";
import Usuarios from "./pages/Usuarios";
import Configuracoes from "./pages/Configuracoes";
import Dominios from "./pages/Dominios";
import ClienteDashboard from "./pages/ClienteDashboard";
import NotFound from "./pages/NotFound";
import MeuPainel from "./pages/MeuPainel";
import CursoDetalhe from "./pages/CursoDetalhe";
import Certificado from "./pages/Certificado";
import Certificados from "./pages/Certificados";
import Quizzes from "./pages/Quizzes";
import { BrandingProvider } from '@/context/BrandingContext';
import { TestComponent } from '@/components/TestComponent';

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <DomainProvider>
            <BrandingProvider>
            <Routes>
                <Route path="/test" element={<TestComponent />} />
                <Route path="/" element={<Index />} />
                <Route 
                  path="/dashboard" 
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/treinamentos" 
                  element={
                    <ProtectedRoute>
                      <Treinamentos />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/relatorios" 
                  element={
                    <ProtectedRoute>
                      <Relatorios />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/usuarios" 
                  element={
                    <ProtectedRoute>
                      <Usuarios />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/dominios" 
                  element={
                    <ProtectedRoute>
                      <Dominios />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/cliente/:domainId" 
                  element={
                    <ProtectedRoute>
                      <ClienteDashboard />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/configuracoes/*" 
                  element={
                    <ProtectedRoute>
                      <Configuracoes />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/meu-painel" 
                  element={
                    <ProtectedRoute>
                      <MeuPainel />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/curso/:id" 
                  element={
                    <ProtectedRoute>
                      <CursoDetalhe />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/certificado/:id" 
                  element={
                    <ProtectedRoute>
                      <Certificado />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/certificados" 
                  element={
                    <ProtectedRoute>
                      <Certificados />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/quizzes" 
                  element={
                    <ProtectedRoute>
                      <Quizzes />
                    </ProtectedRoute>
                  } 
                />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
              </BrandingProvider>
            </DomainProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
);

export default App;
