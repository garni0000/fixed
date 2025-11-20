import { Link } from 'react-router-dom';
import { TrendingUp, Shield, Zap, CheckCircle2, XCircle } from 'lucide-react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';

interface PronoCardProps {
  id: string;
  match: string;
  league: string;
  prediction: string;
  odds: number;
  confidence: number;
  type: 'safe' | 'risk' | 'vip';
  status: 'pending' | 'won' | 'lost';
  result?: string | null;
}

const PronoCard = ({ id, match, league, prediction, odds, confidence, type, status, result }: PronoCardProps) => {
  const typeConfig = {
    safe: { icon: Shield, label: 'SAFE', color: 'text-success' },
    risk: { icon: Zap, label: 'RISK', color: 'text-destructive' },
    vip: { icon: TrendingUp, label: 'VIP', color: 'text-primary' },
  };

  const Icon = typeConfig[type].icon;

  return (
    <div className="card-premium p-6 hover:scale-[1.02] transition-transform duration-300">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold text-foreground mb-1">{match}</h3>
          <p className="text-sm text-muted-foreground">{league}</p>
        </div>
        <Badge className={`${typeConfig[type].color} flex items-center gap-1`}>
          <Icon size={14} />
          {typeConfig[type].label}
        </Badge>
      </div>

      <div className="space-y-3 mb-4">
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Pronostic</span>
          <span className="text-foreground font-semibold">{prediction}</span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Cote</span>
          <span className="text-primary font-bold text-lg">{odds.toFixed(2)}</span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Confiance</span>
          <div className="flex items-center gap-2">
            <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full vip-gradient rounded-full transition-all duration-500"
                style={{ width: `${confidence}%` }}
              />
            </div>
            <span className="text-primary font-bold">{confidence}%</span>
          </div>
        </div>
      </div>

      {status !== 'pending' && (
        <div className={`flex items-center gap-2 mb-4 p-3 rounded-lg ${
          status === 'won' ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
        }`}>
          {status === 'won' ? (
            <>
              <CheckCircle2 size={20} />
              <span className="font-semibold">GAGNÉ</span>
              {result && <span className="ml-auto">{result}</span>}
            </>
          ) : (
            <>
              <XCircle size={20} />
              <span className="font-semibold">PERDU</span>
              {result && <span className="ml-auto">{result}</span>}
            </>
          )}
        </div>
      )}

      <Link to={`/pronos/${id}`}>
        <Button className="w-full" variant="outline">
          Voir l'analyse complète
        </Button>
      </Link>
    </div>
  );
};

export default PronoCard;
