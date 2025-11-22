import { TrendingUp, Target, Award, DollarSign, Calendar, Sparkles, CreditCard, Users, User } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PronoCard from '@/components/PronoCard';
import { usePronos } from '@/hooks/usePronos';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { Navigate, useNavigate } from 'react-router-dom';
import { getUserTier, getPronoTier, canAccessProno } from '@/lib/tier-utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const Dashboard = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user, isLoading: authLoading } = useSupabaseAuth();
  const today = new Date().toISOString().split('T')[0];
  const { data: pronos, isLoading } = usePronos(today);
  
  // Obtenir le tier de l'utilisateur
  const userTier = getUserTier(user?.subscription);

  // Ne pas rediriger pendant le chargement de l'authentification
  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Chargement...</p>
      </div>
    </div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" />;
  }

  const stats = user?.stats || {
    totalBets: 247,
    wonBets: 198,
    lostBets: 49,
    winRate: 80.16,
    totalProfit: 3420.50
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-6 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2">
            Bienvenue, <span className="vip-gradient bg-clip-text text-transparent">{user?.firstName || 'Champion'}</span>
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">Voici votre tableau de bord VIP</p>
        </div>

        {/* Accès Rapide - Navigation Mobile */}
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4">Accès Rapide</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            <Card 
              className="hover-elevate active-elevate-2 cursor-pointer overflow-visible"
              onClick={() => navigate('/pronos/today')}
              data-testid="quick-access-pronos"
            >
              <CardContent className="p-4 sm:p-6 text-center">
                <Calendar className="h-8 w-8 sm:h-10 sm:w-10 mx-auto mb-2 text-primary" />
                <p className="font-semibold text-sm sm:text-base">Pronos du Jour</p>
              </CardContent>
            </Card>

            <Card 
              className="hover-elevate active-elevate-2 cursor-pointer overflow-visible"
              onClick={() => navigate('/combos')}
              data-testid="quick-access-combos"
            >
              <CardContent className="p-4 sm:p-6 text-center">
                <Sparkles className="h-8 w-8 sm:h-10 sm:w-10 mx-auto mb-2 text-yellow-500" />
                <p className="font-semibold text-sm sm:text-base">Combos VIP</p>
              </CardContent>
            </Card>

            <Card 
              className="hover-elevate active-elevate-2 cursor-pointer overflow-visible"
              onClick={() => navigate('/pricing')}
              data-testid="quick-access-pricing"
            >
              <CardContent className="p-4 sm:p-6 text-center">
                <CreditCard className="h-8 w-8 sm:h-10 sm:w-10 mx-auto mb-2 text-green-500" />
                <p className="font-semibold text-sm sm:text-base">Abonnements</p>
              </CardContent>
            </Card>

            <Card 
              className="hover-elevate active-elevate-2 cursor-pointer overflow-visible"
              onClick={() => navigate('/referral')}
              data-testid="quick-access-referral"
            >
              <CardContent className="p-4 sm:p-6 text-center">
                <Users className="h-8 w-8 sm:h-10 sm:w-10 mx-auto mb-2 text-purple-500" />
                <p className="font-semibold text-sm sm:text-base">Parrainage</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8 sm:mb-12">
          <div className="card-premium p-4 sm:p-6">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <Target className="text-primary" size={24} />
              <span className="text-xs sm:text-sm text-muted-foreground">Paris totaux</span>
            </div>
            <div className="text-2xl sm:text-3xl font-bold">{stats.totalBets}</div>
          </div>

          <div className="card-premium p-4 sm:p-6">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <Award className="text-success" size={24} />
              <span className="text-xs sm:text-sm text-muted-foreground">Paris gagnés</span>
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-success">{stats.wonBets}</div>
          </div>

          <div className="card-premium p-4 sm:p-6">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <TrendingUp className="text-primary" size={24} />
              <span className="text-xs sm:text-sm text-muted-foreground">Taux de réussite</span>
            </div>
            <div className="text-2xl sm:text-3xl font-bold vip-gradient bg-clip-text text-transparent">
              {stats.winRate.toFixed(1)}%
            </div>
          </div>

          <div className="card-premium p-4 sm:p-6">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <DollarSign className="text-primary" size={24} />
              <span className="text-xs sm:text-sm text-muted-foreground">Profit total</span>
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-success">
              +{stats.totalProfit.toFixed(2)}€
            </div>
          </div>
        </div>

        {/* Today's Pronos */}
        <div className="mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6">Pronos du jour</h2>
          
          {isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="card-premium p-6 animate-pulse">
                  <div className="h-8 bg-muted rounded mb-4" />
                  <div className="h-4 bg-muted rounded mb-2" />
                  <div className="h-4 bg-muted rounded w-2/3" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pronos?.map((prono: any) => {
                const pronoTier = getPronoTier(prono.prono_type);
                const isLocked = !canAccessProno(userTier, pronoTier);
                
                return (
                  <PronoCard 
                    key={prono.id}
                    prono={prono}
                    isLocked={isLocked}
                  />
                );
              })}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Dashboard;
