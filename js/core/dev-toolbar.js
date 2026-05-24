/* ============================================================================
 * DEV-TOOLBAR.JS — Cabina d'edició pilot
 * Hotkey: Ctrl+Shift+D · accions: autosolve, reset, clear-tutorial, back, hide
 * Es comunica amb el joc actiu via window.NotePass.currentGame (proporcionat
 * per main.js) que ha d'exposar { id, autosolve(), reset(), clearTutorialLock() }
 * ============================================================================ */
(function (global) {
  'use strict';

  const TOOLBAR_ID = 'dev-toolbar';
  const ACTIVE_LBL = 'dev-toolbar-active';
  const LS_COMPLETED_KEY = 'notepass:completed';

  function toolbar() { return document.getElementById(TOOLBAR_ID); }

  function show() { toolbar().hidden = false; refresh(); }
  function hide() { toolbar().hidden = true; }
  function toggle() { toolbar().hidden ? show() : hide(); }

  function refresh() {
    const lbl = document.getElementById(ACTIVE_LBL);
    const game = global.NotePass && global.NotePass.currentGame;
    lbl.textContent = game ? `▶ ${game.id}` : 'cap joc actiu';
  }

  function toast(msg) {
    const t = document.createElement('div');
    t.className = 'dev-toast';
    t.textContent = '› ' + msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 2200);
  }

  function dispatch(action) {
    const game = global.NotePass && global.NotePass.currentGame;
    switch (action) {
      case 'autosolve':
        if (!game) return toast('Cap joc actiu. Obre un passatemps primer.');
        if (typeof game.autosolve === 'function') {
          game.autosolve();
          toast(`Auto-resolt: ${game.id}`);
        } else { toast('autosolve no implementat'); }
        break;
      case 'reset':
        if (!game) return toast('Cap joc actiu.');
        if (typeof game.reset === 'function') {
          game.reset();
          toast(`Reinici: ${game.id}`);
        }
        break;
      case 'clear-progress':
        try {
          /* Neteja tot el namespace notepass:* per si en el futur hi ha més claus */
          const keys = [];
          for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            if (k && k.startsWith('notepass:')) keys.push(k);
          }
          keys.forEach(k => localStorage.removeItem(k));
        } catch (_) {}
        toast('Progrés esborrat. Recarrega la portada per veure-ho.');
        break;
      case 'back':
        if (global.NotePass && global.NotePass.Router) {
          global.NotePass.Router.backToFront();
          toast('Tornant a portada…');
        }
        break;
      case 'hide':
        hide();
        break;
    }
  }

  /* ── Init ──────────────────────────────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', () => {
    // Hotkey: Ctrl+Shift+D (i Cmd+Shift+D per Mac)
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'D' || e.key === 'd')) {
        e.preventDefault();
        toggle();
      }
    });

    // Wire-up dels botons del toolbar
    toolbar().addEventListener('click', (e) => {
      const btn = e.target.closest('[data-dev-action]');
      if (!btn) return;
      dispatch(btn.dataset.devAction);
    });
  });

  /* ── Public API ───────────────────────────────────────────────────── */
  global.NotePass = global.NotePass || {};
  global.NotePass.DevToolbar = { show, hide, toggle, refresh, toast };

})(window);
