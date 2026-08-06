import * as vscode from 'vscode';
import { DEFAULT_MAX_DIFF_CHARS, setLanguage } from 'codivew/core';
import {
  getLocale,
  parseLanguagePreference,
  resolveLocale,
  setLocale,
  t,
} from '../../../shared/localization.js';
import { numberValue, positiveIntegerValue, stringValue, validHttpUrl } from '../message-values.js';
import type {
  SaveSettingsMessage,
  WebviewInitialState,
  WebviewMessage,
} from '../../../shared/protocol.js';

type SettingsResponse = Extract<WebviewMessage, { type: 'settings' }>;

export async function saveSettings(message: SaveSettingsMessage): Promise<SettingsResponse> {
  const folders = vscode.workspace.workspaceFolders ?? [];
  const workspaceIndex = numberValue(message.workspaceIndex);
  const folder = workspaceIndex === undefined ? undefined : folders[workspaceIndex];
  const ollamaUrl = validHttpUrl(message.ollamaUrl);
  const model = stringValue(message.model);
  const maxDiffChars = positiveIntegerValue(message.maxDiffChars);
  const language = parseLanguagePreference(message.language);
  if (folder === undefined) return error(t('host.defaultWorkspace'));
  if (ollamaUrl === undefined) return error(t('model.invalidUrl'));
  if (model === undefined) return error(t('host.selectModel'));
  if (maxDiffChars === undefined || maxDiffChars < 1_000) {
    return error(t('host.maxDiffInvalid'));
  }
  if (language === undefined) return error(t('host.invalidLanguage'));

  const configuration = vscode.workspace.getConfiguration('codivew', folder.uri);
  await configuration.update('ollamaUrl', ollamaUrl, vscode.ConfigurationTarget.Global);
  await configuration.update('model', model, vscode.ConfigurationTarget.Global);
  await configuration.update('maxDiffChars', maxDiffChars, vscode.ConfigurationTarget.Global);
  await configuration.update('language', language, vscode.ConfigurationTarget.Global);
  const locale = resolveLocale(language, vscode.env.language, process.env.VSCODE_NLS_CONFIG);
  setLocale(locale);
  setLanguage(locale);
  return {
    type: 'settings',
    status: 'saved',
    message: t('host.settingsSaved'),
    maxDiffChars,
    setupComplete: true,
    language,
    locale,
  };
}

export function getInitialState(): WebviewInitialState {
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
      validHttpUrl(configuredOllamaUrl) !== undefined && stringValue(configuredModel) !== undefined,
  };
}

function error(message: string): SettingsResponse {
  return { type: 'settings', status: 'error', message };
}
