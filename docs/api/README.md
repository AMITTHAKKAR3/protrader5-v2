# ProTrader5 API Documentation (v2.0)

## Overview

The ProTrader5 API provides programmatic access to all platform features including trading, account management, copy trading, and market data. The API is organized as a collection of RESTful endpoints and WebSocket streams.

## Base URL

```
Production: https://api.500x.pro/api/v2
Staging: https://staging-api.500x.pro/api/v2
Development: http://localhost:3000/api/v2
```

## Authentication

All API requests require authentication using one of the following methods:

### JWT Token Authentication (Web/Mobile)

Include the JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

### API Key Authentication (Programmatic Access)

Include your API key and secret in the headers:

```
X-API-Key: <your_api_key>
X-API-Secret: <your_api_secret>
```

## Rate Limiting

API requests are rate-limited to prevent abuse:

- **Standard tier:** 100 requests per minute
- **Pro tier:** 500 requests per minute
- **Enterprise tier:** 2000 requests per minute

Rate limit headers are included in all responses:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1634567890
```

## Response Format

All API responses follow a consistent JSON format:

### Success Response

```json
{
  "success": true,
  "data": {
    // Response data
  },
  "message": "Operation successful",
  "timestamp": "2025-11-18T12:00:00Z"
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "code": "INVALID_PARAMETER",
    "message": "Invalid order quantity",
    "details": {
      "field": "quantity",
      "value": -10
    }
  },
  "timestamp": "2025-11-18T12:00:00Z"
}
```

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Invalid or missing authentication |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `INVALID_PARAMETER` | 400 | Invalid request parameter |
| `INSUFFICIENT_BALANCE` | 400 | Insufficient account balance |
| `MARKET_CLOSED` | 400 | Market is currently closed |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Internal server error |

## API Endpoints

### Authentication & User Management

- [POST /auth/register](endpoints/auth.md#register) - Register new user
- [POST /auth/login](endpoints/auth.md#login) - User login
- [POST /auth/logout](endpoints/auth.md#logout) - User logout
- [GET /users/me](endpoints/users.md#get-profile) - Get user profile
- [PUT /users/me](endpoints/users.md#update-profile) - Update user profile

### Trading

- [POST /trading/orders](endpoints/trading.md#place-order) - Place new order
- [GET /trading/orders](endpoints/trading.md#get-orders) - Get all orders
- [PUT /trading/orders/:id](endpoints/trading.md#modify-order) - Modify order
- [DELETE /trading/orders/:id](endpoints/trading.md#cancel-order) - Cancel order
- [GET /trading/positions](endpoints/trading.md#get-positions) - Get open positions
- [POST /trading/positions/:id/close](endpoints/trading.md#close-position) - Close position

### Copy Trading

- [GET /copy-trading/providers](endpoints/copy-trading.md#get-providers) - Get signal providers
- [POST /copy-trading/subscriptions](endpoints/copy-trading.md#subscribe) - Subscribe to provider
- [GET /copy-trading/subscriptions](endpoints/copy-trading.md#get-subscriptions) - Get subscriptions
- [PUT /copy-trading/subscriptions/:id](endpoints/copy-trading.md#update-subscription) - Update copy settings

### Charting & Market Data

- [GET /charting/history](endpoints/charting.md#get-history) - Get historical OHLCV data
- [GET /charting/symbols](endpoints/charting.md#get-symbols) - Get available symbols
- [GET /charting/quote](endpoints/charting.md#get-quote) - Get real-time quote

### Algorithmic Trading

- [POST /algo-trading/strategies](endpoints/algo-trading.md#create-strategy) - Create strategy
- [POST /algo-trading/backtests](endpoints/algo-trading.md#run-backtest) - Run backtest
- [GET /algo-trading/strategies](endpoints/algo-trading.md#get-strategies) - Get strategies

## WebSocket API

Connect to the WebSocket server for real-time data:

```
wss://api.500x.pro/ws
```

### Authentication

Send authentication message after connection:

```json
{
  "type": "auth",
  "token": "<your_jwt_token>"
}
```

### Subscriptions

Subscribe to topics:

```json
{
  "type": "subscribe",
  "topics": [
    "market-data:BTCUSDT",
    "trade-events:<userId>",
    "position-updates:<userId>"
  ]
}
```

### Message Format

```json
{
  "type": "market-data",
  "topic": "market-data:BTCUSDT",
  "data": {
    "symbol": "BTCUSDT",
    "price": 45000.50,
    "volume": 1234.56,
    "timestamp": "2025-11-18T12:00:00Z"
  }
}
```

## SDKs & Libraries

Official SDKs are available for:

- **JavaScript/TypeScript:** `npm install @protrader5/sdk`
- **Python:** `pip install protrader5-sdk`

## Support

For API support, please contact:
- Email: api-support@500x.pro
- Documentation: https://docs.500x.pro
- Status Page: https://status.500x.pro
