import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { usePurchaseCredits } from '@/hooks/useCredits';
import { useToast } from '@/hooks/use-toast';
import { 
  CreditCard, 
  Coins, 
  TrendingUp, 
  Check, 
  Star,
  Zap,
  Trophy,
  Sparkles,
  ArrowRight,
  Shield,
  Calendar
} from 'lucide-react';
import { motion } from 'framer-motion';

interface CreditPurchaseModalProps {
  open: boolean;
  onClose: () => void;
}

interface CreditPack {
  id: string;
  name: string;
  credits: number;
  price: number;
  savings?: number;
  popular?: boolean;
  features: string[];
}

interface Subscription {
  id: string;
  name: string;
  price: number;
  credits: number;
  interval: 'monthly' | 'yearly';
  features: string[];
  recommended?: boolean;
}

const creditPacks: CreditPack[] = [
  {
    id: 'starter',
    name: 'Starter',
    credits: 1000,
    price: 100,
    features: [
      '1 000 AI-kreditter',
      'Ingen utløpsdato',
      'Grunnleggende støtte'
    ]
  },
  {
    id: 'popular',
    name: 'Populær',
    credits: 3000,
    price: 250,
    popular: true,
    savings: 50,
    features: [
      '3 000 AI-kreditter',
      'Spar 50 kr',
      'Prioritert støtte',
      'Bonusfunksjoner'
    ]
  },
  {
    id: 'pro',
    name: 'Pro',
    credits: 10000,
    price: 800,
    savings: 200,
    features: [
      '10 000 AI-kreditter',
      'Spar 200 kr',
      'Premium støtte',
      'Alle funksjoner',
      'Tidlig tilgang til nye funksjoner'
    ]
  }
];

const subscriptions: Subscription[] = [
  {
    id: 'pro-monthly',
    name: 'Pro Månedlig',
    price: 150,
    credits: 2000,
    interval: 'monthly',
    recommended: true,
    features: [
      '2 000 kreditter hver måned',
      'Rull over ubrukte kreditter',
      'Prioritert støtte',
      'Avbryt når som helst'
    ]
  },
  {
    id: 'business-monthly',
    name: 'Business Månedlig',
    price: 490,
    credits: 10000,
    interval: 'monthly',
    features: [
      '10 000 kreditter hver måned',
      'Rull over ubrukte kreditter',
      'Premium støtte 24/7',
      'API-tilgang',
      'Team-funksjoner',
      'Dedikert kontaktperson'
    ]
  }
];

