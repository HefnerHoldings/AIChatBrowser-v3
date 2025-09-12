import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface CreditBalance {
  balance: number;
  dailyFreeCredits?: {
    total: number;
    remaining: number;
    resetsAt: Date;
  };
  subscription?: {
    plan: string;
    creditsPerMonth: number;
    nextRenewal: Date;
  };
}

interface CreditTransaction {
  id: string;
  type: 'purchase' | 'usage' | 'refund' | 'bonus';
  amount: number;
  description: string;
  date: Date;
  balance: number;
  metadata?: any;
}

interface CreditPack {
  id: string;
  name: string;
  credits: number;
  price: number;
  savings?: number;
  popular?: boolean;
}

interface PurchaseRequest {
  type: 'pack' | 'subscription';
  packId?: string;
  subscriptionId?: string;
  amount: number;
}

// Hook for getting credit balance
export function useCredits() {
  const { data, isLoading, error } = useQuery<CreditBalance>({
    queryKey: ['/api/credits/balance'],
    refetchInterval: 30000, // Refresh every 30 seconds
    refetchOnWindowFocus: true,
  });

  return {
    balance: data?.balance,
    dailyFreeCredits: data?.dailyFreeCredits,
    subscription: data?.subscription,
    isLoading,
    error
  };
}

// Hook for getting credit balance only
export function useCreditsBalance() {
  const { data, isLoading } = useQuery<{ balance: number }>({
    queryKey: ['/api/credits/balance'],
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
  });

  return {
    balance: data?.balance || 0,
    isLoading
  };
}

// Hook for getting credit history
export function useCreditHistory() {
  return useQuery<CreditTransaction[]>({
    queryKey: ['/api/credits/history'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/credits/history');
      const data = await response.json();
      // Convert date strings to Date objects
      return data.map((t: any) => ({
        ...t,
        date: new Date(t.date)
      }));
    }
  });
}

// Hook for getting available credit packs
export function useCreditPacks() {
  return useQuery<CreditPack[]>({
    queryKey: ['/api/credits/packs'],
  });
}

// Hook for purchasing credits
export function usePurchaseCredits() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (purchase: PurchaseRequest) => {
      const response = await apiRequest('POST', '/api/credits/purchase', purchase);
      return response.json();
    },
    onSuccess: (data) => {
      // Invalidate and refetch credit balance
      queryClient.invalidateQueries({ queryKey: ['/api/credits/balance'] });
      queryClient.invalidateQueries({ queryKey: ['/api/credits/history'] });
      
      // Show success notification
      toast({
        title: 'Kjøp vellykket!',
        description: `${data.creditsAdded} kreditter er lagt til kontoen din.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Kjøp feilet',
        description: error.message || 'Kunne ikke fullføre kjøpet. Prøv igjen senere.',
        variant: 'destructive'
      });
    }
  });
}

// Hook for deducting credits after AI operations
export function useDeductCredits() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ amount, description }: { amount: number; description: string }) => {
      const response = await apiRequest('POST', '/api/credits/deduct', {
        amount,
        description
      });
      return response.json();
    },
    onSuccess: (data) => {
      // Invalidate and refetch credit balance
      queryClient.invalidateQueries({ queryKey: ['/api/credits/balance'] });
      queryClient.invalidateQueries({ queryKey: ['/api/credits/history'] });
      
      // Show deduction notification
      toast({
        title: 'Kreditter brukt',
        description: `${data.amount} kreditter ble trukket. Ny saldo: ${data.newBalance}`,
      });

      // Check for low balance warning
      if (data.newBalance < 10 && data.newBalance > 0) {
        setTimeout(() => {
          toast({
            title: 'Lite kreditter igjen',
            description: 'Du har mindre enn 10 kreditter. Vurder å kjøpe flere.',
            variant: 'destructive'
          });
        }, 1000);
      }
    },
    onError: (error: any) => {
      toast({
        title: 'Ikke nok kreditter',
        description: 'Du har ikke nok kreditter for denne operasjonen.',
        variant: 'destructive'
      });
    }
  });
}

// Hook for checking if user has enough credits
export function useHasEnoughCredits(requiredAmount: number) {
  const { balance } = useCredits();
  return (balance || 0) >= requiredAmount;
}

// Hook for managing subscription
export function useManageSubscription() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (action: 'cancel' | 'upgrade' | 'downgrade') => {
      const response = await apiRequest('POST', '/api/credits/subscription', { action });
      return response.json();
    },
    onSuccess: (data, action) => {
      queryClient.invalidateQueries({ queryKey: ['/api/credits/balance'] });
      
      const messages = {
        cancel: 'Abonnement kansellert',
        upgrade: 'Abonnement oppgradert',
        downgrade: 'Abonnement nedgradert'
      };
      
      toast({
        title: messages[action],
        description: 'Endringene trer i kraft ved neste fakturering.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Feil',
        description: 'Kunne ikke oppdatere abonnement. Prøv igjen senere.',
        variant: 'destructive'
      });
    }
  });
}

// Hook for refreshing daily free credits (admin/testing)
export function useRefreshDailyCredits() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/credits/refresh-daily');
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/credits/balance'] });
      
      toast({
        title: 'Daglige kreditter fornyet',
        description: `Du har nå ${data.dailyCredits} gratis kreditter for i dag.`,
      });
    }
  });
}