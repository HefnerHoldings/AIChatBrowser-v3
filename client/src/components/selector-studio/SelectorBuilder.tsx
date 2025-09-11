import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  MousePointer, 
  Code, 
  Target, 
  Copy, 
  CheckCircle,
  XCircle,
  AlertTriangle,
  Zap,
  Hash,
  Type,
  Layers
} from "lucide-react";

interface SelectorBuilderProps {
  selectedSelector: any;
  onSelectorCreate: (selector: any) => void;
  isPickerActive: boolean;
}

export default function SelectorBuilder({ selectedSelector, onSelectorCreate, isPickerActive }: SelectorBuilderProps) {
  const [selectorType, setSelectorType] = useState('css');
  const [customSelector, setCustomSelector] = useState('');
  const [testUrl, setTestUrl] = useState('');
  const [validationResult, setValidationResult] = useState<any>(null);
  const [alternatives, setAlternatives] = useState<any[]>([]);

  useEffect(() => {
    if (selectedSelector) {
      setCustomSelector(selectedSelector.selector);
      setSelectorType(selectedSelector.type);
      // Generate alternatives
      generateAlternatives(selectedSelector.selector);
    }
  }, [selectedSelector]);

  const generateAlternatives = (selector: string) => {
    // Mock alternative generation
    const alts = [
      {
        type: 'id',
        selector: '#main-button',
        score: 95,
        reason: 'Unik ID selector'
      },
      {
        type: 'class',
        selector: '.btn-primary',
        score: 75,
        reason: 'Klassebasert selector'
      },
      {
        type: 'xpath',
        selector: '//button[@data-test="submit"]',
        score: 90,
        reason: 'Data-attributt selector'
      },
      {
        type: 'text',
        selector: 'button:contains("Submit")',
        score: 60,
        reason: 'Tekstbasert selector'
      }
    ];
    setAlternatives(alts);
  };

  const validateSelector = async () => {
    try {
      const response = await fetch('/api/selector-studio/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selector: customSelector,
          type: selectorType,
          url: testUrl
        })
      });
      const result = await response.json();
      setValidationResult(result);
    } catch (error) {
      setValidationResult({
        valid: false,
        error: 'Validering feilet'
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const getSelectorIcon = (type: string) => {
    switch (type) {
      case 'id': return <Hash className="w-4 h-4" />;
      case 'class': return <Type className="w-4 h-4" />;
      case 'xpath': return <Code className="w-4 h-4" />;
      case 'css': return <Layers className="w-4 h-4" />;
      default: return <Target className="w-4 h-4" />;
    }
  };

  return (
    <div className="grid grid-cols-3 gap-4 h-full">
      {/* Selector Input */}
      <Card className="col-span-2">
        <CardHeader>
          <CardTitle>Selector Builder</CardTitle>
          <CardDescription>
            {isPickerActive ? 'Klikk på et element i nettleseren for å velge' : 'Opprett eller rediger selectors'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="visual">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="visual" data-testid="tab-visual-builder">Visuell</TabsTrigger>
              <TabsTrigger value="manual" data-testid="tab-manual-builder">Manuell</TabsTrigger>
            </TabsList>

            <TabsContent value="visual" className="space-y-4">
              {isPickerActive ? (
                <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-lg">
                  <MousePointer className="w-12 h-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">Picker er aktiv</p>
                  <p className="text-sm text-muted-foreground">Klikk på et element i nettleseren</p>
                </div>
              ) : selectedSelector ? (
                <div className="space-y-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getSelectorIcon(selectedSelector.type)}
                        <span className="font-medium">{selectedSelector.type.toUpperCase()}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(selectedSelector.selector)}
                        data-testid="button-copy-selector"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                    <code className="text-sm font-mono block overflow-x-auto">
                      {selectedSelector.selector}
                    </code>
                  </div>

                  {/* Element Preview */}
                  <div>
                    <Label>Element Forhåndsvisning</Label>
                    <div className="mt-2 p-4 border rounded-lg bg-white dark:bg-gray-900">
                      <div className="text-sm text-muted-foreground mb-2">HTML:</div>
                      <code className="text-xs font-mono block overflow-x-auto">
                        &lt;button class="btn-primary" id="submit-btn"&gt;Send Inn&lt;/button&gt;
                      </code>
                    </div>
                  </div>

                  {/* Attributes */}
                  <div>
                    <Label>Element Attributter</Label>
                    <div className="mt-2 space-y-2">
                      <div className="flex items-center justify-between p-2 bg-muted rounded">
                        <span className="text-sm">class</span>
                        <code className="text-sm font-mono">btn-primary active</code>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-muted rounded">
                        <span className="text-sm">id</span>
                        <code className="text-sm font-mono">submit-btn</code>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-muted rounded">
                        <span className="text-sm">data-test</span>
                        <code className="text-sm font-mono">submit-form</code>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                  <Target className="w-12 h-12 mb-4" />
                  <p>Aktiver picker for å velge et element</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="manual" className="space-y-4">
              <div>
                <Label htmlFor="selector-type">Selector Type</Label>
                <Select value={selectorType} onValueChange={setSelectorType}>
                  <SelectTrigger id="selector-type" data-testid="select-selector-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="css">CSS</SelectItem>
                    <SelectItem value="xpath">XPath</SelectItem>
                    <SelectItem value="id">ID</SelectItem>
                    <SelectItem value="class">Class</SelectItem>
                    <SelectItem value="text">Text</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="custom-selector">Selector</Label>
                <Textarea
                  id="custom-selector"
                  value={customSelector}
                  onChange={(e) => setCustomSelector(e.target.value)}
                  placeholder="F.eks. #submit-button eller //button[@type='submit']"
                  className="font-mono"
                  rows={3}
                  data-testid="textarea-selector"
                />
              </div>

              <div>
                <Label htmlFor="test-url">Test URL</Label>
                <Input
                  id="test-url"
                  value={testUrl}
                  onChange={(e) => setTestUrl(e.target.value)}
                  placeholder="https://example.com"
                  data-testid="input-test-url"
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={validateSelector} className="flex-1" data-testid="button-validate">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Valider
                </Button>
                <Button 
                  onClick={() => onSelectorCreate({
                    selector: customSelector,
                    type: selectorType,
                    url: testUrl
                  })}
                  className="flex-1"
                  variant="default"
                  data-testid="button-create"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Opprett
                </Button>
              </div>

              {validationResult && (
                <div className={`p-3 rounded-lg flex items-start gap-2 ${
                  validationResult.valid ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'
                }`}>
                  {validationResult.valid ? (
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-600 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {validationResult.valid ? 'Selector er gyldig' : 'Selector er ugyldig'}
                    </p>
                    {validationResult.message && (
                      <p className="text-xs mt-1">{validationResult.message}</p>
                    )}
                    {validationResult.elementsFound !== undefined && (
                      <p className="text-xs mt-1">
                        Elementer funnet: {validationResult.elementsFound}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Alternatives & Suggestions */}
      <Card className="col-span-1">
        <CardHeader>
          <CardTitle>Alternative Selectors</CardTitle>
          <CardDescription>AI-genererte alternativer</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px]">
            <div className="space-y-3">
              {alternatives.length === 0 ? (
                <div className="text-center text-muted-foreground py-4">
                  Velg et element for å se alternativer
                </div>
              ) : (
                alternatives.map((alt, index) => (
                  <Card key={index} data-testid={`alternative-${index}`}>
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getSelectorIcon(alt.type)}
                          <span className="text-sm font-medium">{alt.type.toUpperCase()}</span>
                        </div>
                        <Badge variant={alt.score > 80 ? 'secondary' : alt.score > 60 ? 'outline' : 'destructive'}>
                          {alt.score}%
                        </Badge>
                      </div>
                      <code className="text-xs font-mono block overflow-x-auto mb-2">
                        {alt.selector}
                      </code>
                      <p className="text-xs text-muted-foreground">{alt.reason}</p>
                      <div className="flex gap-2 mt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => {
                            setCustomSelector(alt.selector);
                            setSelectorType(alt.type);
                          }}
                          data-testid={`button-use-${index}`}
                        >
                          Bruk
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(alt.selector)}
                          data-testid={`button-copy-${index}`}
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>

          {/* Best Practices */}
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Tips for stabile selectors:</p>
                <ul className="text-xs mt-1 space-y-1">
                  <li>• Bruk data-test attributter når mulig</li>
                  <li>• Unngå indeks-baserte selectors</li>
                  <li>• Foretrekk ID over klasser</li>
                  <li>• Test på tvers av nettlesere</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}