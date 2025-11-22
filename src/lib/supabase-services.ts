import { supabase } from '@/integrations/supabase/client';

/**
 * IMPORTANT: Payment Services
 * 
 * Les services de paiement (supabasePaymentService) ne fonctionneront PAS avant :
 * 1. Application des migrations SQL dans Supabase (voir MIGRATION_SUPABASE.md)
 * 2. Régénération des types Supabase avec : npx supabase gen types typescript --project-id <votre-project-id>
 * 
 * Jusqu'à ces étapes, la table 'payments' n'existe pas dans les types générés TypeScript,
 * causant des erreurs LSP. Ces erreurs sont normales et disparaîtront après migration.
 */

// Types
export interface Prono {
  id: string;
  title: string;
  sport: string;
  competition: string;
  match_time: string;
  home_team: string;
  away_team: string;
  tip: string;
  odd: number;
  confidence: number;
  prono_type: 'safe' | 'risk' | 'vip';
  content?: string;
  analysis?: string;
  status: 'draft' | 'published' | 'archived';
  result?: 'won' | 'lost' | 'pending' | 'void';
  published_at?: string;
  created_at: string;
}

export interface UserProfile {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  referral_code: string;
  referred_by_id?: string;
  balance_commission: number;
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  plan: 'basic' | 'pro' | 'vip';
  status: 'active' | 'canceled' | 'expired' | 'pending';
  current_period_start?: string;
  current_period_end?: string;
  cancel_at_period_end: boolean;
  created_at: string;
}

export interface Payment {
  id?: string;
  user_id: string;
  amount: number;
  currency?: string; // Default: 'EUR'
  method: 'crypto' | 'mobile_money' | 'bank_transfer';
  crypto_address?: string;
  crypto_tx_hash?: string;
  mobile_number?: string;
  mobile_provider?: string;
  status?: 'pending' | 'approved' | 'rejected' | 'processing'; // Default: 'pending'
  proof_image_url?: string;
  notes?: string;
  processed_by?: string;
  processed_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Referral {
  id: string;
  referrer_id: string;
  referee_id: string;
  commission_amount: number;
  commission_paid: boolean;
  created_at: string;
}

// Pronos Service
export const supabasePronosService = {
  // Get all published pronos with optional date filter
  getPronos: async (date?: string) => {
    try {
      let query = supabase
        .from('pronos')
        .select('*')
        .eq('status', 'published')
        .order('match_time', { ascending: false });

      if (date) {
        const targetDate = new Date(date);
        const nextDay = new Date(targetDate);
        nextDay.setDate(nextDay.getDate() + 1);
        
        query = query
          .gte('match_time', targetDate.toISOString())
          .lt('match_time', nextDay.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;
      return { data };
    } catch (error) {
      console.error('Error fetching pronos:', error);
      throw error;
    }
  },

  // Get a single prono by ID
  getPronoById: async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('pronos')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return { data };
    } catch (error) {
      console.error('Error fetching prono:', error);
      throw error;
    }
  },

  // Admin: Create a new prono
  createProno: async (prono: Partial<Prono>) => {
    try {
      const { data, error } = await supabase
        .from('pronos')
        .insert([prono])
        .select()
        .single();

      if (error) throw error;
      return { data };
    } catch (error) {
      console.error('Error creating prono:', error);
      throw error;
    }
  },

  // Admin: Update a prono
  updateProno: async (id: string, updates: Partial<Prono>) => {
    try {
      const { data, error } = await supabase
        .from('pronos')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { data };
    } catch (error) {
      console.error('Error updating prono:', error);
      throw error;
    }
  },

  // Admin: Delete a prono
  deleteProno: async (id: string) => {
    try {
      const { error } = await supabase
        .from('pronos')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error deleting prono:', error);
      throw error;
    }
  },

  // Admin: Update prono result (won/lost/pending/void)
  updatePronoResult: async (id: string, result: 'won' | 'lost' | 'pending' | 'void') => {
    try {
      const { data, error } = await supabase
        .from('pronos')
        .update({ result })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { data };
    } catch (error) {
      console.error('Error updating prono result:', error);
      throw error;
    }
  },
};

// User Service
export const supabaseUserService = {
  // Get current user's profile
  getProfile: async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return { data };
    } catch (error) {
      console.error('Error fetching profile:', error);
      throw error;
    }
  },

  // Get user's subscription
  getSubscription: async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned
      return { data };
    } catch (error) {
      console.error('Error fetching subscription:', error);
      throw error;
    }
  },

  // Update user profile
  updateProfile: async (userId: string, updates: Partial<UserProfile>) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      return { data };
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  },

  // Get user's referrals (as referrer)
  getReferrals: async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('referrals')
        .select(`
          *,
          referee:profiles!referrals_referee_id_fkey(email, first_name, last_name)
        `)
        .eq('referrer_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data };
    } catch (error) {
      console.error('Error fetching referrals:', error);
      throw error;
    }
  },
};

