import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { cardItem, staggerContainer, fadeInUp } from '@/lib/animations';
import { ERALayout } from '@/components/ERALayout';
import { Button } from '@/components/ui/button';
import { CertificatePreview } from '@/components/certificates/CertificatePreview';
import { TemplateEditor } from '@/components/certificates/TemplateEditor';
import type { CertificateTemplate } from '@/types/certificate';
import { DEFAULT_TEMPLATE, MOCK_CERTIFICATE_DATA } from '@/types/certificate';
import {
  getTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  setDefaultTemplate,
} from '@/services/certificateService';
import { previewCertificateInNewTab } from '@/utils/generateCertificatePDF';
import { toast } from '@/hooks/use-toast';
import {
  Plus, Star, Trash2, Edit3, Download, ArrowLeft,
  MoreVertical, Copy, Check, Loader2, FileText, LayoutTemplate,
} from 'lucide-react';

// ─── helper ────────────────────────────────────────────────────────────────────
function blankDraft(): Partial<CertificateTemplate> {
  return { ...DEFAULT_TEMPLATE, name: 'Novo template' };
}

// ─── Layout badge ──────────────────────────────────────────────────────────────
const LAYOUT_LABELS: Record<string, string> = {
  classic: 'Clássico', modern: 'Moderno', minimal: 'Minimalista', corporate: 'Corporativo',
};

