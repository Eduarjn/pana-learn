import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useBranding } from '@/context/BrandingContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Download, 
  Share2, 
  Linkedin, 
  Facebook, 
  Copy, 
  Check,
  ArrowLeft,
  QrCode,
  Calendar,
  User,
  Award
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { buildCertificateHTML, certRowToCertificateData, generateCertificatePDFFromData } from '@/utils/generateCertificatePDF';

interface CertificateData {
  id: string;
  usuario_id: string;
  curso_id: string;
  categoria_nome: string;
  nota: number;
  data_conclusao: string;
  certificado_url?: string;
  qr_code_url?: string;
  usuario?: {
    nome: string;
    email: string;
  };
  curso?: {
    nome: string;
    descricao?: string;
  };
}

const Certificado: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { userProfile } = useAuth();
  const { branding } = useBranding();
  const navigate = useNavigate();
  const [certificate, setCertificate] = useState<CertificateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (id) {
      loadCertificate();
    }
  }, [id]);

  const loadCertificate = async () => {
    try {
      setLoading(true);
      
      // Buscar certificado com dados do usuário, curso e template
      const { data, error } = await supabase
        .from('certificados')
        .select(`
          *,
          usuario:usuarios(nome, email),
          curso:cursos(nome, descricao),
          certificate_templates(*)
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error('Erro ao carregar certificado:', error);
        toast({
          title: "Erro",
          description: "Certificado não encontrado.",
          variant: "destructive"
        });
        navigate('/dashboard');
        return;
      }

      setCertificate(data);
    } catch (error) {
      console.error('Erro inesperado:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar certificado.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!certificate) return;
    try {
      toast({ title: 'Gerando PDF...', description: 'Aguarde um instante.' });
      await generateCertificatePDFFromData(certRowToCertificateData(certificate));
    } catch {
      toast({ title: 'Erro', description: 'Falha ao gerar PDF.', variant: 'destructive' });
    }
  };

  const handleShare = async (platform: 'linkedin' | 'facebook' | 'copy') => {
    if (!certificate) return;

    const shareUrl = `${window.location.origin}/certificado/${certificate.id}`;
    const shareText = `🎉 ${certificate.usuario?.nome} concluiu o curso ${certificate.categoria_nome} com ${certificate.nota}% de aproveitamento!`;
    
    try {
      switch (platform) {
        case 'linkedin': {
          const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(shareText)}`;
          window.open(linkedinUrl, '_blank');
          break;
        }
        
        case 'facebook': {
          const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`;
          window.open(facebookUrl, '_blank');
          break;
        }
        
        case 'copy':
          await navigator.clipboard.writeText(`${shareText}\n\n${shareUrl}`);
          setCopied(true);
          toast({
            title: "Link copiado!",
            description: "O link do certificado foi copiado para a área de transferência.",
            variant: "default"
          });
          setTimeout(() => setCopied(false), 2000);
          break;
      }
    } catch (error) {
      toast({
        title: "Erro ao compartilhar",
        description: "Não foi possível compartilhar. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando certificado...</p>
        </div>
      </div>
    );
  }

  if (!certificate) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Award className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Certificado não encontrado</h2>
          <p className="text-gray-500 mb-4">O certificado solicitado não existe ou foi removido.</p>
          <Button onClick={() => navigate('/dashboard')}>
            Voltar ao Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Button
            onClick={() => navigate('/dashboard')}
            variant="outline"
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar ao Dashboard
          </Button>
          
          <div className="flex gap-2">
            <Button
              onClick={handleDownload}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Download className="w-4 h-4 mr-2" />
              Baixar PDF
            </Button>
            
            <Button
              onClick={() => handleShare('copy')}
              variant="outline"
            >
              {copied ? (
                <Check className="w-4 h-4 mr-2" />
              ) : (
                <Copy className="w-4 h-4 mr-2" />
              )}
              {copied ? 'Copiado!' : 'Copiar Link'}
            </Button>
          </div>
        </div>

        {/* Certificado — renderizado com o MESMO template usado no download/visualização */}
        <Card className="bg-white shadow-xl border-0 overflow-hidden">
          <CardContent className="p-0">
            <iframe
              title="Certificado"
              srcDoc={buildCertificateHTML(certRowToCertificateData(certificate))}
              className="w-full border-0"
              style={{ height: 640 }}
            />
          </CardContent>
        </Card>

        {/* Botões de compartilhamento */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Share2 className="w-5 h-5" />
              Compartilhar Certificado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 justify-center">
              <Button
                onClick={() => handleShare('linkedin')}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Linkedin className="w-4 h-4 text-blue-600" />
                LinkedIn
              </Button>
              
              <Button
                onClick={() => handleShare('facebook')}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Facebook className="w-4 h-4 text-blue-600" />
                Facebook
              </Button>
              
              <Button
                onClick={() => handleShare('copy')}
                variant="outline"
                className="flex items-center gap-2"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4 text-gray-600" />
                )}
                {copied ? 'Copiado!' : 'Copiar Link'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Certificado; 