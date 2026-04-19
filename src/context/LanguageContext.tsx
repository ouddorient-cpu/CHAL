"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Language, TranslationKey, t as translate } from '@/lib/translations';

interface LanguageContextType {
    lang: Language;
    toggleLanguage: () => void;
    t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
    const [lang, setLang] = useState<Language>('fr');

    useEffect(() => {
        const saved = localStorage.getItem('ch7al_lang') as Language;
        if (saved === 'fr' || saved === 'dar') {
            setLang(saved);
        }
    }, []);

    const toggleLanguage = () => {
        setLang(prev => {
            const next = prev === 'fr' ? 'dar' : 'fr';
            localStorage.setItem('ch7al_lang', next);
            return next;
        });
    };

    const t = (key: TranslationKey) => translate(key, lang);

    return (
        <LanguageContext.Provider value={{ lang, toggleLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
}
