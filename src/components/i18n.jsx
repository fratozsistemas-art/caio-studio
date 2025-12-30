import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import ptBR from './locales/pt-BR.json';
import enUS from './locales/en-US.json';

// Get saved language from localStorage or default to en-US
const savedLanguage = localStorage.getItem('app_language') || 'en-US';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      'pt-BR': { translation: ptBR },
      'en-US': { translation: enUS }
    },
    lng: savedLanguage,
    fallbackLng: 'en-US',
    interpolation: {
      escapeValue: false // React already escapes values
    },
    react: {
      useSuspense: false // Disable suspense to avoid loading issues
    }
  });

// Save language changes to localStorage
i18n.on('languageChanged', (lng) => {
  localStorage.setItem('app_language', lng);
});

export default i18n;