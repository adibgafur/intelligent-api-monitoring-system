import React from 'react';

const SEVERITY_CONFIG = {
  critical: {
    label: 'Critical',
    className: 'badge-critical',
  },
  high: {
    label: 'High',
    className: 'badge-high',
  },
  medium: {
    label: 'Medium',
    className: 'badge-medium',
  },
  low: {
    label: 'Low',
    className: 'badge-low',
  },
};

export function SeverityBadge({ severity }) {
  const conf = SEVERITY_CONFIG[severity?.toLowerCase()] || SEVERITY_CONFIG.medium;
  return <span className={`badge ${conf.className}`}>{conf.label}</span>;
}
