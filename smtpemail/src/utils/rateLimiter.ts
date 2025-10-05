import { RateLimiterMemory } from 'rate-limiter-flexible';

const rateLimiter = new RateLimiterMemory({
  points: 5, // Number of points
  duration: 60, // Per 60 seconds
});

export const rateLimit = async (key: string) => {
  try {
    await rateLimiter.consume(key);
    return true;
  } catch (rejRes) {
    return false; // Rate limit exceeded
  }
};