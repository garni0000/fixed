import { Express } from 'express';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface MoneyFusionWebhookPayload {
  event: 'payin.session.pending' | 'payin.session.completed' | 'payin.session.cancelled';
  personal_Info?: Array<{ paymentId?: string; userId?: string; [key: string]: any }>;
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

export function setupPaymentRoutes(app: Express) {
  /**
   * POST /api/payment/moneyfusion/initiate
   * Initier un paiement MoneyFusion
   */
  app.post('/api/payment/moneyfusion/initiate', async (req, res) => {
    try {
      const { userId, amount, plan, phoneNumber, customerName } = req.body;

      if (!userId || !amount || !plan || !phoneNumber || !customerName) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Créer l'entrée de paiement dans Supabase
      const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .insert({
          user_id: userId,
          amount,
          plan,
          method: 'mobile_money',
          mobile_number: phoneNumber,
          mobile_provider: 'moneyfusion',
          status: 'processing',
        })
        .select()
        .single();

      if (paymentError || !payment) {
        console.error('Payment creation error:', paymentError);
        return res.status(500).json({ error: 'Failed to create payment record' });
      }

      // Préparer la requête MoneyFusion
      const apiUrl = process.env.MMONEY_API_URL;
      if (!apiUrl) {
        return res.status(500).json({ error: 'MoneyFusion API URL not configured' });
      }

      const baseUrl = req.protocol + '://' + req.get('host');
      const paymentData = {
        totalPrice: amount,
        article: [{ abonnement: amount }],
        personal_Info: [
          {
            paymentId: payment.id,
            userId: userId,
            plan: plan,
          },
        ],
        numeroSend: phoneNumber,
        nomclient: customerName,
        return_url: `${baseUrl}/payment/callback?paymentId=${payment.id}`,
        webhook_url: `${baseUrl}/api/webhooks/moneyfusion`,
      };

      // Appeler l'API MoneyFusion
      const axios = require('axios');
      const response = await axios.post(apiUrl, paymentData, {
        headers: { 'Content-Type': 'application/json' },
      });

      // Sauvegarder le token MoneyFusion dans les notes
      await supabase
        .from('payments')
        .update({
          notes: JSON.stringify({ moneyfusion_token: response.data.token }),
        })
        .eq('id', payment.id);

      return res.json({
        success: true,
        paymentId: payment.id,
        paymentUrl: response.data.url,
        token: response.data.token,
      });
    } catch (error: any) {
      console.error('MoneyFusion payment initiation error:', error);
      return res.status(500).json({
        error: 'Failed to initiate payment',
        details: error.message,
      });
    }
  });

  /**
   * POST /api/webhooks/moneyfusion
   * Webhook pour recevoir les notifications de MoneyFusion
   */
  app.post('/api/webhooks/moneyfusion', async (req, res) => {
    try {
      const payload: MoneyFusionWebhookPayload = req.body;
      console.log('MoneyFusion webhook received:', payload);

      // Extraire paymentId des personal_Info
      const paymentId = payload.personal_Info?.[0]?.paymentId;
      const userId = payload.personal_Info?.[0]?.userId;
      const plan = payload.personal_Info?.[0]?.plan;

      if (!paymentId) {
        console.error('No paymentId in webhook payload');
        return res.status(400).json({ error: 'Missing paymentId' });
      }

      // Récupérer le paiement actuel
      const { data: currentPayment, error: fetchError } = await supabase
        .from('payments')
        .select('*')
        .eq('id', paymentId)
        .single();

      if (fetchError || !currentPayment) {
        console.error('Payment not found:', fetchError);
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
        console.log('Duplicate webhook notification, ignoring');
        return res.json({ success: true, message: 'Duplicate notification' });
      }

      // Mettre à jour le statut du paiement
      const { error: updateError } = await supabase
        .from('payments')
        .update({
          status: newStatus,
          notes: JSON.stringify({
            ...JSON.parse(currentPayment.notes || '{}'),
            moneyfusion_event: payload.event,
            transaction_id: payload.numeroTransaction,
            amount_received: payload.Montant,
            fees: payload.frais,
            webhook_received_at: new Date().toISOString(),
          }),
        })
        .eq('id', paymentId);

      if (updateError) {
        console.error('Failed to update payment:', updateError);
        return res.status(500).json({ error: 'Failed to update payment' });
      }

      // Si le paiement est approuvé, activer automatiquement l'abonnement
      if (newStatus === 'approved' && userId && plan) {
        console.log(`Auto-activating subscription for user ${userId}, plan ${plan}`);
        
        // Logique d'activation d'abonnement (comme dans Admin.tsx)
        const { data: existingSubscription } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', userId)
          .single();

        const now = new Date();
        let startDate = now;
        
        if (existingSubscription && 
            existingSubscription.status === 'active' && 
            existingSubscription.current_period_end) {
          const endDate = new Date(existingSubscription.current_period_end);
          if (endDate > now) {
            startDate = endDate;
          }
        }

        const endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + 1);

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
          description: `Paiement ${plan.toUpperCase()} - MoneyFusion`,
          status: 'completed',
        });

        console.log(`Subscription activated for user ${userId}`);
      }

      return res.json({ success: true });
    } catch (error: any) {
      console.error('MoneyFusion webhook error:', error);
      return res.status(500).json({
        error: 'Webhook processing failed',
        details: error.message,
      });
    }
  });

  /**
   * GET /api/payment/moneyfusion/status/:token
   * Vérifier le statut d'un paiement MoneyFusion
   */
  app.get('/api/payment/moneyfusion/status/:token', async (req, res) => {
    try {
      const { token } = req.params;
      const axios = require('axios');
      
      const response = await axios.get(
        `https://www.pay.moneyfusion.net/paiementNotif/${token}`
      );

      return res.json(response.data);
    } catch (error: any) {
      console.error('MoneyFusion status check error:', error);
      return res.status(500).json({
        error: 'Failed to check payment status',
        details: error.message,
      });
    }
  });
}
