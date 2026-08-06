import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { t, type LanguagePreference, type Locale } from '../../../shared/localization.js';
import type { RootState } from '../../app/store.js';
import type { AuthenticationType } from '../../../shared/protocol.js';

export type SettingsStatus = 'idle' | 'saving' | 'saved' | 'error';

export type SettingsState = {
  maxDiffChars: number;
  draftMaxDiffChars: number;
  language: LanguagePreference;
  draftLanguage: LanguagePreference;
  locale: Locale;
  isSetupComplete: boolean;
  status: SettingsStatus;
  message: string;
  authenticationType: AuthenticationType;
  apiKey: string;
  username: string;
  password: string;
  authenticationConfigured: boolean;
};

const initialState: SettingsState = {
  maxDiffChars: 120_000,
  draftMaxDiffChars: 120_000,
  language: 'auto',
  draftLanguage: 'auto',
  locale: 'en',
  isSetupComplete: false,
  status: 'idle',
  message: t('settings.diffDescription'),
  authenticationType: 'none',
  apiKey: '',
  username: '',
  password: '',
  authenticationConfigured: false,
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
    authenticationTypeChanged(state, action: PayloadAction<AuthenticationType>) {
      state.authenticationType = action.payload;
      state.apiKey = '';
      state.password = '';
      state.authenticationConfigured = action.payload === 'none';
    },
    apiKeyChanged(state, action: PayloadAction<string>) {
      state.apiKey = action.payload;
      state.authenticationConfigured = false;
    },
    usernameChanged(state, action: PayloadAction<string>) {
      state.username = action.payload;
      state.authenticationConfigured = false;
    },
    passwordChanged(state, action: PayloadAction<string>) {
      state.password = action.payload;
      state.authenticationConfigured = false;
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
        isSetupComplete?: boolean;
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
      if (action.payload.isSetupComplete !== undefined) {
        state.isSetupComplete = action.payload.isSetupComplete;
      }
      if (action.payload.language !== undefined) {
        state.language = action.payload.language;
        state.draftLanguage = action.payload.language;
      }
      if (action.payload.locale !== undefined) state.locale = action.payload.locale;
      if (action.payload.status === 'saved') {
        state.authenticationConfigured = true;
        state.apiKey = '';
        state.password = '';
      }
    },
  },
});

export const {
  apiKeyChanged,
  authenticationTypeChanged,
  draftLanguageChanged,
  draftMaxDiffCharsChanged,
  settingsSaveRequested,
  settingsReceived,
  usernameChanged,
  passwordChanged,
} = settingsSlice.actions;

export const selectIsSetupComplete = (state: RootState): boolean => state.settings.isSetupComplete;
