import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations } from '../utils/translations.js';

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(localStorage.getItem('polimdo_lang') || 'id');

  useEffect(() => {
    localStorage.setItem('polimdo_lang', lang);
  }, [lang]);

  const toggleLanguage = () => {
    setLang(prev => (prev === 'id' ? 'en' : 'id'));
  };

  const t = (key) => {
    const dict = translations[lang] || translations.id;
    return dict[key] || translations.id[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
