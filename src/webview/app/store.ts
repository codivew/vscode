import { combineSlices, configureStore, type EnhancedStore } from '@reduxjs/toolkit';
import { navigationSlice, type NavigationState } from '../features/navigation/navigationSlice.js';
import { ollamaSlice, type OllamaState } from '../features/ollama/ollamaSlice.js';
import { emptyDiffStats, reviewSlice, type ReviewState } from '../features/review/reviewSlice.js';
import { settingsSlice, type SettingsState } from '../features/settings/settingsSlice.js';
import type { WebviewInitialState } from '../protocol.js';
import type { PersistedState } from './vscode-api.js';

export type RootState = {
  navigation: NavigationState;
  ollama: OllamaState;
  review: ReviewState;
  settings: SettingsState;
};

export type AppStore = EnhancedStore<RootState>;

const combinedReducer = combineSlices(navigationSlice, ollamaSlice, reviewSlice, settingsSlice);

export function createAppStore(initial: WebviewInitialState, persisted?: PersistedState): AppStore {
  const maxDiffChars = persisted?.maxDiffChars ?? initial.maxDiffChars;
  return configureStore({
    reducer: combinedReducer,
    preloadedState: {
      navigation: { activeTab: persisted?.activeTab ?? 'review' },
      ollama: {
        url: persisted?.ollamaUrl ?? initial.ollamaUrl,
        model: persisted?.model ?? initial.model,
        models: [],
        status: 'idle' as const,
        message: 'Ollama URL을 입력하세요.',
        requestId: 0,
      },
      review: {
        workspaces: initial.workspaces,
        workspaceIndex: persisted?.workspaceIndex ?? initial.workspaces[0]?.index ?? -1,
        mode: persisted?.mode ?? 'working',
        baseBranch: persisted?.baseBranch ?? initial.baseBranch,
        status: 'idle' as const,
        statusMessage: '리뷰할 준비가 되었습니다.',
        diffStats: emptyDiffStats(maxDiffChars),
        diffStatsStatus: 'idle' as const,
        diffStatsMessage: '변경 범위를 계산하는 중...',
        diffStatsRequestId: 0,
      },
      settings: {
        maxDiffChars,
        draftMaxDiffChars:
          persisted?.maxDiffCharsDraft ?? persisted?.maxDiffChars ?? initial.maxDiffChars,
        status: 'idle' as const,
        message: '한 번의 리뷰에 전달할 필터링된 Diff 크기를 설정합니다.',
      },
    },
  });
}

export type AppDispatch = AppStore['dispatch'];
