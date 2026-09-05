function renderKonten() {
  const view = document.getElementById('view-konten');
  const alle = getAccounts();
  const accounts = alle.filter(a => !a.archived);
  const archiviert = alle.filter(a => a.archived);

  const karte = (a) => `
      <div class="account-card" data-id="${a.id}">
        <span class="account-icon">${escapeHtml(a.icon || '💰')}</span>
        <span class="account-name">${escapeHtml(a.name)}</span>
        <span class="account-balance">${formatCurrency(getAccountBalance(a.id))}</span>
      </div>
    `;

  const cardsHtml = accounts.length
    ? accounts.map(karte).join('')
    : `<div class="empty-state">Noch keine Konten angelegt.</div>`;

  // Ein archiviertes Konto zählt weiter zum Gesamtsaldo (getTotalBalance
  // summiert über alle Konten), stand aber auf keiner sichtbaren Karte mehr —
  // die Kopfzeile wich damit ohne Erklärung von der Summe der Karten ab. Und es
  // gab keinen Weg zurück aus dem Archiv. Beides erledigt dieser Abschnitt:
  // die Differenz steht hier, und ein Tipp auf eine Karte öffnet denselben
  // Dialog, dort mit „Wieder aktivieren“.
  const archivSumme = archiviert.reduce((s, a) => s + getAccountBalance(a.id), 0);
  const archivHtml = archiviert.length ? `
    <div class="card">
      <details class="archived-accounts">
        <summary>Archivierte Konten (${archiviert.length}) · ${formatCurrency(archivSumme)}</summary>
        <p class="archived-hint">
          Diese Konten zählen weiter zum Gesamtsaldo oben. Antippen, um eines
          wieder zu aktivieren.
        </p>
        <div id="archivedAccountList">${archiviert.map(karte).join('')}</div>
      </details>
    </div>
  ` : '';

  view.innerHTML = `
    <div class="card">
      <h2>Konten</h2>
      <div id="accountList">${cardsHtml}</div>
      <div class="modal-actions" style="margin-top:16px">
        <button type="button" class="btn-secondary" id="newAccountBtn">+ Konto</button>
        <button type="button" class="btn-primary" id="transferBtn">⇄ Umbuchung</button>
      </div>
    </div>
    ${archivHtml}
  `;

  view.querySelectorAll('.account-card').forEach(card => {
    card.addEventListener('click', () => openAccountModal(card.dataset.id));
  });
  document.getElementById('newAccountBtn').addEventListener('click', () => openAccountModal(null));
  document.getElementById('transferBtn').addEventListener('click', () => openTxnModal({ type: 'transfer' }));
}

function openAccountModal(id) {
  const form = document.getElementById('accForm');
  form.reset();
  const archiveBtn = document.getElementById('accArchiveBtn');
  if (id) {
    const acc = getAccounts().find(a => a.id === id);
    if (!acc) return;
    document.getElementById('accId').value = acc.id;
    document.getElementById('accName').value = acc.name;
    document.getElementById('accIcon').value = acc.icon || '';
    document.getElementById('accStartBalance').value = acc.startBalance || 0;
    archiveBtn.style.display = '';
    archiveBtn.textContent = acc.archived ? 'Wieder aktivieren' : 'Archivieren';
  } else {
    document.getElementById('accId').value = '';
    archiveBtn.style.display = 'none';
    archiveBtn.textContent = 'Archivieren';
  }
  openModal('accModalBackdrop');
}

function wireAccountModal() {
  document.getElementById('accCancelBtn').addEventListener('click', () => closeModal('accModalBackdrop'));
  document.getElementById('accArchiveBtn').addEventListener('click', () => {
    const id = document.getElementById('accId').value;
    if (!id) return;
    const acc = getAccounts().find(a => a.id === id);
    if (!acc) return;
    if (acc.archived) {
      unarchiveAccount(id);
      closeModal('accModalBackdrop');
      toast('Konto wieder aktiv');
      rerenderAll();
      return;
    }
    if (!confirm('Dieses Konto archivieren? Bereits erfasste Buchungen bleiben erhalten, '
      + 'und sein Saldo zählt weiter zum Gesamtsaldo. Im Reiter Konten steht es dann unter '
      + '„Archivierte Konten“ — von dort lässt es sich wieder aktivieren.')) return;
    archiveAccount(id);
    closeModal('accModalBackdrop');
    toast('Konto archiviert');
    rerenderAll();
  });
  document.getElementById('accForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const id = document.getElementById('accId').value || genId('acc');
    const name = document.getElementById('accName').value.trim();
    if (!name) return toast('Bitte einen Namen eingeben.');
    const existing = getAccounts().find(a => a.id === id);
    upsertAccount({
      id,
      name,
      icon: document.getElementById('accIcon').value.trim() || '💰',
      startBalance: parseFloat(document.getElementById('accStartBalance').value) || 0,
      // Beim Bearbeiten den Archiv-Status beibehalten — sonst würde ein
      // archiviertes Konto durch bloßes Speichern wieder aktiviert.
      archived: existing ? !!existing.archived : false,
    });
    closeModal('accModalBackdrop');
    toast('Konto gespeichert');
    rerenderAll();
  });
}
