# 🏋️ Athletee — Dein Hybrid-Athlet Dashboard

Persönliche Fitness-, Ernährungs- & Mindset-App mit integriertem KI-Coach.
Eine installierbare Web-App (PWA) — funktioniert auf iPhone & Android wie eine echte App.

## Features

- **Start (mittig in der Navi):** Schritte, Schlaf & Trainingsbereitschaft, Wochen-Streak, Tagesaufgaben, Wochenziele, Gewichtsverlauf, Wochenplan, Schnellstart.
- **Training:** Einheiten loggen (Grappling, Ringen, Laufen, Krafttraining, Ruhe/Sauna) mit realistischer Kalorienschätzung, Kraft-Tracker, **Kalender** zur Planung, Verlauf.
- **Ernährung:** Lebensmittel eintippen → **KI schätzt Kalorien & Makros**, Mahlzeit **fotografieren** → KI-Schätzung, Tageslog mit Makro-Zielen.
- **Coach:** KI-Coach, der deine echten Trainings & Fortschritte kennt · Daily Journal · **Mental-Coach** (ehrlich, kein Blatt vor dem Mund).
- **Fortschritt:** **Gewichts-Graph + KI-Analyse** (erklärt Abweichungen wie Wassereinlagerung), Wochenfotos, **BIA-Upload mit automatischem Auslesen**, Maße.
- **Profil (⚙️):** Deine Körperdaten, Ziele & Coach-Ton — alles editierbar, alles wird gespeichert.

Alle Eingaben bleiben gespeichert (lokal **und** auf dem Server, geräteübergreifend).

---

## 🚀 Einrichten (einmalig, ~5 Min)

Damit der KI-Coach funktioniert, läuft ein kleiner Server, der deinen Anthropic-API-Key **geheim** hält (er landet nie im Browser oder im Code).

### Schnellster Weg: Blueprint (1 Klick)

Dieses Repo enthält eine `render.yaml`. Damit:

1. Auf [render.com](https://render.com) → **New** → **Blueprint** → dieses Repo wählen.
2. Render richtet Build & Start automatisch ein und fragt nur noch nach `ANTHROPIC_API_KEY` (und optional `STEPS_TOKEN`).
3. **Apply** klicken → fertig.

### Oder manuell: Web Service

1. Code in ein GitHub-Repo pushen (ist bereits geschehen).
2. Auf [render.com](https://render.com) → **New** → **Web Service** → dein Repo wählen.
3. Einstellungen:
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
4. Unter **Environment** → **Add Environment Variable**:
   - `ANTHROPIC_API_KEY` = *dein Anthropic-Key* (der 5-$-Key)
   - *(optional)* `STEPS_TOKEN` = *ein eigenes Passwort für die Apple-Health-Schnittstelle* (Standard: `athletee`)
5. **Deploy** klicken. Nach ~1 Min bekommst du eine URL wie `https://athletee.onrender.com`.

> 🔒 Der Key wird nur serverseitig genutzt. Niemals in `index.html` oder ins Repo schreiben.

### Auf dem Handy installieren

- **iPhone:** URL in Safari öffnen → Teilen → **Zum Home-Bildschirm**.
- **Android:** URL in Chrome öffnen → Menü → **App installieren**.

Danach öffnet sich Athletee im Vollbild wie eine native App.

---

## 📲 Apple Health → Schritte automatisch

Eine Web-App darf Apple Health nicht direkt auslesen. Mit einem **Kurzbefehl** schickst du deine Schritte automatisch:

1. App **Kurzbefehle** → **+** → Aktion **„Health-Probendaten abrufen"** → *Schritte, heute*.
2. Aktion **„Inhalte von URL abrufen"** (Methode **GET**):
   ```
   https://DEINE-URL/api/steps?token=athletee&steps=[Schritte]
   ```
   `[Schritte]` = die Variable aus Schritt 1, `token` = dein `STEPS_TOKEN`.
3. **Automation** → **Täglich** (z.B. 22:00) → diesen Kurzbefehl ausführen.

Fertig — die Schritte erscheinen automatisch in der App. *(In der App findest du diese Anleitung auch unter „📲 Apple Health verbinden".)*

---

## 🖥️ Lokal starten (zum Testen)

```bash
npm install
ANTHROPIC_API_KEY=dein-key npm start
# → http://localhost:3000
```

## Technik

- `index.html` — die komplette App (PWA, eine Datei).
- `server.js` — Express-Server: `/api/coach` (Anthropic-Proxy), `/api/save` & `/api/load` (Daten), `/api/steps` (Apple Health).
- `manifest.webmanifest`, `sw.js`, `icon.svg` — PWA-Installierbarkeit & Offline-Shell.

Modelle: KI-Coach & Bildanalyse nutzen `claude-sonnet-4-6`, leichte Schätzungen `claude-haiku-4-5` (spart Budget).
