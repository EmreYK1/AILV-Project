# AILV-Project

AI-Unterstützung zur Erstellung von LV-Unterlagen

Ein webbasiertes Tool, das Lehrende bei der Erstellung von Lehrveranstaltungsunterlagen unterstützt. Das System zerlegt komplexe Aufgaben automatisch in kleinere Teilschritte, lässt sie von einem Large Language Model (LLM) bearbeiten und überprüft die Ergebnisse automatisch, um konsistente, qualitativ hochwertige Lehrunterlagen zu erstellen.

---

## Überblick

Das Projekt entwickelt eine Web-Anwendung zur automatisierten Generierung von Prüfungsfragen und Vorlesungsfolien. Anstatt ein LLM mit einer einzigen großen Anfrage zu überfordern, arbeitet das System mit einem mehrstufigen Workflow, der automatische Qualitätsprüfungen und Feedback-Schleifen beinhaltet.

**Hauptfunktionen:**
- Automatische Generierung von Prüfungsfragen zu beliebigen Themen
- Automatische Generierung von Vorlesungsfolien (Foliensätze)
- Bearbeitung und Validierung der generierten Inhalte
- Archiv für erstellte Fragen und Foliensätze (pro Benutzer)
- Unterstützung für Multiple Choice, Kurzantwort und Wahr/Falsch-Fragen
- Anpassbare Schwierigkeitsgrade mit prozentualer Verteilung
- PDF-Upload als zusätzliche Wissensquelle für die Generierung
- Mehrsprachige Unterstützung (Deutsch und Englisch)
- Benutzerverwaltung mit Registrierung, Login und Passwort-Reset

---

## Schnellstart

### Voraussetzungen

- Docker Desktop installiert und laufend
- OpenAI API-Key (für die Generierung erforderlich)

### Installation

1. Repository klonen:
   ```bash
   git clone https://github.com/shezsoltani/AILV-Project.git
   cd AILV-Project
   ```

