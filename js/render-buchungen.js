let txnFilterMonth = null; // 'YYYY-MM' or null = alle
let txnFilterAccount = '';
let txnFilterCategory = '';

// Pending-Beleg-Zustand für das offene Buchungs-Modal
let pendingReceiptDataUrl = undefined; // undefined = unverändert, null = entfernt, string = neu/aktuell
let pendingReceiptOriginalHasReceipt = false;

function renderBuchungen() {
  const view = document.getElementById('view-buchungen');
  // Für die Namensauflösung in den Zeilen ALLE Konten — eine Umbuchung mit
  // einem archivierten Konto las sich sonst als „? → Bar“. Der Filter oben
  // bietet weiter nur die aktiven an.
  const alleKonten = getAccounts();
  const accounts = alleKonten.filter(a => !a.archived);

  let txns = sortedTransactionsDesc();
  if (txnFilterMonth) txns = txns.filter(t => t.date.startsWith(txnFilterMonth));
  if (txnFilterAccount) txns = txns.filter(t => t.accountId === txnFilterAccount || t.fromAccountId === txnFilterAccount || t.toAccountId === txnFilterAccount);
  if (txnFilterCategory) txns = txns.filter(t => t.category === txnFilterCategory);

  const allCats = [...new Set([...getCategories('income'), ...getCategories('expense')])];

  const monthOptions = getAvailableMonths().map(m =>
    `<option value="${m}" ${txnFilterMonth === m ? 'selected' : ''}>${formatMonthLabel(m)}</option>`).join('');

  const accountOptions = accounts.map(a =>
    `<option value="${a.id}" ${txnFilterAccount === a.id ? 'selected' : ''}>${escapeHtml(a.name)}</option>`).join('');

  const categoryOptions = allCats.map(c =>
    `<option value="${escapeHtml(c)}" ${txnFilterCategory === c ? 'selected' : ''}>${escapeHtml(c)}</option>`).join('');

  const listHtml = txns.length ? txns.map(t => renderTxnItem(t, alleKonten)).join('') :
    `<div class="empty-state">Keine Buchungen gefunden.</div>`;

  view.innerHTML = `
    <div class="card">
      <h2>Buchungen</h2>
      <div class="filter-row">
        <select id="filterMonth"><option value="">Alle Monate</option>${monthOptions}</select>
        <select id="filterAccount"><option value="">Alle Konten</option>${accountOptions}</select>
        <select id="filterCategory"><option value="">Alle Kategorien</option>${categoryOptions}</select>
      </div>
      <div class="txn-list" id="txnList">${listHtml}</div>
    </div>
  `;

  document.getElementById('filterMonth').addEventListener('change', (e) => { txnFilterMonth = e.target.value || null; renderBuchungen(); });
  document.getElementById('filterAccount').addEventListener('change', (e) => { txnFilterAccount = e.target.value; renderBuchungen(); });
  document.getElementById('filterCategory').addEventListener('change', (e) => { txnFilterCategory = e.target.value; renderBuchungen(); });

  view.querySelectorAll('.txn-item').forEach(el => {
    el.addEventListener('click', () => openTxnModal({ id: el.dataset.id }));
  });
}

function getAvailableMonths() {
  const months = new Set(getTransactions().map(t => t.date.slice(0, 7)));
  months.add(todayIso().slice(0, 7));
  return [...months].sort().reverse();
}

function formatMonthLabel(ym) {
  const [y, m] = ym.split('-');
  const names = ['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'];
  return `${names[parseInt(m, 10) - 1]} ${y}`;
}

function renderTxnItem(t, accounts) {
  const accName = id => accounts.find(a => a.id === id)?.name || '?';
  let icon, label, amountClass, amountSign;
  if (t.type === 'income') { icon = '⬆️'; label = t.category; amountClass = 'income'; amountSign = '+'; }
  else if (t.type === 'expense') { icon = '⬇️'; label = t.category; amountClass = 'expense'; amountSign = '−'; }
  else { icon = '⇄'; label = `${accName(t.fromAccountId)} → ${accName(t.toAccountId)}`; amountClass = 'transfer'; amountSign = ''; }

  const receiptBadge = t.hasReceipt ? '<span class="txn-receipt-badge">📎</span>' : '';

  return `
    <div class="txn-item" data-id="${t.id}">
      <span class="txn-icon">${icon}</span>
      <div class="txn-main">
        <div class="txn-cat">${escapeHtml(label)}${receiptBadge}</div>
        <div class="txn-desc">${escapeHtml(t.desc || '')}</div>
        <div class="txn-date">${formatDate(t.date)}</div>
      </div>
      <div class="txn-amount ${amountClass}">${amountSign}${formatCurrency(t.amount)}</div>
    </div>
  `;
}

