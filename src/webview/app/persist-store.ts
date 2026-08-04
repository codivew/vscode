import type { AppStore } from './store.js';
import { vscode } from './vscode-api.js';

export function persistStore(store: AppStore): () => void {
  return store.subscribe(() => {
    const state = store.getState();
    vscode.setState({
      workspaceIndex: state.review.workspaceIndex,
      mode: state.review.mode,
      baseBranch: state.review.baseBranch,
      activeTab: state.navigation.activeTab === 'results' ? 'review' : state.navigation.activeTab,
      maxDiffChars: state.settings.maxDiffChars,
      maxDiffCharsDraft: state.settings.draftMaxDiffChars,
    });
  });
}
