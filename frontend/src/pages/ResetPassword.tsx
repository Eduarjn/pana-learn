import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const accessToken = searchParams.get('access_token');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    if (!accessToken) {
      setError('Token de redefinição inválido.');
      setLoading(false);
      return;
    }
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setError(error.message);
    } else {
      setMessage('Senha atualizada com sucesso! Faça login novamente.');
      setTimeout(() => navigate('/'), 2000);
    }
    setLoading(false);
  };

  return (
    <div className="era-login-bg min-h-screen flex items-center justify-center p-4 relative">
      <div className="relative z-10 w-full max-w-md">
        <Card className="backdrop-blur-md bg-white/95 border-white/30 shadow-2xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-heading font-bold text-pana-indigo">Redefinir senha</CardTitle>
            <CardDescription className="text-pana-text-secondary">Digite sua nova senha abaixo</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Input
                  id="new-password"
                  name="new-password"
                  type="password"
                  placeholder="Nova senha"
                  minLength={6}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  disabled={loading}
                />
              </div>
              <Button type="submit" className="w-full era-lime-button font-semibold" disabled={loading}>
                {loading ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Atualizando...</>) : ('Atualizar senha')}
              </Button>
              {error && (
                <Alert className="bg-red-50 border-red-200">
                  <AlertDescription className="text-red-800">{error}</AlertDescription>
                </Alert>
              )}
              {message && (
                <Alert className="bg-green-50 border-green-200">
                  <AlertDescription className="text-green-800">{message}</AlertDescription>
                </Alert>
              )}
              <Button type="button" variant="ghost" className="w-full mt-2 text-pana-grape hover:text-pana-indigo" onClick={() => navigate('/')}>Voltar para login</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
