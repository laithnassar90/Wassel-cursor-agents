// Caching service for API calls and data management

import { apiCache, cacheInvalidator } from '../utils/cache';

export interface CacheConfig {
  ttl?: number;
  tags?: string[];
  invalidateOn?: string[];
}

export class CacheService {
  private static instance: CacheService;
  private cache = apiCache;

  private constructor() {}

  public static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  // Generic cache wrapper for any async function
  public async cache<T>(
    key: string,
    fetchFn: () => Promise<T>,
    config: CacheConfig = {}
  ): Promise<T> {
    const cacheKey = this.buildCacheKey(key, config);
    
    return this.cache.getOrFetch(cacheKey, fetchFn, {
      ttl: config.ttl
    });
  }

  // Cache API responses
  public async cacheAPI<T>(
    endpoint: string,
    fetchFn: () => Promise<T>,
    config: CacheConfig = {}
  ): Promise<T> {
    const key = `api:${endpoint}`;
    return this.cache(key, fetchFn, config);
  }

  // Cache user-specific data
  public async cacheUserData<T>(
    userId: string,
    dataType: string,
    fetchFn: () => Promise<T>,
    config: CacheConfig = {}
  ): Promise<T> {
    const key = `user:${userId}:${dataType}`;
    return this.cache(key, fetchFn, config);
  }

  // Cache with automatic invalidation
  public async cacheWithInvalidation<T>(
    key: string,
    fetchFn: () => Promise<T>,
    config: CacheConfig = {}
  ): Promise<T> {
    const result = await this.cache(key, fetchFn, config);
    
    // Set up invalidation if tags are provided
    if (config.tags) {
      config.tags.forEach(tag => {
        this.setupInvalidation(tag, key);
      });
    }
    
    return result;
  }

  // Invalidate cache by pattern
  public invalidate(pattern: string | RegExp): void {
    if (typeof pattern === 'string') {
      cacheInvalidator.invalidateByTag(pattern);
    } else {
      cacheInvalidator.invalidatePattern(pattern);
    }
  }

  // Invalidate user-specific cache
  public invalidateUser(userId: string): void {
    this.invalidate(`user:${userId}`);
  }

  // Invalidate API cache
  public invalidateAPI(endpoint: string): void {
    this.invalidate(`api:${endpoint}`);
  }

  // Clear all cache
  public clearAll(): void {
    this.cache.clear();
  }

  // Get cache statistics
  public getStats() {
    return this.cache.getStats();
  }

  // Preload data
  public async preload<T>(
    key: string,
    fetchFn: () => Promise<T>,
    config: CacheConfig = {}
  ): Promise<void> {
    try {
      await this.cache(key, fetchFn, config);
    } catch (error) {
      console.warn('Preload failed:', error);
    }
  }

  // Batch preload
  public async preloadBatch<T>(
    items: Array<{ key: string; fetchFn: () => Promise<T>; config?: CacheConfig }>
  ): Promise<void> {
    const promises = items.map(item => 
      this.preload(item.key, item.fetchFn, item.config)
    );
    
    await Promise.allSettled(promises);
  }

  private buildCacheKey(key: string, config: CacheConfig): string {
    let cacheKey = key;
    
    if (config.tags) {
      cacheKey = `${config.tags.join(':')}:${cacheKey}`;
    }
    
    return cacheKey;
  }

  private setupInvalidation(tag: string, key: string): void {
    // This would typically set up event listeners or timers
    // for automatic cache invalidation based on tags
    console.log(`Setting up invalidation for tag: ${tag}, key: ${key}`);
  }
}

// React hook for caching
export function useCacheService() {
  const cacheService = CacheService.getInstance();
  
  return {
    cache: <T>(key: string, fetchFn: () => Promise<T>, config?: CacheConfig) => 
      cacheService.cache(key, fetchFn, config),
    cacheAPI: <T>(endpoint: string, fetchFn: () => Promise<T>, config?: CacheConfig) => 
      cacheService.cacheAPI(endpoint, fetchFn, config),
    cacheUserData: <T>(userId: string, dataType: string, fetchFn: () => Promise<T>, config?: CacheConfig) => 
      cacheService.cacheUserData(userId, dataType, fetchFn, config),
    invalidate: (pattern: string | RegExp) => cacheService.invalidate(pattern),
    invalidateUser: (userId: string) => cacheService.invalidateUser(userId),
    invalidateAPI: (endpoint: string) => cacheService.invalidateAPI(endpoint),
    clearAll: () => cacheService.clearAll(),
    getStats: () => cacheService.getStats(),
    preload: <T>(key: string, fetchFn: () => Promise<T>, config?: CacheConfig) => 
      cacheService.preload(key, fetchFn, config),
    preloadBatch: <T>(items: Array<{ key: string; fetchFn: () => Promise<T>; config?: CacheConfig }>) => 
      cacheService.preloadBatch(items)
  };
}

// Cache configuration presets
export const CachePresets = {
  // Short-term cache for frequently changing data
  SHORT_TERM: {
    ttl: 60 * 1000, // 1 minute
    tags: ['short-term']
  },
  
  // Medium-term cache for moderately stable data
  MEDIUM_TERM: {
    ttl: 5 * 60 * 1000, // 5 minutes
    tags: ['medium-term']
  },
  
  // Long-term cache for stable data
  LONG_TERM: {
    ttl: 60 * 60 * 1000, // 1 hour
    tags: ['long-term']
  },
  
  // User data cache
  USER_DATA: {
    ttl: 10 * 60 * 1000, // 10 minutes
    tags: ['user-data']
  },
  
  // API response cache
  API_RESPONSE: {
    ttl: 5 * 60 * 1000, // 5 minutes
    tags: ['api']
  },
  
  // Static content cache
  STATIC_CONTENT: {
    ttl: 24 * 60 * 60 * 1000, // 24 hours
    tags: ['static']
  }
};

// Export singleton instance
export const cacheService = CacheService.getInstance();