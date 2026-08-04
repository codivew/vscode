import { isAbsolute, relative, resolve } from 'node:path';
import * as vscode from 'vscode';
import type { RunReviewResult } from 'codivew/core';
import { t } from '../../shared/localization.js';

export async function openIssue(result: RunReviewResult, issueIndex: number): Promise<void> {
  const issue = result.json.result.issues[issueIndex];
  if (issue === undefined) {
    await vscode.window.showWarningMessage(t('host.issueUnavailable'));
    return;
  }

  const uri = workspaceFileUri(result.repositoryRoot, issue.file);
  if (uri === undefined) {
    await vscode.window.showWarningMessage(t('host.issueUnavailable'));
    return;
  }

  try {
    const document = await vscode.workspace.openTextDocument(uri);
    const editor = await vscode.window.showTextDocument(document, {
      preview: false,
      preserveFocus: false,
    });
    const startLine = Math.min(Math.max(0, issue.line - 1), document.lineCount - 1);
    const endLine = Math.min(
      Math.max(startLine, (issue.endLine ?? issue.line) - 1),
      document.lineCount - 1,
    );
    const range = new vscode.Range(
      new vscode.Position(startLine, 0),
      document.lineAt(endLine).range.end,
    );
    editor.selection = new vscode.Selection(range.start, range.end);
    editor.revealRange(range, vscode.TextEditorRevealType.InCenterIfOutsideViewport);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await vscode.window.showErrorMessage(t('host.issueFileError', { message }));
  }
}

export async function openFile(folder: vscode.WorkspaceFolder, file: string): Promise<void> {
  const uri = workspaceFileUri(folder.uri.fsPath, file);
  if (uri === undefined) {
    await vscode.window.showWarningMessage(t('host.fileUnavailable'));
    return;
  }

  try {
    const document = await vscode.workspace.openTextDocument(uri);
    await vscode.window.showTextDocument(document, {
      preview: true,
      preserveFocus: false,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await vscode.window.showErrorMessage(t('host.fileOpenError', { message }));
  }
}

export function workspaceFileUri(root: string, file: string): vscode.Uri | undefined {
  const absolutePath = resolve(root, file);
  const relativePath = relative(root, absolutePath);
  if (isAbsolute(relativePath) || relativePath.startsWith('..')) return undefined;
  return vscode.Uri.file(absolutePath);
}
