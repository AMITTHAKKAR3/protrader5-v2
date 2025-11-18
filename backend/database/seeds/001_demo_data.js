/**
 * Seed: Demo Data
 * Creates demo users, sample strategies, and test data
 * Date: 2025-11-18
 */

const { MongoClient, ObjectId } = require('mongodb');
const bcrypt = require('bcrypt');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';

async function seed() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db('protrader5');

    // Create demo users
    console.log('Creating demo users...');
    
    const hashedPassword = await bcrypt.hash('Demo@123', 12);
    
    const demoUsers = [
      {
        _id: new ObjectId(),
        email: 'admin@protrader5.com',
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'User',
        role: 'ADMIN',
        status: 'ACTIVE',
        emailVerified: true,
        twoFactorEnabled: false,
        kycStatus: 'APPROVED',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        _id: new ObjectId(),
        email: 'trader@protrader5.com',
        password: hashedPassword,
        firstName: 'Demo',
        lastName: 'Trader',
        role: 'USER',
        status: 'ACTIVE',
        emailVerified: true,
        twoFactorEnabled: false,
        kycStatus: 'APPROVED',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        _id: new ObjectId(),
        email: 'provider@protrader5.com',
        password: hashedPassword,
        firstName: 'Strategy',
        lastName: 'Provider',
        role: 'USER',
        status: 'ACTIVE',
        emailVerified: true,
        twoFactorEnabled: false,
        kycStatus: 'APPROVED',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    await db.collection('users').insertMany(demoUsers);
    console.log(`✅ Created ${demoUsers.length} demo users`);

    // Create demo strategies
    console.log('Creating demo strategies...');
    
    const providerId = demoUsers[2]._id;
    
    const demoStrategies = [
      {
        _id: new ObjectId(),
        name: 'Momentum Trading Strategy',
        description: 'High-frequency momentum-based trading strategy with strict risk management',
        providerId,
        providerName: 'Strategy Provider',
        status: 'ACTIVE',
        visibility: 'PUBLIC',
        featured: true,
        subscriptionFee: 99,
        profitShare: 20,
        minInvestment: 1000,
        maxInvestment: 100000,
        riskLevel: 'MEDIUM',
        performance: {
          totalReturn: 45.5,
          monthlyReturn: 3.8,
          winRate: 68.5,
          sharpeRatio: 1.85,
          maxDrawdown: 12.3,
          totalTrades: 245,
          profitableTrades: 168,
        },
        statistics: {
          totalSubscribers: 156,
          activeSubscribers: 142,
          totalVolume: 5420000,
          averageHoldTime: 3.5,
        },
        rating: 4.7,
        reviews: 89,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        _id: new ObjectId(),
        name: 'Swing Trading Pro',
        description: 'Medium-term swing trading strategy focusing on trend reversals',
        providerId,
        providerName: 'Strategy Provider',
        status: 'ACTIVE',
        visibility: 'PUBLIC',
        featured: true,
        subscriptionFee: 149,
        profitShare: 25,
        minInvestment: 2000,
        maxInvestment: 200000,
        riskLevel: 'LOW',
        performance: {
          totalReturn: 32.8,
          monthlyReturn: 2.7,
          winRate: 72.3,
          sharpeRatio: 2.15,
          maxDrawdown: 8.5,
          totalTrades: 128,
          profitableTrades: 93,
        },
        statistics: {
          totalSubscribers: 203,
          activeSubscribers: 189,
          totalVolume: 8950000,
          averageHoldTime: 7.2,
        },
        rating: 4.9,
        reviews: 142,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        _id: new ObjectId(),
        name: 'Scalping Master',
        description: 'Ultra-short-term scalping strategy for experienced traders',
        providerId,
        providerName: 'Strategy Provider',
        status: 'ACTIVE',
        visibility: 'PUBLIC',
        featured: false,
        subscriptionFee: 199,
        profitShare: 30,
        minInvestment: 5000,
        maxInvestment: 500000,
        riskLevel: 'HIGH',
        performance: {
          totalReturn: 58.2,
          monthlyReturn: 4.9,
          winRate: 64.8,
          sharpeRatio: 1.62,
          maxDrawdown: 18.7,
          totalTrades: 892,
          profitableTrades: 578,
        },
        statistics: {
          totalSubscribers: 87,
          activeSubscribers: 79,
          totalVolume: 12340000,
          averageHoldTime: 0.5,
        },
        rating: 4.5,
        reviews: 56,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    await db.collection('strategies').insertMany(demoStrategies);
    console.log(`✅ Created ${demoStrategies.length} demo strategies`);

    // Create sample risk profiles
    console.log('Creating sample risk profiles...');
    
    const riskProfiles = demoUsers.map(user => ({
      userId: user._id,
      maxPositionSize: 10000,
      maxDailyLoss: 500,
      maxDrawdown: 15,
      maxLeverage: 5,
      allowedSymbols: ['BTCUSD', 'ETHUSD', 'BNBUSD', 'SOLUSD'],
      allowedExchanges: ['NSE', 'BSE', 'MCX'],
      tradingHours: {
        start: '09:15',
        end: '15:30',
      },
      currentExposure: 0,
      dailyLoss: 0,
      currentDrawdown: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    await db.collection('riskprofiles').insertMany(riskProfiles);
    console.log(`✅ Created ${riskProfiles.length} risk profiles`);

    // Create sample notification preferences
    console.log('Creating notification preferences...');
    
    const notificationPreferences = demoUsers.map(user => ({
      userId: user._id,
      email: {
        orderFilled: true,
        positionClosed: true,
        riskAlert: true,
        strategyUpdate: true,
        systemNotification: true,
      },
      sms: {
        orderFilled: false,
        positionClosed: false,
        riskAlert: true,
        strategyUpdate: false,
        systemNotification: false,
      },
      push: {
        orderFilled: true,
        positionClosed: true,
        riskAlert: true,
        strategyUpdate: true,
        systemNotification: true,
      },
      inApp: {
        orderFilled: true,
        positionClosed: true,
        riskAlert: true,
        strategyUpdate: true,
        systemNotification: true,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    await db.collection('notificationpreferences').insertMany(notificationPreferences);
    console.log(`✅ Created ${notificationPreferences.length} notification preferences`);

    // Create sample chart templates
    console.log('Creating sample chart templates...');
    
    const chartTemplates = [
      {
        userId: demoUsers[1]._id,
        name: 'Day Trading Setup',
        description: 'My preferred day trading chart setup',
        isPublic: true,
        indicators: [
          { type: 'SMA', period: 20, color: '#FF6B6B' },
          { type: 'EMA', period: 50, color: '#4ECDC4' },
          { type: 'RSI', period: 14, overbought: 70, oversold: 30 },
        ],
        timeframe: '5m',
        chartType: 'CANDLESTICK',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        userId: demoUsers[1]._id,
        name: 'Swing Trading Analysis',
        description: 'Chart template for swing trading',
        isPublic: false,
        indicators: [
          { type: 'SMA', period: 50, color: '#FF6B6B' },
          { type: 'SMA', period: 200, color: '#4ECDC4' },
          { type: 'MACD', fast: 12, slow: 26, signal: 9 },
          { type: 'BOLLINGER_BANDS', period: 20, stdDev: 2 },
        ],
        timeframe: '1d',
        chartType: 'CANDLESTICK',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    await db.collection('charttemplates').insertMany(chartTemplates);
    console.log(`✅ Created ${chartTemplates.length} chart templates`);

    console.log('\n🎉 All demo data seeded successfully!');
    console.log('\nDemo Accounts:');
    console.log('━'.repeat(50));
    console.log('Admin:    admin@protrader5.com    / Demo@123');
    console.log('Trader:   trader@protrader5.com   / Demo@123');
    console.log('Provider: provider@protrader5.com / Demo@123');
    console.log('━'.repeat(50));

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  } finally {
    await client.close();
  }
}

// Run seed
if (require.main === module) {
  seed().then(() => process.exit(0)).catch(() => process.exit(1));
}

module.exports = { seed };
