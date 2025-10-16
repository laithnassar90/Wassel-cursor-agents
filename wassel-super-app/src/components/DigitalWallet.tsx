import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Progress } from './ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  Wallet, 
  CreditCard, 
  Send, 
  Receive, 
  Users, 
  TrendingUp,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  DollarSign,
  History,
  Settings,
  Shield,
  Bell
} from 'lucide-react';
import { useDigitalWallet, Wallet as WalletType, Transaction, PaymentMethod } from '../utils/digitalWallet';

interface DigitalWalletProps {
  userId: string;
  onTransactionComplete?: (transaction: Transaction) => void;
}

export function DigitalWallet({ userId, onTransactionComplete }: DigitalWalletProps) {
  const {
    createWallet,
    getWallet,
    processTransaction,
    getTransactions,
    addPaymentMethod,
    getPaymentMethods,
    createPaymentRequest,
    getPaymentRequests,
    acceptPaymentRequest,
    createSplitPayment,
    getSplitPayments,
    paySplitPayment,
    topUpWallet,
    getAnalytics,
    updateSettings,
    getSettings
  } = useDigitalWallet();

  const [wallet, setWallet] = useState<WalletType | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [paymentRequests, setPaymentRequests] = useState<any[]>([]);
  const [splitPayments, setSplitPayments] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadWalletData();
  }, [userId]);

  const loadWalletData = async () => {
    setIsLoading(true);
    try {
      // Get or create wallet
      let userWallet = getWallet(userId);
      if (!userWallet) {
        userWallet = createWallet(userId);
      }
      setWallet(userWallet);

      // Load related data
      if (userWallet) {
        setTransactions(getTransactions(userWallet.id));
        setPaymentMethods(getPaymentMethods(userId));
        setPaymentRequests(getPaymentRequests(userId));
        setSplitPayments(getSplitPayments(userId));
        setAnalytics(getAnalytics(userWallet.id));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load wallet data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTopUp = async (amount: number) => {
    if (!wallet || paymentMethods.length === 0) return;

    setIsLoading(true);
    try {
      const defaultMethod = paymentMethods.find(pm => pm.isDefault);
      if (!defaultMethod) {
        throw new Error('No payment method available');
      }

      const transaction = await topUpWallet(wallet.id, amount, defaultMethod.id);
      setWallet(getWallet(userId));
      setTransactions(getTransactions(wallet.id));
      onTransactionComplete?.(transaction);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Top-up failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMoney = async (toUserId: string, amount: number, description: string) => {
    if (!wallet) return;

    setIsLoading(true);
    try {
      const transaction = await processTransaction(
        wallet.id,
        'debit',
        amount,
        `Payment to ${toUserId}: ${description}`,
        { toUserId, type: 'send_money' }
      );
      
      setWallet(getWallet(userId));
      setTransactions(getTransactions(wallet.id));
      onTransactionComplete?.(transaction);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Send money failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestMoney = async (fromUserId: string, amount: number, description: string) => {
    try {
      const paymentRequest = createPaymentRequest(userId, fromUserId, amount, wallet?.currency || 'USD', description);
      setPaymentRequests(getPaymentRequests(userId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request money failed');
    }
  };

  const handleAcceptPaymentRequest = async (requestId: string) => {
    setIsLoading(true);
    try {
      const transaction = await acceptPaymentRequest(requestId);
      setWallet(getWallet(userId));
      setTransactions(getTransactions(wallet?.id || ''));
      setPaymentRequests(getPaymentRequests(userId));
      onTransactionComplete?.(transaction);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to accept payment request');
    } finally {
      setIsLoading(false);
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'credit': return <ArrowDownLeft className="h-4 w-4 text-green-600" />;
      case 'debit': return <ArrowUpRight className="h-4 w-4 text-red-600" />;
      case 'refund': return <ArrowDownLeft className="h-4 w-4 text-blue-600" />;
      case 'bonus': return <ArrowDownLeft className="h-4 w-4 text-purple-600" />;
      default: return <DollarSign className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'credit': return 'text-green-600';
      case 'debit': return 'text-red-600';
      case 'refund': return 'text-blue-600';
      case 'bonus': return 'text-purple-600';
      default: return 'text-gray-600';
    }
  };

  const formatAmount = (amount: number, type: string) => {
    const sign = type === 'credit' || type === 'refund' || type === 'bonus' ? '+' : '-';
    return `${sign}$${amount.toFixed(2)}`;
  };

  if (isLoading && !wallet) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2">Loading wallet...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!wallet) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <Wallet className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No Wallet Found</h3>
            <p className="text-muted-foreground mb-4">
              Create a digital wallet to start making payments
            </p>
            <Button onClick={() => loadWalletData()}>
              <Plus className="h-4 w-4 mr-2" />
              Create Wallet
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Wallet Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5" />
                Digital Wallet
              </CardTitle>
              <CardDescription>
                Manage your payments and transactions
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-sm">
              {wallet.currency}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center mb-6">
            <div className="text-4xl font-bold text-primary mb-2">
              ${wallet.balance.toFixed(2)}
            </div>
            <div className="text-sm text-muted-foreground">
              Available Balance
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Button 
              onClick={() => handleTopUp(50)}
              disabled={isLoading || paymentMethods.length === 0}
              className="h-12"
            >
              <Plus className="h-4 w-4 mr-2" />
              Top Up $50
            </Button>
            <Button 
              onClick={() => handleTopUp(100)}
              disabled={isLoading || paymentMethods.length === 0}
              variant="outline"
              className="h-12"
            >
              <Plus className="h-4 w-4 mr-2" />
              Top Up $100
            </Button>
          </div>

          {paymentMethods.length === 0 && (
            <Alert className="mt-4">
              <CreditCard className="h-4 w-4" />
              <AlertDescription>
                Add a payment method to enable top-ups and payments
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs defaultValue="transactions" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="splits">Split Bills</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Transactions Tab */}
        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Recent Transactions
              </CardTitle>
            </CardHeader>
            <CardContent>
              {transactions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No transactions yet</p>
                  <p className="text-sm">Your transaction history will appear here</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {transactions.slice(0, 10).map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getTransactionIcon(transaction.type)}
                        <div>
                          <div className="font-medium text-sm">{transaction.description}</div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(transaction.createdAt).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`font-medium ${getTransactionColor(transaction.type)}`}>
                          {formatAmount(transaction.amount, transaction.type)}
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {transaction.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payments Tab */}
        <TabsContent value="payments" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Send Money */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Send className="h-5 w-5" />
                  Send Money
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Amount</label>
                    <input
                      type="number"
                      placeholder="0.00"
                      className="w-full mt-1 px-3 py-2 border rounded-md"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">To User ID</label>
                    <input
                      type="text"
                      placeholder="user@example.com"
                      className="w-full mt-1 px-3 py-2 border rounded-md"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Description</label>
                    <input
                      type="text"
                      placeholder="Payment for..."
                      className="w-full mt-1 px-3 py-2 border rounded-md"
                    />
                  </div>
                  <Button className="w-full" disabled={isLoading}>
                    <Send className="h-4 w-4 mr-2" />
                    Send Money
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Request Money */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Receive className="h-5 w-5" />
                  Request Money
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Amount</label>
                    <input
                      type="number"
                      placeholder="0.00"
                      className="w-full mt-1 px-3 py-2 border rounded-md"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">From User ID</label>
                    <input
                      type="text"
                      placeholder="user@example.com"
                      className="w-full mt-1 px-3 py-2 border rounded-md"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Description</label>
                    <input
                      type="text"
                      placeholder="Request for..."
                      className="w-full mt-1 px-3 py-2 border rounded-md"
                    />
                  </div>
                  <Button variant="outline" className="w-full" disabled={isLoading}>
                    <Receive className="h-4 w-4 mr-2" />
                    Request Money
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Payment Requests */}
          {paymentRequests.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Pending Payment Requests</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {paymentRequests.slice(0, 5).map((request) => (
                    <div key={request.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">${request.amount.toFixed(2)}</div>
                        <div className="text-sm text-muted-foreground">{request.description}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{request.status}</Badge>
                        {request.status === 'pending' && (
                          <Button size="sm" onClick={() => handleAcceptPaymentRequest(request.id)}>
                            Accept
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Split Bills Tab */}
        <TabsContent value="splits" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Split Bills
              </CardTitle>
            </CardHeader>
            <CardContent>
              {splitPayments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No split payments yet</p>
                  <p className="text-sm">Split ride costs with friends</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {splitPayments.map((split) => (
                    <div key={split.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-medium">Trip {split.tripId}</div>
                        <Badge variant="outline">{split.status}</Badge>
                      </div>
                      <div className="text-sm text-muted-foreground mb-3">
                        Total: ${split.totalAmount.toFixed(2)} • {split.participants.length} participants
                      </div>
                      <div className="space-y-2">
                        {split.participants.map((participant: any, index: number) => (
                          <div key={index} className="flex items-center justify-between text-sm">
                            <span>User {participant.userId}</span>
                            <div className="flex items-center gap-2">
                              <span>${participant.amount.toFixed(2)}</span>
                              <Badge 
                                variant={participant.status === 'paid' ? 'default' : 'outline'}
                                className="text-xs"
                              >
                                {participant.status}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          {analytics ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                    <div>
                      <div className="text-2xl font-bold">{analytics.totalTransactions}</div>
                      <div className="text-sm text-muted-foreground">Total Transactions</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <ArrowUpRight className="h-5 w-5 text-red-600" />
                    <div>
                      <div className="text-2xl font-bold">${analytics.totalSpent.toFixed(2)}</div>
                      <div className="text-sm text-muted-foreground">Total Spent</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <ArrowDownLeft className="h-5 w-5 text-green-600" />
                    <div>
                      <div className="text-2xl font-bold">${analytics.totalReceived.toFixed(2)}</div>
                      <div className="text-sm text-muted-foreground">Total Received</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-purple-600" />
                    <div>
                      <div className="text-2xl font-bold">${analytics.averageTransaction.toFixed(2)}</div>
                      <div className="text-sm text-muted-foreground">Avg Transaction</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="p-6">
                <div className="text-center text-muted-foreground">
                  <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No analytics data available</p>
                  <p className="text-sm">Analytics will appear after you make transactions</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}