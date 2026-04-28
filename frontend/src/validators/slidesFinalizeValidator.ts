// src/validators/slidesFinalizeValidator.ts

export const MIN_DECK_NAME_LENGTH = 3;
export const MAX_DECK_NAME_LENGTH = 120;

export const validateDeckName = (name: string): string | null => {
  const trimmed = name.trim();
  
  if (trimmed.length === 0) {
    return 'Der Name des Decks darf nicht leer sein.';
  }
  if (trimmed.length < MIN_DECK_NAME_LENGTH) {
    return `Der Name muss mindestens ${MIN_DECK_NAME_LENGTH} Zeichen lang sein.`;
  }
  if (trimmed.length > MAX_DECK_NAME_LENGTH) {
    return `Der Name darf maximal ${MAX_DECK_NAME_LENGTH} Zeichen lang sein.`;
  }
  
  return null;
};
