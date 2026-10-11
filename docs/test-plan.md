# Testplan für kritische Backend-Abläufe

## 1. Ziel, Umfang und Analysegrundlage

Dieser Plan priorisiert die nächsten Test- und Refactoring-Arbeiten nach Risiko und Nutzen. Er dokumentiert den bestehenden Code. Vorgeschlagene Tests und Entkopplungen sind **noch nicht implementiert**. Produktionslogik, Konfiguration und Datenbankschema bleiben in diesem Task unverändert.

- Analysestand: 11.10.2026, Commit `f98e86fad07812393ab1312b564aac15d67bbe35`.
- Methode: statische Analyse der Routen, Services, Validatoren, Modelle, Repositories, SQL-Initialisierung und Container-Konfiguration. Keine laufende Produktionsumgebung oder externen Dienste verwendet.

**Testarten:** Unit Tests prüfen Regeln und Ablaufentscheidungen isoliert mit kontrollierten Abhängigkeiten. Integration Tests prüfen echte PostgreSQL-Abfragen und Transaktionen, HTTP-Verträge oder die Zusammenarbeit mit Export-/PDF-Bibliotheken. LLM und SMTP werden in der regulären Suite ersetzt. Echte externe Vertragstests laufen separat.

**Prioritäten:** Die folgenden Stufen zeigen, welche Bereiche zuerst getestet werden sollen:

- **P0 (zuerst testen):** Schutz vor Zugriff auf fremde Benutzerdaten, Verlust oder falscher Speicherung von Daten und Ausfall wichtiger Funktionen.
- **P1 (danach testen):** Fehlerbehandlung, Qualität der Ergebnisse, zuverlässiger Betrieb und Exporte.
- **P2 (ergänzend testen):** Geschwindigkeit und Darstellung.

Die Einstufung richtet sich danach, wie schwer die Folgen eines Fehlers wären. Sie sagt nicht aus, wie oft solche Fehler tatsächlich auftreten.

## 2. Abläufe im Backend

### 2.1 Fragen- und Foliengenerierung

Ein **Job** verwaltet einen vollständigen Generierungsauftrag, beispielsweise „Erstelle 25 Fragen“. Ein **Batch** ist eine Teilmenge dieses Auftrags. Das Backend verarbeitet höchstens zehn Fragen oder Folien pro Batch.

Die Generierung läuft folgendermaßen ab:

1. **Anfrage prüfen:** `POST /api/generate` bzw. `POST /api/slides/generate` prüft den angemeldeten Benutzer und die Eingaben. Erlaubt sind 1 bis 50 Fragen bzw. 5 bis 30 Folien.
2. **Job anlegen:** Das Backend speichert die Eingaben und legt einen Job mit dem Status `pending` an. Das Frontend erhält eine `job_id`, über die es den Fortschritt abfragen kann.
3. **Verarbeitung starten:** Die Generierung läuft über FastAPI-`BackgroundTasks` im Hintergrund weiter. Der Job Runner öffnet eine Datenbanksession, prüft, ob der Benutzer bereits abgebrochen hat, und setzt den Status auf `running`.
4. **Auftrag aufteilen:** Der Batch Runner teilt die gewünschte Anzahl auf. Aus 25 Fragen werden beispielsweise drei Batches mit 10, 10 und 5 Fragen. Die Batches werden nacheinander verarbeitet. Ein gemeinsamer `GenerationRequest` verbindet die Prompts und Entwürfe aller Batches über die `request_id`.
5. **Inhalte generieren:** Jeder Batch durchläuft drei Stufen:

   | Inhalt | Stufe 1 | Stufe 2 | Stufe 3 |
   | --- | --- | --- | --- |
   | Fragen | Grundstruktur erstellen (`SKELETON`) | Fragen ausformulieren (`CONTENT`) | Fragen verbessern (`IMPROVE`) |
   | Folien | Gliederung erstellen (`SLIDES_OUTLINE`) | Folien ausformulieren (`SLIDES_CONTENT`) | Folien verbessern (`SLIDES_IMPROVE`) |

6. **Entwürfe speichern:** Nach der letzten Stufe speichert das Backend die verbesserten Inhalte in `generated_questions` bzw. `generated_slides`. Dabei werden sie dem letzten IMPROVE-Prompt zugeordnet. Fehlt dieser Prompt in der Datenbank, wird ein `PromptStateError` ausgelöst.
7. **Ergebnisse sammeln:** Nach jedem erfolgreichen Batch werden seine Ergebnisse an die bisherigen Ergebnisse angehängt. Die gesamte Sammlung wird anschließend in `jobs.result_data` gespeichert.
8. **Job abschließen:** Erst nach allen erfolgreichen Batches setzt der Job Runner den Status auf `completed`. Bei einem Fehler versucht er, `failed` und die Fehlermeldung zu speichern. Zum Schluss wird die Datenbanksession geschlossen.

Die Fortschrittswerte **33, 66 und 100 Prozent beziehen sich auf den aktuellen Batch**. Beim nächsten Batch beginnt der Wert wieder bei 0. `batch_current` und `batch_total` zeigen dazu beispielsweise „Batch 2 von 3“ an. Die 100-Prozent-Meldung erfolgt bereits vor dem Speichern der Entwürfe. Erst der Status `completed` bestätigt den Abschluss des gesamten Jobs.

Fragen erhalten während der KI-Generierung bei Bedarf eine vorläufige ID, damit sie über mehrere Stufen hinweg wiedererkannt werden können. Beim Speichern als Entwurf vergibt die Datenbank eine neue ID. Diese wird an das Frontend zurückgegeben und später verwendet, um ausgewählte Fragen ins Archiv zu übernehmen.

Bei Folien erhält das Frontend die Position jeder Folie, aber keine Datenbank-ID des Entwurfs. Beim Speichern ins Archiv lädt das Backend über die `request_id` alle Folienentwürfe dieses Auftrags. Tests müssen deshalb bei Fragen die richtige Auswahl und bei Folien die vollständige Übernahme und Reihenfolge prüfen.

### 2.2 Validierung, Prompts und Wiederholungen

Für jede Generierungsstufe erstellt das Backend einen Prompt, ruft das LLM auf und prüft die Antwort. Dabei wird zunächst das JSON eingelesen und anschließend kontrolliert, ob die Daten die fachlichen Anforderungen erfüllen.

Eine Stufe hat höchstens **drei Versuche insgesamt**, also einen ersten Versuch und bis zu zwei Wiederholungen.

Erkennt die jeweilige `generate_valid_...`-Funktion einen JSON- oder Validierungsfehler, setzt sie zwei Felder im Kontext:

- `previous_error`: die Fehlermeldung des letzten Versuchs.
- `attempt`: die Nummer des gerade fehlgeschlagenen Versuchs.

Beim nächsten Versuch fügt die bereits dafür vorbereitete Standardvorlage diese Informationen in den Prompt ein. Dadurch erfährt die KI, was sie korrigieren soll.

