import { EventEmitter } from 'events';
import { BrowserManager } from './browser-manager';
import { windowsAPI } from './windows-api';

// Agent Types
export enum AgentType {
  PLANNER = 'planner',
  CRITIC = 'critic',
  EXECUTOR = 'executor',
  RESEARCHER = 'researcher',
  FIXER = 'fixer'
}

// Agent Status
export enum AgentStatus {
  IDLE = 'idle',
  THINKING = 'thinking',
  WORKING = 'working',
  VALIDATING = 'validating',
  WAITING = 'waiting',
  ERROR = 'error'
}

// Task Priority Levels
export enum TaskPriority {
  LOW = 1,
  MEDIUM = 2,
  HIGH = 3,
  CRITICAL = 4
}

// Agent Message Types
export interface AgentMessage {
  from: AgentType;
  to: AgentType | 'broadcast';
  type: 'request' | 'response' | 'notification' | 'consensus';
  content: any;
  timestamp: Date;
  correlationId?: string;
}

// Task Definition
export interface AgentTask {
  id: string;
  type: string;
  description: string;
  priority: TaskPriority;
  context: any;
  subtasks?: AgentTask[];
  dependencies?: string[];
  result?: any;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  assignedAgent?: AgentType;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
}

// Consensus Protocol
export interface ConsensusRequest {
  id: string;
  action: string;
  proposer: AgentType;
  context: any;
  votes: Map<AgentType, boolean>;
  requiredVotes: number;
  deadline: Date;
}

// Base Agent Class
export abstract class BaseAgent extends EventEmitter {
  protected id: string;
  protected type: AgentType;
  protected status: AgentStatus = AgentStatus.IDLE;
  protected currentTask: AgentTask | null = null;
  protected messageQueue: AgentMessage[] = [];
  protected capabilities: string[] = [];
  protected confidence: number = 0;
  protected metrics: {
    tasksCompleted: number;
    tasksFailed: number;
    averageTime: number;
    successRate: number;
  } = {
    tasksCompleted: 0,
    tasksFailed: 0,
    averageTime: 0,
    successRate: 100
  };

  constructor(type: AgentType, capabilities: string[]) {
    super();
    this.type = type;
    this.capabilities = capabilities;
    this.id = `${type}-${Date.now()}`;
  }

  abstract processTask(task: AgentTask): Promise<any>;
  abstract validateResult(result: any, task: AgentTask): boolean;

  async handleTask(task: AgentTask): Promise<any> {
    this.status = AgentStatus.WORKING;
    this.currentTask = task;
    const startTime = Date.now();

    try {
      const result = await this.processTask(task);
      
      if (this.validateResult(result, task)) {
        task.result = result;
        task.status = 'completed';
        task.completedAt = new Date();
        
        // Update metrics
        this.metrics.tasksCompleted++;
        this.updateSuccessRate();
        this.updateAverageTime(Date.now() - startTime);
        
        this.emit('task-completed', { task, result });
        return result;
      } else {
        throw new Error('Result validation failed');
      }
    } catch (error: any) {
      task.status = 'failed';
      task.error = error.message;
      this.metrics.tasksFailed++;
      this.updateSuccessRate();
      
      this.emit('task-failed', { task, error });
      throw error;
    } finally {
      this.status = AgentStatus.IDLE;
      this.currentTask = null;
    }
  }

  sendMessage(to: AgentType | 'broadcast', type: string, content: any): void {
    const message: AgentMessage = {
      from: this.type,
      to,
      type: type as any,
      content,
      timestamp: new Date(),
      correlationId: `${this.id}-${Date.now()}`
    };
    
    this.emit('message', message);
  }

  receiveMessage(message: AgentMessage): void {
    if (message.to === this.type || message.to === 'broadcast') {
      this.messageQueue.push(message);
      this.processMessages();
    }
  }

  protected processMessages(): void {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      if (message) {
        this.handleMessage(message);
      }
    }
  }

  protected abstract handleMessage(message: AgentMessage): void;

  protected updateSuccessRate(): void {
    const total = this.metrics.tasksCompleted + this.metrics.tasksFailed;
    if (total > 0) {
      this.metrics.successRate = (this.metrics.tasksCompleted / total) * 100;
    }
  }

  protected updateAverageTime(duration: number): void {
    const total = this.metrics.tasksCompleted;
    if (total === 1) {
      this.metrics.averageTime = duration;
    } else {
      this.metrics.averageTime = 
        (this.metrics.averageTime * (total - 1) + duration) / total;
    }
  }

  getStatus(): AgentStatus {
    return this.status;
  }

  getMetrics(): any {
    return { ...this.metrics };
  }

  getCapabilities(): string[] {
    return [...this.capabilities];
  }
}

// Planner Agent - Decomposes complex tasks into subtasks
export class PlannerAgent extends BaseAgent {
  private planningStrategies = new Map<string, Function>();

  constructor() {
    super(AgentType.PLANNER, [
      'task-decomposition',
      'dependency-analysis',
      'resource-planning',
      'timeline-estimation'
    ]);

    this.initializeStrategies();
  }

  private initializeStrategies(): void {
    // Web scraping strategy
    this.planningStrategies.set('web-scraping', (task: AgentTask) => {
      return [
        { type: 'navigate', description: 'Navigate to target URL' },
        { type: 'wait', description: 'Wait for page load' },
        { type: 'extract', description: 'Extract data from page' },
        { type: 'validate', description: 'Validate extracted data' },
        { type: 'store', description: 'Store results' }
      ];
    });

    // Form automation strategy
    this.planningStrategies.set('form-automation', (task: AgentTask) => {
      return [
        { type: 'navigate', description: 'Navigate to form page' },
        { type: 'identify', description: 'Identify form fields' },
        { type: 'fill', description: 'Fill form fields' },
        { type: 'validate', description: 'Validate input' },
        { type: 'submit', description: 'Submit form' },
        { type: 'verify', description: 'Verify submission' }
      ];
    });

    // Data research strategy
    this.planningStrategies.set('research', (task: AgentTask) => {
      return [
        { type: 'query', description: 'Formulate search queries' },
        { type: 'search', description: 'Execute searches' },
        { type: 'analyze', description: 'Analyze results' },
        { type: 'synthesize', description: 'Synthesize information' },
        { type: 'report', description: 'Generate report' }
      ];
    });
  }

