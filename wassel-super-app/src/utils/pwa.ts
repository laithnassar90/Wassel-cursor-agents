// PWA utilities and service worker management

export class PWAManager {
  private static instance: PWAManager;
  private registration: ServiceWorkerRegistration | null = null;
  private deferredPrompt: any = null;

  private constructor() {
    this.setupInstallPrompt();
    this.setupServiceWorker();
  }

  public static getInstance(): PWAManager {
    if (!PWAManager.instance) {
      PWAManager.instance = new PWAManager();
    }
    return PWAManager.instance;
  }

  private setupInstallPrompt() {
    window.addEventListener('beforeinstallprompt', (e) => {
      console.log('PWA: Install prompt available');
      e.preventDefault();
      this.deferredPrompt = e;
    });

    window.addEventListener('appinstalled', () => {
      console.log('PWA: App installed');
      this.deferredPrompt = null;
    });
  }

  private async setupServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        this.registration = await navigator.serviceWorker.register('/sw.js');
        console.log('PWA: Service Worker registered', this.registration);
        
        // Check for updates
        this.registration.addEventListener('updatefound', () => {
          const newWorker = this.registration?.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('PWA: New content available, please refresh');
                this.showUpdateNotification();
              }
            });
          }
        });
      } catch (error) {
        console.error('PWA: Service Worker registration failed', error);
      }
    }
  }

  public async installApp(): Promise<boolean> {
    if (!this.deferredPrompt) {
      return false;
    }

    try {
      this.deferredPrompt.prompt();
      const { outcome } = await this.deferredPrompt.userChoice;
      console.log('PWA: Install prompt outcome', outcome);
      
      if (outcome === 'accepted') {
        this.deferredPrompt = null;
        return true;
      }
      return false;
    } catch (error) {
      console.error('PWA: Install failed', error);
      return false;
    }
  }

  public canInstall(): boolean {
    return this.deferredPrompt !== null;
  }

  public isInstalled(): boolean {
    return window.matchMedia('(display-mode: standalone)').matches ||
           (window.navigator as any).standalone === true;
  }

  public isOnline(): boolean {
    return navigator.onLine;
  }

  public async getRegistration(): Promise<ServiceWorkerRegistration | null> {
    if (!this.registration && 'serviceWorker' in navigator) {
      this.registration = await navigator.serviceWorker.ready;
    }
    return this.registration;
  }

  public async updateApp(): Promise<void> {
    if (this.registration) {
      await this.registration.update();
    }
  }

  public async clearCache(): Promise<void> {
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      );
      console.log('PWA: Cache cleared');
    }
  }

  private showUpdateNotification() {
    // You can integrate this with your notification system
    if (confirm('New version available! Refresh to update?')) {
      window.location.reload();
    }
  }

  public async requestNotificationPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      return 'denied';
    }

    if (Notification.permission === 'default') {
      return await Notification.requestPermission();
    }

    return Notification.permission;
  }

  public async showNotification(title: string, options?: NotificationOptions): Promise<void> {
    if (Notification.permission === 'granted') {
      const registration = await this.getRegistration();
      if (registration) {
        registration.showNotification(title, {
          icon: '/icons/icon-192x192.png',
          badge: '/icons/icon-72x72.png',
          ...options
        });
      }
    }
  }
}

// Hook for React components
export function usePWA() {
  const pwa = PWAManager.getInstance();
  
  return {
    canInstall: pwa.canInstall(),
    isInstalled: pwa.isInstalled(),
    isOnline: pwa.isOnline(),
    installApp: () => pwa.installApp(),
    updateApp: () => pwa.updateApp(),
    clearCache: () => pwa.clearCache(),
    requestNotificationPermission: () => pwa.requestNotificationPermission(),
    showNotification: (title: string, options?: NotificationOptions) => 
      pwa.showNotification(title, options)
  };
}

// Utility functions
export const isPWA = (): boolean => {
  return window.matchMedia('(display-mode: standalone)').matches ||
         (window.navigator as any).standalone === true;
};

export const isOnline = (): boolean => {
  return navigator.onLine;
};

export const getConnectionInfo = () => {
  const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
  
  if (connection) {
    return {
      effectiveType: connection.effectiveType,
      downlink: connection.downlink,
      rtt: connection.rtt,
      saveData: connection.saveData
    };
  }
  
  return null;
};