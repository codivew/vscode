import { modelsReceived } from '../features/ollama/ollamaSlice.js';
import { diffStatsReceived, reviewStateReceived } from '../features/review/reviewSlice.js';
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
    if (data.type === 'settings') {
      const completingSetup = !store.getState().settings.setupComplete;
      if (data.locale !== undefined) {
        setLocale(data.locale);
        document.documentElement.lang = data.locale;
      }
      store.dispatch(settingsReceived(data));
      if (data.status === 'saved' && completingSetup) navigate('/review');
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
