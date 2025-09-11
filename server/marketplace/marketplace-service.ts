import { storage } from "../storage";
import { 
  type MarketplaceItem,
  type MarketplaceVersion,
  type MarketplaceAuthor,
  type MarketplaceInstallation,
  type MarketplaceReview,
  type MarketplaceLicense,
  type MarketplacePermission,
  type MarketplaceDependency,
  type MarketplaceTransaction,
  type InsertMarketplaceItem,
  type InsertMarketplaceVersion,
  type InsertMarketplaceInstallation,
  type InsertMarketplaceReview,
  type InsertMarketplaceLicense,
  type InsertMarketplacePermission,
  type InsertMarketplaceDependency,
  type InsertMarketplaceTransaction
} from "@shared/schema";
import { z } from "zod";
import crypto from "crypto";
import semver from "semver";

// Permission levels and risk assessment
export enum PluginPermission {
  READ_DOM = 'read_dom',
  WRITE_DOM = 'write_dom',
  NETWORK = 'network',
  STORAGE = 'storage',
  CLIPBOARD = 'clipboard',
  NOTIFICATIONS = 'notifications',
  BROWSER_AUTOMATION = 'browser_automation',
  AI_SERVICES = 'ai_services',
  SYSTEM_INFO = 'system_info',
  FILE_SYSTEM = 'file_system'
}

export enum RiskLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// Permission risk assessment
const PERMISSION_RISK_MAP: Record<PluginPermission, RiskLevel> = {
  [PluginPermission.READ_DOM]: RiskLevel.LOW,
  [PluginPermission.WRITE_DOM]: RiskLevel.MEDIUM,
  [PluginPermission.NETWORK]: RiskLevel.HIGH,
  [PluginPermission.STORAGE]: RiskLevel.MEDIUM,
  [PluginPermission.CLIPBOARD]: RiskLevel.MEDIUM,
  [PluginPermission.NOTIFICATIONS]: RiskLevel.LOW,
  [PluginPermission.BROWSER_AUTOMATION]: RiskLevel.HIGH,
  [PluginPermission.AI_SERVICES]: RiskLevel.MEDIUM,
  [PluginPermission.SYSTEM_INFO]: RiskLevel.HIGH,
  [PluginPermission.FILE_SYSTEM]: RiskLevel.CRITICAL
};

// Search and filter schema
const MarketplaceSearchSchema = z.object({
  query: z.string().optional(),
  type: z.enum(['plugin', 'playbook']).optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  author: z.string().optional(),
  minRating: z.number().min(0).max(5).optional(),
  maxPrice: z.number().min(0).optional(),
  featured: z.boolean().optional(),
  verified: z.boolean().optional(),
  sortBy: z.enum(['downloads', 'rating', 'created', 'updated', 'price']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0)
});

export type MarketplaceSearchParams = z.infer<typeof MarketplaceSearchSchema>;

export class MarketplaceService {
  private static instance: MarketplaceService;

  private constructor() {}

  static getInstance(): MarketplaceService {
    if (!MarketplaceService.instance) {
      MarketplaceService.instance = new MarketplaceService();
    }
    return MarketplaceService.instance;
  }

