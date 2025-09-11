import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import {
  Mail,
  Smartphone,
  Linkedin,
  MessageCircle,
  Slack,
  Send,
  Settings,
  Key,
  Shield,
  CheckCircle,
  XCircle,
  AlertCircle,
  TestTube,
  RefreshCw,
  Save,
  Zap,
  Clock,
  Globe,
  Link,
  Info,
  AlertTriangle,
  Activity
} from 'lucide-react';

interface ChannelConfiguration {
  channel: string;
  provider: string;
  status: 'active' | 'paused' | 'error' | 'not_configured';
  credentials: Record<string, string>;
  settings: {
    rate_limit?: number;
    daily_limit?: number;
    warmup_enabled?: boolean;
    warmup_daily_increase?: number;
    bounce_webhook?: string;
    reply_webhook?: string;
    test_mode?: boolean;
  };
  last_tested?: Date;
  error_log?: string[];
}

export function ChannelConfig() {
  const { toast } = useToast();
  const [selectedChannel, setSelectedChannel] = useState('email');
  const [testInProgress, setTestInProgress] = useState(false);

  // Channel configurations
  const [emailConfig, setEmailConfig] = useState<ChannelConfiguration>({
    channel: 'email',
    provider: 'sendgrid',
    status: 'not_configured',
    credentials: {
      api_key: '',
      from_email: '',
      from_name: ''
    },
    settings: {
      rate_limit: 100,
      daily_limit: 500,
      warmup_enabled: true,
      warmup_daily_increase: 10,
      bounce_webhook: '',
      reply_webhook: ''
    }
  });

  const [smsConfig, setSmsConfig] = useState<ChannelConfiguration>({
    channel: 'sms',
    provider: 'twilio',
    status: 'not_configured',
    credentials: {
      account_sid: '',
      auth_token: '',
      from_number: ''
    },
    settings: {
      rate_limit: 50,
      daily_limit: 200
    }
  });

  const [linkedinConfig, setLinkedinConfig] = useState<ChannelConfiguration>({
    channel: 'linkedin',
    provider: 'custom',
    status: 'not_configured',
    credentials: {
      email: '',
      password: '',
      session_cookie: ''
    },
    settings: {
      rate_limit: 20,
      daily_limit: 100,
      test_mode: false
    }
  });

  const [whatsappConfig, setWhatsappConfig] = useState<ChannelConfiguration>({
    channel: 'whatsapp',
    provider: 'whatsapp_business',
    status: 'not_configured',
    credentials: {
      access_token: '',
      phone_number_id: '',
      business_account_id: ''
    },
    settings: {
      rate_limit: 30,
      daily_limit: 1000
    }
  });

  const [slackConfig, setSlackConfig] = useState<ChannelConfiguration>({
    channel: 'slack',
    provider: 'slack_api',
    status: 'not_configured',
    credentials: {
      bot_token: '',
      app_token: '',
      webhook_url: ''
    },
    settings: {
      rate_limit: 60,
      daily_limit: 500
    }
  });

  // Fetch channel configurations
  const { data: channelConfigs, isLoading } = useQuery({
    queryKey: ['/api/outreach/channels'],
    queryFn: async () => {
      // Would fetch actual configs from backend
      return {
        email: emailConfig,
        sms: smsConfig,
        linkedin: linkedinConfig,
        whatsapp: whatsappConfig,
        slack: slackConfig
      };
    }
  });

  // Save configuration mutation
  const saveConfig = useMutation({
    mutationFn: async (config: ChannelConfiguration) => {
      return await apiRequest(`/api/outreach/channels/${config.channel}`, 'POST', config);
    },
    onSuccess: (data, variables) => {
      toast({
        title: "Konfigurasjon lagret",
        description: `${variables.channel} kanalen er oppdatert`
      });
      queryClient.invalidateQueries({ queryKey: ['/api/outreach/channels'] });
    }
  });

  // Test configuration mutation
  const testConfig = useMutation({
    mutationFn: async (channel: string) => {
      setTestInProgress(true);
      return await apiRequest(`/api/outreach/channels/${channel}/test`, 'POST');
    },
    onSuccess: (data) => {
      setTestInProgress(false);
      if (data.success) {
        toast({
          title: "Test vellykket",
          description: "Kanalen fungerer som forventet"
        });
      } else {
        toast({
          title: "Test feilet",
          description: data.error || "Kunne ikke verifisere kanalen",
          variant: "destructive"
        });
      }
    },
    onError: () => {
      setTestInProgress(false);
      toast({
        title: "Test feilet",
        description: "En feil oppstod under testing",
        variant: "destructive"
      });
    }
  });

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'email': return Mail;
      case 'sms': return Smartphone;
      case 'linkedin': return Linkedin;
      case 'whatsapp': return MessageCircle;
      case 'slack': return Slack;
      default: return Settings;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600';
      case 'paused': return 'text-yellow-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const channels = [
    { id: 'email', name: 'E-post', icon: Mail, provider: 'SendGrid', config: emailConfig, setConfig: setEmailConfig },
    { id: 'sms', name: 'SMS', icon: Smartphone, provider: 'Twilio', config: smsConfig, setConfig: setSmsConfig },
    { id: 'linkedin', name: 'LinkedIn', icon: Linkedin, provider: 'Custom', config: linkedinConfig, setConfig: setLinkedinConfig },
    { id: 'whatsapp', name: 'WhatsApp', icon: MessageCircle, provider: 'Business API', config: whatsappConfig, setConfig: setWhatsappConfig },
    { id: 'slack', name: 'Slack', icon: Slack, provider: 'Slack API', config: slackConfig, setConfig: setSlackConfig }
  ];

  const currentChannel = channels.find(c => c.id === selectedChannel);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Kanalinnstillinger</h2>
        <p className="text-muted-foreground">Konfigurer og test outreach-kanaler</p>
      </div>

      {/* Channel Overview */}
      <div className="grid grid-cols-5 gap-4">
        {channels.map((channel) => (
          <Card 
            key={channel.id}
            className={`cursor-pointer transition-all ${
              selectedChannel === channel.id ? 'ring-2 ring-primary' : ''
            }`}
            onClick={() => setSelectedChannel(channel.id)}
            data-testid={`card-channel-${channel.id}`}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <channel.icon className="h-6 w-6 text-muted-foreground" />
                {channel.config.status === 'active' ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : channel.config.status === 'error' ? (
                  <XCircle className="h-4 w-4 text-red-600" />
                ) : channel.config.status === 'paused' ? (
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-gray-400" />
                )}
              </div>
              <h3 className="font-semibold">{channel.name}</h3>
              <p className="text-xs text-muted-foreground">{channel.provider}</p>
              <Badge 
                variant={channel.config.status === 'active' ? 'default' : 'secondary'}
                className={`mt-2 ${getStatusColor(channel.config.status)}`}
              >
                {channel.config.status === 'active' ? 'Aktiv' :
                 channel.config.status === 'paused' ? 'Pauset' :
                 channel.config.status === 'error' ? 'Feil' :
                 'Ikke konfigurert'}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Channel Configuration */}
      {currentChannel && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <currentChannel.icon className="h-6 w-6 text-muted-foreground" />
                <div>
                  <CardTitle>{currentChannel.name} konfigurasjon</CardTitle>
                  <CardDescription>Provider: {currentChannel.provider}</CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => testConfig.mutate(currentChannel.id)}
                  disabled={testInProgress}
                >
                  {testInProgress ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <TestTube className="h-4 w-4 mr-2" />
                  )}
                  Test forbindelse
                </Button>
                <Button 
                  size="sm"
                  onClick={() => saveConfig.mutate(currentChannel.config)}
                  data-testid={`button-save-${currentChannel.id}`}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Lagre endringer
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="credentials">
              <TabsList>
                <TabsTrigger value="credentials">Autentisering</TabsTrigger>
                <TabsTrigger value="settings">Innstillinger</TabsTrigger>
                <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
                <TabsTrigger value="limits">Grenser</TabsTrigger>
                <TabsTrigger value="logs">Logger</TabsTrigger>
              </TabsList>

              {/* Credentials Tab */}
              <TabsContent value="credentials" className="space-y-4">
                {selectedChannel === 'email' && (
                  <>
                    <div>
                      <Label htmlFor="sendgrid-api-key">SendGrid API Key</Label>
                      <Input
                        id="sendgrid-api-key"
                        type="password"
                        value={emailConfig.credentials.api_key}
                        onChange={(e) => setEmailConfig({
                          ...emailConfig,
                          credentials: { ...emailConfig.credentials, api_key: e.target.value }
                        })}
                        placeholder="SG.xxxxxxxxxxxxxxxxxxxx"
                        data-testid="input-sendgrid-api-key"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="from-email">Fra e-post</Label>
                        <Input
                          id="from-email"
                          type="email"
                          value={emailConfig.credentials.from_email}
                          onChange={(e) => setEmailConfig({
                            ...emailConfig,
                            credentials: { ...emailConfig.credentials, from_email: e.target.value }
                          })}
                          placeholder="salg@firma.no"
                          data-testid="input-from-email"
                        />
                      </div>
                      <div>
                        <Label htmlFor="from-name">Fra navn</Label>
                        <Input
                          id="from-name"
                          value={emailConfig.credentials.from_name}
                          onChange={(e) => setEmailConfig({
                            ...emailConfig,
                            credentials: { ...emailConfig.credentials, from_name: e.target.value }
                          })}
                          placeholder="Firma AS"
                          data-testid="input-from-name"
                        />
                      </div>
                    </div>
                  </>
                )}

                {selectedChannel === 'sms' && (
                  <>
                    <div>
                      <Label htmlFor="twilio-account-sid">Twilio Account SID</Label>
                      <Input
                        id="twilio-account-sid"
                        value={smsConfig.credentials.account_sid}
                        onChange={(e) => setSmsConfig({
                          ...smsConfig,
                          credentials: { ...smsConfig.credentials, account_sid: e.target.value }
                        })}
                        placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxx"
                        data-testid="input-twilio-account-sid"
                      />
                    </div>
                    <div>
                      <Label htmlFor="twilio-auth-token">Auth Token</Label>
                      <Input
                        id="twilio-auth-token"
                        type="password"
                        value={smsConfig.credentials.auth_token}
                        onChange={(e) => setSmsConfig({
                          ...smsConfig,
                          credentials: { ...smsConfig.credentials, auth_token: e.target.value }
                        })}
                        placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxx"
                        data-testid="input-twilio-auth-token"
                      />
                    </div>
                    <div>
                      <Label htmlFor="from-number">Fra telefonnummer</Label>
                      <Input
                        id="from-number"
                        value={smsConfig.credentials.from_number}
                        onChange={(e) => setSmsConfig({
                          ...smsConfig,
                          credentials: { ...smsConfig.credentials, from_number: e.target.value }
                        })}
                        placeholder="+47 123 45 678"
                        data-testid="input-from-number"
                      />
                    </div>
                  </>
                )}

                {selectedChannel === 'linkedin' && (
                  <>
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Viktig</AlertTitle>
                      <AlertDescription>
                        LinkedIn-automatisering må brukes forsiktig for å unngå kontosuspensjon.
                        Følg alltid LinkedIns brukervilkår.
                      </AlertDescription>
                    </Alert>
                    <div>
                      <Label htmlFor="linkedin-email">LinkedIn e-post</Label>
                      <Input
                        id="linkedin-email"
                        type="email"
                        value={linkedinConfig.credentials.email}
                        onChange={(e) => setLinkedinConfig({
                          ...linkedinConfig,
                          credentials: { ...linkedinConfig.credentials, email: e.target.value }
                        })}
                        placeholder="din@email.com"
                        data-testid="input-linkedin-email"
                      />
                    </div>
                    <div>
                      <Label htmlFor="linkedin-password">Passord</Label>
                      <Input
                        id="linkedin-password"
                        type="password"
                        value={linkedinConfig.credentials.password}
                        onChange={(e) => setLinkedinConfig({
                          ...linkedinConfig,
                          credentials: { ...linkedinConfig.credentials, password: e.target.value }
                        })}
                        data-testid="input-linkedin-password"
                      />
                    </div>
                    <div>
                      <Label htmlFor="session-cookie">Session Cookie (valgfritt)</Label>
                      <Input
                        id="session-cookie"
                        value={linkedinConfig.credentials.session_cookie}
                        onChange={(e) => setLinkedinConfig({
                          ...linkedinConfig,
                          credentials: { ...linkedinConfig.credentials, session_cookie: e.target.value }
                        })}
                        placeholder="li_at=..."
                        data-testid="input-session-cookie"
                      />
                    </div>
                  </>
                )}

                {selectedChannel === 'whatsapp' && (
                  <>
                    <div>
                      <Label htmlFor="whatsapp-token">WhatsApp Business API Token</Label>
                      <Input
                        id="whatsapp-token"
                        type="password"
                        value={whatsappConfig.credentials.access_token}
                        onChange={(e) => setWhatsappConfig({
                          ...whatsappConfig,
                          credentials: { ...whatsappConfig.credentials, access_token: e.target.value }
                        })}
                        placeholder="EAAxxxxxxxxxxxxxxxxxx"
                        data-testid="input-whatsapp-token"
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone-number-id">Phone Number ID</Label>
                      <Input
                        id="phone-number-id"
                        value={whatsappConfig.credentials.phone_number_id}
                        onChange={(e) => setWhatsappConfig({
                          ...whatsappConfig,
                          credentials: { ...whatsappConfig.credentials, phone_number_id: e.target.value }
                        })}
                        placeholder="1234567890"
                        data-testid="input-phone-number-id"
                      />
                    </div>
                    <div>
                      <Label htmlFor="business-account-id">Business Account ID</Label>
                      <Input
                        id="business-account-id"
                        value={whatsappConfig.credentials.business_account_id}
                        onChange={(e) => setWhatsappConfig({
                          ...whatsappConfig,
                          credentials: { ...whatsappConfig.credentials, business_account_id: e.target.value }
                        })}
                        placeholder="9876543210"
                        data-testid="input-business-account-id"
                      />
                    </div>
                  </>
                )}

                {selectedChannel === 'slack' && (
                  <>
                    <div>
                      <Label htmlFor="slack-bot-token">Bot User OAuth Token</Label>
                      <Input
                        id="slack-bot-token"
                        type="password"
                        value={slackConfig.credentials.bot_token}
                        onChange={(e) => setSlackConfig({
                          ...slackConfig,
                          credentials: { ...slackConfig.credentials, bot_token: e.target.value }
                        })}
                        placeholder="xoxb-xxxxxxxxxxxx"
                        data-testid="input-slack-bot-token"
                      />
                    </div>
                    <div>
                      <Label htmlFor="slack-app-token">App-Level Token</Label>
                      <Input
                        id="slack-app-token"
                        type="password"
                        value={slackConfig.credentials.app_token}
                        onChange={(e) => setSlackConfig({
                          ...slackConfig,
                          credentials: { ...slackConfig.credentials, app_token: e.target.value }
                        })}
                        placeholder="xapp-xxxxxxxxxxxx"
                        data-testid="input-slack-app-token"
                      />
                    </div>
                    <div>
                      <Label htmlFor="webhook-url">Webhook URL (valgfritt)</Label>
                      <Input
                        id="webhook-url"
                        value={slackConfig.credentials.webhook_url}
                        onChange={(e) => setSlackConfig({
                          ...slackConfig,
                          credentials: { ...slackConfig.credentials, webhook_url: e.target.value }
                        })}
                        placeholder="https://hooks.slack.com/services/..."
                        data-testid="input-webhook-url"
                      />
                    </div>
                  </>
                )}
              </TabsContent>

              {/* Settings Tab */}
              <TabsContent value="settings" className="space-y-4">
                {selectedChannel === 'email' && (
                  <>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>E-post warmup</Label>
                        <p className="text-xs text-muted-foreground">
                          Gradvis økning av sendevolum for nye domener
                        </p>
                      </div>
                      <Switch
                        checked={emailConfig.settings.warmup_enabled}
                        onCheckedChange={(checked) => setEmailConfig({
                          ...emailConfig,
                          settings: { ...emailConfig.settings, warmup_enabled: checked }
                        })}
                        data-testid="switch-warmup"
                      />
                    </div>
                    {emailConfig.settings.warmup_enabled && (
                      <div>
                        <Label>Daglig økning</Label>
                        <div className="flex items-center gap-4">
                          <Slider
                            value={[emailConfig.settings.warmup_daily_increase || 10]}
                            onValueChange={(value) => setEmailConfig({
                              ...emailConfig,
                              settings: { ...emailConfig.settings, warmup_daily_increase: value[0] }
                            })}
                            max={50}
                            step={5}
                            className="flex-1"
                          />
                          <span className="w-12 text-sm font-medium">
                            {emailConfig.settings.warmup_daily_increase} / dag
                          </span>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {selectedChannel === 'linkedin' && (
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Test modus</Label>
                      <p className="text-xs text-muted-foreground">
                        Simuler sending uten å faktisk sende meldinger
                      </p>
                    </div>
                    <Switch
                      checked={linkedinConfig.settings.test_mode}
                      onCheckedChange={(checked) => setLinkedinConfig({
                        ...linkedinConfig,
                        settings: { ...linkedinConfig.settings, test_mode: checked }
                      })}
                      data-testid="switch-test-mode"
                    />
                  </div>
                )}
              </TabsContent>

              {/* Webhooks Tab */}
              <TabsContent value="webhooks" className="space-y-4">
                {selectedChannel === 'email' && (
                  <>
                    <div>
                      <Label htmlFor="bounce-webhook">Bounce webhook URL</Label>
                      <Input
                        id="bounce-webhook"
                        value={emailConfig.settings.bounce_webhook}
                        onChange={(e) => setEmailConfig({
                          ...emailConfig,
                          settings: { ...emailConfig.settings, bounce_webhook: e.target.value }
                        })}
                        placeholder="https://din-app.no/webhooks/bounce"
                        data-testid="input-bounce-webhook"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Motta varsler om e-poster som bouncer
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="reply-webhook">Reply webhook URL</Label>
                      <Input
                        id="reply-webhook"
                        value={emailConfig.settings.reply_webhook}
                        onChange={(e) => setEmailConfig({
                          ...emailConfig,
                          settings: { ...emailConfig.settings, reply_webhook: e.target.value }
                        })}
                        placeholder="https://din-app.no/webhooks/reply"
                        data-testid="input-reply-webhook"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Motta varsler når noen svarer på e-poster
                      </p>
                    </div>
                  </>
                )}
              </TabsContent>

              {/* Limits Tab */}
              <TabsContent value="limits" className="space-y-4">
                <div>
                  <Label>Sendehastighet (per time)</Label>
                  <div className="flex items-center gap-4">
                    <Slider
                      value={[currentChannel.config.settings.rate_limit || 100]}
                      onValueChange={(value) => currentChannel.setConfig({
                        ...currentChannel.config,
                        settings: { ...currentChannel.config.settings, rate_limit: value[0] }
                      })}
                      max={500}
                      step={10}
                      className="flex-1"
                    />
                    <span className="w-20 text-sm font-medium">
                      {currentChannel.config.settings.rate_limit} / time
                    </span>
                  </div>
                </div>
                <div>
                  <Label>Daglig grense</Label>
                  <div className="flex items-center gap-4">
                    <Slider
                      value={[currentChannel.config.settings.daily_limit || 500]}
                      onValueChange={(value) => currentChannel.setConfig({
                        ...currentChannel.config,
                        settings: { ...currentChannel.config.settings, daily_limit: value[0] }
                      })}
                      max={5000}
                      step={50}
                      className="flex-1"
                    />
                    <span className="w-20 text-sm font-medium">
                      {currentChannel.config.settings.daily_limit} / dag
                    </span>
                  </div>
                </div>
              </TabsContent>

              {/* Logs Tab */}
              <TabsContent value="logs" className="space-y-4">
                {currentChannel.config.last_tested && (
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Sist testet</span>
                    </div>
                    <span className="text-sm font-medium">
                      {new Date(currentChannel.config.last_tested).toLocaleString('nb-NO')}
                    </span>
                  </div>
                )}
                {currentChannel.config.error_log && currentChannel.config.error_log.length > 0 && (
                  <div className="space-y-2">
                    <Label>Feillogg</Label>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {currentChannel.config.error_log.map((error, index) => (
                        <Alert key={index} variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>{error}</AlertDescription>
                        </Alert>
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}