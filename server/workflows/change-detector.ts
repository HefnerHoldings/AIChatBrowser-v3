import { EventEmitter } from 'events';
import { createHash } from 'crypto';
import { diff_match_patch } from 'diff-match-patch';
import { BrowserManager } from '../browser-manager';
import type { WorkflowChange } from '@shared/schema';

// Change detection configuration
export interface ChangeDetectionConfig {
  method: 'dom' | 'text' | 'visual' | 'hash';
  threshold: number; // 0-100 similarity threshold
  ignoreSelectors?: string[];
  ignorePatterns?: string[];
  compareAttributes?: string[];
  deepComparison?: boolean;
}

// Content snapshot
export interface ContentSnapshot {
  url: string;
  timestamp: Date;
  method: string;
  content: any;
  hash: string;
  metadata?: {
    title?: string;
    description?: string;
    keywords?: string[];
    images?: string[];
  };
}

// Change result
export interface ChangeResult {
  hasChanged: boolean;
  changeType: 'content' | 'structure' | 'visual' | 'status';
  severity: 'low' | 'medium' | 'high' | 'critical';
  similarity: number;
  changeScore: number;
  diff?: any;
  details?: {
    added?: any[];
    removed?: any[];
    modified?: any[];
  };
  screenshot?: string;
}

// DOM Node representation
interface DOMNode {
  tag: string;
  attributes: Record<string, string>;
  text?: string;
  children: DOMNode[];
  path: string;
}

export class ChangeDetector extends EventEmitter {
  private browserManager: BrowserManager;
  private snapshots: Map<string, ContentSnapshot> = new Map();
  private differ: any;
  private config: ChangeDetectionConfig;

  constructor(
    browserManager: BrowserManager,
    config: Partial<ChangeDetectionConfig> = {}
  ) {
    super();
    this.browserManager = browserManager;
    this.differ = new diff_match_patch();
    
    this.config = {
      method: config.method || 'dom',
      threshold: config.threshold || 85,
      ignoreSelectors: config.ignoreSelectors || [],
      ignorePatterns: config.ignorePatterns || [],
      compareAttributes: config.compareAttributes || ['id', 'class', 'href', 'src'],
      deepComparison: config.deepComparison !== false
    };
  }

  // Detect changes for a URL
  async detectChanges(
    workflowId: string,
    url: string,
    config?: Partial<ChangeDetectionConfig>
  ): Promise<ChangeResult> {
    const detectionConfig = { ...this.config, ...config };
    const snapshotKey = `${workflowId}-${url}`;
    
    try {
      // Capture current content
      const currentSnapshot = await this.captureSnapshot(url, detectionConfig);
      
      // Get previous snapshot
      const previousSnapshot = this.snapshots.get(snapshotKey);
      
      if (!previousSnapshot) {
        // First run, no changes to detect
        this.snapshots.set(snapshotKey, currentSnapshot);
        return {
          hasChanged: false,
          changeType: 'content',
          severity: 'low',
          similarity: 100,
          changeScore: 0
        };
      }

      // Compare snapshots based on method
      let result: ChangeResult;
      
      switch (detectionConfig.method) {
        case 'dom':
          result = await this.compareDOMs(previousSnapshot, currentSnapshot, detectionConfig);
          break;
        case 'text':
          result = await this.compareText(previousSnapshot, currentSnapshot, detectionConfig);
          break;
        case 'visual':
          result = await this.compareVisual(previousSnapshot, currentSnapshot, detectionConfig);
          break;
        case 'hash':
          result = await this.compareHashes(previousSnapshot, currentSnapshot, detectionConfig);
          break;
        default:
          result = await this.compareDOMs(previousSnapshot, currentSnapshot, detectionConfig);
      }

      // Update snapshot if changed
      if (result.hasChanged) {
        this.snapshots.set(snapshotKey, currentSnapshot);
        this.emit('change:detected', { workflowId, url, result });
      }

      return result;
      
    } catch (error) {
      console.error('Error detecting changes:', error);
      this.emit('change:error', { workflowId, url, error });
      throw error;
    }
  }

