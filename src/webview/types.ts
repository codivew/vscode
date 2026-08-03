export type ReviewMessage = {
  type: 'review';
  workspaceIndex: unknown;
  mode: unknown;
  baseBranch: unknown;
  ollamaUrl: unknown;
  model: unknown;
  maxDiffChars: unknown;
};

export type LoadModelsMessage = {
  type: 'loadModels';
  ollamaUrl: unknown;
  requestId: unknown;
};

export type LoadDiffStatsMessage = {
  type: 'loadDiffStats';
  workspaceIndex: unknown;
  mode: unknown;
  baseBranch: unknown;
  requestId: unknown;
  maxDiffChars: unknown;
};

export type SaveSettingsMessage = {
  type: 'saveSettings';
  workspaceIndex: unknown;
  ollamaUrl: unknown;
  model: unknown;
  maxDiffChars: unknown;
};

export type ExtensionMessage =
  | ReviewMessage
  | LoadModelsMessage
  | LoadDiffStatsMessage
  | SaveSettingsMessage
  | { type: 'cancel' }
  | { type: 'openReport' };

export type DiffStats = {
  files: string[];
  fileCount: number;
  additions: number;
  deletions: number;
  changedLineCount: number;
  filteredCharCount: number;
  maxDiffChars: number;
};

export type ReviewResultSummary = {
  verdict: string;
  reviewedFileCount: number;
  issueCount: number;
};

export type ReviewStatus = 'idle' | 'running' | 'completed' | 'cancelled' | 'error';

export type WebviewMessage =
  | {
      type: 'state';
      status: ReviewStatus;
      message: string;
      result?: ReviewResultSummary;
    }
  | {
      type: 'models';
      requestId: number;
      status: 'loaded' | 'error';
      models: string[];
      message: string;
    }
  | {
      type: 'diffStats';
      requestId: number;
      status: 'loaded' | 'error';
      stats?: DiffStats;
      message: string;
    }
  | {
      type: 'settings';
      status: 'saved' | 'error';
      message: string;
      maxDiffChars?: number;
      setupComplete?: boolean;
    };

export type WebviewInitialState = {
  locale: Locale;
  workspaces: Array<{ index: number; name: string; path: string }>;
  ollamaUrl: string;
  model: string;
  baseBranch: string;
  maxDiffChars: number;
  setupComplete: boolean;
};
import type { Locale } from '../localization.js';
