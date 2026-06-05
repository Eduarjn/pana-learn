/**
 * Testes Vitest para useDashboardStats, useRecentActivity e useCategoryProgress
 *
 * Cobertos:
 *  - Sucesso: retorna dados calculados corretamente
 *  - Erro de rede: propaga o erro (React Query registra estado de erro)
 *  - Tenant incorreto: admin_master ignora filtro de empresa_id
 *  - Estado vazio: tabelas vazias retornam zeros/arrays vazios
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// ─── Mocks ────────────────────────────────────────────────────────────────────

// Mock do contexto EmpresaContext
const mockEmpresa = { id: 'empresa-abc', nome: 'Empresa Teste', plan: 'pro' };
vi.mock('@/context/EmpresaContext', () => ({
  useEmpresa: vi.fn(() => ({ empresa: mockEmpresa })),
}));

// Mock do contexto de auth
const mockUserProfile = { id: 'user-123', tipo_usuario: 'admin', empresa_id: 'empresa-abc' };
vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({ userProfile: mockUserProfile })),
}));

// Mock do Supabase — objeto que imita o encadeamento fluente de queries
const buildQueryChain = (resolveWith: { data?: any; count?: number | null; error?: any }) => {
  const chain: any = {
    select:    () => chain,
    eq:        () => chain,
    neq:       () => chain,
    gte:       () => chain,
    lt:        () => chain,
    not:       () => chain,
    order:     () => chain,
    limit:     () => chain,
    filter:    () => chain,
    in:        () => chain,
    inner:     () => chain,
    then:      (resolve: any) => Promise.resolve(resolveWith).then(resolve),
  };
  // Faz o chain ser thenable (awaitable)
  Object.defineProperty(chain, Symbol.toStringTag, { value: 'Promise' });
  return chain;
};

const supabaseMock = {
  from: vi.fn(),
};

vi.mock('@/integrations/supabase/client', () => ({
  supabase: supabaseMock,
}));

// ─── Helpers ─────────────────────────────────────────────────────────────────

const makeWrapper = () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client }, children);
};

// ─── useDashboardStats ────────────────────────────────────────────────────────

describe('useDashboardStats', () => {
  beforeEach(() => vi.clearAllMocks());

  it('sucesso: retorna contagens calculadas corretamente', async () => {
    const { useDashboardStats } = await import('./useDashboardStats');

    supabaseMock.from.mockImplementation((table: string) => {
      if (table === 'usuarios')     return buildQueryChain({ count: 42,  error: null });
      if (table === 'cursos')       return buildQueryChain({ count: 10,  error: null });
      if (table === 'certificados') return buildQueryChain({ count: 5,   error: null });
      if (table === 'progresso_usuario') {
        return buildQueryChain({
          data: [
            { status: 'em_andamento', usuarios: { empresa_id: 'empresa-abc' } },
            { status: 'concluido',    usuarios: { empresa_id: 'empresa-abc' } },
            { status: 'concluido',    usuarios: { empresa_id: 'empresa-abc' } },
          ],
          error: null,
        });
      }
      return buildQueryChain({ data: [], error: null });
    });

    const { result } = renderHook(() => useDashboardStats(), { wrapper: makeWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toMatchObject({
      totalUsers:        42,
      totalCourses:      10,
      totalCertificates: 5,
      completionRate:    67, // 2 concluídos / 3 iniciados = 66.6 → round = 67
    });
  });

  it('estado vazio: tabelas sem dados retornam zeros', async () => {
    const { useDashboardStats } = await import('./useDashboardStats');

    supabaseMock.from.mockImplementation(() =>
      buildQueryChain({ count: 0, data: [], error: null })
    );

    const { result } = renderHook(() => useDashboardStats(), { wrapper: makeWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toMatchObject({
      totalUsers:        0,
      totalCourses:      0,
      totalCertificates: 0,
      completionRate:    0,
    });
  });

  it('erro de rede: isError=true quando usuários falha', async () => {
    const { useDashboardStats } = await import('./useDashboardStats');

    supabaseMock.from.mockImplementation((table: string) => {
      if (table === 'usuarios')
        return buildQueryChain({ count: null, error: { message: 'connection refused' } });
      return buildQueryChain({ count: 0, data: [], error: null });
    });

    const { result } = renderHook(() => useDashboardStats(), { wrapper: makeWrapper() });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeTruthy();
  });

  it('tenant incorreto: admin_master não filtra por empresa_id', async () => {
    const { useAuth } = await import('@/hooks/useAuth');
    const { useEmpresa } = await import('@/context/EmpresaContext');
    const { useDashboardStats } = await import('./useDashboardStats');

    vi.mocked(useAuth).mockReturnValue({
      userProfile: { ...mockUserProfile, tipo_usuario: 'admin_master' },
    } as any);
    vi.mocked(useEmpresa).mockReturnValue({ empresa: mockEmpresa } as any);

    const eqSpy = vi.fn().mockReturnThis();
    const baseMock: any = {
      select: vi.fn().mockReturnThis(),
      eq:     eqSpy,
      not:    vi.fn().mockReturnThis(),
      order:  vi.fn().mockReturnThis(),
      limit:  vi.fn().mockReturnThis(),
      then:   (r: any) => Promise.resolve({ count: 1, data: [], error: null }).then(r),
    };
    supabaseMock.from.mockReturnValue(baseMock);

    const { result } = renderHook(() => useDashboardStats(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // admin_master não deve filtrar por empresa_id — eq não deve ser chamado com 'empresa_id'
    const empresaEqCalls = eqSpy.mock.calls.filter(([col]: string[]) => col === 'empresa_id');
    expect(empresaEqCalls).toHaveLength(0);
  });
});

// ─── useRecentActivity ────────────────────────────────────────────────────────

describe('useRecentActivity', () => {
  beforeEach(() => vi.clearAllMocks());

  it('sucesso: retorna atividades ordenadas por data', async () => {
    const { useRecentActivity } = await import('./useDashboardStats');

    const fakeCert = {
      id: 'cert-1',
      data_emissao: new Date(Date.now() - 60_000).toISOString(), // 1 min atrás
      nota_final: 90,
      usuarios: { nome: 'Maria Silva' },
      cursos: { nome: 'PABX Avançado', categoria: 'PABX' },
    };
    const fakeProgress = {
      id: 'prog-1',
      status: 'concluido',
      data_conclusao: new Date(Date.now() - 120_000).toISOString(), // 2 min atrás
      data_atualizacao: new Date(Date.now() - 120_000).toISOString(),
      usuarios: { nome: 'João Costa', empresa_id: 'empresa-abc' },
      cursos: { nome: 'CALLCENTER Básico', categoria: 'CALLCENTER' },
    };

    supabaseMock.from.mockImplementation((table: string) => {
      if (table === 'certificados')
        return buildQueryChain({ data: [fakeCert], error: null });
      if (table === 'progresso_usuario')
        return buildQueryChain({ data: [fakeProgress], error: null });
      return buildQueryChain({ data: [], error: null });
    });

    const { result } = renderHook(() => useRecentActivity(), { wrapper: makeWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const activities = result.current.data!;
    expect(activities.length).toBe(2);
    // Mais recente primeiro
    expect(activities[0].type).toBe('certificate_earned');
    expect(activities[0].user_name).toBe('Maria Silva');
    expect(activities[1].type).toBe('course_completed');
    expect(activities[1].user_name).toBe('João Costa');
  });

  it('estado vazio: retorna array vazio quando não há atividades', async () => {
    const { useRecentActivity } = await import('./useDashboardStats');

    supabaseMock.from.mockImplementation(() =>
      buildQueryChain({ data: [], error: null })
    );

    const { result } = renderHook(() => useRecentActivity(), { wrapper: makeWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([]);
  });

  it('erro de rede: propaga erro (não swallows silenciosamente)', async () => {
    const { useRecentActivity } = await import('./useDashboardStats');

    supabaseMock.from.mockImplementation((table: string) => {
      if (table === 'certificados')
        return buildQueryChain({ data: null, error: { message: 'timeout' } });
      return buildQueryChain({ data: [], error: null });
    });

    const { result } = renderHook(() => useRecentActivity(), { wrapper: makeWrapper() });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

// ─── useCategoryProgress ─────────────────────────────────────────────────────

describe('useCategoryProgress', () => {
  beforeEach(() => vi.clearAllMocks());

  it('sucesso: agrupa por categoria e calcula progresso percentual', async () => {
    const { useCategoryProgress } = await import('./useDashboardStats');

    supabaseMock.from.mockReturnValue(
      buildQueryChain({
        data: [
          { status: 'concluido',    cursos: { nome: 'PABX Básico',    categoria: 'PABX' } },
          { status: 'concluido',    cursos: { nome: 'PABX Básico',    categoria: 'PABX' } },
          { status: 'em_andamento', cursos: { nome: 'PABX Básico',    categoria: 'PABX' } },
          { status: 'em_andamento', cursos: { nome: 'CALLCENTER',     categoria: 'CALLCENTER' } },
        ],
        error: null,
      })
    );

    const { result } = renderHook(
      () => useCategoryProgress('user-123'),
      { wrapper: makeWrapper() }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const data = result.current.data!;
    const pabx = data.find(c => c.categoria === 'PABX')!;
    const callcenter = data.find(c => c.categoria === 'CALLCENTER')!;

    expect(pabx.progress).toBe(67);          // 2 concluídos / 3 total
    expect(callcenter.progress).toBe(0);      // 0 concluídos / 1 total
    // Ordenado por progresso decrescente
    expect(data[0].categoria).toBe('PABX');
  });

  it('estado vazio: userId undefined desabilita a query', async () => {
    const { useCategoryProgress } = await import('./useDashboardStats');

    const { result } = renderHook(
      () => useCategoryProgress(undefined),
      { wrapper: makeWrapper() }
    );

    // enabled: !!userId → query nunca dispara
    expect(result.current.fetchStatus).toBe('idle');
    expect(result.current.data).toBeUndefined();
  });

  it('estado vazio: sem progressos retorna array vazio', async () => {
    const { useCategoryProgress } = await import('./useDashboardStats');

    supabaseMock.from.mockReturnValue(
      buildQueryChain({ data: [], error: null })
    );

    const { result } = renderHook(
      () => useCategoryProgress('user-123'),
      { wrapper: makeWrapper() }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([]);
  });

  it('erro de rede: isError=true quando query falha', async () => {
    const { useCategoryProgress } = await import('./useDashboardStats');

    supabaseMock.from.mockReturnValue(
      buildQueryChain({ data: null, error: { message: 'network error' } })
    );

    const { result } = renderHook(
      () => useCategoryProgress('user-123'),
      { wrapper: makeWrapper() }
    );

    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  it('tenant incorreto: dados de categoria null agrupam em "Geral"', async () => {
    const { useCategoryProgress } = await import('./useDashboardStats');

    supabaseMock.from.mockReturnValue(
      buildQueryChain({
        data: [
          { status: 'concluido', cursos: null },   // curso deletado / sem join
          { status: 'concluido', cursos: null },
        ],
        error: null,
      })
    );

    const { result } = renderHook(
      () => useCategoryProgress('user-123'),
      { wrapper: makeWrapper() }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const data = result.current.data!;
    expect(data[0].categoria).toBe('Geral');
    expect(data[0].progress).toBe(100); // 2/2
  });
});
