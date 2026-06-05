import { supabase } from '@/integrations/supabase/client';
import type { CertificateTemplate, CertificateData } from '@/types/certificate';

// ─── Templates ────────────────────────────────────────────────────────────────

export async function getTemplates(): Promise<CertificateTemplate[]> {
  const { data, error } = await supabase
    .from('certificate_templates')
    .select('*')
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as CertificateTemplate[];
}

export async function getDefaultTemplate(): Promise<CertificateTemplate | null> {
  const { data, error } = await supabase
    .from('certificate_templates')
    .select('*')
    .eq('is_default', true)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data as CertificateTemplate | null;
}

export async function createTemplate(
  payload: Omit<Partial<CertificateTemplate>, 'id' | 'created_at' | 'updated_at'>,
): Promise<CertificateTemplate> {
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData.session?.user.id;
  if (!userId) throw new Error('Não autenticado');

  // Resolve empresa_id via RLS helper
  const { data: profileData, error: profileError } = await supabase
    .from('usuarios')
    .select('empresa_id')
    .eq('id', userId)
    .single();

  if (profileError || !profileData?.empresa_id) throw new Error('Empresa não encontrada');

  const { data, error } = await supabase
    .from('certificate_templates')
    .insert({ ...payload, empresa_id: profileData.empresa_id })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as CertificateTemplate;
}

export async function updateTemplate(
  id: string,
  payload: Partial<CertificateTemplate>,
): Promise<CertificateTemplate> {
  const { data, error } = await supabase
    .from('certificate_templates')
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as CertificateTemplate;
}

export async function deleteTemplate(id: string): Promise<void> {
  const { error } = await supabase
    .from('certificate_templates')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);
}

export async function setDefaultTemplate(id: string): Promise<void> {
  const { error } = await supabase
    .from('certificate_templates')
    .update({ is_default: true, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw new Error(error.message);
}

// ─── Asset uploads ─────────────────────────────────────────────────────────────

export async function uploadAsset(file: File, type: 'logo' | 'signature'): Promise<string> {
  const ext = file.name.split('.').pop();
  const fileName = `${type}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { error } = await supabase.storage
    .from('certificate-assets')
    .upload(fileName, file, { upsert: true, contentType: file.type });

  if (error) throw new Error(error.message);

  const { data } = supabase.storage
    .from('certificate-assets')
    .getPublicUrl(fileName);

  return data.publicUrl;
}

// ─── Certificates (com dados para renderização) ────────────────────────────────

export async function getCertificates(): Promise<CertificateData[]> {
  const { data, error } = await supabase
    .from('certificados')
    .select(`
      id,
      carga_horaria,
      aproveitamento,
      validation_code,
      issued_at,
      template_id,
      usuarios!certificados_usuario_id_fkey(nome, email),
      cursos!certificados_curso_id_fkey(nome),
      certificate_templates(*)
    `)
    .order('issued_at', { ascending: false });

  if (error) throw new Error(error.message);

  return (data ?? []).map((row: any): CertificateData => ({
    id: row.id,
    student_name: row.usuarios?.nome ?? 'Aluno',
    course_name: row.cursos?.nome ?? 'Curso',
    carga_horaria: row.carga_horaria ?? 0,
    aproveitamento: row.aproveitamento ?? 0,
    issued_at: row.issued_at ?? new Date().toISOString(),
    validation_code: row.validation_code ?? row.id.slice(0, 8).toUpperCase(),
    template: row.certificate_templates ?? null,
  }));
}

export async function downloadCertificatePDF(certData: CertificateData): Promise<void> {
  const { generateCertificatePDFFromData } = await import('@/utils/generateCertificatePDF');
  await generateCertificatePDFFromData(certData);
}
