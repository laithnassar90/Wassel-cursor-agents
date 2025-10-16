// Performance regression detection and monitoring

export interface PerformanceBaseline {
  timestamp: string;
  metrics: {
    CLS: number;
    FID: number;
    LCP: number;
    FCP: number;
    TTFB: number;
    loadTime: number;
    bundleSize: number;
    gzipSize: number;
  };
  version: string;
  commit: string;
  environment: string;
}

export interface PerformanceSnapshot {
  timestamp: string;
  metrics: PerformanceBaseline['metrics'];
  environment: string;
  userAgent: string;
  url: string;
  sessionId: string;
}

export interface RegressionAlert {
  id: string;
  timestamp: string;
  metric: string;
  baseline: number;
  current: number;
  regression: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'active' | 'acknowledged' | 'resolved';
  description: string;
}

export class PerformanceRegressionDetector {
  private static instance: PerformanceRegressionDetector;
  private baselines: Map<string, PerformanceBaseline> = new Map();
  private snapshots: PerformanceSnapshot[] = [];
  private alerts: RegressionAlert[] = [];
  private thresholds = {
    CLS: { warning: 0.1, critical: 0.25 },
    FID: { warning: 100, critical: 300 },
    LCP: { warning: 2500, critical: 4000 },
    FCP: { warning: 1800, critical: 3000 },
    TTFB: { warning: 800, critical: 1800 },
    loadTime: { warning: 3000, critical: 5000 },
    bundleSize: { warning: 0.1, critical: 0.2 }, // 10% and 20% increase
    gzipSize: { warning: 0.1, critical: 0.2 }
  };

  private constructor() {
    this.loadBaselines();
    this.loadSnapshots();
  }

  public static getInstance(): PerformanceRegressionDetector {
    if (!PerformanceRegressionDetector.instance) {
      PerformanceRegressionDetector.instance = new PerformanceRegressionDetector();
    }
    return PerformanceRegressionDetector.instance;
  }

  public setBaseline(baseline: PerformanceBaseline): void {
    const key = `${baseline.environment}-${baseline.version}`;
    this.baselines.set(key, baseline);
    this.saveBaselines();
  }

  public getBaseline(environment: string, version?: string): PerformanceBaseline | null {
    if (version) {
      return this.baselines.get(`${environment}-${version}`) || null;
    }
    
    // Get latest baseline for environment
    const keys = Array.from(this.baselines.keys())
      .filter(key => key.startsWith(`${environment}-`))
      .sort()
      .reverse();
    
    return keys.length > 0 ? this.baselines.get(keys[0])! : null;
  }

  public recordSnapshot(snapshot: PerformanceSnapshot): void {
    this.snapshots.push(snapshot);
    this.saveSnapshots();
    
    // Check for regressions
    this.checkForRegressions(snapshot);
  }

  private checkForRegressions(snapshot: PerformanceSnapshot): void {
    const baseline = this.getBaseline(snapshot.environment);
    if (!baseline) {
      console.warn('No baseline found for regression detection');
      return;
    }

    const regressions = this.detectRegressions(baseline, snapshot);
    
    for (const regression of regressions) {
      this.createAlert(regression, snapshot);
    }
  }

  private detectRegressions(
    baseline: PerformanceBaseline, 
    snapshot: PerformanceSnapshot
  ): Array<{
    metric: string;
    baseline: number;
    current: number;
    regression: number;
    severity: 'low' | 'medium' | 'high' | 'critical';
  }> {
    const regressions = [];
    const metrics = Object.keys(baseline.metrics) as Array<keyof PerformanceBaseline['metrics']>;

    for (const metric of metrics) {
      const baselineValue = baseline.metrics[metric];
      const currentValue = snapshot.metrics[metric];
      
      if (currentValue === null || currentValue === undefined) {
        continue;
      }

      const regression = this.calculateRegression(baselineValue, currentValue, metric);
      
      if (regression > 0) {
        const severity = this.calculateSeverity(metric, regression);
        regressions.push({
          metric,
          baseline: baselineValue,
          current: currentValue,
          regression,
          severity
        });
      }
    }

    return regressions;
  }

