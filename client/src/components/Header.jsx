import React from 'react';
import { Activity, Play, UploadCloud, Mail, Sparkles } from 'lucide-react';

export function Header({
  onRunLiveCheck,
  onLoadSampleData,
  onSendEmailReport,
  isPolling,
  isLoadingSample,
  isSendingEmail,
}) {
  return (
    <header className="app-header">
      <div className="header-branding">
        <div className="header-logo-container">
          <Activity size={26} className="header-logo-icon" />
          <span className="live-ping"></span>
        </div>
        <div>
          <h1 className="header-title">Intelligent API Monitoring & Alert System</h1>
          <p className="header-subtitle">
            Autonomous anomaly detection with Groq LLM real-time diagnostics
          </p>
        </div>
      </div>

      <div className="header-actions">
        {/* Run Live Check Button */}
        <button
          type="button"
          className="btn-header btn-primary"
          onClick={onRunLiveCheck}
          disabled={isPolling}
          title="Query 6 live external APIs (JSONPlaceholder, httpbin, Open-Meteo) and detect anomalies"
        >
          <Play size={16} className={isPolling ? 'spin' : ''} />
          <span>{isPolling ? 'Checking Live APIs...' : 'Run Live Check'}</span>
        </button>

        {/* Load Sample Data Button */}
        <button
          type="button"
          className="btn-header btn-secondary"
          onClick={onLoadSampleData}
          disabled={isLoadingSample}
          title="Submit the 7 test scenarios (PatientData, Appointment, Billing, Lab, etc.)"
        >
          <UploadCloud size={16} className={isLoadingSample ? 'spin' : ''} />
          <span>{isLoadingSample ? 'Submitting Batch...' : 'Load Sample Data'}</span>
        </button>

        {/* Email Report Button */}
        <button
          type="button"
          className="btn-header btn-outline"
          onClick={onSendEmailReport}
          disabled={isSendingEmail}
          title="Send HTML email digest of urgent anomalies"
        >
          <Mail size={16} />
          <span>{isSendingEmail ? 'Sending...' : 'Email Report'}</span>
        </button>
      </div>
    </header>
  );
}
