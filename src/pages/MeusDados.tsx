// Página "Meus dados" — direitos do titular dos dados (LGPD art. 18).
// O usuário pode exportar (JSON) ou excluir a própria conta.
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ERALayout } from '@/components/ERALayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Download, Trash2, ShieldCheck, AlertTriangle, Loader2, FileText } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export default function MeusDados() {
  const { userProfile, signOut } = useAuth();
  const navigate = useNavigate();
  const [exportLoading, setExportLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  const CONFIRM_PHRASE = 'EXCLUIR MINHA CONTA';

  const exportarDados = async () => {
    setExportLoading(true);
    try {
      const { data: sess } = await supabase.auth.getSession();
      const token = sess.session?.access_token;
      if (!token) throw new Error('Sessão expirada.');
      const res = await fetch('/api/user-data', {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || 'Falha ao exportar dados.');
      }
      // O endpoint já manda Content-Disposition; o blob preserva o nome
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `panalearn-meus-dados-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast({ title: '📥 Dados exportados', description: 'O download começou. Guarde o arquivo em local seguro.' });
    } catch (e: any) {
      toast({ title: '❌ Erro', description: e.message, variant: 'destructive' });
    } finally {
      setExportLoading(false);
    }
  };

  const excluirConta = async () => {
    if (deleteConfirmText.trim() !== CONFIRM_PHRASE) {
      toast({ title: 'Confirmação incorreta', description: `Digite exatamente: ${CONFIRM_PHRASE}`, variant: 'destructive' });
      return;
    }
    setDeleteLoading(true);
    try {
      const { data: sess } = await supabase.auth.getSession();
      const token = sess.session?.access_token;
      if (!token) throw new Error('Sessão expirada.');
      const res = await fetch('/api/user-data', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || 'Falha ao excluir conta.');
      toast({ title: '✅ Conta excluída', description: j.message || 'Sua conta foi removida.' });
      await signOut();
      navigate('/');
    } catch (e: any) {
      toast({ title: '❌ Erro', description: e.message, variant: 'destructive' });
      setDeleteLoading(false);
    }
  };

  return (
    <ERALayout>
      <div className="p-6 max-w-3xl mx-auto space-y-6">
        <div className="pb-6 border-b">
          <h1 className="text-[22px] font-medium text-pana-indigo">Meus dados</h1>
          <p className="text-sm mt-1 text-gray-500">
            Aqui você exerce seus direitos previstos na <strong>LGPD (Lei nº 13.709/2018)</strong> de forma autônoma.
          </p>
        </div>

        {/* Resumo da conta */}
        <Card style={{ border: '0.5px solid #e4e5f0', borderRadius: '12px' }}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldCheck className="h-4 w-4 text-pana-teal" /> Sua conta
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div><span className="text-gray-500">Nome:</span> <strong>{userProfile?.nome || '—'}</strong></div>
            <div><span className="text-gray-500">E-mail:</span> <strong>{userProfile?.email || '—'}</strong></div>
            <div><span className="text-gray-500">Tipo:</span> <strong>{userProfile?.tipo_usuario || '—'}</strong></div>
            <div><span className="text-gray-500">Status:</span> <strong>{userProfile?.status || '—'}</strong></div>
          </CardContent>
        </Card>

        {/* Exportar dados */}
        <Card style={{ border: '0.5px solid #e4e5f0', borderRadius: '12px' }}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Download className="h-4 w-4 text-blue-600" /> Exportar meus dados
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-gray-600">
              Baixe em um arquivo <strong>JSON</strong> tudo o que a PanaLearn armazena sobre você: cadastro,
              progresso em cursos, certificados, histórico do chat de suporte e logs de acesso. Útil para
              guardar uma cópia ou portar seus dados para outro serviço.
            </p>
            <div className="flex items-start gap-2 text-xs text-blue-700 bg-blue-50 rounded-lg p-3">
              <FileText className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>
                O download é gerado na hora. Trate o arquivo como confidencial — ele contém suas informações pessoais.
              </span>
            </div>
            <Button onClick={exportarDados} disabled={exportLoading} className="bg-blue-600 hover:bg-blue-700">
              {exportLoading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Gerando...</> : <><Download className="h-4 w-4 mr-2" /> Baixar meus dados (JSON)</>}
            </Button>
          </CardContent>
        </Card>

        {/* Excluir conta */}
        <Card style={{ border: '1px solid #fecaca', borderRadius: '12px', background: '#FEF2F2' }}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base text-red-700">
              <Trash2 className="h-4 w-4" /> Excluir minha conta
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-red-900">
              Esta ação <strong>não pode ser desfeita</strong>. Ao excluir, sua conta será removida do sistema
              de autenticação e seus dados pessoais serão anonimizados em até 30 dias. Registros financeiros
              podem ser mantidos por até 5 anos por exigência legal.
            </p>
            <div className="flex items-start gap-2 text-xs text-red-700 bg-red-100 rounded-lg p-3">
              <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>
                Recomendamos <strong>exportar seus dados antes</strong> caso queira manter uma cópia.
              </span>
            </div>
            <Button onClick={() => { setDeleteConfirmText(''); setShowDeleteModal(true); }} variant="destructive">
              <Trash2 className="h-4 w-4 mr-2" /> Excluir minha conta
            </Button>
          </CardContent>
        </Card>

        <p className="text-xs text-gray-400 text-center pt-2">
          Dúvidas sobre seus dados? Fale com a gente: <a href="mailto:mipanalearn@gmail.com" className="text-pana-teal">mipanalearn@gmail.com</a>
        </p>
      </div>

      {/* Modal: confirmação dupla de exclusão */}
      <Dialog open={showDeleteModal} onOpenChange={(o) => { if (!o && !deleteLoading) setShowDeleteModal(false); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-700 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" /> Confirmar exclusão da conta
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-gray-700">
              Para confirmar a exclusão, digite exatamente a frase abaixo:
            </p>
            <code className="block bg-gray-100 px-3 py-2 rounded font-mono text-sm">
              {CONFIRM_PHRASE}
            </code>
            <Label htmlFor="confirm-text" className="text-xs">Digite aqui:</Label>
            <Input
              id="confirm-text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              disabled={deleteLoading}
              autoComplete="off"
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowDeleteModal(false)} disabled={deleteLoading}>
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={excluirConta}
                disabled={deleteLoading || deleteConfirmText.trim() !== CONFIRM_PHRASE}
              >
                {deleteLoading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Excluindo...</> : 'Excluir definitivamente'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </ERALayout>
  );
}
