import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Button,
  TextField,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import { PlayArrow, TrendingUp, TrendingDown } from '@mui/icons-material';
import { Line } from 'react-chartjs-2';
import { useAppDispatch, useAppSelector } from '../../../store';
import { runBacktest } from '../../../store/slices/algoTradingSlice';

const BacktestInterface: React.FC = () => {
  const dispatch = useAppDispatch();
  const { backtestResults, isLoading, error } = useAppSelector((state) => state.algoTrading);

  const [config, setConfig] = useState({
    startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    initialCapital: 10000,
  });

  const handleRunBacktest = async () => {
    await dispatch(runBacktest(config));
  };

  const equityCurveData = backtestResults
    ? {
        labels: backtestResults.equityCurve.map((point: any) => point.date),
        datasets: [
          {
            label: 'Portfolio Value',
            data: backtestResults.equityCurve.map((point: any) => point.value),
            borderColor: 'rgb(75, 192, 192)',
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            tension: 0.4,
          },
        ],
      }
    : null;

  const getPerformanceColor = (value: number) => {
    return value >= 0 ? 'success.main' : 'error.main';
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Backtest Interface
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Test your algorithm against historical data
        </Typography>
      </Box>

      {/* Configuration */}
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Backtest Configuration
        </Typography>

        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="Start Date"
              type="date"
              value={config.startDate}
              onChange={(e) => setConfig({ ...config, startDate: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="End Date"
              type="date"
              value={config.endDate}
              onChange={(e) => setConfig({ ...config, endDate: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="Initial Capital"
              type="number"
              value={config.initialCapital}
              onChange={(e) => setConfig({ ...config, initialCapital: parseFloat(e.target.value) })}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <Button
              fullWidth
              variant="contained"
              size="large"
              startIcon={<PlayArrow />}
              onClick={handleRunBacktest}
              disabled={isLoading}
            >
              {isLoading ? <CircularProgress size={24} /> : 'Run Backtest'}
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Results */}
      {backtestResults && (
        <>
          {/* Performance Metrics */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} md={3}>
              <Card elevation={2}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="caption" color="text.secondary">
                    Total Return
                  </Typography>
                  <Typography
                    variant="h4"
                    fontWeight="bold"
                    sx={{ color: getPerformanceColor(backtestResults.totalReturn) }}
                  >
                    {backtestResults.totalReturn >= 0 ? '+' : ''}
                    {backtestResults.totalReturn.toFixed(2)}%
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card elevation={2}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="caption" color="text.secondary">
                    Win Rate
                  </Typography>
                  <Typography variant="h4" fontWeight="bold">
                    {backtestResults.winRate.toFixed(1)}%
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card elevation={2}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="caption" color="text.secondary">
                    Max Drawdown
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" color="error.main">
                    {backtestResults.maxDrawdown.toFixed(2)}%
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card elevation={2}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="caption" color="text.secondary">
                    Sharpe Ratio
                  </Typography>
                  <Typography variant="h4" fontWeight="bold">
                    {backtestResults.sharpeRatio.toFixed(2)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Equity Curve */}
          <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Equity Curve
            </Typography>
            <Box sx={{ height: 400 }}>
              {equityCurveData && (
                <Line data={equityCurveData} options={{ maintainAspectRatio: false }} />
              )}
            </Box>
          </Paper>

          {/* Trade History */}
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Trade History ({backtestResults.trades.length} trades)
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Symbol</TableCell>
                    <TableCell>Side</TableCell>
                    <TableCell align="right">Entry Price</TableCell>
                    <TableCell align="right">Exit Price</TableCell>
                    <TableCell align="right">Quantity</TableCell>
                    <TableCell align="right">P&L</TableCell>
                    <TableCell align="right">P&L %</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {backtestResults.trades.map((trade: any, index: number) => (
                    <TableRow key={index} hover>
                      <TableCell>{new Date(trade.entryDate).toLocaleDateString()}</TableCell>
                      <TableCell>{trade.symbol}</TableCell>
                      <TableCell>
                        {trade.side === 'BUY' ? (
                          <TrendingUp color="success" fontSize="small" />
                        ) : (
                          <TrendingDown color="error" fontSize="small" />
                        )}
                      </TableCell>
                      <TableCell align="right">${trade.entryPrice.toFixed(2)}</TableCell>
                      <TableCell align="right">${trade.exitPrice.toFixed(2)}</TableCell>
                      <TableCell align="right">{trade.quantity.toFixed(4)}</TableCell>
                      <TableCell align="right">
                        <Typography
                          sx={{ color: getPerformanceColor(trade.pnl) }}
                          fontWeight="bold"
                        >
                          {trade.pnl >= 0 ? '+' : ''}${trade.pnl.toFixed(2)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography
                          sx={{ color: getPerformanceColor(trade.pnlPercent) }}
                          fontWeight="bold"
                        >
                          {trade.pnlPercent >= 0 ? '+' : ''}
                          {trade.pnlPercent.toFixed(2)}%
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </>
      )}
    </Box>
  );
};

export default BacktestInterface;
