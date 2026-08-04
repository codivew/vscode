import * as vscode from 'vscode';
import { setLanguage } from 'codivew/core';
import { parseLanguagePreference, resolveLocale, setLocale } from '../shared/localization.js';
import { registerReviewCommands } from './commands/review-commands.js';
import { ReviewController } from './review/review-controller.js';
import { ResultsPresenter } from './results/presenter.js';
import { ReviewViewProvider } from './webview/review-view-provider.js';

export function activate(context: vscode.ExtensionContext): void {
  const configuredLanguage = vscode.workspace
    .getConfiguration('codivew', vscode.workspace.workspaceFolders?.[0]?.uri)
    .get('language', 'auto');
  const language = parseLanguagePreference(configuredLanguage) ?? 'auto';
  const locale = resolveLocale(language, vscode.env.language, process.env.VSCODE_NLS_CONFIG);
  setLocale(locale);
  setLanguage(locale);
  console.info('[Codivew] Extension activated.');
  const diagnostics = vscode.languages.createDiagnosticCollection('codivew');
  const controller = new ReviewController(new ResultsPresenter(diagnostics));
  const provider = new ReviewViewProvider(controller, context.extensionUri);

  context.subscriptions.push(
    diagnostics,
    vscode.window.registerWebviewViewProvider(ReviewViewProvider.viewType, provider, {
      webviewOptions: { retainContextWhenHidden: true },
    }),
    ...registerReviewCommands(controller),
  );
}

export function deactivate(): void {}
