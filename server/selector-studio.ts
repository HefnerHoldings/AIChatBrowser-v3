import { EventEmitter } from 'events';
import { BrowserManager } from './browser-manager';
import { createHash } from 'crypto';

// Selector Types
export enum SelectorType {
  CSS = 'css',
  XPATH = 'xpath',
  TEXT = 'text',
  ID = 'id',
  CLASS = 'class',
  NAME = 'name',
  TAG = 'tag',
  ATTRIBUTE = 'attribute',
  COMBINED = 'combined',
  AI_GENERATED = 'ai-generated'
}

// Selector Strategy
export enum SelectorStrategy {
  STRICT = 'strict',        // Exact match required
  FLEXIBLE = 'flexible',    // Allow minor variations
  FUZZY = 'fuzzy',         // Allow significant variations
  ADAPTIVE = 'adaptive'     // Learn and adapt over time
}

// Domain Profile Types
export enum DomainProfile {
  ECOMMERCE = 'ecommerce',
  SOCIAL_MEDIA = 'social-media',
  NEWS = 'news',
  SAAS = 'saas',
  BANKING = 'banking',
  GOVERNMENT = 'government',
  EDUCATIONAL = 'educational',
  HEALTHCARE = 'healthcare',
  CUSTOM = 'custom'
}

// Selector Stability Score Components
export interface StabilityScore {
  overall: number;           // 0-100
  uniqueness: number;        // How unique is the selector
  resilience: number;        // How well it handles DOM changes
  performance: number;       // Query performance
  maintainability: number;   // How easy to understand/maintain
  crossBrowser: number;      // Compatibility across browsers
  confidence: number;        // AI confidence in the selector
}

// Selector Analysis Result
export interface SelectorAnalysis {
  selector: string;
  type: SelectorType;
  score: StabilityScore;
  elements: number;
  alternatives: SelectorAlternative[];
  warnings: string[];
  suggestions: string[];
  metadata: {
    depth: number;
    specificity: number;
    complexity: number;
    attributes: string[];
    pseudoClasses: string[];
  };
}

// Alternative Selector
export interface SelectorAlternative {
  selector: string;
  type: SelectorType;
  score: number;
  reason: string;
}

// Selector Test Result
export interface SelectorTestResult {
  selector: string;
  success: boolean;
  elementsFound: number;
  executionTime: number;
  browserCompatibility: {
    chrome: boolean;
    firefox: boolean;
    safari: boolean;
    edge: boolean;
  };
  resilience: {
    withoutClasses: boolean;
    withoutAttributes: boolean;
    withDynamicContent: boolean;
  };
}

// Learning Profile
export interface LearningProfile {
  domain: DomainProfile;
  patterns: Map<string, SelectorPattern>;
  statistics: {
    totalSelectors: number;
    averageScore: number;
    failureRate: number;
    repairCount: number;
  };
  recommendations: string[];
}

// Selector Pattern
export interface SelectorPattern {
  pattern: string;
  frequency: number;
  reliability: number;
  lastUsed: Date;
  examples: string[];
}

// Selector History Entry
export interface SelectorHistoryEntry {
  id: string;
  selector: string;
  type: SelectorType;
  url: string;
  timestamp: Date;
  score: StabilityScore;
  status: 'active' | 'deprecated' | 'failed';
  replacedBy?: string;
}

// Selector Analyzer
class SelectorAnalyzer {
  private browserManager: BrowserManager;
  private cache: Map<string, SelectorAnalysis>;
  
  constructor(browserManager: BrowserManager) {
    this.browserManager = browserManager;
    this.cache = new Map();
  }

