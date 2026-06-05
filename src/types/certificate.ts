// ─── Certificado existente ───────────────────────────────────────────────────
export interface Certificate {
  id: string;
  usuario_id: string;
  curso_id?: string;
  categoria: string;
  quiz_id?: string;
  nota_final?: number;
  nota?: number;
  link_pdf_certificado?: string;
  numero_certificado: string;
  qr_code_url?: string;
  status: 'ativo' | 'revogado' | 'expirado';
  data_emissao: string;
  data_criacao: string;
  data_atualizacao: string;
  // Colunas adicionadas na migration 20260602
  template_id?: string;
  carga_horaria?: number;
  aproveitamento?: number;
  validation_code?: string;
  issued_at?: string;
  // Dados relacionados (join)
  usuario_nome?: string;
  curso_nome?: string;
  quiz_titulo?: string;
  usuarios?: { nome: string; email: string };
  cursos?: { nome: string; categoria: string };
  certificate_templates?: CertificateTemplate;
}

// ─── Templates de certificado ────────────────────────────────────────────────
export type LayoutType = 'classic' | 'modern' | 'minimal' | 'corporate';
export type BorderStyle = 'none' | 'single' | 'double' | 'ornamental';

export const FONT_OPTIONS = [
  'Georgia',
  'Playfair Display',
  'Merriweather',
  'Lato',
  'Montserrat',
  'Raleway',
] as const;

export type FontFamily = typeof FONT_OPTIONS[number];

export interface CertificateTemplate {
  id: string;
  empresa_id: string;
  name: string;
  is_default: boolean;
  layout_type: LayoutType;

  // Identidade
  company_name: string | null;
  company_logo_url: string | null;

  // Cores
  primary_color: string;
  secondary_color: string;
  background_color: string;
  text_color: string;

  // Tipografia
  font_family: string;
  font_size_title: number;
  font_size_name: number;
  font_size_body: number;

  // Assinatura
  signature_name: string | null;
  signature_role: string | null;
  signature_image_url: string | null;

  // Textos
  header_text: string;
  intro_text: string;
  body_text: string;
  footer_text: string;

  // Decoração
  show_border: boolean;
  border_color: string;
  border_style: BorderStyle;
  show_watermark: boolean;

  created_at: string;
  updated_at: string;
}

// ─── Dados de um certificado para renderização ────────────────────────────────
export interface CertificateData {
  id: string;
  student_name: string;
  course_name: string;
  carga_horaria: number;
  aproveitamento: number;
  issued_at: string;
  validation_code: string;
  template: CertificateTemplate;
}

// ─── Template padrão (usado no preview sem dados reais) ───────────────────────
export const DEFAULT_TEMPLATE: Omit<CertificateTemplate, 'id' | 'empresa_id' | 'created_at' | 'updated_at'> = {
  name: 'Template Padrão',
  is_default: true,
  layout_type: 'classic',
  company_name: 'Panalearn',
  company_logo_url: null,
  primary_color: '#4B3F72',
  secondary_color: '#417B5A',
  background_color: '#FFFFFF',
  text_color: '#1F2937',
  font_family: 'Georgia',
  font_size_title: 36,
  font_size_name: 28,
  font_size_body: 14,
  signature_name: 'Sabrina Coghe',
  signature_role: 'Diretora Acadêmica',
  signature_image_url: null,
  header_text: 'CERTIFICADO DE CONCLUSÃO',
  intro_text: 'Certificamos para os devidos fins que',
  body_text: 'concluiu com êxito o curso de formação profissional em',
  footer_text: 'Emitido pela plataforma Panalearn',
  show_border: true,
  border_color: '#4B3F72',
  border_style: 'double',
  show_watermark: false,
};

export const MOCK_CERTIFICATE_DATA: Omit<CertificateData, 'template'> = {
  id: 'preview',
  student_name: 'Maria da Silva',
  course_name: 'Fundamentos de PABX',
  carga_horaria: 40,
  aproveitamento: 95,
  issued_at: new Date().toISOString(),
  validation_code: 'PREVIEW01',
};
