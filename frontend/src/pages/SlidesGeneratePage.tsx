// src/pages/SlidesGeneratePage.tsx
// Seite für die Folien-Generierung. Steuert Formular, Vorschau und erneutes Generieren.

import React, { useState } from 'react';
import { SlidesGenerateForm, SlidesPreview, SlidesSaveDialog } from '../components/slides';
import { ErrorBanner } from '../components/shared';
import { useSlidesGenerateForm } from '../hooks/useSlidesGenerateForm';
import type { SlidesGenerateResponse } from '../types/slides';

export const SlidesGeneratePage: React.FC = () => {
  const [generationResponse, setGenerationResponse] = useState<SlidesGenerateResponse | null>(null);
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);

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

              {form.isSaved && (
                <div className="success-banner" style={{ marginBottom: '1rem', padding: '1rem', backgroundColor: '#e6f4ea', color: '#1e8e3e', borderRadius: '4px' }}>
                  <strong>Erfolg!</strong> Die Folien wurden dauerhaft gespeichert.
                </div>
              )}

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

                {!form.isSaved && (
                  <button
                    type="button"
                    className="primary-button"
                    onClick={() => setIsSaveDialogOpen(true)}
                    disabled={form.isSubmitting}
                  >
                    Speichern
                  </button>
                )}
              </div>
            </div>

            <ErrorBanner message={form.submitError} />
          </div>

          <SlidesSaveDialog
            isOpen={isSaveDialogOpen}
            onClose={() => setIsSaveDialogOpen(false)}
            onSave={async (name) => {
              await form.saveSlides(name);
              setIsSaveDialogOpen(false);
            }}
            defaultTopic={form.formValues.topic}
            isSaving={form.isSaving}
          />
        </div>
      ) : (
        <div className="page-form">
          <SlidesGenerateForm form={form} />
        </div>
      )}
    </div>
  );
};
