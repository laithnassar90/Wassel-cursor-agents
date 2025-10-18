import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  Gift, 
  Star, 
  Trophy, 
  Target, 
  Users, 
  TrendingUp,
  Award,
  Zap,
  Crown,
  Diamond,
  Coins,
  GiftIcon
} from 'lucide-react';
import { useLoyaltyProgram, LoyaltyTier, Reward, UserReward } from '../utils/loyaltyProgram';

interface LoyaltyProgramProps {
  userId: string;
  onRewardRedeemed?: (reward: UserReward) => void;
}

export function LoyaltyProgram({ userId, onRewardRedeemed }: LoyaltyProgramProps) {
  const {
    getUserPoints,
    getUserTier,
    earnPoints,
    redeemPoints,
    useReward,
    getUserRewards,
    getAvailableRewards,
    getPointsTransactions,
    getTiers,
    getAnalytics,
    createReferral,
    completeReferral
  } = useLoyaltyProgram();

  const [points, setPoints] = useState<any>(null);
  const [currentTier, setCurrentTier] = useState<LoyaltyTier | null>(null);
  const [userRewards, setUserRewards] = useState<UserReward[]>([]);
  const [availableRewards, setAvailableRewards] = useState<Reward[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [tiers, setTiers] = useState<LoyaltyTier[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadLoyaltyData();
  }, [userId]);

  const loadLoyaltyData = () => {
    try {
      const userPoints = getUserPoints(userId);
      const tier = getUserTier(userId);
      const rewards = getUserRewards(userId);
      const available = getAvailableRewards();
      const txs = getPointsTransactions(userId);
      const analyticsData = getAnalytics(userId);
      const allTiers = getTiers();

      setPoints(userPoints);
      setCurrentTier(tier);
      setUserRewards(rewards);
      setAvailableRewards(available);
      setTransactions(txs);
      setAnalytics(analyticsData);
      setTiers(allTiers);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load loyalty data');
    }
  };

  const handleRedeemReward = async (rewardId: string) => {
    setIsLoading(true);
    try {
      const userReward = redeemPoints(userId, rewardId);
      setUserRewards(getUserRewards(userId));
      setPoints(getUserPoints(userId));
      onRewardRedeemed?.(userReward);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to redeem reward');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUseReward = async (userRewardId: string) => {
    try {
      // Note: This should be moved to component level or handled differently
      // useReward(userRewardId);
      console.log('Use reward:', userRewardId);
      setUserRewards(getUserRewards(userId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to use reward');
    }
  };

  const getTierIcon = (tierId: string) => {
    switch (tierId) {
      case 'bronze': return <Coins className="h-5 w-5" />;
      case 'silver': return <Award className="h-5 w-5" />;
      case 'gold': return <Trophy className="h-5 w-5" />;
      case 'platinum': return <Crown className="h-5 w-5" />;
      default: return <Star className="h-5 w-5" />;
    }
  };

  const getTierColor = (tierId: string) => {
    switch (tierId) {
      case 'bronze': return 'text-orange-600';
      case 'silver': return 'text-gray-600';
      case 'gold': return 'text-yellow-600';
      case 'platinum': return 'text-purple-600';
      default: return 'text-gray-600';
    }
  };

  const getRewardIcon = (type: string) => {
    switch (type) {
      case 'discount': return <TrendingUp className="h-4 w-4" />;
      case 'free_ride': return <Zap className="h-4 w-4" />;
      case 'cashback': return <Coins className="h-4 w-4" />;
      case 'upgrade': return <Crown className="h-4 w-4" />;
      case 'bonus_points': return <Star className="h-4 w-4" />;
      default: return <Gift className="h-4 w-4" />;
    }
  };

  const getRewardColor = (type: string) => {
    switch (type) {
      case 'discount': return 'text-green-600';
      case 'free_ride': return 'text-blue-600';
      case 'cashback': return 'text-yellow-600';
      case 'upgrade': return 'text-purple-600';
      case 'bonus_points': return 'text-orange-600';
      default: return 'text-gray-600';
    }
  };

  if (!points || !currentTier) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2">Loading loyalty program...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Tier & Points */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                {getTierIcon(currentTier.id)}
                <span className={getTierColor(currentTier.id)}>
                  {currentTier.name} Member
                </span>
              </CardTitle>
              <CardDescription>
                {currentTier.benefits.join(' • ')}
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-lg px-3 py-1">
              {points.totalPoints.toLocaleString()} pts
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {/* Points Progress */}
          {analytics.nextTier && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress to {analytics.nextTier.name}</span>
                <span>{analytics.pointsToNextTier} points to go</span>
              </div>
              <Progress value={analytics.pointsProgress} className="h-2" />
            </div>
          )}

          {/* Tier Benefits */}
          <div className="mt-4">
            <h4 className="font-medium text-sm mb-2">Your Benefits</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {currentTier.benefits.map((benefit, index) => (
                <div key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="w-1 h-1 bg-primary rounded-full" />
                  <span>{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs defaultValue="rewards" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="rewards">Rewards</TabsTrigger>
          <TabsTrigger value="my-rewards">My Rewards</TabsTrigger>
          <TabsTrigger value="tiers">Tiers</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        {/* Available Rewards Tab */}
        <TabsContent value="rewards" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="h-5 w-5" />
                Available Rewards
              </CardTitle>
              <CardDescription>
                Redeem your points for amazing rewards
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {availableRewards.map((reward) => (
                  <div key={reward.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className={getRewardColor(reward.type)}>
                          {getRewardIcon(reward.type)}
                        </div>
                        <h3 className="font-medium">{reward.name}</h3>
                      </div>
                      <Badge variant="outline">
                        {reward.pointsCost} pts
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-muted-foreground">
                      {reward.description}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        {reward.type === 'discount' ? `${reward.value}% off` :
                         reward.type === 'free_ride' ? `$${reward.value} free` :
                         reward.type === 'cashback' ? `$${reward.value} cashback` :
                         reward.type === 'bonus_points' ? `${reward.value} bonus pts` :
                         reward.value}
                      </span>
                      <Button
                        size="sm"
                        onClick={() => handleRedeemReward(reward.id)}
                        disabled={isLoading || points.availablePoints < reward.pointsCost}
                      >
                        Redeem
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* My Rewards Tab */}
        <TabsContent value="my-rewards" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GiftIcon className="h-5 w-5" />
                My Rewards ({userRewards.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {userRewards.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Gift className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No rewards yet</p>
                  <p className="text-sm">Redeem points to get rewards</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {userRewards.map((userReward) => (
                    <div key={userReward.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={getRewardColor(userReward.reward.type)}>
                          {getRewardIcon(userReward.reward.type)}
                        </div>
                        <div>
                          <div className="font-medium">{userReward.reward.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {userReward.reward.description}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant={userReward.status === 'available' ? 'default' : 'outline'}
                        >
                          {userReward.status}
                        </Badge>
                        {userReward.status === 'available' && (
                          <Button
                            size="sm"
                            onClick={() => handleUseReward(userReward.id)}
                          >
                            Use
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tiers Tab */}
        <TabsContent value="tiers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Loyalty Tiers
              </CardTitle>
              <CardDescription>
                Unlock better benefits as you earn more points
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {tiers.map((tier, index) => (
                  <div 
                    key={tier.id} 
                    className={`p-4 rounded-lg border ${
                      tier.id === currentTier.id 
                        ? 'border-primary bg-primary/5' 
                        : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {getTierIcon(tier.id)}
                        <div>
                          <h3 className={`font-medium ${getTierColor(tier.id)}`}>
                            {tier.name} Tier
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {tier.minPoints.toLocaleString()} - {tier.maxPoints?.toLocaleString() || '∞'} points
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {tier.multiplier}x points
                        </div>
                        {tier.id === currentTier.id && (
                          <Badge className="bg-primary">Current</Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Benefits:</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                        {tier.benefits.map((benefit, benefitIndex) => (
                          <div key={benefitIndex} className="flex items-center gap-2 text-sm text-muted-foreground">
                            <div className="w-1 h-1 bg-primary rounded-full" />
                            <span>{benefit}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Points History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {transactions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No transactions yet</p>
                  <p className="text-sm">Your points history will appear here</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {transactions.slice(0, 20).map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${
                          transaction.type === 'earned' ? 'bg-green-100' : 'bg-red-100'
                        }`}>
                          {transaction.type === 'earned' ? (
                            <TrendingUp className="h-4 w-4 text-green-600" />
                          ) : (
                            <Gift className="h-4 w-4 text-red-600" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-sm">{transaction.description}</div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(transaction.createdAt).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`font-medium ${
                          transaction.type === 'earned' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {transaction.type === 'earned' ? '+' : ''}{transaction.points}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {transaction.source}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Analytics Summary */}
      {analytics && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Your Loyalty Stats
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {analytics.totalEarned.toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">Points Earned</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {analytics.totalRedeemed.toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">Points Redeemed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {analytics.availableRewards}
                </div>
                <div className="text-sm text-muted-foreground">Available Rewards</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {currentTier.multiplier}x
                </div>
                <div className="text-sm text-muted-foreground">Points Multiplier</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}