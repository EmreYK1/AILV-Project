// src/components/shared/ConfirmDialog.tsx
// Wiederverwendbarer Bestätigungsdialog für destruktive Aktionen (Logout, Löschen, etc.)

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmLabel,
  cancelLabel = 'Abbrechen',
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div
      className="confirm-dialog-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      onClick={onCancel}
    >
      <div
        className="confirm-dialog"
        onClick={function (e) { e.stopPropagation(); }}
      >
        <div className="confirm-dialog-body">
          <h2 id="confirm-dialog-title" className="confirm-dialog-title">{title}</h2>
          <p className="confirm-dialog-description">{description}</p>
        </div>
        <div className="confirm-dialog-footer">
          <button
            type="button"
            className="confirm-dialog-cancel"
            onClick={onCancel}
            disabled={isLoading}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className="confirm-dialog-confirm"
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? 'Wird ausgeführt…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
