import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type {
  DiffStats,
  ReviewResultSummary,
  ReviewStatus,
  WebviewInitialState,
} from '../../../shared/protocol.js';
import { t } from '../../../shared/localization.js';

export type DiffStatsStatus = 'idle' | 'loading' | 'loaded' | 'error';

export const emptyDiffStats = (maxDiffChars: number): DiffStats => ({
  files: [],
  fileCount: 0,
  additions: 0,
  deletions: 0,
  changedLineCount: 0,
  filteredCharCount: 0,
  maxDiffChars,
});

export type ReviewState = {
  workspaces: WebviewInitialState['workspaces'];
  workspaceIndex: number;
  mode: string;
  baseBranch: string;
  status: ReviewStatus;
  statusMessage: string;
  result?: ReviewResultSummary;
  diffStats: DiffStats;
  selectedFiles: string[];
  diffStatsStatus: DiffStatsStatus;
  diffStatsMessage: string;
  diffStatsRequestId: number;
};

const initialState: ReviewState = {
  workspaces: [],
  workspaceIndex: -1,
  mode: 'working',
  baseBranch: 'main',
  status: 'idle',
  statusMessage: t('review.ready'),
  diffStats: emptyDiffStats(120_000),
  selectedFiles: [],
  diffStatsStatus: 'idle',
  diffStatsMessage: t('review.scopeCalculating'),
  diffStatsRequestId: 0,
};

export const reviewSlice = createSlice({
  name: 'review',
  initialState,
  reducers: {
    workspaceChanged(state, action: PayloadAction<number>) {
      state.workspaceIndex = action.payload;
    },
    modeChanged(state, action: PayloadAction<string>) {
      state.mode = action.payload;
    },
    baseBranchChanged(state, action: PayloadAction<string>) {
      state.baseBranch = action.payload;
    },
    diffStatsInvalidated(
      state,
      action: PayloadAction<{ requestId: number; message: string; maxDiffChars: number }>,
    ) {
      state.diffStats = emptyDiffStats(action.payload.maxDiffChars);
      state.selectedFiles = [];
      state.diffStatsStatus = 'idle';
      state.diffStatsMessage = action.payload.message;
      state.diffStatsRequestId = action.payload.requestId;
    },
    diffStatsRequested(state, action: PayloadAction<{ requestId: number; maxDiffChars: number }>) {
      state.diffStats = emptyDiffStats(action.payload.maxDiffChars);
      state.selectedFiles = [];
      state.diffStatsStatus = 'loading';
      state.diffStatsMessage = t('review.gitCalculating');
      state.diffStatsRequestId = action.payload.requestId;
    },
    diffStatsReceived(
      state,
      action: PayloadAction<{
        requestId: number;
        status: 'loaded' | 'error';
        message: string;
        stats?: DiffStats;
      }>,
    ) {
      if (action.payload.requestId !== state.diffStatsRequestId) return;
      state.diffStatsStatus = action.payload.status;
      state.diffStatsMessage = action.payload.message;
      if (action.payload.stats !== undefined) {
        state.diffStats = action.payload.stats;
        state.selectedFiles = action.payload.stats.files.map((file) => file.path);
      }
    },
    fileSelectionChanged(state, action: PayloadAction<{ path: string; selected: boolean }>) {
      const selected = new Set(state.selectedFiles);
      if (action.payload.selected) selected.add(action.payload.path);
      else selected.delete(action.payload.path);
      state.selectedFiles = state.diffStats.files
        .map((file) => file.path)
        .filter((path) => selected.has(path));
      updateSelectedStats(state);
    },
    allFilesSelectionChanged(state, action: PayloadAction<boolean>) {
      state.selectedFiles = action.payload ? state.diffStats.files.map((file) => file.path) : [];
      updateSelectedStats(state);
    },
    reviewStateReceived(
      state,
      action: PayloadAction<{
        status: ReviewStatus;
        message: string;
        result?: ReviewResultSummary;
      }>,
    ) {
      state.status = action.payload.status;
      state.statusMessage = action.payload.message;
      if (action.payload.status === 'completed' && action.payload.result !== undefined) {
        state.result = action.payload.result;
      }
    },
  },
});

export const {
  workspaceChanged,
  modeChanged,
  baseBranchChanged,
  diffStatsInvalidated,
  diffStatsRequested,
  diffStatsReceived,
  fileSelectionChanged,
  allFilesSelectionChanged,
  reviewStateReceived,
} = reviewSlice.actions;

function updateSelectedStats(state: ReviewState): void {
  const selected = new Set(state.selectedFiles);
  const files = state.diffStats.files.filter((file) => selected.has(file.path));
  state.diffStats.fileCount = files.length;
  state.diffStats.additions = files.reduce((total, file) => total + file.additions, 0);
  state.diffStats.deletions = files.reduce((total, file) => total + file.deletions, 0);
  state.diffStats.changedLineCount = files.reduce(
    (total, file) => total + file.changedLineCount,
    0,
  );
  state.diffStats.filteredCharCount = files.reduce(
    (total, file) => total + file.filteredCharCount,
    0,
  );
}
