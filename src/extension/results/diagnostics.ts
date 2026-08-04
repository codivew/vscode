import * as vscode from 'vscode';
import type { ReviewIssue, RunReviewResult } from 'codivew/core';
import { workspaceFileUri } from './navigation.js';

const DIAGNOSTIC_SOURCE = 'Codivew';

export function publishDiagnostics(
  result: RunReviewResult,
  collection: vscode.DiagnosticCollection,
): void {
  const diagnosticsByFile = new Map<string, { uri: vscode.Uri; items: vscode.Diagnostic[] }>();

  for (const issue of result.json.result.issues) {
    const uri = workspaceFileUri(result.repositoryRoot, issue.file);
    if (uri === undefined) continue;
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
