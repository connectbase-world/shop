import { createContext, useState, useContext, useCallback } from 'react'
import type { ReactNode } from 'react'
import ko from './ko'
import en from './en'
import type { Translations } from './ko'

export type Locale = 'ko' | 'en'

const STORAGE_KEY = 'shop_locale'

const translations: Record<Locale, Translations> = { ko, en }

type I18nContextType = {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: Translations
}

export const I18nContext = createContext<I18nContextType>({
  locale: 'ko',
  setLocale: () => {},
  t: ko,
})

function getInitialLocale(): Locale {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'ko' || stored === 'en') return stored
  } catch { /* ignore */ }
  return 'ko'
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(getInitialLocale)

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale)
    try {
      localStorage.setItem(STORAGE_KEY, newLocale)
    } catch { /* ignore */ }
  }, [])

  const value = {
    locale,
    setLocale,
    t: translations[locale],
  }

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  return useContext(I18nContext)
}

// 카테고리 키를 번역하는 헬퍼
const CATEGORY_MAP: Record<string, keyof Translations['categories']> = {
  all: 'all',
  '상의': 'tops',
  '하의': 'bottoms',
  '아우터': 'outerwear',
  '신발': 'shoes',
  '악세서리': 'accessories',
}

export function getCategoryLabel(key: string, t: Translations): string {
  const mapped = CATEGORY_MAP[key]
  return mapped ? t.categories[mapped] : key
}