  // Capture content snapshot
  private async captureSnapshot(
    url: string,
    config: ChangeDetectionConfig
  ): Promise<ContentSnapshot> {
    const tab = await this.browserManager.createTab();
    
    try {
      await tab.navigate(url);
      await tab.waitForLoadState('networkidle');
      
      let content: any;
      let hash: string;
      
      switch (config.method) {
        case 'dom':
          content = await this.extractDOM(tab, config);
          hash = this.hashObject(content);
          break;
          
        case 'text':
          content = await this.extractText(tab, config);
          hash = this.hashString(content);
          break;
          
        case 'visual':
          content = await tab.screenshot({ fullPage: true });
          hash = this.hashString(content);
          break;
          
        case 'hash':
          const html = await tab.content();
          content = this.processContent(html, config);
          hash = this.hashString(content);
          break;
          
        default:
          content = await tab.content();
          hash = this.hashString(content);
      }

      // Extract metadata
      const metadata = await this.extractMetadata(tab);

      return {
        url,
        timestamp: new Date(),
        method: config.method,
        content,
        hash,
        metadata
      };
      
    } finally {
      await tab.close();
    }
  }

  // Extract DOM structure
  private async extractDOM(tab: any, config: ChangeDetectionConfig): Promise<DOMNode> {
    return await tab.evaluate((cfg: any) => {
      function extractNode(element: Element, path: string = ''): any {
        // Skip ignored selectors
        for (const selector of cfg.ignoreSelectors || []) {
          if (element.matches(selector)) {
            return null;
          }
        }

        const node: any = {
          tag: element.tagName.toLowerCase(),
          attributes: {},
          children: [],
          path
        };

        // Extract specified attributes
        for (const attr of cfg.compareAttributes || []) {
          const value = element.getAttribute(attr);
          if (value) {
            node.attributes[attr] = value;
          }
        }

        // Extract text content if no children
        if (element.children.length === 0) {
          const text = element.textContent?.trim();
          if (text) {
            node.text = text;
          }
        }

        // Recursively extract children
        for (let i = 0; i < element.children.length; i++) {
          const child = extractNode(
            element.children[i],
            `${path}/${element.tagName.toLowerCase()}[${i}]`
          );
          if (child) {
            node.children.push(child);
          }
        }

        return node;
      }

      return extractNode(document.body, 'body');
    }, config);
  }

  // Extract text content
  private async extractText(tab: any, config: ChangeDetectionConfig): Promise<string> {
    return await tab.evaluate((cfg: any) => {
      let text = document.body.innerText || '';
      
      // Remove ignored selectors
      for (const selector of cfg.ignoreSelectors || []) {
        const elements = document.querySelectorAll(selector);
        elements.forEach((el: any) => {
          text = text.replace(el.innerText || '', '');
        });
      }
      
      // Apply ignore patterns
      for (const pattern of cfg.ignorePatterns || []) {
        const regex = new RegExp(pattern, 'g');
        text = text.replace(regex, '');
      }
      
      return text.trim();
    }, config);
  }

  // Compare DOM structures
  private async compareDOMs(
    previous: ContentSnapshot,
    current: ContentSnapshot,
    config: ChangeDetectionConfig
  ): Promise<ChangeResult> {
    const prevDOM = previous.content as DOMNode;
    const currDOM = current.content as DOMNode;
    
    const changes = this.diffDOMNodes(prevDOM, currDOM, config);
    const similarity = this.calculateDOMSimilarity(prevDOM, currDOM);
    const changeScore = 100 - similarity;
    
    return {
      hasChanged: similarity < config.threshold,
      changeType: 'structure',
      severity: this.calculateSeverity(changeScore),
      similarity,
      changeScore,
      diff: changes,
      details: {
        added: changes.added,
        removed: changes.removed,
        modified: changes.modified
      }
    };
  }

