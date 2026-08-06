import * as vscode from 'vscode';
import { authenticationHeaders } from 'codivew/core';
import { resolveAuthentication } from '../../authentication.js';
import { numberValue, stringValue, validHttpUrl } from '../message-values.js';
import { t } from '../../../shared/localization.js';
import type { LoadModelsMessage, WebviewMessage } from '../../../shared/protocol.js';

type ModelsResponse = Extract<WebviewMessage, { type: 'models' }>;

type ModelsResponseBody = {
  data?: unknown;
};

export async function getOllamaModels(
  message: LoadModelsMessage,
  secrets: vscode.SecretStorage,
): Promise<ModelsResponse | undefined> {
  const requestId = numberValue(message.requestId);
  if (requestId === undefined) return undefined;

  const ollamaUrl = validHttpUrl(message.ollamaUrl);
  if (ollamaUrl === undefined) {
    return error(requestId, t('host.invalidOllamaUrl'));
  }
  const authentication = await resolveAuthentication(message, secrets);
  if (authentication === undefined) {
    return error(requestId, t('host.invalidAuthentication'));
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5_000);
  try {
    const response = await fetch(`${ollamaUrl.replace(/\/+$/, '')}/models`, {
      signal: controller.signal,
      headers: authenticationHeaders(authentication),
    });
    if (!response.ok) {
      return error(requestId, t('host.modelsHttpError', { status: response.status }));
    }

    const body = (await response.json()) as ModelsResponseBody;
    const models = parseModelNames(body.data);
    return {
      type: 'models',
      requestId,
      status: 'loaded',
      models,
      message:
        models.length === 0
          ? t('host.noInstalledModels')
          : t('host.modelsLoaded', { count: models.length }),
    };
  } catch {
    return error(requestId, t('host.ollamaConnectionError', { url: ollamaUrl }));
  } finally {
    clearTimeout(timeout);
  }
}

function error(requestId: number, message: string): ModelsResponse {
  return { type: 'models', requestId, status: 'error', models: [], message };
}

function parseModelNames(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return [
    ...new Set(
      value.flatMap((model) => {
        if (typeof model !== 'object' || model === null) return [];
        const name = stringValue((model as Record<string, unknown>)['id']);
        return name === undefined ? [] : [name];
      }),
    ),
  ].sort((left, right) => left.localeCompare(right));
}
