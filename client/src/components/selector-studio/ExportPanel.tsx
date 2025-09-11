import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Download, 
  Code, 
  Copy, 
  FileJson,
  FileCode,
  Package,
  Github,
  Globe,
  Terminal
} from "lucide-react";

interface ExportPanelProps {
  selectors: any[];
}

export default function ExportPanel({ selectors }: ExportPanelProps) {
  const [exportFormat, setExportFormat] = useState('playwright');
  const [selectedSelectors, setSelectedSelectors] = useState<string[]>([]);
  const [includeComments, setIncludeComments] = useState(true);
  const [includeWaitStatements, setIncludeWaitStatements] = useState(true);
  const [exportLanguage, setExportLanguage] = useState('javascript');

  const toggleSelector = (id: string) => {
    setSelectedSelectors(prev =>
      prev.includes(id) 
        ? prev.filter(s => s !== id)
        : [...prev, id]
    );
  };

  const selectAll = () => {
    setSelectedSelectors(selectors.map(s => s.id));
  };

  const deselectAll = () => {
    setSelectedSelectors([]);
  };

  const generatePlaywrightCode = () => {
    const selected = selectors.filter(s => selectedSelectors.includes(s.id));
    let code = '';
    
    if (exportLanguage === 'javascript') {
      code = `const { chromium } = require('playwright');\n\n`;
      code += `(async () => {\n`;
      code += `  const browser = await chromium.launch();\n`;
      code += `  const page = await browser.newPage();\n\n`;
      
      selected.forEach(selector => {
        if (includeComments) {
          code += `  // ${selector.id} - Score: ${selector.score || 'N/A'}%\n`;
        }
        if (includeWaitStatements) {
          code += `  await page.waitForSelector('${selector.selector}');\n`;
        }
        code += `  await page.click('${selector.selector}');\n\n`;
      });
      
      code += `  await browser.close();\n`;
      code += `})();\n`;
    } else if (exportLanguage === 'python') {
      code = `from playwright.sync_api import sync_playwright\n\n`;
      code += `with sync_playwright() as p:\n`;
      code += `    browser = p.chromium.launch()\n`;
      code += `    page = browser.new_page()\n\n`;
      
      selected.forEach(selector => {
        if (includeComments) {
          code += `    # ${selector.id} - Score: ${selector.score || 'N/A'}%\n`;
        }
        if (includeWaitStatements) {
          code += `    page.wait_for_selector('${selector.selector}')\n`;
        }
        code += `    page.click('${selector.selector}')\n\n`;
      });
      
      code += `    browser.close()\n`;
    }
    
    return code;
  };

  const generatePuppeteerCode = () => {
    const selected = selectors.filter(s => selectedSelectors.includes(s.id));
    let code = `const puppeteer = require('puppeteer');\n\n`;
    code += `(async () => {\n`;
    code += `  const browser = await puppeteer.launch();\n`;
    code += `  const page = await browser.newPage();\n\n`;
    
    selected.forEach(selector => {
      if (includeComments) {
        code += `  // ${selector.id} - Score: ${selector.score || 'N/A'}%\n`;
      }
      if (includeWaitStatements) {
        code += `  await page.waitForSelector('${selector.selector}');\n`;
      }
      code += `  await page.click('${selector.selector}');\n\n`;
    });
    
    code += `  await browser.close();\n`;
    code += `})();\n`;
    
    return code;
  };

  const generateSeleniumCode = () => {
    const selected = selectors.filter(s => selectedSelectors.includes(s.id));
    let code = '';
    
    if (exportLanguage === 'javascript') {
      code = `const { Builder, By, until } = require('selenium-webdriver');\n\n`;
      code += `(async function example() {\n`;
      code += `  let driver = await new Builder().forBrowser('chrome').build();\n\n`;
      code += `  try {\n`;
      
      selected.forEach(selector => {
        if (includeComments) {
          code += `    // ${selector.id} - Score: ${selector.score || 'N/A'}%\n`;
        }
        if (includeWaitStatements) {
          code += `    await driver.wait(until.elementLocated(By.css('${selector.selector}')), 10000);\n`;
        }
        code += `    await driver.findElement(By.css('${selector.selector}')).click();\n\n`;
      });
      
      code += `  } finally {\n`;
      code += `    await driver.quit();\n`;
      code += `  }\n`;
      code += `})();\n`;
    } else if (exportLanguage === 'python') {
      code = `from selenium import webdriver\n`;
      code += `from selenium.webdriver.common.by import By\n`;
      code += `from selenium.webdriver.support.ui import WebDriverWait\n`;
      code += `from selenium.webdriver.support import expected_conditions as EC\n\n`;
      code += `driver = webdriver.Chrome()\n\n`;
      
      selected.forEach(selector => {
        if (includeComments) {
          code += `# ${selector.id} - Score: ${selector.score || 'N/A'}%\n`;
        }
        if (includeWaitStatements) {
          code += `WebDriverWait(driver, 10).until(EC.presence_of_element_located((By.CSS_SELECTOR, '${selector.selector}')))\n`;
        }
        code += `driver.find_element(By.CSS_SELECTOR, '${selector.selector}').click()\n\n`;
      });
      
      code += `driver.quit()\n`;
    }
    
    return code;
  };

  const generateJSON = () => {
    const selected = selectors.filter(s => selectedSelectors.includes(s.id));
    return JSON.stringify(selected, null, 2);
  };

  const getGeneratedCode = () => {
    switch (exportFormat) {
      case 'playwright': return generatePlaywrightCode();
      case 'puppeteer': return generatePuppeteerCode();
      case 'selenium': return generateSeleniumCode();
      case 'json': return generateJSON();
      default: return '';
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(getGeneratedCode());
  };

  const downloadFile = () => {
    const code = getGeneratedCode();
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    
    const extension = exportFormat === 'json' ? 'json' : 
                     exportLanguage === 'python' ? 'py' : 'js';
    a.download = `selectors-${exportFormat}.${extension}`;
    a.click();
  };

  return (
    <div className="grid grid-cols-3 gap-4 h-full">
      {/* Selector Selection */}
      <Card className="col-span-1">
        <CardHeader>
          <CardTitle>Velg Selectors</CardTitle>
          <CardDescription>Velg selectors å eksportere</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={selectAll}
                className="flex-1"
                data-testid="button-select-all"
              >
                Velg Alle
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={deselectAll}
                className="flex-1"
                data-testid="button-deselect-all"
              >
                Fjern Alle
              </Button>
            </div>

            <ScrollArea className="h-[400px] border rounded-lg p-3">
              <div className="space-y-2">
                {selectors.map(selector => (
                  <div 
                    key={selector.id}
                    className="flex items-center gap-2"
                    data-testid={`selector-checkbox-${selector.id}`}
                  >
                    <Checkbox
                      id={selector.id}
                      checked={selectedSelectors.includes(selector.id)}
                      onCheckedChange={() => toggleSelector(selector.id)}
                    />
                    <label 
                      htmlFor={selector.id}
                      className="flex-1 text-sm cursor-pointer"
                    >
                      <code className="font-mono text-xs">{selector.selector}</code>
                      <div className="text-xs text-muted-foreground">
                        {selector.type} • Score: {selector.score || 'N/A'}%
                      </div>
                    </label>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="text-sm text-muted-foreground">
              {selectedSelectors.length} av {selectors.length} valgt
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Export Options & Preview */}
      <Card className="col-span-2">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Eksport Innstillinger</CardTitle>
              <CardDescription>Konfigurer eksportformat og alternativer</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={copyToClipboard} data-testid="button-copy">
                <Copy className="w-4 h-4 mr-2" />
                Kopier
              </Button>
              <Button size="sm" onClick={downloadFile} data-testid="button-download">
                <Download className="w-4 h-4 mr-2" />
                Last ned
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="config">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="config" data-testid="tab-config">Konfigurasjon</TabsTrigger>
              <TabsTrigger value="preview" data-testid="tab-preview">Forhåndsvisning</TabsTrigger>
            </TabsList>

            <TabsContent value="config" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="format">Eksportformat</Label>
                  <Select value={exportFormat} onValueChange={setExportFormat}>
                    <SelectTrigger id="format" data-testid="select-format">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="playwright">
                        <div className="flex items-center gap-2">
                          <Terminal className="w-4 h-4" />
                          <span>Playwright</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="puppeteer">
                        <div className="flex items-center gap-2">
                          <Globe className="w-4 h-4" />
                          <span>Puppeteer</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="selenium">
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4" />
                          <span>Selenium</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="json">
                        <div className="flex items-center gap-2">
                          <FileJson className="w-4 h-4" />
                          <span>JSON</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {exportFormat !== 'json' && (
                  <div>
                    <Label htmlFor="language">Programmeringsspråk</Label>
                    <Select value={exportLanguage} onValueChange={setExportLanguage}>
                      <SelectTrigger id="language" data-testid="select-language">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="javascript">JavaScript</SelectItem>
                        <SelectItem value="python">Python</SelectItem>
                        {exportFormat === 'selenium' && (
                          <SelectItem value="java">Java</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              {exportFormat !== 'json' && (
                <div className="space-y-3">
                  <h4 className="font-medium text-sm">Eksport Alternativer</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="comments"
                        checked={includeComments}
                        onCheckedChange={(checked) => setIncludeComments(!!checked)}
                      />
                      <Label htmlFor="comments" className="text-sm">
                        Inkluder kommentarer med selector metadata
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="waits"
                        checked={includeWaitStatements}
                        onCheckedChange={(checked) => setIncludeWaitStatements(!!checked)}
                      />
                      <Label htmlFor="waits" className="text-sm">
                        Inkluder wait/waitForSelector statements
                      </Label>
                    </div>
                  </div>
                </div>
              )}

              {/* Quick Templates */}
              <div className="space-y-3">
                <h4 className="font-medium text-sm">Hurtigmaler</h4>
                <div className="grid grid-cols-3 gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setExportFormat('playwright');
                      setExportLanguage('javascript');
                    }}
                    data-testid="template-playwright-js"
                  >
                    Playwright JS
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setExportFormat('puppeteer');
                      setExportLanguage('javascript');
                    }}
                    data-testid="template-puppeteer"
                  >
                    Puppeteer
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setExportFormat('selenium');
                      setExportLanguage('python');
                    }}
                    data-testid="template-selenium-py"
                  >
                    Selenium Python
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="preview">
              <ScrollArea className="h-[450px] border rounded-lg bg-black/5 dark:bg-white/5 p-4">
                <pre className="text-xs font-mono">
                  <code>{getGeneratedCode()}</code>
                </pre>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}