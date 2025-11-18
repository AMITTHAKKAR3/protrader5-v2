import React, { useEffect, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
} from '@mui/material';
import { Close, Edit } from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../../store';
import { fetchPositions, closePosition, updateStopLoss, updateTakeProfit } from '../../store/slices/positionSlice';

const PositionsList: React.FC = () => {
  const dispatch = useAppDispatch();
  const { positions, totalUnrealizedPnL, isLoading } = useAppSelector((state) => state.position);

  const [editDialog, setEditDialog] = useState<{
    open: boolean;
    positionId: string;
    stopLoss: string;
    takeProfit: string;
  }>({
    open: false,
    positionId: '',
    stopLoss: '',
    takeProfit: '',
  });

  useEffect(() => {
    dispatch(fetchPositions());
  }, [dispatch]);

  const handleClosePosition = async (positionId: string) => {
    if (window.confirm('Are you sure you want to close this position?')) {
      await dispatch(closePosition(positionId));
    }
  };

  const handleEditClick = (position: any) => {
    setEditDialog({
      open: true,
      positionId: position.id,
      stopLoss: position.stopLoss?.toString() || '',
      takeProfit: position.takeProfit?.toString() || '',
    });
  };

  const handleEditSave = async () => {
    const { positionId, stopLoss, takeProfit } = editDialog;

    if (stopLoss) {
      await dispatch(updateStopLoss({ positionId, stopLoss: parseFloat(stopLoss) }));
    }

    if (takeProfit) {
      await dispatch(updateTakeProfit({ positionId, takeProfit: parseFloat(takeProfit) }));
    }

    setEditDialog({ open: false, positionId: '', stopLoss: '', takeProfit: '' });
  };

  const getSideColor = (side: string) => {
    return side === 'LONG' ? 'success' : 'error';
  };

  const getPnLColor = (pnl: number) => {
    return pnl >= 0 ? 'success.main' : 'error.main';
  };

  return (
    <>
      <Paper elevation={2} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <Box
          sx={{
            p: 2,
            borderBottom: 1,
            borderColor: 'divider',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Typography variant="subtitle1" fontWeight="bold">
            Open Positions ({positions.length})
          </Typography>
          <Box>
            <Typography variant="caption" color="text.secondary">
              Total P&L:{' '}
            </Typography>
            <Typography
              variant="body2"
              fontWeight="bold"
              component="span"
              sx={{ color: getPnLColor(totalUnrealizedPnL) }}
            >
              ${totalUnrealizedPnL.toFixed(2)} ({totalUnrealizedPnL >= 0 ? '+' : ''}
              {((totalUnrealizedPnL / 10000) * 100).toFixed(2)}%)
            </Typography>
          </Box>
        </Box>

        {/* Table */}
        <TableContainer sx={{ flex: 1 }}>
          {positions.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                No open positions
              </Typography>
            </Box>
          ) : (
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Symbol</TableCell>
                  <TableCell>Side</TableCell>
                  <TableCell align="right">Quantity</TableCell>
                  <TableCell align="right">Entry Price</TableCell>
                  <TableCell align="right">Current Price</TableCell>
                  <TableCell align="right">Unrealized P&L</TableCell>
                  <TableCell align="right">P&L %</TableCell>
                  <TableCell align="right">Stop Loss</TableCell>
                  <TableCell align="right">Take Profit</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {positions.map((position) => (
                  <TableRow key={position.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {position.symbol}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={position.side}
                        size="small"
                        color={getSideColor(position.side)}
                        sx={{ fontWeight: 'bold', minWidth: 60 }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2">{position.quantity.toFixed(4)}</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2">${position.entryPrice.toFixed(2)}</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2">${position.currentPrice.toFixed(2)}</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography
                        variant="body2"
                        fontWeight="bold"
                        sx={{ color: getPnLColor(position.unrealizedPnL) }}
                      >
                        ${position.unrealizedPnL.toFixed(2)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography
                        variant="body2"
                        fontWeight="bold"
                        sx={{ color: getPnLColor(position.unrealizedPnLPercent) }}
                      >
                        {position.unrealizedPnLPercent >= 0 ? '+' : ''}
                        {position.unrealizedPnLPercent.toFixed(2)}%
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" color="text.secondary">
                        {position.stopLoss ? `$${position.stopLoss.toFixed(2)}` : '-'}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" color="text.secondary">
                        {position.takeProfit ? `$${position.takeProfit.toFixed(2)}` : '-'}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                        <Tooltip title="Edit SL/TP">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleEditClick(position)}
                          >
                            <Edit fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Close Position">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleClosePosition(position.id)}
                          >
                            <Close fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TableContainer>
      </Paper>

      {/* Edit SL/TP Dialog */}
      <Dialog open={editDialog.open} onClose={() => setEditDialog({ ...editDialog, open: false })}>
        <DialogTitle>Edit Stop Loss / Take Profit</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Stop Loss"
            type="number"
            value={editDialog.stopLoss}
            onChange={(e) => setEditDialog({ ...editDialog, stopLoss: e.target.value })}
            sx={{ mt: 2, mb: 2 }}
          />
          <TextField
            fullWidth
            label="Take Profit"
            type="number"
            value={editDialog.takeProfit}
            onChange={(e) => setEditDialog({ ...editDialog, takeProfit: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog({ ...editDialog, open: false })}>Cancel</Button>
          <Button onClick={handleEditSave} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default PositionsList;