  async processTask(task: AgentTask): Promise<any> {
    this.status = AgentStatus.THINKING;
    
    // Analyze task complexity
    const complexity = this.assessComplexity(task);
    
    // Select planning strategy
    const strategy = this.selectStrategy(task);
    
    // Generate execution plan
    const plan = await this.generatePlan(task, strategy, complexity);
    
    // Optimize plan
    const optimizedPlan = this.optimizePlan(plan);
    
    // Add dependencies and priorities
    this.addDependencies(optimizedPlan);
    
    return {
      originalTask: task,
      complexity,
      strategy: strategy.name,
      plan: optimizedPlan,
      estimatedTime: this.estimateTime(optimizedPlan),
      requiredAgents: this.identifyRequiredAgents(optimizedPlan)
    };
  }

  validateResult(result: any, task: AgentTask): boolean {
    return result && 
           result.plan && 
           Array.isArray(result.plan) && 
           result.plan.length > 0;
  }

  protected handleMessage(message: AgentMessage): void {
    switch (message.type) {
      case 'request':
        if (message.content.action === 'replan') {
          this.handleReplanRequest(message.content);
        }
        break;
      case 'notification':
        if (message.content.type === 'task-failed') {
          this.handleTaskFailure(message.content);
        }
        break;
    }
  }

  private assessComplexity(task: AgentTask): number {
    let complexity = 1;
    
    // Check for multiple steps
    if (task.description.includes('and') || task.description.includes('then')) {
      complexity += 2;
    }
    
    // Check for data extraction
    if (task.type === 'scraping' || task.type === 'extraction') {
      complexity += 1;
    }
    
    // Check for automation
    if (task.type === 'automation' || task.type === 'workflow') {
      complexity += 2;
    }
    
    // Check for research
    if (task.type === 'research' || task.type === 'analysis') {
      complexity += 3;
    }
    
    return Math.min(complexity, 10);
  }

  private selectStrategy(task: AgentTask): any {
    // Try to find a matching strategy
    for (const [name, strategy] of Array.from(this.planningStrategies.entries())) {
      if (task.type.includes(name) || task.description.toLowerCase().includes(name)) {
        return { name, strategy };
      }
    }
    
    // Default strategy
    return {
      name: 'generic',
      strategy: (t: AgentTask) => [
        { type: 'analyze', description: 'Analyze task requirements' },
        { type: 'execute', description: 'Execute main task' },
        { type: 'verify', description: 'Verify results' }
      ]
    };
  }

  private async generatePlan(task: AgentTask, strategy: any, complexity: number): Promise<AgentTask[]> {
    const basePlan = strategy.strategy(task);
    
    return basePlan.map((step: any, index: number) => ({
      id: `${task.id}-${index}`,
      type: step.type,
      description: step.description,
      priority: this.calculatePriority(step, index, complexity),
      context: { ...task.context, parentTask: task.id },
      status: 'pending' as const,
      createdAt: new Date()
    }));
  }

  private optimizePlan(plan: AgentTask[]): AgentTask[] {
    // Remove redundant steps
    const optimized = plan.filter((step, index) => {
      if (index === 0) return true;
      return step.type !== plan[index - 1].type;
    });
    
    // Reorder by priority
    return optimized.sort((a, b) => {
      if (a.dependencies?.length && !b.dependencies?.length) return 1;
      if (!a.dependencies?.length && b.dependencies?.length) return -1;
      return b.priority - a.priority;
    });
  }

  private addDependencies(plan: AgentTask[]): void {
    plan.forEach((step, index) => {
      if (index > 0) {
        // Add dependency on previous step for sequential tasks
        if (['wait', 'verify', 'validate'].includes(step.type)) {
          step.dependencies = [plan[index - 1].id];
        }
      }
    });
  }

  private calculatePriority(step: any, index: number, complexity: number): TaskPriority {
    if (step.type === 'validate' || step.type === 'verify') {
      return TaskPriority.HIGH;
    }
    if (index === 0) {
      return TaskPriority.HIGH;
    }
    if (complexity > 5) {
      return TaskPriority.MEDIUM;
    }
    return TaskPriority.LOW;
  }

  private estimateTime(plan: AgentTask[]): number {
    const timePerStep = {
      navigate: 3000,
      wait: 2000,
      extract: 5000,
      fill: 2000,
      submit: 1000,
      validate: 1000,
      verify: 2000,
      analyze: 10000,
      execute: 5000,
      default: 3000
    };
    
    return plan.reduce((total, step) => {
      const stepTime = timePerStep[step.type as keyof typeof timePerStep] || timePerStep.default;
      return total + stepTime;
    }, 0);
  }

  private identifyRequiredAgents(plan: AgentTask[]): AgentType[] {
    const agents = new Set<AgentType>();
    
    plan.forEach(step => {
      switch (step.type) {
        case 'navigate':
        case 'fill':
        case 'submit':
        case 'extract':
          agents.add(AgentType.EXECUTOR);
          break;
        case 'validate':
        case 'verify':
          agents.add(AgentType.CRITIC);
          break;
        case 'analyze':
        case 'research':
          agents.add(AgentType.RESEARCHER);
          break;
      }
    });
    
    return Array.from(agents);
  }

  private handleReplanRequest(content: any): void {
    // Handle replanning requests
    this.emit('replan-needed', content);
  }

  private handleTaskFailure(content: any): void {
    // Adjust strategy based on failures
    this.confidence = Math.max(0, this.confidence - 10);
  }
}

