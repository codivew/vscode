import { randomBytes } from 'node:crypto';
import * as vscode from 'vscode';
import type { WebviewInitialState } from '../../shared/protocol.js';

export function createWebviewDocument(
  webview: vscode.Webview,
  extensionUri: vscode.Uri,
  initialState: WebviewInitialState,
): string {
  const nonce = randomBytes(16).toString('base64');
  const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'dist', 'webview.js'));
  const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'dist', 'webview.css'));
  const serializedState = escapeHtml(JSON.stringify(initialState));

  return `<!doctype html>
<html lang="${initialState.locale}">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';" />
    <link rel="stylesheet" href="${styleUri.toString()}" />
    <title>Codivew</title>
  </head>
  <body>
    <div id="root" data-initial-state="${serializedState}"></div>
    <script nonce="${nonce}" src="${scriptUri.toString()}"></script>
  </body>
</html>`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
