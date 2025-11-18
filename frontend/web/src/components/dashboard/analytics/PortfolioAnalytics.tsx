import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import { Line, Bar } from 'react-chartjs-2';
import { useAppSelector } from '../../../store';

const PortfolioAnalytics: React.FC = () => {
  const { positions } = useAppSelector((state) => state.position);
  const [tabValue, setTabValue] = useState(0);
  const [timeframe, setTimeframe] = useState('7d');

  // Performance data
  const performanceData = {
    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
    datasets: [
      {
        label: 'Weekly Return (%)',
        data: [2.5, -1.2, 3.8, 1.5],
        backgroundColor: 'rgba(75, 192, 192, 0.8)',
      },
    ],
  };

  // Win/Loss distribution
  const winLossData = {
    labels: ['Wins', 'Losses'],
    datasets: [
      {
        label: 'Trades',
        data: [68, 32],
        backgroundColor: ['rgba(75, 192, 192, 0.8)', 'rgba(255, 99, 132, 0.8)'],
      },
    ],
  };

  // Monthly P&L
  const monthlyPnLData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Monthly P&L ($)',
        data: [1200, -500, 2100, 1800, -300, 2500],
        backgroundColor: (context: any) => {
          const value = context.raw;
          return value >= 0 ? 'rgba(75, 192, 192, 0.8)' : 'rgba(255, 99, 132, 0.8)';
        },
      },
    ],
  };

  // Risk metrics
  const riskMetrics = [
    { label: 'Sharpe Ratio', value: '1.85', description: 'Risk-adjusted return' },
    { label: 'Max Drawdown', value: '-8.5%', description: 'Largest peak-to-trough decline' },
    { label: 'Volatility', value: '12.3%', description: 'Standard deviation of returns' },
    { label: 'Beta', value: '0.92', description: 'Market correlation' },
    { label: 'Value at Risk (95%)', value: '$1,250', description: 'Potential 1-day loss' },
    { label: 'Profit Factor', value: '2.15', description: 'Gross profit / Gross loss' },
  ];

  // Top performers
  const topPerformers = [
    { symbol: 'BTCUSDT', return: 15.2, trades: 24, winRate: 75 },
    { symbol: 'ETHUSDT', return: 12.8, trades: 18, winRate: 72 },
    { symbol: 'BNBUSDT', return: 8.5, trades: 15, winRate: 67 },
    { symbol: 'ADAUSDT', return: 6.3, trades: 12, winRate: 58 },
    { symbol: 'SOLUSDT', return: -2.1, trades: 10, winRate: 40 },
  ];

  const getPerformanceColor = (value: number) => {
    return value >= 0 ? 'success.main' : 'error.main';
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Portfolio Analytics
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Detailed performance analysis and risk metrics
          </Typography>
        </Box>
        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel>Timeframe</InputLabel>
          <Select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            label="Timeframe"
          >
            <MenuItem value="7d">7 Days</MenuItem>
            <MenuItem value="30d">30 Days</MenuItem>
            <MenuItem value="90d">90 Days</MenuItem>
            <MenuItem value="1y">1 Year</MenuItem>
            <MenuItem value="all">All Time</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Tabs */}
      <Paper elevation={2} sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} variant="fullWidth">
          <Tab label="Performance" />
          <Tab label="Risk Metrics" />
          <Tab label="Top Performers" />
        </Tabs>
      </Paper>

      {/* Performance Tab */}
      {tabValue === 0 && (
        <Grid container spacing={3}>
          {/* Weekly Returns */}
          <Grid item xs={12} md={6}>
            <Paper elevation={2} sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Weekly Returns
              </Typography>
              <Box sx={{ height: 300 }}>
                <Bar
                  data={performanceData}
                  options={{
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: false,
                      },
                    },
                  }}
                />
              </Box>
            </Paper>
          </Grid>

          {/* Win/Loss Distribution */}
          <Grid item xs={12} md={6}>
            <Paper elevation={2} sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Win/Loss Distribution
              </Typography>
              <Box sx={{ height: 300 }}>
                <Bar
                  data={winLossData}
                  options={{
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: false,
                      },
                    },
                  }}
                />
              </Box>
            </Paper>
          </Grid>

          {/* Monthly P&L */}
          <Grid item xs={12}>
            <Paper elevation={2} sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Monthly P&L
              </Typography>
              <Box sx={{ height: 300 }}>
                <Bar
                  data={monthlyPnLData}
                  options={{
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: false,
                      },
                    },
                  }}
                />
              </Box>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* Risk Metrics Tab */}
      {tabValue === 1 && (
        <Grid container spacing={3}>
          {riskMetrics.map((metric) => (
            <Grid item xs={12} md={4} key={metric.label}>
              <Card elevation={2}>
                <CardContent>
                  <Typography variant="caption" color="text.secondary">
                    {metric.label}
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" sx={{ my: 1 }}>
                    {metric.value}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {metric.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Top Performers Tab */}
      {tabValue === 2 && (
        <Paper elevation={2} sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Top Performing Symbols
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Symbol</TableCell>
                  <TableCell align="right">Total Return</TableCell>
                  <TableCell align="right">Total Trades</TableCell>
                  <TableCell align="right">Win Rate</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {topPerformers.map((performer) => (
                  <TableRow key={performer.symbol} hover>
                    <TableCell>
                      <Typography fontWeight="bold">{performer.symbol}</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography
                        fontWeight="bold"
                        sx={{ color: getPerformanceColor(performer.return) }}
                      >
                        {performer.return >= 0 ? '+' : ''}
                        {performer.return.toFixed(2)}%
                      </Typography>
                    </TableCell>
                    <TableCell align="right">{performer.trades}</TableCell>
                    <TableCell align="right">
                      <Typography
                        fontWeight="bold"
                        sx={{ color: performer.winRate >= 50 ? 'success.main' : 'error.main' }}
                      >
                        {performer.winRate}%
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}
    </Box>
  );
};

export default PortfolioAnalytics;
