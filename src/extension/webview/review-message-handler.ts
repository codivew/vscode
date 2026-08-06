import * as vscode from 'vscode';
import { ReviewMode, type ReviewProgressStage, type RunReviewResult } from 'codivew/core';
import { getLocale, t } from '../../shared/localization.js';
import type { ExtensionMessage, ReviewMessage, WebviewMessage } from '../../shared/protocol.js';
import { getStoredAuthentication } from '../authentication.js';
import { progressMessage, ReviewController } from '../review/review-controller.js';
import {
  numberValue,
  positiveIntegerValue,
  reviewMode,
  stringArrayValue,
  stringValue,
  validHttpUrl,
} from './message-values.js';
import { getCurrentBranch } from './queries/current-branch.js';
import { getBranches } from './queries/branches.js';
import { DiffStatsQuery } from './queries/diff-stats.js';
import { getOllamaModels } from './queries/ollama-models.js';
import { saveSettings } from './queries/settings.js';

export class ReviewMessageHandler {
  private readonly diffStats = new DiffStatsQuery();

  constructor(
    private readonly controller: ReviewController,
    private readonly secrets: vscode.SecretStorage,
    private readonly post: (message: WebviewMessage) => void,
  ) {}

  dispose(): void {
    this.diffStats.dispose();
  }

  async handle(message: ExtensionMessage): Promise<void> {
    switch (message.type) {
      case 'cancel':
        this.controller.cancel();
        return;
      case 'openReport':
        this.controller.openLatestReport();
        return;
      case 'openIssue':
        await this.openIssue(message.reviewId, message.issueIndex);
        return;
      case 'skipIssue':
        this.skipIssue(message.reviewId, message.issueIndex, message.skipped);
        return;
      case 'setDiagnosticsHidden':
        if (typeof message.hidden === 'boolean') {
          this.controller.setDiagnosticsHidden(message.hidden);
        }
        return;
      case 'reviewEditedFiles':
        await this.reviewEditedFiles();
        return;
      case 'openFile':
        await this.openFile(message.workspaceIndex, message.path);
        return;
      case 'loadModels': {
        const response = await getOllamaModels(message, this.secrets);
        if (response !== undefined) this.post(response);
        return;
      }
      case 'loadDiffStats': {
        const response = await this.diffStats.load(message);
        if (response !== undefined) this.post(response);
        return;
      }
      case 'loadCurrentBranch': {
        const response = await getCurrentBranch(message);
        if (response !== undefined) this.post(response);
        return;
      }
      case 'loadBranches': {
        const response = await getBranches(message);
        if (response !== undefined) this.post(response);
        return;
      }
      case 'saveSettings':
        this.post(await saveSettings(message, this.secrets));
        return;
      case 'review':
        await this.startReview(message);
    }
  }

  private async openIssue(reviewIdValue: unknown, issueIndexValue: unknown): Promise<void> {
    const reviewId = stringValue(reviewIdValue);
    const issueIndex = numberValue(issueIndexValue);
    if (reviewId !== undefined && issueIndex !== undefined) {
      await this.controller.openIssue(reviewId, issueIndex);
    }
  }

  private skipIssue(reviewIdValue: unknown, issueIndexValue: unknown, skippedValue: unknown): void {
    const reviewId = stringValue(reviewIdValue);
    const issueIndex = numberValue(issueIndexValue);
    if (reviewId === undefined || issueIndex === undefined || typeof skippedValue !== 'boolean') {
      return;
    }
    this.controller.setIssueSkipped(reviewId, issueIndex, skippedValue);
  }

  private async openFile(workspaceIndexValue: unknown, pathValue: unknown): Promise<void> {
    const folders = vscode.workspace.workspaceFolders ?? [];
    const workspaceIndex = numberValue(workspaceIndexValue);
    const folder = workspaceIndex === undefined ? undefined : folders[workspaceIndex];
    const path = stringValue(pathValue);
    if (folder === undefined || path === undefined) {
      await vscode.window.showWarningMessage(t('host.fileUnavailable'));
      return;
    }
    await this.controller.openFile(folder, path);
  }

