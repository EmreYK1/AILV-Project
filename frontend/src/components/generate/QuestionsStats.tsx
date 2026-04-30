// src/components/generate/QuestionsStats.tsx
// Statistik-Leiste: zeigt Zusammensetzung der generierten Fragen (Anzahl, Typen, Schwierigkeit)

import React from 'react';
import type { GeneratedQuestion } from '../../types/generatedQuestion';
import type { QuestionType } from '../../types/generate';
import { getQuestionTypeLabel } from '../../constants/formConstants';

interface QuestionsStatsProps {
  questions: GeneratedQuestion[];
}

export const QuestionsStats: React.FC<QuestionsStatsProps> = ({ questions }) => {
  if (questions.length === 0) return null;

  // Schwierigkeit zählen
  const difficultyCount = { easy: 0, medium: 0, hard: 0 };
  // Typen zählen
  const typeCount: Record<string, number> = {};

  for (const q of questions) {
    difficultyCount[q.difficulty] = (difficultyCount[q.difficulty] || 0) + 1;
    typeCount[q.type] = (typeCount[q.type] || 0) + 1;
  }

  const total = questions.length;
  const easyPct = Math.round((difficultyCount.easy / total) * 100);
  const mediumPct = Math.round((difficultyCount.medium / total) * 100);
  const hardPct = Math.round((difficultyCount.hard / total) * 100);

  return (
    <div className="questions-stats">
      <div className="questions-stats__header">
        <span className="questions-stats__total">
          <strong>{total}</strong> {total === 1 ? 'Frage' : 'Fragen'}
        </span>
        
        <div className="questions-stats__types">
          {Object.entries(typeCount).map(([type, count]) => (
            <span key={type} className="questions-stats__type-chip">
              {count}x {getQuestionTypeLabel(type as QuestionType)}
            </span>
          ))}
        </div>
      </div>

      <div className="questions-stats__difficulty" title="Schwierigkeitsverteilung (Einfach / Mittel / Schwer)">
        <div className="questions-stats__bar">
          {difficultyCount.easy > 0 && (
            <div
              className="questions-stats__bar-segment questions-stats__bar-segment--easy"
              style={{ width: `${easyPct}%` }}
              title={`Einfach: ${difficultyCount.easy}`}
            />
          )}
          {difficultyCount.medium > 0 && (
            <div
              className="questions-stats__bar-segment questions-stats__bar-segment--medium"
              style={{ width: `${mediumPct}%` }}
              title={`Mittel: ${difficultyCount.medium}`}
            />
          )}
          {difficultyCount.hard > 0 && (
            <div
              className="questions-stats__bar-segment questions-stats__bar-segment--hard"
              style={{ width: `${hardPct}%` }}
              title={`Schwer: ${difficultyCount.hard}`}
            />
          )}
        </div>
      </div>
    </div>
  );
};