  // Compare text content
  private async compareText(
    previous: ContentSnapshot,
    current: ContentSnapshot,
    config: ChangeDetectionConfig
  ): Promise<ChangeResult> {
    const prevText = previous.content as string;
    const currText = current.content as string;
    
    const diffs = this.differ.diff_main(prevText, currText);
    this.differ.diff_cleanupSemantic(diffs);
    
    const similarity = this.calculateTextSimilarity(prevText, currText);
    const changeScore = 100 - similarity;
    
    // Extract changes
    const added: string[] = [];
    const removed: string[] = [];
    
    for (const [op, text] of diffs) {
      if (op === 1) added.push(text);
      if (op === -1) removed.push(text);
    }
    
    return {
      hasChanged: similarity < config.threshold,
      changeType: 'content',
      severity: this.calculateSeverity(changeScore),
      similarity,
      changeScore,
      diff: diffs,
      details: {
        added: added,
        removed: removed,
        modified: []
      }
    };
  }

  // Compare visual screenshots
  private async compareVisual(
    previous: ContentSnapshot,
    current: ContentSnapshot,
    config: ChangeDetectionConfig
  ): Promise<ChangeResult> {
    // Simple byte comparison for now
    // In production, use image diff library like pixelmatch
    const prevBuffer = Buffer.from(previous.content, 'base64');
    const currBuffer = Buffer.from(current.content, 'base64');
    
    const similarity = prevBuffer.equals(currBuffer) ? 100 : 0;
    
    return {
      hasChanged: similarity < config.threshold,
      changeType: 'visual',
      severity: similarity === 0 ? 'high' : 'low',
      similarity,
      changeScore: 100 - similarity,
      screenshot: current.content
    };
  }

  // Compare content hashes
  private async compareHashes(
    previous: ContentSnapshot,
    current: ContentSnapshot,
    config: ChangeDetectionConfig
  ): Promise<ChangeResult> {
    const hasChanged = previous.hash !== current.hash;
    const similarity = hasChanged ? 0 : 100;
    
    return {
      hasChanged,
      changeType: 'content',
      severity: hasChanged ? 'medium' : 'low',
      similarity,
      changeScore: 100 - similarity
    };
  }

  // Diff DOM nodes
  private diffDOMNodes(
    prev: DOMNode,
    curr: DOMNode,
    config: ChangeDetectionConfig
  ): any {
    const changes = {
      added: [] as any[],
      removed: [] as any[],
      modified: [] as any[]
    };

    const compareNodes = (p: DOMNode | null, c: DOMNode | null, path: string) => {
      if (!p && c) {
        changes.added.push({ path, node: c });
        return;
      }
      
      if (p && !c) {
        changes.removed.push({ path, node: p });
        return;
      }
      
      if (!p || !c) return;
      
      // Compare tags
      if (p.tag !== c.tag) {
        changes.modified.push({
          path,
          type: 'tag',
          old: p.tag,
          new: c.tag
        });
      }
      
      // Compare attributes
      if (config.deepComparison) {
        for (const attr of config.compareAttributes || []) {
          if (p.attributes[attr] !== c.attributes[attr]) {
            changes.modified.push({
              path,
              type: 'attribute',
              attribute: attr,
              old: p.attributes[attr],
              new: c.attributes[attr]
            });
          }
        }
      }
      
      // Compare text
      if (p.text !== c.text) {
        changes.modified.push({
          path,
          type: 'text',
          old: p.text,
          new: c.text
        });
      }
      
      // Compare children
      const maxChildren = Math.max(p.children.length, c.children.length);
      for (let i = 0; i < maxChildren; i++) {
        compareNodes(
          p.children[i] || null,
          c.children[i] || null,
          `${path}/${c.tag}[${i}]`
        );
      }
    };

    compareNodes(prev, curr, prev.path);
    return changes;
  }

