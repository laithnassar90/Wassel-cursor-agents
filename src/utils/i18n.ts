// Internationalization (i18n) and Global Features

export interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  rtl: boolean;
  currency: string;
  dateFormat: string;
  timeFormat: '12h' | '24h';
  numberFormat: {
    decimal: string;
    thousands: string;
  };
}

export interface Translation {
  [key: string]: string | Translation;
}

export interface Currency {
  code: string;
  name: string;
  symbol: string;
  decimalPlaces: number;
  exchangeRate: number; // To USD
  lastUpdated: string;
}

export interface Region {
  code: string;
  name: string;
  currency: string;
  timezone: string;
  phoneCode: string;
  addressFormat: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  paymentMethods: string[];
  regulations: {
    dataProtection: string;
    rideSharing: string;
    payment: string;
  };
}

export interface LocalizedContent {
  language: string;
  region: string;
  currency: string;
  timezone: string;
  dateFormat: string;
  timeFormat: string;
  numberFormat: {
    decimal: string;
    thousands: string;
  };
}

export class I18nService {
  private static instance: I18nService;
  private currentLanguage: string = 'en';
  private currentRegion: string = 'US';
  private translations: Map<string, Translation> = new Map();
  private languages: Map<string, Language> = new Map();
  private currencies: Map<string, Currency> = new Map();
  private regions: Map<string, Region> = new Map();
  private listeners: Set<() => void> = new Set();

  private constructor() {
    this.initializeLanguages();
    this.initializeCurrencies();
    this.initializeRegions();
    this.loadTranslations();
    this.loadUserPreferences();
  }

  public static getInstance(): I18nService {
    if (!I18nService.instance) {
      I18nService.instance = new I18nService();
    }
    return I18nService.instance;
  }

  // Language Management
  private initializeLanguages(): void {
    const languages: Language[] = [
      {
        code: 'en',
        name: 'English',
        nativeName: 'English',
        flag: '🇺🇸',
        rtl: false,
        currency: 'USD',
        dateFormat: 'MM/DD/YYYY',
        timeFormat: '12h',
        numberFormat: { decimal: '.', thousands: ',' }
      },
      {
        code: 'es',
        name: 'Spanish',
        nativeName: 'Español',
        flag: '🇪🇸',
        rtl: false,
        currency: 'EUR',
        dateFormat: 'DD/MM/YYYY',
        timeFormat: '24h',
        numberFormat: { decimal: ',', thousands: '.' }
      },
      {
        code: 'fr',
        name: 'French',
        nativeName: 'Français',
        flag: '🇫🇷',
        rtl: false,
        currency: 'EUR',
        dateFormat: 'DD/MM/YYYY',
        timeFormat: '24h',
        numberFormat: { decimal: ',', thousands: ' ' }
      },
      {
        code: 'de',
        name: 'German',
        nativeName: 'Deutsch',
        flag: '🇩🇪',
        rtl: false,
        currency: 'EUR',
        dateFormat: 'DD.MM.YYYY',
        timeFormat: '24h',
        numberFormat: { decimal: ',', thousands: '.' }
      },
      {
        code: 'it',
        name: 'Italian',
        nativeName: 'Italiano',
        flag: '🇮🇹',
        rtl: false,
        currency: 'EUR',
        dateFormat: 'DD/MM/YYYY',
        timeFormat: '24h',
        numberFormat: { decimal: ',', thousands: '.' }
      },
      {
        code: 'pt',
        name: 'Portuguese',
        nativeName: 'Português',
        flag: '🇵🇹',
        rtl: false,
        currency: 'EUR',
        dateFormat: 'DD/MM/YYYY',
        timeFormat: '24h',
        numberFormat: { decimal: ',', thousands: '.' }
      },
      {
        code: 'ru',
        name: 'Russian',
        nativeName: 'Русский',
        flag: '🇷🇺',
        rtl: false,
        currency: 'RUB',
        dateFormat: 'DD.MM.YYYY',
        timeFormat: '24h',
        numberFormat: { decimal: ',', thousands: ' ' }
      },
      {
        code: 'zh',
        name: 'Chinese',
        nativeName: '中文',
        flag: '🇨🇳',
        rtl: false,
        currency: 'CNY',
        dateFormat: 'YYYY/MM/DD',
        timeFormat: '24h',
        numberFormat: { decimal: '.', thousands: ',' }
      },
      {
        code: 'ja',
        name: 'Japanese',
        nativeName: '日本語',
        flag: '🇯🇵',
        rtl: false,
        currency: 'JPY',
        dateFormat: 'YYYY/MM/DD',
        timeFormat: '24h',
        numberFormat: { decimal: '.', thousands: ',' }
      },
      {
        code: 'ko',
        name: 'Korean',
        nativeName: '한국어',
        flag: '🇰🇷',
        rtl: false,
        currency: 'KRW',
        dateFormat: 'YYYY.MM.DD',
        timeFormat: '24h',
        numberFormat: { decimal: '.', thousands: ',' }
      },
      {
        code: 'ar',
        name: 'Arabic',
        nativeName: 'العربية',
        flag: '🇸🇦',
        rtl: true,
        currency: 'SAR',
        dateFormat: 'DD/MM/YYYY',
        timeFormat: '24h',
        numberFormat: { decimal: '.', thousands: ',' }
      },
      {
        code: 'hi',
        name: 'Hindi',
        nativeName: 'हिन्दी',
        flag: '🇮🇳',
        rtl: false,
        currency: 'INR',
        dateFormat: 'DD/MM/YYYY',
        timeFormat: '24h',
        numberFormat: { decimal: '.', thousands: ',' }
      }
    ];

    languages.forEach(lang => {
      this.languages.set(lang.code, lang);
    });
  }

