# Algo Trading Service - ProTrader5

## Overview

The Algo Trading Service enables users to create, backtest, and deploy automated trading algorithms. It provides a comprehensive platform for algorithmic trading with support for multiple strategy types and technical indicators.

## Features

- Algorithm creation with visual builder
- Comprehensive backtesting engine
- Multiple strategy types (Momentum, Mean Reversion, Breakout, Arbitrage, Market Making)
- Technical indicator library
- Performance analytics and metrics
- Live algorithm deployment
- Risk management controls
- Public algorithm marketplace
- Swagger API documentation

## Tech Stack

- **Framework:** NestJS
- **Language:** TypeScript
- **Database:** MongoDB
- **Cache:** Redis
- **Technical Indicators:** technicalindicators library
- **Math:** mathjs for calculations
- **Documentation:** Swagger/OpenAPI

## Installation

```bash
npm install
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

Access Swagger documentation at: `http://localhost:3004/api/docs`

## API Endpoints

### Algorithms

- `POST /api/v2/algo-trading/algorithms` - Create a new algorithm
- `GET /api/v2/algo-trading/algorithms` - Get all algorithms
- `GET /api/v2/algo-trading/algorithms/public` - Get public algorithms
- `GET /api/v2/algo-trading/algorithms/:id` - Get algorithm by ID
- `PUT /api/v2/algo-trading/algorithms/:id` - Update algorithm
- `PUT /api/v2/algo-trading/algorithms/:id/status` - Update algorithm status
- `DELETE /api/v2/algo-trading/algorithms/:id` - Delete algorithm

### Backtesting

- `POST /api/v2/algo-trading/algorithms/:id/backtest` - Run backtest
- `GET /api/v2/algo-trading/algorithms/:id/backtests` - Get all backtests
- `GET /api/v2/algo-trading/algorithms/backtests/:backtestId` - Get backtest by ID

## Algorithm Status Flow

```
Draft → Testing → Live
  ↓       ↓        ↓
  ←───────┴────→ Paused
                   ↓
                Stopped
                   ↓
                 Draft
```

## Supported Strategy Types

- **Momentum:** Trend-following strategies
- **Mean Reversion:** Buy low, sell high strategies
- **Breakout:** Price breakout strategies
- **Arbitrage:** Cross-exchange arbitrage
- **Market Making:** Provide liquidity strategies
- **Custom:** User-defined strategies with custom code

## Backtesting Metrics

- Total Return & Percentage
- Sharpe Ratio
- Sortino Ratio
- Maximum Drawdown
- Win Rate
- Profit Factor
- Average Profit/Loss
- Largest Win/Loss
- Average Holding Period
- Volatility

## Environment Variables

```
PORT=3004
NODE_ENV=development
MONGODB_URI=mongodb://admin:protrader5_admin_pass@localhost:27017/protrader5?authSource=admin
REDIS_URL=redis://:protrader5_redis_pass@localhost:6379
```

## License

Proprietary - All rights reserved
