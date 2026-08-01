import winston from 'winston';

const { combine, timestamp, printf, colorize, errors } = winston.format;

const logFormat = printf(({ level, message, timestamp, stack, ...meta }) => {
  const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
  return `${timestamp} [${level}]: ${stack || message}${metaStr}`;
});

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    errors({ stack: true }),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  ),
  transports: [
    // Console output with colors in dev
    new winston.transports.Console({
      format: combine(colorize(), logFormat),
    }),
    // File output for errors
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: combine(logFormat),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // File output for all logs
    new winston.transports.File({
      filename: 'logs/combined.log',
      format: combine(logFormat),
      maxsize: 5242880,
      maxFiles: 5,
    }),
  ],
});
