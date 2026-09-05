function renderEinstellungen() {
  const view = document.getElementById('view-einstellungen');
  const backups = getBackups().slice().reverse();

  const backupsHtml = backups.length ? backups.map(b => `
    <div class="settings-row" data-date="${escapeHtml(b.date)}">
      <span>${new Date(b.date).toLocaleString('de-DE')}</span>
      <span style="display:flex;gap:6px">
        <button type="button" class="backup-restore">Wiederherstellen</button>
        <button type="button" class="backup-download">⬇</button>
        <button type="button" class="backup-delete">✕</button>
      </span>
    </div>
  `).join('') : `<div class="empty-state">Noch keine automatischen Backups vorhanden.</div>`;

  view.innerHTML = `
    <div class="card">
      <h2>Kategorien · Einnahmen</h2>
      ${renderCatChips('income')}
      <div class="cat-input-row">
        <input type="text" id="incCatNew" placeholder="Neue Kategorie…" />
        <button type="button" id="incCatAddBtn">+</button>
      </div>
    </div>

    <div class="card">
      <h2>Kategorien · Ausgaben</h2>
      ${renderCatChips('expense')}
      <div class="cat-input-row">
        <input type="text" id="expCatNew" placeholder="Neue Kategorie…" />
        <button type="button" id="expCatAddBtn">+</button>
      </div>
    </div>

    <div class="card">
      <h2>Daten</h2>
      <div class="settings-row"><span>Backup-Datei anlegen (JSON)</span><button type="button" id="exportJsonBtn">Datei anlegen</button></div>
      <div class="settings-row"><span>Backup-Datei laden (JSON)</span><button type="button" id="importJsonBtn">Datei laden</button></div>
      <div class="settings-row"><span>Als CSV exportieren</span><button type="button" id="exportCsvBtn">Exportieren</button></div>
      <div class="settings-row"><span>Backup jetzt anlegen</span><button type="button" id="createBackupBtn">Anlegen</button></div>
    </div>

    <div class="card">
      <h2>Belegfotos</h2>
      <div class="settings-row">
        <span>Speicherort</span>
        <span style="color:var(--color-text-muted);font-size:13px;text-align:right">Nur lokal auf diesem Gerät<br/>(Browser-Speicher, IndexedDB)</span>
      </div>
      <div class="settings-row">
        <span>Bildqualität</span>
        <select id="receiptQualitySelect">
          ${Object.entries(RECEIPT_QUALITY_PRESETS).map(([key, p]) =>
            `<option value="${key}" ${getReceiptQuality() === key ? 'selected' : ''}>${escapeHtml(p.label)}</option>`).join('')}
        </select>
      </div>
      <div class="settings-row"><span id="receiptStorageInfo">Belegspeicher wird berechnet…</span></div>
      <div class="settings-row"><span>Alle Belege als ZIP in „Dateien“ sichern</span><button type="button" id="exportReceiptsZipBtn">ZIP anlegen</button></div>
      <div class="settings-row"><span>Alle Belegfotos löschen</span><button type="button" class="danger" id="deleteAllReceiptsBtn">Löschen</button></div>
    </div>

    <div class="card">
      <h2>Automatische Backups</h2>
      <p style="color:var(--color-text-muted);font-size:13px;margin:0 0 10px">
        Beim ersten Öffnen an einem Tag legt die App von selbst einen Stand an.
        Behalten werden die letzten ${MAX_BACKUPS} — der älteste fällt dann raus.
        Sie liegen nur auf diesem Gerät; ein Backup zum Mitnehmen gibt es oben
        unter „Daten“.
      </p>
      <div id="backupList">${backupsHtml}</div>
    </div>
  `;

  wireCatChips('income');
  wireCatChips('expense');

  document.getElementById('incCatAddBtn').addEventListener('click', () => addCategoryFromInput('income', 'incCatNew'));
  document.getElementById('expCatAddBtn').addEventListener('click', () => addCategoryFromInput('expense', 'expCatNew'));

  document.getElementById('exportJsonBtn').addEventListener('click', exportJson);
  document.getElementById('importJsonBtn').addEventListener('click', () => document.getElementById('importFileInput').click());
  document.getElementById('exportCsvBtn').addEventListener('click', exportCsv);
  document.getElementById('createBackupBtn').addEventListener('click', () => {
    pushBackup();
    toast('Backup angelegt');
    renderEinstellungen();
  });

  document.getElementById('receiptQualitySelect').addEventListener('change', (e) => {
    setReceiptQuality(e.target.value);
    toast('Bildqualität gespeichert (gilt für künftige Belegfotos)');
  });

  document.getElementById('exportReceiptsZipBtn').addEventListener('click', exportReceiptsZip);

  document.getElementById('deleteAllReceiptsBtn').addEventListener('click', async () => {
    if (!confirm('Alle Belegfotos lokal löschen? Die Buchungen selbst bleiben erhalten, nur die Fotos werden entfernt.')) return;
    await deleteAllReceipts();
    const txns = getTransactions().map(t => t.hasReceipt ? { ...t, hasReceipt: false } : t);
    saveTransactions(txns);
    toast('Alle Belegfotos gelöscht');
    rerenderAll();
  });

  getReceiptsStorageInfo().then(({ count, bytes }) => {
    const el = document.getElementById('receiptStorageInfo');
    if (!el) return;
    const mb = (bytes / (1024 * 1024)).toFixed(bytes > 1024 * 1024 ? 1 : 2);
    el.textContent = count ? `${count} Beleg${count === 1 ? '' : 'e'} · ca. ${mb} MB lokal gespeichert` : 'Keine Belegfotos gespeichert.';
  });

  view.querySelectorAll('.backup-restore').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const date = e.target.closest('.settings-row').dataset.date;
      if (!confirm('Diesen Backup-Stand wiederherstellen? Aktuelle Daten werden überschrieben.')) return;
      const backup = getBackups().find(b => b.date === date);
      if (backup) {
        restoreAllData(backup.data);
        toast('Backup wiederhergestellt');
        rerenderAll();
      }
    });
  });
  view.querySelectorAll('.backup-download').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const date = e.target.closest('.settings-row').dataset.date;
      const backup = getBackups().find(b => b.date === date);
      if (backup) download(`kassenbuch_backup_${date.slice(0, 10)}.json`, 'application/json', JSON.stringify(backup.data, null, 2));
    });
  });
  view.querySelectorAll('.backup-delete').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const date = e.target.closest('.settings-row').dataset.date;
      if (!confirm('Dieses Backup löschen?')) return;
      deleteBackup(date);
      renderEinstellungen();
    });
  });
}

