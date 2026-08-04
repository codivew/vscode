import { getLocale } from '../../shared/localization.js';

export function formatNumber(value: number): string {
  return value.toLocaleString(getLocale());
}
