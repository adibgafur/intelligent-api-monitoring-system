import winston from 'winston';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const logDir = path.join(__dirname, '../../logs');

if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const { combine, timestamp, printf, colorize, errors, json } = winston.format;

// Format for console (human-readable with colors)
const consoleFormat = printf(({ level, message, timestamp: time, stack }) => {
  return `[${time}] ${level}: ${stack || message}`;
});

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true })
  ),
  transports: [
    // Console output
    new winston.transports.Console({
      format: combine(colorize(), consoleFormat),
    }),
    // Combined application log
    new winston.transports.File({
      filename: path.join(logDir, 'app.log'),
      format: combine(timestamp(), json()),
      maxsize: 5 * 1024 * 1024, // 5MB
      maxFiles: 3,
    }),
    // Error-only log
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      format: combine(timestamp(), json()),
      maxsize: 5 * 1024 * 1024,
      maxFiles: 3,
    }),
  ],
});