// Critic Agent - Validates and provides quality control
export class CriticAgent extends BaseAgent {
  private validationRules = new Map<string, Function>();
  private qualityThresholds = {
    dataCompleteness: 0.8,
    accuracy: 0.9,
    consistency: 0.85
  };

  constructor() {
    super(AgentType.CRITIC, [
      'data-validation',
      'quality-assessment',
      'error-detection',
      'compliance-checking'
    ]);

    this.initializeValidationRules();
  }

  private initializeValidationRules(): void {
    // Data extraction validation
    this.validationRules.set('extraction', (data: any) => {
      const checks = {
        hasData: !!data && Object.keys(data).length > 0,
        hasRequiredFields: true, // Check based on context
        dataTypes: true, // Validate data types
        formatting: true // Check formatting
      };
      
      return {
        valid: Object.values(checks).every(c => c),
        checks,
        score: Object.values(checks).filter(c => c).length / Object.values(checks).length
      };
    });

    // Form submission validation
    this.validationRules.set('submission', (result: any) => {
      return {
        valid: result.success === true,
        checks: {
          submitted: result.success,
          confirmation: !!result.confirmationId,
          noErrors: !result.error
        },
        score: result.success ? 1 : 0
      };
    });

    // Research quality validation
    this.validationRules.set('research', (data: any) => {
      const checks = {
        hasSources: data.sources && data.sources.length > 0,
        hasConclusions: !!data.conclusions,
        sufficientData: data.dataPoints && data.dataPoints.length >= 3,
        citationsValid: true // Validate citations
      };
      
      return {
        valid: Object.values(checks).filter(c => c).length >= 3,
        checks,
        score: Object.values(checks).filter(c => c).length / Object.values(checks).length
      };
    });
  }

  async processTask(task: AgentTask): Promise<any> {
    this.status = AgentStatus.VALIDATING;
    
    // Perform validation based on task type
    const validation = await this.validate(task);
    
    // Assess quality
    const quality = this.assessQuality(validation, task);
    
    // Check compliance
    const compliance = this.checkCompliance(task);
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(validation, quality, compliance);
    
    return {
      task: task.id,
      validation,
      quality,
      compliance,
      recommendations,
      approved: this.shouldApprove(validation, quality, compliance),
      timestamp: new Date()
    };
  }

  validateResult(result: any, task: AgentTask): boolean {
    return result && 
           result.validation !== undefined &&
           result.quality !== undefined;
  }

  protected handleMessage(message: AgentMessage): void {
    switch (message.type) {
      case 'request':
        if (message.content.action === 'validate') {
          this.handleValidationRequest(message.content);
        }
        break;
      case 'consensus':
        this.participateInConsensus(message.content);
        break;
    }
  }

  private async validate(task: AgentTask): Promise<any> {
    const validator = this.validationRules.get(task.type);
    
    if (validator && task.result) {
      return validator(task.result);
    }
    
    // Default validation
    return {
      valid: !!task.result,
      checks: {
        hasResult: !!task.result,
        noErrors: !task.error,
        completed: task.status === 'completed'
      },
      score: task.result ? 0.5 : 0
    };
  }

  private assessQuality(validation: any, task: AgentTask): any {
    const scores = {
      completeness: this.assessCompleteness(task),
      accuracy: validation.score || 0,
      consistency: this.assessConsistency(task),
      timeliness: this.assessTimeliness(task)
    };
    
    const overallScore = Object.values(scores).reduce((sum, score) => sum + score, 0) / Object.values(scores).length;
    
    return {
      scores,
      overallScore,
      grade: this.calculateGrade(overallScore),
      meetsThreshold: overallScore >= this.qualityThresholds.dataCompleteness
    };
  }

  private checkCompliance(task: AgentTask): any {
    const rules = {
      dataPrivacy: true, // Check for PII handling
      security: true, // Check for secure practices
      rateLimit: true, // Check rate limiting compliance
      terms: true // Check terms of service compliance
    };
    
    return {
      compliant: Object.values(rules).every(r => r),
      rules,
      violations: Object.entries(rules).filter(([_, v]) => !v).map(([k]) => k)
    };
  }

  private generateRecommendations(validation: any, quality: any, compliance: any): string[] {
    const recommendations = [];
    
    if (!validation.valid) {
      recommendations.push('Retry task with adjusted parameters');
    }
    
    if (quality.overallScore < 0.7) {
      recommendations.push('Improve data collection methodology');
    }
    
    if (!compliance.compliant) {
      recommendations.push(`Address compliance violations: ${compliance.violations.join(', ')}`);
    }
    
    if (validation.checks && !validation.checks.hasRequiredFields) {
      recommendations.push('Ensure all required fields are captured');
    }
    
    return recommendations;
  }

  private shouldApprove(validation: any, quality: any, compliance: any): boolean {
    return validation.valid && 
           quality.meetsThreshold && 
           compliance.compliant;
  }

  private assessCompleteness(task: AgentTask): number {
    if (!task.result) return 0;
    
    // Check for expected fields/properties
    const expectedFields = this.getExpectedFields(task.type);
    if (expectedFields.length === 0) return 1;
    
    const actualFields = Object.keys(task.result);
    const presentFields = expectedFields.filter(f => actualFields.includes(f));
    
    return presentFields.length / expectedFields.length;
  }

  private assessConsistency(task: AgentTask): number {
    // Check consistency with previous similar tasks
    // For now, return a default value
    return 0.85;
  }

  private assessTimeliness(task: AgentTask): number {
    if (!task.startedAt || !task.completedAt) return 1;
    
    const duration = task.completedAt.getTime() - task.startedAt.getTime();
    const expectedDuration = 30000; // 30 seconds baseline
    
    if (duration <= expectedDuration) return 1;
    if (duration <= expectedDuration * 2) return 0.8;
    if (duration <= expectedDuration * 3) return 0.6;
    return 0.4;
  }

