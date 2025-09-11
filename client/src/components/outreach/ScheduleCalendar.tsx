import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import {
  Calendar,
  Clock,
  ChevronLeft,
  ChevronRight,
  Mail,
  MessageSquare,
  Smartphone,
  Linkedin,
  Users,
  Target,
  Pause,
  Play,
  MoreVertical,
  Info,
  AlertCircle
} from 'lucide-react';

interface ScheduledMessage {
  id: string;
  campaign_id: string;
  campaign_name: string;
  prospect_name: string;
  prospect_company: string;
  channel: 'email' | 'sms' | 'linkedin' | 'whatsapp';
  scheduled_time: Date;
  status: 'pending' | 'sent' | 'failed' | 'cancelled';
  step_number: number;
  total_steps: number;
}

interface CalendarDay {
  date: Date;
  messages: ScheduledMessage[];
  isToday: boolean;
  isCurrentMonth: boolean;
}

export function ScheduleCalendar() {
  const { toast } = useToast();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');
  const [filterCampaign, setFilterCampaign] = useState('all');

  // Fetch scheduled messages
  const { data: scheduledMessages = [], isLoading } = useQuery<ScheduledMessage[]>({
    queryKey: ['/api/outreach/schedule', { month: currentDate.getMonth(), year: currentDate.getFullYear() }],
    queryFn: async () => {
      // Mock data for now
      const messages: ScheduledMessage[] = [];
      const campaigns = ['Q1 2025 - SaaS Outreach', 'Review Winners Norge', 'Product Launch'];
      const prospects = [
        { name: 'Lars Hansen', company: 'TechCorp AS' },
        { name: 'Kari Nordmann', company: 'InnovateTech' },
        { name: 'Ole Olsen', company: 'DataSoft Norge' }
      ];
      const channels: Array<'email' | 'sms' | 'linkedin'> = ['email', 'sms', 'linkedin'];

      // Generate mock scheduled messages
      for (let day = 1; day <= 30; day++) {
        const numMessages = Math.floor(Math.random() * 10) + 1;
        for (let i = 0; i < numMessages; i++) {
          const prospect = prospects[Math.floor(Math.random() * prospects.length)];
          const scheduledTime = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
          scheduledTime.setHours(9 + Math.floor(Math.random() * 8));
          scheduledTime.setMinutes(Math.floor(Math.random() * 60));

          messages.push({
            id: `msg-${day}-${i}`,
            campaign_id: `campaign-${Math.floor(Math.random() * 3)}`,
            campaign_name: campaigns[Math.floor(Math.random() * campaigns.length)],
            prospect_name: prospect.name,
            prospect_company: prospect.company,
            channel: channels[Math.floor(Math.random() * channels.length)],
            scheduled_time: scheduledTime,
            status: 'pending',
            step_number: Math.floor(Math.random() * 5) + 1,
            total_steps: 6
          });
        }
      }

      return messages;
    }
  });

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'email': return Mail;
      case 'sms': return Smartphone;
      case 'linkedin': return Linkedin;
      case 'whatsapp': return MessageSquare;
      default: return MessageSquare;
    }
  };

  const getChannelColor = (channel: string) => {
    switch (channel) {
      case 'email': return 'bg-blue-500';
      case 'sms': return 'bg-green-500';
      case 'linkedin': return 'bg-blue-600';
      case 'whatsapp': return 'bg-green-600';
      default: return 'bg-gray-500';
    }
  };

  // Generate calendar days
  const generateCalendarDays = (): CalendarDay[] => {
    const days: CalendarDay[] = [];
    const today = new Date();
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // First day of the month
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // Start from the Monday of the week containing the first day
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - ((firstDay.getDay() + 6) % 7));
    
    // End on the Sunday after the last day
    const endDate = new Date(lastDay);
    endDate.setDate(endDate.getDate() + ((7 - lastDay.getDay()) % 7));
    
    // Generate all days
    const current = new Date(startDate);
    while (current <= endDate) {
      const dayMessages = scheduledMessages.filter(msg => {
        const msgDate = new Date(msg.scheduled_time);
        return msgDate.getDate() === current.getDate() &&
               msgDate.getMonth() === current.getMonth() &&
               msgDate.getFullYear() === current.getFullYear() &&
               (filterCampaign === 'all' || msg.campaign_id === filterCampaign);
      });

      days.push({
        date: new Date(current),
        messages: dayMessages,
        isToday: current.toDateString() === today.toDateString(),
        isCurrentMonth: current.getMonth() === month
      });
      
      current.setDate(current.getDate() + 1);
    }
    
    return days;
  };

  const calendarDays = generateCalendarDays();

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const monthNames = [
    'Januar', 'Februar', 'Mars', 'April', 'Mai', 'Juni',
    'Juli', 'August', 'September', 'Oktober', 'November', 'Desember'
  ];

  const dayNames = ['Man', 'Tir', 'Ons', 'Tor', 'Fre', 'Lør', 'Søn'];

  // Get messages for selected date
  const selectedDateMessages = selectedDate 
    ? scheduledMessages.filter(msg => {
        const msgDate = new Date(msg.scheduled_time);
        return msgDate.getDate() === selectedDate.getDate() &&
               msgDate.getMonth() === selectedDate.getMonth() &&
               msgDate.getFullYear() === selectedDate.getFullYear() &&
               (filterCampaign === 'all' || msg.campaign_id === filterCampaign);
      }).sort((a, b) => a.scheduled_time.getTime() - b.scheduled_time.getTime())
    : [];

  // Get unique campaigns for filter
  const campaigns = Array.from(new Set(scheduledMessages.map(m => m.campaign_name)));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Sendekalender</h2>
          <p className="text-muted-foreground">Oversikt over planlagte meldinger</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={filterCampaign} onValueChange={setFilterCampaign}>
            <SelectTrigger className="w-48" data-testid="select-filter-campaign">
              <SelectValue placeholder="Filtrer kampanje" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle kampanjer</SelectItem>
              {campaigns.map(campaign => (
                <SelectItem key={campaign} value={campaign}>{campaign}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={viewMode} onValueChange={(value: any) => setViewMode(value)}>
            <SelectTrigger className="w-32" data-testid="select-view-mode">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Måned</SelectItem>
              <SelectItem value="week">Uke</SelectItem>
              <SelectItem value="day">Dag</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Calendar View */}
        <div className="col-span-8">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => navigateMonth('prev')}
                    data-testid="button-prev-month"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setCurrentDate(new Date())}
                  >
                    I dag
                  </Button>
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => navigateMonth('next')}
                    data-testid="button-next-month"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Day headers */}
              <div className="grid grid-cols-7 gap-px bg-muted p-px rounded-lg overflow-hidden">
                {dayNames.map(day => (
                  <div key={day} className="bg-background p-2 text-center text-sm font-medium text-muted-foreground">
                    {day}
                  </div>
                ))}
                
                {/* Calendar days */}
                {calendarDays.map((day, index) => (
                  <div
                    key={index}
                    className={`bg-background p-2 min-h-[100px] cursor-pointer hover:bg-muted/50 transition-colors ${
                      !day.isCurrentMonth ? 'opacity-50' : ''
                    } ${day.isToday ? 'ring-2 ring-primary' : ''} ${
                      selectedDate?.toDateString() === day.date.toDateString() ? 'bg-muted' : ''
                    }`}
                    onClick={() => setSelectedDate(day.date)}
                    data-testid={`calendar-day-${day.date.getDate()}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-sm font-medium ${
                        day.isToday ? 'text-primary' : ''
                      }`}>
                        {day.date.getDate()}
                      </span>
                      {day.messages.length > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {day.messages.length}
                        </Badge>
                      )}
                    </div>
                    
                    {/* Message indicators */}
                    <div className="space-y-1">
                      {day.messages.slice(0, 3).map((msg, msgIndex) => {
                        const ChannelIcon = getChannelIcon(msg.channel);
                        return (
                          <div 
                            key={msgIndex}
                            className="flex items-center gap-1"
                          >
                            <div className={`w-2 h-2 rounded-full ${getChannelColor(msg.channel)}`} />
                            <span className="text-xs truncate">
                              {msg.scheduled_time.toLocaleTimeString('nb-NO', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </span>
                          </div>
                        );
                      })}
                      {day.messages.length > 3 && (
                        <span className="text-xs text-muted-foreground">
                          +{day.messages.length - 3} mer
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Day Details */}
        <div className="col-span-4">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                {selectedDate 
                  ? selectedDate.toLocaleDateString('nb-NO', { 
                      weekday: 'long', 
                      day: 'numeric', 
                      month: 'long' 
                    })
                  : 'Velg en dag'}
              </CardTitle>
              <CardDescription>
                {selectedDateMessages.length} planlagte meldinger
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[calc(100vh-400px)]">
                <div className="space-y-3">
                  {selectedDateMessages.length > 0 ? (
                    selectedDateMessages.map((msg) => {
                      const ChannelIcon = getChannelIcon(msg.channel);
                      return (
                        <Card key={msg.id} className="overflow-hidden">
                          <CardContent className="p-3">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <div className={`p-1.5 rounded ${getChannelColor(msg.channel)}`}>
                                  <ChannelIcon className="h-3 w-3 text-white" />
                                </div>
                                <div>
                                  <p className="text-sm font-medium">
                                    {msg.scheduled_time.toLocaleTimeString('nb-NO', { 
                                      hour: '2-digit', 
                                      minute: '2-digit' 
                                    })}
                                  </p>
                                  <p className="text-xs text-muted-foreground capitalize">
                                    {msg.channel}
                                  </p>
                                </div>
                              </div>
                              <Badge variant="outline" className="text-xs">
                                Steg {msg.step_number}/{msg.total_steps}
                              </Badge>
                            </div>
                            
                            <div className="space-y-1">
                              <p className="text-sm font-medium">{msg.prospect_name}</p>
                              <p className="text-xs text-muted-foreground">{msg.prospect_company}</p>
                              <Badge variant="secondary" className="text-xs">
                                {msg.campaign_name}
                              </Badge>
                            </div>

                            <div className="flex items-center justify-end gap-1 mt-3">
                              <Button variant="ghost" size="sm">
                                <Pause className="h-3 w-3" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-3 w-3" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })
                  ) : (
                    <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                      <Calendar className="h-12 w-12 mb-3" />
                      <p className="text-sm">Ingen planlagte meldinger</p>
                      {selectedDate && (
                        <p className="text-xs mt-1">
                          for {selectedDate.toLocaleDateString('nb-NO')}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Planlagt denne uken</p>
                <p className="text-2xl font-bold">
                  {scheduledMessages.filter(m => {
                    const msgDate = new Date(m.scheduled_time);
                    const weekStart = new Date();
                    weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
                    const weekEnd = new Date(weekStart);
                    weekEnd.setDate(weekEnd.getDate() + 6);
                    return msgDate >= weekStart && msgDate <= weekEnd;
                  }).length}
                </p>
              </div>
              <Calendar className="h-5 w-5 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">E-post</p>
                <p className="text-2xl font-bold">
                  {scheduledMessages.filter(m => m.channel === 'email').length}
                </p>
              </div>
              <Mail className="h-5 w-5 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">SMS</p>
                <p className="text-2xl font-bold">
                  {scheduledMessages.filter(m => m.channel === 'sms').length}
                </p>
              </div>
              <Smartphone className="h-5 w-5 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">LinkedIn</p>
                <p className="text-2xl font-bold">
                  {scheduledMessages.filter(m => m.channel === 'linkedin').length}
                </p>
              </div>
              <Linkedin className="h-5 w-5 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}