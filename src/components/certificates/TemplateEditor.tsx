import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { CertificateTemplate, BorderStyle } from '@/types/certificate';
import { FONT_OPTIONS } from '@/types/certificate';
import { ColorPicker } from './ColorPicker';
import { LayoutSelector } from './LayoutSelector';
import { uploadAsset } from '@/services/certificateService';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { Upload, X, Loader2, Palette, PenLine, Image } from 'lucide-react';

// ─── Shared style tokens ───────────────────────────────────────────────────────
const inputCls =
  'w-full rounded-lg px-3 py-2 text-sm border border-slate-700 bg-slate-900/60 text-white placeholder-white/30 focus:border-[#4B3F72] focus:outline-none transition-colors';
const labelCls =
  'block text-xs font-medium text-white/50 uppercase tracking-wider mb-1.5';
const sectionTitleCls =
  'text-[11px] font-semibold text-white/30 uppercase tracking-widest mb-3 mt-1';

// ─── Primitive wrappers ───────────────────────────────────────────────────────
const Field: React.FC<{ label: string; children: React.ReactNode; className?: string }> = ({
  label, children, className,
}) => (
  <div className={className}>
    <label className={labelCls}>{label}</label>
    {children}
  </div>
);

const Divider = () => <div className="border-t border-white/5 my-4" />;

// ─── Border style selector ────────────────────────────────────────────────────
const BORDERS: { id: BorderStyle; label: string }[] = [
  { id: 'none',       label: 'Nenhuma'    },
  { id: 'single',     label: 'Simples'    },
  { id: 'double',     label: 'Dupla'      },
  { id: 'ornamental', label: 'Ornamental' },
];

// ─── Toggle switch ─────────────────────────────────────────────────────────────
const Toggle: React.FC<{ label: string; checked: boolean; onChange: (v: boolean) => void }> = ({
  label, checked, onChange,
}) => (
  <div className="flex items-center justify-between py-1">
    <span className="text-sm text-white/70">{label}</span>
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="relative w-10 h-5 rounded-full transition-colors duration-200 focus:outline-none"
      style={{ background: checked ? '#417B5A' : 'rgba(255,255,255,0.15)' }}
    >
      <span
        className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200"
        style={{ transform: checked ? 'translateX(20px)' : 'none' }}
      />
    </button>
  </div>
);

// ─── Image upload ─────────────────────────────────────────────────────────────
const ImageUpload: React.FC<{
  label: string;
  value: string | null;
  onChange: (url: string | null) => void;
  type: 'logo' | 'signature';
  hint?: string;
}> = ({ label, value, onChange, type, hint }) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file: File) => {
    setUploading(true);
    try {
      const url = await uploadAsset(file, type);
      onChange(url);
      toast({ title: 'Upload concluído' });
    } catch (err: any) {
      toast({ title: 'Erro no upload', description: err.message, variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Field label={label}>
      <div
        className="border border-dashed border-slate-700 rounded-xl p-4 text-center cursor-pointer hover:border-[#4B3F72]/70 transition-colors"
        onClick={() => !uploading && fileRef.current?.click()}
      >
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }}
        />
        {uploading ? (
          <Loader2 className="w-5 h-5 animate-spin mx-auto text-white/40" />
        ) : value ? (
          <div className="flex flex-col items-center gap-2">
            <img src={value} className="h-14 object-contain rounded-lg" alt={label} />
            <div className="flex gap-3">
              <button
                type="button"
                onClick={e => { e.stopPropagation(); fileRef.current?.click(); }}
                className="text-xs text-white/40 hover:text-white transition-colors"
              >
                <Upload className="w-3 h-3 inline mr-1" />Trocar
              </button>
              <button
                type="button"
                onClick={e => { e.stopPropagation(); onChange(null); }}
                className="text-xs text-red-400/60 hover:text-red-400 transition-colors"
              >
                <X className="w-3 h-3 inline mr-1" />Remover
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1.5 py-2">
            <Upload className="w-5 h-5 text-white/20" />
            <span className="text-xs text-white/30">Clique para enviar</span>
            <span className="text-[10px] text-white/20">PNG, JPG, SVG</span>
          </div>
        )}
      </div>
      {hint && <p className="text-[10px] text-white/25 mt-1.5">{hint}</p>}
    </Field>
  );
};