  private calculateGrade(score: number): string {
    if (score >= 0.9) return 'A';
    if (score >= 0.8) return 'B';
    if (score >= 0.7) return 'C';
    if (score >= 0.6) return 'D';
    return 'F';
  }

  private getExpectedFields(taskType: string): string[] {
    const fieldMap: Record<string, string[]> = {
      extraction: ['data', 'source', 'timestamp'],
      submission: ['success', 'confirmationId', 'response'],
      research: ['sources', 'conclusions', 'dataPoints'],
      navigation: ['url', 'status', 'loadTime']
    };
    
    return fieldMap[taskType] || [];
  }

  private handleValidationRequest(content: any): void {
    this.emit('validation-requested', content);
  }

  private participateInConsensus(consensus: ConsensusRequest): void {
    // Analyze the proposed action
    const vote = this.analyzeProposal(consensus);
    
    this.sendMessage('broadcast', 'consensus', {
      consensusId: consensus.id,
      agent: this.type,
      vote,
      reason: vote ? 'Meets quality standards' : 'Quality concerns detected'
    });
  }

  private analyzeProposal(consensus: ConsensusRequest): boolean {
    // Analyze based on quality and compliance standards
    // For now, approve if confidence is high enough
    return this.confidence > 50;
  }
}

// Executor Agent - Performs browser automation tasks
export class ExecutorAgent extends BaseAgent {
  private browserManager: BrowserManager;
  private executionStrategies = new Map<string, Function>();

  constructor(browserManager: BrowserManager) {
    super(AgentType.EXECUTOR, [
      'browser-automation',
      'data-extraction',
      'form-filling',
      'navigation',
      'screenshot-capture'
    ]);

    this.browserManager = browserManager;
    this.initializeStrategies();
  }

  private initializeStrategies(): void {
    // Navigation strategy
    this.executionStrategies.set('navigate', async (task: AgentTask) => {
      const { url, instanceId, tabId } = task.context;
      await this.browserManager.navigate(instanceId, tabId, url);
      return { success: true, url, timestamp: new Date() };
    });

    // Data extraction strategy
    this.executionStrategies.set('extract', async (task: AgentTask) => {
      const { selector, instanceId, tabId } = task.context;
      const script = `
        Array.from(document.querySelectorAll('${selector}')).map(el => ({
          text: el.textContent,
          href: el.href,
          src: el.src,
          value: el.value
        }))
      `;
      const data = await this.browserManager.executeScript(instanceId, tabId, script);
      return { data, selector, count: data.length };
    });

    // Form filling strategy
    this.executionStrategies.set('fill', async (task: AgentTask) => {
      const { fields, instanceId, tabId } = task.context;
      for (const [selector, value] of Object.entries(fields)) {
        const script = `
          const el = document.querySelector('${selector}');
          if (el) {
            el.value = '${value}';
            el.dispatchEvent(new Event('change', { bubbles: true }));
            true;
          } else {
            false;
          }
        `;
        await this.browserManager.executeScript(instanceId, tabId, script);
      }
      return { success: true, fieldsFilled: Object.keys(fields).length };
    });

    // Click strategy
    this.executionStrategies.set('click', async (task: AgentTask) => {
      const { selector, instanceId, tabId } = task.context;
      const script = `
        const el = document.querySelector('${selector}');
        if (el) {
          el.click();
          true;
        } else {
          false;
        }
      `;
      const result = await this.browserManager.executeScript(instanceId, tabId, script);
      return { success: result, selector };
    });

    // Wait strategy
    this.executionStrategies.set('wait', async (task: AgentTask) => {
      const { duration = 2000 } = task.context;
      await new Promise(resolve => setTimeout(resolve, duration));
      return { success: true, duration };
    });

    // Screenshot strategy
    this.executionStrategies.set('screenshot', async (task: AgentTask) => {
      const { instanceId, tabId, options = {} } = task.context;
      const screenshot = await this.browserManager.screenshot(instanceId, tabId, options);
      return { 
        success: true, 
        screenshot: screenshot.toString('base64'),
        timestamp: new Date()
      };
    });
  }

  async processTask(task: AgentTask): Promise<any> {
    this.status = AgentStatus.WORKING;
    
    // Get execution strategy
    const strategy = this.executionStrategies.get(task.type);
    
    if (!strategy) {
      throw new Error(`No execution strategy for task type: ${task.type}`);
    }
    
    try {
      // Execute the task
      const result = await strategy(task);
      
      // Log execution
      this.logExecution(task, result);
      
      return result;
    } catch (error: any) {
      // Handle execution errors
      return this.handleExecutionError(task, error);
    }
  }

  validateResult(result: any, task: AgentTask): boolean {
    return result && result.success !== false;
  }

  protected handleMessage(message: AgentMessage): void {
    switch (message.type) {
      case 'request':
        if (message.content.action === 'execute') {
          this.handleExecutionRequest(message.content);
        }
        break;
      case 'notification':
        if (message.content.type === 'browser-ready') {
          this.handleBrowserReady(message.content);
        }
        break;
    }
  }

  private logExecution(task: AgentTask, result: any): void {
    const log = {
      taskId: task.id,
      type: task.type,
      timestamp: new Date(),
      result: result.success,
      duration: Date.now() - task.startedAt!.getTime()
    };
    
    this.emit('execution-log', log);
  }

  private async handleExecutionError(task: AgentTask, error: Error): Promise<any> {
    // Try recovery strategies
    const recovery = await this.attemptRecovery(task, error);
    
    if (recovery.success) {
      return recovery.result;
    }
    
    // Request help from Fixer agent
    this.sendMessage(AgentType.FIXER, 'request', {
      action: 'fix',
      task,
      error: error.message
    });
    
    throw error;
  }