  private calculateRegression(baseline: number, current: number, metric: string): number {
    // For bundle size metrics, calculate percentage increase
    if (metric === 'bundleSize' || metric === 'gzipSize') {
      return ((current - baseline) / baseline) * 100;
    }
    
    // For performance metrics, calculate absolute increase
    return current - baseline;
  }

  private calculateSeverity(metric: string, regression: number): 'low' | 'medium' | 'high' | 'critical' {
    const threshold = this.thresholds[metric as keyof typeof this.thresholds];
    
    if (!threshold) {
      return 'low';
    }

    if (regression >= threshold.critical) {
      return 'critical';
    } else if (regression >= threshold.warning) {
      return 'high';
    } else if (regression >= threshold.warning * 0.5) {
      return 'medium';
    } else {
      return 'low';
    }
  }

  private createAlert(
    regression: {
      metric: string;
      baseline: number;
      current: number;
      regression: number;
      severity: 'low' | 'medium' | 'high' | 'critical';
    },
    snapshot: PerformanceSnapshot
  ): void {
    const alert: RegressionAlert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      metric: regression.metric,
      baseline: regression.baseline,
      current: regression.current,
      regression: regression.regression,
      severity: regression.severity,
      status: 'active',
      description: this.generateAlertDescription(regression, snapshot)
    };

    this.alerts.push(alert);
    this.saveAlerts();
    
