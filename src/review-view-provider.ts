import { randomBytes } from 'node:crypto';
import * as vscode from 'vscode';
import {
  calculateDiffStats,
  createGitReviewInput,
  DEFAULT_MAX_DIFF_CHARS,
  DiffFilterService,
  ERROR_CODES,
  ReviewError,
  ReviewMode,
  setLanguage,
  type ReviewProgressStage,
  type RunReviewResult,
} from 'codivew/core';
import { progressMessage, ReviewController } from './review-controller.js';
import { splitDiffFiles } from './diff-files.js';
import {
  getLocale,
  parseLanguagePreference,
  resolveLocale,
  setLocale,
  t,
  type LanguagePreference,
  type Locale,
} from './localization.js';
import type {
  DiffStats,
  ExtensionMessage,
  LoadDiffStatsMessage,
  LoadModelsMessage,
  ReviewMessage,
  SaveSettingsMessage,
  WebviewInitialState,
} from './webview/types.js';

type OllamaTagsResponse = {
  models?: unknown;
};

export class ReviewViewProvider implements vscode.WebviewViewProvider {
  static readonly viewType = 'codivew.reviewView';
  private view: vscode.WebviewView | undefined;
  private diffStatsController: AbortController | undefined;

  constructor(
    private readonly controller: ReviewController,
    private readonly extensionUri: vscode.Uri,
  ) {}

  resolveWebviewView(view: vscode.WebviewView): void {
    this.view = view;
    const distUri = vscode.Uri.joinPath(this.extensionUri, 'dist');
    view.webview.options = {
      enableScripts: true,
      localResourceRoots: [distUri],
    };
    view.webview.html = this.render(view.webview);
    view.webview.onDidReceiveMessage((message: ExtensionMessage) => {
      void this.handleMessage(message);
    });
    view.onDidDispose(() => this.diffStatsController?.abort());
  }

  private async handleMessage(message: ExtensionMessage): Promise<void> {
    if (message.type === 'cancel') {
      this.controller.cancel();
      return;
    }
    if (message.type === 'openReport') {
      this.controller.openLatestReport();
      return;
    }
    if (message.type === 'openIssue') {
      const reviewId = stringValue(message.reviewId);
      const issueIndex = numberValue(message.issueIndex);
      if (reviewId !== undefined && issueIndex !== undefined) {
        await this.controller.openIssue(reviewId, issueIndex);
      }
      return;
    }
    if (message.type === 'loadModels') {
      await this.loadModels(message);
      return;
    }
    if (message.type === 'loadDiffStats') {
      await this.loadDiffStats(message);
      return;
    }
    if (message.type === 'saveSettings') {
      await this.saveSettings(message);
      return;
    }
    await this.startReview(message);
  }

  private async saveSettings(message: SaveSettingsMessage): Promise<void> {
    const folders = vscode.workspace.workspaceFolders ?? [];
    const workspaceIndex = numberValue(message.workspaceIndex);
    const folder = workspaceIndex === undefined ? undefined : folders[workspaceIndex];
    const ollamaUrl = validHttpUrl(message.ollamaUrl);
    const model = stringValue(message.model);
    const maxDiffChars = positiveIntegerValue(message.maxDiffChars);
    const language = parseLanguagePreference(message.language);
    if (folder === undefined) {
      this.postSettings('error', t('host.defaultWorkspace'));
      return;
    }
    if (ollamaUrl === undefined) {
      this.postSettings('error', t('ollama.invalidUrl'));
      return;
    }
    if (model === undefined) {
      this.postSettings('error', t('host.selectModel'));
      return;
    }
    if (maxDiffChars === undefined || maxDiffChars < 1_000) {
      this.postSettings('error', t('host.maxDiffInvalid'));
      return;
    }
    if (language === undefined) {
      this.postSettings('error', t('host.invalidLanguage'));
      return;
    }
    const configuration = vscode.workspace.getConfiguration('codivew', folder.uri);
    await configuration.update('ollamaUrl', ollamaUrl, vscode.ConfigurationTarget.Global);
    await configuration.update('model', model, vscode.ConfigurationTarget.Global);
    await configuration.update('maxDiffChars', maxDiffChars, vscode.ConfigurationTarget.Global);
    await configuration.update('language', language, vscode.ConfigurationTarget.Global);
    const locale = resolveLocale(language, vscode.env.language);
    setLocale(locale);
    setLanguage(locale);
    this.postSettings('saved', t('host.settingsSaved'), maxDiffChars, true, language, locale);
  }

