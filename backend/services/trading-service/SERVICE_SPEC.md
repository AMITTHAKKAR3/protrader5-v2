# Trading Service - Technical Specification

## Overview

The Trading Service is the core of the platform, responsible for all trading operations including order placement, execution, modification, cancellation, and position management.

## Responsibilities

- Order placement and validation
- Order execution and matching
- Order modification and cancellation
- Position tracking and P&L calculation
- Trade history and logging
- Real-time trade event streaming
- Margin calculation and validation
- Support for all advanced order types

## Technology Stack

- **Framework:** NestJS
- **Database:** MongoDB
- **Cache:** Redis (for real-time positions and prices)
- **Message Queue:** RabbitMQ
- **Data Streaming:** Apache Kafka
- **Validation:** class-validator

## Database Schema

### Trades Collection

```typescript
{
  _id: ObjectId,
  userId: ObjectId (indexed),
  symbol: string (indexed),
  exchange: string,
  orderType: string (enum: Market, Limit, StopLoss, SLTP, TrailingStop, OCO, Iceberg, TWAP, VWAP, Bracket),
  tradeType: string (enum: Buy, Sell),
  productType: string (enum: Intraday, LongTerm),
  quantity: number,
  lotSize: number,
  price: number,
  stopLoss: number,
  takeProfit: number,
  trailingDistance: number,
  executionMode: string (enum: IOC, FOK, GTC, GTD, DAY),
  status: string (enum: Pending, Executed, Cancelled, Rejected, PartiallyFilled),
  filledQuantity: number,
  averagePrice: number,
  commission: number,
  slippage: number,
  parentOrderId: ObjectId (for OCO, Bracket orders),
  childOrderIds: [ObjectId],
  executedAt: Date,
  createdAt: Date (indexed),
  updatedAt: Date
}
```

### Positions Collection

```typescript
{
  _id: ObjectId,
  userId: ObjectId (indexed),
  symbol: string (indexed),
  exchange: string,
  tradeType: string (enum: Buy, Sell),
  quantity: number,
  averagePrice: number,
  currentPrice: number,
  pnl: number,
  pnlPercentage: number,
  margin: number,
  leverage: number,
  stopLoss: number,
  takeProfit: number,
  isOpen: boolean (indexed),
  openedAt: Date,
  closedAt: Date,
  relatedTrades: [ObjectId]
}
```

## API Endpoints

### Order Management

- `POST /api/v2/trading/orders` - Place new order
- `GET /api/v2/trading/orders` - Get all orders (with filters)
- `GET /api/v2/trading/orders/:id` - Get order by ID
- `PUT /api/v2/trading/orders/:id` - Modify pending order
- `DELETE /api/v2/trading/orders/:id` - Cancel pending order
- `POST /api/v2/trading/orders/:id/execute` - Manually execute pending order (Admin)

### Position Management

- `GET /api/v2/trading/positions` - Get all open positions
- `GET /api/v2/trading/positions/:id` - Get position by ID
- `POST /api/v2/trading/positions/:id/close` - Close position (full or partial)
- `PUT /api/v2/trading/positions/:id/sl-tp` - Update stop loss/take profit
- `POST /api/v2/trading/positions/close-all` - Close all positions

### Trade History

- `GET /api/v2/trading/history` - Get trade history with pagination
- `GET /api/v2/trading/history/export` - Export trade history (CSV/Excel)

### Advanced Orders

- `POST /api/v2/trading/orders/bracket` - Place bracket order
- `POST /api/v2/trading/orders/oco` - Place OCO order
- `POST /api/v2/trading/orders/trailing-stop` - Place trailing stop order

## Events Published

- `trade.placed` - When an order is placed
- `trade.executed` - When an order is executed
- `trade.modified` - When an order is modified
- `trade.cancelled` - When an order is cancelled
- `trade.rejected` - When an order is rejected
- `position.opened` - When a new position is opened
- `position.updated` - When a position is updated
- `position.closed` - When a position is closed

## Events Subscribed

- `market.price.updated` - Real-time price updates from market data feed
- `user.balance.updated` - User balance updates for margin validation

## Business Logic

### Order Validation

1. Check user authentication and authorization
2. Validate symbol and exchange
3. Check if market is open
4. Validate order parameters (quantity, price, etc.)
5. Check user balance and margin requirements
6. Apply risk management rules
7. Check for duplicate orders

### Order Execution Flow

1. Receive order placement request
2. Validate order
3. Calculate required margin
4. Reserve margin from user balance
5. Place order in pending state
6. If market order: Execute immediately
7. If limit/stop order: Add to pending orders queue
8. Monitor pending orders for execution conditions
9. Execute order when conditions are met
10. Update position and user balance
11. Publish trade events
12. Send notifications

### Position P&L Calculation

```
P&L = (CurrentPrice - AveragePrice) * Quantity * (Buy: 1, Sell: -1)
P&L% = (P&L / (AveragePrice * Quantity)) * 100
```

## Performance Requirements

- Order placement: < 50ms
- Order execution: < 50ms
- Position P&L update: < 10ms (real-time)
- Support for 100,000+ orders per day
- Support for 10,000+ concurrent open positions

## Testing

- Unit tests for order validation logic
- Integration tests for order execution flow
- Load tests for high-volume trading scenarios
- E2E tests for complete trading workflows
