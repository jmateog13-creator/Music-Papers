/* ============================================================================
 * STAFF-MATCH.JS — Les Diferències del Pentagrama · 5 nivells progressius
 * Mecànica seqüencial L→R:
 *   1. Clica una nota a l'ORIGINAL (esquerra) → glow ambar
 *   2. Clica la mateixa posició a la CÒPIA (dreta)
 *      · si la nota és diferent → error trobat (verd)
 *      · si és igual → flash vermell, "no està modificada"
 * Nivells:
 *   I   — 6 notes, 3 errors (només pitch, dins el pentagrama)
 *   II  — 7 notes, 4 errors (pitch + 1 alteració)
 *   III — 8 notes, 5 errors (mix pitch + alteracions)
 *   IV  — 9 notes, 5 errors (amb notes a ledger lines)
 *   V   — 10 notes, 6 errors (rang complet, mestria)
 * ============================================================================ */
(function (global) {
  'use strict';

  const LEVELS = [
    {
      label: 'Nivell I · Iniciació',
      original: [
        { pitch:'C5' }, { pitch:'E5' }, { pitch:'G4' },
        { pitch:'B4' }, { pitch:'A4' }, { pitch:'F4' }
      ],
      errors: [
        { i:0, pitch:'D5' },
        { i:2, pitch:'A4' },
        { i:5, pitch:'D4' }
      ]
    },
    {
      label: 'Nivell II · Apareix la primera alteració',
      original: [
        { pitch:'G4' }, { pitch:'B4' }, { pitch:'D5' }, { pitch:'C5' },
        { pitch:'E5' }, { pitch:'A4' }, { pitch:'F5' }
      ],
      errors: [
        { i:1, pitch:'A4' },
        { i:2, accidental:'b' },
        { i:4, pitch:'F5' },
        { i:6, pitch:'B4' }
      ]
    },
    {
      label: 'Nivell III · Mix de pitches i alteracions',
      original: [
        { pitch:'F4' }, { pitch:'A4' }, { pitch:'C5' }, { pitch:'E5' },
        { pitch:'D5' }, { pitch:'G4' }, { pitch:'B4' }, { pitch:'E5' }
      ],
      errors: [
        { i:0, pitch:'G4' },
        { i:1, accidental:'#' },
        { i:3, pitch:'F5' },
        { i:5, accidental:'b' },
        { i:7, pitch:'D5' }
      ]
    },
    {
      label: 'Nivell IV · Fora del pentagrama',
      original: [
        { pitch:'E4' }, { pitch:'G4' }, { pitch:'B4' }, { pitch:'D5' },
        { pitch:'F5' }, { pitch:'A5' }, { pitch:'C5' }, { pitch:'E5' },
        { pitch:'G4' }
      ],
      errors: [
        { i:0, pitch:'D4' },
        { i:2, accidental:'#' },
        { i:4, pitch:'E5' },
        { i:6, pitch:'B4' },
        { i:8, accidental:'#' }
      ]
    },
    {
      label: 'Nivell V · Mestria',
      original: [
        { pitch:'G4' }, { pitch:'A4' }, { pitch:'B4' }, { pitch:'C5' },
        { pitch:'D5' }, { pitch:'E5' }, { pitch:'F5' }, { pitch:'G5' },
        { pitch:'A5' }, { pitch:'C4' }
      ],
      errors: [
        { i:0, accidental:'b' },
        { i:2, pitch:'C5' },
        { i:4, accidental:'#' },
        { i:5, pitch:'F5' },
        { i:7, accidental:'b' },
        { i:9, pitch:'D4' }
      ]
    }
  ];

  let boardEl = null;
  let hudEl = null;
  let levelIdx = 0;
  let state = null;

  function init(_boardEl, _hudEl) {
    boardEl = _boardEl;
    hudEl   = _hudEl;
    levelIdx = 0;
    buildLevel();
    render();
    updateHud();
  }

  function destroy() {
    state = null;
    if (boardEl) boardEl.innerHTML = '';
    if (hudEl)   hudEl.innerHTML = '';
  }

  function reset() {
    /* Reinicia des del nivell I */
    levelIdx = 0;
    buildLevel();
    render();
    updateHud();
  }

  function nextLevel() {
    if (levelIdx >= LEVELS.length - 1) return;
    levelIdx++;
    buildLevel();
    render();
    updateHud();
  }

  function buildLevel() {
    const lv = LEVELS[levelIdx];
    const erroneous = lv.original.map(n => Object.assign({}, n));
    const errorIndices = new Set();
    lv.errors.forEach(err => {
      if (err.pitch) erroneous[err.i].pitch = err.pitch;
      if (err.accidental) erroneous[err.i].accidental = err.accidental;
      errorIndices.add(err.i);
    });
    state = {
      level: lv,
      original: lv.original.map(n => Object.assign({}, n)),
      erroneous,
      errorIndices,
      found: new Set(),
      total: lv.errors.length,
      solved: false,
      levelComplete: false,
      selectedLeft: null
    };
  }

  function render() {
    boardEl.innerHTML = '';
    const wrap = document.createElement('div');
    wrap.className = 'staff-match';

    /* Bàner del nivell */
    const banner = document.createElement('div');
    banner.className = 'mots-amagats__banner';
    banner.innerHTML = `<span class="mots-amagats__level">${state.level.label}</span>` +
                       `<span class="mots-amagats__warn">${state.total} diferències a trobar</span>`;
    wrap.appendChild(banner);

    /* Instruccions seqüencials */
    const steps = document.createElement('div');
    steps.className = 'staff-match__steps';
    steps.innerHTML = `
      <span class="staff-match__step"><strong>1.</strong> Clica una nota a l'<em>ORIGINAL</em></span>
      <span class="staff-match__step-arrow">→</span>
      <span class="staff-match__step"><strong>2.</strong> Clica la <em>mateixa posició</em> a la <em>CÒPIA</em></span>
    `;
    wrap.appendChild(steps);

    /* Progress pips */
    const progress = document.createElement('div');
    progress.className = 'staff-match__progress';
    for (let i = 0; i < state.total; i++) {
      const pip = document.createElement('div');
      pip.className = 'staff-match__progress-pip';
      pip.textContent = i + 1;
      progress.appendChild(pip);
    }
    wrap.appendChild(progress);

    /* Panells */
    const panels = document.createElement('div');
    panels.className = 'staff-match__panels';
    const left  = makePanel('ORIGINAL', state.original, 'left');
    const divider = document.createElement('div');
    divider.className = 'staff-match__divider';
    const right = makePanel('CÒPIA DEL COPISTA', state.erroneous, 'right');
    panels.appendChild(left);
    panels.appendChild(divider);
    panels.appendChild(right);
    wrap.appendChild(panels);

    /* Feedback inline */
    const fb = document.createElement('div');
    fb.className = 'staff-match__feedback';
    fb.id = 'sm-feedback';
    fb.textContent = '';
    wrap.appendChild(fb);

    boardEl.appendChild(wrap);
  }

  function makePanel(title, notes, side) {
    const panel = document.createElement('div');
    panel.className = `staff-match__panel staff-match__panel--${side}`;
    panel.dataset.side = side;

    const t = document.createElement('span');
    t.className = 'staff-match__panel-title';
    t.textContent = (side === 'left' ? '1. ' : '2. ') + title;
    panel.appendChild(t);

    /* Amplada del pentagrama escala lleugerament amb el nombre de notes */
    const width = Math.max(560, 380 + notes.length * 28);
    const svg = global.NotePass.Pentagrama.render({
      width,
      height: 200,
      staffSpacing: 18,
      notes: notes.map((n, i) => ({
        pitch: n.pitch,
        accidental: n.accidental || null,
        id: 'n' + i,
        interactive: true
      })),
      className: 'staff-match__svg'
    });
    panel.appendChild(svg);

    svg.addEventListener('click', (e) => {
      const target = e.target.closest('.note-target');
      if (!target) return;
      const idx = parseInt(target.dataset.id.slice(1), 10);
      handleNoteClick(idx, target, side);
    });

    return panel;
  }

  function handleNoteClick(idx, el, side) {
    if (state.solved || state.levelComplete) return;
    if (state.found.has(idx)) return;

    if (side === 'left') {
      clearSelected();
      state.selectedLeft = idx;
      el.classList.add('is-selected');
      const partner = boardEl.querySelector(`.staff-match__panel--right .note-target[data-id="n${idx}"]`);
      if (partner) partner.classList.add('is-partner-hint');
      feedback(`Has triat la nota nº ${idx + 1} de l'original. Ara busca la mateixa posició a la còpia.`, 'info');
    } else {
      if (state.selectedLeft === null) {
        flashEl(el, 'is-miss');
        feedback('Primer selecciona una nota al panell ORIGINAL (esquerra).', 'warn');
        return;
      }
      if (state.selectedLeft !== idx) {
        flashEl(el, 'is-miss');
        feedback(`Aquesta no és la mateixa posició. Has triat la nº ${state.selectedLeft + 1} a l'esquerra; cerca la nº ${state.selectedLeft + 1} a la dreta.`, 'warn');
        return;
      }
      if (state.errorIndices.has(idx)) {
        state.found.add(idx);
        el.classList.add('is-found');
        const leftEl = boardEl.querySelector(`.staff-match__panel--left .note-target[data-id="n${idx}"]`);
        if (leftEl) leftEl.classList.add('is-found');
        const pip = boardEl.querySelectorAll('.staff-match__progress-pip')[state.found.size - 1];
        if (pip) pip.classList.add('is-found');
        clearSelected();
        feedback(`✓ Error trobat (${state.found.size}/${state.total}).`, 'good');
        updateHud();
        if (state.found.size === state.total) handleLevelComplete();
      } else {
        flashEl(el, 'is-miss');
        const leftEl = boardEl.querySelector(`.staff-match__panel--left .note-target[data-id="n${idx}"]`);
        if (leftEl) flashEl(leftEl, 'is-miss');
        clearSelected();
        feedback('Aquesta nota és igual a l\'original — no està modificada. Prova\'n una altra.', 'warn');
      }
    }
  }

  function clearSelected() {
    state.selectedLeft = null;
    boardEl.querySelectorAll('.note-target.is-selected').forEach(n => n.classList.remove('is-selected'));
    boardEl.querySelectorAll('.note-target.is-partner-hint').forEach(n => n.classList.remove('is-partner-hint'));
  }

  function flashEl(el, cls) {
    el.classList.add(cls);
    setTimeout(() => el.classList.remove(cls), 500);
  }

  function feedback(msg, kind) {
    const fb = document.getElementById('sm-feedback');
    if (!fb) return;
    fb.textContent = msg;
    fb.className = 'staff-match__feedback is-' + (kind || 'info');
  }

  function handleLevelComplete() {
    state.levelComplete = true;
    updateHud();
    if (levelIdx >= LEVELS.length - 1) {
      handleFinalWin();
    } else {
      const fb = document.createElement('div');
      fb.className = 'mots-amagats__levelup';
      fb.innerHTML = `Nivell completat! Prem <strong>Següent nivell →</strong> per continuar.`;
      const wrap = boardEl.querySelector('.staff-match');
      if (wrap) wrap.appendChild(fb);
    }
  }

  function handleFinalWin() {
    state.solved = true;
    setTimeout(() => global.NotePass.Router.showVictory(
      'Has dominat els cinc nivells. Cap diferència se t\'escapa.'
    ), 600);
  }

  function updateHud() {
    if (!hudEl) return;
    const lvCounter = `Nivell ${levelIdx + 1}/${LEVELS.length}`;
    const showNext = state.levelComplete && levelIdx < LEVELS.length - 1;
    hudEl.innerHTML = `
      <span class="hud-pill">${lvCounter}</span>
      <span class="hud-pill">${state.found.size}/${state.total} errors</span>
      ${showNext ? `<button class="btn-next" type="button">Següent nivell →</button>` : ''}
    `;
    const btn = hudEl.querySelector('.btn-next');
    if (btn) btn.addEventListener('click', nextLevel);
  }

  function autosolve() {
    if (!state) return;
    state.errorIndices.forEach(idx => {
      if (state.found.has(idx)) return;
      state.found.add(idx);
      boardEl.querySelectorAll(`.note-target[data-id="n${idx}"]`).forEach(n => n.classList.add('is-found'));
      const pip = boardEl.querySelectorAll('.staff-match__progress-pip')[state.found.size - 1];
      if (pip) pip.classList.add('is-found');
    });
    updateHud();
    if (state.found.size === state.total) handleLevelComplete();
  }

  /* ── Tutorial ─────────────────────────────────────────────────────── */
  function runTutorial(onDone) {
    const steps = [
      {
        text: 'A l\'esquerra tens el <strong>pentagrama original</strong>. A la dreta, la <strong>còpia del copista</strong>. Haurien de ser idèntics, però el copista s\'ha distret diverses vegades.'
      },
      {
        text: '<strong>Pas 1:</strong> clica una nota del panell ORIGINAL (esquerra). Es marcarà amb un resplendor ambar.',
        target: '.staff-match__panel--left'
      },
      {
        text: '<strong>Pas 2:</strong> clica la nota que ocupa la <em>mateixa posició</em> al panell CÒPIA (dreta). Si la nota és diferent, has trobat un error.',
        target: '.staff-match__panel--right'
      },
      {
        text: 'Hi ha <strong>5 nivells</strong> de dificultat creixent. Comences amb pitches simples i acabes amb el rang complet. Quan completis un nivell, apareixerà el botó <strong>Següent nivell →</strong> a dalt a la dreta.'
      }
    ];
    global.NotePass.Tutorial.run(steps, onDone);
  }

  const meta = {
    id: 'staff-match',
    icon: '✦',
    title: 'Staff Match',
    pitch: 'Les Diferències del Pentagrama · 5 nivells progressius',
    context: 'Dos pentagrames bessons; el copista de la dreta ha alterat algunes notes. ' +
             'Tria una nota a l\'original, després la corresponent a la còpia: si són diferents, ' +
             'és un error trobat. Cinc nivells de complexitat creixent.',
    metaTag: 'Observació · 5 nivells · Clau de Sol'
  };

  global.NotePass = global.NotePass || {};
  global.NotePass.Games = global.NotePass.Games || {};
  global.NotePass.Games.StaffMatch = {
    meta, init, destroy, reset, autosolve, runTutorial
  };

})(window);
