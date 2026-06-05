import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useParams } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { EmpresaProvider } from "@/context/EmpresaContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Treinamentos from "./pages/Treinamentos";

import Usuarios from "./pages/Usuarios";
import Configuracoes from "./pages/Configuracoes";
import Empresas from "./pages/Empresas";
import EmpresaDashboard from "./pages/EmpresaDashboard";
import NotFound from "./pages/NotFound";
import MeuPainel from "./pages/MeuPainel";
import CursoDetalhe from "./pages/CursoDetalhe";
import Certificado from "./pages/Certificado";
import Certificados from "./pages/Certificados";
import Quizzes from "./pages/Quizzes";
import { BrandingProvider } from '@/context/BrandingContext';
import { SidebarProvider } from '@/context/SidebarContext';
import { TestComponent } from '@/components/TestComponent';
import { CadastroTest } from '@/components/CadastroTest';
import ResetPassword from '@/pages/ResetPassword';
import Onboarding from '@/pages/Onboarding';
import OnboardingSucesso from '@/pages/OnboardingSucesso';
import PlanoExpirado from '@/pages/PlanoExpirado';
import { ImageDiagnostic } from '@/components/ImageDiagnostic';
import GerenciarOrdemVideos from '@/pages/admin/GerenciarOrdemVideos';
import CertificateTemplates from '@/pages/admin/CertificateTemplates';
import ValidarCertificado from '@/pages/ValidarCertificado';
import { runDiagnostics } from '@/utils/debug-env';
import { ThemeProvider } from "@/components/theme-provider";
// import AIModulePage from '@/pages/admin/ai';

const queryClient = new QueryClient();

const ClienteRedirect = () => {
  const { id } = useParams();
  return <Navigate to={`/empresa/${id}`} replace />;
};

const App = () => {
  // Executar diagnóstico em desenvolvimento
  if (import.meta.env.DEV) {
    console.log('🔍 Modo desenvolvimento detectado - executando diagnóstico...');
    runDiagnostics();
  }

  return (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <EmpresaProvider>
            <BrandingProvider>
              <ThemeProvider defaultTheme="light" storageKey="pana-learn-theme">
              <SidebarProvider>
                <Routes>
                {import.meta.env.DEV && <>
                  <Route path="/test" element={<TestComponent />} />
                  <Route path="/cadastro-test" element={<CadastroTest />} />
                  <Route path="/image-diagnostic" element={<ImageDiagnostic />} />
                </>}
                {/* Rotas públicas */}
                <Route path="/" element={<Landing />} />
                <Route path="/login" element={<Login />} />
                <Route path="/index" element={<Index />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/plano-expirado" element={<PlanoExpirado />} />

                {/* Onboarding (rotas públicas) */}
                <Route path="/onboarding" element={<Onboarding />} />
                <Route path="/onboarding/sucesso" element={<OnboardingSucesso />} />
                <Route path="/onboarding/pendente" element={<OnboardingSucesso />} />
                <Route path="/onboarding/pagamento" element={<Onboarding />} />

                {/* Rotas protegidas */}
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
                  path="/usuarios" 
                  element={
                    <ProtectedRoute>
                      <Usuarios />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/empresas" 
                  element={
                    <ProtectedRoute>
                      <Empresas />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/cliente/:id" 
                  element={<ClienteRedirect />} 
                />
                <Route 
                  path="/empresa/:id" 
                  element={
                    <ProtectedRoute>
                      <EmpresaDashboard />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/configuracoes" 
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
                <Route
                  path="/admin/gerenciar-ordem-videos/:cursoId"
                  element={
                    <ProtectedRoute>
                      <GerenciarOrdemVideos />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/certificados/templates"
                  element={
                    <ProtectedRoute>
                      <CertificateTemplates />
                    </ProtectedRoute>
                  }
                />
                {/* Validação pública de certificados */}
                <Route path="/validar/:codigo" element={<ValidarCertificado />} />
                {/* <Route 
                  path="/admin/ai" 
                  element={
                    <ProtectedRoute>
                      <AIModulePage />
                    </ProtectedRoute>
                  } 
                /> */}
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
              </SidebarProvider>
              </ThemeProvider>
            </BrandingProvider>
          </EmpresaProvider>
        </AuthProvider>
      </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
