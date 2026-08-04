import * as vscode from 'vscode';
import {
  ERROR_CODES,
  ReviewError,
  type Language,
  type ReviewMode,
  type ReviewProgressStage,
  type RunReviewResult,
} from 'codivew/core';
import { t } from '../../shared/localization.js';
import { ResultsPresenter } from '../results/presenter.js';
import { executeReview } from './review-runner.js';

export type ReviewInput = {
  folder: vscode.WorkspaceFolder;
  locale: Language;
  mode: ReviewMode;
  baseBranch: string;
  ollamaUrl?: string;
  model?: string;
  maxDiffChars?: number;
  projectContext: string[];
  selectedFiles?: string[];
  openReport: boolean;
};

export type ReviewHooks = {
  onProgress?: (stage: ReviewProgressStage) => void;
  onCompleted?: (result: RunReviewResult) => void;
  onCancelled?: () => void;
  onError?: (message: string) => void;
};

export class ReviewController {
  private activeController: AbortController | undefined;
  private latestResult: RunReviewResult | undefined;

  constructor(private readonly presenter: ResultsPresenter) {}

  async run(input: ReviewInput, hooks: ReviewHooks = {}): Promise<RunReviewResult | undefined> {
    if (this.activeController !== undefined) {
      const message = t('host.alreadyRunning');
      hooks.onError?.(message);
      void vscode.window.showWarningMessage(message);
      return undefined;
    }

    const controller = new AbortController();
    this.activeController = controller;
    try {
      const result = await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: t('host.reviewTitle'),
          cancellable: true,
        },
        async (progress, token): Promise<RunReviewResult> => {
          const cancellation = token.onCancellationRequested(() => controller.abort());
          try {
            return await executeReview(
              {
                cwd: input.folder.uri.fsPath,
                locale: input.locale,
                mode: input.mode,
                baseBranch: input.baseBranch,
                projectContext: input.projectContext,
                ollamaUrl: input.ollamaUrl,
                model: input.model,
                maxDiffChars: input.maxDiffChars,
                selectedFiles: input.selectedFiles,
              },
              controller.signal,
              (stage) => {
                progress.report({ message: progressMessage(stage) });
                hooks.onProgress?.(stage);
              },
            );
          } finally {
            cancellation.dispose();
          }
        },
      );

      this.latestResult = result;
      this.presenter.publish(result);
      if (input.openReport) this.presenter.openReport(result);
      hooks.onCompleted?.(result);
      void vscode.window.showInformationMessage(
        t('host.completed', {
          files: result.reviewedFileCount,
          issues: result.issueCount,
        }),
      );
      return result;
    } catch (error) {
      if (
        controller.signal.aborted ||
        (error instanceof ReviewError && error.code === ERROR_CODES.CANCELLED)
      ) {
        hooks.onCancelled?.();
        return undefined;
      }
      const message = error instanceof Error ? error.message : String(error);
      hooks.onError?.(message);
      void vscode.window.showErrorMessage(t('host.failed', { message }));
      return undefined;
    } finally {
      if (this.activeController === controller) this.activeController = undefined;
    }
  }

  cancel(): void {
    this.activeController?.abort();
  }

  openLatestReport(): void {
    if (this.latestResult === undefined) {
      void vscode.window.showInformationMessage(t('host.noReport'));
      return;
    }
    this.presenter.openReport(this.latestResult);
  }

  async openIssue(reviewId: string, issueIndex: number): Promise<void> {
    const result = this.latestResult?.reviewId === reviewId ? this.latestResult : undefined;
    if (result === undefined) {
      await vscode.window.showWarningMessage(t('host.issueUnavailable'));
      return;
    }
    await this.presenter.openIssue(result, issueIndex);
  }

  async openLatestIssue(issueIndex: number): Promise<void> {
    const result = this.latestResult;
    if (result === undefined) {
      await vscode.window.showWarningMessage(t('host.issueUnavailable'));
      return;
    }
    await this.presenter.openIssue(result, issueIndex);
  }

  openFile(folder: vscode.WorkspaceFolder, file: string): Promise<void> {
    return this.presenter.openFile(folder, file);
  }
}

export function progressMessage(stage: ReviewProgressStage): string {
  return {
    'collecting-diff': t('host.collecting'),
    'generating-review': t('host.generating'),
    completed: t('host.reportComplete'),
  }[stage];
}
