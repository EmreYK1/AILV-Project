// src/services/slidesApi.ts
// API-Calls für Folien: generieren, speichern und archivierte Decks laden.

import type {
  SlidesGenerateRequest,
  SlidesGenerateResponse,
  FinalizeSlidesRequest,
  FinalizeSlidesResponse,
  DeckListResponse,
  DeckDetailResponse,
  DeckDeleteResponse,
} from '../types/slides';
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

export async function finalizeSlides(
  request: FinalizeSlidesRequest
): Promise<FinalizeSlidesResponse> {
  return await apiCall<FinalizeSlidesResponse>(
    `${API_BASE_URL}/api/slides/finalize`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    }
  );
}

export async function listDecks(): Promise<DeckListResponse> {
  return await apiCall<DeckListResponse>(
    `${API_BASE_URL}/api/slides/archive`,
    {
      method: 'GET',
    }
  );
}

export async function getDeck(deckId: string): Promise<DeckDetailResponse> {
  return await apiCall<DeckDetailResponse>(
    `${API_BASE_URL}/api/slides/archive/${deckId}`,
    {
      method: 'GET',
    }
  );
}

export async function updateDeck(deckId: string, slides: SlideDraft[]): Promise<DeckDetailResponse> {
  return await apiCall<DeckDetailResponse>(
    `${API_BASE_URL}/api/slides/archive/${deckId}`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ slides }),
    }
  );
}

export async function deleteDeck(deckId: string): Promise<DeckDeleteResponse> {
  return await apiCall<DeckDeleteResponse>(
    `${API_BASE_URL}/api/slides/archive/${deckId}`,
    {
      method: 'DELETE',
    }
  );
}
