import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { detectAnomaly, detectBatch } from '../src/services/detector.service.js';

describe('Detector Service Unit Tests', () => {
  const config = { responseTimeThresholdMs: 3000 };

  it('should return null for healthy API entry', () => {
    const entry = {
      api_name: 'PatientDataAPI',
      response_time_ms: 1200,
      status_code: 200,
      records_returned: 50,
    };
    const result = detectAnomaly(entry, config);
    assert.equal(result, null);
  });

  it('should detect slow response time (> 3000ms) with medium severity', () => {
    const entry = {
      api_name: 'BillingAPI',
      response_time_ms: 4200,
      status_code: 200,
      records_returned: 18,
    };
    const result = detectAnomaly(entry, config);
    assert.ok(result);
    assert.deepEqual(result.types, ['HIGH_RESPONSE_TIME']);
    assert.equal(result.severity, 'medium');
  });

  it('should flag very slow response (> 6000ms) with high severity', () => {
    const entry = {
      api_name: 'ReportsAPI',
      response_time_ms: 6500,
      status_code: 200,
      records_returned: 20,
    };
    const result = detectAnomaly(entry, config);
    assert.ok(result);
    assert.equal(result.severity, 'high');
  });

  it('should detect 500 server error as critical and combine with other triggered types', () => {
    const entry = {
      api_name: 'AppointmentAPI',
      response_time_ms: 5500,
      status_code: 500,
      records_returned: 0,
    };
    const result = detectAnomaly(entry, config);
    assert.ok(result);
    assert.equal(result.severity, 'critical');
    assert.ok(result.types.includes('FAILED_REQUEST'));
    assert.ok(result.types.includes('HIGH_RESPONSE_TIME'));
    assert.ok(result.types.includes('ZERO_RECORDS'));
  });

  it('should flag 404 client error with high severity', () => {
    const entry = {
      api_name: 'LabResultsAPI',
      response_time_ms: 800,
      status_code: 404,
      records_returned: 0,
    };
    const result = detectAnomaly(entry, config);
    assert.ok(result);
    assert.equal(result.severity, 'high');
    assert.ok(result.types.includes('FAILED_REQUEST'));
  });

  it('should detect zero records on 200 OK as high severity anomaly', () => {
    const entry = {
      api_name: 'PharmacyAPI',
      response_time_ms: 950,
      status_code: 200,
      records_returned: 0,
    };
    const result = detectAnomaly(entry, config);
    assert.ok(result);
    assert.equal(result.severity, 'high');
    assert.ok(result.types.includes('ZERO_RECORDS'));
  });

  it('should detect null or undefined records_returned as MISSING_DATA', () => {
    const entry = {
      api_name: 'InsuranceAPI',
      response_time_ms: 700,
      status_code: 200,
      records_returned: null,
    };
    const result = detectAnomaly(entry, config);
    assert.ok(result);
    assert.equal(result.severity, 'high');
    assert.ok(result.types.includes('MISSING_DATA'));
  });

  it('should process batch correctly, ignoring healthy and capturing anomalies', () => {
    const batch = [
      { api_name: 'PatientDataAPI', response_time_ms: 1200, status_code: 200, records_returned: 50 },
      { api_name: 'AppointmentAPI', response_time_ms: 5500, status_code: 500, records_returned: 0 },
      { api_name: 'StaffRosterAPI', response_time_ms: 300, status_code: 200, records_returned: 12 },
    ];
    const results = detectBatch(batch, config);
    assert.equal(results.length, 1);
    assert.equal(results[0].apiName, 'AppointmentAPI');
  });
});
