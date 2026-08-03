import { modelsReceived } from '../features/ollama/ollamaSlice.js';
import { diffStatsReceived, reviewStateReceived } from '../features/review/reviewSlice.js';
import { settingsReceived } from '../features/settings/settingsSlice.js';
import type { WebviewMessage } from '../types.js';
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
