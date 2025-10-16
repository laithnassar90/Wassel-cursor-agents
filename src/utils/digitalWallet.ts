// Digital Wallet and Payment System

export interface Wallet {
  id: string;
  userId: string;
  balance: number;
  currency: string;
  isActive: boolean;
  createdAt: string;
  lastUpdated: string;
}

export interface Transaction {
  id: string;
  walletId: string;
  type: 'credit' | 'debit' | 'refund' | 'bonus' | 'withdrawal';
  amount: number;
  currency: string;
  description: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  reference: string;
  metadata: Record<string, any>;
  createdAt: string;
  completedAt?: string;
}

export interface PaymentMethod {
  id: string;
  userId: string;
  type: 'card' | 'bank_account' | 'crypto' | 'mobile_money';
  provider: string;
  last4: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
  isVerified: boolean;
  createdAt: string;
}

export interface PaymentRequest {
  id: string;
  fromUserId: string;
  toUserId: string;
  amount: number;
  currency: string;
  description: string;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  expiresAt: string;
  createdAt: string;
  completedAt?: string;
}

export interface SplitPayment {
  id: string;
  tripId: string;
  totalAmount: number;
  currency: string;
  participants: Array<{
    userId: string;
    amount: number;
    status: 'pending' | 'paid' | 'failed';
    paidAt?: string;
  }>;
  status: 'pending' | 'partial' | 'completed' | 'cancelled';
  createdAt: string;
  completedAt?: string;
}

export interface WalletSettings {
  autoTopUp: boolean;
  topUpThreshold: number;
  topUpAmount: number;
  currency: string;
  notifications: {
    lowBalance: boolean;
    transactions: boolean;
    payments: boolean;
  };
  security: {
    requirePin: boolean;
    biometricAuth: boolean;
    twoFactorAuth: boolean;
  };
}

export class DigitalWalletService {
  private static instance: DigitalWalletService;
  private wallets: Map<string, Wallet> = new Map();
  private transactions: Transaction[] = [];
  private paymentMethods: Map<string, PaymentMethod> = new Map();
  private paymentRequests: Map<string, PaymentRequest> = new Map();
  private splitPayments: Map<string, SplitPayment> = new Map();
  private settings: Map<string, WalletSettings> = new Map();

  private constructor() {
    this.loadData();
  }

  public static getInstance(): DigitalWalletService {
    if (!DigitalWalletService.instance) {
      DigitalWalletService.instance = new DigitalWalletService();
    }
    return DigitalWalletService.instance;
  }

