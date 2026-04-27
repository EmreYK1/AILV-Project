// src/pages/SlidesGeneratePage.tsx
// Seite für die Folien-Generierung. Steuert Formular, Vorschau und erneutes Generieren.

import React, { useState } from 'react';
import { SlidesGenerateForm } from '../components/SlidesGenerateForm';
import { SlidesPreview } from '../components/SlidesPreview';
import { ErrorBanner } from '../components/ErrorBanner';
import { useSlidesGenerateForm } from '../hooks/useSlidesGenerateForm';
import type { SlidesGenerateResponse } from '../types/slides';

const SlidesGeneratePage: React.FC = () => {
  const [generationResponse, setGenerationResponse] = useState<SlidesGenerateResponse | null>(null);

  // Nach erfolgreichem Submit: Vorschau anzeigen und Formularwerte im Hook behalten.
  function handleGenerationSuccess(response: SlidesGenerateResponse): void {
    setGenerationResponse(response);
  }

  const form = useSlidesGenerateForm({ onSuccess: handleGenerationSuccess });

  // Zeigt das Formular wieder an, ohne den Formular-State zu löschen.
  function handleEditInputs(): void {
    setGenerationResponse(null);
  }

  return (
    <div className="page">
      <h1 className="page-title">Folien generieren</h1>
      <p className="page-description">
        Geben Sie Thema, Sprache und Folienanzahl an. Optional können Sie zusätzlich einen Kontexttext
        oder eine PDF-Datei hinterlegen, die bei der Foliengenerierung berücksichtigt werden.
      </p>

      {generationResponse ? (
        <div className="page-form" aria-live="polite">
          <div className="card">
            <SlidesPreview slides={generationResponse.slides} />

            <div className="slides-preview__meta">
              <p className="form-helper slides-preview__request-id">
                Request-ID: <code>{generationResponse.request_id}</code>
              </p>

              <div className="slides-preview__actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={handleEditInputs}
                  disabled={form.isSubmitting}
                >
                  Eingaben ändern
                </button>

                <button
                  type="button"
                  className="primary-button"
                  onClick={form.regenerate}
                  disabled={form.isSubmitting}
                  aria-busy={form.isSubmitting}
                >
                  {form.isSubmitting ? (
                    <span className="form-submit-button__loading">
                      <span className="form-button-spinner" aria-hidden="true" />
                      Neu generieren …
                    </span>
                  ) : (
                    'Neu generieren'
                  )}
                </button>
              </div>
            </div>

            <ErrorBanner message={form.submitError} />
          </div>
        </div>
      ) : (
        <div className="page-form">
          <SlidesGenerateForm form={form} />
        </div>
      )}
    </div>
  );
};

export default SlidesGeneratePage;
