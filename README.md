# 💶 Kassenbuch

Einnahmen und Ausgaben erfassen und gegenrechnen — über mehrere **Konten**
hinweg, mit **Kategorien** und einem **Monatslimit** je Budget. Ein privates
Werkzeug, kein Vereinsdokument.

**➡️ [Kassenbuch öffnen](https://tecko1985.github.io/kassenbuch/)**

> Das Kassenbuch liegt seit dem 01.09.2026 im privaten Bereich. Die alte Adresse
> `sc1911heiligenstadt.github.io/kassenbuch/` leitet nur noch hierher weiter.

## Was erfasst wird

Eine Buchung trägt **Datum**, **Betrag (€)**, eine **Beschreibung**, eine
**Kategorie** und das **Konto**. Umbuchungen laufen über **Von Konto** und
**Auf Konto**, ein **Beleg** lässt sich anhängen.

Ein Konto hat einen **Namen**, ein **Icon (Emoji)** und einen **Startsaldo (€)**;
je **Budget** lässt sich ein **Monatslimit (€)** setzen, an dem sich messen
lässt, ob der Monat im Rahmen bleibt.

## Die Reiter

| Reiter | Wofür |
|---|---|
| 🏠 Übersicht | Gesamtsaldo über alle Konten, Einnahmen, Ausgaben und Differenz des laufenden Monats, die letzten Buchungen und unten ein Notizfeld |
| 📋 Buchungen | Die vollständige Liste, eingrenzbar nach Monat, Konto und Kategorie |
| 🎯 Budgets | Monatslimit je Kategorie mit Fortschrittsanzeige |
| 💳 Konten | Konten und Kassen anlegen, umbenennen, Startsaldo setzen |
| ⚙️ Einstellungen | Kategorien pflegen, Sicherungen, Belegfotos, Exporte |
| ℹ️ Info | Was die App kann, und der Datenschutzhinweis |

## Notizen

Ganz unten auf der **Übersicht** liegt ein Feld für freien Text — für
Merkposten, offene Beträge oder was noch zu buchen ist. Es speichert sich beim
Tippen von selbst; unter dem Feld steht kurz **Gespeichert ✓**, sobald das
passiert ist. Die Notiz wandert mit in die JSON-Sicherung und in die
automatischen Sicherungen.

## Sichern und Weitergeben

Unter **Einstellungen** lässt sich der komplette Stand als JSON-Datei sichern
und wieder einlesen, und die Buchungen lassen sich als CSV für Excel
exportieren. Zusätzlich legt die App automatisch Sicherungen an: beim ersten
Öffnen an einem Tag entsteht ein Stand, behalten werden die letzten zehn. Jeder
Stand lässt sich daraus wiederherstellen oder einzeln herunterladen. Diese
Sicherungen liegen im Browser-Speicher desselben Geräts — die JSON-Datei ist
die Sicherung zum Mitnehmen. Belegfotos liegen
getrennt davon im Gerätespeicher; sie lassen sich gebündelt als ZIP-Datei
sichern, in der Bildqualität einstellen oder komplett löschen.

## Wo die Daten liegen

Alles bleibt **auf diesem Gerät** — Buchungen, Konten und Budgets im Browser-
Speicher, die Belegfotos in der Gerätedatenbank. Es gibt keinen Server und kein
Konto, also auch keinen Abgleich zwischen zwei Geräten. Denk deshalb an
regelmäßige Sicherungen.

Die Seite ist als App installierbar: Sie lässt sich auf den Home-Bildschirm
legen und funktioniert danach auch ohne Internet.

## Wichtig: nicht die Vereinskasse

Die Vereinsfinanzen laufen über das
[Vereinsbudget](https://sc1911heiligenstadt.github.io/sc-heiligenstadt-budget/vereinsbudget.html)
und die
[Vereinsverwaltung](https://sc1911heiligenstadt.github.io/vereinsverwaltung/).
Das Kassenbuch hat damit nichts zu tun.

## Zugang

Dieses Werkzeug braucht **keine Anmeldung** über das Vereinskonto und steht
bewusst nicht auf der Kachelübersicht.

## Lokal starten

Über den Eintrag `kassenbuch` in `E:\.claude\launch.json` — der Server läuft dann auf `http://localhost:8420/`.

## Technik

Vanilla JavaScript ohne Build-Schritt — die Dateien werden so ausgeliefert, wie sie im Repo liegen. Veröffentlicht über GitHub Pages.

Statt `?v=`-Anhängseln an den Dateinamen sorgt hier der Service Worker `sw.js`
für frische Dateien: Er hält die Dateiliste `SHELL_FILES` unter dem Namen in
`CACHE_NAME` vor. Wird `CACHE_NAME` hochgezählt, verwirft der Browser den alten
Stand und lädt alles neu. **Bei jeder Änderung an einer ausgelieferten Datei
muss `CACHE_NAME` also mit hochgezählt werden** — sonst bekommen bereits
installierte Geräte die Änderung nicht zu sehen. Neue Dateien gehören
zusätzlich in `SHELL_FILES`.

---

Ein Werkzeug des 1. SC 1911 Heiligenstadt. Alle Werkzeuge auf einen Blick: [Tools-Übersicht](https://sc1911heiligenstadt.github.io/ToolsUebersicht/) · Erklärungen im [Toolbox Wiki](https://sc1911heiligenstadt.github.io/Vereinswiki/).
