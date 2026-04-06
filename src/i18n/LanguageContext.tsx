import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { TRANSLATIONS, AppLocale, TranslationKeys } from './translations';

const STORAGE_KEY = 'cuentero_app_language';
const DEFAULT_LOCALE: AppLocale = 'es';

type LanguageContextType = {
  appLocale: AppLocale;
  setAppLocale: (locale: AppLocale) => Promise<void>;
  t: TranslationKeys;
};

const LanguageContext = createContext<LanguageContextType>({
  appLocale: DEFAULT_LOCALE,
  setAppLocale: async () => {},
  t: TRANSLATIONS[DEFAULT_LOCALE],
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [appLocale, setLocaleState] = useState<AppLocale>(DEFAULT_LOCALE);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      if (stored && stored in TRANSLATIONS) {
        setLocaleState(stored as AppLocale);
      }
    });
  }, []);

  const setAppLocale = async (locale: AppLocale) => {
    setLocaleState(locale);
    await AsyncStorage.setItem(STORAGE_KEY, locale);
  };

  return (
    <LanguageContext.Provider
      value={{ appLocale, setAppLocale, t: TRANSLATIONS[appLocale] }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
