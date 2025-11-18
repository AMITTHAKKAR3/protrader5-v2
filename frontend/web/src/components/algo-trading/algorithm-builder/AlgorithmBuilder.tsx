import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Code, PlayArrow, Save } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../../store';
import { createAlgorithm } from '../../../store/slices/algoTradingSlice';

const AlgorithmBuilder: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { isLoading, error } = useAppSelector((state) => state.algoTrading);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    language: 'JAVASCRIPT',
    code: `// Entry conditions
function shouldEnter(data) {
  const { price, sma20, sma50, rsi } = data;
  
  // Buy when price crosses above SMA20 and RSI < 30
  if (price > sma20 && rsi < 30) {
    return { action: 'BUY', quantity: 1 };
  }
  
  return null;
}

// Exit conditions
function shouldExit(data, position) {
  const { price, sma20, rsi } = data;
  
  // Sell when price crosses below SMA20 or RSI > 70
  if (price < sma20 || rsi > 70) {
    return { action: 'SELL', quantity: position.quantity };
  }
  
  return null;
}`,
    symbols: [] as string[],
    timeframe: '15m',
    riskPerTrade: 2,
    maxPositions: 3,
  });

  const [symbolInput, setSymbolInput] = useState('');
  const [success, setSuccess] = useState('');

  const handleInputChange = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleAddSymbol = () => {
    if (symbolInput && !formData.symbols.includes(symbolInput)) {
      setFormData({
        ...formData,
        symbols: [...formData.symbols, symbolInput.toUpperCase()],
      });
      setSymbolInput('');
    }
  };

  const handleRemoveSymbol = (symbol: string) => {
    setFormData({
      ...formData,
      symbols: formData.symbols.filter((s) => s !== symbol),
    });
  };

  const handleSave = async () => {
    setSuccess('');
    try {
      const result = await dispatch(createAlgorithm(formData)).unwrap();
      setSuccess('Algorithm saved successfully!');
      setTimeout(() => navigate(`/algo-trading/algorithm/${result.id}`), 2000);
    } catch (err) {
      // Error handled by Redux
    }
  };

  const handleBacktest = () => {
    // Navigate to backtest page with algorithm data
    navigate('/algo-trading/backtest', { state: { algorithm: formData } });
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Algorithm Builder
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Create custom trading algorithms with code
        </Typography>
      </Box>

      {/* Success Alert */}
      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Left Column - Configuration */}
        <Grid item xs={12} md={4}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Configuration
            </Typography>

            {/* Name */}
            <TextField
              fullWidth
              label="Algorithm Name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              required
              sx={{ mb: 2 }}
            />

            {/* Description */}
            <TextField
              fullWidth
              label="Description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              multiline
              rows={3}
              sx={{ mb: 2 }}
            />

            {/* Language */}
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Language</InputLabel>
              <Select
                value={formData.language}
                onChange={(e) => handleInputChange('language', e.target.value)}
                label="Language"
              >
                <MenuItem value="JAVASCRIPT">JavaScript</MenuItem>
                <MenuItem value="PYTHON">Python</MenuItem>
              </Select>
            </FormControl>

            {/* Symbols */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Symbols
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                <TextField
                  size="small"
                  placeholder="e.g., BTCUSDT"
                  value={symbolInput}
                  onChange={(e) => setSymbolInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddSymbol()}
                />
                <Button variant="outlined" onClick={handleAddSymbol}>
                  Add
                </Button>
              </Box>
              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                {formData.symbols.map((symbol) => (
                  <Chip
                    key={symbol}
                    label={symbol}
                    onDelete={() => handleRemoveSymbol(symbol)}
                    size="small"
                  />
                ))}
              </Box>
            </Box>

            {/* Timeframe */}
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Timeframe</InputLabel>
              <Select
                value={formData.timeframe}
                onChange={(e) => handleInputChange('timeframe', e.target.value)}
                label="Timeframe"
              >
                <MenuItem value="1m">1 Minute</MenuItem>
                <MenuItem value="5m">5 Minutes</MenuItem>
                <MenuItem value="15m">15 Minutes</MenuItem>
                <MenuItem value="1h">1 Hour</MenuItem>
                <MenuItem value="4h">4 Hours</MenuItem>
                <MenuItem value="1d">1 Day</MenuItem>
              </Select>
            </FormControl>

            {/* Risk Per Trade */}
            <TextField
              fullWidth
              label="Risk Per Trade (%)"
              type="number"
              value={formData.riskPerTrade}
              onChange={(e) => handleInputChange('riskPerTrade', parseFloat(e.target.value))}
              inputProps={{ min: 0.1, max: 10, step: 0.1 }}
              sx={{ mb: 2 }}
            />

            {/* Max Positions */}
            <TextField
              fullWidth
              label="Max Concurrent Positions"
              type="number"
              value={formData.maxPositions}
              onChange={(e) => handleInputChange('maxPositions', parseInt(e.target.value))}
              inputProps={{ min: 1, max: 10 }}
            />
          </Paper>
        </Grid>

        {/* Right Column - Code Editor */}
        <Grid item xs={12} md={8}>
          <Paper elevation={2} sx={{ p: 3, height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                <Code sx={{ mr: 1, verticalAlign: 'middle' }} />
                Code Editor
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="outlined"
                  startIcon={<PlayArrow />}
                  onClick={handleBacktest}
                  disabled={!formData.name || formData.symbols.length === 0}
                >
                  Backtest
                </Button>
                <Button
                  variant="contained"
                  startIcon={<Save />}
                  onClick={handleSave}
                  disabled={isLoading || !formData.name || formData.symbols.length === 0}
                >
                  {isLoading ? <CircularProgress size={24} /> : 'Save'}
                </Button>
              </Box>
            </Box>

            {/* Code Textarea */}
            <TextField
              fullWidth
              multiline
              rows={25}
              value={formData.code}
              onChange={(e) => handleInputChange('code', e.target.value)}
              placeholder="Write your trading algorithm here..."
              sx={{
                '& .MuiInputBase-input': {
                  fontFamily: 'monospace',
                  fontSize: '14px',
                },
              }}
            />

            {/* Help Text */}
            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="caption">
                <strong>Available data:</strong> price, sma20, sma50, ema12, ema26, rsi, macd, volume
                <br />
                <strong>Return format:</strong> {`{ action: 'BUY' | 'SELL', quantity: number }`}
              </Typography>
            </Alert>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AlgorithmBuilder;
