// Bundle analysis utilities

export interface BundleStats {
  totalSize: number;
  gzipSize: number;
  brotliSize: number;
  chunks: ChunkInfo[];
  assets: AssetInfo[];
}

export interface ChunkInfo {
  name: string;
  size: number;
  gzipSize: number;
  brotliSize: number;
  modules: ModuleInfo[];
}

export interface ModuleInfo {
  name: string;
  size: number;
  gzipSize: number;
  brotliSize: number;
}

export interface AssetInfo {
  name: string;
  size: number;
  type: string;
}

// Bundle size monitoring
export class BundleAnalyzer {
  private static instance: BundleAnalyzer;
  private stats: BundleStats | null = null;

  private constructor() {}

  public static getInstance(): BundleAnalyzer {
    if (!BundleAnalyzer.instance) {
      BundleAnalyzer.instance = new BundleAnalyzer();
    }
    return BundleAnalyzer.instance;
  }

  public async analyzeBundle(): Promise<BundleStats> {
    try {
      // This would typically be called after build
      // In a real implementation, you'd parse the stats.json file
      const response = await fetch('/stats.json');
      if (response.ok) {
        this.stats = await response.json();
      }
      return this.stats || this.getDefaultStats();
    } catch (error) {
      console.error('Bundle analysis failed:', error);
      return this.getDefaultStats();
    }
  }

  private getDefaultStats(): BundleStats {
    return {
      totalSize: 0,
      gzipSize: 0,
      brotliSize: 0,
      chunks: [],
      assets: []
    };
  }

  public getLargestChunks(limit: number = 5): ChunkInfo[] {
    if (!this.stats) return [];
    
    return this.stats.chunks
      .sort((a, b) => b.size - a.size)
      .slice(0, limit);
  }

  public getLargestModules(limit: number = 10): ModuleInfo[] {
    if (!this.stats) return [];
    
    const allModules: ModuleInfo[] = [];
    this.stats.chunks.forEach(chunk => {
      allModules.push(...chunk.modules);
    });
    
    return allModules
      .sort((a, b) => b.size - a.size)
      .slice(0, limit);
  }

  public getDuplicateModules(): ModuleInfo[] {
    if (!this.stats) return [];
    
    const moduleMap = new Map<string, ModuleInfo[]>();
    
    this.stats.chunks.forEach(chunk => {
      chunk.modules.forEach(module => {
        if (!moduleMap.has(module.name)) {
          moduleMap.set(module.name, []);
        }
        moduleMap.get(module.name)!.push(module);
      });
    });
    
    return Array.from(moduleMap.values())
      .filter(modules => modules.length > 1)
      .flat();
  }

  public getBundleHealthScore(): number {
    if (!this.stats) return 0;
    
    const totalSize = this.stats.totalSize;
    const gzipSize = this.stats.gzipSize;
    const compressionRatio = gzipSize / totalSize;
    
    // Score based on compression ratio and total size
    let score = 100;
    
    // Penalize large bundles
    if (totalSize > 1000 * 1024) score -= 20; // > 1MB
    if (totalSize > 500 * 1024) score -= 10;  // > 500KB
    
    // Reward good compression
    if (compressionRatio < 0.3) score += 10;  // < 30% of original
    if (compressionRatio > 0.5) score -= 10;  // > 50% of original
    
    // Check for duplicate modules
    const duplicates = this.getDuplicateModules();
    if (duplicates.length > 0) score -= duplicates.length * 2;
    
    return Math.max(0, Math.min(100, score));
  }

  public getRecommendations(): string[] {
    const recommendations: string[] = [];
    
    if (!this.stats) return recommendations;
    
    const totalSize = this.stats.totalSize;
    const gzipSize = this.stats.gzipSize;
    const compressionRatio = gzipSize / totalSize;
    
    if (totalSize > 1000 * 1024) {
      recommendations.push('Bundle size is large (>1MB). Consider code splitting.');
    }
    
    if (compressionRatio > 0.4) {
      recommendations.push('Compression ratio is poor. Check for uncompressed assets.');
    }
    
    const duplicates = this.getDuplicateModules();
    if (duplicates.length > 0) {
      recommendations.push(`Found ${duplicates.length} duplicate modules. Consider deduplication.`);
    }
    
    const largestChunks = this.getLargestChunks(3);
    largestChunks.forEach(chunk => {
      if (chunk.size > 200 * 1024) {
        recommendations.push(`Chunk "${chunk.name}" is large (${Math.round(chunk.size / 1024)}KB). Consider splitting.`);
      }
    });
    
    return recommendations;
  }
}

// Performance budget monitoring
export class PerformanceBudget {
  private static readonly BUDGETS = {
    totalSize: 1000 * 1024, // 1MB
    gzipSize: 300 * 1024,   // 300KB
    brotliSize: 250 * 1024, // 250KB
    chunkSize: 200 * 1024,  // 200KB per chunk
    moduleSize: 50 * 1024   // 50KB per module
  };

  public static checkBudgets(stats: BundleStats): BudgetResult[] {
    const results: BudgetResult[] = [];
    
    // Total size budget
    if (stats.totalSize > this.BUDGETS.totalSize) {
      results.push({
        type: 'totalSize',
        actual: stats.totalSize,
        budget: this.BUDGETS.totalSize,
        status: 'exceeded'
      });
    }
    
    // Gzip size budget
    if (stats.gzipSize > this.BUDGETS.gzipSize) {
      results.push({
        type: 'gzipSize',
        actual: stats.gzipSize,
        budget: this.BUDGETS.gzipSize,
        status: 'exceeded'
      });
    }
    
    // Brotli size budget
    if (stats.brotliSize > this.BUDGETS.brotliSize) {
      results.push({
        type: 'brotliSize',
        actual: stats.brotliSize,
        budget: this.BUDGETS.brotliSize,
        status: 'exceeded'
      });
    }
    
    // Chunk size budgets
    stats.chunks.forEach(chunk => {
      if (chunk.size > this.BUDGETS.chunkSize) {
        results.push({
          type: 'chunkSize',
          actual: chunk.size,
          budget: this.BUDGETS.chunkSize,
          status: 'exceeded',
          chunkName: chunk.name
        });
      }
    });
    
    return results;
  }
}

export interface BudgetResult {
  type: string;
  actual: number;
  budget: number;
  status: 'exceeded' | 'within';
  chunkName?: string;
}

// Export utilities
export const bundleAnalyzer = BundleAnalyzer.getInstance();
export const performanceBudget = PerformanceBudget;