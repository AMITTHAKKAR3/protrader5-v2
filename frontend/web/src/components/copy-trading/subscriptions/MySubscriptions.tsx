import React, { useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  Avatar,
  LinearProgress,
} from '@mui/material';
import { TrendingUp, Cancel } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../../store';
import { fetchMySubscriptions, unsubscribeFromStrategy } from '../../../store/slices/copyTradingSlice';

const MySubscriptions: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { mySubscriptions, isLoading } = useAppSelector((state) => state.copyTrading);

  useEffect(() => {
    dispatch(fetchMySubscriptions());
  }, [dispatch]);

  const handleUnsubscribe = async (subscriptionId: string) => {
    if (window.confirm('Are you sure you want to unsubscribe from this strategy?')) {
      await dispatch(unsubscribeFromStrategy(subscriptionId));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'success';
      case 'PAUSED':
        return 'warning';
      case 'CANCELLED':
        return 'error';
      default:
        return 'default';
    }
  };

  const getPerformanceColor = (value: number) => {
    return value >= 0 ? 'success.main' : 'error.main';
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            My Subscriptions
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage your active copy trading subscriptions
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<TrendingUp />}
          onClick={() => navigate('/copy-trading/marketplace')}
        >
          Browse Strategies
        </Button>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Paper elevation={2} sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              Active Subscriptions
            </Typography>
            <Typography variant="h4" fontWeight="bold">
              {mySubscriptions.filter((s) => s.status === 'ACTIVE').length}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper elevation={2} sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              Total Invested
            </Typography>
            <Typography variant="h4" fontWeight="bold">
              ${mySubscriptions.reduce((sum, s) => sum + s.amount, 0).toFixed(2)}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper elevation={2} sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              Total P&L
            </Typography>
            <Typography
              variant="h4"
              fontWeight="bold"
              sx={{
                color: getPerformanceColor(
                  mySubscriptions.reduce((sum, s) => sum + s.performance.totalPnL, 0)
                ),
              }}
            >
              ${mySubscriptions.reduce((sum, s) => sum + s.performance.totalPnL, 0).toFixed(2)}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper elevation={2} sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              Avg Return
            </Typography>
            <Typography
              variant="h4"
              fontWeight="bold"
              sx={{
                color: getPerformanceColor(
                  mySubscriptions.reduce((sum, s) => sum + s.performance.returnPercent, 0) /
                    (mySubscriptions.length || 1)
                ),
              }}
            >
              {(
                mySubscriptions.reduce((sum, s) => sum + s.performance.returnPercent, 0) /
                (mySubscriptions.length || 1)
              ).toFixed(2)}
              %
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Subscription Cards */}
      <Grid container spacing={3}>
        {mySubscriptions.length === 0 ? (
          <Grid item xs={12}>
            <Paper elevation={2} sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No active subscriptions
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Start copying successful traders to grow your portfolio
              </Typography>
              <Button
                variant="contained"
                startIcon={<TrendingUp />}
                onClick={() => navigate('/copy-trading/marketplace')}
              >
                Browse Strategies
              </Button>
            </Paper>
          </Grid>
        ) : (
          mySubscriptions.map((subscription) => (
            <Grid item xs={12} md={6} lg={4} key={subscription.id}>
              <Card elevation={3}>
                <CardContent>
                  {/* Header */}
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar
                      src={subscription.strategy.provider.avatar}
                      sx={{ width: 48, height: 48, mr: 2 }}
                    >
                      {subscription.strategy.provider.name[0]}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" fontWeight="bold">
                        {subscription.strategy.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        by {subscription.strategy.provider.name}
                      </Typography>
                    </Box>
                    <Chip
                      label={subscription.status}
                      size="small"
                      color={getStatusColor(subscription.status)}
                    />
                  </Box>

                  {/* Stats */}
                  <Grid container spacing={2} sx={{ mb: 2 }}>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">
                        Invested Amount
                      </Typography>
                      <Typography variant="body1" fontWeight="bold">
                        ${subscription.amount.toFixed(2)}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">
                        Current Value
                      </Typography>
                      <Typography variant="body1" fontWeight="bold">
                        ${(subscription.amount + subscription.performance.totalPnL).toFixed(2)}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">
                        Total P&L
                      </Typography>
                      <Typography
                        variant="body1"
                        fontWeight="bold"
                        sx={{ color: getPerformanceColor(subscription.performance.totalPnL) }}
                      >
                        {subscription.performance.totalPnL >= 0 ? '+' : ''}$
                        {subscription.performance.totalPnL.toFixed(2)}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">
                        Return %
                      </Typography>
                      <Typography
                        variant="body1"
                        fontWeight="bold"
                        sx={{ color: getPerformanceColor(subscription.performance.returnPercent) }}
                      >
                        {subscription.performance.returnPercent >= 0 ? '+' : ''}
                        {subscription.performance.returnPercent.toFixed(2)}%
                      </Typography>
                    </Grid>
                  </Grid>

                  {/* Progress Bar */}
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="caption" color="text.secondary">
                        Subscription Period
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {subscription.daysRemaining} days left
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={(subscription.daysElapsed / 30) * 100}
                      sx={{ height: 6, borderRadius: 3 }}
                    />
                  </Box>

                  {/* Actions */}
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      fullWidth
                      variant="outlined"
                      size="small"
                      onClick={() => navigate(`/copy-trading/strategy/${subscription.strategyId}`)}
                    >
                      View Details
                    </Button>
                    <Button
                      fullWidth
                      variant="outlined"
                      size="small"
                      color="error"
                      startIcon={<Cancel />}
                      onClick={() => handleUnsubscribe(subscription.id)}
                      disabled={subscription.status !== 'ACTIVE'}
                    >
                      Unsubscribe
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))
        )}
      </Grid>
    </Box>
  );
};

export default MySubscriptions;
