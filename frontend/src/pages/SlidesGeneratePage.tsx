// src/pages/SlidesGeneratePage.tsx
// Seite für die Folien-Generierung. Formular + Platzhalter-Bereich nach erfolgreichem Submit.

import React, { useState } from 'react';
import { SlidesGenerateForm } from '../components/SlidesGenerateForm';
import type { SlidesGenerateResponse } from '../types/slides';

const SlidesGeneratePage: React.FC = () => {
  // Antwort der API wird hier gehalten – die echte Vorschau folgt in Story 4.5.
  const [generationResponse, setGenerationResponse] = useState<SlidesGenerateResponse | null>(null);

  // Nach erfolgreichem Submit: Platzhalter anzeigen, request_id fürs spätere Polling merken.
  function handleGenerationSuccess(response: SlidesGenerateResponse): void {
    setGenerationResponse(response);
  }

  // Erlaubt dem Nutzer, zurück zum Formular zu wechseln und erneut zu generieren.
  function handleResetPlaceholder(): void {
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
        // Platzhalter bis Story 4.5 die echte Vorschau rendert.
        <div className="page-form">
          <div className="card" role="status" aria-live="polite">
            <h2 className="page-title" style={{ fontSize: '1.25rem', marginTop: 0 }}>
              Folien werden vorbereitet
            </h2>
            <p>
              Die Generierung wurde gestartet. Sobald die Vorschau verfügbar ist, erscheint sie hier.
            </p>
            <p className="form-helper">
              Request-ID: <code>{generationResponse.request_id}</code>
            </p>
            <button
              type="button"
              className="secondary-button"
              onClick={handleResetPlaceholder}
              style={{ marginTop: '1rem' }}
            >
              Neue Folien generieren
            </button>
          </div>
        </div>
      ) : (
        <div className="page-form">
          <SlidesGenerateForm onSuccess={handleGenerationSuccess} />
        </div>
      )}
    </div>
  );
};

export default SlidesGeneratePage;
