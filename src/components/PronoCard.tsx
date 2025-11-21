import { Link } from 'react-router-dom';
import { TrendingUp, Shield, Zap, CheckCircle2, XCircle, Lock } from 'lucide-react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { getPronoTier, TIER_LABELS, TIER_COLORS } from '@/lib/tier-utils';

interface PronoCardProps {
  prono: any; // Objet prono complet
  isLocked?: boolean; // Si true, affiche l'aperçu partiel
}

const PronoCard = ({ prono, isLocked = false }: PronoCardProps) => {
  // Normaliser le type de prono
  const pronoTier = getPronoTier(prono.prono_type);
  
  const typeConfig: Record<string, { icon: any; label: string; color: string }> = {
    free: { icon: Shield, label: TIER_LABELS.free, color: TIER_COLORS.free },
    basic: { icon: Zap, label: TIER_LABELS.basic, color: TIER_COLORS.basic },
    pro: { icon: TrendingUp, label: TIER_LABELS.pro, color: TIER_COLORS.pro },
    vip: { icon: TrendingUp, label: TIER_LABELS.vip, color: TIER_COLORS.vip },
  };

  const config = typeConfig[pronoTier] || typeConfig.free;
  const Icon = config.icon;

  // Déterminer le statut du résultat
  const status = prono.prono_result || 'pending';

  return (
    <div 
      className={`card-premium p-6 hover:scale-[1.02] transition-transform duration-300 ${isLocked ? 'relative' : ''}`}
      data-testid={`card-prono-${prono.id}`}
    >
      {/* Header: Équipes + Badge Type */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold text-foreground mb-1" data-testid={`text-match-${prono.id}`}>
            {prono.home_team} vs {prono.away_team}
          </h3>
          <p className="text-sm text-muted-foreground" data-testid={`text-league-${prono.id}`}>
            {prono.competition}
          </p>
        </div>
        <Badge className={`${config.color} flex items-center gap-1`} data-testid={`badge-type-${prono.id}`}>
          <Icon size={14} />
          {config.label}
        </Badge>
      </div>

      {/* Contenu */}
      <div className="space-y-3 mb-4">
        {/* Cote - TOUJOURS visible */}
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Cote</span>
          <span className="text-primary font-bold text-lg" data-testid={`text-odd-${prono.id}`}>
            {prono.odd?.toFixed(2) || 'N/A'}
          </span>
        </div>

        {/* Contenu verrouillé ou déverrouillé */}
        {isLocked ? (
          <>
            {/* Aperçu partiel - Contenu masqué */}
            <div className="flex justify-between items-center opacity-50">
              <span className="text-muted-foreground">Pronostic</span>
              <div className="flex items-center gap-2">
                <Lock size={16} className="text-muted-foreground" />
                <span className="text-muted-foreground">Verrouillé</span>
              </div>
            </div>

            <div className="flex justify-between items-center opacity-50">
              <span className="text-muted-foreground">Confiance</span>
              <div className="flex items-center gap-2">
                <Lock size={16} className="text-muted-foreground" />
                <span className="text-muted-foreground">Verrouillé</span>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Contenu complet */}
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Pronostic</span>
              <span className="text-foreground font-semibold" data-testid={`text-prediction-${prono.id}`}>
                {prono.content || prono.tip}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Confiance</span>
              <div className="flex items-center gap-2">
                <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full vip-gradient rounded-full transition-all duration-500"
                    style={{ width: `${prono.confidence}%` }}
                  />
                </div>
                <span className="text-primary font-bold" data-testid={`text-confidence-${prono.id}`}>
                  {prono.confidence}%
                </span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Résultat du prono (si disponible) */}
      {status !== 'pending' && !isLocked && (
        <div className={`flex items-center gap-2 mb-4 p-3 rounded-lg ${
          status === 'won' ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
        }`}>
          {status === 'won' ? (
            <>
              <CheckCircle2 size={20} />
              <span className="font-semibold" data-testid={`status-won-${prono.id}`}>GAGNÉ</span>
              {prono.result && <span className="ml-auto">{prono.result}</span>}
            </>
          ) : (
            <>
              <XCircle size={20} />
              <span className="font-semibold" data-testid={`status-lost-${prono.id}`}>PERDU</span>
              {prono.result && <span className="ml-auto">{prono.result}</span>}
            </>
          )}
        </div>
      )}

      {/* Bouton d'action */}
      {isLocked ? (
        <Link to="/pricing">
          <Button className="w-full" variant="default" data-testid={`button-unlock-${prono.id}`}>
            <Lock size={16} className="mr-2" />
            Débloquer ce prono
          </Button>
        </Link>
      ) : (
        <Link to={`/pronos/${prono.id}`}>
          <Button className="w-full" variant="outline" data-testid={`button-details-${prono.id}`}>
            Voir l'analyse complète
          </Button>
        </Link>
      )}
    </div>
  );
};

export default PronoCard;
