/**
 * Helper untuk error messages via nestjs-i18n.
 *
 * Translation files ada di `src/i18n/{lang}/errors.json`.
 * Locale resolver: query `?lang=id`, header `x-lang`, atau `Accept-Language`
 * (fallback ke `process.env.LANGUAGE` / `id`).
 *
 * Usage:
 *   throw new BadRequestException(t('account_not_found'));
 *   throw new BadRequestException(t('export_range_too_long', { maxDays: 31 }));
 */

import { I18nContext } from 'nestjs-i18n';

export function t(key: string, args?: Record<string, string | number>): string {
  const ctx = I18nContext.current();
  if (!ctx) return key;
  return ctx.t(`errors.${key}`, { args });
}
