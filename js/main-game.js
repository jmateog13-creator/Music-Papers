/* ============================================================================
 * MAIN-GAME.JS — Controlador d'una pàgina individual de minijoc
 * Cada HTML de joc declara <body data-game="<id>"> i aquest script:
 *   1. Detecta l'id, troba el mòdul a window.NotePass.Games
 *   2. Pinta la landing (patró canònic) amb la metadata del joc
 *   3. Gestiona JUGAR / TUTORIAL / RESET / TORNAR A PORTADA / VICTÒRIA
 * No hi ha overlays inter-joc: tornar a portada = location.href = 'index.html'
 * ============================================================================ */
(function (global) {
  'use strict';

  const GAMES = {
    'notedoku':     'Notedoku',
    'staff-match':  'StaffMatch',
    'mots-amagats': 'MotsAmagats',
    'crossnote':    'Crossnote'
  };

  const LS_COMPLETED_KEY = 'notepass:completed';

  function getCompleted() {
    try {
      const raw = localStorage.getItem(LS_COMPLETED_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (_) { return []; }
  }

  function markCompleted(id) {
    try {
      const set = new Set(getCompleted());
      set.add(id);
      localStorage.setItem(LS_COMPLETED_KEY, JSON.stringify(Array.from(set)));
    } catch (_) { /* storage indisponible (mode privat, file:// estricte) */ }
  }

  let game = null;
  let gameId = null;
  let hasPlayed = false;

  const $ = (id) => document.getElementById(id);

  function init() {
    gameId = document.body.dataset.game;
    if (!gameId) return console.warn('Body sense data-game');
    const gameKey = GAMES[gameId];
    if (!gameKey) return console.warn('Joc desconegut:', gameId);
    game = global.NotePass.Games[gameKey];
    if (!game) return console.warn('Joc no carregat al namespace:', gameKey);

    /* Registra al toolbar de dev */
    global.NotePass.currentGame = {
      id: gameId,
      autosolve: () => game.autosolve && game.autosolve(),
      reset:     () => game.reset && game.reset()
    };
    if (global.NotePass.DevToolbar) global.NotePass.DevToolbar.refresh();

    /* Renderitza la landing */
    paintLanding(game.meta);
  }

  function paintLanding(meta) {
    $('landing-icon').textContent    = meta.icon || '★';
    $('landing-title').textContent   = meta.title || '';
    $('landing-pitch').textContent   = meta.pitch || '';
    $('landing-context').textContent = meta.context || '';
    $('landing-meta').textContent    = meta.metaTag || '';
    document.title = `${meta.title} · The Aulatech Daily`;
    $('game-landing').hidden = false;
    $('game-stage').hidden = true;
    $('victory-modal').hidden = true;
  }

  function startPlay() {
    $('game-landing').hidden = true;
    $('game-stage').hidden = false;
    $('stage-title').textContent = game.meta.title;
    $('stage-hud').innerHTML = '';
    game.init($('game-board'), $('stage-hud'));
    hasPlayed = true;
    if (global.AulaTechBridge) global.AulaTechBridge.startClock();
  }

  function startTutorial() {
    if (!hasPlayed) {
      $('game-landing').hidden = true;
      $('game-stage').hidden = false;
      $('stage-title').textContent = game.meta.title;
      $('stage-hud').innerHTML = '';
      game.init($('game-board'), $('stage-hud'));
      hasPlayed = true;
    }
    if (typeof game.runTutorial === 'function') {
      game.runTutorial(() => {});
    }
  }

  function backToLanding() {
    if (typeof game.destroy === 'function') game.destroy();
    hasPlayed = false;
    paintLanding(game.meta);
  }

  function backToFront() {
    window.location.href = 'index.html';
  }

  function resetGame() {
    $('victory-modal').hidden = true;
    if (!hasPlayed) {
      startPlay();
    } else if (typeof game.reset === 'function') {
      game.reset();
    }
  }

  function showVictory(text) {
    if (text) $('victory-text').textContent = text;
    $('victory-modal').hidden = false;
    if (gameId) markCompleted(gameId);
    if (gameId && global.AulaTechBridge) global.AulaTechBridge.sendOnce(gameId, { completat: true });
  }

  /* ── Wire-up ──────────────────────────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', () => {
    init();

    document.addEventListener('click', (e) => {
      const el = e.target.closest('[data-action]');
      if (!el) return;
      switch (el.dataset.action) {
        case 'play':            startPlay(); break;
        case 'tutorial':        startTutorial(); break;
        case 'back-to-landing': backToLanding(); break;
        case 'back-to-front':   backToFront(); break;
        case 'reset':           resetGame(); break;
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (global.NotePass.Tutorial && global.NotePass.Tutorial.isActive()) {
          global.NotePass.Tutorial.skip();
        } else if (!$('game-stage').hidden) {
          backToLanding();
        } else {
          backToFront();
        }
      }
    });
  });

  /* ── Public Router API (perquè els jocs i el dev toolbar el cridin) ── */
  global.NotePass = global.NotePass || {};
  global.NotePass.Router = {
    backToFront,
    backToLanding,
    startPlay,
    startTutorial,
    showVictory,
    resetCurrentGame: resetGame
  };

})(window);
