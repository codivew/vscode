import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export type SettingsStatus = 'idle' | 'saving' | 'saved' | 'error';

export type SettingsState = {
  maxDiffChars: number;
  draftMaxDiffChars: number;
  status: SettingsStatus;
  message: string;
};

const initialState: SettingsState = {
  maxDiffChars: 120_000,
  draftMaxDiffChars: 120_000,
  status: 'idle',
  message: '한 번의 리뷰에 전달할 필터링된 Diff 크기를 설정합니다.',
};

export const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    draftMaxDiffCharsChanged(state, action: PayloadAction<number>) {
      state.draftMaxDiffChars = action.payload;
      state.status = 'idle';
      state.message = '변경된 값을 저장하면 다음 리뷰부터 적용됩니다.';
    },
    settingsSaveRequested(state) {
      state.status = 'saving';
      state.message = '설정을 저장하는 중...';
    },
    settingsReceived(
      state,
      action: PayloadAction<{
        status: 'saved' | 'error';
        message: string;
        maxDiffChars?: number;
      }>,
    ) {
      state.status = action.payload.status;
      state.message = action.payload.message;
      if (action.payload.maxDiffChars !== undefined) {
        state.maxDiffChars = action.payload.maxDiffChars;
        state.draftMaxDiffChars = action.payload.maxDiffChars;
      }
    },
  },
});

export const { draftMaxDiffCharsChanged, settingsSaveRequested, settingsReceived } =
  settingsSlice.actions;
