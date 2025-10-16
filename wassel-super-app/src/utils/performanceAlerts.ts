// Performance alerts and monitoring system for production

export interface PerformanceAlert {
  id: string;
  type: 'threshold' | 'regression' | 'anomaly' | 'budget';
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'active' | 'acknowledged' | 'resolved' | 'suppressed';
  title: string;
  description: string;
  metric: string;
  currentValue: number;
  thresholdValue: number;
  timestamp: string;
  environment: string;
  url?: string;
  userId?: string;
  sessionId?: string;
  metadata: Record<string, any>;
  actions: AlertAction[];
}

export interface AlertAction {
  id: string;
  type: 'notification' | 'webhook' | 'email' | 'slack' | 'pagerduty';
  config: Record<string, any>;
  executed: boolean;
  executedAt?: string;
  result?: 'success' | 'failed' | 'timeout';
}

export interface AlertRule {
  id: string;
  name: string;
  description: string;
  metric: string;
  condition: 'greater_than' | 'less_than' | 'equals' | 'not_equals' | 'contains' | 'not_contains';
  threshold: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
  cooldown: number; // minutes
  actions: AlertAction[];
  filters: Record<string, any>;
}

export interface AlertChannel {
  id: string;
  name: string;
  type: 'email' | 'slack' | 'webhook' | 'pagerduty';
  config: Record<string, any>;
  enabled: boolean;
}

export class PerformanceAlertManager {
  private static instance: PerformanceAlertManager;
  private alerts: Map<string, PerformanceAlert> = new Map();
  private rules: Map<string, AlertRule> = new Map();
  private channels: Map<string, AlertChannel> = new Map();
  private lastAlertTimes: Map<string, number> = new Map();
  private alertHistory: PerformanceAlert[] = [];

  private constructor() {
    this.loadAlerts();
    this.loadRules();
    this.loadChannels();
    this.initializeDefaultRules();
  }

  public static getInstance(): PerformanceAlertManager {
    if (!PerformanceAlertManager.instance) {
      PerformanceAlertManager.instance = new PerformanceAlertManager();
    }
    return PerformanceAlertManager.instance;
  }

  // Alert Rules Management
  public createRule(rule: Omit<AlertRule, 'id'>): string {
    const id = `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newRule: AlertRule = { ...rule, id };
    
    this.rules.set(id, newRule);
    this.saveRules();
    
    return id;
  }

  public updateRule(ruleId: string, updates: Partial<AlertRule>): boolean {
    const rule = this.rules.get(ruleId);
    if (!rule) return false;
    
    Object.assign(rule, updates);
    this.saveRules();
    return true;
  }

  public deleteRule(ruleId: string): boolean {
    const deleted = this.rules.delete(ruleId);
    if (deleted) {
      this.saveRules();
    }
    return deleted;
  }

  public getRule(ruleId: string): AlertRule | null {
    return this.rules.get(ruleId) || null;
  }

  public getAllRules(): AlertRule[] {
    return Array.from(this.rules.values());
  }

  // Alert Channels Management
  public createChannel(channel: Omit<AlertChannel, 'id'>): string {
    const id = `channel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newChannel: AlertChannel = { ...channel, id };
    
    this.channels.set(id, newChannel);
    this.saveChannels();
    
    return id;
  }

  public updateChannel(channelId: string, updates: Partial<AlertChannel>): boolean {
    const channel = this.channels.get(channelId);
    if (!channel) return false;
    
    Object.assign(channel, updates);
    this.saveChannels();
    return true;
  }

  public deleteChannel(channelId: string): boolean {
    const deleted = this.channels.delete(channelId);
    if (deleted) {
      this.saveChannels();
    }
    return deleted;
  }

  public getChannel(channelId: string): AlertChannel | null {
    return this.channels.get(channelId) || null;
  }

  public getAllChannels(): AlertChannel[] {
    return Array.from(this.channels.values());
  }

  // Alert Processing
  public processMetric(metric: string, value: number, context: Record<string, any> = {}): void {
    const enabledRules = this.getAllRules().filter(rule => 
      rule.enabled && rule.metric === metric
    );

    for (const rule of enabledRules) {
      if (this.shouldTriggerAlert(rule, value, context)) {
        this.createAlert(rule, value, context);
      }
    }
  }

