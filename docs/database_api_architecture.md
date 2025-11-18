# ProTrader5 (v2.0) - Database Schema & API Architecture

## 1. Introduction

This document provides a detailed design for the database schema and API architecture for the **ProTrader5 (v2.0)** upgrade. It covers the new data models required to support the advanced features and the corresponding RESTful and WebSocket API endpoints.

---

## 2. Database Schema Design (MongoDB)

The following new MongoDB collections will be introduced to support the new features. Existing collections will also be updated as needed.

### 2.1. Copy Trading System

**`signal_providers` collection:**
```json
{
  "_id": "ObjectId",
  "userId": "ObjectId", // Ref to users collection
  "profileName": "string",
  "strategyDescription": "string",
  "riskLevel": "string", // e.g., Low, Medium, High
  "tradingStyle": "string", // e.g., Scalping, Swing Trading
  "performance": {
    "winRate": "number",
    "profitFactor": "number",
    "sharpeRatio": "number",
    "maxDrawdown": "number",
    "averageReturns": "number"
  },
  "pricing": {
    "model": "string", // e.g., FREE, FIXED_MONTHLY, PROFIT_SHARE
    "monthlyFee": "number",
    "profitSharePercentage": "number"
  },
  "followersCount": "number",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

**`copy_subscriptions` collection:**
```json
{
  "_id": "ObjectId",
  "followerUserId": "ObjectId", // Ref to users collection
  "providerId": "ObjectId", // Ref to signal_providers collection
  "copySettings": {
    "copyMode": "string", // e.g., FULL, PARTIAL, INVERSE
    "positionSizing": "string", // e.g., FIXED_LOT, BALANCE_PERCENTAGE
    "riskMultiplier": "number",
    "maxLotSize": "number",
    "symbolWhitelist": ["string"],
    "symbolBlacklist": ["string"]
  },
  "isActive": "boolean",
  "startedAt": "Date",
  "endedAt": "Date"
}
```

**`copied_trades` collection:**
```json
{
  "_id": "ObjectId",
  "providerTradeId": "ObjectId", // Ref to trades collection
  "followerTradeId": "ObjectId", // Ref to trades collection
  "subscriptionId": "ObjectId", // Ref to copy_subscriptions collection
  "providerId": "ObjectId",
  "followerUserId": "ObjectId",
  "status": "string", // e.g., SUCCESS, FAILED, SKIPPED
  "slippage": "number",
  "createdAt": "Date"
}
```

### 2.2. Algorithmic Trading

**`trading_strategies` collection:**
```json
{
  "_id": "ObjectId",
  "userId": "ObjectId",
  "name": "string",
  "description": "string",
  "type": "string", // e.g., VISUAL, CODE
  "sourceCode": "string", // For code-based strategies
  "visualGraph": "Object", // For visual strategies
  "parameters": "Object",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

**`backtests` collection:**
```json
{
  "_id": "ObjectId",
  "strategyId": "ObjectId",
  "userId": "ObjectId",
  "symbol": "string",
  "timeframe": "string",
  "startDate": "Date",
  "endDate": "Date",
  "results": {
    "equityCurve": ["number"],
    "drawdownChart": ["number"],
    "statistics": "Object"
  },
  "status": "string", // e.g., RUNNING, COMPLETED, FAILED
  "createdAt": "Date"
}
```

### 2.3. Advanced Charting

**`chart_layouts` collection:**
```json
{
  "_id": "ObjectId",
  "userId": "ObjectId",
  "name": "string",
  "layout": "Object", // JSON representation of the chart layout
  "isDefault": "boolean",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

### 2.4. User Management (Enhanced)

**`users` collection (updates):**
- Add `twoFactorAuth` object with `secret`, `enabled`, and `type` fields.
- Add `apiKeys` array of objects with `key`, `secret`, `permissions`, and `ipWhitelist` fields.

---

## 3. API Architecture (v2.0)

The v2.0 API will be a combination of a RESTful API for standard requests and a WebSocket API for real-time data streaming.

### 3.1. RESTful API (v2)

#### Copy Trading Service (`/api/v2/copy-trading`)

- **`GET /providers`**: Get a list of signal providers with filters and sorting.
- **`GET /providers/:id`**: Get details of a specific signal provider.
- **`POST /subscriptions`**: Create a new copy subscription.
  - **Body**: `{ "providerId": "...", "copySettings": { ... } }`
- **`PUT /subscriptions/:id`**: Update a copy subscription.
  - **Body**: `{ "copySettings": { ... } }`
- **`DELETE /subscriptions/:id`**: Cancel a copy subscription.
- **`GET /subscriptions`**: Get a list of the user's subscriptions.

#### Algorithmic Trading Service (`/api/v2/algo-trading`)

- **`POST /strategies`**: Create a new trading strategy.
  - **Body**: `{ "name": "...", "sourceCode": "..." }`
- **`GET /strategies`**: Get a list of the user's strategies.
- **`GET /strategies/:id`**: Get details of a specific strategy.
- **`PUT /strategies/:id`**: Update a strategy.
- **`POST /backtests`**: Run a new backtest.
  - **Body**: `{ "strategyId": "...", "symbol": "...", "timeframe": "..." }`
- **`GET /backtests/:id`**: Get the results of a backtest.

#### Charting Service (`/api/v2/charting`)

- **`GET /history`**: Get historical OHLCV data.
  - **Query Params**: `symbol`, `resolution`, `from`, `to`
- **`POST /layouts`**: Save a new chart layout.
  - **Body**: `{ "name": "...", "layout": { ... } }`
- **`GET /layouts`**: Get all saved chart layouts for the user.

#### User Service (`/api/v2/users`)

- **`POST /me/2fa/enable`**: Enable two-factor authentication.
- **`POST /me/2fa/disable`**: Disable two-factor authentication.
- **`POST /me/api-keys`**: Create a new API key.
- **`DELETE /me/api-keys/:key`**: Delete an API key.

### 3.2. WebSocket API (v2)

The WebSocket API will provide real-time data streams. Clients will subscribe to topics to receive updates.

#### Topics

- **`market-data:<symbol>`**: Real-time price updates for a symbol.
  - **Message**: `{ "symbol": "...", "price": "...", "volume": "..." }`
- **`trade-events:<userId>`**: Real-time updates on the user's trades.
  - **Message**: `{ "tradeId": "...", "status": "..." }`
- **`position-updates:<userId>`**: Real-time updates on the user's positions.
  - **Message**: `{ "positionId": "...", "pnl": "..." }`
- **`copy-trade-events:<followerUserId>`**: Real-time updates on copied trades.
  - **Message**: `{ "copiedTradeId": "...", "status": "..." }`

---

## 4. Conclusion

This database schema and API architecture provide a solid foundation for building the new features of ProTrader5. The design is scalable, flexible, and aligned with the microservices-based architecture. The next step is to create a detailed development roadmap and resource estimation based on this design.
