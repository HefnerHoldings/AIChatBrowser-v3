import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart3, 
  LineChart, 
  PieChart, 
  Download, 
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Filter,
  FileSpreadsheet,
  Database,
  Calendar,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

export function DataAnalyticsSidebar() {
  const [selectedMetric, setSelectedMetric] = useState('leads');

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <h3 className="font-semibold text-lg mb-1">Data Analytics</h3>
        <p className="text-sm text-muted-foreground">
          Analyser og visualiser data
        </p>
      </div>

      <Tabs defaultValue="overview" className="flex-1 flex flex-col">
        <TabsList className="mx-4 mt-4">
          <TabsTrigger value="overview">Oversikt</TabsTrigger>
          <TabsTrigger value="metrics">Metrikker</TabsTrigger>
          <TabsTrigger value="export">Eksport</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="flex-1 px-4">
          <ScrollArea className="h-full">
            <div className="space-y-4 pb-4">
              {/* Key Metrics */}
              <div className="grid grid-cols-2 gap-3">
                <Card className="p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Totale leads</span>
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  </div>
                  <div className="text-2xl font-bold">1,234</div>
                  <div className="text-xs text-green-500">+12% siste uke</div>
                </Card>
                <Card className="p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Konvertering</span>
                    <ArrowUpRight className="h-4 w-4 text-blue-500" />
                  </div>
                  <div className="text-2xl font-bold">23%</div>
                  <div className="text-xs text-blue-500">+5% siste måned</div>
                </Card>
                <Card className="p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">E-poster</span>
                    <Database className="h-4 w-4 text-purple-500" />
                  </div>
                  <div className="text-2xl font-bold">892</div>
                  <div className="text-xs text-purple-500">78% verifisert</div>
                </Card>
                <Card className="p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Bedrifter</span>
                    <TrendingDown className="h-4 w-4 text-red-500" />
                  </div>
                  <div className="text-2xl font-bold">156</div>
                  <div className="text-xs text-red-500">-3% siste uke</div>
                </Card>
              </div>

              {/* Data Distribution */}
              <Card className="p-4">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <PieChart className="h-4 w-4" />
                  Datafordeling
                </h4>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>IT & Teknologi</span>
                      <span className="font-medium">45%</span>
                    </div>
                    <Progress value={45} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Finans</span>
                      <span className="font-medium">28%</span>
                    </div>
                    <Progress value={28} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Helse</span>
                      <span className="font-medium">15%</span>
                    </div>
                    <Progress value={15} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Andre</span>
                      <span className="font-medium">12%</span>
                    </div>
                    <Progress value={12} className="h-2" />
                  </div>
                </div>
              </Card>

              {/* Recent Activity */}
              <Card className="p-4">
                <h4 className="font-medium mb-3">Siste aktivitet</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>245 nye leads importert</span>
                    <Badge variant="outline">I dag</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>89 e-poster verifisert</span>
                    <Badge variant="outline">2t siden</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Eksportert til CRM</span>
                    <Badge variant="outline">I går</Badge>
                  </div>
                </div>
              </Card>
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="metrics" className="flex-1 px-4">
          <ScrollArea className="h-full">
            <div className="space-y-4 pb-4">
              <Card className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium">Velg metrikk</h4>
                  <Select value={selectedMetric} onValueChange={setSelectedMetric}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="leads">Leads</SelectItem>
                      <SelectItem value="conversion">Konvertering</SelectItem>
                      <SelectItem value="quality">Kvalitet</SelectItem>
                      <SelectItem value="source">Kilde</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="h-48 flex items-center justify-center bg-muted rounded">
                  <LineChart className="h-8 w-8 text-muted-foreground" />
                </div>
              </Card>

              <Card className="p-4">
                <h4 className="font-medium mb-3">Tidsperiode</h4>
                <div className="grid grid-cols-4 gap-2">
                  <Button variant="outline" size="sm">24t</Button>
                  <Button variant="outline" size="sm">7d</Button>
                  <Button variant="default" size="sm">30d</Button>
                  <Button variant="outline" size="sm">År</Button>
                </div>
              </Card>
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="export" className="flex-1 px-4">
          <ScrollArea className="h-full">
            <div className="space-y-4 pb-4">
              <Card className="p-4">
                <h4 className="font-medium mb-3">Eksportformat</h4>
                <div className="space-y-2">
                  <Button variant="outline" className="w-full justify-start">
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Excel (.xlsx)
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Database className="h-4 w-4 mr-2" />
                    CSV (.csv)
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Download className="h-4 w-4 mr-2" />
                    JSON (.json)
                  </Button>
                </div>
              </Card>

              <Card className="p-4">
                <h4 className="font-medium mb-3">Integrasjoner</h4>
                <div className="space-y-2">
                  <Button variant="outline" className="w-full justify-start">
                    Salesforce
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    HubSpot
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    Google Sheets
                  </Button>
                </div>
              </Card>
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}