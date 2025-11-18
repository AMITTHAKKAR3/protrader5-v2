# Trading Service - ProTrader5

## Overview

The Trading Service handles all trading operations including order placement, execution, modification, cancellation, and position management for the ProTrader5 platform.

## Features

- ✅ 14 advanced order types
  - Market, Limit, Stop Loss, Stop Limit
  - Trailing Stop
  - OCO (One-Cancels-Other)
  - Iceberg
  - TWAP (Time-Weighted Average Price)
  - VWAP (Volume-Weighted Average Price)
  - Bracket Orders
  - Fill or Kill, Immediate or Cancel
- ✅ Position management (open, close, partial close)
- ✅ Real-time P&L calculation
- ✅ Stop loss and take profit automation
- ✅ Multi-exchange support (NSE, BSE, MCX, NCDEX, GIFT, SGX)
- ✅ Order modification and cancellation
- ✅ Trade history and reporting
- ✅ Swagger API documentation

## Tech Stack

- **Framework:** NestJS
- **Language:** TypeScript
- **Database:** MongoDB
- **Message Queue:** RabbitMQ / Kafka
- **Cache:** Redis
- **Documentation:** Swagger/OpenAPI

## Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Update .env with your configuration
```

## Running the Service

```bash
# Development mode
npm run start:dev

# Production mode
npm run build
npm run start:prod
```

## API Documentation

Once the service is running, access the Swagger documentation at:
```
http://localhost:3002/api/docs
```

## API Endpoints

### Orders

- `POST /api/v2/trading/orders` - Place a new order
- `GET /api/v2/trading/orders` - Get all orders with filters
- `GET /api/v2/trading/orders/:id` - Get order by ID
- `PUT /api/v2/trading/orders/:id` - Modify pending order
- `DELETE /api/v2/trading/orders/:id` - Cancel pending order

### Positions

- `GET /api/v2/trading/positions` - Get all positions
- `GET /api/v2/trading/positions/:id` - Get position by ID
- `POST /api/v2/trading/positions/:id/close` - Close position (full or partial)
- `POST /api/v2/trading/positions/close-all` - Close all open positions
- `PUT /api/v2/trading/positions/:id/sl-tp` - Update stop loss and take profit

## Order Types

### Market Order
Executes immediately at the current market price.

### Limit Order
Executes only at the specified price or better.

### Stop Loss Order
Triggers a market order when the price reaches the stop loss level.

### Trailing Stop Order
Automatically adjusts the stop loss as the price moves favorably.

### OCO (One-Cancels-Other)
Places two orders simultaneously; when one executes, the other is cancelled.

### Iceberg Order
Large order split into smaller visible portions to hide the total quantity.

### TWAP (Time-Weighted Average Price)
Executes the order in equal parts over a specified time period.

### VWAP (Volume-Weighted Average Price)
Executes the order based on volume patterns to achieve average market price.

### Bracket Order
Three-legged order with entry, target, and stop loss orders.

## Environment Variables

```
PORT=3002
NODE_ENV=development
MONGODB_URI=mongodb://admin:protrader5_admin_pass@localhost:27017/protrader5?authSource=admin
REDIS_URL=redis://:protrader5_redis_pass@localhost:6379
RABBITMQ_URL=amqp://protrader5:protrader5_rabbitmq_pass@localhost:5672
KAFKA_BROKERS=localhost:9092
```

## License

Proprietary - All rights reserved