2. Umgebungsvariablen konfigurieren:

   Eine `.env`-Datei im Projekt-Root anlegen. Alle Variablen sind Pflicht – das Backend startet sonst nicht.

   ```env
   OPENAI_API_KEY=ihr-api-key-hier
   OPENAI_MODEL_NAME=gpt-4o-mini
   JWT_SECRET_KEY=ihr-secret-key-hier
   JWT_ALGORITHM=HS256
   SMTP_HOST=sandbox.smtp.mailtrap.io
   SMTP_PORT=2525
   SMTP_USER=ihr-smtp-user
   SMTP_PASSWORD=ihr-smtp-passwort
   MAIL_FROM=test@example.com
   ```

   Für `SMTP_*` eignet sich [Mailtrap](https://mailtrap.io) als kostenloser Test-Dienst.

3. Projekt starten:
   ```bash
   docker-compose up --build
   ```

   Beim ersten Start werden alle Container gebaut und die Datenbank automatisch initialisiert.

4. Anwendung öffnen:
   
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API-Dokumentation: http://localhost:8000/docs

### Erste Schritte

1. http://localhost:3000 im Browser öffnen
2. Konto registrieren und einloggen
3. „Fragen generieren" oder „Folien generieren" wählen
4. Formular ausfüllen (Thema, Sprache, Umfang, optional PDF-Kontext hochladen)
5. Ergebnisse prüfen und bearbeiten
6. Ins persönliche Archiv speichern

---

## Technologie-Stack

- **Frontend:** React 18 mit TypeScript, Vite, React Router
- **Backend:** FastAPI (Python) mit asynchroner Unterstützung
- **Datenbank:** PostgreSQL 15 mit JSONB-Unterstützung
- **KI-Integration:** OpenAI API (Standard-Modell: gpt-4o, konfigurierbar)
- **Authentifizierung:** JWT, Passwort-Hashing mit bcrypt
- **PDF-Verarbeitung:** PyMuPDF (Textextraktion bis 5 MB)
- **Deployment:** Docker & Docker Compose

---

## Projektstruktur

```
AILV-Project/
├── backend/                    # FastAPI Backend
│   ├── app/
│   │   ├── api/               # API-Routen (REST-Endpunkte)
│   │   │   ├── routes_authentification.py   # /api/auth/*
│   │   │   ├── routes_generate.py           # /api/generate
│   │   │   ├── routes_finalize.py           # /api/finalize
│   │   │   ├── routes_archive.py            # /api/archive/*
│   │   │   ├── routes_slides.py             # /api/slides/generate, /api/slides/finalize
│   │   │   ├── routes_slides_archive.py     # /api/slides/archive/*
│   │   │   └── routes_upload.py             # /api/upload/pdf
│   │   │
│   │   ├── models/            # Datenmodelle (Pydantic & SQLAlchemy)
│   │   │   ├── sql_models.py
│   │   │   ├── base.py
│   │   │   ├── auth_models.py
│   │   │   ├── generate_models.py
│   │   │   ├── archive_models.py
│   │   │   ├── finalization_models.py
│   │   │   ├── slides_models.py
│   │   │   ├── slides_finalize_models.py
│   │   │   ├── slides_archive_models.py
│   │   │   └── upload_models.py
│   │   │
│   │   ├── services/          # Business-Logik
│   │   │   ├── auth/          # Registrierung, Login, Passwort-Reset
│   │   │   ├── generation/    # 3-Stage-Generierungsprozess (Fragen & Folien)
│   │   │   │   ├── orchestrator.py
│   │   │   │   ├── slides_orchestrator.py
│   │   │   │   ├── stage_runner.py
│   │   │   │   └── …
│   │   │   ├── finalization/  # Übergabe generierter Inhalte ins Archiv
│   │   │   ├── archive/       # Lesen, Bearbeiten, Löschen im Archiv
│   │   │   ├── context_upload/ # PDF-Textextraktion
│   │   │   ├── validators/    # Stage-Validatoren für LLM-Responses
│   │   │   ├── llm_client.py  # OpenAI API-Client
│   │   │   └── templateService.py  # Jinja2-Template-Verwaltung
│   │   │
│   │   ├── persistence/       # SQLAlchemy-Repositories (DB-Zugriff)
│   │   ├── core/              # Auth-Utils, Exceptions, Mail-Utils
│   │   ├── config.py          # Konfiguration (liest ENV-Variablen)
│   │   ├── db.py              # Datenbankverbindung
│   │   └── main.py            # FastAPI-App Einstiegspunkt
│   │
│   ├── Dockerfile
│   └── requirements.txt
│
├── frontend/                  # React Frontend
│   ├── src/
│   │   ├── pages/             # Seiten (auth/, questions/, slides/, core/)
│   │   ├── components/        # UI-Komponenten (generate/, archive/, slides/, auth/, shared/, routing/)
│   │   ├── hooks/             # Custom React Hooks (State-Management)
│   │   ├── services/          # API-Clients (authApi, questionsApi, slidesApi, uploadApi)
│   │   ├── context/           # AuthContext (globaler Auth-State)
│   │   ├── types/             # TypeScript-Typdefinitionen
│   │   ├── validators/        # Client-seitige Validierung
│   │   ├── error-handling/    # API-Fehlerparsing und Mapping
│   │   ├── utils/             # Hilfsfunktionen
│   │   ├── constants/         # Konstanten
│   │   ├── styles/            # CSS-Dateien
│   │   └── layout/            # Layout-Komponenten
│   │
│   ├── Dockerfile
│   └── package.json
│
├── db-init/                   # SQL-Skripte zur DB-Initialisierung
│   ├── 01_tables.sql
│   ├── 02_questions_templates.sql
│   └── 03_slides_templates.sql
│
├── docs/                      # Projekt-Dokumentation
│   ├── architecture.md
│   ├── database.md
│   └── sprint3_e2e_test.md
│
├── docker-compose.yml         # Container-Orchestrierung
└── README.md
```

---

## Funktionsweise

Beide Generatoren – Prüfungsfragen und Folien – folgen demselben dreistufigen Prinzip:

**Fragen (SKELETON → CONTENT → IMPROVE)**
1. **SKELETON-Stage:** Gerüst mit Fragetypen und Schwierigkeitsgraden
2. **CONTENT-Stage:** Vollständige Fragen mit Text und Antwortoptionen
3. **IMPROVE-Stage:** Sprachliche und didaktische Optimierung

**Folien (SLIDES_OUTLINE → SLIDES_CONTENT → SLIDES_IMPROVE)**
1. **SLIDES_OUTLINE-Stage:** Gliederung mit Folientiteln und -typen
2. **SLIDES_CONTENT-Stage:** Vollständige Folieninhalte (Bullets)
3. **SLIDES_IMPROVE-Stage:** Sprachliche und didaktische Optimierung

Jede Stage wird validiert und bei Fehlern automatisch wiederholt (bis zu 3 Versuche). Beim Retry erhält das LLM die Fehlermeldung des vorigen Versuchs als Kontext. Alle Prompts und Responses werden in der Datenbank gespeichert.

---

## Nützliche Befehle

```bash
# Services starten
docker-compose up -d

# Logs anzeigen
docker-compose logs -f

# Nur Backend-Logs
docker-compose logs -f backend

# Services stoppen
docker-compose down

# Services stoppen und Volumes löschen (löscht DB-Daten!)
docker-compose down -v

# Datenbank-Zugriff
docker-compose exec db psql -U postgres -d aildb
```

---

## Dokumentation

Weitere Informationen finden Sie in:

- [Architektur-Übersicht](docs/architecture.md) - Systemarchitektur und Datenfluss
- [API-Referenz](docs/api.md) - Alle Endpunkte, Request- und Response-Formate
- [Datenbank-Dokumentation](docs/database.md) - Schema und Tabellenstruktur

---

## Projektteam

- Elena Dordevic
- Emre Can Yüksel
- Shez Abbas Soltani
- Abdullah Hakimi

---
