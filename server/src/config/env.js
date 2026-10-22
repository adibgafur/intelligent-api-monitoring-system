import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from server directory
dotenv.config({ path: path.join(__dirname, '../../.env') });

const getEnvNumber = (key, defaultValue) => {
  const val = process.env[key];
  if (val === undefined || val === '') return defaultValue;
  const parsed = Number(val);
  return Number.isNaN(parsed) ? defaultValue : parsed;
};

export const config = {
  port: getEnvNumber('PORT', 5000),
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Database
  mongoUri: process.env.MONGO_URI || '',
  
  // Groq LLM
  groqApiKey: process.env.GROQ_API_KEY || '',
  groqModel: process.env.GROQ_MODEL || 'openai/gpt-oss-20b',
  aiTimeoutMs: getEnvNumber('AI_TIMEOUT_MS', 8000),
  aiConcurrency: getEnvNumber('AI_CONCURRENCY', 3),
  
  // Anomaly rules
  responseTimeThresholdMs: getEnvNumber('RESPONSE_TIME_THRESHOLD_MS', 3000),
  dedupWindowMinutes: getEnvNumber('DEDUP_WINDOW_MINUTES', 10),
  
  // CORS
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  
  // Optional Email
  emailEnabled: process.env.EMAIL_ENABLED === 'true',
  smtp: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: getEnvNumber('SMTP_PORT', 587),
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.ALERT_EMAIL_FROM || 'API Monitor <alerts@example.com>',
    to: process.env.ALERT_EMAIL_TO || '',
  },
};

// Helpful warnings during startup if credentials are not configured yet
export function validateCriticalEnv() {
  const missing = [];
  if (!config.mongoUri || config.mongoUri.includes('<cluster>')) {
    missing.push('MONGO_URI (MongoDB Atlas connection string)');
  }
  if (!config.groqApiKey || config.groqApiKey.includes('your_groq_api_key')) {
    missing.push('GROQ_API_KEY (Groq LLM API Key - deterministic fallback will be used if absent)');
  }
  return missing;
}
