import React from 'react';
import type { LayoutType } from '@/types/certificate';
import { Check } from 'lucide-react';

interface LayoutOption {
  id: LayoutType;
  label: string;
  description: string;
  preview: React.ReactNode;
}

// ─── Mini SVG previews ─────────────────────────────────────────────────────────
const ClassicPreview = ({ primary, secondary }: { primary: string; secondary: string }) => (
  <svg viewBox="0 0 80 56" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    {/* Paper */}
    <rect x="1" y="1" width="78" height="54" rx="3" fill="white" stroke={primary} strokeWidth="2" />
    {/* Double border */}
    <rect x="4" y="4" width="72" height="48" rx="2" fill="none" stroke={primary} strokeWidth="0.8" strokeDasharray="2 1" />
    {/* Title bar */}
    <rect x="20" y="8" width="40" height="4" rx="1" fill={primary} opacity="0.9" />
    {/* Divider */}
    <line x1="28" y1="15" x2="52" y2="15" stroke={secondary} strokeWidth="1" />
    {/* Name line */}
    <rect x="16" y="19" width="48" height="5" rx="1" fill={secondary} opacity="0.3" />
    {/* Body lines */}
    <rect x="22" y="27" width="36" height="2" rx="0.5" fill="#9CA3AF" opacity="0.6" />
    <rect x="18" y="31" width="44" height="2" rx="0.5" fill="#9CA3AF" opacity="0.4" />
    {/* Signature line */}
    <line x1="28" y1="44" x2="52" y2="44" stroke="#CBD5E1" strokeWidth="1" />
    <rect x="30" y="46" width="20" height="1.5" rx="0.5" fill="#9CA3AF" opacity="0.5" />
  </svg>
);

const ModernPreview = ({ primary, secondary }: { primary: string; secondary: string }) => (
  <svg viewBox="0 0 80 56" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    {/* Paper */}
    <rect x="1" y="1" width="78" height="54" rx="3" fill="white" />
    {/* Top colored bar */}
    <rect x="1" y="1" width="78" height="14" rx="3" fill={primary} />
    <rect x="1" y="8" width="78" height="7" fill={primary} />
    {/* Title in bar */}
    <rect x="8" y="5" width="30" height="3" rx="1" fill="white" opacity="0.9" />
    <rect x="54" y="4" width="18" height="2" rx="0.5" fill="white" opacity="0.4" />
    {/* Body */}
    <rect x="8" y="19" width="28" height="2" rx="0.5" fill="#9CA3AF" opacity="0.5" />
    <rect x="8" y="24" width="44" height="4" rx="1" fill="#374151" opacity="0.7" />
    <rect x="8" y="31" width="36" height="2" rx="0.5" fill="#9CA3AF" opacity="0.4" />
    {/* Accent left-bordered cards */}
    <rect x="8" y="36" width="18" height="9" rx="1" fill={secondary} opacity="0.12" />
    <rect x="8" y="36" width="2" height="9" rx="0.5" fill={secondary} />
    <rect x="30" y="36" width="18" height="9" rx="1" fill={secondary} opacity="0.12" />
    <rect x="30" y="36" width="2" height="9" rx="0.5" fill={secondary} />
    {/* Bottom accent line */}
    <rect x="1" y="51" width="78" height="4" rx="0" fill={secondary} opacity="0.7" />
    <rect x="1" y="51" width="38" height="4" rx="0" fill={primary} opacity="0.8" />
  </svg>
);

const MinimalPreview = ({ primary, secondary }: { primary: string; secondary: string }) => (
  <svg viewBox="0 0 80 56" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    {/* Paper */}
    <rect x="1" y="1" width="78" height="54" rx="3" fill="white" />
    {/* Top row */}
    <rect x="8" y="8" width="16" height="2" rx="0.5" fill="#9CA3AF" opacity="0.5" />
    <rect x="56" y="8" width="16" height="2" rx="0.5" fill={secondary} opacity="0.6" />
    {/* Name */}
    <rect x="8" y="18" width="40" height="5" rx="1" fill="#111827" opacity="0.8" />
    {/* Accent line */}
    <rect x="8" y="26" width="12" height="1.5" rx="0.5" fill={secondary} />
    {/* Lines */}
    <rect x="8" y="30" width="26" height="2" rx="0.5" fill="#9CA3AF" opacity="0.4" />
    <rect x="8" y="34" width="34" height="2" rx="0.5" fill="#9CA3AF" opacity="0.3" />
    {/* Stats */}
    <rect x="8" y="41" width="12" height="7" rx="1" fill="#F9FAFB" stroke="#E5E7EB" strokeWidth="0.5" />
    <rect x="24" y="41" width="12" height="7" rx="1" fill="#F9FAFB" stroke="#E5E7EB" strokeWidth="0.5" />
    <rect x="40" y="41" width="12" height="7" rx="1" fill="#F9FAFB" stroke="#E5E7EB" strokeWidth="0.5" />
  </svg>
);

