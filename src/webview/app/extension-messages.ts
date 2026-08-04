import { modelsReceived } from '../features/ollama/ollamaSlice.js';
import {
  branchesReceived,
  currentBranchReceived,
  diffStatsReceived,
  issueStatesReceived,
  reviewStateReceived,
} from '../features/review/reviewSlice.js';
import { settingsReceived } from '../features/settings/settingsSlice.js';
import type { WebviewMessage } from '../../shared/protocol.js';
import type { AppStore } from './store.js';
import { setLocale } from '../../shared/localization.js';

export function connectExtensionMessages(
  store: AppStore,
  navigate: (path: string) => void,
): () => void {
  const listener = ({ data }: MessageEvent<WebviewMessage>): void => {
    if (data.type === 'models') {
      store.dispatch(modelsReceived(data));
      return;
    }
    if (data.type === 'diffStats') {
      store.dispatch(diffStatsReceived(data));
      return;
    }
    if (data.type === 'currentBranch') {
      store.dispatch(currentBranchReceived(data));
      return;
    }
    if (data.type === 'branches') {
      store.dispatch(branchesReceived(data));
      return;
    }
    if (data.type === 'settings') {
      const completingSetup = !store.getState().settings.isSetupComplete;
      if (data.locale !== undefined) {
        setLocale(data.locale);
        document.documentElement.lang = data.locale;
      }
      store.dispatch(
        settingsReceived({
          status: data.status,
          message: data.message,
          maxDiffChars: data.maxDiffChars,
          isSetupComplete: data.setupComplete,
          language: data.language,
          locale: data.locale,
        }),
      );
      if (data.status === 'saved' && completingSetup) navigate('/review');
      return;
    }
    if (data.type === 'issueStates') {
      store.dispatch(issueStatesReceived(data.states));
      return;
    }
    store.dispatch(reviewStateReceived(data));
    if (data.status === 'completed' && data.result !== undefined) {
      navigate('/results');
    }
  };
  window.addEventListener('message', listener);
  return () => window.removeEventListener('message', listener);
}
