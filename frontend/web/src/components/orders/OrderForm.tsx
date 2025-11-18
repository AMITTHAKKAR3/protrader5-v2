import React, { useState } from 'react';
import {
  Box,
  Paper,
  Tabs,
  Tab,
  TextField,
  Button,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  InputAdornment,
  Alert,
  CircularProgress,
  Slider,
} from '@mui/material';
import { TrendingUp, TrendingDown } from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../../store';
import { placeOrder } from '../../store/slices/tradingSlice';

interface OrderFormProps {
  symbol: string;
  currentPrice: number;
}

const OrderForm: React.FC<OrderFormProps> = ({ symbol, currentPrice }) => {
  const dispatch = useAppDispatch();
  const { isLoading, error } = useAppSelector((state) => state.trading);

  const [side, setSide] = useState<'BUY' | 'SELL'>('BUY');
  const [orderType, setOrderType] = useState<string>('MARKET');
  const [quantity, setQuantity] = useState<string>('');
  const [price, setPrice] = useState<string>(currentPrice.toString());
  const [stopPrice, setStopPrice] = useState<string>('');
  const [percentage, setPercentage] = useState<number>(0);
  const [success, setSuccess] = useState<string>('');

  const handleSideChange = (_: React.SyntheticEvent, newSide: 'BUY' | 'SELL') => {
    if (newSide) {
      setSide(newSide);
    }
  };

  const handlePercentageChange = (_: Event, newValue: number | number[]) => {
    setPercentage(newValue as number);
    // Calculate quantity based on percentage (mock calculation)
    const mockBalance = 10000;
    const calculatedQuantity = (mockBalance * (newValue as number) / 100) / currentPrice;
    setQuantity(calculatedQuantity.toFixed(4));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess('');

    try {
      const orderData: any = {
        symbol,
        type: orderType,
        side,
        quantity: parseFloat(quantity),
      };

      if (orderType !== 'MARKET') {
        orderData.price = parseFloat(price);
      }

      if (orderType === 'STOP_LOSS' || orderType === 'STOP_LIMIT') {
        orderData.stopPrice = parseFloat(stopPrice);
      }

      await dispatch(placeOrder(orderData)).unwrap();
      setSuccess(`${side} order placed successfully!`);
      
      // Reset form
      setQuantity('');
      setPercentage(0);
    } catch (err) {
      // Error handled by Redux
    }
  };

  const calculateTotal = () => {
    const qty = parseFloat(quantity) || 0;
    const prc = orderType === 'MARKET' ? currentPrice : parseFloat(price) || 0;
    return (qty * prc).toFixed(2);
  };

  return (
    <Paper elevation={2} sx={{ height: '100%' }}>
      {/* Header */}
      <Box sx={{ p: 1, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="subtitle2" fontWeight="bold">
          Place Order
        </Typography>
      </Box>

      {/* Buy/Sell Tabs */}
      <Tabs
        value={side}
        onChange={handleSideChange}
        variant="fullWidth"
        sx={{
          '& .MuiTab-root': { fontWeight: 'bold' },
          '& .Mui-selected': {
            color: side === 'BUY' ? 'success.main' : 'error.main',
          },
        }}
      >
        <Tab
          label="Buy"
          value="BUY"
          icon={<TrendingUp />}
          iconPosition="start"
        />
        <Tab
          label="Sell"
          value="SELL"
          icon={<TrendingDown />}
          iconPosition="start"
        />
      </Tabs>

      {/* Form */}
      <Box component="form" onSubmit={handleSubmit} sx={{ p: 2 }}>
        {/* Success Alert */}
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Order Type */}
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Order Type</InputLabel>
          <Select
            value={orderType}
            onChange={(e) => setOrderType(e.target.value)}
            label="Order Type"
          >
            <MenuItem value="MARKET">Market</MenuItem>
            <MenuItem value="LIMIT">Limit</MenuItem>
            <MenuItem value="STOP_LOSS">Stop Loss</MenuItem>
            <MenuItem value="STOP_LIMIT">Stop Limit</MenuItem>
            <MenuItem value="TRAILING_STOP">Trailing Stop</MenuItem>
          </Select>
        </FormControl>

        {/* Price (for Limit orders) */}
        {(orderType === 'LIMIT' || orderType === 'STOP_LIMIT') && (
          <TextField
            fullWidth
            label="Price"
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            InputProps={{
              startAdornment: <InputAdornment position="start">$</InputAdornment>,
            }}
            sx={{ mb: 2 }}
          />
        )}

        {/* Stop Price (for Stop orders) */}
        {(orderType === 'STOP_LOSS' || orderType === 'STOP_LIMIT') && (
          <TextField
            fullWidth
            label="Stop Price"
            type="number"
            value={stopPrice}
            onChange={(e) => setStopPrice(e.target.value)}
            InputProps={{
              startAdornment: <InputAdornment position="start">$</InputAdornment>,
            }}
            sx={{ mb: 2 }}
          />
        )}

        {/* Quantity */}
        <TextField
          fullWidth
          label="Quantity"
          type="number"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          required
          InputProps={{
            endAdornment: <InputAdornment position="end">{symbol.slice(0, -3)}</InputAdornment>,
          }}
          sx={{ mb: 1 }}
        />

        {/* Percentage Slider */}
        <Box sx={{ px: 1, mb: 2 }}>
          <Typography variant="caption" color="text.secondary" gutterBottom>
            Amount: {percentage}%
          </Typography>
          <Slider
            value={percentage}
            onChange={handlePercentageChange}
            step={25}
            marks
            min={0}
            max={100}
            valueLabelDisplay="auto"
            valueLabelFormat={(value) => `${value}%`}
          />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
            {[25, 50, 75, 100].map((value) => (
              <Typography key={value} variant="caption" color="text.secondary">
                {value}%
              </Typography>
            ))}
          </Box>
        </Box>

        {/* Total */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            mb: 2,
            p: 1,
            bgcolor: 'action.hover',
            borderRadius: 1,
          }}
        >
          <Typography variant="body2" color="text.secondary">
            Total
          </Typography>
          <Typography variant="body2" fontWeight="bold">
            ${calculateTotal()}
          </Typography>
        </Box>

        {/* Submit Button */}
        <Button
          fullWidth
          type="submit"
          variant="contained"
          size="large"
          disabled={isLoading || !quantity}
          sx={{
            bgcolor: side === 'BUY' ? 'success.main' : 'error.main',
            '&:hover': {
              bgcolor: side === 'BUY' ? 'success.dark' : 'error.dark',
            },
            py: 1.5,
          }}
        >
          {isLoading ? (
            <CircularProgress size={24} />
          ) : (
            `${side} ${symbol.slice(0, -3)}`
          )}
        </Button>

        {/* Available Balance (Mock) */}
        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            Available: $10,000.00
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
};

export default OrderForm;