  private initializeCurrencies(): void {
    const currencies: Currency[] = [
      { code: 'USD', name: 'US Dollar', symbol: '$', decimalPlaces: 2, exchangeRate: 1.0, lastUpdated: new Date().toISOString() },
      { code: 'EUR', name: 'Euro', symbol: '€', decimalPlaces: 2, exchangeRate: 0.85, lastUpdated: new Date().toISOString() },
      { code: 'GBP', name: 'British Pound', symbol: '£', decimalPlaces: 2, exchangeRate: 0.73, lastUpdated: new Date().toISOString() },
      { code: 'JPY', name: 'Japanese Yen', symbol: '¥', decimalPlaces: 0, exchangeRate: 110.0, lastUpdated: new Date().toISOString() },
      { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', decimalPlaces: 2, exchangeRate: 6.45, lastUpdated: new Date().toISOString() },
      { code: 'INR', name: 'Indian Rupee', symbol: '₹', decimalPlaces: 2, exchangeRate: 74.0, lastUpdated: new Date().toISOString() },
      { code: 'BRL', name: 'Brazilian Real', symbol: 'R$', decimalPlaces: 2, exchangeRate: 5.2, lastUpdated: new Date().toISOString() },
      { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', decimalPlaces: 2, exchangeRate: 1.25, lastUpdated: new Date().toISOString() },
      { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', decimalPlaces: 2, exchangeRate: 1.35, lastUpdated: new Date().toISOString() },
      { code: 'RUB', name: 'Russian Ruble', symbol: '₽', decimalPlaces: 2, exchangeRate: 73.0, lastUpdated: new Date().toISOString() },
      { code: 'SAR', name: 'Saudi Riyal', symbol: '﷼', decimalPlaces: 2, exchangeRate: 3.75, lastUpdated: new Date().toISOString() },
      { code: 'KRW', name: 'South Korean Won', symbol: '₩', decimalPlaces: 0, exchangeRate: 1180.0, lastUpdated: new Date().toISOString() }
    ];

    currencies.forEach(currency => {
      this.currencies.set(currency.code, currency);
    });
  }

  private initializeRegions(): void {
    const regions: Region[] = [
      {
        code: 'US',
        name: 'United States',
        currency: 'USD',
        timezone: 'America/New_York',
        phoneCode: '+1',
        addressFormat: {
          street: 'Street Address',
          city: 'City',
          state: 'State',
          postalCode: 'ZIP Code',
          country: 'Country'
        },
        paymentMethods: ['card', 'paypal', 'apple_pay', 'google_pay'],
        regulations: {
          dataProtection: 'CCPA',
          rideSharing: 'State regulations',
          payment: 'PCI DSS'
        }
      },
      {
        code: 'EU',
        name: 'European Union',
        currency: 'EUR',
        timezone: 'Europe/Brussels',
        phoneCode: '+32',
        addressFormat: {
          street: 'Street Address',
          city: 'City',
          state: 'Province',
          postalCode: 'Postal Code',
          country: 'Country'
        },
        paymentMethods: ['card', 'sepa', 'paypal', 'apple_pay', 'google_pay'],
        regulations: {
          dataProtection: 'GDPR',
          rideSharing: 'EU regulations',
          payment: 'PSD2'
        }
      },
      {
        code: 'UK',
        name: 'United Kingdom',
        currency: 'GBP',
        timezone: 'Europe/London',
        phoneCode: '+44',
        addressFormat: {
          street: 'Street Address',
          city: 'City',
          state: 'County',
          postalCode: 'Postcode',
          country: 'Country'
        },
        paymentMethods: ['card', 'paypal', 'apple_pay', 'google_pay'],
        regulations: {
          dataProtection: 'GDPR',
          rideSharing: 'UK regulations',
          payment: 'PSD2'
        }
      },
      {
        code: 'CA',
        name: 'Canada',
        currency: 'CAD',
        timezone: 'America/Toronto',
        phoneCode: '+1',
        addressFormat: {
          street: 'Street Address',
          city: 'City',
          state: 'Province',
          postalCode: 'Postal Code',
          country: 'Country'
        },
        paymentMethods: ['card', 'paypal', 'apple_pay', 'google_pay'],
        regulations: {
          dataProtection: 'PIPEDA',
          rideSharing: 'Provincial regulations',
          payment: 'PCI DSS'
        }
      },
      {
        code: 'AU',
        name: 'Australia',
        currency: 'AUD',
        timezone: 'Australia/Sydney',
        phoneCode: '+61',
        addressFormat: {
          street: 'Street Address',
          city: 'City',
          state: 'State',
          postalCode: 'Postcode',
          country: 'Country'
        },
        paymentMethods: ['card', 'paypal', 'apple_pay', 'google_pay'],
        regulations: {
          dataProtection: 'Privacy Act',
          rideSharing: 'State regulations',
          payment: 'PCI DSS'
        }
      }
    ];

    regions.forEach(region => {
      this.regions.set(region.code, region);
    });
  }

  // Translation Management
  private loadTranslations(): void {
    // Load English translations by default
    this.loadLanguageTranslations('en');
  }

  private async loadLanguageTranslations(languageCode: string): Promise<void> {
    try {
      // In a real implementation, load from API or files
      const translations = await this.fetchTranslations(languageCode);
      this.translations.set(languageCode, translations);
    } catch (error) {
      console.warn(`Failed to load translations for ${languageCode}:`, error);
      // Fallback to English
      if (languageCode !== 'en') {
        this.loadLanguageTranslations('en');
      }
    }
  }

  private async fetchTranslations(languageCode: string): Promise<Translation> {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Return sample translations
    const sampleTranslations: Record<string, Translation> = {
      en: {
        common: {
          save: 'Save',
          cancel: 'Cancel',
          delete: 'Delete',
          edit: 'Edit',
          add: 'Add',
          search: 'Search',
          loading: 'Loading...',
          error: 'Error',
          success: 'Success',
          confirm: 'Confirm',
          back: 'Back',
          next: 'Next',
          previous: 'Previous',
          close: 'Close',
          open: 'Open',
          yes: 'Yes',
          no: 'No'
        },
        navigation: {
          home: 'Home',
          rides: 'Rides',
          profile: 'Profile',
          settings: 'Settings',
          help: 'Help',
          about: 'About'
        },
        ride: {
          findRide: 'Find a Ride',
          offerRide: 'Offer a Ride',
          myRides: 'My Rides',
          rideHistory: 'Ride History',
          upcomingRides: 'Upcoming Rides',
          pastRides: 'Past Rides',
          cancelRide: 'Cancel Ride',
          rateRide: 'Rate Ride',
          shareRide: 'Share Ride'
        },
        payment: {
          payment: 'Payment',
          wallet: 'Wallet',
          addPayment: 'Add Payment Method',
          paymentMethods: 'Payment Methods',
          billing: 'Billing',
          receipts: 'Receipts',
          refunds: 'Refunds'
        },
        profile: {
          personalInfo: 'Personal Information',
          preferences: 'Preferences',
          notifications: 'Notifications',
          privacy: 'Privacy',
          security: 'Security',
          account: 'Account'
        }
      },
      es: {
        common: {
          save: 'Guardar',
          cancel: 'Cancelar',
          delete: 'Eliminar',
          edit: 'Editar',
          add: 'Agregar',
          search: 'Buscar',
          loading: 'Cargando...',
          error: 'Error',
          success: 'Éxito',
          confirm: 'Confirmar',
          back: 'Atrás',
          next: 'Siguiente',
          previous: 'Anterior',
          close: 'Cerrar',
          open: 'Abrir',
          yes: 'Sí',
          no: 'No'
        },
        navigation: {
          home: 'Inicio',
          rides: 'Viajes',
          profile: 'Perfil',
          settings: 'Configuración',
          help: 'Ayuda',
          about: 'Acerca de'
        },
        ride: {
          findRide: 'Buscar Viaje',
          offerRide: 'Ofrecer Viaje',
          myRides: 'Mis Viajes',
          rideHistory: 'Historial de Viajes',
          upcomingRides: 'Próximos Viajes',
          pastRides: 'Viajes Anteriores',
          cancelRide: 'Cancelar Viaje',
          rateRide: 'Calificar Viaje',
          shareRide: 'Compartir Viaje'
        },
        payment: {
          payment: 'Pago',
          wallet: 'Cartera',
          addPayment: 'Agregar Método de Pago',
          paymentMethods: 'Métodos de Pago',
          billing: 'Facturación',
          receipts: 'Recibos',
          refunds: 'Reembolsos'
        },
        profile: {
          personalInfo: 'Información Personal',
          preferences: 'Preferencias',
          notifications: 'Notificaciones',
          privacy: 'Privacidad',
          security: 'Seguridad',
          account: 'Cuenta'
        }
      }
    };

    return sampleTranslations[languageCode] || sampleTranslations.en;
  }

  // Public API
  public setLanguage(languageCode: string): void {
    if (!this.languages.has(languageCode)) {
      console.warn(`Language ${languageCode} not supported`);
      return;
    }

    this.currentLanguage = languageCode;
    this.loadLanguageTranslations(languageCode);
    this.saveUserPreferences();
    this.notifyListeners();
  }

  public setRegion(regionCode: string): void {
    if (!this.regions.has(regionCode)) {
      console.warn(`Region ${regionCode} not supported`);
      return;
    }

    this.currentRegion = regionCode;
    this.saveUserPreferences();
    this.notifyListeners();
  }

  public t(key: string, params?: Record<string, any>): string {
    const translation = this.getTranslation(key);
    if (!translation) {
      console.warn(`Translation missing for key: ${key}`);
      return key;
    }

    if (params) {
      return this.interpolate(translation, params);
    }

    return translation;
  }

  private getTranslation(key: string): string | null {
    const keys = key.split('.');
    let current: any = this.translations.get(this.currentLanguage);

    for (const k of keys) {
      if (current && typeof current === 'object' && k in current) {
        current = current[k];
      } else {
        return null;
      }
    }

    return typeof current === 'string' ? current : null;
  }

  private interpolate(template: string, params: Record<string, any>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return params[key] !== undefined ? String(params[key]) : match;
    });
  }

  // Formatting
  public formatCurrency(amount: number, currencyCode?: string): string {
    const currency = this.currencies.get(currencyCode || this.getCurrentCurrency());
    if (!currency) return `$${amount.toFixed(2)}`;

    const formattedAmount = this.formatNumber(amount, currency.decimalPlaces);
    return `${currency.symbol}${formattedAmount}`;
  }

  public formatNumber(number: number, decimals?: number): string {
    const language = this.languages.get(this.currentLanguage);
    if (!language) return number.toString();

    const options: Intl.NumberFormatOptions = {
      minimumFractionDigits: decimals || 0,
      maximumFractionDigits: decimals || 2
    };

    return new Intl.NumberFormat(language.code, options).format(number);
  }

  public formatDate(date: Date | string, format?: string): string {
    const language = this.languages.get(this.currentLanguage);
    if (!language) return new Date(date).toLocaleDateString();

    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString(language.code);
  }

  public formatTime(date: Date | string, format?: '12h' | '24h'): string {
    const language = this.languages.get(this.currentLanguage);
    if (!language) return new Date(date).toLocaleTimeString();

    const timeFormat = format || language.timeFormat;
    const options: Intl.DateTimeFormatOptions = {
      hour: 'numeric',
      minute: '2-digit',
      hour12: timeFormat === '12h'
    };

    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleTimeString(language.code, options);
  }

  public formatDateTime(date: Date | string): string {
    return `${this.formatDate(date)} ${this.formatTime(date)}`;
  }

  // Getters
  public getCurrentLanguage(): string {
    return this.currentLanguage;
  }

  public getCurrentRegion(): string {
    return this.currentRegion;
  }

  public getCurrentCurrency(): string {
    const region = this.regions.get(this.currentRegion);
    return region?.currency || 'USD';
  }

  public getCurrentTimezone(): string {
    const region = this.regions.get(this.currentRegion);
    return region?.timezone || 'UTC';
  }

  public getSupportedLanguages(): Language[] {
    return Array.from(this.languages.values());
  }

  public getSupportedCurrencies(): Currency[] {
    return Array.from(this.currencies.values());
  }

  public getSupportedRegions(): Region[] {
    return Array.from(this.regions.values());
  }

  public getCurrentLanguageInfo(): Language | null {
    return this.languages.get(this.currentLanguage) || null;
  }

  public getCurrentRegionInfo(): Region | null {
    return this.regions.get(this.currentRegion) || null;
  }

  public isRTL(): boolean {
    const language = this.languages.get(this.currentLanguage);
    return language?.rtl || false;
  }

  // Event Listeners
  public addChangeListener(listener: () => void): void {
    this.listeners.add(listener);
  }

  public removeChangeListener(listener: () => void): void {
    this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener());
  }

