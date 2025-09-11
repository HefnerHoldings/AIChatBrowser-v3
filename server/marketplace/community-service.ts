import { storage } from "../storage";
import {
  type MarketplaceAuthor,
  type MarketplaceReview,
  type MarketplaceItem,
  type InsertMarketplaceAuthor,
  type InsertMarketplaceReview
} from "@shared/schema";
import { z } from "zod";

// Community service for marketplace social features
export class CommunityService {
  private static instance: CommunityService;

  private constructor() {}

  static getInstance(): CommunityService {
    if (!CommunityService.instance) {
      CommunityService.instance = new CommunityService();
    }
    return CommunityService.instance;
  }

  // Author profile management
  async createAuthorProfile(
    userId: string,
    profile: Omit<InsertMarketplaceAuthor, 'userId'>
  ): Promise<MarketplaceAuthor> {
    // Check if profile already exists
    const existing = await storage.getMarketplaceAuthorByUserId(userId);
    if (existing) {
      throw new Error('Author profile already exists');
    }

    // Validate username uniqueness
    const authors = await this.getAllAuthors();
    if (authors.some(a => a.username === profile.username)) {
      throw new Error('Username already taken');
    }

    return await storage.createMarketplaceAuthor({
      ...profile,
      userId
    });
  }

  async updateAuthorProfile(
    authorId: string,
    userId: string,
    updates: Partial<InsertMarketplaceAuthor>
  ): Promise<MarketplaceAuthor> {
    const author = await storage.getMarketplaceAuthor(authorId);
    if (!author) {
      throw new Error('Author not found');
    }

    if (author.userId !== userId) {
      throw new Error('Unauthorized');
    }

    const updated = await storage.updateMarketplaceAuthor(authorId, updates);
    if (!updated) {
      throw new Error('Failed to update author profile');
    }

    return updated;
  }

  async getAuthorProfile(authorId: string): Promise<{
    author: MarketplaceAuthor;
    items: MarketplaceItem[];
    stats: {
      totalDownloads: number;
      totalRevenue: number;
      averageRating: number;
      itemsPublished: number;
      reviewCount: number;
    };
  } | null> {
    const author = await storage.getMarketplaceAuthor(authorId);
    if (!author) return null;

    const items = await storage.getMarketplaceItems();
    const authorItems = items.filter(item => item.authorId === authorId);

    // Calculate stats
    const totalDownloads = authorItems.reduce((sum, item) => sum + item.downloads, 0);
    const totalRevenue = author.totalRevenue;
    const ratings = authorItems.filter(item => item.rating > 0);
    const averageRating = ratings.length > 0
      ? ratings.reduce((sum, item) => sum + item.rating, 0) / ratings.length
      : 0;
    const reviewCount = authorItems.reduce((sum, item) => sum + item.reviewCount, 0);

    return {
      author,
      items: authorItems,
      stats: {
        totalDownloads,
        totalRevenue,
        averageRating,
        itemsPublished: authorItems.length,
        reviewCount
      }
    };
  }

  async verifyAuthor(authorId: string): Promise<MarketplaceAuthor> {
    const author = await storage.getMarketplaceAuthor(authorId);
    if (!author) {
      throw new Error('Author not found');
    }

    const updated = await storage.updateMarketplaceAuthor(authorId, {
      verified: true,
      verificationDate: new Date()
    });

    if (!updated) {
      throw new Error('Failed to verify author');
    }

    return updated;
  }

  async getAllAuthors(): Promise<MarketplaceAuthor[]> {
    // TODO: Implement getMarketplaceAuthors in storage
    const items = await storage.getMarketplaceItems();
    const authorIds = [...new Set(items.map(item => item.authorId))];
    const authors = await Promise.all(
      authorIds.map(id => storage.getMarketplaceAuthor(id))
    );
    return authors.filter(a => a !== undefined) as MarketplaceAuthor[];
  }

