import type { Authentication } from 'codivew/core';
import type * as vscode from 'vscode';
import { stringValue } from './webview/message-values.js';

const AUTHENTICATION_SECRET_KEY = 'codivew.authentication';

export type AuthenticationInput = {
  authenticationType: unknown;
  apiKey: unknown;
  username: unknown;
  password: unknown;
};

export async function getStoredAuthentication(
  secrets: vscode.SecretStorage,
): Promise<Authentication> {
  const stored = await secrets.get(AUTHENTICATION_SECRET_KEY);
  if (stored === undefined) return { type: 'none' };
  try {
    return parseStoredAuthentication(JSON.parse(stored));
  } catch {
    return { type: 'none' };
  }
}

export async function resolveAuthentication(
  input: AuthenticationInput,
  secrets: vscode.SecretStorage,
): Promise<Authentication | undefined> {
  const type = input.authenticationType;
  if (type === 'none') return { type: 'none' };

  const stored = await getStoredAuthentication(secrets);
  if (type === 'api-key') {
    const apiKey = stringValue(input.apiKey);
    if (apiKey !== undefined) return { type, apiKey };
    return stored.type === type ? stored : undefined;
  }
  if (type === 'basic') {
    const username = stringValue(input.username);
    const password = stringValue(input.password);
    if (username !== undefined && password !== undefined) return { type, username, password };
    if (stored.type === type && (username === undefined || username === stored.username)) {
      return stored;
    }
  }
  return undefined;
}

export async function storeAuthentication(
  secrets: vscode.SecretStorage,
  authentication: Authentication,
): Promise<void> {
  if (authentication.type === 'none') {
    await secrets.delete(AUTHENTICATION_SECRET_KEY);
    return;
  }
  await secrets.store(AUTHENTICATION_SECRET_KEY, JSON.stringify(authentication));
}

function parseStoredAuthentication(value: unknown): Authentication {
  if (typeof value !== 'object' || value === null) return { type: 'none' };
  const record = value as Record<string, unknown>;
  if (record['type'] === 'api-key') {
    const apiKey = stringValue(record['apiKey']);
    return apiKey === undefined ? { type: 'none' } : { type: 'api-key', apiKey };
  }
  if (record['type'] === 'basic') {
    const username = stringValue(record['username']);
    const password = stringValue(record['password']);
    return username === undefined || password === undefined
      ? { type: 'none' }
      : { type: 'basic', username, password };
  }
  return { type: 'none' };
}
