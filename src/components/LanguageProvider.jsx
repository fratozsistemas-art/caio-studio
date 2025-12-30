import React from 'react';
import { useTranslation } from 'react-i18next';

// Thin wrapper to maintain backward compatibility
export const useLanguage = () => {
  const { i18n } = useTranslation();
  
  return {
    language: i18n.language,
    setLanguage: (lang) => i18n.changeLanguage(lang),
    toggleLanguage: () => {
      const newLang = i18n.language === 'pt-BR' ? 'en-US' : 'pt-BR';
      i18n.changeLanguage(newLang);
    }
  };
};

// Keep the provider for backward compatibility, but it's no longer needed
export function LanguageProvider({ children }) {
  return <>{children}</>;
}