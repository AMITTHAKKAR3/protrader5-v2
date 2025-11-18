import { configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import authReducer from './slices/authSlice';
import marketReducer from './slices/marketSlice';
import tradingReducer from './slices/tradingSlice';
import positionReducer from './slices/positionSlice';
import copyTradingReducer from './slices/copyTradingSlice';
import algoTradingReducer from './slices/algoTradingSlice';
import notificationReducer from './slices/notificationSlice';
import uiReducer from './slices/uiSlice';
import { websocketMiddleware } from './middleware/websocketMiddleware';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    market: marketReducer,
    trading: tradingReducer,
    position: positionReducer,
    copyTrading: copyTradingReducer,
    algoTrading: algoTradingReducer,
    notification: notificationReducer,
    ui: uiReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: ['websocket/connected', 'websocket/disconnected'],
        // Ignore these field paths in all actions
        ignoredActionPaths: ['payload.timestamp'],
        // Ignore these paths in the state
        ignoredPaths: ['market.lastUpdate', 'trading.lastUpdate'],
      },
    }).concat(websocketMiddleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Typed hooks
export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
