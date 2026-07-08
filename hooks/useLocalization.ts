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


// Module-level global state to sync across all hook instances immediately
let globalCurrency: CurrencyType = 'USD';
let globalUnitSystem: UnitSystemType = 'metric';
let globalLoading = true;
let isInitialized = false;

const currencySetters = new Set<(val: CurrencyType) => void>();
const unitSystemSetters = new Set<(val: UnitSystemType) => void>();
const loadingSetters = new Set<(val: boolean) => void>();

const initializeSettings = async () => {
  if (isInitialized) return;
  try {
    const storedCurrency = await AsyncStorage.getItem(CURRENCY_KEY);
    const storedUnit = await AsyncStorage.getItem(UNIT_SYSTEM_KEY);

    if (storedCurrency) {
      globalCurrency = storedCurrency as CurrencyType;
    } else {
      const locales = Localization.getLocales();
      const countryCode = locales[0]?.regionCode?.toUpperCase();
      if (countryCode === 'GB') {
        globalCurrency = 'GBP';
      } else if (countryCode === 'CA') {
        globalCurrency = 'CAD';
      } else if (countryCode === 'AU') {
        globalCurrency = 'AUD';
      } else {
        globalCurrency = 'USD';
      }
    }

    if (storedUnit) {
      globalUnitSystem = storedUnit as UnitSystemType;
    } else {
      const locales = Localization.getLocales();
      const countryCode = locales[0]?.regionCode?.toUpperCase();
      if (countryCode === 'US') {
        globalUnitSystem = 'imperial';
      } else {
        globalUnitSystem = 'metric';
      }
    }
  } catch (e) {
    // Fail silently
  } finally {
    globalLoading = false;
    isInitialized = true;
    currencySetters.forEach((setter) => setter(globalCurrency));
    unitSystemSetters.forEach((setter) => setter(globalUnitSystem));
    loadingSetters.forEach((setter) => setter(globalLoading));
  }
};

// Start load immediately
void initializeSettings();

export function useLocalization() {
  const [currency, setLocalCurrency] = useState<CurrencyType>(globalCurrency);
  const [unitSystem, setLocalUnitSystem] = useState<UnitSystemType>(globalUnitSystem);
  const [loading, setLocalLoading] = useState<boolean>(globalLoading);

  useEffect(() => {
    currencySetters.add(setLocalCurrency);
    unitSystemSetters.add(setLocalUnitSystem);
    loadingSetters.add(setLocalLoading);

    // Sync values in case they changed before this component mounted
    setLocalCurrency(globalCurrency);
    setLocalUnitSystem(globalUnitSystem);
    setLocalLoading(globalLoading);

    return () => {
      currencySetters.delete(setLocalCurrency);
      unitSystemSetters.delete(setLocalUnitSystem);
      loadingSetters.delete(setLocalLoading);
    };
  }, []);

  const setCurrency = useCallback(async (newCurrency: CurrencyType) => {
    try {
      globalCurrency = newCurrency;
      currencySetters.forEach((setter) => setter(newCurrency));
      await AsyncStorage.setItem(CURRENCY_KEY, newCurrency);
    } catch (e) {
      // Fail silently
    }
  }, []);

  const setUnitSystem = useCallback(async (newUnitSystem: UnitSystemType) => {
    try {
      globalUnitSystem = newUnitSystem;
      unitSystemSetters.forEach((setter) => setter(newUnitSystem));
      await AsyncStorage.setItem(UNIT_SYSTEM_KEY, newUnitSystem);
    } catch (e) {
      // Fail silently
    }
  }, []);

  const formatCurrency = useCallback((amount: number | string): string => {
    const numericAmount = typeof amount === 'string' ? parseFloat(amount) || 0 : amount;
    const symbol = CURRENCY_SYMBOLS[globalCurrency] || '$';
    
    if (globalCurrency === 'CAD') {
      return `${symbol}${numericAmount.toFixed(2)} CAD`;
    }
    if (globalCurrency === 'AUD') {
      return `${symbol}${numericAmount.toFixed(2)} AUD`;
    }
    return `${symbol}${numericAmount.toFixed(2)}`;
  }, []);

  const formatWeight = useCallback((weightInKg: number | string): string => {
    const kg = typeof weightInKg === 'string' ? parseFloat(weightInKg) || 0 : weightInKg;
    if (globalUnitSystem === 'imperial') {
      const lbs = kg * 2.20462;
      return `${lbs.toFixed(1)} lbs`;
    }
    return `${kg.toFixed(1)} kg`;
  }, []);

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


