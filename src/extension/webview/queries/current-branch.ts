import * as vscode from 'vscode';
import { readCurrentBranch } from '../../repository/branches.js';
import { numberValue } from '../message-values.js';
import type { LoadCurrentBranchMessage, WebviewMessage } from '../../../shared/protocol.js';

type CurrentBranchResponse = Extract<WebviewMessage, { type: 'currentBranch' }>;

export async function getCurrentBranch(
  message: LoadCurrentBranchMessage,
): Promise<CurrentBranchResponse | undefined> {
  const requestId = numberValue(message.requestId);
  if (requestId === undefined) return undefined;

  const folders = vscode.workspace.workspaceFolders ?? [];
  const workspaceIndex = numberValue(message.workspaceIndex);
  const folder = workspaceIndex === undefined ? undefined : folders[workspaceIndex];
  if (folder === undefined) return { type: 'currentBranch', requestId, status: 'error' };

  try {
    const branch = await readCurrentBranch(folder.uri.fsPath);
    return branch !== undefined
      ? { type: 'currentBranch', requestId, status: 'loaded', branch }
      : { type: 'currentBranch', requestId, status: 'loaded' };
  } catch {
    return { type: 'currentBranch', requestId, status: 'error' };
  }
}