  private async loadDiffStats(message: LoadDiffStatsMessage): Promise<void> {
    const requestId = numberValue(message.requestId);
    if (requestId === undefined) return;

    const folders = vscode.workspace.workspaceFolders ?? [];
    const workspaceIndex = numberValue(message.workspaceIndex);
    const folder = workspaceIndex === undefined ? undefined : folders[workspaceIndex];
    const mode = reviewMode(message.mode);
    const baseBranch = stringValue(message.baseBranch);
    const maxDiffChars = positiveIntegerValue(message.maxDiffChars);
    if (folder === undefined || mode === undefined || maxDiffChars === undefined) {
      this.postDiffStats(requestId, 'error', t('host.scopeUnavailable'));
      return;
    }
    if (mode === ReviewMode.BRANCH && baseBranch === undefined) {
      this.postDiffStats(requestId, 'error', t('review.enterBaseBranch'));
      return;
    }

    this.diffStatsController?.abort();
    const controller = new AbortController();
    this.diffStatsController = controller;
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
      this.postDiffStats(requestId, 'loaded', diffStatsMessage(mode, baseBranch), {
        ...calculateDiffStats(filtered.diff),
        files,
        filteredCharCount: filtered.filteredCharCount,
        maxDiffChars,
      });
    } catch (error) {
      if (controller.signal.aborted) return;
      if (error instanceof ReviewError && error.code === ERROR_CODES.EMPTY_DIFF) {
        this.postDiffStats(requestId, 'loaded', diffStatsMessage(mode, baseBranch), {
          files: [],
          fileCount: 0,
          additions: 0,
          deletions: 0,
          changedLineCount: 0,
          filteredCharCount: 0,
          maxDiffChars,
        });
        return;
      }
      this.postDiffStats(
        requestId,
        'error',
        error instanceof Error ? error.message : String(error),
      );
    } finally {
      if (this.diffStatsController === controller) this.diffStatsController = undefined;
    }
  }

  private async loadModels(message: LoadModelsMessage): Promise<void> {
    const requestId = numberValue(message.requestId);
    if (requestId === undefined) return;

    const ollamaUrl = validHttpUrl(message.ollamaUrl);
    if (ollamaUrl === undefined) {
      this.postModels(requestId, 'error', [], t('host.invalidOllamaUrl'));
      return;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5_000);
    try {
      const response = await fetch(`${ollamaUrl}/api/tags`, { signal: controller.signal });
      if (!response.ok) {
        this.postModels(
          requestId,
          'error',
          [],
          t('host.modelsHttpError', { status: response.status }),
        );
        return;
      }

      const body = (await response.json()) as OllamaTagsResponse;
      const models = parseModelNames(body.models);
      this.postModels(
        requestId,
        'loaded',
        models,
        models.length === 0
          ? t('host.noInstalledModels')
          : t('host.modelsLoaded', { count: models.length }),
      );
    } catch {
      this.postModels(requestId, 'error', [], t('host.ollamaConnectionError', { url: ollamaUrl }));
    } finally {
      clearTimeout(timeout);
    }
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
      this.postState('error', t('ollama.invalidUrl'));
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
        mode,
        baseBranch,
        ollamaUrl,
        model,
        maxDiffChars,
        selectedFiles,
        projectContext: configuration.get<string[]>('projectContext', []),
        openReport: false,
      },
      {
        onProgress: (stage) => this.postProgress(stage),
        onCompleted: (result) => this.postCompleted(result),
        onCancelled: () => this.postState('cancelled', t('host.cancelled')),
        onError: (message) => this.postState('error', message),
      },
    );
  }

  private postProgress(stage: ReviewProgressStage): void {
    this.postState('running', progressMessage(stage));
  }

  private postCompleted(result: RunReviewResult): void {
    void this.view?.webview.postMessage({
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
    void this.view?.webview.postMessage({ type: 'state', status, message });
  }

  private postModels(
    requestId: number,
    status: 'loaded' | 'error',
    models: string[],
    message: string,
  ): void {
    void this.view?.webview.postMessage({ type: 'models', requestId, status, models, message });
  }

  private postDiffStats(
    requestId: number,
    status: 'loaded' | 'error',
    message: string,
    stats?: DiffStats,
  ): void {
    void this.view?.webview.postMessage({
      type: 'diffStats',
      requestId,
      status,
      message,
      ...(stats === undefined ? {} : { stats }),
    });
  }

  private postSettings(
    status: 'saved' | 'error',
    message: string,
    maxDiffChars?: number,
    setupComplete?: boolean,
    language?: LanguagePreference,
    locale?: Locale,
  ): void {
    void this.view?.webview.postMessage({
      type: 'settings',
      status,
      message,
      ...(maxDiffChars === undefined ? {} : { maxDiffChars }),
      ...(setupComplete === undefined ? {} : { setupComplete }),
      ...(language === undefined ? {} : { language }),
      ...(locale === undefined ? {} : { locale }),
    });
  }

  private render(webview: vscode.Webview): string {
    const nonce = randomBytes(16).toString('base64');
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionUri, 'dist', 'webview.js'),
    );
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionUri, 'dist', 'webview.css'),
    );
    const initialState = escapeHtml(JSON.stringify(this.getInitialState()));

    return `<!doctype html>
<html lang="${getLocale()}">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';" />
    <link rel="stylesheet" href="${styleUri.toString()}" />
    <title>Codivew</title>
  </head>
  <body>
    <div id="root" data-initial-state="${initialState}"></div>
    <script nonce="${nonce}" src="${scriptUri.toString()}"></script>
  </body>
</html>`;
  }

  private getInitialState(): WebviewInitialState {
    const folders = vscode.workspace.workspaceFolders ?? [];
    const configuration = vscode.workspace.getConfiguration('codivew', folders[0]?.uri);
    const ollamaUrl = configuration.inspect<string>('ollamaUrl');
    const model = configuration.inspect<string>('model');
    const configuredOllamaUrl = ollamaUrl?.globalValue ?? ollamaUrl?.workspaceValue;
    const configuredModel = model?.globalValue ?? model?.workspaceValue;
    const language = parseLanguagePreference(configuration.get('language', 'auto')) ?? 'auto';
    return {
      locale: getLocale(),
      language,
      workspaces: folders.map((folder, index) => ({
        index,
        name: folder.name,
        path: folder.uri.fsPath,
      })),
      ollamaUrl: configuration.get('ollamaUrl', 'http://localhost:11434'),
      model: configuration.get('model', 'qwen3.6:35b-a3b-coding-mxfp8'),
      baseBranch: configuration.get('baseBranch', 'main'),
      maxDiffChars: configuration.get('maxDiffChars', DEFAULT_MAX_DIFF_CHARS),
      setupComplete:
        validHttpUrl(configuredOllamaUrl) !== undefined &&
        stringValue(configuredModel) !== undefined,
    };
  }
}

