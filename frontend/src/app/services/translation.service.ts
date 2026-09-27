import { Injectable, signal, computed } from '@angular/core';
import enTranslations from '../i18n/en.json';
import arTranslations from '../i18n/ar.json';

export type SupportedLanguage = 'en' | 'ar';

@Injectable({
  providedIn: 'root'
})
export class TranslationService {
  private readonly LANG_KEY = 'callmeprof_lang';

  // Default to English on first visit if no saved preference exists
  readonly currentLang = signal<SupportedLanguage>('en');
  readonly isRtl = computed(() => this.currentLang() === 'ar');

  private dictionaries: Record<SupportedLanguage, Record<string, any>> = {
    en: enTranslations,
    ar: arTranslations
  };

  constructor() {
    this.initLanguage();
  }

  private initLanguage(): void {
    try {
      const saved = localStorage.getItem(this.LANG_KEY);
      if (saved === 'ar' || saved === 'en') {
        this.setLanguage(saved);
      } else {
        this.setLanguage('en');
      }
    } catch {
      this.setLanguage('en');
    }
  }

  toggleLanguage(): void {
    const nextLang = this.currentLang() === 'en' ? 'ar' : 'en';
    this.setLanguage(nextLang);
  }

  setLanguage(lang: SupportedLanguage): void {
    this.currentLang.set(lang);
    try {
      localStorage.setItem(this.LANG_KEY, lang);
    } catch {
      // ignore in environments without localStorage
    }

    const isAr = lang === 'ar';
    const htmlEl = document.documentElement;
    const bodyEl = document.body;

    htmlEl.setAttribute('lang', lang);
    htmlEl.setAttribute('dir', isAr ? 'rtl' : 'ltr');
    if (bodyEl) {
      bodyEl.setAttribute('dir', isAr ? 'rtl' : 'ltr');
      bodyEl.setAttribute('lang', lang);
      if (isAr) {
        bodyEl.classList.add('rtl');
      } else {
        bodyEl.classList.remove('rtl');
      }
    }

    if (isAr) {
      htmlEl.classList.add('rtl');
    } else {
      htmlEl.classList.remove('rtl');
    }
  }

  /**
   * Translate a dotted key (e.g. 'nav.home', 'notes.lectures_count')
   * with optional replacement tokens (e.g. { count: 3 })
   */
  t(key: string, params?: Record<string, string | number>): string {
    const lang = this.currentLang();
    let text = this.resolveKey(this.dictionaries[lang], key);

    // Fallback to English if translation is missing
    if (text === undefined && lang !== 'en') {
      text = this.resolveKey(this.dictionaries.en, key);
    }

    if (text === undefined) {
      return key;
    }

    if (params) {
      return Object.entries(params).reduce((acc, [paramKey, paramVal]) => {
        return acc.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(paramVal));
      }, text);
    }

    return text;
  }

  private resolveKey(obj: any, path: string): string | undefined {
    if (!obj) return undefined;
    const parts = path.split('.');
    let current = obj;
    for (const part of parts) {
      if (current === undefined || current === null) return undefined;
      current = current[part];
    }
    return typeof current === 'string' ? current : undefined;
  }
}
