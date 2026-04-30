// src/components/shared/GenerationSkeleton.tsx
// Skeleton-Platzhalter während der KI-Generierung – zeigt pulsierendes Layout
// mit optionaler Fortschrittsmeldung.

import React from 'react';

interface GenerationSkeletonProps {
  /** Anzahl der Skeleton-Karten, die angezeigt werden */
  count?: number;
  /** Fortschrittstext, z. B. "Fragen werden generiert..." */
  message?: string;
}

export const GenerationSkeleton: React.FC<GenerationSkeletonProps> = ({
  count = 3,
  message = 'KI generiert Inhalte …',
}) => {
  return (
    <div className="generation-skeleton" role="status" aria-label={message}>
      <div className="generation-skeleton__header">
        <span className="generation-skeleton__spinner" aria-hidden="true" />
        <p className="generation-skeleton__message">{message}</p>
      </div>

      <div className="generation-skeleton__cards">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="generation-skeleton__card"
            style={{ animationDelay: `${i * 0.12}s` }}
          >
            <div className="generation-skeleton__line generation-skeleton__line--short" />
            <div className="generation-skeleton__line generation-skeleton__line--full" />
            <div className="generation-skeleton__line generation-skeleton__line--full" />
            <div className="generation-skeleton__line generation-skeleton__line--medium" />
          </div>
        ))}
      </div>
    </div>
  );
};
