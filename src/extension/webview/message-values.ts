import { ReviewMode } from 'codivew/core';

export function stringValue(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length === 0 ? undefined : trimmed;
}

export function stringArrayValue(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const values = value.map(stringValue);
  if (values.some((item) => item === undefined)) return undefined;
  return [...new Set(values as string[])];
}

export function numberValue(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 ? value : undefined;
}

export function positiveIntegerValue(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isInteger(value) && value > 0 ? value : undefined;
}

export function reviewMode(value: unknown): ReviewMode | undefined {
  return Object.values(ReviewMode).includes(value as ReviewMode)
    ? (value as ReviewMode)
    : undefined;
}

export function validHttpUrl(value: unknown): string | undefined {
  const string = stringValue(value);
  if (string === undefined) return undefined;
  try {
    const url = new URL(string);
    return url.protocol === 'http:' || url.protocol === 'https:'
      ? string.replace(/\/$/, '')
      : undefined;
  } catch {
    return undefined;
  }
}
