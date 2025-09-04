import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import { motion } from 'framer-motion';
import { 
  Settings,
  Code2,
  Shield,
  Gauge,
  FileCode2,
  Package,
  Lock,
  Palette,
  GitBranch,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Sparkles,
  Save,
  Upload,
  Download,
  Copy,
  Plus
} from 'lucide-react';

// Vibe Profile v3 Schema
export interface VibeProfile {
  name: string;
  version: string;
  inherits?: string;
  stack: {
    language: 'typescript' | 'javascript' | 'python' | 'csharp' | 'rust';
    framework: string;
    css?: string;
    database?: string;
    deployment?: string;
  };
  quality: {
    lighthouse: {
      desktop_min: number;
      mobile_min: number;
    };
    a11y_block: string[];
    test: {
      unit: string;
      e2e: string;
      coverage_min?: number;
    };
    perf_budget: {
      lcp_ms: number;
      tbt_ms: number;
      cls: number;
      fid_ms?: number;
    };
  };
  security: {
    deps: {
      audit: string;
      fail_on_severity: 'low' | 'moderate' | 'high' | 'critical';
    };
    headers: string[];
    secrets_scan: boolean;
    sast_enabled?: boolean;
  };
  style: {
    rules: string[];
    linter: string;
    formatter: string;
    naming_convention?: string;
  };
  constraints: {
    deps_max: number;
    pages_min: string[];
    bundle_size_kb?: number;
    api_response_ms?: number;
  };
  features?: {
    i18n?: boolean;
    pwa?: boolean;
    offline?: boolean;
    realtime?: boolean;
  };
}

// Preset Profiles
const PRESET_PROFILES: VibeProfile[] = [
  {
    name: 'next_tailwind_secure_v3',
    version: '3.0.0',
    stack: {
      language: 'typescript',
      framework: 'nextjs',
      css: 'tailwind',
      database: 'postgresql',
      deployment: 'vercel'
    },
    quality: {
      lighthouse: { desktop_min: 90, mobile_min: 80 },
      a11y_block: ['critical'],
      test: { unit: 'jest', e2e: 'playwright', coverage_min: 80 },
      perf_budget: { lcp_ms: 2500, tbt_ms: 200, cls: 0.1, fid_ms: 100 }
    },
    security: {
      deps: { audit: 'snyk', fail_on_severity: 'high' },
      headers: ['csp_strict', 'hsts', 'xfo_sameorigin'],
      secrets_scan: true,
      sast_enabled: true
    },
    style: {
      rules: ['no_any', 'prefer_const', 'early_return', 'module_boundaries'],
      linter: 'eslint',
      formatter: 'prettier'
    },
    constraints: {
      deps_max: 14,
      pages_min: ['/', '/pricing', '/contact'],
      bundle_size_kb: 500
    },
    features: {
      i18n: true,
      pwa: true,
      offline: false,
      realtime: false
    }
  },
  {
    name: 'fastapi_ml_optimized',
    version: '3.0.0',
    stack: {
      language: 'python',
      framework: 'fastapi',
      database: 'mongodb',
      deployment: 'kubernetes'
    },
    quality: {
      lighthouse: { desktop_min: 85, mobile_min: 75 },
      a11y_block: ['critical', 'serious'],
      test: { unit: 'pytest', e2e: 'selenium', coverage_min: 75 },
      perf_budget: { lcp_ms: 3000, tbt_ms: 300, cls: 0.15 }
    },
    security: {
      deps: { audit: 'safety', fail_on_severity: 'moderate' },
      headers: ['cors_configured', 'rate_limiting'],
      secrets_scan: true
    },
    style: {
      rules: ['type_hints', 'docstrings', 'pep8'],
      linter: 'pylint',
      formatter: 'black'
    },
    constraints: {
      deps_max: 25,
      pages_min: ['/api/docs'],
      api_response_ms: 200
    }
  }
];

