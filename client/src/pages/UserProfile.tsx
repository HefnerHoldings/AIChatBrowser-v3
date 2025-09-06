import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  User, Building, Shield, Clock, Activity, 
  TrendingUp, AlertCircle, Eye, EyeOff, Bell,
  BarChart3, Calendar, Target, Award
} from 'lucide-react';
import { format } from 'date-fns';
import { nb } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

interface ProfileData {
  user: any;
  organization: any;
  privacySettings: any;
}

interface ActivityData {
  category: string;
  timeSpent: number;
  isWorkRelated: boolean;
  isDuringWorkHours: boolean;
}

interface ProductivityMetric {
  date: string;
  productivityScore: number;
  focusTime: number;
  breakTime: number;
  totalActiveTime: number;
  categorySummary: Record<string, number>;
  topSites: Array<{ domain: string; timeSpent: number }>;
  aiInsights: any;
}

export default function UserProfile() {
  const { toast } = useToast();
  const [trackingStatus, setTrackingStatus] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  // Fetch user profile
  const { data: profile, isLoading: profileLoading } = useQuery<ProfileData>({
    queryKey: ['/api/profile', { userId: localStorage.getItem('userId') || 'demo-user' }],
  });

  // Fetch work schedule
  const { data: workSchedule } = useQuery<any[]>({
    queryKey: [`/api/work-schedules/${localStorage.getItem('userId') || 'demo-user'}`],
  });

  // Fetch activity tracking for today
  const { data: activities } = useQuery<ActivityData[]>({
    queryKey: [`/api/activity-tracking/${localStorage.getItem('userId') || 'demo-user'}`, { date: selectedDate.toISOString() }],
  });

  // Fetch productivity metrics
  const { data: productivityMetrics } = useQuery<ProductivityMetric[]>({
    queryKey: [`/api/productivity-metrics/${localStorage.getItem('userId') || 'demo-user'}`, {
      startDate: new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1).toISOString(),
      endDate: new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0).toISOString()
    }],
  });

  // Fetch tracking notifications
  const { data: notifications } = useQuery<any[]>({
    queryKey: [`/api/tracking-notifications/${localStorage.getItem('userId') || 'demo-user'}`],
  });

  // Update privacy settings
  const updatePrivacyMutation = useMutation({
    mutationFn: async (settings: any) => {
      return apiRequest('PUT', `/api/privacy-settings/${localStorage.getItem('userId') || 'demo-user'}`, settings);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/profile'] });
      toast({
        title: "Innstillinger oppdatert",
        description: "Dine personverninnstillinger er nå oppdatert",
      });
    },
    onError: () => {
      toast({
        title: "Feil",
        description: "Kunne ikke oppdatere innstillinger",
        variant: "destructive",
      });
    }
  });

  // Calculate today's productivity
  const todayMetrics = productivityMetrics?.find(m => 
    new Date(m.date).toDateString() === selectedDate.toDateString()
  );

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}t ${minutes}m`;
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      development: '💻',
      productivity: '📊',
      communication: '📧',
      social: '👥',
      entertainment: '🎮',
      shopping: '🛍️',
      other: '🌐'
    };
    return icons[category] || '📄';
  };

  const isWithinWorkHours = () => {
    if (!workSchedule || workSchedule.length === 0) return false;
    
    const now = new Date();
    const dayOfWeek = now.getDay();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    const todaySchedule = workSchedule.find((s: any) => 
      s.dayOfWeek === dayOfWeek && s.isActive
    );
    
    if (!todaySchedule) return false;
    
    return currentTime >= todaySchedule.startTime && currentTime <= todaySchedule.endTime;
  };

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header with user info */}
      <div className="mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={profile?.user?.profileImageUrl} />
                  <AvatarFallback>
                    {profile?.user?.firstName?.[0]}{profile?.user?.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="text-2xl font-bold">
                    {profile?.user?.firstName} {profile?.user?.lastName}
                  </h1>
                  <p className="text-muted-foreground">{profile?.user?.email}</p>
                  <div className="flex items-center gap-4 mt-2">
                    <Badge variant={profile?.user?.userType === 'admin' ? 'default' : 'secondary'}>
                      {profile?.user?.userType === 'admin' ? 'Administrator' : 
                       profile?.user?.userType === 'employee' ? 'Ansatt' : 'Personlig'}
                    </Badge>
                    {profile?.organization && (
                      <div className="flex items-center gap-2 text-sm">
                        <Building className="h-4 w-4" />
                        <span>{profile.organization.name}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Work status indicator */}
              <div className="text-right">
                {isWithinWorkHours() ? (
                  <div className="flex items-center gap-2 text-green-600">
                    <div className="h-3 w-3 rounded-full bg-green-600 animate-pulse" />
                    <span className="text-sm font-medium">I arbeidstid</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-gray-500">
                    <div className="h-3 w-3 rounded-full bg-gray-400" />
                    <span className="text-sm">Utenfor arbeidstid</span>
                  </div>
                )}
                
                {profile?.privacySettings?.allowTracking ? (
                  <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                    <Eye className="h-4 w-4" />
                    <span>Sporing aktiv</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 mt-2 text-sm text-orange-600">
                    <EyeOff className="h-4 w-4" />
                    <span>Sporing deaktivert</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main content tabs */}
      <Tabs defaultValue="productivity" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="productivity">Produktivitet</TabsTrigger>
          <TabsTrigger value="activity">Aktivitet</TabsTrigger>
          <TabsTrigger value="privacy">Personvern</TabsTrigger>
          <TabsTrigger value="schedule">Arbeidstid</TabsTrigger>
        </TabsList>

        {/* Productivity Tab */}
        <TabsContent value="productivity" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Dagens Produktivitet
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {todayMetrics?.productivityScore || 0}%
                </div>
                <Progress value={todayMetrics?.productivityScore || 0} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Fokustid
                </CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatTime(todayMetrics?.focusTime || 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  av {formatTime(todayMetrics?.totalActiveTime || 0)} total
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Pausetid
                </CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatTime(todayMetrics?.breakTime || 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Anbefalt: 10-15 min per time
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Category breakdown */}
          {todayMetrics?.categorySummary && (
            <Card>
              <CardHeader>
                <CardTitle>Tidsbruk per kategori</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(todayMetrics.categorySummary).map(([category, time]) => (
                    <div key={category} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{getCategoryIcon(category)}</span>
                        <span className="capitalize">{category}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          {formatTime(time as number)}
                        </span>
                        <Progress 
                          value={(time as number / todayMetrics.totalActiveTime) * 100} 
                          className="w-24"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* AI Insights */}
          {todayMetrics?.aiInsights && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  AI Innsikt
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Oppsummering</AlertTitle>
                    <AlertDescription>
                      {todayMetrics.aiInsights.summary}
                    </AlertDescription>
                  </Alert>
                  
                  <div>
                    <h4 className="font-medium mb-2">Forslag til forbedring:</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                      {todayMetrics.aiInsights.suggestions?.map((suggestion: string, i: number) => (
                        <li key={i}>{suggestion}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Dagens aktivitet</CardTitle>
              <CardDescription>
                Oversikt over besøkte nettsider og applikasjoner
              </CardDescription>
            </CardHeader>
            <CardContent>
              {activities && activities.length > 0 ? (
                <div className="space-y-2">
                  {activities.map((activity, i) => (
                    <div key={i} className="flex items-center justify-between p-2 hover:bg-muted rounded">
                      <div className="flex items-center gap-3">
                        <span>{getCategoryIcon(activity.category)}</span>
                        <div>
                          <p className="font-medium">{activity.category}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatTime(activity.timeSpent)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {activity.isWorkRelated && (
                          <Badge variant="outline">Arbeidsrelatert</Badge>
                        )}
                        {activity.isDuringWorkHours && (
                          <Badge variant="secondary">I arbeidstid</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">Ingen aktivitet registrert</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Privacy Tab */}
        <TabsContent value="privacy" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Personverninnstillinger</CardTitle>
              <CardDescription>
                Kontroller hvordan din aktivitet spores og deles
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="tracking">Tillat aktivitetssporing</Label>
                    <p className="text-sm text-muted-foreground">
                      La systemet spore din nettleseraktivitet
                    </p>
                  </div>
                  <Switch
                    id="tracking"
                    checked={profile?.privacySettings?.allowTracking ?? true}
                    onCheckedChange={(checked) => {
                      updatePrivacyMutation.mutate({ allowTracking: checked });
                    }}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="screenshots">Tillat skjermbilder</Label>
                    <p className="text-sm text-muted-foreground">
                      Ta periodiske skjermbilder for dokumentasjon
                    </p>
                  </div>
                  <Switch
                    id="screenshots"
                    checked={profile?.privacySettings?.allowScreenshots ?? false}
                    onCheckedChange={(checked) => {
                      updatePrivacyMutation.mutate({ allowScreenshots: checked });
                    }}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="share-manager">Del med leder</Label>
                    <p className="text-sm text-muted-foreground">
                      La din leder se produktivitetsdata
                    </p>
                  </div>
                  <Switch
                    id="share-manager"
                    checked={profile?.privacySettings?.shareWithManager ?? true}
                    onCheckedChange={(checked) => {
                      updatePrivacyMutation.mutate({ shareWithManager: checked });
                    }}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="notify">Varsle om sporing</Label>
                    <p className="text-sm text-muted-foreground">
                      Få beskjed når sporing starter/stopper
                    </p>
                  </div>
                  <Switch
                    id="notify"
                    checked={profile?.privacySettings?.notifyOnTracking ?? true}
                    onCheckedChange={(checked) => {
                      updatePrivacyMutation.mutate({ notifyOnTracking: checked });
                    }}
                  />
                </div>
              </div>

              {profile?.organization && (
                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertTitle>Organisasjonspolicy</AlertTitle>
                  <AlertDescription>
                    Din organisasjon kan ha egne retningslinjer for datainnsamling.
                    Noen innstillinger kan være påkrevd av din arbeidsgiver.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Tracking notifications */}
          <Card>
            <CardHeader>
              <CardTitle>Sporingsvarsler</CardTitle>
            </CardHeader>
            <CardContent>
              {notifications && notifications.length > 0 ? (
                <div className="space-y-2">
                  {notifications.slice(0, 5).map((notif: any) => (
                    <Alert key={notif.id} variant={notif.acknowledged ? "default" : "destructive"}>
                      <Bell className="h-4 w-4" />
                      <AlertDescription className="flex items-center justify-between">
                        <span>{notif.message}</span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(notif.createdAt), 'HH:mm', { locale: nb })}
                        </span>
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">Ingen varsler</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Schedule Tab */}
        <TabsContent value="schedule" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Arbeidstider</CardTitle>
              <CardDescription>
                Din definerte arbeidstid for sporing og rapportering
              </CardDescription>
            </CardHeader>
            <CardContent>
              {workSchedule && workSchedule.length > 0 ? (
                <div className="space-y-2">
                  {['Mandag', 'Tirsdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lørdag', 'Søndag'].map((day, index) => {
                    const schedule = workSchedule.find((s: any) => s.dayOfWeek === (index + 1) % 7);
                    return (
                      <div key={day} className="flex items-center justify-between p-2 border rounded">
                        <span className="font-medium">{day}</span>
                        {schedule && schedule.isActive ? (
                          <span className="text-sm">
                            {schedule.startTime} - {schedule.endTime}
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">Fri</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Ingen arbeidstider definert</p>
                  <Button className="mt-4" variant="outline">
                    Konfigurer arbeidstider
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}