import pLimit from 'p-limit';
import mongoose from 'mongoose';
import { config } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { detectBatch } from './detector.service.js';
import { generateAlertMessage } from './aiAlert.service.js';
import { Anomaly } from '../models/Anomaly.js';
import { sendAnomalyReport } from './email.service.js';

/**
 * Orchestrates batch monitoring:
 * 1. Rule-based detection
 * 2. De-duplication check against recent active anomalies
 * 3. AI alert generation with controlled concurrency (p-limit)
 * 4. Persistence to MongoDB Atlas
 * 5. Optional email dispatch for high/critical anomalies
 *
 * @param {Array<Object>} entries - Batch of API telemetry items
 * @returns {Promise<Object>} Batch processing summary
 */
export async function processBatch(entries) {
  const totalReceived = entries.length;

  // 1. Pure Rule-Based Anomaly Detection
  const detected = detectBatch(entries, {
    responseTimeThresholdMs: config.responseTimeThresholdMs,
  });

  if (detected.length === 0) {
    logger.info(`[Batch Processed] Received ${totalReceived} entries. All systems healthy.`);
    return {
      received: totalReceived,
      healthy: totalReceived,
      anomaliesDetected: 0,
      newAlerts: 0,
      duplicates: 0,
      anomalies: [],
    };
  }

  const isDbConnected = mongoose.connection.readyState === 1;
  const dedupThresholdDate = new Date(Date.now() - config.dedupWindowMinutes * 60 * 1000);

  const newToProcess = [];
  const processedDuplicates = [];

  // 2. De-duplication Check
  for (const anomaly of detected) {
    if (isDbConnected) {
      const sortedTypes = [...anomaly.types].sort();
      
      const existing = await Anomaly.findOne({
        apiName: anomaly.apiName,
        status: 'active',
        lastSeenAt: { $gte: dedupThresholdDate },
        types: { $all: sortedTypes, $size: sortedTypes.length },
      });

      if (existing) {
        existing.occurrences += 1;
        existing.lastSeenAt = new Date();
        existing.metrics = anomaly.metrics;
        await existing.save();
        processedDuplicates.push(existing);
        continue;
      }
    }

    newToProcess.push(anomaly);
  }

  // 3. AI Alert Generation with Concurrency Control
  const limit = pLimit(config.aiConcurrency);
  const aiPromises = newToProcess.map((item) =>
    limit(async () => {
      const { message, aiGenerated } = await generateAlertMessage(item);
      return {
        ...item,
        aiMessage: message,
        aiGenerated,
      };
    })
  );

  const enrichedResults = await Promise.allSettled(aiPromises);
  const readyToSave = [];

  enrichedResults.forEach((result, idx) => {
    if (result.status === 'fulfilled') {
      readyToSave.push(result.value);
    } else {
      logger.error(`Failed to enrich anomaly for ${newToProcess[idx].apiName}: ${result.reason?.message}`);
      // Fallback in case unexpected rejection occurred
      readyToSave.push({
        ...newToProcess[idx],
        aiMessage: `${newToProcess[idx].apiName} encountered an operational anomaly.`,
        aiGenerated: false,
      });
    }
  });

  // 4. Persistence to MongoDB
  let savedAnomalies = [];
  if (isDbConnected && readyToSave.length > 0) {
    savedAnomalies = await Anomaly.insertMany(readyToSave);
  } else {
    // If DB is offline, return memory representation
    savedAnomalies = readyToSave.map((item) => ({
      ...item,
      status: 'active',
      occurrences: 1,
      createdAt: new Date(),
    }));
  }

  // 5. Optional Email Alerts (Triggered asynchronously)
  if (config.emailEnabled) {
    const highPriorityAlerts = savedAnomalies.filter(
      (a) => a.severity === 'critical' || a.severity === 'high'
    );
    if (highPriorityAlerts.length > 0) {
      sendAnomalyReport(highPriorityAlerts).catch((err) => {
        logger.error(`Background email notification failed: ${err.message}`);
      });
    }
  }

  const allAnomalies = [...savedAnomalies, ...processedDuplicates];
  const healthyCount = totalReceived - detected.length;

  logger.info(
    `[Batch Complete] Processed: ${totalReceived} | Healthy: ${healthyCount} | Anomalies: ${detected.length} | New: ${savedAnomalies.length} | Duplicates: ${processedDuplicates.length}`
  );

  return {
    received: totalReceived,
    healthy: healthyCount,
    anomaliesDetected: detected.length,
    newAlerts: savedAnomalies.length,
    duplicates: processedDuplicates.length,
    anomalies: allAnomalies,
  };
}
