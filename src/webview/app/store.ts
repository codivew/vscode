import { combineSlices, configureStore, type EnhancedStore } from '@reduxjs/toolkit';
import { navigationSlice } from '../features/navigation/navigationSlice.js';
import { ollamaSlice } from '../features/ollama/ollamaSlice.js';
import { emptyDiffStats, reviewSlice } from '../features/review/reviewSlice.js';
import { settingsSlice } from '../features/settings/settingsSlice.js';
import type { WebviewInitialState } from '../types.js';
import type { PersistedState } from './vscode-api.js';
import { t } from '../../localization.js';

export type RootState = ReturnType<typeof combinedReducer>;
export type AppStore = EnhancedStore<RootState>;

const combinedReducer = combineSlices(navigationSlice, ollamaSlice, reviewSlice, settingsSlice);

export function createAppStore(initial: WebviewInitialState, persisted?: PersistedState): AppStore {
  const maxDiffChars = initial.maxDiffChars;
  const persistedWorkspaceIndex = persisted?.workspaceIndex;
  const workspaceIndex = initial.workspaces.some(
    (workspace) => workspace.index === persistedWorkspaceIndex,
  )
    ? (persistedWorkspaceIndex ?? -1)
    : (initial.workspaces[0]?.index ?? -1);
  return configureStore({
    reducer: combinedReducer,
    preloadedState: {
      navigation: {
        activeTab: initial.setupComplete ? (persisted?.activeTab ?? 'review') : 'settings',
      },
      ollama: {
        url: initial.ollamaUrl,
        model: initial.model,
        models: [],
        status: 'idle' as const,
        message: t('ollama.enterUrl'),
        requestId: 0,
      },
      review: {
        workspaces: initial.workspaces,
        workspaceIndex,
        mode: persisted?.mode ?? 'working',
        baseBranch: persisted?.baseBranch ?? initial.baseBranch,
        status: 'idle' as const,
        statusMessage: t('review.ready'),
        diffStats: emptyDiffStats(maxDiffChars),
        diffStatsStatus: 'idle' as const,
        diffStatsMessage: t('review.scopeCalculating'),
        diffStatsRequestId: 0,
      },
      settings: {
        maxDiffChars,
        draftMaxDiffChars:
          persisted?.maxDiffCharsDraft ?? persisted?.maxDiffChars ?? initial.maxDiffChars,
        language: initial.language,
        draftLanguage: initial.language,
        locale: initial.locale,
        setupComplete: initial.setupComplete,
        status: 'idle' as const,
        message: t('settings.diffDescription'),
      },
    },
  });
}

export type AppDispatch = AppStore['dispatch'];
