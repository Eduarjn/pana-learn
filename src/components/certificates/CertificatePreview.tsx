import React from 'react';
import type { CertificateData, CertificateTemplate } from '@/types/certificate';
import { DEFAULT_TEMPLATE, MOCK_CERTIFICATE_DATA } from '@/types/certificate';

interface Props {
  template?: Partial<CertificateTemplate>;
  data?: Partial<Omit<CertificateData, 'template'>>;
  /** Scale factor for fitting inside editor panels (0.5 = 50%) */
  scale?: number;
  className?: string;
}

// ─── Resolved defaults ─────────────────────────────────────────────────────────
function resolveTemplate(partial?: Partial<CertificateTemplate>): CertificateTemplate {
  return { ...DEFAULT_TEMPLATE, id: '', empresa_id: '', created_at: '', updated_at: '', ...partial } as CertificateTemplate;
}

function resolveData(partial?: Partial<Omit<CertificateData, 'template'>>): Omit<CertificateData, 'template'> {
  return { ...MOCK_CERTIFICATE_DATA, ...partial };
}

// ─── Border helper ─────────────────────────────────────────────────────────────
function borderStyle(t: CertificateTemplate): React.CSSProperties {
  if (!t.show_border || t.border_style === 'none') return {};
  const c = t.border_color;
  if (t.border_style === 'single')     return { border: `3px solid ${c}` };
  if (t.border_style === 'double')     return { border: `4px double ${c}` };
  if (t.border_style === 'ornamental') return { border: `3px solid ${c}`, boxShadow: `inset 0 0 0 6px ${c}22, inset 0 0 0 12px ${c}11` };
  return {};
}

// ─── Signature block ───────────────────────────────────────────────────────────
const SignatureBlock: React.FC<{ t: CertificateTemplate; dark?: boolean }> = ({ t, dark }) => {
  const nameColor = dark ? '#fff' : t.text_color;
  const roleColor = dark ? '#ffffff99' : `${t.text_color}88`;
  const lineColor = dark ? '#ffffff44' : `${t.text_color}44`;
  if (!t.signature_name && !t.signature_image_url) return null;
  return (
    <div style={{ textAlign: 'center', marginTop: 32 }}>
      {t.signature_image_url
        ? <img src={t.signature_image_url} style={{ height: 48, marginBottom: 6, objectFit: 'contain' }} alt="assinatura" />
        : <div style={{ width: 160, borderBottom: `1.5px solid ${lineColor}`, margin: '0 auto', marginBottom: 8 }} />
      }
      <div style={{ fontSize: 12, color: nameColor, fontWeight: 600 }}>{t.signature_name}</div>
      {t.signature_role && <div style={{ fontSize: 10, color: roleColor }}>{t.signature_role}</div>}
    </div>
  );
};

// ─── Watermark ─────────────────────────────────────────────────────────────────
const Watermark: React.FC<{ t: CertificateTemplate }> = ({ t }) => {
  if (!t.show_watermark) return null;
  return (
    <div style={{
      position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
      pointerEvents: 'none', zIndex: 0, opacity: 0.04,
      fontSize: 72, fontWeight: 900, color: t.primary_color,
      transform: 'rotate(-30deg)', fontFamily: `${t.font_family}, serif`,
    }}>
      CERTIFICADO
    </div>
  );
};

// ─── Layout: Classic ──────────────────────────────────────────────────────────
const ClassicLayout: React.FC<{ t: CertificateTemplate; d: Omit<CertificateData, 'template'>; date: string }> = ({ t, d, date }) => (
  <div style={{ background: t.background_color, ...borderStyle(t), padding: '52px 60px', position: 'relative', fontFamily: `${t.font_family}, serif` }}>
    <Watermark t={t} />
    <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
      {t.company_logo_url && <img src={t.company_logo_url} style={{ height: 48, marginBottom: 8, objectFit: 'contain' }} alt="logo" />}
      {t.company_name && (
        <div style={{ fontSize: 11, letterSpacing: '0.18em', color: t.secondary_color, textTransform: 'uppercase', fontWeight: 600, marginBottom: 20 }}>
          {t.company_name}
        </div>
      )}
      <div style={{ width: 72, height: 3, background: t.primary_color, margin: '0 auto 24px' }} />
      <h1 style={{ fontSize: t.font_size_title, color: t.primary_color, letterSpacing: '0.1em', margin: '0 0 28px', textTransform: 'uppercase' }}>
        {t.header_text}
      </h1>
      <p style={{ fontSize: t.font_size_body, color: `${t.text_color}99`, margin: '0 0 12px' }}>{t.intro_text}</p>
      <div style={{ fontSize: t.font_size_name, color: t.text_color, fontWeight: 700, borderBottom: `2px solid ${t.secondary_color}44`, paddingBottom: 10, marginBottom: 12 }}>
        {d.student_name}
      </div>
      <p style={{ fontSize: t.font_size_body, color: `${t.text_color}99`, margin: '0 0 8px' }}>{t.body_text}</p>
      <div style={{ fontSize: 18, color: t.secondary_color, fontWeight: 600, marginBottom: 24 }}>{d.course_name}</div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: 32, margin: '20px 0', padding: '14px 0', borderTop: `1px solid ${t.primary_color}22`, borderBottom: `1px solid ${t.primary_color}22` }}>
        {[['Carga horária', `${d.carga_horaria}h`], ['Aproveitamento', `${d.aproveitamento}%`], ['Emitido em', date]].map(([label, value]) => (
          <div key={label} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 9, color: `${t.text_color}66`, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: t.text_color }}>{value}</div>
          </div>
        ))}
      </div>

      <SignatureBlock t={t} />
      <div style={{ marginTop: 24, fontSize: 9, color: `${t.text_color}55`, letterSpacing: '0.1em' }}>
        Código: {d.validation_code} &nbsp;·&nbsp; {t.footer_text}
      </div>
    </div>
  </div>
);

