import './env.js';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { logger } from './utils/logger.js';
import { errorHandler } from './utils/errors.js';
import prisma from './config/database.js';
import authRoutes from './routes/auth.js';
import roomRoutes from './routes/rooms.js';
import bookingRoutes from './routes/bookings.js';
import restaurantRoutes from './routes/restaurant.js';
import eventRoutes from './routes/events.js';
import housekeepingRoutes from './routes/housekeeping.js';
import reportRoutes from './routes/reports.js';
import adminRoutes from './routes/admin.js';

export function createApp() {
  const app = express();
  const isProduction = process.env.NODE_ENV === 'production';

  app.use(helmet({ crossOriginResourcePolicy: false }));
  app.use(cors({
    origin: (origin, callback) => {
      if (!origin || !isProduction) return callback(null, true);
      const allowedOrigins = [process.env.CLIENT_URL || 'http://localhost:5173'];
      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  }));

  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: isProduction ? 200 : 5000,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later' },
  });

  const authLoginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: isProduction ? 20 : 250,
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true,
    message: { error: 'Too many login attempts, please try again later' },
  });

  const authSessionLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: isProduction ? 120 : 2000,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many session requests, please try again later' },
  });

  app.use(morgan('combined', {
    stream: { write: (message: string) => logger.info(message.trim()) },
  }));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  app.use('/api/auth/login', authLoginLimiter);
  app.use('/api/auth/refresh', authSessionLimiter);
  app.use('/api/auth', authRoutes);
  app.use('/api/rooms', apiLimiter, roomRoutes);
  app.use('/api/bookings', apiLimiter, bookingRoutes);
  app.use('/api/restaurant', apiLimiter, restaurantRoutes);
  app.use('/api/events', apiLimiter, eventRoutes);
  app.use('/api/housekeeping', apiLimiter, housekeepingRoutes);
  app.use('/api/reports', apiLimiter, reportRoutes);
  app.use('/api/admin', apiLimiter, adminRoutes);

  app.get('/api/health', async (_req, res) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        name: 'Sawingir Hills HMS API',
        database: 'connected',
      });
    } catch {
      res.status(503).json({
        status: 'degraded',
        timestamp: new Date().toISOString(),
        name: 'Sawingir Hills HMS API',
        database: 'disconnected',
      });
    }
  });

  app.use('/api/*', (_req, res) => {
    res.status(404).json({ status: 'error', message: 'Endpoint not found' });
  });

  app.use(errorHandler);

  return app;
}
