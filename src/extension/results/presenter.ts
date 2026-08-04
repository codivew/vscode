import * as vscode from 'vscode';
import type { RunReviewResult } from 'codivew/core';
import type { ReviewIssueStates } from '../../shared/protocol.js';
import { publishDiagnostics } from './diagnostics.js';
import { openFile, openIssue, workspaceFileUri } from './navigation.js';

export class ResultsPresenter {
  private readonly skippedIssueIndexes = new Set<number>();
  private readonly editedIssueIndexes = new Set<number>();
  private diagnosticsHidden = false;

  constructor(private readonly diagnostics: vscode.DiagnosticCollection) {}

  publish(result: RunReviewResult): void {
    this.skippedIssueIndexes.clear();
    this.editedIssueIndexes.clear();
    this.diagnosticsHidden = false;
    publishDiagnostics(result, this.diagnostics);
  }

  setIssueSkipped(result: RunReviewResult, issueIndex: number, skipped: boolean): void {
    if (skipped) this.skippedIssueIndexes.add(issueIndex);
    else this.skippedIssueIndexes.delete(issueIndex);
    this.refreshDiagnostics(result);
  }

  setDiagnosticsHidden(result: RunReviewResult, hidden: boolean): void {
    this.diagnosticsHidden = hidden;
    this.refreshDiagnostics(result);
  }

  handleDocumentChange(result: RunReviewResult, event: vscode.TextDocumentChangeEvent): boolean {
    let changed = false;
    result.json.result.issues.forEach((issue, index) => {
      const uri = workspaceFileUri(result.repositoryRoot, issue.file);
      if (uri?.toString() !== event.document.uri.toString()) return;
      const startLine = Math.max(0, issue.line - 1);
      const endLine = Math.max(startLine, (issue.endLine ?? issue.line) - 1);
      if (
        !event.contentChanges.some(
          ({ range }) => range.start.line <= endLine && range.end.line >= startLine,
        )
      ) {
        return;
      }
      if (!this.editedIssueIndexes.has(index)) changed = true;
      this.editedIssueIndexes.add(index);
    });
    if (changed) this.refreshDiagnostics(result);
    return changed;
  }

  editedFiles(result: RunReviewResult): string[] {
    return [
      ...new Set(
        [...this.editedIssueIndexes]
          .filter((index) => !this.skippedIssueIndexes.has(index))
          .map((index) => result.json.result.issues[index]?.file)
          .filter((file): file is string => file !== undefined),
      ),
    ];
  }

  issueStates(result: RunReviewResult): ReviewIssueStates {
    return {
      reviewId: result.reviewId,
      skippedIssueIndexes: [...this.skippedIssueIndexes],
      editedIssueIndexes: [...this.editedIssueIndexes],
      diagnosticsHidden: this.diagnosticsHidden,
    };
  }

  private refreshDiagnostics(result: RunReviewResult): void {
    if (this.diagnosticsHidden) {
      this.diagnostics.clear();
      return;
    }
    publishDiagnostics(
      result,
      this.diagnostics,
      new Set([...this.skippedIssueIndexes, ...this.editedIssueIndexes]),
    );
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
