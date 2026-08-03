import { parseUnifiedDiff } from 'codivew/core';

export type DiffFilePart = {
  path: string;
  diff: string;
};

export function splitDiffFiles(diff: string): DiffFilePart[] {
  const starts = [...diff.matchAll(/^diff --git /gm)].map((match) => match.index);
  if (starts.length === 0) return [];

  return starts.flatMap((start, index) => {
    const part = diff.slice(start, starts[index + 1] ?? diff.length);
    const path = parseUnifiedDiff(part)[0]?.path;
    return path === undefined ? [] : [{ path, diff: part }];
  });
}

export function selectDiffFiles(diff: string, selectedFiles: readonly string[]): string {
  const selected = new Set(selectedFiles);
  return splitDiffFiles(diff)
    .filter((part) => selected.has(part.path))
    .map((part) => part.diff)
    .join('');
}
