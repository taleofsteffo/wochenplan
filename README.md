# Stefanos Wochenplan – iPhone Web-App

Diese Dateien bilden eine installierbare Progressive Web App (PWA).

## Kostenlos mit GitHub Pages veröffentlichen

1. Auf github.com ein neues Repository anlegen, z. B. `wochenplan`.
2. Alle Dateien aus diesem Ordner in das Repository hochladen.
3. Im Repository `Settings` → `Pages` öffnen.
4. Unter `Build and deployment` als Quelle `Deploy from a branch` wählen.
5. Branch `main`, Ordner `/ (root)` wählen und speichern.
6. Nach der Veröffentlichung die angezeigte HTTPS-Adresse in Safari auf dem iPhone öffnen.
7. In Safari `Teilen` → `Zum Home-Bildschirm` → `Als Web-App öffnen` → `Hinzufügen`.

## Wöchentlicher Austausch

Für eine neue Woche genügt es, `plan.json` zu ersetzen. Oberfläche, App-Icon,
Notizen und die lokale Einkaufsliste bleiben erhalten. Danach in der App oben rechts
auf ↻ tippen.

## Wichtig

Eine PWA benötigt eine HTTPS-Webadresse. Direkt aus der Dateien-App kann die HTML-Datei
geöffnet werden, aber Offline-Installation und automatische Aktualisierung funktionieren
erst nach dem Hochladen auf einen statischen Webhost.
