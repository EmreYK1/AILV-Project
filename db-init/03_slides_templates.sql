--SLIDES_OUTLINE

INSERT INTO prompt_templates (stage, language, template)
VALUES (
           'SLIDES_OUTLINE',
           'de',
           $$
               Erstelle eine Gliederung für eine Folienpräsentation zum Thema "{{topic}}".

Die Präsentation hat insgesamt {{slide_count}} Folien:
- Folie 1: Titelfolie (slide_type: "title")
- Folien 2 bis {{slide_count - 1}}: Inhaltsfolien (slide_type: "content"), Anzahl: {{slide_count - 2}}
- Folie {{slide_count}}: Abschlussfolie (slide_type: "closing")

Sprache: {{language}}

Gib für jede Folie nur folgende Informationen an:
- position (1-basiert)
- slide_type ("title", "content" oder "closing")
- title (kurzer, prägnanter Folientitel)

Antwortformat: JSON-Array mit Objekten der Form:
{ "position": 1, "slide_type": "title", "title": "Folientitel" }

{% if previous_error is defined and previous_error %}
FEEDBACK ZUM LETZTEN VERSUCH:

{{ previous_error }}

Dies ist Versuch Nummer {{ attempt }}.
Bitte korrigiere den Fehler und halte dich strikt an das JSON-Format.
{% endif %}
$$
);

INSERT INTO prompt_templates (stage, language, template)
VALUES (
           'SLIDES_OUTLINE',
           'en',
           $$
               Create an outline for a slide presentation on the topic "{{topic}}".

The presentation has {{slide_count}} slides in total:
- Slide 1: Title slide (slide_type: "title")
- Slides 2 to {{slide_count - 1}}: Content slides (slide_type: "content"), count: {{slide_count - 2}}
- Slide {{slide_count}}: Closing slide (slide_type: "closing")

Language: {{language}}

For each slide, provide only the following information:
- position (1-based)
- slide_type ("title", "content" or "closing")
- title (short, concise slide title)

Response format: JSON array with objects of the form:
{ "position": 1, "slide_type": "title", "title": "Slide title" }

{% if previous_error is defined and previous_error %}
FEEDBACK:

{{ previous_error }}

Attempt {{ attempt }} – please fix the issue and follow the JSON format strictly.
{% endif %}
$$
);