// Payment Service
export const supabasePaymentService = {
  // Get user's payment history
  getPaymentHistory: async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data };
    } catch (error) {
      console.error('Error fetching payments:', error);
      throw error;
    }
  },

  // Create a new payment request
  createPayment: async (payment: Partial<Payment>) => {
    try {
      const { data, error } = await supabase
        .from('payments')
        .insert([payment])
        .select()
        .single();

      if (error) throw error;
      return { data };
    } catch (error) {
      console.error('Error creating payment:', error);
      throw error;
    }
  },

  // Admin: Get all payments
  getAllPayments: async () => {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          user:profiles!payments_user_id_fkey(email, first_name, last_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data };
    } catch (error) {
      console.error('Error fetching all payments:', error);
      throw error;
    }
  },

  // Admin: Update payment status
  updatePaymentStatus: async (
    paymentId: string,
    status: 'pending' | 'approved' | 'rejected' | 'processing',
    processedBy: string
  ) => {
    try {
      const { data, error } = await supabase
        .from('payments')
        .update({
          status,
          processed_by: processedBy,
          processed_at: new Date().toISOString(),
        })
        .eq('id', paymentId)
        .select()
        .single();

      if (error) throw error;
      return { data };
    } catch (error) {
      console.error('Error updating payment:', error);
      throw error;
    }
  },
};

// Admin Service
export const supabaseAdminService = {
  // Check if user is admin
  isAdmin: async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('role', 'admin')
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return !!data;
    } catch (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
  },

  // Get all users with subscriptions
  getAllUsers: async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          subscription:subscriptions(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data };
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  },

  // Get all pronos (including drafts)
  getAllPronos: async () => {
    try {
      const { data, error } = await supabase
        .from('pronos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data };
    } catch (error) {
      console.error('Error fetching all pronos:', error);
      throw error;
    }
  },

  // Create or update user subscription
  upsertSubscription: async (subscription: Partial<Subscription>) => {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .upsert([subscription], { onConflict: 'user_id' })
        .select()
        .single();

      if (error) throw error;
      return { data };
    } catch (error) {
      console.error('Error upserting subscription:', error);
      throw error;
    }
  },

  // Submit payment request with proof image
  submitPayment: async (paymentData: {
    userId: string;
    amount: number;
    method: 'crypto' | 'mobile_money' | 'bank_transfer';
    cryptoAddress?: string;
    cryptoTxHash?: string;
    mobileNumber?: string;
    mobileProvider?: string;
    notes?: string;
    proofFile?: File;
  }) => {
    try {
      let proofImageUrl: string | null = null;

      // Upload proof image to Supabase Storage if provided
      if (paymentData.proofFile) {
        const fileExt = paymentData.proofFile.name.split('.').pop();
        const fileName = `${paymentData.userId}-${Date.now()}.${fileExt}`;
        const filePath = `payment-proofs/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('payment-proofs')
          .upload(filePath, paymentData.proofFile, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          console.error('Error uploading proof image:', uploadError);
          throw new Error('Erreur lors de l\'upload de la preuve de paiement');
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('payment-proofs')
          .getPublicUrl(filePath);

        proofImageUrl = publicUrl;
      }

      // Create payment record
      const { data, error } = await supabase
        .from('payments')
        .insert([{
          user_id: paymentData.userId,
          amount: paymentData.amount,
          currency: 'EUR',
          method: paymentData.method,
          crypto_address: paymentData.cryptoAddress,
          crypto_tx_hash: paymentData.cryptoTxHash,
          mobile_number: paymentData.mobileNumber,
          mobile_provider: paymentData.mobileProvider,
          notes: paymentData.notes,
          proof_image_url: proofImageUrl,
          status: 'pending',
        }])
        .select()
        .single();

      if (error) throw error;
      return { data };
    } catch (error) {
      console.error('Error submitting payment:', error);
      throw error;
    }
  },
};
