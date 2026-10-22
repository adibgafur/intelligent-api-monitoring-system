import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from './config/env.js';
import { requestLogger } from './middleware/requestLogger.js';
import { notFound } from './middleware/notFound.js';
import { errorHandler } from './middleware/errorHandler.js';
import routes from './routes/index.js';

export const app = express();

// Security headers
app.use(helmet());

// Cross-Origin Resource Sharing
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. curl, postman, mobile apps)
      if (!origin) return callback(null, true);
      // Allow configured client origin and localhost variants
      if (
        origin === config.clientOrigin ||
        origin.startsWith('http://localhost:') ||
        origin.startsWith('http://127.0.0.1:')
      ) {
        return callback(null, true);
      }
      return callback(null, true); // Permissive in dev to avoid blocking interviewer demos
    },
    credentials: true,
  })
);

// Body parsing with 1MB limit
app.use(express.json({ limit: '1mb' }));

// Rate limiting to prevent abuse
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // Limit each IP to 300 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes',
  },
});
app.use(limiter);

// Request duration logging
app.use(requestLogger);

// Mount main API routes
app.use('/', routes);
app.use('/api', routes); // Alias for convenience

// 404 Route Not Found
app.use(notFound);

// Centralized Error Handler
app.use(errorHandler);
