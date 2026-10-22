import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildFallbackMessage } from '../src/services/aiAlert.service.js';

describe('AI Alert Fallback Unit Tests', () => {
  it('should build clear message for 500 server error and 0 records', () => {
    const anomaly = {
      apiName: 'AppointmentAPI',
      types: ['FAILED_REQUEST', 'ZERO_RECORDS'],
      severity: 'critical',
      metrics: { statusCode: 500, responseTimeMs: 5500, recordsReturned: 0 },
      reasons: ['HTTP request failed with status code 500'],
    };

    const message = buildFallbackMessage(anomaly);
    assert.ok(message.includes('AppointmentAPI'));
    assert.ok(message.includes('500'));
    assert.ok(message.includes('0 records'));
  });

  it('should build clear message for high response time', () => {
    const anomaly = {
      apiName: 'BillingAPI',
      types: ['HIGH_RESPONSE_TIME'],
      severity: 'medium',
      metrics: { statusCode: 200, responseTimeMs: 4200, recordsReturned: 18 },
      reasons: ['Response time of 4200ms exceeded threshold of 3000ms'],
    };

    const message = buildFallbackMessage(anomaly);
    assert.ok(message.includes('BillingAPI'));
    assert.ok(message.includes('4200ms'));
  });

  it('should build clear message for 404 client error', () => {
    const anomaly = {
      apiName: 'LabResultsAPI',
      types: ['FAILED_REQUEST', 'ZERO_RECORDS'],
      severity: 'high',
      metrics: { statusCode: 404, responseTimeMs: 800, recordsReturned: 0 },
      reasons: ['HTTP request failed with status code 404'],
    };

    const message = buildFallbackMessage(anomaly);
    assert.ok(message.includes('LabResultsAPI'));
    assert.ok(message.includes('404'));
  });
});
