import React, { useState, useCallback } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

// ─── Paleta predefinida ────────────────────────────────────────────────────────
export const COLOR_PALETTE: Record<string, string[]> = {
  'Neutros': [
    '#FFFFFF', '#F9FAFB', '#F3F4F6', '#E5E7EB',
    '#9CA3AF', '#6B7280', '#374151', '#111827',
  ],
  'Azuis': [
    '#EFF6FF', '#BFDBFE', '#60A5FA', '#3B82F6',
    '#2563EB', '#1D4ED8', '#1E40AF', '#1E3A8A',
  ],
  'Roxos': [
    '#F5F3FF', '#DDD6FE', '#A78BFA', '#8B5CF6',
    '#7C3AED', '#6D28D9', '#5B21B6', '#4C1D95',
  ],
  'Verdes': [
    '#F0FDF4', '#BBF7D0', '#4ADE80', '#22C55E',
    '#16A34A', '#15803D', '#166534', '#14532D',
  ],
  'Amarelos / Dourados': [
    '#FEFCE8', '#FEF08A', '#FDE047', '#FACC15',
    '#EAB308', '#CA8A04', '#A16207', '#854D0E',
  ],
  'Laranjas': [
    '#FFF7ED', '#FED7AA', '#FB923C', '#F97316',
    '#EA580C', '#C2410C', '#9A3412', '#7C2D12',
  ],
  'Vermelhos': [
    '#FEF2F2', '#FECACA', '#F87171', '#EF4444',
    '#DC2626', '#B91C1C', '#991B1B', '#7F1D1D',
  ],
  'Rosas': [
    '#FFF1F2', '#FFE4E6', '#FDA4AF', '#FB7185',
    '#F43F5E', '#E11D48', '#BE123C', '#9F1239',
  ],
  'Corporativos': [
    '#1F2041', '#4B3F72', '#417B5A', '#D0CEBA',
    '#0F172A', '#1E293B', '#0369A1', '#065F46',
  ],
};

// ─── Props ─────────────────────────────────────────────────────────────────────
interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (hex: string) => void;
  description?: string;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────
function isValidHex(h: string) {
  return /^#[0-9A-Fa-f]{6}$/.test(h);
}

function normaliseHex(raw: string): string {
  let h = raw.trim();
  if (!h.startsWith('#')) h = '#' + h;
  return h.toUpperCase();
}

// ─── Component ─────────────────────────────────────────────────────────────────
export const ColorPicker: React.FC<ColorPickerProps> = ({ label, value, onChange, description }) => {
  const [hexInput, setHexInput] = useState(value.toUpperCase());
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({ 'Corporativos': true });

  // Keep hex input in sync when value changes externally
  React.useEffect(() => {
    setHexInput(value.toUpperCase());
  }, [value]);

  const handleSwatch = useCallback((hex: string) => {
    onChange(hex);
    setHexInput(hex.toUpperCase());
  }, [onChange]);

  const handleHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setHexInput(raw);
    const normalised = normaliseHex(raw);
    if (isValidHex(normalised)) onChange(normalised);
  };

  const handleNativeColor = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleSwatch(e.target.value.toUpperCase());
  };

  const toggleGroup = (group: string) =>
    setOpenGroups(prev => ({ ...prev, [group]: !prev[group] }));

  return (
    <div className="space-y-2">
      {/* Label + description */}
      <div>
        <span className="block text-xs font-medium text-white/50 uppercase tracking-wider">{label}</span>
        {description && <span className="text-[10px] text-white/30">{description}</span>}
      </div>

      {/* Current color + hex input row */}
      <div className="flex items-center gap-2">
        <div
          className="relative w-9 h-9 rounded-lg border border-white/20 flex-shrink-0 overflow-hidden cursor-pointer shadow-inner"
          style={{ background: value }}
          title="Cor atual"
        >
          <input
            type="color"
            value={value}
            onChange={handleNativeColor}
            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
          />
        </div>
        <input
          type="text"
          value={hexInput}
          onChange={handleHexChange}
          maxLength={7}
          placeholder="#000000"
          className="flex-1 rounded-lg px-3 py-2 text-sm border border-slate-700 bg-slate-900/60 text-white placeholder-white/20 focus:border-[#4B3F72] focus:outline-none font-mono transition-colors"
          style={{ borderColor: isValidHex(normaliseHex(hexInput)) ? undefined : '#ef4444' }}
        />
        {/* Native color picker trigger */}
        <div className="relative w-9 h-9 rounded-lg border border-dashed border-white/20 flex-shrink-0 overflow-hidden cursor-pointer flex items-center justify-center text-white/30 hover:border-white/40 transition-colors" title="Cor personalizada">
          <span className="text-xs">+</span>
          <input
            type="color"
            value={isValidHex(value) ? value : '#4B3F72'}
            onChange={handleNativeColor}
            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
          />
        </div>
      </div>

      {/* Palette groups */}
      <div className="rounded-xl overflow-hidden border border-white/8" style={{ background: 'rgba(0,0,0,0.25)' }}>
        {Object.entries(COLOR_PALETTE).map(([group, colors]) => {
          const isOpen = openGroups[group] ?? false;
          return (
            <div key={group} className="border-b border-white/5 last:border-b-0">
              {/* Group header */}
              <button
                type="button"
                onClick={() => toggleGroup(group)}
                className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-2">
                  {/* Color preview strip */}
                  <div className="flex gap-0.5">
                    {colors.slice(3, 7).map(c => (
                      <div key={c} className="w-2.5 h-2.5 rounded-sm" style={{ background: c }} />
                    ))}
                  </div>
                  <span className="text-[11px] font-medium text-white/50">{group}</span>
                </div>
                {isOpen
                  ? <ChevronDown className="w-3 h-3 text-white/30" />
                  : <ChevronRight className="w-3 h-3 text-white/30" />
                }
              </button>

              {/* Swatches */}
              {isOpen && (
                <div className="grid grid-cols-8 gap-1 px-3 pb-2.5 pt-1">
                  {colors.map(hex => {
                    const isSelected = value.toUpperCase() === hex.toUpperCase();
                    return (
                      <button
                        key={hex}
                        type="button"
                        onClick={() => handleSwatch(hex)}
                        title={hex}
                        className="w-full aspect-square rounded-md transition-transform hover:scale-110 focus:outline-none"
                        style={{
                          background: hex,
                          border: isSelected ? '2px solid #fff' : '1px solid rgba(255,255,255,0.12)',
                          boxShadow: isSelected ? `0 0 0 2px #4B3F72` : undefined,
                          transform: isSelected ? 'scale(1.15)' : undefined,
                        }}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ColorPicker;
