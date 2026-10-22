import axios from 'axios';
import { logger } from '../utils/logger.js';

export const POLL_TARGETS = [
  {
    name: 'UserDirectoryAPI (JSONPlaceholder)',
    url: 'https://jsonplaceholder.typicode.com/users',
    extractRecords: (data) => (Array.isArray(data) ? data.length : 1),
  },
  {
    name: 'EmptyQueryAPI (JSONPlaceholder)',
    url: 'https://jsonplaceholder.typicode.com/posts?userId=99999',
    extractRecords: (data) => (Array.isArray(data) ? data.length : 0),
  },
  {
    name: 'MissingRouteAPI (JSONPlaceholder)',
    url: 'https://jsonplaceholder.typicode.com/does-not-exist',
    extractRecords: () => 0,
  },
  {
    name: 'ServerOutageAPI (httpbin 500)',
    url: 'https://httpbin.org/status/500',
    extractRecords: () => 0,
  },
  {
    name: 'SlowLatencyAPI (httpbin delay 4s)',
    url: 'https://httpbin.org/delay/4',
    extractRecords: () => 1,
  },
  {
    name: 'WeatherForecastAPI (Open-Meteo)',
    url: 'https://api.open-meteo.com/v1/forecast?latitude=23.81&longitude=90.41&hourly=temperature_2m',
    extractRecords: (data) => (data?.hourly?.time ? data.hourly.time.length : 0),
  },
];

/**
 * Checks a single target endpoint and records response metrics.
 */
async function checkEndpoint(target) {
  const start = performance.now();
  try {
    const response = await axios.get(target.url, {
      timeout: 10000,
      validateStatus: () => true, // Don't throw on 4xx / 5xx
    });
    const duration = Math.round(performance.now() - start);

    let count = 0;
    try {
      count = target.extractRecords(response.data);
    } catch {
      count = 0;
    }

    return {
      api_name: target.name,
      response_time_ms: duration,
      status_code: response.status,
      records_returned: count,
    };
  } catch (error) {
    const duration = Math.round(performance.now() - start);
    logger.warn(`Poller network error for ${target.name}: ${error.message}`);
    return {
      api_name: target.name,
      response_time_ms: duration,
      status_code: 599, // Network Connect Timeout Error
      records_returned: 0,
    };
  }
}

/**
 * Polls all target external endpoints in parallel.
 *
 * @returns {Promise<Array<Object>>} Array of API health entries
 */
export async function pollExternalAPIs() {
  logger.info(`[Poller] Polling ${POLL_TARGETS.length} live endpoints...`);
  const results = await Promise.all(POLL_TARGETS.map((target) => checkEndpoint(target)));
  return results;
}
