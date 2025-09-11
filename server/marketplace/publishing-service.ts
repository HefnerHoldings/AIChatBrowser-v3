import { storage } from "../storage";
import {
  type MarketplaceItem,
  type MarketplaceVersion,
  type InsertMarketplaceItem,
  type InsertMarketplaceVersion
} from "@shared/schema";
import { z } from "zod";
import crypto from "crypto";
import semver from "semver";

// Publishing pipeline for marketplace items
export class PublishingService {
  private static instance: PublishingService;

  private constructor() {}

  static getInstance(): PublishingService {
    if (!PublishingService.instance) {
      PublishingService.instance = new PublishingService();
    }
    return PublishingService.instance;
  }

  // Validation schemas
  private pluginManifestSchema = z.object({
    name: z.string().min(3).max(100),
    version: z.string().refine(v => semver.valid(v) !== null),
    description: z.string().min(10).max(500),
    author: z.string(),
    main: z.string(),
    permissions: z.array(z.string()),
    dependencies: z.record(z.string()).optional(),
    keywords: z.array(z.string()).optional(),
    homepage: z.string().url().optional(),
    repository: z.string().optional(),
    license: z.string().optional()
  });

  private playbookSchema = z.object({
    name: z.string().min(3).max(100),
    version: z.string().refine(v => semver.valid(v) !== null),
    description: z.string().min(10).max(500),
    author: z.string(),
    steps: z.array(z.object({
      id: z.string(),
      name: z.string(),
      action: z.string(),
      parameters: z.record(z.any()),
      condition: z.string().optional(),
      onError: z.enum(['stop', 'continue', 'retry']).optional()
    })),
    variables: z.record(z.any()).optional(),
    permissions: z.array(z.string()).optional()
  });

  // Publish new item
  async publishItem(
    authorId: string,
    type: 'plugin' | 'playbook',
    packageData: Buffer,
    metadata: {
      name: string;
      description: string;
      category: string;
      tags?: string[];
      price?: number;
      pricingModel?: 'free' | 'one-time' | 'subscription';
      icon?: string;
      banner?: string;
      screenshots?: string[];
    }
  ): Promise<{
    item: MarketplaceItem;
    version: MarketplaceVersion;
    validationReport: any;
  }> {
    // Step 1: Parse and validate package
    const packageInfo = await this.parsePackage(type, packageData);
    
    // Step 2: Validate manifest
    const validationReport = await this.validatePackage(type, packageInfo);
    if (!validationReport.valid) {
      throw new Error(`Validation failed: ${JSON.stringify(validationReport.errors)}`);
    }

    // Step 3: Security scan
    const securityReport = await this.securityScan(packageData, packageInfo);
    if (securityReport.critical > 0) {
      throw new Error(`Security scan failed: ${securityReport.summary}`);
    }

    // Step 4: Calculate package hash
    const packageHash = this.calculateHash(packageData);
    const packageSize = packageData.length;

    // Step 5: Generate slug
    const slug = this.generateSlug(metadata.name);

    // Step 6: Create marketplace item
    const item = await storage.createMarketplaceItem({
      type,
      slug,
      name: metadata.name,
      authorId,
      description: metadata.description,
      category: metadata.category,
      tags: metadata.tags,
      status: 'pending-review',
      price: metadata.price || 0,
      pricingModel: metadata.pricingModel || 'free',
      icon: metadata.icon,
      banner: metadata.banner,
      screenshots: metadata.screenshots
    });

    // Step 7: Create initial version
    const version = await storage.createMarketplaceVersion({
      itemId: item.id,
      version: packageInfo.version,
      packageHash,
      packageSize,
      changelog: `Initial release of ${metadata.name}`,
      securityScanStatus: securityReport.passed ? 'passed' : 'warning',
      securityScanReport: securityReport
    });

    // Step 8: Store package permissions
    for (const permission of packageInfo.permissions || []) {
      // TODO: Store permissions in database
      console.log(`Permission required: ${permission}`);
    }

    // Step 9: Store dependencies
    for (const [dep, version] of Object.entries(packageInfo.dependencies || {})) {
      // TODO: Store dependencies in database
      console.log(`Dependency: ${dep}@${version}`);
    }

    return {
      item,
      version,
      validationReport
    };
  }

