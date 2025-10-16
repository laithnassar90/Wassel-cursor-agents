// Advanced monitoring and analytics system

export interface AnalyticsEvent {
  id: string;
  name: string;
  category: string;
  properties: Record<string, any>;
  timestamp: string;
  userId?: string;
  sessionId: string;
  page: string;
  environment: string;
  userAgent: string;
  referrer?: string;
}

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: string;
  context: Record<string, any>;
}

export interface UserSession {
  id: string;
  userId?: string;
  startTime: string;
  endTime?: string;
  duration?: number;
  pageViews: number;
  events: number;
  performance: {
    avgLoadTime: number;
    avgCLS: number;
    avgLCP: number;
    avgFID: number;
  };
  device: {
    type: string;
    os: string;
    browser: string;
    screen: string;
  };
  location?: {
    country: string;
    region: string;
    city: string;
  };
}

export interface AnalyticsDashboard {
  overview: {
    totalUsers: number;
    activeUsers: number;
    sessions: number;
    pageViews: number;
    bounceRate: number;
    avgSessionDuration: number;
  };
  performance: {
    avgLoadTime: number;
    avgCLS: number;
    avgLCP: number;
    avgFID: number;
    p95LoadTime: number;
    p99LoadTime: number;
  };
  trends: {
    users: Array<{ date: string; count: number }>;
    sessions: Array<{ date: string; count: number }>;
    performance: Array<{ date: string; loadTime: number; cls: number }>;
  };
  topPages: Array<{ page: string; views: number; avgLoadTime: number }>;
  topEvents: Array<{ event: string; count: number; uniqueUsers: number }>;
  errors: Array<{ error: string; count: number; lastSeen: string }>;
}

export class AdvancedAnalytics {
  private static instance: AdvancedAnalytics;
  private events: AnalyticsEvent[] = [];
  private metrics: PerformanceMetric[] = [];
  private sessions: Map<string, UserSession> = new Map();
  private currentSession: UserSession | null = null;
  private config = {
    batchSize: 50,
    flushInterval: 30000, // 30 seconds
    maxEvents: 10000,
    maxMetrics: 5000
  };

  private constructor() {
    this.loadData();
    this.initializeSession();
    this.startFlushTimer();
    this.setupPerformanceObserver();
  }

  public static getInstance(): AdvancedAnalytics {
    if (!AdvancedAnalytics.instance) {
      AdvancedAnalytics.instance = new AdvancedAnalytics();
    }
    return AdvancedAnalytics.instance;
  }

  // Event Tracking
  public trackEvent(
    name: string, 
    category: string, 
    properties: Record<string, any> = {}
  ): void {
    const event: AnalyticsEvent = {
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      category,
      properties,
      timestamp: new Date().toISOString(),
      userId: this.getCurrentUserId(),
      sessionId: this.getCurrentSessionId(),
      page: window.location.pathname,
      environment: this.getEnvironment(),
      userAgent: navigator.userAgent,
      referrer: document.referrer
    };

    this.events.push(event);
    this.updateSessionEventCount();
    
    // Flush if batch size reached
    if (this.events.length >= this.config.batchSize) {
      this.flushEvents();
    }
  }

  public trackPageView(page: string, properties: Record<string, any> = {}): void {
    this.trackEvent('page_view', 'navigation', {
      page,
      ...properties
    });
    
    this.updateSessionPageViewCount();
  }

  public trackPerformance(metric: string, value: number, unit: string = 'ms', context: Record<string, any> = {}): void {
    const performanceMetric: PerformanceMetric = {
      name: metric,
      value,
      unit,
      timestamp: new Date().toISOString(),
      context: {
        page: window.location.pathname,
        sessionId: this.getCurrentSessionId(),
        userId: this.getCurrentUserId(),
        ...context
      }
    };

    this.metrics.push(performanceMetric);
    
    // Update session performance
    this.updateSessionPerformance(metric, value);
    
    // Flush if batch size reached
    if (this.metrics.length >= this.config.batchSize) {
      this.flushMetrics();
    }
  }

