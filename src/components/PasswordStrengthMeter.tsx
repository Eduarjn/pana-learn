// Medidor de força de senha reutilizável + utilitários.
// A avaliação é só um guia visual no cliente — a verificação de senha vazada
// (HaveIBeenPwned) roda no servidor do Supabase Auth no momento do signup/update.

export interface ForcaSenha {
  nivel: 0 | 1 | 2 | 3;
  label: string;
  cor: string;
}

export function avaliarForcaSenha(s: string): ForcaSenha {
  if (!s) return { nivel: 0, label: '', cor: '#E5E7EB' };
  let score = 0;
  if (s.length >= 8) score++;
  if (s.length >= 12) score++;
  if (/[a-z]/.test(s) && /[A-Z]/.test(s)) score++;
  if (/\d/.test(s)) score++;
  if (/[^A-Za-z0-9]/.test(s)) score++;
  if (score <= 2) return { nivel: 1, label: 'Fraca', cor: '#DC2626' };
  if (score <= 3) return { nivel: 2, label: 'Média', cor: '#F59E0B' };
  return { nivel: 3, label: 'Forte', cor: '#417B5A' };
}

// Gera uma senha forte (12 chars, com maiúscula, minúscula, número e símbolo).
export function gerarSenhaForte(): string {
  const lower = 'abcdefghijkmnpqrstuvwxyz';
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const nums = '23456789';
  const syms = '!@#$%&*?';
  const all = lower + upper + nums + syms;
  const pick = (set: string) => set[Math.floor(Math.random() * set.length)];
  let pwd = pick(lower) + pick(upper) + pick(nums) + pick(syms);
  for (let i = 0; i < 8; i++) pwd += pick(all);
  // Embaralha
  return pwd.split('').sort(() => Math.random() - 0.5).join('');
}

interface MeterProps {
  senha: string;
  /** Mostra o texto de requisitos abaixo da barra (default: true) */
  hint?: boolean;
  className?: string;
}

export function PasswordStrengthMeter({ senha, hint = true, className = '' }: MeterProps) {
  const forca = avaliarForcaSenha(senha);
  if (!senha) {
    return hint ? (
      <p className={`text-xs mt-1 ${className}`} style={{ color: '#6B7280' }}>
        8+ caracteres com letras, números e símbolos. Senhas comuns ou vazadas são bloqueadas.
      </p>
    ) : null;
  }
  return (
    <div className={`mt-2 ${className}`}>
      <div className="flex gap-1">
        {[1, 2, 3].map(i => (
          <div
            key={i}
            className="h-1.5 flex-1 rounded-full transition-colors"
            style={{ background: i <= forca.nivel ? forca.cor : '#E5E7EB' }}
          />
        ))}
      </div>
      <p className="text-xs mt-1 font-medium" style={{ color: forca.cor }}>
        Senha {forca.label}
      </p>
    </div>
  );
}
