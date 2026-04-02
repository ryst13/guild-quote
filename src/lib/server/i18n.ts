import en from '$lib/i18n/en.json';
import es from '$lib/i18n/es.json';
import pt from '$lib/i18n/pt.json';
import ro from '$lib/i18n/ro.json';
import zhYue from '$lib/i18n/zh-yue.json';

export type SupportedLanguage = 'en' | 'es' | 'pt' | 'ro' | 'zh-yue';

export type Translations = typeof en;

const translations: Record<SupportedLanguage, Translations> = {
  en,
  es: es as Translations,
  pt: pt as Translations,
  ro: ro as Translations,
  'zh-yue': zhYue as Translations,
};

export const SUPPORTED_LANGUAGES: { code: SupportedLanguage; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'pt', label: 'Português' },
  { code: 'ro', label: 'Română' },
  { code: 'zh-yue', label: '粵語 (Cantonese)' },
];

export function getTranslations(lang: SupportedLanguage = 'en'): Translations {
  return translations[lang] || translations.en;
}
