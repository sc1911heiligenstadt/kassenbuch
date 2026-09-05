let activeView = 'uebersicht';

const VIEW_RENDERERS = {
  uebersicht: renderUebersicht,
  buchungen: renderBuchungen,
  budgets: renderBudgets,
  konten: renderKonten,
  einstellungen: renderEinstellungen,
  info: renderInfo,
};

function switchView(view) {
  flushNotes();
  activeView = view;
  document.querySelectorAll('.view').forEach(el => el.classList.toggle('active', el.dataset.view === view));
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.view === view));
  VIEW_RENDERERS[view]();
}

function rerenderAll() {
  flushNotes();
  updateHeaderBalance();
  VIEW_RENDERERS[activeView]();
}

function init() {
  seedDefaultsIfEmpty();
  // Die "automatischen Backups" entstehen hier -- einmal je Tag beim Öffnen.
  autoBackupIfDue();

  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => switchView(btn.dataset.view));
  });

  document.getElementById('fabAdd').addEventListener('click', () => openTxnModal({ type: 'expense' }));

  wireTxnModal();
  wireAccountModal();
  wireBudgetModal();
  wireImportInput();

  // iOS friert die PWA beim Wegwischen ein, ohne 'unload' zu feuern.
  window.addEventListener('pagehide', flushNotes);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) flushNotes();
  });

  switchView('uebersicht');
  updateHeaderBalance();

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
}

document.addEventListener('DOMContentLoaded', init);