  // Persistence
  private loadUserPreferences(): void {
    try {
      const prefs = localStorage.getItem('i18n_preferences');
      if (prefs) {
        const { language, region } = JSON.parse(prefs);
        if (language) this.currentLanguage = language;
        if (region) this.currentRegion = region;
      }
    } catch (error) {
      console.warn('Failed to load i18n preferences:', error);
    }
  }

  private saveUserPreferences(): void {
    try {
      const prefs = {
        language: this.currentLanguage,
        region: this.currentRegion
      };
      localStorage.setItem('i18n_preferences', JSON.stringify(prefs));
    } catch (error) {
      console.warn('Failed to save i18n preferences:', error);
    }
  }

  // Currency Exchange
  public async updateExchangeRates(): Promise<void> {
    try {
      // In a real implementation, fetch from exchange rate API
      const rates = await this.fetchExchangeRates();
      
      for (const [code, rate] of Object.entries(rates)) {
        const currency = this.currencies.get(code);
        if (currency) {
          currency.exchangeRate = rate;
          currency.lastUpdated = new Date().toISOString();
        }
      }
      
      this.saveCurrencies();
    } catch (error) {
      console.warn('Failed to update exchange rates:', error);
    }
  }

  private async fetchExchangeRates(): Promise<Record<string, number>> {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      EUR: 0.85,
      GBP: 0.73,
      JPY: 110.0,
      CNY: 6.45,
      INR: 74.0,
      BRL: 5.2,
      CAD: 1.25,
      AUD: 1.35,
      RUB: 73.0,
      SAR: 3.75,
      KRW: 1180.0
    };
  }

  private saveCurrencies(): void {
    try {
      const data = JSON.stringify(Array.from(this.currencies.entries()));
      localStorage.setItem('currencies', data);
    } catch (error) {
      console.warn('Failed to save currencies:', error);
    }
  }

  private loadCurrencies(): void {
    try {
      const data = localStorage.getItem('currencies');
      if (data) {
        const currencies = JSON.parse(data);
        this.currencies = new Map(currencies);
      }
    } catch (error) {
      console.warn('Failed to load currencies:', error);
    }
  }
}