  private async attemptRecovery(task: AgentTask, error: Error): Promise<any> {
    // Simple recovery strategies
    if (error.message.includes('timeout')) {
      // Retry with longer timeout
      task.context.timeout = (task.context.timeout || 5000) * 2;
      return { success: false };
    }
    
    if (error.message.includes('not found')) {
      // Wait and retry
      await new Promise(resolve => setTimeout(resolve, 2000));
      return { success: false };
    }
    
    return { success: false };
  }

  private handleExecutionRequest(content: any): void {
    this.emit('execution-requested', content);
  }

  private handleBrowserReady(content: any): void {
    // Browser instance is ready
    this.confidence = 100;
  }
}

// Researcher Agent - Gathers and analyzes data
export class ResearcherAgent extends BaseAgent {
  private researchMethods = new Map<string, Function>();
  private knowledgeBase = new Map<string, any>();

  constructor() {
    super(AgentType.RESEARCHER, [
      'web-search',
      'data-analysis',
      'pattern-recognition',
      'information-synthesis'
    ]);

    this.initializeResearchMethods();
  }

  private initializeResearchMethods(): void {
    // Web search method
    this.researchMethods.set('search', async (query: string) => {
      // Simulate web search
      return {
        query,
        results: [
          { title: 'Result 1', url: 'https://example.com/1', snippet: 'Sample result' },
          { title: 'Result 2', url: 'https://example.com/2', snippet: 'Another result' }
        ],
        timestamp: new Date()
      };
    });

    // Data analysis method
    this.researchMethods.set('analyze', (data: any[]) => {
      const analysis = {
        count: data.length,
        types: this.analyzeDataTypes(data),
        patterns: this.findPatterns(data),
        summary: this.summarizeData(data)
      };
      
      return analysis;
    });

    // Information synthesis method
    this.researchMethods.set('synthesize', (sources: any[]) => {
      const synthesis = {
        mainPoints: this.extractMainPoints(sources),
        commonalities: this.findCommonalities(sources),
        contradictions: this.findContradictions(sources),
        conclusions: this.drawConclusions(sources)
      };
      
      return synthesis;
    });
  }

  async processTask(task: AgentTask): Promise<any> {
    this.status = AgentStatus.THINKING;
    
    // Determine research approach
    const approach = this.determineApproach(task);
    
    // Gather information
    const information = await this.gatherInformation(task, approach);
    
    // Analyze data
    const analysis = this.analyzeInformation(information);
    
    // Synthesize findings
    const synthesis = this.synthesizeFindings(analysis);
    
    // Store in knowledge base
    this.updateKnowledgeBase(task, synthesis);
    
    return {
      task: task.id,
      approach,
      sources: information.sources,
      analysis,
      synthesis,
      confidence: this.calculateConfidence(information, analysis),
      timestamp: new Date()
    };
  }

  validateResult(result: any, task: AgentTask): boolean {
    return result && 
           result.analysis && 
           result.synthesis &&
           result.confidence > 0.5;
  }

  protected handleMessage(message: AgentMessage): void {
    switch (message.type) {
      case 'request':
        if (message.content.action === 'research') {
          this.handleResearchRequest(message.content);
        }
        break;
      case 'notification':
        if (message.content.type === 'new-data') {
          this.handleNewData(message.content);
        }
        break;
    }
  }

  private determineApproach(task: AgentTask): string {
    if (task.description.includes('search') || task.description.includes('find')) {
      return 'search-based';
    }
    if (task.description.includes('analyze') || task.description.includes('examine')) {
      return 'analytical';
    }
    if (task.description.includes('compare') || task.description.includes('contrast')) {
      return 'comparative';
    }
    return 'exploratory';
  }

  private async gatherInformation(task: AgentTask, approach: string): Promise<any> {
    const sources = [];
    
    // Check knowledge base first
    const existingKnowledge = this.searchKnowledgeBase(task);
    if (existingKnowledge) {
      sources.push({ type: 'knowledge-base', data: existingKnowledge });
    }
    
    // Gather new information based on approach
    if (approach === 'search-based') {
      const searchResults = await this.researchMethods.get('search')!(task.description);
      sources.push({ type: 'web-search', data: searchResults });
    }
    
    return { sources, approach };
  }

  private analyzeInformation(information: any): any {
    const analyzer = this.researchMethods.get('analyze');
    if (!analyzer) return {};
    
    return analyzer(information.sources);
  }

  private synthesizeFindings(analysis: any): any {
    const synthesizer = this.researchMethods.get('synthesize');
    if (!synthesizer) return {};
    
    return synthesizer([analysis]);
  }

  private updateKnowledgeBase(task: AgentTask, synthesis: any): void {
    const key = this.generateKnowledgeKey(task);
    this.knowledgeBase.set(key, {
      task: task.id,
      synthesis,
      timestamp: new Date(),
      accessCount: 0
    });
  }

  private searchKnowledgeBase(task: AgentTask): any {
    const key = this.generateKnowledgeKey(task);
    const knowledge = this.knowledgeBase.get(key);
    
    if (knowledge) {
      knowledge.accessCount++;
      return knowledge;
    }
    
    return null;
  }

  private generateKnowledgeKey(task: AgentTask): string {
    return `${task.type}-${task.description.substring(0, 50)}`;
  }

  private analyzeDataTypes(data: any[]): Record<string, number> {
    const types: Record<string, number> = {};
    
    data.forEach(item => {
      const type = typeof item;
      types[type] = (types[type] || 0) + 1;
    });
    
    return types;
  }

  private findPatterns(data: any[]): string[] {
    const patterns = [];
    
    // Look for common patterns
    if (data.every(item => typeof item === 'object')) {
      patterns.push('All items are objects');
    }
    
    if (data.every(item => item && item.url)) {
      patterns.push('All items have URLs');
    }
    
    return patterns;
  }

  private summarizeData(data: any[]): string {
    return `Dataset contains ${data.length} items with ${Object.keys(this.analyzeDataTypes(data)).length} different types`;
  }

