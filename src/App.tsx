import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useParams } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { EmpresaProvider } from "@/context/EmpresaContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { BrandingProvider } from '@/context/BrandingContext';
import { SidebarProvider } from '@/context/SidebarContext';
import { ThemeProvider } from "@/components/theme-provider";
import { runDiagnostics } from '@/utils/debug-env';

// ── Páginas críticas (carregadas imediatamente) ─────────────────────────────
import Index from "./pages/Index";
import Landing from "./pages/Landing";
import NotFound from "./pages/NotFound";

// ── Páginas lazy (code-split — carregadas sob demanda) ──────────────────────
const Login = lazy(() => import("./pages/Login"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Treinamentos = lazy(() => import("./pages/Treinamentos"));
const Usuarios = lazy(() => import("./pages/Usuarios"));
const Configuracoes = lazy(() => import("./pages/Configuracoes"));
const Suporte = lazy(() => import("./pages/Suporte"));
const Empresas = lazy(() => import("./pages/Empresas"));
const EmpresaDashboard = lazy(() => import("./pages/EmpresaDashboard"));
const MeuPainel = lazy(() => import("./pages/MeuPainel"));
const CursoDetalhe = lazy(() => import("./pages/CursoDetalhe"));
const Certificado = lazy(() => import("./pages/Certificado"));
const Certificados = lazy(() => import("./pages/Certificados"));
const Quizzes = lazy(() => import("./pages/Quizzes"));
const ResetPassword = lazy(() => import("@/pages/ResetPassword"));
const Onboarding = lazy(() => import("@/pages/Onboarding"));
const OnboardingSucesso = lazy(() => import("@/pages/OnboardingSucesso"));
const PlanoExpirado = lazy(() => import("@/pages/PlanoExpirado"));
const GerenciarOrdemVideos = lazy(() => import("@/pages/admin/GerenciarOrdemVideos"));
const CertificateTemplates = lazy(() => import("@/pages/admin/CertificateTemplates"));
const ValidarCertificado = lazy(() => import("@/pages/ValidarCertificado"));
const Blog = lazy(() => import("@/pages/Blog"));

// ── Componentes de diagnóstico ──────────────────────────────────────────────
import { TestComponent } from '@/components/TestComponent';
import { CadastroTest } from '@/components/CadastroTest';
import { ImageDiagnostic } from '@/components/ImageDiagnostic';

// ── Loading fallback ────────────────────────────────────────────────────────
const PageLoader = () => (
  <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'60vh' }}>
    <div style={{ width:32, height:32, border:'3px solid #4B3F72', borderTopColor:'transparent', borderRadius:'50%', animation:'spin .7s linear infinite' }} />
    <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
  </div>
);
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
                <Suspense fallback={<PageLoader />}>
                <Routes>
                {import.meta.env.DEV && <>
                  <Route path="/test" element={<TestComponent />} />
                  <Route path="/cadastro-test" element={<CadastroTest />} />
                  <Route path="/image-diagnostic" element={<ImageDiagnostic />} />
                </>}
                {/* Rotas públicas */}
                <Route path="/" element={<Landing />} />
                <Route path="/blog" element={<Blog />} />
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
                  path="/suporte"
                  element={
                    <ProtectedRoute>
                      <Suporte />
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
                </Suspense>
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
