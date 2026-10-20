'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import ru from './ru';
import en from './en';

type Translations = typeof ru;
type NestedKeyOf<T> = keyof T;

interface I18nContextType {
    language: 'ru' | 'en';
    setLanguage: (lang: 'ru' | 'en') => void;
    t: (path: string) => string;
}

const translations = { ru, en };

function getNestedValue(obj: Record<string, unknown>, path: string): string {
    const keys = path.split('.');
    let result: unknown = obj;
    for (const key of keys) {
        if (result && typeof result === 'object' && key in result) {
            result = (result as Record<string, unknown>)[key];
        } else {
            return path;
        }
    }
    return typeof result === 'string' ? result : path;
}

const I18nContext = createContext<I18nContextType | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
    const [language, setLanguageState] = useState<'ru' | 'en'>('ru');

    useEffect(() => {
        const saved = localStorage.getItem('language') as 'ru' | 'en' | null;
        if (saved && (saved === 'ru' || saved === 'en')) {
            setLanguageState(saved);
        }
    }, []);

    useEffect(() => {
        document.documentElement.lang = language;
    }, [language]);

    const setLanguage = (lang: 'ru' | 'en') => {
        setLanguageState(lang);
        localStorage.setItem('language', lang);
    };

    const t = (path: string): string => {
        return getNestedValue(translations[language] as Record<string, unknown>, path);
    };

    return (
        <I18nContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </I18nContext.Provider>
    );
}

export function useTranslation() {
    const context = useContext(I18nContext);
    if (!context) {
        throw new Error('useTranslation must be used within an I18nProvider');
    }
    return context;
}
