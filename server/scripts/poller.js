import axios from 'axios';
import { pollExternalAPIs } from '../src/services/poller.service.js';
import { config } from '../src/config/env.js';
import { logger } from '../src/utils/logger.js';

const monitorUrl = `http://localhost:${config.port}/monitor`;

async function runPoll() {
  logger.info(`[CLI Poller] Collecting telemetry from live APIs...`);
  const telemetry = await pollExternalAPIs();

  logger.info(`[CLI Poller] Sending ${telemetry.length} items to ${monitorUrl}...`);
  try {
    const response = await axios.post(monitorUrl, telemetry);
    const data = response.data;
    logger.info(`[CLI Poller Success] Received: ${data.received} | Healthy: ${data.healthy} | Anomalies: ${data.anomaliesDetected} | New: ${data.newAlerts} | Duplicates: ${data.duplicates}`);
    
    if (data.anomalies?.length > 0) {
      console.log('\n--- Active Anomalies Summary ---');
      data.anomalies.forEach((a) => {
        console.log(`• [${a.severity.toUpperCase()}] ${a.apiName}: ${a.aiMessage}`);
      });
      console.log('--------------------------------\n');
    }
  } catch (err) {
    if (err.response) {
      logger.error(`[CLI Poller Error] Server responded with status ${err.response.status}: ${JSON.stringify(err.response.data)}`);
    } else {
      logger.error(`[CLI Poller Error] Could not connect to ${monitorUrl}. Is the server running?`);
    }
  }
}

// Parse --interval argument
const intervalArg = process.argv.find((arg) => arg.startsWith('--interval='));
if (intervalArg) {
  const seconds = parseInt(intervalArg.split('=')[1], 10) || 60;
  logger.info(`Starting continuous poller every ${seconds} seconds... (Press Ctrl+C to stop)`);
  runPoll();
  setInterval(runPoll, seconds * 1000);
} else {
  runPoll();
}
