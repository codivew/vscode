import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export type NavigationTab = 'review' | 'settings';

export type NavigationState = {
  activeTab: NavigationTab;
};

const initialState: NavigationState = { activeTab: 'review' };

export const navigationSlice = createSlice({
  name: 'navigation',
  initialState,
  reducers: {
    tabChanged(state, action: PayloadAction<NavigationTab>) {
      state.activeTab = action.payload;
    },
  },
});

export const { tabChanged } = navigationSlice.actions;