  // Search and browse marketplace items
  async searchItems(params: MarketplaceSearchParams): Promise<{
    items: MarketplaceItem[];
    total: number;
    hasMore: boolean;
  }> {
    const validated = MarketplaceSearchSchema.parse(params);
    
    // Get all items with basic filters
    const items = await storage.getMarketplaceItems({
      type: validated.type,
      category: validated.category,
      search: validated.query,
      featured: validated.featured
    });

    // Apply additional filters
    let filtered = items;
    
    if (validated.tags && validated.tags.length > 0) {
      filtered = filtered.filter(item => 
        validated.tags!.some(tag => item.tags?.includes(tag))
      );
    }
    
    if (validated.minRating !== undefined) {
      filtered = filtered.filter(item => item.rating >= validated.minRating!);
    }
    
    if (validated.maxPrice !== undefined) {
      filtered = filtered.filter(item => item.price <= validated.maxPrice!);
    }
    
    if (validated.verified) {
      // Check if author is verified
      const authors = await Promise.all(
        filtered.map(item => storage.getMarketplaceAuthor(item.authorId))
      );
      filtered = filtered.filter((item, index) => authors[index]?.verified);
    }

    // Sort items
    const sortBy = validated.sortBy || 'downloads';
    const sortOrder = validated.sortOrder || 'desc';
    
    filtered.sort((a, b) => {
      let aVal: any, bVal: any;
      
      switch (sortBy) {
        case 'downloads':
          aVal = a.downloads;
          bVal = b.downloads;
          break;
        case 'rating':
          aVal = a.rating;
          bVal = b.rating;
          break;
        case 'created':
          aVal = a.createdAt.getTime();
          bVal = b.createdAt.getTime();
          break;
        case 'updated':
          aVal = a.updatedAt.getTime();
          bVal = b.updatedAt.getTime();
          break;
        case 'price':
          aVal = a.price;
          bVal = b.price;
          break;
      }
      
      return sortOrder === 'desc' ? bVal - aVal : aVal - bVal;
    });

    // Apply pagination
    const start = validated.offset;
    const end = start + validated.limit;
    const paginated = filtered.slice(start, end);

    return {
      items: paginated,
      total: filtered.length,
      hasMore: end < filtered.length
    };
  }

  // Get detailed item information
  async getItemDetails(itemId: string): Promise<{
    item: MarketplaceItem;
    author: MarketplaceAuthor;
    versions: MarketplaceVersion[];
    permissions: MarketplacePermission[];
    dependencies: MarketplaceDependency[];
    reviews: MarketplaceReview[];
  } | null> {
    const item = await storage.getMarketplaceItem(itemId);
    if (!item) return null;

    const [author, versions, reviews] = await Promise.all([
      storage.getMarketplaceAuthor(item.authorId),
      storage.getMarketplaceVersions(itemId),
      storage.getMarketplaceReviews(itemId)
    ]);

    if (!author) return null;

    // TODO: Implement getMarketplacePermissions and getMarketplaceDependencies in storage
    const permissions: MarketplacePermission[] = [];
    const dependencies: MarketplaceDependency[] = [];

    return {
      item,
      author,
      versions,
      permissions,
      dependencies,
      reviews
    };
  }

  // Install a marketplace item
  async installItem(
    itemId: string,
    userId: string,
    versionId?: string
  ): Promise<MarketplaceInstallation> {
    const item = await storage.getMarketplaceItem(itemId);
    if (!item) {
      throw new Error('Item not found');
    }

    if (item.status !== 'published') {
      throw new Error('Item is not published');
    }

    // Check if already installed
    const existing = await storage.getMarketplaceInstallation(itemId, userId);
    if (existing && existing.status === 'active') {
      throw new Error('Item already installed');
    }

    // Get latest version if not specified
    let targetVersionId = versionId;
    if (!targetVersionId) {
      const versions = await storage.getMarketplaceVersions(itemId);
      if (versions.length === 0) {
        throw new Error('No versions available');
      }
      targetVersionId = versions[0].id; // Latest version
    }

    // Check if paid item requires license
    if (item.price > 0) {
      // TODO: Verify license exists for user
      // const license = await this.verifyLicense(itemId, userId);
      // if (!license) {
      //   throw new Error('Valid license required');
      // }
    }

    // Create installation record
    const installation = await storage.createMarketplaceInstallation({
      itemId,
      versionId: targetVersionId,
      userId,
      status: 'active',
      autoUpdate: true,
      settings: {},
      permissions: [], // Will be populated during permission grant
      usageStats: {}
    });

    // Track download
    await storage.trackMarketplaceDownload({
      itemId,
      versionId: targetVersionId,
      userId,
      ipAddress: null,
      userAgent: null,
      country: null,
      referrer: null
    });

    return installation;
  }

