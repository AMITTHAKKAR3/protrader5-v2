import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../../services/api';

interface Algorithm {
  id: string;
  name: string;
  description: string;
  type: string;
  status: string;
  parameters: any;
  performance?: {
    totalReturn: number;
    winRate: number;
    totalTrades: number;
  };
}

interface AlgoTradingState {
  algorithms: Algorithm[];
  isLoading: boolean;
  error: string | null;
}

const initialState: AlgoTradingState = {
  algorithms: [],
  isLoading: false,
  error: null,
};

export const fetchAlgorithms = createAsyncThunk(
  'algoTrading/fetchAlgorithms',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/algo-trading/algorithms');
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch algorithms');
    }
  }
);

const algoTradingSlice = createSlice({
  name: 'algoTrading',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAlgorithms.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchAlgorithms.fulfilled, (state, action) => {
        state.isLoading = false;
        state.algorithms = action.payload;
      })
      .addCase(fetchAlgorithms.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export default algoTradingSlice.reducer;
