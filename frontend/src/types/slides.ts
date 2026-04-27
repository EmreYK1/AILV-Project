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