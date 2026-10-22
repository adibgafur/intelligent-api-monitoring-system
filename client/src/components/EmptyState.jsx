import React from 'react';
import { ShieldCheck, Play } from 'lucide-react';

export function EmptyState({ onRunCheck }) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon-wrap">
        <ShieldCheck size={48} className="empty-state-icon" />
      </div>
      <h3 className="empty-state-title">All Systems Operational</h3>
      <p className="empty-state-desc">
        No active anomalies detected matching your current filters. All external APIs are meeting response time, status code, and payload criteria.
      </p>
      {onRunCheck && (
        <button type="button" className="btn-primary empty-state-btn" onClick={onRunCheck}>
          <Play size={16} />
          <span>Run Live Health Check</span>
        </button>
      )}
    </div>
  );
}
