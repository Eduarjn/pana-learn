import type { CertificateData, CertificateTemplate } from '@/types/certificate';
import { DEFAULT_TEMPLATE } from '@/types/certificate';

// ─── HTML builder per layout ───────────────────────────────────────────────────

export function buildCertificateHTML(data: CertificateData): string {
  const t: CertificateTemplate = data.template ?? { ...DEFAULT_TEMPLATE, id: '', empresa_id: '', created_at: '', updated_at: '' };
  const issuedDate = new Date(data.issued_at).toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'long', year: 'numeric',
  });

  const borderCSS = (() => {
    if (!t.show_border || t.border_style === 'none') return '';
    const c = t.border_color;
    if (t.border_style === 'single')     return `border: 3px solid ${c};`;
    if (t.border_style === 'double')     return `border: 4px double ${c};`;
    if (t.border_style === 'ornamental') return `border: 3px solid ${c}; box-shadow: inset 0 0 0 6px ${c}22, inset 0 0 0 12px ${c}11;`;
    return '';
  })();

  const watermarkCSS = t.show_watermark
    ? `<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;pointer-events:none;z-index:0;opacity:0.04;font-size:96px;font-weight:900;color:${t.primary_color};transform:rotate(-30deg);font-family:${t.font_family},serif;">CERTIFICADO</div>`
    : '';

  const signatureBlock = (t.signature_name || t.signature_image_url)
    ? `<div style="text-align:center;margin-top:40px;">
        ${t.signature_image_url ? `<img src="${t.signature_image_url}" style="height:60px;margin-bottom:8px;object-fit:contain;" alt="assinatura">` : `<div style="width:180px;border-bottom:1.5px solid ${t.text_color}66;margin:0 auto 8px;"></div>`}
        <div style="font-size:13px;color:${t.text_color};font-weight:600;">${t.signature_name ?? ''}</div>
        ${t.signature_role ? `<div style="font-size:11px;color:${t.text_color}88;">${t.signature_role}</div>` : ''}
      </div>`
    : '';

  const logoBlock = t.company_logo_url
    ? `<img src="${t.company_logo_url}" style="height:52px;object-fit:contain;margin-bottom:8px;" alt="logo">`
    : '';

  const layouts: Record<string, string> = {
    classic: `
      <div style="background:${t.background_color};${borderCSS}padding:60px 70px;max-width:800px;width:100%;margin:0 auto;position:relative;font-family:${t.font_family},serif;">
        ${watermarkCSS}
        <div style="position:relative;z-index:1;text-align:center;">
          ${logoBlock}
          ${t.company_name ? `<div style="font-size:13px;letter-spacing:0.18em;color:${t.secondary_color};text-transform:uppercase;font-weight:600;margin-bottom:24px;">${t.company_name}</div>` : ''}
          <div style="width:80px;height:3px;background:${t.primary_color};margin:0 auto 28px;"></div>
          <h1 style="font-size:${t.font_size_title}px;color:${t.primary_color};letter-spacing:0.12em;margin:0 0 32px;text-transform:uppercase;">${t.header_text}</h1>
          <p style="font-size:${t.font_size_body}px;color:${t.text_color}99;margin:0 0 16px;">${t.intro_text}</p>
          <div style="font-size:${t.font_size_name}px;color:${t.text_color};font-weight:700;border-bottom:2px solid ${t.secondary_color}44;padding-bottom:12px;margin-bottom:16px;">${data.student_name}</div>
          <p style="font-size:${t.font_size_body}px;color:${t.text_color}99;margin:0 0 10px;">${t.body_text}</p>
          <div style="font-size:20px;color:${t.secondary_color};font-weight:600;margin-bottom:28px;">${data.course_name}</div>
          <div style="display:flex;justify-content:center;gap:32px;margin:24px 0;padding:16px 0;border-top:1px solid ${t.primary_color}22;border-bottom:1px solid ${t.primary_color}22;">
            <div style="text-align:center;"><div style="font-size:11px;color:${t.text_color}66;text-transform:uppercase;letter-spacing:.08em;">Carga horária</div><div style="font-size:15px;font-weight:700;color:${t.text_color};">${data.carga_horaria}h</div></div>
            <div style="text-align:center;"><div style="font-size:11px;color:${t.text_color}66;text-transform:uppercase;letter-spacing:.08em;">Aproveitamento</div><div style="font-size:15px;font-weight:700;color:${t.text_color};">${data.aproveitamento}%</div></div>
            <div style="text-align:center;"><div style="font-size:11px;color:${t.text_color}66;text-transform:uppercase;letter-spacing:.08em;">Data de emissão</div><div style="font-size:15px;font-weight:700;color:${t.text_color};">${issuedDate}</div></div>
          </div>
          ${signatureBlock}
          <div style="margin-top:28px;font-size:10px;color:${t.text_color}55;letter-spacing:0.1em;">Código de validação: ${data.validation_code} &nbsp;|&nbsp; ${t.footer_text}</div>
        </div>
      </div>`,

    modern: `
      <div style="background:${t.background_color};max-width:820px;width:100%;margin:0 auto;position:relative;font-family:${t.font_family},sans-serif;overflow:hidden;">
        <div style="background:${t.primary_color};padding:32px 52px;display:flex;align-items:center;justify-content:space-between;">
          <div>${logoBlock}<div style="font-size:${t.font_size_title * 0.6}px;color:#fff;font-weight:700;letter-spacing:0.1em;">${t.header_text}</div></div>
          <div style="text-align:right;font-size:11px;color:#ffffff88;letter-spacing:.1em;text-transform:uppercase;">${t.company_name ?? ''}</div>
        </div>
        <div style="position:relative;z-index:1;padding:48px 52px;">
          ${watermarkCSS}
          <p style="font-size:${t.font_size_body}px;color:${t.text_color}88;margin:0 0 12px;">${t.intro_text}</p>
          <div style="font-size:${t.font_size_name}px;color:${t.text_color};font-weight:800;margin-bottom:8px;">${data.student_name}</div>
          <p style="font-size:${t.font_size_body}px;color:${t.text_color}88;margin:0 0 6px;">${t.body_text}</p>
          <div style="font-size:20px;color:${t.secondary_color};font-weight:700;margin-bottom:32px;">${data.course_name}</div>
          <div style="display:flex;gap:16px;flex-wrap:wrap;margin-bottom:32px;">
            ${[['Carga horária', `${data.carga_horaria}h`], ['Aproveitamento', `${data.aproveitamento}%`], ['Emitido em', issuedDate]].map(([label, value]) => `
              <div style="flex:1;min-width:140px;background:${t.primary_color}0f;border-left:3px solid ${t.secondary_color};padding:12px 16px;border-radius:0 6px 6px 0;">
                <div style="font-size:10px;text-transform:uppercase;letter-spacing:.08em;color:${t.text_color}66;">${label}</div>
                <div style="font-size:15px;font-weight:700;color:${t.text_color};">${value}</div>
              </div>`).join('')}
          </div>
          ${signatureBlock}
          <div style="margin-top:24px;padding-top:16px;border-top:1px solid ${t.primary_color}22;font-size:10px;color:${t.text_color}44;">Código: ${data.validation_code} &nbsp;·&nbsp; ${t.footer_text}</div>
        </div>
        <div style="height:6px;background:linear-gradient(to right, ${t.primary_color}, ${t.secondary_color});"></div>
      </div>`,

    minimal: `
      <div style="background:${t.background_color};${borderCSS}padding:80px;max-width:780px;width:100%;margin:0 auto;position:relative;font-family:${t.font_family},sans-serif;">
        ${watermarkCSS}
        <div style="position:relative;z-index:1;">
          <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:60px;">
            <div>${logoBlock}<div style="font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:${t.text_color}55;">${t.company_name ?? ''}</div></div>
            <div style="font-size:11px;letter-spacing:0.12em;color:${t.secondary_color};text-transform:uppercase;">${t.header_text}</div>
          </div>
          <p style="font-size:${t.font_size_body}px;color:${t.text_color}66;margin:0 0 8px;">${t.intro_text}</p>
          <div style="font-size:${t.font_size_name + 4}px;color:${t.text_color};font-weight:300;letter-spacing:-0.01em;margin-bottom:6px;">${data.student_name}</div>
          <div style="width:48px;height:2px;background:${t.secondary_color};margin:16px 0;"></div>
          <p style="font-size:${t.font_size_body}px;color:${t.text_color}66;margin:0 0 4px;">${t.body_text}</p>
          <div style="font-size:18px;color:${t.text_color};font-weight:600;margin-bottom:52px;">${data.course_name}</div>
          <div style="display:flex;gap:48px;margin-bottom:52px;">
            ${[['Carga horária', `${data.carga_horaria}h`], ['Aproveitamento', `${data.aproveitamento}%`], ['Data', issuedDate]].map(([label, value]) => `
              <div><div style="font-size:10px;color:${t.text_color}44;letter-spacing:.12em;text-transform:uppercase;margin-bottom:4px;">${label}</div><div style="font-size:14px;color:${t.text_color};font-weight:600;">${value}</div></div>`).join('')}
          </div>
          ${signatureBlock}
          <div style="margin-top:40px;font-size:9px;color:${t.text_color}33;letter-spacing:0.15em;text-transform:uppercase;">Código: ${data.validation_code} &nbsp;·&nbsp; ${t.footer_text}</div>
        </div>
      </div>`,

    corporate: `
      <div style="background:${t.primary_color};max-width:820px;width:100%;margin:0 auto;position:relative;font-family:${t.font_family},sans-serif;overflow:hidden;">
        <div style="padding:48px 56px;">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:40px;">
            ${logoBlock ? `<div>${logoBlock}</div>` : `<div style="font-size:20px;font-weight:800;color:#fff;letter-spacing:0.05em;">${t.company_name ?? ''}</div>`}
            <div style="font-size:9px;letter-spacing:0.2em;text-transform:uppercase;color:#ffffff66;">${t.header_text}</div>
          </div>
          <div style="background:#ffffff0f;border-radius:12px;padding:40px 48px;position:relative;">
            ${watermarkCSS}
            <p style="font-size:${t.font_size_body}px;color:#ffffff99;margin:0 0 10px;">${t.intro_text}</p>
            <div style="font-size:${t.font_size_name}px;color:#fff;font-weight:700;margin-bottom:10px;">${data.student_name}</div>
            <p style="font-size:${t.font_size_body}px;color:#ffffff88;margin:0 0 6px;">${t.body_text}</p>
            <div style="font-size:18px;color:${t.secondary_color};font-weight:600;margin-bottom:32px;">${data.course_name}</div>
            <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:32px;">
              ${[['Carga horária', `${data.carga_horaria}h`], ['Aproveitamento', `${data.aproveitamento}%`], ['Emitido em', issuedDate]].map(([label, value]) => `
                <div style="background:#ffffff14;border-radius:8px;padding:12px 16px;text-align:center;">
                  <div style="font-size:10px;text-transform:uppercase;letter-spacing:.08em;color:#ffffff55;margin-bottom:4px;">${label}</div>
                  <div style="font-size:14px;font-weight:700;color:#fff;">${value}</div>
                </div>`).join('')}
            </div>
            ${signatureBlock.replace(new RegExp(t.text_color, 'g'), '#fff').replace(/88/g, 'aa')}
          </div>
          <div style="margin-top:20px;font-size:9px;color:#ffffff44;letter-spacing:0.12em;text-align:center;">Código: ${data.validation_code} &nbsp;·&nbsp; ${t.footer_text}</div>
        </div>
      </div>`,
  };

  const body = layouts[t.layout_type] ?? layouts.classic;

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Certificado — ${data.student_name}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #f0f2f5; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 32px; font-family: Georgia, serif; }
    @media print { body { background: white; padding: 0; } }
  </style>
