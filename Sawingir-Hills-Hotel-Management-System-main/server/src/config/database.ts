import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger.js';

const prisma = new PrismaClient({
  log: [
    { level: 'query', emit: 'event' },
    { level: 'error', emit: 'event' },
    { level: 'warn', emit: 'event' },
  ],
});

// Log slow queries in development
prisma.$on('query', (e: any) => {
  if (e.duration > 500) {
    logger.warn(`Slow query (${e.duration}ms): ${e.query}`);
  }
});

prisma.$on('error', (e: any) => {
  logger.error(`Prisma error: ${e.message}`);
});

export default prisma;
