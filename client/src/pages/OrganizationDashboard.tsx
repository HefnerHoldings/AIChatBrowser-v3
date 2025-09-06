import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Building, Users, Activity, TrendingUp, 
  AlertCircle, Calendar, Target, Award,
  Clock, BarChart3, PieChart, LineChart,
  Eye, EyeOff, UserCheck, UserX
} from 'lucide-react';
import { format } from 'date-fns';
import { nb } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  department: string;
  position: string;
  userType: string;
}

interface OrganizationMetrics {
  totalEmployees: number;
  activeToday: number;
  averageProductivity: number;
  totalFocusTime: number;
  topDepartments: Array<{ department: string; productivity: number }>;
}

export default function OrganizationDashboard() {
  const { toast } = useToast();
  const [selectedPeriod, setSelectedPeriod] = useState('today');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  
  const organizationId = localStorage.getItem('organizationId') || 'demo-org';
  
  // Fetch organization data
  const { data: organization } = useQuery({
    queryKey: [`/api/organizations/${organizationId}`],
  });

  // Fetch employees
  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: [`/api/organizations/${organizationId}/employees`],
  });

  // Fetch organization-wide metrics
  const { data: metrics } = useQuery<OrganizationMetrics>({
    queryKey: [`/api/organizations/${organizationId}/metrics`, { period: selectedPeriod }],
  });

  // Fetch tracking notifications for organization
  const { data: notifications = [] } = useQuery({
    queryKey: [`/api/organizations/${organizationId}/notifications`],
  });

  // Calculate department distribution
  const departmentStats = employees.reduce((acc: Record<string, number>, emp) => {
    const dept = emp.department || 'Ikke tildelt';
    acc[dept] = (acc[dept] || 0) + 1;
    return acc;
  }, {});

  // Get unique departments
  const departments = Array.from(new Set(employees.map(e => e.department).filter(Boolean)));

  // Filter employees by department
  const filteredEmployees = selectedDepartment === 'all' 
    ? employees 
    : employees.filter(e => e.department === selectedDepartment);

  // Mock productivity data for employees (would come from real API)
  const getEmployeeProductivity = (employeeId: string) => {
    return Math.floor(Math.random() * 30) + 70; // 70-100
  };

  const getEmployeeStatus = (employeeId: string) => {
    const statuses = ['Aktiv', 'Pause', 'Offline', 'I møte'];
    return statuses[Math.floor(Math.random() * statuses.length)];
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'Aktiv': return 'bg-green-500';
      case 'Pause': return 'bg-yellow-500';
      case 'I møte': return 'bg-blue-500';
      default: return 'bg-gray-400';
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Building className="h-12 w-12 text-primary" />
                <div>
                  <h1 className="text-2xl font-bold">
                    {organization?.name || 'Organisasjonsdashboard'}
                  </h1>
                  <p className="text-muted-foreground">
                    {organization?.plan === 'enterprise' ? 'Enterprise' : 'Professional'} Plan
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="today">I dag</SelectItem>
                    <SelectItem value="week">Denne uken</SelectItem>
                    <SelectItem value="month">Denne måneden</SelectItem>
                    <SelectItem value="quarter">Dette kvartalet</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline">
                  <Calendar className="h-4 w-4 mr-2" />
                  Velg periode
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Totalt ansatte</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{employees.length}</div>
            <p className="text-xs text-muted-foreground">
              {employees.filter(e => e.userType === 'admin').length} administratorer
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktive nå</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.floor(employees.length * 0.7)}
            </div>
            <Progress value={70} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gj.snitt produktivitet</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">82%</div>
            <p className="text-xs text-green-600">+5% fra forrige uke</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total fokustid</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">312t</div>
            <p className="text-xs text-muted-foreground">Denne uken</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="employees" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="employees">Ansatte</TabsTrigger>
          <TabsTrigger value="productivity">Produktivitet</TabsTrigger>
          <TabsTrigger value="departments">Avdelinger</TabsTrigger>
          <TabsTrigger value="alerts">Varsler</TabsTrigger>
        </TabsList>

        {/* Employees Tab */}
        <TabsContent value="employees" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Ansattoversikt</CardTitle>
                  <CardDescription>
                    Sanntidsstatus og produktivitet for alle ansatte
                  </CardDescription>
                </div>
                <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Alle avdelinger" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle avdelinger</SelectItem>
                    {departments.map(dept => (
                      <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Navn</TableHead>
                    <TableHead>Avdeling</TableHead>
                    <TableHead>Stilling</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Produktivitet</TableHead>
                    <TableHead>Sporing</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEmployees.map((employee) => {
                    const status = getEmployeeStatus(employee.id);
                    const productivity = getEmployeeProductivity(employee.id);
                    const trackingEnabled = Math.random() > 0.2;
                    
                    return (
                      <TableRow key={employee.id}>
                        <TableCell className="font-medium">
                          {employee.firstName} {employee.lastName}
                        </TableCell>
                        <TableCell>{employee.department || '-'}</TableCell>
                        <TableCell>{employee.position || '-'}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className={`h-2 w-2 rounded-full ${getStatusColor(status)}`} />
                            <span className="text-sm">{status}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={productivity} className="w-20" />
                            <span className="text-sm font-medium">{productivity}%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {trackingEnabled ? (
                            <Badge variant="outline" className="text-green-600">
                              <Eye className="h-3 w-3 mr-1" />
                              Aktiv
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-orange-600">
                              <EyeOff className="h-3 w-3 mr-1" />
                              Blokkert
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Productivity Tab */}
        <TabsContent value="productivity" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Produktivitetstrend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center bg-muted rounded">
                  <LineChart className="h-12 w-12 text-muted-foreground" />
                  <p className="ml-4 text-muted-foreground">Graf kommer her</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tidsfordeling</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center bg-muted rounded">
                  <PieChart className="h-12 w-12 text-muted-foreground" />
                  <p className="ml-4 text-muted-foreground">Kakediagram kommer her</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Top 5 mest produktive ansatte</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {employees.slice(0, 5).map((emp, index) => (
                  <div key={emp.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary text-primary-foreground font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{emp.firstName} {emp.lastName}</p>
                        <p className="text-sm text-muted-foreground">{emp.department}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Progress value={95 - index * 3} className="w-24" />
                      <span className="font-medium">{95 - index * 3}%</span>
                      {index === 0 && <Trophy className="h-5 w-5 text-yellow-500" />}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Departments Tab */}
        <TabsContent value="departments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Avdelingsstatistikk</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(departmentStats).map(([dept, count]) => (
                  <div key={dept} className="flex items-center justify-between p-4 border rounded">
                    <div>
                      <p className="font-medium">{dept}</p>
                      <p className="text-sm text-muted-foreground">{count} ansatte</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Gj.snitt produktivitet</p>
                        <div className="flex items-center gap-2">
                          <Progress value={75 + Math.random() * 20} className="w-24" />
                          <span className="font-medium">{Math.floor(75 + Math.random() * 20)}%</span>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        Se detaljer
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Varsler og hendelser</CardTitle>
              <CardDescription>
                Viktige hendelser relatert til ansattes aktivitet og personvern
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[
                  { 
                    type: 'tracking_blocked', 
                    user: 'Erik Hansen', 
                    message: 'har blokkert sporing', 
                    time: '10 minutter siden' 
                  },
                  { 
                    type: 'low_productivity', 
                    user: 'Maria Olsen', 
                    message: 'produktivitet under 50% i 2 timer', 
                    time: '1 time siden' 
                  },
                  { 
                    type: 'privacy_changed', 
                    user: 'Johan Berg', 
                    message: 'har endret personverninnstillinger', 
                    time: '2 timer siden' 
                  },
                  { 
                    type: 'long_break', 
                    user: 'Lisa Andersen', 
                    message: 'har vært inaktiv i 30 minutter', 
                    time: '3 timer siden' 
                  }
                ].map((alert, index) => (
                  <Alert key={index} variant={alert.type === 'tracking_blocked' ? 'destructive' : 'default'}>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="flex items-center justify-between">
                      <span>
                        <strong>{alert.user}</strong> {alert.message}
                      </span>
                      <span className="text-xs text-muted-foreground">{alert.time}</span>
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}