Diese Wiederholung greift nur für die Fehlerarten, die die Funktion ausdrücklich abfängt. Fehler beim LLM-Aufruf, beim Erstellen des Prompts oder beim Datenbankzugriff werden von dieser inneren Schleife nicht behandelt. Dasselbe gilt für unerwartete Python-Fehler. Liefert die KI beispielsweise `null` statt einer Liste, kann beim Verarbeiten ein `TypeError` entstehen, bevor die vorgesehene Strukturprüfung erreicht wird.

Solche Fehler gelangen zur **äußeren Fehlerbehandlung des Batch Runners**. Diese kann den gesamten betroffenen Batch bis zu dreimal versuchen. Dabei beginnt die Generierung dieses Batches wieder mit der ersten Stufe. Bereits abgeschlossene Batches werden nicht erneut ausgeführt. Ein Nutzerabbruch wird nicht wiederholt.

Durch diese beiden Ebenen sind bis zu 27 Stage-Aufrufe pro Batch möglich: drei Batch-Versuche mit jeweils drei Stufen und bis zu drei Versuchen pro Stufe. Mögliche zusätzliche Wiederholungen innerhalb der LLM-Bibliothek sind darin nicht enthalten. Der Batch Runner unterscheidet derzeit nicht zwischen vorübergehenden und dauerhaften Fehlern und sieht keine zusätzliche Wartezeit zwischen Versuchen vor.

Für die Prompt-Erstellung gilt:

- Standardvorlagen werden passend zur Stufe und Sprache aus der Datenbank geladen. Fehlende Variablen oder fehlerhafte Vorlagen führen zu einem Fehler beim Erstellen des Prompts.
- Ein Custom Prompt ersetzt die Standardvorlage. Er wird weiterhin mit den aktuellen Daten befüllt, gespeichert und an das LLM gesendet.
- Erlaubte Stage-Schlüssel werden bereits bei der Anfrage geprüft. Ob ein Custom Prompt die erforderlichen Platzhalter enthält, wird erst beim Ausführen der jeweiligen Stufe geprüft.
- Die Platzhalterprüfung sucht nach exakten Zeichenfolgen. Unterschiedliche Schreibweisen mit Leerzeichen müssen deshalb gesondert getestet werden.
- Bei mehreren Batches müssen Custom Prompts für SKELETON bzw. SLIDES_OUTLINE `{{count}}` bzw. `{{slide_count}}` enthalten. Fehlt der Platzhalter, verwendet das Backend für diese Stufe wieder die Standardvorlage, damit die Anzahl zum aktuellen Batch passt.

Der gerenderte Prompt wird **vor dem LLM-Aufruf** in der Datenbank gespeichert. Anschließend wird die Antwort separat gespeichert. Bei einem `LLMAPIError` wird stattdessen `ERROR during LLM call` eingetragen. Ein fehlgeschlagener Aufruf kann daher bereits einen gespeicherten Prompt hinterlassen.

### 2.3 Jobstatus, Abbruch und Neustart

Über `GET /api/jobs/{job_id}` kann das Frontend den Status, den aktuellen Batch, den Fortschritt, bisherige Ergebnisse und eine mögliche Fehlermeldung abrufen. Der Benutzer darf nur auf eigene Jobs zugreifen. Ein unbekannter Job ergibt 404, ein fremder Job 403.

Ein Abbruch über `DELETE /api/jobs/{job_id}` löscht den Job nicht. Ein aktiver Job erhält den Status `failed` und die Meldung `Generierung wurde vom Nutzer abgebrochen.` Bereits abgeschlossene oder fehlgeschlagene Jobs bleiben unverändert.

Der Job Runner prüft diesen Abbruch:

- vor dem Start der Verarbeitung,
- bei den Fortschrittsmeldungen,
- vor dem Abschluss des Jobs.

Ein bereits laufender LLM-Aufruf wird dadurch nicht sofort beendet. Der Runner stoppt erst, wenn er den Abbruch bei einer Prüfung erkennt. Bereits gespeicherte Prompts und Teilergebnisse bleiben erhalten.

Die Jobs laufen innerhalb des Backend-Prozesses. Es gibt derzeit keine separate, dauerhafte Aufgabenwarteschlange und keine automatische Wiederaufnahme nach einem Prozessneustart. Die Produktionskonfiguration startet zwei Webworker. Parallele Verarbeitung und Abbrüche müssen deshalb auch mit mehreren Datenbanksessions getestet werden.

Der Batch Runner besitzt zwar Parameter wie `start_batch` und `accumulated_questions`, mit denen eine Fortsetzung vorbereitet werden könnte. Die aktuellen Job-Einstiegspunkte verwenden diese Möglichkeit jedoch nicht.

### 2.4 Speichern ins Archiv und Bearbeiten archivierter Inhalte

**Fragen:** Bei `POST /api/finalize` prüft das Backend, ob der Generierungsauftrag existiert, dem Benutzer gehört und ein Fragenauftrag ist. Anschließend übernimmt es die ausgewählten Entwürfe und mögliche Änderungen in die Tabelle `questions`. Danach werden alle Frageentwürfe dieses Auftrags gelöscht, auch die nicht ausgewählten. Übernahme und Löschung werden gemeinsam gespeichert.

Unbekannte Entwurfs-IDs werden derzeit übersprungen. Auch eine leere Auswahl ist erlaubt. Tests müssen deshalb ausdrücklich prüfen, was bei leeren, ungültigen oder doppelt angegebenen IDs passiert.

**Folien:** Bei `POST /api/slides/finalize` prüft das Backend den Auftrag und dessen Eigentümer. Es übernimmt alle zugehörigen Folienentwürfe in ein Deck und speichert dieses. Erst danach werden die Entwürfe in einem zweiten Datenbankschritt gelöscht.

Diese beiden Schritte sind nicht gemeinsam abgesichert. Scheitert die Löschung, können das gespeicherte Deck und die Entwürfe gleichzeitig bestehen bleiben. Ein erneuter Aufruf kann dann ein weiteres Deck erzeugen.

**Archivzugriffe:** Listen und Suche liefern nur Inhalte des angemeldeten Benutzers. Auch beim Lesen, Ändern und Löschen einzelner Einträge wird die Berechtigung geprüft.

Bei Fragen werden die übergebenen IDs und Antwortfelder vor dem Speichern geprüft. Schlägt das Schreiben fehl, werden die Änderungen zurückgerollt. Beim Bearbeiten eines Foliendecks werden alle bisherigen Folien durch neue ersetzt. Dadurch erhalten sie neue Datenbank-IDs. Ihre Reihenfolge ergibt sich aus `position`.

Beim Löschen eines Generierungsauftrags werden zugehörige Prompts, Entwürfe und Fragen über Datenbankbeziehungen mitgelöscht. Ein verbundenes Foliendeck bleibt bestehen, verliert aber seine Verbindung zum Auftrag. Jobs können weiterhin eine inzwischen ungültige `request_id` in `result_data` enthalten.

Archivierung bedeutet hier die Speicherung in endgültigen Datenbanktabellen. Es werden dabei keine Archivdateien auf dem Dateisystem angelegt.

### 2.5 Exporte und PDF-Upload

Es gibt zwei Datenquellen für Exporte:

