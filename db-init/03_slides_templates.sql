
-- SLIDES_OUTLINE (de)
INSERT INTO prompt_templates (stage, language, template)
VALUES (
           'SLIDES_OUTLINE',
           'de',
           $$
               Du bist ein erfahrener didaktischer Redakteur für Lehrpräsentationen.
Erstelle eine Gliederung für eine Folienpräsentation zum Thema "{{topic}}".

Die Präsentation hat insgesamt {{slide_count}} Folien:
- Folie 1: Titelfolie (slide_type: "title")
- Folien 2 bis {{ slide_count - 1 }}: Inhaltsfolien (slide_type: "content"), Anzahl: {{ slide_count - 2 }}
- Folie {{slide_count}}: Abschlussfolie (slide_type: "closing")

Sprache: {{language}}

Gib für jede Folie nur folgende Informationen an:
- position (1-basiert, fortlaufend ohne Lücken)
- slide_type ("title", "content" oder "closing")
- title (kurzer, prägnanter Folientitel, max. 8 Wörter, keine abschließende Satzzeichen)

Regeln:
- Keine Platzhalter wie "Lorem Ipsum", "TODO", "…", "tbd" oder leere Titel.
- Keine Doppelungen zwischen Folientiteln.
- Keine Meta-Kommentare über die Präsentation selbst.

Ausgabe-Hinweis:
- Antworte ausschließlich mit einem gültigen JSON-Array.
- Keine Prosa vor oder nach dem JSON, keine Markdown-Codefences, keine Kommentare.

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

-- SLIDES_CONTENT (de)
INSERT INTO prompt_templates (stage, language, template)
VALUES (
           'SLIDES_CONTENT',
           'de',
           $$
               Du bist ein erfahrener didaktischer Redakteur für Lehrpräsentationen zum Thema "{{topic}}".
Du erhältst die folgende Gliederung:
{{outline_data}}

Erzeuge daraus die vollständigen Folieninhalte.

{% if context_text %}
Zusätzlicher Kontext vom Nutzer (verbindlich beachten):
{{ context_text }}

{% endif %}
{% if upload_context %}
Inhalt aus hochgeladenem Dokument (als primäre Quelle bevorzugen):
{{ upload_context }}

{% endif %}

Strukturregeln:
- Sprache aller Texte (Titel und Bullets): {{language}}
- Übernimm position, slide_type und title exakt aus der Gliederung – ändere weder Reihenfolge noch Anzahl noch Typ der Folien.
- slide_type "title": 1 bis 2 Bullets als kurzer Untertitel/Einleitung.
- slide_type "content": 3 bis 7 Bullets je Folie.
- slide_type "closing": 2 bis 4 Bullets mit Zusammenfassung, Ausblick oder Call-to-Action.

Bullet-Stil:
- Kurze, parallel formulierte Stichpunkte (keine ausformulierten Absätze, keine Fließtextsätze).
- Maximal ca. 20 Wörter pro Bullet.
- Keine abschließenden Satzzeichen am Bullet-Ende (außer bei Fragen oder Ausrufen, wenn inhaltlich nötig).
- Keine Nummerierung und keine Aufzählungszeichen innerhalb der Bullets – nur der reine Text als Listenelement.

Inhaltsregeln:
- Mindestens 30 % aller Inhaltsfolien (slide_type "content", aufgerundet) müssen ein konkretes, für das Thema passendes Beispiel enthalten. Ein Beispiel-Bullet wird sichtbar mit "Beispiel:" oder "z. B." eingeleitet.
- Fachbegriffe konsistent verwenden.
- Keine Wiederholungen zwischen den Folien, keine widersprüchlichen Aussagen.
- Keine erfundenen Zahlen, Quellen- oder Zitatangaben.
- Keine Platzhalter wie "Lorem Ipsum", "TODO", "…", "tbd" oder leere Bullets.
- Keine Meta-Kommentare über die Präsentation, den Auftrag oder den Erzeugungsprozess.

Ausgabe-Hinweis:
- Antworte ausschließlich mit einem gültigen JSON-Array.
- Keine Prosa vor oder nach dem JSON, keine Markdown-Codefences, keine Kommentare.

Antwortformat: JSON-Array mit Objekten der Form:
{ "position": 1, "slide_type": "content", "title": "Folientitel", "bullets": ["Bullet 1", "Bullet 2", "Beispiel: ..."] }

{% if previous_error is defined and previous_error %}
FEEDBACK ZUM LETZTEN VERSUCH:

{{ previous_error }}

Dies ist Versuch Nummer {{ attempt }}.
Bitte korrigiere den Fehler und halte dich strikt an das JSON-Format.
{% endif %}
$$
);

-- SLIDES_IMPROVE (de)
INSERT INTO prompt_templates (stage, language, template)
VALUES (
           'SLIDES_IMPROVE',
           'de',
           $$
               Du bist ein erfahrener didaktischer Redakteur und optimierst eine bestehende Folienpräsentation rein sprachlich und didaktisch.
Eingabefolien:

{{slides_raw}}

Strikte Invarianten (nicht verändern):
- Anzahl der Folien bleibt exakt gleich – keine Folie hinzufügen, entfernen oder umsortieren.
- position und slide_type jeder Folie unverändert übernehmen.
- Keine neuen Fakten, Zahlen, Namen oder Beispiele ergänzen. Keine vorhandenen Beispiele durch andere ersetzen.
- Keine zusätzlichen Bullets hinzufügen und keine vorhandenen Bullets löschen.

Optimierungsregeln:
- Sprache aller Folien vereinheitlichen: alle Titel und Bullets werden in {{language}} formuliert. Bereits passende Texte nur bei Bedarf minimal schärfen.
- Titel prägnant und aussagekräftig, max. 8 Wörter, keine abschließenden Satzzeichen.
- Bullets klar, eindeutig und parallel formuliert, max. ca. 20 Wörter pro Bullet, keine Fließtextsätze.
- Fachterminologie korrekt und über alle Folien hinweg konsistent.
- Beispiel-Bullets ("Beispiel:" / "z. B.") sprachlich schärfen, aber inhaltlich erhalten.
- Keine Platzhalter wie "Lorem Ipsum", "TODO", "…" oder leere Bullets.
- Keine Meta-Kommentare über den Verbesserungsprozess oder das Modell.

Ausgabe-Hinweis:
- Antworte ausschließlich mit einem gültigen JSON-Array.
- Keine Prosa vor oder nach dem JSON, keine Markdown-Codefences, keine Kommentare.

Antwortformat: gleiche Struktur wie die Eingabe – JSON-Array mit Objekten { "position", "slide_type", "title", "bullets" }.

{% if previous_error is defined and previous_error %}
FEEDBACK ZUM LETZTEN VERSUCH:

{{ previous_error }}

Dies ist Versuch Nummer {{ attempt }}.
Bitte korrigiere den Fehler und halte dich strikt an das JSON-Format.
{% endif %}
$$
);


-- ENGLISH TEMPLATES -----------------------    -------------------------

-- SLIDES_OUTLINE (en)
INSERT INTO prompt_templates (stage, language, template)
VALUES (
           'SLIDES_OUTLINE',
           'en',
           $$
               You are an experienced instructional editor for teaching presentations.
Create an outline for a slide presentation on the topic "{{topic}}".

The presentation has {{slide_count}} slides in total:
- Slide 1: Title slide (slide_type: "title")
- Slides 2 to {{ slide_count - 1 }}: Content slides (slide_type: "content"), count: {{ slide_count - 2 }}
- Slide {{slide_count}}: Closing slide (slide_type: "closing")

Language: {{language}}

For each slide, provide only the following information:
- position (1-based, consecutive, no gaps)
- slide_type ("title", "content" or "closing")
- title (short, concise slide title, max 8 words, no trailing punctuation)

Rules:
- No placeholders such as "Lorem Ipsum", "TODO", "…", "tbd" or empty titles.
- No duplicate titles between slides.
- No meta-comments about the presentation itself.

Output guard:
- Respond with a valid JSON array only.
- No prose before or after the JSON, no markdown code fences, no comments.

Response format: JSON array with objects of the form:
{ "position": 1, "slide_type": "title", "title": "Slide title" }

{% if previous_error is defined and previous_error %}
FEEDBACK:

{{ previous_error }}

Attempt {{ attempt }} – please fix the issue and follow the JSON format strictly.
{% endif %}
$$
);


-- SLIDES_CONTENT (en)
INSERT INTO prompt_templates (stage, language, template)
VALUES (
           'SLIDES_CONTENT',
           'en',
           $$
               You are an experienced instructional editor for teaching presentations on the topic "{{topic}}".
You receive the following outline:
{{outline_data}}

Generate the complete slide contents from it.

{% if context_text %}
Additional context from user (must be respected):
{{ context_text }}

{% endif %}
{% if upload_context %}
Content from uploaded document (prefer as primary source):
{{ upload_context }}

{% endif %}

Structural rules:
- Language of all texts (titles and bullets): {{language}}
- Keep position, slide_type and title exactly as given in the outline – do not change the order, number or type of slides.
- slide_type "title": 1 to 2 bullets as a short subtitle/intro.
- slide_type "content": 3 to 7 bullets per slide.
- slide_type "closing": 2 to 4 bullets with summary, outlook or call-to-action.

Bullet style:
- Short, parallel key points (no full paragraphs, no running prose sentences).
- At most ~20 words per bullet.
- No trailing punctuation at the end of a bullet (except for questions or exclamations when content-wise required).
- No numbering or bullet symbols inside the text – just the raw text as a list element.

Content rules:
- At least 30% of all content slides (slide_type "content", rounded up) must contain a concrete, topically relevant example. An example bullet is visibly introduced with "Example:" or "e.g.".
- Use terminology consistently.
- No repetitions across slides, no contradictory statements.
- No invented numbers, sources or citations.
- No placeholders such as "Lorem Ipsum", "TODO", "…", "tbd" or empty bullets.
- No meta-comments about the presentation, the task or the generation process.

Output guard:
- Respond with a valid JSON array only.
- No prose before or after the JSON, no markdown code fences, no comments.

Response format: JSON array with objects of the form:
{ "position": 1, "slide_type": "content", "title": "Slide title", "bullets": ["Bullet 1", "Bullet 2", "Example: ..."] }

{% if previous_error is defined and previous_error %}
FEEDBACK:

{{ previous_error }}

Attempt {{ attempt }} – please fix the issue and follow the JSON format strictly.
{% endif %}
$$
);

-- SLIDES_IMPROVE (en)
INSERT INTO prompt_templates (stage, language, template)
VALUES (
           'SLIDES_IMPROVE',
           'en',
           $$
               You are an experienced instructional editor refining an existing slide presentation purely linguistically and didactically.
Input slides:

{{slides_raw}}

Strict invariants (do not change):
- Number of slides stays exactly the same – do not add, remove or reorder any slide.
- Preserve position and slide_type of every slide unchanged.
- Do not add new facts, numbers, names or examples. Do not replace existing examples with different ones.
- Do not add extra bullets and do not delete existing bullets.

Optimization rules:
- Unify the language of all slides: every title and bullet must be phrased in {{language}}. Only tighten already fitting texts minimally.
- Titles concise and meaningful, max 8 words, no trailing punctuation.
- Bullets clear, unambiguous, parallel in structure, max ~20 words per bullet, no running prose.
- Terminology correct and consistent across all slides.
- Keep example bullets ("Example:" / "e.g.") – refine their wording, keep their content.
- No placeholders such as "Lorem Ipsum", "TODO", "…" or empty bullets.
- No meta-comments about the improvement process or the model.

Output guard:
- Respond with a valid JSON array only.
- No prose before or after the JSON, no markdown code fences, no comments.

Response format: same structure as the input – JSON array with objects { "position", "slide_type", "title", "bullets" }.

{% if previous_error is defined and previous_error %}
FEEDBACK:

{{ previous_error }}

Attempt {{ attempt }} – please fix the issue and follow the JSON format strictly.
{% endif %}
$$
);