  // Uninstall a marketplace item
  async uninstallItem(itemId: string, userId: string): Promise<void> {
    const installation = await storage.getMarketplaceInstallation(itemId, userId);
    if (!installation) {
      throw new Error('Item not installed');
    }

    await storage.updateMarketplaceInstallation(installation.id, {
      status: 'uninstalled',
      uninstalledAt: new Date()
    });
  }

  // Create or update a review
  async createReview(
    itemId: string,
    userId: string,
    rating: number,
    title?: string,
    review?: string
  ): Promise<MarketplaceReview> {
    // Verify user has installed the item
    const installation = await storage.getMarketplaceInstallation(itemId, userId);
    if (!installation) {
      throw new Error('You must install the item before reviewing');
    }

    // Check for existing review
    const existingReviews = await storage.getMarketplaceReviews(itemId);
    const userReview = existingReviews.find(r => r.userId === userId);
    
    if (userReview) {
      throw new Error('You have already reviewed this item');
    }

    // Create review
    const newReview = await storage.createMarketplaceReview({
      itemId,
      userId,
      versionId: installation.versionId,
      rating,
      title,
      review,
      verified: true // Since we verified installation
    });

    return newReview;
  }

  // Publish a new marketplace item
  async publishItem(
    authorId: string,
    item: InsertMarketplaceItem,
    version: Omit<InsertMarketplaceVersion, 'itemId'>,
    permissions: Array<{ permission: PluginPermission; reason: string; optional?: boolean }>
  ): Promise<MarketplaceItem> {
    // Validate author exists
    const author = await storage.getMarketplaceAuthor(authorId);
    if (!author) {
      throw new Error('Author profile not found');
    }

    // Create the item
    const createdItem = await storage.createMarketplaceItem({
      ...item,
      authorId,
      status: 'pending-review', // Will go through review process
      slug: item.slug || item.name.toLowerCase().replace(/\s+/g, '-')
    });

    // Create initial version
    await storage.createMarketplaceVersion({
      ...version,
      itemId: createdItem.id,
      version: version.version || '1.0.0',
      securityScanStatus: 'pending'
    });

    // Store permissions
    for (const perm of permissions) {
      const riskLevel = PERMISSION_RISK_MAP[perm.permission];
      // TODO: Implement createMarketplacePermission in storage
      // await storage.createMarketplacePermission({
      //   itemId: createdItem.id,
      //   permission: perm.permission,
      //   reason: perm.reason,
      //   optional: perm.optional || false,
      //   riskLevel
      // });
    }

    // Update author's published count
    await storage.updateMarketplaceAuthor(authorId, {
      itemsPublished: author.itemsPublished + 1
    });

    return createdItem;
  }

  // Update marketplace item
  async updateItem(
    itemId: string,
    authorId: string,
    updates: Partial<InsertMarketplaceItem>
  ): Promise<MarketplaceItem> {
    const item = await storage.getMarketplaceItem(itemId);
    if (!item) {
      throw new Error('Item not found');
    }

    if (item.authorId !== authorId) {
      throw new Error('Unauthorized: You are not the author');
    }

    const updated = await storage.updateMarketplaceItem(itemId, updates);
    if (!updated) {
      throw new Error('Failed to update item');
    }

    return updated;
  }

  // Create new version
  async createVersion(
    itemId: string,
    authorId: string,
    version: Omit<InsertMarketplaceVersion, 'itemId'>
  ): Promise<MarketplaceVersion> {
    const item = await storage.getMarketplaceItem(itemId);
    if (!item) {
      throw new Error('Item not found');
    }

    if (item.authorId !== authorId) {
      throw new Error('Unauthorized: You are not the author');
    }

    // Validate version number
    const versions = await storage.getMarketplaceVersions(itemId);
    const latestVersion = versions[0];
    
    if (latestVersion && !semver.gt(version.version, latestVersion.version)) {
      throw new Error('New version must be greater than current version');
    }

    const newVersion = await storage.createMarketplaceVersion({
      ...version,
      itemId,
      securityScanStatus: 'pending'
    });

    // Trigger security scan
    await this.triggerSecurityScan(itemId, newVersion.id);

    return newVersion;
  }

