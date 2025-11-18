import React from 'react';
import { Box, Paper, Typography, Chip } from '@mui/material';
import { TrendingUp, TrendingDown } from '@mui/icons-material';

interface MarketTickerProps {
  symbol: string;
  price: number;
  change24h: number;
  changePercent24h: number;
  high24h: number;
  low24h: number;
  volume24h: number;
}

const MarketTicker: React.FC<MarketTickerProps> = ({
  symbol,
  price,
  change24h,
  changePercent24h,
  high24h,
  low24h,
  volume24h,
}) => {
  const isPositive = change24h >= 0;

  return (
    <Paper
      elevation={2}
      sx={{
        p: 2,
        display: 'flex',
        alignItems: 'center',
        gap: 3,
        flexWrap: 'wrap',
      }}
    >
      {/* Symbol and Price */}
      <Box>
        <Typography variant="caption" color="text.secondary">
          {symbol}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
          <Typography variant="h5" fontWeight="bold">
            ${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Typography>
          <Chip
            icon={isPositive ? <TrendingUp /> : <TrendingDown />}
            label={`${isPositive ? '+' : ''}${changePercent24h.toFixed(2)}%`}
            size="small"
            color={isPositive ? 'success' : 'error'}
            sx={{ fontWeight: 'bold' }}
          />
        </Box>
      </Box>

      {/* 24h Change */}
      <Box>
        <Typography variant="caption" color="text.secondary">
          24h Change
        </Typography>
        <Typography
          variant="body1"
          fontWeight="bold"
          color={isPositive ? 'success.main' : 'error.main'}
        >
          {isPositive ? '+' : ''}${change24h.toFixed(2)}
        </Typography>
      </Box>

      {/* 24h High */}
      <Box>
        <Typography variant="caption" color="text.secondary">
          24h High
        </Typography>
        <Typography variant="body1" fontWeight="bold">
          ${high24h.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </Typography>
      </Box>

      {/* 24h Low */}
      <Box>
        <Typography variant="caption" color="text.secondary">
          24h Low
        </Typography>
        <Typography variant="body1" fontWeight="bold">
          ${low24h.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </Typography>
      </Box>

      {/* 24h Volume */}
      <Box>
        <Typography variant="caption" color="text.secondary">
          24h Volume
        </Typography>
        <Typography variant="body1" fontWeight="bold">
          ${volume24h.toLocaleString('en-US', { maximumFractionDigits: 0 })}
        </Typography>
      </Box>
    </Paper>
  );
};

export default MarketTicker;
