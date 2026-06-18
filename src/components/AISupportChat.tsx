import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Send, 
  User, 
  X, 
  AlertCircle,
  Minimize2,
  Maximize2,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useEmpresa } from '@/context/EmpresaContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

// Orçamento mensal de tokens por plano — espelha o servidor (ai-support.mts).
const PLAN_TOKEN_LIMITS: Record<string, number> = {
  trial: 20000, starter: 50000, pro: 200000, enterprise: 1000000,
};

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai' | 'system';
  timestamp: Date;
  tokensUsed?: number;
}

interface TokenUsage {
  userId: string;
  tokensUsed: number;
  tokensLimit: number;
  lastReset: Date;
}

interface AISupportChatProps {
  isOpen: boolean;
  onClose: () => void;
  courseId?: string;
  courseName?: string;
}

export function AISupportChat({ isOpen, onClose, courseId, courseName }: AISupportChatProps) {
  const { userProfile } = useAuth();
  const { empresa } = useEmpresa();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [tokenUsage, setTokenUsage] = useState<TokenUsage | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Configuração da IA
  const AI_CONFIG = {
    model: 'gpt-3.5-turbo',
    maxTokens: 1000,
    temperature: 0.7,
    systemPrompt: `Você é um assistente especializado em suporte técnico para a plataforma Panalearn. 
    
    Contexto da plataforma:
    - Plataforma de treinamentos online
    - Cursos sobre PABX, Omnichannel, configurações
    - Sistema de vídeos, quizzes e certificados
    - Usuários: admin, admin_master, client, user
    
    Regras:
    1. Responda de forma clara e objetiva
    2. Seja sempre educado e profissional
    3. Se não souber algo, sugira contatar suporte humano
    4. Use linguagem técnica quando apropriado
    5. Limite respostas a 1000 tokens
    
    Curso atual: ${courseName || 'Não especificado'}
    ID do curso: ${courseId || 'Não especificado'}`
  };

  // Carregar histórico de mensagens
  useEffect(() => {
    if (isOpen && userProfile?.id) {
      loadChatHistory();
      loadTokenUsage();
    }
  }, [isOpen, userProfile?.id, empresa?.id]);

  // Auto-scroll para última mensagem
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Foco no input quando abrir
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, isMinimized]);

  const loadChatHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('ai_chat_history')
        .select('*')
        .eq('user_id', userProfile?.id)
        .order('created_at', { ascending: true })
        .limit(50);

      if (error) throw error;

      const formattedMessages: Message[] = data?.map(msg => ({
        id: msg.id,
        content: msg.content,
        sender: msg.sender,
        timestamp: new Date(msg.created_at),
        tokensUsed: msg.tokens_used
      })) || [];

      setMessages(formattedMessages);
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
    }
  };

  const loadTokenUsage = async () => {
    try {
      const plan = (empresa?.plan || 'trial').toLowerCase();
      const tokensLimit = PLAN_TOKEN_LIMITS[plan] ?? PLAN_TOKEN_LIMITS.trial;
      const period = new Date().toISOString().slice(0, 7); // YYYY-MM
      let tokensUsed = 0;
      if (empresa?.id) {
        const { data } = await supabase
          .from('ai_token_usage')
          .select('tokens_used')
          .eq('empresa_id', empresa.id)
          .eq('period_month', period)
          .maybeSingle();
        tokensUsed = Number((data as any)?.tokens_used || 0);
      }
      setTokenUsage({ userId: userProfile?.id || '', tokensUsed, tokensLimit, lastReset: new Date() });
    } catch (error) {
      console.error('Erro ao carregar uso de tokens:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage.trim(),
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Limite informativo no cliente — o servidor é a fonte de verdade.
      if (tokenUsage && tokenUsage.tokensUsed >= tokenUsage.tokensLimit) {
        throw new Error('Limite mensal de tokens da IA atingido para sua empresa. Fale com o suporte.');
      }

      const { data: sess } = await supabase.auth.getSession();
      const token = sess.session?.access_token;
      if (!token) throw new Error('Sessão expirada. Faça login novamente.');

      const res = await fetch('/api/ai-support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message: userMessage.content, courseId, courseName }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Não foi possível consultar a IA.');

      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: result.reply,
        sender: 'ai',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiResponse]);

      if (typeof result.tokensUsed === 'number' && typeof result.tokensLimit === 'number') {
        setTokenUsage(prev => ({
          userId: prev?.userId || '',
          lastReset: prev?.lastReset || new Date(),
          tokensUsed: result.tokensUsed,
          tokensLimit: result.tokensLimit,
        }));
      }
    } catch (error) {
      console.error('Erro ao processar mensagem:', error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: error instanceof Error ? error.message : 'Erro ao processar sua mensagem. Tente novamente.',
        sender: 'system',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
      toast({
        title: "Erro",
        description: "Não foi possível processar sua mensagem. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getTokenUsagePercentage = () => {
    if (!tokenUsage) return 0;
    return Math.min((tokenUsage.tokensUsed / tokenUsage.tokensLimit) * 100, 100);
  };

  const getTokenBarColor = () => {
    const pct = getTokenUsagePercentage();
    if (pct >= 90) return '#ef4444';
    if (pct >= 75) return '#f59e0b';
    if (pct >= 50) return '#eab308';
    return '#417B5A';
  };

  const formatTokens = (n: number) => {
    if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
    return n.toString();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 ai-chat-panel" style={{ transformOrigin: 'bottom right' }}>
      <div
        className={`flex flex-col overflow-hidden transition-all duration-300 ${isMinimized ? 'h-14' : ''}`}
        style={{
          width: isMinimized ? 320 : 384,
          height: isMinimized ? 56 : 540,
          borderRadius: 16,
          boxShadow: '0 8px 40px rgba(31,32,65,0.22), 0 2px 8px rgba(0,0,0,0.08)',
          background: '#ffffff',
          border: '1px solid rgba(208,206,186,0.3)',
        }}
      >
        {/* ── Header Premium ── */}
        <div
          className="ai-gradient-header relative flex items-center justify-between px-4 flex-shrink-0 cursor-pointer"
          style={{ height: 56, minHeight: 56 }}
          onClick={() => isMinimized && setIsMinimized(false)}
        >
          {/* Shimmer overlay */}
          <div className="ai-shimmer absolute inset-0 pointer-events-none" style={{ borderRadius: '16px 16px 0 0' }} />

          <div className="flex items-center gap-3 relative z-10">
            {/* Logo PanaLearn mini no header */}
            <div
              className="flex items-center justify-center rounded-lg overflow-hidden flex-shrink-0"
              style={{
                width: 34,
                height: 34,
                background: 'rgba(255,255,255,0.12)',
                backdropFilter: 'blur(8px)',
              }}
            >
              <img
                src="/brand/panalearn-mark-white.png"
                alt="PanaLearn"
                className="w-6 h-6 object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
            <div>
              <p style={{ color: '#E9D2C0', fontSize: 14, fontWeight: 600, lineHeight: 1.2, margin: 0 }}>
                Assistente IA
              </p>
              <div className="flex items-center gap-1.5" style={{ marginTop: 1 }}>
                <span
                  className="animate-pulse"
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: '#4ade80',
                    display: 'inline-block',
                  }}
                />
                <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: 11, fontWeight: 400 }}>
                  Online • PanaLearn
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 relative z-10">
            <button
              onClick={(e) => { e.stopPropagation(); setIsMinimized(!isMinimized); }}
              className="p-1.5 rounded-md transition-colors duration-150"
              style={{ color: 'rgba(255,255,255,0.5)', background: 'none', border: 'none', cursor: 'pointer' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#E9D2C0'; (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.1)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.5)'; (e.currentTarget as HTMLButtonElement).style.background = 'none'; }}
              title={isMinimized ? 'Expandir' : 'Minimizar'}
            >
              {isMinimized ? <Maximize2 className="h-3.5 w-3.5" /> : <Minimize2 className="h-3.5 w-3.5" />}
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onClose(); }}
              className="p-1.5 rounded-md transition-colors duration-150"
              style={{ color: 'rgba(255,255,255,0.5)', background: 'none', border: 'none', cursor: 'pointer' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#E9D2C0'; (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.1)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.5)'; (e.currentTarget as HTMLButtonElement).style.background = 'none'; }}
              title="Fechar"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* ── Token usage bar (abaixo do header) ── */}
        {!isMinimized && tokenUsage && (
          <div className="px-4 pt-2 pb-1 flex items-center gap-2" style={{ background: '#fafafa' }}>
            <div className="ai-token-bar flex-1">
              <div
                className="ai-token-bar-fill"
                style={{
                  width: `${getTokenUsagePercentage()}%`,
                  background: getTokenBarColor(),
                }}
              />
            </div>
            <span style={{ fontSize: 10, color: '#9ca3af', fontWeight: 500, whiteSpace: 'nowrap' }}>
              {formatTokens(tokenUsage.tokensUsed)}/{formatTokens(tokenUsage.tokensLimit)}
            </span>
          </div>
        )}

        {/* ── Área de mensagens ── */}
        {!isMinimized && (
          <div className="flex-1 flex flex-col overflow-hidden">
            <ScrollArea className="flex-1 px-4">
              <div className="space-y-3 py-3">
                {/* Welcome message */}
                {messages.length === 0 && (
                  <div className="text-center py-8 px-4">
                    <div
                      className="mx-auto mb-4 flex items-center justify-center rounded-2xl"
                      style={{
                        width: 64,
                        height: 64,
                        background: 'linear-gradient(135deg, rgba(65,123,90,0.08) 0%, rgba(75,63,114,0.08) 100%)',
                        border: '1px solid rgba(65,123,90,0.12)',
                      }}
                    >
                      <img
                        src="/brand/panalearn-mark-color.png"
                        alt="PanaLearn IA"
                        className="w-10 h-10 object-contain"
                      />
                    </div>
                    <p style={{ fontSize: 15, fontWeight: 600, color: '#1F2041', marginBottom: 4 }}>
                      Olá! Sou o assistente IA
                    </p>
                    <p style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.5 }}>
                      da PanaLearn. Como posso ajudar você hoje?
                    </p>
                    <div className="flex flex-wrap gap-2 justify-center mt-4">
                      {['Como começar?', 'Dúvida técnica', 'Meus cursos'].map((suggestion) => (
                        <button
                          key={suggestion}
                          onClick={() => { setInputMessage(suggestion); inputRef.current?.focus(); }}
                          className="px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-150"
                          style={{
                            background: 'rgba(65,123,90,0.06)',
                            color: '#417B5A',
                            border: '1px solid rgba(65,123,90,0.15)',
                            cursor: 'pointer',
                          }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(65,123,90,0.12)'; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(65,123,90,0.06)'; }}
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Messages */}
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {/* AI Avatar */}
                    {message.sender === 'ai' && (
                      <div
                        className="flex-shrink-0 mt-1 mr-2 flex items-center justify-center rounded-lg"
                        style={{
                          width: 28,
                          height: 28,
                          background: 'linear-gradient(135deg, rgba(65,123,90,0.1), rgba(75,63,114,0.1))',
                          border: '1px solid rgba(65,123,90,0.15)',
                        }}
                      >
                        <img
                          src="/brand/panalearn-mark-color.png"
                          alt="IA"
                          className="w-4 h-4 object-contain"
                        />
                      </div>
                    )}

                    <div
                      className={`max-w-[78%] rounded-2xl px-3.5 py-2.5 text-sm ${
                        message.sender === 'user'
                          ? 'ai-gradient-user-msg'
                          : message.sender === 'ai'
                          ? ''
                          : ''
                      }`}
                      style={
                        message.sender === 'user'
                          ? {
                              color: '#E9D2C0',
                              borderBottomRightRadius: 4,
                            }
                          : message.sender === 'ai'
                          ? {
                              background: '#f5f5f7',
                              color: '#1F2041',
                              border: '1px solid rgba(208,206,186,0.25)',
                              borderBottomLeftRadius: 4,
                            }
                          : {
                              background: 'rgba(239,68,68,0.06)',
                              color: '#dc2626',
                              border: '1px solid rgba(239,68,68,0.15)',
                              borderRadius: 12,
                            }
                      }
                    >
                      {/* Message meta */}
                      <div className="flex items-center gap-1.5 mb-1">
                        {message.sender === 'user' && (
                          <User className="h-3 w-3" style={{ opacity: 0.6 }} />
                        )}
                        {message.sender === 'system' && (
                          <AlertCircle className="h-3 w-3" />
                        )}
                        <span style={{ fontSize: 10, opacity: 0.5 }}>
                          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {message.tokensUsed && (
                          <Badge
                            variant="outline"
                            className="text-xs py-0 h-4"
                            style={{ fontSize: 9, opacity: 0.6 }}
                          >
                            {message.tokensUsed}t
                          </Badge>
                        )}
                      </div>
                      <p className="whitespace-pre-wrap leading-relaxed" style={{ margin: 0, color: 'inherit' }}>
                        {message.content}
                      </p>
                    </div>

                    {/* User Avatar */}
                    {message.sender === 'user' && (
                      <div
                        className="flex-shrink-0 mt-1 ml-2 flex items-center justify-center rounded-lg"
                        style={{
                          width: 28,
                          height: 28,
                          background: '#4B3F72',
                        }}
                      >
                        <span style={{ fontSize: 11, fontWeight: 600, color: '#E9D2C0' }}>
                          {userProfile?.nome?.charAt(0)?.toUpperCase() || 'U'}
                        </span>
                      </div>
                    )}
                  </div>
                ))}

                {/* Typing indicator */}
                {isLoading && (
                  <div className="flex justify-start">
                    <div
                      className="flex-shrink-0 mt-1 mr-2 flex items-center justify-center rounded-lg"
                      style={{
                        width: 28,
                        height: 28,
                        background: 'linear-gradient(135deg, rgba(65,123,90,0.1), rgba(75,63,114,0.1))',
                        border: '1px solid rgba(65,123,90,0.15)',
                      }}
                    >
                      <img src="/brand/panalearn-mark-color.png" alt="IA" className="w-4 h-4 object-contain" />
                    </div>
                    <div
                      className="rounded-2xl px-4 py-3"
                      style={{
                        background: '#f5f5f7',
                        border: '1px solid rgba(208,206,186,0.25)',
                        borderBottomLeftRadius: 4,
                      }}
                    >
                      <div className="ai-typing-dots">
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* ── Input area ── */}
            <div
              className="flex-shrink-0 px-4 py-3"
              style={{
                borderTop: '1px solid rgba(208,206,186,0.2)',
                background: '#fafafa',
              }}
            >
              <div className="flex gap-2 items-end">
                <Input
                  ref={inputRef}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Digite sua dúvida..."
                  disabled={isLoading}
                  className="flex-1 text-sm rounded-xl border"
                  style={{
                    background: '#ffffff',
                    borderColor: 'rgba(208,206,186,0.35)',
                    color: '#1F2041',
                    padding: '10px 14px',
                    fontSize: 13,
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#417B5A';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(65,123,90,0.1)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(208,206,186,0.35)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={isLoading || !inputMessage.trim()}
                  className="flex items-center justify-center rounded-xl transition-all duration-200"
                  style={{
                    width: 40,
                    height: 40,
                    background: isLoading || !inputMessage.trim()
                      ? '#e4e5f0'
                      : 'linear-gradient(135deg, #417B5A 0%, #4B3F72 100%)',
                    border: 'none',
                    cursor: isLoading || !inputMessage.trim() ? 'not-allowed' : 'pointer',
                    flexShrink: 0,
                  }}
                  onMouseEnter={(e) => {
                    if (!isLoading && inputMessage.trim()) {
                      (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.05)';
                      (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 2px 12px rgba(65,123,90,0.3)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
                    (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none';
                  }}
                >
                  <Send
                    className="h-4 w-4"
                    style={{
                      color: isLoading || !inputMessage.trim() ? '#9ca3af' : '#ffffff',
                    }}
                  />
                </button>
              </div>

              {/* Token warning */}
              {tokenUsage && getTokenUsagePercentage() >= 90 && (
                <div
                  className="mt-2 px-3 py-2 rounded-lg flex items-center gap-2"
                  style={{
                    background: 'rgba(239,68,68,0.06)',
                    border: '1px solid rgba(239,68,68,0.12)',
                    fontSize: 11,
                    color: '#dc2626',
                  }}
                >
                  <AlertCircle className="h-3 w-3 flex-shrink-0" />
                  <span>Limite de tokens próximo. Contate o suporte humano se necessário.</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
