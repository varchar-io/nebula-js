/*
 * Copyright 2020-present columns.ai
 *
 * The code belongs to https://columns.ai
 * Terms & conditions to be found at `LICENSE.txt`.
 */

import winston, { format } from 'winston';

const LogFormat = format.combine(
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  format.printf(({ message, timestamp }) => `[${timestamp}]: ${message}`),
);

class Log {
  logger: winston.Logger;

  constructor() {
    this.logger = winston.createLogger({
      // info, warn, error will pass through
      level: 'info',
      levels: { error: 0, warn: 1, info: 2 },
      format: LogFormat,
      transports: [
        new winston.transports.Console({
          format: format.combine(LogFormat, format.colorize({ all: true })),
          stderrLevels: ['error'],
        }),
      ],
    });
  }

  info(message: string) {
    this.logger.info(message);
  }

  warn(message: string) {
    this.logger.warn(message);
  }

  error(message: string) {
    this.logger.error(message);
  }
}

// the singleton instance for logging
export const LOG = new Log();
