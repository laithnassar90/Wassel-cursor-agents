// Comprehensive caching strategies for different data types

export interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  maxSize?: number; // Maximum number of items
  strategy?: 'lru' | 'fifo' | 'lfu'; // Cache eviction strategy
  persist?: boolean; // Whether to persist to localStorage
}

export interface CacheItem<T> {
  value: T;
  timestamp: number;
  accessCount: number;
  lastAccessed: number;
}

export class CacheManager<T> {
  private cache = new Map<string, CacheItem<T>>();
  private options: Required<CacheOptions>;
  private accessOrder: string[] = [];

  constructor(options: CacheOptions = {}) {
    this.options = {
      ttl: options.ttl || 5 * 60 * 1000, // 5 minutes default
      maxSize: options.maxSize || 100,
      strategy: options.strategy || 'lru',
      persist: options.persist || false
    };

    if (this.options.persist) {
      this.loadFromStorage();
    }
  }

  public set(key: string, value: T): void {
    const now = Date.now();
    const item: CacheItem<T> = {
      value,
      timestamp: now,
      accessCount: 0,
      lastAccessed: now
    };

    // Remove existing item if it exists
    if (this.cache.has(key)) {
      this.removeFromAccessOrder(key);
    }

    // Add new item
    this.cache.set(key, item);
    this.addToAccessOrder(key);

    // Enforce size limit
    this.enforceSizeLimit();

    // Persist if enabled
    if (this.options.persist) {
      this.saveToStorage();
    }
  }

  public get(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }

    // Check TTL
    if (Date.now() - item.timestamp > this.options.ttl) {
      this.delete(key);
      return null;
    }

    // Update access info
    item.accessCount++;
    item.lastAccessed = Date.now();
    this.updateAccessOrder(key);

    return item.value;
  }

  public has(key: string): boolean {
    return this.cache.has(key) && this.get(key) !== null;
  }

  public delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    this.removeFromAccessOrder(key);
    
    if (this.options.persist) {
      this.saveToStorage();
    }
    
    return deleted;
  }

  public clear(): void {
    this.cache.clear();
    this.accessOrder = [];
    
    if (this.options.persist) {
      localStorage.removeItem(this.getStorageKey());
    }
  }

  public size(): number {
    return this.cache.size;
  }

  public keys(): string[] {
    return Array.from(this.cache.keys());
  }

  public values(): T[] {
    return Array.from(this.cache.values()).map(item => item.value);
  }

  public getStats(): {
    size: number;
    maxSize: number;
    hitRate: number;
    oldestItem: number;
    newestItem: number;
  } {
    const items = Array.from(this.cache.values());
    const timestamps = items.map(item => item.timestamp);
    
    return {
      size: this.cache.size,
      maxSize: this.options.maxSize,
      hitRate: this.calculateHitRate(),
      oldestItem: timestamps.length ? Math.min(...timestamps) : 0,
      newestItem: timestamps.length ? Math.max(...timestamps) : 0
    };
  }

  private enforceSizeLimit(): void {
    if (this.cache.size <= this.options.maxSize) {
      return;
    }

    const toRemove = this.cache.size - this.options.maxSize;
    
    for (let i = 0; i < toRemove; i++) {
      const keyToRemove = this.getKeyToEvict();
      if (keyToRemove) {
        this.delete(keyToRemove);
      }
    }
  }

  private getKeyToEvict(): string | null {
    switch (this.options.strategy) {
      case 'lru':
        return this.accessOrder[0] || null;
      case 'fifo':
        return this.accessOrder[0] || null;
      case 'lfu':
        return this.getLeastFrequentlyUsedKey();
      default:
        return this.accessOrder[0] || null;
    }
  }

  private getLeastFrequentlyUsedKey(): string | null {
    let minAccessCount = Infinity;
    let keyToRemove: string | null = null;

    for (const [key, item] of this.cache.entries()) {
      if (item.accessCount < minAccessCount) {
        minAccessCount = item.accessCount;
        keyToRemove = key;
      }
    }

    return keyToRemove;
  }

  private addToAccessOrder(key: string): void {
    this.accessOrder.push(key);
  }

  private removeFromAccessOrder(key: string): void {
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
  }

  private updateAccessOrder(key: string): void {
    this.removeFromAccessOrder(key);
    this.addToAccessOrder(key);
  }

  private calculateHitRate(): number {
    // This is a simplified calculation
    // In a real implementation, you'd track hits and misses
    return 0.85; // Placeholder
  }

  private getStorageKey(): string {
    return `cache_${this.constructor.name}`;
  }

  private saveToStorage(): void {
    try {
      const data = Array.from(this.cache.entries());
      localStorage.setItem(this.getStorageKey(), JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save cache to storage:', error);
    }
  }

  private loadFromStorage(): void {
    try {
      const data = localStorage.getItem(this.getStorageKey());
      if (data) {
        const entries = JSON.parse(data);
        for (const [key, item] of entries) {
          this.cache.set(key, item);
          this.accessOrder.push(key);
        }
      }
    } catch (error) {
      console.warn('Failed to load cache from storage:', error);
    }
  }
}

