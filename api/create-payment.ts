// /api/create-payment.ts
// Vercel Serverless Function — cria preferência de pagamento no Mercado Pago

import type { VercelRequest, VercelResponse } from '@vercel/node';

const PLANOS: Record<string, { nome: string; valor: number }> = {
  starter:    { nome: 'Panalearn Starter',    valor: 29700 },  // R$ 297,00 em centavos
  pro:        { nome: 'Panalearn Pro',         valor: 49700 },  // R$ 497,00
  enterprise: { nome: 'Panalearn Enterprise',  valor: 69700 },  // R$ 697,00
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { plan, user_id, organization_id, user_email, user_name } = req.body;

  if (!plan || !PLANOS[plan]) {
    return res.status(400).json({ error: 'Plano inválido' });
  }

  const plano = PLANOS[plan];
  const externalReference = `${organization_id}_${Date.now()}`;

  const appUrl = process.env.VITE_APP_URL || 'https://panalearn.com';

  try {
    const mpResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({
        items: [{
          id: plan,
          title: plano.nome,
          description: `Assinatura mensal ${plano.nome}`,
          quantity: 1,
          unit_price: plano.valor / 100,   // MP recebe em reais, não centavos
          currency_id: 'BRL',
        }],
        payer: {
          email: user_email,
          name: user_name,
        },
        external_reference: externalReference,
        back_urls: {
          success: `${appUrl}/onboarding/sucesso`,
          failure: `${appUrl}/onboarding/pagamento`,
          pending: `${appUrl}/onboarding/pendente`,
        },
        auto_return: 'approved',
        notification_url: `${appUrl}/api/payment-webhook`,
        metadata: { user_id, organization_id, plan },
      }),
    });

    if (!mpResponse.ok) {
      const err = await mpResponse.json();
      console.error('Erro MP:', err);
      return res.status(500).json({ error: 'Erro ao criar preferência no Mercado Pago' });
    }

    const preference = await mpResponse.json();

    // Salvar preference_id no Supabase para rastrear
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    await supabase.from('subscriptions').upsert({
      organization_id,
      user_id,
      plan,
      status: 'pending',
      mp_preference_id: preference.id,
      mp_external_reference: externalReference,
      amount_cents: plano.valor,
    }, { onConflict: 'organization_id' });

    return res.status(200).json({
      preference_id: preference.id,
      init_point: preference.init_point,
      sandbox_init_point: preference.sandbox_init_point,
    });

  } catch (error) {
    console.error('Erro interno:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}
