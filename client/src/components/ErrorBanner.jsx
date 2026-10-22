import React from 'react';
import { AlertCircle, X } from 'lucide-react';

export function ErrorBanner({ message, onDismiss }) {
  if (!message) return null;

  return (
    <div className="error-banner">
      <div className="error-banner-content">
        <AlertCircle size={20} className="error-banner-icon" />
        <span className="error-banner-text">{message}</span>
      </div>
      {onDismiss && (
        <button type="button" onClick={onDismiss} className="error-banner-close" aria-label="Dismiss error">
          <X size={16} />
        </button>
      )}
    </div>
  );
}
