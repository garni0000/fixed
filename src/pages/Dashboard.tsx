import { TrendingUp, Target, Award, DollarSign } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PronoCard from '@/components/PronoCard';
import { usePronos } from '@/hooks/usePronos';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';

const Dashboard = () => {
  const { isAuthenticated, user } = useAuth();
  const today = new Date().toISOString().split('T')[0];
  const { data: pronos, isLoading } = usePronos(today);

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
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">
            Bienvenue, <span className="vip-gradient bg-clip-text text-transparent">{user?.firstName || 'Champion'}</span> 👋
          </h1>
          <p className="text-muted-foreground">Voici votre tableau de bord VIP</p>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div className="card-premium p-6">
            <div className="flex items-center justify-between mb-4">
              <Target className="text-primary" size={32} />
              <span className="text-sm text-muted-foreground">Paris totaux</span>
            </div>
            <div className="text-3xl font-bold">{stats.totalBets}</div>
          </div>

          <div className="card-premium p-6">
            <div className="flex items-center justify-between mb-4">
              <Award className="text-success" size={32} />
              <span className="text-sm text-muted-foreground">Paris gagnés</span>
            </div>
            <div className="text-3xl font-bold text-success">{stats.wonBets}</div>
          </div>

          <div className="card-premium p-6">
            <div className="flex items-center justify-between mb-4">
              <TrendingUp className="text-primary" size={32} />
              <span className="text-sm text-muted-foreground">Taux de réussite</span>
            </div>
            <div className="text-3xl font-bold vip-gradient bg-clip-text text-transparent">
              {stats.winRate.toFixed(1)}%
            </div>
          </div>

          <div className="card-premium p-6">
            <div className="flex items-center justify-between mb-4">
              <DollarSign className="text-primary" size={32} />
              <span className="text-sm text-muted-foreground">Profit total</span>
            </div>
            <div className="text-3xl font-bold text-success">
              +{stats.totalProfit.toFixed(2)}€
            </div>
          </div>
        </div>

        {/* Today's Pronos */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-6">Pronos du jour</h2>
          
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
              {pronos?.map((prono: any) => (
                <PronoCard key={prono.id} {...prono} />
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Dashboard;
