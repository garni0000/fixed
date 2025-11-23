import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY!;

interface MoneyFusionWebhookPayload {
  event: 'payin.session.pending' | 'payin.session.completed' | 'payin.session.cancelled';
  personal_Info?: Array<{ paymentId?: string; userId?: string; plan?: string; [key: string]: any }>;
  tokenPay: string;
  numeroSend: string;
  nomclient: string;
  numeroTransaction: string;
  Montant: number;
  frais: number;
  return_url?: string;
  webhook_url?: string;
  createdAt: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const payload: MoneyFusionWebhookPayload = req.body;
    console.log('[MoneyFusion Webhook] Received:', payload);

    // Extraire les informations du paiement
    const paymentId = payload.personal_Info?.[0]?.paymentId;
    const userId = payload.personal_Info?.[0]?.userId;
    const plan = payload.personal_Info?.[0]?.plan;

    if (!paymentId) {
      console.error('[MoneyFusion Webhook] No paymentId in payload');
      return res.status(400).json({ error: 'Missing paymentId' });
    }

    // Récupérer le paiement actuel
    const { data: currentPayment, error: fetchError } = await supabase
      .from('payments')
      .select('*')
      .eq('id', paymentId)
      .single();

    if (fetchError || !currentPayment) {
      console.error('[MoneyFusion Webhook] Payment not found:', fetchError);
      return res.status(404).json({ error: 'Payment not found' });
    }

    // Mapper l'événement vers un statut
    let newStatus: 'pending' | 'approved' | 'rejected' | 'processing' = 'processing';
    if (payload.event === 'payin.session.completed') {
      newStatus = 'approved';
    } else if (payload.event === 'payin.session.cancelled') {
      newStatus = 'rejected';
    }

    // Éviter les notifications redondantes
    if (currentPayment.status === newStatus) {
      console.log('[MoneyFusion Webhook] Duplicate notification, ignoring');
      return res.json({ success: true, message: 'Duplicate notification' });
    }

    // Mettre à jour le statut du paiement
    const notes = {
      ...(currentPayment.notes ? JSON.parse(currentPayment.notes) : {}),
      moneyfusion_event: payload.event,
      transaction_id: payload.numeroTransaction,
      amount_received: payload.Montant,
      fees: payload.frais,
      webhook_received_at: new Date().toISOString(),
    };

    const { error: updateError } = await supabase
      .from('payments')
      .update({
        status: newStatus,
        notes: JSON.stringify(notes),
      })
      .eq('id', paymentId);

    if (updateError) {
      console.error('[MoneyFusion Webhook] Failed to update payment:', updateError);
      return res.status(500).json({ error: 'Failed to update payment' });
    }

    // Si le paiement est approuvé, activer automatiquement l'abonnement
    if (newStatus === 'approved' && userId && plan) {
      console.log(`[MoneyFusion Webhook] Auto-activating subscription for user ${userId}, plan ${plan}`);
      
      // Récupérer l'abonnement existant
      const { data: existingSubscription } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .single();

      const now = new Date();
      let startDate = now;
      
      // Si l'utilisateur a déjà un abonnement actif, prolonger à partir de la fin
      if (existingSubscription && 
          existingSubscription.status === 'active' && 
          existingSubscription.current_period_end) {
        const endDate = new Date(existingSubscription.current_period_end);
        if (endDate > now) {
          startDate = endDate; // Commencer après la fin de l'abonnement actuel
        }
      }

      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + 1); // +1 mois

      // Mettre à jour ou créer l'abonnement
      if (existingSubscription) {
        await supabase
          .from('subscriptions')
          .update({
            plan,
            status: 'active',
            current_period_start: startDate.toISOString(),
            current_period_end: endDate.toISOString(),
            cancel_at_period_end: false,
          })
          .eq('user_id', userId);
      } else {
        await supabase
          .from('subscriptions')
          .insert({
            user_id: userId,
            plan,
            status: 'active',
            current_period_start: startDate.toISOString(),
            current_period_end: endDate.toISOString(),
            cancel_at_period_end: false,
          });
      }

      // Créer une transaction dans l'historique
      await supabase.from('transactions').insert({
        user_id: userId,
        type: 'payment',
        amount: payload.Montant,
        description: `Paiement ${plan.toUpperCase()} - MoneyFusion Mobile Money`,
        status: 'completed',
      });

      console.log(`[MoneyFusion Webhook] Subscription activated successfully for user ${userId}`);
    }

    return res.json({ success: true, message: 'Webhook processed successfully' });
  } catch (error: any) {
    console.error('[MoneyFusion Webhook] Error:', error);
    return res.status(500).json({
      error: 'Webhook processing failed',
      details: error.message,
    });
  }
}
