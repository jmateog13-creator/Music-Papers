/* ============================================================================
 * MOTS-AMAGATS.JS — Sopa de Notes amb decodificació + 5 nivells progressius
 * Layout horitzontal: pentagrama + targets (esquerra) | graella (dreta).
 * Cada nivell pot incloure NOTES TRAMPA: notes pintades al pentagrama que
 * NO estan amagades a la graella. L'alumne ha de detectar quines són reals.
 * ============================================================================ */
(function (global) {
  'use strict';

  const ALL_DIRS = {
    H_FWD: { dr:  0, dc:  1 },
    V_FWD: { dr:  1, dc:  0 },
    H_REV: { dr:  0, dc: -1 },
    V_REV: { dr: -1, dc:  0 },
    D_DR:  { dr:  1, dc:  1 },
    D_DL:  { dr:  1, dc: -1 },
    D_UR:  { dr: -1, dc:  1 },
    D_UL:  { dr: -1, dc: -1 }
  };

  /* Nivells: cada un defineix les notes que es PINTEN al pentagrama (alguna pot
   * ser trampa), l'array de indexs que SÍ es plaçaran a la graella, mida,
   * direccions permeses i seed PRNG. */
  const LEVELS = [
    {
      label: 'Nivell I · Iniciació',
      pentagram: [ { pitch:'G4' }, { pitch:'F4' }, { pitch:'E5' } ],
      hiddenIdx: [0, 1, 2],
      gridSize: 8,
      dirs: ['H_FWD', 'V_FWD'],
      seed: 1001
    },
    {
      label: 'Nivell II · Lectura simple',
      pentagram: [ { pitch:'D5' }, { pitch:'A4' }, { pitch:'C5' } ],
      hiddenIdx: [0, 1, 2],
      gridSize: 8,
      dirs: ['H_FWD', 'V_FWD', 'D_DR', 'D_UR'],
      seed: 1002
    },
    {
      label: 'Nivell III · Vigila les trampes',
      pentagram: [ { pitch:'B4' }, { pitch:'E5' }, { pitch:'F5' }, { pitch:'G4' } ],
      hiddenIdx: [0, 1, 3],            // FA (E5? wait check) — el F5 és trampa
      gridSize: 9,
      dirs: ['H_FWD', 'V_FWD', 'D_DR', 'D_UR'],
      seed: 1003
    },
    {
      label: 'Nivell IV · Lectura completa',
      pentagram: [ { pitch:'C5' }, { pitch:'D5' }, { pitch:'A4' }, { pitch:'F4' }, { pitch:'B4' } ],
      hiddenIdx: [0, 1, 2, 3],          // SI és trampa
      gridSize: 10,
      dirs: ['H_FWD', 'V_FWD', 'D_DR', 'D_UR', 'D_DL'],
      seed: 1004
    },
    {
      label: 'Nivell V · Mestria',
      pentagram: [ { pitch:'E5' }, { pitch:'A4' }, { pitch:'D5' }, { pitch:'G4' }, { pitch:'B4' }, { pitch:'F4' } ],
      hiddenIdx: [0, 1, 2, 3, 4],       // FA és trampa
      gridSize: 10,
      dirs: ['H_FWD', 'V_FWD', 'D_DR', 'D_UR', 'D_DL', 'H_REV', 'V_REV'],
      seed: 1005
    }
  ];

  let boardEl = null;
  let hudEl = null;
  let levelIdx = 0;
  let state = null;

  function mulberry32(seed) {
    return function () {
      let t = (seed += 0x6D2B79F5);
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

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
    /* Reset = reiniciar des del nivell 1 */
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
    const dirs = lv.dirs.map(k => ALL_DIRS[k]);
    const hiddenNotes = lv.hiddenIdx.map(i => ({
      pitch: lv.pentagram[i].pitch,
      word:  global.NotePass.Pentagrama.pitchToName(lv.pentagram[i].pitch)
    }));
    const { grid, placements } = placeWordsAndFill(hiddenNotes, lv.gridSize, lv.seed, dirs);
    state = {
      level: lv,
      grid,
      placements,
      pentagram: lv.pentagram,
      hiddenIdx: lv.hiddenIdx,
      hiddenCount: lv.hiddenIdx.length,
      foundWords: new Set(),
      selectedCells: [],
      solved: false,
      levelComplete: false
    };
  }

  function placeWordsAndFill(words, size, seed, dirs) {
    const rng = mulberry32(seed);
    const grid = Array.from({ length: size }, () => Array(size).fill(null));
    const placements = [];
    const sorted = words.slice().sort((a, b) => b.word.length - a.word.length);
    for (const w of sorted) {
      let placed = false;
      for (let tries = 0; tries < 800 && !placed; tries++) {
        const dir = dirs[Math.floor(rng() * dirs.length)];
        const r = Math.floor(rng() * size);
        const c = Math.floor(rng() * size);
        const endR = r + dir.dr * (w.word.length - 1);
        const endC = c + dir.dc * (w.word.length - 1);
        if (endR < 0 || endR >= size || endC < 0 || endC >= size) continue;
        let ok = true;
        for (let i = 0; i < w.word.length; i++) {
          const cr = r + dir.dr * i; const cc = c + dir.dc * i;
          if (grid[cr][cc] !== null && grid[cr][cc] !== w.word[i]) { ok = false; break; }
        }
        if (!ok) continue;
        const cells = [];
        for (let i = 0; i < w.word.length; i++) {
          const cr = r + dir.dr * i; const cc = c + dir.dc * i;
          grid[cr][cc] = w.word[i];
          cells.push({ r: cr, c: cc });
        }
        placements.push({ word: w.word, pitch: w.pitch, cells });
        placed = true;
      }
    }
    /* Pool de farciment: lletres de notes + algunes neutres per camuflar */
    const pool = 'DOREMIFASOLABCNPTUVHK';
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (grid[r][c] === null) grid[r][c] = pool[Math.floor(rng() * pool.length)];
      }
    }
    return { grid, placements };
  }

  /* ── Render ───────────────────────────────────────────────────────── */
  function render() {
    boardEl.innerHTML = '';
    const wrap = document.createElement('div');
    wrap.className = 'mots-amagats';

    /* Banner del nivell */
    const banner = document.createElement('div');
    banner.className = 'mots-amagats__banner';
    banner.innerHTML = `<span class="mots-amagats__level">${state.level.label}</span>` +
                       `<span class="mots-amagats__warn">${state.hiddenCount} notes amagades · ` +
                       (state.pentagram.length > state.hiddenCount
                          ? `<em>compte: alguna nota del pentagrama és una trampa!</em>`
                          : `sense trampes`) + `</span>`;
    wrap.appendChild(banner);

    /* Layout 2-cols: sidebar (pentagrama + targets) | graella */
    const main = document.createElement('div');
    main.className = 'mots-amagats__main';

    /* Sidebar */
    const sidebar = document.createElement('div');
    sidebar.className = 'mots-amagats__sidebar';

    const decoder = document.createElement('div');
    decoder.className = 'mots-amagats__decoder';
    const dt = document.createElement('h4');
    dt.className = 'mots-amagats__decoder-title';
    dt.textContent = '★ Llegeix el pentagrama';
    decoder.appendChild(dt);
    const decoderSvg = global.NotePass.Pentagrama.render({
      width: 320,
      height: 130,
      staffSpacing: 12,
      notes: state.pentagram
    });
    decoder.appendChild(decoderSvg);
    sidebar.appendChild(decoder);

    const targets = document.createElement('div');
    targets.className = 'mots-amagats__targets';
    const ttl = document.createElement('h4');
    ttl.className = 'mots-amagats__targets-title';
    ttl.textContent = `Trobeu ${state.hiddenCount} notes a la graella`;
    targets.appendChild(ttl);
    /* Mostrem caixes en blanc; al trobar, es marca i es revela */
    for (let i = 0; i < state.hiddenCount; i++) {
      const t = document.createElement('div');
      t.className = 'mots-amagats__target';
      t.dataset.idx = i;
      t.innerHTML = `<span class="mots-amagats__target-mark"></span><span class="mots-amagats__target-label">· · ·</span>`;
      targets.appendChild(t);
    }
    sidebar.appendChild(targets);

    main.appendChild(sidebar);

    /* Graella */
    const grid = document.createElement('div');
    grid.className = 'mots-amagats__grid';
    grid.id = 'mots-grid';
    const sz = state.level.gridSize;
    grid.style.gridTemplateColumns = `repeat(${sz}, 1fr)`;
    for (let r = 0; r < sz; r++) {
      for (let c = 0; c < sz; c++) {
        const cell = document.createElement('div');
        cell.className = 'mots-amagats__cell';
        cell.dataset.r = r;
        cell.dataset.c = c;
        cell.textContent = state.grid[r][c];
        grid.appendChild(cell);
      }
    }
    main.appendChild(grid);

    wrap.appendChild(main);
    boardEl.appendChild(wrap);

    wireSelection(grid);
  }

  /* ── Selecció click-and-drag ──────────────────────────────────────── */
  function wireSelection(gridEl) {
    let dragging = false;
    let startR = 0, startC = 0;

    const cellFromEvent = (ev) => {
      const point = ev.touches ? ev.touches[0] : ev;
      const el = document.elementFromPoint(point.clientX, point.clientY);
      if (!el || !el.classList || !el.classList.contains('mots-amagats__cell')) return null;
      return { r: parseInt(el.dataset.r, 10), c: parseInt(el.dataset.c, 10), el };
    };
    const startDrag = (ev) => {
      const cell = cellFromEvent(ev);
      if (!cell) return;
      ev.preventDefault();
      dragging = true;
      startR = cell.r; startC = cell.c;
      updateSelection(startR, startC, startR, startC);
    };
    const moveDrag = (ev) => {
      if (!dragging) return;
      const cell = cellFromEvent(ev);
      if (!cell) return;
      ev.preventDefault();
      updateSelection(startR, startC, cell.r, cell.c);
    };
    const endDrag = () => {
      if (!dragging) return;
      dragging = false;
      finalizeSelection();
    };

    gridEl.addEventListener('mousedown', startDrag);
    gridEl.addEventListener('mousemove', moveDrag);
    document.addEventListener('mouseup', endDrag);

    gridEl.addEventListener('touchstart', startDrag, { passive: false });
    gridEl.addEventListener('touchmove', moveDrag, { passive: false });
    document.addEventListener('touchend', endDrag);
  }

  function lineCells(r1, c1, r2, c2) {
    const dr = r2 - r1, dc = c2 - c1;
    if (dr === 0 && dc === 0) return [{ r: r1, c: c1 }];
    const adr = Math.abs(dr), adc = Math.abs(dc);
    if (!(dr === 0 || dc === 0 || adr === adc)) return [{ r: r1, c: c1 }];
    const steps = Math.max(adr, adc);
    const sR = dr === 0 ? 0 : dr / steps;
    const sC = dc === 0 ? 0 : dc / steps;
    const out = [];
    for (let i = 0; i <= steps; i++) out.push({ r: r1 + sR * i, c: c1 + sC * i });
    return out;
  }

  function updateSelection(r1, c1, r2, c2) {
    boardEl.querySelectorAll('.mots-amagats__cell.is-selecting').forEach(c => c.classList.remove('is-selecting'));
    const cells = lineCells(r1, c1, r2, c2);
    state.selectedCells = cells;
    cells.forEach(c => {
      const el = boardEl.querySelector(`.mots-amagats__cell[data-r="${c.r}"][data-c="${c.c}"]`);
      if (el) el.classList.add('is-selecting');
    });
  }

  function finalizeSelection() {
    const cells = state.selectedCells;
    if (!cells || cells.length < 2) { clearSelection(); return; }
    const word = cells.map(c => state.grid[c.r][c.c]).join('');
    const reversed = word.split('').reverse().join('');

    for (const p of state.placements) {
      if (state.foundWords.has(p.word)) continue;
      if ((p.word === word || p.word === reversed) && cellsMatch(cells, p.cells)) {
        markFound(p);
        clearSelection();
        if (state.foundWords.size === state.placements.length) handleLevelComplete();
        return;
      }
    }
    clearSelection();
  }

  function cellsMatch(a, b) {
    if (a.length !== b.length) return false;
    const keyA = a.map(c => `${c.r},${c.c}`).sort().join('|');
    const keyB = b.map(c => `${c.r},${c.c}`).sort().join('|');
    return keyA === keyB;
  }

  function clearSelection() {
    boardEl.querySelectorAll('.mots-amagats__cell.is-selecting').forEach(c => c.classList.remove('is-selecting'));
    state.selectedCells = [];
  }

  function markFound(p) {
    state.foundWords.add(p.word);
    p.cells.forEach(({ r, c }) => {
      const el = boardEl.querySelector(`.mots-amagats__cell[data-r="${r}"][data-c="${c}"]`);
      if (el) { el.classList.add('is-found'); el.classList.remove('is-selecting'); }
    });
    /* Marca el següent target pendent */
    const pending = boardEl.querySelector('.mots-amagats__target:not(.is-found)');
    if (pending) {
      pending.classList.add('is-found');
      pending.querySelector('.mots-amagats__target-mark').textContent = '✓';
      pending.querySelector('.mots-amagats__target-label').textContent = p.word;
    }
    updateHud();
  }

  function handleLevelComplete() {
    state.levelComplete = true;
    updateHud();
    if (levelIdx >= LEVELS.length - 1) {
      handleFinalWin();
    } else {
      /* Mostra un toast de progrés inline; el botó "Següent nivell" ja és al HUD */
      const fb = document.createElement('div');
      fb.className = 'mots-amagats__levelup';
      fb.innerHTML = `Nivell completat! Prem <strong>Següent nivell →</strong> per continuar.`;
      const wrap = boardEl.querySelector('.mots-amagats');
      if (wrap) wrap.appendChild(fb);
    }
  }

  function handleFinalWin() {
    state.solved = true;
    setTimeout(() => global.NotePass.Router.showVictory(
      'Has dominat els cinc nivells. Ull i solfeig en perfecta sintonia.'
    ), 400);
  }

  function updateHud() {
    if (!hudEl) return;
    const lvCounter = `Nivell ${levelIdx + 1}/${LEVELS.length}`;
    const found = `${state.foundWords.size}/${state.placements.length}`;
    const showNext = state.levelComplete && levelIdx < LEVELS.length - 1;
    hudEl.innerHTML = `
      <span class="hud-pill">${lvCounter}</span>
      <span class="hud-pill">${found}</span>
      ${showNext ? `<button class="btn-next" type="button">Següent nivell →</button>` : ''}
    `;
    const btn = hudEl.querySelector('.btn-next');
    if (btn) btn.addEventListener('click', nextLevel);
  }

  function autosolve() {
    if (!state) return;
    state.placements.forEach(p => { if (!state.foundWords.has(p.word)) markFound(p); });
    if (state.foundWords.size === state.placements.length) handleLevelComplete();
  }

  /* ── Tutorial ─────────────────────────────────────────────────────── */
  function runTutorial(onDone) {
    const steps = [
      {
        text: 'A l\'esquerra veus un <strong>pentagrama amb notes</strong>. Identifica\'n els noms en català (<em>DO, RE, MI, FA, SOL, LA, SI</em>).',
        target: '.mots-amagats__decoder'
      },
      {
        text: 'Però <strong>ull viu</strong>: a partir del nivell III, algunes notes del pentagrama són <em>trampes</em> i no estan amagades a la graella. A sota tens quantes n\'has de trobar realment.'
      },
      {
        text: 'A la dreta tens una <strong>sopa de lletres</strong>. Selecciona una paraula amb <em>clic i arrossegar</em>. La línia ha de ser recta (horitzontal, vertical o diagonal).',
        target: '#mots-grid'
      },
      {
        text: 'Quan completis totes les notes reals del nivell, apareixerà el botó <strong>Següent nivell →</strong> a dalt a la dreta. Cinc nivells en total.'
      }
    ];
    global.NotePass.Tutorial.run(steps, onDone);
  }

  const meta = {
    id: 'mots-amagats',
    icon: '✎',
    title: 'Mots Amagats',
    pitch: 'Sopa de Notes · 5 nivells, amb trampes a partir del III',
    context: 'Llegeix les notes del pentagrama i troba\'n els noms a la sopa de lletres. ' +
             'Cinc nivells de dificultat creixent: en els últims, alguna nota del pentagrama ' +
             'no estarà amagada — has de detectar la trampa.',
    metaTag: 'Decodificació · 5 nivells · Clau de Sol'
  };

  global.NotePass = global.NotePass || {};
  global.NotePass.Games = global.NotePass.Games || {};
  global.NotePass.Games.MotsAmagats = {
    meta, init, destroy, reset, autosolve, runTutorial
  };

})(window);
