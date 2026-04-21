import { describe, it, expect } from 'vitest';
import { validate } from '../../validators/slidesGenerateValidator';
import type { SlidesGenerateRequest } from '../../types/slides';

const VALID_BASE: SlidesGenerateRequest = {
  topic: 'Einführung in TypeScript',
  slideCount: 10,
  language: 'de',
};

describe('slidesGenerateValidator – topic', () => {
  it('meldet Fehler bei leerem Thema', () => {
    expect(validate({ ...VALID_BASE, topic: '' }).topic).toBe('Thema ist erforderlich.');
  });

  it('meldet Fehler bei Thema kürzer als 3 Zeichen (nach trim)', () => {
    expect(validate({ ...VALID_BASE, topic: 'ab' }).topic).toBe(
      'Thema muss mindestens 3 Zeichen lang sein.'
    );
  });

  it('akzeptiert ein Thema mit genau 3 Zeichen (Untergrenze)', () => {
    expect(validate({ ...VALID_BASE, topic: 'abc' }).topic).toBeUndefined();
  });

  it('meldet Fehler bei Thema länger als 200 Zeichen', () => {
    expect(validate({ ...VALID_BASE, topic: 'a'.repeat(201) }).topic).toBe(
      'Thema darf maximal 200 Zeichen lang sein.'
    );
  });
});

describe('slidesGenerateValidator – slideCount', () => {
  it('meldet Fehler bei leerem slideCount', () => {
    expect(validate({ ...VALID_BASE, slideCount: '' }).slideCount).toBe(
      'Anzahl der Folien ist erforderlich.'
    );
  });

  it('akzeptiert genau 5 Folien (Untergrenze)', () => {
    expect(validate({ ...VALID_BASE, slideCount: 5 }).slideCount).toBeUndefined();
  });

  it('meldet Fehler bei slideCount kleiner als 5', () => {
    expect(validate({ ...VALID_BASE, slideCount: 4 }).slideCount).toBe(
      'Die Anzahl der Folien muss mindestens 5 betragen.'
    );
  });

  it('meldet Fehler bei slideCount größer als 30', () => {
    expect(validate({ ...VALID_BASE, slideCount: 31 }).slideCount).toBe(
      'Die Anzahl der Folien darf maximal 30 betragen.'
    );
  });

  it('meldet Fehler bei Dezimalzahl (keine Ganzzahl)', () => {
    expect(validate({ ...VALID_BASE, slideCount: 10.5 }).slideCount).toBe(
      'Die Anzahl der Folien muss eine Ganzzahl sein (keine Kommastellen).'
    );
  });
});

describe('slidesGenerateValidator – language', () => {
  it('akzeptiert "de"', () => {
    expect(validate({ ...VALID_BASE, language: 'de' }).language).toBeUndefined();
  });

  it('akzeptiert "en"', () => {
    expect(validate({ ...VALID_BASE, language: 'en' }).language).toBeUndefined();
  });

  it('meldet Fehler bei ungültiger Sprache', () => {
    expect(validate({ ...VALID_BASE, language: 'fr' as 'de' | 'en' }).language).toBe(
      'Bitte wähle eine gültige Sprache (de oder en).'
    );
  });
});

describe('slidesGenerateValidator – contextText', () => {
  it('akzeptiert genau 5000 Zeichen (Obergrenze)', () => {
    expect(validate({ ...VALID_BASE, contextText: 'x'.repeat(5000) }).contextText).toBeUndefined();
  });

  it('meldet Fehler bei Kontexttext länger als 5000 Zeichen', () => {
    expect(validate({ ...VALID_BASE, contextText: 'x'.repeat(5001) }).contextText).toBe(
      'Der Kontexttext darf maximal 5.000 Zeichen enthalten.'
    );
  });
});

describe('slidesGenerateValidator – gültige Gesamteingabe', () => {
  it('gibt keine Fehler bei vollständig korrekten Werten zurück', () => {
    expect(
      validate({
        topic: 'Maschinelles Lernen',
        slideCount: 20,
        language: 'en',
        contextText: 'Etwas Kontext.',
      })
    ).toEqual({});
  });
});
