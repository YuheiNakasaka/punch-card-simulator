import type { Locale, Translations } from './types';
import { en } from './en';
import { ja } from './ja';

const STORAGE_KEY = 'punch-card-locale';

const translations: Record<Locale, Translations> = { en, ja };

let currentLocale: Locale = 'en';
const listeners: Array<(locale: Locale) => void> = [];

export function getLocale(): Locale {
  return currentLocale;
}

export function initLocale(): void {
  const stored = localStorage.getItem(STORAGE_KEY) as Locale | null;
  if (stored && translations[stored]) {
    currentLocale = stored;
    return;
  }
  const browserLang = navigator.language.slice(0, 2);
  currentLocale = browserLang === 'ja' ? 'ja' : 'en';
}

export function setLocale(locale: Locale): void {
  if (locale === currentLocale) return;
  currentLocale = locale;
  localStorage.setItem(STORAGE_KEY, locale);
  for (const fn of listeners) {
    fn(locale);
  }
}

export function onLocaleChange(fn: (locale: Locale) => void): void {
  listeners.push(fn);
}

export function t(key: string, params?: Record<string, string | number>): string {
  const parts = key.split('.');
  let value: unknown = translations[currentLocale];
  for (const part of parts) {
    if (value == null || typeof value !== 'object') return key;
    value = (value as Record<string, unknown>)[part];
  }
  if (typeof value !== 'string') return key;
  if (!params) return value;
  return value.replace(/\{(\w+)\}/g, (_, k) => {
    return params[k] !== undefined ? String(params[k]) : `{${k}}`;
  });
}

export function translateDOM(): void {
  document.querySelectorAll<HTMLElement>('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n!;
    el.textContent = t(key);
  });
  document.querySelectorAll<HTMLElement>('[data-i18n-title]').forEach(el => {
    const key = el.dataset.i18nTitle!;
    el.title = t(key);
  });
  document.querySelectorAll<HTMLElement>('[data-i18n-html]').forEach(el => {
    const key = el.dataset.i18nHtml!;
    el.innerHTML = t(key);
  });
  const titleKey = 'meta.title';
  document.title = t(titleKey);
}

export type { Locale, Translations };
