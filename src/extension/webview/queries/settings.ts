import * as vscode from 'vscode';
import { DEFAULT_API_URL, DEFAULT_MAX_DIFF_CHARS, DEFAULT_MODEL, setLanguage } from 'codivew/core';
import {
  getStoredAuthentication,
  resolveAuthentication,
  storeAuthentication,
} from '../../authentication.js';
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

export async function saveSettings(
  message: SaveSettingsMessage,
  secrets: vscode.SecretStorage,
): Promise<SettingsResponse> {
  const folders = vscode.workspace.workspaceFolders ?? [];
  const workspaceIndex = numberValue(message.workspaceIndex);
  const folder = workspaceIndex === undefined ? undefined : folders[workspaceIndex];
  const ollamaUrl = validHttpUrl(message.ollamaUrl);
  const model = stringValue(message.model);
  const maxDiffChars = positiveIntegerValue(message.maxDiffChars);
  const language = parseLanguagePreference(message.language);
  const authentication = await resolveAuthentication(message, secrets);
  if (folder === undefined) return error(t('host.defaultWorkspace'));
  if (ollamaUrl === undefined) return error(t('ollama.invalidUrl'));
  if (model === undefined) return error(t('host.selectModel'));
  if (maxDiffChars === undefined || maxDiffChars < 1_000) {
    return error(t('host.maxDiffInvalid'));
  }
  if (language === undefined) return error(t('host.invalidLanguage'));
  if (authentication === undefined) return error(t('host.invalidAuthentication'));

  const configuration = vscode.workspace.getConfiguration('codivew', folder.uri);
  await configuration.update('apiUrl', ollamaUrl, vscode.ConfigurationTarget.Global);
  await configuration.update('model', model, vscode.ConfigurationTarget.Global);
  await configuration.update('maxDiffChars', maxDiffChars, vscode.ConfigurationTarget.Global);
  await configuration.update('language', language, vscode.ConfigurationTarget.Global);
  await storeAuthentication(secrets, authentication);
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

export async function getInitialState(secrets: vscode.SecretStorage): Promise<WebviewInitialState> {
  const folders = vscode.workspace.workspaceFolders ?? [];
  const configuration = vscode.workspace.getConfiguration('codivew', folders[0]?.uri);
  const apiUrl = configuration.inspect<string>('apiUrl');
  const legacyOllamaUrl = configuration.inspect<string>('ollamaUrl');
  const model = configuration.inspect<string>('model');
  const configuredApiUrl =
    apiUrl?.globalValue ??
    apiUrl?.workspaceValue ??
    legacyApiUrl(legacyOllamaUrl?.globalValue ?? legacyOllamaUrl?.workspaceValue);
  const configuredModel = model?.globalValue ?? model?.workspaceValue;
  const language = parseLanguagePreference(configuration.get('language', 'auto')) ?? 'auto';
  const authentication = await getStoredAuthentication(secrets);
  return {
    locale: getLocale(),
    language,
    workspaces: folders.map((folder, index) => ({
      index,
      name: folder.name,
      path: folder.uri.fsPath,
    })),
    ollamaUrl: configuredApiUrl ?? DEFAULT_API_URL,
    authenticationType: authentication.type,
    authenticationUsername: authentication.type === 'basic' ? authentication.username : '',
    authenticationConfigured: authentication.type !== 'none',
    model: configuration.get('model', DEFAULT_MODEL),
    baseBranch: configuration.get('baseBranch', 'main'),
    maxDiffChars: configuration.get('maxDiffChars', DEFAULT_MAX_DIFF_CHARS),
    setupComplete:
      validHttpUrl(configuredApiUrl) !== undefined && stringValue(configuredModel) !== undefined,
  };
}

function legacyApiUrl(value: string | undefined): string | undefined {
  if (value === undefined) return undefined;
  const baseUrl = value.replace(/\/+$/, '');
  return baseUrl.endsWith('/v1') ? baseUrl : `${baseUrl}/v1`;
}

function error(message: string): SettingsResponse {
  return { type: 'settings', status: 'error', message };
}
