import { Navigate } from 'react-router-dom';
import { Users, DollarSign, Share2, Copy } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

const Referral = () => {
  const { isAuthenticated, user } = useSupabaseAuth();
  const { toast } = useToast();

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" />;
  }

  const copyReferralCode = () => {
    navigator.clipboard.writeText(user?.referral?.code || '');
    toast({
      title: "Code copié !",
      description: "Votre code de parrainage a été copié dans le presse-papier.",
    });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-4">Programme de Parrainage</h1>
          <p className="text-muted-foreground mb-8">
            Gagnez 30% de commission sur chaque filleul que vous parrainez !
          </p>

          {/* Stats Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="card-premium p-6">
              <Users className="text-primary mb-4" size={32} />
              <p className="text-sm text-muted-foreground mb-1">Filleuls actifs</p>
              <p className="text-3xl font-bold">{user?.referral?.referredUsers || 0}</p>
            </div>

            <div className="card-premium p-6">
              <DollarSign className="text-primary mb-4" size={32} />
              <p className="text-sm text-muted-foreground mb-1">Gains totaux</p>
              <p className="text-3xl font-bold text-success">
                {user?.referral?.totalEarned?.toFixed(2) || '0.00'}€
              </p>
            </div>

            <div className="card-premium p-6">
              <Share2 className="text-primary mb-4" size={32} />
              <p className="text-sm text-muted-foreground mb-1">Commission</p>
              <p className="text-3xl font-bold text-primary">{user?.referral?.commission || 30}%</p>
            </div>
          </div>

          {/* Referral Code */}
          <div className="card-premium p-8 mb-8">
            <h2 className="text-2xl font-bold mb-4">Votre code de parrainage</h2>
            <p className="text-muted-foreground mb-6">
              Partagez ce code avec vos amis pour qu'ils bénéficient d'une réduction et pour que vous gagniez des commissions.
            </p>
            
            <div className="flex gap-4">
              <div className="flex-1 bg-background border-2 border-primary rounded-lg p-4 flex items-center justify-center">
                <span className="text-3xl font-bold vip-gradient bg-clip-text text-transparent">
                  {user?.referral?.code || 'LOADING'}
                </span>
              </div>
              <Button onClick={copyReferralCode} size="lg" className="btn-vip">
                <Copy className="mr-2" size={20} />
                Copier
              </Button>
            </div>
          </div>

          {/* How it works */}
          <div className="card-premium p-8">
            <h2 className="text-2xl font-bold mb-6">Comment ça marche ?</h2>
            
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center font-bold text-primary">
                  1
                </div>
                <div>
                  <h3 className="font-bold mb-2">Partagez votre code</h3>
                  <p className="text-muted-foreground">
                    Envoyez votre code de parrainage à vos amis et contacts intéressés par les pronos VIP.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center font-bold text-primary">
                  2
                </div>
                <div>
                  <h3 className="font-bold mb-2">Ils s'inscrivent</h3>
                  <p className="text-muted-foreground">
                    Vos filleuls utilisent votre code lors de leur inscription pour bénéficier d'une réduction.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center font-bold text-primary">
                  3
                </div>
                <div>
                  <h3 className="font-bold mb-2">Vous gagnez 30%</h3>
                  <p className="text-muted-foreground">
                    Recevez 30% de commission sur chaque abonnement de vos filleuls, chaque mois !
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Referral;
