function renderUebersicht() {
  const view = document.getElementById('view-uebersicht');
  const now = new Date();
  const { income, expense, diff } = getMonthSummary(now.getFullYear(), now.getMonth() + 1);
  const total = getTotalBalance();

  const recent = sortedTransactionsDesc().slice(0, 5);
  // ALLE Konten: eine Buchung auf einem archivierten Konto zeigte sonst "?".
  const accounts = getAccounts();
  const recentHtml = recent.length ? recent.map(t => renderTxnItem(t, accounts)).join('') :
    `<div class="empty-state">Noch keine Buchungen erfasst.</div>`;

  view.innerHTML = `
    <div class="card">
      <h2>Gesamtsaldo</h2>
      <div class="stat-value">${formatCurrency(total)}</div>
    </div>
    <div class="card">
      <h2>Dieser Monat</h2>
      <div class="stat-row"><span class="stat-label">Einnahmen</span><span class="stat-value income">${formatCurrency(income)}</span></div>
      <div class="stat-row"><span class="stat-label">Ausgaben</span><span class="stat-value expense">${formatCurrency(expense)}</span></div>
      <div class="stat-row"><span class="stat-label">Differenz</span><span class="stat-value">${formatCurrency(diff)}</span></div>
    </div>
    <div class="card">
      <h2>Letzte Buchungen</h2>
      <div class="txn-list">${recentHtml}</div>
    </div>
    <div class="card notes-card">
      <h2>Notizen</h2>
      <textarea class="notes-input" id="notesInput" rows="3"
                placeholder="Merkposten, offene Beträge, was noch zu buchen ist …"></textarea>
      <div class="notes-hint" id="notesHint">Wird beim Tippen automatisch gespeichert.</div>
    </div>
  `;

  view.querySelectorAll('.txn-item').forEach(el => {
    el.addEventListener('click', () => openTxnModal({ id: el.dataset.id }));
  });

  wireNotes();
}

// ── Notizen ──────────────────────────────────────────────────────────────
// Freitext auf der Übersicht. Liegt wie alles andere im localStorage und
// wandert über getAllData() in Sicherungen und Backup-Historie mit.
let notesSaveTimer = null;
let notesHintTimer = null;

function autoGrowNotes(el) {
  el.style.height = 'auto';
  // Im versteckten Reiter ist scrollHeight 0 -- dann greift die CSS-Mindesthöhe.
  if (el.scrollHeight <= 0) return;
  // box-sizing ist border-box, scrollHeight zählt den Rahmen aber nicht mit --
  // ohne diesen Aufschlag wird die letzte Zeile angeschnitten.
  const rahmen = el.offsetHeight - el.clientHeight;
  el.style.height = (el.scrollHeight + rahmen) + 'px';
}

function wireNotes() {
  const el = document.getElementById('notesInput');
  if (!el) return;

  // Als .value setzen, nicht ins HTML interpolieren.
  el.value = getNotes();
  autoGrowNotes(el);

  el.addEventListener('input', () => {
    autoGrowNotes(el);
    clearTimeout(notesSaveTimer);
    notesSaveTimer = setTimeout(() => {
      notesSaveTimer = null;
      commitNotes(el.value);
    }, 400);
  });
  el.addEventListener('blur', flushNotes);
}

function commitNotes(text) {
  saveNotes(text);
  const hint = document.getElementById('notesHint');
  if (!hint) return;
  hint.textContent = 'Gespeichert ✓';
  hint.classList.add('saved');
  // Der Hinweis wird beim Neuaufbau der Übersicht ersetzt -- deshalb im
  // Timer erneut nachschlagen statt das alte Element festzuhalten.
  clearTimeout(notesHintTimer);
  notesHintTimer = setTimeout(() => {
    const el = document.getElementById('notesHint');
    if (!el) return;
    el.textContent = 'Wird beim Tippen automatisch gespeichert.';
    el.classList.remove('saved');
  }, 1800);
}

// Vor Reiterwechsel, Neuaufbau und beim Wegräumen der App den offenen
// Debounce sofort schreiben -- sonst fehlt der zuletzt getippte Satz.
function flushNotes() {
  if (!notesSaveTimer) return;
  clearTimeout(notesSaveTimer);
  notesSaveTimer = null;
  const el = document.getElementById('notesInput');
  if (el) commitNotes(el.value);
}

function updateHeaderBalance() {
  document.getElementById('headerBalance').textContent = formatCurrency(getTotalBalance());
}
