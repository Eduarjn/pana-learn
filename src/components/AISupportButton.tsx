import React, { useState } from 'react';
import { AISupportChat } from './AISupportChat';
import { useAuth } from '@/hooks/useAuth';

interface AISupportButtonProps {
  courseId?: string;
  courseName?: string;
}

export function AISupportButton({ courseId, courseName }: AISupportButtonProps) {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const { userProfile } = useAuth();

  const handleToggleChat = () => {
    setIsChatOpen(prev => !prev);
  };

  const handleCloseChat = () => {
    setIsChatOpen(false);
  };

  return (
    <>
      {/* ── Botão Flutuante com Logotipo PanaLearn ── */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={handleToggleChat}
          className="ai-fab group relative flex items-center justify-center w-16 h-16 rounded-full cursor-pointer border-0 p-0 outline-none focus:outline-none"
          style={{
            background: 'linear-gradient(145deg, #ffffff 0%, #f0f0f5 100%)',
            boxShadow: '0 4px 20px rgba(31,32,65,0.18), 0 1px 4px rgba(0,0,0,0.1)',
            transition: 'transform 0.25s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.3s ease',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.08)';
            (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 6px 28px rgba(65,123,90,0.35), 0 0 16px rgba(75,63,114,0.2)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
            (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 20px rgba(31,32,65,0.18), 0 1px 4px rgba(0,0,0,0.1)';
          }}
          title="Assistente IA PanaLearn"
          aria-label="Abrir Assistente IA PanaLearn"
        >
          {/* Anel pulsante orbital */}
          {!isChatOpen && <div className="ai-fab-ring" />}

          {/* Logo da PanaLearn como ícone */}
          <img
            src="/brand/panalearn-mark-color.png"
            alt="PanaLearn IA"
            className="w-9 h-9 object-contain rounded-sm transition-transform duration-300"
            style={{
              transform: isChatOpen ? 'rotate(180deg) scale(0.85)' : 'rotate(0deg) scale(1)',
              filter: isChatOpen ? 'grayscale(0.3)' : 'none',
            }}
            onError={(e) => {
              // Fallback: se a imagem não carregar, mostra texto
              e.currentTarget.style.display = 'none';
              const parent = e.currentTarget.parentElement;
              if (parent) {
                const fallback = document.createElement('span');
                fallback.textContent = 'IA';
                fallback.style.cssText = 'font-weight:700;font-size:16px;color:#417B5A;font-family:Quicksand,sans-serif;';
                parent.appendChild(fallback);
              }
            }}
          />

          {/* X overlay quando o chat está aberto */}
          {isChatOpen && (
            <div
              className="absolute inset-0 flex items-center justify-center rounded-full"
              style={{
                background: 'rgba(31,32,65,0.08)',
                pointerEvents: 'none',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ position: 'absolute', top: 4, right: 4 }}>
                <path d="M1 1L13 13M13 1L1 13" stroke="#4B3F72" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
          )}

          {/* Indicador de status "Online" */}
          {!isChatOpen && (
            <div
              className="absolute -bottom-0.5 -right-0.5 flex items-center gap-1 px-1.5 py-0.5 rounded-full"
              style={{
                background: '#ffffff',
                boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
                fontSize: '8px',
                fontWeight: 600,
                color: '#417B5A',
                letterSpacing: '0.02em',
              }}
            >
              <span
                className="animate-pulse"
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: '50%',
                  background: '#417B5A',
                  display: 'inline-block',
                }}
              />
              IA
            </div>
          )}

          {/* Tooltip no hover */}
          <div
            className="absolute bottom-full right-0 mb-3 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none"
            style={{
              transform: 'translateY(4px)',
            }}
          >
            <div
              className="px-3 py-2 rounded-lg whitespace-nowrap"
              style={{
                background: 'linear-gradient(135deg, #1F2041, #4B3F72)',
                color: '#E9D2C0',
                fontSize: '12px',
                fontWeight: 500,
                boxShadow: '0 4px 12px rgba(31,32,65,0.3)',
              }}
            >
              Assistente IA • Online
              <div
                style={{
                  position: 'absolute',
                  bottom: -4,
                  right: 18,
                  width: 8,
                  height: 8,
                  background: '#4B3F72',
                  transform: 'rotate(45deg)',
                }}
              />
            </div>
          </div>
        </button>
      </div>

      {/* ── Chat de Suporte ── */}
      <AISupportChat
        isOpen={isChatOpen}
        onClose={handleCloseChat}
        courseId={courseId}
        courseName={courseName}
      />
    </>
  );
}
