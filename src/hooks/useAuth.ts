import { useState, useEffect } from 'react';
import { authService, userService } from '@/lib/api';

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
    const token = localStorage.getItem('auth_token');
    if (token) {
      try {
        const response: any = await userService.getProfile();
        setUser(response.data);
      } catch (error) {
        localStorage.removeItem('auth_token');
      }
    }
    setIsLoading(false);
  };

  const login = async (email: string, password: string) => {
    const response: any = await authService.login(email, password);
    localStorage.setItem('auth_token', response.data.token);
    setUser(response.data.user);
    return response.data;
  };

  const register = async (email: string, password: string, firstName: string, lastName: string) => {
    const response: any = await authService.register(email, password, firstName, lastName);
    localStorage.setItem('auth_token', response.data.token);
    setUser(response.data.user);
    return response.data;
  };

  const logout = () => {
    authService.logout();
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
