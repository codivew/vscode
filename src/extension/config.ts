import * as vscode from 'vscode';
import { DEFAULT_API_URL, type Authentication } from 'codivew/core';

export function resolveApiUrl(configuration: vscode.WorkspaceConfiguration): string {
  const explicitApiUrl = explicitValue(configuration, 'apiUrl');
  if (explicitApiUrl !== undefined) return explicitApiUrl;

  const explicitLegacyUrl = explicitValue(configuration, 'ollamaUrl');
  if (explicitLegacyUrl !== undefined) return normalizeLegacyApiUrl(explicitLegacyUrl);

  return configuration.get<string>('apiUrl', DEFAULT_API_URL);
}

export function hasExplicitApiUrl(configuration: vscode.WorkspaceConfiguration): boolean {
  return (
    explicitValue(configuration, 'apiUrl') !== undefined ||
    explicitValue(configuration, 'ollamaUrl') !== undefined
  );
}

export function resolveAuthentication(
  configuration: vscode.WorkspaceConfiguration,
): Authentication {
  const apiKey = configuration.get<string>('apiKey', '').trim();
  return apiKey.length > 0 ? { type: 'api-key', apiKey } : { type: 'none' };
}

function normalizeLegacyApiUrl(url: string): string {
  const trimmed = url.replace(/\/+$/, '');
  return trimmed.endsWith('/v1') ? trimmed : `${trimmed}/v1`;
}

function explicitValue(
  configuration: vscode.WorkspaceConfiguration,
  key: string,
): string | undefined {
  const inspected = configuration.inspect<string>(key);
  const value =
    inspected?.workspaceFolderValue ?? inspected?.workspaceValue ?? inspected?.globalValue;
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}
