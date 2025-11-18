import React, { useEffect, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Button,
  Chip,
  Avatar,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
} from '@mui/material';
import { TrendingUp, CheckCircle, Star } from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../../store';
import { fetchStrategyDetails, subscribeToStrategy } from '../../../store/slices/copyTradingSlice';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const StrategyDetails: React.FC = () => {
  const { strategyId } = useParams<{ strategyId: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { selectedStrategy, isLoading } = useAppSelector((state) => state.copyTrading);

  const [tabValue, setTabValue] = useState(0);
  const [subscribeDialog, setSubscribeDialog] = useState(false);
  const [subscriptionAmount, setSubscriptionAmount] = useState('');

  useEffect(() => {
    if (strategyId) {
      dispatch(fetchStrategyDetails(strategyId));
    }
  }, [strategyId, dispatch]);

  const handleSubscribe = async () => {
    if (!strategyId || !subscriptionAmount) return;

    try {
      await dispatch(
        subscribeToStrategy({
          strategyId,
          amount: parseFloat(subscriptionAmount),
        })
      ).unwrap();
      setSubscribeDialog(false);
      // Show success message
    } catch (error) {
      // Error handled by Redux
    }
  };

  if (isLoading || !selectedStrategy) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  const performanceChartData = {
    labels: selectedStrategy.performance.history.map((h: any) => h.date),
    datasets: [
      {
        label: 'Cumulative Return (%)',
        data: selectedStrategy.performance.history.map((h: any) => h.return),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.4,
      },
    ],
  };

  const getPerformanceColor = (value: number) => {
    return value >= 0 ? 'success.main' : 'error.main';
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar
            src={selectedStrategy.provider.avatar}
            sx={{ width: 64, height: 64, mr: 2 }}
          >
            {selectedStrategy.provider.name[0]}
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <Typography variant="h4" fontWeight="bold">
                {selectedStrategy.name}
              </Typography>
              {selectedStrategy.isVerified && (
                <CheckCircle color="primary" />
              )}
              {selectedStrategy.isFeatured && (
                <Chip label="Featured" color="primary" size="small" icon={<Star />} />
              )}
            </Box>
            <Typography variant="body1" color="text.secondary">
              by {selectedStrategy.provider.name}
            </Typography>
          </Box>
          <Button
            variant="contained"
            size="large"
            startIcon={<TrendingUp />}
            onClick={() => setSubscribeDialog(true)}
          >
            Subscribe Now
          </Button>
        </Box>

        <Typography variant="body1" sx={{ mb: 2 }}>
          {selectedStrategy.description}
        </Typography>

        {/* Tags */}
        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
          {selectedStrategy.tags.map((tag: string) => (
            <Chip key={tag} label={tag} size="small" variant="outlined" />
          ))}
        </Box>
      </Paper>

      {/* Stats Grid */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Paper elevation={2} sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              Total Return
            </Typography>
            <Typography
              variant="h4"
              fontWeight="bold"
              sx={{ color: getPerformanceColor(selectedStrategy.performance.totalReturn) }}
            >
              {selectedStrategy.performance.totalReturn >= 0 ? '+' : ''}
              {selectedStrategy.performance.totalReturn.toFixed(2)}%
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper elevation={2} sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              Win Rate
            </Typography>
            <Typography variant="h4" fontWeight="bold">
              {selectedStrategy.performance.winRate.toFixed(1)}%
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper elevation={2} sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              Subscribers
            </Typography>
            <Typography variant="h4" fontWeight="bold">
              {selectedStrategy.subscriberCount}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper elevation={2} sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              Monthly Fee
            </Typography>
            <Typography variant="h4" fontWeight="bold">
              ${selectedStrategy.pricing.monthlyFee}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper elevation={2}>
        <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} variant="fullWidth">
          <Tab label="Performance" />
          <Tab label="Recent Trades" />
          <Tab label="Risk Metrics" />
        </Tabs>

        <Box sx={{ p: 3 }}>
          {/* Performance Tab */}
          {tabValue === 0 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Cumulative Return
              </Typography>
              <Box sx={{ height: 400 }}>
                <Line data={performanceChartData} options={{ maintainAspectRatio: false }} />
              </Box>
            </Box>
          )}

          {/* Recent Trades Tab */}
          {tabValue === 1 && (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Symbol</TableCell>
                    <TableCell>Side</TableCell>
                    <TableCell align="right">Entry</TableCell>
                    <TableCell align="right">Exit</TableCell>
                    <TableCell align="right">P&L</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {selectedStrategy.recentTrades.map((trade: any) => (
                    <TableRow key={trade.id}>
                      <TableCell>{new Date(trade.date).toLocaleDateString()}</TableCell>
                      <TableCell>{trade.symbol}</TableCell>
                      <TableCell>
                        <Chip
                          label={trade.side}
                          size="small"
                          color={trade.side === 'BUY' ? 'success' : 'error'}
                        />
                      </TableCell>
                      <TableCell align="right">${trade.entryPrice.toFixed(2)}</TableCell>
                      <TableCell align="right">${trade.exitPrice.toFixed(2)}</TableCell>
                      <TableCell align="right">
                        <Typography
                          sx={{ color: getPerformanceColor(trade.pnl) }}
                          fontWeight="bold"
                        >
                          {trade.pnl >= 0 ? '+' : ''}${trade.pnl.toFixed(2)}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {/* Risk Metrics Tab */}
          {tabValue === 2 && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Max Drawdown
                </Typography>
                <Typography variant="h5" fontWeight="bold" color="error.main">
                  {selectedStrategy.performance.maxDrawdown.toFixed(2)}%
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Sharpe Ratio
                </Typography>
                <Typography variant="h5" fontWeight="bold">
                  {selectedStrategy.performance.sharpeRatio.toFixed(2)}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Avg Trade Duration
                </Typography>
                <Typography variant="h5" fontWeight="bold">
                  {selectedStrategy.performance.avgTradeDuration} hours
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Total Trades
                </Typography>
                <Typography variant="h5" fontWeight="bold">
                  {selectedStrategy.performance.totalTrades}
                </Typography>
              </Grid>
            </Grid>
          )}
        </Box>
      </Paper>

      {/* Subscribe Dialog */}
      <Dialog open={subscribeDialog} onClose={() => setSubscribeDialog(false)}>
        <DialogTitle>Subscribe to {selectedStrategy.name}</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            Monthly Fee: ${selectedStrategy.pricing.monthlyFee} + {selectedStrategy.pricing.performanceFee}% performance fee
          </Alert>
          <TextField
            fullWidth
            label="Subscription Amount"
            type="number"
            value={subscriptionAmount}
            onChange={(e) => setSubscriptionAmount(e.target.value)}
            helperText="Enter the amount you want to allocate to this strategy"
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSubscribeDialog(false)}>Cancel</Button>
          <Button onClick={handleSubscribe} variant="contained" disabled={!subscriptionAmount}>
            Subscribe
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default StrategyDetails;
