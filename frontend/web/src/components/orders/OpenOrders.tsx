import React, { useEffect } from 'react';
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
} from '@mui/material';
import { Cancel, Edit } from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { useAppDispatch, useAppSelector } from '../../store';
import { fetchOrders, cancelOrder } from '../../store/slices/tradingSlice';

const OpenOrders: React.FC = () => {
  const dispatch = useAppDispatch();
  const { openOrders, isLoading } = useAppSelector((state) => state.trading);

  useEffect(() => {
    dispatch(fetchOrders());
  }, [dispatch]);

  const handleCancelOrder = async (orderId: string) => {
    if (window.confirm('Are you sure you want to cancel this order?')) {
      await dispatch(cancelOrder(orderId));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'warning';
      case 'PARTIALLY_FILLED':
        return 'info';
      default:
        return 'default';
    }
  };

  const getSideColor = (side: string) => {
    return side === 'BUY' ? 'success' : 'error';
  };

  return (
    <Paper elevation={2} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="subtitle1" fontWeight="bold">
          Open Orders ({openOrders.length})
        </Typography>
      </Box>

      {/* Table */}
      <TableContainer sx={{ flex: 1 }}>
        {openOrders.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              No open orders
            </Typography>
          </Box>
        ) : (
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Symbol</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Side</TableCell>
                <TableCell align="right">Price</TableCell>
                <TableCell align="right">Quantity</TableCell>
                <TableCell align="right">Filled</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Time</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {openOrders.map((order) => (
                <TableRow key={order.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold">
                      {order.symbol}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{order.type}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={order.side}
                      size="small"
                      color={getSideColor(order.side)}
                      sx={{ fontWeight: 'bold', minWidth: 60 }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2">
                      {order.price ? `$${order.price.toFixed(2)}` : 'Market'}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2">{order.quantity.toFixed(4)}</Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" color="text.secondary">
                      {order.filledQuantity.toFixed(4)} / {order.quantity.toFixed(4)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={order.status}
                      size="small"
                      color={getStatusColor(order.status)}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" color="text.secondary">
                      {formatDistanceToNow(new Date(order.createdAt), { addSuffix: true })}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                      <Tooltip title="Edit Order">
                        <IconButton size="small" color="primary">
                          <Edit fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Cancel Order">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleCancelOrder(order.id)}
                        >
                          <Cancel fontSize="small" />
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
  );
};

export default OpenOrders;
