import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'crypto';
import { storage } from '../storage';
import { createAgentOrchestrator } from '../ai-agents';
import { BrowserManager } from '../browser-manager';
import type { WorkflowAction, WorkflowRun } from '@shared/schema';

// Action execution result
export interface ActionResult {
  actionId: string;
  status: 'success' | 'failed' | 'skipped';
  output?: any;
  error?: string;
  duration: number;
  retryCount?: number;
}

// Notification configuration
export interface NotificationConfig {
  type: 'email' | 'sms' | 'slack' | 'discord' | 'webhook';
  recipients: string[];
  template?: string;
  subject?: string;
  attachments?: any[];
}

// Export configuration
export interface ExportConfig {
  format: 'json' | 'csv' | 'excel' | 'pdf';
  destination: string;
  filename?: string;
  compress?: boolean;
}

// Script configuration
export interface ScriptConfig {
  language: 'javascript' | 'python' | 'bash';
  code: string;
  timeout?: number;
  sandbox?: boolean;
}

export class ActionExecutor extends EventEmitter {
  private browserManager: BrowserManager;
  private agentOrchestrator: any;
  private executors: Map<string, Function> = new Map();
  private activeActions: Map<string, any> = new Map();
  private retryConfigs: Map<string, any> = new Map();

  constructor(browserManager: BrowserManager) {
    super();
    this.browserManager = browserManager;
    this.agentOrchestrator = createAgentOrchestrator(browserManager);
    this.initializeExecutors();
  }

  private initializeExecutors(): void {
    // Run playbook action
    this.executors.set('run', async (action: WorkflowAction, context: any) => {
      const { playbookId, runConfig } = action.config;
      
      if (!playbookId) {
        throw new Error('No playbook ID specified');
      }
      
      // Get playbook from storage
      const playbook = await storage.getWorkflow(playbookId);
      if (!playbook) {
        throw new Error(`Playbook ${playbookId} not found`);
      }
      
      // Execute playbook through agent orchestrator
      const task = {
        id: uuidv4(),
        type: 'workflow-execution',
        description: `Execute playbook: ${playbook.name}`,
        priority: 2,
        context: {
          ...context,
          ...runConfig,
          playbook
        },
        status: 'pending' as const,
        createdAt: new Date()
      };
      
      const result = await this.agentOrchestrator.executeTask(task);
      return {
        playbookId,
        executionId: task.id,
        result
      };
    });

    // Send notification action
    this.executors.set('notify', async (action: WorkflowAction, context: any) => {
      const config = action.config as NotificationConfig;
      
      switch (config.type) {
        case 'email':
          return await this.sendEmail(config, context);
        case 'sms':
          return await this.sendSMS(config, context);
        case 'slack':
          return await this.sendSlack(config, context);
        case 'discord':
          return await this.sendDiscord(config, context);
        case 'webhook':
          return await this.sendWebhook(config, context);
        default:
          throw new Error(`Unknown notification type: ${config.type}`);
      }
    });

    // Create PR action
    this.executors.set('create-pr', async (action: WorkflowAction, context: any) => {
      const { repository, branch, title, body } = action.config;
      
      // Determine provider (GitHub, GitLab, etc.)
      const provider = this.detectGitProvider(repository);
      
      switch (provider) {
        case 'github':
          return await this.createGitHubPR(action.config, context);
        case 'gitlab':
          return await this.createGitLabMR(action.config, context);
        default:
          throw new Error(`Unsupported repository provider: ${provider}`);
      }
    });

    // Webhook action
    this.executors.set('webhook', async (action: WorkflowAction, context: any) => {
      const { url, method, headers, body } = action.config;
      
      // Replace variables in body
      const processedBody = this.processTemplate(body, context);
      
      const response = await fetch(url, {
        method: method || 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers
        },
        body: JSON.stringify(processedBody)
      });
      
      if (!response.ok) {
        throw new Error(`Webhook failed: ${response.status} ${response.statusText}`);
      }
      
      return {
        status: response.status,
        response: await response.text()
      };
    });

