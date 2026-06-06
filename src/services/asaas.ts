// =============================================================================
// Asaas Payment Service
// Documentação: https://docs.asaas.com/reference
// =============================================================================

const ASAAS_API_URL = process.env.ASAAS_API_URL || 'https://sandbox.asaas.com/api/v3';
const ASAAS_API_KEY = process.env.ASAAS_API_KEY || '';

// ── Helpers ──────────────────────────────────────────────────────────────────

async function asaasRequest<T = any>(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  body?: Record<string, unknown>,
): Promise<T> {
  const res = await fetch(`${ASAAS_API_URL}${endpoint}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      access_token: ASAAS_API_KEY,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json();

  if (!res.ok) {
    const msg = data?.errors?.[0]?.description || data?.message || `Asaas ${res.status}`;
    throw new Error(msg);
  }

  return data as T;
}

// ── Planos ──────────────────────────────────────────────────────────────────

export const PLANOS: Record<string, { nome: string; valor: number; descricao: string }> = {
  starter:    { nome: 'Panalearn Starter',    valor: 297.00, descricao: 'Até 50 alunos' },
  pro:        { nome: 'Panalearn Pro',         valor: 497.00, descricao: 'Até 200 alunos' },
  enterprise: { nome: 'Panalearn Enterprise',  valor: 897.00, descricao: 'Alunos ilimitados' },
};

// ── Clientes ────────────────────────────────────────────────────────────────

export interface AsaasCustomer {
  id: string;
  name: string;
  email: string;
  cpfCnpj: string;
}

/**
 * Cria um cliente no Asaas.
 * cpfCnpj pode ser CPF ou CNPJ (somente dígitos).
 */
export async function createCustomer(
  name: string,
  email: string,
  cpfCnpj: string,
): Promise<AsaasCustomer> {
  return asaasRequest<AsaasCustomer>('/customers', 'POST', {
    name,
    email,
    cpfCnpj: cpfCnpj.replace(/\D/g, ''),
  });
}

// ── Assinaturas ─────────────────────────────────────────────────────────────

export interface AsaasSubscription {
  id: string;
  status: string;
  value: number;
  cycle: string;
  nextDueDate: string;
  invoiceUrl?: string;    // URL de pagamento (checkout Asaas)
  bankSlipUrl?: string;
}

/**
 * Cria uma assinatura mensal recorrente.
 * O Asaas gera automaticamente as cobranças a cada mês.
 */
export async function createSubscription(
  customerId: string,
  planKey: string,
  description?: string,
): Promise<AsaasSubscription> {
  const plan = PLANOS[planKey];
  if (!plan) throw new Error(`Plano "${planKey}" não encontrado`);

  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  return asaasRequest<AsaasSubscription>('/subscriptions', 'POST', {
    customer: customerId,
    billingType: 'UNDEFINED',        // Aceita boleto, pix e cartão
    value: plan.valor,
    cycle: 'MONTHLY',
    nextDueDate: today,
    description: description || `Assinatura ${plan.nome}`,
    externalReference: planKey,
  });
}

// ── Consultas ───────────────────────────────────────────────────────────────

export async function getSubscription(subscriptionId: string): Promise<AsaasSubscription> {
  return asaasRequest<AsaasSubscription>(`/subscriptions/${subscriptionId}`);
}

export async function getCustomer(customerId: string): Promise<AsaasCustomer> {
  return asaasRequest<AsaasCustomer>(`/customers/${customerId}`);
}

// ── Cancelamento ────────────────────────────────────────────────────────────

export async function cancelSubscription(subscriptionId: string): Promise<void> {
  await asaasRequest(`/subscriptions/${subscriptionId}`, 'DELETE');
}
