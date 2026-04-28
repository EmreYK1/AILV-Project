// src/components/shared/ErrorBanner.tsx
// Rendert eine Fehlermeldung oder nichts. `role="alert"` für Screenreader.

import React from 'react';

interface ErrorBannerProps {
  message: string | null | undefined;
  className?: string;
}

export const ErrorBanner: React.FC<ErrorBannerProps> = ({ message, className }) => {
  if (!message) return null;

  return (
    <div className={`error-banner${className ? ' ' + className : ''}`} role="alert">
      <div className="error-banner-content">
        <strong>Fehler:</strong> {message}
      </div>
    </div>
  );
};