// ─── Tab: Identidade ──────────────────────────────────────────────────────────
const TabIdentidade: React.FC<{
  t: Partial<CertificateTemplate>;
  patch: (p: Partial<CertificateTemplate>) => void;
}> = ({ t, patch }) => (
  <div className="space-y-4">
    <Field label="Nome do template">
      <input
        className={inputCls}
        value={t.name ?? ''}
        onChange={e => patch({ name: e.target.value })}
        placeholder="Ex.: Padrão da empresa"
      />
    </Field>

    <Field label="Nome da empresa / instituição">
      <input
        className={inputCls}
        value={t.company_name ?? ''}
        onChange={e => patch({ company_name: e.target.value })}
        placeholder="Ex.: Panalearn"
      />
    </Field>

    <ImageUpload
      label="Logo da empresa"
      value={t.company_logo_url ?? null}
      onChange={url => patch({ company_logo_url: url })}
      type="logo"
      hint="Recomendado: PNG transparente, mínimo 300 × 100 px."
    />

    <Divider />
    <p className={sectionTitleCls}>Textos do certificado</p>

    <Field label="Título (cabeçalho)">
      <input className={inputCls} value={t.header_text ?? ''} onChange={e => patch({ header_text: e.target.value })} />
    </Field>
    <Field label="Texto introdutório">
      <input className={inputCls} value={t.intro_text ?? ''} onChange={e => patch({ intro_text: e.target.value })} />
    </Field>
    <Field label="Corpo principal">
      <input className={inputCls} value={t.body_text ?? ''} onChange={e => patch({ body_text: e.target.value })} />
    </Field>
    <Field label="Rodapé">
      <input className={inputCls} value={t.footer_text ?? ''} onChange={e => patch({ footer_text: e.target.value })} />
    </Field>
  </div>
);

// ─── Tab: Visual ──────────────────────────────────────────────────────────────
const TabVisual: React.FC<{
  t: Partial<CertificateTemplate>;
  patch: (p: Partial<CertificateTemplate>) => void;
}> = ({ t, patch }) => (
  <div className="space-y-5">
    <Field label="Layout">
      <LayoutSelector
        value={(t.layout_type as any) ?? 'classic'}
        onChange={v => patch({ layout_type: v })}
        primaryColor={t.primary_color}
        secondaryColor={t.secondary_color}
      />
    </Field>

    <Divider />
    <p className={sectionTitleCls}>Cores</p>

    <ColorPicker
      label="Cor primária"
      value={t.primary_color ?? '#4B3F72'}
      onChange={v => patch({ primary_color: v })}
      description="Usada em títulos, bordas e destaque principal"
    />
    <ColorPicker
      label="Cor secundária"
      value={t.secondary_color ?? '#417B5A'}
      onChange={v => patch({ secondary_color: v })}
      description="Usada em elementos de suporte e nomes de cursos"
    />
    <ColorPicker
      label="Fundo do certificado"
      value={t.background_color ?? '#FFFFFF'}
      onChange={v => patch({ background_color: v })}
    />
    <ColorPicker
      label="Cor do texto"
      value={t.text_color ?? '#1F2937'}
      onChange={v => patch({ text_color: v })}
    />

    <Divider />
    <p className={sectionTitleCls}>Tipografia</p>

    <Field label="Fonte">
      <select
        value={t.font_family ?? 'Georgia'}
        onChange={e => patch({ font_family: e.target.value })}
        className="w-full rounded-lg px-3 py-2 text-sm border border-slate-700 bg-slate-900 text-white focus:border-[#4B3F72] focus:outline-none"
      >
        {FONT_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
      </select>
    </Field>

    <div className="grid grid-cols-3 gap-2">
      {([
        ['Título (px)', 'font_size_title', 24, 72],
        ['Nome (px)',   'font_size_name',  14, 56],
        ['Corpo (px)',  'font_size_body',  10, 24],
      ] as [string, keyof CertificateTemplate, number, number][]).map(([label, key, min, max]) => (
        <Field key={String(key)} label={label}>
          <input
            type="number" min={min} max={max}
            value={(t as any)[key] ?? 36}
            onChange={e => patch({ [key]: +e.target.value })}
            className={inputCls + ' text-center'}
          />
        </Field>
      ))}
    </div>

    <Divider />
    <p className={sectionTitleCls}>Decoração</p>

    <Toggle
      label="Exibir borda"
      checked={t.show_border ?? true}
      onChange={v => patch({ show_border: v })}
    />

    {t.show_border && (
      <>
        <Field label="Estilo da borda">
          <div className="flex gap-1.5 flex-wrap">
            {BORDERS.map(b => (
              <button
                key={b.id}
                type="button"
                onClick={() => patch({ border_style: b.id })}
                className="px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors"
                style={
                  t.border_style === b.id
                    ? { borderColor: '#4B3F72', background: 'rgba(75,63,114,0.2)', color: '#C4B5FD' }
                    : { borderColor: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.4)' }
                }
              >
                {b.label}
              </button>
            ))}
          </div>
        </Field>
        <ColorPicker
          label="Cor da borda"
          value={t.border_color ?? '#4B3F72'}
          onChange={v => patch({ border_color: v })}
        />
      </>
    )}

    <Toggle
      label="Marca d'água"
      checked={t.show_watermark ?? false}
      onChange={v => patch({ show_watermark: v })}
    />
  </div>
);

// ─── Tab: Assinatura ──────────────────────────────────────────────────────────
const TabAssinatura: React.FC<{
  t: Partial<CertificateTemplate>;
  patch: (p: Partial<CertificateTemplate>) => void;
}> = ({ t, patch }) => (
  <div className="space-y-4">
    <Field label="Nome do signatário">
      <input
        className={inputCls}
        value={t.signature_name ?? ''}
        onChange={e => patch({ signature_name: e.target.value })}
        placeholder="Ex.: Sabrina Coghe"
      />
    </Field>
    <Field label="Cargo / função">
      <input
        className={inputCls}
        value={t.signature_role ?? ''}
        onChange={e => patch({ signature_role: e.target.value })}
        placeholder="Ex.: Diretora Acadêmica"
      />
    </Field>
    <ImageUpload
      label="Imagem da assinatura"
      value={t.signature_image_url ?? null}
      onChange={url => patch({ signature_image_url: url })}
      type="signature"
      hint="Se não enviada, será exibida uma linha de assinatura abaixo do nome."
    />
  </div>
);

// ─── Props ─────────────────────────────────────────────────────────────────────
interface Props {
  value: Partial<CertificateTemplate>;
  onChange: (patch: Partial<CertificateTemplate>) => void;
  saving?: boolean;
  onSave?: () => void;
  onCancel?: () => void;
}

// ─── Tab definitions ──────────────────────────────────────────────────────────
type Tab = 'identidade' | 'visual' | 'assinatura';
const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'identidade', label: 'Identidade', icon: <Image   className="w-3.5 h-3.5" /> },
  { id: 'visual',     label: 'Visual',     icon: <Palette className="w-3.5 h-3.5" /> },
  { id: 'assinatura', label: 'Assinatura', icon: <PenLine className="w-3.5 h-3.5" /> },
];

