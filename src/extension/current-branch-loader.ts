import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import * as vscode from 'vscode';
import { numberValue } from './message-values.js';
import type { LoadCurrentBranchMessage, WebviewMessage } from '../shared/protocol.js';

const execFileAsync = promisify(execFile);

type CurrentBranchResponse = Extract<WebviewMessage, { type: 'currentBranch' }>;

export async function loadCurrentBranch(
  message: LoadCurrentBranchMessage,
): Promise<CurrentBranchResponse | undefined> {
  const requestId = numberValue(message.requestId);
  if (requestId === undefined) return undefined;

  const folders = vscode.workspace.workspaceFolders ?? [];
  const workspaceIndex = numberValue(message.workspaceIndex);
  const folder = workspaceIndex === undefined ? undefined : folders[workspaceIndex];
  if (folder === undefined) return { type: 'currentBranch', requestId, status: 'error' };

  try {
    const { stdout } = await execFileAsync(
      'git',
      ['-C', folder.uri.fsPath, 'branch', '--show-current'],
      { encoding: 'utf8', maxBuffer: 16_384 },
    );
    const branch = stdout.trim();
    return branch.length > 0
      ? { type: 'currentBranch', requestId, status: 'loaded', branch }
      : { type: 'currentBranch', requestId, status: 'loaded' };
  } catch {
    return { type: 'currentBranch', requestId, status: 'error' };
  }
}
