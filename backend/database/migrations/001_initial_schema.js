/**
 * Migration: Initial Schema Setup
 * Creates all database collections with indexes
 * Date: 2025-11-18
 */

const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';

async function up() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db('protrader5');

    // User Service Collections
    console.log('Creating User Service collections...');
    
    // Users collection
    await db.createCollection('users');
    await db.collection('users').createIndexes([
      { key: { email: 1 }, unique: true },
      { key: { role: 1 } },
      { key: { status: 1 } },
      { key: { createdAt: -1 } },
    ]);

    // API Keys collection
    await db.createCollection('apikeys');
    await db.collection('apikeys').createIndexes([
      { key: { userId: 1 } },
      { key: { hashedKey: 1 }, unique: true },
      { key: { status: 1 } },
    ]);

    // Logged In Devices collection
    await db.createCollection('loggedindevices');
    await db.collection('loggedindevices').createIndexes([
      { key: { userId: 1 } },
      { key: { lastActive: -1 } },
    ]);

    // Trading Service Collections
    console.log('Creating Trading Service collections...');
    
    // Trades collection
    await db.createCollection('trades');
    await db.collection('trades').createIndexes([
      { key: { userId: 1, createdAt: -1 } },
      { key: { symbol: 1, createdAt: -1 } },
      { key: { status: 1 } },
      { key: { type: 1 } },
      { key: { exchange: 1 } },
    ]);

    // Positions collection
    await db.createCollection('positions');
    await db.collection('positions').createIndexes([
      { key: { userId: 1, status: 1 } },
      { key: { symbol: 1 } },
      { key: { createdAt: -1 } },
    ]);

    // Copy Trading Service Collections
    console.log('Creating Copy Trading Service collections...');
    
    // Strategies collection
    await db.createCollection('strategies');
    await db.collection('strategies').createIndexes([
      { key: { providerId: 1 } },
      { key: { status: 1 } },
      { key: { visibility: 1 } },
      { key: { featured: 1 } },
      { key: { 'performance.totalReturn': -1 } },
      { key: { rating: -1 } },
    ]);

    // Subscriptions collection
    await db.createCollection('subscriptions');
    await db.collection('subscriptions').createIndexes([
      { key: { followerId: 1, status: 1 } },
      { key: { strategyId: 1, status: 1 } },
      { key: { createdAt: -1 } },
    ]);

    // Algo Trading Service Collections
    console.log('Creating Algo Trading Service collections...');
    
    // Algorithms collection
    await db.createCollection('algorithms');
    await db.collection('algorithms').createIndexes([
      { key: { userId: 1 } },
      { key: { status: 1 } },
      { key: { type: 1 } },
      { key: { createdAt: -1 } },
    ]);

    // Backtests collection
    await db.createCollection('backtests');
    await db.collection('backtests').createIndexes([
      { key: { algorithmId: 1, createdAt: -1 } },
      { key: { userId: 1 } },
      { key: { status: 1 } },
    ]);

    // Charting Service Collections
    console.log('Creating Charting Service collections...');
    
    // Chart Data collection
    await db.createCollection('chartdata');
    await db.collection('chartdata').createIndexes([
      { key: { symbol: 1, timeframe: 1, timestamp: -1 } },
      { key: { timestamp: -1 } },
    ]);

    // Chart Templates collection
    await db.createCollection('charttemplates');
    await db.collection('charttemplates').createIndexes([
      { key: { userId: 1 } },
      { key: { isPublic: 1 } },
    ]);

    // Risk Management Service Collections
    console.log('Creating Risk Management Service collections...');
    
    // Risk Profiles collection
    await db.createCollection('riskprofiles');
    await db.collection('riskprofiles').createIndexes([
      { key: { userId: 1 }, unique: true },
    ]);

    // Risk Alerts collection
    await db.createCollection('riskalerts');
    await db.collection('riskalerts').createIndexes([
      { key: { userId: 1, createdAt: -1 } },
      { key: { type: 1 } },
      { key: { severity: 1 } },
      { key: { acknowledged: 1 } },
    ]);

    // Notification Service Collections
    console.log('Creating Notification Service collections...');
    
    // Notifications collection
    await db.createCollection('notifications');
    await db.collection('notifications').createIndexes([
      { key: { userId: 1, createdAt: -1 } },
      { key: { type: 1 } },
      { key: { read: 1 } },
      { key: { priority: 1 } },
    ]);

    // Notification Preferences collection
    await db.createCollection('notificationpreferences');
    await db.collection('notificationpreferences').createIndexes([
      { key: { userId: 1 }, unique: true },
    ]);

    // Payment Service Collections
    console.log('Creating Payment Service collections...');
    
    // Transactions collection
    await db.createCollection('transactions');
    await db.collection('transactions').createIndexes([
      { key: { userId: 1, createdAt: -1 } },
      { key: { type: 1 } },
      { key: { status: 1 } },
      { key: { gateway: 1 } },
      { key: { gatewayTransactionId: 1 } },
    ]);

    console.log('✅ All collections and indexes created successfully');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await client.close();
  }
}

async function down() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db('protrader5');

    // Drop all collections
    const collections = [
      'users', 'apikeys', 'loggedindevices',
      'trades', 'positions',
      'strategies', 'subscriptions',
      'algorithms', 'backtests',
      'chartdata', 'charttemplates',
      'riskprofiles', 'riskalerts',
      'notifications', 'notificationpreferences',
      'transactions',
    ];

    for (const collection of collections) {
      try {
        await db.collection(collection).drop();
        console.log(`Dropped collection: ${collection}`);
      } catch (error) {
        // Collection might not exist
      }
    }

    console.log('✅ All collections dropped successfully');

  } catch (error) {
    console.error('❌ Rollback failed:', error);
    throw error;
  } finally {
    await client.close();
  }
}

// Run migration
if (require.main === module) {
  const command = process.argv[2];
  
  if (command === 'up') {
    up().then(() => process.exit(0)).catch(() => process.exit(1));
  } else if (command === 'down') {
    down().then(() => process.exit(0)).catch(() => process.exit(1));
  } else {
    console.log('Usage: node 001_initial_schema.js [up|down]');
    process.exit(1);
  }
}

module.exports = { up, down };
