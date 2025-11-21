import { Link } from 'react-router-dom';
import { Calendar, Lock } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PronoCard from '@/components/PronoCard';
import { usePronos } from '@/hooks/usePronos';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/hooks/useSupabaseAuth';

const PronosToday = () => {
  const today = new Date().toISOString().split('T')[0];
  const { data: pronos, isLoading } = usePronos(today);
  const { user } = useAuth();

  // Filtrer les pronos selon le statut VIP de l'utilisateur
  const filteredPronos = (pronos || []).filter((prono: any) => {
    // Les pronos FREE sont visibles par tous
    if (prono.prono_type === 'free') return true;
    
    // Les pronos VIP sont visibles uniquement par les utilisateurs VIP actifs
    if (prono.prono_type === 'vip') {
      return user?.subscription?.plan === 'vip' && user?.subscription?.status === 'active';
    }
    
    return false;
  });

  // Compter les pronos VIP verrouillés
  const lockedVipCount = (pronos || []).filter((prono: any) => 
    prono.prono_type === 'vip' && 
    !(user?.subscription?.plan === 'vip' && user?.subscription?.status === 'active')
  ).length;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Pronos du jour</h1>
            <p className="text-muted-foreground flex items-center gap-2">
              <Calendar size={16} />
              {new Date().toLocaleDateString('fr-FR', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>

          <div className="flex gap-2">
            <Link to="/pronos/yesterday">
              <Button variant="outline">Hier</Button>
            </Link>
            <Link to="/pronos/before-yesterday">
              <Button variant="outline">Avant-hier</Button>
            </Link>
          </div>
        </div>

        {lockedVipCount > 0 && (
          <Card className="mb-6 p-6 bg-primary/5 border-primary/20">
            <div className="flex items-center gap-4">
              <Lock className="h-8 w-8 text-primary" />
              <div>
                <h3 className="text-lg font-semibold">
                  {lockedVipCount} prono{lockedVipCount > 1 ? 's' : ''} VIP verrouillé{lockedVipCount > 1 ? 's' : ''}
                </h3>
                <p className="text-sm text-muted-foreground">
                  Abonnez-vous au plan VIP pour accéder à tous les pronos premium
                </p>
              </div>
              <Link to="/pricing" className="ml-auto">
                <Button variant="default">Voir les offres</Button>
              </Link>
            </div>
          </Card>
        )}

        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="card-premium p-6 animate-pulse">
                <div className="h-8 bg-muted rounded mb-4" />
                <div className="h-4 bg-muted rounded mb-2" />
                <div className="h-4 bg-muted rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : filteredPronos && filteredPronos.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPronos.map((prono: any) => (
              <PronoCard 
                key={prono.id}
                id={prono.id}
                match={`${prono.home_team} vs ${prono.away_team}`}
                league={prono.competition}
                prediction={prono.tip}
                odds={prono.odd}
                confidence={prono.confidence}
                type={prono.prono_type || 'free'}
                status={prono.result || 'pending'}
                result={null}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-2xl text-muted-foreground">Aucun prono disponible pour aujourd'hui</p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default PronosToday;
