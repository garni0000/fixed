import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Autoriser uniquement les requêtes POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const webhookData = req.body;
    
    console.log('MoneyFusion webhook received:', JSON.stringify(webhookData, null, 2));

    // Initialiser le client Supabase
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error('Supabase credentials not configured');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Extraire les informations du webhook
    const { 
      event, 
      personal_Info, 
      tokenPay, 
      numeroSend, 
      nomclient,
      Montant,
      statut: paymentStatus
    } = webhookData;

    // Récupérer les informations personnalisées
    const userId = personal_Info?.[0]?.userId;
    const plan = personal_Info?.[0]?.plan;

    if (!userId || !plan) {
      console.error('Missing user info in webhook:', webhookData);
      return res.status(400).json({ error: 'Missing user information' });
    }

    // Traiter selon l'événement
    if (event === 'payin.session.completed') {
      // Paiement réussi - Activer l'abonnement

      // 1. Vérifier si une transaction existe déjà pour ce token
      const { data: existingPayment } = await supabase
        .from('payments')
        .select('*')
        .eq('notes', `MoneyFusion Token: ${tokenPay}`)
        .single();

      if (existingPayment && existingPayment.status === 'approved') {
        console.log('Payment already processed:', tokenPay);
        return res.status(200).json({ message: 'Already processed' });
      }

      // 2. Créer ou mettre à jour le paiement
      const paymentData = {
        user_id: userId,
        amount: Montant,
        currency: 'XOF',
        plan: plan,
        method: 'mobile_money',
        mobile_number: numeroSend,
        status: 'approved',
        notes: `MoneyFusion Token: ${tokenPay}\nClient: ${nomclient}\nPaiement automatique validé`
      };

      const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .upsert(paymentData, { onConflict: 'user_id' })
        .select()
        .single();

      if (paymentError) {
        console.error('Error creating payment:', paymentError);
        return res.status(500).json({ error: 'Failed to record payment' });
      }

      // 3. Activer/Mettre à jour l'abonnement
      const { data: existingSubscription } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .single();

      const now = new Date();
      let startDate: Date;
      let endDate: Date;

      if (existingSubscription && existingSubscription.status === 'active') {
        // Prolonger l'abonnement existant
        const currentEndDate = new Date(existingSubscription.current_period_end);
        startDate = currentEndDate > now ? currentEndDate : now;
      } else {
        // Nouvel abonnement ou abonnement expiré
        startDate = now;
      }

      // Calculer la date de fin (30 jours)
      endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 30);

      const subscriptionData = {
        user_id: userId,
        plan: plan,
        status: 'active',
        current_period_start: startDate.toISOString(),
        current_period_end: endDate.toISOString(),
        cancel_at_period_end: false
      };

      const { error: subError } = await supabase
        .from('subscriptions')
        .upsert(subscriptionData, { onConflict: 'user_id' });

      if (subError) {
        console.error('Error updating subscription:', subError);
        return res.status(500).json({ error: 'Failed to activate subscription' });
      }

      // 4. Créer une transaction dans l'historique
      const { error: txError } = await supabase
        .from('transactions')
        .insert({
          user_id: userId,
          type: 'payment',
          amount: Montant,
          currency: 'XOF',
          status: 'completed',
          provider: 'moneyfusion',
          provider_id: tokenPay,
          metadata: {
            plan: plan,
            payment_method: 'mobile_money',
            phone: numeroSend
          }
        });

      if (txError) {
        console.error('Error creating transaction:', txError);
      }

      console.log(`✅ Subscription activated for user ${userId} - Plan: ${plan}`);
      return res.status(200).json({ message: 'Subscription activated successfully' });

    } else if (event === 'payin.session.cancelled' || event === 'payin.session.failed') {
      // Paiement échoué ou annulé
      console.log(`❌ Payment ${event} for user ${userId}`);
      return res.status(200).json({ message: 'Payment failed/cancelled' });

    } else if (event === 'payin.session.pending') {
      // Paiement en attente - ne rien faire
      console.log(`⏳ Payment pending for user ${userId}`);
      return res.status(200).json({ message: 'Payment pending' });
    }

    return res.status(200).json({ message: 'Webhook received' });

  } catch (error) {
    console.error('Webhook processing error:', error);
    return res.status(500).json({ error: 'Webhook processing failed' });
  }
}
