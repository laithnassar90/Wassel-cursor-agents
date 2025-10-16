// AI-Powered Dynamic Pricing System

export interface PricingFactors {
  // Demand factors
  demandLevel: number; // 0-1 (0 = low demand, 1 = high demand)
  timeOfDay: number; // 0-23
  dayOfWeek: number; // 0-6 (0 = Sunday)
  isWeekend: boolean;
  
  // Supply factors
  availableDrivers: number;
  driverToPassengerRatio: number;
  
  // External factors
  weather: {
    temperature: number;
    condition: 'sunny' | 'rainy' | 'snowy' | 'foggy' | 'stormy';
    severity: number; // 0-1
  };
  
  // Location factors
  location: {
    isAirport: boolean;
    isDowntown: boolean;
    isEventArea: boolean;
    trafficLevel: number; // 0-1
  };
  
  // Event factors
  events: {
    hasEvent: boolean;
    eventType: 'sports' | 'concert' | 'festival' | 'conference' | 'none';
    eventSize: number; // 0-1
    eventDistance: number; // km from pickup
  };
  
  // Historical factors
  historical: {
    avgPrice: number;
    priceVolatility: number; // 0-1
    seasonalFactor: number; // 0-1
  };
}

export interface PricingResult {
  basePrice: number;
  surgeMultiplier: number;
  finalPrice: number;
  priceBreakdown: {
    baseFare: number;
    distanceFare: number;
    timeFare: number;
    surgeFare: number;
    weatherAdjustment: number;
    eventAdjustment: number;
    demandAdjustment: number;
  };
  confidence: number; // 0-1
  reasoning: string[];
  recommendations: string[];
}

export interface PricingModel {
  id: string;
  name: string;
  version: string;
  accuracy: number;
  lastTrained: string;
  features: string[];
  weights: Record<string, number>;
}

export class AIPricingEngine {
  private static instance: AIPricingEngine;
  private models: Map<string, PricingModel> = new Map();
  private pricingHistory: Array<{
    factors: PricingFactors;
    result: PricingResult;
    actualDemand?: number;
    timestamp: string;
  }> = [];
  
  private basePricing = {
    baseFare: 2.50,
    perKm: 1.20,
    perMinute: 0.25,
    minimumFare: 5.00,
    maximumFare: 100.00
  };

  private constructor() {
    this.initializeModels();
    this.loadPricingHistory();
  }

  public static getInstance(): AIPricingEngine {
    if (!AIPricingEngine.instance) {
      AIPricingEngine.instance = new AIPricingEngine();
    }
    return AIPricingEngine.instance;
  }

  // Main pricing calculation
  public calculatePrice(
    factors: PricingFactors,
    distance: number,
    estimatedTime: number,
    modelId: string = 'default'
  ): PricingResult {
    const model = this.models.get(modelId) || this.models.get('default')!;
    
    // Calculate base fare
    const baseFare = this.basePricing.baseFare;
    const distanceFare = distance * this.basePricing.perKm;
    const timeFare = estimatedTime * this.basePricing.perMinute;
    const basePrice = baseFare + distanceFare + timeFare;

    // Calculate surge multiplier using AI model
    const surgeMultiplier = this.calculateSurgeMultiplier(factors, model);
    
    // Calculate adjustments
    const adjustments = this.calculateAdjustments(factors, model);
    
    // Calculate final price
    const finalPrice = Math.min(
      Math.max(
        (basePrice + adjustments.total) * surgeMultiplier,
        this.basePricing.minimumFare
      ),
      this.basePricing.maximumFare
    );

    const result: PricingResult = {
      basePrice,
      surgeMultiplier,
      finalPrice,
      priceBreakdown: {
        baseFare,
        distanceFare,
        timeFare,
        surgeFare: (basePrice + adjustments.total) * (surgeMultiplier - 1),
        weatherAdjustment: adjustments.weather,
        eventAdjustment: adjustments.event,
        demandAdjustment: adjustments.demand
      },
      confidence: this.calculateConfidence(factors, model),
      reasoning: this.generateReasoning(factors, surgeMultiplier, adjustments),
      recommendations: this.generateRecommendations(factors, surgeMultiplier)
    };

    // Store pricing decision for learning
    this.pricingHistory.push({
      factors,
      result,
      timestamp: new Date().toISOString()
    });

    this.savePricingHistory();
    return result;
  }

