// src/validators/slidesGenerateValidator.ts
import type { SlidesGenerateRequest } from '../types/slides';
import { sanitizeToDigitsOnly } from '../utils/inputSanitizer';

export interface SlidesValidationErrors {
  topic?: string;
  slideCount?: string;
  language?: string;
  contextText?: string;
}

const VALID_LANGUAGES = ['de', 'en'] as const;

// Prüft ob ein Wert eine Ganzzahl ist (leere Strings werden separat behandelt)
const isInteger = (value: number | ''): boolean => {
  if (value === '') return true;
  return Number.isInteger(value);
};

// Konvertiert einen Wert sicher zu einer Zahl
const toNumber = (value: number | '' | undefined): number => {
  if (value === '' || value === undefined || Number.isNaN(Number(value))) return 0;
  return Number(value);
};

export const validate = (values: SlidesGenerateRequest): SlidesValidationErrors => {
  const errors: SlidesValidationErrors = {};

  // Thema: Pflicht, nach trim() 3–200 Zeichen
  const trimmedTopic = values.topic.trim();
  if (trimmedTopic.length === 0) {
    errors.topic = 'Thema ist erforderlich.';
  } else if (trimmedTopic.length < 3) {
    errors.topic = 'Thema muss mindestens 3 Zeichen lang sein.';
  } else if (trimmedTopic.length > 200) {
    errors.topic = 'Thema darf maximal 200 Zeichen lang sein.';
  }

  // Folienanzahl: Pflicht, Ganzzahl zwischen 5 und 30
  // sanitizeToDigitsOnly stellt sicher, dass nur Ziffern zur Bereichsprüfung herangezogen werden
  if (values.slideCount === '') {
    errors.slideCount = 'Anzahl der Folien ist erforderlich.';
  } else {
    const digitString = sanitizeToDigitsOnly(String(values.slideCount));
    const count = digitString !== '' ? toNumber(values.slideCount) : NaN;
    if (!isInteger(values.slideCount) || Number.isNaN(count)) {
      errors.slideCount = 'Die Anzahl der Folien muss eine Ganzzahl sein (keine Kommastellen).';
    } else if (count < 5) {
      errors.slideCount = 'Die Anzahl der Folien muss mindestens 5 betragen.';
    } else if (count > 30) {
      errors.slideCount = 'Die Anzahl der Folien darf maximal 30 betragen.';
    }
  }

  // Sprache: Pflicht, nur "de" oder "en"
  if (!values.language) {
    errors.language = 'Sprache ist erforderlich.';
  } else if (!(VALID_LANGUAGES as readonly string[]).includes(values.language)) {
    errors.language = 'Bitte wähle eine gültige Sprache (de oder en).';
  }

  // Kontexttext: optional, maximal 5.000 Zeichen
  if (values.contextText && values.contextText.length > 5000) {
    errors.contextText = 'Der Kontexttext darf maximal 5.000 Zeichen enthalten.';
  }

  return errors;
};
