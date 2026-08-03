import { modelsReceived } from '../features/ollama/ollama-slice.js';
import { diffStatsReceived, reviewStateReceived } from '../features/review/review-slice.js';
import { settingsReceived } from '../features/settings/settings-slice.js';
import type { WebviewMessage } from '../protocol.js';
import type { AppStore } from './store.js';

export function connectExtensionMessages(store: AppStore): () => void {
  const listener = ({ data }: MessageEvent<WebviewMessage>): void => {
    if (data.type === 'models') {
      store.dispatch(modelsReceived(data));
      return;
    }
    if (data.type === 'diffStats') {
      store.dispatch(diffStatsReceived(data));
      return;
    }
    if (data.type === 'settings') {
      store.dispatch(settingsReceived(data));
      return;
    }
    store.dispatch(reviewStateReceived(data));
  };
  window.addEventListener('message', listener);
  return () => window.removeEventListener('message', listener);
}
