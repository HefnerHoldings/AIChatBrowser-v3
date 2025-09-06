// Context-Aware Assistant System
// Provides intelligent, predictive assistance based on user context and behavior

import { userAnalytics, UserAction, Recommendation, UserInsight } from './userBehaviorAnalytics';

export interface AssistantContext {
  currentTask: string;
  currentGoal: string;
  currentDomain: string;
  userIntent: string;
  confidence: number;
  suggestedActions: SuggestedAction[];
  availableTools: Tool[];
  activeAssistance: AssistanceMode;
}

export interface SuggestedAction {
  id: string;
  type: 'automation' | 'navigation' | 'data_extraction' | 'form_fill' | 'workflow';
  title: string;
  description: string;
  confidence: number;
  reasoning: string;
  steps: ActionStep[];
  estimatedTime: number;
  automationLevel: 'manual' | 'assisted' | 'automated';
  requirements?: string[];
}

export interface ActionStep {
  id: string;
  action: string;
  target?: string;
  data?: any;
  optional?: boolean;
  alternatives?: ActionStep[];
}

export interface Tool {
  id: string;
  name: string;
  icon: string;
  category: 'extraction' | 'automation' | 'analysis' | 'communication' | 'navigation';
  active: boolean;
  relevance: number;
  description: string;
  shortcuts?: string[];
  config?: Record<string, any>;
}

export interface AssistanceMode {
  level: 'minimal' | 'balanced' | 'proactive' | 'autonomous';
  features: {
    autoSuggest: boolean;
    autoComplete: boolean;
    autoExecute: boolean;
    predictiveLoading: boolean;
    contextualHelp: boolean;
  };
  permissions: {
    canModifyDOM: boolean;
    canNavigate: boolean;
    canSubmitForms: boolean;
    canExtractData: boolean;
    canExecuteScripts: boolean;
  };
}

export interface PredictiveAction {
  action: string;
  probability: number;
  preloadData?: any;
  preparationSteps?: string[];
}

export interface SmartSuggestion {
  id: string;
  type: 'quick_action' | 'workflow' | 'optimization' | 'learning';
  message: string;
  action?: () => void;
  priority: number;
  expiresAt?: Date;
}

export class ContextAwareAssistant {
  private context: AssistantContext;
  private activeSuggestions: Map<string, SuggestedAction> = new Map();
  private preloadedData: Map<string, any> = new Map();
  private learningHistory: Map<string, number> = new Map();
  private listeners: Set<(event: AssistantEvent) => void> = new Set();
  private predictionEngine: PredictionEngine;
  private automationEngine: AutomationEngine;
  
  constructor() {
    this.context = this.initializeContext();
    this.predictionEngine = new PredictionEngine();
    this.automationEngine = new AutomationEngine();
    this.initialize();
  }

  private initializeContext(): AssistantContext {
    return {
      currentTask: '',
      currentGoal: '',
      currentDomain: window.location.hostname,
      userIntent: 'browsing',
      confidence: 0,
      suggestedActions: [],
      availableTools: this.getDefaultTools(),
      activeAssistance: this.getDefaultAssistanceMode()
    };
  }

  private initialize() {
    // Subscribe to user behavior analytics
    userAnalytics.subscribe((event) => {
      this.handleAnalyticsEvent(event);
    });

    // Start context monitoring
    this.startContextMonitoring();
    
    // Initialize predictive loading
    this.initializePredictiveLoading();
    
    // Start proactive assistance
    this.startProactiveAssistance();
  }

  private handleAnalyticsEvent(event: any) {
    switch (event.type) {
      case 'action_recorded':
        this.updateContextFromAction(event.payload);
        break;
      case 'pattern_detected':
        this.generateSuggestionsFromPattern(event.payload);
        break;
      case 'insight_generated':
        this.processInsight(event.payload);
        break;
    }
  }

  private updateContextFromAction(action: UserAction) {
    // Update user intent
    this.context.userIntent = userAnalytics.predictIntent();
    
    // Update confidence based on pattern recognition
    const patterns = userAnalytics.getPatterns();
    const matchingPatterns = patterns.filter(p => 
      p.context.domain === this.context.currentDomain
    );
    
    this.context.confidence = matchingPatterns.length > 0 ? 
      Math.max(...matchingPatterns.map(p => p.confidence)) : 0.5;
    
    // Update suggested actions
    this.updateSuggestedActions();
    
    // Emit context update
    this.emit({
      type: 'context_updated',
      payload: this.context
    });
  }

