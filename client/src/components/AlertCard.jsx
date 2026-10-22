import React from 'react';
import { SeverityBadge } from './SeverityBadge.jsx';
import { formatRelativeTime } from '../utils/time.js';
import { CheckCircle2, Clock, Sparkles, Layers, Zap } from 'lucide-react';

const TYPE_LABELS = {
  HIGH_RESPONSE_TIME: 'Slow Response',
  FAILED_REQUEST: 'HTTP Error',
  ZERO_RECORDS: 'Zero Records',
  MISSING_DATA: 'Invalid Data',
};

export function AlertCard({ alert, onResolve, isResolving }) {
  const {
    _id,
    apiName,
    severity,
    types = [],
    metrics = {},
    aiMessage,
    aiGenerated,
    occurrences = 1,
    status,
    createdAt,
  } = alert;

  const isResolved = status === 'resolved';

  return (
    <div className={`alert-card severity-border-${severity} ${isResolved ? 'is-resolved' : ''}`}>
      {/* Top Header */}
      <div className="alert-card-top">
        <div className="alert-title-group">
          <h3 className="api-name">{apiName}</h3>
          <SeverityBadge severity={severity} />
          {occurrences > 1 && (
            <span className="badge-occurrences" title={`Repeated ${occurrences} times within deduplication window`}>
              <Layers size={12} />
              {occurrences}x detected
            </span>
          )}
        </div>

        <div className="alert-meta">
          <span className={`ai-tag ${aiGenerated ? 'ai-active' : 'ai-fallback'}`}>
            {aiGenerated ? (
              <>
                <Sparkles size={13} />
                <span>AI Diagnosed</span>
              </>
            ) : (
              <>
                <Zap size={13} />
                <span>Rule Fallback</span>
              </>
            )}
          </span>
          <span className="time-indicator">
            <Clock size={13} />
            {formatRelativeTime(createdAt)}
          </span>
        </div>
      </div>

      {/* AI Alert Message Box */}
      <div className="alert-message-box">
        <p className="ai-message-text">{aiMessage}</p>
      </div>

      {/* Triggered Issue Chips */}
      <div className="issue-chips">
        {types.map((type) => (
          <span key={type} className="chip">
            {TYPE_LABELS[type] || type}
          </span>
        ))}
      </div>

      {/* Telemetry Metrics & Action Footer */}
      <div className="alert-card-footer">
        <div className="metrics-row">
          <div className="metric-pill">
            <span className="metric-label">Status</span>
            <span className={`metric-val ${metrics.statusCode >= 400 ? 'text-danger' : 'text-success'}`}>
              {metrics.statusCode ?? 'N/A'}
            </span>
          </div>

          <div className="metric-pill">
            <span className="metric-label">Latency</span>
            <span className={`metric-val ${metrics.responseTimeMs > 3000 ? 'text-warning' : ''}`}>
              {metrics.responseTimeMs != null ? `${metrics.responseTimeMs}ms` : 'N/A'}
            </span>
          </div>

          <div className="metric-pill">
            <span className="metric-label">Records</span>
            <span className={`metric-val ${metrics.recordsReturned === 0 ? 'text-warning' : ''}`}>
              {metrics.recordsReturned !== null && metrics.recordsReturned !== undefined
                ? metrics.recordsReturned
                : 'null'}
            </span>
          </div>
        </div>

        {/* Action Button */}
        <div>
          {isResolved ? (
            <span className="resolved-stamp">
              <CheckCircle2 size={16} /> Resolved
            </span>
          ) : (
            <button
              type="button"
              className="btn-resolve"
              disabled={isResolving}
              onClick={() => onResolve(_id)}
            >
              <CheckCircle2 size={15} />
              <span>{isResolving ? 'Resolving...' : 'Resolve'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
