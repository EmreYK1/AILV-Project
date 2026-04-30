// src/components/shared/PdfUpload.tsx
// Drag-and-Drop PDF-Upload Zone mit visuellem Feedback
import React, { useRef, useState } from 'react';
import { usePdfUpload } from '../../hooks/shared/usePdfUpload';
import { ErrorBanner } from './ErrorBanner';

interface PdfUploadProps {
  onExtractedText: (text: string) => void;
}

export const PdfUpload: React.FC<PdfUploadProps> = ({ onExtractedText }) => {
  const { file, loading, error, wasTruncated, handleFileChange } = usePdfUpload({
    onExtractedText,
  });

  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === 'application/pdf') {
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(droppedFile);
      if (inputRef.current) {
        inputRef.current.files = dataTransfer.files;
      }
      // Call the handler directly with a mock event
      handleFileChange({
        target: { files: dataTransfer.files }
      } as unknown as React.ChangeEvent<HTMLInputElement>);
    }
  }

  function handleZoneClick() {
    inputRef.current?.click();
  }

  const hasFile = Boolean(file);

  return (
    <div className="pdf-upload-container">
      <ErrorBanner message={error} />
      {wasTruncated && (
        <div className="warning-banner" role="status">
          Der PDF-Text wurde auf 5.000 Zeichen gekürzt.
        </div>
      )}

      {/* Verstecktes File-Input */}
      <input
        ref={inputRef}
        id="pdf-upload"
        type="file"
        accept="application/pdf"
        onChange={handleFileChange}
        disabled={loading}
        className="pdf-upload-hidden-input"
        tabIndex={-1}
        aria-hidden="true"
      />

      {/* Drag & Drop Zone */}
      <button
        type="button"
        className={
          'pdf-drop-zone' +
          (isDragOver ? ' pdf-drop-zone--drag-over' : '') +
          (hasFile && !error ? ' pdf-drop-zone--has-file' : '') +
          (loading ? ' pdf-drop-zone--loading' : '')
        }
        onClick={handleZoneClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        disabled={loading}
        aria-label="PDF-Datei hochladen"
      >
        {loading ? (
          <div className="pdf-drop-zone__content">
            <span className="pdf-drop-zone__spinner" aria-hidden="true" />
            <span className="pdf-drop-zone__text">Text wird extrahiert …</span>
          </div>
        ) : hasFile && !error ? (
          <div className="pdf-drop-zone__content">
            <svg className="pdf-drop-zone__icon pdf-drop-zone__icon--file" xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
            <span className="pdf-drop-zone__filename">{file!.name}</span>
            <span className="pdf-drop-zone__hint">Erfolgreich extrahiert. Klicken zum Ändern.</span>
          </div>
        ) : (
          <div className="pdf-drop-zone__content">
            <svg className="pdf-drop-zone__icon" xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <span className="pdf-drop-zone__text">PDF hierher ziehen oder klicken</span>
            <span className="pdf-drop-zone__hint">Optional: Kontext für die Generierung (max 5000 Zeichen)</span>
          </div>
        )}
      </button>
    </div>
  );
};
