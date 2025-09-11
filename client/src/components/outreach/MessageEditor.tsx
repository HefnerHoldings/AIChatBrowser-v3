import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import {
  MessageSquare,
  Mail,
  Smartphone,
  Linkedin,
  MessageCircle,
  Plus,
  Save,
  Sparkles,
  Brain,
  Wand2,
  Eye,
  Send,
  Copy,
  Trash2,
  Edit,
  FileText,
  Tag,
  User,
  Building,
  Calendar,
  Link,
  AlertCircle,
  CheckCircle,
  Info,
  ChevronRight,
  Hash,
  AtSign,
  Globe,
  Phone,
  Briefcase,
  MapPin,
  Clock
} from 'lucide-react';

interface MessageTemplate {
  template_id?: string;
  name: string;
  channel: 'email' | 'sms' | 'linkedin' | 'whatsapp';
  subject?: string;
  body_text: string;
  body_html?: string;
  personalization_tokens: string[];
  voice_profile: {
    tone: 'formal' | 'casual' | 'friendly' | 'professional';
    formality: 'high' | 'medium' | 'low';
    style: 'direct' | 'consultative' | 'enthusiastic';
  };
  hook_types?: string[];
  language: string;
  tags: string[];
  performance?: {
    sends: number;
    opens: number;
    clicks: number;
    replies: number;
  };
}

