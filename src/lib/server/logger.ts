// src/lib/server/logger.ts
import pino from 'pino';
import { dev } from '$app/environment';

const logLevel = process.env.LOG_LEVEL || (dev ? 'info' : 'info');

// Basic pino logger configuration
const loggerConfig = {
  level: logLevel,
  // Use pino-pretty for human-readable logs in development
  ...(dev && {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
      },
    },
  }),
};

// Create the logger instance
export const logger = pino(loggerConfig);