  private generateSuggestionsFromPattern(pattern: any) {
    const suggestion: SuggestedAction = {
      id: this.generateId(),
      type: 'workflow',
      title: `Automate ${pattern.patternType} pattern`,
      description: `I've noticed you frequently perform this sequence. Would you like to automate it?`,
      confidence: pattern.confidence,
      reasoning: `This pattern has occurred ${pattern.frequency} times`,
      steps: pattern.actions.map((a: UserAction) => ({
        id: a.id,
        action: a.type,
        target: a.element,
        data: a.metadata
      })),
      estimatedTime: pattern.actions.length * 2,
      automationLevel: 'automated'
    };
    
    this.activeSuggestions.set(suggestion.id, suggestion);
    this.context.suggestedActions.push(suggestion);
    
    this.emit({
      type: 'suggestion_created',
      payload: suggestion
    });
  }

  private processInsight(insight: UserInsight) {
    if (insight.actionable) {
      const smartSuggestion: SmartSuggestion = {
        id: this.generateId(),
        type: 'optimization',
        message: insight.description,
        priority: insight.impact === 'high' ? 10 : 5,
        action: () => this.applyInsightSuggestions(insight)
      };
      
      this.emit({
        type: 'smart_suggestion',
        payload: smartSuggestion
      });
    }
  }

