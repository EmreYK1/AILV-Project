// src/hooks/useSlidesGenerateForm.ts
// Verwaltet State, Validierung und Submit für das Folien-Generierungsformular.

import type { ChangeEvent } from 'react';
import type { Language } from '../types/generate';
import type {
  SlidesGenerateRequest,
  SlidesGenerateResponse,
} from '../types/slides';
import {
  validate,
  type SlidesValidationErrors,
} from '../validators/slidesGenerateValidator';
import { useFormWithTouchedValidation } from '../utils/useFormWithTouchedValidation';
import { generateSlides } from '../services/slidesApi';
import { getUserFriendlyMessage } from '../error-handling/errorMappers';
import { sanitizeToDigitsOnly } from '../utils/inputSanitizer';

export interface SlidesFormValues {
  topic: string;
  slideCount: string;
  language: Language;
  contextText: string;
  uploadContext: string;
}

const INITIAL_VALUES: SlidesFormValues = {
  topic: '',
  slideCount: '',
  language: 'de',
  contextText: '',
  uploadContext: '',
};

// Wandelt den internen Formular-State in das vom Validator/API erwartete Format.
const toApiRequest = (values: SlidesFormValues): SlidesGenerateRequest => {
  const trimmedContext = values.contextText.trim();
  return {
    topic: values.topic,
    slideCount: values.slideCount === '' ? '' : Number(values.slideCount),
    language: values.language,
    ...(trimmedContext ? { contextText: trimmedContext } : {}),
    ...(values.uploadContext ? { uploadContext: values.uploadContext } : {}),
  };
};

const validateFormValues = (
  values: SlidesFormValues,
): SlidesValidationErrors => validate(toApiRequest(values));

interface UseSlidesGenerateFormProps {
  onSuccess?: (response: SlidesGenerateResponse) => void;
}

export interface UseSlidesGenerateFormReturn {
  formValues: SlidesFormValues;
  errors: SlidesValidationErrors;
  submitError: string | null;
  isSubmitting: boolean;
  hasValidationErrors: boolean;
  handleInputChange: (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => void;
  handleBlur: (
    event: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => void;
  handleSubmit: (event: React.FormEvent<HTMLFormElement>) => Promise<void>;
  setUploadContext: (value: string | undefined) => void;
}

export function useSlidesGenerateForm({
  onSuccess,
}: UseSlidesGenerateFormProps = {}): UseSlidesGenerateFormReturn {
  const base = useFormWithTouchedValidation<SlidesFormValues, SlidesValidationErrors>(
    INITIAL_VALUES,
    validateFormValues,
    async (values, setSubmitError, setIsLoading) => {
      setIsLoading(true);
      try {
        const response = await generateSlides(toApiRequest(values));
        onSuccess?.(response);
      } catch (error) {
        // ApiError/NetworkError/AppError werden hier in menschenlesbare Texte übersetzt
        setSubmitError(getUserFriendlyMessage(error));
      } finally {
        setIsLoading(false);
      }
    },
  );

  // slideCount: auf reine Ziffern beschränken, bevor der State aktualisiert wird.
  // Die restlichen Felder können den generischen Change-Handler nutzen.
  const handleInputChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = event.target;

    if (name === 'slideCount') {
      base.setFieldValue('slideCount', sanitizeToDigitsOnly(value));
      return;
    }

    base.handleInputChange(event);
  };

  // Wird von der PdfUpload-Komponente aufgerufen, sobald der Text extrahiert ist.
  const setUploadContext = (value: string | undefined) => {
    base.setFieldValue('uploadContext', value ?? '');
  };

  return {
    formValues: base.formValues,
    errors: base.errors,
    submitError: base.submitError,
    isSubmitting: base.isLoading,
    hasValidationErrors: Object.keys(base.errors).length > 0,
    handleInputChange,
    handleBlur: base.handleBlur,
    handleSubmit: base.handleSubmit,
    setUploadContext,
  };
}
