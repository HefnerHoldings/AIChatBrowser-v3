import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  ResponsiveContainer
} from "recharts";
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Calendar,
  Filter,
  Download
} from "lucide-react";

interface TestHistoryProps {
  results: any[];
}

export default function TestHistory({ results }: TestHistoryProps) {
  const [timeRange, setTimeRange] = useState('7d');
  const [testTypeFilter, setTestTypeFilter] = useState('all');

  // Generate mock historical data
  const generateHistoricalData = () => {
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    const data = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      data.push({
        date: date.toLocaleDateString('no-NO', { month: 'short', day: 'numeric' }),
        lighthouse: Math.floor(Math.random() * 20) + 70,
        accessibility: Math.floor(Math.random() * 15) + 80,
        visual: Math.floor(Math.random() * 10) + 90,
        tests: Math.floor(Math.random() * 50) + 20,
        passed: Math.floor(Math.random() * 40) + 15,
        failed: Math.floor(Math.random() * 10) + 2
      });
    }
    
    return data;
  };

  const historicalData = generateHistoricalData();

  // Calculate trends
  const calculateTrend = (metric: string) => {
    if (historicalData.length < 2) return { value: 0, direction: 'stable' };
    
    const recent = historicalData.slice(-7);
    const older = historicalData.slice(-14, -7);
    
    const recentAvg = recent.reduce((sum, d) => sum + (d[metric as keyof typeof d] as number || 0), 0) / recent.length;
    const olderAvg = older.reduce((sum, d) => sum + (d[metric as keyof typeof d] as number || 0), 0) / older.length;
    
    const change = ((recentAvg - olderAvg) / olderAvg) * 100;
    
    return {
      value: Math.abs(change).toFixed(1),
      direction: change > 2 ? 'up' : change < -2 ? 'down' : 'stable'
    };
  };

  const exportHistory = () => {
    const csv = [
      ['Date', 'Lighthouse', 'Accessibility', 'Visual', 'Tests', 'Passed', 'Failed'],
      ...historicalData.map(d => [
        d.date,
        d.lighthouse,
        d.accessibility,
        d.visual,
        d.tests,
        d.passed,
        d.failed
      ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `test-history-${new Date().toISOString()}.csv`;
    a.click();
  };

  const getTrendIcon = (direction: string) => {
    switch (direction) {
      case 'up': return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'down': return <TrendingDown className="w-4 h-4 text-red-600" />;
      default: return <Minus className="w-4 h-4 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Header with filters */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32" data-testid="select-timerange">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Siste 7 dager</SelectItem>
              <SelectItem value="30d">Siste 30 dager</SelectItem>
              <SelectItem value="90d">Siste 90 dager</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={testTypeFilter} onValueChange={setTestTypeFilter}>
            <SelectTrigger className="w-40" data-testid="select-testtype">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Tester</SelectItem>
              <SelectItem value="lighthouse">Lighthouse</SelectItem>
              <SelectItem value="accessibility">Tilgjengelighet</SelectItem>
              <SelectItem value="visual">Visuell</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <Button variant="outline" onClick={exportHistory} data-testid="button-export-history">
          <Download className="w-4 h-4 mr-2" />
          Eksporter CSV
        </Button>
      </div>

      {/* Trend Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Lighthouse Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">
                {historicalData[historicalData.length - 1]?.lighthouse}%
              </span>
              <div className="flex items-center gap-1">
                {getTrendIcon(calculateTrend('lighthouse').direction)}
                <span className="text-sm text-muted-foreground">
                  {calculateTrend('lighthouse').value}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Tilgjengelighet Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">
                {historicalData[historicalData.length - 1]?.accessibility}%
              </span>
              <div className="flex items-center gap-1">
                {getTrendIcon(calculateTrend('accessibility').direction)}
                <span className="text-sm text-muted-foreground">
                  {calculateTrend('accessibility').value}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Visuell Stabilitet</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">
                {historicalData[historicalData.length - 1]?.visual}%
              </span>
              <div className="flex items-center gap-1">
                {getTrendIcon(calculateTrend('visual').direction)}
                <span className="text-sm text-muted-foreground">
                  {calculateTrend('visual').value}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Suksessrate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">
                {Math.round((historicalData[historicalData.length - 1]?.passed / 
                  (historicalData[historicalData.length - 1]?.passed + 
                   historicalData[historicalData.length - 1]?.failed)) * 100)}%
              </span>
              <div className="flex items-center gap-1">
                {getTrendIcon(calculateTrend('passed').direction)}
                <span className="text-sm text-muted-foreground">
                  {calculateTrend('passed').value}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Score Trends Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Score Trender</CardTitle>
          <CardDescription>Ytelse over tid</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={historicalData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Legend />
              {(testTypeFilter === 'all' || testTypeFilter === 'lighthouse') && (
                <Line 
                  type="monotone" 
                  dataKey="lighthouse" 
                  stroke="#8b5cf6" 
                  name="Lighthouse"
                  strokeWidth={2}
                />
              )}
              {(testTypeFilter === 'all' || testTypeFilter === 'accessibility') && (
                <Line 
                  type="monotone" 
                  dataKey="accessibility" 
                  stroke="#10b981" 
                  name="Tilgjengelighet"
                  strokeWidth={2}
                />
              )}
              {(testTypeFilter === 'all' || testTypeFilter === 'visual') && (
                <Line 
                  type="monotone" 
                  dataKey="visual" 
                  stroke="#3b82f6" 
                  name="Visuell"
                  strokeWidth={2}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Test Volume Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Test Volum</CardTitle>
          <CardDescription>Antall tester kjørt</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={historicalData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="passed" 
                stackId="1"
                stroke="#10b981" 
                fill="#10b981"
                fillOpacity={0.6}
                name="Bestått"
              />
              <Area 
                type="monotone" 
                dataKey="failed" 
                stackId="1"
                stroke="#ef4444" 
                fill="#ef4444"
                fillOpacity={0.6}
                name="Feilet"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Recent Test Runs */}
      <Card>
        <CardHeader>
          <CardTitle>Nylige Test-kjøringer</CardTitle>
          <CardDescription>Detaljert logg over siste tester</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px]">
            <div className="space-y-2">
              {results.slice(0, 20).map((result: any, index: number) => (
                <div 
                  key={result.id || index}
                  className="flex items-center justify-between p-3 border rounded-lg"
                  data-testid={`history-item-${index}`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant={result.status === 'passed' ? 'secondary' : 'destructive'}>
                        {result.testType}
                      </Badge>
                      <span className="text-sm font-medium truncate">{result.url}</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {new Date(result.timestamp).toLocaleString('no-NO')}
                      {result.duration && ` • ${result.duration}ms`}
                    </div>
                  </div>
                  <div className="text-right">
                    {result.score !== undefined && (
                      <div className="text-lg font-bold">{result.score}%</div>
                    )}
                    <Badge variant={result.status === 'passed' ? 'outline' : 'destructive'}>
                      {result.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}