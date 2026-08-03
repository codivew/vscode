import { getLocale } from '../../localization.js';

export function formatNumber(value: number): string {
  return value.toLocaleString(getLocale());
}
