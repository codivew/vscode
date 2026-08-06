import { combineSlices, configureStore, type EnhancedStore } from '@reduxjs/toolkit';
import { modelSlice } from '../features/model/modelSlice.js';
import { emptyDiffStats, reviewSlice } from '../features/review/reviewSlice.js';
import { settingsSlice } from '../features/settings/settingsSlice.js';
import type { WebviewInitialState } from '../../shared/protocol.js';
import type { PersistedState } from './vscode-api.js';
import { t } from '../../shared/localization.js';

export type RootState = ReturnType<typeof combinedReducer>;
export type AppStore = EnhancedStore<RootState>;

const combinedReducer = combineSlices(modelSlice, reviewSlice, settingsSlice);

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
      model: {
        url: initial.apiUrl,
        model: initial.model,
        models: [],
        status: 'idle' as const,
        message: t('model.enterUrl'),
        requestId: 0,
      },
      review: {
        workspaces: initial.workspaces,
        workspaceIndex,
        mode: persisted?.mode ?? 'working',
        baseBranch: persisted?.baseBranch ?? initial.baseBranch,
        status: 'idle' as const,
        statusMessage: t('review.ready'),
        skippedIssueIndexes: [],
        editedIssueIndexes: [],
        diagnosticsHidden: false,
        diffStats: emptyDiffStats(maxDiffChars),
        selectedFiles: [],
        diffStatsStatus: 'idle' as const,
        diffStatsMessage: t('review.scopeCalculating'),
        diffStatsRequestId: 0,
        currentBranchStatus: 'idle' as const,
        currentBranchRequestId: 0,
        availableBranches: [],
        branchesStatus: 'idle' as const,
        branchesRequestId: 0,
      },
      settings: {
        maxDiffChars,
        draftMaxDiffChars:
          persisted?.maxDiffCharsDraft ?? persisted?.maxDiffChars ?? initial.maxDiffChars,
        language: initial.language,
        draftLanguage: initial.language,
        locale: initial.locale,
        isSetupComplete: initial.setupComplete,
        status: 'idle' as const,
        message: t('settings.diffDescription'),
        authenticationType: initial.authenticationType,
        apiKey: '',
        username: initial.authenticationUsername,
        password: '',
        authenticationConfigured: initial.authenticationConfigured,
      },
    },
  });
}

export type AppDispatch = AppStore['dispatch'];
