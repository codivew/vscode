import * as vscode from 'vscode';
import { listBaseBranches } from '../../repository/branches.js';
import type { LoadBranchesMessage, WebviewMessage } from '../../../shared/protocol.js';
import { numberValue } from '../message-values.js';

type BranchesResponse = Extract<WebviewMessage, { type: 'branches' }>;

export async function getBranches(
  message: LoadBranchesMessage,
): Promise<BranchesResponse | undefined> {
  const requestId = numberValue(message.requestId);
  if (requestId === undefined) return undefined;

  const folders = vscode.workspace.workspaceFolders ?? [];
  const workspaceIndex = numberValue(message.workspaceIndex);
  const folder = workspaceIndex === undefined ? undefined : folders[workspaceIndex];
  if (folder === undefined) return error(requestId);

  try {
    const { branches, defaultBranch } = await listBaseBranches(folder.uri.fsPath);
    return {
      type: 'branches',
      requestId,
      status: 'loaded',
      branches,
      ...(defaultBranch === undefined ? {} : { defaultBranch }),
    };
  } catch {
    return error(requestId);
  }
}

function error(requestId: number): BranchesResponse {
  return { type: 'branches', requestId, status: 'error', branches: [] };
}
