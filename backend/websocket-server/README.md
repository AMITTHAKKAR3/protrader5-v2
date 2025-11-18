# ProTrader5 v2.0 - WebSocket Server

## Overview

The WebSocket server provides real-time data streaming for the ProTrader5 platform using Socket.IO. It handles market data, order updates, position updates, and notifications with JWT authentication and Redis pub/sub for horizontal scaling.

---

## Features

- **Real-time Market Data:** Live price updates for subscribed symbols
- **Order Updates:** Real-time order status changes
- **Position Updates:** Live P&L calculations
- **Notifications:** Instant push notifications
- **JWT Authentication:** Secure WebSocket connections
- **Redis Pub/Sub:** Horizontal scaling support
- **Room-based Broadcasting:** Efficient targeted updates
- **Automatic Reconnection:** Client-side reconnection handling

---

## Architecture

```
Client → WebSocket Server (Port 4000) → Redis Pub/Sub
         ↓
         Services (Market, Order, Position, Notification)
         ↓
         Backend Microservices
```

---

## Installation

```bash
cd backend/websocket-server
npm install
```

---

## Configuration

Create `.env` file:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
PORT=4000
NODE_ENV=development
CORS_ORIGIN=*
JWT_SECRET=your-secret-key
REDIS_URL=redis://localhost:6379
LOG_LEVEL=info
```

---

## Development

```bash
npm run dev
```

---

## Production

```bash
npm run build
npm start
```

---

## WebSocket Events

### Client → Server

**Subscribe to Market Data:**
```javascript
socket.emit('subscribe:market', { symbols: ['BTCUSD', 'ETHUSD'] });
```

**Unsubscribe from Market Data:**
```javascript
socket.emit('unsubscribe:market', { symbols: ['BTCUSD'] });
```

**Subscribe to Orders:**
```javascript
socket.emit('subscribe:orders');
```

**Subscribe to Positions:**
```javascript
socket.emit('subscribe:positions');
```

**Subscribe to Notifications:**
```javascript
socket.emit('subscribe:notifications');
```

### Server → Client

**Market Data Update:**
```javascript
socket.on('market:data', (data) => {
  // {
  //   symbol: 'BTCUSD',
  //   price: 50000,
  //   volume: 1000000,
  //   high24h: 51000,
  //   low24h: 49000,
  //   change24h: 500,
  //   changePercent24h: 1.0,
  //   timestamp: 1700000000000
  // }
});
```

**Order Update:**
```javascript
socket.on('order:update', (order) => {
  // {
  //   orderId: '...',
  //   userId: '...',
  //   symbol: 'BTCUSD',
  //   type: 'LIMIT',
  //   side: 'BUY',
  //   quantity: 0.1,
  //   price: 50000,
  //   status: 'FILLED',
  //   filledQuantity: 0.1,
  //   remainingQuantity: 0,
  //   averagePrice: 50000,
  //   timestamp: 1700000000000
  // }
});
```

**Position Update:**
```javascript
socket.on('position:update', (position) => {
  // {
  //   positionId: '...',
  //   userId: '...',
  //   symbol: 'BTCUSD',
  //   side: 'LONG',
  //   quantity: 0.1,
  //   entryPrice: 50000,
  //   currentPrice: 51000,
  //   unrealizedPnL: 100,
  //   unrealizedPnLPercent: 2.0,
  //   realizedPnL: 0,
  //   timestamp: 1700000000000
  // }
});
```

**Notification:**
```javascript
socket.on('notification', (notification) => {
  // {
  //   id: '...',
  //   userId: '...',
  //   type: 'ORDER_FILLED',
  //   title: 'Order Filled',
  //   message: 'Your order has been filled',
  //   priority: 'HIGH',
  //   read: false,
  //   timestamp: 1700000000000,
  //   metadata: { orderId: '...' }
  // }
});
```

---

## Authentication

WebSocket connections require JWT authentication:

```javascript
const socket = io('http://localhost:4000', {
  auth: {
    token: 'YOUR_JWT_TOKEN'
  }
});
```

Or via Authorization header:

```javascript
const socket = io('http://localhost:4000', {
  extraHeaders: {
    Authorization: 'Bearer YOUR_JWT_TOKEN'
  }
});
```

---

## Redis Integration

The WebSocket server uses Redis for:

1. **Pub/Sub:** Broadcasting updates from backend services
2. **Socket.IO Adapter:** Enabling horizontal scaling across multiple server instances

**Redis Channels:**
- `order:updates` - Order status changes
- `position:updates` - Position P&L updates
- `notifications` - User notifications

---

## Horizontal Scaling

Deploy multiple WebSocket server instances behind a load balancer:

```
Load Balancer → WS Server 1 → Redis
             → WS Server 2 → Redis
             → WS Server 3 → Redis
```

Socket.IO Redis adapter ensures messages reach all connected clients regardless of which server instance they're connected to.

---

## Monitoring

### Health Check

```bash
curl http://localhost:4000/health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2025-11-18T08:00:00.000Z"
}
```

### Logs

Logs are written to:
- `logs/combined.log` - All logs
- `logs/error.log` - Error logs only
- Console - Development mode

---

## Docker Deployment

**Dockerfile:**

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
RUN npm run build
EXPOSE 4000
CMD ["npm", "start"]
```

**Build and run:**

```bash
docker build -t protrader5-websocket .
docker run -p 4000:4000 --env-file .env protrader5-websocket
```

---

## Kubernetes Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: websocket-server
spec:
  replicas: 3
  selector:
    matchLabels:
      app: websocket-server
  template:
    metadata:
      labels:
        app: websocket-server
    spec:
      containers:
      - name: websocket-server
        image: protrader5-websocket:latest
        ports:
        - containerPort: 4000
        env:
        - name: PORT
          value: "4000"
        - name: REDIS_URL
          value: "redis://redis-service:6379"
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: jwt-secret
              key: secret
---
apiVersion: v1
kind: Service
metadata:
  name: websocket-service
spec:
  type: LoadBalancer
  ports:
  - port: 4000
    targetPort: 4000
  selector:
    app: websocket-server
```

---

## Performance Tuning

### Connection Limits

```javascript
const io = new Server(httpServer, {
  maxHttpBufferSize: 1e6, // 1MB
  pingTimeout: 60000,
  pingInterval: 25000,
});
```

### Redis Connection Pool

```javascript
const redisClient = createClient({
  url: process.env.REDIS_URL,
  socket: {
    reconnectStrategy: (retries) => Math.min(retries * 50, 500),
  },
});
```

---

## Security Best Practices

1. **Use HTTPS/WSS** in production
2. **Validate JWT tokens** on every connection
3. **Rate limit** connections per IP
4. **Sanitize** all incoming data
5. **Use secure** Redis connections (TLS)
6. **Monitor** for suspicious activity
7. **Keep dependencies** updated

---

## Troubleshooting

### Connection refused

Check if server is running:
```bash
curl http://localhost:4000/health
```

### Authentication failed

Verify JWT token is valid and not expired.

### No data received

Check if subscribed to correct channels and Redis is running.

### High latency

Monitor Redis performance and consider adding more server instances.

---

## References

- [Socket.IO Documentation](https://socket.io/docs/v4/)
- [Socket.IO Redis Adapter](https://socket.io/docs/v4/redis-adapter/)
- [Redis Pub/Sub](https://redis.io/docs/manual/pubsub/)

---

**Version:** 1.0  
**Last Updated:** November 18, 2025  
**Maintained by:** ProTrader5 DevOps Team
