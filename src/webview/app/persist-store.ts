import type { AppStore } from './store.js';
import { vscode } from './vscode-api.js';

type NavigationPersistence = {
  getActiveTab(): 'review' | 'results' | 'settings';
  subscribe(listener: () => void): () => void;
};

export function persistStore(store: AppStore, navigation: NavigationPersistence): () => void {
  const persist = (): void => {
    const state = store.getState();
    const activeTab = navigation.getActiveTab();
    vscode.setState({
      workspaceIndex: state.review.workspaceIndex,
      mode: state.review.mode,
      baseBranch: state.review.baseBranch,
      activeTab: activeTab === 'results' ? 'review' : activeTab,
      maxDiffChars: state.settings.maxDiffChars,
      maxDiffCharsDraft: state.settings.draftMaxDiffChars,
    });
  };
  const unsubscribeStore = store.subscribe(persist);
  const unsubscribeNavigation = navigation.subscribe(persist);
  return () => {
    unsubscribeStore();
    unsubscribeNavigation();
  };
}