  // Review system
  async createReview(
    itemId: string,
    userId: string,
    rating: number,
    title?: string,
    review?: string
  ): Promise<MarketplaceReview> {
    // Validate rating
    if (rating < 1 || rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }

    // Check if user has installed the item
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
      verified: true // Verified because we confirmed installation
    });

    // Update item rating
    await this.updateItemRating(itemId);

    return newReview;
  }

  async updateReview(
    reviewId: string,
    userId: string,
    updates: {
      rating?: number;
      title?: string;
      review?: string;
    }
  ): Promise<MarketplaceReview> {
    // TODO: Implement updateMarketplaceReview in storage
    throw new Error('Review updates not yet implemented');
  }

  async flagReview(
    reviewId: string,
    reason: string
  ): Promise<void> {
    // TODO: Implement flagging system
    console.log(`Review ${reviewId} flagged for: ${reason}`);
  }

  async addDeveloperResponse(
    reviewId: string,
    authorId: string,
    response: string
  ): Promise<MarketplaceReview> {
    // TODO: Implement developer response system
    throw new Error('Developer responses not yet implemented');
  }

  async voteReviewHelpful(
    reviewId: string,
    userId: string,
    helpful: boolean
  ): Promise<void> {
    // TODO: Implement review voting system
    console.log(`User ${userId} voted review ${reviewId} as ${helpful ? 'helpful' : 'unhelpful'}`);
  }

  private async updateItemRating(itemId: string): Promise<void> {
    const reviews = await storage.getMarketplaceReviews(itemId);
    const item = await storage.getMarketplaceItem(itemId);
    
    if (!item || reviews.length === 0) return;

    const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
    const averageRating = totalRating / reviews.length;

    await storage.updateMarketplaceItem(itemId, {
      rating: averageRating,
      reviewCount: reviews.length
    });
  }

  // Featured items curation
  async getFeaturedItems(limit: number = 10): Promise<MarketplaceItem[]> {
    const items = await storage.getMarketplaceItems({ featured: true });
    return items.slice(0, limit);
  }

  async setItemFeatured(
    itemId: string,
    featured: boolean
  ): Promise<MarketplaceItem> {
    const item = await storage.getMarketplaceItem(itemId);
    if (!item) {
      throw new Error('Item not found');
    }

    const updated = await storage.updateMarketplaceItem(itemId, { featured });
    if (!updated) {
      throw new Error('Failed to update item');
    }

    return updated;
  }

  // Trending algorithm
  async getTrendingItems(
    timeframe: 'day' | 'week' | 'month' = 'week',
    limit: number = 10
  ): Promise<MarketplaceItem[]> {
    const items = await storage.getMarketplaceItems();
    const now = Date.now();
    
    // Calculate timeframe in milliseconds
    const timeframes = {
      day: 24 * 60 * 60 * 1000,
      week: 7 * 24 * 60 * 60 * 1000,
      month: 30 * 24 * 60 * 60 * 1000
    };
    const timeframeMs = timeframes[timeframe];

    // Score items based on recent activity
    const scored = items.map(item => {
      // Check if item was updated within timeframe
      const isRecent = (now - item.updatedAt.getTime()) < timeframeMs;
      
      // Calculate trending score
      // Factors: downloads, rating, reviews, recency
      const recencyScore = isRecent ? 2 : 1;
      const downloadScore = Math.log10(item.downloads + 1);
      const ratingScore = item.rating * item.reviewCount;
      const featuredBoost = item.featured ? 1.5 : 1;
      
      const score = (downloadScore + ratingScore) * recencyScore * featuredBoost;
      
      return { item, score };
    });

    // Sort by score and return top items
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, limit).map(s => s.item);
  }

  // Popular by category
  async getPopularByCategory(
    category: string,
    limit: number = 10
  ): Promise<MarketplaceItem[]> {
    const items = await storage.getMarketplaceItems({ category });
    
    // Sort by downloads and rating
    items.sort((a, b) => {
      const scoreA = a.downloads + (a.rating * 100);
      const scoreB = b.downloads + (b.rating * 100);
      return scoreB - scoreA;
    });

    return items.slice(0, limit);
  }

  // Recently updated items
  async getRecentlyUpdated(limit: number = 10): Promise<MarketplaceItem[]> {
    const items = await storage.getMarketplaceItems();
    
    // Sort by update date
    items.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
    
    return items.slice(0, limit);
  }

  // Author leaderboard
  async getTopAuthors(limit: number = 10): Promise<Array<{
    author: MarketplaceAuthor;
    score: number;
    rank: number;
  }>> {
    const authors = await this.getAllAuthors();
    const items = await storage.getMarketplaceItems();

    // Calculate scores for each author
    const scored = await Promise.all(
      authors.map(async author => {
        const authorItems = items.filter(item => item.authorId === author.id);
        
        // Calculate author score
        const totalDownloads = authorItems.reduce((sum, item) => sum + item.downloads, 0);
        const avgRating = authorItems.length > 0
          ? authorItems.reduce((sum, item) => sum + item.rating, 0) / authorItems.length
          : 0;
        const verifiedBoost = author.verified ? 2 : 1;
        
        const score = (totalDownloads * 0.3 + avgRating * 100 + author.itemsPublished * 10) * verifiedBoost;
        
        return { author, score };
      })
    );

    // Sort by score and add rank
    scored.sort((a, b) => b.score - a.score);
    
    return scored.slice(0, limit).map((item, index) => ({
      ...item,
      rank: index + 1
    }));
  }

  // Collections (curated lists)
  async getCollections(): Promise<Array<{
    id: string;
    name: string;
    description: string;
    items: MarketplaceItem[];
  }>> {
    // Predefined collections
    const collections = [
      {
        id: 'beginners',
        name: 'Beginner Friendly',
        description: 'Perfect for getting started with automation',
        filter: (item: MarketplaceItem) => item.tags?.includes('beginner')
      },
      {
        id: 'productivity',
        name: 'Productivity Boosters',
        description: 'Automate repetitive tasks and save time',
        filter: (item: MarketplaceItem) => item.category === 'productivity'
      },
      {
        id: 'data-extraction',
        name: 'Data Extraction Tools',
        description: 'Extract and process data from websites',
        filter: (item: MarketplaceItem) => item.category === 'data-extraction'
      },
      {
        id: 'ai-powered',
        name: 'AI-Powered',
        description: 'Leverage artificial intelligence for automation',
        filter: (item: MarketplaceItem) => item.tags?.includes('ai')
      }
    ];

    const items = await storage.getMarketplaceItems();
    
    return collections.map(collection => ({
      id: collection.id,
      name: collection.name,
      description: collection.description,
      items: items.filter(collection.filter).slice(0, 10)
    }));
  }

  // Report/flag system
  async reportItem(
    itemId: string,
    userId: string,
    reason: 'malware' | 'copyright' | 'inappropriate' | 'broken' | 'other',
    details: string
  ): Promise<void> {
    // TODO: Implement reporting system with database storage
    console.log(`Item ${itemId} reported by ${userId} for ${reason}: ${details}`);
    
    // In production, this would:
    // 1. Store report in database
    // 2. Notify moderators
    // 3. Potentially auto-suspend item if multiple reports
  }

  // Moderation
  async moderateItem(
    itemId: string,
    action: 'approve' | 'reject' | 'suspend',
    reason?: string
  ): Promise<void> {
    const item = await storage.getMarketplaceItem(itemId);
    if (!item) {
      throw new Error('Item not found');
    }

    let newStatus: 'published' | 'rejected' | 'suspended';
    switch (action) {
      case 'approve':
        newStatus = 'published';
        break;
      case 'reject':
        newStatus = 'rejected';
        break;
      case 'suspend':
        newStatus = 'suspended';
        break;
    }

    await storage.updateMarketplaceItem(itemId, {
      status: newStatus,
      lastReviewedAt: new Date()
    });

    console.log(`Item ${itemId} moderated: ${action} - ${reason}`);
  }
}

export const communityService = CommunityService.getInstance();