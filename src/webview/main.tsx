/** @jsxImportSource react */
import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import App from './App.js';
import { connectExtensionMessages } from './app/extension-messages.js';
import { persistStore } from './app/persist-store.js';
import { createAppStore } from './app/store.js';
import { vscode } from './app/vscode-api.js';
import type { WebviewInitialState } from './types.js';
import './review.css';

const root = document.getElementById('root');
if (root === null) throw new Error('Codivew Webview root element is missing.');
const encodedState = root.dataset.initialState;
if (encodedState === undefined) throw new Error('Codivew Webview initial state is missing.');

const initial = JSON.parse(encodedState) as WebviewInitialState;
const store = createAppStore(initial, vscode.getState());
connectExtensionMessages(store);
persistStore(store);

createRoot(root).render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>,
);
