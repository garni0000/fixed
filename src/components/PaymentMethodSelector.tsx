import { useState } from 'react';
import { Smartphone, Bitcoin, X, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { supabaseAdminService } from '@/lib/supabase-services';

interface Plan {
  id: string;
  name: string;
  price: string;
  period: string;
}

interface PaymentMethodSelectorProps {
  selectedPlan: Plan;
  onPaymentComplete: (method: string) => void;
  onClose: () => void;
}

export default function PaymentMethodSelector({
  selectedPlan,
  onPaymentComplete,
  onClose,
}: PaymentMethodSelectorProps) {
  const [paymentMethod, setPaymentMethod] = useState('crypto');
  const [isProcessing, setIsProcessing] = useState(false);
  const [cryptoAddress, setCryptoAddress] = useState('');
  const [cryptoTxHash, setCryptoTxHash] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [mobileProvider, setMobileProvider] = useState('Orange Money');
  const [notes, setNotes] = useState('');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const { toast } = useToast();
  const { user } = useSupabaseAuth();

  const handlePayment = async () => {
    if (!user) {
      toast({
        title: "Erreur",
        description: "Vous devez être connecté pour soumettre un paiement",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Validation
      if (paymentMethod === 'crypto' && !cryptoAddress.trim()) {
        toast({
          title: "Erreur",
          description: "Veuillez saisir l'adresse crypto",
          variant: "destructive",
        });
        setIsProcessing(false);
        return;
      }

      if (paymentMethod === 'mobile_money' && !mobileNumber.trim()) {
        toast({
          title: "Erreur",
          description: "Veuillez saisir le numéro de téléphone",
          variant: "destructive",
        });
        setIsProcessing(false);
        return;
      }

      if (!proofFile) {
        toast({
          title: "Erreur",
          description: "Veuillez télécharger une preuve de paiement",
          variant: "destructive",
        });
        setIsProcessing(false);
        return;
      }

      // Submit payment to Supabase
      await supabaseAdminService.submitPayment({
        userId: user.id,
        amount: parseFloat(selectedPlan.price),
        method: paymentMethod as 'crypto' | 'mobile_money',
        cryptoAddress: paymentMethod === 'crypto' ? cryptoAddress : undefined,
        cryptoTxHash: paymentMethod === 'crypto' ? cryptoTxHash : undefined,
        mobileNumber: paymentMethod === 'mobile_money' ? mobileNumber : undefined,
        mobileProvider: paymentMethod === 'mobile_money' ? mobileProvider : undefined,
        notes,
        proofFile,
      });

      toast({
        title: "Paiement soumis",
        description: "Votre demande de paiement a été soumise et sera traitée sous 24h",
      });
      
      onPaymentComplete(paymentMethod);
    } catch (error) {
      console.error('Payment submission error:', error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Une erreur est survenue lors de la soumission du paiement",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <CardHeader className="relative">
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-4"
            onClick={onClose}
          >
            <X className="w-4 h-4" />
          </Button>
          <CardTitle>Finaliser votre abonnement</CardTitle>
          <CardDescription>
            Plan sélectionné: <span className="text-foreground font-semibold">{selectedPlan.name}</span> - {selectedPlan.price}€/{selectedPlan.period}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Payment Method Selection */}
          <div>
            <Label className="text-base mb-4 block">Méthode de paiement</Label>
            <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
              <div className="space-y-3">
                {/* Crypto */}
                <label className="flex items-center gap-4 p-4 border rounded-lg cursor-pointer hover:bg-accent transition-colors">
                  <RadioGroupItem value="crypto" id="crypto" />
                  <Bitcoin className="w-6 h-6 text-primary" />
                  <div className="flex-1">
                    <div className="font-medium">Cryptomonnaies</div>
                    <div className="text-sm text-muted-foreground">Bitcoin, USDT, Ethereum</div>
                  </div>
                </label>

                {/* Mobile Money */}
                <label className="flex items-center gap-4 p-4 border rounded-lg cursor-pointer hover:bg-accent transition-colors">
                  <RadioGroupItem value="mobile_money" id="mobile_money" />
                  <Smartphone className="w-6 h-6 text-primary" />
                  <div className="flex-1">
                    <div className="font-medium">Mobile Money</div>
                    <div className="text-sm text-muted-foreground">Orange Money, MTN Mobile Money, Moov Money</div>
                  </div>
                </label>
              </div>
            </RadioGroup>
          </div>

          <Separator />

          {/* Payment Details Form */}
          {paymentMethod === 'crypto' && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="crypto-type">Cryptomonnaie</Label>
                <select
                  id="crypto-type"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option>Bitcoin (BTC)</option>
                  <option>USDT (TRC20)</option>
                  <option>Ethereum (ETH)</option>
                </select>
              </div>
              <div>
                <Label htmlFor="crypto-address">Adresse de destination</Label>
                <Input
                  id="crypto-address"
                  placeholder="bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh"
                  value={cryptoAddress}
                  onChange={(e) => setCryptoAddress(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="tx-hash">Hash de transaction (optionnel)</Label>
                <Input
                  id="tx-hash"
                  placeholder="Transaction hash après paiement"
                  value={cryptoTxHash}
                  onChange={(e) => setCryptoTxHash(e.target.value)}
                />
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">
                  <strong>Adresse de réception:</strong>
                </p>
                <p className="text-xs font-mono bg-background p-2 rounded border">
                  bc1qexampleaddressforfixedpronosvip123456789
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Envoyez exactement {selectedPlan.price}€ en crypto à cette adresse
                </p>
              </div>
            </div>
          )}

          {paymentMethod === 'mobile_money' && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="phone">Numéro de téléphone</Label>
                <Input
                  id="phone"
                  placeholder="+225 XX XX XX XX XX"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="operator">Opérateur</Label>
                <select
                  id="operator"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={mobileProvider}
                  onChange={(e) => setMobileProvider((document.getElementById('operator') as HTMLSelectElement).value)}
                >
                  <option>Orange Money</option>
                  <option>MTN Mobile Money</option>
                  <option>Moov Money</option>
                </select>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">
                  <strong>Numéro de réception:</strong>
                </p>
                <p className="text-xs font-mono bg-background p-2 rounded border">
                  +225 01 02 03 04 05
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Envoyez {selectedPlan.price}€ via {mobileProvider} à ce numéro
                </p>
              </div>
            </div>
          )}

          {/* Proof Upload */}
          <div>
            <Label htmlFor="proof" className="text-base mb-2 block">Preuve de paiement *</Label>
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
              <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-2">
                Téléchargez une capture d'écran de votre paiement
              </p>
              <Input
                id="proof"
                type="file"
                accept="image/*"
                onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                className="max-w-xs mx-auto"
              />
              {proofFile && (
                <p className="text-xs text-green-600 mt-2">
                  Fichier sélectionné: {proofFile.name}
                </p>
              )}
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Notes (optionnel)</Label>
            <Textarea
              id="notes"
              placeholder="Ajoutez des informations supplémentaires..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          {/* Summary */}
          <div className="bg-muted p-4 rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Plan {selectedPlan.name}</span>
              <span className="font-medium">{selectedPlan.price}€</span>
            </div>
            <Separator className="my-2" />
            <div className="flex justify-between font-semibold">
              <span>Total</span>
              <span className="text-primary">{selectedPlan.price}€</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Annuler
            </Button>
            <Button
              onClick={handlePayment}
              disabled={isProcessing}
              className="flex-1"
            >
              {isProcessing ? 'Traitement...' : 'Confirmer le paiement'}
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            En confirmant, vous acceptez nos conditions générales d'utilisation et notre politique de confidentialité.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
