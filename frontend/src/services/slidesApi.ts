// src/services/slidesApi.ts
// API-Calls für die Folien-Generierung.

import type { SlidesGenerateRequest, SlidesGenerateResponse } from '../types/slides';
import { toNumber } from '../utils/numberUtils';
import { apiCall, API_BASE_URL } from './apiClient';

export async function generateSlides(
  request: SlidesGenerateRequest
): Promise<SlidesGenerateResponse> {
  const payload = {
    topic: request.topic,
    language: request.language,
    slide_count: toNumber(request.slideCount),
    ...(request.contextText && { context_text: request.contextText }),
    ...(request.uploadContext && { upload_context: request.uploadContext }),
  };

  return await apiCall<SlidesGenerateResponse>(
    `${API_BASE_URL}/api/slides/generate`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    }
  );
}