// ─── Main export ───────────────────────────────────────────────────────────────
export const TemplateEditor: React.FC<Props> = ({
  value, onChange, saving, onSave, onCancel,
}) => {
  const [activeTab, setActiveTab] = useState<Tab>('identidade');
  const patch = (p: Partial<CertificateTemplate>) => onChange({ ...value, ...p });

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Tab bar */}
      <div
        className="flex flex-shrink-0 px-3 pt-3 gap-0.5"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        {TABS.map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-t-lg transition-all"
            style={
              activeTab === tab.id
                ? { background: 'rgba(255,255,255,0.06)', color: '#fff', borderBottom: '2px solid #4B3F72', marginBottom: -1 }
                : { color: 'rgba(255,255,255,0.35)' }
            }
          >
            {tab.icon}{tab.label}
          </button>
        ))}
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto px-4 py-4 min-h-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
          >
            {activeTab === 'identidade' && <TabIdentidade t={value} patch={patch} />}
            {activeTab === 'visual'     && <TabVisual     t={value} patch={patch} />}
            {activeTab === 'assinatura' && <TabAssinatura t={value} patch={patch} />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer actions */}
      {(onSave || onCancel) && (
        <div
          className="flex-shrink-0 flex gap-2 p-4"
          style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
        >
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 h-9 rounded-xl text-sm font-medium text-white/50 hover:text-white transition-colors border border-white/10 hover:border-white/20"
            >
              Cancelar
            </button>
          )}
          {onSave && (
            <Button
              onClick={onSave}
              disabled={saving}
              className="flex-1 h-9 text-white font-semibold text-sm rounded-xl"
              style={{ background: 'linear-gradient(135deg, #4B3F72, #417B5A)' }}
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : null}
              {saving ? 'Salvando…' : 'Salvar template'}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default TemplateEditor;