- **Job-Exporte** verwenden die Ergebnisse aus `jobs.result_data`. Sie sind nur für eigene, abgeschlossene Jobs verfügbar.
- **Archiv-Exporte** verwenden die aktuell gespeicherten Fragen oder Foliendecks.

Wird ein Inhalt im Archiv bearbeitet, kann der Jobexport daher weiterhin den älteren Stand enthalten.

Fragen können als PDF mit Lösungen, als Klausur-PDF ohne Lösungen oder als Moodle-XML exportiert werden. Folien werden als PPTX ausgegeben. Der PPTX-Jobexport prüft ausdrücklich, ob der Job Folien enthält. Eine entsprechende Jobtyp-Prüfung fehlt bei den Fragenexporten. Der Archiv-PPTX-Export kann sowohl über die `request_id` als auch über eine Deck-ID aufgerufen werden. Beide Wege müssen getestet werden.

Die Exportdateien werden vollständig im Arbeitsspeicher erzeugt und anschließend an den Client gesendet. Wichtige Prüffälle sind:

- PDF: Lösungen erscheinen nur im vorgesehenen Modus. Sonderzeichen, lange Texte und Seitenumbrüche werden korrekt verarbeitet.
- PPTX: Anzahl und Reihenfolge der Folien stimmen. Doppelte Positionen aus mehreren Batches dürfen nicht unbemerkt zu einer falschen Reihenfolge führen.
- Moodle-XML: Fragetypen und richtige Antworten werden korrekt übertragen. Unbekannte Typen und MCQ ohne korrekte Antwortindizes werden derzeit übersprungen.
- Alle Exporte: Berechtigungen, Dateinamen, fehlende Daten und gelöschte Generierungsaufträge werden geprüft.

Beim **PDF-Upload** liest das Backend die gesamte Datei ein. Es prüft die PDF-Kennung `%PDF` und eine maximale Größe von 5 MiB. Verschlüsselte oder beschädigte Dateien werden abgelehnt.

PyMuPDF extrahiert den Text. Das Backend bereinigt überflüssige Leerzeichen und Zeilenumbrüche und kürzt den Text bei Bedarf auf 5.000 Zeichen. Der Client erhält diesen Text zurück und kann ihn als `upload_context` bei einer Generierungsanfrage mitsenden. Erst dadurch wird er Teil des gespeicherten Auftrags und der LLM-Anfrage.

### 2.6 Authentifizierung, Passwort-Reset und Benutzertrennung

Bei der **Registrierung** prüft das Backend, ob Benutzername und E-Mail bereits vergeben sind. Das Passwort wird mit bcrypt gehasht und der Benutzer gespeichert. Gleichzeitige Registrierungen mit denselben Daten müssen zusätzlich durch die Eindeutigkeitsregeln der Datenbank abgesichert werden.

Beim **Login** wird das Passwort mit dem gespeicherten Hash verglichen. Bei Erfolg erhält der Benutzer ein JWT mit seiner Benutzer-ID und standardmäßig 60 Minuten Gültigkeit. Geschützte Endpunkte prüfen das Token und laden den zugehörigen Benutzer aus der Datenbank.

Für eine **Passwortänderung** muss das bisherige Passwort korrekt sein. Bei Passwortänderung und Passwort-Reset verlangt das Eingabemodell mindestens acht Zeichen für das neue Passwort. Das Registrierungsmodell enthält diese Mindestlänge derzeit nicht.

Der **Passwort-Reset** besteht aus zwei Schritten:

1. **Reset anfordern:** Bei einer bekannten E-Mail-Adresse erzeugt das Backend einen zufälligen Token mit 15 Minuten Gültigkeit und speichert ihn. Erst danach wird die E-Mail versendet. Bei einer unbekannten Adresse erfolgt kein Versand. Im erfolgreichen Ablauf erhält der Client in beiden Fällen dieselbe Antwort. Ein SMTP-Fehler wird allerdings nicht abgefangen und kann deshalb zu einer anderen Antwort führen.
2. **Neues Passwort setzen:** Das Backend prüft, ob der Token existiert, noch nicht verwendet wurde und noch gültig ist. Anschließend werden das neue Passwort und die Markierung „Token verwendet“ gemeinsam gespeichert.

Beim Erzeugen und Prüfen der Ablaufzeit werden Zeitwerte mit und ohne Zeitzone verwendet. Die Datenbankspalte speichert keine Zeitzone. Tests müssen deshalb prüfen, ob die Gültigkeitsdauer auch nach dem Speichern und erneuten Laden korrekt bleibt.

Weitere Prüfpunkte sind die gleichzeitige Verwendung desselben Reset-Tokens und der fest auf `http://localhost:3000` eingestellte Reset-Link. Reset-Tokens werden derzeit im Klartext gespeichert. Eine ausdrückliche Sperrung bereits ausgestellter JWTs nach einer Passwortänderung ist nicht implementiert.

Die **Benutzertrennung** wird an unterschiedlichen Stellen geprüft: teilweise in den Routen, teilweise in Services und teilweise direkt in Datenbankabfragen. Einige interne Funktionen erhalten nur eine Objekt-ID und setzen voraus, dass die Berechtigung bereits geprüft wurde. Tests müssen deshalb den vollständigen Aufrufweg prüfen: Ein Benutzer darf fremde Inhalte weder lesen noch verändern, löschen, finalisieren oder exportieren.

## 3. Externe Abhängigkeiten und Testgrenzen

| Abhängigkeit | Verwendung und Kopplung | Vorgehen für Tests |
| --- | --- | --- |
| PostgreSQL 15, SQLAlchemy, psycopg2 | [db.py](../backend/app/db.py) erzeugt Engine und `scoped_session` beim Import. Benutzer, Tokens, Requests, Prompts, Entwürfe, Archive und Jobs liegen in PostgreSQL. JSONB, UUID, Fremdschlüssel, Constraints und Zeitstempel sind Teil des Vertrags. | Unit: Repo-/Session-Ersatz nur für Ablaufentscheidungen. Integration: eigene PostgreSQL-15-Testdatenbank mit echten Commits und mehreren Sessions. SQLite ersetzt diese Tests nicht. |
| LLM/OpenAI | [llm_client.py](../backend/app/services/llm_client.py): verzögert erzeugter AsyncOpenAI-Client, 60-Sekunden-Timeout, Modell aus Settings, Temperatur 0,7. Prompt-/Kontextdaten verlassen das Backend. [LLMProvider](../backend/app/services/llm_provider.py) ist bereits eine schmale Schnittstelle. | Regulär skriptgesteuerter Fake mit Antwort-/Fehlerfolgen. Adaptertests mit SDK-Ersatz. Optional separater externer Vertragstest mit synthetischen Daten und begrenztem Budget. Keine wörtliche Gleichheit realer LLM-Ausgaben erwarten. |
| SMTP/FastMail | [email_utils.py](../backend/app/core/email_utils.py): Konfiguration beim Import, STARTTLS und Anmeldung, Mail nach Token-Commit. Reset-Link fest auf `http://localhost:3000`. | Unit: Nachrichteninhalt, Empfänger, Token-Link und Fehler mit Fake-Sender. Integration: lokaler SMTP-Testserver mit passender TLS-/Auth-Konfiguration bzw. bewusst injizierter Testkonfiguration. Keine realen Empfänger. |
| Dateisystem, Speicher und Dokumentbibliotheken | Anwendungscode verarbeitet Upload und Exporte als Bytes/Text, ohne dauerhafte Upload-/Exportdateien. Multipart-Verarbeitung kann temporäre Dateien verwenden. SQL-Startdateien werden durch den DB-Container eingelesen. PPTX nutzt Bibliotheksressourcen. | Temporäres Testverzeichnis, kleine synthetische PDF-Dateien und echte Parser/Serializer verwenden. Beschädigte, verschlüsselte und große Eingaben, Ressourcenfreigabe sowie Export ohne beschreibbares Anwendungsverzeichnis prüfen. Kein externer Dateispeicher erforderlich. |
| Konfiguration, Uhrzeit, Zufall und Prozess | [config.py](../backend/app/config.py) verlangt JWT- und SMTP-Konfiguration beim Import. LLM-Provider und Mailkonfiguration sind global. UUIDs, Reset-Tokens, JWT-/Token-Ablauf und PDF-Datum sind variabel. Jobs laufen im Webprozess. | Testkonfiguration vor Import setzen, feste Uhr und kontrollierte IDs/Tokens verwenden. Globale Zustände zurücksetzen. Prozess-/Session-Parallelität separat testen. Produktionsgeheimnisse und vorhandene DB-Volumes nicht verwenden. |