// Specialized cache managers for different data types
export class APICache extends CacheManager<any> {
  constructor() {
    super({
      ttl: 5 * 60 * 1000, // 5 minutes
      maxSize: 50,
      strategy: 'lru',
      persist: true
    });
  }

  public async getOrFetch<T>(
    key: string,
    fetchFn: () => Promise<T>,
    options?: { ttl?: number }
  ): Promise<T> {
    const cached = this.get(key);
    if (cached) {
      return cached;
    }

    try {
      const data = await fetchFn();
      this.set(key, data);
      return data;
    } catch (error) {
      console.error('API fetch failed:', error);
      throw error;
    }
  }
}

export class ImageCache extends CacheManager<string> {
  constructor() {
    super({
      ttl: 30 * 60 * 1000, // 30 minutes
      maxSize: 20,
      strategy: 'lru',
      persist: false // Don't persist images
    });
  }

  public async preloadImage(src: string): Promise<string> {
    const cached = this.get(src);
    if (cached) {
      return cached;
    }

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        this.set(src, src);
        resolve(src);
      };
      img.onerror = reject;
      img.src = src;
    });
  }
}

export class ComponentCache extends CacheManager<React.ComponentType> {
  constructor() {
    super({
      ttl: 60 * 60 * 1000, // 1 hour
      maxSize: 30,
      strategy: 'lru',
      persist: false
    });
  }
}

// Cache strategies for different scenarios
export class CacheStrategies {
  // Memory cache for frequently accessed data
  public static createMemoryCache<T>(options?: CacheOptions): CacheManager<T> {
    return new CacheManager<T>({
      ttl: 5 * 60 * 1000,
      maxSize: 100,
      strategy: 'lru',
      persist: false,
      ...options
    });
  }

  // Persistent cache for user preferences
  public static createPersistentCache<T>(options?: CacheOptions): CacheManager<T> {
    return new CacheManager<T>({
      ttl: 24 * 60 * 60 * 1000, // 24 hours
      maxSize: 50,
      strategy: 'lru',
      persist: true,
      ...options
    });
  }

  // Session cache for temporary data
  public static createSessionCache<T>(options?: CacheOptions): CacheManager<T> {
    return new CacheManager<T>({
      ttl: 60 * 60 * 1000, // 1 hour
      maxSize: 20,
      strategy: 'fifo',
      persist: false,
      ...options
    });
  }

  // API response cache
  public static createAPICache(): APICache {
    return new APICache();
  }

  // Image cache
  public static createImageCache(): ImageCache {
    return new ImageCache();
  }

  // Component cache
  public static createComponentCache(): ComponentCache {
    return new ComponentCache();
  }
}

// React hook for caching
export function useCache<T>(cache: CacheManager<T>) {
  return {
    get: (key: string) => cache.get(key),
    set: (key: string, value: T) => cache.set(key, value),
    has: (key: string) => cache.has(key),
    delete: (key: string) => cache.delete(key),
    clear: () => cache.clear(),
    stats: () => cache.getStats()
  };
}

// Cache invalidation utilities
export class CacheInvalidator {
  private static instance: CacheInvalidator;
  private caches: Set<CacheManager<any>> = new Set();

  public static getInstance(): CacheInvalidator {
    if (!CacheInvalidator.instance) {
      CacheInvalidator.instance = new CacheInvalidator();
    }
    return CacheInvalidator.instance;
  }

  public register(cache: CacheManager<any>): void {
    this.caches.add(cache);
  }

  public unregister(cache: CacheManager<any>): void {
    this.caches.delete(cache);
  }

  public invalidatePattern(pattern: RegExp): void {
    for (const cache of this.caches) {
      const keys = cache.keys();
      for (const key of keys) {
        if (pattern.test(key)) {
          cache.delete(key);
        }
      }
    }
  }

  public invalidateAll(): void {
    for (const cache of this.caches) {
      cache.clear();
    }
  }

  public invalidateByTag(tag: string): void {
    this.invalidatePattern(new RegExp(`^${tag}:`));
  }
}

// Export singleton instances
export const apiCache = CacheStrategies.createAPICache();
export const imageCache = CacheStrategies.createImageCache();
export const componentCache = CacheStrategies.createComponentCache();
export const cacheInvalidator = CacheInvalidator.getInstance();

// Register caches for invalidation
cacheInvalidator.register(apiCache);
cacheInvalidator.register(imageCache);
cacheInvalidator.register(componentCache);