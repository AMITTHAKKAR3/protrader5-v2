# Copy Trading Service - ProTrader5

## Overview

The Copy Trading Service provides a marketplace for trading strategies where experienced traders can share their strategies and followers can automatically copy their trades.

## Features

- ✅ Strategy creation and management
- ✅ Strategy marketplace with search and filters
- ✅ Subscription management
- ✅ Automated trade copying
- ✅ Performance tracking and analytics
- ✅ Profit sharing and fee management
- ✅ Risk management controls
- ✅ Rating and review system
- ✅ Featured and top performer listings
- ✅ Swagger API documentation

## Tech Stack

- **Framework:** NestJS
- **Language:** TypeScript
- **Database:** MongoDB
- **Cache:** Redis
- **Task Scheduling:** @nestjs/schedule
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
http://localhost:3003/api/docs
```

## API Endpoints

### Strategies

- `POST /api/v2/copy-trading/strategies` - Create a new trading strategy
- `GET /api/v2/copy-trading/strategies` - Get all strategies with filters
- `GET /api/v2/copy-trading/strategies/featured` - Get featured strategies
- `GET /api/v2/copy-trading/strategies/top-performers` - Get top performing strategies
- `GET /api/v2/copy-trading/strategies/search` - Search strategies
- `GET /api/v2/copy-trading/strategies/my-strategies` - Get user's strategies
- `GET /api/v2/copy-trading/strategies/:id` - Get strategy by ID
- `PUT /api/v2/copy-trading/strategies/:id` - Update strategy
- `PUT /api/v2/copy-trading/strategies/:id/status` - Update strategy status
- `DELETE /api/v2/copy-trading/strategies/:id` - Delete strategy

### Subscriptions

- `POST /api/v2/copy-trading/subscriptions` - Subscribe to a strategy
- `GET /api/v2/copy-trading/subscriptions` - Get all subscriptions
- `GET /api/v2/copy-trading/subscriptions/:id` - Get subscription by ID
- `PUT /api/v2/copy-trading/subscriptions/:id/status` - Update subscription status
- `PUT /api/v2/copy-trading/subscriptions/:id/settings` - Update subscription settings
- `PUT /api/v2/copy-trading/subscriptions/:id/copy-ratio` - Update copy ratio

## Key Features

### Strategy Marketplace

Traders can create and publish their trading strategies with:
- Custom pricing (monthly, quarterly, yearly, or one-time)
- Profit sharing percentage
- Investment limits
- Risk management rules
- Performance metrics

### Subscription Management

Followers can:
- Browse and search strategies
- Subscribe with custom investment amounts
- Set copy ratio (1-100%)
- Configure risk management settings
- Pause or cancel subscriptions
- Track performance

### Automated Trade Copying

The service automatically:
- Copies trades from strategy traders to followers
- Adjusts position sizes based on copy ratio
- Applies follower's risk management rules
- Tracks performance and P&L
- Processes subscription fees

### Performance Analytics

Real-time tracking of:
- Total return
- Win rate
- Sharpe ratio
- Maximum drawdown
- Average profit/loss
- Equity curve

## Environment Variables

```
PORT=3003
NODE_ENV=development
MONGODB_URI=mongodb://admin:protrader5_admin_pass@localhost:27017/protrader5?authSource=admin
REDIS_URL=redis://:protrader5_redis_pass@localhost:6379
```

## License

Proprietary - All rights reserved
