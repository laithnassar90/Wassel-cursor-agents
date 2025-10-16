import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { 
  Globe, 
  Check, 
  ChevronDown,
  Settings,
  DollarSign,
  MapPin,
  Clock
} from 'lucide-react';
import { useI18n, Language, Currency, Region } from '../utils/i18n';

interface LanguageSelectorProps {
  onLanguageChange?: (language: string) => void;
  onRegionChange?: (region: string) => void;
  showAdvanced?: boolean;
}

export function LanguageSelector({ 
  onLanguageChange, 
  onRegionChange, 
  showAdvanced = false 
}: LanguageSelectorProps) {
  const {
    t,
    setLanguage,
    setRegion,
    getCurrentLanguage,
    getCurrentRegion,
    getCurrentCurrency,
    getCurrentTimezone,
    getSupportedLanguages,
    getSupportedCurrencies,
    getSupportedRegions,
    getCurrentLanguageInfo,
    getCurrentRegionInfo,
    isRTL,
    addChangeListener,
    removeChangeListener
  } = useI18n();

  const [currentLanguage, setCurrentLanguage] = useState<string>('');
  const [currentRegion, setCurrentRegion] = useState<string>('');
  const [languages, setLanguages] = useState<Language[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [isRTLMode, setIsRTLMode] = useState<boolean>(false);

  useEffect(() => {
    // Load initial data
    setCurrentLanguage(getCurrentLanguage());
    setCurrentRegion(getCurrentRegion());
    setLanguages(getSupportedLanguages());
    setCurrencies(getSupportedCurrencies());
    setRegions(getSupportedRegions());
    setIsRTLMode(isRTL());

    // Listen for changes
    const handleChange = () => {
      setCurrentLanguage(getCurrentLanguage());
      setCurrentRegion(getCurrentRegion());
      setIsRTLMode(isRTL());
    };

    addChangeListener(handleChange);
    return () => removeChangeListener(handleChange);
  }, []);

  const handleLanguageChange = (languageCode: string) => {
    setLanguage(languageCode);
    onLanguageChange?.(languageCode);
  };

  const handleRegionChange = (regionCode: string) => {
    setRegion(regionCode);
    onRegionChange?.(regionCode);
  };

  const currentLanguageInfo = getCurrentLanguageInfo();
  const currentRegionInfo = getCurrentRegionInfo();

  return (
    <div className="space-y-4">
      {/* Language Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            {t('common.language', { defaultValue: 'Language' })}
          </CardTitle>
          <CardDescription>
            {t('common.selectLanguage', { defaultValue: 'Choose your preferred language' })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {languages.map((language) => (
              <Button
                key={language.code}
                variant={currentLanguage === language.code ? 'default' : 'outline'}
                className="h-auto p-4 flex items-center justify-between"
                onClick={() => handleLanguageChange(language.code)}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{language.flag}</span>
                  <div className="text-left">
                    <div className="font-medium">{language.nativeName}</div>
                    <div className="text-sm text-muted-foreground">{language.name}</div>
                  </div>
                </div>
                {currentLanguage === language.code && (
                  <Check className="h-4 w-4" />
                )}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Region Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            {t('common.region', { defaultValue: 'Region' })}
          </CardTitle>
          <CardDescription>
            {t('common.selectRegion', { defaultValue: 'Select your region for localized features' })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {regions.map((region) => (
              <Button
                key={region.code}
                variant={currentRegion === region.code ? 'default' : 'outline'}
                className="h-auto p-4 flex items-center justify-between"
                onClick={() => handleRegionChange(region.code)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium">{region.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {region.currency} • {region.timezone}
                    </div>
                  </div>
                </div>
                {currentRegion === region.code && (
                  <Check className="h-4 w-4" />
                )}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Current Settings Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            {t('common.currentSettings', { defaultValue: 'Current Settings' })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Globe className="h-4 w-4" />
                {t('common.language', { defaultValue: 'Language' })}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">{currentLanguageInfo?.flag}</span>
                <div>
                  <div className="font-medium">{currentLanguageInfo?.nativeName}</div>
                  <div className="text-sm text-muted-foreground">{currentLanguageInfo?.name}</div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <MapPin className="h-4 w-4" />
                {t('common.region', { defaultValue: 'Region' })}
              </div>
              <div>
                <div className="font-medium">{currentRegionInfo?.name}</div>
                <div className="text-sm text-muted-foreground">{currentRegionInfo?.timezone}</div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <DollarSign className="h-4 w-4" />
                {t('common.currency', { defaultValue: 'Currency' })}
              </div>
              <div>
                <div className="font-medium">{getCurrentCurrency()}</div>
                <div className="text-sm text-muted-foreground">
                  {currencies.find(c => c.code === getCurrentCurrency())?.name}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Clock className="h-4 w-4" />
                {t('common.timezone', { defaultValue: 'Timezone' })}
              </div>
              <div>
                <div className="font-medium">{getCurrentTimezone()}</div>
                <div className="text-sm text-muted-foreground">
                  {new Date().toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          {isRTLMode && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 text-blue-800">
                <Globe className="h-4 w-4" />
                <span className="text-sm font-medium">
                  {t('common.rtlMode', { defaultValue: 'Right-to-Left mode enabled' })}
                </span>
              </div>
              <p className="text-sm text-blue-700 mt-1">
                {t('common.rtlDescription', { 
                  defaultValue: 'The interface has been adjusted for right-to-left languages' 
                })}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Advanced Settings */}
      {showAdvanced && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              {t('common.advancedSettings', { defaultValue: 'Advanced Settings' })}
            </CardTitle>
            <CardDescription>
              {t('common.advancedDescription', { 
                defaultValue: 'Fine-tune your localization preferences' 
              })}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Date Format */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {t('common.dateFormat', { defaultValue: 'Date Format' })}
              </label>
              <Select defaultValue={currentLanguageInfo?.dateFormat}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                  <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                  <SelectItem value="YYYY/MM/DD">YYYY/MM/DD</SelectItem>
                  <SelectItem value="DD.MM.YYYY">DD.MM.YYYY</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Time Format */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {t('common.timeFormat', { defaultValue: 'Time Format' })}
              </label>
              <Select defaultValue={currentLanguageInfo?.timeFormat}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="12h">12-hour (AM/PM)</SelectItem>
                  <SelectItem value="24h">24-hour</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Number Format */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {t('common.numberFormat', { defaultValue: 'Number Format' })}
              </label>
              <div className="text-sm text-muted-foreground">
                {t('common.numberFormatExample', { 
                  defaultValue: 'Example: 1,234.56 (thousands separator: comma, decimal: period)' 
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}