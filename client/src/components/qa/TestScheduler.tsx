import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Calendar, 
  Clock, 
  Play, 
  Pause, 
  Trash2,
  Bell,
  Mail,
  MessageSquare,
  Plus
} from "lucide-react";

interface ScheduledTest {
  id: string;
  name: string;
  urls: string[];
  schedule: {
    type: 'once' | 'daily' | 'weekly' | 'monthly';
    time: string;
    days?: string[];
    date?: string;
  };
  tests: {
    lighthouse: boolean;
    visual: boolean;
    accessibility: boolean;
    performance: boolean;
  };
  notifications: {
    email?: string[];
    slack?: boolean;
    webhook?: string;
  };
  status: 'active' | 'paused' | 'completed';
  lastRun?: Date;
  nextRun?: Date;
}

export default function TestScheduler() {
  const [schedules, setSchedules] = useState<ScheduledTest[]>([
    {
      id: '1',
      name: 'Daglig Ytelsestest',
      urls: ['https://example.com', 'https://example.com/products'],
      schedule: {
        type: 'daily',
        time: '09:00'
      },
      tests: {
        lighthouse: true,
        visual: false,
        accessibility: true,
        performance: true
      },
      notifications: {
        email: ['team@example.com'],
        slack: true
      },
      status: 'active',
      lastRun: new Date(Date.now() - 86400000),
      nextRun: new Date(Date.now() + 86400000)
    }
  ]);

  const [showNewSchedule, setShowNewSchedule] = useState(false);
  const [newSchedule, setNewSchedule] = useState<Partial<ScheduledTest>>({
    name: '',
    urls: [],
    schedule: {
      type: 'daily',
      time: '09:00'
    },
    tests: {
      lighthouse: true,
      visual: false,
      accessibility: false,
      performance: false
    },
    notifications: {
      email: [],
      slack: false
    }
  });

  const handleCreateSchedule = () => {
    const schedule: ScheduledTest = {
      id: Date.now().toString(),
      name: newSchedule.name || 'Ny Planlagt Test',
      urls: newSchedule.urls || [],
      schedule: newSchedule.schedule || { type: 'daily', time: '09:00' },
      tests: newSchedule.tests || {
        lighthouse: true,
        visual: false,
        accessibility: false,
        performance: false
      },
      notifications: newSchedule.notifications || {},
      status: 'active',
      nextRun: new Date(Date.now() + 86400000)
    };
    
    setSchedules([...schedules, schedule]);
    setShowNewSchedule(false);
    setNewSchedule({
      name: '',
      urls: [],
      schedule: { type: 'daily', time: '09:00' },
      tests: {
        lighthouse: true,
        visual: false,
        accessibility: false,
        performance: false
      },
      notifications: { email: [], slack: false }
    });
  };

  const toggleScheduleStatus = (id: string) => {
    setSchedules(schedules.map(s => 
      s.id === id 
        ? { ...s, status: s.status === 'active' ? 'paused' : 'active' }
        : s
    ));
  };

  const deleteSchedule = (id: string) => {
    setSchedules(schedules.filter(s => s.id !== id));
  };

  return (
    <div className="grid grid-cols-3 gap-4 h-full">
      {/* Scheduled Tests List */}
      <Card className="col-span-2">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Planlagte Tester</CardTitle>
              <CardDescription>Automatiserte test-kjøringer</CardDescription>
            </div>
            <Button onClick={() => setShowNewSchedule(true)} data-testid="button-new-schedule">
              <Plus className="w-4 h-4 mr-2" />
              Ny Planlegging
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px]">
            <div className="space-y-4">
              {schedules.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  Ingen planlagte tester. Opprett en ny planlegging for å starte.
                </div>
              ) : (
                schedules.map(schedule => (
                  <Card key={schedule.id} data-testid={`schedule-${schedule.id}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold">{schedule.name}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant={schedule.status === 'active' ? 'default' : 'secondary'}>
                              {schedule.status === 'active' ? 'Aktiv' : 'Pauset'}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              {schedule.schedule.type === 'daily' && 'Daglig'}
                              {schedule.schedule.type === 'weekly' && 'Ukentlig'}
                              {schedule.schedule.type === 'monthly' && 'Månedlig'}
                              {' kl. ' + schedule.schedule.time}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleScheduleStatus(schedule.id)}
                            data-testid={`button-toggle-${schedule.id}`}
                          >
                            {schedule.status === 'active' ? (
                              <Pause className="w-4 h-4" />
                            ) : (
                              <Play className="w-4 h-4" />
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteSchedule(schedule.id)}
                            data-testid={`button-delete-${schedule.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="text-sm">
                          <span className="text-muted-foreground">URLs:</span>
                          <div className="mt-1">
                            {schedule.urls.map((url, index) => (
                              <div key={index} className="text-xs truncate">• {url}</div>
                            ))}
                          </div>
                        </div>

                        <div className="flex gap-2">
                          {schedule.tests.lighthouse && (
                            <Badge variant="outline" className="text-xs">Lighthouse</Badge>
                          )}
                          {schedule.tests.visual && (
                            <Badge variant="outline" className="text-xs">Visuell</Badge>
                          )}
                          {schedule.tests.accessibility && (
                            <Badge variant="outline" className="text-xs">Tilgjengelighet</Badge>
                          )}
                          {schedule.tests.performance && (
                            <Badge variant="outline" className="text-xs">Ytelse</Badge>
                          )}
                        </div>

                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          {schedule.lastRun && (
                            <span>Sist kjørt: {schedule.lastRun.toLocaleString('no-NO')}</span>
                          )}
                          {schedule.nextRun && (
                            <span>Neste: {schedule.nextRun.toLocaleString('no-NO')}</span>
                          )}
                        </div>

                        <div className="flex gap-2 mt-2">
                          {schedule.notifications.email && schedule.notifications.email.length > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              <Mail className="w-3 h-3 mr-1" />
                              E-post
                            </Badge>
                          )}
                          {schedule.notifications.slack && (
                            <Badge variant="secondary" className="text-xs">
                              <MessageSquare className="w-3 h-3 mr-1" />
                              Slack
                            </Badge>
                          )}
                          {schedule.notifications.webhook && (
                            <Badge variant="secondary" className="text-xs">
                              <Bell className="w-3 h-3 mr-1" />
                              Webhook
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* New Schedule Form */}
      {showNewSchedule && (
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Ny Planlagt Test</CardTitle>
            <CardDescription>Konfigurer automatisk test-kjøring</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Navn</Label>
                <Input
                  id="name"
                  value={newSchedule.name}
                  onChange={(e) => setNewSchedule({ ...newSchedule, name: e.target.value })}
                  placeholder="F.eks. Daglig Ytelsestest"
                  data-testid="input-schedule-name"
                />
              </div>

              <div>
                <Label htmlFor="urls">URLs (en per linje)</Label>
                <textarea
                  id="urls"
                  className="w-full h-20 p-2 border rounded-md text-sm"
                  placeholder="https://example.com&#10;https://example.com/products"
                  onChange={(e) => setNewSchedule({ 
                    ...newSchedule, 
                    urls: e.target.value.split('\n').filter(url => url.trim())
                  })}
                  data-testid="textarea-urls"
                />
              </div>

              <div>
                <Label>Frekvens</Label>
                <Select
                  value={newSchedule.schedule?.type}
                  onValueChange={(value: any) => setNewSchedule({
                    ...newSchedule,
                    schedule: { ...newSchedule.schedule!, type: value }
                  })}
                >
                  <SelectTrigger data-testid="select-frequency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="once">En gang</SelectItem>
                    <SelectItem value="daily">Daglig</SelectItem>
                    <SelectItem value="weekly">Ukentlig</SelectItem>
                    <SelectItem value="monthly">Månedlig</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="time">Tidspunkt</Label>
                <Input
                  id="time"
                  type="time"
                  value={newSchedule.schedule?.time}
                  onChange={(e) => setNewSchedule({
                    ...newSchedule,
                    schedule: { ...newSchedule.schedule!, time: e.target.value }
                  })}
                  data-testid="input-time"
                />
              </div>

              <div>
                <Label>Tester å kjøre</Label>
                <div className="space-y-2 mt-2">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="lighthouse"
                      checked={newSchedule.tests?.lighthouse}
                      onCheckedChange={(checked) => setNewSchedule({
                        ...newSchedule,
                        tests: { ...newSchedule.tests!, lighthouse: !!checked }
                      })}
                      data-testid="checkbox-lighthouse"
                    />
                    <Label htmlFor="lighthouse" className="text-sm">Lighthouse</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="visual"
                      checked={newSchedule.tests?.visual}
                      onCheckedChange={(checked) => setNewSchedule({
                        ...newSchedule,
                        tests: { ...newSchedule.tests!, visual: !!checked }
                      })}
                      data-testid="checkbox-visual"
                    />
                    <Label htmlFor="visual" className="text-sm">Visuell Regresjon</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="accessibility"
                      checked={newSchedule.tests?.accessibility}
                      onCheckedChange={(checked) => setNewSchedule({
                        ...newSchedule,
                        tests: { ...newSchedule.tests!, accessibility: !!checked }
                      })}
                      data-testid="checkbox-accessibility"
                    />
                    <Label htmlFor="accessibility" className="text-sm">Tilgjengelighet</Label>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button 
                  className="flex-1"
                  onClick={handleCreateSchedule}
                  data-testid="button-create-schedule"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Opprett
                </Button>
                <Button 
                  className="flex-1"
                  variant="outline"
                  onClick={() => setShowNewSchedule(false)}
                  data-testid="button-cancel"
                >
                  Avbryt
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Schedule Calendar */}
      {!showNewSchedule && (
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Kommende Kjøringer</CardTitle>
            <CardDescription>Neste planlagte tester</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {schedules
                .filter(s => s.status === 'active' && s.nextRun)
                .sort((a, b) => (a.nextRun?.getTime() || 0) - (b.nextRun?.getTime() || 0))
                .slice(0, 5)
                .map(schedule => (
                  <div 
                    key={schedule.id}
                    className="flex items-center gap-3 p-3 border rounded-lg"
                    data-testid={`upcoming-${schedule.id}`}
                  >
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <div className="flex-1">
                      <div className="text-sm font-medium">{schedule.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {schedule.nextRun?.toLocaleString('no-NO')}
                      </div>
                    </div>
                  </div>
                ))}
              
              {schedules.filter(s => s.status === 'active').length === 0 && (
                <div className="text-center text-muted-foreground py-4">
                  Ingen aktive planlagte tester
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}