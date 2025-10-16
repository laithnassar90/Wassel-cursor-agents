// Performance monitoring utilities using Web Vitals

import { getCLS, getFID, getFCP, getLCP, getTTFB, type Metric } from 'web-vitals';

export interface PerformanceMetrics {
  // Core Web Vitals
  CLS: number | null;  // Cumulative Layout Shift
  FID: number | null;  // First Input Delay
  LCP: number | null;  // Largest Contentful Paint
  
  // Additional metrics
  FCP: number | null;  // First Contentful Paint
  TTFB: number | null; // Time to First Byte
  
  // Custom metrics
  loadTime: number | null;
  domContentLoaded: number | null;
  firstPaint: number | null;
  firstContentfulPaint: number | null;
  
  // Resource timing
  resourceCount: number;
  resourceSize: number;
  
  // Navigation timing
  navigationStart: number;
  navigationEnd: number;
  domLoading: number;
  domInteractive: number;
  domComplete: number;
}

export interface PerformanceThresholds {
  CLS: { good: 0.1, needsImprovement: 0.25 };
  FID: { good: 100, needsImprovement: 300 };
  LCP: { good: 2500, needsImprovement: 4000 };
  FCP: { good: 1800, needsImprovement: 3000 };
  TTFB: { good: 800, needsImprovement: 1800 };
}

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: PerformanceMetrics;
  private thresholds: PerformanceThresholds;
  private observers: PerformanceObserver[] = [];
  private isMonitoring = false;

  private constructor() {
    this.metrics = this.initializeMetrics();
    this.thresholds = {
      CLS: { good: 0.1, needsImprovement: 0.25 },
      FID: { good: 100, needsImprovement: 300 },
      LCP: { good: 2500, needsImprovement: 4000 },
      FCP: { good: 1800, needsImprovement: 3000 },
      TTFB: { good: 800, needsImprovement: 1800 }
    };
  }

  public static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  private initializeMetrics(): PerformanceMetrics {
    return {
      CLS: null,
      FID: null,
      LCP: null,
      FCP: null,
      TTFB: null,
      loadTime: null,
      domContentLoaded: null,
      firstPaint: null,
      firstContentfulPaint: null,
      resourceCount: 0,
      resourceSize: 0,
      navigationStart: 0,
      navigationEnd: 0,
      domLoading: 0,
      domInteractive: 0,
      domComplete: 0
    };
  }

  public startMonitoring(): void {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    console.log('Performance monitoring started');
    
    // Monitor Core Web Vitals
    this.monitorWebVitals();
    
    // Monitor custom metrics
    this.monitorCustomMetrics();
    
    // Monitor resource loading
    this.monitorResources();
    
    // Monitor navigation timing
    this.monitorNavigationTiming();
  }

  private monitorWebVitals(): void {
    // Cumulative Layout Shift
    getCLS((metric) => {
      this.metrics.CLS = metric.value;
      this.reportMetric('CLS', metric);
    }, { reportAllChanges: true });

    // First Input Delay
    getFID((metric) => {
      this.metrics.FID = metric.value;
      this.reportMetric('FID', metric);
    });

    // Largest Contentful Paint
    getLCP((metric) => {
      this.metrics.LCP = metric.value;
      this.reportMetric('LCP', metric);
    }, { reportAllChanges: true });

    // First Contentful Paint
    getFCP((metric) => {
      this.metrics.FCP = metric.value;
      this.reportMetric('FCP', metric);
    });

    // Time to First Byte
    getTTFB((metric) => {
      this.metrics.TTFB = metric.value;
      this.reportMetric('TTFB', metric);
    });
  }

  private monitorCustomMetrics(): void {
    // Monitor page load time
    window.addEventListener('load', () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      this.metrics.loadTime = navigation.loadEventEnd - navigation.loadEventStart;
      this.metrics.domContentLoaded = navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart;
      
      console.log('Page load metrics:', {
        loadTime: this.metrics.loadTime,
        domContentLoaded: this.metrics.domContentLoaded
      });
    });

    // Monitor paint timing
    const paintObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name === 'first-paint') {
          this.metrics.firstPaint = entry.startTime;
        } else if (entry.name === 'first-contentful-paint') {
          this.metrics.firstContentfulPaint = entry.startTime;
        }
      }
    });
    
    paintObserver.observe({ entryTypes: ['paint'] });
    this.observers.push(paintObserver);
  }

  private monitorResources(): void {
    const resourceObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'resource') {
          this.metrics.resourceCount++;
          this.metrics.resourceSize += (entry as PerformanceResourceTiming).transferSize || 0;
        }
      }
    });
    
    resourceObserver.observe({ entryTypes: ['resource'] });
    this.observers.push(resourceObserver);
  }

  private monitorNavigationTiming(): void {
    window.addEventListener('load', () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      this.metrics.navigationStart = navigation.navigationStart;
      this.metrics.navigationEnd = navigation.loadEventEnd;
      this.metrics.domLoading = navigation.domLoading;
      this.metrics.domInteractive = navigation.domInteractive;
      this.metrics.domComplete = navigation.domComplete;
    });
  }

  private reportMetric(name: string, metric: Metric): void {
    const threshold = this.thresholds[name as keyof PerformanceThresholds];
    let status = 'good';
    
    if (threshold) {
      if (metric.value > threshold.needsImprovement) {
        status = 'poor';
      } else if (metric.value > threshold.good) {
        status = 'needs-improvement';
      }
    }
    
    console.log(`Web Vital ${name}:`, {
      value: metric.value,
      status,
      threshold: threshold ? `${threshold.good}-${threshold.needsImprovement}` : 'N/A'
    });
    
    // Send to analytics service (implement as needed)
    this.sendToAnalytics(name, metric, status);
  }

  private sendToAnalytics(name: string, metric: Metric, status: string): void {
    // Implement your analytics service here
    // Example: Google Analytics, Mixpanel, etc.
    if (typeof gtag !== 'undefined') {
      gtag('event', 'web_vital', {
        metric_name: name,
        metric_value: Math.round(metric.value),
        metric_status: status,
        metric_delta: Math.round(metric.delta)
      });
    }
  }

  public getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  public getPerformanceScore(): number {
    let score = 100;
    const metrics = this.getMetrics();
    
    // Deduct points for poor Core Web Vitals
    if (metrics.CLS && metrics.CLS > this.thresholds.CLS.needsImprovement) score -= 20;
    if (metrics.FID && metrics.FID > this.thresholds.FID.needsImprovement) score -= 20;
    if (metrics.LCP && metrics.LCP > this.thresholds.LCP.needsImprovement) score -= 20;
    if (metrics.FCP && metrics.FCP > this.thresholds.FCP.needsImprovement) score -= 10;
    if (metrics.TTFB && metrics.TTFB > this.thresholds.TTFB.needsImprovement) score -= 10;
    
    return Math.max(0, score);
  }

  public getRecommendations(): string[] {
    const recommendations: string[] = [];
    const metrics = this.getMetrics();
    
    if (metrics.CLS && metrics.CLS > this.thresholds.CLS.good) {
      recommendations.push('Improve Cumulative Layout Shift (CLS) by avoiding layout shifts');
    }
    
    if (metrics.FID && metrics.FID > this.thresholds.FID.good) {
      recommendations.push('Improve First Input Delay (FID) by reducing JavaScript execution time');
    }
    
    if (metrics.LCP && metrics.LCP > this.thresholds.LCP.good) {
      recommendations.push('Improve Largest Contentful Paint (LCP) by optimizing images and critical resources');
    }
    
    if (metrics.FCP && metrics.FCP > this.thresholds.FCP.good) {
      recommendations.push('Improve First Contentful Paint (FCP) by optimizing critical rendering path');
    }
    
    if (metrics.TTFB && metrics.TTFB > this.thresholds.TTFB.good) {
      recommendations.push('Improve Time to First Byte (TTFB) by optimizing server response time');
    }
    
    return recommendations;
  }

  public stopMonitoring(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    this.isMonitoring = false;
    console.log('Performance monitoring stopped');
  }

  public clearMetrics(): void {
    this.metrics = this.initializeMetrics();
  }
}

// React hook for performance monitoring
export function usePerformanceMonitoring() {
  const monitor = PerformanceMonitor.getInstance();
  
  return {
    startMonitoring: () => monitor.startMonitoring(),
    stopMonitoring: () => monitor.stopMonitoring(),
    getMetrics: () => monitor.getMetrics(),
    getPerformanceScore: () => monitor.getPerformanceScore(),
    getRecommendations: () => monitor.getRecommendations(),
    clearMetrics: () => monitor.clearMetrics()
  };
}

// Utility functions
export const formatMetricValue = (value: number, unit: string = 'ms'): string => {
  if (unit === 'ms') {
    return `${Math.round(value)}ms`;
  }
  return `${value.toFixed(2)}${unit}`;
};

export const getPerformanceGrade = (score: number): string => {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
};

// Export singleton instance
export const performanceMonitor = PerformanceMonitor.getInstance();