  // Wallet Management
  public createWallet(userId: string, currency: string = 'USD'): Wallet {
    const wallet: Wallet = {
      id: `wallet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      balance: 0,
      currency,
      isActive: true,
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    };

    this.wallets.set(wallet.id, wallet);
    this.saveWallets();

    // Create default settings
    this.settings.set(userId, {
      autoTopUp: false,
      topUpThreshold: 10,
      topUpAmount: 50,
      currency,
      notifications: {
        lowBalance: true,
        transactions: true,
        payments: true
      },
      security: {
        requirePin: true,
        biometricAuth: false,
        twoFactorAuth: false
      }
    });

    this.saveSettings();
    return wallet;
  }

  public getWallet(userId: string): Wallet | null {
    const wallet = Array.from(this.wallets.values()).find(w => w.userId === userId);
    return wallet || null;
  }

  public getWalletById(walletId: string): Wallet | null {
    return this.wallets.get(walletId) || null;
  }

  // Transaction Management
  public async processTransaction(
    walletId: string,
    type: Transaction['type'],
    amount: number,
    description: string,
    metadata: Record<string, any> = {}
  ): Promise<Transaction> {
    const wallet = this.wallets.get(walletId);
    if (!wallet) {
      throw new Error('Wallet not found');
    }

    if (!wallet.isActive) {
      throw new Error('Wallet is not active');
    }

    // Validate transaction
    if (type === 'debit' && wallet.balance < amount) {
      throw new Error('Insufficient funds');
    }

    const transaction: Transaction = {
      id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      walletId,
      type,
      amount,
      currency: wallet.currency,
      description,
      status: 'pending',
      reference: this.generateReference(),
      metadata,
      createdAt: new Date().toISOString()
    };

    try {
      // Process transaction
      await this.executeTransaction(wallet, transaction);
      
      transaction.status = 'completed';
      transaction.completedAt = new Date().toISOString();
      
      // Update wallet balance
      if (type === 'credit' || type === 'refund' || type === 'bonus') {
        wallet.balance += amount;
      } else if (type === 'debit' || type === 'withdrawal') {
        wallet.balance -= amount;
      }
      
      wallet.lastUpdated = new Date().toISOString();
      
      this.transactions.push(transaction);
      this.saveWallets();
      this.saveTransactions();
      
      return transaction;
    } catch (error) {
      transaction.status = 'failed';
      this.transactions.push(transaction);
      this.saveTransactions();
      throw error;
    }
  }

  private async executeTransaction(wallet: Wallet, transaction: Transaction): Promise<void> {
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // In a real implementation, integrate with payment processors
    // like Stripe, PayPal, or local payment gateways
    console.log('Processing transaction:', transaction);
  }

  private generateReference(): string {
    return `REF${Date.now()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
  }

  public getTransactions(walletId: string, limit: number = 50): Transaction[] {
    return this.transactions
      .filter(t => t.walletId === walletId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }

  public getTransactionById(transactionId: string): Transaction | null {
    return this.transactions.find(t => t.id === transactionId) || null;
  }

  // Payment Methods
  public addPaymentMethod(
    userId: string,
    type: PaymentMethod['type'],
    provider: string,
    last4: string,
    expiryMonth?: number,
    expiryYear?: number
  ): PaymentMethod {
    const paymentMethod: PaymentMethod = {
      id: `pm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      type,
      provider,
      last4,
      expiryMonth,
      expiryYear,
      isDefault: this.paymentMethods.size === 0,
      isVerified: false,
      createdAt: new Date().toISOString()
    };

    this.paymentMethods.set(paymentMethod.id, paymentMethod);
    this.savePaymentMethods();
    return paymentMethod;
  }

  public getPaymentMethods(userId: string): PaymentMethod[] {
    return Array.from(this.paymentMethods.values())
      .filter(pm => pm.userId === userId)
      .sort((a, b) => (b.isDefault ? 1 : 0) - (a.isDefault ? 1 : 0));
  }

  public setDefaultPaymentMethod(paymentMethodId: string, userId: string): void {
    // Remove default from all user's payment methods
    this.paymentMethods.forEach(pm => {
      if (pm.userId === userId) {
        pm.isDefault = false;
      }
    });

    // Set new default
    const pm = this.paymentMethods.get(paymentMethodId);
    if (pm && pm.userId === userId) {
      pm.isDefault = true;
      this.savePaymentMethods();
    }
  }

  public removePaymentMethod(paymentMethodId: string): boolean {
    const pm = this.paymentMethods.get(paymentMethodId);
    if (!pm) return false;

    this.paymentMethods.delete(paymentMethodId);
    this.savePaymentMethods();
    return true;
  }

  // Payment Requests
  public createPaymentRequest(
    fromUserId: string,
    toUserId: string,
    amount: number,
    currency: string,
    description: string,
    expiresInHours: number = 24
  ): PaymentRequest {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + expiresInHours);

    const paymentRequest: PaymentRequest = {
      id: `pr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      fromUserId,
      toUserId,
      amount,
      currency,
      description,
      status: 'pending',
      expiresAt: expiresAt.toISOString(),
      createdAt: new Date().toISOString()
    };

    this.paymentRequests.set(paymentRequest.id, paymentRequest);
    this.savePaymentRequests();
    return paymentRequest;
  }

  public getPaymentRequests(userId: string): PaymentRequest[] {
    return Array.from(this.paymentRequests.values())
      .filter(pr => pr.fromUserId === userId || pr.toUserId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public async acceptPaymentRequest(paymentRequestId: string): Promise<Transaction> {
    const pr = this.paymentRequests.get(paymentRequestId);
    if (!pr) {
      throw new Error('Payment request not found');
    }

    if (pr.status !== 'pending') {
      throw new Error('Payment request is not pending');
    }

    if (new Date(pr.expiresAt) < new Date()) {
      pr.status = 'expired';
      this.savePaymentRequests();
      throw new Error('Payment request has expired');
    }

    // Get recipient's wallet
    const recipientWallet = this.getWallet(pr.toUserId);
    if (!recipientWallet) {
      throw new Error('Recipient wallet not found');
    }

    // Process payment
    const transaction = await this.processTransaction(
      recipientWallet.id,
      'credit',
      pr.amount,
      `Payment from ${pr.fromUserId}: ${pr.description}`,
      { paymentRequestId: pr.id }
    );

    pr.status = 'accepted';
    pr.completedAt = new Date().toISOString();
    this.savePaymentRequests();

    return transaction;
  }

  public rejectPaymentRequest(paymentRequestId: string): void {
    const pr = this.paymentRequests.get(paymentRequestId);
    if (pr && pr.status === 'pending') {
      pr.status = 'rejected';
      this.savePaymentRequests();
    }
  }

  // Split Payments
  public createSplitPayment(
    tripId: string,
    totalAmount: number,
    currency: string,
    participants: Array<{ userId: string; amount: number }>
  ): SplitPayment {
    const splitPayment: SplitPayment = {
      id: `split_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      tripId,
      totalAmount,
      currency,
      participants: participants.map(p => ({
        ...p,
        status: 'pending' as const
      })),
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    this.splitPayments.set(splitPayment.id, splitPayment);
    this.saveSplitPayments();
    return splitPayment;
  }

  public async paySplitPayment(splitPaymentId: string, userId: string): Promise<Transaction> {
    const split = this.splitPayments.get(splitPaymentId);
    if (!split) {
      throw new Error('Split payment not found');
    }

    const participant = split.participants.find(p => p.userId === userId);
    if (!participant) {
      throw new Error('User not found in split payment');
    }

    if (participant.status !== 'pending') {
      throw new Error('Payment already processed');
    }

    // Get user's wallet
    const wallet = this.getWallet(userId);
    if (!wallet) {
      throw new Error('User wallet not found');
    }

    // Process payment
    const transaction = await this.processTransaction(
      wallet.id,
      'debit',
      participant.amount,
      `Split payment for trip ${split.tripId}`,
      { splitPaymentId: split.id }
    );

    participant.status = 'paid';
    participant.paidAt = new Date().toISOString();

    // Check if all participants have paid
    const allPaid = split.participants.every(p => p.status === 'paid');
    if (allPaid) {
      split.status = 'completed';
      split.completedAt = new Date().toISOString();
    } else {
      split.status = 'partial';
    }

    this.saveSplitPayments();
    return transaction;
  }

  public getSplitPayments(userId: string): SplitPayment[] {
    return Array.from(this.splitPayments.values())
      .filter(sp => sp.participants.some(p => p.userId === userId))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  // Wallet Settings
  public updateSettings(userId: string, settings: Partial<WalletSettings>): void {
    const currentSettings = this.settings.get(userId);
    if (currentSettings) {
      const updatedSettings = { ...currentSettings, ...settings };
      this.settings.set(userId, updatedSettings);
      this.saveSettings();
    }
  }

  public getSettings(userId: string): WalletSettings | null {
    return this.settings.get(userId) || null;
  }

  // Top-up functionality
  public async topUpWallet(
    walletId: string,
    amount: number,
    paymentMethodId: string
  ): Promise<Transaction> {
    const wallet = this.wallets.get(walletId);
    if (!wallet) {
      throw new Error('Wallet not found');
    }

    const paymentMethod = this.paymentMethods.get(paymentMethodId);
    if (!paymentMethod) {
      throw new Error('Payment method not found');
    }

    if (paymentMethod.userId !== wallet.userId) {
      throw new Error('Payment method does not belong to wallet owner');
    }

    // Process top-up
    const transaction = await this.processTransaction(
      walletId,
      'credit',
      amount,
      `Wallet top-up via ${paymentMethod.provider} ending in ${paymentMethod.last4}`,
      { paymentMethodId, type: 'top_up' }
    );

    return transaction;
  }

  // Analytics and insights
  public getWalletAnalytics(walletId: string, days: number = 30): {
    totalTransactions: number;
    totalSpent: number;
    totalReceived: number;
    averageTransaction: number;
    topCategories: Array<{ category: string; amount: number; count: number }>;
    monthlyTrend: Array<{ month: string; spent: number; received: number }>;
  } {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const recentTransactions = this.transactions.filter(
      t => t.walletId === walletId && new Date(t.createdAt) >= cutoffDate
    );

    const totalTransactions = recentTransactions.length;
    const totalSpent = recentTransactions
      .filter(t => t.type === 'debit' || t.type === 'withdrawal')
      .reduce((sum, t) => sum + t.amount, 0);
    const totalReceived = recentTransactions
      .filter(t => t.type === 'credit' || t.type === 'refund' || t.type === 'bonus')
      .reduce((sum, t) => sum + t.amount, 0);
    const averageTransaction = totalTransactions > 0 ? (totalSpent + totalReceived) / totalTransactions : 0;

    // Categorize transactions (simplified)
    const categories = new Map<string, { amount: number; count: number }>();
    recentTransactions.forEach(t => {
      const category = this.categorizeTransaction(t);
      const existing = categories.get(category) || { amount: 0, count: 0 };
      categories.set(category, {
        amount: existing.amount + t.amount,
        count: existing.count + 1
      });
    });

    const topCategories = Array.from(categories.entries())
      .map(([category, data]) => ({ category, ...data }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    // Monthly trend (simplified)
    const monthlyTrend = this.calculateMonthlyTrend(recentTransactions);

    return {
      totalTransactions,
      totalSpent,
      totalReceived,
      averageTransaction,
      topCategories,
      monthlyTrend
    };
  }

  private categorizeTransaction(transaction: Transaction): string {
    const description = transaction.description.toLowerCase();
    
    if (description.includes('ride') || description.includes('trip')) return 'Transportation';
    if (description.includes('food') || description.includes('restaurant')) return 'Food';
    if (description.includes('top') || description.includes('wallet')) return 'Wallet';
    if (description.includes('refund')) return 'Refunds';
    if (description.includes('bonus')) return 'Bonuses';
    
    return 'Other';
  }

  private calculateMonthlyTrend(transactions: Transaction[]): Array<{ month: string; spent: number; received: number }> {
    const monthlyData = new Map<string, { spent: number; received: number }>();
    
    transactions.forEach(t => {
      const month = new Date(t.createdAt).toISOString().substring(0, 7); // YYYY-MM
      const existing = monthlyData.get(month) || { spent: 0, received: 0 };
      
      if (t.type === 'debit' || t.type === 'withdrawal') {
        existing.spent += t.amount;
      } else {
        existing.received += t.amount;
      }
      
      monthlyData.set(month, existing);
    });

    return Array.from(monthlyData.entries())
      .map(([month, data]) => ({ month, ...data }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }

  // Persistence
  private loadData(): void {
    this.loadWallets();
    this.loadTransactions();
    this.loadPaymentMethods();
    this.loadPaymentRequests();
    this.loadSplitPayments();
    this.loadSettings();
  }

  private loadWallets(): void {
    try {
      const data = localStorage.getItem('digital_wallets');
      if (data) {
        const wallets = JSON.parse(data);
        this.wallets = new Map(wallets);
      }
    } catch (error) {
      console.warn('Failed to load wallets:', error);
    }
  }

  private saveWallets(): void {
    try {
      const data = JSON.stringify(Array.from(this.wallets.entries()));
      localStorage.setItem('digital_wallets', data);
    } catch (error) {
      console.warn('Failed to save wallets:', error);
    }
  }

  private loadTransactions(): void {
    try {
      const data = localStorage.getItem('wallet_transactions');
      if (data) {
        this.transactions = JSON.parse(data);
      }
    } catch (error) {
      console.warn('Failed to load transactions:', error);
    }
  }

  private saveTransactions(): void {
    try {
      // Keep only last 10000 transactions
      if (this.transactions.length > 10000) {
        this.transactions = this.transactions.slice(-10000);
      }
      
      localStorage.setItem('wallet_transactions', JSON.stringify(this.transactions));
    } catch (error) {
      console.warn('Failed to save transactions:', error);
    }
  }

  private loadPaymentMethods(): void {
    try {
      const data = localStorage.getItem('payment_methods');
      if (data) {
        const methods = JSON.parse(data);
        this.paymentMethods = new Map(methods);
      }
    } catch (error) {
      console.warn('Failed to load payment methods:', error);
    }
  }

  private savePaymentMethods(): void {
    try {
      const data = JSON.stringify(Array.from(this.paymentMethods.entries()));
      localStorage.setItem('payment_methods', data);
    } catch (error) {
      console.warn('Failed to save payment methods:', error);
    }
  }

  private loadPaymentRequests(): void {
    try {
      const data = localStorage.getItem('payment_requests');
      if (data) {
        const requests = JSON.parse(data);
        this.paymentRequests = new Map(requests);
      }
    } catch (error) {
      console.warn('Failed to load payment requests:', error);
    }
  }

  private savePaymentRequests(): void {
    try {
      const data = JSON.stringify(Array.from(this.paymentRequests.entries()));
      localStorage.setItem('payment_requests', data);
    } catch (error) {
      console.warn('Failed to save payment requests:', error);
    }
  }

  private loadSplitPayments(): void {
    try {
      const data = localStorage.getItem('split_payments');
      if (data) {
        const splits = JSON.parse(data);
        this.splitPayments = new Map(splits);
      }
    } catch (error) {
      console.warn('Failed to load split payments:', error);
    }
  }

  private saveSplitPayments(): void {
    try {
      const data = JSON.stringify(Array.from(this.splitPayments.entries()));
      localStorage.setItem('split_payments', data);
    } catch (error) {
      console.warn('Failed to save split payments:', error);
    }
  }

  private loadSettings(): void {
    try {
      const data = localStorage.getItem('wallet_settings');
      if (data) {
        const settings = JSON.parse(data);
        this.settings = new Map(settings);
      }
    } catch (error) {
      console.warn('Failed to load wallet settings:', error);
    }
  }

  private saveSettings(): void {
    try {
      const data = JSON.stringify(Array.from(this.settings.entries()));
      localStorage.setItem('wallet_settings', data);
    } catch (error) {
      console.warn('Failed to save wallet settings:', error);
    }
  }
}

// React hook for digital wallet
export function useDigitalWallet() {
  const service = DigitalWalletService.getInstance();
  
  return {
    createWallet: (userId: string, currency?: string) => service.createWallet(userId, currency),
    getWallet: (userId: string) => service.getWallet(userId),
    processTransaction: (walletId: string, type: any, amount: number, description: string, metadata?: any) =>
      service.processTransaction(walletId, type, amount, description, metadata),
    getTransactions: (walletId: string, limit?: number) => service.getTransactions(walletId, limit),
    addPaymentMethod: (userId: string, type: any, provider: string, last4: string, expiryMonth?: number, expiryYear?: number) =>
      service.addPaymentMethod(userId, type, provider, last4, expiryMonth, expiryYear),
    getPaymentMethods: (userId: string) => service.getPaymentMethods(userId),
    createPaymentRequest: (fromUserId: string, toUserId: string, amount: number, currency: string, description: string, expiresInHours?: number) =>
      service.createPaymentRequest(fromUserId, toUserId, amount, currency, description, expiresInHours),
    getPaymentRequests: (userId: string) => service.getPaymentRequests(userId),
    acceptPaymentRequest: (paymentRequestId: string) => service.acceptPaymentRequest(paymentRequestId),
    createSplitPayment: (tripId: string, totalAmount: number, currency: string, participants: any[]) =>
      service.createSplitPayment(tripId, totalAmount, currency, participants),
    getSplitPayments: (userId: string) => service.getSplitPayments(userId),
    paySplitPayment: (splitPaymentId: string, userId: string) => service.paySplitPayment(splitPaymentId, userId),
    topUpWallet: (walletId: string, amount: number, paymentMethodId: string) =>
      service.topUpWallet(walletId, amount, paymentMethodId),
    getAnalytics: (walletId: string, days?: number) => service.getWalletAnalytics(walletId, days),
    updateSettings: (userId: string, settings: any) => service.updateSettings(userId, settings),
    getSettings: (userId: string) => service.getSettings(userId)
  };
}

// Export singleton instance
export const digitalWalletService = DigitalWalletService.getInstance();