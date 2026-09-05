const APP_VERSION = '1.0';

const APP_CHANGELOG = [
  {
    version: '1.4',
    groups: [
      {
        title: 'Behoben',
        items: [
          'Ein archiviertes Konto lässt sich wieder aktivieren. Im Reiter Konten steht dafür unten der Abschnitt „Archivierte Konten“ — antippen, und im Dialog steht statt „Archivieren“ jetzt „Wieder aktivieren“.',
          'Vorher war ein Druck auf „Archivieren“ endgültig. Der Knopf sitzt im selben Dialog wie „Speichern“, und Karten gab es nur für nicht-archivierte Konten. Der einzige Ausweg war: alles als Datei sichern, die Datei von Hand ändern und wieder einlesen.',
          'Der Gesamtsaldo oben passt wieder zu dem, was man sieht. Ein archiviertes Konto zählt weiter mit — bisher stand oben Geld, das auf keiner Karte mehr auftauchte, ohne jeden Hinweis woher. Jetzt steht die Summe der archivierten Konten in ihrem Abschnitt, und die Rückfrage beim Archivieren sagt es dazu.',
          'Eine Umbuchung mit einem archivierten Konto zeigt wieder dessen Namen statt eines Fragezeichens.',
        ],
      },
    ],
  },
  {
    version: '1.3',
    groups: [
      {
        title: 'Behoben',
        items: [
          'Die automatischen Backups entstehen jetzt wirklich von selbst — einmal beim ersten Öffnen an einem Tag.',
          'Vorher passierte das nie. Ein Stand kam nur zustande, wenn man in den Einstellungen auf „Backup jetzt anlegen“ drückte oder eine Datei einlas. Buchen, Ändern, Löschen: nichts davon legte etwas an. Die leere Liste sah aus wie „noch nichts passiert“, war aber „passiert nie“ — und genau darauf verlässt man sich, wenn der Browser die Daten weggeräumt hat.',
          'Auf der Karte steht jetzt, wann ein Stand entsteht und wie viele behalten werden.',
        ],
      },
    ],
  },
  {
    version: '1.2',
    groups: [
      {
        title: 'Geändert',
        items: [
          'Der Knopf „Zurück zum Dashboard“ oben ist weg — das Kassenbuch ist ein eigenständiges Werkzeug und hängt an keiner Tool-Übersicht.',
        ],
      },
    ],
  },
  {
    version: '1.1',
    groups: [
      {
        title: 'Neu',
        items: [
          'Notizfeld unten auf der Übersicht — für Merkposten, offene Beträge und was noch zu buchen ist.',
          'Die Notiz speichert sich beim Tippen von selbst und liegt mit in der JSON-Sicherung und in der Backup-Historie.',
        ],
      },
    ],
  },
  {
    version: '1.0',
    groups: [
      {
        title: 'Buchen',
        items: [
          'Einnahmen, Ausgaben und Umbuchungen mit Datum, Betrag, Kategorie und Beschreibung erfassen.',
          'Frei anlegbare Kategorien, mehrere Konten und Kassen mit eigenem Saldo.',
          'Belegfotos direkt an eine Buchung hängen.',
        ],
      },
      {
        title: 'Überblick behalten',
        items: [
          'Übersicht mit Gesamtsaldo sowie Einnahmen, Ausgaben und Differenz des laufenden Monats.',
          'Buchungsliste nach Monat, Konto und Kategorie eingrenzen.',
          'Monatliche Budgets je Kategorie mit Fortschrittsanzeige.',
        ],
      },
      {
        title: 'Sichern',
        items: [
          'Export und Import als JSON-Datei, Export als CSV für Excel.',
          'Automatische Backup-Historie — jeder gesicherte Stand lässt sich wiederherstellen oder als Datei herunterladen.',
          'Alle Belegfotos gebündelt als ZIP-Datei sichern; die Bildqualität ist einstellbar.',
        ],
      },
      {
        title: 'Unterwegs',
        items: [
          'Funktioniert offline und lässt sich auf den Home-Bildschirm legen.',
          'Alle Daten bleiben auf diesem Gerät — es gibt keinen Server und kein Konto.',
        ],
      },
    ],
  },
];

function renderInfo() {
  const view = document.getElementById('view-info');

  const changelogHtml = APP_CHANGELOG.map(entry => `
    <div class="changelog-entry">
      <div class="changelog-version">Version ${escapeHtml(entry.version)}</div>
      ${entry.groups.map(g => `
        <div class="changelog-group">
          <div class="changelog-group-title">${escapeHtml(g.title)}</div>
          <ul>${g.items.map(i => `<li>${escapeHtml(i)}</li>`).join('')}</ul>
        </div>
      `).join('')}
    </div>
  `).join('');

  view.innerHTML = `
    <div class="card">
      <h2>Über das Kassenbuch <span class="version-badge" id="version-badge-2"></span></h2>
      <p class="info-text">
        Dein persönliches Haushaltsbuch. Alle Daten bleiben lokal auf diesem Gerät —
        es gibt keinen Server und kein Konto. Denk deshalb an regelmäßige Sicherungen
        über „Einstellungen“.
      </p>
    </div>
    <div class="card">
      <h2>Änderungen</h2>
      ${changelogHtml}
    </div>
  `;

  // Erst nach dem Rendern -- #version-badge-2 entsteht oben.
  document.querySelectorAll('#version-badge-2').forEach(el => {
    if (el) el.textContent = 'v' + APP_VERSION;
  });
}
