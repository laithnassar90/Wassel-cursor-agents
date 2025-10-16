// Loyalty Program and Rewards System

export interface LoyaltyTier {
  id: string;
  name: string;
  level: number;
  minPoints: number;
  maxPoints?: number;
  benefits: string[];
  color: string;
  icon: string;
  multiplier: number; // Points multiplier for this tier
}

export interface LoyaltyPoints {
  userId: string;
  totalPoints: number;
  availablePoints: number;
  lifetimePoints: number;
  currentTier: string;
  nextTier?: string;
  pointsToNextTier?: number;
  lastUpdated: string;
}

export interface Reward {
  id: string;
  name: string;
  description: string;
  type: 'discount' | 'free_ride' | 'cashback' | 'upgrade' | 'bonus_points';
  value: number; // Discount percentage, cash amount, or points
  pointsCost: number;
  isActive: boolean;
  expiryDate?: string;
  usageLimit?: number;
  category: 'ride' | 'food' | 'shopping' | 'general';
  imageUrl?: string;
  terms: string[];
}

export interface UserReward {
  id: string;
  userId: string;
  rewardId: string;
  reward: Reward;
  status: 'available' | 'redeemed' | 'expired' | 'used';
  earnedAt: string;
  redeemedAt?: string;
  usedAt?: string;
  expiryDate?: string;
  transactionId?: string;
}

export interface PointsTransaction {
  id: string;
  userId: string;
  type: 'earned' | 'redeemed' | 'expired' | 'bonus' | 'adjustment';
  points: number;
  description: string;
  source: 'ride' | 'referral' | 'bonus' | 'redemption' | 'admin';
  reference: string; // Trip ID, referral code, etc.
  multiplier: number;
  createdAt: string;
  expiresAt?: string;
}

export interface ReferralProgram {
  referrerId: string;
  referredId: string;
  status: 'pending' | 'completed' | 'cancelled';
  referrerReward: number;
  referredReward: number;
  createdAt: string;
  completedAt?: string;
  tripId?: string;
}

export interface LoyaltySettings {
  pointsPerDollar: number;
  pointsPerRide: number;
  referralBonus: number;
  birthdayMultiplier: number;
  streakMultiplier: number;
  tierUpgradeBonus: number;
  pointsExpiryDays: number;
  maxStreakDays: number;
}

export class LoyaltyProgramService {
  private static instance: LoyaltyProgramService;
  private tiers: LoyaltyTier[] = [];
  private rewards: Map<string, Reward> = new Map();
  private userPoints: Map<string, LoyaltyPoints> = new Map();
  private userRewards: Map<string, UserReward[]> = new Map();
  private pointsTransactions: PointsTransaction[] = [];
  private referrals: ReferralProgram[] = [];
  private settings: LoyaltySettings;

  private constructor() {
    this.initializeTiers();
    this.initializeRewards();
    this.initializeSettings();
    this.loadData();
  }

  public static getInstance(): LoyaltyProgramService {
    if (!LoyaltyProgramService.instance) {
      LoyaltyProgramService.instance = new LoyaltyProgramService();
    }
    return LoyaltyProgramService.instance;
  }

  // Tier Management
  private initializeTiers(): void {
    this.tiers = [
      {
        id: 'bronze',
        name: 'Bronze',
        level: 1,
        minPoints: 0,
        maxPoints: 999,
        benefits: ['Basic support', 'Standard pricing'],
        color: '#CD7F32',
        icon: '🥉',
        multiplier: 1.0
      },
      {
        id: 'silver',
        name: 'Silver',
        level: 2,
        minPoints: 1000,
        maxPoints: 4999,
        benefits: ['Priority support', '5% discount on rides', 'Free cancellations'],
        color: '#C0C0C0',
        icon: '🥈',
        multiplier: 1.2
      },
      {
        id: 'gold',
        name: 'Gold',
        level: 3,
        minPoints: 5000,
        maxPoints: 14999,
        benefits: ['VIP support', '10% discount on rides', 'Free upgrades', 'Priority matching'],
        color: '#FFD700',
        icon: '🥇',
        multiplier: 1.5
      },
      {
        id: 'platinum',
        name: 'Platinum',
        level: 4,
        minPoints: 15000,
        benefits: ['Concierge service', '15% discount on rides', 'Free premium features', 'Exclusive events'],
        color: '#E5E4E2',
        icon: '💎',
        multiplier: 2.0
      }
    ];
  }

