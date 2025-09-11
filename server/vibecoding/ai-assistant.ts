import OpenAI from 'openai';
import { db } from '../db';
import { vibeProfiles, workflowTemplates, users } from '@shared/schema';
import { eq } from 'drizzle-orm';

// AI Assistant Configuration
interface AIConfig {
  model: string;
  temperature: number;
  maxTokens: number;
  topP: number;
  frequencyPenalty: number;
  presencePenalty: number;
}

// Code Analysis Result
interface CodeAnalysis {
  suggestions: CodeSuggestion[];
  bugs: BugReport[];
  optimizations: OptimizationRecommendation[];
  security: SecurityVulnerability[];
  documentation: DocumentationSuggestion[];
  tests: TestCaseSuggestion[];
  refactoring: RefactoringOption[];
  performance: PerformanceMetric[];
}

interface CodeSuggestion {
  type: 'completion' | 'import' | 'snippet' | 'pattern';
  code: string;
  description: string;
  confidence: number;
  context?: string;
}

interface BugReport {
  severity: 'critical' | 'high' | 'medium' | 'low';
  type: string;
  line: number;
  column: number;
  message: string;
  fix?: string;
}

interface OptimizationRecommendation {
  type: 'performance' | 'memory' | 'readability' | 'maintainability';
  impact: 'high' | 'medium' | 'low';
  description: string;
  before: string;
  after: string;
}

interface SecurityVulnerability {
  severity: 'critical' | 'high' | 'medium' | 'low';
  type: string;
  cwe: string;
  description: string;
  recommendation: string;
  line?: number;
}

interface DocumentationSuggestion {
  type: 'function' | 'class' | 'module' | 'variable';
  name: string;
  currentDoc?: string;
  suggestedDoc: string;
  params?: Array<{ name: string; type: string; description: string }>;
  returns?: { type: string; description: string };
}

interface TestCaseSuggestion {
  type: 'unit' | 'integration' | 'e2e';
  name: string;
  description: string;
  code: string;
  coverage: string[];
}

interface RefactoringOption {
  type: 'extract-method' | 'extract-variable' | 'inline' | 'rename' | 'move' | 'simplify';
  description: string;
  impact: string;
  before: string;
  after: string;
}

interface PerformanceMetric {
  metric: string;
  value: number;
  unit: string;
  benchmark?: number;
  recommendation?: string;
}

export class AIAssistant {
  private openai: OpenAI | null = null;
  private config: AIConfig = {
    model: 'gpt-4-turbo-preview',
    temperature: 0.7,
    maxTokens: 2000,
    topP: 1,
    frequencyPenalty: 0,
    presencePenalty: 0,
  };

