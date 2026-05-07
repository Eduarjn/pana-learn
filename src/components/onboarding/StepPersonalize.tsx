// src/components/onboarding/StepPersonalize.tsx
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Upload, Loader2 } from 'lucide-react';

const CORES_PRESET = ['#22c55e', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#000000'];

interface Props {
  data: any;
  updateData: (d: any) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function StepPersonalize({ data, updateData, onNext, onBack }: Props) {
  const [loading, setLoading] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const { toast } = useToast();

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    updateData({ logo: file });
    const reader = new FileReader();
    reader.onload = (ev) => setLogoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      let logoUrl = '';

      // Upload da logo se fornecida
      if (data.logo && data.organizationId) {
        const ext = data.logo.name.split('.').pop();
        const path = `${data.organizationId}/logo.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from('organization-assets')
          .upload(path, data.logo, { upsert: true });

        if (!uploadError) {
          const { data: urlData } = supabase.storage
            .from('organization-assets')
            .getPublicUrl(path);
          logoUrl = urlData.publicUrl;
        }
      }

      // Salvar configurações na organização
      const updatePayload: Record<string, any> = {
        primary_color: data.corPrimaria,
        platform_name: data.nomePlataforma || data.organizacaoNome,
        onboarding_step: 3,
      };
      if (logoUrl) updatePayload.logo_url = logoUrl;

      await supabase.from('organizations').update(updatePayload).eq('id', data.organizationId);

      toast({ title: '✅ Personalização salva!' });
      onNext();
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-1">Personalize sua plataforma</h2>
      <p className="text-gray-500 mb-8">Logo, cores e nome próprios. Parece que foi feito para a sua marca.</p>

      <div className="space-y-6">
        {/* Upload de logo */}
        <div>
          <Label>Logo da empresa</Label>
          <div className="mt-2 flex items-center gap-4">
            {logoPreview ? (
              <img src={logoPreview} className="w-16 h-16 object-contain rounded-lg border" alt="logo preview" />
            ) : (
              <div className="w-16 h-16 rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-400">
                <Upload className="w-6 h-6" />
              </div>
            )}
            <label className="cursor-pointer">
              <span className="text-sm text-green-600 font-medium hover:underline">
                {logoPreview ? 'Trocar logo' : 'Fazer upload da logo'}
              </span>
              <input type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
            </label>
          </div>
        </div>

        {/* Nome da plataforma */}
        <div>
          <Label>Nome da plataforma</Label>
          <Input
            className="mt-1"
            value={data.nomePlataforma}
            onChange={e => updateData({ nomePlataforma: e.target.value })}
            placeholder={data.organizacaoNome || 'Academia XPTO'}
          />
        </div>

        {/* Cor primária */}
        <div>
          <Label>Cor principal da marca</Label>
          <div className="mt-2 flex items-center gap-3">
            <div className="flex gap-2 flex-wrap">
              {CORES_PRESET.map(cor => (
                <button
                  key={cor}
                  onClick={() => updateData({ corPrimaria: cor })}
                  className={`w-8 h-8 rounded-full transition-all ${
                    data.corPrimaria === cor ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : ''
                  }`}
                  style={{ backgroundColor: cor }}
                />
              ))}
            </div>
            <input
              type="color"
              value={data.corPrimaria}
              onChange={e => updateData({ corPrimaria: e.target.value })}
              className="w-8 h-8 rounded cursor-pointer border border-gray-200"
              title="Cor personalizada"
            />
          </div>
        </div>

        {/* Preview */}
        <div className="rounded-xl p-4 border" style={{ borderColor: data.corPrimaria + '40' }}>
          <p className="text-xs text-gray-500 mb-2">Preview:</p>
          <div className="flex items-center gap-2">
            {logoPreview ? (
              <img src={logoPreview} className="w-6 h-6 object-contain" alt="logo" />
            ) : (
              <div className="w-6 h-6 rounded" style={{ backgroundColor: data.corPrimaria }} />
            )}
            <span className="font-semibold text-gray-800">
              {data.nomePlataforma || data.organizacaoNome || 'Sua Plataforma'}
            </span>
          </div>
          <Button className="mt-3 text-xs h-7 px-3 text-white" style={{ backgroundColor: data.corPrimaria }}>
            Botão de exemplo
          </Button>
        </div>
      </div>

      <div className="flex justify-between pt-6">
        <Button variant="outline" onClick={onBack}>← Voltar</Button>
        <Button onClick={handleSave} disabled={loading} className="bg-green-500 hover:bg-green-600 text-white px-8">
          {loading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Salvando...</> : 'Continuar →'}
        </Button>
      </div>
    </div>
  );
}
