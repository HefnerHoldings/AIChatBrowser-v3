import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card } from '@/components/ui/card';
import { useCredits } from '@/hooks/useCredits';
import { CreditPurchaseModal } from './CreditPurchaseModal';
import { Coins, AlertTriangle, TrendingUp, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function CreditDisplay({ inline = false }: { inline?: boolean }) {
  const { balance, dailyFreeCredits, isLoading } = useCredits();
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [animatedBalance, setAnimatedBalance] = useState(0);
  const [showLowCreditWarning, setShowLowCreditWarning] = useState(false);

  // Animate balance counter
  useEffect(() => {
    if (balance !== undefined) {
      const duration = 1000;
      const steps = 30;
      const stepValue = (balance - animatedBalance) / steps;
      let currentStep = 0;

      const interval = setInterval(() => {
        currentStep++;
        setAnimatedBalance(prev => {
          const newValue = prev + stepValue;
          return currentStep === steps ? balance : newValue;
        });

        if (currentStep === steps) {
          clearInterval(interval);
        }
      }, duration / steps);

      return () => clearInterval(interval);
    }
  }, [balance]);

  // Check for low credits
  useEffect(() => {
    if (balance !== undefined && balance < 10 && balance > 0) {
      setShowLowCreditWarning(true);
      setTimeout(() => setShowLowCreditWarning(false), 5000);
    }
  }, [balance]);

  const getCreditColor = () => {
    if (balance === undefined) return 'text-muted-foreground';
    if (balance === 0) return 'text-destructive';
    if (balance < 10) return 'text-orange-500';
    if (balance < 50) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getProgressValue = () => {
    if (!balance) return 0;
    // Show progress based on a scale of 0-100 credits for visual representation
    return Math.min((balance / 100) * 100, 100);
  };

  // Inline version for header bar
  if (inline) {
    return (
      <>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600/20 to-purple-600/20 hover:from-blue-600/30 hover:to-purple-600/30 rounded-lg border border-blue-500/30 cursor-pointer transition-all shadow-md hover:shadow-lg"
          onClick={() => setShowPurchaseModal(true)}
          data-testid="credit-display-inline"
        >
          <Coins className={`h-5 w-5 ${balance === 0 ? 'text-red-500 animate-pulse' : balance < 10 ? 'text-yellow-500' : 'text-blue-400'}`} />
          <div className="flex flex-col items-start">
            <div className="flex items-center gap-1">
              <motion.span 
                className={`font-bold text-lg ${balance === 0 ? 'text-red-500' : balance < 10 ? 'text-yellow-500' : 'text-white'}`}
                key={animatedBalance}
                initial={{ scale: 1 }}
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 0.2 }}
              >
                {Math.floor(animatedBalance).toLocaleString('nb-NO')}
              </motion.span>
              <span className="text-sm font-medium text-blue-200">kreditter</span>
            </div>
            {dailyFreeCredits && (
              <span className="text-xs text-blue-300/80">
                Gratis: {dailyFreeCredits.remaining}/{dailyFreeCredits.total}
              </span>
            )}
          </div>
          {balance < 10 && (
            <AlertTriangle className="h-4 w-4 text-yellow-500 animate-pulse ml-2" />
          )}
        </motion.div>
        
        {/* Purchase Modal */}
        <CreditPurchaseModal 
          open={showPurchaseModal}
          onClose={() => setShowPurchaseModal(false)}
        />
      </>
    );
  }

  // Original card version
  return (
    <>
      <div 
        className="fixed top-4 right-4 z-50"
        data-testid="credit-display"
      >
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card 
            className="bg-background/95 backdrop-blur-md border-border/50 shadow-lg cursor-pointer hover:shadow-xl transition-all duration-200 min-w-[200px]"
            onClick={() => setShowPurchaseModal(true)}
            data-testid="button-open-credit-modal"
          >
            <div className="p-4 space-y-3">
              {/* Balance Display */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Coins className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium text-muted-foreground">
                    Kreditter
                  </span>
                </div>
                <motion.div 
                  className={`text-xl font-bold ${getCreditColor()}`}
                  data-testid="text-credit-balance"
                  key={animatedBalance}
                  initial={{ scale: 1 }}
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 0.2 }}
                >
                  {Math.floor(animatedBalance).toLocaleString('nb-NO')}
                </motion.div>
              </div>

              {/* Progress Bar */}
              <Progress 
                value={getProgressValue()} 
                className="h-2"
                data-testid="progress-credit-meter"
              />

              {/* Daily Free Credits */}
              {dailyFreeCredits !== undefined && (
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1">
                    <Sparkles className="h-3 w-3 text-primary" />
                    <span className="text-muted-foreground">Daglig gratis</span>
                  </div>
                  <Badge 
                    variant={dailyFreeCredits.remaining > 0 ? "secondary" : "outline"}
                    className="text-xs"
                    data-testid="text-daily-free"
                  >
                    {dailyFreeCredits.remaining}/{dailyFreeCredits.total}
                  </Badge>
                </div>
              )}

              {/* Buy More Button */}
              <Button 
                size="sm" 
                className="w-full"
                variant={balance === 0 ? "destructive" : "secondary"}
                data-testid="button-buy-credits"
              >
                <TrendingUp className="h-3 w-3 mr-1" />
                {balance === 0 ? 'Kjøp kreditter nå' : 'Kjøp flere'}
              </Button>
            </div>
          </Card>
        </motion.div>

        {/* Low Credit Warning */}
        <AnimatePresence>
          {showLowCreditWarning && (
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              className="mt-2"
            >
              <Card className="bg-orange-900/20 border-orange-500/50 p-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                  <p className="text-xs text-orange-500">
                    Lite kreditter igjen! Kjøp flere for å fortsette.
                  </p>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Purchase Modal */}
      <CreditPurchaseModal 
        open={showPurchaseModal}
        onClose={() => setShowPurchaseModal(false)}
      />
    </>
  );
}