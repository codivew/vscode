import * as vscode from 'vscode';
import { ReviewMode, setLanguage } from 'codivew/core';
import { parseLanguagePreference, resolveLocale, setLocale, t } from './localization.js';
import { ReviewController } from './review-controller.js';
import { ReviewViewProvider } from './review-view-provider.js';

export function activate(context: vscode.ExtensionContext): void {
  const configuredLanguage = vscode.workspace.getConfiguration('codivew').get('language', 'auto');
  const language = parseLanguagePreference(configuredLanguage) ?? 'auto';
  const locale = resolveLocale(language, vscode.env.language);
  setLocale(locale);
  setLanguage(locale);
  console.info('[Codivew] Extension activated.');
  const diagnostics = vscode.languages.createDiagnosticCollection('codivew');
  const controller = new ReviewController(diagnostics);
  const provider = new ReviewViewProvider(controller, context.extensionUri);

  context.subscriptions.push(
    diagnostics,
    vscode.window.registerWebviewViewProvider(ReviewViewProvider.viewType, provider, {
      webviewOptions: { retainContextWhenHidden: true },
    }),
    registerReviewCommand('codivew.reviewWorking', ReviewMode.WORKING, controller),
    registerReviewCommand('codivew.reviewStaged', ReviewMode.STAGED, controller),
    registerReviewCommand('codivew.reviewBranch', ReviewMode.BRANCH, controller),
    vscode.commands.registerCommand('codivew.openLatestReport', () =>
      controller.openLatestReport(),
    ),
  );
}

export function deactivate(): void {}

function registerReviewCommand(
  command: string,
  mode: ReviewMode,
  controller: ReviewController,
): vscode.Disposable {
  return vscode.commands.registerCommand(command, async () => {
    const folder = await selectWorkspaceFolder();
    if (folder === undefined) return;

    const configuration = vscode.workspace.getConfiguration('codivew', folder.uri);
    const configuredBaseBranch = configuration.get('baseBranch', 'main');
    const baseBranch =
      mode === ReviewMode.BRANCH
        ? await vscode.window.showInputBox({
            title: t('host.branchReview'),
            prompt: t('host.branchPrompt'),
            value: configuredBaseBranch,
            validateInput: (value) =>
              value.trim().length === 0 ? t('host.branchRequired') : undefined,
          })
        : configuredBaseBranch;
    if (baseBranch === undefined) return;

    await controller.run({
      folder,
      mode,
      baseBranch: baseBranch.trim(),
      projectContext: configuration.get<string[]>('projectContext', []),
      ollamaUrl: configuration.get<string>('ollamaUrl'),
      model: configuration.get<string>('model'),
      maxDiffChars: configuration.get<number>('maxDiffChars'),
      openReport: true,
    });
  });
}

async function selectWorkspaceFolder(): Promise<vscode.WorkspaceFolder | undefined> {
  const folders = vscode.workspace.workspaceFolders;
  if (folders === undefined || folders.length === 0) {
    await vscode.window.showWarningMessage(t('host.openWorkspace'));
    return undefined;
  }
  if (folders.length === 1) return folders[0];

  const selected = await vscode.window.showQuickPick(
    folders.map((folder) => ({ label: folder.name, description: folder.uri.fsPath, folder })),
    { title: t('host.selectWorkspace') },
  );
  return selected?.folder;
}