## 4. Komponenten und verbindliche Testzuordnung

**U = Unit Tests, I = Integration Tests.** Bei „U + I“ werden beide benötigt: isolierte Ablaufprüfungen ersetzen keine Persistenz-, HTTP- oder Bibliotheksprüfung. Pfade in den folgenden Tabellen beziehen sich auf `backend/app/`.

| ID | Komponente | Testart | Priorität | Wesentliche Prüffälle / Grenze |
| --- | --- | --- | --- | --- |
| C01 | `models/generate_models.py`, `slides_models.py`, Request-Validatoren | U + I | P1 | Anzahlgrenzen, Thema/Whitespace, de/en, Typen, Summe und negative Einzelwerte der Verteilung, Kontext 5.000/5.001 Zeichen. Unterschiede zwischen Fragen-`upload_context` und Folienvalidierung erfassen. I: ungültige HTTP-Eingabe erzeugt keinen Job. |
| C02 | `validators/skeleton_validator.py`, `content_validator.py`, `improve_validator.py` | U | P0 | Alle vier Fragetypen, Anzahl, fehlende Felder, falsche JSON-Typen, Indexgrenzen/Duplikate, unveränderliche IDs/Typen/Schwierigkeiten. Skeleton-Verteilung bei 1/2/3 Elementen und tatsächliche Schwelle `tolerance + 0.5` prüfen. Nach IMPROVE keine vollständige Content-Revalidierung voraussetzen. |
| C03 | Drei `validators/slides_*_validator.py` für Outline/Content/Improve | U | P0 | Title/Content/Closing, Positionen, leere und einzelne Folie, Bullet-Grenzen, mindestens acht Wörter bei Content-Bullets, Platzhalter, 30-%-Beispielquote mit Aufrundung, Erhalt von Beispielen. Ungültige Typen dürfen nicht unbemerkt aus der vorgesehenen Fehlerbehandlung fallen. |
| C04 | `json_utils.py`, `validators/custom_prompt_validator.py`, Rendering in `templateService.py` | U | P1 | Leere Antwort, JSON-Codefences, beschädigtes JSON, valides JSON mit falschem Top-Level-Typ, StrictUndefined, Syntaxfehler, Stage-Schlüssel und Platzhalter mit/ohne Leerzeichen. |
| C05 | Template-Abfrage, `api/routes_prompts.py`, `models/prompt_models.py` | U + I | P1 | U: Vorschaukontext und erhaltene Platzhalter. I: sechs Stufen × de/en mit echten SQL-Templates rendern, fehlende/mehrdeutige Templates, authentifizierte Vorschau. Vorschau → Custom Prompt → Mehrfach-Batch. |
| C06 | `generation/stage_runner.py` | U + I | P0 | U: injizierter Provider, Reihenfolge Rendering/Persistenz/Aufruf, Custom Prompt. I: Prompt vor Aufruf sichtbar, Antwort-/Fehlertext nach Aufruf, DB-Fehler vor/nach LLM und erhaltene Audit-Einträge. |
| C07 | Sechs Stage-Services in `services/generation/` | U | P0 | Erstversuch erfolgreich, ungültig → gültig, drei Fehlschläge, Feedbackkontext, API-/Templatefehler ohne inneren Retry, ID-Ergänzung und keine Folgestufe nach endgültigem Fehler. Je Stufe die tatsächliche Fehlerklasse prüfen. |
| C08 | `generation/orchestrator.py`, `slides_orchestrator.py` | U + I | P0 | U: Reihenfolge, Kontext, Custom Prompts, Callbacks und Response-Mapping. I: neuer/wiederverwendeter Request, Prompt-Zuordnung, gespeicherte Entwürfe, fehlender IMPROVE-Prompt und fehlende Request-ID. |
| C09 | `batch_runner.py` | U + I | P0 | U: Teilung, Restbatch, Retry-Limit, Abbruch ohne Retry, Prompt-Fallback und interne Resume-Parameter. I: gemeinsame Request-ID, Teilergebnisse, doppeltes Speichern nach Fehler, Folienpositionen über Batch-Grenzen. |
| C10 | `job_runner.py`, `api/routes_jobs.py`, Generierungsrouten, `models/job_models.py` | U + I | P0 | U: Runner-Erfolg/Fehler/Abbruch und Session-Freigabe. I: Jobregistrierung, Statusverlauf, Polling, fremder Benutzer, Abbruch vor/während/nach Verarbeitung, zwei parallele Jobs und Fehler beim Speichern des Fehlerstatus. |
| C11 | `finalization/finalize_service.py`, `api/routes_finalize.py`, Finalisierungsmodelle | U + I | P0 | Auswahl/Overrides, leere Auswahl, fremde/duplizierte Entwurfs-IDs, falscher Request-Typ. I: gemeinsamer Commit, Fehler-Rollback und wiederholte/gleichzeitige Finalisierung. |
| C12 | `finalization/slides_finalize_service.py`, Folienfinalisierungsroute/-modelle | U + I | P0 | Eigentum, fehlende Entwürfe, falscher Request-Typ. I: Fehler zwischen Deck-Commit und Entwurfslöschung, wiederholter Aufruf, Reihenfolge und Anzahl gespeicherter Folien. |
| C13 | `archive/archive_read_service.py`, `archive_update_service.py`, `archive_delete_service.py`, Fragenarchivroute/-modelle | U + I | P0 | U: Mapping und typabhängige Änderungsregeln. I: Benutzersuche, Aggregation, gemischte gültige/ungültige Updates ohne Teiländerung, Löschkaskaden und unveränderte fremde Daten. |
| C14 | `archive/slides_archive_service.py`, Folienarchivroute/-modelle | U + I | P0 | U: Mapping. I: benutzergefilterte Liste/Details, vollständiges Ersetzen, neue IDs, Reihenfolge, leere Sammlung, Löschen und Transaktionsfehler. |
| C15 | `api/routes_export.py`, `routes_archive_export.py` | I | P0 | Eigentum aller Varianten, Status/Typ, fehlende oder ungültige Request-ID im Job, leere Ergebnisse, Deck-ID-Fallback, MIME-Typ, Download-Header und Konsistenz von Job-Snapshot und geändertem Archiv. |
| C16 | `services/pdf_export_service.py` | U + I | P1 | U: Labels, Lösungen nur im normalen Modus, keine markierten Antworten im Klausurmodus. I: echtes PDF öffnen/Text prüfen, eindeutige Lösungsmarker fehlen in Klausur, Unicode, lange Texte und Seitenumbrüche. |
| C17 | `services/pptx_export_service.py` | U + I | P1 | U: Sortierung und Layoutauswahl. I: echte PPTX erneut öffnen, Folienanzahl, Titel/Bullets/Beispiele, leere Liste, doppelte Positionen. Layout-Stichprobe bei langen Texten. |
| C18 | `services/moodle_export_service.py` | U + I | P1 | U: SCQ/MCQ-Punkte, TRUE_FALSE-Reihenfolge/Fallback, Kurzantwort, übersprungene Typen. I: erzeugtes XML erneut parsen, Zeichen/Escaping und HTTP-Ausgabe prüfen. Moodle-Import als separater manueller Vertragstest. |
| C19 | `api/routes_upload.py`, `context_upload/pdf_service.py`, Upload-Modell | U + I | P1 | U: Whitespace-Normalisierung, Kürzung und Fehler-Mapping. I: authentifizierter Multipart-Upload, 5-MiB-Grenze, falsche Magic Bytes, beschädigte/verschlüsselte/leere PDFs, Parser-Freigabe und 5.000-Zeichen-Ergebnis. |
| C20 | `core/auth_utils.py`, `models/auth_models.py` | U + I | P0 | U: Hash/Verify, JWT-Inhalt/Ablauf, Passwortregeln. I: fehlendes/ungültiges/abgelaufenes Token, falsche Signatur, fehlendes oder ungültiges UUID-`sub`, gelöschter Benutzer. Echte Auth-Abhängigkeit verwenden. |
| C21 | `services/auth/auth_service.py`, `api/routes_authentification.py` | U + I | P0 | U: Fehlerzweige mit fester Uhr und Tokenquelle. I: Registrierung/Login/Passwortwechsel, Unique-Rennen, Reset-Ablauf/Einmaligkeit/Parallelität, Datenbank-Zeitzone und SMTP-Ausfall nach Commit. |
| C22 | `core/email_utils.py` | U + I | P1 | Nachricht, Empfänger, Reset-Link, lokaler SMTP-Versand, TLS-/Auth- und Verbindungsfehler. Festen localhost-Link als bestehenden Vertrag und Konfigurationsbedarf kennzeichnen. |
| C23 | `services/llm_provider.py`, `llm_client.py` | U + I | P1 | U: leerer Prompt, fehlender Schlüssel, leerer Inhalt/choices und Mapping von Timeout, Rate-Limit, BadRequest/APIError. I: Pipeline mit Fake-Provider. Optional SDK/HTTP-Vertrag separat, inklusive Timeout-/Retry-Konfiguration. |
| C24 | `config.py`, `db.py`, `main.py`, `core/exceptions.py` | U + I | P1 | U: Settings-Grenzen und Fehlercodes. I: Import/Start mit Testkonfiguration, AppError-`error/detail` gegenüber HTTPException-`detail`, Session-Lebensdauer und CORS. `/health` prüft derzeit keine DB-/LLM-/SMTP-Erreichbarkeit. |