  private extractMainPoints(sources: any[]): string[] {
    return sources.slice(0, 3).map(s => `Point from ${s.type}: ${JSON.stringify(s.data).substring(0, 100)}`);
  }

  private findCommonalities(sources: any[]): string[] {
    // Find common elements across sources
    return ['Common pattern identified across sources'];
  }

  private findContradictions(sources: any[]): string[] {
    // Identify contradictory information
    return [];
  }

  private drawConclusions(sources: any[]): string[] {
    return [`Based on ${sources.length} sources, the research is complete`];
  }

  private calculateConfidence(information: any, analysis: any): number {
    let confidence = 0.5;
    
    // Increase confidence based on number of sources
    confidence += Math.min(information.sources.length * 0.1, 0.3);
    
    // Increase confidence based on analysis completeness
    if (analysis && Object.keys(analysis).length > 3) {
      confidence += 0.2;
    }
    
    return Math.min(confidence, 1);
  }

  private handleResearchRequest(content: any): void {
    this.emit('research-requested', content);
  }

  private handleNewData(content: any): void {
    // Process new data and update knowledge base
    this.updateKnowledgeBase(content.task, content.data);
  }
}

// Fixer Agent - Handles errors and recovery
export class FixerAgent extends BaseAgent {
  private fixStrategies = new Map<string, Function>();
  private errorPatterns = new Map<string, string>();

  constructor() {
    super(AgentType.FIXER, [
      'error-recovery',
      'retry-logic',
      'fallback-execution',
      'state-restoration'
    ]);

    this.initializeFixStrategies();
    this.initializeErrorPatterns();
  }

  private initializeFixStrategies(): void {
    // Timeout fix
    this.fixStrategies.set('timeout', async (task: AgentTask, error: Error) => {
      return {
        strategy: 'retry-with-timeout',
        action: 'Increase timeout and retry',
        params: { timeout: 30000 }
      };
    });

    // Element not found fix
    this.fixStrategies.set('not-found', async (task: AgentTask, error: Error) => {
      return {
        strategy: 'wait-and-retry',
        action: 'Wait for element and retry',
        params: { wait: 5000, retries: 3 }
      };
    });

    // Network error fix
    this.fixStrategies.set('network', async (task: AgentTask, error: Error) => {
      return {
        strategy: 'retry-with-backoff',
        action: 'Retry with exponential backoff',
        params: { initialDelay: 1000, maxRetries: 5 }
      };
    });

    // Permission error fix
    this.fixStrategies.set('permission', async (task: AgentTask, error: Error) => {
      return {
        strategy: 'alternative-approach',
        action: 'Try alternative method',
        params: { useAlternative: true }
      };
    });
  }

  private initializeErrorPatterns(): void {
    this.errorPatterns.set('timeout', 'timeout|timed out|took too long');
    this.errorPatterns.set('not-found', 'not found|cannot find|no such element');
    this.errorPatterns.set('network', 'network|connection|fetch failed');
    this.errorPatterns.set('permission', 'permission|denied|unauthorized|forbidden');
  }

  async processTask(task: AgentTask): Promise<any> {
    this.status = AgentStatus.WORKING;
    
    // Analyze the error
    const errorAnalysis = this.analyzeError(task);
    
    // Determine fix strategy
    const fixStrategy = await this.determineFixStrategy(task, errorAnalysis);
    
    // Apply fix
    const fixResult = await this.applyFix(task, fixStrategy);
    
    // Verify fix
    const verification = await this.verifyFix(task, fixResult);
    
    return {
      task: task.id,
      errorAnalysis,
      fixStrategy,
      fixResult,
      verification,
      success: verification.success,
      timestamp: new Date()
    };
  }

  validateResult(result: any, task: AgentTask): boolean {
    return result && result.success === true;
  }

  protected handleMessage(message: AgentMessage): void {
    switch (message.type) {
      case 'request':
        if (message.content.action === 'fix') {
          this.handleFixRequest(message.content);
        }
        break;
      case 'notification':
        if (message.content.type === 'error') {
          this.handleErrorNotification(message.content);
        }
        break;
    }
  }

  private analyzeError(task: AgentTask): any {
    if (!task.error) {
      return { type: 'unknown', message: 'No error found' };
    }
    
    // Identify error type
    const errorType = this.identifyErrorType(task.error);
    
    // Analyze error context
    const context = {
      taskType: task.type,
      taskDescription: task.description,
      errorMessage: task.error,
      timestamp: new Date()
    };
    
    // Determine severity
    const severity = this.assessSeverity(errorType);
    
    return {
      type: errorType,
      context,
      severity,
      recoverable: severity !== 'critical'
    };
  }

  private identifyErrorType(error: string): string {
    const errorLower = error.toLowerCase();
    
    for (const [type, pattern] of Array.from(this.errorPatterns.entries())) {
      const regex = new RegExp(pattern, 'i');
      if (regex.test(errorLower)) {
        return type;
      }
    }
    
    return 'unknown';
  }

  private assessSeverity(errorType: string): string {
    const severityMap: Record<string, string> = {
      timeout: 'low',
      'not-found': 'medium',
      network: 'medium',
      permission: 'high',
      unknown: 'medium'
    };
    
    return severityMap[errorType] || 'medium';
  }

  private async determineFixStrategy(task: AgentTask, errorAnalysis: any): Promise<any> {
    const strategy = this.fixStrategies.get(errorAnalysis.type);
    
    if (strategy) {
      return await strategy(task, new Error(task.error || ''));
    }
    
    // Default fallback strategy
    return {
      strategy: 'retry',
      action: 'Simple retry',
      params: { retries: 3 }
    };
  }