    // Export action
    this.executors.set('export', async (action: WorkflowAction, context: any) => {
      const config = action.config as ExportConfig;
      const data = context.extractedData || context.data || {};
      
      let exportedData: any;
      
      switch (config.format) {
        case 'json':
          exportedData = JSON.stringify(data, null, 2);
          break;
        case 'csv':
          exportedData = this.convertToCSV(data);
          break;
        case 'excel':
          exportedData = await this.convertToExcel(data);
          break;
        case 'pdf':
          exportedData = await this.convertToPDF(data);
          break;
        default:
          throw new Error(`Unknown export format: ${config.format}`);
      }
      
      // Save to destination
      const filename = config.filename || `export-${Date.now()}.${config.format}`;
      const path = await this.saveExport(exportedData, config.destination, filename);
      
      return {
        format: config.format,
        path,
        size: exportedData.length
      };
    });

    // Script action
    this.executors.set('script', async (action: WorkflowAction, context: any) => {
      const config = action.config as ScriptConfig;
      
      // Execute script in sandbox
      const result = await this.executeScript(
        config.code,
        config.language,
        context,
        config.timeout,
        config.sandbox
      );
      
      return result;
    });

    // Integration action
    this.executors.set('integration', async (action: WorkflowAction, context: any) => {
      const { integration, integrationConfig } = action.config;
      
      // Execute through integration service
      const result = await this.executeIntegration(
        integration,
        integrationConfig,
        context
      );
      
      return result;
    });

    // Conditional action
    this.executors.set('conditional', async (action: WorkflowAction, context: any) => {
      const { condition, ifTrue, ifFalse } = action.config;
      
      // Evaluate condition
      const result = this.evaluateCondition(condition, context);
      
      // Execute appropriate action
      if (result && ifTrue) {
        return await this.executeNestedAction(ifTrue, context);
      } else if (!result && ifFalse) {
        return await this.executeNestedAction(ifFalse, context);
      }
      
      return { conditionResult: result };
    });

    // Loop action
    this.executors.set('loop', async (action: WorkflowAction, context: any) => {
      const { items, actions, parallel } = action.config;
      const results = [];
      
      if (parallel) {
        // Execute in parallel
        const promises = items.map((item: any, index: number) => 
          this.executeNestedActions(actions, { ...context, loopItem: item, loopIndex: index })
        );
        const allResults = await Promise.allSettled(promises);
        results.push(...allResults);
      } else {
        // Execute sequentially
        for (let i = 0; i < items.length; i++) {
          const result = await this.executeNestedActions(
            actions,
            { ...context, loopItem: items[i], loopIndex: i }
          );
          results.push(result);
        }
      }
      
      return { iterations: items.length, results };
    });

