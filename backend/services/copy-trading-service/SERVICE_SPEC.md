# Copy Trading Service - Technical Specification

## Overview

The Copy Trading Service manages the entire copy trading ecosystem, including signal provider registration, follower subscriptions, real-time trade copying, performance tracking, and revenue management.

## Responsibilities

- Signal provider profile management
- Provider performance tracking and analytics
- Follower subscription management
- Real-time trade copying with configurable settings
- Risk-adjusted position sizing
- Copy trade execution and monitoring
- Revenue calculation and distribution
- Provider rankings and leaderboards

## Technology Stack

- **Framework:** NestJS
- **Database:** MongoDB
- **Cache:** Redis (for real-time copy settings)
- **Message Queue:** RabbitMQ
- **Data Streaming:** Apache Kafka
- **Validation:** class-validator

## Database Schema

### Signal Providers Collection

```typescript
{
  _id: ObjectId,
  userId: ObjectId (indexed, unique),
  profileName: string,
  bio: string,
  strategyDescription: string,
  riskLevel: string (enum: Low, Medium, High),
  tradingStyle: string (enum: Scalping, DayTrading, SwingTrading, PositionTrading),
  performance: {
    winRate: number,
    profitFactor: number,
    sharpeRatio: number,
    sortinoRatio: number,
    calmarRatio: number,
    maxDrawdown: number,
    averageReturns: number,
    totalTrades: number,
    winningTrades: number,
    losingTrades: number,
    consecutiveWins: number,
    consecutiveLosses: number,
    bestTrade: number,
    worstTrade: number
  },
  pricing: {
    model: string (enum: FREE, FIXED_MONTHLY, PROFIT_SHARE, HYBRID),
    monthlyFee: number,
    setupFee: number,
    profitSharePercentage: number (0-50),
    freeTrialDays: number
  },
  socialLinks: {
    telegram: string,
    twitter: string,
    website: string
  },
  followersCount: number,
  rating: number (1-5),
  reviewsCount: number,
  totalRevenue: number,
  isActive: boolean,
  isVerified: boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Copy Subscriptions Collection

```typescript
{
  _id: ObjectId,
  followerUserId: ObjectId (indexed),
  providerId: ObjectId (indexed),
  copySettings: {
    copyMode: string (enum: FULL, PARTIAL, INVERSE, PROPORTIONAL),
    positionSizing: string (enum: FIXED_LOT, FIXED_RATIO, BALANCE_PERCENTAGE, EQUITY_PERCENTAGE, RISK_BASED),
    riskMultiplier: number (0.1 - 10),
    maxLotSize: number,
    minLotSize: number,
    maxOpenPositions: number,
    maxDailyTrades: number,
    symbolFilter: {
      mode: string (enum: ALL, INCLUDE, EXCLUDE),
      symbols: [string]
    },
    copyComponents: {
      stopLoss: boolean,
      takeProfit: boolean,
      trailingStop: boolean,
      partialClose: boolean
    },
    slippage: {
      maxSlippagePips: number,
      skipOnHighSlippage: boolean
    },
    tradingHours: {
      enabled: boolean,
      timezone: string,
      allowedHours: [object]
    },
    safetyLimits: {
      maxDrawdownPercent: number,
      autoPauseOnDrawdown: boolean,
      dailyLossLimit: number,
      autoStopOnLossLimit: boolean
    }
  },
  statistics: {
    totalCopiedTrades: number,
    successfulCopies: number,
    failedCopies: number,
    skippedTrades: number,
    totalPnL: number,
    roi: number
  },
  status: string (enum: Active, Paused, Cancelled),
  startedAt: Date,
  endedAt: Date,
  nextBillingDate: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Copied Trades Collection

```typescript
{
  _id: ObjectId,
  providerTradeId: ObjectId (indexed),
  followerTradeId: ObjectId (indexed),
  subscriptionId: ObjectId (indexed),
  providerId: ObjectId,
  followerUserId: ObjectId,
  symbol: string,
  providerQuantity: number,
  followerQuantity: number,
  providerPrice: number,
  followerPrice: number,
  slippage: number,
  status: string (enum: SUCCESS, FAILED, SKIPPED),
  failureReason: string,
  executionTime: number (ms),
  createdAt: Date
}
```

## API Endpoints

### Provider Management

- `POST /api/v2/copy-trading/providers` - Register as signal provider
- `GET /api/v2/copy-trading/providers` - Get all providers (with filters)
- `GET /api/v2/copy-trading/providers/:id` - Get provider details
- `PUT /api/v2/copy-trading/providers/:id` - Update provider profile
- `GET /api/v2/copy-trading/providers/:id/performance` - Get provider performance
- `GET /api/v2/copy-trading/providers/:id/trades` - Get provider trade history

### Subscription Management

- `POST /api/v2/copy-trading/subscriptions` - Subscribe to a provider
- `GET /api/v2/copy-trading/subscriptions` - Get user's subscriptions
- `GET /api/v2/copy-trading/subscriptions/:id` - Get subscription details
- `PUT /api/v2/copy-trading/subscriptions/:id` - Update copy settings
- `POST /api/v2/copy-trading/subscriptions/:id/pause` - Pause subscription
- `POST /api/v2/copy-trading/subscriptions/:id/resume` - Resume subscription
- `DELETE /api/v2/copy-trading/subscriptions/:id` - Cancel subscription

### Performance & Analytics

- `GET /api/v2/copy-trading/leaderboard` - Get provider leaderboard
- `GET /api/v2/copy-trading/subscriptions/:id/statistics` - Get copy statistics
- `GET /api/v2/copy-trading/copied-trades` - Get copied trade history

## Events Subscribed

- `trade.executed` (from Trading Service) - To copy trades in real-time

## Events Published

- `copy-trade.executed` - When a trade is copied
- `copy-trade.failed` - When trade copying fails
- `subscription.created` - When a new subscription is created
- `subscription.cancelled` - When a subscription is cancelled

## Business Logic

### Trade Copying Flow

1. Listen to `trade.executed` event from Trading Service
2. Check if the trader is a signal provider
3. Get all active subscriptions for this provider
4. For each subscription:
   - Check if copying is allowed (trading hours, daily limits, etc.)
   - Check symbol filter (whitelist/blacklist)
   - Calculate follower position size based on copy settings
   - Validate follower balance and margin
   - Place order for follower
   - Record copied trade with status and slippage
5. Publish `copy-trade.executed` event

### Position Sizing Calculation

```typescript
switch (positionSizing) {
  case 'FIXED_LOT':
    followerQuantity = providerQuantity * riskMultiplier;
    break;
  case 'FIXED_RATIO':
    followerQuantity = providerQuantity * riskMultiplier;
    break;
  case 'BALANCE_PERCENTAGE':
    followerQuantity = (followerBalance * riskMultiplier) / price;
    break;
  case 'EQUITY_PERCENTAGE':
    followerQuantity = (followerEquity * riskMultiplier) / price;
    break;
  case 'RISK_BASED':
    // Match risk percentage of provider
    providerRisk = (providerQuantity * price) / providerBalance;
    followerQuantity = (followerBalance * providerRisk * riskMultiplier) / price;
    break;
}

// Apply min/max limits
followerQuantity = Math.max(minLotSize, Math.min(maxLotSize, followerQuantity));
```

### Performance Metrics Calculation

```typescript
winRate = (winningTrades / totalTrades) * 100;
profitFactor = totalProfit / totalLoss;
sharpeRatio = (averageReturn - riskFreeRate) / standardDeviation;
maxDrawdown = Math.max(...drawdownSeries);
```

## Performance Requirements

- Trade copying latency: < 100ms
- Support for 1000+ simultaneous copy operations
- Real-time performance updates
- Handle 10,000+ active subscriptions

## Testing

- Unit tests for position sizing calculations
- Integration tests for trade copying flow
- Load tests for high-volume copying scenarios
- E2E tests for complete subscription lifecycle
