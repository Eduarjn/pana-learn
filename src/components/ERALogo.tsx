import React from 'react';

interface ERALogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'full' | 'icon';
}

export const ERALogo: React.FC<ERALogoProps> = ({ 
  className = '', 
  size = 'md', 
  variant = 'full' 
}) => {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16'
  };

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-lg',
    xl: 'text-xl'
  };

  if (variant === 'icon') {
    return (
      <div className={`${sizeClasses[size]} ${className}`}>
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          {/* Background circle */}
          <circle cx="50" cy="50" r="45" fill="#CCFF00" />
          
          {/* E - com corte triangular no meio */}
          <path
            d="M20 20 L20 80 L80 80 L80 70 L35 70 L35 55 L70 55 L70 45 L35 45 L35 30 L80 30 L80 20 Z"
            fill="#232323"
          />
          
          {/* R - com perna angular */}
          <path
            d="M25 20 L25 80 L45 80 C55 80 60 75 60 65 C60 55 55 50 45 50 L35 50 L35 30 L60 30 L60 20 Z M35 60 L45 60 C50 60 50 55 45 55 L35 55 Z"
            fill="#232323"
          />
          
          {/* A - com corte interno */}
          <path
            d="M65 20 L85 80 L75 80 L70 60 L50 60 L45 80 L35 80 L55 20 Z M55 50 L65 50 L60 30 Z"
            fill="#232323"
          />
        </svg>
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center ${className}`}>
      {/* Logo principal */}
      <div className="flex items-center justify-center bg-[#CCFF00] rounded-lg p-3 shadow-lg">
        <svg
          viewBox="0 0 200 80"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-32 h-12"
        >
          {/* ERA - Letras principais com cortes geométricos */}
          
          {/* E - com corte triangular no meio */}
          <path
            d="M10 10 L10 70 L70 70 L70 60 L25 60 L25 45 L60 45 L60 35 L25 35 L25 20 L70 20 L70 10 Z"
            fill="#232323"
          />
          
          {/* R - com perna angular e corte */}
          <path
            d="M80 10 L80 70 L100 70 C115 70 125 65 125 55 C125 45 115 40 100 40 L90 40 L90 20 L120 20 L120 10 Z M90 50 L100 50 C105 50 105 45 100 45 L90 45 Z"
            fill="#232323"
          />
          
          {/* A - com corte interno triangular */}
          <path
            d="M130 10 L150 70 L140 70 L135 50 L115 50 L110 70 L100 70 L120 10 Z M115 40 L125 40 L120 20 Z"
            fill="#232323"
          />
          
          {/* LEARN - Texto secundário */}
          <text
            x="100"
            y="85"
            textAnchor="middle"
            className="text-[#232323] font-bold text-xs uppercase tracking-wider"
            fill="#232323"
          >
            LEARN
          </text>
        </svg>
      </div>
      
      {/* Texto LEARN abaixo */}
      <div className={`mt-1 ${textSizes[size]} font-bold text-[#232323] uppercase tracking-wider`}>
        LEARN
      </div>
    </div>
  );
};

export default ERALogo; 