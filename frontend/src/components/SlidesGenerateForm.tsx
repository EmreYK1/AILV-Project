// src/components/SlidesGenerateForm.tsx
// Darstellung des Folien-Generierungsformulars. Logik: useSlidesGenerateForm.

import React from 'react';
import type { UseSlidesGenerateFormReturn } from '../hooks/useSlidesGenerateForm';
import { ErrorBanner } from './ErrorBanner';
import { PdfUpload } from './PdfUpload';

interface SlidesGenerateFormProps {
  form: UseSlidesGenerateFormReturn;
}

export const SlidesGenerateForm: React.FC<SlidesGenerateFormProps> = ({ form }) => {
  const {
    formValues,
    errors,
    submitError,
    isSubmitting,
    hasValidationErrors,
    handleInputChange,
    handleBlur,
    handleSubmit,
    setUploadContext,
  } = form;

  return (
    <div className="card">
      <form className="form" onSubmit={handleSubmit} noValidate>
        <div className="form-row">
          <label className="form-label" htmlFor="slides-topic">
            Thema *
          </label>
          <input
            id="slides-topic"
            name="topic"
            className={`form-input${errors.topic ? ' form-input--error' : ''}`}
            type="text"
            placeholder="Neuronale Netze – Grundlagen"
            value={formValues.topic}
            onChange={handleInputChange}
            onBlur={handleBlur}
            disabled={isSubmitting}
            aria-invalid={Boolean(errors.topic)}
            aria-describedby={errors.topic ? 'slides-topic-error' : undefined}
            required
          />
          {errors.topic && (
            <p id="slides-topic-error" className="form-error-message">
              {errors.topic}
            </p>
          )}
        </div>

        <div className="form-row">
          <label className="form-label" htmlFor="slides-slide-count">
            Anzahl Folien *
          </label>
          <div className="form-input-wrapper form-input-wrapper--numeric">
            <input
              id="slides-slide-count"
              name="slideCount"
              className={`form-input${errors.slideCount ? ' form-input--error' : ''}`}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="10"
              value={formValues.slideCount}
              onChange={handleInputChange}
              onBlur={handleBlur}
              disabled={isSubmitting}
              aria-invalid={Boolean(errors.slideCount)}
              aria-describedby={errors.slideCount ? 'slides-slide-count-error' : undefined}
              required
            />
          </div>
          {errors.slideCount && (
            <p id="slides-slide-count-error" className="form-error-message">
              {errors.slideCount}
            </p>
          )}
          <p className="form-helper">Erlaubt sind Ganzzahlen zwischen 5 und 30.</p>
        </div>

        <div className="form-row">
          <label className="form-label" htmlFor="slides-language">
            Sprache
          </label>
          <select
            id="slides-language"
            name="language"
            className={`form-input${errors.language ? ' form-input--error' : ''}`}
            value={formValues.language}
            onChange={handleInputChange}
            onBlur={handleBlur}
            disabled={isSubmitting}
            aria-invalid={Boolean(errors.language)}
          >
            <option value="de">Deutsch (de)</option>
            <option value="en">Englisch (en)</option>
          </select>
          {errors.language && (
            <p className="form-error-message">{errors.language}</p>
          )}
        </div>

        <div className="form-row">
          <p className="form-section-title">Manueller Kontext</p>
          <label className="form-label" htmlFor="slides-context-text">
            Zusätzlicher Text (optional)
          </label>
          <textarea
            id="slides-context-text"
            name="contextText"
            className={`form-input${errors.contextText ? ' form-input--error' : ''}`}
            placeholder="Fügen Sie hier relevante Hintergrundinformationen ein …"
            rows={4}
            value={formValues.contextText}
            onChange={handleInputChange}
            onBlur={handleBlur}
            disabled={isSubmitting}
            aria-invalid={Boolean(errors.contextText)}
            aria-describedby={errors.contextText ? 'slides-context-text-error' : undefined}
          />
          {errors.contextText && (
            <p id="slides-context-text-error" className="form-error-message">
              {errors.contextText}
            </p>
          )}
          <p className="form-helper">
            Ergänzende Informationen, die zusätzlich zum PDF (oder stattdessen) bei der Foliengenerierung berücksichtigt werden sollen.
          </p>
        </div>

        <div
          className="form-row"
          style={{
            padding: '1.5rem',
            backgroundColor: '#f8fafc',
            borderRadius: '8px',
            border: '1px solid #e2e8f0',
            marginBottom: '2rem',
          }}
        >
          <p className="form-section-title" style={{ marginTop: 0 }}>
            Dokumenten-Kontext (PDF)
          </p>
          <PdfUpload onExtractedText={setUploadContext} />

          {formValues.uploadContext && (
            <div style={{ marginTop: '1rem' }}>
              <label className="form-label">Extrahierter Text bereit für die Generierung</label>
              <textarea
                className="form-input"
                readOnly
                rows={5}
                value={formValues.uploadContext}
                style={{ backgroundColor: '#edf2f7', color: '#4a5568', cursor: 'not-allowed' }}
              />
              <button
                type="button"
                className="primary-button"
                style={{ marginTop: '1rem', backgroundColor: '#e53e3e' }}
                onClick={() => setUploadContext(undefined)}
                disabled={isSubmitting}
              >
                PDF-Kontext entfernen
              </button>
            </div>
          )}
        </div>

        <button
          type="submit"
          className="primary-button form-submit-button"
          disabled={isSubmitting || hasValidationErrors}
          aria-busy={isSubmitting}
        >
          {isSubmitting ? (
            <span className="form-submit-button__loading">
              <span className="form-button-spinner" aria-hidden="true" />
              Folien werden generiert …
            </span>
          ) : (
            'Folien generieren'
          )}
        </button>

        <ErrorBanner message={submitError} style={{ marginTop: '1rem' }} />
      </form>
    </div>
  );
};
