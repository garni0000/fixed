import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';

interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  subscription: {
    status: string;
    plan: string;
    startDate?: string;
    endDate?: string;
    autoRenew?: boolean;
  };
  referral?: {
    code: string;
    commission: number;
    totalEarned: number;
    referredUsers: number;
  };
}

export const useSupabaseAuth = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        loadUserProfile(session.user);
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await loadUserProfile(session.user);
      }
    } catch (error) {
      console.error('Auth check error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadUserProfile = async (authUser: User) => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select(`
          id,
          email,
          first_name,
          last_name,
          referral_code,
          balance_commission
        `)
        .eq('id', authUser.id)
        .single();

      if (profile) {
        const { data: subscription } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', authUser.id)
          .maybeSingle();

        setUser({
          id: profile.id,
          email: profile.email,
          firstName: profile.first_name || '',
          lastName: profile.last_name || '',
          subscription: {
            status: subscription?.status || 'inactive',
            plan: subscription?.plan || 'basic',
            startDate: subscription?.current_period_start?.toString(),
            endDate: subscription?.current_period_end?.toString(),
            autoRenew: !subscription?.cancel_at_period_end,
          },
          referral: {
            code: profile.referral_code,
            commission: 0,
            totalEarned: Number(profile.balance_commission) || 0,
            referredUsers: 0,
          },
        });
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const register = async (email: string, password: string, firstName: string, lastName: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
        },
      },
    });

    if (error) throw error;
    
    if (data.user) {
      await loadUserProfile(data.user);
    }

    return data;
  };

  const login = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    if (data.user) {
      await loadUserProfile(data.user);
    }

    return data;
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setUser(null);
  };

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
  };
};
