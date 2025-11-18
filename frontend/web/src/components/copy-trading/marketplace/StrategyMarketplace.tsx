import React, { useEffect, useState } from 'react';
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
  Avatar,
  TextField,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Rating,
} from '@mui/material';
import { Search, TrendingUp, People, Star } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../../store';
import { fetchStrategies } from '../../../store/slices/copyTradingSlice';

const StrategyMarketplace: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { strategies, isLoading } = useAppSelector((state) => state.copyTrading);

  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('performance');
  const [filterBy, setFilterBy] = useState('all');

  useEffect(() => {
    dispatch(fetchStrategies());
  }, [dispatch]);

  const filteredStrategies = strategies
    .filter((strategy) => {
      if (filterBy === 'featured') return strategy.isFeatured;
      if (filterBy === 'verified') return strategy.isVerified;
      return true;
    })
    .filter((strategy) =>
      strategy.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      strategy.description.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'performance') return b.performance.totalReturn - a.performance.totalReturn;
      if (sortBy === 'subscribers') return b.subscriberCount - a.subscriberCount;
      if (sortBy === 'rating') return b.rating - a.rating;
      return 0;
    });

  const handleViewStrategy = (strategyId: string) => {
    navigate(`/copy-trading/strategy/${strategyId}`);
  };

  const getPerformanceColor = (value: number) => {
    return value >= 0 ? 'success.main' : 'error.main';
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Strategy Marketplace
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Discover and copy profitable trading strategies from top traders
        </Typography>
      </Box>

      {/* Filters */}
      <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          {/* Search */}
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="Search strategies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          {/* Sort By */}
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Sort By</InputLabel>
              <Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                label="Sort By"
              >
                <MenuItem value="performance">Performance</MenuItem>
                <MenuItem value="subscribers">Subscribers</MenuItem>
                <MenuItem value="rating">Rating</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Filter By */}
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Filter By</InputLabel>
              <Select
                value={filterBy}
                onChange={(e) => setFilterBy(e.target.value)}
                label="Filter By"
              >
                <MenuItem value="all">All Strategies</MenuItem>
                <MenuItem value="featured">Featured</MenuItem>
                <MenuItem value="verified">Verified Only</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Strategy Cards */}
      <Grid container spacing={3}>
        {filteredStrategies.length === 0 ? (
          <Grid item xs={12}>
            <Paper elevation={2} sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="body1" color="text.secondary">
                No strategies found
              </Typography>
            </Paper>
          </Grid>
        ) : (
          filteredStrategies.map((strategy) => (
            <Grid item xs={12} md={6} lg={4} key={strategy.id}>
              <Card elevation={3} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flex: 1 }}>
                  {/* Header */}
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar
                      src={strategy.provider.avatar}
                      sx={{ width: 48, height: 48, mr: 2 }}
                    >
                      {strategy.provider.name[0]}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" fontWeight="bold">
                        {strategy.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        by {strategy.provider.name}
                      </Typography>
                    </Box>
                    {strategy.isFeatured && (
                      <Chip label="Featured" color="primary" size="small" icon={<Star />} />
                    )}
                  </Box>

                  {/* Description */}
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {strategy.description}
                  </Typography>

                  {/* Stats */}
                  <Grid container spacing={2} sx={{ mb: 2 }}>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">
                        Total Return
                      </Typography>
                      <Typography
                        variant="h6"
                        fontWeight="bold"
                        sx={{ color: getPerformanceColor(strategy.performance.totalReturn) }}
                      >
                        {strategy.performance.totalReturn >= 0 ? '+' : ''}
                        {strategy.performance.totalReturn.toFixed(2)}%
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">
                        Win Rate
                      </Typography>
                      <Typography variant="h6" fontWeight="bold">
                        {strategy.performance.winRate.toFixed(1)}%
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">
                        Subscribers
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <People fontSize="small" />
                        <Typography variant="body2" fontWeight="bold">
                          {strategy.subscriberCount}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">
                        Rating
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Rating value={strategy.rating} readOnly size="small" precision={0.1} />
                        <Typography variant="caption">({strategy.rating.toFixed(1)})</Typography>
                      </Box>
                    </Grid>
                  </Grid>

                  {/* Tags */}
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    {strategy.tags.slice(0, 3).map((tag) => (
                      <Chip key={tag} label={tag} size="small" variant="outlined" />
                    ))}
                  </Box>
                </CardContent>

                <CardActions sx={{ p: 2, pt: 0 }}>
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<TrendingUp />}
                    onClick={() => handleViewStrategy(strategy.id)}
                  >
                    View Details
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

export default StrategyMarketplace;
