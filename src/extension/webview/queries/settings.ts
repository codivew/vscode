import * as vscode from 'vscode';
import { DEFAULT_MAX_DIFF_CHARS, setLanguage } from 'codivew/core';
import {
  getLocale,
  parseLanguagePreference,
  resolveLocale,
  setLocale,
  t,
} from '../../../shared/localization.js';
import { hasExplicitApiUrl, resolveApiUrl } from '../../config.js';
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
  const apiUrl = validHttpUrl(message.apiUrl);
  const apiKey = stringValue(message.apiKey) ?? '';
  const model = stringValue(message.model);
  const maxDiffChars = positiveIntegerValue(message.maxDiffChars);
  const language = parseLanguagePreference(message.language);
  if (folder === undefined) return error(t('host.defaultWorkspace'));
  if (apiUrl === undefined) return error(t('model.invalidUrl'));
  if (model === undefined) return error(t('host.selectModel'));
  if (maxDiffChars === undefined || maxDiffChars < 1_000) {
    return error(t('host.maxDiffInvalid'));
  }
  if (language === undefined) return error(t('host.invalidLanguage'));

  const configuration = vscode.workspace.getConfiguration('codivew', folder.uri);
  await configuration.update('apiUrl', apiUrl, vscode.ConfigurationTarget.Global);
  await configuration.update('apiKey', apiKey, vscode.ConfigurationTarget.Global);
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
  const model = configuration.inspect<string>('model');
  const configuredModel = model?.globalValue ?? model?.workspaceValue;
  const language = parseLanguagePreference(configuration.get('language', 'auto')) ?? 'auto';
  const apiUrl = resolveApiUrl(configuration);
  return {
    locale: getLocale(),
    language,
    workspaces: folders.map((folder, index) => ({
      index,
      name: folder.name,
      path: folder.uri.fsPath,
    })),
    apiUrl,
    apiKey: configuration.get('apiKey', ''),
    model: configuration.get('model', 'qwen3.6:35b-a3b-coding-mxfp8'),
    baseBranch: configuration.get('baseBranch', 'main'),
    maxDiffChars: configuration.get('maxDiffChars', DEFAULT_MAX_DIFF_CHARS),
    setupComplete: hasExplicitApiUrl(configuration) && stringValue(configuredModel) !== undefined,
  };
}

function error(message: string): SettingsResponse {
  return { type: 'settings', status: 'error', message };
}