// ─── Three-dot menu ────────────────────────────────────────────────────────────
const ActionMenu: React.FC<{
  template: CertificateTemplate;
  onEdit: () => void;
  onSetDefault: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  loadingDefault: boolean;
}> = ({ template, onEdit, onSetDefault, onDuplicate, onDelete, loadingDefault }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative" onClick={e => e.stopPropagation()}>
      <button
        type="button"
        onClick={() => setOpen(p => !p)}
        className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-white/10 text-white/40 hover:text-white"
      >
        <MoreVertical className="w-3.5 h-3.5" />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -4 }}
              transition={{ duration: 0.12 }}
              className="absolute right-0 top-8 z-20 w-44 rounded-xl shadow-2xl overflow-hidden py-1"
              style={{ background: '#1a1d36', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              {[
                { icon: <Edit3 className="w-3.5 h-3.5" />,  label: 'Editar',          onClick: onEdit,       show: true },
                { icon: loadingDefault ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Star className="w-3.5 h-3.5" />, label: 'Definir como padrão', onClick: onSetDefault, show: !template.is_default },
                { icon: <Copy className="w-3.5 h-3.5" />,   label: 'Duplicar',        onClick: onDuplicate,  show: true },
                { icon: <Trash2 className="w-3.5 h-3.5" />, label: 'Excluir',         onClick: onDelete,     show: !template.is_default, danger: true },
              ].filter(a => a.show).map(action => (
                <button
                  key={action.label}
                  type="button"
                  onClick={() => { action.onClick(); setOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-medium transition-colors hover:bg-white/6"
                  style={{ color: (action as any).danger ? '#f87171' : 'rgba(255,255,255,0.75)' }}
                >
                  {action.icon}{action.label}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── Template card ─────────────────────────────────────────────────────────────
const TemplateCard: React.FC<{
  template: CertificateTemplate;
  isActive: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onSetDefault: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  loadingDefault: boolean;
}> = ({ template, isActive, onSelect, onEdit, onSetDefault, onDuplicate, onDelete, loadingDefault }) => (
  <motion.div
    variants={cardItem}
    onClick={onSelect}
    className="rounded-xl overflow-hidden cursor-pointer transition-all duration-200"
    style={{
      border: isActive
        ? `2px solid ${template.primary_color}`
        : '1px solid rgba(255,255,255,0.07)',
      background: isActive ? `${template.primary_color}12` : 'rgba(255,255,255,0.025)',
    }}
  >
    {/* Mini preview */}
    <div className="overflow-hidden" style={{ height: 110, background: '#0a0c1e' }}>
      <CertificatePreview template={template} data={MOCK_CERTIFICATE_DATA} scale={0.36} />
    </div>

    {/* Card footer */}
    <div className="px-3 py-2.5 flex items-center justify-between gap-2" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
      <div className="min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-semibold text-white truncate max-w-[110px]">{template.name}</span>
          {template.is_default && (
            <span className="flex items-center gap-0.5 text-[9px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0"
              style={{ background: 'rgba(65,123,90,0.2)', color: '#4ade80', border: '1px solid rgba(65,123,90,0.3)' }}>
              <Star className="w-2 h-2 fill-current" />padrão
            </span>
          )}
        </div>
        <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
          {LAYOUT_LABELS[template.layout_type] ?? template.layout_type}
        </span>
      </div>
      <ActionMenu
        template={template}
        onEdit={onEdit}
        onSetDefault={onSetDefault}
        onDuplicate={onDuplicate}
        onDelete={onDelete}
        loadingDefault={loadingDefault}
      />
    </div>
  </motion.div>
);

// ─── "Add new" card ────────────────────────────────────────────────────────────
const AddCard: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <motion.button
    variants={cardItem}
    type="button"
    onClick={onClick}
    className="rounded-xl flex flex-col items-center justify-center gap-2 transition-colors hover:bg-white/5 cursor-pointer"
    style={{
      minHeight: 152, border: '1px dashed rgba(255,255,255,0.12)',
      background: 'transparent',
    }}
  >
    <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'rgba(75,63,114,0.25)' }}>
      <Plus className="w-4 h-4 text-[#C4B5FD]" />
    </div>
    <span className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.3)' }}>Novo template</span>
  </motion.button>
);

// ─── Main page ─────────────────────────────────────────────────────────────────
type PanelMode = 'list' | 'edit';

const CertificateTemplates: React.FC = () => {
  const navigate = useNavigate();

  const [templates, setTemplates]       = useState<CertificateTemplate[]>([]);
  const [loading, setLoading]           = useState(true);
  const [saving, setSaving]             = useState(false);
  const [loadingDefault, setLoadingDefault] = useState<string | null>(null);

  const [panelMode, setPanelMode]       = useState<PanelMode>('list');
  const [editingId, setEditingId]       = useState<string | null>(null);
  const [draft, setDraft]               = useState<Partial<CertificateTemplate>>(blankDraft());

  // Which template is selected for the right-panel preview
  const [previewId, setPreviewId]       = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await getTemplates();
      setTemplates(list);
      // auto-select default or first
      if (!previewId && list.length > 0) {
        setPreviewId(list.find(t => t.is_default)?.id ?? list[0].id);
      }
    } catch (err: any) {
      toast({ title: 'Erro ao carregar templates', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── open editor ──────────────────────────────────────────────────────────────
  const openNew = () => {
    setEditingId(null);
    setDraft(blankDraft());
    setPanelMode('edit');
  };

  const openEdit = (t: CertificateTemplate) => {
    setEditingId(t.id);
    setDraft({ ...t });
    setPanelMode('edit');
  };

  const cancelEdit = () => {
    setPanelMode('list');
    setEditingId(null);
  };

  // ── save ─────────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!draft.name?.trim()) {
      toast({ title: 'Informe o nome do template', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      let saved: CertificateTemplate;
      if (editingId) {
        saved = await updateTemplate(editingId, draft);
        toast({ title: 'Template atualizado' });
      } else {
        saved = await createTemplate(draft);
        toast({ title: 'Template criado' });
      }
      setPanelMode('list');
      setPreviewId(saved.id);
      await load();
    } catch (err: any) {
      toast({ title: 'Erro ao salvar', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  // ── actions ──────────────────────────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    if (!confirm('Remover este template? Esta ação não pode ser desfeita.')) return;
    try {
      await deleteTemplate(id);
      toast({ title: 'Template removido' });
      setTemplates(prev => prev.filter(t => t.id !== id));
      if (previewId === id) setPreviewId(null);
    } catch (err: any) {
      toast({ title: 'Erro ao remover', description: err.message, variant: 'destructive' });
    }
  };

  const handleSetDefault = async (id: string) => {
    setLoadingDefault(id);
    try {
      await setDefaultTemplate(id);
      toast({ title: 'Template padrão definido' });
      await load();
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    } finally {
      setLoadingDefault(null);
    }
  };

  const handleDuplicate = async (t: CertificateTemplate) => {
    try {
      const { id: _id, empresa_id: _eid, created_at: _ca, updated_at: _ua, is_default: _def, ...rest } = t;
      await createTemplate({ ...rest, name: `${t.name} (cópia)`, is_default: false });
      toast({ title: 'Template duplicado' });
      await load();
    } catch (err: any) {
      toast({ title: 'Erro ao duplicar', description: err.message, variant: 'destructive' });
    }
  };

  // Template used in the right-panel preview
  const previewTemplate = (() => {
    if (panelMode === 'edit') return draft;
    return templates.find(t => t.id === previewId) ?? templates[0];
  })();

  // ── render ───────────────────────────────────────────────────────────────────
  return (
    <ERALayout>
      <div
        className="min-h-screen flex flex-col"
        style={{ background: 'linear-gradient(160deg, #0e1029 0%, #12163a 100%)' }}
      >
        {/* ── Page header ────────────────────────────────────────────────────── */}
        <motion.div
          variants={fadeInUp} initial="hidden" animate="visible"
          className="flex items-center justify-between px-6 pt-6 pb-5 flex-shrink-0"
        >
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/certificados')}
              className="flex items-center justify-center w-9 h-9 rounded-xl transition-colors hover:bg-white/8 text-white/50 hover:text-white"
              style={{ border: '1px solid rgba(255,255,255,0.1)' }}
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-white leading-tight">Templates de certificado</h1>
              <p className="text-xs text-white/35 mt-0.5">Personalize a identidade visual dos certificados emitidos</p>
            </div>
          </div>

          <Button
            onClick={openNew}
            className="flex items-center gap-1.5 text-white text-sm font-semibold px-4 h-9 rounded-xl shadow-lg"
            style={{ background: 'linear-gradient(135deg, #4B3F72, #417B5A)' }}
          >
            <Plus className="w-4 h-4" /> Novo template
          </Button>
        </motion.div>

        {/* ── Two-panel body ──────────────────────────────────────────────────── */}
        <div
          className="flex flex-1 gap-0 overflow-hidden mx-6 mb-6 rounded-2xl"
          style={{ border: '1px solid rgba(255,255,255,0.06)', minHeight: 0 }}
        >
          {/* LEFT panel — 40% ─────────────────────────────────────────────────── */}
          <div
            className="flex flex-col overflow-hidden flex-shrink-0"
            style={{ width: '40%', borderRight: '1px solid rgba(255,255,255,0.06)', background: '#141728' }}
          >
            {/* Panel tab pills */}
            <div
              className="flex items-center gap-1 px-4 py-3 flex-shrink-0"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
            >
              {(['list', 'edit'] as PanelMode[]).map(mode => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => { if (mode === 'list') cancelEdit(); else if (editingId || panelMode === 'edit') setPanelMode('edit'); }}
                  className="px-3 py-1 rounded-full text-xs font-medium transition-colors"
                  style={
                    panelMode === mode
                      ? { background: 'rgba(75,63,114,0.3)', color: '#C4B5FD' }
                      : { color: 'rgba(255,255,255,0.3)' }
                  }
                >
                  {mode === 'list' ? 'Templates' : 'Editar'}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto min-h-0">
              <AnimatePresence mode="wait">

                {/* ── LIST mode ─────────────────────────────────────────────── */}
                {panelMode === 'list' && (
                  <motion.div
                    key="list"
                    initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -8 }} transition={{ duration: 0.18 }}
                    className="p-4"
                  >
                    {loading ? (
                      <div className="flex items-center justify-center py-16">
                        <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#4B3F72' }} />
                      </div>
                    ) : templates.length === 0 ? (
                      <div className="text-center py-12">
                        <FileText className="w-8 h-8 mx-auto mb-2" style={{ color: '#4B3F72' }} />
                        <p className="text-xs text-white/30 mb-4">Nenhum template criado ainda</p>
                        <button
                          type="button"
                          onClick={openNew}
                          className="text-xs font-medium text-[#C4B5FD] hover:text-white transition-colors"
                        >
                          + Criar primeiro template
                        </button>
                      </div>
                    ) : (
                      <motion.div
                        variants={staggerContainer} initial="hidden" animate="visible"
                        className="grid grid-cols-2 gap-3"
                      >
                        {templates.map(t => (
                          <TemplateCard
                            key={t.id}
                            template={t}
                            isActive={previewId === t.id}
                            onSelect={() => setPreviewId(t.id)}
                            onEdit={() => openEdit(t)}
                            onSetDefault={() => handleSetDefault(t.id)}
                            onDuplicate={() => handleDuplicate(t)}
                            onDelete={() => handleDelete(t.id)}
                            loadingDefault={loadingDefault === t.id}
                          />
                        ))}
                        <AddCard onClick={openNew} />
                      </motion.div>
                    )}
                  </motion.div>
                )}

                {/* ── EDIT mode ─────────────────────────────────────────────── */}
                {panelMode === 'edit' && (
                  <motion.div
                    key="edit"
                    initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 8 }} transition={{ duration: 0.18 }}
                    className="h-full"
                  >
                    <TemplateEditor
                      value={draft}
                      onChange={setDraft}
                      saving={saving}
                      onSave={handleSave}
                      onCancel={cancelEdit}
                    />
                  </motion.div>
                )}

              </AnimatePresence>
            </div>
          </div>

          {/* RIGHT panel — 60% — live preview ─────────────────────────────── */}
          <div
            className="flex-1 flex flex-col overflow-hidden"
            style={{ background: '#0a0c1e' }}
          >
            {/* Preview toolbar */}
            <div
              className="flex items-center justify-between px-5 py-3 flex-shrink-0"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
            >
              <div className="flex items-center gap-2">
                <LayoutTemplate className="w-3.5 h-3.5" style={{ color: 'rgba(255,255,255,0.3)' }} />
                <span className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  {panelMode === 'edit' ? 'Pré-visualização em tempo real' : 'Preview do template selecionado'}
                </span>
              </div>
              {previewTemplate && (
                <button
                  type="button"
                  onClick={() => previewCertificateInNewTab({
                    id: 'preview',
                    student_name: MOCK_CERTIFICATE_DATA.student_name,
                    course_name: MOCK_CERTIFICATE_DATA.course_name,
                    carga_horaria: MOCK_CERTIFICATE_DATA.carga_horaria,
                    aproveitamento: MOCK_CERTIFICATE_DATA.aproveitamento,
                    issued_at: MOCK_CERTIFICATE_DATA.issued_at,
                    validation_code: MOCK_CERTIFICATE_DATA.validation_code,
                    template: previewTemplate as CertificateTemplate,
                  })}
                  className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors hover:bg-white/8"
                  style={{ color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.1)' }}
                >
                  <Download className="w-3 h-3" /> Baixar PDF de exemplo
                </button>
              )}
            </div>

            {/* Preview canvas */}
            <div className="flex-1 overflow-auto flex items-start justify-center p-8 min-h-0">
              {previewTemplate ? (
                <motion.div
                  key={JSON.stringify(previewTemplate)}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.22 }}
                  className="w-full max-w-2xl shadow-2xl rounded-xl overflow-hidden"
                >
                  <CertificatePreview
                    template={previewTemplate}
                    data={MOCK_CERTIFICATE_DATA}
                  />
                </motion.div>
              ) : (
                <div className="flex flex-col items-center justify-center gap-3 text-white/20 py-20">
                  <LayoutTemplate className="w-10 h-10" />
                  <span className="text-sm">Selecione um template para visualizar</span>
                </div>
              )}
            </div>

            {/* Preview legend */}
            <div
              className="flex-shrink-0 px-5 py-3 flex items-center gap-2"
              style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
            >
              <Check className="w-3 h-3" style={{ color: '#4ade80' }} />
              <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.25)' }}>
                Pré-visualização com dados fictícios. O certificado real usará os dados do aluno e do curso.
              </span>
            </div>
          </div>
        </div>
      </div>
    </ERALayout>
  );
};

export default CertificateTemplates;
