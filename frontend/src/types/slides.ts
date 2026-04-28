import type { Language } from './generate';

export interface SlidesGenerateRequest {
  topic: string;
  language: Language;
  slideCount: number | '';
  contextText?: string;
  uploadContext?: string;
}

export interface SlidesGenerateResponse {
  status: string;
  request_id: string;
  slides: SlideDraft[];
}

export interface SlideDraft {
  position: number;
  slide_type: string;
  title: string;
  bullets: string[];
}

export interface FinalizeSlidesRequest {
  request_id: string;
  name: string;
}

export interface FinalizeSlidesResponse {
  deck_id: string;
  saved_slides_count: number;
}