import './env.js';
import { createApp } from './app.js';
import prisma from './config/database.js';
import { logger } from './utils/logger.js';

const PORT = parseInt(process.env.PORT || '3010', 10);

async function start() {
  const app = createApp();

  try {
    await prisma.$connect();
    logger.info('Database connected');
  } catch {
    logger.warn('Database not connected. Run your Prisma migration or db push before using the API.');
  }

  const server = app.listen(PORT, () => {
    logger.info('Sawingir Hills HMS API Server');
    logger.info(`http://localhost:${PORT}`);
    logger.info(`Health: http://localhost:${PORT}/api/health`);
  });

  const shutdown = async () => {
    logger.info('Shutting down...');
    server.close();
    await prisma.$disconnect();
    process.exit(0);
  };

  process.on('SIGTERM', () => {
    void shutdown();
  });

  process.on('SIGINT', () => {
    void shutdown();
  });
}

void start();

