import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface MarketData {
  symbol: string;
  price: number;
  volume: number;
  high24h: number;
  low24h: number;
  change24h: number;
  changePercent24h: number;
  timestamp: number;
}

interface MarketState {
  data: Record<string, MarketData>;
  subscribedSymbols: string[];
  isConnected: boolean;
  lastUpdate: number | null;
}

const initialState: MarketState = {
  data: {},
  subscribedSymbols: [],
  isConnected: false,
  lastUpdate: null,
};

const marketSlice = createSlice({
  name: 'market',
  initialState,
  reducers: {
    subscribeToSymbols: (state, action: PayloadAction<string[]>) => {
      const newSymbols = action.payload.filter(symbol => !state.subscribedSymbols.includes(symbol));
      state.subscribedSymbols = [...state.subscribedSymbols, ...newSymbols];
    },
    unsubscribeFromSymbols: (state, action: PayloadAction<string[]>) => {
      state.subscribedSymbols = state.subscribedSymbols.filter(
        symbol => !action.payload.includes(symbol)
      );
      // Remove data for unsubscribed symbols
      action.payload.forEach(symbol => {
        delete state.data[symbol];
      });
    },
    updateMarketData: (state, action: PayloadAction<MarketData>) => {
      state.data[action.payload.symbol] = action.payload;
      state.lastUpdate = Date.now();
    },
    setConnectionStatus: (state, action: PayloadAction<boolean>) => {
      state.isConnected = action.payload;
    },
    clearMarketData: (state) => {
      state.data = {};
      state.subscribedSymbols = [];
    },
  },
});

export const {
  subscribeToSymbols,
  unsubscribeFromSymbols,
  updateMarketData,
  setConnectionStatus,
  clearMarketData,
} = marketSlice.actions;

export default marketSlice.reducer;
