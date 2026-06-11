// Single source of truth for snapshot languages — shared by client (dropdown)
// and server (i18n translations, filename validation). Adding a language here
// without a translations entry in $lib/server/i18n.ts is a compile error there.
export type SupportedLanguage = 'en' | 'es' | 'pt' | 'ro' | 'zh-yue';

export const SUPPORTED_LANGUAGES: { code: SupportedLanguage; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'pt', label: 'Português' },
  { code: 'ro', label: 'Română' },
  { code: 'zh-yue', label: '粵語 (Cantonese)' },
];