  // Security scanning (placeholder)
  private async triggerSecurityScan(itemId: string, versionId: string): Promise<void> {
    // TODO: Implement actual security scanning
    // This would integrate with external security tools or custom scanners
    console.log(`Security scan triggered for item ${itemId} version ${versionId}`);
    
    // Simulate scan completion
    setTimeout(async () => {
      // Update scan status
      // await storage.updateMarketplaceVersion(versionId, {
      //   securityScanStatus: 'passed',
      //   securityScanReport: { issues: [], score: 100 }
      // });
    }, 5000);
  }

  // Calculate package hash for integrity verification
  calculatePackageHash(packageData: Buffer): string {
    return crypto.createHash('sha256').update(packageData).digest('hex');
  }

  // Verify package integrity
  async verifyPackageIntegrity(
    versionId: string,
    packageData: Buffer
  ): Promise<boolean> {
    const version = await storage.getMarketplaceVersion(versionId);
    if (!version || !version.packageHash) return false;
    
    const calculatedHash = this.calculatePackageHash(packageData);
    return calculatedHash === version.packageHash;
  }

  // Get user's installations
  async getUserInstallations(userId: string): Promise<MarketplaceInstallation[]> {
    return await storage.getMarketplaceInstallations(userId);
  }

  // Get author profile
  async getAuthorProfile(authorId: string): Promise<{
    author: MarketplaceAuthor;
    items: MarketplaceItem[];
    totalDownloads: number;
    averageRating: number;
  } | null> {
    const author = await storage.getMarketplaceAuthor(authorId);
    if (!author) return null;

    const items = await storage.getMarketplaceItems();
    const authorItems = items.filter(item => item.authorId === authorId);
    
    const totalDownloads = authorItems.reduce((sum, item) => sum + item.downloads, 0);
    const averageRating = authorItems.length > 0
      ? authorItems.reduce((sum, item) => sum + item.rating, 0) / authorItems.length
      : 0;

    return {
      author,
      items: authorItems,
      totalDownloads,
      averageRating
    };
  }

  // Create author profile
  async createAuthorProfile(
    userId: string,
    profile: Omit<InsertMarketplaceAuthor, 'userId'>
  ): Promise<MarketplaceAuthor> {
    // Check if profile already exists
    const existing = await storage.getMarketplaceAuthorByUserId(userId);
    if (existing) {
      throw new Error('Author profile already exists');
    }

    return await storage.createMarketplaceAuthor({
      ...profile,
      userId
    });
  }

  // Analytics tracking
  async trackUsage(
    itemId: string,
    installationId: string,
    event: string,
    metadata?: any
  ): Promise<void> {
    // TODO: Implement usage tracking
    console.log(`Usage tracked: ${itemId} - ${event}`, metadata);
  }

  // Get trending items
  async getTrendingItems(limit: number = 10): Promise<MarketplaceItem[]> {
    const items = await storage.getMarketplaceItems();
    
    // Calculate trending score based on recent downloads and ratings
    const now = Date.now();
    const dayInMs = 24 * 60 * 60 * 1000;
    
    const scored = items.map(item => {
      // Recency factor (items updated in last 7 days get boost)
      const recencyBoost = (now - item.updatedAt.getTime()) < (7 * dayInMs) ? 2 : 1;
      
      // Calculate score: downloads + (rating * reviewCount) * recencyBoost
      const score = (item.downloads + (item.rating * item.reviewCount)) * recencyBoost;
      
      return { item, score };
    });
    
    // Sort by score and return top items
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, limit).map(s => s.item);
  }
}

export const marketplaceService = MarketplaceService.getInstance();