export function validHttpUrl(value: string): string | undefined {
  try {
    const url = new URL(value.trim());
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return undefined;
    return value.trim().replace(/\/$/, '');
  } catch {
    return undefined;
  }
}