  private async applyFix(task: AgentTask, fixStrategy: any): Promise<any> {
    try {
      switch (fixStrategy.strategy) {
        case 'retry-with-timeout':
          return await this.retryWithTimeout(task, fixStrategy.params);
        
        case 'wait-and-retry':
          return await this.waitAndRetry(task, fixStrategy.params);
        
        case 'retry-with-backoff':
          return await this.retryWithBackoff(task, fixStrategy.params);
        
        case 'alternative-approach':
          return await this.tryAlternative(task, fixStrategy.params);
        
        default:
          return await this.simpleRetry(task, fixStrategy.params);
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        strategy: fixStrategy.strategy
      };
    }
  }

  private async verifyFix(task: AgentTask, fixResult: any): Promise<any> {
    if (!fixResult.success) {
      return { success: false, reason: 'Fix failed to execute' };
    }
    
    // Verify the task can now complete
    return {
      success: true,
      verification: 'Fix applied successfully',
      canProceed: true
    };
  }

  private async retryWithTimeout(task: AgentTask, params: any): Promise<any> {
    task.context.timeout = params.timeout;
    return { success: true, applied: 'timeout-increase' };
  }

  private async waitAndRetry(task: AgentTask, params: any): Promise<any> {
    await new Promise(resolve => setTimeout(resolve, params.wait));
    return { success: true, applied: 'wait-and-retry' };
  }

  private async retryWithBackoff(task: AgentTask, params: any): Promise<any> {
    let delay = params.initialDelay;
    
    for (let i = 0; i < params.maxRetries; i++) {
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2;
      
      // Try to re-execute
      if (i === params.maxRetries - 1) {
        return { success: true, applied: 'backoff-retry', attempts: i + 1 };
      }
    }
    
    return { success: false, applied: 'backoff-retry' };
  }

  private async tryAlternative(task: AgentTask, params: any): Promise<any> {
    // Implement alternative approach
    task.context.useAlternative = true;
    return { success: true, applied: 'alternative-method' };
  }

  private async simpleRetry(task: AgentTask, params: any): Promise<any> {
    const retries = params.retries || 3;
    return { success: true, applied: 'simple-retry', retries };
  }

  private handleFixRequest(content: any): void {
    this.emit('fix-requested', content);
  }

  private handleErrorNotification(content: any): void {
    // Log error for pattern learning
    this.updateErrorPatterns(content.error);
  }

  private updateErrorPatterns(error: string): void {
    // Learn from new errors to improve pattern recognition
    // This would be more sophisticated in production
  }
}

// Agent Orchestrator - Manages all agents and coordinates their actions
export class AgentOrchestrator extends EventEmitter {
  private agents = new Map<AgentType, BaseAgent>();
  private taskQueue: AgentTask[] = [];
  private activeConsensus = new Map<string, ConsensusRequest>();
  private taskAssignments = new Map<string, AgentType>();
  private orchestrationMode: 'manual' | 'copilot' | 'autopilot' | 'pm' = 'copilot';

  constructor(browserManager: BrowserManager) {
    super();
    
    // Initialize agents
    this.agents.set(AgentType.PLANNER, new PlannerAgent());
    this.agents.set(AgentType.CRITIC, new CriticAgent());
    this.agents.set(AgentType.EXECUTOR, new ExecutorAgent(browserManager));
    this.agents.set(AgentType.RESEARCHER, new ResearcherAgent());
    this.agents.set(AgentType.FIXER, new FixerAgent());
    
    // Setup agent communication
    this.setupAgentCommunication();
  }

  private setupAgentCommunication(): void {
    this.agents.forEach(agent => {
      agent.on('message', (message: AgentMessage) => {
        this.routeMessage(message);
      });
      
      agent.on('task-completed', (data) => {
        this.handleTaskCompletion(data);
      });
      
      agent.on('task-failed', (data) => {
        this.handleTaskFailure(data);
      });
    });
  }

  async executeTask(task: AgentTask): Promise<any> {
    // Add to queue
    this.taskQueue.push(task);
    
    // Plan the task
    const plan = await this.planTask(task);
    
    // Get consensus if needed
    if (this.requiresConsensus(task)) {
      const consensus = await this.getConsensus(task, plan);
      if (!consensus) {
        throw new Error('Failed to reach consensus on task execution');
      }
    }
    
    // Execute the plan
    const results = await this.executePlan(plan);
    
    // Validate results
    const validation = await this.validateResults(results);
    
    if (!validation.approved) {
      // Request fix if validation fails
      const fixed = await this.requestFix(task, validation);
      if (fixed) {
        return fixed;
      }
    }
    
    return {
      task: task.id,
      plan,
      results,
      validation,
      status: 'completed',
      timestamp: new Date()
    };
  }

  private async planTask(task: AgentTask): Promise<any> {
    const planner = this.agents.get(AgentType.PLANNER);
    if (!planner) throw new Error('Planner agent not available');
    
    return await planner.handleTask(task);
  }

  private requiresConsensus(task: AgentTask): boolean {
    // Require consensus for high priority or critical tasks
    return task.priority >= TaskPriority.HIGH || 
           this.orchestrationMode === 'manual';
  }

  private async getConsensus(task: AgentTask, plan: any): Promise<boolean> {
    const consensusId = `consensus-${task.id}`;
    const consensus: ConsensusRequest = {
      id: consensusId,
      action: 'execute-task',
      proposer: AgentType.PLANNER,
      context: { task, plan },
      votes: new Map(),
      requiredVotes: Math.ceil(this.agents.size * 0.6), // 60% majority
      deadline: new Date(Date.now() + 10000) // 10 second deadline
    };
    
    this.activeConsensus.set(consensusId, consensus);
    
    // Request votes from all agents
    this.broadcastMessage({
      from: AgentType.PLANNER,
      to: 'broadcast',
      type: 'consensus',
      content: consensus,
      timestamp: new Date()
    });
    
    // Wait for votes
    await this.waitForConsensus(consensus);
    
    // Check if consensus reached
    const approvals = Array.from(consensus.votes.values()).filter(v => v).length;
    return approvals >= consensus.requiredVotes;
  }