  // Calculate DOM similarity
  private calculateDOMSimilarity(prev: DOMNode, curr: DOMNode): number {
    const prevNodes = this.flattenDOM(prev);
    const currNodes = this.flattenDOM(curr);
    
    const allPaths = new Set([...prevNodes.keys(), ...currNodes.keys()]);
    let matches = 0;
    
    for (const path of allPaths) {
      const prevNode = prevNodes.get(path);
      const currNode = currNodes.get(path);
      
      if (prevNode && currNode && this.nodesEqual(prevNode, currNode)) {
        matches++;
      }
    }
    
    return (matches / allPaths.size) * 100;
  }

  // Flatten DOM to map
  private flattenDOM(node: DOMNode): Map<string, DOMNode> {
    const nodes = new Map<string, DOMNode>();
    
    const flatten = (n: DOMNode) => {
      nodes.set(n.path, n);
      for (const child of n.children) {
        flatten(child);
      }
    };
    
    flatten(node);
    return nodes;
  }

  // Check if nodes are equal
  private nodesEqual(a: DOMNode, b: DOMNode): boolean {
    if (a.tag !== b.tag) return false;
    if (a.text !== b.text) return false;
    
    for (const attr of this.config.compareAttributes || []) {
      if (a.attributes[attr] !== b.attributes[attr]) return false;
    }
    
    return true;
  }

  // Calculate text similarity
  private calculateTextSimilarity(text1: string, text2: string): number {
    if (text1 === text2) return 100;
    
    const longer = text1.length > text2.length ? text1 : text2;
    const shorter = text1.length > text2.length ? text2 : text1;
    
    if (longer.length === 0) return 100;
    
    const editDistance = this.levenshteinDistance(longer, shorter);
    return ((longer.length - editDistance) / longer.length) * 100;
  }

  // Levenshtein distance
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  // Calculate severity
  private calculateSeverity(changeScore: number): 'low' | 'medium' | 'high' | 'critical' {
    if (changeScore < 10) return 'low';
    if (changeScore < 30) return 'medium';
    if (changeScore < 60) return 'high';
    return 'critical';
  }

  // Process content for hashing
  private processContent(html: string, config: ChangeDetectionConfig): string {
    let content = html;
    
    // Remove timestamps
    content = content.replace(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/g, '');
    content = content.replace(/\d{10,13}/g, ''); // Unix timestamps
    
    // Apply ignore patterns
    for (const pattern of config.ignorePatterns || []) {
      const regex = new RegExp(pattern, 'g');
      content = content.replace(regex, '');
    }
    
    return content;
  }

  // Extract metadata
  private async extractMetadata(tab: any): Promise<any> {
    return await tab.evaluate(() => {
      const metadata: any = {};
      
      // Title
      metadata.title = document.title;
      
      // Description
      const description = document.querySelector('meta[name="description"]');
      if (description) {
        metadata.description = description.getAttribute('content');
      }
      
      // Keywords
      const keywords = document.querySelector('meta[name="keywords"]');
      if (keywords) {
        const content = keywords.getAttribute('content');
        metadata.keywords = content ? content.split(',').map(k => k.trim()) : [];
      }
      
      // Images
      const images = Array.from(document.querySelectorAll('img'))
        .map(img => img.src)
        .filter(src => src && !src.startsWith('data:'));
      metadata.images = images.slice(0, 10); // Limit to 10 images
      
      return metadata;
    });
  }

  // Hash string
  private hashString(content: string): string {
    return createHash('sha256').update(content).digest('hex');
  }

  // Hash object
  private hashObject(obj: any): string {
    const json = JSON.stringify(obj, Object.keys(obj).sort());
    return this.hashString(json);
  }

  // Clear snapshots
  clearSnapshots(workflowId?: string): void {
    if (workflowId) {
      const keysToDelete = Array.from(this.snapshots.keys())
        .filter(key => key.startsWith(`${workflowId}-`));
      keysToDelete.forEach(key => this.snapshots.delete(key));
    } else {
      this.snapshots.clear();
    }
  }

  // Get snapshot
  getSnapshot(workflowId: string, url: string): ContentSnapshot | undefined {
    return this.snapshots.get(`${workflowId}-${url}`);
  }
}