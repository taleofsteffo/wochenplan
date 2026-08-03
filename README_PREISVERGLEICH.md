# Wochenplan-App mit automatischem Preisvergleich

Diese Version ergänzt die mehrsprachige PWA um den Tab **Angebote / Offerte / Deals**.

## Konfiguration

- Deutschland: 51399 Burscheid
- Italien: 27018 Vidigulfo (PV)
- Suchradius: 15 km
- Märkte: alle auffindbaren normalen Supermärkte und Discounter
- Maximal empfohlene Geschäfte: 6
- App-/Kartenangebote: in der App ein- und ausschaltbar

Die Einstellungen stehen in `market-config.json`.

## Installation über das bestehende Repository

1. ZIP herunterladen und entpacken.
2. Im Repository `wochenplan` auf **Add file → Upload files** gehen.
3. Den gesamten Inhalt des entpackten Ordners hochladen.
4. Vorhandene Dateien ersetzen und committen.
5. GitHub Pages muss weiterhin unter **Settings → Pages → Source** auf
   **GitHub Actions** stehen.
6. Unter **Actions** den Workflow **Update plan, prices and deploy** öffnen.
7. Auf **Run workflow** klicken und auf grüne Häkchen bei Build und Deploy warten.
8. App öffnen und oben auf ↻ tippen.

## Was sonntags automatisch passiert

1. Neuer dreisprachiger Ernährungsplan.
2. Live-Websuche nach passenden Wochenpreisen für Burscheid und Vidigulfo.
3. Je Region zwei Warenkörbe:
   - mit App-/Kartenangeboten
   - ohne App-/Kartenangebote
4. Höchstens sechs Geschäfte je Warenkorb.
5. Preise ohne anklickbare Quelle werden nicht als gefunden angezeigt.
6. `plan.json` und `offers.json` werden gespeichert und GitHub Pages wird neu veröffentlicht.

## Wichtige Grenzen

Supermarktpreise und Prospekte sind nicht überall vollständig öffentlich oder
maschinenlesbar. Deshalb bedeutet „bester Preis“ in der App: der günstigste
zuverlässig gefundene und belegte Preis im Suchlauf. Es ist keine Garantie, dass
keine einzelne Filiale noch günstiger ist. Fehlende oder unsichere Artikel werden
offen als nicht gefunden gekennzeichnet.

Die Websuche verursacht zusätzliche OpenAI-API-Kosten. Zwei regionale,
umfangreiche Preisrecherchen können deutlich mehr kosten als die reine
Ernährungsplan-Erstellung.