### Persistenz: echte Datenbanktests sind erforderlich

Für jede folgende Komponente ist **I** die erforderliche Testart. Session-Mocks allein belegen weder Constraints noch Transaktionsverhalten.

| Komponente | Priorität | Integrationstests |
| --- | --- | --- |
| `persistence/generation_repo.py` | P0 | Fragen-/Folien-Metadaten, Benutzer-FK, JSONB, Request-Wiederverwendung, fehlende ID. Interner ID-Lookup besitzt keinen Benutzerfilter. |
| `persistence/prompt_repo.py` | P1 | Insert/Commit, Filter nach Request und Stage, neuester Prompt und gleiche Zeitstempel. Keine eindeutige Sortierung bei Gleichstand voraussetzen. |
| `persistence/generated_questions_repo.py` | P0 | Vollständiges Mapping einschließlich `correct_indices`, generierte IDs, FK-Verknüpfung, Fehler nach Commit/bei Refresh und wiederholtes Speichern. |
| `persistence/question_repo.py` | P0 | Entwurfsauswahl/-löschung nur für einen Request. Die Löschung committet nicht selbst. Zusammenspiel mit finalen Inserts und Commit/Rollback prüfen. |
| `persistence/slides_draft_repo.py` | P0 | Positionen/Beispiele, Sortierung, wiederholte Positionen, Commit beim Speichern und beim Löschen. Zusammenspiel mit Finalisierung. |
| `persistence/slides_repo.py` | P0 | Benutzerfilter, Deck/Folien gemeinsam speichern, Ersetzen nach Flush, Fehler vor Commit, Löschkaskade, Request-`SET NULL`. |
| `persistence/archive_repo.py` | P0 | Lesen/Sortieren, erlaubte Änderungsfelder, Kaskaden. Interne Abfragen ohne Benutzerfilter nur hinter geprüftem Zugriff verwenden. |
| `persistence/job_repository.py` | P0 | JSON-Serialisierung und Teilergebnisse, Status/Progress-Constraints, fehlender Job, parallele Updates. `None` bedeutet „nicht ändern“ und löscht keine bestehenden Felder. |
| `models/sql_models.py`, `models/base.py`, `db.py` und `db-init/` | P0 | Echte SQL-Initialisierung, UUID/JSONB, FK/Unique/CHECK und Zeitstempel sowie Session-Isolation. SQL enthält u. a. Job-Status-/Progress-CHECKs, die im ORM nicht als solche definiert sind. |

## 5. Konkrete Risiken und gezielte Folgearbeit

**Beobachtung** bezeichnet eine direkt im Code sichtbare Eigenschaft. **Zu prüfen** bezeichnet ihre noch nicht durch Laufzeittests bestätigten Auswirkungen. Bei vermuteten Fehlern zuerst reproduzierende Tests erstellen. Das gewünschte Sollverhalten festlegen, statt einen Fehler als dauerhafte Erwartung festzuschreiben.

