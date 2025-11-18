import React from 'react';
import { Box, Paper, Typography } from '@mui/material';
import { formatDistanceToNow } from 'date-fns';

interface Trade {
  id: string;
  price: number;
  quantity: number;
  side: 'BUY' | 'SELL';
  timestamp: number;
}

interface RecentTradesProps {
  symbol: string;
  trades: Trade[];
}

const RecentTrades: React.FC<RecentTradesProps> = ({ symbol, trades }) => {
  return (
    <Paper elevation={2} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ p: 1, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="subtitle2" fontWeight="bold">
          Recent Trades
        </Typography>
      </Box>

      {/* Column Headers */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: 1,
          px: 1,
          py: 0.5,
          borderBottom: 1,
          borderColor: 'divider',
          bgcolor: 'action.hover',
        }}
      >
        <Typography variant="caption" color="text.secondary">
          Price ({symbol.slice(-3)})
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'right' }}>
          Amount ({symbol.slice(0, -3)})
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'right' }}>
          Time
        </Typography>
      </Box>

      {/* Trades List */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {trades.length === 0 ? (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              No recent trades
            </Typography>
          </Box>
        ) : (
          trades.map((trade) => (
            <Box
              key={trade.id}
              sx={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                gap: 1,
                px: 1,
                py: 0.5,
                cursor: 'pointer',
                '&:hover': {
                  bgcolor: 'action.hover',
                },
              }}
            >
              {/* Price */}
              <Typography
                variant="body2"
                sx={{
                  color: trade.side === 'BUY' ? 'success.main' : 'error.main',
                  fontWeight: 500,
                }}
              >
                {trade.price.toFixed(2)}
              </Typography>

              {/* Quantity */}
              <Typography variant="body2" sx={{ textAlign: 'right' }}>
                {trade.quantity.toFixed(4)}
              </Typography>

              {/* Time */}
              <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'right' }}>
                {formatDistanceToNow(new Date(trade.timestamp), { addSuffix: true })}
              </Typography>
            </Box>
          ))
        )}
      </Box>
    </Paper>
  );
};

export default RecentTrades;
