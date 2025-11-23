import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Autoriser uniquement les requêtes POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, amount, plan, phoneNumber, customerName } = req.body;

    // Validation des données
    if (!userId || !amount || !plan || !phoneNumber || !customerName) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields' 
      });
    }

    // Configuration MoneyFusion
    const apiUrl = process.env.MONEYFUSION_API_URL;
    const apiKey = process.env.MONEYFUSION_API_KEY;

    if (!apiUrl || !apiKey) {
      console.error('MoneyFusion credentials not configured');
      return res.status(500).json({ 
        success: false, 
        error: 'Payment system not configured' 
      });
    }

    // Préparer les données de paiement selon la documentation MoneyFusion
    const paymentData = {
      totalPrice: parseFloat(amount),
      article: [
        {
          [`Abonnement ${plan.toUpperCase()} - FixedPronos`]: parseFloat(amount)
        }
      ],
      personal_Info: [
        {
          userId: userId,
          plan: plan,
          timestamp: new Date().toISOString()
        }
      ],
      numeroSend: phoneNumber,
      nomclient: customerName,
      return_url: `${req.headers.origin}/payment/callback`,
      webhook_url: `${req.headers.origin}/api/webhooks/moneyfusion`
    };

    // Appeler l'API MoneyFusion
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(paymentData)
    });

    const data = await response.json();

    // Vérifier la réponse
    if (data.statut && data.url && data.token) {
      return res.status(200).json({
        success: true,
        paymentUrl: data.url,
        paymentToken: data.token,
        message: data.message
      });
    } else {
      console.error('MoneyFusion API error:', data);
      return res.status(500).json({
        success: false,
        error: 'Failed to create payment session'
      });
    }

  } catch (error) {
    console.error('Payment initiation error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to initiate payment' 
    });
  }
}
