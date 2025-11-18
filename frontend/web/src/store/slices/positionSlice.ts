import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { api } from '../../services/api';

interface Position {
  id: string;
  symbol: string;
  side: string;
  quantity: number;
  entryPrice: number;
  currentPrice: number;
  unrealizedPnL: number;
  unrealizedPnLPercent: number;
  realizedPnL: number;
  stopLoss?: number;
  takeProfit?: number;
  createdAt: string;
}

interface PositionState {
  positions: Position[];
  totalUnrealizedPnL: number;
  totalRealizedPnL: number;
  isLoading: boolean;
  error: string | null;
  lastUpdate: number | null;
}

const initialState: PositionState = {
  positions: [],
  totalUnrealizedPnL: 0,
  totalRealizedPnL: 0,
  isLoading: false,
  error: null,
  lastUpdate: null,
};

// Async thunks
export const fetchPositions = createAsyncThunk(
  'position/fetchPositions',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/trading/positions');
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch positions');
    }
  }
);

export const closePosition = createAsyncThunk(
  'position/closePosition',
  async (positionId: string, { rejectWithValue }) => {
    try {
      const response = await api.post(`/trading/positions/${positionId}/close`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to close position');
    }
  }
);

export const updateStopLoss = createAsyncThunk(
  'position/updateStopLoss',
  async ({ positionId, stopLoss }: { positionId: string; stopLoss: number }, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/trading/positions/${positionId}`, { stopLoss });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update stop loss');
    }
  }
);

export const updateTakeProfit = createAsyncThunk(
  'position/updateTakeProfit',
  async ({ positionId, takeProfit }: { positionId: string; takeProfit: number }, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/trading/positions/${positionId}`, { takeProfit });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update take profit');
    }
  }
);

const positionSlice = createSlice({
  name: 'position',
  initialState,
  reducers: {
    updatePosition: (state, action: PayloadAction<Position>) => {
      const index = state.positions.findIndex(pos => pos.id === action.payload.id);
      if (index !== -1) {
        state.positions[index] = action.payload;
      } else {
        state.positions.push(action.payload);
      }
      
      // Recalculate totals
      state.totalUnrealizedPnL = state.positions.reduce((sum, pos) => sum + pos.unrealizedPnL, 0);
      state.totalRealizedPnL = state.positions.reduce((sum, pos) => sum + pos.realizedPnL, 0);
      state.lastUpdate = Date.now();
    },
    removePosition: (state, action: PayloadAction<string>) => {
      state.positions = state.positions.filter(pos => pos.id !== action.payload);
      
      // Recalculate totals
      state.totalUnrealizedPnL = state.positions.reduce((sum, pos) => sum + pos.unrealizedPnL, 0);
      state.totalRealizedPnL = state.positions.reduce((sum, pos) => sum + pos.realizedPnL, 0);
    },
    clearPositions: (state) => {
      state.positions = [];
      state.totalUnrealizedPnL = 0;
      state.totalRealizedPnL = 0;
    },
  },
  extraReducers: (builder) => {
    // Fetch Positions
    builder
      .addCase(fetchPositions.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchPositions.fulfilled, (state, action) => {
        state.isLoading = false;
        state.positions = action.payload;
        state.totalUnrealizedPnL = action.payload.reduce((sum: number, pos: Position) => sum + pos.unrealizedPnL, 0);
        state.totalRealizedPnL = action.payload.reduce((sum: number, pos: Position) => sum + pos.realizedPnL, 0);
      })
      .addCase(fetchPositions.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Close Position
    builder
      .addCase(closePosition.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(closePosition.fulfilled, (state, action) => {
        state.isLoading = false;
        state.positions = state.positions.filter(pos => pos.id !== action.payload.id);
        state.totalUnrealizedPnL = state.positions.reduce((sum, pos) => sum + pos.unrealizedPnL, 0);
        state.totalRealizedPnL += action.payload.realizedPnL;
      })
      .addCase(closePosition.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Update Stop Loss
    builder
      .addCase(updateStopLoss.fulfilled, (state, action) => {
        const index = state.positions.findIndex(pos => pos.id === action.payload.id);
        if (index !== -1) {
          state.positions[index].stopLoss = action.payload.stopLoss;
        }
      });

    // Update Take Profit
    builder
      .addCase(updateTakeProfit.fulfilled, (state, action) => {
        const index = state.positions.findIndex(pos => pos.id === action.payload.id);
        if (index !== -1) {
          state.positions[index].takeProfit = action.payload.takeProfit;
        }
      });
  },
});

export const { updatePosition, removePosition, clearPositions } = positionSlice.actions;
export default positionSlice.reducer;
