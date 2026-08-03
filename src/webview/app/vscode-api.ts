import type { ExtensionMessage } from '../types.js';

export type PersistedState = {
  workspaceIndex: number;
  ollamaUrl: string;
  model: string;
  mode: string;
  baseBranch: string;
  activeTab: 'review' | 'settings';
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
