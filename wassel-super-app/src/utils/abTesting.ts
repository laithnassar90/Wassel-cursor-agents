// A/B Testing framework for performance optimizations

export interface ABTest {
  id: string;
  name: string;
  description: string;
  variants: ABTestVariant[];
  trafficAllocation: number; // 0-1
  startDate: string;
  endDate?: string;
  status: 'draft' | 'running' | 'paused' | 'completed';
  metrics: string[];
  hypothesis: string;
  successCriteria: ABTestSuccessCriteria;
}

export interface ABTestVariant {
  id: string;
  name: string;
  description: string;
  config: Record<string, any>;
  trafficWeight: number; // 0-1
}

export interface ABTestSuccessCriteria {
  primaryMetric: string;
  minimumImprovement: number; // percentage
  statisticalSignificance: number; // 0-1
  minimumSampleSize: number;
}

export interface ABTestResult {
  testId: string;
  variantId: string;
  userId: string;
  sessionId: string;
  timestamp: string;
  metrics: Record<string, number>;
  events: ABTestEvent[];
}

export interface ABTestEvent {
  name: string;
  timestamp: string;
  properties: Record<string, any>;
}

export interface ABTestAnalysis {
  testId: string;
  variantResults: Map<string, {
    variant: ABTestVariant;
    sampleSize: number;
    metrics: Record<string, {
      mean: number;
      median: number;
      stdDev: number;
      confidenceInterval: [number, number];
    }>;
    conversionRate: number;
    statisticalSignificance: number;
  }>;
  winner?: string;
  confidence: number;
  recommendation: 'continue' | 'stop' | 'extend';
}

export class ABTestingFramework {
  private static instance: ABTestingFramework;
  private tests: Map<string, ABTest> = new Map();
  private results: ABTestResult[] = [];
  private userAssignments: Map<string, Map<string, string>> = new Map(); // userId -> testId -> variantId

  private constructor() {
    this.loadTests();
    this.loadResults();
    this.loadUserAssignments();
  }

  public static getInstance(): ABTestingFramework {
    if (!ABTestingFramework.instance) {
      ABTestingFramework.instance = new ABTestingFramework();
    }
    return ABTestingFramework.instance;
  }

