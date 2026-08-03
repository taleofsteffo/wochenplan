# Kostenlose Version ohne OpenAI API

Diese kleine Aktualisierung ersetzt den bisherigen Workflow.

## Installation

1. ZIP-Datei entpacken.
2. Im GitHub-Repository `wochenplan` öffnen:
   `Code → Add file → Upload files`.
3. Den Ordner `.github` aus diesem Paket hochladen.
4. GitHub soll die vorhandene Datei
   `.github/workflows/update-and-deploy.yml` ersetzen.
5. Commit speichern.
6. Unter `Actions` erscheint anschließend:
   `Deploy meal plan app without API`.
7. Workflow einmal über `Run workflow` starten.

## Danach

- Es wird kein `OPENAI_API_KEY` benötigt.
- Der Workflow erzeugt keine API-Kosten.
- Er veröffentlicht nur die Dateien, die bereits im Repository liegen.
- Neue Wochenpläne und aktuelle Supermarktpreise müssen als aktualisierte
  `plan.json` beziehungsweise `offers.json` hochgeladen werden.
- Das vorhandene GitHub-Secret `OPENAI_API_KEY` kann gelöscht werden, falls es
  bereits angelegt wurde.

GitHub Pages bleibt weiterhin unter:
https://taleofsteffo.github.io/wochenplan/
