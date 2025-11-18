export default () => ({
  port: parseInt(process.env.PORT, 10) || 3002,
  nodeEnv: process.env.NODE_ENV || 'development',
  database: {
    uri: process.env.MONGODB_URI || 'mongodb://admin:protrader5_admin_pass@localhost:27017/protrader5?authSource=admin',
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://:protrader5_redis_pass@localhost:6379',
  },
  rabbitmq: {
    url: process.env.RABBITMQ_URL || 'amqp://protrader5:protrader5_rabbitmq_pass@localhost:5672',
  },
  kafka: {
    brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
  },
});
