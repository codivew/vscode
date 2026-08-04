/** @jsxImportSource react */
import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import App from './App.js';
import { connectExtensionMessages } from './app/extension-messages.js';
import { persistStore } from './app/persist-store.js';
import { createAppStore } from './app/store.js';
import { vscode } from './app/vscode-api.js';
import type { WebviewInitialState } from '../shared/protocol.js';
import { setLocale } from '../shared/localization.js';

const root = document.getElementById('root');
if (root === null) throw new Error('Codivew Webview root element is missing.');
const encodedState = root.dataset.initialState;
if (encodedState === undefined) throw new Error('Codivew Webview initial state is missing.');

const initial = JSON.parse(encodedState) as WebviewInitialState;
setLocale(initial.locale);
document.documentElement.lang = initial.locale;
const persisted = vscode.getState();
const store = createAppStore(initial, persisted);
const initialTab = initial.setupComplete
  ? persisted?.activeTab === 'settings'
    ? 'settings'
    : 'review'
  : 'settings';
const router = createMemoryRouter([{ path: '*', element: <App /> }], {
  initialEntries: [`/${initialTab}`],
});

connectExtensionMessages(store, (path) => void router.navigate(path));

persistStore(store, {
  getActiveTab: () => pathToTab(router.state.location.pathname),
  subscribe: (listener) => router.subscribe(listener),
});

createRoot(root).render(
  <React.StrictMode>
    <Provider store={store}>
      <RouterProvider router={router} />
    </Provider>
  </React.StrictMode>,
);

function pathToTab(pathname: string): 'review' | 'results' | 'settings' {
  if (pathname === '/results') return 'results';
  if (pathname === '/settings') return 'settings';
  return 'review';
}
