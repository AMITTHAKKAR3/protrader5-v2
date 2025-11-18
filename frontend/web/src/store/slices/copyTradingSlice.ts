import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { api } from '../../services/api';

interface Strategy {
  id: string;
  name: string;
  description: string;
  providerId: string;
  providerName: string;
  status: string;
  subscriptionFee: number;
  profitShare: number;
  performance: {
    totalReturn: number;
    monthlyReturn: number;
    winRate: number;
    sharpeRatio: number;
    maxDrawdown: number;
  };
  rating: number;
  reviews: number;
}

interface Subscription {
  id: string;
  strategyId: string;
  strategyName: string;
  status: string;
  investmentAmount: number;
  currentValue: number;
  totalReturn: number;
  startDate: string;
}

interface CopyTradingState {
  strategies: Strategy[];
  subscriptions: Subscription[];
  featuredStrategies: Strategy[];
  isLoading: boolean;
  error: string | null;
}

const initialState: CopyTradingState = {
  strategies: [],
  subscriptions: [],
  featuredStrategies: [],
  isLoading: false,
  error: null,
};

export const fetchStrategies = createAsyncThunk(
  'copyTrading/fetchStrategies',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/copy-trading/strategies');
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch strategies');
    }
  }
);

export const fetchSubscriptions = createAsyncThunk(
  'copyTrading/fetchSubscriptions',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/copy-trading/subscriptions');
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch subscriptions');
    }
  }
);

export const subscribeToStrategy = createAsyncThunk(
  'copyTrading/subscribe',
  async (data: { strategyId: string; investmentAmount: number }, { rejectWithValue }) => {
    try {
      const response = await api.post('/copy-trading/subscriptions', data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to subscribe');
    }
  }
);

const copyTradingSlice = createSlice({
  name: 'copyTrading',
  initialState,
  reducers: {
    clearStrategies: (state) => {
      state.strategies = [];
      state.featuredStrategies = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchStrategies.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchStrategies.fulfilled, (state, action) => {
        state.isLoading = false;
        state.strategies = action.payload;
        state.featuredStrategies = action.payload.filter((s: Strategy) => s.status === 'ACTIVE').slice(0, 6);
      })
      .addCase(fetchStrategies.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchSubscriptions.fulfilled, (state, action) => {
        state.subscriptions = action.payload;
      })
      .addCase(subscribeToStrategy.fulfilled, (state, action) => {
        state.subscriptions.push(action.payload);
      });
  },
});

export const { clearStrategies } = copyTradingSlice.actions;
export default copyTradingSlice.reducer;