  constructor() {
    // Initialize OpenAI if API key is available
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
    }
  }

  // Initialize AI with custom config
  initialize(config: Partial<AIConfig>): void {
    this.config = { ...this.config, ...config };
  }

  // Analyze code and provide comprehensive feedback
  async analyzeCode(
    code: string,
    language: string,
    context?: {
      fileName?: string;
      projectType?: string;
      dependencies?: string[];
      vibeProfile?: any;
    }
  ): Promise<CodeAnalysis> {
    const analysis: CodeAnalysis = {
      suggestions: [],
      bugs: [],
      optimizations: [],
      security: [],
      documentation: [],
      tests: [],
      refactoring: [],
      performance: [],
    };

    // Parallel analysis tasks
    const [
      suggestions,
      bugs,
      optimizations,
      security,
      documentation,
      tests,
      refactoring,
      performance,
    ] = await Promise.all([
      this.getCodeSuggestions(code, language, context),
      this.detectBugs(code, language),
      this.getOptimizations(code, language),
      this.detectSecurityIssues(code, language),
      this.generateDocumentation(code, language),
      this.generateTestCases(code, language),
      this.getRefactoringOptions(code, language),
      this.analyzePerformance(code, language),
    ]);

    analysis.suggestions = suggestions;
    analysis.bugs = bugs;
    analysis.optimizations = optimizations;
    analysis.security = security;
    analysis.documentation = documentation;
    analysis.tests = tests;
    analysis.refactoring = refactoring;
    analysis.performance = performance;

    return analysis;
  }

  // Get code completion suggestions
  async getCodeSuggestions(
    code: string,
    language: string,
    context?: any
  ): Promise<CodeSuggestion[]> {
    if (!this.openai) {
      return this.getOfflineSuggestions(code, language);
    }

    try {
      const prompt = this.buildSuggestionPrompt(code, language, context);
      const response = await this.openai.chat.completions.create({
        model: this.config.model,
        messages: [
          {
            role: 'system',
            content: `You are an expert ${language} developer providing code suggestions.`,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: this.config.temperature,
        max_tokens: this.config.maxTokens,
      });

      return this.parseSuggestions(response.choices[0].message?.content || '');
    } catch (error) {
      console.error('AI suggestion error:', error);
      return this.getOfflineSuggestions(code, language);
    }
  }

  // Detect bugs in code
  async detectBugs(code: string, language: string): Promise<BugReport[]> {
    const bugs: BugReport[] = [];

    // Common bug patterns
    const patterns = this.getBugPatterns(language);
    
    for (const pattern of patterns) {
      const matches = code.matchAll(pattern.regex);
      for (const match of matches) {
        if (match.index !== undefined) {
          const lines = code.substring(0, match.index).split('\n');
          bugs.push({
            severity: pattern.severity,
            type: pattern.type,
            line: lines.length,
            column: lines[lines.length - 1].length + 1,
            message: pattern.message,
            fix: pattern.fix?.(match[0]),
          });
        }
      }
    }

    // AI-powered bug detection if available
    if (this.openai) {
      const aiBugs = await this.detectBugsWithAI(code, language);
      bugs.push(...aiBugs);
    }

    return bugs;
  }

  // Get optimization recommendations
  async getOptimizations(code: string, language: string): Promise<OptimizationRecommendation[]> {
    const optimizations: OptimizationRecommendation[] = [];

    // Performance optimizations
    const perfPatterns = this.getPerformancePatterns(language);
    
    for (const pattern of perfPatterns) {
      if (pattern.detect(code)) {
        optimizations.push({
          type: 'performance',
          impact: pattern.impact,
          description: pattern.description,
          before: pattern.before,
          after: pattern.after,
        });
      }
    }

    // Memory optimizations
    const memPatterns = this.getMemoryPatterns(language);
    
    for (const pattern of memPatterns) {
      if (pattern.detect(code)) {
        optimizations.push({
          type: 'memory',
          impact: pattern.impact,
          description: pattern.description,
          before: pattern.before,
          after: pattern.after,
        });
      }
    }

    return optimizations;
  }

  // Detect security vulnerabilities
  async detectSecurityIssues(code: string, language: string): Promise<SecurityVulnerability[]> {
    const vulnerabilities: SecurityVulnerability[] = [];

    // Common security patterns
    const securityPatterns = this.getSecurityPatterns(language);
    
    for (const pattern of securityPatterns) {
      const matches = code.matchAll(pattern.regex);
      for (const match of matches) {
        if (match.index !== undefined) {
          const lines = code.substring(0, match.index).split('\n');
          vulnerabilities.push({
            severity: pattern.severity,
            type: pattern.type,
            cwe: pattern.cwe,
            description: pattern.description,
            recommendation: pattern.recommendation,
            line: lines.length,
          });
        }
      }
    }

    return vulnerabilities;
  }

  // Generate documentation
  async generateDocumentation(code: string, language: string): Promise<DocumentationSuggestion[]> {
    const suggestions: DocumentationSuggestion[] = [];

    // Parse functions and classes
    const entities = this.parseCodeEntities(code, language);
    
    for (const entity of entities) {
      if (!entity.hasDoc || entity.docQuality < 0.5) {
        suggestions.push({
          type: entity.type,
          name: entity.name,
          currentDoc: entity.currentDoc,
          suggestedDoc: await this.generateDocString(entity, language),
          params: entity.params,
          returns: entity.returns,
        });
      }
    }

    return suggestions;
  }

  // Generate test cases
  async generateTestCases(code: string, language: string): Promise<TestCaseSuggestion[]> {
    const testCases: TestCaseSuggestion[] = [];

    // Parse testable functions
    const functions = this.parseTestableFunctions(code, language);
    
    for (const func of functions) {
      testCases.push({
        type: 'unit',
        name: `test_${func.name}`,
        description: `Unit test for ${func.name}`,
        code: await this.generateTestCode(func, language),
        coverage: [func.name],
      });
    }

    return testCases;
  }

  // Get refactoring options
  async getRefactoringOptions(code: string, language: string): Promise<RefactoringOption[]> {
    const options: RefactoringOption[] = [];

    // Check for long methods
    const longMethods = this.findLongMethods(code, language);
    for (const method of longMethods) {
      options.push({
        type: 'extract-method',
        description: `Extract logic from ${method.name} into smaller methods`,
        impact: 'Improves readability and testability',
        before: method.code,
        after: method.refactored,
      });
    }

    // Check for duplicate code
    const duplicates = this.findDuplicateCode(code);
    for (const dup of duplicates) {
      options.push({
        type: 'extract-method',
        description: 'Extract duplicate code into reusable function',
        impact: 'Reduces code duplication',
        before: dup.instances.join('\n---\n'),
        after: dup.extracted,
      });
    }

    return options;
  }

  // Analyze performance
  async analyzePerformance(code: string, language: string): Promise<PerformanceMetric[]> {
    const metrics: PerformanceMetric[] = [];

    // Cyclomatic complexity
    const complexity = this.calculateCyclomaticComplexity(code, language);
    metrics.push({
      metric: 'Cyclomatic Complexity',
      value: complexity,
      unit: 'score',
      benchmark: 10,
      recommendation: complexity > 10 ? 'Consider breaking down complex functions' : undefined,
    });

    // Lines of code
    const loc = code.split('\n').length;
    metrics.push({
      metric: 'Lines of Code',
      value: loc,
      unit: 'lines',
    });

    // Function count
    const functionCount = this.countFunctions(code, language);
    metrics.push({
      metric: 'Function Count',
      value: functionCount,
      unit: 'functions',
    });

    // Nesting depth
    const maxNesting = this.calculateMaxNesting(code);
    metrics.push({
      metric: 'Max Nesting Depth',
      value: maxNesting,
      unit: 'levels',
      benchmark: 4,
      recommendation: maxNesting > 4 ? 'Reduce nesting for better readability' : undefined,
    });

    return metrics;
  }

  // Generate workflow from description
  async generateWorkflow(
    description: string,
    vibeProfileId?: string
  ): Promise<any> {
    let context = {};
    
    if (vibeProfileId) {
      const [profile] = await db
        .select()
        .from(vibeProfiles)
        .where(eq(vibeProfiles.id, vibeProfileId))
        .limit(1);
      
      if (profile) {
        context = profile;
      }
    }

    const workflow = {
      name: this.extractWorkflowName(description),
      description,
      nodes: await this.generateWorkflowNodes(description, context),
      edges: [],
      variables: {},
      settings: {},
    };

    // Connect nodes
    workflow.edges = this.generateWorkflowEdges(workflow.nodes);

    return workflow;
  }

  // Generate code from natural language
  async generateCode(
    prompt: string,
    language: string,
    context?: any
  ): Promise<string> {
    if (!this.openai) {
      return this.generateOfflineCode(prompt, language);
    }

    try {
      const systemPrompt = this.buildCodeGenerationSystemPrompt(language, context);
      const response = await this.openai.chat.completions.create({
        model: this.config.model,
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.5,
        max_tokens: this.config.maxTokens,
      });

      return this.extractCodeFromResponse(response.choices[0].message?.content || '');
    } catch (error) {
      console.error('Code generation error:', error);
      return this.generateOfflineCode(prompt, language);
    }
  }

  // Explain code
  async explainCode(code: string, language: string): Promise<string> {
    if (!this.openai) {
      return 'Code explanation requires AI service connection';
    }

    try {
      const response = await this.openai.chat.completions.create({
        model: this.config.model,
        messages: [
          {
            role: 'system',
            content: `You are an expert ${language} developer explaining code clearly and concisely.`,
          },
          {
            role: 'user',
            content: `Explain this ${language} code:\n\n${code}`,
          },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      });

      return response.choices[0].message?.content || 'Unable to explain code';
    } catch (error) {
      console.error('Code explanation error:', error);
      return 'Error explaining code';
    }
  }

  // Translate code between languages
  async translateCode(
    code: string,
    fromLanguage: string,
    toLanguage: string
  ): Promise<string> {
    if (!this.openai) {
      return `// Translation from ${fromLanguage} to ${toLanguage} requires AI service`;
    }

    try {
      const response = await this.openai.chat.completions.create({
        model: this.config.model,
        messages: [
          {
            role: 'system',
            content: `You are an expert developer translating code from ${fromLanguage} to ${toLanguage}.`,
          },
          {
            role: 'user',
            content: `Translate this ${fromLanguage} code to ${toLanguage}:\n\n${code}`,
          },
        ],
        temperature: 0.3,
        max_tokens: this.config.maxTokens,
      });

      return this.extractCodeFromResponse(response.choices[0].message?.content || '');
    } catch (error) {
      console.error('Code translation error:', error);
      return `// Translation error: ${error}`;
    }
  }

  // Review pull request
  async reviewPullRequest(
    changes: Array<{ file: string; diff: string }>,
    context?: any
  ): Promise<{
    summary: string;
    issues: Array<{ severity: string; file: string; line: number; message: string }>;
    suggestions: string[];
    approval: 'approve' | 'request-changes' | 'comment';
  }> {
    const review = {
      summary: '',
      issues: [] as Array<{ severity: string; file: string; line: number; message: string }>,
      suggestions: [] as string[],
      approval: 'comment' as 'approve' | 'request-changes' | 'comment',
    };

    // Analyze each file
    for (const change of changes) {
      const fileIssues = await this.analyzeFileDiff(change.file, change.diff);
      review.issues.push(...fileIssues);
    }

    // Generate summary
    review.summary = this.generateReviewSummary(changes, review.issues);

    // Generate suggestions
    review.suggestions = this.generateReviewSuggestions(review.issues);

    // Determine approval status
    const criticalIssues = review.issues.filter(i => i.severity === 'critical').length;
    const highIssues = review.issues.filter(i => i.severity === 'high').length;

    if (criticalIssues > 0) {
      review.approval = 'request-changes';
    } else if (highIssues > 2) {
      review.approval = 'request-changes';
    } else if (review.issues.length > 0) {
      review.approval = 'comment';
    } else {
      review.approval = 'approve';
    }

    return review;
  }

  // Helper methods
  private getOfflineSuggestions(code: string, language: string): CodeSuggestion[] {
    // Basic offline suggestions based on patterns
    const suggestions: CodeSuggestion[] = [];
    
    // Import suggestions
    if (language === 'javascript' || language === 'typescript') {
      if (code.includes('useState') && !code.includes("import.*useState")) {
        suggestions.push({
          type: 'import',
          code: "import { useState } from 'react';",
          description: 'Import useState from React',
          confidence: 0.9,
        });
      }
    }

    return suggestions;
  }

  private getBugPatterns(language: string): Array<{
    regex: RegExp;
    type: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    message: string;
    fix?: (match: string) => string;
  }> {
    const patterns = [];

    if (language === 'javascript' || language === 'typescript') {
      patterns.push(
        {
          regex: /console\.(log|error|warn|info)/g,
          type: 'console',
          severity: 'low' as const,
          message: 'Remove console statements in production',
          fix: () => '// Removed console statement',
        },
        {
          regex: /==(?!=)/g,
          type: 'comparison',
          severity: 'medium' as const,
          message: 'Use === instead of ==',
          fix: () => '===',
        },
        {
          regex: /var\s+/g,
          type: 'declaration',
          severity: 'low' as const,
          message: 'Use let or const instead of var',
          fix: () => 'const ',
        }
      );
    }

    return patterns;
  }

  private getPerformancePatterns(language: string): Array<{
    detect: (code: string) => boolean;
    impact: 'high' | 'medium' | 'low';
    description: string;
    before: string;
    after: string;
  }> {
    const patterns = [];

    if (language === 'javascript' || language === 'typescript') {
      patterns.push({
        detect: (code: string) => code.includes('.forEach') && code.includes('push'),
        impact: 'medium' as const,
        description: 'Use map instead of forEach with push',
        before: 'array.forEach(item => { result.push(transform(item)); })',
        after: 'const result = array.map(item => transform(item));',
      });
    }

    return patterns;
  }

  private getMemoryPatterns(language: string): Array<{
    detect: (code: string) => boolean;
    impact: 'high' | 'medium' | 'low';
    description: string;
    before: string;
    after: string;
  }> {
    const patterns = [];

    if (language === 'javascript' || language === 'typescript') {
      patterns.push({
        detect: (code: string) => code.includes('addEventListener') && !code.includes('removeEventListener'),
        impact: 'high' as const,
        description: 'Remove event listeners to prevent memory leaks',
        before: 'element.addEventListener("click", handler);',
        after: 'element.addEventListener("click", handler);\n// Later: element.removeEventListener("click", handler);',
      });
    }

    return patterns;
  }

  private getSecurityPatterns(language: string): Array<{
    regex: RegExp;
    type: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    cwe: string;
    description: string;
    recommendation: string;
  }> {
    const patterns = [];

    if (language === 'javascript' || language === 'typescript') {
      patterns.push(
        {
          regex: /eval\s*\(/g,
          type: 'Code Injection',
          severity: 'critical' as const,
          cwe: 'CWE-94',
          description: 'Use of eval() can lead to code injection',
          recommendation: 'Avoid eval() and use safer alternatives',
        },
        {
          regex: /innerHTML\s*=/g,
          type: 'XSS',
          severity: 'high' as const,
          cwe: 'CWE-79',
          description: 'Direct innerHTML assignment can lead to XSS',
          recommendation: 'Use textContent or sanitize HTML',
        }
      );
    }

    if (language === 'sql') {
      patterns.push({
        regex: /SELECT.*FROM.*WHERE.*\+/g,
        type: 'SQL Injection',
        severity: 'critical' as const,
        cwe: 'CWE-89',
        description: 'Potential SQL injection vulnerability',
        recommendation: 'Use parameterized queries',
      });
    }

    return patterns;
  }

  private parseCodeEntities(code: string, language: string): Array<{
    type: 'function' | 'class' | 'module' | 'variable';
    name: string;
    hasDoc: boolean;
    docQuality: number;
    currentDoc?: string;
    params?: Array<{ name: string; type: string; description: string }>;
    returns?: { type: string; description: string };
  }> {
    const entities = [];

    // Simple regex-based parsing (would be better with AST)
    if (language === 'javascript' || language === 'typescript') {
      const functionRegex = /(?:function|const|let|var)\s+(\w+)\s*(?:=\s*)?(?:\([^)]*\)|async)/g;
      const matches = code.matchAll(functionRegex);
      
      for (const match of matches) {
        entities.push({
          type: 'function' as const,
          name: match[1],
          hasDoc: code.includes(`/**`) && code.indexOf('/**') < (match.index || 0),
          docQuality: 0.3,
          params: [],
        });
      }
    }

    return entities;
  }

  private async generateDocString(entity: any, language: string): Promise<string> {
    if (language === 'javascript' || language === 'typescript') {
      let doc = '/**\n';
      doc += ` * ${entity.name} - Description of what this ${entity.type} does\n`;
      
      if (entity.params?.length > 0) {
        for (const param of entity.params) {
          doc += ` * @param {${param.type || 'any'}} ${param.name} - ${param.description || 'Description'}\n`;
        }
      }
      
      if (entity.returns) {
        doc += ` * @returns {${entity.returns.type || 'any'}} ${entity.returns.description || 'Description'}\n`;
      }
      
      doc += ' */';
      return doc;
    }

    return '// Add documentation here';
  }

  private parseTestableFunctions(code: string, language: string): Array<{
    name: string;
    params: string[];
    body: string;
  }> {
    const functions = [];

    if (language === 'javascript' || language === 'typescript') {
      const functionRegex = /function\s+(\w+)\s*\(([^)]*)\)\s*\{([^}]+)\}/g;
      const matches = code.matchAll(functionRegex);
      
      for (const match of matches) {
        functions.push({
          name: match[1],
          params: match[2].split(',').map(p => p.trim()),
          body: match[3],
        });
      }
    }

    return functions;
  }

  private async generateTestCode(func: any, language: string): Promise<string> {
    if (language === 'javascript' || language === 'typescript') {
      return `
describe('${func.name}', () => {
  it('should work correctly with valid input', () => {
    // Arrange
    const input = // Add test input
    const expected = // Add expected output
    
    // Act
    const result = ${func.name}(input);
    
    // Assert
    expect(result).toEqual(expected);
  });
  
  it('should handle edge cases', () => {
    // Add edge case tests
  });
  
  it('should handle errors gracefully', () => {
    // Add error handling tests
  });
});`;
    }

    return '// Add test code here';
  }

  private findLongMethods(code: string, language: string): Array<{
    name: string;
    code: string;
    refactored: string;
  }> {
    // Simplified implementation
    return [];
  }

  private findDuplicateCode(code: string): Array<{
    instances: string[];
    extracted: string;
  }> {
    // Simplified implementation
    return [];
  }

  private calculateCyclomaticComplexity(code: string, language: string): number {
    // Count decision points
    let complexity = 1;
    
    const decisionKeywords = ['if', 'else', 'switch', 'case', 'for', 'while', 'catch', '&&', '||', '?'];
    for (const keyword of decisionKeywords) {
      const regex = new RegExp(`\\b${keyword}\\b`, 'g');
      const matches = code.match(regex);
      complexity += matches?.length || 0;
    }

    return complexity;
  }

  private countFunctions(code: string, language: string): number {
    if (language === 'javascript' || language === 'typescript') {
      const functionRegex = /(?:function|=>|async)/g;
      const matches = code.match(functionRegex);
      return matches?.length || 0;
    }
    return 0;
  }

  private calculateMaxNesting(code: string): number {
    let maxDepth = 0;
    let currentDepth = 0;

    for (const char of code) {
      if (char === '{') {
        currentDepth++;
        maxDepth = Math.max(maxDepth, currentDepth);
      } else if (char === '}') {
        currentDepth--;
      }
    }

    return maxDepth;
  }

  private buildSuggestionPrompt(code: string, language: string, context?: any): string {
    return `Analyze this ${language} code and provide suggestions for improvements, completions, and best practices:\n\n${code}`;
  }

  private parseSuggestions(response: string): CodeSuggestion[] {
    // Parse AI response into structured suggestions
    return [];
  }

  private async detectBugsWithAI(code: string, language: string): Promise<BugReport[]> {
    // AI-powered bug detection
    return [];
  }

  private extractWorkflowName(description: string): string {
    const words = description.split(' ').slice(0, 5);
    return words.join(' ');
  }

  private async generateWorkflowNodes(description: string, context: any): Promise<any[]> {
    // Generate workflow nodes based on description
    return [];
  }

  private generateWorkflowEdges(nodes: any[]): any[] {
    // Connect nodes in sequence
    const edges = [];
    for (let i = 0; i < nodes.length - 1; i++) {
      edges.push({
        source: nodes[i].id,
        target: nodes[i + 1].id,
      });
    }
    return edges;
  }

  private buildCodeGenerationSystemPrompt(language: string, context?: any): string {
    return `You are an expert ${language} developer. Generate clean, efficient, and well-documented code.`;
  }

  private extractCodeFromResponse(response: string): string {
    // Extract code blocks from AI response
    const codeMatch = response.match(/```[\w]*\n([\s\S]*?)```/);
    return codeMatch ? codeMatch[1] : response;
  }

  private generateOfflineCode(prompt: string, language: string): string {
    return `// Generated ${language} code for: ${prompt}\n// AI service not available - using template\n`;
  }

  private async analyzeFileDiff(file: string, diff: string): Promise<Array<{
    severity: string;
    file: string;
    line: number;
    message: string;
  }>> {
    // Analyze file diff for issues
    return [];
  }

  private generateReviewSummary(changes: any[], issues: any[]): string {
    return `Reviewed ${changes.length} files with ${issues.length} issues found.`;
  }

  private generateReviewSuggestions(issues: any[]): string[] {
    const suggestions = [];
    
    if (issues.some(i => i.severity === 'critical')) {
      suggestions.push('Address critical issues before merging');
    }
    
    if (issues.filter(i => i.severity === 'high').length > 3) {
      suggestions.push('Consider breaking this PR into smaller changes');
    }

    return suggestions;
  }
}

// Export singleton instance
export const aiAssistant = new AIAssistant();