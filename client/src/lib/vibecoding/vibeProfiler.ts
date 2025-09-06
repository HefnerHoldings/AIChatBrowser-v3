// Vibe Profiler v3 - Comprehensive Project Configuration System

export interface TechStack {
  frontend: string[];
  backend: string[];
  database: string[];
  infrastructure: string[];
  tools: string[];
}

export interface QualityRequirements {
  codeQuality: {
    linting: boolean;
    formatting: boolean;
    coverage: number; // percentage
    complexity: 'low' | 'medium' | 'high';
  };
  performance: {
    loadTime: number; // ms
    responseTime: number; // ms
    throughput: number; // requests per second
  };
  accessibility: {
    wcagLevel: 'A' | 'AA' | 'AAA';
    screenReaderSupport: boolean;
  };
  security: {
    authentication: boolean;
    encryption: boolean;
    rateLimit: boolean;
    contentPolicy: string[];
  };
}

export interface ProjectConstraints {
  budget: {
    amount: number;
    currency: string;
    flexibility: 'strict' | 'flexible' | 'negotiable';
  };
  timeline: {
    deadline: Date;
    milestones: Milestone[];
    criticalPath: string[];
  };
  team: {
    size: number;
    skills: string[];
    availability: Map<string, number>; // person -> hours per week
  };
  technical: {
    browserSupport: string[];
    deviceSupport: string[];
    apiLimits: Map<string, number>;
    storageQuota: number; // MB
  };
}

export interface Milestone {
  id: string;
  name: string;
  date: Date;
  deliverables: string[];
  dependencies: string[];
  status: 'pending' | 'in-progress' | 'completed' | 'delayed';
}

export interface ProjectVibe {
  mood: 'professional' | 'playful' | 'serious' | 'creative' | 'minimal';
  pace: 'slow' | 'moderate' | 'fast' | 'agile';
  communication: 'formal' | 'casual' | 'technical' | 'simple';
  innovation: 'conservative' | 'balanced' | 'experimental';
  collaboration: 'independent' | 'cooperative' | 'highly-collaborative';
}

export interface VibeProfile {
  id: string;
  name: string;
  description: string;
  created: Date;
  updated: Date;
  version: string;
  stack: TechStack;
  requirements: QualityRequirements;
  constraints: ProjectConstraints;
  vibe: ProjectVibe;
  customRules: CustomRule[];
  aiGuidance: AIGuidance;
}

export interface CustomRule {
  id: string;
  name: string;
  condition: string; // JavaScript expression
  action: string; // What to do when condition is met
  priority: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
}

export interface AIGuidance {
  preferredModels: string[];
  temperature: number; // 0.0 - 1.0
  maxTokens: number;
  systemPrompt: string;
  examples: Example[];
  restrictions: string[];
}

export interface Example {
  input: string;
  output: string;
  context: string;
}

export class VibeProfiler {
  private profiles: Map<string, VibeProfile> = new Map();
  private activeProfile: VibeProfile | null = null;
  private templates: Map<string, Partial<VibeProfile>> = new Map();

  constructor() {
    this.initializeTemplates();
  }

  private initializeTemplates() {
    // Startup template - Fast and lean
    this.templates.set('startup', {
      name: 'Startup Sprint',
      stack: {
        frontend: ['React', 'Tailwind CSS', 'Vite'],
        backend: ['Node.js', 'Express', 'PostgreSQL'],
        database: ['PostgreSQL', 'Redis'],
        infrastructure: ['Vercel', 'Railway'],
        tools: ['GitHub', 'Linear', 'Slack']
      },
      vibe: {
        mood: 'creative',
        pace: 'fast',
        communication: 'casual',
        innovation: 'experimental',
        collaboration: 'highly-collaborative'
      }
    });

    // Enterprise template - Robust and secure
    this.templates.set('enterprise', {
      name: 'Enterprise Grade',
      stack: {
        frontend: ['Angular', 'Material UI', 'Webpack'],
        backend: ['Java Spring', 'Kubernetes', 'Oracle'],
        database: ['Oracle', 'MongoDB', 'Elasticsearch'],
        infrastructure: ['AWS', 'Docker', 'Jenkins'],
        tools: ['Jira', 'Confluence', 'Teams']
      },
      vibe: {
        mood: 'professional',
        pace: 'moderate',
        communication: 'formal',
        innovation: 'conservative',
        collaboration: 'cooperative'
      }
    });

    // Creative template - Design-focused
    this.templates.set('creative', {
      name: 'Creative Studio',
      stack: {
        frontend: ['Next.js', 'Framer Motion', 'Three.js'],
        backend: ['Strapi', 'GraphQL', 'Cloudinary'],
        database: ['PostgreSQL', 'DynamoDB'],
        infrastructure: ['Netlify', 'Cloudflare'],
        tools: ['Figma', 'Notion', 'Discord']
      },
      vibe: {
        mood: 'playful',
        pace: 'moderate',
        communication: 'casual',
        innovation: 'experimental',
        collaboration: 'highly-collaborative'
      }
    });
  }

