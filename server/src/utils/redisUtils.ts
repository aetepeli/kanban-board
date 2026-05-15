import Redis from 'ioredis/built';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

const redisClient = new Redis(redisUrl, {
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
});

redisClient.on('connect', () => {
  console.log('Redis In-Memory Database active');
});

redisClient.on('error', (error) => {
  console.error('Redis error', error);
});

export default redisClient;