  // Rewards Management
  private initializeRewards(): void {
    const defaultRewards: Reward[] = [
      {
        id: 'free_ride_5',
        name: 'Free $5 Ride',
        description: 'Get a free ride up to $5',
        type: 'free_ride',
        value: 5,
        pointsCost: 500,
        isActive: true,
        category: 'ride',
        terms: ['Valid for 30 days', 'Cannot be combined with other offers']
      },
      {
        id: 'discount_10',
        name: '10% Off Next Ride',
        description: 'Save 10% on your next ride',
        type: 'discount',
        value: 10,
        pointsCost: 300,
        isActive: true,
        category: 'ride',
        terms: ['Valid for 7 days', 'Maximum discount $10']
      },
      {
        id: 'cashback_5',
        name: '$5 Cashback',
        description: 'Get $5 added to your wallet',
        type: 'cashback',
        value: 5,
        pointsCost: 1000,
        isActive: true,
        category: 'general',
        terms: ['Cashback credited within 24 hours']
      },
      {
        id: 'bonus_points_100',
        name: '100 Bonus Points',
        description: 'Earn 100 extra points on your next ride',
        type: 'bonus_points',
        value: 100,
        pointsCost: 200,
        isActive: true,
        category: 'ride',
        terms: ['Points credited after next completed ride']
      },
      {
        id: 'free_ride_10',
        name: 'Free $10 Ride',
        description: 'Get a free ride up to $10',
        type: 'free_ride',
        value: 10,
        pointsCost: 1000,
        isActive: true,
        category: 'ride',
        terms: ['Valid for 30 days', 'Cannot be combined with other offers']
      }
    ];

    defaultRewards.forEach(reward => {
      this.rewards.set(reward.id, reward);
    });
  }

  private initializeSettings(): void {
    this.settings = {
      pointsPerDollar: 1,
      pointsPerRide: 10,
      referralBonus: 500,
      birthdayMultiplier: 2.0,
      streakMultiplier: 1.5,
      tierUpgradeBonus: 1000,
      pointsExpiryDays: 365,
      maxStreakDays: 30
    };
  }