| ID / Priorität | Beobachtung und Auswirkung | Test / notwendige Entkopplung |
| --- | --- | --- |
| R01 / P0 | [Folien-Batching](../backend/app/services/batch_runner.py) erzeugt lokale Positionen ab 1 sowie Titel-/Schlussfolien je Batch. 11 und 21 Folien ergeben einen Restbatch mit einer Folie. Die [Outline-Validierung](../backend/app/services/validators/slides_outline_validator.py) verlangt für dieses eine Element zugleich `title` und `closing`. | Mit 11/21 reproduzieren. Mit 20/30 doppelte Positionen und PPTX-Reihenfolge prüfen. Batch-Planung von Gesamtgliederung/Positionierung trennen. Fachlich entscheiden, wie eine zusammenhängende Präsentation aufgeteilt wird. |
| R02 / P0 | Entwürfe werden vor Response-Mapping und Job-Checkpoint committet. Ein später Fehler wird vom Batch Runner mit erneuter Generierung beantwortet. Auch die Ergebnisliste wird vor dem Checkpoint erweitert. | Fehler nach Entwurfs-Commit und beim Checkpoint injizieren, DB-Zeilen und Job-Ergebnis vergleichen. Idempotenz pro Request/Batch und klare Transaktions-/Checkpoint-Grenze vorsehen. |
| R03 / P0 | [Runner](../backend/app/services/job_runner.py) und Batch Runner führen vor erneutem Schreiben nach einer DB-Exception kein Rollback aus. Selbst das Speichern von `failed` kann mit einer ungültigen Session scheitern. | Echten Constraint-/Commitfehler auslösen und Zustand aus einer frischen Session lesen. Transaktionsverantwortung zentralisieren. Fehlerstatus über eine wiederhergestellte oder separate Session schreiben. |
| R04 / P0 | [scoped_session](../backend/app/db.py) hat keine explizite Task-Scope-Funktion. Asynchrone Jobs und Requests verwenden denselben globalen Einstieg. Abbruchprüfung und Statusupdate sind getrennte Operationen. Der Abbruch hängt von einem Meldungstext ab. | Zwei über kontrollierte LLM-Wartepunkte verschachtelte Jobs plus Abbruch in anderer Session prüfen. Session-Factory pro Job injizieren. Typisierten Abbruchzustand und atomare Zustandsübergänge entwerfen. Auswirkungen auf tatsächliche Session-Wiederverwendung reproduzieren. |
| R05 / P0 | [Folienfinalisierung](../backend/app/services/finalization/slides_finalize_service.py) hat zwei Commits. Ein Fehler dazwischen kann Deck und Entwürfe gleichzeitig bestehen lassen. Erneute Finalisierung kann ein weiteres Deck erzeugen. | Fehler exakt nach Deck-Commit, Wiederholung und zwei gleichzeitige Aufrufe. Deck-Erzeugung und Entwurfsverbrauch in eine Transaktion überführen. Eindeutigkeits-/Idempotenzregel festlegen. |
| R06 / P0 | Ownership-Prüfungen sind verteilt. `get_generation_request`, `get_job` und mehrere Fragenarchiv-Abfragen filtern nur nach ID. Interne `existing_request_id`-Pfade prüfen den Benutzer nicht erneut. | Vollständige Zwei-Benutzer-Matrix aus Abschnitt 6. Autorisierte Objektauflösung als gemeinsame Service-/Repo-Grenze vorsehen. Interne Aufrufvoraussetzungen ausdrücklich machen. Dies ist kein Nachweis eines offen erreichbaren fremden Zugriffs. |
| R07 / P0 | [Reset-Service](../backend/app/services/auth/auth_service.py) mischt Zeitformen, speichert vor SMTP und prüft `used` ohne erkennbare Sperre. | Ablaufgrenzen mit DB-Roundtrip in UTC/Europe-Vienna, SMTP-Ausfall, zwei gleichzeitige Resets. Uhr und Mailer injizieren. Atomaren Tokenverbrauch, Token-Speicherform und verlässliche Versandstrategie als Folgearbeit entscheiden. |
| R08 / P0 | [Fragenfinalisierung](../backend/app/services/finalization/finalize_service.py) überspringt unbekannte IDs, erlaubt leere Auswahl und löscht alle Entwürfe. Doppelte IDs können mehrfach übernommen werden. | Leere/gemischte/doppelte Auswahl und Parallelaufrufe mit Zeilenzählung testen. Sollverhalten zu „alles verwerfen“, ungültigen IDs und Einmaligkeit klären. Validierung vom Schreiben trennen. |
| R09 / P1 | Validatoren prüfen unterschiedliche Invarianten: Fragen-IMPROVE prüft Antwortindizes nicht erneut vollständig. Folien-Content prüft Positionen nicht ausdrücklich auf Einmaligkeit. Teile der Verarbeitung greifen vor Typprüfung auf Werte zu. | Ungültige Indizes nach IMPROVE, doppelte Folienpositionen, JSON-`null`/Objekt/Skalar und `examples: null` testen. Gemeinsame Ergebnisvalidierung und einheitliche fachliche Fehler vorsehen. Unerwartete Fehler nicht durch zusätzliche LLM-Aufrufe verdecken. |
| R10 / P1 | In-Process-Jobs besitzen keine erkennbare Wiederherstellung nach Worker-Ende. Interne Resume-Parameter allein gewährleisten keine sichere Fortsetzung. | Prozessabbruch nach einem Checkpoint in separater Testumgebung charakterisieren. Ausführung/Scheduling, gespeicherten Fortschritt und Wiederaufnahme trennen. Erst danach über dauerhafte Queue oder Recovery entscheiden. |
| R11 / P1 | [Export-Routen](../backend/app/api/routes_export.py) nutzen Job-Snapshots. Gelöschte Requests können diese Exporte unbrauchbar machen. Download-Dateinamen ersetzen lediglich Leerzeichen und Schrägstriche. Archiv-PPTX hat zwei ID-Pfade. | Nach Bearbeiten/Löschen erneut exportieren. Falschen Jobtyp, fehlende ID, Unicode, Anführungszeichen und Zeilenumbrüche im Thema sowie Deck-Fallback prüfen. Gemeinsame Exportdaten-Auflösung, Mapping und Dateinamenbildung extrahieren. |
| R12 / P1 | Globale Settings/Mailer/Provider und importierte Funktionen erschweren isolierte Tests. Der Stage Runner erlaubt bereits Provider-Injektion, höhere Ebenen reichen sie nicht durch. | Bestehende Schnittstelle nutzen und Einstellungen, Provider, Repositories und Session-Factory bis zur Anwendungsgrenze injizierbar machen. Zunächst mit gezieltem Ersetzen der im aufrufenden Modul gebundenen Namen testen. |
| R13 / P2 | [Archivsuche](../backend/app/services/archive/archive_read_service.py) filtert Fragezeilen vor Aggregation. Bei Treffer nur im Fragetext kann `question_count` nur die passenden Fragen zählen. Folienlisten greifen je Deck auf `deck.slides` zu. | Thema mit mehreren Fragen und einem Texttreffer testen. Bedeutung des Zählers klären. Für größere Archive Abfrageanzahl messen und bei Bedarf Aggregation/Ladestrategie gezielt ändern. |
| R14 / P1 | [PDF-Extraktion](../backend/app/services/context_upload/pdf_service.py) wirft bei Verschlüsselung vor dem `try/finally` mit `doc.close()`. Exporte und Uploads werden vollständig in den Speicher geladen. | Freigabe auch im Verschlüsselungsfall prüfen. Große Eingaben mit begrenzten Testdaten prüfen. Ressourcenverwaltung kapseln. Speicherbedarf und Größenlimits vor Erweiterungen messen. |