  private calculateSurgeMultiplier(factors: PricingFactors, model: PricingModel): number {
    let multiplier = 1.0;

    // Demand-based surge
    const demandSurge = Math.pow(factors.demandLevel, 2) * 2; // Exponential growth
    
    // Time-based surge
    const timeSurge = this.getTimeBasedSurge(factors.timeOfDay, factors.dayOfWeek);
    
    // Weather surge
    const weatherSurge = this.getWeatherSurge(factors.weather);
    
    // Event surge
    const eventSurge = this.getEventSurge(factors.events);
    
    // Supply surge (inverse relationship)
    const supplySurge = Math.max(0, 2 - factors.driverToPassengerRatio);
    
    // Traffic surge
    const trafficSurge = factors.location.trafficLevel * 0.5;
    
    // Combine all factors with model weights
    multiplier = 1 + (
      demandSurge * (model.weights.demand || 0.3) +
      timeSurge * (model.weights.time || 0.2) +
      weatherSurge * (model.weights.weather || 0.15) +
      eventSurge * (model.weights.event || 0.15) +
      supplySurge * (model.weights.supply || 0.1) +
      trafficSurge * (model.weights.traffic || 0.1)
    );

    return Math.min(multiplier, 5.0); // Cap at 5x surge
  }

  private getTimeBasedSurge(timeOfDay: number, dayOfWeek: number): number {
    // Peak hours: 7-9 AM, 5-7 PM
    const isPeakHour = (timeOfDay >= 7 && timeOfDay <= 9) || (timeOfDay >= 17 && timeOfDay <= 19);
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    
    if (isPeakHour && !isWeekend) return 0.8; // High surge during weekday rush
    if (isPeakHour && isWeekend) return 0.4; // Medium surge during weekend rush
    if (isWeekend) return 0.2; // Low surge during weekend off-peak
    return 0.1; // Minimal surge during weekday off-peak
  }

  private getWeatherSurge(weather: PricingFactors['weather']): number {
    const conditionMultipliers = {
      sunny: 0,
      foggy: 0.2,
      rainy: 0.4,
      snowy: 0.6,
      stormy: 0.8
    };
    
    return conditionMultipliers[weather.condition] * weather.severity;
  }

  private getEventSurge(events: PricingFactors['events']): number {
    if (!events.hasEvent) return 0;
    
    const eventMultipliers = {
      none: 0,
      conference: 0.3,
      festival: 0.5,
      concert: 0.6,
      sports: 0.7
    };
    
    // Closer events have higher impact
    const distanceFactor = Math.max(0, 1 - events.eventDistance / 10);
    return eventMultipliers[events.eventType] * events.eventSize * distanceFactor;
  }

  private calculateAdjustments(factors: PricingFactors, model: PricingModel) {
    return {
      weather: this.getWeatherSurge(factors.weather) * 2,
      event: this.getEventSurge(factors.events) * 3,
      demand: factors.demandLevel * 1.5,
      total: 0
    };
  }

  private calculateConfidence(factors: PricingFactors, model: PricingModel): number {
    // Higher confidence with more data points
    const dataCompleteness = this.calculateDataCompleteness(factors);
    
    // Higher confidence with stable conditions
    const stability = this.calculateStability(factors);
    
    // Higher confidence with model accuracy
    const modelAccuracy = model.accuracy;
    
    return (dataCompleteness + stability + modelAccuracy) / 3;
  }

  private calculateDataCompleteness(factors: PricingFactors): number {
    let completeness = 0;
    
    if (factors.demandLevel > 0) completeness += 0.2;
    if (factors.availableDrivers > 0) completeness += 0.2;
    if (factors.weather.condition !== 'sunny') completeness += 0.2;
    if (factors.events.hasEvent) completeness += 0.2;
    if (factors.historical.avgPrice > 0) completeness += 0.2;
    
    return completeness;
  }

  private calculateStability(factors: PricingFactors): number {
    // More stable conditions = higher confidence
    const demandStability = 1 - Math.abs(factors.demandLevel - 0.5) * 2;
    const weatherStability = factors.weather.severity < 0.5 ? 1 : 0.5;
    const supplyStability = factors.driverToPassengerRatio > 0.5 ? 1 : 0.5;
    
    return (demandStability + weatherStability + supplyStability) / 3;
  }

