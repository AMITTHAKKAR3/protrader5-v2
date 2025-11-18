import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { api } from '../../services/api';

interface Order {
  id: string;
  symbol: string;
  type: string;
  side: string;
  quantity: number;
  price?: number;
  status: string;
  filledQuantity: number;
  remainingQuantity: number;
  averagePrice?: number;
  createdAt: string;
}

interface PlaceOrderData {
  symbol: string;
  type: string;
  side: string;
  quantity: number;
  price?: number;
  stopPrice?: number;
  trailingPercent?: number;
}

interface TradingState {
  orders: Order[];
  openOrders: Order[];
  orderHistory: Order[];
  isLoading: boolean;
  error: string | null;
  lastUpdate: number | null;
}

const initialState: TradingState = {
  orders: [],
  openOrders: [],
  orderHistory: [],
  isLoading: false,
  error: null,
  lastUpdate: null,
};

// Async thunks
export const placeOrder = createAsyncThunk(
  'trading/placeOrder',
  async (orderData: PlaceOrderData, { rejectWithValue }) => {
    try {
      const response = await api.post('/trading/orders', orderData);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to place order');
    }
  }
);

export const fetchOrders = createAsyncThunk(
  'trading/fetchOrders',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/trading/orders');
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch orders');
    }
  }
);

export const cancelOrder = createAsyncThunk(
  'trading/cancelOrder',
  async (orderId: string, { rejectWithValue }) => {
    try {
      const response = await api.delete(`/trading/orders/${orderId}`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to cancel order');
    }
  }
);

const tradingSlice = createSlice({
  name: 'trading',
  initialState,
  reducers: {
    updateOrder: (state, action: PayloadAction<Order>) => {
      const index = state.orders.findIndex(order => order.id === action.payload.id);
      if (index !== -1) {
        state.orders[index] = action.payload;
      } else {
        state.orders.unshift(action.payload);
      }
      
      // Update open orders
      if (['PENDING', 'PARTIALLY_FILLED'].includes(action.payload.status)) {
        const openIndex = state.openOrders.findIndex(order => order.id === action.payload.id);
        if (openIndex !== -1) {
          state.openOrders[openIndex] = action.payload;
        } else {
          state.openOrders.unshift(action.payload);
        }
      } else {
        // Remove from open orders if filled/cancelled
        state.openOrders = state.openOrders.filter(order => order.id !== action.payload.id);
        
        // Add to history
        const historyIndex = state.orderHistory.findIndex(order => order.id === action.payload.id);
        if (historyIndex === -1) {
          state.orderHistory.unshift(action.payload);
        }
      }
      
      state.lastUpdate = Date.now();
    },
    clearOrders: (state) => {
      state.orders = [];
      state.openOrders = [];
      state.orderHistory = [];
    },
  },
  extraReducers: (builder) => {
    // Place Order
    builder
      .addCase(placeOrder.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(placeOrder.fulfilled, (state, action) => {
        state.isLoading = false;
        state.orders.unshift(action.payload);
        state.openOrders.unshift(action.payload);
      })
      .addCase(placeOrder.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch Orders
    builder
      .addCase(fetchOrders.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.isLoading = false;
        state.orders = action.payload;
        state.openOrders = action.payload.filter((order: Order) =>
          ['PENDING', 'PARTIALLY_FILLED'].includes(order.status)
        );
        state.orderHistory = action.payload.filter((order: Order) =>
          ['FILLED', 'CANCELLED', 'REJECTED'].includes(order.status)
        );
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Cancel Order
    builder
      .addCase(cancelOrder.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(cancelOrder.fulfilled, (state, action) => {
        state.isLoading = false;
        const orderId = action.payload.id;
        state.openOrders = state.openOrders.filter(order => order.id !== orderId);
        
        const orderIndex = state.orders.findIndex(order => order.id === orderId);
        if (orderIndex !== -1) {
          state.orders[orderIndex].status = 'CANCELLED';
          state.orderHistory.unshift(state.orders[orderIndex]);
        }
      })
      .addCase(cancelOrder.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { updateOrder, clearOrders } = tradingSlice.actions;
export default tradingSlice.reducer;
