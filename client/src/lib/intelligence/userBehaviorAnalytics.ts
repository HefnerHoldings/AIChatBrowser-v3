// User Behavior Analytics System
// Tracks, analyzes and learns from user patterns to provide intelligent assistance

export interface UserAction {
  id: string;
  timestamp: Date;
  type: 'click' | 'navigation' | 'search' | 'workflow' | 'data_extraction' | 'form_fill' | 'automation';
  category: string;
  element?: string;
  context: {
    url?: string;
    domain?: string;
    pageTitle?: string;
    previousAction?: string;
    workflowId?: string;
    goalId?: string;
  };
  metadata: Record<string, any>;
  duration?: number;
  success?: boolean;
  errorType?: string;
}

export interface UserPattern {
  id: string;
  userId: string;
  patternType: 'sequence' | 'frequency' | 'timing' | 'preference' | 'workflow';
  actions: UserAction[];
  frequency: number;
  confidence: number;
  lastOccurrence: Date;
  context: {
    timeOfDay?: string;
    dayOfWeek?: string;
    domain?: string;
    workflowType?: string;
  };
  predictions: {
    nextAction?: string;
    probability?: number;
    suggestedTools?: string[];
  };
}

export interface UserProfile {
  id: string;
  email: string;
  createdAt: Date;
  preferences: {
    workStyle: 'manual' | 'assisted' | 'automated';
    expertise: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    domains: string[];
    tools: string[];
    shortcuts: Record<string, number>;
  };
  statistics: {
    totalActions: number;
    totalWorkflows: number;
    successRate: number;
    avgSessionDuration: number;
    mostUsedFeatures: Array<{ feature: string; count: number }>;
    peakHours: Array<{ hour: number; activity: number }>;
  };
  learningModel: {
    patterns: UserPattern[];
    insights: UserInsight[];
    recommendations: Recommendation[];
    predictions: Array<{
      id: string;
      type: string;
      confidence: number;
      timestamp: Date;
    }>;
  };
}

export interface UserInsight {
  id: string;
  type: 'efficiency' | 'habit' | 'improvement' | 'anomaly';
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  actionable: boolean;
  suggestions: string[];
  createdAt: Date;
}

export interface Recommendation {
  id: string;
  type: 'tool' | 'workflow' | 'automation' | 'shortcut' | 'learning';
  title: string;
  description: string;
  reason: string;
  priority: number;
  confidence: number;
  action?: {
    type: string;
    payload: any;
  };
}

export interface ContextState {
  currentUrl: string;
  currentDomain: string;
  currentWorkflow?: string;
  currentGoal?: string;
  recentActions: UserAction[];
  activeTools: string[];
  sessionStartTime: Date;
  focusArea?: string;
  intent?: string;
}

export class UserBehaviorAnalytics {
  private actions: UserAction[] = [];
  private patterns: Map<string, UserPattern> = new Map();
  private userProfile: UserProfile;
  private contextState: ContextState;
  private listeners: Set<(event: AnalyticsEvent) => void> = new Set();
  private patternDetectionThreshold = 3; // Minimum occurrences to detect pattern
  private confidenceThreshold = 0.7; // Minimum confidence for predictions

  constructor(userId: string, email: string) {
    this.userProfile = this.initializeProfile(userId, email);
    this.contextState = this.initializeContext();
    this.startTracking();
  }

  private initializeProfile(userId: string, email: string): UserProfile {
    return {
      id: userId,
      email,
      createdAt: new Date(),
      preferences: {
        workStyle: 'assisted',
        expertise: 'intermediate',
        domains: [],
        tools: [],
        shortcuts: {}
      },
      statistics: {
        totalActions: 0,
        totalWorkflows: 0,
        successRate: 0,
        avgSessionDuration: 0,
        mostUsedFeatures: [],
        peakHours: []
      },
      learningModel: {
        patterns: [],
        insights: [],
        recommendations: [],
        predictions: []
      }
    };
  }

  private initializeContext(): ContextState {
    return {
      currentUrl: window.location.href,
      currentDomain: window.location.hostname,
      recentActions: [],
      activeTools: [],
      sessionStartTime: new Date()
    };
  }