## 6. Erste konkrete Testszenarien

| Szenario | Testart / Priorität | Daten, Auslösung und prüfbares Ergebnis |
| --- | --- | --- |
| T01: Erfolgreiche Generierung | I / P0 | Je ein Fragen- und Folienjob mit Fake-LLM, echten Templates und PostgreSQL. Request gehört dem angemeldeten Benutzer. Stufen/Promptantworten und Entwürfe sind nachvollziehbar. Status `completed` erst nach vollständigem Ergebnis. Alle vier Fragetypen sowie de/en durch Fixtures abdecken. |
| T02: Retry-Grenzen | U + I / P0 | Antwortenfolge ungültiges JSON → fachlich ungültig → gültig sowie drei dauerhaft ungültige Antworten. Stage- und Batch-Aufrufe getrennt zählen, Feedback prüfen. LLM-APIfehler und Nutzerabbruch separat auslösen. Nach endgültigem Fehler keine nachfolgende Stufe. |
| T03: Batch-Grenzen | U + I / P0 | Fragen 1/9/10/11/20/50, Folien 5/10/11/12/20/21/30. Gesamtlänge, gemeinsame Request-ID, Restmenge, Prompt-Fallback und Positionen prüfen. R01 mit 11/21 als reproduzierbaren Fehler behandeln. Erwartetes künftiges Verhalten separat festlegen. |
| T04: Teilfehler und Finalisierung | I / P0 | Fehler nach gespeichertem Entwurf, vor Job-Checkpoint und zwischen den Folienfinalisierungs-Commits. Daten anschließend über neue Session lesen. Duplikate, verbleibende Entwürfe und finalisierte Daten erfassen. Erfolgreiche Fragenfinalisierung atomar nachweisen. |
| T05: Abbruch und Parallelität | U + I / P0 | Fake-LLM hält an einem kontrollierten Wartepunkt. Eine zweite Session storniert. Danach freigeben und auf fehlendes Überschreiben durch `completed` prüfen. Vor Start, zwischen Stufen und bei bereits terminalem Status wiederholen. Zwei Benutzerjobs dürfen keine Session-/Ergebnisdaten vermischen. |
| T06: Benutzertrennung | I / P0 | Benutzer A und B mit eigenen Jobs, Requests, Fragen und Decks. Mit echtem JWT von B sämtliche IDs von A anfragen/ändern/löschen/finalisieren/exportieren. Kein Inhalt und keine Mutation fremder Daten. Listen/Suche enthalten nur B. Zusätzlich ohne Token und mit unbekannten IDs testen. |
| T07: Reset und Login | U + I / P0 | Gültige, unbekannte, verbrauchte und abgelaufene Reset-Tokens prüfen. Zeitpunkte unmittelbar vor/am/nach Ablauf, zwei parallele Verwendungen und SMTP-Ausfall nach Token-Commit abdecken. Passwort/Hash, Tokenstatus, Login mit altem/neuem Passwort und HTTP-Fehler prüfen. Bestehende Abweichungen gemäß R07 dokumentieren. |
| T08: Archiv und Kaskaden | I / P0 | Speichern → Lesen → Ändern → Exportieren → Löschen mit zwei Benutzern. Fehler in einem von mehreren Updates darf keine Teiländerung speichern. Zugehörige FK-Wirkungen, unberührte fremde Daten, Deck-`SET NULL` und verbleibende Job-Snapshots prüfen. |
| T09: Dokumentformate | U + I / P1 | Fragen mit eindeutigen Lösungs-/Begründungsmarkern, Sonderzeichen und langen Texten sowie Folien mit vertauschten und doppelten Positionen. PDF/PPTX/XML erneut öffnen/parsen, Inhaltsanzahl prüfen. Klausur enthält keine Lösungs-/Begründungsmarker. Markierungen auch beim Rendering prüfen. |
| T10: Upload/Start/Fehlervertrag | U + I / P1 | PDF-Grenzfälle, alle sechs Templates in beiden Sprachen, fehlende Settings und simulierte DB-/LLM-/SMTP-Fehler. Auth, Validierung und strukturierte Fehler getrennt prüfen. Hintergrundfehler erscheinen über Jobstatus und nicht nachträglich als Fehler der ursprünglichen Generate-Antwort. |

Die Zwei-Benutzer-Matrix T06 umfasst ausdrücklich: Jobstatus und Abbruch, Fragen- und Folienfinalisierung, Fragenarchiv-Liste/Suche/Details/Update/Delete, Folienarchiv-Liste/Details/Update/Delete, sämtliche Job-Exporte (PDF, Klausur-PDF, Moodle, PPTX) sowie sämtliche Archiv-Exporte einschließlich XML-Alias und PPTX-Deck-ID-Fallback. Fragen-/Jobzugriffe liefern bei fremden vorhandenen IDs überwiegend 403. Benutzergefilterte Folienarchiv-Details liefern 404. Diese bestehenden Verträge gezielt prüfen. Bei fehlendem Bearer-Token den HTTPBearer-Vertrag der installierten Version erfassen, statt pauschal überall 401 anzunehmen.

## 7. Testaufbau und Reihenfolge der Umsetzung

### Reproduzierbare Testumgebung

- Vorgesehene Struktur für den Folgetask: `backend/tests/unit/`, `backend/tests/integration/`, `backend/tests/fixtures/` und gemeinsame Fixtures. pytest plus Async-Unterstützung und ein HTTP-Testclient werden als Testabhängigkeiten ergänzt, nicht in diesem Dokumentationstask.
- PostgreSQL 15 in einer ausschließlich für Tests angelegten Datenbank/Instanz verwenden. [01_tables.sql](../db-init/01_tables.sql), [02_questions_templates.sql](../db-init/02_questions_templates.sql) und [03_slides_templates.sql](../db-init/03_slides_templates.sql) auf leerem Schema initialisieren. Ein bloßes `Base.metadata.create_all()` würde SQL-spezifische Constraints nicht vollständig abbilden.
- Zwei Benutzer und getrennte Requests, Entwürfe, Archive und Jobs als Standardfixtures anlegen. UUIDs, Zeitpunkte, Antworten und Tokens kontrollieren. Ausschließlich synthetische Inhalte verwenden.
- Repositories committen eigenständig. Testisolation deshalb über eine frische Testdatenbank bzw. ein frisches Schema oder eine nachweislich commitfeste Fixture herstellen. Ein äußerer Rollback darf nicht ungeprüft als ausreichende Bereinigung gelten.
- `get_db` für HTTP-Tests ersetzen. Zusätzlich den in `job_runner` importierten `SessionLocal`-Einstieg auf die Test-Factory umleiten: Der HTTP-Dependency-Override allein erfasst Background Jobs nicht.
- Für isolierte Stage-Tests `run_stage` im jeweiligen Stage-Service ersetzen. Für Pipeline-Integration den Provider-Einstieg im Stage Runner ersetzen. Keine echten Netzwerkaufrufe durch globale Default-Provider zulassen.
- Auth-Integrationstests verwenden echte Test-JWTs und die reale `get_current_user`-Abhängigkeit. Ein pauschaler Fake-Benutzer würde die wichtigste Sicherheitsgrenze ausblenden.
- Background-Tasks für Annahmetests kontrolliert registrieren und separat ausführen. Ein Testclient kann auf Background-Tasks warten. Das belegt nicht das Verhalten realer HTTP-Rückgabe und parallelen Pollings. Rennen mit Events/Barrieren und getrennten Sessions koordinieren, nicht mit zufälligen Wartezeiten.
- SMTP zunächst durch einen sammelnden Fake ersetzen. Einen lokalen SMTP-Vertragstest getrennt ausführen. Die fest konfigurierte STARTTLS-/Auth-Anforderung berücksichtigen.
- Exportprüfungen auf geparsten Inhalten/Strukturen aufbauen. Keine vollständigen Binär-Snapshots mit variablem Datum oder Metadaten. Kleine visuelle Stichproben ergänzen Textprüfungen für Klausur-Markierungen und Textüberlauf.
Beschreibung

