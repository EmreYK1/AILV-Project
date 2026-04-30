import React from 'react';
import { GenerateForm, QuestionsList, QuestionsStats } from '../../components/generate';
import { ErrorBanner, Modal, GenerationSkeleton } from '../../components/shared';
import { useQuestionWorkflow } from '../../hooks/questions/useQuestionWorkflow';

export const GeneratePage: React.FC = () => {
  const {
    questions,
    errorMessage,
    successMessage,
    isLoading,
    handleFormSubmit,
    dismissResults,
    handleQuestionChange,
    handleFinalizeQuestions,
  } = useQuestionWorkflow();

  // Modal ist geöffnet, sobald Fragen vorliegen ODER noch geladen wird
  // (damit das Skeleton im Modal sichtbar ist).
  const isModalOpen = questions.length > 0 || (isLoading && questions.length === 0 && !errorMessage);

  // Zeigt Skeleton nur, wenn gerade geladen wird UND noch keine Fragen da sind
  const showSkeleton = isLoading && questions.length === 0;

  return (
    <div className="page">
      <h1 className="page-title">Fragen generieren</h1>
      <p className="page-description">
        Hier können Sie das Eingabeformular für die Generierung von Prüfungsfragen verwenden.
        Geben Sie Ihre Anforderungen ein und lassen Sie die KI passende Fragen erstellen.
      </p>

      <div className="page-form">
        <GenerateForm
          onSubmit={handleFormSubmit}
          isLoading={isLoading}
          submitError={!isModalOpen ? errorMessage : null}
        />
      </div>

      <Modal isOpen={isModalOpen} title="Generierte Fragen" onClose={dismissResults}>
        {showSkeleton ? (
          <GenerationSkeleton
            count={3}
            message="KI generiert Prüfungsfragen …"
          />
        ) : (
          <>
            <ErrorBanner message={errorMessage} />

            <QuestionsStats questions={questions} />

            <QuestionsList
              questions={questions}
              onQuestionChange={handleQuestionChange}
            />

            <div className="questions-modal-actions">
              {successMessage && (
                <div
                  className="success-banner success-banner--modal"
                  role="alert"
                >
                  <strong>Erfolg:</strong> {successMessage}
                </div>
              )}
              <button
                type="button"
                className="primary-button"
                onClick={handleFinalizeQuestions}
                disabled={isLoading || Boolean(successMessage)}
              >
                {isLoading ? 'Wird gespeichert...' : 'Fragen speichern'}
              </button>
              <button
                type="button"
                className="secondary-button"
                onClick={dismissResults}
                disabled={isLoading}
              >
                Schließen
              </button>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
};
