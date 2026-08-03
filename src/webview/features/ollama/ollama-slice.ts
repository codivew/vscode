import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export type ModelsStatus = 'idle' | 'loading' | 'loaded' | 'error';

export type OllamaState = {
  url: string;
  model: string;
  models: string[];
  status: ModelsStatus;
  message: string;
  requestId: number;
};

const initialState: OllamaState = {
  url: 'http://localhost:11434',
  model: '',
  models: [],
  status: 'idle',
  message: 'Ollama URL을 입력하세요.',
  requestId: 0,
};

export const ollamaSlice = createSlice({
  name: 'ollama',
  initialState,
  reducers: {
    urlChanged(state, action: PayloadAction<string>) {
      state.url = action.payload;
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
      state.message = '설치된 모델을 조회하는 중...';
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

export const { urlChanged, modelChanged, modelsInvalidated, modelsRequested, modelsReceived } =
  ollamaSlice.actions;