    // Delay action
    this.executors.set('delay', async (action: WorkflowAction, context: any) => {
      const { duration } = action.config;
      await new Promise(resolve => setTimeout(resolve, duration));
      return { delayed: duration };
    });
  }

  // Execute workflow actions
  async executeActions(
    actions: WorkflowAction[],
    run: WorkflowRun,
    context: any
  ): Promise<ActionResult[]> {
    const results: ActionResult[] = [];
    
    // Sort actions by order
    const sortedActions = [...actions].sort((a, b) => a.order - b.order);
    
    for (const action of sortedActions) {
      if (!action.enabled) {
        results.push({
          actionId: action.id,
          status: 'skipped',
          duration: 0
        });
        continue;
      }
      
      const result = await this.executeAction(action, context);
      results.push(result);
      
      // Stop on failure if configured
      if (result.status === 'failed' && !action.config.continueOnError) {
        break;
      }
      
      // Update context with action result
      context[`action_${action.id}`] = result.output;
    }
    
    return results;
  }

  // Execute single action with retry
  private async executeAction(
    action: WorkflowAction,
    context: any
  ): Promise<ActionResult> {
    const startTime = Date.now();
    let lastError: Error | null = null;
    let retryCount = 0;
    
    this.emit('action:started', { actionId: action.id, type: action.type });
    
    const maxRetries = action.retryOnFailure ? action.retryAttempts : 0;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const executor = this.executors.get(action.type);
        if (!executor) {
          throw new Error(`Unknown action type: ${action.type}`);
        }
        
        const output = await executor(action, context);
        
        const result: ActionResult = {
          actionId: action.id,
          status: 'success',
          output,
          duration: Date.now() - startTime,
          retryCount
        };
        
        this.emit('action:completed', result);
        return result;
        
      } catch (error: any) {
        lastError = error;
        retryCount = attempt;
        
        if (attempt < maxRetries) {
          this.emit('action:retry', {
            actionId: action.id,
            attempt,
            error: error.message
          });
          
          // Exponential backoff
          const delay = action.retryDelay * Math.pow(2, attempt);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    // All retries failed
    const result: ActionResult = {
      actionId: action.id,
      status: 'failed',
      error: lastError?.message || 'Unknown error',
      duration: Date.now() - startTime,
      retryCount
    };
    
    this.emit('action:failed', result);
    return result;
  }

  // Email sender
  private async sendEmail(config: NotificationConfig, context: any): Promise<any> {
    const sgMail = require('@sendgrid/mail');
    const apiKey = process.env.SENDGRID_API_KEY;
    
    if (!apiKey) {
      throw new Error('SendGrid API key not configured');
    }
    
    sgMail.setApiKey(apiKey);
    
    const message = {
      to: config.recipients,
      from: process.env.EMAIL_FROM || 'noreply@madeasy.ai',
      subject: this.processTemplate(config.subject || 'Workflow Notification', context),
      html: this.processTemplate(config.template || '', context),
      attachments: config.attachments
    };
    
    const result = await sgMail.send(message);
    return { sent: true, messageId: result[0].headers['x-message-id'] };
  }

  // SMS sender
  private async sendSMS(config: NotificationConfig, context: any): Promise<any> {
    // Implement SMS sending (Twilio, etc.)
    throw new Error('SMS notifications not yet implemented');
  }

  // Slack sender
  private async sendSlack(config: NotificationConfig, context: any): Promise<any> {
    const webhookUrl = process.env.SLACK_WEBHOOK_URL;
    
    if (!webhookUrl) {
      throw new Error('Slack webhook URL not configured');
    }
    
    const message = {
      text: this.processTemplate(config.template || 'Workflow notification', context),
      channel: config.recipients[0] // Channel name
    };
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message)
    });
    
    if (!response.ok) {
      throw new Error(`Slack notification failed: ${response.statusText}`);
    }
    
    return { sent: true };
  }

  // Discord sender
  private async sendDiscord(config: NotificationConfig, context: any): Promise<any> {
    const webhookUrl = config.recipients[0]; // Discord webhook URL
    
    const message = {
      content: this.processTemplate(config.template || 'Workflow notification', context)
    };
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message)
    });
    
    if (!response.ok) {
      throw new Error(`Discord notification failed: ${response.statusText}`);
    }
    
    return { sent: true };
  }

  // Webhook sender
  private async sendWebhook(config: NotificationConfig, context: any): Promise<any> {
    const url = config.recipients[0];
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'workflow-notification',
        data: context
      })
    });
    
    return {
      sent: response.ok,
      status: response.status
    };
  }

  // GitHub PR creator
  private async createGitHubPR(config: any, context: any): Promise<any> {
    const { Octokit } = require('@octokit/rest');
    const token = process.env.GITHUB_TOKEN;
    
    if (!token) {
      throw new Error('GitHub token not configured');
    }
    
    const octokit = new Octokit({ auth: token });
    
    const [owner, repo] = config.repository.split('/');
    
    const pr = await octokit.pulls.create({
      owner,
      repo,
      title: this.processTemplate(config.title, context),
      body: this.processTemplate(config.body, context),
      head: config.branch,
      base: config.base || 'main'
    });
    
    return {
      number: pr.data.number,
      url: pr.data.html_url,
      state: pr.data.state
    };
  }

  // GitLab MR creator
  private async createGitLabMR(config: any, context: any): Promise<any> {
    const { Gitlab } = require('@gitbeaker/node');
    const token = process.env.GITLAB_TOKEN;
    
    if (!token) {
      throw new Error('GitLab token not configured');
    }
    
    const api = new Gitlab({ token });
    
    const mr = await api.MergeRequests.create(
      config.repository,
      config.branch,
      config.base || 'main',
      this.processTemplate(config.title, context),
      {
        description: this.processTemplate(config.body, context)
      }
    );
    
    return {
      iid: mr.iid,
      url: mr.web_url,
      state: mr.state
    };
  }

  // Convert to CSV
  private convertToCSV(data: any): string {
    if (Array.isArray(data)) {
      if (data.length === 0) return '';
      
      const headers = Object.keys(data[0]);
      const rows = data.map(item => 
        headers.map(header => 
          JSON.stringify(item[header] || '')
        ).join(',')
      );
      
      return [headers.join(','), ...rows].join('\n');
    }
    
    return JSON.stringify(data);
  }

  // Convert to Excel
  private async convertToExcel(data: any): Promise<Buffer> {
    const ExcelJS = require('exceljs');
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Data');
    
    if (Array.isArray(data) && data.length > 0) {
      // Add headers
      worksheet.columns = Object.keys(data[0]).map(key => ({
        header: key,
        key: key,
        width: 20
      }));
      
      // Add rows
      worksheet.addRows(data);
    }
    
    return await workbook.xlsx.writeBuffer();
  }

  // Convert to PDF
  private async convertToPDF(data: any): Promise<Buffer> {
    // Simplified PDF generation
    // In production, use a library like puppeteer or pdfkit
    const content = JSON.stringify(data, null, 2);
    return Buffer.from(content);
  }

  // Save export
  private async saveExport(
    data: any,
    destination: string,
    filename: string
  ): Promise<string> {
    const fs = require('fs').promises;
    const path = require('path');
    
    const fullPath = path.join(destination, filename);
    
    if (Buffer.isBuffer(data)) {
      await fs.writeFile(fullPath, data);
    } else {
      await fs.writeFile(fullPath, data, 'utf8');
    }
    
    return fullPath;
  }

  // Execute script
  private async executeScript(
    code: string,
    language: string,
    context: any,
    timeout?: number,
    sandbox?: boolean
  ): Promise<any> {
    if (sandbox) {
      // Use VM2 or similar for sandboxed execution
      const { VM } = require('vm2');
      const vm = new VM({
        timeout: timeout || 5000,
        sandbox: { context }
      });
      
      return vm.run(code);
    }
    
    // Direct execution (be careful!)
    switch (language) {
      case 'javascript':
        return new Function('context', code)(context);
      case 'python':
        // Would need to spawn Python process
        throw new Error('Python scripts not yet supported');
      case 'bash':
        // Would need to spawn shell process
        throw new Error('Bash scripts not yet supported');
      default:
        throw new Error(`Unknown script language: ${language}`);
    }
  }

  // Execute integration
  private async executeIntegration(
    integration: string,
    config: any,
    context: any
  ): Promise<any> {
    // This would connect to various integrations
    // For now, just emit event for integration handler
    return new Promise((resolve, reject) => {
      this.emit('integration:execute', {
        integration,
        config,
        context,
        callback: (error: any, result: any) => {
          if (error) reject(error);
          else resolve(result);
        }
      });
    });
  }

  // Evaluate condition
  private evaluateCondition(condition: any, context: any): boolean {
    if (typeof condition === 'string') {
      // JavaScript expression
      return new Function('context', `return ${condition}`)(context);
    }
    
    if (typeof condition === 'object') {
      const { field, operator, value } = condition;
      const fieldValue = this.getNestedValue(context, field);
      
      switch (operator) {
        case '==': return fieldValue == value;
        case '!=': return fieldValue != value;
        case '>': return fieldValue > value;
        case '<': return fieldValue < value;
        case '>=': return fieldValue >= value;
        case '<=': return fieldValue <= value;
        case 'contains': return String(fieldValue).includes(value);
        case 'matches': return new RegExp(value).test(String(fieldValue));
        default: return false;
      }
    }
    
    return Boolean(condition);
  }

  // Execute nested action
  private async executeNestedAction(action: any, context: any): Promise<any> {
    if (typeof action === 'string') {
      // Reference to another action
      const referencedAction = await storage.getWorkflowAction(action);
      if (referencedAction) {
        return await this.executeAction(referencedAction, context);
      }
    }
    
    // Inline action definition
    return await this.executeAction(action, context);
  }

  // Execute nested actions
  private async executeNestedActions(actions: any[], context: any): Promise<any[]> {
    const results = [];
    
    for (const action of actions) {
      const result = await this.executeNestedAction(action, context);
      results.push(result);
    }
    
    return results;
  }

  // Process template
  private processTemplate(template: string, context: any): string {
    if (!template) return '';
    
    return template.replace(/\{\{(\w+(?:\.\w+)*)\}\}/g, (match, path) => {
      const value = this.getNestedValue(context, path);
      return value !== undefined ? String(value) : match;
    });
  }

  // Get nested value
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  // Detect git provider
  private detectGitProvider(repository: string): string {
    if (repository.includes('github.com')) return 'github';
    if (repository.includes('gitlab.com')) return 'gitlab';
    if (repository.includes('bitbucket.org')) return 'bitbucket';
    return 'unknown';
  }
}