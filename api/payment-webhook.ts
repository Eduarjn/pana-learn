// /api/payment-webhook.ts
// Recebe notificações de pagamento do Mercado Pago

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // MP faz GET para validar o endpoint
  if (req.method === 'GET') return res.status(200).json({ ok: true });
  if (req.method !== 'POST') return res.status(405).end();

  const { type, data } = req.body;

  // Só processar notificações de pagamento
  if (type !== 'payment') return res.status(200).json({ ok: true });

  try {
    // Consultar o pagamento na API do MP para confirmar
    const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${data.id}`, {
      headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` },
    });

    const payment = await mpResponse.json();

    if (payment.status !== 'approved') {
      return res.status(200).json({ ok: true, status: payment.status });
    }

    // Pagamento aprovado — atualizar no Supabase
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const externalRef = payment.external_reference; // "org_id_timestamp"
    const orgId = externalRef.split('_')[0];
    const plan = payment.metadata?.plan;

    const now = new Date();
    const nextMonth = new Date(now);
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    // Atualizar subscription
    await supabase.from('subscriptions')
      .update({
        status: 'active',
        mp_payment_id: String(data.id),
        current_period_start: now.toISOString(),
        current_period_end: nextMonth.toISOString(),
        updated_at: now.toISOString(),
      })
      .eq('mp_external_reference', externalRef);

    // Atualizar organization
    await supabase.from('organizations')
      .update({
        plan,
        plan_status: 'active',
        onboarding_completed: true,
      })
      .eq('id', orgId);

    return res.status(200).json({ ok: true });

  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(500).json({ error: 'Webhook processing failed' });
  }
}
plan_status: 'active',
        })
        .eq('id', empresaId);
    }

return res.status(200).json({ ok: true });

  } catch (error) {
  console.error('Webhook error:', error);
  return res.status(500).json({ error: 'Webhook processing failed' });
}
}