function renderCatChips(type) {
  const cats = getCategories(type);
  if (!cats.length) return `<div class="empty-state">Keine Kategorien.</div>`;
  return `<div class="cat-chips" data-type="${type}">${cats.map(c => `
    <span class="cat-chip">${escapeHtml(c)}<button type="button" data-cat="${escapeHtml(c)}" title="Kategorie löschen">✕</button></span>
  `).join('')}</div>`;
}

function wireCatChips(type) {
  document.querySelectorAll(`.cat-chips[data-type="${type}"] button`).forEach(btn => {
    btn.addEventListener('click', () => {
      const cats = getCategories(type);
      if (cats.length <= 1) return toast('Mindestens eine Kategorie muss bestehen bleiben.');
      const name = btn.dataset.cat;
      if (!confirm(`Kategorie „${name}" löschen? Bereits gespeicherte Buchungen behalten die Bezeichnung.`)) return;
      deleteCategory(type, name);
      toast(`Kategorie „${name}" gelöscht`);
      renderEinstellungen();
    });
  });
}

function addCategoryFromInput(type, inputId) {
  const input = document.getElementById(inputId);
  const name = input.value.trim();
  if (!name) return toast('Bitte einen Kategorienamen eingeben.');
  if (!addCategory(type, name)) return toast('Diese Kategorie gibt es schon.');
  toast(`Kategorie „${name}" angelegt`);
  renderEinstellungen();
}

function exportJson() {
  const data = getAllData();
  download(`kassenbuch_${todayIso()}.json`, 'application/json', JSON.stringify(data, null, 2));
  toast('Export gestartet');
}

function exportCsv() {
  const accounts = getAccounts();
  const accName = id => accounts.find(a => a.id === id)?.name || '';
  const rows = [['Typ', 'Datum', 'Kategorie', 'Konto', 'Beschreibung', 'Betrag (€)']];
  for (const t of sortedTransactionsDesc()) {
    const typeLabel = t.type === 'income' ? 'Einnahme' : t.type === 'expense' ? 'Ausgabe' : 'Umbuchung';
    const account = t.type === 'transfer' ? `${accName(t.fromAccountId)} → ${accName(t.toAccountId)}` : accName(t.accountId);
    rows.push([typeLabel, t.date, t.category || '', account, t.desc || '', t.amount.toFixed(2)]);
  }
  const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(';')).join('\r\n');
  download(`kassenbuch_${todayIso()}.csv`, 'text/csv', '﻿' + csv);
  toast('CSV-Export gestartet');
}

async function exportReceiptsZip() {
  const rows = await getAllReceiptsRaw();
  if (!rows.length) return toast('Keine Belegfotos vorhanden.');

  const txns = getTransactions();
  const usedNames = new Set();
  const files = rows.map(row => {
    const txn = txns.find(t => t.id === row.txnId);
    const date = txn?.date || row.savedAt.slice(0, 10);
    const cat = (txn?.category || (txn?.type === 'transfer' ? 'Umbuchung' : 'Beleg')).replace(/[^a-zA-Z0-9äöüÄÖÜß_-]+/g, '_');
    let name = `${date}_${cat}.jpg`;
    let i = 2;
    while (usedNames.has(name)) { name = `${date}_${cat}_${i++}.jpg`; }
    usedNames.add(name);
    return { name, data: dataUrlToBytes(row.dataUrl), date: new Date(row.savedAt) };
  });

  const blob = buildZipBlob(files);
  download(`kassenbuch_belege_${todayIso()}.zip`, 'application/zip', blob);
  toast('ZIP wird zum Sichern angeboten – im Dialog „In Dateien sichern“ wählen.');
}

function wireImportInput() {
  document.getElementById('importFileInput').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        if (!confirm('Backup importieren? Aktuelle Daten werden überschrieben.')) return;
        pushBackup();
        restoreAllData(data);
        toast('Import erfolgreich');
        rerenderAll();
      } catch {
        toast('Datei konnte nicht gelesen werden.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  });
}
