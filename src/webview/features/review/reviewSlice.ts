import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type {
  DiffStats,
  ReviewResultSummary,
  ReviewStatus,
  WebviewInitialState,
} from '../../types.js';

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
  statusMessage: '리뷰할 준비가 되었습니다.',
  diffStats: emptyDiffStats(120_000),
  diffStatsStatus: 'idle',
  diffStatsMessage: '변경 범위를 계산하는 중...',
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
      state.diffStatsStatus = 'idle';
      state.diffStatsMessage = action.payload.message;
      state.diffStatsRequestId = action.payload.requestId;
    },
    diffStatsRequested(state, action: PayloadAction<{ requestId: number; maxDiffChars: number }>) {
      state.diffStats = emptyDiffStats(action.payload.maxDiffChars);
      state.diffStatsStatus = 'loading';
      state.diffStatsMessage = 'Git 변경량을 계산하는 중...';
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
      if (action.payload.stats !== undefined) state.diffStats = action.payload.stats;
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
  reviewStateReceived,
} = reviewSlice.actions;