  private startTracking() {
    // Track clicks
    document.addEventListener('click', this.handleClick.bind(this));
    
    // Track navigation
    window.addEventListener('popstate', this.handleNavigation.bind(this));
    
    // Track page visibility
    document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
    
    // Track keyboard shortcuts
    document.addEventListener('keydown', this.handleKeyboard.bind(this));
    
    // Periodic analysis
    setInterval(() => this.analyzePatterns(), 60000); // Every minute
    setInterval(() => this.generateInsights(), 300000); // Every 5 minutes
  }

  private handleClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    const action: UserAction = {
      id: this.generateId(),
      timestamp: new Date(),
      type: 'click',
      category: this.categorizeElement(target),
      element: this.getElementIdentifier(target),
      context: {
        ...this.contextState,
        previousAction: this.actions[this.actions.length - 1]?.id
      },
      metadata: {
        x: event.clientX,
        y: event.clientY,
        altKey: event.altKey,
        ctrlKey: event.ctrlKey,
        shiftKey: event.shiftKey
      }
    };
    
    this.recordAction(action);
  }

  private handleNavigation() {
    const action: UserAction = {
      id: this.generateId(),
      timestamp: new Date(),
      type: 'navigation',
      category: 'browser',
      context: {
        url: window.location.href,
        domain: window.location.hostname,
        previousAction: this.actions[this.actions.length - 1]?.id
      },
      metadata: {
        referrer: document.referrer
      }
    };
    
    this.recordAction(action);
    this.contextState.currentUrl = window.location.href;
    this.contextState.currentDomain = window.location.hostname;
  }

  private handleVisibilityChange() {
    if (document.hidden) {
      // User switched away - pause tracking
      this.pauseSession();
    } else {
      // User returned - resume tracking
      this.resumeSession();
    }
  }

  private handleKeyboard(event: KeyboardEvent) {
    if (event.ctrlKey || event.metaKey) {
      const shortcut = `${event.ctrlKey ? 'Ctrl' : 'Cmd'}+${event.key}`;
      this.recordShortcut(shortcut);
    }
  }

  recordAction(action: UserAction) {
    this.actions.push(action);
    
    // Limit in-memory storage to prevent memory bloat
    if (this.actions.length > 200) {
      this.actions = this.actions.slice(-150); // Keep last 150 actions
    }
    
    this.contextState.recentActions = this.actions.slice(-10);
    this.userProfile.statistics.totalActions++;
    
    // Emit event
    this.emit({
      type: 'action_recorded',
      payload: action
    });
    
    // Check for immediate patterns
    this.checkImmediatePatterns(action);
    
    // Update predictions
    this.updatePredictions();
    
    // Limit learningModel arrays
    if (this.userProfile.learningModel.insights.length > 30) {
      this.userProfile.learningModel.insights = this.userProfile.learningModel.insights.slice(-25);
    }
    if (this.userProfile.learningModel.recommendations.length > 20) {
      this.userProfile.learningModel.recommendations = this.userProfile.learningModel.recommendations.slice(-15);
    }
    if (this.userProfile.learningModel.predictions.length > 20) {
      this.userProfile.learningModel.predictions = this.userProfile.learningModel.predictions.slice(-15);
    }
    
    // Store in local storage for persistence (with throttling)
    if (this.actions.length % 5 === 0) { // Only persist every 5th action
      this.persist();
    }
  }

  recordWorkflow(workflowId: string, type: string, success: boolean) {
    const action: UserAction = {
      id: this.generateId(),
      timestamp: new Date(),
      type: 'workflow',
      category: type,
      context: {
        ...this.contextState,
        workflowId
      },
      metadata: {
        workflowType: type
      },
      success
    };
    
    this.recordAction(action);
    this.userProfile.statistics.totalWorkflows++;
    
    if (success) {
      this.userProfile.statistics.successRate = 
        (this.userProfile.statistics.successRate * (this.userProfile.statistics.totalWorkflows - 1) + 1) / 
        this.userProfile.statistics.totalWorkflows;
    }
  }

  private checkImmediatePatterns(action: UserAction) {
    // Check for sequence patterns
    const recentSequence = this.contextState.recentActions.slice(-5);
    if (recentSequence.length >= 3) {
      const sequenceKey = recentSequence.map(a => a.type + ':' + a.category).join('->');
      
      if (this.patterns.has(sequenceKey)) {
        const pattern = this.patterns.get(sequenceKey)!;
        pattern.frequency++;
        pattern.lastOccurrence = new Date();
        pattern.confidence = Math.min(1, pattern.confidence + 0.05);
      } else if (this.countSequenceOccurrences(sequenceKey) >= this.patternDetectionThreshold) {
        const newPattern: UserPattern = {
          id: this.generateId(),
          userId: this.userProfile.id,
          patternType: 'sequence',
          actions: recentSequence,
          frequency: this.countSequenceOccurrences(sequenceKey),
          confidence: 0.5,
          lastOccurrence: new Date(),
          context: {
            domain: this.contextState.currentDomain,
            timeOfDay: this.getTimeOfDay(),
            dayOfWeek: this.getDayOfWeek()
          },
          predictions: {}
        };
        
        this.patterns.set(sequenceKey, newPattern);
        this.userProfile.learningModel.patterns.push(newPattern);
        
        this.emit({
          type: 'pattern_detected',
          payload: newPattern
        });
      }
    }
  }

  private analyzePatterns() {
    // Analyze frequency patterns
    const actionFrequency = new Map<string, number>();
    this.actions.forEach(action => {
      const key = `${action.type}:${action.category}`;
      actionFrequency.set(key, (actionFrequency.get(key) || 0) + 1);
    });
    
    // Update most used features
    this.userProfile.statistics.mostUsedFeatures = Array.from(actionFrequency.entries())
      .map(([feature, count]) => ({ feature, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    
    // Analyze timing patterns
    const hourlyActivity = new Array(24).fill(0);
    this.actions.forEach(action => {
      const hour = new Date(action.timestamp).getHours();
      hourlyActivity[hour]++;
    });
    
    this.userProfile.statistics.peakHours = hourlyActivity
      .map((activity, hour) => ({ hour, activity }))
      .sort((a, b) => b.activity - a.activity)
      .slice(0, 5);
    
    // Analyze domain patterns
    const domainFrequency = new Map<string, number>();
    this.actions.forEach(action => {
      if (action.context.domain) {
        domainFrequency.set(action.context.domain, 
          (domainFrequency.get(action.context.domain) || 0) + 1);
      }
    });
    
    this.userProfile.preferences.domains = Array.from(domainFrequency.keys())
      .sort((a, b) => domainFrequency.get(b)! - domainFrequency.get(a)!)
      .slice(0, 10);
  }

  private generateInsights() {
    const insights: UserInsight[] = [];
    
    // Efficiency insight
    if (this.userProfile.statistics.successRate < 0.7) {
      insights.push({
        id: this.generateId(),
        type: 'improvement',
        title: 'Workflow Success Rate',
        description: `Your workflow success rate is ${(this.userProfile.statistics.successRate * 100).toFixed(1)}%. Consider using more automation assistance.`,
        impact: 'high',
        actionable: true,
        suggestions: [
          'Enable AI assistance for complex workflows',
          'Use templates for repetitive tasks',
          'Review failed workflows to identify patterns'
        ],
        createdAt: new Date()
      });
    }
    
    // Habit insight
    if (this.userProfile.statistics.peakHours.length > 0) {
      const peakHour = this.userProfile.statistics.peakHours[0];
      insights.push({
        id: this.generateId(),
        type: 'habit',
        title: 'Peak Productivity Time',
        description: `You're most active at ${peakHour.hour}:00. Schedule important tasks during this time.`,
        impact: 'medium',
        actionable: true,
        suggestions: [
          'Schedule complex workflows during peak hours',
          'Use automation for tasks outside peak hours',
          'Set reminders for optimal work times'
        ],
        createdAt: new Date()
      });
    }
    
    // Tool recommendation
    const underutilizedTools = this.identifyUnderutilizedTools();
    if (underutilizedTools.length > 0) {
      insights.push({
        id: this.generateId(),
        type: 'efficiency',
        title: 'Discover New Tools',
        description: `Based on your workflow patterns, these tools could save you time: ${underutilizedTools.join(', ')}`,
        impact: 'medium',
        actionable: true,
        suggestions: underutilizedTools.map(tool => `Try the ${tool} feature`),
        createdAt: new Date()
      });
    }
    
    this.userProfile.learningModel.insights = insights;
    
    // Emit insights
    insights.forEach(insight => {
      this.emit({
        type: 'insight_generated',
        payload: insight
      });
    });
  }

  private updatePredictions() {
    // Predict next action based on patterns
    const predictions: Map<string, number> = new Map();
    
    this.patterns.forEach(pattern => {
      if (pattern.confidence >= this.confidenceThreshold) {
        const lastActions = this.contextState.recentActions.slice(-pattern.actions.length + 1);
        const matches = this.sequenceMatches(lastActions, pattern.actions.slice(0, -1));
        
        if (matches) {
          const nextAction = pattern.actions[pattern.actions.length - 1];
          const key = `${nextAction.type}:${nextAction.category}`;
          predictions.set(key, (predictions.get(key) || 0) + pattern.confidence);
        }
      }
    });
    
    // Generate recommendations based on predictions
    const recommendations: Recommendation[] = Array.from(predictions.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([action, confidence], index) => ({
        id: this.generateId(),
        type: 'workflow',
        title: `Suggested Action: ${action}`,
        description: this.getActionDescription(action),
        reason: 'Based on your typical workflow pattern',
        priority: 5 - index,
        confidence,
        action: {
          type: action.split(':')[0],
          payload: { category: action.split(':')[1] }
        }
      }));
    
    this.userProfile.learningModel.recommendations = recommendations;
  }

  getContextualSuggestions(): Recommendation[] {
    const suggestions: Recommendation[] = [...this.userProfile.learningModel.recommendations];
    
    // Add context-specific suggestions
    if (this.contextState.currentDomain) {
      const domainTools = this.getDomainSpecificTools(this.contextState.currentDomain);
      domainTools.forEach((tool, index) => {
        suggestions.push({
          id: this.generateId(),
          type: 'tool',
          title: tool.name,
          description: tool.description,
          reason: `Useful for ${this.contextState.currentDomain}`,
          priority: 3 - index,
          confidence: 0.8,
          action: {
            type: 'activate_tool',
            payload: tool
          }
        });
      });
    }
    
    // Add time-based suggestions
    const currentHour = new Date().getHours();
    const isPeakHour = this.userProfile.statistics.peakHours
      .some(ph => Math.abs(ph.hour - currentHour) <= 1);
    
    if (isPeakHour) {
      suggestions.push({
        id: this.generateId(),
        type: 'workflow',
        title: 'Peak Productivity Time',
        description: 'This is your most productive time. Consider tackling complex tasks.',
        reason: 'Based on your activity patterns',
        priority: 1,
        confidence: 0.9
      });
    }
    
    return suggestions.sort((a, b) => b.priority - a.priority);
  }

  getAdaptiveToolset(): string[] {
    const tools: Set<string> = new Set();
    
    // Add frequently used tools
    this.userProfile.statistics.mostUsedFeatures
      .slice(0, 5)
      .forEach(f => tools.add(f.feature));
    
    // Add context-specific tools
    if (this.contextState.currentWorkflow) {
      this.getWorkflowTools(this.contextState.currentWorkflow)
        .forEach(t => tools.add(t));
    }
    
    // Add predicted tools
    this.userProfile.learningModel.recommendations
      .filter(r => r.type === 'tool')
      .forEach(r => tools.add(r.title));
    
    return Array.from(tools);
  }

  getUserExpertiseLevel(): string {
    const { totalActions, successRate, totalWorkflows } = this.userProfile.statistics;
    
    if (totalActions < 100) return 'beginner';
    if (totalActions < 500 && successRate < 0.7) return 'intermediate';
    if (totalActions < 1000 && successRate < 0.85) return 'advanced';
    if (totalActions >= 1000 && successRate >= 0.85) return 'expert';
    
    return this.userProfile.preferences.expertise;
  }

  predictIntent(): string {
    const recentActions = this.contextState.recentActions.slice(-5);
    
    if (recentActions.some(a => a.type === 'search')) {
      return 'researching';
    }
    if (recentActions.some(a => a.type === 'data_extraction')) {
      return 'collecting_data';
    }
    if (recentActions.some(a => a.type === 'form_fill')) {
      return 'form_automation';
    }
    if (recentActions.some(a => a.type === 'workflow')) {
      return 'workflow_execution';
    }
    
    return 'browsing';
  }

  // Helper methods
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private categorizeElement(element: HTMLElement): string {
    if (element.tagName === 'BUTTON') return 'button';
    if (element.tagName === 'A') return 'link';
    if (element.tagName === 'INPUT') return 'input';
    if (element.closest('[role="navigation"]')) return 'navigation';
    if (element.closest('[role="toolbar"]')) return 'toolbar';
    return 'other';
  }

  private getElementIdentifier(element: HTMLElement): string {
    return element.id || 
           element.className.split(' ')[0] || 
           element.tagName.toLowerCase();
  }

  private countSequenceOccurrences(sequenceKey: string): number {
    let count = 0;
    const sequence = sequenceKey.split('->');
    
    for (let i = 0; i < this.actions.length - sequence.length; i++) {
      const slice = this.actions.slice(i, i + sequence.length);
      const sliceKey = slice.map(a => a.type + ':' + a.category).join('->');
      if (sliceKey === sequenceKey) count++;
    }
    
    return count;
  }

  private sequenceMatches(actions1: UserAction[], actions2: UserAction[]): boolean {
    if (actions1.length !== actions2.length) return false;
    
    return actions1.every((a, i) => 
      a.type === actions2[i].type && 
      a.category === actions2[i].category
    );
  }

  private getTimeOfDay(): string {
    const hour = new Date().getHours();
    if (hour < 6) return 'night';
    if (hour < 12) return 'morning';
    if (hour < 18) return 'afternoon';
    return 'evening';
  }

  private getDayOfWeek(): string {
    return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date().getDay()];
  }

  private identifyUnderutilizedTools(): string[] {
    const allTools = ['AI Assistant', 'Workflow Builder', 'Data Extractor', 'Form Filler', 'API Connector'];
    const usedTools = new Set(this.userProfile.preferences.tools);
    return allTools.filter(tool => !usedTools.has(tool));
  }

  private getDomainSpecificTools(domain: string): Array<{ name: string; description: string }> {
    const domainTools: Record<string, Array<{ name: string; description: string }>> = {
      'linkedin.com': [
        { name: 'Profile Scraper', description: 'Extract profile information' },
        { name: 'Connection Builder', description: 'Automate connection requests' }
      ],
      'google.com': [
        { name: 'Search Aggregator', description: 'Collect search results' },
        { name: 'SERP Analyzer', description: 'Analyze search rankings' }
      ],
      default: [
        { name: 'Page Monitor', description: 'Track page changes' },
        { name: 'Data Extractor', description: 'Extract structured data' }
      ]
    };
    
    return domainTools[domain] || domainTools.default;
  }

  private getWorkflowTools(workflowType: string): string[] {
    const workflowTools: Record<string, string[]> = {
      'lead_generation': ['Email Finder', 'Contact Validator', 'LinkedIn Scraper'],
      'data_collection': ['Table Extractor', 'Image Downloader', 'PDF Parser'],
      'form_automation': ['Form Filler', 'CAPTCHA Solver', 'Multi-Step Navigator'],
      default: ['AI Assistant', 'Workflow Builder']
    };
    
    return workflowTools[workflowType] || workflowTools.default;
  }

  private getActionDescription(action: string): string {
    const descriptions: Record<string, string> = {
      'click:button': 'Click on action button',
      'click:link': 'Follow link',
      'navigation:browser': 'Navigate to page',
      'search:query': 'Perform search',
      'workflow:execute': 'Run workflow',
      'data_extraction:table': 'Extract table data',
      'form_fill:auto': 'Fill form automatically'
    };
    
    return descriptions[action] || 'Perform action';
  }

  private recordShortcut(shortcut: string) {
    this.userProfile.preferences.shortcuts[shortcut] = 
      (this.userProfile.preferences.shortcuts[shortcut] || 0) + 1;
  }

  private pauseSession() {
    const sessionDuration = (Date.now() - this.contextState.sessionStartTime.getTime()) / 1000 / 60;
    this.userProfile.statistics.avgSessionDuration = 
      (this.userProfile.statistics.avgSessionDuration * (this.userProfile.statistics.totalActions - 1) + sessionDuration) / 
      this.userProfile.statistics.totalActions;
  }

  private resumeSession() {
    this.contextState.sessionStartTime = new Date();
  }

  private persist() {
    try {
      // Prepare data with aggressive size limits
      const dataToStore = {
        actions: this.actions.slice(-100), // Reduce to last 100 actions
        patterns: Array.from(this.patterns.entries()).slice(-50), // Keep last 50 patterns
        userProfile: {
          ...this.userProfile,
          learningModel: {
            ...this.userProfile.learningModel,
            insights: this.userProfile.learningModel.insights.slice(-20), // Keep last 20 insights
            recommendations: this.userProfile.learningModel.recommendations.slice(-10), // Keep last 10 recommendations
            predictions: this.userProfile.learningModel.predictions.slice(-10) // Keep last 10 predictions
          }
        }
      };

      // Try to save to localStorage
      const serialized = JSON.stringify(dataToStore);
      
      // Check size before saving (localStorage typically has 5-10MB limit)
      if (serialized.length > 2000000) { // If over 2MB, reduce further
        const minimalData = {
          actions: this.actions.slice(-50),
          patterns: Array.from(this.patterns.entries()).slice(-20),
          userProfile: {
            id: this.userProfile.id,
            email: this.userProfile.email,
            preferences: this.userProfile.preferences,
            statistics: this.userProfile.statistics
          }
        };
        localStorage.setItem('userBehaviorAnalytics', JSON.stringify(minimalData));
      } else {
        localStorage.setItem('userBehaviorAnalytics', serialized);
      }
    } catch (error) {
      // Handle quota exceeded or other storage errors
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        console.warn('Storage quota exceeded, clearing old analytics data');
        
        // Clear old data and try again with minimal data
        try {
          localStorage.removeItem('userBehaviorAnalytics');
          const minimalData = {
            actions: this.actions.slice(-20),
            patterns: [],
            userProfile: {
              id: this.userProfile.id,
              email: this.userProfile.email,
              preferences: this.userProfile.preferences
            }
          };
          localStorage.setItem('userBehaviorAnalytics', JSON.stringify(minimalData));
        } catch (retryError) {
          console.error('Failed to save analytics even with minimal data:', retryError);
          // Continue operation without persistence
        }
      } else {
        console.error('Failed to persist analytics data:', error);
      }
    }
  }

  private emit(event: AnalyticsEvent) {
    this.listeners.forEach(listener => listener(event));
  }

  subscribe(listener: (event: AnalyticsEvent) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // Public API
  getProfile(): UserProfile {
    return this.userProfile;
  }

  getContext(): ContextState {
    return this.contextState;
  }

  getPatterns(): UserPattern[] {
    return Array.from(this.patterns.values());
  }

  getInsights(): UserInsight[] {
    return this.userProfile.learningModel.insights;
  }

  getRecommendations(): Recommendation[] {
    return this.userProfile.learningModel.recommendations;
  }
}

export interface AnalyticsEvent {
  type: 'action_recorded' | 'pattern_detected' | 'insight_generated' | 'recommendation_created';
  payload: any;
}

// Export singleton instance
export const userAnalytics = new UserBehaviorAnalytics('default-user', 'user@example.com');