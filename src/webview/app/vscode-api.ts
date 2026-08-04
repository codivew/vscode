import type { ExtensionMessage } from '../../shared/protocol.js';

export type PersistedState = {
  workspaceIndex: number;
  mode: string;
  baseBranch: string;
  activeTab: 'review' | 'results' | 'settings';
  maxDiffChars: number;
  maxDiffCharsDraft: number;
};

export type VsCodeApi = {
  postMessage(message: ExtensionMessage): void;
  getState(): PersistedState | undefined;
  setState(state: PersistedState): void;
};

declare function acquireVsCodeApi(): VsCodeApi;

export const vscode = acquireVsCodeApi();