// ── Transaktions-Modal ─────────────────────────────────────────────────────

function openTxnModal({ id = null, type = 'expense' } = {}) {
  const form = document.getElementById('txnForm');
  form.reset();

  pendingReceiptDataUrl = undefined;
  pendingReceiptOriginalHasReceipt = false;
  document.getElementById('receiptFileInput').value = '';
  showReceiptPreview(null);

  let txn = null;
  if (id) {
    txn = getTransactions().find(t => t.id === id);
    type = txn.type;
  }

  // Konten für die Auswahl: aktive Konten + ggf. das archivierte Konto dieser Buchung,
  // damit eine bestehende Buchung beim Bearbeiten nicht versehentlich auf ein anderes
  // Konto "springt" (select.value scheitert sonst lautlos, wenn die Option fehlt).
  const allAccounts = getAccounts();
  const activeAccounts = allAccounts.filter(a => !a.archived);
  const referencedAccountIds = txn ? (txn.type === 'transfer' ? [txn.fromAccountId, txn.toAccountId] : [txn.accountId]) : [];
  const accountsForSelect = activeAccounts.slice();
  for (const refId of referencedAccountIds) {
    if (refId && !accountsForSelect.some(a => a.id === refId)) {
      const acc = allAccounts.find(a => a.id === refId);
      if (acc) accountsForSelect.push(acc);
    }
  }
  const accountOptions = accountsForSelect.map(a => ({ value: a.id, label: a.name + (a.archived ? ' (archiviert)' : '') }));
  populateSelect('txnAccount', accountOptions);
  populateSelect('txnFromAccount', accountOptions);
  populateSelect('txnToAccount', accountOptions);

  setTxnType(type);

  document.getElementById('txnId').value = id || '';
  document.getElementById('txnDeleteBtn').style.display = id ? '' : 'none';

  if (txn) {
    document.getElementById('txnAmount').value = txn.amount;
    document.getElementById('txnDate').value = txn.date;
    document.getElementById('txnDesc').value = txn.desc || '';
    if (txn.type === 'transfer') {
      document.getElementById('txnFromAccount').value = txn.fromAccountId;
      document.getElementById('txnToAccount').value = txn.toAccountId;
    } else {
      document.getElementById('txnAccount').value = txn.accountId;
      populateSelect('txnCategory', categoryOptionsWithCurrent(txn.type, txn.category));
      document.getElementById('txnCategory').value = txn.category;
    }
  } else {
    document.getElementById('txnDate').value = todayIso();
    populateSelect('txnCategory', categoryOptionsWithCurrent(type === 'transfer' ? 'expense' : type, null));
  }

  if (txn && txn.hasReceipt) {
    pendingReceiptOriginalHasReceipt = true;
    getReceipt(txn.id).then(dataUrl => { if (dataUrl) showReceiptPreview(dataUrl); });
  }

  openModal('txnModalBackdrop');
}

function showReceiptPreview(dataUrl) {
  const preview = document.getElementById('receiptPreview');
  const img = document.getElementById('receiptPreviewImg');
  const addBtn = document.getElementById('receiptAddBtn');
  if (dataUrl) {
    img.src = dataUrl;
    preview.style.display = '';
    addBtn.style.display = 'none';
  } else {
    img.src = '';
    preview.style.display = 'none';
    addBtn.style.display = '';
  }
}

function categoryOptionsWithCurrent(type, current) {
  const cats = getCategories(type);
  const list = cats.slice();
  const orphan = current && !list.includes(current);
  if (orphan) list.push(current);
  return list.map(c => ({ value: c, label: c + (orphan && c === current ? ' (gelöscht)' : '') }));
}

function populateSelect(selectId, options) {
  const select = document.getElementById(selectId);
  select.innerHTML = options.map(o => `<option value="${escapeHtml(o.value)}">${escapeHtml(o.label)}</option>`).join('');
}

function setTxnType(type) {
  document.getElementById('txnType').value = type;
  document.querySelectorAll('#txnTypeTabs .modal-tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.type === type);
  });
  const isTransfer = type === 'transfer';
  document.getElementById('txnAccountGroup').style.display = isTransfer ? 'none' : '';
  document.getElementById('txnCategoryGroup').style.display = isTransfer ? 'none' : '';
  document.getElementById('txnFromAccountGroup').style.display = isTransfer ? '' : 'none';
  document.getElementById('txnToAccountGroup').style.display = isTransfer ? '' : 'none';
  if (!isTransfer) {
    populateSelect('txnCategory', getCategories(type).map(c => ({ value: c, label: c })));
  }
}