  private startContextMonitoring() {
    // Monitor DOM changes
    const observer = new MutationObserver((mutations) => {
      this.analyzePageContext();
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true
    });
    
    // Monitor user focus
    document.addEventListener('focusin', (e) => {
      this.analyzeFocusContext(e.target as HTMLElement);
    });
    
    // Monitor scroll position
    let scrollTimeout: NodeJS.Timeout;
    window.addEventListener('scroll', () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        this.analyzeViewportContext();
      }, 500);
    });
  }

  private analyzePageContext() {
    const analysis = {
      hasForm: !!document.querySelector('form'),
      hasTables: !!document.querySelector('table'),
      hasLists: !!document.querySelector('ul, ol'),
      hasImages: document.querySelectorAll('img').length > 5,
      hasVideos: !!document.querySelector('video'),
      pageType: this.detectPageType()
    };
    
    // Update available tools based on page content
    this.updateAvailableTools(analysis);
    
    // Generate contextual suggestions
    this.generateContextualSuggestions(analysis);
  }

  private detectPageType(): string {
    const url = window.location.href;
    const title = document.title.toLowerCase();
    const content = document.body.textContent?.toLowerCase() || '';
    
    if (url.includes('search') || title.includes('search')) return 'search_results';
    if (url.includes('profile') || url.includes('user')) return 'profile';
    if (document.querySelector('form[action*="login"]')) return 'login';
    if (document.querySelector('form[action*="signup"]')) return 'signup';
    if (document.querySelector('.product, [itemtype*="Product"]')) return 'product';
    if (document.querySelector('article, [itemtype*="Article"]')) return 'article';
    if (content.includes('contact') && document.querySelector('form')) return 'contact';
    
    return 'general';
  }

  private analyzeFocusContext(element: HTMLElement) {
    if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
      const inputType = (element as HTMLInputElement).type;
      const inputName = (element as HTMLInputElement).name;
      
      // Provide input assistance
      this.provideInputAssistance(element as HTMLInputElement, inputType, inputName);
    }
  }

  private provideInputAssistance(input: HTMLInputElement, type: string, name: string) {
    const suggestions = this.getInputSuggestions(type, name);
    
    if (suggestions.length > 0) {
      this.emit({
        type: 'input_assistance',
        payload: {
          element: input,
          suggestions,
          autoComplete: this.context.activeAssistance.features.autoComplete
        }
      });
    }
  }

  private getInputSuggestions(type: string, name: string): string[] {
    const profile = userAnalytics.getProfile();
    const suggestions: string[] = [];
    
    // Email suggestions
    if (type === 'email' || name.includes('email')) {
      suggestions.push(profile.email);
    }
    
    // Common patterns from history
    const patterns = userAnalytics.getPatterns()
      .filter(p => p.patternType === 'form_fill')
      .map(p => p.actions.find(a => a.metadata?.inputName === name))
      .filter(Boolean)
      .map(a => a?.metadata?.value)
      .filter(Boolean);
    
    suggestions.push(...patterns);
    
    return suggestions;
  }

  private analyzeViewportContext() {
    const viewport = {
      scrollY: window.scrollY,
      scrollHeight: document.documentElement.scrollHeight,
      clientHeight: window.innerHeight,
      scrollPercentage: (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
    };
    
    // Detect if user is looking for something
    if (viewport.scrollPercentage > 80) {
      this.suggestNextPageAction();
    }
  }

  private suggestNextPageAction() {
    const nextButton = document.querySelector('a[rel="next"], .pagination .next, [aria-label="Next"]');
    
    if (nextButton) {
      const suggestion: SmartSuggestion = {
        id: this.generateId(),
        type: 'quick_action',
        message: 'Load next page?',
        priority: 5,
        action: () => (nextButton as HTMLElement).click()
      };
      
      this.emit({
        type: 'smart_suggestion',
        payload: suggestion
      });
    }
  }

  private initializePredictiveLoading() {
    // Predict and preload next actions
    setInterval(() => {
      const predictions = this.predictionEngine.predictNextActions(this.context);
      
      predictions.forEach(prediction => {
        if (prediction.probability > 0.7) {
          this.preloadAction(prediction);
        }
      });
    }, 5000);
  }

  private preloadAction(prediction: PredictiveAction) {
    switch (prediction.action) {
      case 'navigate':
        if (prediction.preloadData?.url) {
          // Prefetch the page
          const link = document.createElement('link');
          link.rel = 'prefetch';
          link.href = prediction.preloadData.url;
          document.head.appendChild(link);
        }
        break;
        
      case 'data_extraction':
        // Pre-parse data structures
        if (prediction.preparationSteps) {
          this.prepareDataExtraction(prediction.preparationSteps);
        }
        break;
        
      case 'form_fill':
        // Pre-validate form fields
        this.prevalidateFormFields();
        break;
    }
    
    this.preloadedData.set(prediction.action, prediction.preloadData);
  }

  private prepareDataExtraction(steps: string[]) {
    // Pre-process DOM for faster extraction
    steps.forEach(step => {
      if (step === 'parse_tables') {
        const tables = document.querySelectorAll('table');
        tables.forEach(table => {
          const data = this.parseTableData(table);
          this.preloadedData.set(`table_${table.id}`, data);
        });
      }
    });
  }

  private parseTableData(table: Element): any[][] {
    const rows = Array.from(table.querySelectorAll('tr'));
    return rows.map(row => 
      Array.from(row.querySelectorAll('td, th')).map(cell => cell.textContent?.trim())
    );
  }

  private prevalidateFormFields() {
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
      const fields = Array.from(form.querySelectorAll('input, select, textarea'));
      const validation = fields.map(field => ({
        name: (field as HTMLInputElement).name,
        type: (field as HTMLInputElement).type,
        required: (field as HTMLInputElement).required,
        pattern: (field as HTMLInputElement).pattern,
        valid: (field as HTMLInputElement).checkValidity()
      }));
      
      this.preloadedData.set(`form_${form.id}_validation`, validation);
    });
  }

  private startProactiveAssistance() {
    // Check for assistance opportunities every 10 seconds
    setInterval(() => {
      if (this.context.activeAssistance.level === 'proactive' || 
          this.context.activeAssistance.level === 'autonomous') {
        this.checkForAssistanceOpportunities();
      }
    }, 10000);
  }

  private checkForAssistanceOpportunities() {
    // Check for repetitive actions
    const recentActions = userAnalytics.getContext().recentActions;
    const repetitions = this.detectRepetitions(recentActions);
    
    if (repetitions.length > 0) {
      this.suggestAutomation(repetitions);
    }
    
    // Check for stuck situations
    if (this.detectUserStuck()) {
      this.offerHelp();
    }
    
    // Check for optimization opportunities
    const optimizations = this.detectOptimizations();
    if (optimizations.length > 0) {
      this.suggestOptimizations(optimizations);
    }
  }

  private detectRepetitions(actions: UserAction[]): UserAction[][] {
    const sequences: UserAction[][] = [];
    
    for (let length = 2; length <= 5; length++) {
      for (let i = 0; i <= actions.length - length * 2; i++) {
        const sequence1 = actions.slice(i, i + length);
        const sequence2 = actions.slice(i + length, i + length * 2);
        
        if (this.sequencesMatch(sequence1, sequence2)) {
          sequences.push(sequence1);
        }
      }
    }
    
    return sequences;
  }

  private sequencesMatch(seq1: UserAction[], seq2: UserAction[]): boolean {
    if (seq1.length !== seq2.length) return false;
    
    return seq1.every((action, index) => 
      action.type === seq2[index].type &&
      action.category === seq2[index].category
    );
  }

  private detectUserStuck(): boolean {
    const recentActions = userAnalytics.getContext().recentActions;
    
    // Check if user is repeating the same action without progress
    if (recentActions.length >= 3) {
      const lastThree = recentActions.slice(-3);
      return lastThree.every(a => 
        a.type === lastThree[0].type && 
        a.success === false
      );
    }
    
    return false;
  }

  private detectOptimizations(): string[] {
    const optimizations: string[] = [];
    
    // Check for slow manual processes
    const profile = userAnalytics.getProfile();
    if (profile.statistics.avgSessionDuration > 30 && 
        profile.preferences.workStyle === 'manual') {
      optimizations.push('Enable automation assistance to speed up workflows');
    }
    
    // Check for inefficient navigation
    const navActions = userAnalytics.getContext().recentActions
      .filter(a => a.type === 'navigation');
    
    if (navActions.length > 5) {
      optimizations.push('Use quick navigation shortcuts');
    }
    
    return optimizations;
  }

  private suggestAutomation(repetitions: UserAction[][]) {
    repetitions.forEach(sequence => {
      const suggestion: SuggestedAction = {
        id: this.generateId(),
        type: 'automation',
        title: 'Automate repetitive task',
        description: `You've repeated this sequence ${repetitions.length} times. Let me automate it.`,
        confidence: 0.9,
        reasoning: 'Detected repetitive pattern',
        steps: sequence.map(a => ({
          id: a.id,
          action: a.type,
          target: a.element
        })),
        estimatedTime: sequence.length,
        automationLevel: 'automated'
      };
      
      this.activeSuggestions.set(suggestion.id, suggestion);
      
      this.emit({
        type: 'automation_suggestion',
        payload: suggestion
      });
    });
  }

  private offerHelp() {
    const suggestion: SmartSuggestion = {
      id: this.generateId(),
      type: 'quick_action',
      message: 'Need help? I noticed you might be stuck.',
      priority: 8,
      action: () => this.showHelpOptions()
    };
    
    this.emit({
      type: 'help_offer',
      payload: suggestion
    });
  }

  private showHelpOptions() {
    const options = [
      'Show me how to complete this task',
      'Find an alternative approach',
      'Skip this step',
      'Get expert assistance'
    ];
    
    this.emit({
      type: 'help_options',
      payload: options
    });
  }

  private suggestOptimizations(optimizations: string[]) {
    optimizations.forEach(optimization => {
      const suggestion: SmartSuggestion = {
        id: this.generateId(),
        type: 'optimization',
        message: optimization,
        priority: 6
      };
      
      this.emit({
        type: 'optimization_suggestion',
        payload: suggestion
      });
    });
  }

  private updateSuggestedActions() {
    const recommendations = userAnalytics.getContextualSuggestions();
    
    this.context.suggestedActions = recommendations.map(rec => ({
      id: rec.id,
      type: this.mapRecommendationType(rec.type),
      title: rec.title,
      description: rec.description,
      confidence: rec.confidence,
      reasoning: rec.reason,
      steps: [],
      estimatedTime: 5,
      automationLevel: 'assisted'
    }));
  }

  private mapRecommendationType(type: string): SuggestedAction['type'] {
    const mapping: Record<string, SuggestedAction['type']> = {
      'tool': 'automation',
      'workflow': 'workflow',
      'automation': 'automation',
      'shortcut': 'navigation',
      'learning': 'workflow'
    };
    
    return mapping[type] || 'workflow';
  }

  private updateAvailableTools(analysis: any) {
    const tools = [...this.context.availableTools];
    
    // Update tool relevance based on page content
    tools.forEach(tool => {
      if (analysis.hasForm && tool.category === 'automation') {
        tool.relevance = 0.9;
      } else if (analysis.hasTables && tool.category === 'extraction') {
        tool.relevance = 0.95;
      } else if (analysis.hasLists && tool.category === 'extraction') {
        tool.relevance = 0.85;
      }
    });
    
    // Sort by relevance
    this.context.availableTools = tools.sort((a, b) => b.relevance - a.relevance);
  }

  private generateContextualSuggestions(analysis: any) {
    const suggestions: SuggestedAction[] = [];
    
    if (analysis.hasForm) {
      suggestions.push({
        id: this.generateId(),
        type: 'form_fill',
        title: 'Auto-fill form',
        description: 'Fill this form with your saved information',
        confidence: 0.8,
        reasoning: 'Form detected on page',
        steps: [],
        estimatedTime: 2,
        automationLevel: 'automated'
      });
    }
    
    if (analysis.hasTables) {
      suggestions.push({
        id: this.generateId(),
        type: 'data_extraction',
        title: 'Extract table data',
        description: 'Extract and export this table data',
        confidence: 0.9,
        reasoning: 'Table data detected',
        steps: [],
        estimatedTime: 3,
        automationLevel: 'automated'
      });
    }
    
    this.context.suggestedActions.push(...suggestions);
  }

  private applyInsightSuggestions(insight: UserInsight) {
    // Apply the suggestions from the insight
    insight.suggestions.forEach(suggestion => {
      // Implementation based on suggestion type
      console.log('Applying suggestion:', suggestion);
    });
  }

  private getDefaultTools(): Tool[] {
    return [
      {
        id: 'ai-assistant',
        name: 'AI Assistant',
        icon: '🤖',
        category: 'automation',
        active: true,
        relevance: 0.9,
        description: 'Intelligent task automation',
        shortcuts: ['Ctrl+Shift+A']
      },
      {
        id: 'data-extractor',
        name: 'Data Extractor',
        icon: '📊',
        category: 'extraction',
        active: false,
        relevance: 0.7,
        description: 'Extract structured data from pages',
        shortcuts: ['Ctrl+E']
      },
      {
        id: 'form-filler',
        name: 'Form Filler',
        icon: '📝',
        category: 'automation',
        active: false,
        relevance: 0.6,
        description: 'Automatically fill forms',
        shortcuts: ['Ctrl+F']
      },
      {
        id: 'workflow-builder',
        name: 'Workflow Builder',
        icon: '⚡',
        category: 'automation',
        active: false,
        relevance: 0.8,
        description: 'Create automated workflows',
        shortcuts: ['Ctrl+W']
      },
      {
        id: 'page-monitor',
        name: 'Page Monitor',
        icon: '👁️',
        category: 'analysis',
        active: false,
        relevance: 0.5,
        description: 'Monitor page changes',
        shortcuts: ['Ctrl+M']
      }
    ];
  }

  private getDefaultAssistanceMode(): AssistanceMode {
    return {
      level: 'balanced',
      features: {
        autoSuggest: true,
        autoComplete: true,
        autoExecute: false,
        predictiveLoading: true,
        contextualHelp: true
      },
      permissions: {
        canModifyDOM: true,
        canNavigate: false,
        canSubmitForms: false,
        canExtractData: true,
        canExecuteScripts: true
      }
    };
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private emit(event: AssistantEvent) {
    this.listeners.forEach(listener => listener(event));
  }

  // Public API
  subscribe(listener: (event: AssistantEvent) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getContext(): AssistantContext {
    return this.context;
  }

  getSuggestions(): SuggestedAction[] {
    return this.context.suggestedActions;
  }

  getTools(): Tool[] {
    return this.context.availableTools;
  }

  setAssistanceLevel(level: AssistanceMode['level']) {
    this.context.activeAssistance.level = level;
    
    // Update features based on level
    switch (level) {
      case 'minimal':
        this.context.activeAssistance.features = {
          autoSuggest: false,
          autoComplete: false,
          autoExecute: false,
          predictiveLoading: false,
          contextualHelp: false
        };
        break;
      case 'balanced':
        this.context.activeAssistance.features = {
          autoSuggest: true,
          autoComplete: true,
          autoExecute: false,
          predictiveLoading: true,
          contextualHelp: true
        };
        break;
      case 'proactive':
        this.context.activeAssistance.features = {
          autoSuggest: true,
          autoComplete: true,
          autoExecute: true,
          predictiveLoading: true,
          contextualHelp: true
        };
        break;
      case 'autonomous':
        this.context.activeAssistance.features = {
          autoSuggest: true,
          autoComplete: true,
          autoExecute: true,
          predictiveLoading: true,
          contextualHelp: true
        };
        this.context.activeAssistance.permissions = {
          canModifyDOM: true,
          canNavigate: true,
          canSubmitForms: true,
          canExtractData: true,
          canExecuteScripts: true
        };
        break;
    }
  }

  executeSuggestion(suggestionId: string) {
    const suggestion = this.activeSuggestions.get(suggestionId);
    
    if (suggestion) {
      this.automationEngine.execute(suggestion);
      
      // Record execution
      userAnalytics.recordAction({
        id: this.generateId(),
        timestamp: new Date(),
        type: 'automation',
        category: suggestion.type,
        context: {
          workflowId: suggestionId
        },
        metadata: {
          suggestion: suggestion.title,
          automationLevel: suggestion.automationLevel
        }
      });
    }
  }

  activateTool(toolId: string) {
    const tool = this.context.availableTools.find(t => t.id === toolId);
    
    if (tool) {
      tool.active = true;
      
      this.emit({
        type: 'tool_activated',
        payload: tool
      });
    }
  }
}

// Helper classes
class PredictionEngine {
  predictNextActions(context: AssistantContext): PredictiveAction[] {
    const predictions: PredictiveAction[] = [];
    
    // Predict based on current intent
    switch (context.userIntent) {
      case 'researching':
        predictions.push({
          action: 'navigate',
          probability: 0.8,
          preloadData: { url: this.predictNextSearchResult() }
        });
        break;
      case 'collecting_data':
        predictions.push({
          action: 'data_extraction',
          probability: 0.9,
          preparationSteps: ['parse_tables', 'identify_lists']
        });
        break;
      case 'form_automation':
        predictions.push({
          action: 'form_fill',
          probability: 0.85
        });
        break;
    }
    
    return predictions;
  }

  private predictNextSearchResult(): string {
    const links = Array.from(document.querySelectorAll('a[href]'));
    const searchResults = links.filter(link => 
      link.closest('.search-result, .result, [data-result]')
    );
    
    if (searchResults.length > 0) {
      return (searchResults[0] as HTMLAnchorElement).href;
    }
    
    return '';
  }
}

class AutomationEngine {
  execute(suggestion: SuggestedAction) {
    // Execute the automation based on type
    switch (suggestion.type) {
      case 'automation':
        this.executeAutomation(suggestion.steps);
        break;
      case 'workflow':
        this.executeWorkflow(suggestion.steps);
        break;
      case 'data_extraction':
        this.executeDataExtraction(suggestion.steps);
        break;
      case 'form_fill':
        this.executeFormFill(suggestion.steps);
        break;
    }
  }

  private executeAutomation(steps: ActionStep[]) {
    steps.forEach(step => {
      // Execute each step
      console.log('Executing step:', step);
    });
  }

  private executeWorkflow(steps: ActionStep[]) {
    // Execute workflow steps
    console.log('Executing workflow:', steps);
  }

  private executeDataExtraction(steps: ActionStep[]) {
    // Extract data
    console.log('Extracting data:', steps);
  }

  private executeFormFill(steps: ActionStep[]) {
    // Fill form
    console.log('Filling form:', steps);
  }
}

export interface AssistantEvent {
  type: 'context_updated' | 'suggestion_created' | 'smart_suggestion' | 
        'automation_suggestion' | 'help_offer' | 'optimization_suggestion' |
        'tool_activated' | 'input_assistance' | 'help_options';
  payload: any;
}

// Export singleton instance
export const contextAssistant = new ContextAwareAssistant();