import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getAlerts = async (params = {}) => {
  const response = await api.get('/alerts', { params });
  return response.data;
};

export const getStats = async () => {
  const response = await api.get('/alerts/stats');
  return response.data;
};

export const resolveAlert = async (id) => {
  const response = await api.patch(`/alerts/${id}/resolve`);
  return response.data;
};

export const runLivePoll = async () => {
  const response = await api.post('/monitor/poll');
  return response.data;
};

export const submitMonitorBatch = async (batch) => {
  const response = await api.post('/monitor', batch);
  return response.data;
};

export const triggerEmailReport = async () => {
  const response = await api.post('/alerts/report');
  return response.data;
};

// Default sample payload from the assignment
export const SAMPLE_BATCH = [
  { api_name: 'PatientDataAPI', response_time_ms: 1200, status_code: 200, records_returned: 50 },
  { api_name: 'AppointmentAPI', response_time_ms: 5500, status_code: 500, records_returned: 0 },
  { api_name: 'BillingAPI', response_time_ms: 4200, status_code: 200, records_returned: 18 },
  { api_name: 'LabResultsAPI', response_time_ms: 800, status_code: 404, records_returned: 0 },
  { api_name: 'PharmacyAPI', response_time_ms: 950, status_code: 200, records_returned: 0 },
  { api_name: 'InsuranceAPI', response_time_ms: 700, status_code: 200, records_returned: null },
  { api_name: 'StaffRosterAPI', response_time_ms: 300, status_code: 200, records_returned: 12 },
];