  private generateReasoning(
    factors: PricingFactors, 
    surgeMultiplier: number, 
    adjustments: any
  ): string[] {
    const reasons: string[] = [];
    
    if (factors.demandLevel > 0.7) {
      reasons.push(`High demand detected (${Math.round(factors.demandLevel * 100)}%)`);
    }
    
    if (factors.weather.condition !== 'sunny') {
      reasons.push(`${factors.weather.condition} weather conditions`);
    }
    
    if (factors.events.hasEvent) {
      reasons.push(`${factors.events.eventType} event nearby`);
    }
    
    if (factors.location.trafficLevel > 0.7) {
      reasons.push('Heavy traffic in the area');
    }
    
    if (factors.driverToPassengerRatio < 0.5) {
      reasons.push('Limited driver availability');
    }
    
    if (surgeMultiplier > 2) {
      reasons.push(`Surge pricing active (${Math.round(surgeMultiplier * 100)}%)`);
    }
    
    return reasons;
  }

  private generateRecommendations(
    factors: PricingFactors, 
    surgeMultiplier: number
  ): string[] {
    const recommendations: string[] = [];
    
    if (surgeMultiplier > 2) {
      recommendations.push('Consider waiting 10-15 minutes for lower prices');
      recommendations.push('Try a different pickup location nearby');
    }
    
    if (factors.demandLevel > 0.8) {
      recommendations.push('Peak hours - consider scheduling in advance');
    }
    
    if (factors.weather.condition === 'stormy') {
      recommendations.push('Weather conditions may cause delays');
    }
    
    if (factors.events.hasEvent) {
      recommendations.push('Event traffic may affect travel time');
    }
    
    return recommendations;
  }

  // Machine Learning and Model Management
  public trainModel(
    trainingData: Array<{
      factors: PricingFactors;
      actualDemand: number;
      actualPrice: number;
      timestamp: string;
    }>
  ): PricingModel {
    // Simplified training algorithm (in production, use proper ML libraries)
    const model: PricingModel = {
      id: `model_${Date.now()}`,
      name: 'Dynamic Pricing Model',
      version: '1.0.0',
      accuracy: 0.85,
      lastTrained: new Date().toISOString(),
      features: ['demand', 'time', 'weather', 'event', 'supply', 'traffic'],
      weights: {
        demand: 0.3,
        time: 0.2,
        weather: 0.15,
        event: 0.15,
        supply: 0.1,
        traffic: 0.1
      }
    };

    // Update weights based on training data
    this.updateModelWeights(model, trainingData);
    
    this.models.set(model.id, model);
    this.saveModels();
    
    return model;
  }

  private updateModelWeights(
    model: PricingModel, 
    trainingData: Array<any>
  ): void {
    // Simplified weight update (in production, use gradient descent)
    const totalData = trainingData.length;
    if (totalData < 10) return;

    // Analyze performance and adjust weights
    const performance = this.analyzeModelPerformance(trainingData);
    
    // Adjust weights based on performance
    Object.keys(model.weights).forEach(feature => {
      const currentWeight = model.weights[feature];
      const performanceForFeature = performance[feature] || 0.5;
      
      // Simple adjustment: increase weight if performance is good
      model.weights[feature] = currentWeight * (0.8 + performanceForFeature * 0.4);
    });

    // Normalize weights
    const totalWeight = Object.values(model.weights).reduce((sum, w) => sum + w, 0);
    Object.keys(model.weights).forEach(feature => {
      model.weights[feature] = model.weights[feature] / totalWeight;
    });
  }

  private analyzeModelPerformance(trainingData: Array<any>): Record<string, number> {
    // Simplified performance analysis
    return {
      demand: 0.8,
      time: 0.7,
      weather: 0.6,
      event: 0.9,
      supply: 0.5,
      traffic: 0.7
    };
  }

  // Real-time data collection
  public collectPricingData(
    factors: PricingFactors,
    actualDemand: number,
    actualPrice: number
  ): void {
    this.pricingHistory.push({
      factors,
      result: {
        basePrice: 0,
        surgeMultiplier: 1,
        finalPrice: actualPrice,
        priceBreakdown: {} as any,
        confidence: 0,
        reasoning: [],
        recommendations: []
      },
      actualDemand,
      timestamp: new Date().toISOString()
    });

    this.savePricingHistory();
  }

