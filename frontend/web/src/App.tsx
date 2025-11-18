import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { Provider } from 'react-redux';
import store from './store';
import theme from './theme';

// Layout
import ResponsiveLayout from './components/layout/ResponsiveLayout';

// Auth Components
import { Login, Register, TwoFactorSetup, ProtectedRoute } from './components/auth';

// Dashboard Components
import { Dashboard, PortfolioAnalytics } from './components/dashboard';

// Trading Components
import { TradingChart, OrderBook, RecentTrades, MarketTicker } from './components/trading';
import { OrderForm, OpenOrders } from './components/orders';
import { PositionsList } from './components/positions';

// Copy Trading Components
import { StrategyMarketplace, StrategyDetails, MySubscriptions } from './components/copy-trading';

// Algo Trading Components
import { AlgorithmBuilder, BacktestInterface, MyAlgorithms } from './components/algo-trading';

function App() {
  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Router>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected Routes */}
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <ResponsiveLayout>
                    <Routes>
                      {/* Dashboard */}
                      <Route path="/dashboard" element={<Dashboard />} />
                      <Route path="/portfolio" element={<PortfolioAnalytics />} />

                      {/* Trading */}
                      <Route
                        path="/trading"
                        element={
                          <div>
                            <MarketTicker />
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', padding: '16px' }}>
                              <TradingChart />
                              <OrderBook />
                            </div>
                            <RecentTrades />
                            <OrderForm />
                            <OpenOrders />
                            <PositionsList />
                          </div>
                        }
                      />

                      {/* Copy Trading */}
                      <Route path="/copy-trading" element={<StrategyMarketplace />} />
                      <Route path="/copy-trading/strategy/:strategyId" element={<StrategyDetails />} />
                      <Route path="/copy-trading/my-subscriptions" element={<MySubscriptions />} />

                      {/* Algo Trading */}
                      <Route path="/algo-trading" element={<MyAlgorithms />} />
                      <Route path="/algo-trading/builder" element={<AlgorithmBuilder />} />
                      <Route path="/algo-trading/backtest" element={<BacktestInterface />} />
                      <Route path="/algo-trading/backtest/:algorithmId" element={<BacktestInterface />} />

                      {/* Settings */}
                      <Route path="/settings" element={<div style={{ padding: '24px' }}>Settings Page (Coming Soon)</div>} />
                      <Route path="/notifications" element={<div style={{ padding: '24px' }}>Notifications Page (Coming Soon)</div>} />

                      {/* Default Redirect */}
                      <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    </Routes>
                  </ResponsiveLayout>
                </ProtectedRoute>
              }
            />
          </Routes>
        </Router>
      </ThemeProvider>
    </Provider>
  );
}

export default App;
