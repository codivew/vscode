import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { t } from '../../../localization.js';

export type SettingsStatus = 'idle' | 'saving' | 'saved' | 'error';

export type SettingsState = {
  maxDiffChars: number;
  draftMaxDiffChars: number;
  setupComplete: boolean;
  status: SettingsStatus;
  message: string;
};

const initialState: SettingsState = {
  maxDiffChars: 120_000,
  draftMaxDiffChars: 120_000,
  setupComplete: false,
  status: 'idle',
  message: t('settings.diffDescription'),
};

export const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    draftMaxDiffCharsChanged(state, action: PayloadAction<number>) {
      state.draftMaxDiffChars = action.payload;
      state.status = 'idle';
      state.message = t('settings.changed');
    },
    settingsSaveRequested(state) {
      state.status = 'saving';
      state.message = t('settings.savingStatus');
    },
    settingsReceived(
      state,
      action: PayloadAction<{
        status: 'saved' | 'error';
        message: string;
        maxDiffChars?: number;
        setupComplete?: boolean;
      }>,
    ) {
      state.status = action.payload.status;
      state.message = action.payload.message;
      if (action.payload.maxDiffChars !== undefined) {
        state.maxDiffChars = action.payload.maxDiffChars;
        state.draftMaxDiffChars = action.payload.maxDiffChars;
      }
      if (action.payload.setupComplete !== undefined) {
        state.setupComplete = action.payload.setupComplete;
      }
    },
  },
});

export const { draftMaxDiffCharsChanged, settingsSaveRequested, settingsReceived } =
  settingsSlice.actions;