  // Test Management
  public createTest(test: Omit<ABTest, 'id'>): string {
    const id = `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newTest: ABTest = { ...test, id };
    
    this.tests.set(id, newTest);
    this.saveTests();
    
    return id;
  }

  public getTest(testId: string): ABTest | null {
    return this.tests.get(testId) || null;
  }

  public updateTest(testId: string, updates: Partial<ABTest>): boolean {
    const test = this.tests.get(testId);
    if (!test) return false;
    
    Object.assign(test, updates);
    this.saveTests();
    return true;
  }

  public deleteTest(testId: string): boolean {
    const deleted = this.tests.delete(testId);
    if (deleted) {
      this.saveTests();
    }
    return deleted;
  }

  // Test Assignment
  public assignUserToTest(userId: string, testId: string): string | null {
    const test = this.tests.get(testId);
    if (!test || test.status !== 'running') {
      return null;
    }

    // Check if user is already assigned
    const userTests = this.userAssignments.get(userId) || new Map();
    if (userTests.has(testId)) {
      return userTests.get(testId)!;
    }

    // Assign user to variant based on traffic weight
    const variant = this.selectVariant(test);
    userTests.set(testId, variant.id);
    this.userAssignments.set(userId, userTests);
    this.saveUserAssignments();

    return variant.id;
  }

  public getUserVariant(userId: string, testId: string): string | null {
    const userTests = this.userAssignments.get(userId);
    return userTests?.get(testId) || null;
  }

  private selectVariant(test: ABTest): ABTestVariant {
    const random = Math.random();
    let cumulativeWeight = 0;
    
    for (const variant of test.variants) {
      cumulativeWeight += variant.trafficWeight;
      if (random <= cumulativeWeight) {
        return variant;
      }
    }
    
    // Fallback to first variant
    return test.variants[0];
  }

  // Results Recording
  public recordResult(result: Omit<ABTestResult, 'testId' | 'variantId' | 'userId' | 'sessionId' | 'timestamp'>): void {
    const userId = this.getCurrentUserId();
    const sessionId = this.getCurrentSessionId();
    const testId = result.metrics.testId as string;
    const variantId = result.metrics.variantId as string;
    
    if (!testId || !variantId) {
      console.warn('ABTest result missing testId or variantId');
      return;
    }

    const fullResult: ABTestResult = {
      ...result,
      testId,
      variantId,
      userId,
      sessionId,
      timestamp: new Date().toISOString()
    };

    this.results.push(fullResult);
    this.saveResults();
  }

  public recordEvent(testId: string, eventName: string, properties: Record<string, any> = {}): void {
    const userId = this.getCurrentUserId();
    const variantId = this.getUserVariant(userId, testId);
    
    if (!variantId) {
      console.warn(`User ${userId} not assigned to test ${testId}`);
      return;
    }

    const event: ABTestEvent = {
      name: eventName,
      timestamp: new Date().toISOString(),
      properties
    };

    // Find or create result for this test
    let result = this.results.find(r => 
      r.testId === testId && 
      r.variantId === variantId && 
      r.userId === userId
    );

    if (!result) {
      result = {
        testId,
        variantId,
        userId,
        sessionId: this.getCurrentSessionId(),
        timestamp: new Date().toISOString(),
        metrics: {},
        events: []
      };
      this.results.push(result);
    }

    result.events.push(event);
    this.saveResults();
  }

  // Analysis
  public analyzeTest(testId: string): ABTestAnalysis | null {
    const test = this.tests.get(testId);
    if (!test) return null;

    const testResults = this.results.filter(r => r.testId === testId);
    if (testResults.length === 0) return null;

    const variantResults = new Map();
    
    for (const variant of test.variants) {
      const variantData = testResults.filter(r => r.variantId === variant.id);
      
      if (variantData.length === 0) continue;

      const metrics = this.calculateVariantMetrics(variantData, test.metrics);
      const conversionRate = this.calculateConversionRate(variantData, test.successCriteria.primaryMetric);
      const statisticalSignificance = this.calculateStatisticalSignificance(testResults, variant.id);

      variantResults.set(variant.id, {
        variant,
        sampleSize: variantData.length,
        metrics,
        conversionRate,
        statisticalSignificance
      });
    }

    const winner = this.determineWinner(variantResults);
    const confidence = this.calculateOverallConfidence(variantResults);
    const recommendation = this.generateRecommendation(variantResults, test);

    return {
      testId,
      variantResults,
      winner,
      confidence,
      recommendation
    };
  }

  private calculateVariantMetrics(results: ABTestResult[], metrics: string[]): Record<string, any> {
    const variantMetrics: Record<string, any> = {};
    
    for (const metric of metrics) {
      const values = results
        .map(r => r.metrics[metric])
        .filter(v => v !== undefined && v !== null);
      
      if (values.length === 0) continue;

      const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
      const sorted = values.sort((a, b) => a - b);
      const median = sorted[Math.floor(sorted.length / 2)];
      const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
      const stdDev = Math.sqrt(variance);
      
      // 95% confidence interval
      const marginOfError = 1.96 * (stdDev / Math.sqrt(values.length));
      const confidenceInterval: [number, number] = [
        mean - marginOfError,
        mean + marginOfError
      ];

      variantMetrics[metric] = {
        mean,
        median,
        stdDev,
        confidenceInterval
      };
    }

    return variantMetrics;
  }

  private calculateConversionRate(results: ABTestResult[], primaryMetric: string): number {
    const totalUsers = results.length;
    const convertedUsers = results.filter(r => 
      r.metrics[primaryMetric] > 0 || 
      r.events.some(e => e.name === 'conversion')
    ).length;
    
    return totalUsers > 0 ? convertedUsers / totalUsers : 0;
  }

  private calculateStatisticalSignificance(allResults: ABTestResult[], variantId: string): number {
    // Simplified statistical significance calculation
    // In a real implementation, you'd use proper statistical tests
    const variantResults = allResults.filter(r => r.variantId === variantId);
    const otherResults = allResults.filter(r => r.variantId !== variantId);
    
    if (variantResults.length < 30 || otherResults.length < 30) {
      return 0; // Not enough data
    }
    
    // Placeholder calculation
    return Math.min(0.95, variantResults.length / 100);
  }

  private determineWinner(variantResults: Map<string, any>): string | undefined {
    let bestVariant: string | undefined;
    let bestScore = -1;
    
    for (const [variantId, data] of variantResults) {
      const score = data.conversionRate * data.statisticalSignificance;
      if (score > bestScore) {
        bestScore = score;
        bestVariant = variantId;
      }
    }
    
    return bestVariant;
  }

  private calculateOverallConfidence(variantResults: Map<string, any>): number {
    const significances = Array.from(variantResults.values())
      .map(data => data.statisticalSignificance);
    
    return significances.length > 0 ? 
      significances.reduce((sum, sig) => sum + sig, 0) / significances.length : 0;
  }

  private generateRecommendation(
    variantResults: Map<string, any>, 
    test: ABTest
  ): 'continue' | 'stop' | 'extend' {
    const totalSampleSize = Array.from(variantResults.values())
      .reduce((sum, data) => sum + data.sampleSize, 0);
    
    if (totalSampleSize < test.successCriteria.minimumSampleSize) {
      return 'continue';
    }
    
    const maxSignificance = Math.max(
      ...Array.from(variantResults.values())
        .map(data => data.statisticalSignificance)
    );
    
    if (maxSignificance >= test.successCriteria.statisticalSignificance) {
      return 'stop';
    }
    
    return 'extend';
  }

  // Utility methods
  private getCurrentUserId(): string {
    // In a real implementation, get from auth context
    return localStorage.getItem('userId') || 'anonymous';
  }

  private getCurrentSessionId(): string {
    let sessionId = sessionStorage.getItem('sessionId');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('sessionId', sessionId);
    }
    return sessionId;
  }

  // Persistence
  private loadTests(): void {
    try {
      const data = localStorage.getItem('ab_tests');
      if (data) {
        const tests = JSON.parse(data);
        this.tests = new Map(tests);
      }
    } catch (error) {
      console.warn('Failed to load AB tests:', error);
    }
  }

  private saveTests(): void {
    try {
      const data = JSON.stringify(Array.from(this.tests.entries()));
      localStorage.setItem('ab_tests', data);
    } catch (error) {
      console.warn('Failed to save AB tests:', error);
    }
  }

  private loadResults(): void {
    try {
      const data = localStorage.getItem('ab_test_results');
      if (data) {
        this.results = JSON.parse(data);
      }
    } catch (error) {
      console.warn('Failed to load AB test results:', error);
    }
  }

  private saveResults(): void {
    try {
      // Keep only last 10000 results
      if (this.results.length > 10000) {
        this.results = this.results.slice(-10000);
      }
      
      const data = JSON.stringify(this.results);
      localStorage.setItem('ab_test_results', data);
    } catch (error) {
      console.warn('Failed to save AB test results:', error);
    }
  }

  private loadUserAssignments(): void {
    try {
      const data = localStorage.getItem('ab_user_assignments');
      if (data) {
        const assignments = JSON.parse(data);
        this.userAssignments = new Map(
          assignments.map(([userId, tests]: [string, any]) => [
            userId, 
            new Map(tests)
          ])
        );
      }
    } catch (error) {
      console.warn('Failed to load user assignments:', error);
    }
  }

  private saveUserAssignments(): void {
    try {
      const data = JSON.stringify(
        Array.from(this.userAssignments.entries())
          .map(([userId, tests]) => [userId, Array.from(tests.entries())])
      );
      localStorage.setItem('ab_user_assignments', data);
    } catch (error) {
      console.warn('Failed to save user assignments:', error);
    }
  }
}

// React hook for A/B testing
export function useABTest(testId: string) {
  const framework = ABTestingFramework.getInstance();
  
  const test = framework.getTest(testId);
  const userId = framework['getCurrentUserId']();
  const variantId = framework.getUserVariant(userId, testId);
  
  const assignUser = () => framework.assignUserToTest(userId, testId);
  const recordEvent = (eventName: string, properties?: Record<string, any>) => 
    framework.recordEvent(testId, eventName, properties);
  const recordResult = (metrics: Record<string, number>) => 
    framework.recordResult({ metrics: { ...metrics, testId, variantId } });
  
  return {
    test,
    variantId,
    assignUser,
    recordEvent,
    recordResult,
    isAssigned: !!variantId
  };
}

// Export singleton instance
export const abTestingFramework = ABTestingFramework.getInstance();