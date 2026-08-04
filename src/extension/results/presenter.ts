import * as vscode from 'vscode';
import type { RunReviewResult } from 'codivew/core';
import { publishDiagnostics } from './diagnostics.js';
import { openFile, openIssue } from './navigation.js';

export class ResultsPresenter {
  constructor(private readonly diagnostics: vscode.DiagnosticCollection) {}

  publish(result: RunReviewResult): void {
    publishDiagnostics(result, this.diagnostics);
  }

  openReport(result: RunReviewResult): void {
    const panel = vscode.window.createWebviewPanel(
      'codivew.reviewReport',
      `Codivew · ${result.request.repository}`,
      vscode.ViewColumn.Beside,
      { enableScripts: false },
    );
    panel.webview.html = result.html;
  }

  openIssue(result: RunReviewResult, issueIndex: number): Promise<void> {
    return openIssue(result, issueIndex);
  }

  openFile(folder: vscode.WorkspaceFolder, file: string): Promise<void> {
    return openFile(folder, file);
  }
}
