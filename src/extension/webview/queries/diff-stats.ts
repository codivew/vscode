import * as vscode from 'vscode';
import {
  calculateDiffStats,
  createGitReviewInput,
  DiffFilterService,
  ERROR_CODES,
  ReviewError,
  ReviewMode,
} from 'codivew/core';
import { splitDiffFiles } from '../../review/diff-files.js';
import { numberValue, positiveIntegerValue, reviewMode, stringValue } from '../message-values.js';
import { t } from '../../../shared/localization.js';
import type { LoadDiffStatsMessage, WebviewMessage } from '../../../shared/protocol.js';

type DiffStatsResponse = Extract<WebviewMessage, { type: 'diffStats' }>;

export class DiffStatsQuery {
  private activeController: AbortController | undefined;

  dispose(): void {
    this.activeController?.abort();
  }

  async load(message: LoadDiffStatsMessage): Promise<DiffStatsResponse | undefined> {
    const requestId = numberValue(message.requestId);
    if (requestId === undefined) return undefined;

    const folders = vscode.workspace.workspaceFolders ?? [];
    const workspaceIndex = numberValue(message.workspaceIndex);
    const folder = workspaceIndex === undefined ? undefined : folders[workspaceIndex];
    const mode = reviewMode(message.mode);
    const baseBranch = stringValue(message.baseBranch);
    const maxDiffChars = positiveIntegerValue(message.maxDiffChars);
    if (folder === undefined || mode === undefined || maxDiffChars === undefined) {
      return this.error(requestId, t('host.scopeUnavailable'));
    }
    if (mode === ReviewMode.BRANCH && baseBranch === undefined) {
      return this.error(requestId, t('review.enterBaseBranch'));
    }

    this.activeController?.abort();
    const controller = new AbortController();
    this.activeController = controller;
    try {
      const input = await createGitReviewInput(folder.uri.fsPath, {
        mode,
        baseBranch: baseBranch ?? 'main',
        signal: controller.signal,
      });
      const filtered = new DiffFilterService().filter(input.diff);
      const files = splitDiffFiles(filtered.diff).map(({ path, diff }) => ({
        path,
        ...calculateDiffStats(diff),
        filteredCharCount: diff.length,
      }));
      return {
        type: 'diffStats',
        requestId,
        status: 'loaded',
        message: diffStatsMessage(mode, baseBranch),
        stats: {
          ...calculateDiffStats(filtered.diff),
          files,
          filteredCharCount: filtered.filteredCharCount,
          maxDiffChars,
        },
      };
    } catch (error) {
      if (controller.signal.aborted) return undefined;
      if (error instanceof ReviewError && error.code === ERROR_CODES.EMPTY_DIFF) {
        return {
          type: 'diffStats',
          requestId,
          status: 'loaded',
          message: diffStatsMessage(mode, baseBranch),
          stats: {
            files: [],
            fileCount: 0,
            additions: 0,
            deletions: 0,
            changedLineCount: 0,
            filteredCharCount: 0,
            maxDiffChars,
          },
        };
      }
      return this.error(requestId, error instanceof Error ? error.message : String(error));
    } finally {
      if (this.activeController === controller) this.activeController = undefined;
    }
  }

  private error(requestId: number, message: string): DiffStatsResponse {
    return { type: 'diffStats', requestId, status: 'error', message };
  }
}

function diffStatsMessage(mode: ReviewMode, baseBranch: string | undefined): string {
  return mode === ReviewMode.BRANCH
    ? t('host.branchChanges', { branch: baseBranch ?? 'main' })
    : mode === ReviewMode.STAGED
      ? t('host.stagedChanges')
      : t('host.workingChanges');
}
