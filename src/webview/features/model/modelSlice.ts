import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { t } from '../../../shared/localization.js';

export type ModelsStatus = 'idle' | 'loading' | 'loaded' | 'error';

export type ModelState = {
  url: string;
  apiKey: string;
  model: string;
  models: string[];
  status: ModelsStatus;
  message: string;
  requestId: number;
};

const initialState: ModelState = {
  url: 'http://localhost:11434/v1',
  apiKey: '',
  model: '',
  models: [],
  status: 'idle',
  message: t('model.enterUrl'),
  requestId: 0,
};

export const modelSlice = createSlice({
  name: 'model',
  initialState,
  reducers: {
    urlChanged(state, action: PayloadAction<string>) {
      state.url = action.payload;
    },
    apiKeyChanged(state, action: PayloadAction<string>) {
      state.apiKey = action.payload;
    },
    modelChanged(state, action: PayloadAction<string>) {
      state.model = action.payload;
    },
    modelsInvalidated(state, action: PayloadAction<{ requestId: number; message: string }>) {
      state.models = [];
      state.status = 'idle';
      state.message = action.payload.message;
      state.requestId = action.payload.requestId;
    },
    modelsRequested(state, action: PayloadAction<number>) {
      state.models = [];
      state.status = 'loading';
      state.message = t('model.fetching');
      state.requestId = action.payload;
    },
    modelsReceived(
      state,
      action: PayloadAction<{
        requestId: number;
        status: 'loaded' | 'error';
        models: string[];
        message: string;
      }>,
    ) {
      if (action.payload.requestId !== state.requestId) return;
      state.models = action.payload.models;
      state.status = action.payload.status;
      state.message = action.payload.message;
      if (action.payload.status === 'loaded' && !state.models.includes(state.model)) {
        state.model = state.models[0] ?? '';
      }
    },
  },
});

export const {
  urlChanged,
  apiKeyChanged,
  modelChanged,
  modelsInvalidated,
  modelsRequested,
  modelsReceived,
} = modelSlice.actions;