  // Update existing item with new version
  async publishVersion(
    itemId: string,
    authorId: string,
    packageData: Buffer,
    changelog?: string
  ): Promise<{
    version: MarketplaceVersion;
    validationReport: any;
  }> {
    // Verify ownership
    const item = await storage.getMarketplaceItem(itemId);
    if (!item) {
      throw new Error('Item not found');
    }
    if (item.authorId !== authorId) {
      throw new Error('Unauthorized: You are not the author');
    }

    // Parse package
    const packageInfo = await this.parsePackage(item.type, packageData);

    // Validate version increment
    const versions = await storage.getMarketplaceVersions(itemId);
    if (versions.length > 0) {
      const latestVersion = versions[0].version;
      if (!semver.gt(packageInfo.version, latestVersion)) {
        throw new Error(`Version must be greater than ${latestVersion}`);
      }
    }

    // Validate and scan
    const validationReport = await this.validatePackage(item.type, packageInfo);
    if (!validationReport.valid) {
      throw new Error(`Validation failed: ${JSON.stringify(validationReport.errors)}`);
    }

    const securityReport = await this.securityScan(packageData, packageInfo);
    
    // Create new version
    const version = await storage.createMarketplaceVersion({
      itemId,
      version: packageInfo.version,
      packageHash: this.calculateHash(packageData),
      packageSize: packageData.length,
      changelog: changelog || this.generateChangelog(packageInfo.version),
      breakingChanges: semver.major(packageInfo.version) > semver.major(versions[0]?.version || '0.0.0'),
      securityScanStatus: securityReport.passed ? 'passed' : 'warning',
      securityScanReport: securityReport
    });

    // Update item status if needed
    if (item.status === 'draft') {
      await storage.updateMarketplaceItem(itemId, {
        status: 'pending-review',
        updatedAt: new Date()
      });
    }

    return {
      version,
      validationReport
    };
  }

  // Parse package data
  private async parsePackage(
    type: 'plugin' | 'playbook',
    packageData: Buffer
  ): Promise<any> {
    try {
      // In production, this would unzip and parse the package
      // For now, we'll simulate parsing
      const mockManifest = {
        name: 'example-package',
        version: '1.0.0',
        description: 'Example package',
        author: 'author',
        main: 'index.js',
        permissions: ['read_dom', 'network'],
        dependencies: {
          'lodash': '^4.17.21'
        }
      };

      return mockManifest;
    } catch (error) {
      throw new Error(`Failed to parse package: ${error}`);
    }
  }