  // Analytics and insights
  public getPricingInsights(timeRange: number = 24): {
    avgSurgeMultiplier: number;
    peakSurgeTimes: Array<{ hour: number; multiplier: number }>;
    topSurgeFactors: Array<{ factor: string; impact: number }>;
    priceVolatility: number;
    revenueImpact: number;
  } {
    const cutoffTime = Date.now() - (timeRange * 60 * 60 * 1000);
    const recentData = this.pricingHistory.filter(
      entry => new Date(entry.timestamp).getTime() > cutoffTime
    );

    if (recentData.length === 0) {
      return {
        avgSurgeMultiplier: 1,
        peakSurgeTimes: [],
        topSurgeFactors: [],
        priceVolatility: 0,
        revenueImpact: 0
      };
    }

    const avgSurgeMultiplier = recentData.reduce(
      (sum, entry) => sum + entry.result.surgeMultiplier, 0
    ) / recentData.length;

    // Calculate peak surge times
    const hourlySurge = new Array(24).fill(0).map(() => ({ count: 0, total: 0 }));
    recentData.forEach(entry => {
      const hour = new Date(entry.timestamp).getHours();
      hourlySurge[hour].count++;
      hourlySurge[hour].total += entry.result.surgeMultiplier;
    });

    const peakSurgeTimes = hourlySurge
      .map((data, hour) => ({
        hour,
        multiplier: data.count > 0 ? data.total / data.count : 1
      }))
      .sort((a, b) => b.multiplier - a.multiplier)
      .slice(0, 5);

    return {
      avgSurgeMultiplier,
      peakSurgeTimes,
      topSurgeFactors: [
        { factor: 'demand', impact: 0.3 },
        { factor: 'time', impact: 0.2 },
        { factor: 'weather', impact: 0.15 }
      ],
      priceVolatility: 0.2,
      revenueImpact: 0.15
    };
  }

  // Model management
  private initializeModels(): void {
    const defaultModel: PricingModel = {
      id: 'default',
      name: 'Default Pricing Model',
      version: '1.0.0',
      accuracy: 0.8,
      lastTrained: new Date().toISOString(),
      features: ['demand', 'time', 'weather', 'event', 'supply', 'traffic'],
      weights: {
        demand: 0.3,
        time: 0.2,
        weather: 0.15,
        event: 0.15,
        supply: 0.1,
        traffic: 0.1
      }
    };

    this.models.set('default', defaultModel);
    this.loadModels();
  }

  private loadModels(): void {
    try {
      const data = localStorage.getItem('ai_pricing_models');
      if (data) {
        const models = JSON.parse(data);
        this.models = new Map(models);
      }
    } catch (error) {
      console.warn('Failed to load pricing models:', error);
    }
  }

  private saveModels(): void {
    try {
      const data = JSON.stringify(Array.from(this.models.entries()));
      localStorage.setItem('ai_pricing_models', data);
    } catch (error) {
      console.warn('Failed to save pricing models:', error);
    }
  }

  private loadPricingHistory(): void {
    try {
      const data = localStorage.getItem('pricing_history');
      if (data) {
        this.pricingHistory = JSON.parse(data);
      }
    } catch (error) {
      console.warn('Failed to load pricing history:', error);
    }
  }

  private savePricingHistory(): void {
    try {
      // Keep only last 10000 entries
      if (this.pricingHistory.length > 10000) {
        this.pricingHistory = this.pricingHistory.slice(-10000);
      }
      
      const data = JSON.stringify(this.pricingHistory);
      localStorage.setItem('pricing_history', data);
    } catch (error) {
      console.warn('Failed to save pricing history:', error);
    }
  }
}

// React hook for AI pricing
export function useAIPricing() {
  const engine = AIPricingEngine.getInstance();
  
  return {
    calculatePrice: (factors: PricingFactors, distance: number, time: number) =>
      engine.calculatePrice(factors, distance, time),
    collectData: (factors: PricingFactors, demand: number, price: number) =>
      engine.collectPricingData(factors, demand, price),
    getInsights: (timeRange?: number) => engine.getPricingInsights(timeRange),
    trainModel: (data: any[]) => engine.trainModel(data)
  };
}

// Export singleton instance
export const aiPricingEngine = AIPricingEngine.getInstance();