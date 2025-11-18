import React from 'react';
import { Box, Paper, Typography, Tabs, Tab } from '@mui/material';

interface OrderBookEntry {
  price: number;
  quantity: number;
  total: number;
}

interface OrderBookProps {
  symbol: string;
  bids: OrderBookEntry[];
  asks: OrderBookEntry[];
}

const OrderBook: React.FC<OrderBookProps> = ({ symbol, bids, asks }) => {
  const [tabValue, setTabValue] = React.useState(0);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const renderOrderBookRow = (entry: OrderBookEntry, type: 'bid' | 'ask') => {
    const maxTotal = Math.max(
      ...bids.map(b => b.total),
      ...asks.map(a => a.total)
    );
    const percentage = (entry.total / maxTotal) * 100;

    return (
      <Box
        key={`${type}-${entry.price}`}
        sx={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: 1,
          px: 1,
          py: 0.5,
          position: 'relative',
          cursor: 'pointer',
          '&:hover': {
            bgcolor: 'action.hover',
          },
        }}
      >
        {/* Background bar */}
        <Box
          sx={{
            position: 'absolute',
            right: 0,
            top: 0,
            bottom: 0,
            width: `${percentage}%`,
            bgcolor: type === 'bid' ? 'rgba(38, 166, 154, 0.1)' : 'rgba(239, 83, 80, 0.1)',
            zIndex: 0,
          }}
        />

        {/* Price */}
        <Typography
          variant="body2"
          sx={{
            color: type === 'bid' ? 'success.main' : 'error.main',
            fontWeight: 500,
            zIndex: 1,
          }}
        >
          {entry.price.toFixed(2)}
        </Typography>

        {/* Quantity */}
        <Typography variant="body2" sx={{ textAlign: 'right', zIndex: 1 }}>
          {entry.quantity.toFixed(4)}
        </Typography>

        {/* Total */}
        <Typography variant="body2" sx={{ textAlign: 'right', zIndex: 1 }}>
          {entry.total.toFixed(2)}
        </Typography>
      </Box>
    );
  };

  return (
    <Paper elevation={2} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ p: 1, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="subtitle2" fontWeight="bold">
          Order Book
        </Typography>
      </Box>

      {/* Tabs */}
      <Tabs value={tabValue} onChange={handleTabChange} variant="fullWidth">
        <Tab label="Book" />
        <Tab label="Bids" />
        <Tab label="Asks" />
      </Tabs>

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
          Total
        </Typography>
      </Box>

      {/* Order Book Content */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {/* Show Both (tabValue === 0) */}
        {tabValue === 0 && (
          <>
            {/* Asks (reversed to show lowest at bottom) */}
            <Box sx={{ display: 'flex', flexDirection: 'column-reverse' }}>
              {asks.slice(0, 10).map(ask => renderOrderBookRow(ask, 'ask'))}
            </Box>

            {/* Spread */}
            <Box
              sx={{
                py: 1,
                px: 1,
                bgcolor: 'action.hover',
                borderTop: 1,
                borderBottom: 1,
                borderColor: 'divider',
              }}
            >
              <Typography variant="body2" fontWeight="bold" color="text.secondary">
                Spread: {asks.length > 0 && bids.length > 0 
                  ? (asks[0].price - bids[0].price).toFixed(2)
                  : '0.00'}
              </Typography>
            </Box>

            {/* Bids */}
            {bids.slice(0, 10).map(bid => renderOrderBookRow(bid, 'bid'))}
          </>
        )}

        {/* Show Bids Only (tabValue === 1) */}
        {tabValue === 1 && (
          <Box>
            {bids.slice(0, 20).map(bid => renderOrderBookRow(bid, 'bid'))}
          </Box>
        )}

        {/* Show Asks Only (tabValue === 2) */}
        {tabValue === 2 && (
          <Box>
            {asks.slice(0, 20).map(ask => renderOrderBookRow(ask, 'ask'))}
          </Box>
        )}
      </Box>
    </Paper>
  );
};

export default OrderBook;