const CorporatePreview = ({ primary, secondary }: { primary: string; secondary: string }) => (
  <svg viewBox="0 0 80 56" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    {/* Dark background */}
    <rect x="1" y="1" width="78" height="54" rx="3" fill={primary} />
    {/* Top row */}
    <rect x="8" y="7" width="18" height="5" rx="1" fill="white" opacity="0.9" />
    <rect x="56" y="8" width="16" height="2" rx="0.5" fill="white" opacity="0.3" />
    {/* Inner card */}
    <rect x="6" y="16" width="68" height="34" rx="2" fill="white" opacity="0.08" />
    {/* Content */}
    <rect x="12" y="20" width="24" height="2" rx="0.5" fill="white" opacity="0.4" />
    <rect x="12" y="25" width="40" height="4" rx="1" fill="white" opacity="0.9" />
    <rect x="12" y="32" width="28" height="2" rx="0.5" fill={secondary} opacity="0.8" />
    {/* Stats grid */}
    <rect x="12" y="37" width="16" height="8" rx="1" fill="white" opacity="0.1" />
    <rect x="32" y="37" width="16" height="8" rx="1" fill="white" opacity="0.1" />
    <rect x="52" y="37" width="16" height="8" rx="1" fill="white" opacity="0.1" />
  </svg>
);

// ─── Layout definitions ────────────────────────────────────────────────────────
function buildLayouts(primary: string, secondary: string): LayoutOption[] {
  return [
    {
      id: 'classic',
      label: 'Clássico',
      description: 'Diploma tradicional com borda ornamental',
      preview: <ClassicPreview primary={primary} secondary={secondary} />,
    },
    {
      id: 'modern',
      label: 'Moderno',
      description: 'Barra de cabeçalho colorida em destaque',
      preview: <ModernPreview primary={primary} secondary={secondary} />,
    },
    {
      id: 'minimal',
      label: 'Minimalista',
      description: 'Tipografia limpa, sem elementos pesados',
      preview: <MinimalPreview primary={primary} secondary={secondary} />,
    },
    {
      id: 'corporate',
      label: 'Corporativo',
      description: 'Fundo sólido na cor primária da marca',
      preview: <CorporatePreview primary={primary} secondary={secondary} />,
    },
  ];
}

// ─── Props ─────────────────────────────────────────────────────────────────────
interface LayoutSelectorProps {
  value: LayoutType;
  onChange: (v: LayoutType) => void;
  primaryColor?: string;
  secondaryColor?: string;
}

// ─── Component ─────────────────────────────────────────────────────────────────
export const LayoutSelector: React.FC<LayoutSelectorProps> = ({
  value,
  onChange,
  primaryColor = '#4B3F72',
  secondaryColor = '#417B5A',
}) => {
  const layouts = buildLayouts(primaryColor, secondaryColor);

  return (
    <div className="grid grid-cols-2 gap-2.5">
      {layouts.map(layout => {
        const isSelected = value === layout.id;
        return (
          <button
            key={layout.id}
            type="button"
            onClick={() => onChange(layout.id)}
            className="relative rounded-xl overflow-hidden text-left transition-all duration-200 focus:outline-none group"
            style={{
              border: isSelected
                ? `2px solid ${primaryColor}`
                : '2px solid rgba(255,255,255,0.08)',
              background: isSelected ? `${primaryColor}18` : 'rgba(255,255,255,0.03)',
            }}
          >
            {/* Selected badge */}
            {isSelected && (
              <span
                className="absolute top-2 right-2 z-10 w-4 h-4 rounded-full flex items-center justify-center"
                style={{ background: primaryColor }}
              >
                <Check className="w-2.5 h-2.5 text-white" />
              </span>
            )}

            {/* Preview thumbnail */}
            <div
              className="mx-auto mt-3 mb-0 px-2 transition-transform duration-200 group-hover:scale-[1.03]"
              style={{ width: '90%', aspectRatio: '80/56' }}
            >
              {layout.preview}
            </div>

            {/* Labels */}
            <div className="px-3 py-2.5">
              <div
                className="text-xs font-semibold mb-0.5 transition-colors"
                style={{ color: isSelected ? '#fff' : 'rgba(255,255,255,0.7)' }}
              >
                {layout.label}
              </div>
              <div className="text-[10px] leading-tight" style={{ color: 'rgba(255,255,255,0.35)' }}>
                {layout.description}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default LayoutSelector;