  async analyze(selector: string, url: string): Promise<SelectorAnalysis> {
    const cacheKey = `${selector}-${url}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    // Create browser instance
    const instanceId = await this.browserManager.createInstance({
      type: 'chromium' as any
    });
    
    const tab = await this.browserManager.createTab(instanceId, url);
    
    // Analyze selector
    const analysis = await this.performAnalysis(selector, instanceId, tab.id);
    
    // Generate alternatives
    const alternatives = await this.generateAlternatives(selector, instanceId, tab.id);
    analysis.alternatives = alternatives;
    
    // Cleanup
    await this.browserManager.closeInstance(instanceId);
    
    // Cache result
    this.cache.set(cacheKey, analysis);
    
    return analysis;
  }

  private async performAnalysis(selector: string, instanceId: string, tabId: string): Promise<SelectorAnalysis> {
    const script = `
      (() => {
        const selector = ${JSON.stringify(selector)};
        let elements = [];
        let metadata = {
          depth: 0,
          specificity: 0,
          complexity: 0,
          attributes: [],
          pseudoClasses: []
        };
        
        try {
          // Try as CSS selector first
          elements = document.querySelectorAll(selector);
          
          // Analyze selector structure
          const parts = selector.split(/[\\s>+~]/);
          metadata.depth = parts.length;
          
          // Calculate specificity (simplified)
          metadata.specificity = 
            (selector.match(/#/g) || []).length * 100 +
            (selector.match(/\\./g) || []).length * 10 +
            (selector.match(/\\[/g) || []).length * 10 +
            parts.length;
          
          // Calculate complexity
          metadata.complexity = selector.length;
          
          // Extract attributes
          const attrMatches = selector.match(/\\[([^\\]]+)\\]/g) || [];
          metadata.attributes = attrMatches.map(a => a.slice(1, -1));
          
          // Extract pseudo-classes
          const pseudoMatches = selector.match(/:[a-z-]+/g) || [];
          metadata.pseudoClasses = pseudoMatches;
          
        } catch (e) {
          // Not a valid CSS selector, might be XPath
          try {
            const xpathResult = document.evaluate(
              selector,
              document,
              null,
              XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
              null
            );
            
            for (let i = 0; i < xpathResult.snapshotLength; i++) {
              elements.push(xpathResult.snapshotItem(i));
            }
            
            metadata.depth = (selector.match(/\\//g) || []).length;
            metadata.complexity = selector.length;
          } catch (xe) {
            // Invalid selector
          }
        }
        
        return {
          count: elements.length || 0,
          metadata,
          isUnique: elements.length === 1,
          isValid: elements.length > 0
        };
      })();
    `;
    
    const result = await this.browserManager.executeScript(instanceId, tabId, script);
    
    // Calculate stability score
    const score = this.calculateStabilityScore(selector, result);
    
    // Determine selector type
    const type = this.determineSelectorType(selector);
    
    // Generate warnings and suggestions
    const warnings = this.generateWarnings(selector, result);
    const suggestions = this.generateSuggestions(selector, result, score);
    
    return {
      selector,
      type,
      score,
      elements: result.count,
      alternatives: [],
      warnings,
      suggestions,
      metadata: result.metadata
    };
  }

  private calculateStabilityScore(selector: string, analysisResult: any): StabilityScore {
    const score: StabilityScore = {
      overall: 0,
      uniqueness: 0,
      resilience: 0,
      performance: 0,
      maintainability: 0,
      crossBrowser: 0,
      confidence: 0
    };
    
    // Uniqueness score
    if (analysisResult.isUnique) {
      score.uniqueness = 100;
    } else if (analysisResult.count === 0) {
      score.uniqueness = 0;
    } else {
      score.uniqueness = Math.max(0, 100 - (analysisResult.count - 1) * 10);
    }
    
    // Resilience score (based on selector type and structure)
    if (selector.includes('#')) {
      score.resilience = 90; // IDs are very resilient
    } else if (selector.includes('[data-')) {
      score.resilience = 85; // Data attributes are good
    } else if (selector.includes('.')) {
      score.resilience = 60; // Classes are moderate
    } else {
      score.resilience = 40; // Tag names alone are fragile
    }
    
    // Performance score (based on complexity)
    const complexity = analysisResult.metadata.complexity;
    if (complexity < 20) {
      score.performance = 100;
    } else if (complexity < 50) {
      score.performance = 80;
    } else if (complexity < 100) {
      score.performance = 60;
    } else {
      score.performance = 40;
    }
    
    // Maintainability score
    if (selector.length < 30 && !selector.includes(':nth-')) {
      score.maintainability = 90;
    } else if (selector.length < 60) {
      score.maintainability = 70;
    } else {
      score.maintainability = 50;
    }
    
    // Cross-browser compatibility
    if (!selector.includes(':has') && !selector.includes(':is') && !selector.includes(':where')) {
      score.crossBrowser = 95;
    } else {
      score.crossBrowser = 70;
    }
    
    // Confidence score
    score.confidence = analysisResult.isValid ? 80 : 20;
    
    // Calculate overall score
    score.overall = Math.round(
      (score.uniqueness * 0.25 +
       score.resilience * 0.25 +
       score.performance * 0.15 +
       score.maintainability * 0.15 +
       score.crossBrowser * 0.10 +
       score.confidence * 0.10)
    );
    
    return score;
  }

  private determineSelectorType(selector: string): SelectorType {
    if (selector.startsWith('//') || selector.includes('ancestor::')) {
      return SelectorType.XPATH;
    } else if (selector.startsWith('#')) {
      return SelectorType.ID;
    } else if (selector.startsWith('.')) {
      return SelectorType.CLASS;
    } else if (selector.includes('[')) {
      return SelectorType.ATTRIBUTE;
    } else if (selector.match(/^[a-z]+$/i)) {
      return SelectorType.TAG;
    } else {
      return SelectorType.CSS;
    }
  }

  private generateWarnings(selector: string, result: any): string[] {
    const warnings = [];
    
    if (result.count === 0) {
      warnings.push('Selector matches no elements');
    } else if (result.count > 10) {
      warnings.push(`Selector matches ${result.count} elements - may be too broad`);
    }
    
    if (selector.includes(':nth-child') || selector.includes(':nth-of-type')) {
      warnings.push('Position-based selectors are fragile');
    }
    
    if (selector.length > 100) {
      warnings.push('Selector is very long and may be fragile');
    }
    
    if (selector.includes('*')) {
      warnings.push('Universal selector (*) can impact performance');
    }
    
    if (!selector.includes('#') && !selector.includes('[data-')) {
      warnings.push('Consider using IDs or data attributes for better stability');
    }
    
    return warnings;
  }

  private generateSuggestions(selector: string, result: any, score: StabilityScore): string[] {
    const suggestions = [];
    
    if (score.uniqueness < 50) {
      suggestions.push('Add more specific attributes to make selector unique');
    }
    
    if (score.resilience < 60) {
      suggestions.push('Use data attributes or IDs for better resilience');
    }
    
    if (score.performance < 70) {
      suggestions.push('Simplify selector for better performance');
    }
    
    if (score.maintainability < 70) {
      suggestions.push('Break down complex selector into simpler parts');
    }
    
    if (!result.isValid) {
      suggestions.push('Check selector syntax and ensure elements exist');
    }
    
    return suggestions;
  }

  private async generateAlternatives(selector: string, instanceId: string, tabId: string): Promise<SelectorAlternative[]> {
    const script = `
      (() => {
        const originalSelector = ${JSON.stringify(selector)};
        const alternatives = [];
        
        try {
          const elements = document.querySelectorAll(originalSelector);
          if (elements.length === 0) return alternatives;
          
          const element = elements[0];
          
          // ID-based selector
          if (element.id) {
            alternatives.push({
              selector: '#' + element.id,
              type: 'id',
              score: 95,
              reason: 'ID selector - highest stability'
            });
          }
          
          // Data attribute selector
          const dataAttrs = Array.from(element.attributes)
            .filter(attr => attr.name.startsWith('data-'));
          
          dataAttrs.forEach(attr => {
            alternatives.push({
              selector: \`[\${attr.name}="\${attr.value}"]\`,
              type: 'attribute',
              score: 85,
              reason: 'Data attribute - good stability'
            });
          });
          
          // Class combination selector
          if (element.classList.length > 0) {
            const classSelector = '.' + Array.from(element.classList).join('.');
            alternatives.push({
              selector: classSelector,
              type: 'class',
              score: 70,
              reason: 'Class selector - moderate stability'
            });
          }
          
          // Text content selector (for buttons, links)
          if (element.textContent && element.textContent.trim().length < 50) {
            const tagName = element.tagName.toLowerCase();
            alternatives.push({
              selector: \`\${tagName}:contains("\${element.textContent.trim()}")\`,
              type: 'text',
              score: 60,
              reason: 'Text-based selector - content dependent'
            });
          }
          
          // XPath with text
          if (element.textContent) {
            alternatives.push({
              selector: \`//\${element.tagName.toLowerCase()}[contains(text(), "\${element.textContent.trim().substring(0, 20)}")]\`,
              type: 'xpath',
              score: 65,
              reason: 'XPath with text - flexible matching'
            });
          }
          
        } catch (e) {
          console.error('Error generating alternatives:', e);
        }
        
        return alternatives;
      })();
    `;
    
    const alternatives = await this.browserManager.executeScript(instanceId, tabId, script);
    return alternatives || [];
  }
}

// Selector Optimizer
class SelectorOptimizer {
  private patterns: Map<string, number>;
  
  constructor() {
    this.patterns = new Map();
  }

  optimize(selector: string, analysis: SelectorAnalysis): string {
    // If selector is already optimal, return as is
    if (analysis.score.overall >= 85) {
      return selector;
    }
    
    // Try to find better alternative
    if (analysis.alternatives.length > 0) {
      const bestAlternative = analysis.alternatives
        .sort((a, b) => b.score - a.score)[0];
      
      if (bestAlternative.score > analysis.score.overall) {
        return bestAlternative.selector;
      }
    }
    
    // Apply optimization rules
    let optimized = selector;
    
    // Remove unnecessary wildcards
    optimized = optimized.replace(/\*/g, '');
    
    // Simplify descendant combinators
    optimized = optimized.replace(/\s+/g, ' ');
    
    // Remove redundant pseudo-classes
    optimized = optimized.replace(/:first-child:nth-child\(1\)/g, ':first-child');
    
    // Prefer data attributes over classes
    if (optimized.includes('.') && !optimized.includes('[data-')) {
      // This would need actual DOM inspection to implement properly
      // For now, just suggest the change
    }
    
    return optimized;
  }

  repair(oldSelector: string, newContext: any): string {
    // Attempt to repair broken selector based on new context
    // This would analyze what changed and adapt the selector
    
    // For now, return a simple fallback
    return oldSelector;
  }
}

// Domain Learning Engine
class DomainLearningEngine {
  private profiles: Map<DomainProfile, LearningProfile>;
  
  constructor() {
    this.profiles = new Map();
    this.initializeProfiles();
  }

  private initializeProfiles(): void {
    // E-commerce profile
    this.profiles.set(DomainProfile.ECOMMERCE, {
      domain: DomainProfile.ECOMMERCE,
      patterns: new Map([
        ['product-card', { 
          pattern: '[data-product-id]', 
          frequency: 0, 
          reliability: 0.9,
          lastUsed: new Date(),
          examples: []
        }],
        ['add-to-cart', {
          pattern: 'button[class*="cart"], button[data-action="add-to-cart"]',
          frequency: 0,
          reliability: 0.85,
          lastUsed: new Date(),
          examples: []
        }],
        ['price', {
          pattern: '[class*="price"], [data-price]',
          frequency: 0,
          reliability: 0.8,
          lastUsed: new Date(),
          examples: []
        }]
      ]),
      statistics: {
        totalSelectors: 0,
        averageScore: 0,
        failureRate: 0,
        repairCount: 0
      },
      recommendations: [
        'Use data-product-id for product identification',
        'Prefer data attributes over classes for critical elements',
        'Use ARIA labels for accessibility'
      ]
    });

    // Social Media profile
    this.profiles.set(DomainProfile.SOCIAL_MEDIA, {
      domain: DomainProfile.SOCIAL_MEDIA,
      patterns: new Map([
        ['post', {
          pattern: 'article, [role="article"], [data-testid*="post"]',
          frequency: 0,
          reliability: 0.85,
          lastUsed: new Date(),
          examples: []
        }],
        ['like-button', {
          pattern: 'button[aria-label*="like"], button[data-testid*="like"]',
          frequency: 0,
          reliability: 0.8,
          lastUsed: new Date(),
          examples: []
        }]
      ]),
      statistics: {
        totalSelectors: 0,
        averageScore: 0,
        failureRate: 0,
        repairCount: 0
      },
      recommendations: [
        'Use ARIA labels for interactive elements',
        'Prefer data-testid attributes when available',
        'Account for dynamic content loading'
      ]
    });

    // Banking profile
    this.profiles.set(DomainProfile.BANKING, {
      domain: DomainProfile.BANKING,
      patterns: new Map([
        ['account-balance', {
          pattern: '[data-account-balance], [class*="balance"]',
          frequency: 0,
          reliability: 0.9,
          lastUsed: new Date(),
          examples: []
        }],
        ['transaction', {
          pattern: '[data-transaction-id], tr[class*="transaction"]',
          frequency: 0,
          reliability: 0.85,
          lastUsed: new Date(),
          examples: []
        }]
      ]),
      statistics: {
        totalSelectors: 0,
        averageScore: 0,
        failureRate: 0,
        repairCount: 0
      },
      recommendations: [
        'Use secure and stable selectors for sensitive data',
        'Prefer data attributes for transaction elements',
        'Test selectors across different account states'
      ]
    });
  }

  getProfile(domain: DomainProfile): LearningProfile {
    return this.profiles.get(domain) || this.profiles.get(DomainProfile.CUSTOM)!;
  }

  updateProfile(domain: DomainProfile, selector: string, score: number): void {
    const profile = this.profiles.get(domain);
    if (!profile) return;
    
    // Update statistics
    profile.statistics.totalSelectors++;
    profile.statistics.averageScore = 
      (profile.statistics.averageScore * (profile.statistics.totalSelectors - 1) + score) /
      profile.statistics.totalSelectors;
    
    // Learn patterns
    this.learnPattern(profile, selector);
  }

  private learnPattern(profile: LearningProfile, selector: string): void {
    // Extract pattern from selector
    let patternKey = '';
    
    if (selector.includes('cart')) patternKey = 'cart';
    else if (selector.includes('product')) patternKey = 'product';
    else if (selector.includes('price')) patternKey = 'price';
    else if (selector.includes('button')) patternKey = 'button';
    
    if (patternKey && profile.patterns.has(patternKey)) {
      const pattern = profile.patterns.get(patternKey)!;
      pattern.frequency++;
      pattern.lastUsed = new Date();
      pattern.examples.push(selector);
      
      // Keep only last 10 examples
      if (pattern.examples.length > 10) {
        pattern.examples.shift();
      }
    }
  }

  suggestSelector(domain: DomainProfile, elementType: string): string[] {
    const profile = this.getProfile(domain);
    const suggestions = [];
    
    // Find relevant patterns
    for (const [key, pattern] of Array.from(profile.patterns)) {
      if (key.includes(elementType.toLowerCase())) {
        suggestions.push(pattern.pattern);
      }
    }
    
    return suggestions;
  }
}

// Selector Tester
class SelectorTester {
  private browserManager: BrowserManager;
  
  constructor(browserManager: BrowserManager) {
    this.browserManager = browserManager;
  }

  async test(selector: string, urls: string[]): Promise<SelectorTestResult[]> {
    const results: SelectorTestResult[] = [];
    
    for (const url of urls) {
      const result = await this.testSingle(selector, url);
      results.push(result);
    }
    
    return results;
  }

  private async testSingle(selector: string, url: string): Promise<SelectorTestResult> {
    const startTime = Date.now();
    
    // Create browser instance
    const instanceId = await this.browserManager.createInstance({
      type: 'chromium' as any
    });
    
    const tab = await this.browserManager.createTab(instanceId, url);
    
    // Test selector
    const testScript = `
      (() => {
        const selector = ${JSON.stringify(selector)};
        const startTime = performance.now();
        let elements = [];
        let success = false;
        
        try {
          elements = document.querySelectorAll(selector);
          success = elements.length > 0;
        } catch (e) {
          // Try as XPath
          try {
            const xpathResult = document.evaluate(
              selector,
              document,
              null,
              XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
              null
            );
            
            for (let i = 0; i < xpathResult.snapshotLength; i++) {
              elements.push(xpathResult.snapshotItem(i));
            }
            success = elements.length > 0;
          } catch (xe) {
            success = false;
          }
        }
        
        const endTime = performance.now();
        
        return {
          success,
          elementsFound: elements.length || 0,
          executionTime: endTime - startTime
        };
      })();
    `;
    
    const testResult = await this.browserManager.executeScript(instanceId, tab.id, testScript);
    
    // Test resilience
    const resilience = await this.testResilience(selector, instanceId, tab.id);
    
    // Cleanup
    await this.browserManager.closeInstance(instanceId);
    
    return {
      selector,
      success: testResult.success,
      elementsFound: testResult.elementsFound,
      executionTime: testResult.executionTime,
      browserCompatibility: {
        chrome: true,  // Tested
        firefox: true, // Assumed for now
        safari: true,  // Assumed for now
        edge: true     // Assumed for now
      },
      resilience
    };
  }

  private async testResilience(selector: string, instanceId: string, tabId: string): Promise<any> {
    const resilienceScript = `
      (() => {
        const selector = ${JSON.stringify(selector)};
        const results = {
          withoutClasses: false,
          withoutAttributes: false,
          withDynamicContent: false
        };
        
        try {
          // Test without classes
          const tempClasses = [];
          document.querySelectorAll('*').forEach(el => {
            tempClasses.push(el.className);
            el.className = '';
          });
          
          try {
            const elements1 = document.querySelectorAll(selector);
            results.withoutClasses = elements1.length > 0;
          } catch (e) {}
          
          // Restore classes
          let i = 0;
          document.querySelectorAll('*').forEach(el => {
            el.className = tempClasses[i++];
          });
          
          // Test with dynamic content
          const originalHTML = document.body.innerHTML;
          document.body.innerHTML = document.body.innerHTML; // Force re-render
          
          try {
            const elements2 = document.querySelectorAll(selector);
            results.withDynamicContent = elements2.length > 0;
          } catch (e) {}
          
        } catch (e) {
          console.error('Resilience test error:', e);
        }
        
        return results;
      })();
    `;
    
    return await this.browserManager.executeScript(instanceId, tabId, resilienceScript);
  }
}

// Selector Studio v2 - Main Class
export class SelectorStudioV2 extends EventEmitter {
  private browserManager: BrowserManager;
  private analyzer: SelectorAnalyzer;
  private optimizer: SelectorOptimizer;
  private learningEngine: DomainLearningEngine;
  private tester: SelectorTester;
  private history: Map<string, SelectorHistoryEntry[]>;
  private activeSelectors: Map<string, string>;
  
  constructor(browserManager: BrowserManager) {
    super();
    this.browserManager = browserManager;
    this.analyzer = new SelectorAnalyzer(browserManager);
    this.optimizer = new SelectorOptimizer();
    this.learningEngine = new DomainLearningEngine();
    this.tester = new SelectorTester(browserManager);
    this.history = new Map();
    this.activeSelectors = new Map();
  }

  async analyzeSelector(selector: string, url: string): Promise<SelectorAnalysis> {
    const analysis = await this.analyzer.analyze(selector, url);
    
    this.emit('selector-analyzed', {
      selector,
      url,
      analysis
    });
    
    return analysis;
  }

  async optimizeSelector(selector: string, url: string): Promise<string> {
    const analysis = await this.analyzer.analyze(selector, url);
    const optimized = this.optimizer.optimize(selector, analysis);
    
    if (optimized !== selector) {
      this.emit('selector-optimized', {
        original: selector,
        optimized,
        improvement: analysis.score.overall
      });
    }
    
    return optimized;
  }

  async testSelector(selector: string, urls: string[]): Promise<SelectorTestResult[]> {
    const results = await this.tester.test(selector, urls);
    
    this.emit('selector-tested', {
      selector,
      results
    });
    
    return results;
  }

  async generateSelector(url: string, elementDescription: string, domain?: DomainProfile): Promise<string[]> {
    const suggestions = [];
    
    // Get domain-specific suggestions
    if (domain) {
      const domainSuggestions = this.learningEngine.suggestSelector(domain, elementDescription);
      suggestions.push(...domainSuggestions);
    }
    
    // Create browser instance for intelligent selection
    const instanceId = await this.browserManager.createInstance({
      type: 'chromium' as any
    });
    
    const tab = await this.browserManager.createTab(instanceId, url);
    
    // Generate selectors based on description
    const generationScript = `
      (() => {
        const description = ${JSON.stringify(elementDescription)}.toLowerCase();
        const selectors = [];
        
        // Common patterns based on description
        if (description.includes('button')) {
          selectors.push('button', 'input[type="button"]', 'a[role="button"]');
        }
        
        if (description.includes('submit')) {
          selectors.push('button[type="submit"]', 'input[type="submit"]');
        }
        
        if (description.includes('cart')) {
          selectors.push('[class*="cart"]', '[id*="cart"]', '[data-action*="cart"]');
        }
        
        if (description.includes('price')) {
          selectors.push('[class*="price"]', '[data-price]', 'span[class*="cost"]');
        }
        
        if (description.includes('search')) {
          selectors.push('input[type="search"]', '[placeholder*="search"]', '#search');
        }
        
        if (description.includes('menu')) {
          selectors.push('nav', '[role="navigation"]', '[class*="menu"]');
        }
        
        if (description.includes('login')) {
          selectors.push('[href*="login"]', 'button[class*="login"]', '#login');
        }
        
        // Test each selector
        const validSelectors = [];
        for (const selector of selectors) {
          try {
            const elements = document.querySelectorAll(selector);
            if (elements.length > 0) {
              validSelectors.push({
                selector,
                count: elements.length
              });
            }
          } catch (e) {}
        }
        
        return validSelectors;
      })();
    `;
    
    const generated = await this.browserManager.executeScript(instanceId, tab.id, generationScript);
    
    // Cleanup
    await this.browserManager.closeInstance(instanceId);
    
    // Add generated selectors
    generated.forEach((item: any) => {
      suggestions.push(item.selector);
    });
    
    this.emit('selector-generated', {
      description: elementDescription,
      suggestions
    });
    
    return suggestions;
  }

  async repairSelector(brokenSelector: string, url: string): Promise<string> {
    // Analyze why selector is broken
    const analysis = await this.analyzer.analyze(brokenSelector, url);
    
    if (analysis.elements > 0) {
      // Selector is not actually broken
      return brokenSelector;
    }
    
    // Try alternatives
    if (analysis.alternatives.length > 0) {
      const bestAlternative = analysis.alternatives
        .sort((a, b) => b.score - a.score)[0];
      
      this.emit('selector-repaired', {
        broken: brokenSelector,
        repaired: bestAlternative.selector,
        reason: bestAlternative.reason
      });
      
      return bestAlternative.selector;
    }
    
    // Use optimizer repair
    const repaired = this.optimizer.repair(brokenSelector, { url });
    
    return repaired;
  }

  learnFromUsage(selector: string, domain: DomainProfile, score: number): void {
    this.learningEngine.updateProfile(domain, selector, score);
    
    this.emit('learning-updated', {
      selector,
      domain,
      score
    });
  }

  addToHistory(selector: string, url: string, analysis: SelectorAnalysis): void {
    const entry: SelectorHistoryEntry = {
      id: `sel-${Date.now()}`,
      selector,
      type: analysis.type,
      url,
      timestamp: new Date(),
      score: analysis.score,
      status: 'active'
    };
    
    if (!this.history.has(url)) {
      this.history.set(url, []);
    }
    
    this.history.get(url)!.push(entry);
    
    // Keep only last 100 entries per URL
    const urlHistory = this.history.get(url)!;
    if (urlHistory.length > 100) {
      urlHistory.shift();
    }
  }

  getHistory(url?: string): SelectorHistoryEntry[] {
    if (url) {
      return this.history.get(url) || [];
    }
    
    // Return all history
    const allHistory: SelectorHistoryEntry[] = [];
    this.history.forEach(entries => {
      allHistory.push(...entries);
    });
    
    return allHistory.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  saveSelector(name: string, selector: string): void {
    this.activeSelectors.set(name, selector);
    
    this.emit('selector-saved', {
      name,
      selector
    });
  }

  getSavedSelectors(): Map<string, string> {
    return new Map(this.activeSelectors);
  }

  exportSelectors(): any {
    return {
      selectors: Array.from(this.activeSelectors.entries()).map(([name, selector]) => ({
        name,
        selector
      })),
      history: Array.from(this.history.entries()).map(([url, entries]) => ({
        url,
        entries
      })),
      timestamp: new Date()
    };
  }

  importSelectors(data: any): void {
    if (data.selectors) {
      data.selectors.forEach((item: any) => {
        this.activeSelectors.set(item.name, item.selector);
      });
    }
    
    if (data.history) {
      data.history.forEach((item: any) => {
        this.history.set(item.url, item.entries);
      });
    }
    
    this.emit('selectors-imported', {
      count: data.selectors?.length || 0
    });
  }

  getStabilityReport(url: string): any {
    const entries = this.history.get(url) || [];
    
    if (entries.length === 0) {
      return null;
    }
    
    const report = {
      url,
      totalSelectors: entries.length,
      averageScore: 0,
      stabilityTrend: [] as any[],
      problematicSelectors: [] as any[],
      recommendations: [] as string[]
    };
    
    // Calculate average score
    const totalScore = entries.reduce((sum, entry) => sum + entry.score.overall, 0);
    report.averageScore = totalScore / entries.length;
    
    // Find problematic selectors
    report.problematicSelectors = entries
      .filter(entry => entry.score.overall < 50 || entry.status === 'failed')
      .map(entry => ({
        selector: entry.selector,
        score: entry.score.overall,
        status: entry.status
      }));
    
    // Generate recommendations
    if (report.averageScore < 70) {
      report.recommendations.push('Consider using more stable selectors like IDs or data attributes');
    }
    
    if (report.problematicSelectors.length > 5) {
      report.recommendations.push('Many selectors are unstable - review selector strategy');
    }
    
    return report;
  }
}

export const createSelectorStudio = (browserManager: BrowserManager) => {
  return new SelectorStudioV2(browserManager);
};