Als Entwicklungsteam möchten wir die kritischen Abläufe und Abhängigkeiten des Backends dokumentieren, damit die nachfolgenden Test- und Refactoring-Arbeiten nach Risiko und Nutzen priorisiert werden können.

Untersucht werden insbesondere die Generierung von Fragen und Folien, Background Jobs, Batch-Verarbeitung, Archivierung, Authentifizierung sowie externe Abhängigkeiten wie LLM, PostgreSQL und E-Mail-Versand. In diesem Task wird noch keine Produktionslogik verändert.

Aufgaben

Kritische Backend-Abläufe erfassen:
Fragen- und Foliengenerierung,
Validierungs- und Retry-Schleifen,
Background Jobs und Batch-Verarbeitung,
Archivierung und Exporte,
Authentifizierung und Benutzertrennung.

Abhängigkeiten zu Datenbank, LLM, SMTP und Dateisystem dokumentieren.

Für jede Komponente festlegen, ob Unit Tests oder Integration Tests benötigt werden.

Schwer testbare Stellen und notwendige Entkopplungen dokumentieren.

Ergebnisse in docs/test-plan.md festhalten.

Keine Änderungen an der bestehenden Geschäftslogik durchführen.

Akzeptanzkriterien


Die wichtigsten Backend-Abläufe und ihre Abhängigkeiten sind dokumentiert.

Jede betrachtete Komponente ist einer Testart zugeordnet.

Produktionscode wurde in diesem Task nicht verändert.
Relevante Dateien

backend/app/services/generation/orchestrator.py_
backend/app/services/generation/slides_orchestrator.py 
 backend/app/services/generation/stage_runner.py
backend/app/services/batch_runner.py
backend/app/services/job_runner.py
backend/app/services/archive/
backend/app/persistence/
backend/app/core/email_utils.py
docs/test-plan.md (neu)
Tags: backend, testing, analyse, sprint-1
Geschätzter Aufwand: 6 Stunden, Spanne 4 bis 8 Stunden
Abhängigkeiten: keineBeschreibung

Als Entwicklungsteam möchten wir die kritischen Abläufe und Abhängigkeiten des Backends dokumentieren, damit die nachfolgenden Test- und Refactoring-Arbeiten nach Risiko und Nutzen priorisiert werden können.

Untersucht werden insbesondere die Generierung von Fragen und Folien, Background Jobs, Batch-Verarbeitung, Archivierung, Authentifizierung sowie externe Abhängigkeiten wie LLM, PostgreSQL und E-Mail-Versand. In diesem Task wird noch keine Produktionslogik verändert.

Aufgaben

Kritische Backend-Abläufe erfassen:
Fragen- und Foliengenerierung,
Validierungs- und Retry-Schleifen,
Background Jobs und Batch-Verarbeitung,
Archivierung und Exporte,
Authentifizierung und Benutzertrennung.

Abhängigkeiten zu Datenbank, LLM, SMTP und Dateisystem dokumentieren.

Für jede Komponente festlegen, ob Unit Tests oder Integration Tests benötigt werden.

Schwer testbare Stellen und notwendige Entkopplungen dokumentieren.

Ergebnisse in docs/test-plan.md festhalten.

Keine Änderungen an der bestehenden Geschäftslogik durchführen.

Akzeptanzkriterien


Die wichtigsten Backend-Abläufe und ihre Abhängigkeiten sind dokumentiert.

Jede betrachtete Komponente ist einer Testart zugeordnet.

Produktionscode wurde in diesem Task nicht verändert.
Relevante Dateien

backend/app/services/generation/orchestrator.py_
backend/app/services/generation/slides_orchestrator.py 
 backend/app/services/generation/stage_runner.py
backend/app/services/batch_runner.py
backend/app/services/job_runner.py
backend/app/services/archive/
backend/app/persistence/
backend/app/core/email_utils.py
docs/test-plan.md (neu)
Tags: backend, testing, analyse, sprint-1
Geschätzter Aufwand: 6 Stunden, Spanne 4 bis 8 Stunden
Abhängigkeiten: keine
### Priorisierter Arbeitsvorrat

| Reihenfolge | Arbeitspaket | Nutzen / Abschlussnachweis |
| --- | --- | --- |
| 1 | Testgrundlage: isolierte PostgreSQL-Initialisierung, Fake-LLM, zwei Benutzer, Testkonfiguration und Session-Overrides | Ermöglicht deterministische Tests ohne Live-LLM/SMTP. Reale Commit-/Constraint-Prüfung funktioniert. |
| 2 | P0-Regeln und Kernfluss: C02/C03/C07 sowie T01 bis T03 und T06 | Schnell lokalisierbare Validierungsfehler. Benutzertrennung und gültige Generierungsgrößen sind abgesichert. R01 ist reproduziert. |
| 3 | P0-Datenintegrität: T04/T05/T07/T08, alle Persistenzkomponenten | Teilfehler, Abbruch, parallele Zugriffe, Finalisierung und Reset sind reproduzierbar. Notwendige Refactorings aus R02 bis R08 können anhand der Tests separat umgesetzt werden. |
| 4 | P1-Verträge und Betrieb: T09/T10, LLM-/SMTP-Adapter, Vorschau/Custom Prompts, Fehlerantworten und Prozessneustart | Exporte, Uploads und externe Fehler sind prüfbar. Konfigurationskopplung kann reduziert werden. Wiederaufnahme wird erst nach definierter Semantik zugesichert. |
| 5 | P2-Ergänzungen: Archiv-Abfrageanzahl, Performance mit großen Dokumenten und Layout-Stichproben | Messbare Grundlage für Performance- und Darstellungsverbesserungen. |

Die Pakete sind Folgearbeiten. Sie sind nicht Teil der für diesen Analyse-Task geschätzten 4 bis 8 Stunden. Für die erste Testsuite gelten die P0-Szenarien als Mindestumfang. Reproduzierte Fehler erhalten eigene nachvollziehbare Folgeaufgaben und werden nicht kommentarlos übersprungen. Live-LLM-/SMTP- und manuelle Importtests dürfen die reguläre, deterministische Suite nicht ersetzen.

