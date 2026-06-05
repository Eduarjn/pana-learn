import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { CertificatePreview } from '@/components/certificates/CertificatePreview';
import type { CertificateData, CertificateTemplate } from '@/types/certificate';
import { DEFAULT_TEMPLATE } from '@/types/certificate';
import { CheckCircle, XCircle, Loader2, ShieldCheck } from 'lucide-react';

const ValidarCertificado: React.FC = () => {
  const { codigo } = useParams<{ codigo: string }>();
  const [status, setStatus] = useState<'loading' | 'valid' | 'invalid'>('loading');
  const [certData, setCertData] = useState<CertificateData | null>(null);

  useEffect(() => {
    if (!codigo) { setStatus('invalid'); return; }

    (async () => {
      const { data, error } = await supabase
        .from('certificados')
        .select(`
          id, carga_horaria, aproveitamento, validation_code, issued_at, status,
          usuarios!certificados_usuario_id_fkey(nome, email),
          cursos!certificados_curso_id_fkey(nome),
          certificate_templates(*)
        `)
        .eq('validation_code', codigo.toUpperCase())
        .maybeSingle();

      if (error || !data || data.status !== 'ativo') {
        setStatus('invalid');
        return;
      }

      const row = data as any;
      setCertData({
        id: row.id,
        student_name: row.usuarios?.nome ?? 'Aluno',
        course_name: row.cursos?.nome ?? 'Curso',
        carga_horaria: row.carga_horaria ?? 0,
        aproveitamento: row.aproveitamento ?? 0,
        issued_at: row.issued_at ?? new Date().toISOString(),
        validation_code: row.validation_code,
        template: row.certificate_templates
          ? (row.certificate_templates as CertificateTemplate)
          : { ...DEFAULT_TEMPLATE, id: '', empresa_id: '', created_at: '', updated_at: '' },
      });
      setStatus('valid');
    })();
  }, [codigo]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6" style={{ background: '#060814' }}>
      {/* Orbs bg */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-600/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-purple-600/10 blur-[140px]" />
      </div>

      <div className="relative z-10 w-full max-w-3xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium mb-4" style={{ background: 'rgba(65,123,90,0.15)', border: '1px solid rgba(65,123,90,0.3)', color: '#417B5A' }}>
            <ShieldCheck className="w-3.5 h-3.5" /> Validação de certificado
          </div>
          <p className="text-white/40 text-sm">Código: <span className="text-white/70 font-mono">{codigo?.toUpperCase()}</span></p>
        </div>

        {status === 'loading' && (
          <div className="flex flex-col items-center gap-3 py-16 text-white/40">
            <Loader2 className="w-8 h-8 animate-spin" />
            <span className="text-sm">Verificando certificado...</span>
          </div>
        )}

        {status === 'invalid' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16 rounded-2xl"
            style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.2)' }}
          >
            <XCircle className="w-12 h-12 mx-auto mb-4 text-red-400" />
            <h2 className="text-xl font-bold text-white mb-2">Certificado não encontrado</h2>
            <p className="text-white/40 text-sm max-w-sm mx-auto">
              O código informado não corresponde a nenhum certificado ativo em nossa base de dados.
            </p>
          </motion.div>
        )}

        {status === 'valid' && certData && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
            {/* Valid badge */}
            <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl" style={{ background: 'rgba(65,123,90,0.1)', border: '1px solid rgba(65,123,90,0.25)' }}>
              <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-emerald-300">Certificado válido e autêntico</p>
                <p className="text-xs text-white/40">Este documento foi emitido pela plataforma Panalearn.</p>
              </div>
            </div>

            {/* Certificate preview */}
            <div className="rounded-2xl overflow-hidden shadow-2xl">
              <CertificatePreview template={certData.template} data={certData} />
            </div>

            {/* Details */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                ['Aluno', certData.student_name],
                ['Curso', certData.course_name],
                ['Carga horária', `${certData.carga_horaria}h`],
                ['Aproveitamento', `${certData.aproveitamento}%`],
                ['Emissão', new Date(certData.issued_at).toLocaleDateString('pt-BR')],
                ['Código', certData.validation_code],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl px-4 py-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <p className="text-[10px] uppercase tracking-wider text-white/30 mb-1">{label}</p>
                  <p className="text-sm font-medium text-white truncate">{value}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        <div className="text-center mt-8">
          <Link to="/login" className="text-xs text-white/20 hover:text-white/50 transition-colors">
            Acessar plataforma Panalearn
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ValidarCertificado;