  // Points Management
  public earnPoints(
    userId: string,
    amount: number,
    source: PointsTransaction['source'],
    description: string,
    reference: string,
    multiplier: number = 1
  ): PointsTransaction {
    const userPoints = this.getUserPoints(userId);
    const tier = this.getUserTier(userId);
    const finalMultiplier = multiplier * tier.multiplier;
    const finalPoints = Math.round(amount * finalMultiplier);

    const transaction: PointsTransaction = {
      id: `pts_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      type: 'earned',
      points: finalPoints,
      description,
      source,
      reference,
      multiplier: finalMultiplier,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + this.settings.pointsExpiryDays * 24 * 60 * 60 * 1000).toISOString()
    };

    // Update user points
    userPoints.totalPoints += finalPoints;
    userPoints.availablePoints += finalPoints;
    userPoints.lifetimePoints += finalPoints;
    userPoints.lastUpdated = new Date().toISOString();

    // Check for tier upgrade
    const newTier = this.calculateTier(userPoints.totalPoints);
    if (newTier.id !== userPoints.currentTier) {
      this.upgradeTier(userId, newTier);
    }

    this.pointsTransactions.push(transaction);
    this.saveData();

    return transaction;
  }

  public redeemPoints(userId: string, rewardId: string): UserReward {
    const reward = this.rewards.get(rewardId);
    if (!reward) {
      throw new Error('Reward not found');
    }

    if (!reward.isActive) {
      throw new Error('Reward is not active');
    }

    const userPoints = this.getUserPoints(userId);
    if (userPoints.availablePoints < reward.pointsCost) {
      throw new Error('Insufficient points');
    }

    // Create user reward
    const userReward: UserReward = {
      id: `ur_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      rewardId,
      reward,
      status: 'available',
      earnedAt: new Date().toISOString(),
      expiryDate: reward.expiryDate
    };

    // Deduct points
    userPoints.availablePoints -= reward.pointsCost;
    userPoints.lastUpdated = new Date().toISOString();

    // Create points transaction
    const transaction: PointsTransaction = {
      id: `pts_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      type: 'redeemed',
      points: -reward.pointsCost,
      description: `Redeemed: ${reward.name}`,
      source: 'redemption',
      reference: userReward.id,
      multiplier: 1,
      createdAt: new Date().toISOString()
    };

    this.pointsTransactions.push(transaction);

    // Add to user rewards
    const userRewards = this.userRewards.get(userId) || [];
    userRewards.push(userReward);
    this.userRewards.set(userId, userRewards);

    this.saveData();
    return userReward;
  }

  public useReward(userRewardId: string, transactionId?: string): void {
    const userReward = this.findUserReward(userRewardId);
    if (!userReward) {
      throw new Error('User reward not found');
    }

    if (userReward.status !== 'available') {
      throw new Error('Reward is not available');
    }

    userReward.status = 'used';
    userReward.usedAt = new Date().toISOString();
    userReward.transactionId = transactionId;

    this.saveData();
  }

  // Tier Management
  public getUserTier(userId: string): LoyaltyTier {
    const userPoints = this.getUserPoints(userId);
    return this.calculateTier(userPoints.totalPoints);
  }

  private calculateTier(totalPoints: number): LoyaltyTier {
    for (let i = this.tiers.length - 1; i >= 0; i--) {
      if (totalPoints >= this.tiers[i].minPoints) {
        return this.tiers[i];
      }
    }
    return this.tiers[0]; // Bronze tier
  }

  private upgradeTier(userId: string, newTier: LoyaltyTier): void {
    const userPoints = this.getUserPoints(userId);
    const oldTier = this.tiers.find(t => t.id === userPoints.currentTier);
    
    userPoints.currentTier = newTier.id;
    userPoints.lastUpdated = new Date().toISOString();

    // Award tier upgrade bonus
    this.earnPoints(
      userId,
      this.settings.tierUpgradeBonus,
      'bonus',
      `Tier upgrade bonus: ${oldTier?.name} → ${newTier.name}`,
      `tier_upgrade_${newTier.id}`,
      1
    );
  }

  // Referral Program
  public createReferral(referrerId: string, referredId: string): ReferralProgram {
    const referral: ReferralProgram = {
      referrerId,
      referredId,
      status: 'pending',
      referrerReward: this.settings.referralBonus,
      referredReward: this.settings.referralBonus,
      createdAt: new Date().toISOString()
    };

    this.referrals.push(referral);
    this.saveData();
    return referral;
  }

  public completeReferral(referrerId: string, referredId: string, tripId: string): void {
    const referral = this.referrals.find(
      r => r.referrerId === referrerId && r.referredId === referredId && r.status === 'pending'
    );

    if (!referral) {
      throw new Error('Referral not found');
    }

    referral.status = 'completed';
    referral.completedAt = new Date().toISOString();
    referral.tripId = tripId;

    // Award points to both users
    this.earnPoints(
      referrerId,
      referral.referrerReward,
      'referral',
      'Referral bonus',
      `referral_${referral.referrerId}_${referral.referredId}`,
      1
    );

    this.earnPoints(
      referredId,
      referral.referredReward,
      'referral',
      'Welcome bonus',
      `referral_${referral.referrerId}_${referral.referredId}`,
      1
    );

    this.saveData();
  }

  // Data Access
  public getUserPoints(userId: string): LoyaltyPoints {
    let points = this.userPoints.get(userId);
    
    if (!points) {
      points = {
        userId,
        totalPoints: 0,
        availablePoints: 0,
        lifetimePoints: 0,
        currentTier: 'bronze',
        lastUpdated: new Date().toISOString()
      };
      this.userPoints.set(userId, points);
    }

    // Calculate next tier info
    const currentTier = this.getUserTier(userId);
    const nextTier = this.tiers.find(t => t.level === currentTier.level + 1);
    
    if (nextTier) {
      points.nextTier = nextTier.id;
      points.pointsToNextTier = nextTier.minPoints - points.totalPoints;
    }

    return points;
  }

  public getUserRewards(userId: string): UserReward[] {
    return this.userRewards.get(userId) || [];
  }

  public getAvailableRewards(): Reward[] {
    return Array.from(this.rewards.values()).filter(r => r.isActive);
  }

  public getPointsTransactions(userId: string, limit: number = 50): PointsTransaction[] {
    return this.pointsTransactions
      .filter(t => t.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }

  public getTiers(): LoyaltyTier[] {
    return [...this.tiers];
  }

  // Analytics
  public getLoyaltyAnalytics(userId: string): {
    currentTier: LoyaltyTier;
    pointsProgress: number;
    nextTier?: LoyaltyTier;
    pointsToNextTier: number;
    availableRewards: number;
    totalEarned: number;
    totalRedeemed: number;
    monthlyEarnings: Array<{ month: string; points: number }>;
    topSources: Array<{ source: string; points: number }>;
  } {
    const userPoints = this.getUserPoints(userId);
    const currentTier = this.getUserTier(userId);
    const nextTier = this.tiers.find(t => t.level === currentTier.level + 1);
    const pointsToNextTier = nextTier ? nextTier.minPoints - userPoints.totalPoints : 0;
    const pointsProgress = nextTier ? 
      ((userPoints.totalPoints - currentTier.minPoints) / (nextTier.minPoints - currentTier.minPoints)) * 100 : 100;

    const userRewards = this.getUserRewards(userId);
    const availableRewards = userRewards.filter(r => r.status === 'available').length;

    const transactions = this.getPointsTransactions(userId, 1000);
    const totalEarned = transactions
      .filter(t => t.type === 'earned')
      .reduce((sum, t) => sum + t.points, 0);
    const totalRedeemed = Math.abs(transactions
      .filter(t => t.type === 'redeemed')
      .reduce((sum, t) => sum + t.points, 0));

    // Monthly earnings
    const monthlyEarnings = this.calculateMonthlyEarnings(transactions);

    // Top sources
    const topSources = this.calculateTopSources(transactions);

    return {
      currentTier,
      pointsProgress,
      nextTier,
      pointsToNextTier,
      availableRewards,
      totalEarned,
      totalRedeemed,
      monthlyEarnings,
      topSources
    };
  }

  private calculateMonthlyEarnings(transactions: PointsTransaction[]): Array<{ month: string; points: number }> {
    const monthlyData = new Map<string, number>();
    
    transactions
      .filter(t => t.type === 'earned')
      .forEach(t => {
        const month = new Date(t.createdAt).toISOString().substring(0, 7);
        monthlyData.set(month, (monthlyData.get(month) || 0) + t.points);
      });

    return Array.from(monthlyData.entries())
      .map(([month, points]) => ({ month, points }))
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-12); // Last 12 months
  }

  private calculateTopSources(transactions: PointsTransaction[]): Array<{ source: string; points: number }> {
    const sourceData = new Map<string, number>();
    
    transactions
      .filter(t => t.type === 'earned')
      .forEach(t => {
        sourceData.set(t.source, (sourceData.get(t.source) || 0) + t.points);
      });

    return Array.from(sourceData.entries())
      .map(([source, points]) => ({ source, points }))
      .sort((a, b) => b.points - a.points)
      .slice(0, 5);
  }

  private findUserReward(userRewardId: string): UserReward | null {
    for (const rewards of this.userRewards.values()) {
      const reward = rewards.find(r => r.id === userRewardId);
      if (reward) return reward;
    }
    return null;
  }

  // Persistence
  private loadData(): void {
    this.loadUserPoints();
    this.loadUserRewards();
    this.loadPointsTransactions();
    this.loadReferrals();
  }

  private loadUserPoints(): void {
    try {
      const data = localStorage.getItem('loyalty_points');
      if (data) {
        const points = JSON.parse(data);
        this.userPoints = new Map(points);
      }
    } catch (error) {
      console.warn('Failed to load loyalty points:', error);
    }
  }

  private saveUserPoints(): void {
    try {
      const data = JSON.stringify(Array.from(this.userPoints.entries()));
      localStorage.setItem('loyalty_points', data);
    } catch (error) {
      console.warn('Failed to save loyalty points:', error);
    }
  }

  private loadUserRewards(): void {
    try {
      const data = localStorage.getItem('user_rewards');
      if (data) {
        const rewards = JSON.parse(data);
        this.userRewards = new Map(rewards);
      }
    } catch (error) {
      console.warn('Failed to load user rewards:', error);
    }
  }

  private saveUserRewards(): void {
    try {
      const data = JSON.stringify(Array.from(this.userRewards.entries()));
      localStorage.setItem('user_rewards', data);
    } catch (error) {
      console.warn('Failed to save user rewards:', error);
    }
  }

  private loadPointsTransactions(): void {
    try {
      const data = localStorage.getItem('points_transactions');
      if (data) {
        this.pointsTransactions = JSON.parse(data);
      }
    } catch (error) {
      console.warn('Failed to load points transactions:', error);
    }
  }

  private savePointsTransactions(): void {
    try {
      // Keep only last 10000 transactions
      if (this.pointsTransactions.length > 10000) {
        this.pointsTransactions = this.pointsTransactions.slice(-10000);
      }
      
      localStorage.setItem('points_transactions', JSON.stringify(this.pointsTransactions));
    } catch (error) {
      console.warn('Failed to save points transactions:', error);
    }
  }

  private loadReferrals(): void {
    try {
      const data = localStorage.getItem('referrals');
      if (data) {
        this.referrals = JSON.parse(data);
      }
    } catch (error) {
      console.warn('Failed to load referrals:', error);
    }
  }

  private saveReferrals(): void {
    try {
      localStorage.setItem('referrals', JSON.stringify(this.referrals));
    } catch (error) {
      console.warn('Failed to save referrals:', error);
    }
  }

  private saveData(): void {
    this.saveUserPoints();
    this.saveUserRewards();
    this.savePointsTransactions();
    this.saveReferrals();
  }
}

// React hook for loyalty program
export function useLoyaltyProgram() {
  const service = LoyaltyProgramService.getInstance();
  
  return {
    getUserPoints: (userId: string) => service.getUserPoints(userId),
    getUserTier: (userId: string) => service.getUserTier(userId),
    earnPoints: (userId: string, amount: number, source: any, description: string, reference: string, multiplier?: number) =>
      service.earnPoints(userId, amount, source, description, reference, multiplier),
    redeemPoints: (userId: string, rewardId: string) => service.redeemPoints(userId, rewardId),
    useReward: (userRewardId: string, transactionId?: string) => service.useReward(userRewardId, transactionId),
    getUserRewards: (userId: string) => service.getUserRewards(userId),
    getAvailableRewards: () => service.getAvailableRewards(),
    getPointsTransactions: (userId: string, limit?: number) => service.getPointsTransactions(userId, limit),
    getTiers: () => service.getTiers(),
    getAnalytics: (userId: string) => service.getLoyaltyAnalytics(userId),
    createReferral: (referrerId: string, referredId: string) => service.createReferral(referrerId, referredId),
    completeReferral: (referrerId: string, referredId: string, tripId: string) => 
      service.completeReferral(referrerId, referredId, tripId)
  };
}

// Export singleton instance
export const loyaltyProgramService = LoyaltyProgramService.getInstance();