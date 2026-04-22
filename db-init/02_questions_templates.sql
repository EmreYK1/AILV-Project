-- SKELETON
INSERT INTO prompt_templates (stage, language, template)
VALUES (
           'SKELETON',
           'de',
           $$
               Erstelle ein Gerüst für {{count}} Prüfungsfragen zum Thema "{{topic}}".

Gib für jede Frage nur folgende Informationen an:
- type (einer der folgenden: {{types}})
- difficulty (easy, medium oder hard), entsprechend der Verteilung:
  easy: {{difficulty_distribution.easy}}%
  medium: {{difficulty_distribution.medium}}%
  hard: {{difficulty_distribution.hard}}%

Keine vollständigen Fragen erzeugen, nur ein Strukturgerüst!
Antwortformat: JSON-Array mit Objekten der Form:
{ "type": "MCQ", "difficulty": "easy"}

Sprache: {{language}}.

{% if previous_error is defined and previous_error %}
FEEDBACK ZUM LETZTEN VERSUCH:

{{ previous_error }}

Dies ist Versuch Nummer {{ attempt }}.
Bitte korrigiere den Fehler und halte dich strikt an das JSON-Format.
{% endif %}
$$
);

-- CONTENT
INSERT INTO prompt_templates (stage, language, template)
VALUES (
           'CONTENT',
           'de',
           $$
               Du erhältst das folgende Rohgerüst für Prüfungsfragen:
{{skeleton_data}}

Erzeuge daraus vollständige Prüfungsfragen zum Thema "{{topic}}".

{% if context_text %}
Zusätzlicher Kontext vom Nutzer:
{{ context_text }}

{% endif %}
{% if upload_context %}
Inhalt aus hochgeladenem Dokument:
{{ upload_context }}

{% endif %}

Regeln:
- Schreibe jede Frage in der Sprache: {{language}}
- type bestimmt das Format:
  - MCQ: 1 Frage + 4-6 Antwortoptionen, genau 1 richtig. Die rationale enthält eine Begründung, warum die richtige Antwort korrekt ist.
  - Kurzantwort: 1 Frage + 1 kurze, korrekte Antwort. Die korrekte Antwort wird im Feld "answer" gespeichert.
  - TRUE_FALSE: 1 Frage + 2 Antwortoptionen(TRUE und FALSE), genau 1 richtig. Die rationale enthält eine Begründung, warum die richtige Antwort korrekt ist.
- difficulty beachten (Komplexität & Umfang)

Antwortformat: JSON-Array mit Objekten:
- MCQ: { "stem": "Fragetext...", "type": "MCQ", "choices": ["A","B","C","D"], "correct_index": 2, "rationale": "Begründung...", "difficulty": "..."}
- Kurzantwort: { "stem": "Fragetext...", "type": "SHORT_ANSWER", "answer": "Korrekte Antwort hier", "difficulty": "..."}

{% if previous_error is defined and previous_error %}
FEEDBACK ZUM LETZTEN VERSUCH:

{{ previous_error }}

Dies ist Versuch Nummer {{ attempt }}.
Bitte korrigiere den Fehler und halte dich strikt an das JSON-Format.
{% endif %}
$$
);

-- IMPROVE
INSERT INTO prompt_templates (stage, language, template)
VALUES (
           'IMPROVE',
           'de',
           $$
               Verbessere die folgenden Prüfungsfragen sprachlich und didaktisch, ohne deren Kern zu verändern:

{{questions_raw}}

Optimierungsregeln:
- klare, eindeutige Formulierungen
- Fachterminologie korrekt und konsistent
- MCQ-Optionen plausibel und unterscheidbar
- Rationale präzisieren, kurz und evidenzbasiert
- Keine Hinweise auf internen Bewertungsprozess

Antwortformat: gleiche Struktur wie Eingabe (JSON-Array).

{% if previous_error is defined and previous_error %}
FEEDBACK ZUM LETZTEN VERSUCH:

{{ previous_error }}

Dies ist Versuch Nummer {{ attempt }}.
Bitte korrigiere den Fehler und halte dich strikt an das JSON-Format.
{% endif %}
$$
);

-- ENGLISH TEMPLATES ----------------------------------------

-- SKELETON (en)
INSERT INTO prompt_templates (stage, language, template)
VALUES (
           'SKELETON',
           'en',
           $$
               Create a skeleton for {{count}} exam questions on the topic "{{topic}}".

For each question, provide only the following information:
- type (one of the following: {{types}})
- difficulty (easy, medium or hard), according to the distribution:
  easy: {{difficulty_distribution.easy}}%
  medium: {{difficulty_distribution.medium}}%
  hard: {{difficulty_distribution.hard}}%

Do not generate complete questions, only a structural skeleton!
           Response format: JSON array with objects of the form:
       { "type": "MCQ", "difficulty": "easy"}

Language: {{language}}.

{% if previous_error is defined and previous_error %}
FEEDBACK:
{{ previous_error }}

Attempt {{ attempt }} – please fix the issue.
{% endif %}
$$
);

-- CONTENT (en)
INSERT INTO prompt_templates (stage, language, template)
VALUES (
           'CONTENT',
           'en',
           $$
               You receive the following raw skeleton for exam questions:
{{skeleton_data}}

Generate complete exam questions from it on the topic "{{topic}}".

{% if context_text %}
Additional context from user:
{{ context_text }}

{% endif %}
{% if upload_context %}
Input from uploaded document:
{{ upload_context }}

{% endif %}

Rules:
- Write each question in the language: {{language}}
- type determines the format:
  - MCQ: 1 question + 4-6 answer options, exactly 1 correct. The rationale contains an explanation of why the correct answer is right.
  - Short answer: 1 question + 1 short, correct answer. The correct answer is stored in the "answer" field.
  - TRUE_FALSE: 1 question + 2 answer options (TRUE and FALSE), exactly 1 correct. The rationale contains an explanation of why the correct answer is right.
- Consider difficulty (complexity & scope)

Response format: JSON array with objects:
- MCQ: { "stem": "Question text...", "type": "MCQ", "choices": ["A","B","C","D"], "correct_index": 2, "rationale": "Explanation...", "difficulty": "..."}
- Short answer: { "stem": "Question text...", "type": "SHORT_ANSWER", "answer": "Correct answer here", "difficulty": "..."}

{% if previous_error is defined and previous_error %}
FEEDBACK:
{{ previous_error }}

Attempt {{ attempt }} – please fix the issue.
{% endif %}
$$
);

-- IMPROVE (en)
INSERT INTO prompt_templates (stage, language, template)
VALUES (
           'IMPROVE',
           'en',
           $$
               Improve the following exam questions linguistically and didactically without changing their core:

{{questions_raw}}

Optimization rules:
- clear, unambiguous formulations
- correct and consistent terminology
- plausible and distinguishable MCQ options
- refine rationale, brief and evidence-based
        - No hints about internal evaluation process

               Response format: same structure as input (JSON array).

               {% if previous_error is defined and previous_error %}
               FEEDBACK:
               {{ previous_error }}

               Attempt {{ attempt }} – please fix the issue.
{% endif %}
$$
);