function stringValue(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length === 0 ? undefined : trimmed;
}

function stringArrayValue(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const values = value.map(stringValue);
  if (values.some((item) => item === undefined)) return undefined;
  return [...new Set(values as string[])];
}

function numberValue(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 ? value : undefined;
}

function positiveIntegerValue(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isInteger(value) && value > 0 ? value : undefined;
}

function reviewMode(value: unknown): ReviewMode | undefined {
  return Object.values(ReviewMode).includes(value as ReviewMode)
    ? (value as ReviewMode)
    : undefined;
}

function validHttpUrl(value: unknown): string | undefined {
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

function parseModelNames(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return [
    ...new Set(
      value.flatMap((model) => {
        if (typeof model !== 'object' || model === null) return [];
        const name = stringValue((model as Record<string, unknown>)['name']);
        return name === undefined ? [] : [name];
      }),
    ),
  ].sort((left, right) => left.localeCompare(right));
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function verdictLabel(verdict: RunReviewResult['verdict']): string {
  return {
    approve: t('host.approve'),
    comment: t('host.comment'),
    request_changes: t('host.requestChanges'),
  }[verdict];
}

function diffStatsMessage(mode: ReviewMode, baseBranch: string | undefined): string {
  return mode === ReviewMode.BRANCH
    ? t('host.branchChanges', { branch: baseBranch ?? 'main' })
    : mode === ReviewMode.STAGED
      ? t('host.stagedChanges')
      : t('host.workingChanges');
}
