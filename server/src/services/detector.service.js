const SEVERITY_LEVELS = {
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};

const SEVERITY_NAMES = ['low', 'medium', 'high', 'critical'];

/**
 * Evaluates a single API health record and detects anomalies based on configured thresholds.
 * Pure function: No I/O or side-effects, making it fast and easy to unit test.
 *
 * @param {Object} entry - Raw API monitoring payload
 * @param {string} entry.api_name - Name of the external API
 * @param {number} entry.response_time_ms - Latency in milliseconds
 * @param {number} entry.status_code - HTTP response code
 * @param {number|null} [entry.records_returned] - Number of items in response
 * @param {Object} [config]
 * @param {number} [config.responseTimeThresholdMs=3000]
 * @returns {Object|null} Anomaly object if triggered, or null if healthy
 */
export function detectAnomaly(entry, config = {}) {
  const threshold = config.responseTimeThresholdMs || 3000;
  const types = [];
  const reasons = [];
  let maxSeverityLevel = 0;

  const updateSeverity = (levelName) => {
    const level = SEVERITY_LEVELS[levelName] || 1;
    if (level > maxSeverityLevel) {
      maxSeverityLevel = level;
    }
  };

  const responseTime = Number(entry.response_time_ms);
  const statusCode = Number(entry.status_code);
  const records = entry.records_returned;

  // 1. Response Time Check
  if (!Number.isNaN(responseTime) && responseTime > threshold) {
    types.push('HIGH_RESPONSE_TIME');
    const isVerySlow = responseTime > threshold * 2;
    const severity = isVerySlow ? 'high' : 'medium';
    updateSeverity(severity);
    reasons.push(`Response time of ${responseTime}ms exceeded threshold of ${threshold}ms`);
  }

  // 2. HTTP Status Code Check
  if (Number.isNaN(statusCode) || statusCode >= 400 || statusCode < 100) {
    types.push('FAILED_REQUEST');
    const isServerError = Number.isNaN(statusCode) || statusCode >= 500;
    const severity = isServerError ? 'critical' : 'high';
    updateSeverity(severity);
    reasons.push(`HTTP request failed with status code ${statusCode}`);
  }

  // 3. Returned Data Integrity Check
  if (records === null || records === undefined || Number.isNaN(Number(records)) || Number(records) < 0) {
    types.push('MISSING_DATA');
    updateSeverity('high');
    reasons.push(`Missing or invalid records_returned count: ${records}`);
  } else if (Number(records) === 0) {
    types.push('ZERO_RECORDS');
    // If status was 2xx (successful), returning 0 records is suspicious (High), else Medium
    const is2xx = statusCode >= 200 && statusCode < 300;
    const severity = is2xx ? 'high' : 'medium';
    updateSeverity(severity);
    reasons.push('Endpoint returned zero records');
  }

  // If no rules triggered, API is healthy
  if (types.length === 0) {
    return null;
  }

  const finalSeverity = SEVERITY_NAMES[maxSeverityLevel - 1] || 'medium';

  return {
    apiName: entry.api_name,
    types,
    severity: finalSeverity,
    reasons,
    metrics: {
      responseTimeMs: responseTime,
      statusCode: statusCode,
      recordsReturned: records !== null && records !== undefined && !Number.isNaN(Number(records)) ? Number(records) : null,
    },
  };
}

/**
 * Detects anomalies across a batch of API entries.
 *
 * @param {Array<Object>} entries - Array of API entries
 * @param {Object} [config]
 * @returns {Array<Object>} Detected anomalies
 */
export function detectBatch(entries = [], config = {}) {
  if (!Array.isArray(entries)) return [];
  const anomalies = [];

  for (const entry of entries) {
    const anomaly = detectAnomaly(entry, config);
    if (anomaly) {
      anomalies.push(anomaly);
    }
  }

  return anomalies;
}
