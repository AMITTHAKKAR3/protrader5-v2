export default () => ({
  port: parseInt(process.env.PORT, 10) || 3007,
  nodeEnv: process.env.NODE_ENV || 'development',
  database: {
    uri: process.env.MONGODB_URI || 'mongodb://admin:protrader5_admin_pass@localhost:27017/protrader5?authSource=admin',
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://:protrader5_redis_pass@localhost:6379',
  },
});
