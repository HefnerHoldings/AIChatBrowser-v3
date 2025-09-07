import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Upload,
  FileCode,
  Package,
  Tag,
  DollarSign,
  Shield,
  Code2,
  CheckCircle,
  Info,
  X,
  Plus,
  Github,
  Globe,
  FileText,
  Image,
  Zap
} from 'lucide-react';

interface PublishModalProps {
  open: boolean;
  onClose: () => void;
}

export function PublishModal({ open, onClose }: PublishModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [publishType, setPublishType] = useState<'playbook' | 'plugin' | 'theme'>('playbook');
  const [tags, setTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    longDescription: '',
    category: '',
    version: '1.0.0',
    price: 'free',
    customPrice: '',
    githubUrl: '',
    websiteUrl: '',
    compatibility: [] as string[],
    requirements: '',
    license: 'MIT',
    screenshots: [] as File[],
    mainFile: null as File | null,
    documentation: ''
  });

  const categories = {
    playbook: ['automation', 'testing', 'scraping', 'integration', 'ai', 'productivity', 'data', 'security'],
    plugin: ['extension', 'theme', 'tool', 'integration', 'api', 'utility'],
    theme: ['dark', 'light', 'colorful', 'minimal', 'professional', 'custom']
  };

  const licenses = [
    'MIT', 'Apache 2.0', 'GPL-3.0', 'BSD-3-Clause', 'ISC', 'Commercial', 'Custom'
  ];

  const compatibilityOptions = [
    'Chrome', 'Firefox', 'Edge', 'Safari', 'All browsers', 'Node.js', 'Deno'
  ];

  const addTag = () => {
    if (currentTag.trim() && !tags.includes(currentTag.trim())) {
      setTags([...tags, currentTag.trim()]);
      setCurrentTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSubmit = () => {
    console.log('Publishing:', { publishType, formData, tags });
    setUploadProgress(0);
    
    // Simulate upload
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            onClose();
          }, 1000);
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  const isStepComplete = (step: number) => {
    switch (step) {
      case 1:
        return formData.name && formData.description && formData.category;
      case 2:
        return formData.version && formData.license;
      case 3:
        return tags.length > 0;
      case 4:
        return true;
      default:
        return false;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Publiser til Marketplace</DialogTitle>
          <DialogDescription>
            Del dine kreasjoner med MadEasy-fellesskapet
          </DialogDescription>
        </DialogHeader>

        {/* Progress Indicator */}
        <div className="flex items-center justify-between mb-6">
          {[1, 2, 3, 4].map((step) => (
            <div key={step} className="flex items-center">
              <div 
                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                  currentStep === step 
                    ? 'bg-primary text-primary-foreground border-primary' 
                    : currentStep > step || isStepComplete(step)
                    ? 'bg-primary/20 text-primary border-primary'
                    : 'bg-muted text-muted-foreground border-muted'
                }`}
              >
                {currentStep > step || isStepComplete(step) ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  step
                )}
              </div>
              {step < 4 && (
                <div className={`w-20 h-0.5 ${
                  currentStep > step ? 'bg-primary' : 'bg-muted'
                }`} />
              )}
            </div>
          ))}
        </div>

        <ScrollArea className="h-[400px] pr-4">
          {currentStep === 1 && (
            <div className="space-y-4">
              <div>
                <Label>Type</Label>
                <Tabs value={publishType} onValueChange={(v) => setPublishType(v as any)}>
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="playbook">
                      <FileCode className="h-4 w-4 mr-2" />
                      Playbook
                    </TabsTrigger>
                    <TabsTrigger value="plugin">
                      <Package className="h-4 w-4 mr-2" />
                      Plugin
                    </TabsTrigger>
                    <TabsTrigger value="theme">
                      <Code2 className="h-4 w-4 mr-2" />
                      Tema
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              <div>
                <Label htmlFor="name">Navn *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={`Navn på ${publishType === 'playbook' ? 'playbook' : publishType === 'plugin' ? 'plugin' : 'tema'}`}
                />
              </div>

              <div>
                <Label htmlFor="description">Kort beskrivelse *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Beskriv hva dette gjør (maks 200 tegn)"
                  maxLength={200}
                  rows={3}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {formData.description.length}/200 tegn
                </p>
              </div>

              <div>
                <Label htmlFor="category">Kategori *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(v) => setFormData({ ...formData, category: v })}
                >
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Velg en kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories[publishType].map(cat => (
                      <SelectItem key={cat} value={cat}>
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="longDescription">Detaljert beskrivelse</Label>
                <Textarea
                  id="longDescription"
                  value={formData.longDescription}
                  onChange={(e) => setFormData({ ...formData, longDescription: e.target.value })}
                  placeholder="Gi en detaljert beskrivelse av funksjonalitet, bruksområder, etc."
                  rows={5}
                />
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="version">Versjon *</Label>
                <Input
                  id="version"
                  value={formData.version}
                  onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                  placeholder="1.0.0"
                />
              </div>

              <div>
                <Label>Pris *</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      checked={formData.price === 'free'}
                      onCheckedChange={() => setFormData({ ...formData, price: 'free' })}
                    />
                    <Label className="cursor-pointer">Gratis</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      checked={formData.price === 'paid'}
                      onCheckedChange={() => setFormData({ ...formData, price: 'paid' })}
                    />
                    <Label className="cursor-pointer">Betalt</Label>
                  </div>
                  {formData.price === 'paid' && (
                    <div className="flex items-center gap-2 ml-6">
                      <DollarSign className="h-4 w-4" />
                      <Input
                        type="number"
                        value={formData.customPrice}
                        onChange={(e) => setFormData({ ...formData, customPrice: e.target.value })}
                        placeholder="9.99"
                        className="w-32"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="license">Lisens *</Label>
                <Select
                  value={formData.license}
                  onValueChange={(v) => setFormData({ ...formData, license: v })}
                >
                  <SelectTrigger id="license">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {licenses.map(license => (
                      <SelectItem key={license} value={license}>
                        {license}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Kompatibilitet</Label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {compatibilityOptions.map(option => (
                    <div key={option} className="flex items-center space-x-2">
                      <Checkbox
                        checked={formData.compatibility.includes(option)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setFormData({
                              ...formData,
                              compatibility: [...formData.compatibility, option]
                            });
                          } else {
                            setFormData({
                              ...formData,
                              compatibility: formData.compatibility.filter(c => c !== option)
                            });
                          }
                        }}
                      />
                      <Label className="text-sm cursor-pointer">{option}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="github">GitHub URL</Label>
                  <div className="flex items-center gap-2">
                    <Github className="h-4 w-4 text-muted-foreground" />
                    <Input
                      id="github"
                      value={formData.githubUrl}
                      onChange={(e) => setFormData({ ...formData, githubUrl: e.target.value })}
                      placeholder="https://github.com/..."
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="website">Nettside</Label>
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <Input
                      id="website"
                      value={formData.websiteUrl}
                      onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
                      placeholder="https://..."
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-4">
              <div>
                <Label>Tags *</Label>
                <div className="flex items-center gap-2">
                  <Input
                    value={currentTag}
                    onChange={(e) => setCurrentTag(e.target.value)}
                    placeholder="Legg til tag..."
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  />
                  <Button onClick={addTag} size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {tags.map(tag => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                      <button
                        onClick={() => removeTag(tag)}
                        className="ml-2 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Minimum 1 tag, maksimum 10 tags
                </p>
              </div>

              <div>
                <Label>Last opp filer</Label>
                <Card className="p-8 border-dashed">
                  <div className="text-center">
                    <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-sm text-muted-foreground mb-2">
                      Dra og slipp filer her, eller klikk for å velge
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Hovedfil (ZIP/JS/CSS) + Screenshots (PNG/JPG)
                    </p>
                    <Input
                      type="file"
                      multiple
                      accept=".zip,.js,.css,.png,.jpg,.jpeg"
                      className="hidden"
                      id="file-upload"
                      onChange={(e) => {
                        const files = Array.from(e.target.files || []);
                        const screenshots = files.filter(f => 
                          f.type.startsWith('image/')
                        );
                        const mainFile = files.find(f => 
                          !f.type.startsWith('image/')
                        );
                        setFormData({
                          ...formData,
                          screenshots,
                          mainFile: mainFile || null
                        });
                      }}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-4"
                      onClick={() => document.getElementById('file-upload')?.click()}
                    >
                      Velg filer
                    </Button>
                  </div>
                </Card>
                {formData.mainFile && (
                  <div className="mt-2">
                    <p className="text-sm">
                      <FileCode className="h-4 w-4 inline mr-1" />
                      Hovedfil: {formData.mainFile.name}
                    </p>
                  </div>
                )}
                {formData.screenshots.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm">
                      <Image className="h-4 w-4 inline mr-1" />
                      {formData.screenshots.length} screenshot(s)
                    </p>
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="requirements">Systemkrav / Dependencies</Label>
                <Textarea
                  id="requirements"
                  value={formData.requirements}
                  onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                  placeholder="List opp eventuelle krav eller dependencies"
                  rows={3}
                />
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-4">
              <Card className="p-4">
                <h3 className="font-semibold mb-3">Forhåndsvisning</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Type:</span>
                    <Badge>{publishType}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Navn:</span>
                    <span className="font-medium">{formData.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Kategori:</span>
                    <span>{formData.category}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Versjon:</span>
                    <span>{formData.version}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Pris:</span>
                    <span className="font-medium">
                      {formData.price === 'free' ? 'Gratis' : `$${formData.customPrice}`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Tags:</span>
                    <div className="flex gap-1">
                      {tags.slice(0, 3).map(tag => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {tags.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="p-4 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                  <div className="space-y-2">
                    <h4 className="font-medium text-blue-900 dark:text-blue-100">
                      Før du publiserer
                    </h4>
                    <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                      <li>• Innholdet vil bli gjennomgått av vårt team</li>
                      <li>• Godkjenning tar vanligvis 1-2 virkedager</li>
                      <li>• Du vil motta e-post når statusen endres</li>
                      <li>• Sørg for at all kode følger våre retningslinjer</li>
                    </ul>
                  </div>
                </div>
              </Card>

              <div className="flex items-center space-x-2">
                <Checkbox id="terms" />
                <Label htmlFor="terms" className="text-sm">
                  Jeg godtar <span className="text-primary underline cursor-pointer">vilkårene</span> og 
                  bekrefter at jeg har rettigheter til å publisere dette innholdet
                </Label>
              </div>

              {uploadProgress > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Laster opp...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} />
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        <div className="flex justify-between mt-6">
          <Button
            variant="outline"
            onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
            disabled={currentStep === 1}
          >
            Tilbake
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Avbryt
            </Button>
            {currentStep < 4 ? (
              <Button
                onClick={() => setCurrentStep(currentStep + 1)}
                disabled={!isStepComplete(currentStep)}
              >
                Neste
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={uploadProgress > 0}>
                <Zap className="h-4 w-4 mr-2" />
                Publiser
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}