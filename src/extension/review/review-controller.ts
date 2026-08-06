import * as vscode from 'vscode';
import {
  ERROR_CODES,
  ReviewError,
  type Authentication,
  type Language,
  type ReviewMode,
  type ReviewProgressStage,
  type RunReviewResult,
} from 'codivew/core';
import { t } from '../../shared/localization.js';
import type { ReviewIssueStates } from '../../shared/protocol.js';
import { ResultsPresenter } from '../results/presenter.js';
import { workspaceFileUri } from '../results/navigation.js';
import { executeReview } from './review-runner.js';

export type ReviewInput = {
  folder: vscode.WorkspaceFolder;
  locale: Language;
  mode: ReviewMode;
  baseBranch: string;
  apiUrl?: string;
  authentication?: Authentication;
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
  private latestInput: ReviewInput | undefined;
  private readonly issueStatesEmitter = new vscode.EventEmitter<ReviewIssueStates>();
  readonly onDidChangeIssueStates = this.issueStatesEmitter.event;

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
                apiUrl: input.apiUrl,
                authentication: input.authentication,
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
      this.latestInput = input;
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

  setIssueSkipped(reviewId: string, issueIndex: number, skipped: boolean): boolean {
    const result = this.latestResult?.reviewId === reviewId ? this.latestResult : undefined;
    if (result === undefined || result.json.result.issues[issueIndex] === undefined) return false;
    this.presenter.setIssueSkipped(result, issueIndex, skipped);
    this.emitIssueStates(result);
    return true;
  }

  setDiagnosticsHidden(hidden: boolean): boolean {
    const result = this.latestResult;
    if (result === undefined) return false;
    this.presenter.setDiagnosticsHidden(result, hidden);
    this.emitIssueStates(result);
    return true;
  }

  handleDocumentChange(event: vscode.TextDocumentChangeEvent): void {
    const result = this.latestResult;
    if (result === undefined || !this.presenter.handleDocumentChange(result, event)) return;
    this.emitIssueStates(result);
  }

  async rerunEditedFiles(hooks: ReviewHooks = {}): Promise<RunReviewResult | undefined> {
    const result = this.latestResult;
    const input = this.latestInput;
    if (result === undefined || input === undefined) return undefined;
    const selectedFiles = this.presenter.editedFiles(result);
    if (selectedFiles.length === 0) return undefined;
    for (const file of selectedFiles) {
      const uri = workspaceFileUri(result.repositoryRoot, file);
      const document = vscode.workspace.textDocuments.find(
        (candidate) => candidate.uri.toString() === uri?.toString(),
      );
      if (document?.isDirty && !(await document.save())) {
        hooks.onError?.(t('host.saveEditedFailed', { file }));
        return undefined;
      }
    }
    return this.run({ ...input, selectedFiles, openReport: false }, hooks);
  }

  hasEditedFiles(): boolean {
    const result = this.latestResult;
    return result !== undefined && this.presenter.editedFiles(result).length > 0;
  }

  dispose(): void {
    this.issueStatesEmitter.dispose();
  }

  private emitIssueStates(result: RunReviewResult): void {
    this.issueStatesEmitter.fire(this.presenter.issueStates(result));
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
