import { modelsReceived } from '../features/ollama/ollamaSlice.js';
import { diffStatsReceived, reviewStateReceived } from '../features/review/reviewSlice.js';
import { settingsReceived } from '../features/settings/settingsSlice.js';
import { tabChanged } from '../features/navigation/navigationSlice.js';
import type { WebviewMessage } from '../types.js';
import type { AppStore } from './store.js';
import { setLocale } from '../../localization.js';

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
      const completingSetup = !store.getState().settings.setupComplete;
      if (data.locale !== undefined) {
        setLocale(data.locale);
        document.documentElement.lang = data.locale;
      }
      store.dispatch(settingsReceived(data));
      if (data.status === 'saved' && completingSetup) store.dispatch(tabChanged('review'));
      return;
    }
    store.dispatch(reviewStateReceived(data));
  };
  window.addEventListener('message', listener);
  return () => window.removeEventListener('message', listener);
}