function wireTxnModal() {
  document.querySelectorAll('#txnTypeTabs .modal-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => setTxnType(btn.dataset.type));
  });

  document.getElementById('txnCancelBtn').addEventListener('click', () => closeModal('txnModalBackdrop'));

  document.getElementById('txnDeleteBtn').addEventListener('click', () => {
    const id = document.getElementById('txnId').value;
    if (!id) return;
    if (!confirm('Diese Buchung löschen?')) return;
    deleteTransaction(id);
    deleteReceipt(id);
    closeModal('txnModalBackdrop');
    toast('Buchung gelöscht');
    rerenderAll();
  });

  document.getElementById('receiptFileInput').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const preset = RECEIPT_QUALITY_PRESETS[getReceiptQuality()];
      const dataUrl = await resizeImageToDataUrl(file, preset.maxDim, preset.quality);
      pendingReceiptDataUrl = dataUrl;
      showReceiptPreview(dataUrl);
    } catch {
      toast('Foto konnte nicht verarbeitet werden.');
    }
  });

  document.getElementById('receiptSaveBtn').addEventListener('click', () => {
    const src = document.getElementById('receiptPreviewImg').src;
    if (!src) return;
    const date = document.getElementById('txnDate').value || todayIso();
    downloadDataUrl(`Beleg_${date}.jpg`, src);
    toast('Beleg wird zum Sichern angeboten – im Dialog „In Dateien sichern“ wählen.');
  });

  document.getElementById('receiptRemoveBtn').addEventListener('click', () => {
    pendingReceiptDataUrl = null;
    document.getElementById('receiptFileInput').value = '';
    showReceiptPreview(null);
  });

  document.getElementById('receiptPreviewImg').addEventListener('click', () => {
    const src = document.getElementById('receiptPreviewImg').src;
    if (!src) return;
    document.getElementById('receiptLightboxImg').src = src;
    openModal('receiptLightboxBackdrop');
  });

  document.getElementById('receiptLightboxClose').addEventListener('click', () => closeModal('receiptLightboxBackdrop'));
  document.getElementById('receiptLightboxBackdrop').addEventListener('click', (e) => {
    if (e.target.id === 'receiptLightboxBackdrop') closeModal('receiptLightboxBackdrop');
  });

  document.getElementById('txnForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const type = document.getElementById('txnType').value;
    const amount = parseFloat(document.getElementById('txnAmount').value);
    const date = document.getElementById('txnDate').value;
    const desc = document.getElementById('txnDesc').value.trim();
    const id = document.getElementById('txnId').value || genId('txn');

    if (!amount || amount <= 0) return toast('Bitte einen gültigen Betrag eingeben.');
    if (!date) return toast('Bitte ein Datum wählen.');

    const hasReceipt = pendingReceiptDataUrl === null ? false
      : pendingReceiptDataUrl !== undefined ? true
      : pendingReceiptOriginalHasReceipt;

    let txn;
    if (type === 'transfer') {
      const fromAccountId = document.getElementById('txnFromAccount').value;
      const toAccountId = document.getElementById('txnToAccount').value;
      if (!fromAccountId || !toAccountId) return toast('Bitte beide Konten wählen.');
      if (fromAccountId === toAccountId) return toast('Quelle und Ziel müssen unterschiedlich sein.');
      txn = { id, type, date, amount, fromAccountId, toAccountId, category: null, desc, hasReceipt, createdAt: new Date().toISOString() };
    } else {
      const accountId = document.getElementById('txnAccount').value;
      const category = document.getElementById('txnCategory').value;
      if (!accountId) return toast('Bitte ein Konto wählen.');
      if (!category) return toast('Bitte eine Kategorie wählen.');
      txn = { id, type, date, amount, accountId, category, desc, hasReceipt, createdAt: new Date().toISOString() };
    }

    upsertTransaction(txn);

    if (pendingReceiptDataUrl === null) {
      await deleteReceipt(id);
    } else if (typeof pendingReceiptDataUrl === 'string') {
      await saveReceipt(id, pendingReceiptDataUrl);
    }

    closeModal('txnModalBackdrop');
    toast('Buchung gespeichert');
    rerenderAll();
  });
}