  createProfile(
    name: string,
    templateName?: string
  ): VibeProfile {
    const template = templateName ? this.templates.get(templateName) : {};
    
    const profile: VibeProfile = {
      id: crypto.randomUUID(),
      name,
      description: '',
      created: new Date(),
      updated: new Date(),
      version: '1.0.0',
      stack: template?.stack || {
        frontend: [],
        backend: [],
        database: [],
        infrastructure: [],
        tools: []
      },
      requirements: {
        codeQuality: {
          linting: true,
          formatting: true,
          coverage: 80,
          complexity: 'medium'
        },
        performance: {
          loadTime: 3000,
          responseTime: 200,
          throughput: 100
        },
        accessibility: {
          wcagLevel: 'AA',
          screenReaderSupport: true
        },
        security: {
          authentication: true,
          encryption: true,
          rateLimit: true,
          contentPolicy: ['default-src', 'script-src', 'style-src']
        }
      },
      constraints: {
        budget: {
          amount: 10000,
          currency: 'USD',
          flexibility: 'flexible'
        },
        timeline: {
          deadline: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
          milestones: [],
          criticalPath: []
        },
        team: {
          size: 3,
          skills: [],
          availability: new Map()
        },
        technical: {
          browserSupport: ['Chrome', 'Firefox', 'Safari', 'Edge'],
          deviceSupport: ['desktop', 'tablet', 'mobile'],
          apiLimits: new Map(),
          storageQuota: 1000 // 1GB
        }
      },
      vibe: template?.vibe || {
        mood: 'professional',
        pace: 'moderate',
        communication: 'technical',
        innovation: 'balanced',
        collaboration: 'cooperative'
      },
      customRules: [],
      aiGuidance: {
        preferredModels: ['gpt-4-turbo-preview', 'claude-3-opus'],
        temperature: 0.7,
        maxTokens: 4000,
        systemPrompt: 'You are an expert developer following the vibe profile constraints.',
        examples: [],
        restrictions: []
      }
    };

    this.profiles.set(profile.id, profile);
    return profile;
  }

  activateProfile(profileId: string): boolean {
    const profile = this.profiles.get(profileId);
    if (profile) {
      this.activeProfile = profile;
      return true;
    }
    return false;
  }

  getActiveProfile(): VibeProfile | null {
    return this.activeProfile;
  }

  updateProfile(profileId: string, updates: Partial<VibeProfile>): VibeProfile | null {
    const profile = this.profiles.get(profileId);
    if (profile) {
      const updatedProfile = {
        ...profile,
        ...updates,
        updated: new Date()
      };
      this.profiles.set(profileId, updatedProfile);
      if (this.activeProfile?.id === profileId) {
        this.activeProfile = updatedProfile;
      }
      return updatedProfile;
    }
    return null;
  }

  validateAgainstProfile(
    action: any,
    profile?: VibeProfile
  ): { valid: boolean; violations: string[] } {
    const targetProfile = profile || this.activeProfile;
    if (!targetProfile) {
      return { valid: true, violations: [] };
    }

    const violations: string[] = [];

    // Check quality requirements
    if (action.type === 'code' && action.coverage < targetProfile.requirements.codeQuality.coverage) {
      violations.push(`Code coverage ${action.coverage}% is below required ${targetProfile.requirements.codeQuality.coverage}%`);
    }

    // Check performance requirements
    if (action.type === 'performance' && action.loadTime > targetProfile.requirements.performance.loadTime) {
      violations.push(`Load time ${action.loadTime}ms exceeds limit of ${targetProfile.requirements.performance.loadTime}ms`);
    }

    // Check custom rules
    for (const rule of targetProfile.customRules) {
      if (rule.enabled && !this.evaluateRule(rule, action)) {
        violations.push(`Custom rule violation: ${rule.name}`);
      }
    }

    return {
      valid: violations.length === 0,
      violations
    };
  }

  private evaluateRule(rule: CustomRule, action: any): boolean {
    try {
      // Safely evaluate the rule condition
      const conditionFunction = new Function('action', `return ${rule.condition}`);
      return conditionFunction(action);
    } catch (error) {
      console.error(`Error evaluating rule ${rule.name}:`, error);
      return true; // Pass by default on error
    }
  }

  suggestOptimizations(profile?: VibeProfile): string[] {
    const targetProfile = profile || this.activeProfile;
    if (!targetProfile) {
      return [];
    }

    const suggestions: string[] = [];

    // Analyze stack compatibility
    if (targetProfile.stack.frontend.includes('React') && !targetProfile.stack.tools.includes('ESLint')) {
      suggestions.push('Add ESLint for better code quality with React');
    }

    // Check performance vs vibe alignment
    if (targetProfile.vibe.pace === 'fast' && targetProfile.requirements.codeQuality.coverage > 90) {
      suggestions.push('Consider reducing coverage requirements for faster development pace');
    }

    // Security recommendations
    if (targetProfile.requirements.security.authentication && !targetProfile.stack.backend.includes('JWT')) {
      suggestions.push('Consider implementing JWT for authentication');
    }

    // Team size vs complexity
    if (targetProfile.constraints.team.size < 3 && targetProfile.requirements.codeQuality.complexity === 'high') {
      suggestions.push('High complexity projects typically need larger teams');
    }

    return suggestions;
  }

  exportProfile(profileId: string): string | null {
    const profile = this.profiles.get(profileId);
    if (profile) {
      return JSON.stringify(profile, (key, value) => {
        if (value instanceof Map) {
          return Array.from(value.entries());
        }
        return value;
      }, 2);
    }
    return null;
  }

  importProfile(jsonString: string): VibeProfile | null {
    try {
      const parsed = JSON.parse(jsonString, (key, value) => {
        if (key === 'availability' || key === 'apiLimits') {
          return new Map(value);
        }
        if (key === 'created' || key === 'updated' || key === 'deadline') {
          return new Date(value);
        }
        return value;
      });
      
      const profile = parsed as VibeProfile;
      profile.id = crypto.randomUUID(); // Generate new ID
      profile.created = new Date();
      profile.updated = new Date();
      
      this.profiles.set(profile.id, profile);
      return profile;
    } catch (error) {
      console.error('Error importing profile:', error);
      return null;
    }
  }

  getTemplates(): Map<string, Partial<VibeProfile>> {
    return new Map(this.templates);
  }

  getAllProfiles(): VibeProfile[] {
    return Array.from(this.profiles.values());
  }
}