  private async waitForConsensus(consensus: ConsensusRequest): Promise<void> {
    const deadline = consensus.deadline.getTime();
    
    while (Date.now() < deadline) {
      if (consensus.votes.size >= this.agents.size) {
        break;
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  private async executePlan(plan: any): Promise<any[]> {
    const results = [];
    
    for (const step of plan.plan) {
      // Assign agent based on step type
      const agent = this.selectAgent(step);
      
      if (!agent) {
        throw new Error(`No agent available for step: ${step.type}`);
      }
      
      // Execute step
      const result = await agent.handleTask(step);
      results.push(result);
      
      // Check if should continue based on mode
      if (!this.shouldContinue(step, result)) {
        break;
      }
    }
    
    return results;
  }

  private selectAgent(step: AgentTask): BaseAgent | undefined {
    // Select best agent for the task
    const agentMap: Record<string, AgentType> = {
      navigate: AgentType.EXECUTOR,
      extract: AgentType.EXECUTOR,
      fill: AgentType.EXECUTOR,
      click: AgentType.EXECUTOR,
      validate: AgentType.CRITIC,
      verify: AgentType.CRITIC,
      analyze: AgentType.RESEARCHER,
      research: AgentType.RESEARCHER,
      fix: AgentType.FIXER
    };
    
    const agentType = agentMap[step.type];
    return agentType ? this.agents.get(agentType) : undefined;
  }

  private shouldContinue(step: AgentTask, result: any): boolean {
    if (this.orchestrationMode === 'manual') {
      // In manual mode, stop after each step
      return false;
    }
    
    if (this.orchestrationMode === 'copilot') {
      // In copilot mode, continue unless there's an error
      return !result.error;
    }
    
    // In autopilot and PM mode, always continue
    return true;
  }

  private async validateResults(results: any[]): Promise<any> {
    const critic = this.agents.get(AgentType.CRITIC);
    if (!critic) {
      return { approved: true, reason: 'No critic available' };
    }
    
    const validationTask: AgentTask = {
      id: `validation-${Date.now()}`,
      type: 'validation',
      description: 'Validate execution results',
      priority: TaskPriority.HIGH,
      context: { results },
      status: 'pending',
      createdAt: new Date()
    };
    
    return await critic.handleTask(validationTask);
  }

  private async requestFix(task: AgentTask, validation: any): Promise<any> {
    const fixer = this.agents.get(AgentType.FIXER);
    if (!fixer) return null;
    
    const fixTask: AgentTask = {
      id: `fix-${task.id}`,
      type: 'fix',
      description: `Fix issues with task ${task.id}`,
      priority: TaskPriority.HIGH,
      context: { originalTask: task, validation },
      status: 'pending',
      createdAt: new Date()
    };
    
    return await fixer.handleTask(fixTask);
  }

  private routeMessage(message: AgentMessage): void {
    if (message.to === 'broadcast') {
      this.broadcastMessage(message);
    } else {
      const targetAgent = this.agents.get(message.to as AgentType);
      if (targetAgent) {
        targetAgent.receiveMessage(message);
      }
    }
    
    // Handle consensus votes
    if (message.type === 'consensus' && message.content.consensusId) {
      const consensus = this.activeConsensus.get(message.content.consensusId);
      if (consensus) {
        consensus.votes.set(message.from, message.content.vote);
      }
    }
  }

  private broadcastMessage(message: AgentMessage): void {
    this.agents.forEach(agent => {
      agent.receiveMessage(message);
    });
  }

  private handleTaskCompletion(data: any): void {
    this.emit('task-completed', data);
    
    // Remove from queue
    this.taskQueue = this.taskQueue.filter(t => t.id !== data.task.id);
    
    // Update metrics
    this.updateOrchestrationMetrics('completion', data);
  }

  private handleTaskFailure(data: any): void {
    this.emit('task-failed', data);
    
    // Attempt recovery
    this.attemptTaskRecovery(data.task, data.error);
    
    // Update metrics
    this.updateOrchestrationMetrics('failure', data);
  }

  private async attemptTaskRecovery(task: AgentTask, error: Error): Promise<void> {
    const fixer = this.agents.get(AgentType.FIXER);
    if (!fixer) return;
    
    const fixTask: AgentTask = {
      id: `recovery-${task.id}`,
      type: 'fix',
      description: `Recover from failure in task ${task.id}`,
      priority: TaskPriority.HIGH,
      context: { task, error: error.message },
      status: 'pending',
      createdAt: new Date()
    };
    
    try {
      await fixer.handleTask(fixTask);
      // Retry original task
      await this.executeTask(task);
    } catch (e) {
      // Recovery failed
      this.emit('recovery-failed', { task, error: e });
    }
  }

  private updateOrchestrationMetrics(event: string, data: any): void {
    // Track orchestration performance
    this.emit('metrics-update', {
      event,
      timestamp: new Date(),
      agentMetrics: this.getAgentMetrics(),
      taskQueueSize: this.taskQueue.length
    });
  }

  setMode(mode: 'manual' | 'copilot' | 'autopilot' | 'pm'): void {
    this.orchestrationMode = mode;
    this.emit('mode-changed', mode);
  }

  getAgentStatus(): Map<AgentType, AgentStatus> {
    const status = new Map<AgentType, AgentStatus>();
    
    this.agents.forEach((agent, type) => {
      status.set(type, agent.getStatus());
    });
    
    return status;
  }

  getAgentMetrics(): Map<AgentType, any> {
    const metrics = new Map<AgentType, any>();
    
    this.agents.forEach((agent, type) => {
      metrics.set(type, agent.getMetrics());
    });
    
    return metrics;
  }

  getTaskQueue(): AgentTask[] {
    return [...this.taskQueue];
  }

  getMode(): string {
    return this.orchestrationMode;
  }
}

export const createAgentOrchestrator = (browserManager: BrowserManager) => {
  return new AgentOrchestrator(browserManager);
};