# ProTrader5 v2.0 - Database Setup

## Overview

This directory contains database migrations, seed data, and utility scripts for setting up the ProTrader5 MongoDB database.

---

## Prerequisites

- MongoDB 6.0 or higher
- Node.js 18 or higher

---

## Installation

```bash
cd backend/database
npm install
```

---

## Configuration

Set the MongoDB connection string:

```bash
export MONGODB_URI="mongodb://localhost:27017"
```

Or create a `.env` file:

```env
MONGODB_URI=mongodb://localhost:27017
```

---

## Usage

### Run All Migrations

```bash
npm run migrate:up
```

### Rollback Migrations

```bash
npm run migrate:down
```

### Seed Demo Data

```bash
npm run seed
```

### Complete Setup (Migrate + Seed)

```bash
npm run setup
```

### Reset Database (Drop + Migrate + Seed)

```bash
npm run reset
```

---

## Migrations

### 001_initial_schema.js

Creates all collections and indexes for:

**User Service:**
- `users` - User accounts
- `apikeys` - API keys for programmatic access
- `loggedindevices` - Device tracking

**Trading Service:**
- `trades` - Order history
- `positions` - Open positions

**Copy Trading Service:**
- `strategies` - Trading strategies
- `subscriptions` - Strategy subscriptions

**Algo Trading Service:**
- `algorithms` - Trading algorithms
- `backtests` - Backtest results

**Charting Service:**
- `chartdata` - OHLCV data
- `charttemplates` - Chart templates

**Risk Management Service:**
- `riskprofiles` - User risk settings
- `riskalerts` - Risk alerts

**Notification Service:**
- `notifications` - User notifications
- `notificationpreferences` - Notification settings

**Payment Service:**
- `transactions` - Payment transactions

---

## Seed Data

### 001_demo_data.js

Creates demo data including:

**Demo Users:**
- `admin@protrader5.com` / `Demo@123` (Admin)
- `trader@protrader5.com` / `Demo@123` (Trader)
- `provider@protrader5.com` / `Demo@123` (Strategy Provider)

**Demo Strategies:**
- Momentum Trading Strategy
- Swing Trading Pro
- Scalping Master

**Sample Data:**
- Risk profiles for all users
- Notification preferences
- Chart templates

---

## Database Schema

### Users Collection

```javascript
{
  _id: ObjectId,
  email: String (unique),
  password: String (hashed),
  firstName: String,
  lastName: String,
  role: String (USER|ADMIN),
  status: String (ACTIVE|SUSPENDED|DELETED),
  emailVerified: Boolean,
  twoFactorEnabled: Boolean,
  twoFactorSecret: String,
  kycStatus: String (PENDING|APPROVED|REJECTED),
  createdAt: Date,
  updatedAt: Date
}
```

### Trades Collection

```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  symbol: String,
  type: String,
  side: String (BUY|SELL),
  quantity: Number,
  price: Number,
  status: String,
  exchange: String,
  createdAt: Date,
  updatedAt: Date
}
```

### Strategies Collection

```javascript
{
  _id: ObjectId,
  name: String,
  description: String,
  providerId: ObjectId,
  providerName: String,
  status: String,
  visibility: String (PUBLIC|PRIVATE),
  featured: Boolean,
  subscriptionFee: Number,
  profitShare: Number,
  minInvestment: Number,
  maxInvestment: Number,
  riskLevel: String,
  performance: Object,
  statistics: Object,
  rating: Number,
  reviews: Number,
  createdAt: Date,
  updatedAt: Date
}
```

---

## Indexes

All collections have appropriate indexes for:
- Query performance
- Uniqueness constraints
- Sorting and filtering

**Example indexes:**
- `users.email` (unique)
- `trades.userId + createdAt` (compound)
- `strategies.performance.totalReturn` (descending)

---

## Backup and Restore

### Backup Database

```bash
mongodump --uri="mongodb://localhost:27017" --db=protrader5 --out=./backup
```

### Restore Database

```bash
mongorestore --uri="mongodb://localhost:27017" --db=protrader5 ./backup/protrader5
```

---

## Production Considerations

### 1. Connection Pooling

```javascript
const client = new MongoClient(uri, {
  maxPoolSize: 50,
  minPoolSize: 10,
  maxIdleTimeMS: 30000,
});
```

### 2. Write Concern

```javascript
await collection.insertOne(doc, { writeConcern: { w: 'majority' } });
```

### 3. Read Preference

```javascript
const collection = db.collection('users', { readPreference: 'secondaryPreferred' });
```

### 4. Transactions

```javascript
const session = client.startSession();
try {
  await session.withTransaction(async () => {
    // Transactional operations
  });
} finally {
  await session.endSession();
}
```

### 5. Monitoring

Enable MongoDB monitoring:

```javascript
client.on('serverHeartbeatSucceeded', (event) => {
  console.log('Server heartbeat succeeded:', event);
});

client.on('commandFailed', (event) => {
  console.error('Command failed:', event);
});
```

---

## Security Best Practices

1. **Use strong passwords** for database users
2. **Enable authentication** in production
3. **Use SSL/TLS** for connections
4. **Restrict network access** with firewall rules
5. **Regular backups** with point-in-time recovery
6. **Monitor database** for suspicious activity
7. **Keep MongoDB updated** with security patches

---

## Troubleshooting

### Connection Failed

Check if MongoDB is running:
```bash
mongosh --eval "db.adminCommand('ping')"
```

### Migration Failed

Check logs and verify MongoDB version:
```bash
mongosh --eval "db.version()"
```

### Seed Data Already Exists

Reset the database:
```bash
npm run reset
```

---

## References

- [MongoDB Documentation](https://docs.mongodb.com/)
- [MongoDB Indexes](https://docs.mongodb.com/manual/indexes/)
- [MongoDB Transactions](https://docs.mongodb.com/manual/core/transactions/)
- [MongoDB Security](https://docs.mongodb.com/manual/security/)

---

**Version:** 1.0  
**Last Updated:** November 18, 2025  
**Maintained by:** ProTrader5 DevOps Team