export function CreditPurchaseModal({ open, onClose }: CreditPurchaseModalProps) {
  const { toast } = useToast();
  const purchaseCredits = usePurchaseCredits();
  const [selectedPack, setSelectedPack] = useState<string | null>(null);
  const [selectedSubscription, setSelectedSubscription] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePurchasePack = async (pack: CreditPack) => {
    setIsProcessing(true);
    setSelectedPack(pack.id);
    
    try {
      await purchaseCredits.mutateAsync({
        type: 'pack',
        packId: pack.id,
        amount: pack.price
      });
      
      toast({
        title: 'Kjøp vellykket!',
        description: `${pack.credits.toLocaleString('nb-NO')} kreditter lagt til kontoen din.`,
      });
      
      onClose();
    } catch (error) {
      toast({
        title: 'Kjøp feilet',
        description: 'Kunne ikke fullføre kjøpet. Prøv igjen senere.',
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
      setSelectedPack(null);
    }
  };

  const handleSubscribe = async (subscription: Subscription) => {
    setIsProcessing(true);
    setSelectedSubscription(subscription.id);
    
    try {
      await purchaseCredits.mutateAsync({
        type: 'subscription',
        subscriptionId: subscription.id,
        amount: subscription.price
      });
      
      toast({
        title: 'Abonnement aktivert!',
        description: `Du får ${subscription.credits.toLocaleString('nb-NO')} kreditter hver måned.`,
      });
      
      onClose();
    } catch (error) {
      toast({
        title: 'Abonnement feilet',
        description: 'Kunne ikke aktivere abonnement. Prøv igjen senere.',
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
      setSelectedSubscription(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh]" data-testid="modal-credit-purchase">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <Coins className="h-6 w-6 text-primary" />
            Kjøp AI-kreditter
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="packs" className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="packs" data-testid="tab-credit-packs">
              <CreditCard className="h-4 w-4 mr-2" />
              Kredittpakker
            </TabsTrigger>
            <TabsTrigger value="subscriptions" data-testid="tab-subscriptions">
              <Calendar className="h-4 w-4 mr-2" />
              Abonnementer
            </TabsTrigger>
          </TabsList>

          {/* Credit Packs Tab */}
          <TabsContent value="packs" className="mt-6">
            <div className="grid gap-4 md:grid-cols-3">
              {creditPacks.map((pack, index) => (
                <motion.div
                  key={pack.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card 
                    className={`relative overflow-hidden ${
                      pack.popular ? 'border-primary shadow-lg scale-105' : ''
                    }`}
                    data-testid={`card-pack-${pack.id}`}
                  >
                    {pack.popular && (
                      <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2">
                        <Badge className="bg-primary text-primary-foreground px-3 py-1">
                          <Star className="h-3 w-3 mr-1" />
                          Mest populær
                        </Badge>
                      </div>
                    )}
                    
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>{pack.name}</span>
                        {pack.name === 'Pro' && <Trophy className="h-5 w-5 text-yellow-500" />}
                      </CardTitle>
                      <CardDescription>
                        <div className="flex items-baseline gap-1 mt-2">
                          <span className="text-3xl font-bold text-foreground">
                            {pack.credits.toLocaleString('nb-NO')}
                          </span>
                          <span className="text-sm text-muted-foreground">kreditter</span>
                        </div>
                      </CardDescription>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold">
                          {pack.price} kr
                        </span>
                        {pack.savings && (
                          <Badge variant="secondary" className="bg-green-500/10 text-green-500">
                            Spar {pack.savings} kr
                          </Badge>
                        )}
                      </div>
                      
                      <Separator />
                      
                      <ul className="space-y-2">
                        {pack.features.map((feature, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm">
                            <Check className="h-4 w-4 text-green-500 mt-0.5" />
                            <span className="text-muted-foreground">{feature}</span>
                          </li>
                        ))}
                      </ul>
                      
                      <Button 
                        className="w-full"
                        variant={pack.popular ? "default" : "secondary"}
                        onClick={() => handlePurchasePack(pack)}
                        disabled={isProcessing}
                        data-testid={`button-buy-${pack.id}`}
                      >
                        {isProcessing && selectedPack === pack.id ? (
                          <>Behandler...</>
                        ) : (
                          <>
                            <Zap className="h-4 w-4 mr-2" />
                            Kjøp nå
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </TabsContent>

          {/* Subscriptions Tab */}
          <TabsContent value="subscriptions" className="mt-6">
            <div className="grid gap-4 md:grid-cols-2">
              {subscriptions.map((subscription, index) => (
                <motion.div
                  key={subscription.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card 
                    className={`relative ${
                      subscription.recommended ? 'border-primary shadow-lg' : ''
                    }`}
                    data-testid={`card-subscription-${subscription.id}`}
                  >
                    {subscription.recommended && (
                      <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary">
                        <Sparkles className="h-3 w-3 mr-1" />
                        Anbefalt
                      </Badge>
                    )}
                    
                    <CardHeader className="pt-8">
                      <CardTitle className="text-xl">{subscription.name}</CardTitle>
                      <CardDescription>
                        <div className="flex items-baseline gap-2 mt-2">
                          <span className="text-3xl font-bold text-foreground">
                            {subscription.price} kr
                          </span>
                          <span className="text-muted-foreground">/måned</span>
                        </div>
                        <div className="mt-2 text-sm">
                          {subscription.credits.toLocaleString('nb-NO')} kreditter månedlig
                        </div>
                      </CardDescription>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      <Separator />
                      
                      <ul className="space-y-2">
                        {subscription.features.map((feature, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm">
                            <Check className="h-4 w-4 text-green-500 mt-0.5" />
                            <span className="text-muted-foreground">{feature}</span>
                          </li>
                        ))}
                      </ul>
                      
                      <Button 
                        className="w-full"
                        variant={subscription.recommended ? "default" : "secondary"}
                        onClick={() => handleSubscribe(subscription)}
                        disabled={isProcessing}
                        data-testid={`button-subscribe-${subscription.id}`}
                      >
                        {isProcessing && selectedSubscription === subscription.id ? (
                          <>Behandler...</>
                        ) : (
                          <>
                            <ArrowRight className="h-4 w-4 mr-2" />
                            Start abonnement
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            <Card className="mt-6 bg-muted/50">
              <CardContent className="flex items-center gap-4 pt-6">
                <Shield className="h-8 w-8 text-primary" />
                <div className="flex-1">
                  <p className="font-medium">100% sikker betaling</p>
                  <p className="text-sm text-muted-foreground">
                    Alle betalinger behandles sikkert gjennom Stripe. Vi lagrer aldri kortinformasjon.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}