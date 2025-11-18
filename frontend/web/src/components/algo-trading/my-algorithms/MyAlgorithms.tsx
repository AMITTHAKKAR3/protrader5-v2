import React, { useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import { Add, PlayArrow, Edit, Delete, Pause } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../../store';
import { fetchAlgorithms, deleteAlgorithm, toggleAlgorithm } from '../../../store/slices/algoTradingSlice';

const MyAlgorithms: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { algorithms, isLoading } = useAppSelector((state) => state.algoTrading);

  useEffect(() => {
    dispatch(fetchAlgorithms());
  }, [dispatch]);

  const handleDelete = async (algorithmId: string) => {
    if (window.confirm('Are you sure you want to delete this algorithm?')) {
      await dispatch(deleteAlgorithm(algorithmId));
    }
  };

  const handleToggle = async (algorithmId: string, currentStatus: string) => {
    await dispatch(
      toggleAlgorithm({
        algorithmId,
        status: currentStatus === 'LIVE' ? 'PAUSED' : 'LIVE',
      })
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'LIVE':
        return 'success';
      case 'TESTING':
        return 'info';
      case 'PAUSED':
        return 'warning';
      case 'DRAFT':
        return 'default';
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
            My Algorithms
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage your trading algorithms
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => navigate('/algo-trading/builder')}
        >
          Create Algorithm
        </Button>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Paper elevation={2} sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              Total Algorithms
            </Typography>
            <Typography variant="h4" fontWeight="bold">
              {algorithms.length}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper elevation={2} sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              Live Algorithms
            </Typography>
            <Typography variant="h4" fontWeight="bold" color="success.main">
              {algorithms.filter((a) => a.status === 'LIVE').length}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper elevation={2} sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              Total Trades
            </Typography>
            <Typography variant="h4" fontWeight="bold">
              {algorithms.reduce((sum, a) => sum + (a.performance?.totalTrades || 0), 0)}
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
                  algorithms.reduce((sum, a) => sum + (a.performance?.totalPnL || 0), 0)
                ),
              }}
            >
              ${algorithms.reduce((sum, a) => sum + (a.performance?.totalPnL || 0), 0).toFixed(2)}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Algorithm Cards */}
      <Grid container spacing={3}>
        {algorithms.length === 0 ? (
          <Grid item xs={12}>
            <Paper elevation={2} sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No algorithms yet
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Create your first trading algorithm to get started
              </Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => navigate('/algo-trading/builder')}
              >
                Create Algorithm
              </Button>
            </Paper>
          </Grid>
        ) : (
          algorithms.map((algorithm) => (
            <Grid item xs={12} md={6} lg={4} key={algorithm.id}>
              <Card elevation={3}>
                <CardContent>
                  {/* Header */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" fontWeight="bold" gutterBottom>
                        {algorithm.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {algorithm.description}
                      </Typography>
                    </Box>
                    <Chip
                      label={algorithm.status}
                      size="small"
                      color={getStatusColor(algorithm.status)}
                    />
                  </Box>

                  {/* Symbols */}
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="caption" color="text.secondary">
                      Symbols:
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.5 }}>
                      {algorithm.symbols.map((symbol) => (
                        <Chip key={symbol} label={symbol} size="small" variant="outlined" />
                      ))}
                    </Box>
                  </Box>

                  {/* Performance */}
                  {algorithm.performance && (
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">
                          Total Return
                        </Typography>
                        <Typography
                          variant="body1"
                          fontWeight="bold"
                          sx={{ color: getPerformanceColor(algorithm.performance.totalReturn) }}
                        >
                          {algorithm.performance.totalReturn >= 0 ? '+' : ''}
                          {algorithm.performance.totalReturn.toFixed(2)}%
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">
                          Win Rate
                        </Typography>
                        <Typography variant="body1" fontWeight="bold">
                          {algorithm.performance.winRate.toFixed(1)}%
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">
                          Total Trades
                        </Typography>
                        <Typography variant="body1" fontWeight="bold">
                          {algorithm.performance.totalTrades}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">
                          Total P&L
                        </Typography>
                        <Typography
                          variant="body1"
                          fontWeight="bold"
                          sx={{ color: getPerformanceColor(algorithm.performance.totalPnL) }}
                        >
                          ${algorithm.performance.totalPnL.toFixed(2)}
                        </Typography>
                      </Grid>
                    </Grid>
                  )}
                </CardContent>

                <CardActions sx={{ p: 2, pt: 0, justifyContent: 'space-between' }}>
                  <Box>
                    <Tooltip title={algorithm.status === 'LIVE' ? 'Pause' : 'Start'}>
                      <IconButton
                        size="small"
                        color={algorithm.status === 'LIVE' ? 'warning' : 'success'}
                        onClick={() => handleToggle(algorithm.id, algorithm.status)}
                      >
                        {algorithm.status === 'LIVE' ? <Pause /> : <PlayArrow />}
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => navigate(`/algo-trading/algorithm/${algorithm.id}/edit`)}
                      >
                        <Edit />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDelete(algorithm.id)}
                      >
                        <Delete />
                      </IconButton>
                    </Tooltip>
                  </Box>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => navigate(`/algo-trading/backtest/${algorithm.id}`)}
                  >
                    Backtest
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))
        )}
      </Grid>
    </Box>
  );
};

export default MyAlgorithms;