    // Send alert notification
    this.sendAlert(alert);
  }

  private generateAlertDescription(
    regression: any,
    snapshot: PerformanceSnapshot
  ): string {
    const metricName = regression.metric.toUpperCase();
    const change = regression.regression > 0 ? 'increased' : 'decreased';
    const changeValue = regression.regression.toFixed(2);
    
    return `${metricName} ${change} by ${changeValue}${regression.metric.includes('Size') ? '%' : 'ms'} (${regression.baseline} → ${regression.current})`;
  }

  private sendAlert(alert: RegressionAlert): void {
    console.warn(`🚨 Performance Regression Alert: ${alert.description}`);
    
    // Send to monitoring service
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'performance_regression', {
        metric_name: alert.metric,
        regression_value: alert.regression,
        severity: alert.severity,
        alert_id: alert.id
      });
    }

    // Send to custom analytics
    this.sendToAnalytics(alert);
  }

  private sendToAnalytics(alert: RegressionAlert): void {
    fetch('/api/performance-alerts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(alert)
    }).catch(() => {
      // Silently fail if analytics service is unavailable
    });
  }

  public getAlerts(
    severity?: RegressionAlert['severity'],
    status?: RegressionAlert['status']
  ): RegressionAlert[] {
    let filtered = this.alerts;
    
    if (severity) {
      filtered = filtered.filter(alert => alert.severity === severity);
    }
    
    if (status) {
      filtered = filtered.filter(alert => alert.status === status);
    }
    
    return filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  public acknowledgeAlert(alertId: string): void {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.status = 'acknowledged';
      this.saveAlerts();
    }
  }

  public resolveAlert(alertId: string): void {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.status = 'resolved';
      this.saveAlerts();
    }
  }

  public getPerformanceTrend(metric: string, days: number = 7): Array<{
    date: string;
    value: number;
    baseline: number;
  }> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    const recentSnapshots = this.snapshots.filter(
      snapshot => new Date(snapshot.timestamp) >= cutoffDate
    );
    
    return recentSnapshots.map(snapshot => ({
      date: snapshot.timestamp.split('T')[0],
      value: snapshot.metrics[metric as keyof PerformanceSnapshot['metrics']] || 0,
      baseline: this.getBaseline(snapshot.environment)?.metrics[metric as keyof PerformanceBaseline['metrics']] || 0
    }));
  }

  public getRegressionSummary(): {
    totalAlerts: number;
    activeAlerts: number;
    criticalAlerts: number;
    topRegressions: Array<{
      metric: string;
      count: number;
      avgRegression: number;
    }>;
  } {
    const activeAlerts = this.alerts.filter(a => a.status === 'active');
    const criticalAlerts = this.alerts.filter(a => a.severity === 'critical' && a.status === 'active');
    
    const metricCounts = new Map<string, { count: number; totalRegression: number }>();
    
    for (const alert of activeAlerts) {
      const existing = metricCounts.get(alert.metric) || { count: 0, totalRegression: 0 };
      existing.count++;
      existing.totalRegression += alert.regression;
      metricCounts.set(alert.metric, existing);
    }
    
    const topRegressions = Array.from(metricCounts.entries())
      .map(([metric, data]) => ({
        metric,
        count: data.count,
        avgRegression: data.totalRegression / data.count
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    
    return {
      totalAlerts: this.alerts.length,
      activeAlerts: activeAlerts.length,
      criticalAlerts: criticalAlerts.length,
      topRegressions
    };
  }

  private loadBaselines(): void {
    try {
      const data = localStorage.getItem('performance_baselines');
      if (data) {
        const baselines = JSON.parse(data);
        this.baselines = new Map(baselines);
      }
    } catch (error) {
      console.warn('Failed to load performance baselines:', error);
    }
  }

  private saveBaselines(): void {
    try {
      const data = JSON.stringify(Array.from(this.baselines.entries()));
      localStorage.setItem('performance_baselines', data);
    } catch (error) {
      console.warn('Failed to save performance baselines:', error);
    }
  }

  private loadSnapshots(): void {
    try {
      const data = localStorage.getItem('performance_snapshots');
      if (data) {
        this.snapshots = JSON.parse(data);
      }
    } catch (error) {
      console.warn('Failed to load performance snapshots:', error);
    }
  }

  private saveSnapshots(): void {
    try {
      // Keep only last 1000 snapshots
      if (this.snapshots.length > 1000) {
        this.snapshots = this.snapshots.slice(-1000);
      }
      
      const data = JSON.stringify(this.snapshots);
      localStorage.setItem('performance_snapshots', data);
    } catch (error) {
      console.warn('Failed to save performance snapshots:', error);
    }
  }

  private loadAlerts(): void {
    try {
      const data = localStorage.getItem('performance_alerts');
      if (data) {
        this.alerts = JSON.parse(data);
      }
    } catch (error) {
      console.warn('Failed to load performance alerts:', error);
    }
  }

  private saveAlerts(): void {
    try {
      const data = JSON.stringify(this.alerts);
      localStorage.setItem('performance_alerts', data);
    } catch (error) {
      console.warn('Failed to save performance alerts:', error);
    }
  }
}

// React hook for performance regression detection
export function usePerformanceRegression() {
  const detector = PerformanceRegressionDetector.getInstance();
  
  return {
    setBaseline: (baseline: PerformanceBaseline) => detector.setBaseline(baseline),
    recordSnapshot: (snapshot: PerformanceSnapshot) => detector.recordSnapshot(snapshot),
    getAlerts: (severity?: RegressionAlert['severity'], status?: RegressionAlert['status']) => 
      detector.getAlerts(severity, status),
    acknowledgeAlert: (alertId: string) => detector.acknowledgeAlert(alertId),
    resolveAlert: (alertId: string) => detector.resolveAlert(alertId),
    getPerformanceTrend: (metric: string, days?: number) => 
      detector.getPerformanceTrend(metric, days),
    getRegressionSummary: () => detector.getRegressionSummary()
  };
}

// Export singleton instance
export const performanceRegressionDetector = PerformanceRegressionDetector.getInstance();