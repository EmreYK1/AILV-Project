import { useState, useEffect } from 'react';
import { Modal } from '../shared/Modal';
import { validateDeckName, MAX_DECK_NAME_LENGTH } from '../../validators/slidesFinalizeValidator';

interface SlidesSaveDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string) => void;
  defaultTopic: string;
  isSaving?: boolean;
}

export function SlidesSaveDialog({
  isOpen,
  onClose,
  onSave,
  defaultTopic,
  isSaving = false,
}: SlidesSaveDialogProps) {
  const [name, setName] = useState(defaultTopic);

  // Set the default topic whenever the dialog is opened
  useEffect(() => {
    if (isOpen) {
      setName(defaultTopic);
    }
  }, [isOpen, defaultTopic]);

  const validationError = validateDeckName(name);
  const isValid = validationError === null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isValid && !isSaving) {
      onSave(name.trim());
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      title="Folien speichern"
      onClose={onClose}
      closeOnOverlayClick={!isSaving}
      closeOnEscape={!isSaving}
    >
      <form onSubmit={handleSubmit} className="slides-save-dialog-form">
        <div className="form-group">
          <label htmlFor="deckName" className="form-label">
            Name des Folien-Decks
          </label>
          <input
            type="text"
            id="deckName"
            className={`form-input${validationError && name.length > 0 ? ' form-input--error' : ''}`}
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isSaving}
            autoFocus
            maxLength={MAX_DECK_NAME_LENGTH}
          />
          <div className="slides-save-dialog-help">
            {validationError && name.length > 0 ? (
              <span className="form-error-message">{validationError}</span>
            ) : (
              <span className="form-helper">
                Geben Sie einen aussagekräftigen Namen ein, um das Deck später wiederzufinden.
              </span>
            )}
            <span className="slides-save-dialog-counter">
              {name.length}/{MAX_DECK_NAME_LENGTH} Zeichen
            </span>
          </div>
        </div>

        <div className="questions-modal-actions slides-save-dialog-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={onClose}
            disabled={isSaving}
          >
            Abbrechen
          </button>
          <button
            type="submit"
            className="primary-button"
            disabled={!isValid || isSaving}
          >
            {isSaving ? 'Wird gespeichert...' : 'Speichern'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
