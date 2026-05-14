import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  DEFAULT_LANGUAGE,
  SUPPORTED_LANGUAGES,
  interpolate,
  translations,
} from './translations';

const STORAGE_KEY = 'rakuslide-language';

const LanguageContext = createContext(null);

function resolveInitialLanguage() {
  const stored = localStorage.getItem(STORAGE_KEY);

  if (stored === 'jp') {
    return 'ja';
  }

  if (stored && SUPPORTED_LANGUAGES.includes(stored)) {
    return stored;
  }

  const browserLanguage = navigator.language?.toLowerCase() ?? '';

  if (browserLanguage.startsWith('vi')) {
    return 'vi';
  }

  return DEFAULT_LANGUAGE;
}

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(resolveInitialLanguage);

  function setLanguage(nextLanguage) {
    if (!SUPPORTED_LANGUAGES.includes(nextLanguage)) {
      return;
    }

    setLanguageState(nextLanguage);
    localStorage.setItem(STORAGE_KEY, nextLanguage);
  }

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const t = useMemo(() => {
    const dictionary = translations[language];

    return function translate(key, vars = {}) {
      const value = key.split('.').reduce((current, part) => current?.[part], dictionary);

      if (typeof value !== 'string') {
        return key;
      }

      return interpolate(value, vars);
    };
  }, [language]);

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t,
    }),
    [language, t],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components -- hook is consumed by app components
export function useLanguage() {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }

  return context;
}
