import React from 'react';
import { Search, RefreshCw, Pause, Play } from 'lucide-react';

export function FilterBar({
  searchQuery,
  onSearchChange,
  severity,
  onSeverityChange,
  status,
  onStatusChange,
  onRefresh,
  autoRefresh,
  onToggleAutoRefresh,
  isLoading,
}) {
  return (
    <div className="filter-bar">
      {/* Search Input */}
      <div className="search-box">
        <Search size={18} className="search-icon" />
        <input
          type="text"
          placeholder="Filter by API name (e.g. AppointmentAPI)..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="search-input"
        />
      </div>

      {/* Severity Selector */}
      <div className="filter-controls">
        <select
          value={severity || ''}
          onChange={(e) => onSeverityChange(e.target.value || undefined)}
          className="filter-select"
        >
          <option value="">All Severities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>

        {/* Status Toggle */}
        <div className="status-toggle-group">
          <button
            type="button"
            className={`toggle-btn ${status === 'active' ? 'active' : ''}`}
            onClick={() => onStatusChange('active')}
          >
            Active
          </button>
          <button
            type="button"
            className={`toggle-btn ${status === 'resolved' ? 'active' : ''}`}
            onClick={() => onStatusChange('resolved')}
          >
            Resolved
          </button>
          <button
            type="button"
            className={`toggle-btn ${status === 'all' ? 'active' : ''}`}
            onClick={() => onStatusChange('all')}
          >
            All
          </button>
        </div>

        {/* Auto Refresh Toggle */}
        <button
          type="button"
          onClick={onToggleAutoRefresh}
          className={`icon-btn ${autoRefresh ? 'active-poll' : ''}`}
          title={autoRefresh ? 'Pause 15s auto-refresh' : 'Resume auto-refresh'}
        >
          {autoRefresh ? <Pause size={16} /> : <Play size={16} />}
          <span>{autoRefresh ? '15s Auto' : 'Paused'}</span>
        </button>

        {/* Manual Refresh Button */}
        <button
          type="button"
          onClick={onRefresh}
          disabled={isLoading}
          className="btn-refresh"
          title="Refresh alerts now"
        >
          <RefreshCw size={16} className={isLoading ? 'spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>
    </div>
  );
}
