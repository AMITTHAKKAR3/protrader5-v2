# Exchange Integration Guide for ProTrader5 v2.0

This guide provides comprehensive instructions for integrating with NSE, BSE, and Binance exchanges.

## Table of Contents

1. [Overview](#overview)
2. [NSE Integration](#nse-integration)
3. [BSE Integration](#bse-integration)
4. [Binance Integration](#binance-integration)
5. [Exchange Service Architecture](#exchange-service-architecture)
6. [API Implementation](#api-implementation)
7. [WebSocket Implementation](#websocket-implementation)
8. [Order Management](#order-management)
9. [Market Data](#market-data)
10. [Testing](#testing)

---

## Overview

### Exchange Comparison

| Feature | NSE | BSE | Binance |
|---------|-----|-----|---------|
| **Asset Type** | Stocks, Derivatives | Stocks | Crypto |
| **API Type** | REST + WebSocket | REST + WebSocket | REST + WebSocket |
| **Authentication** | API Key + Secret | API Key + Secret | API Key + Secret |
| **Rate Limits** | 10 req/sec | 10 req/sec | 1200 req/min |
| **Market Data** | Real-time | Real-time | Real-time |
| **Order Types** | Market, Limit, SL, SL-M | Market, Limit, SL | Market, Limit, Stop, OCO |
| **Fees** | 0.05% | 0.05% | 0.1% |
| **Documentation** | Good | Good | Excellent |

### Integration Strategy

**Unified Exchange Interface:**
- Abstract common exchange operations
- Implement exchange-specific adapters
- Use CCXT library for standardization
- Handle exchange-specific features separately

---

## NSE Integration

### Prerequisites

1. **Trading Account** with NSE-registered broker
2. **API Access** from broker (Zerodha, Upstox, Angel One, etc.)
3. **API Credentials** (API Key, API Secret, Access Token)

### Recommended Brokers

| Broker | API Quality | Cost | Documentation |
|--------|-------------|------|---------------|
| **Zerodha (Kite Connect)** | Excellent | ₹2,000/month | Excellent |
| **Upstox** | Good | Free | Good |
| **Angel One (SmartAPI)** | Good | Free | Good |
| **5Paisa** | Moderate | Free | Moderate |

### Zerodha Kite Connect Integration

**Step 1: Register for API Access**

1. Visit https://kite.trade
2. Sign up and create app
3. Note API Key and API Secret
4. Complete KYC verification

**Step 2: Generate Access Token**

```typescript
// src/exchanges/zerodha/zerodha.service.ts
import { Injectable } from '@nestjs/common';
import axios from 'axios';
import * as crypto from 'crypto';

@Injectable()
export class ZerodhaService {
  private readonly apiKey: string;
  private readonly apiSecret: string;
  private readonly baseUrl = 'https://api.kite.trade';
  private accessToken: string;

  constructor() {
    this.apiKey = process.env.ZERODHA_API_KEY;
    this.apiSecret = process.env.ZERODHA_API_SECRET;
  }

  // Generate login URL
  getLoginUrl(): string {
    return `https://kite.zerodha.com/connect/login?api_key=${this.apiKey}&v=3`;
  }

  // Generate access token from request token
  async generateAccessToken(requestToken: string): Promise<string> {
    const checksum = crypto
      .createHash('sha256')
      .update(this.apiKey + requestToken + this.apiSecret)
      .digest('hex');

    const response = await axios.post(`${this.baseUrl}/session/token`, {
      api_key: this.apiKey,
      request_token: requestToken,
      checksum: checksum,
    });

    this.accessToken = response.data.data.access_token;
    return this.accessToken;
  }

  // Get user profile
  async getProfile() {
    const response = await axios.get(`${this.baseUrl}/user/profile`, {
      headers: {
        'X-Kite-Version': '3',
        'Authorization': `token ${this.apiKey}:${this.accessToken}`,
      },
    });
    return response.data.data;
  }

  // Place order
  async placeOrder(params: {
    exchange: string;
    tradingsymbol: string;
    transaction_type: 'BUY' | 'SELL';
    quantity: number;
    product: 'CNC' | 'MIS' | 'NRML';
    order_type: 'MARKET' | 'LIMIT' | 'SL' | 'SL-M';
    price?: number;
    trigger_price?: number;
    validity?: 'DAY' | 'IOC';
  }) {
    const response = await axios.post(
      `${this.baseUrl}/orders/regular`,
      params,
      {
        headers: {
          'X-Kite-Version': '3',
          'Authorization': `token ${this.apiKey}:${this.accessToken}`,
        },
      }
    );
    return response.data.data;
  }

  // Get orders
  async getOrders() {
    const response = await axios.get(`${this.baseUrl}/orders`, {
      headers: {
        'X-Kite-Version': '3',
        'Authorization': `token ${this.apiKey}:${this.accessToken}`,
      },
    });
    return response.data.data;
  }

  // Get positions
  async getPositions() {
    const response = await axios.get(`${this.baseUrl}/portfolio/positions`, {
      headers: {
        'X-Kite-Version': '3',
        'Authorization': `token ${this.apiKey}:${this.accessToken}`,
      },
    });
    return response.data.data;
  }

  // Get holdings
  async getHoldings() {
    const response = await axios.get(`${this.baseUrl}/portfolio/holdings`, {
      headers: {
        'X-Kite-Version': '3',
        'Authorization': `token ${this.apiKey}:${this.accessToken}`,
      },
    });
    return response.data.data;
  }

  // Get quote
  async getQuote(instruments: string[]) {
    const response = await axios.get(`${this.baseUrl}/quote`, {
      params: { i: instruments },
      headers: {
        'X-Kite-Version': '3',
        'Authorization': `token ${this.apiKey}:${this.accessToken}`,
      },
    });
    return response.data.data;
  }

  // Get historical data
  async getHistoricalData(params: {
    instrument_token: string;
    from: string;
    to: string;
    interval: 'minute' | '3minute' | '5minute' | '15minute' | '30minute' | 'hour' | 'day';
  }) {
    const response = await axios.get(
      `${this.baseUrl}/instruments/historical/${params.instrument_token}/${params.interval}`,
      {
        params: { from: params.from, to: params.to },
        headers: {
          'X-Kite-Version': '3',
          'Authorization': `token ${this.apiKey}:${this.accessToken}`,
        },
      }
    );
    return response.data.data.candles;
  }
}
```

**Step 3: WebSocket Integration**

```typescript
// src/exchanges/zerodha/zerodha-websocket.service.ts
import { Injectable } from '@nestjs/common';
import * as WebSocket from 'ws';

@Injectable()
export class ZerodhaWebSocketService {
  private ws: WebSocket;
  private readonly wsUrl = 'wss://ws.kite.trade';
  private accessToken: string;
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.ZERODHA_API_KEY;
  }

  connect(accessToken: string) {
    this.accessToken = accessToken;
    this.ws = new WebSocket(`${this.wsUrl}?api_key=${this.apiKey}&access_token=${this.accessToken}`);

    this.ws.on('open', () => {
      console.log('Zerodha WebSocket connected');
    });

    this.ws.on('message', (data) => {
      this.handleMessage(data);
    });

    this.ws.on('error', (error) => {
      console.error('Zerodha WebSocket error:', error);
    });

    this.ws.on('close', () => {
      console.log('Zerodha WebSocket closed');
      // Reconnect after 5 seconds
      setTimeout(() => this.connect(this.accessToken), 5000);
    });
  }

  subscribe(instruments: number[], mode: 'ltp' | 'quote' | 'full' = 'quote') {
    const modeMap = { ltp: 'ltp', quote: 'quote', full: 'full' };
    const message = {
      a: 'subscribe',
      v: instruments,
    };
    this.ws.send(JSON.stringify(message));

    const modeMessage = {
      a: 'mode',
      v: [modeMap[mode], instruments],
    };
    this.ws.send(JSON.stringify(modeMessage));
  }

  unsubscribe(instruments: number[]) {
    const message = {
      a: 'unsubscribe',
      v: instruments,
    };
    this.ws.send(JSON.stringify(message));
  }

  private handleMessage(data: any) {
    // Parse binary data
    // Zerodha uses binary protocol for efficiency
    // Implement binary parsing logic here
    console.log('Received market data:', data);
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
    }
  }
}
```

---

## BSE Integration

### Upstox Integration

**Step 1: Register for API Access**

1. Visit https://upstox.com/developer/
2. Create app and get API Key and Secret
3. Complete KYC verification

**Step 2: Implementation**

```typescript
// src/exchanges/upstox/upstox.service.ts
import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class UpstoxService {
  private readonly apiKey: string;
  private readonly apiSecret: string;
  private readonly baseUrl = 'https://api.upstox.com/v2';
  private accessToken: string;

  constructor() {
    this.apiKey = process.env.UPSTOX_API_KEY;
    this.apiSecret = process.env.UPSTOX_API_SECRET;
  }

  // Generate login URL
  getLoginUrl(redirectUri: string): string {
    return `https://api.upstox.com/v2/login/authorization/dialog?response_type=code&client_id=${this.apiKey}&redirect_uri=${redirectUri}`;
  }

  // Generate access token
  async generateAccessToken(code: string, redirectUri: string): Promise<string> {
    const response = await axios.post(`${this.baseUrl}/login/authorization/token`, {
      code,
      client_id: this.apiKey,
      client_secret: this.apiSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    });

    this.accessToken = response.data.access_token;
    return this.accessToken;
  }

  // Place order
  async placeOrder(params: {
    quantity: number;
    product: 'I' | 'D';
    validity: 'DAY' | 'IOC';
    price: number;
    tag: string;
    instrument_token: string;
    order_type: 'MARKET' | 'LIMIT' | 'SL' | 'SL-M';
    transaction_type: 'BUY' | 'SELL';
    disclosed_quantity: number;
    trigger_price: number;
    is_amo: boolean;
  }) {
    const response = await axios.post(`${this.baseUrl}/order/place`, params, {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Accept': 'application/json',
      },
    });
    return response.data.data;
  }

  // Get orders
  async getOrders() {
    const response = await axios.get(`${this.baseUrl}/order/retrieve-all`, {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Accept': 'application/json',
      },
    });
    return response.data.data;
  }

  // Get positions
  async getPositions() {
    const response = await axios.get(`${this.baseUrl}/portfolio/short-term-positions`, {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Accept': 'application/json',
      },
    });
    return response.data.data;
  }
}
```

---

## Binance Integration

### Step 1: Register for API Access

1. Visit https://www.binance.com
2. Create account and complete KYC
3. Enable API access in account settings
4. Generate API Key and Secret
5. Configure IP whitelist (recommended)
6. Enable trading permissions

### Step 2: Implementation with CCXT

```typescript
// src/exchanges/binance/binance.service.ts
import { Injectable } from '@nestjs/common';
import * as ccxt from 'ccxt';

@Injectable()
export class BinanceService {
  private exchange: ccxt.binance;

  constructor() {
    this.exchange = new ccxt.binance({
      apiKey: process.env.BINANCE_API_KEY,
      secret: process.env.BINANCE_API_SECRET,
      enableRateLimit: true,
      options: {
        defaultType: 'spot', // 'spot', 'future', 'margin'
      },
    });
  }

  // Get markets
  async getMarkets() {
    return await this.exchange.loadMarkets();
  }

  // Get ticker
  async getTicker(symbol: string) {
    return await this.exchange.fetchTicker(symbol);
  }

  // Get order book
  async getOrderBook(symbol: string, limit: number = 20) {
    return await this.exchange.fetchOrderBook(symbol, limit);
  }

  // Get trades
  async getTrades(symbol: string, limit: number = 100) {
    return await this.exchange.fetchTrades(symbol, undefined, limit);
  }

  // Get OHLCV data
  async getOHLCV(symbol: string, timeframe: string, since?: number, limit?: number) {
    return await this.exchange.fetchOHLCV(symbol, timeframe, since, limit);
  }

  // Get balance
  async getBalance() {
    return await this.exchange.fetchBalance();
  }

  // Place order
  async placeOrder(params: {
    symbol: string;
    type: 'market' | 'limit';
    side: 'buy' | 'sell';
    amount: number;
    price?: number;
    stopPrice?: number;
  }) {
    const { symbol, type, side, amount, price, stopPrice } = params;

    if (type === 'market') {
      return await this.exchange.createMarketOrder(symbol, side, amount);
    } else if (type === 'limit') {
      return await this.exchange.createLimitOrder(symbol, side, amount, price);
    }
  }

  // Place stop loss order
  async placeStopLossOrder(params: {
    symbol: string;
    side: 'buy' | 'sell';
    amount: number;
    stopPrice: number;
  }) {
    return await this.exchange.createOrder(
      params.symbol,
      'stop_loss_limit',
      params.side,
      params.amount,
      params.stopPrice,
      { stopPrice: params.stopPrice }
    );
  }

  // Cancel order
  async cancelOrder(orderId: string, symbol: string) {
    return await this.exchange.cancelOrder(orderId, symbol);
  }

  // Get order
  async getOrder(orderId: string, symbol: string) {
    return await this.exchange.fetchOrder(orderId, symbol);
  }

  // Get open orders
  async getOpenOrders(symbol?: string) {
    return await this.exchange.fetchOpenOrders(symbol);
  }

  // Get closed orders
  async getClosedOrders(symbol?: string, since?: number, limit?: number) {
    return await this.exchange.fetchClosedOrders(symbol, since, limit);
  }

  // Get my trades
  async getMyTrades(symbol?: string, since?: number, limit?: number) {
    return await this.exchange.fetchMyTrades(symbol, since, limit);
  }
}
```

**Step 3: WebSocket Integration**

```typescript
// src/exchanges/binance/binance-websocket.service.ts
import { Injectable } from '@nestjs/common';
import * as WebSocket from 'ws';

@Injectable()
export class BinanceWebSocketService {
  private ws: WebSocket;
  private readonly wsUrl = 'wss://stream.binance.com:9443/ws';
  private subscriptions: Map<string, any> = new Map();

  connect() {
    this.ws = new WebSocket(this.wsUrl);

    this.ws.on('open', () => {
      console.log('Binance WebSocket connected');
    });

    this.ws.on('message', (data) => {
      const message = JSON.parse(data.toString());
      this.handleMessage(message);
    });

    this.ws.on('error', (error) => {
      console.error('Binance WebSocket error:', error);
    });

    this.ws.on('close', () => {
      console.log('Binance WebSocket closed');
      setTimeout(() => this.connect(), 5000);
    });
  }

  // Subscribe to ticker
  subscribeTicker(symbol: string) {
    const stream = `${symbol.toLowerCase()}@ticker`;
    this.subscribe(stream);
  }

  // Subscribe to trades
  subscribeTrades(symbol: string) {
    const stream = `${symbol.toLowerCase()}@trade`;
    this.subscribe(stream);
  }

  // Subscribe to order book
  subscribeOrderBook(symbol: string, depth: number = 20) {
    const stream = `${symbol.toLowerCase()}@depth${depth}`;
    this.subscribe(stream);
  }

  // Subscribe to kline/candlestick
  subscribeKline(symbol: string, interval: string) {
    const stream = `${symbol.toLowerCase()}@kline_${interval}`;
    this.subscribe(stream);
  }

  private subscribe(stream: string) {
    const message = {
      method: 'SUBSCRIBE',
      params: [stream],
      id: Date.now(),
    };
    this.ws.send(JSON.stringify(message));
    this.subscriptions.set(stream, true);
  }

  private unsubscribe(stream: string) {
    const message = {
      method: 'UNSUBSCRIBE',
      params: [stream],
      id: Date.now(),
    };
    this.ws.send(JSON.stringify(message));
    this.subscriptions.delete(stream);
  }

  private handleMessage(message: any) {
    if (message.e === 'trade') {
      // Handle trade update
      console.log('Trade:', message);
    } else if (message.e === '24hrTicker') {
      // Handle ticker update
      console.log('Ticker:', message);
    } else if (message.e === 'depthUpdate') {
      // Handle order book update
      console.log('Order book:', message);
    } else if (message.e === 'kline') {
      // Handle kline update
      console.log('Kline:', message);
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
    }
  }
}
```

---

## Exchange Service Architecture

### Unified Exchange Interface

```typescript
// src/exchanges/exchange.interface.ts
export interface IExchange {
  // Authentication
  authenticate(credentials: any): Promise<void>;

  // Market Data
  getTicker(symbol: string): Promise<any>;
  getOrderBook(symbol: string): Promise<any>;
  getTrades(symbol: string): Promise<any>;
  getOHLCV(symbol: string, timeframe: string): Promise<any>;

  // Trading
  placeOrder(params: any): Promise<any>;
  cancelOrder(orderId: string, symbol: string): Promise<any>;
  getOrder(orderId: string, symbol: string): Promise<any>;
  getOpenOrders(symbol?: string): Promise<any>;

  // Account
  getBalance(): Promise<any>;
  getPositions(): Promise<any>;

  // WebSocket
  subscribeMarketData(symbol: string): void;
  unsubscribeMarketData(symbol: string): void;
}
```

### Exchange Factory

```typescript
// src/exchanges/exchange.factory.ts
import { Injectable } from '@nestjs/common';
import { ZerodhaService } from './zerodha/zerodha.service';
import { UpstoxService } from './upstox/upstox.service';
import { BinanceService } from './binance/binance.service';

@Injectable()
export class ExchangeFactory {
  constructor(
    private readonly zerodhaService: ZerodhaService,
    private readonly upstoxService: UpstoxService,
    private readonly binanceService: BinanceService,
  ) {}

  getExchange(exchangeName: string) {
    switch (exchangeName.toLowerCase()) {
      case 'zerodha':
      case 'nse':
        return this.zerodhaService;
      case 'upstox':
      case 'bse':
        return this.upstoxService;
      case 'binance':
        return this.binanceService;
      default:
        throw new Error(`Exchange ${exchangeName} not supported`);
    }
  }
}
```

---

## Testing

### Unit Tests

```typescript
// src/exchanges/binance/binance.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { BinanceService } from './binance.service';

describe('BinanceService', () => {
  let service: BinanceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BinanceService],
    }).compile();

    service = module.get<BinanceService>(BinanceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should fetch ticker', async () => {
    const ticker = await service.getTicker('BTC/USDT');
    expect(ticker).toHaveProperty('symbol');
    expect(ticker).toHaveProperty('last');
  });

  it('should place order', async () => {
    const order = await service.placeOrder({
      symbol: 'BTC/USDT',
      type: 'limit',
      side: 'buy',
      amount: 0.001,
      price: 40000,
    });
    expect(order).toHaveProperty('id');
    expect(order).toHaveProperty('status');
  });
});
```

---

## Environment Variables

```env
# NSE (Zerodha)
ZERODHA_API_KEY=your_api_key
ZERODHA_API_SECRET=your_api_secret

# BSE (Upstox)
UPSTOX_API_KEY=your_api_key
UPSTOX_API_SECRET=your_api_secret

# Binance
BINANCE_API_KEY=your_api_key
BINANCE_API_SECRET=your_api_secret
```

---

## Cost Summary

| Exchange | Setup Cost | Monthly Cost | Per Trade |
|----------|------------|--------------|-----------|
| Zerodha | ₹200 | ₹2,000 | ₹20 flat |
| Upstox | Free | Free | 0.05% |
| Binance | Free | Free | 0.1% |

---

## Next Steps

1. Register with exchanges and obtain API credentials
2. Implement exchange services
3. Test with sandbox/testnet environments
4. Deploy to production
5. Monitor API usage and rate limits

---

## Support

For issues or questions:
- GitHub: https://github.com/AMITTHAKKAR3/protrader5-v2
- Documentation: See individual service READMEs

## License

MIT License - See LICENSE file for details