  // Validate package
  private async validatePackage(
    type: 'plugin' | 'playbook',
    packageInfo: any
  ): Promise<{
    valid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Validate based on type
      if (type === 'plugin') {
        this.pluginManifestSchema.parse(packageInfo);
      } else {
        this.playbookSchema.parse(packageInfo);
      }

      // Additional validation rules
      // Check permissions are valid
      const validPermissions = [
        'read_dom', 'write_dom', 'network', 'storage',
        'clipboard', 'notifications', 'browser_automation', 'ai_services'
      ];
      
      for (const perm of packageInfo.permissions || []) {
        if (!validPermissions.includes(perm)) {
          warnings.push(`Unknown permission: ${perm}`);
        }
      }

      // Check for dangerous patterns
      if (packageInfo.permissions?.includes('file_system')) {
        warnings.push('File system access requires additional review');
      }

      // Check dependencies
      for (const [dep, version] of Object.entries(packageInfo.dependencies || {})) {
        if (!semver.validRange(version as string)) {
          errors.push(`Invalid version range for ${dep}: ${version}`);
        }
      }

    } catch (error: any) {
      if (error.errors) {
        errors.push(...error.errors.map((e: any) => e.message));
      } else {
        errors.push(error.message);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  // Security scanning
  private async securityScan(
    packageData: Buffer,
    packageInfo: any
  ): Promise<{
    passed: boolean;
    score: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
    issues: Array<{
      severity: string;
      type: string;
      description: string;
      location?: string;
    }>;
    summary: string;
  }> {
    const issues: any[] = [];
    
    // Simulate security scanning
    // In production, this would use tools like:
    // - ESLint security plugin
    // - npm audit
    // - Snyk
    // - Custom static analysis

    // Check for dangerous patterns
    const codeString = packageData.toString();
    
    // Check for eval usage
    if (codeString.includes('eval(')) {
      issues.push({
        severity: 'high',
        type: 'dangerous_function',
        description: 'Use of eval() detected'
      });
    }

    // Check for process access
    if (codeString.includes('process.') && !codeString.includes('process.env')) {
      issues.push({
        severity: 'medium',
        type: 'process_access',
        description: 'Direct process access detected'
      });
    }

    // Check for file system access
    if (codeString.includes('require("fs")') || codeString.includes('import * as fs')) {
      issues.push({
        severity: 'high',
        type: 'file_system',
        description: 'File system access detected'
      });
    }

    // Check for network requests to suspicious domains
    const urlPattern = /https?:\/\/[^\s"']+/g;
    const urls = codeString.match(urlPattern) || [];
    for (const url of urls) {
      if (url.includes('malicious') || url.includes('tracker')) {
        issues.push({
          severity: 'critical',
          type: 'suspicious_url',
          description: `Suspicious URL detected: ${url}`
        });
      }
    }

    // Count issues by severity
    const critical = issues.filter(i => i.severity === 'critical').length;
    const high = issues.filter(i => i.severity === 'high').length;
    const medium = issues.filter(i => i.severity === 'medium').length;
    const low = issues.filter(i => i.severity === 'low').length;

    // Calculate score (0-100)
    const score = Math.max(0, 100 - (critical * 30 + high * 15 + medium * 5 + low * 2));

    return {
      passed: critical === 0 && high < 3,
      score,
      critical,
      high,
      medium,
      low,
      issues,
      summary: `Security scan complete: ${issues.length} issues found`
    };
  }

  // Generate slug from name
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  // Calculate hash
  private calculateHash(data: Buffer): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  // Generate changelog
  private generateChangelog(version: string): string {
    const type = semver.major(version) > 0 ? 'major' :
                 semver.minor(version) > 0 ? 'minor' : 'patch';
    
    return `Version ${version} - ${type} update`;
  }

  // Review and approve item
  async reviewItem(
    itemId: string,
    reviewerId: string,
    decision: 'approve' | 'reject' | 'request-changes',
    feedback?: string
  ): Promise<void> {
    const item = await storage.getMarketplaceItem(itemId);
    if (!item) {
      throw new Error('Item not found');
    }

    if (item.status !== 'pending-review') {
      throw new Error('Item is not pending review');
    }

    let newStatus: 'published' | 'rejected' | 'draft';
    switch (decision) {
      case 'approve':
        newStatus = 'published';
        break;
      case 'reject':
        newStatus = 'rejected';
        break;
      case 'request-changes':
        newStatus = 'draft';
        break;
    }

    await storage.updateMarketplaceItem(itemId, {
      status: newStatus,
      lastReviewedAt: new Date(),
      publishedAt: decision === 'approve' ? new Date() : null
    });

    console.log(`Item ${itemId} reviewed by ${reviewerId}: ${decision} - ${feedback}`);
  }

  // Unpublish item
  async unpublishItem(
    itemId: string,
    authorId: string,
    reason?: string
  ): Promise<void> {
    const item = await storage.getMarketplaceItem(itemId);
    if (!item) {
      throw new Error('Item not found');
    }

    if (item.authorId !== authorId) {
      throw new Error('Unauthorized: You are not the author');
    }

    await storage.updateMarketplaceItem(itemId, {
      status: 'draft',
      visibility: 'private',
      updatedAt: new Date()
    });

    console.log(`Item ${itemId} unpublished: ${reason}`);
  }

  // Deprecate version
  async deprecateVersion(
    versionId: string,
    authorId: string,
    reason: string
  ): Promise<void> {
    const version = await storage.getMarketplaceVersion(versionId);
    if (!version) {
      throw new Error('Version not found');
    }

    // TODO: Verify author owns the item
    // await storage.updateMarketplaceVersion(versionId, {
    //   deprecated: true,
    //   deprecationReason: reason
    // });

    console.log(`Version ${versionId} deprecated: ${reason}`);
  }

  // Generate documentation
  async generateDocumentation(
    itemId: string
  ): Promise<string> {
    const item = await storage.getMarketplaceItem(itemId);
    if (!item) {
      throw new Error('Item not found');
    }

    const versions = await storage.getMarketplaceVersions(itemId);
    const latestVersion = versions[0];

    // Generate markdown documentation
    let doc = `# ${item.name}\n\n`;
    doc += `${item.description}\n\n`;
    doc += `## Installation\n\n`;
    doc += `\`\`\`bash\nmarketplace install ${item.slug}\n\`\`\`\n\n`;
    doc += `## Version History\n\n`;
    
    for (const version of versions) {
      doc += `### v${version.version}\n`;
      doc += `${version.changelog || 'No changelog'}\n\n`;
    }

    return doc;
  }
}

export const publishingService = PublishingService.getInstance();