  private async startReview(message: ReviewMessage): Promise<void> {
    const folders = vscode.workspace.workspaceFolders ?? [];
    const workspaceIndex = numberValue(message.workspaceIndex);
    const folder = workspaceIndex === undefined ? undefined : folders[workspaceIndex];
    if (folder === undefined) {
      this.postState('error', t('host.reviewWorkspace'));
      return;
    }

    const mode = reviewMode(message.mode);
    const baseBranchValue = stringValue(message.baseBranch);
    const baseBranch = baseBranchValue ?? 'main';
    const ollamaUrl = validHttpUrl(message.ollamaUrl);
    const model = stringValue(message.model);
    const maxDiffChars = positiveIntegerValue(message.maxDiffChars);
    const selectedFiles = stringArrayValue(message.selectedFiles);
    if (mode === undefined) {
      this.postState('error', t('host.selectScope'));
      return;
    }
    if (ollamaUrl === undefined) {
      this.postState('error', t('model.invalidUrl'));
      return;
    }
    if (model === undefined) {
      this.postState('error', t('host.enterModel'));
      return;
    }
    if (maxDiffChars === undefined || maxDiffChars < 1_000) {
      this.postState('error', t('host.maxDiffInvalid'));
      return;
    }
    if (selectedFiles === undefined || selectedFiles.length === 0) {
      this.postState('error', t('targets.noSelection'));
      return;
    }
    if (mode === ReviewMode.BRANCH && baseBranchValue === undefined) {
      this.postState('error', t('host.branchModeRequired'));
      return;
    }

    const configuration = vscode.workspace.getConfiguration('codivew', folder.uri);
    await configuration.update('baseBranch', baseBranch, vscode.ConfigurationTarget.Global);

    this.postState('running', t('host.preparing'));
    await this.controller.run(
      {
        folder,
        locale: getLocale(),
        mode,
        baseBranch,
        ollamaUrl,
        model,
        maxDiffChars,
        selectedFiles,
        projectContext: configuration.get<string[]>('projectContext', []),
        openReport: false,
        authentication: await getStoredAuthentication(this.secrets),
      },
      {
        onProgress: (stage) => this.postProgress(stage),
        onCompleted: (result) => this.postCompleted(result),
        onCancelled: () => this.postState('cancelled', t('host.cancelled')),
        onError: (errorMessage) => this.postState('error', errorMessage),
      },
    );
  }

  private async reviewEditedFiles(): Promise<void> {
    if (!this.controller.hasEditedFiles()) {
      this.postState('error', t('host.noEditedIssues'));
      return;
    }
    this.postState('running', t('host.preparingEditedReview'));
    await this.controller.rerunEditedFiles({
      onProgress: (stage) => this.postProgress(stage),
      onCompleted: (completed) => this.postCompleted(completed),
      onCancelled: () => this.postState('cancelled', t('host.cancelled')),
      onError: (errorMessage) => this.postState('error', errorMessage),
    });
  }

  private postProgress(stage: ReviewProgressStage): void {
    this.postState('running', progressMessage(stage));
  }

  private postCompleted(result: RunReviewResult): void {
    this.post({
      type: 'state',
      status: 'completed',
      message: result.json.result.summary,
      result: {
        reviewId: result.reviewId,
        verdict: verdictLabel(result.verdict),
        risk: result.json.result.risk,
        summary: result.json.result.summary,
        reviewedFileCount: result.reviewedFileCount,
        issueCount: result.issueCount,
        tests: result.json.result.tests,
        issues: result.json.result.issues.map((issue, index) => ({ index, ...issue })),
      },
    });
  }

  private postState(status: 'running' | 'cancelled' | 'error', message: string): void {
    this.post({ type: 'state', status, message });
  }
}

function verdictLabel(verdict: RunReviewResult['verdict']): string {
  return {
    approve: t('host.approve'),
    comment: t('host.comment'),
    request_changes: t('host.requestChanges'),
  }[verdict];
}
