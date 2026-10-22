import mongoose from 'mongoose';
import { config } from './env.js';
import { logger } from '../utils/logger.js';

export async function connectDB() {
  if (!config.mongoUri || config.mongoUri.includes('<cluster>') || config.mongoUri.includes('<password>')) {
    logger.warn('⚠️ MONGO_URI is missing or contains placeholder values in server/.env.');
    logger.warn('⚠️ MongoDB Atlas is required for saving anomalies. Please configure MONGO_URI.');
    return false;
  }

  try {
    mongoose.connection.on('connected', () => {
      logger.info(`✅ MongoDB Atlas connected successfully: ${mongoose.connection.host}/${mongoose.connection.name}`);
    });

    mongoose.connection.on('error', (err) => {
      logger.error(`❌ MongoDB connection error: ${err.message}`);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('⚠️ MongoDB disconnected.');
    });

    await mongoose.connect(config.mongoUri, {
      serverSelectionTimeoutMS: 10000,
    });

    return true;
  } catch (error) {
    logger.error(`❌ Failed to connect to MongoDB Atlas: ${error.message}`);
    logger.error('Troubleshooting tips:');
    logger.error('1. Check Atlas Network Access: Is your IP address (or 0.0.0.0/0) whitelisted?');
    logger.error('2. Check Atlas Database Access: Are your username and password correct?');
    logger.error('3. Make sure the database name "apimonitor" is in the URI before the "?"');
    return false;
  }
}

export async function closeDB() {
  try {
    await mongoose.connection.close();
    logger.info('MongoDB connection closed cleanly.');
  } catch (err) {
    logger.error(`Error closing MongoDB connection: ${err.message}`);
  }
}
