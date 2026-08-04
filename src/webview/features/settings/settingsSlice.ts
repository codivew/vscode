import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { t, type LanguagePreference, type Locale } from '../../../shared/localization.js';

export type SettingsStatus = 'idle' | 'saving' | 'saved' | 'error';

export type SettingsState = {
  maxDiffChars: number;
  draftMaxDiffChars: number;
  language: LanguagePreference;
  draftLanguage: LanguagePreference;
  locale: Locale;
  setupComplete: boolean;
  status: SettingsStatus;
  message: string;
};

const initialState: SettingsState = {
  maxDiffChars: 120_000,
  draftMaxDiffChars: 120_000,
  language: 'auto',
  draftLanguage: 'auto',
  locale: 'en',
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
    draftLanguageChanged(state, action: PayloadAction<LanguagePreference>) {
      state.draftLanguage = action.payload;
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
        language?: LanguagePreference;
        locale?: Locale;
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
      if (action.payload.language !== undefined) {
        state.language = action.payload.language;
        state.draftLanguage = action.payload.language;
      }
      if (action.payload.locale !== undefined) state.locale = action.payload.locale;
    },
  },
});

export const {
  draftLanguageChanged,
  draftMaxDiffCharsChanged,
  settingsSaveRequested,
  settingsReceived,
} = settingsSlice.actions;
