// src/components/shared/GenerationSkeleton.tsx
// Skeleton-Platzhalter während der KI-Generierung – zeigt pulsierendes Layout
// mit optionaler Fortschrittsmeldung.

import React from 'react';

interface GenerationSkeletonProps {
  /** Anzahl der Skeleton-Karten, die angezeigt werden */
  count?: number;
  /** Fortschrittstext, z. B. "Fragen werden generiert..." */
  message?: string;
  /** Job-Fortschritt in Prozent (0-100) */
  progress?: number;
  /** Optionales, vom Backend geliefertes Stage-Label */
  stageLabel?: string | null;
}

function resolveStepText(progress: number): string {
  if (progress >= 100) {
    return 'Schritt 3 von 3';
  }

  if (progress >= 66) {
    return 'Schritt 2 von 3';
  }

  return 'Schritt 1 von 3';
}

export const GenerationSkeleton: React.FC<GenerationSkeletonProps> = ({
  count = 3,
  message = 'KI generiert Inhalte …',
  progress,
  stageLabel,
}) => {
  const normalizedProgress =
    typeof progress === 'number' ? Math.min(100, Math.max(0, Math.round(progress))) : null;
  const stepText = normalizedProgress !== null ? resolveStepText(normalizedProgress) : null;
  const progressText =
    normalizedProgress !== null
      ? `${stageLabel ?? message} - ${stepText}`
      : message;

  return (
    <div className="generation-skeleton" role="status" aria-label={progressText}>
      <div className="generation-skeleton__header">
        <span className="generation-skeleton__spinner" aria-hidden="true" />
        <p className="generation-skeleton__message">{progressText}</p>
        {normalizedProgress !== null && (
          <span className="generation-skeleton__progress-value">{normalizedProgress}%</span>
        )}
      </div>
      {normalizedProgress !== null && (
        <div className="generation-skeleton__progress-track" aria-hidden="true">
          <div
            className="generation-skeleton__progress-fill"
            style={{ width: `${normalizedProgress}%` }}
          />
        </div>
      )}

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