export function MessageEditor() {
  const { toast } = useToast();
  const [selectedTemplate, setSelectedTemplate] = useState<MessageTemplate | null>(null);
  const [showNewTemplate, setShowNewTemplate] = useState(false);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterChannel, setFilterChannel] = useState('all');
  const [aiPrompt, setAiPrompt] = useState('');

  const [newTemplate, setNewTemplate] = useState<MessageTemplate>({
    name: '',
    channel: 'email',
    subject: '',
    body_text: '',
    personalization_tokens: [],
    voice_profile: {
      tone: 'professional',
      formality: 'medium',
      style: 'consultative'
    },
    language: 'no',
    tags: []
  });

  // Available merge tags
  const mergeTags = [
    { tag: '{{first_name}}', label: 'Fornavn', icon: User },
    { tag: '{{last_name}}', label: 'Etternavn', icon: User },
    { tag: '{{company}}', label: 'Firma', icon: Building },
    { tag: '{{domain}}', label: 'Domene', icon: Globe },
    { tag: '{{email}}', label: 'E-post', icon: AtSign },
    { tag: '{{phone}}', label: 'Telefon', icon: Phone },
    { tag: '{{position}}', label: 'Stilling', icon: Briefcase },
    { tag: '{{location}}', label: 'Lokasjon', icon: MapPin },
    { tag: '{{hook_headline}}', label: 'Hook overskrift', icon: Brain },
    { tag: '{{hook_quote}}', label: 'Hook sitat', icon: MessageSquare },
    { tag: '{{current_date}}', label: 'Dagens dato', icon: Calendar },
    { tag: '{{current_time}}', label: 'Klokkeslett', icon: Clock }
  ];

  // Fetch templates
  const { data: templates = [], isLoading } = useQuery<MessageTemplate[]>({
    queryKey: ['/api/outreach/templates'],
    queryFn: async () => {
      // Mock data for now
      return [
        {
          template_id: '1',
          name: 'Review Winner Outreach',
          channel: 'email' as const,
          subject: 'Gratulerer med {{hook_headline}}, {{first_name}}! 🎉',
          body_text: `Hei {{first_name}},

Så at {{company}} nylig {{hook_headline}}. Imponerende!

Vi jobber med lignende bedrifter i {{location}} og hjelper dem med å konvertere positive anmeldelser til 23% flere leads gjennom automatisert sosial bevis.

Har dere planer om å utnytte denne positive oppmerksomheten til vekst?

Kan gjerne dele noen konkrete eksempler som er relevante for {{company}}.

Beste hilsen,
[Din signatur]`,
          personalization_tokens: ['first_name', 'company', 'hook_headline', 'location'],
          voice_profile: {
            tone: 'friendly' as const,
            formality: 'medium' as const,
            style: 'consultative' as const
          },
          language: 'no',
          tags: ['review', 'social-proof', 'lead-gen'],
          performance: {
            sends: 245,
            opens: 178,
            clicks: 34,
            replies: 28
          }
        },
        {
          template_id: '2',
          name: 'Product Launch Follow-up',
          channel: 'linkedin' as const,
          subject: '',
          body_text: `Hei {{first_name}},

Gratulerer med lanseringen av deres nye produkt! 🚀

Jeg jobber med B2B SaaS-selskaper som {{company}} og hjelper dem med å maksimere ROI fra produktlanseringer.

Våre klienter ser typisk 40% økning i kvalifiserte leads første kvartal etter lansering.

Interessert i en kort prat om hvordan vi kan hjelpe {{company}}?

Mvh`,
          personalization_tokens: ['first_name', 'company'],
          voice_profile: {
            tone: 'professional' as const,
            formality: 'medium' as const,
            style: 'direct' as const
          },
          language: 'no',
          tags: ['product-launch', 'saas', 'linkedin'],
          performance: {
            sends: 89,
            opens: 67,
            clicks: 12,
            replies: 8
          }
        }
      ];
    }
  });

  // Create template mutation
  const createTemplate = useMutation({
    mutationFn: async (template: MessageTemplate) => {
      return await apiRequest('/api/outreach/templates', 'POST', template);
    },
    onSuccess: () => {
      toast({
        title: "Mal opprettet",
        description: "Meldingsmalen er lagret"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/outreach/templates'] });
      setShowNewTemplate(false);
      setNewTemplate({
        name: '',
        channel: 'email',
        subject: '',
        body_text: '',
        personalization_tokens: [],
        voice_profile: {
          tone: 'professional',
          formality: 'medium',
          style: 'consultative'
        },
        language: 'no',
        tags: []
      });
    }
  });

  // Generate with AI mutation
  const generateWithAI = useMutation({
    mutationFn: async (data: { prompt: string; context: any }) => {
      return await apiRequest('/api/outreach/messages/generate-template', 'POST', data);
    },
    onSuccess: (data) => {
      setNewTemplate({
        ...newTemplate,
        subject: data.subject || newTemplate.subject,
        body_text: data.body_text || newTemplate.body_text,
        personalization_tokens: data.tokens || []
      });
      toast({
        title: "AI-generering fullført",
        description: "Meldingsmalen er generert"
      });
      setShowAIAssistant(false);
    }
  });

  const insertMergeTag = (tag: string) => {
    const textarea = document.getElementById('template-body') as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = newTemplate.body_text;
      const before = text.substring(0, start);
      const after = text.substring(end);
      
      setNewTemplate({
        ...newTemplate,
        body_text: before + tag + after
      });
      
      // Update cursor position
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + tag.length;
        textarea.focus();
      }, 0);
    }
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'email': return Mail;
      case 'sms': return Smartphone;
      case 'linkedin': return Linkedin;
      case 'whatsapp': return MessageCircle;
      default: return MessageSquare;
    }
  };

  const getPerformanceRate = (template: MessageTemplate, metric: 'opens' | 'clicks' | 'replies') => {
    if (!template.performance) return 0;
    const base = metric === 'opens' ? template.performance.sends :
                 metric === 'clicks' ? template.performance.opens :
                 template.performance.sends;
    if (base === 0) return 0;
    return Math.round((template.performance[metric] / base) * 100);
  };

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = !searchQuery || 
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.body_text.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesChannel = filterChannel === 'all' || template.channel === filterChannel;
    
    return matchesSearch && matchesChannel;
  });

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Meldingsmaler</h2>
            <p className="text-muted-foreground">Opprett og administrer personaliserte meldingsmaler</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => setShowAIAssistant(true)}>
              <Brain className="h-4 w-4 mr-2" />
              AI-assistent
            </Button>
            <Button 
              size="sm"
              className="bg-gradient-to-r from-purple-500 to-blue-500"
              onClick={() => setShowNewTemplate(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Ny mal
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Totalt maler</p>
                  <p className="text-2xl font-bold">{templates.length}</p>
                </div>
                <FileText className="h-5 w-5 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">E-postmaler</p>
                  <p className="text-2xl font-bold">
                    {templates.filter(t => t.channel === 'email').length}
                  </p>
                </div>
                <Mail className="h-5 w-5 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Gj.snitt åpningsrate</p>
                  <p className="text-2xl font-bold">72%</p>
                </div>
                <Eye className="h-5 w-5 text-purple-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Gj.snitt svarrate</p>
                  <p className="text-2xl font-bold">14%</p>
                </div>
                <MessageSquare className="h-5 w-5 text-indigo-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-12 gap-6">
          {/* Template List */}
          <div className="col-span-4 space-y-4">
            {/* Filters */}
            <div className="flex items-center gap-2">
              <Input
                placeholder="Søk maler..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1"
                data-testid="input-search-templates"
              />
              <Select value={filterChannel} onValueChange={setFilterChannel}>
                <SelectTrigger className="w-32" data-testid="select-filter-channel">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle kanaler</SelectItem>
                  <SelectItem value="email">E-post</SelectItem>
                  <SelectItem value="sms">SMS</SelectItem>
                  <SelectItem value="linkedin">LinkedIn</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Template Cards */}
            <ScrollArea className="h-[calc(100vh-400px)]">
              <div className="space-y-3">
                {filteredTemplates.map((template) => {
                  const ChannelIcon = getChannelIcon(template.channel);
                  return (
                    <Card 
                      key={template.template_id}
                      className={`cursor-pointer transition-all ${
                        selectedTemplate?.template_id === template.template_id 
                          ? 'ring-2 ring-primary' 
                          : 'hover:shadow-lg'
                      }`}
                      onClick={() => setSelectedTemplate(template)}
                      data-testid={`card-template-${template.template_id}`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h4 className="font-semibold">{template.name}</h4>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                <ChannelIcon className="h-3 w-3 mr-1" />
                                {template.channel}
                              </Badge>
                              <Badge variant="secondary" className="text-xs">
                                {template.language}
                              </Badge>
                            </div>
                          </div>
                        </div>

                        <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                          {template.body_text.substring(0, 100)}...
                        </p>

                        {template.performance && (
                          <div className="flex items-center gap-3 text-xs">
                            <span className="flex items-center gap-1">
                              <Eye className="h-3 w-3" />
                              {getPerformanceRate(template, 'opens')}%
                            </span>
                            <span className="flex items-center gap-1">
                              <MessageSquare className="h-3 w-3" />
                              {getPerformanceRate(template, 'replies')}%
                            </span>
                          </div>
                        )}

                        <div className="flex flex-wrap gap-1 mt-2">
                          {template.tags.slice(0, 3).map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </ScrollArea>
          </div>

          {/* Template Editor */}
          <div className="col-span-8">
            {selectedTemplate ? (
              <Card className="h-full">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{selectedTemplate.name}</CardTitle>
                      <CardDescription>
                        {selectedTemplate.channel} mal • {selectedTemplate.language}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        Forhåndsvis
                      </Button>
                      <Button variant="outline" size="sm">
                        <Copy className="h-4 w-4 mr-2" />
                        Dupliser
                      </Button>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4 mr-2" />
                        Rediger
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="content">
                    <TabsList>
                      <TabsTrigger value="content">Innhold</TabsTrigger>
                      <TabsTrigger value="personalization">Personalisering</TabsTrigger>
                      <TabsTrigger value="performance">Ytelse</TabsTrigger>
                      <TabsTrigger value="settings">Innstillinger</TabsTrigger>
                    </TabsList>

                    <TabsContent value="content" className="space-y-4">
                      {selectedTemplate.channel === 'email' && selectedTemplate.subject && (
                        <div>
                          <Label>Emnelinje</Label>
                          <div className="p-3 bg-muted rounded-lg mt-2">
                            {selectedTemplate.subject}
                          </div>
                        </div>
                      )}
                      <div>
                        <Label>Meldingstekst</Label>
                        <div className="p-3 bg-muted rounded-lg mt-2 whitespace-pre-wrap">
                          {selectedTemplate.body_text}
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="personalization" className="space-y-4">
                      <div>
                        <Label>Personaliseringstokens</Label>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {selectedTemplate.personalization_tokens.map((token) => (
                            <Badge key={token} variant="secondary">
                              {`{{${token}}}`}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <Label>Stemmeprofil</Label>
                        <div className="grid grid-cols-3 gap-2 mt-2">
                          <Card>
                            <CardContent className="p-3">
                              <p className="text-xs text-muted-foreground">Tone</p>
                              <p className="text-sm font-medium capitalize">
                                {selectedTemplate.voice_profile.tone}
                              </p>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardContent className="p-3">
                              <p className="text-xs text-muted-foreground">Formalitet</p>
                              <p className="text-sm font-medium capitalize">
                                {selectedTemplate.voice_profile.formality}
                              </p>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardContent className="p-3">
                              <p className="text-xs text-muted-foreground">Stil</p>
                              <p className="text-sm font-medium capitalize">
                                {selectedTemplate.voice_profile.style}
                              </p>
                            </CardContent>
                          </Card>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="performance" className="space-y-4">
                      {selectedTemplate.performance ? (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <Card>
                              <CardContent className="p-4">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-sm text-muted-foreground">Sendt</span>
                                  <Send className="h-4 w-4 text-muted-foreground" />
                                </div>
                                <p className="text-2xl font-bold">{selectedTemplate.performance.sends}</p>
                              </CardContent>
                            </Card>
                            <Card>
                              <CardContent className="p-4">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-sm text-muted-foreground">Åpnet</span>
                                  <Eye className="h-4 w-4 text-muted-foreground" />
                                </div>
                                <p className="text-2xl font-bold">
                                  {selectedTemplate.performance.opens}
                                </p>
                                <p className="text-xs text-green-600">
                                  {getPerformanceRate(selectedTemplate, 'opens')}%
                                </p>
                              </CardContent>
                            </Card>
                            <Card>
                              <CardContent className="p-4">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-sm text-muted-foreground">Klikk</span>
                                  <Link className="h-4 w-4 text-muted-foreground" />
                                </div>
                                <p className="text-2xl font-bold">
                                  {selectedTemplate.performance.clicks}
                                </p>
                                <p className="text-xs text-green-600">
                                  {getPerformanceRate(selectedTemplate, 'clicks')}%
                                </p>
                              </CardContent>
                            </Card>
                            <Card>
                              <CardContent className="p-4">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-sm text-muted-foreground">Svar</span>
                                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                                </div>
                                <p className="text-2xl font-bold">
                                  {selectedTemplate.performance.replies}
                                </p>
                                <p className="text-xs text-green-600">
                                  {getPerformanceRate(selectedTemplate, 'replies')}%
                                </p>
                              </CardContent>
                            </Card>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-32 text-muted-foreground">
                          <Info className="h-8 w-8 mr-3" />
                          <span>Ingen ytelsesdata tilgjengelig ennå</span>
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="settings" className="space-y-4">
                      <div>
                        <Label>Tags</Label>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {selectedTemplate.tags.map((tag) => (
                            <Badge key={tag} variant="outline">
                              <Tag className="h-3 w-3 mr-1" />
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            ) : (
              <Card className="h-full flex items-center justify-center">
                <div className="text-center">
                  <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Velg en mal</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Velg en mal fra listen eller opprett en ny
                  </p>
                  <Button 
                    className="bg-gradient-to-r from-purple-500 to-blue-500"
                    onClick={() => setShowNewTemplate(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Opprett ny mal
                  </Button>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* New Template Dialog */}
      <Dialog open={showNewTemplate} onOpenChange={setShowNewTemplate}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Opprett ny meldingsmal</DialogTitle>
            <DialogDescription>
              Lag en personalisert mal for dine outreach-kampanjer
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="template-name">Malnavn *</Label>
                <Input
                  id="template-name"
                  value={newTemplate.name}
                  onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                  placeholder="F.eks. Review Winner Outreach"
                  data-testid="input-template-name"
                />
              </div>
              <div>
                <Label htmlFor="template-channel">Kanal *</Label>
                <Select 
                  value={newTemplate.channel} 
                  onValueChange={(value: any) => setNewTemplate({ ...newTemplate, channel: value })}
                >
                  <SelectTrigger id="template-channel" data-testid="select-template-channel">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">E-post</SelectItem>
                    <SelectItem value="sms">SMS</SelectItem>
                    <SelectItem value="linkedin">LinkedIn</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {newTemplate.channel === 'email' && (
              <div>
                <Label htmlFor="template-subject">Emnelinje</Label>
                <Input
                  id="template-subject"
                  value={newTemplate.subject}
                  onChange={(e) => setNewTemplate({ ...newTemplate, subject: e.target.value })}
                  placeholder="F.eks. Gratulerer med {{hook_headline}}, {{first_name}}! 🎉"
                  data-testid="input-template-subject"
                />
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor="template-body">Meldingstekst *</Label>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowAIAssistant(true)}
                  type="button"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  AI-hjelp
                </Button>
              </div>
              <Textarea
                id="template-body"
                value={newTemplate.body_text}
                onChange={(e) => setNewTemplate({ ...newTemplate, body_text: e.target.value })}
                placeholder="Skriv din melding her... Bruk {{tokens}} for personalisering"
                rows={10}
                className="font-mono text-sm"
                data-testid="textarea-template-body"
              />
            </div>

            {/* Merge Tags */}
            <div>
              <Label>Sett inn personaliseringstokens</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {mergeTags.map((mergeTag) => (
                  <Button
                    key={mergeTag.tag}
                    variant="outline"
                    size="sm"
                    onClick={() => insertMergeTag(mergeTag.tag)}
                    type="button"
                  >
                    <mergeTag.icon className="h-3 w-3 mr-1" />
                    {mergeTag.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Voice Profile */}
            <div>
              <Label>Stemmeprofil</Label>
              <div className="grid grid-cols-3 gap-4 mt-2">
                <div>
                  <Label htmlFor="voice-tone" className="text-xs">Tone</Label>
                  <Select 
                    value={newTemplate.voice_profile.tone} 
                    onValueChange={(value: any) => setNewTemplate({ 
                      ...newTemplate, 
                      voice_profile: { ...newTemplate.voice_profile, tone: value }
                    })}
                  >
                    <SelectTrigger id="voice-tone" data-testid="select-voice-tone">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="formal">Formell</SelectItem>
                      <SelectItem value="casual">Uformell</SelectItem>
                      <SelectItem value="friendly">Vennlig</SelectItem>
                      <SelectItem value="professional">Profesjonell</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="voice-formality" className="text-xs">Formalitet</Label>
                  <Select 
                    value={newTemplate.voice_profile.formality} 
                    onValueChange={(value: any) => setNewTemplate({ 
                      ...newTemplate, 
                      voice_profile: { ...newTemplate.voice_profile, formality: value }
                    })}
                  >
                    <SelectTrigger id="voice-formality" data-testid="select-voice-formality">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">Høy</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Lav</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="voice-style" className="text-xs">Stil</Label>
                  <Select 
                    value={newTemplate.voice_profile.style} 
                    onValueChange={(value: any) => setNewTemplate({ 
                      ...newTemplate, 
                      voice_profile: { ...newTemplate.voice_profile, style: value }
                    })}
                  >
                    <SelectTrigger id="voice-style" data-testid="select-voice-style">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="direct">Direkte</SelectItem>
                      <SelectItem value="consultative">Konsultativ</SelectItem>
                      <SelectItem value="enthusiastic">Entusiastisk</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewTemplate(false)}>
              Avbryt
            </Button>
            <Button 
              onClick={() => createTemplate.mutate(newTemplate)}
              disabled={!newTemplate.name || !newTemplate.body_text}
              className="bg-gradient-to-r from-purple-500 to-blue-500"
              data-testid="button-create-template"
            >
              <Save className="h-4 w-4 mr-2" />
              Lagre mal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AI Assistant Dialog */}
      <Dialog open={showAIAssistant} onOpenChange={setShowAIAssistant}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>AI Meldingsassistent</DialogTitle>
            <DialogDescription>
              Beskriv hva slags melding du ønsker å lage
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="ai-prompt">Beskriv meldingen</Label>
              <Textarea
                id="ai-prompt"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="F.eks. Lag en vennlig e-post som gratulerer med en positiv anmeldelse og tilbyr våre tjenester for å konvertere sosial bevis til leads"
                rows={4}
                data-testid="textarea-ai-prompt"
              />
            </div>

            <div className="p-4 bg-purple-50 dark:bg-purple-950/30 rounded-lg border border-purple-200 dark:border-purple-900">
              <div className="flex items-start gap-2">
                <Brain className="h-5 w-5 text-purple-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-purple-900 dark:text-purple-100">
                    AI-tips:
                  </p>
                  <ul className="text-xs text-purple-800 dark:text-purple-200 mt-1 space-y-1">
                    <li>• Beskriv målgruppen og deres utfordringer</li>
                    <li>• Spesifiser ønsket tone og formalitet</li>
                    <li>• Inkluder konkrete verdipunkter</li>
                    <li>• Nevn ønsket CTA (call-to-action)</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAIAssistant(false)}>
              Avbryt
            </Button>
            <Button 
              onClick={() => generateWithAI.mutate({ 
                prompt: aiPrompt, 
                context: {
                  channel: newTemplate.channel,
                  voice_profile: newTemplate.voice_profile,
                  language: newTemplate.language
                }
              })}
              disabled={!aiPrompt}
              className="bg-gradient-to-r from-purple-500 to-blue-500"
              data-testid="button-generate-ai"
            >
              <Wand2 className="h-4 w-4 mr-2" />
              Generer med AI
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}