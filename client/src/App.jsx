import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Header } from './components/Header.jsx';
import { StatsCards } from './components/StatsCards.jsx';
import { FilterBar } from './components/FilterBar.jsx';
import { AlertCard } from './components/AlertCard.jsx';
import { EmptyState } from './components/EmptyState.jsx';
import { Loader } from './components/Loader.jsx';
import { ErrorBanner } from './components/ErrorBanner.jsx';
import {
  getAlerts,
  getStats,
  resolveAlert,
  runLivePoll,
  submitMonitorBatch,
  triggerEmailReport,
  SAMPLE_BATCH,
} from './api/client.js';

export default function App() {
  const [alerts, setAlerts] = useState([]);
  const [stats, setStats] = useState({ totalActive: 0, critical: 0, high: 0, medium: 0, low: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [severity, setSeverity] = useState(undefined);
  const [status, setStatus] = useState('active');
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Action loading states
  const [isPolling, setIsPolling] = useState(false);
  const [isLoadingSample, setIsLoadingSample] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [resolvingId, setResolvingId] = useState(null);

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 4000);
  };

  // Fetch alerts & statistics
  const fetchData = useCallback(async (showLoader = false) => {
    if (showLoader) setLoading(true);
    try {
      setError(null);
      const [alertsRes, statsRes] = await Promise.all([
        getAlerts({
          severity,
          api_name: searchQuery || undefined,
          status,
          limit: 100,
        }),
        getStats(),
      ]);

      setAlerts(alertsRes.alerts || []);
      setStats(statsRes);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to connect to backend server';
      setError(`Cannot reach API Monitor backend: ${msg}. Make sure the Node server is running on port 5000.`);
    } finally {
      setLoading(false);
    }
  }, [severity, searchQuery, status]);

  // Initial load and filter change
  useEffect(() => {
    fetchData(true);
  }, [fetchData]);

  // 15-second Auto-refresh interval
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchData(false);
    }, 15000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchData]);

  // One-click resolve with optimistic update
  const handleResolve = async (id) => {
    setResolvingId(id);
    try {
      await resolveAlert(id);
      showToast('Alert resolved successfully');
      
      // Optimistic update: mark as resolved locally
      setAlerts((prev) =>
        prev.map((a) => (a._id === id ? { ...a, status: 'resolved' } : a))
      );
      // Refresh stats
      const statsRes = await getStats();
      setStats(statsRes);
    } catch (err) {
      showToast(`Failed to resolve alert: ${err.message}`);
    } finally {
      setResolvingId(null);
    }
  };

  // Live Check against real external APIs
  const handleRunLiveCheck = async () => {
    setIsPolling(true);
    try {
      const res = await runLivePoll();
      showToast(
        `Live Check Complete: Tested ${res.polledCount} APIs. Found ${res.anomaliesDetected} anomalies (${res.newAlerts} new, ${res.duplicates} repeated).`
      );
      await fetchData(false);
    } catch (err) {
      showToast(`Live Check failed: ${err.response?.data?.message || err.message}`);
    } finally {
      setIsPolling(false);
    }
  };

  // Load the 7 sample test cases from assignment
  const handleLoadSample = async () => {
    setIsLoadingSample(true);
    try {
      const res = await submitMonitorBatch(SAMPLE_BATCH);
      showToast(
        `Sample Data Loaded: ${res.anomaliesDetected} anomalies detected (${res.newAlerts} new alerts, ${res.duplicates} deduplicated).`
      );
      await fetchData(false);
    } catch (err) {
      showToast(`Failed to load sample data: ${err.response?.data?.message || err.message}`);
    } finally {
      setIsLoadingSample(false);
    }
  };

  // Manual email digest trigger
  const handleSendEmail = async () => {
    setIsSendingEmail(true);
    try {
      const res = await triggerEmailReport();
      showToast(res.message);
    } catch (err) {
      showToast(`Email trigger failed: ${err.response?.data?.message || err.message}`);
    } finally {
      setIsSendingEmail(false);
    }
  };

  return (
    <div className="app-container">
      {/* Toast Notification */}
      {toast && <div className="toast-notice">{toast}</div>}

      {/* Top Header */}
      <Header
        onRunLiveCheck={handleRunLiveCheck}
        onLoadSampleData={handleLoadSample}
        onSendEmailReport={handleSendEmail}
        isPolling={isPolling}
        isLoadingSample={isLoadingSample}
        isSendingEmail={isSendingEmail}
      />

      {/* Error Alert */}
      <ErrorBanner message={error} onDismiss={() => setError(null)} />

      {/* Stats Cards */}
      <StatsCards
        stats={stats}
        selectedSeverity={severity}
        onSelectSeverity={(newSev) => setSeverity(newSev)}
      />

      {/* Filter & Search Bar */}
      <FilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        severity={severity}
        onSeverityChange={setSeverity}
        status={status}
        onStatusChange={setStatus}
        onRefresh={() => fetchData(true)}
        autoRefresh={autoRefresh}
        onToggleAutoRefresh={() => setAutoRefresh((prev) => !prev)}
        isLoading={loading}
      />

      {/* Alert Feed */}
      {loading ? (
        <Loader text="Fetching system anomalies and telemetry..." />
      ) : alerts.length === 0 ? (
        <EmptyState onRunCheck={handleRunLiveCheck} />
      ) : (
        <div className="alert-list">
          {alerts.map((alert) => (
            <AlertCard
              key={alert._id || `${alert.apiName}-${alert.createdAt}`}
              alert={alert}
              onResolve={handleResolve}
              isResolving={resolvingId === alert._id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
