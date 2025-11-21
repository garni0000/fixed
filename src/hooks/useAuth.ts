import { useState, useEffect } from 'react';
import { authService, userService, api } from '@/lib/api';
import { auth } from '@/lib/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, updateProfile } from 'firebase/auth';

interface User {
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
  stats?: {
    totalBets: number;
    wonBets: number;
    lostBets: number;
    winRate: number;
    totalProfit: number;
  };
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const currentUser = auth.currentUser;
      if (currentUser) {
        const response: any = await api.get('/auth/me');
        setUser(response.data.user);
      }
    } catch (error) {
      console.error('Auth check error:', error);
    }
    setIsLoading(false);
  };

  const login = async (email: string, password: string) => {
    // 1. Sign in with Firebase
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    
    // 2. Call backend to sync user
    const response: any = await api.post('/auth/register', {});
    setUser(response.data.user);
    return response.data;
  };

  const register = async (email: string, password: string, firstName: string, lastName: string) => {
    // 1. Create Firebase account
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    // 2. Update Firebase profile
    await updateProfile(userCredential.user, {
      displayName: `${firstName} ${lastName}`,
    });
    
    // 3. Call backend to create user record
    const response: any = await api.post('/auth/register', {});
    setUser(response.data.user);
    return response.data;
  };

  const logout = async () => {
    await signOut(auth);
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
