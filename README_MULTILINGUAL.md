# Mehrsprachige Wochenplan-App

Diese Version unterstützt:

- Deutsch
- Italiano
- English
- automatische Erkennung der Browser-/iPhone-Sprache
- manuellen Sprachwechsel in der App
- lokal gespeicherte Einkaufshäkchen und Notizen pro Gerät
- Offline-Nutzung als PWA
- automatische dreisprachige Wochenupdates über GitHub Actions

## Bestehendes Repository aktualisieren

1. ZIP-Datei herunterladen und entpacken.
2. Im bestehenden GitHub-Repository `wochenplan` **Add file → Upload files** öffnen.
3. Alle Dateien und Ordner aus dem entpackten Paket hochladen.
4. Vorhandene Dateien mit demselben Namen ersetzen lassen.
5. Commit durchführen.
6. Unter **Actions** den Workflow
   `Update and deploy multilingual meal plan`
   einmal manuell starten.
7. Nach erfolgreichem Deployment die App neu öffnen und oben auf ↻ tippen.

Wichtig: `plan.json`, `app.js`, `index.html`, der Workflow und
`scripts/generate_plan.py` gehören zusammen. Bitte das vollständige Paket
hochladen, nicht nur einzelne Dateien.

## Sprache

Beim ersten Öffnen wird automatisch Deutsch, Italienisch oder Englisch anhand
der Gerätesprache gewählt. Andere Gerätesprachen verwenden Englisch als Standard.
Die Sprache lässt sich oben in der App jederzeit ändern.

## Datenschutz

Einkaufshäkchen, Sprache und Notizen werden nur lokal im jeweiligen Browser
gespeichert. Freunde sehen weder Stefanos Häkchen noch die Notizen anderer Nutzer.

## Automatische Aktualisierung

Der GitHub-Action-Workflow erstellt jeden Sonntag eine neue `plan.json` mit allen
drei Übersetzungen und veröffentlicht die aktualisierte App über GitHub Pages.
Dafür muss im Repository weiterhin das Secret `OPENAI_API_KEY` vorhanden sein.
