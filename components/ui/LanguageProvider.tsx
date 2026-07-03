import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import { useDispatch, useSelector } from 'react-redux';
import { setSession } from '@/redux/action';
import { patchUserProfile } from '@/services/users/userApi';
import { en } from '../../constants/translations/en';
import { de } from '../../constants/translations/de';
import { es } from '../../constants/translations/es';
import { fr } from '../../constants/translations/fr';
import { it } from '../../constants/translations/it';
import { pt } from '../../constants/translations/pt';
import { ru } from '../../constants/translations/ru';
import { tr } from '../../constants/translations/tr';
import { ar } from '../../constants/translations/ar';
import { zh } from '../../constants/translations/zh';

export type LanguageCode = 'en' | 'de' | 'es' | 'fr' | 'it' | 'pt' | 'ru' | 'tr' | 'ar' | 'zh';

const translations: Record<LanguageCode, Record<string, string>> = { en, de, es, fr, it, pt, ru, tr, ar, zh };

interface LanguageContextType {
  locale: LanguageCode;
  changeLanguage: (lang: LanguageCode) => Promise<void>;
  t: (key: string, defaultVal?: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useDispatch();
  const auth = useSelector((state: any) => state.auth);
  const user = auth?.user;
  const token = auth?.token;

  const [locale, setLocale] = useState<LanguageCode>('en');
  const hasInitializedRef = useRef(false);

  // Helper to determine the initial language
  const initializeLanguage = async () => {
    try {
      // 1. Check User profile if logged in
      if (user?.preferredLanguage) {
        setLocale(user.preferredLanguage);
        await AsyncStorage.setItem('@user_preferred_language', user.preferredLanguage);
        return;
      }

      // 2. Check local storage
      const cached = await AsyncStorage.getItem('@user_preferred_language');
      if (cached && ['en', 'de', 'es', 'fr', 'it', 'pt', 'ru', 'tr', 'ar', 'zh'].includes(cached)) {
        setLocale(cached as LanguageCode);
        return;
      }

      // 3. Fallback to system locale
      const locales = Localization.getLocales();
      if (locales && locales.length > 0) {
        const sysLang = locales[0].languageCode?.toLowerCase() || '';
        const matched = ['en', 'de', 'es', 'fr', 'it', 'pt', 'ru', 'tr', 'ar', 'zh'].find((code) => sysLang.startsWith(code));
        if (matched) {
          setLocale(matched as LanguageCode);
          await AsyncStorage.setItem('@user_preferred_language', matched);
          return;
        }
      }

      // Default fallback
      setLocale('en');
    } catch (e) {
      setLocale('en');
    }
  };

  // Run initialization on mount or session change
  useEffect(() => {
    void initializeLanguage();
  }, [user?.preferredLanguage]);

  const changeLanguage = async (newLang: LanguageCode) => {
    try {
      setLocale(newLang);
      await AsyncStorage.setItem('@user_preferred_language', newLang);

      // If logged in, sync with database and update Redux session
      if (token && user) {
        // Optimistic Redux update
        const updatedUser = { ...user, preferredLanguage: newLang };
        dispatch(setSession({ token, user: updatedUser }) as any);

        // Sync with API
        await patchUserProfile(token, { preferredLanguage: newLang });
      }
    } catch (e) {
      // Fail silently
    }
  };

  const t = (key: string, defaultVal?: string): string => {
    const dict = translations[locale] || translations.en;
    return dict[key] || defaultVal || dict[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ locale, changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
