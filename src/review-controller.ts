import { basename, isAbsolute, relative, resolve } from 'node:path';
import * as vscode from 'vscode';
import {
  createGitReviewInput,
  DEFAULT_MAX_DIFF_CHARS,
  DEFAULT_OLLAMA_MODEL,
  DEFAULT_OLLAMA_TIMEOUT_MS,
  DEFAULT_OLLAMA_URL,
  DiffFilterService,
  ERROR_CODES,
  HtmlRendererService,
  OllamaService,
  ReviewError,
  ReviewMode,
  ReviewPromptService,
  ReviewsService,
  runReview,
  type ReviewIssue,
  type ReviewProgressStage,
  type RunReviewResult,
} from 'codivew/core';
import { t } from './localization.js';
import { selectDiffFiles } from './diff-files.js';

const DIAGNOSTIC_SOURCE = 'Codivew';

export type ReviewInput = {
  folder: vscode.WorkspaceFolder;
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

  constructor(private readonly diagnostics: vscode.DiagnosticCollection) {}

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
            const options = {
              cwd: input.folder.uri.fsPath,
              mode: input.mode,
              baseBranch: input.baseBranch,
              projectContext: input.projectContext,
              ollamaUrl: input.ollamaUrl,
              model: input.model,
              maxDiffChars: input.maxDiffChars,
              signal: controller.signal,
              onProgress: (stage: ReviewProgressStage): void => {
                progress.report({ message: progressMessage(stage) });
                hooks.onProgress?.(stage);
              },
            };
            return input.selectedFiles === undefined
              ? await runReview(options)
              : await runReviewForFiles(options, input.selectedFiles);
          } finally {
            cancellation.dispose();
          }
        },
      );

      this.latestResult = result;
      publishDiagnostics(result, this.diagnostics);
      if (input.openReport) this.openReport(result);
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
    this.openReport(this.latestResult);
  }

  private openReport(result: RunReviewResult): void {
    const panel = vscode.window.createWebviewPanel(
      'codivew.reviewReport',
      `Codivew · ${result.request.repository}`,
      vscode.ViewColumn.Beside,
      { enableScripts: false },
    );
    panel.webview.html = result.html;
  }
}

async function runReviewForFiles(
  options: {
    cwd: string;
    mode: ReviewMode;
    baseBranch: string;
    projectContext: string[];
    ollamaUrl?: string;
    model?: string;
    maxDiffChars?: number;
    signal: AbortSignal;
    onProgress: (stage: ReviewProgressStage) => void;
  },
  selectedFiles: string[],
): Promise<RunReviewResult> {
  options.onProgress('collecting-diff');
  const gitInput = await createGitReviewInput(options.cwd, {
    mode: options.mode,
    baseBranch: options.baseBranch,
    signal: options.signal,
  });
  const diff = selectDiffFiles(gitInput.diff, selectedFiles);
  const request = {
    repository: basename(gitInput.repositoryRoot),
    baseBranch: options.mode === ReviewMode.BRANCH ? options.baseBranch : undefined,
    mode: options.mode,
    commitSha: gitInput.commitSha,
    projectContext: options.projectContext.length === 0 ? undefined : options.projectContext,
    diff,
  };

  options.onProgress('generating-review');
  const reviews = new ReviewsService(
    options.maxDiffChars ?? DEFAULT_MAX_DIFF_CHARS,
    new DiffFilterService(),
    new ReviewPromptService(),
    new OllamaService({
      baseUrl: options.ollamaUrl ?? DEFAULT_OLLAMA_URL,
      model: options.model ?? DEFAULT_OLLAMA_MODEL,
      timeoutMs: DEFAULT_OLLAMA_TIMEOUT_MS,
      signal: options.signal,
    }),
    new HtmlRendererService(),
  );
  const generated = await reviews.createReview(request);
  options.onProgress('completed');
  return {
    ...generated,
    repositoryRoot: gitInput.repositoryRoot,
    request: generated.json.request,
  };
}

export function progressMessage(stage: ReviewProgressStage): string {
  return {
    'collecting-diff': t('host.collecting'),
    'generating-review': t('host.generating'),
    completed: t('host.reportComplete'),
  }[stage];
}

function publishDiagnostics(
  result: RunReviewResult,
  collection: vscode.DiagnosticCollection,
): void {
  const diagnosticsByFile = new Map<string, { uri: vscode.Uri; items: vscode.Diagnostic[] }>();

  for (const issue of result.json.result.issues) {
    const absolutePath = resolve(result.repositoryRoot, issue.file);
    const relativePath = relative(result.repositoryRoot, absolutePath);
    if (isAbsolute(relativePath) || relativePath.startsWith('..')) continue;

    const uri = vscode.Uri.file(absolutePath);
    const entry = diagnosticsByFile.get(uri.toString()) ?? { uri, items: [] };
    entry.items.push(createDiagnostic(issue));
    diagnosticsByFile.set(uri.toString(), entry);
  }

  collection.clear();
  collection.set([...diagnosticsByFile.values()].map(({ uri, items }) => [uri, items]));
}

function createDiagnostic(issue: ReviewIssue): vscode.Diagnostic {
  const startLine = Math.max(0, issue.line - 1);
  const endLine = Math.max(startLine, (issue.endLine ?? issue.line) - 1);
  const diagnostic = new vscode.Diagnostic(
    new vscode.Range(startLine, 0, endLine, Number.MAX_SAFE_INTEGER),
    `${issue.title}\n${issue.description}`,
    diagnosticSeverity(issue.severity),
  );
  diagnostic.source = DIAGNOSTIC_SOURCE;
  diagnostic.code = issue.severity;
  return diagnostic;
}

function diagnosticSeverity(severity: ReviewIssue['severity']): vscode.DiagnosticSeverity {
  return {
    must_fix: vscode.DiagnosticSeverity.Error,
    should_fix: vscode.DiagnosticSeverity.Warning,
    suggestion: vscode.DiagnosticSeverity.Information,
  }[severity];
}
