import { BulkContentData } from './bulk-fetchers';

/**
 * Cache entry with timestamp for TTL management
 */
interface CacheEntry {
  data: BulkContentData;
  timestamp: number;
}

/**
 * Simple in-memory cache for bulk content data
 * Reduces API calls from 6+ to near 0 for cached content
 */
class ContentCache {
  private cache = new Map<string, CacheEntry>();
  private readonly ttl = 15 * 60 * 1000; // 15 minutes TTL

  /**
   * Set cache entry with current timestamp
   */
  set(key: string, data: BulkContentData): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
    console.log(`📦 Content cached for key: ${key}`);
  }

  /**
   * Get cache entry if not expired
   */
  get(key: string): BulkContentData | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      console.log(`❌ Cache miss for key: ${key}`);
      return null;
    }

    // Check if entry has expired
    const age = Date.now() - entry.timestamp;
    if (age > this.ttl) {
      console.log(`⏰ Cache expired for key: ${key} (age: ${Math.round(age / 1000)}s)`);
      this.cache.delete(key);
      return null;
    }

    console.log(`✅ Cache hit for key: ${key} (age: ${Math.round(age / 1000)}s)`);
    return entry.data;
  }

  /**
   * Clear specific cache entry
   */
  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      console.log(`🗑️ Cache cleared for key: ${key}`);
    }
    return deleted;
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    const size = this.cache.size;
    this.cache.clear();
    console.log(`🧹 Cleared entire cache (${size} entries)`);
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; ttlMinutes: number } {
    return {
      size: this.cache.size,
      ttlMinutes: this.ttl / (60 * 1000)
    };
  }

  /**
   * Clean expired entries
   */
  cleanExpired(): number {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.ttl) {
        this.cache.delete(key);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      console.log(`🧹 Cleaned ${cleaned} expired cache entries`);
    }
    
    return cleaned;
  }
}

// Singleton cache instance
const contentCache = new ContentCache();

// Clean expired entries every 5 minutes
setInterval(() => {
  contentCache.cleanExpired();
}, 5 * 60 * 1000);

export default contentCache; 