</head>
<body>${body}</body>
</html>`;
}

// ─── Conversão de linha de certificado → CertificateData ────────────────────────
// Fonte única de verdade: qualquer lugar que renderize um certificado deve passar
// pela mesma função, garantindo o MESMO layout (template) em todos os pontos.

export function certRowToCertificateData(cert: any): CertificateData {
  return {
    id: cert.id,
    student_name: cert.usuarios?.nome || cert.usuario?.nome || cert.usuario_nome || 'Aluno',
    course_name: cert.cursos?.nome || cert.curso?.nome || cert.curso_nome || 'Curso',
    carga_horaria: cert.carga_horaria ?? 0,
    aproveitamento: cert.aproveitamento ?? cert.nota_final ?? cert.nota ?? 0,
    issued_at: cert.issued_at || cert.data_emissao || cert.data_conclusao || new Date().toISOString(),
    validation_code: cert.validation_code || cert.numero_certificado || (cert.id ? cert.id.slice(0, 8).toUpperCase() : ''),
    template: cert.certificate_templates ?? null,
  };
}

// Renderiza o HTML do certificado a partir de uma linha do banco (com template).
export function buildCertificateHTMLFromRow(cert: any): string {
  return buildCertificateHTML(certRowToCertificateData(cert));
}

// Abre o certificado (com seu template) numa nova aba — usado por "Visualizar".
export function openCertificateFromRow(cert: any): void {
  const html = buildCertificateHTMLFromRow(cert);
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
  setTimeout(() => URL.revokeObjectURL(url), 15_000);
}

// ─── Public API ────────────────────────────────────────────────────────────────

export async function generateCertificatePDFFromData(data: CertificateData): Promise<void> {
  const html = buildCertificateHTML(data);

  // Try html2canvas + jsPDF (installed)
  try {
    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'position:fixed;left:-9999px;top:0;width:900px;height:640px;border:none;';
    document.body.appendChild(iframe);
    iframe.contentDocument!.write(html);
    iframe.contentDocument!.close();

    await new Promise(r => setTimeout(r, 600));

    const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
      import('html2canvas'),
      import('jspdf'),
    ]);

    const canvas = await html2canvas(iframe.contentDocument!.body.firstElementChild as HTMLElement, {
      scale: 2,
      useCORS: true,
      backgroundColor: null,
    });

    const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [canvas.width / 2, canvas.height / 2] });
    pdf.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, canvas.width / 2, canvas.height / 2);
    pdf.save(`certificado-${data.validation_code}.pdf`);

    document.body.removeChild(iframe);
  } catch {
    // Fallback: open HTML in new tab (user can Ctrl+P → Save as PDF)
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
  }
}

export async function previewCertificateInNewTab(data: CertificateData): Promise<void> {
  const html = buildCertificateHTML(data);
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
  setTimeout(() => URL.revokeObjectURL(url), 15_000);
}
