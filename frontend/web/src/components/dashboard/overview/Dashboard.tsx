import React, { useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  LinearProgress,
} from '@mui/material';
import { TrendingUp, TrendingDown, AccountBalance, ShowChart } from '@mui/icons-material';
import { Line, Doughnut } from 'react-chartjs-2';
import { useAppDispatch, useAppSelector } from '../../../store';
import { fetchDashboardData } from '../../../store/slices/uiSlice';

const Dashboard: React.FC = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { positions } = useAppSelector((state) => state.position);
  const { orders } = useAppSelector((state) => state.trading);

  useEffect(() => {
    dispatch(fetchDashboardData());
  }, [dispatch]);

  // Calculate portfolio metrics
  const totalBalance = 50000; // Mock data
  const totalPnL = positions.reduce((sum, pos) => sum + pos.unrealizedPnL, 0);
  const totalPnLPercent = (totalPnL / totalBalance) * 100;
  const openPositions = positions.filter((p) => p.status === 'OPEN').length;
  const pendingOrders = orders.filter((o) => o.status === 'PENDING').length;

  // Portfolio value chart data
  const portfolioChartData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Portfolio Value',
        data: [48000, 49200, 48800, 50100, 49500, 50500, 50000 + totalPnL],
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.4,
      },
    ],
  };

  // Asset allocation chart data
  const assetAllocationData = {
    labels: ['Stocks', 'Crypto', 'Forex', 'Commodities', 'Cash'],
    datasets: [
      {
        data: [35, 25, 20, 10, 10],
        backgroundColor: [
          'rgba(255, 99, 132, 0.8)',
          'rgba(54, 162, 235, 0.8)',
          'rgba(255, 206, 86, 0.8)',
          'rgba(75, 192, 192, 0.8)',
          'rgba(153, 102, 255, 0.8)',
        ],
        borderWidth: 0,
      },
    ],
  };

  const getPerformanceColor = (value: number) => {
    return value >= 0 ? 'success.main' : 'error.main';
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Dashboard
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Welcome back, {user?.name || 'Trader'}! Here's your portfolio overview.
        </Typography>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Total Balance */}
        <Grid item xs={12} md={3}>
          <Card elevation={3}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <AccountBalance sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="caption" color="text.secondary">
                  Total Balance
                </Typography>
              </Box>
              <Typography variant="h4" fontWeight="bold">
                ${totalBalance.toLocaleString()}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Available: ${(totalBalance - Math.abs(totalPnL)).toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Total P&L */}
        <Grid item xs={12} md={3}>
          <Card elevation={3}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                {totalPnL >= 0 ? (
                  <TrendingUp sx={{ mr: 1, color: 'success.main' }} />
                ) : (
                  <TrendingDown sx={{ mr: 1, color: 'error.main' }} />
                )}
                <Typography variant="caption" color="text.secondary">
                  Total P&L
                </Typography>
              </Box>
              <Typography
                variant="h4"
                fontWeight="bold"
                sx={{ color: getPerformanceColor(totalPnL) }}
              >
                {totalPnL >= 0 ? '+' : ''}${totalPnL.toFixed(2)}
              </Typography>
              <Typography
                variant="caption"
                sx={{ color: getPerformanceColor(totalPnLPercent) }}
              >
                {totalPnLPercent >= 0 ? '+' : ''}
                {totalPnLPercent.toFixed(2)}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Open Positions */}
        <Grid item xs={12} md={3}>
          <Card elevation={3}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <ShowChart sx={{ mr: 1, color: 'info.main' }} />
                <Typography variant="caption" color="text.secondary">
                  Open Positions
                </Typography>
              </Box>
              <Typography variant="h4" fontWeight="bold">
                {openPositions}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Pending Orders: {pendingOrders}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Win Rate */}
        <Grid item xs={12} md={3}>
          <Card elevation={3}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <TrendingUp sx={{ mr: 1, color: 'success.main' }} />
                <Typography variant="caption" color="text.secondary">
                  Win Rate (7d)
                </Typography>
              </Box>
              <Typography variant="h4" fontWeight="bold">
                68.5%
              </Typography>
              <Box sx={{ mt: 1 }}>
                <LinearProgress
                  variant="determinate"
                  value={68.5}
                  sx={{ height: 6, borderRadius: 3 }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Portfolio Value Chart */}
        <Grid item xs={12} md={8}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Portfolio Value (7 Days)
            </Typography>
            <Box sx={{ height: 300 }}>
              <Line
                data={portfolioChartData}
                options={{
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      display: false,
                    },
                  },
                  scales: {
                    y: {
                      beginAtZero: false,
                    },
                  },
                }}
              />
            </Box>
          </Paper>
        </Grid>

        {/* Asset Allocation Chart */}
        <Grid item xs={12} md={4}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Asset Allocation
            </Typography>
            <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Doughnut
                data={assetAllocationData}
                options={{
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'bottom',
                    },
                  },
                }}
              />
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Recent Activity */}
      <Paper elevation={2} sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Recent Activity
        </Typography>
        <Grid container spacing={2}>
          {positions.slice(0, 5).map((position) => (
            <Grid item xs={12} key={position.id}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  p: 2,
                  bgcolor: 'background.default',
                  borderRadius: 1,
                }}
              >
                <Box>
                  <Typography variant="body1" fontWeight="bold">
                    {position.symbol}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {position.side} • {position.quantity} @ ${position.entryPrice.toFixed(2)}
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography
                    variant="body1"
                    fontWeight="bold"
                    sx={{ color: getPerformanceColor(position.unrealizedPnL) }}
                  >
                    {position.unrealizedPnL >= 0 ? '+' : ''}${position.unrealizedPnL.toFixed(2)}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ color: getPerformanceColor(position.unrealizedPnLPercent) }}
                  >
                    {position.unrealizedPnLPercent >= 0 ? '+' : ''}
                    {position.unrealizedPnLPercent.toFixed(2)}%
                  </Typography>
                </Box>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Paper>
    </Box>
  );
};

export default Dashboard;