  // Performance Monitoring
  private setupPerformanceObserver(): void {
    // Monitor Core Web Vitals
    this.observeWebVitals();
    
    // Monitor resource loading
    this.observeResources();
    
    // Monitor user interactions
    this.observeUserInteractions();
    
    // Monitor errors
    this.observeErrors();
  }

  private observeWebVitals(): void {
    // LCP
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'largest-contentful-paint') {
          this.trackPerformance('LCP', entry.startTime, 'ms');
        }
      }
    }).observe({ entryTypes: ['largest-contentful-paint'] });

    // FID
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'first-input') {
          this.trackPerformance('FID', (entry as any).processingStart - entry.startTime, 'ms');
        }
      }
    }).observe({ entryTypes: ['first-input'] });

    // CLS
    let clsValue = 0;
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!(entry as any).hadRecentInput) {
          clsValue += (entry as any).value;
          this.trackPerformance('CLS', clsValue, 'score');
        }
      }
    }).observe({ entryTypes: ['layout-shift'] });
  }

  private observeResources(): void {
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'resource') {
          const resource = entry as PerformanceResourceTiming;
          this.trackPerformance('resource_load_time', resource.duration, 'ms', {
            resourceType: resource.initiatorType,
            resourceName: resource.name,
            transferSize: resource.transferSize,
            encodedBodySize: resource.encodedBodySize
          });
        }
      }
    }).observe({ entryTypes: ['resource'] });
  }

  private observeUserInteractions(): void {
    // Track clicks
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      this.trackEvent('click', 'interaction', {
        element: target.tagName,
        id: target.id,
        className: target.className,
        text: target.textContent?.substring(0, 100)
      });
    });

    // Track scrolls
    let scrollTimeout: NodeJS.Timeout;
    window.addEventListener('scroll', () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        this.trackEvent('scroll', 'interaction', {
          scrollY: window.scrollY,
          scrollX: window.scrollX,
          scrollPercentage: (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100
        });
      }, 100);
    });

    // Track form submissions
    document.addEventListener('submit', (event) => {
      const form = event.target as HTMLFormElement;
      this.trackEvent('form_submit', 'interaction', {
        formId: form.id,
        formAction: form.action,
        formMethod: form.method
      });
    });
  }

  private observeErrors(): void {
    window.addEventListener('error', (event) => {
      this.trackEvent('javascript_error', 'error', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error?.stack
      });
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.trackEvent('unhandled_promise_rejection', 'error', {
        reason: event.reason?.toString(),
        promise: event.promise
      });
    });
  }

  // Session Management
  private initializeSession(): void {
    const sessionId = this.getCurrentSessionId();
    const existingSession = this.sessions.get(sessionId);
    
    if (existingSession) {
      this.currentSession = existingSession;
    } else {
      this.currentSession = {
        id: sessionId,
        userId: this.getCurrentUserId(),
        startTime: new Date().toISOString(),
        pageViews: 0,
        events: 0,
        performance: {
          avgLoadTime: 0,
          avgCLS: 0,
          avgLCP: 0,
          avgFID: 0
        },
        device: this.getDeviceInfo()
      };
      
      this.sessions.set(sessionId, this.currentSession);
    }
  }

  private updateSessionEventCount(): void {
    if (this.currentSession) {
      this.currentSession.events++;
    }
  }

  private updateSessionPageViewCount(): void {
    if (this.currentSession) {
      this.currentSession.pageViews++;
    }
  }

  private updateSessionPerformance(metric: string, value: number): void {
    if (!this.currentSession) return;

    const perf = this.currentSession.performance;
    
    switch (metric) {
      case 'LCP':
        perf.avgLCP = (perf.avgLCP + value) / 2;
        break;
      case 'FID':
        perf.avgFID = (perf.avgFID + value) / 2;
        break;
      case 'CLS':
        perf.avgCLS = (perf.avgCLS + value) / 2;
        break;
      case 'load_time':
        perf.avgLoadTime = (perf.avgLoadTime + value) / 2;
        break;
    }
  }

  // Data Analysis
  public getDashboard(timeRange: number = 24): AnalyticsDashboard {
    const cutoffTime = Date.now() - (timeRange * 60 * 60 * 1000);
    const recentEvents = this.events.filter(
      event => new Date(event.timestamp).getTime() > cutoffTime
    );
    const recentMetrics = this.metrics.filter(
      metric => new Date(metric.timestamp).getTime() > cutoffTime
    );
    const recentSessions = Array.from(this.sessions.values()).filter(
      session => new Date(session.startTime).getTime() > cutoffTime
    );

    return {
      overview: this.calculateOverview(recentEvents, recentSessions),
      performance: this.calculatePerformance(recentMetrics),
      trends: this.calculateTrends(recentEvents, recentMetrics, timeRange),
      topPages: this.calculateTopPages(recentEvents),
      topEvents: this.calculateTopEvents(recentEvents),
      errors: this.calculateErrors(recentEvents)
    };
  }

  private calculateOverview(events: AnalyticsEvent[], sessions: UserSession[]): any {
    const uniqueUsers = new Set(events.map(e => e.userId).filter(Boolean)).size;
    const activeUsers = new Set(sessions.map(s => s.userId).filter(Boolean)).size;
    const pageViews = events.filter(e => e.name === 'page_view').length;
    const totalSessions = sessions.length;
    
    const avgSessionDuration = sessions.reduce((sum, s) => sum + (s.duration || 0), 0) / totalSessions;
    const bounceRate = sessions.filter(s => s.pageViews === 1).length / totalSessions;

    return {
      totalUsers: uniqueUsers,
      activeUsers,
      sessions: totalSessions,
      pageViews,
      bounceRate: Math.round(bounceRate * 100) / 100,
      avgSessionDuration: Math.round(avgSessionDuration)
    };
  }

  private calculatePerformance(metrics: PerformanceMetric[]): any {
    const lcpMetrics = metrics.filter(m => m.name === 'LCP');
    const fidMetrics = metrics.filter(m => m.name === 'FID');
    const clsMetrics = metrics.filter(m => m.name === 'CLS');
    const loadTimeMetrics = metrics.filter(m => m.name === 'load_time');

    const avgLCP = lcpMetrics.length > 0 ? 
      lcpMetrics.reduce((sum, m) => sum + m.value, 0) / lcpMetrics.length : 0;
    const avgFID = fidMetrics.length > 0 ? 
      fidMetrics.reduce((sum, m) => sum + m.value, 0) / fidMetrics.length : 0;
    const avgCLS = clsMetrics.length > 0 ? 
      clsMetrics.reduce((sum, m) => sum + m.value, 0) / clsMetrics.length : 0;
    const avgLoadTime = loadTimeMetrics.length > 0 ? 
      loadTimeMetrics.reduce((sum, m) => sum + m.value, 0) / loadTimeMetrics.length : 0;

    const sortedLoadTimes = loadTimeMetrics.map(m => m.value).sort((a, b) => a - b);
    const p95LoadTime = sortedLoadTimes[Math.floor(sortedLoadTimes.length * 0.95)] || 0;
    const p99LoadTime = sortedLoadTimes[Math.floor(sortedLoadTimes.length * 0.99)] || 0;

    return {
      avgLoadTime: Math.round(avgLoadTime),
      avgCLS: Math.round(avgCLS * 1000) / 1000,
      avgLCP: Math.round(avgLCP),
      avgFID: Math.round(avgFID),
      p95LoadTime: Math.round(p95LoadTime),
      p99LoadTime: Math.round(p99LoadTime)
    };
  }

  private calculateTrends(events: AnalyticsEvent[], metrics: PerformanceMetric[], timeRange: number): any {
    // Simplified trend calculation
    const days = Math.ceil(timeRange / 24);
    const trends = {
      users: [] as Array<{ date: string; count: number }>,
      sessions: [] as Array<{ date: string; count: number }>,
      performance: [] as Array<{ date: string; loadTime: number; cls: number }>
    };

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayEvents = events.filter(e => e.timestamp.startsWith(dateStr));
      const dayMetrics = metrics.filter(m => m.timestamp.startsWith(dateStr));
      
      trends.users.push({
        date: dateStr,
        count: new Set(dayEvents.map(e => e.userId).filter(Boolean)).size
      });
      
      trends.sessions.push({
        date: dateStr,
        count: dayEvents.filter(e => e.name === 'page_view').length
      });
      
      const loadTimeMetrics = dayMetrics.filter(m => m.name === 'load_time');
      const clsMetrics = dayMetrics.filter(m => m.name === 'CLS');
      
      trends.performance.push({
        date: dateStr,
        loadTime: loadTimeMetrics.length > 0 ? 
          loadTimeMetrics.reduce((sum, m) => sum + m.value, 0) / loadTimeMetrics.length : 0,
        cls: clsMetrics.length > 0 ? 
          clsMetrics.reduce((sum, m) => sum + m.value, 0) / clsMetrics.length : 0
      });
    }

    return trends;
  }

  private calculateTopPages(events: AnalyticsEvent[]): Array<{ page: string; views: number; avgLoadTime: number }> {
    const pageViews = events.filter(e => e.name === 'page_view');
    const pageCounts = new Map<string, number>();
    
    for (const event of pageViews) {
      const page = event.properties.page || event.page;
      pageCounts.set(page, (pageCounts.get(page) || 0) + 1);
    }
    
    return Array.from(pageCounts.entries())
      .map(([page, views]) => ({ page, views, avgLoadTime: 0 }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 10);
  }

  private calculateTopEvents(events: AnalyticsEvent[]): Array<{ event: string; count: number; uniqueUsers: number }> {
    const eventCounts = new Map<string, number>();
    const eventUsers = new Map<string, Set<string>>();
    
    for (const event of events) {
      const key = `${event.category}:${event.name}`;
      eventCounts.set(key, (eventCounts.get(key) || 0) + 1);
      
      if (!eventUsers.has(key)) {
        eventUsers.set(key, new Set());
      }
      if (event.userId) {
        eventUsers.get(key)!.add(event.userId);
      }
    }
    
    return Array.from(eventCounts.entries())
      .map(([event, count]) => ({
        event,
        count,
        uniqueUsers: eventUsers.get(event)?.size || 0
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  private calculateErrors(events: AnalyticsEvent[]): Array<{ error: string; count: number; lastSeen: string }> {
    const errorEvents = events.filter(e => e.category === 'error');
    const errorCounts = new Map<string, { count: number; lastSeen: string }>();
    
    for (const event of errorEvents) {
      const error = event.properties.message || event.name;
      const existing = errorCounts.get(error) || { count: 0, lastSeen: event.timestamp };
      errorCounts.set(error, {
        count: existing.count + 1,
        lastSeen: event.timestamp > existing.lastSeen ? event.timestamp : existing.lastSeen
      });
    }
    
    return Array.from(errorCounts.entries())
      .map(([error, data]) => ({ error, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  // Data Flushing
  private startFlushTimer(): void {
    setInterval(() => {
      this.flushEvents();
      this.flushMetrics();
    }, this.config.flushInterval);
  }

  private async flushEvents(): Promise<void> {
    if (this.events.length === 0) return;
    
    try {
      await this.sendToAnalytics('events', this.events);
      this.events = [];
      this.saveData();
    } catch (error) {
      console.warn('Failed to flush events:', error);
    }
  }

  private async flushMetrics(): Promise<void> {
    if (this.metrics.length === 0) return;
    
    try {
      await this.sendToAnalytics('metrics', this.metrics);
      this.metrics = [];
      this.saveData();
    } catch (error) {
      console.warn('Failed to flush metrics:', error);
    }
  }

  private async sendToAnalytics(type: string, data: any[]): Promise<void> {
    // In a real implementation, send to your analytics service
    console.log(`Sending ${data.length} ${type} to analytics service`);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // Utility Methods
  private getCurrentUserId(): string | undefined {
    return localStorage.getItem('userId') || undefined;
  }

  private getCurrentSessionId(): string {
    let sessionId = sessionStorage.getItem('sessionId');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('sessionId', sessionId);
    }
    return sessionId;
  }

  private getEnvironment(): string {
    return import.meta.env.MODE || 'development';
  }

  private getDeviceInfo(): any {
    const userAgent = navigator.userAgent;
    const screen = `${screen.width}x${screen.height}`;
    
    let deviceType = 'desktop';
    if (/Mobile|Android|iPhone|iPad/.test(userAgent)) {
      deviceType = 'mobile';
    } else if (/Tablet|iPad/.test(userAgent)) {
      deviceType = 'tablet';
    }
    
    let os = 'unknown';
    if (/Windows/.test(userAgent)) os = 'Windows';
    else if (/Mac/.test(userAgent)) os = 'macOS';
    else if (/Linux/.test(userAgent)) os = 'Linux';
    else if (/Android/.test(userAgent)) os = 'Android';
    else if (/iPhone|iPad/.test(userAgent)) os = 'iOS';
    
    let browser = 'unknown';
    if (/Chrome/.test(userAgent)) browser = 'Chrome';
    else if (/Firefox/.test(userAgent)) browser = 'Firefox';
    else if (/Safari/.test(userAgent)) browser = 'Safari';
    else if (/Edge/.test(userAgent)) browser = 'Edge';
    
    return { type: deviceType, os, browser, screen };
  }

  // Persistence
  private loadData(): void {
    try {
      const eventsData = localStorage.getItem('analytics_events');
      if (eventsData) {
        this.events = JSON.parse(eventsData);
      }
      
      const metricsData = localStorage.getItem('analytics_metrics');
      if (metricsData) {
        this.metrics = JSON.parse(metricsData);
      }
      
      const sessionsData = localStorage.getItem('analytics_sessions');
      if (sessionsData) {
        const sessions = JSON.parse(sessionsData);
        this.sessions = new Map(sessions);
      }
    } catch (error) {
      console.warn('Failed to load analytics data:', error);
    }
  }

  private saveData(): void {
    try {
      // Keep only recent data
      if (this.events.length > this.config.maxEvents) {
        this.events = this.events.slice(-this.config.maxEvents);
      }
      if (this.metrics.length > this.config.maxMetrics) {
        this.metrics = this.metrics.slice(-this.config.maxMetrics);
      }
      
      localStorage.setItem('analytics_events', JSON.stringify(this.events));
      localStorage.setItem('analytics_metrics', JSON.stringify(this.metrics));
      localStorage.setItem('analytics_sessions', JSON.stringify(Array.from(this.sessions.entries())));
    } catch (error) {
      console.warn('Failed to save analytics data:', error);
    }
  }
}

// React hook for analytics
export function useAnalytics() {
  const analytics = AdvancedAnalytics.getInstance();
  
  return {
    trackEvent: (name: string, category: string, properties?: Record<string, any>) => 
      analytics.trackEvent(name, category, properties),
    trackPageView: (page: string, properties?: Record<string, any>) => 
      analytics.trackPageView(page, properties),
    trackPerformance: (metric: string, value: number, unit?: string, context?: Record<string, any>) => 
      analytics.trackPerformance(metric, value, unit, context),
    getDashboard: (timeRange?: number) => analytics.getDashboard(timeRange)
  };
}

// Export singleton instance
export const advancedAnalytics = AdvancedAnalytics.getInstance();