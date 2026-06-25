import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';

export type CurrencyType = 'USD' | 'GBP' | 'CAD' | 'AUD';
export type UnitSystemType = 'metric' | 'imperial';

const CURRENCY_KEY = '@pethorizon_currency';
const UNIT_SYSTEM_KEY = '@pethorizon_unit_system';

const CURRENCY_SYMBOLS: Record<CurrencyType, string> = {
  USD: '$',
  GBP: '£',
  CAD: '$',
  AUD: '$',
};

export function useLocalization() {
  const [currency, setCurrencyState] = useState<CurrencyType>('USD');
  const [unitSystem, setUnitSystemState] = useState<UnitSystemType>('metric');
  const [loading, setLoading] = useState(true);

  // Load settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const storedCurrency = await AsyncStorage.getItem(CURRENCY_KEY);
        const storedUnit = await AsyncStorage.getItem(UNIT_SYSTEM_KEY);

        if (storedCurrency) {
          setCurrencyState(storedCurrency as CurrencyType);
        } else {
          // Detect device country/locale and set sensible default
          const locales = Localization.getLocales();
          const countryCode = locales[0]?.regionCode?.toUpperCase();
          if (countryCode === 'GB') {
            setCurrencyState('GBP');
          } else if (countryCode === 'CA') {
            setCurrencyState('CAD');
          } else if (countryCode === 'AU') {
            setCurrencyState('AUD');
          } else {
            setCurrencyState('USD');
          }
        }

        if (storedUnit) {
          setUnitSystemState(storedUnit as UnitSystemType);
        } else {
          const locales = Localization.getLocales();
          const countryCode = locales[0]?.regionCode?.toUpperCase();
          // US uses Imperial by default
          if (countryCode === 'US') {
            setUnitSystemState('imperial');
          } else {
            setUnitSystemState('metric');
          }
        }
      } catch (e) {
        // Fallback silently
      } finally {
        setLoading(false);
      }
    };
    void loadSettings();
  }, []);

  const setCurrency = useCallback(async (newCurrency: CurrencyType) => {
    try {
      setCurrencyState(newCurrency);
      await AsyncStorage.setItem(CURRENCY_KEY, newCurrency);
    } catch (e) {
      // Fail silently
    }
  }, []);

  const setUnitSystem = useCallback(async (newUnitSystem: UnitSystemType) => {
    try {
      setUnitSystemState(newUnitSystem);
      await AsyncStorage.setItem(UNIT_SYSTEM_KEY, newUnitSystem);
    } catch (e) {
      // Fail silently
    }
  }, []);

  const formatCurrency = useCallback((amount: number | string): string => {
    const numericAmount = typeof amount === 'string' ? parseFloat(amount) || 0 : amount;
    const symbol = CURRENCY_SYMBOLS[currency] || '$';
    
    // Renders currency suffix for CAD/AUD to distinguish from USD if preferred,
    // or standard symbol. We will support clean App Store standard format.
    if (currency === 'CAD') {
      return `${symbol}${numericAmount.toFixed(2)} CAD`;
    }
    if (currency === 'AUD') {
      return `${symbol}${numericAmount.toFixed(2)} AUD`;
    }
    return `${symbol}${numericAmount.toFixed(2)}`;
  }, [currency]);

  const formatWeight = useCallback((weightInKg: number | string): string => {
    const kg = typeof weightInKg === 'string' ? parseFloat(weightInKg) || 0 : weightInKg;
    if (unitSystem === 'imperial') {
      const lbs = kg * 2.20462;
      return `${lbs.toFixed(1)} lbs`;
    }
    return `${kg.toFixed(1)} kg`;
  }, [unitSystem]);

  return {
    currency,
    unitSystem,
    setCurrency,
    setUnitSystem,
    formatCurrency,
    formatWeight,
    loading,
  };
}
