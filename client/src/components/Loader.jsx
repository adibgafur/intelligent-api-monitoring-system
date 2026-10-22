import React from 'react';

export function Loader({ text = 'Loading system telemetry...' }) {
  return (
    <div className="loader-container">
      <div className="spinner"></div>
      <p className="loader-text">{text}</p>
    </div>
  );
}
