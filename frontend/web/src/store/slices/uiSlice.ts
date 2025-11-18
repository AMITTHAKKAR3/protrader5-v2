import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UIState {
  theme: 'light' | 'dark';
  sidebarOpen: boolean;
  activeTab: string;
  chartLayout: 'single' | 'dual' | 'quad';
  showOrderBook: boolean;
  showTrades: boolean;
  showPositions: boolean;
}

const initialState: UIState = {
  theme: (localStorage.getItem('theme') as 'light' | 'dark') || 'dark',
  sidebarOpen: true,
  activeTab: 'trading',
  chartLayout: 'single',
  showOrderBook: true,
  showTrades: true,
  showPositions: true,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setTheme: (state, action: PayloadAction<'light' | 'dark'>) => {
      state.theme = action.payload;
      localStorage.setItem('theme', action.payload);
    },
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setActiveTab: (state, action: PayloadAction<string>) => {
      state.activeTab = action.payload;
    },
    setChartLayout: (state, action: PayloadAction<'single' | 'dual' | 'quad'>) => {
      state.chartLayout = action.payload;
    },
    toggleOrderBook: (state) => {
      state.showOrderBook = !state.showOrderBook;
    },
    toggleTrades: (state) => {
      state.showTrades = !state.showTrades;
    },
    togglePositions: (state) => {
      state.showPositions = !state.showPositions;
    },
  },
});

export const {
  setTheme,
  toggleSidebar,
  setActiveTab,
  setChartLayout,
  toggleOrderBook,
  toggleTrades,
  togglePositions,
} = uiSlice.actions;

export default uiSlice.reducer;