export function VibeProfiler() {
  const [selectedProfile, setSelectedProfile] = useState<VibeProfile>(PRESET_PROFILES[0]);
  const [editMode, setEditMode] = useState(false);
  const [validationResults, setValidationResults] = useState<any[]>([]);

  // Validate Profile
  const validateProfile = () => {
    const results = [];
    
    // Check Lighthouse scores
    if (selectedProfile.quality.lighthouse.desktop_min < 70) {
      results.push({ type: 'warning', message: 'Desktop Lighthouse score below recommended minimum (70)' });
    }
    
    // Check security settings
    if (!selectedProfile.security.secrets_scan) {
      results.push({ type: 'error', message: 'Secrets scanning is disabled - security risk!' });
    }
    
    // Check test coverage
    if (selectedProfile.quality.test.coverage_min && selectedProfile.quality.test.coverage_min < 60) {
      results.push({ type: 'warning', message: 'Test coverage below 60% may lead to quality issues' });
    }
    
    // Check performance budget
    if (selectedProfile.quality.perf_budget.lcp_ms > 4000) {
      results.push({ type: 'warning', message: 'LCP budget exceeds 4s - may impact user experience' });
    }
    
    setValidationResults(results);
    return results.filter(r => r.type === 'error').length === 0;
  };

  // Export Profile as YAML
  const exportProfile = () => {
    const yaml = JSON.stringify(selectedProfile, null, 2); // Simplified - would use proper YAML library
    const blob = new Blob([yaml], { type: 'application/yaml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedProfile.name}.yaml`;
    a.click();
  };

  return (
    <div className="h-full flex flex-col space-y-4 p-4">
      {/* Profile Header */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Settings className="h-6 w-6 text-primary" />
            <div>
              <h2 className="text-xl font-bold">Vibe Profiler v3</h2>
              <p className="text-sm text-muted-foreground">Define stack, style, quality requirements & constraints</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setEditMode(!editMode)}>
              {editMode ? <Lock className="h-4 w-4 mr-2" /> : <Code2 className="h-4 w-4 mr-2" />}
              {editMode ? 'Lock' : 'Edit'}
            </Button>
            <Button variant="outline" size="sm" onClick={exportProfile}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button size="sm" onClick={validateProfile}>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Validate
            </Button>
          </div>
        </div>

        {/* Profile Selector */}
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <Label>Active Profile</Label>
            <Select value={selectedProfile.name} onValueChange={(value) => {
              const profile = PRESET_PROFILES.find(p => p.name === value);
              if (profile) setSelectedProfile(profile);
            }}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRESET_PROFILES.map(profile => (
                  <SelectItem key={profile.name} value={profile.name}>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {profile.stack.language}
                      </Badge>
                      {profile.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {selectedProfile.inherits && (
            <div className="flex items-center gap-2">
              <GitBranch className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Inherits from: {selectedProfile.inherits}</span>
            </div>
          )}
          
          <Badge variant="secondary">v{selectedProfile.version}</Badge>
        </div>
      </Card>

      <Tabs defaultValue="stack" className="flex-1">
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="stack">
            <Layers className="h-4 w-4 mr-2" />
            Stack
          </TabsTrigger>
          <TabsTrigger value="quality">
            <Gauge className="h-4 w-4 mr-2" />
            Quality
          </TabsTrigger>
          <TabsTrigger value="security">
            <Shield className="h-4 w-4 mr-2" />
            Security
          </TabsTrigger>
          <TabsTrigger value="style">
            <Palette className="h-4 w-4 mr-2" />
            Style
          </TabsTrigger>
          <TabsTrigger value="constraints">
            <Lock className="h-4 w-4 mr-2" />
            Constraints
          </TabsTrigger>
        </TabsList>

        {/* Stack Configuration */}
        <TabsContent value="stack" className="p-4">
          <Card className="p-4">
            <h3 className="font-semibold mb-4">Technology Stack</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Language</Label>
                <Select value={selectedProfile.stack.language} disabled={!editMode}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="typescript">TypeScript</SelectItem>
                    <SelectItem value="javascript">JavaScript</SelectItem>
                    <SelectItem value="python">Python</SelectItem>
                    <SelectItem value="csharp">C#</SelectItem>
                    <SelectItem value="rust">Rust</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Framework</Label>
                <Input value={selectedProfile.stack.framework} disabled={!editMode} />
              </div>
              
              <div>
                <Label>CSS Framework</Label>
                <Input value={selectedProfile.stack.css || ''} disabled={!editMode} />
              </div>
              
              <div>
                <Label>Database</Label>
                <Input value={selectedProfile.stack.database || ''} disabled={!editMode} />
              </div>
              
              <div>
                <Label>Deployment Target</Label>
                <Input value={selectedProfile.stack.deployment || ''} disabled={!editMode} />
              </div>
            </div>

            {/* Features */}
            <div className="mt-6">
              <h4 className="font-medium mb-3">Features</h4>
              <div className="grid grid-cols-4 gap-4">
                <div className="flex items-center justify-between">
                  <Label>i18n</Label>
                  <Switch checked={selectedProfile.features?.i18n} disabled={!editMode} />
                </div>
                <div className="flex items-center justify-between">
                  <Label>PWA</Label>
                  <Switch checked={selectedProfile.features?.pwa} disabled={!editMode} />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Offline</Label>
                  <Switch checked={selectedProfile.features?.offline} disabled={!editMode} />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Realtime</Label>
                  <Switch checked={selectedProfile.features?.realtime} disabled={!editMode} />
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Quality Requirements */}
        <TabsContent value="quality" className="p-4">
          <Card className="p-4">
            <h3 className="font-semibold mb-4">Quality Requirements</h3>
            
            {/* Lighthouse Scores */}
            <div className="mb-6">
              <h4 className="font-medium mb-3">Lighthouse Minimum Scores</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Desktop ({selectedProfile.quality.lighthouse.desktop_min})</Label>
                  <Slider 
                    value={[selectedProfile.quality.lighthouse.desktop_min]} 
                    min={0} 
                    max={100} 
                    disabled={!editMode}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label>Mobile ({selectedProfile.quality.lighthouse.mobile_min})</Label>
                  <Slider 
                    value={[selectedProfile.quality.lighthouse.mobile_min]} 
                    min={0} 
                    max={100} 
                    disabled={!editMode}
                    className="mt-2"
                  />
                </div>
              </div>
            </div>

            {/* Performance Budget */}
            <div className="mb-6">
              <h4 className="font-medium mb-3">Performance Budget</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>LCP (ms)</Label>
                  <Input type="number" value={selectedProfile.quality.perf_budget.lcp_ms} disabled={!editMode} />
                </div>
                <div>
                  <Label>TBT (ms)</Label>
                  <Input type="number" value={selectedProfile.quality.perf_budget.tbt_ms} disabled={!editMode} />
                </div>
                <div>
                  <Label>CLS</Label>
                  <Input type="number" value={selectedProfile.quality.perf_budget.cls} step="0.01" disabled={!editMode} />
                </div>
                <div>
                  <Label>FID (ms)</Label>
                  <Input type="number" value={selectedProfile.quality.perf_budget.fid_ms || ''} disabled={!editMode} />
                </div>
              </div>
            </div>

            {/* Testing */}
            <div>
              <h4 className="font-medium mb-3">Testing Configuration</h4>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Unit Test Framework</Label>
                  <Input value={selectedProfile.quality.test.unit} disabled={!editMode} />
                </div>
                <div>
                  <Label>E2E Test Framework</Label>
                  <Input value={selectedProfile.quality.test.e2e} disabled={!editMode} />
                </div>
                <div>
                  <Label>Min Coverage %</Label>
                  <Input type="number" value={selectedProfile.quality.test.coverage_min || ''} disabled={!editMode} />
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security" className="p-4">
          <Card className="p-4">
            <h3 className="font-semibold mb-4">Security Configuration</h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Dependency Audit Tool</Label>
                  <Input value={selectedProfile.security.deps.audit} disabled={!editMode} />
                </div>
                <div>
                  <Label>Fail on Severity</Label>
                  <Select value={selectedProfile.security.deps.fail_on_severity} disabled={!editMode}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="moderate">Moderate</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Security Headers</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedProfile.security.headers.map(header => (
                    <Badge key={header} variant="secondary">
                      {header}
                    </Badge>
                  ))}
                  {editMode && (
                    <Button variant="outline" size="sm">
                      <Plus className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Label>Secrets Scanning</Label>
                <Switch checked={selectedProfile.security.secrets_scan} disabled={!editMode} />
              </div>

              <div className="flex items-center justify-between">
                <Label>SAST Enabled</Label>
                <Switch checked={selectedProfile.security.sast_enabled} disabled={!editMode} />
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Style Rules */}
        <TabsContent value="style" className="p-4">
          <Card className="p-4">
            <h3 className="font-semibold mb-4">Code Style & Quality</h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Linter</Label>
                  <Input value={selectedProfile.style.linter} disabled={!editMode} />
                </div>
                <div>
                  <Label>Formatter</Label>
                  <Input value={selectedProfile.style.formatter} disabled={!editMode} />
                </div>
              </div>

              <div>
                <Label>Style Rules</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedProfile.style.rules.map(rule => (
                    <Badge key={rule} variant="outline">
                      {rule}
                    </Badge>
                  ))}
                  {editMode && (
                    <Button variant="outline" size="sm">
                      <Plus className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Constraints */}
        <TabsContent value="constraints" className="p-4">
          <Card className="p-4">
            <h3 className="font-semibold mb-4">Project Constraints</h3>
            
            <div className="space-y-4">
              <div>
                <Label>Max Dependencies</Label>
                <Input type="number" value={selectedProfile.constraints.deps_max} disabled={!editMode} />
              </div>

              <div>
                <Label>Minimum Required Pages</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedProfile.constraints.pages_min.map(page => (
                    <Badge key={page} variant="secondary">
                      {page}
                    </Badge>
                  ))}
                  {editMode && (
                    <Button variant="outline" size="sm">
                      <Plus className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Max Bundle Size (KB)</Label>
                  <Input type="number" value={selectedProfile.constraints.bundle_size_kb || ''} disabled={!editMode} />
                </div>
                <div>
                  <Label>Max API Response (ms)</Label>
                  <Input type="number" value={selectedProfile.constraints.api_response_ms || ''} disabled={!editMode} />
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Validation Results */}
      {validationResults.length > 0 && (
        <Card className="p-4">
          <h3 className="font-semibold mb-3">Validation Results</h3>
          <div className="space-y-2">
            {validationResults.map((result, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className={`flex items-center gap-2 p-2 rounded ${
                  result.type === 'error' ? 'bg-red-50 dark:bg-red-900/20' : 'bg-yellow-50 dark:bg-yellow-900/20'
                }`}
              >
                {result.type === 'error' ? (
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                )}
                <span className="text-sm">{result.message}</span>
              </motion.div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}