// ─── Layout: Modern ───────────────────────────────────────────────────────────
const ModernLayout: React.FC<{ t: CertificateTemplate; d: Omit<CertificateData, 'template'>; date: string }> = ({ t, d, date }) => (
  <div style={{ background: t.background_color, position: 'relative', fontFamily: `${t.font_family}, sans-serif`, overflow: 'hidden' }}>
    {/* Header bar */}
    <div style={{ background: t.primary_color, padding: '24px 44px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div>
        {t.company_logo_url && <img src={t.company_logo_url} style={{ height: 36, marginBottom: 4, objectFit: 'contain' }} alt="logo" />}
        <div style={{ fontSize: t.font_size_title * 0.5, color: '#fff', fontWeight: 700, letterSpacing: '0.1em' }}>{t.header_text}</div>
      </div>
      <div style={{ textAlign: 'right', fontSize: 10, color: '#ffffff88', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{t.company_name}</div>
    </div>

    {/* Body */}
    <div style={{ position: 'relative', padding: '36px 44px' }}>
      <Watermark t={t} />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <p style={{ fontSize: t.font_size_body, color: `${t.text_color}88`, margin: '0 0 10px' }}>{t.intro_text}</p>
        <div style={{ fontSize: t.font_size_name, color: t.text_color, fontWeight: 800, marginBottom: 8 }}>{d.student_name}</div>
        <p style={{ fontSize: t.font_size_body, color: `${t.text_color}88`, margin: '0 0 6px' }}>{t.body_text}</p>
        <div style={{ fontSize: 17, color: t.secondary_color, fontWeight: 700, marginBottom: 28 }}>{d.course_name}</div>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 28 }}>
          {[['Carga horária', `${d.carga_horaria}h`], ['Aproveitamento', `${d.aproveitamento}%`], ['Emitido em', date]].map(([label, value]) => (
            <div key={label} style={{ flex: 1, minWidth: 110, background: `${t.primary_color}0f`, borderLeft: `3px solid ${t.secondary_color}`, padding: '10px 14px', borderRadius: '0 6px 6px 0' }}>
              <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.08em', color: `${t.text_color}66` }}>{label}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: t.text_color }}>{value}</div>
            </div>
          ))}
        </div>

        <SignatureBlock t={t} />
        <div style={{ marginTop: 20, paddingTop: 14, borderTop: `1px solid ${t.primary_color}22`, fontSize: 9, color: `${t.text_color}44` }}>
          Código: {d.validation_code} &nbsp;·&nbsp; {t.footer_text}
        </div>
      </div>
    </div>
    <div style={{ height: 5, background: `linear-gradient(to right, ${t.primary_color}, ${t.secondary_color})` }} />
  </div>
);

// ─── Layout: Minimal ──────────────────────────────────────────────────────────
const MinimalLayout: React.FC<{ t: CertificateTemplate; d: Omit<CertificateData, 'template'>; date: string }> = ({ t, d, date }) => (
  <div style={{ background: t.background_color, ...borderStyle(t), padding: '64px', position: 'relative', fontFamily: `${t.font_family}, sans-serif` }}>
    <Watermark t={t} />
    <div style={{ position: 'relative', zIndex: 1 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 52 }}>
        <div>
          {t.company_logo_url && <img src={t.company_logo_url} style={{ height: 40, marginBottom: 6, objectFit: 'contain' }} alt="logo" />}
          <div style={{ fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: `${t.text_color}55` }}>{t.company_name}</div>
        </div>
        <div style={{ fontSize: 9, letterSpacing: '0.14em', color: t.secondary_color, textTransform: 'uppercase' }}>{t.header_text}</div>
      </div>

      <p style={{ fontSize: t.font_size_body, color: `${t.text_color}66`, margin: '0 0 8px' }}>{t.intro_text}</p>
      <div style={{ fontSize: t.font_size_name + 2, color: t.text_color, fontWeight: 300, letterSpacing: '-0.01em', marginBottom: 6 }}>{d.student_name}</div>
      <div style={{ width: 44, height: 2, background: t.secondary_color, margin: '14px 0' }} />
      <p style={{ fontSize: t.font_size_body, color: `${t.text_color}66`, margin: '0 0 4px' }}>{t.body_text}</p>
      <div style={{ fontSize: 17, color: t.text_color, fontWeight: 600, marginBottom: 44 }}>{d.course_name}</div>

      <div style={{ display: 'flex', gap: 44, marginBottom: 44 }}>
        {[['Carga horária', `${d.carga_horaria}h`], ['Aproveitamento', `${d.aproveitamento}%`], ['Data', date]].map(([label, value]) => (
          <div key={label}>
            <div style={{ fontSize: 9, color: `${t.text_color}44`, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
            <div style={{ fontSize: 13, color: t.text_color, fontWeight: 600 }}>{value}</div>
          </div>
        ))}
      </div>

      <SignatureBlock t={t} />
      <div style={{ marginTop: 36, fontSize: 8, color: `${t.text_color}33`, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
        Código: {d.validation_code} &nbsp;·&nbsp; {t.footer_text}
      </div>
    </div>
  </div>
);

// ─── Layout: Corporate ────────────────────────────────────────────────────────
const CorporateLayout: React.FC<{ t: CertificateTemplate; d: Omit<CertificateData, 'template'>; date: string }> = ({ t, d, date }) => (
  <div style={{ background: t.primary_color, position: 'relative', fontFamily: `${t.font_family}, sans-serif`, overflow: 'hidden', padding: '40px 48px' }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
      {t.company_logo_url
        ? <img src={t.company_logo_url} style={{ height: 40, objectFit: 'contain' }} alt="logo" />
        : <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', letterSpacing: '0.05em' }}>{t.company_name}</div>
      }
      <div style={{ fontSize: 8, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#ffffff66' }}>{t.header_text}</div>
    </div>

    <div style={{ background: '#ffffff0f', borderRadius: 10, padding: '32px 40px', position: 'relative' }}>
      <Watermark t={t} />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <p style={{ fontSize: t.font_size_body, color: '#ffffff99', margin: '0 0 10px' }}>{t.intro_text}</p>
        <div style={{ fontSize: t.font_size_name, color: '#fff', fontWeight: 700, marginBottom: 8 }}>{d.student_name}</div>
        <p style={{ fontSize: t.font_size_body, color: '#ffffff88', margin: '0 0 6px' }}>{t.body_text}</p>
        <div style={{ fontSize: 16, color: t.secondary_color, fontWeight: 600, marginBottom: 28 }}>{d.course_name}</div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 28 }}>
          {[['Carga horária', `${d.carga_horaria}h`], ['Aproveitamento', `${d.aproveitamento}%`], ['Emitido em', date]].map(([label, value]) => (
            <div key={label} style={{ background: '#ffffff14', borderRadius: 7, padding: '10px 14px', textAlign: 'center' }}>
              <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#ffffff55', marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{value}</div>
            </div>
          ))}
        </div>

        {(t.signature_name || t.signature_image_url) && (
          <div style={{ textAlign: 'center', marginTop: 24 }}>
            {t.signature_image_url
              ? <img src={t.signature_image_url} style={{ height: 44, marginBottom: 6, objectFit: 'contain' }} alt="assinatura" />
              : <div style={{ width: 160, borderBottom: '1.5px solid #ffffff44', margin: '0 auto', marginBottom: 8 }} />
            }
            <div style={{ fontSize: 11, color: '#fff', fontWeight: 600 }}>{t.signature_name}</div>
            {t.signature_role && <div style={{ fontSize: 9, color: '#ffffff99' }}>{t.signature_role}</div>}
          </div>
        )}
      </div>
    </div>

    <div style={{ marginTop: 16, fontSize: 8, color: '#ffffff44', letterSpacing: '0.12em', textAlign: 'center' }}>
      Código: {d.validation_code} &nbsp;·&nbsp; {t.footer_text}
    </div>
  </div>
);

// ─── Main component ────────────────────────────────────────────────────────────
export const CertificatePreview: React.FC<Props> = ({ template, data, scale = 1, className }) => {
  const t = resolveTemplate(template);
  const d = resolveData(data);
  const date = new Date(d.issued_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });

  const inner = (() => {
    switch (t.layout_type) {
      case 'modern':    return <ModernLayout    t={t} d={d} date={date} />;
      case 'minimal':   return <MinimalLayout   t={t} d={d} date={date} />;
      case 'corporate': return <CorporateLayout t={t} d={d} date={date} />;
      default:          return <ClassicLayout   t={t} d={d} date={date} />;
    }
  })();

  if (scale === 1) {
    return <div className={className} style={{ width: '100%' }}>{inner}</div>;
  }

  return (
    <div className={className} style={{ width: '100%', overflow: 'hidden', position: 'relative' }}>
      <div style={{ transform: `scale(${scale})`, transformOrigin: 'top left', width: `${100 / scale}%` }}>
        {inner}
      </div>
      {/* spacer to maintain correct height */}
      <div style={{ height: 0, paddingBottom: `${scale * 56}%` }} />
    </div>
  );
};

export default CertificatePreview;
