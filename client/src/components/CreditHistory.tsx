import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useCreditHistory } from '@/hooks/useCredits';
import { format } from 'date-fns';
import { nb } from 'date-fns/locale';
import { 
  Download, 
  Filter, 
  ArrowUpRight, 
  ArrowDownRight,
  Coins,
  CreditCard,
  Bot,
  Calendar,
  FileDown
} from 'lucide-react';
import { motion } from 'framer-motion';

type TransactionType = 'all' | 'purchase' | 'usage' | 'refund' | 'bonus';

interface Transaction {
  id: string;
  type: 'purchase' | 'usage' | 'refund' | 'bonus';
  amount: number;
  description: string;
  date: Date;
  balance: number;
  metadata?: {
    model?: string;
    packName?: string;
    refundReason?: string;
  };
}

export function CreditHistory() {
  const [filter, setFilter] = useState<TransactionType>('all');
  const { data: transactions, isLoading } = useCreditHistory();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filteredTransactions = transactions?.filter(t => {
    if (filter === 'all') return true;
    return t.type === filter;
  }) || [];

  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const displayedTransactions = filteredTransactions.slice(startIndex, startIndex + itemsPerPage);

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'purchase':
        return <CreditCard className="h-4 w-4" />;
      case 'usage':
        return <Bot className="h-4 w-4" />;
      case 'refund':
        return <ArrowDownRight className="h-4 w-4" />;
      case 'bonus':
        return <Coins className="h-4 w-4" />;
      default:
        return <Coins className="h-4 w-4" />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'purchase':
        return 'text-green-500';
      case 'usage':
        return 'text-orange-500';
      case 'refund':
        return 'text-blue-500';
      case 'bonus':
        return 'text-purple-500';
      default:
        return 'text-muted-foreground';
    }
  };

  const getTransactionBadge = (type: string) => {
    switch (type) {
      case 'purchase':
        return <Badge variant="secondary" className="bg-green-500/10 text-green-500">Kjøp</Badge>;
      case 'usage':
        return <Badge variant="secondary" className="bg-orange-500/10 text-orange-500">Bruk</Badge>;
      case 'refund':
        return <Badge variant="secondary" className="bg-blue-500/10 text-blue-500">Refusjon</Badge>;
      case 'bonus':
        return <Badge variant="secondary" className="bg-purple-500/10 text-purple-500">Bonus</Badge>;
      default:
        return null;
    }
  };

  const exportToCSV = () => {
    const headers = ['Dato', 'Type', 'Beskrivelse', 'Beløp', 'Saldo'];
    const rows = filteredTransactions.map(t => [
      format(t.date, 'dd.MM.yyyy HH:mm', { locale: nb }),
      t.type,
      t.description,
      t.amount > 0 ? `+${t.amount}` : t.amount.toString(),
      t.balance.toString()
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `kreditthistorikk_${format(new Date(), 'yyyyMMdd')}.csv`);
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="animate-pulse text-muted-foreground">
            Laster transaksjoner...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="credit-history">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Kreditthistorikk
            </CardTitle>
            <CardDescription>
              Se alle dine kreditttransaksjoner
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={exportToCSV}
            data-testid="button-export-csv"
          >
            <FileDown className="h-4 w-4 mr-2" />
            Eksporter CSV
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Filter Tabs */}
        <Tabs value={filter} onValueChange={(value) => setFilter(value as TransactionType)}>
          <TabsList className="grid grid-cols-5 w-full">
            <TabsTrigger value="all" data-testid="filter-all">
              Alle
            </TabsTrigger>
            <TabsTrigger value="purchase" data-testid="filter-purchases">
              Kjøp
            </TabsTrigger>
            <TabsTrigger value="usage" data-testid="filter-usage">
              Bruk
            </TabsTrigger>
            <TabsTrigger value="refund" data-testid="filter-refund">
              Refusjon
            </TabsTrigger>
            <TabsTrigger value="bonus" data-testid="filter-bonus">
              Bonus
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Transactions List */}
        <ScrollArea className="h-[400px] pr-4">
          {displayedTransactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Ingen transaksjoner funnet
            </div>
          ) : (
            <div className="space-y-2">
              {displayedTransactions.map((transaction, index) => (
                <motion.div
                  key={transaction.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  data-testid={`transaction-${transaction.id}`}
                >
                  <Card className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className={`mt-1 ${getTransactionColor(transaction.type)}`}>
                          {getTransactionIcon(transaction.type)}
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm">
                              {transaction.description}
                            </p>
                            {getTransactionBadge(transaction.type)}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {format(transaction.date, 'dd. MMM yyyy HH:mm', { locale: nb })}
                          </p>
                          {transaction.metadata?.model && (
                            <p className="text-xs text-muted-foreground">
                              Modell: {transaction.metadata.model}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-right space-y-1">
                        <p className={`font-bold text-lg ${
                          transaction.amount > 0 ? 'text-green-500' : 'text-orange-500'
                        }`}>
                          {transaction.amount > 0 ? '+' : ''}{transaction.amount}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Saldo: {transaction.balance}
                        </p>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Pagination */}
        {totalPages > 1 && (
          <>
            <Separator />
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Viser {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredTransactions.length)} av {filteredTransactions.length}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  data-testid="button-prev-page"
                >
                  Forrige
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  data-testid="button-next-page"
                >
                  Neste
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}