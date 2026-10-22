import React from 'react';
import { Activity, AlertOctagon, AlertTriangle, AlertCircle } from 'lucide-react';

export function StatsCards({ stats = {}, selectedSeverity, onSelectSeverity }) {
  const cards = [
    {
      id: 'all',
      title: 'Total Active',
      count: stats.totalActive ?? 0,
      icon: Activity,
      colorClass: 'card-total',
      filterValue: undefined,
    },
    {
      id: 'critical',
      title: 'Critical Outages',
      count: stats.critical ?? 0,
      icon: AlertOctagon,
      colorClass: 'card-critical',
      filterValue: 'critical',
    },
    {
      id: 'high',
      title: 'High Severity',
      count: stats.high ?? 0,
      icon: AlertTriangle,
      colorClass: 'card-high',
      filterValue: 'high',
    },
    {
      id: 'medium',
      title: 'Medium Warnings',
      count: stats.medium ?? 0,
      icon: AlertCircle,
      colorClass: 'card-medium',
      filterValue: 'medium',
    },
  ];

  return (
    <div className="stats-grid">
      {cards.map((card) => {
        const Icon = card.icon;
        const isSelected = selectedSeverity === card.filterValue;
        return (
          <div
            key={card.id}
            className={`stat-card ${card.colorClass} ${isSelected ? 'active-filter-card' : ''}`}
            onClick={() => onSelectSeverity(isSelected ? undefined : card.filterValue)}
            role="button"
            tabIndex={0}
            title={`Click to filter by ${card.title}`}
          >
            <div className="stat-card-header">
              <span className="stat-title">{card.title}</span>
              <Icon size={20} className="stat-icon" />
            </div>
            <div className="stat-count">{card.count}</div>
          </div>
        );
      })}
    </div>
  );
}