// React hook for i18n
export function useI18n() {
  const service = I18nService.getInstance();
  
  return {
    t: (key: string, params?: Record<string, any>) => service.t(key, params),
    setLanguage: (code: string) => service.setLanguage(code),
    setRegion: (code: string) => service.setRegion(code),
    getCurrentLanguage: () => service.getCurrentLanguage(),
    getCurrentRegion: () => service.getCurrentRegion(),
    getCurrentCurrency: () => service.getCurrentCurrency(),
    getCurrentTimezone: () => service.getCurrentTimezone(),
    getSupportedLanguages: () => service.getSupportedLanguages(),
    getSupportedCurrencies: () => service.getSupportedCurrencies(),
    getSupportedRegions: () => service.getSupportedRegions(),
    getCurrentLanguageInfo: () => service.getCurrentLanguageInfo(),
    getCurrentRegionInfo: () => service.getCurrentRegionInfo(),
    isRTL: () => service.isRTL(),
    formatCurrency: (amount: number, currencyCode?: string) => service.formatCurrency(amount, currencyCode),
    formatNumber: (number: number, decimals?: number) => service.formatNumber(number, decimals),
    formatDate: (date: Date | string, format?: string) => service.formatDate(date, format),
    formatTime: (date: Date | string, format?: '12h' | '24h') => service.formatTime(date, format),
    formatDateTime: (date: Date | string) => service.formatDateTime(date),
    addChangeListener: (listener: () => void) => service.addChangeListener(listener),
    removeChangeListener: (listener: () => void) => service.removeChangeListener(listener)
  };
}

// Export singleton instance
export const i18nService = I18nService.getInstance();