  private shouldTriggerAlert(rule: AlertRule, value: number, context: Record<string, any>): boolean {
    // Check cooldown
    const lastAlertTime = this.lastAlertTimes.get(rule.id) || 0;
    const cooldownMs = rule.cooldown * 60 * 1000;
    if (Date.now() - lastAlertTime < cooldownMs) {
      return false;
    }

    // Check condition
    let conditionMet = false;
    switch (rule.condition) {
      case 'greater_than':
        conditionMet = value > rule.threshold;
        break;
      case 'less_than':
        conditionMet = value < rule.threshold;
        break;
      case 'equals':
        conditionMet = value === rule.threshold;
        break;
      case 'not_equals':
        conditionMet = value !== rule.threshold;
        break;
      case 'contains':
        conditionMet = String(value).includes(String(rule.threshold));
        break;
      case 'not_contains':
        conditionMet = !String(value).includes(String(rule.threshold));
        break;
    }

    if (!conditionMet) return false;

    // Check filters
    for (const [key, expectedValue] of Object.entries(rule.filters)) {
      if (context[key] !== expectedValue) {
        return false;
      }
    }

    return true;
  }

  private createAlert(rule: AlertRule, value: number, context: Record<string, any>): void {
    const alertId = `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const alert: PerformanceAlert = {
      id: alertId,
      type: 'threshold',
      severity: rule.severity,
      status: 'active',
      title: `${rule.name} - ${rule.metric} Alert`,
      description: `${rule.metric} is ${rule.condition.replace('_', ' ')} ${rule.threshold}. Current value: ${value}`,
      metric: rule.metric,
      currentValue: value,
      thresholdValue: rule.threshold,
      timestamp: new Date().toISOString(),
      environment: context.environment || 'production',
      url: context.url,
      userId: context.userId,
      sessionId: context.sessionId,
      metadata: context,
      actions: rule.actions.map(action => ({ ...action, executed: false }))
    };

    this.alerts.set(alertId, alert);
    this.alertHistory.push(alert);
    this.lastAlertTimes.set(rule.id, Date.now());
    
    this.saveAlerts();
    this.executeAlertActions(alert);
  }

  private async executeAlertActions(alert: PerformanceAlert): Promise<void> {
    for (const action of alert.actions) {
      try {
        await this.executeAction(action, alert);
        action.executed = true;
        action.executedAt = new Date().toISOString();
        action.result = 'success';
      } catch (error) {
        console.error('Failed to execute alert action:', error);
        action.executed = true;
        action.executedAt = new Date().toISOString();
        action.result = 'failed';
      }
    }
    
    this.saveAlerts();
  }

  private async executeAction(action: AlertAction, alert: PerformanceAlert): Promise<void> {
    switch (action.type) {
      case 'notification':
        await this.sendNotification(action, alert);
        break;
      case 'webhook':
        await this.sendWebhook(action, alert);
        break;
      case 'email':
        await this.sendEmail(action, alert);
        break;
      case 'slack':
        await this.sendSlackMessage(action, alert);
        break;
      case 'pagerduty':
        await this.sendPagerDutyAlert(action, alert);
        break;
    }
  }

  private async sendNotification(action: AlertAction, alert: PerformanceAlert): Promise<void> {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(alert.title, {
        body: alert.description,
        icon: '/icons/icon-192x192.png',
        tag: alert.id
      });
    }
  }

  private async sendWebhook(action: AlertAction, alert: PerformanceAlert): Promise<void> {
    const response = await fetch(action.config.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...action.config.headers
      },
      body: JSON.stringify({
        alert,
        timestamp: new Date().toISOString()
      })
    });

    if (!response.ok) {
      throw new Error(`Webhook failed: ${response.status}`);
    }
  }

  private async sendEmail(action: AlertAction, alert: PerformanceAlert): Promise<void> {
    // In a real implementation, you'd use an email service
    console.log('Email alert:', {
      to: action.config.to,
      subject: alert.title,
      body: alert.description
    });
  }

  private async sendSlackMessage(action: AlertAction, alert: PerformanceAlert): Promise<void> {
    const response = await fetch(action.config.webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: `🚨 ${alert.title}`,
        attachments: [{
          color: this.getSeverityColor(alert.severity),
          fields: [
            { title: 'Metric', value: alert.metric, short: true },
            { title: 'Current Value', value: String(alert.currentValue), short: true },
            { title: 'Threshold', value: String(alert.thresholdValue), short: true },
            { title: 'Environment', value: alert.environment, short: true }
          ]
        }]
      })
    });

    if (!response.ok) {
      throw new Error(`Slack webhook failed: ${response.status}`);
    }
  }

  private async sendPagerDutyAlert(action: AlertAction, alert: PerformanceAlert): Promise<void> {
    const response = await fetch(action.config.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Token token=${action.config.apiKey}`
      },
      body: JSON.stringify({
        routing_key: action.config.routingKey,
        event_action: 'trigger',
        dedup_key: alert.id,
        payload: {
          summary: alert.title,
          source: alert.environment,
          severity: alert.severity,
          custom_details: {
            metric: alert.metric,
            currentValue: alert.currentValue,
            thresholdValue: alert.thresholdValue,
            description: alert.description
          }
        }
      })
    });

    if (!response.ok) {
      throw new Error(`PagerDuty API failed: ${response.status}`);
    }
  }

  private getSeverityColor(severity: string): string {
    switch (severity) {
      case 'critical': return 'danger';
      case 'high': return 'warning';
      case 'medium': return 'good';
      case 'low': return '#36a64f';
      default: return '#36a64f';
    }
  }

  // Alert Management
  public getAlert(alertId: string): PerformanceAlert | null {
    return this.alerts.get(alertId) || null;
  }

  public getAllAlerts(status?: PerformanceAlert['status']): PerformanceAlert[] {
    const alerts = Array.from(this.alerts.values());
    return status ? alerts.filter(alert => alert.status === status) : alerts;
  }

  public acknowledgeAlert(alertId: string): boolean {
    const alert = this.alerts.get(alertId);
    if (!alert) return false;
    
    alert.status = 'acknowledged';
    this.saveAlerts();
    return true;
  }

  public resolveAlert(alertId: string): boolean {
    const alert = this.alerts.get(alertId);
    if (!alert) return false;
    
    alert.status = 'resolved';
    this.saveAlerts();
    return true;
  }

  public suppressAlert(alertId: string, duration: number = 60): boolean {
    const alert = this.alerts.get(alertId);
    if (!alert) return false;
    
    alert.status = 'suppressed';
    this.saveAlerts();
    
    // Auto-unsuppress after duration
    setTimeout(() => {
      const currentAlert = this.alerts.get(alertId);
      if (currentAlert && currentAlert.status === 'suppressed') {
        currentAlert.status = 'active';
        this.saveAlerts();
      }
    }, duration * 60 * 1000);
    
    return true;
  }

  // Analytics and Reporting
  public getAlertStats(timeRange: number = 24): {
    total: number;
    bySeverity: Record<string, number>;
    byStatus: Record<string, number>;
    byMetric: Record<string, number>;
    avgResolutionTime: number;
  } {
    const cutoffTime = Date.now() - (timeRange * 60 * 60 * 1000);
    const recentAlerts = this.alertHistory.filter(
      alert => new Date(alert.timestamp).getTime() > cutoffTime
    );

    const stats = {
      total: recentAlerts.length,
      bySeverity: {} as Record<string, number>,
      byStatus: {} as Record<string, number>,
      byMetric: {} as Record<string, number>,
      avgResolutionTime: 0
    };

    for (const alert of recentAlerts) {
      stats.bySeverity[alert.severity] = (stats.bySeverity[alert.severity] || 0) + 1;
      stats.byStatus[alert.status] = (stats.byStatus[alert.status] || 0) + 1;
      stats.byMetric[alert.metric] = (stats.byMetric[alert.metric] || 0) + 1;
    }

    return stats;
  }

  // Default Rules
  private initializeDefaultRules(): void {
    if (this.rules.size > 0) return; // Already initialized

    const defaultRules: Omit<AlertRule, 'id'>[] = [
      {
        name: 'High CLS Alert',
        description: 'Alert when Cumulative Layout Shift exceeds threshold',
        metric: 'CLS',
        condition: 'greater_than',
        threshold: 0.25,
        severity: 'high',
        enabled: true,
        cooldown: 15,
        actions: [{
          id: 'notification',
          type: 'notification',
          config: {},
          executed: false
        }],
        filters: {}
      },
      {
        name: 'Slow LCP Alert',
        description: 'Alert when Largest Contentful Paint is too slow',
        metric: 'LCP',
        condition: 'greater_than',
        threshold: 4000,
        severity: 'high',
        enabled: true,
        cooldown: 10,
        actions: [{
          id: 'notification',
          type: 'notification',
          config: {},
          executed: false
        }],
        filters: {}
      },
      {
        name: 'High FID Alert',
        description: 'Alert when First Input Delay is too high',
        metric: 'FID',
        condition: 'greater_than',
        threshold: 300,
        severity: 'medium',
        enabled: true,
        cooldown: 20,
        actions: [{
          id: 'notification',
          type: 'notification',
          config: {},
          executed: false
        }],
        filters: {}
      },
      {
        name: 'Bundle Size Alert',
        description: 'Alert when bundle size exceeds budget',
        metric: 'bundleSize',
        condition: 'greater_than',
        threshold: 1000,
        severity: 'medium',
        enabled: true,
        cooldown: 30,
        actions: [{
          id: 'notification',
          type: 'notification',
          config: {},
          executed: false
        }],
        filters: {}
      }
    ];

    for (const rule of defaultRules) {
      this.createRule(rule);
    }
  }

  // Persistence
  private loadAlerts(): void {
    try {
      const data = localStorage.getItem('performance_alerts');
      if (data) {
        const alerts = JSON.parse(data);
        this.alerts = new Map(alerts);
      }
    } catch (error) {
      console.warn('Failed to load performance alerts:', error);
    }
  }

  private saveAlerts(): void {
    try {
      const data = JSON.stringify(Array.from(this.alerts.entries()));
      localStorage.setItem('performance_alerts', data);
    } catch (error) {
      console.warn('Failed to save performance alerts:', error);
    }
  }

  private loadRules(): void {
    try {
      const data = localStorage.getItem('alert_rules');
      if (data) {
        const rules = JSON.parse(data);
        this.rules = new Map(rules);
      }
    } catch (error) {
      console.warn('Failed to load alert rules:', error);
    }
  }

  private saveRules(): void {
    try {
      const data = JSON.stringify(Array.from(this.rules.entries()));
      localStorage.setItem('alert_rules', data);
    } catch (error) {
      console.warn('Failed to save alert rules:', error);
    }
  }

  private loadChannels(): void {
    try {
      const data = localStorage.getItem('alert_channels');
      if (data) {
        const channels = JSON.parse(data);
        this.channels = new Map(channels);
      }
    } catch (error) {
      console.warn('Failed to load alert channels:', error);
    }
  }

  private saveChannels(): void {
    try {
      const data = JSON.stringify(Array.from(this.channels.entries()));
      localStorage.setItem('alert_channels', data);
    } catch (error) {
      console.warn('Failed to save alert channels:', error);
    }
  }
}

// React hook for performance alerts
export function usePerformanceAlerts() {
  const manager = PerformanceAlertManager.getInstance();
  
  return {
    processMetric: (metric: string, value: number, context?: Record<string, any>) => 
      manager.processMetric(metric, value, context),
    getAlerts: (status?: PerformanceAlert['status']) => manager.getAllAlerts(status),
    acknowledgeAlert: (alertId: string) => manager.acknowledgeAlert(alertId),
    resolveAlert: (alertId: string) => manager.resolveAlert(alertId),
    suppressAlert: (alertId: string, duration?: number) => manager.suppressAlert(alertId, duration),
    getStats: (timeRange?: number) => manager.getAlertStats(timeRange),
    createRule: (rule: Omit<AlertRule, 'id'>) => manager.createRule(rule),
    createChannel: (channel: Omit<AlertChannel, 'id'>) => manager.createChannel(channel)
  };
}

// Export singleton instance
export const performanceAlertManager = PerformanceAlertManager.getInstance();