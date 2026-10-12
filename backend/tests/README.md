# Backend-Tests mit Docker

Voraussetzung ist Docker mit Docker Compose v2 (unter Windows/Mac z. B. Docker
Desktop mit Linux-Containern).

## Alle Tests starten

```shell
docker compose -f compose.test.yml run --build --rm tests
```

Beim ersten Aufruf wird ein Python-3.11-Image mit `requirements-dev.txt` gebaut.

`TEST_DATABASE_URL` ist im Testdienst bereits gesetzt. Eine `.env.test`, lokale
Zugangsdaten oder eine gesetzte `DATABASE_URL` sind für diesen Aufruf nicht nötig.
Der Testcontainer wird nach dem Lauf entfernt. Der Befehl liefert den Exitcode
von pytest zurück: `0` bei Erfolg, einen anderen Wert bei Fehlern.

## Einzelne Tests starten

Nach dem ersten Build:

```shell
docker compose -f compose.test.yml run --rm tests tests/integration/test_database.py -v
docker compose -f compose.test.yml run --rm tests tests/unit -q
```

Die Verzeichnisse `app` und `tests` sowie `pytest.ini` werden schreibgeschützt
eingebunden. Änderungen daran sind beim nächsten Testlauf sofort verfügbar.
Nach Änderungen an Abhängigkeiten oder `Dockerfile.test` wieder den Befehl mit
`--build` verwenden. Pytest legt temporäre Dateien im Container ab.

## Datenbank und Isolation

- Jeder Entwickler erhält auf seinem Rechner eine eigene Datenbank `aildb_test`.
- Die Testumgebung verwendet das Compose-Projekt `ailv-tests` und das eigene
  Volume `test-db-data`. Das Volume der regulären Anwendung wird nicht verwendet.
- Bei einem neuen, leeren Testvolume legt das PostgreSQL-Image Datenbank und
  Benutzer an. Ein vorhandenes Testvolume wird weiterverwendet und nicht geleert.
- Die vorhandene Fixture `db_session` erstellt pro Testlauf ein neues Schema und
  isoliert Tests durch Savepoints und Rollback, auch bei `Session.commit()`.
- Verbindungen über die normale Anwendungs-Engine bleiben während pytest gesperrt.
- Die Testcontainer verwenden ein internes Docker-Netzwerk. Externe HTTP-, LLM-
  oder SMTP-Dienste sind daraus nicht erreichbar und müssen in Tests ersetzt werden.
- Die Datenbank veröffentlicht keinen Hostport. Docker-Tests verbinden sich
  ausschließlich intern mit `db-test:5432`; lokale Portkonflikte entfallen.
- Die Zugangsdaten `ailv_test` / `local-test-only` sind ausschließlich lokale
  Testwerte, keine Zugangsdaten für Entwicklung oder Produktion.

Die Tabellen werden aus den SQLAlchemy-Modellen erstellt. Constraints und
Startdaten, die nur in `db-init` definiert sind, werden damit nicht abgebildet.

