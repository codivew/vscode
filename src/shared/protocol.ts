export type ReviewMessage = {
  type: 'review';
  workspaceIndex: unknown;
  mode: unknown;
  baseBranch: unknown;
  apiUrl: unknown;
  apiKey: unknown;
  model: unknown;
  maxDiffChars: unknown;
  selectedFiles: unknown;
};

export type LoadModelsMessage = {
  type: 'loadModels';
  apiUrl: unknown;
  apiKey: unknown;
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

export type LoadCurrentBranchMessage = {
  type: 'loadCurrentBranch';
  workspaceIndex: unknown;
  requestId: unknown;
};

export type LoadBranchesMessage = {
  type: 'loadBranches';
  workspaceIndex: unknown;
  requestId: unknown;
};

export type SaveSettingsMessage = {
  type: 'saveSettings';
  workspaceIndex: unknown;
  apiUrl: unknown;
  apiKey: unknown;
  model: unknown;
  maxDiffChars: unknown;
  language: unknown;
};

export type ExtensionMessage =
  | ReviewMessage
  | LoadModelsMessage
  | LoadDiffStatsMessage
  | LoadCurrentBranchMessage
  | LoadBranchesMessage
  | SaveSettingsMessage
  | { type: 'cancel' }
  | { type: 'openFile'; workspaceIndex: unknown; path: unknown }
  | { type: 'openReport' }
  | { type: 'openIssue'; reviewId: unknown; issueIndex: unknown }
  | { type: 'skipIssue'; reviewId: unknown; issueIndex: unknown; skipped: unknown }
  | { type: 'reviewEditedFiles' }
  | { type: 'setDiagnosticsHidden'; hidden: unknown };

export type ReviewIssueStates = {
  reviewId: string;
  skippedIssueIndexes: number[];
  editedIssueIndexes: number[];
  diagnosticsHidden: boolean;
};

export type DiffStats = {
  files: DiffFileStats[];
  fileCount: number;
  additions: number;
  deletions: number;
  changedLineCount: number;
  filteredCharCount: number;
  maxDiffChars: number;
};

export type DiffFileStats = {
  path: string;
  additions: number;
  deletions: number;
  changedLineCount: number;
  filteredCharCount: number;
};

export type ReviewResultSummary = {
  reviewId: string;
  verdict: string;
  risk: 'low' | 'medium' | 'high';
  summary: string;
  reviewedFileCount: number;
  issueCount: number;
  tests: string[];
  issues: ReviewIssueSummary[];
};

export type ReviewIssueSummary = {
  index: number;
  severity: 'must_fix' | 'should_fix' | 'suggestion';
  confidence: number;
  file: string;
  line: number;
  endLine?: number;
  title: string;
  description: string;
  impact?: string;
  suggestion?: string;
  codeSnippet?: string;
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
      type: 'currentBranch';
      requestId: number;
      status: 'loaded' | 'error';
      branch?: string;
    }
  | {
      type: 'branches';
      requestId: number;
      status: 'loaded' | 'error';
      branches: string[];
      defaultBranch?: string;
    }
  | {
      type: 'settings';
      status: 'saved' | 'error';
      message: string;
      maxDiffChars?: number;
      setupComplete?: boolean;
      language?: LanguagePreference;
      locale?: Locale;
    }
  | { type: 'issueStates'; states: ReviewIssueStates };

export type WebviewInitialState = {
  locale: Locale;
  language: LanguagePreference;
  workspaces: Array<{ index: number; name: string; path: string }>;
  apiUrl: string;
  apiKey: string;
  model: string;
  baseBranch: string;
  maxDiffChars: number;
  setupComplete: boolean;
};
import type { LanguagePreference, Locale } from './localization.js';
