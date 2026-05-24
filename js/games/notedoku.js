/* ============================================================================
 * NOTEDOKU.JS — Latin Square 7×7 amb les 7 notes naturals
 *   DO · RE · MI · FA · SOL · LA · SI
 * Cada fila i cada columna conté les 7 notes una sola vegada (sense quadrants:
 * 7 és primer i no admet una partició en blocs regulars).
 * Mecànica:
 *   - Cells fixes (font negreta, fons paper-shade): no editables.
 *   - Cells buides: input de text. L'alumne escriu la nota.
 *   - Botó COMPROVAR al HUD: marca correctes (verd) i errònies (vermell).
 *   - Quan totes les cells coincideixen amb la solució → victòria.
 * ============================================================================ */
(function (global) {
  'use strict';

  const NOTES = ['DO', 'RE', 'MI', 'FA', 'SOL', 'LA', 'SI'];
  const NOTES_SET = new Set(NOTES);
  const N = 7;

  /* PRNG determinístic */
  function mulberry32(seed) {
    return function () {
      let t = (seed += 0x6D2B79F5);
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function shuffled(arr, rng) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  /* Latin Square 7×7 amb files i columnes permutades a partir d'un seed.
   * Una permutació de files i columnes d'un Latin Square segueix sent un
   * Latin Square, però trenca el patró cíclic obvi (DO RE MI FA → RE MI FA SOL…)
   * que faria el puzzle massa trivial visualment. */
  function scrambledLatinSquare(seed) {
    const rng = mulberry32(seed);
    /* Base cíclica: row[r][c] = NOTES[(r+c) % 7] */
    const base = Array.from({length:N}, (_,r) => Array.from({length:N}, (_,c) => NOTES[(r+c) % N]));
    const rowOrder = shuffled([0,1,2,3,4,5,6], rng);
    const colOrder = shuffled([0,1,2,3,4,5,6], rng);
    const out = [];
    for (let r = 0; r < N; r++) {
      const row = [];
      for (let c = 0; c < N; c++) row.push(base[rowOrder[r]][colOrder[c]]);
      out.push(row);
    }
    return out;
  }

  /* 4 puzzles per al reset: seeds diferents → solucions diferents, totes
   * sense patró cíclic visible. La màscara de cells fixes varia per donar
   * sensació de puzzles diferents. */
  const PUZZLES = [
    {
      solution: scrambledLatinSquare(42),
      fixedCells: [
        [0,0],[0,2],[0,5],
        [1,1],[1,4],[1,6],
        [2,3],[2,0],
        [3,2],[3,5],
        [4,1],[4,4],[4,6],
        [5,3],[5,0],
        [6,2],[6,5]
      ]
    },
    {
      solution: scrambledLatinSquare(1729),
      fixedCells: [
        [0,1],[0,4],[0,6],
        [1,0],[1,3],[1,5],
        [2,2],[2,6],
        [3,1],[3,4],
        [4,0],[4,3],[4,6],
        [5,2],[5,5],
        [6,1],[6,4]
      ]
    },
    {
      solution: scrambledLatinSquare(314),
      fixedCells: [
        [0,2],[0,5],
        [1,0],[1,3],[1,6],
        [2,1],[2,4],
        [3,0],[3,3],[3,5],
        [4,2],[4,6],
        [5,1],[5,4],
        [6,0],[6,3],[6,6]
      ]
    },
    {
      solution: scrambledLatinSquare(6809),
      fixedCells: [
        [0,3],[0,6],
        [1,1],[1,5],
        [2,0],[2,2],[2,4],
        [3,6],
        [4,1],[4,3],[4,5],
        [5,0],[5,2],[5,4],
        [6,3],[6,6]
      ]
    }
  ];

  let state = null;
  let boardEl = null;
  let hudEl = null;
  let puzzleIdx = 0;

  function init(_boardEl, _hudEl) {
    boardEl = _boardEl;
    hudEl   = _hudEl;
    puzzleIdx = 0;
    buildState();
    render();
    updateHud();
  }

  function destroy() {
    state = null;
    if (boardEl) boardEl.innerHTML = '';
    if (hudEl)   hudEl.innerHTML = '';
  }

  function reset() {
    puzzleIdx = (puzzleIdx + 1) % PUZZLES.length;
    buildState();
    render();
    updateHud();
  }

  function buildState() {
    const p = PUZZLES[puzzleIdx];
    const fixedSet = new Set(p.fixedCells.map(([r,c]) => `${r},${c}`));
    state = {
      solution: p.solution.map(row => row.slice()),
      fixed: Array.from({length:N}, (_,r) => Array.from({length:N}, (_,c) => fixedSet.has(`${r},${c}`))),
      grid: Array.from({length:N}, (_,r) => Array.from({length:N}, (_,c) =>
        fixedSet.has(`${r},${c}`) ? p.solution[r][c] : ''
      )),
      solved: false,
      checkedOnce: false
    };
  }

  function render() {
    boardEl.innerHTML = '';
    const wrap = document.createElement('div');
    wrap.className = 'notedoku';

    const legend = document.createElement('p');
    legend.className = 'notedoku__legend';
    legend.innerHTML = `Omple la graella amb les set notes <strong>DO · RE · MI · FA · SOL · LA · SI</strong>. Cap nota es repeteix en cap <em>fila</em> ni <em>columna</em>. Escriu directament a les caselles buides; quan acabis, prem <strong>Comprovar</strong>.`;
    wrap.appendChild(legend);

    const grid = document.createElement('div');
    grid.className = 'notedoku__grid';
    grid.style.gridTemplateColumns = `repeat(${N}, 1fr)`;
    grid.style.gridTemplateRows = `repeat(${N}, 1fr)`;

    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        const cell = document.createElement('div');
        cell.className = 'notedoku__cell';
        cell.dataset.r = r;
        cell.dataset.c = c;

        if (state.fixed[r][c]) {
          cell.classList.add('is-locked');
          cell.textContent = state.grid[r][c];
        } else {
          const input = document.createElement('input');
          input.type = 'text';
          input.maxLength = 3;
          input.spellcheck = false;
          input.autocapitalize = 'characters';
          input.dataset.r = r;
          input.dataset.c = c;
          input.value = state.grid[r][c] || '';
          input.addEventListener('input', onInput);
          input.addEventListener('keydown', onKeydown);
          cell.appendChild(input);
        }
        grid.appendChild(cell);
      }
    }

    wrap.appendChild(grid);
    boardEl.appendChild(wrap);
  }

  function onInput(ev) {
    const input = ev.target;
    const val = input.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3);
    input.value = val;
    const r = parseInt(input.dataset.r, 10);
    const c = parseInt(input.dataset.c, 10);
    state.grid[r][c] = val;
    // En editar, treu marques de validació prèvies
    input.parentElement.classList.remove('is-correct', 'is-wrong');
    updateHud();
  }

  function onKeydown(ev) {
    const input = ev.target;
    const r = parseInt(input.dataset.r, 10);
    const c = parseInt(input.dataset.c, 10);
    if (ev.key === 'ArrowRight') { moveCursor(r, c, 0, 1); ev.preventDefault(); }
    else if (ev.key === 'ArrowLeft')  { moveCursor(r, c, 0, -1); ev.preventDefault(); }
    else if (ev.key === 'ArrowDown')  { moveCursor(r, c, 1, 0); ev.preventDefault(); }
    else if (ev.key === 'ArrowUp')    { moveCursor(r, c, -1, 0); ev.preventDefault(); }
    else if (ev.key === 'Enter')      { comprovar(); ev.preventDefault(); }
  }

  function moveCursor(r, c, dr, dc) {
    let nr = r + dr, nc = c + dc;
    while (nr >= 0 && nr < N && nc >= 0 && nc < N) {
      const inp = boardEl.querySelector(`input[data-r="${nr}"][data-c="${nc}"]`);
      if (inp) { inp.focus(); inp.select(); return; }
      nr += dr; nc += dc;
    }
  }

  /* ── Comprovació: valida com a Latin Square (qualsevol solució vàlida val) ── */
  function comprovar() {
    state.checkedOnce = true;
    boardEl.querySelectorAll('.notedoku__cell').forEach(c =>
      c.classList.remove('is-correct', 'is-wrong')
    );

    /* Valor efectiu de cada cell: fixed → solution, sinó → input de l'alumne */
    const eff = Array.from({length:N}, () => Array(N).fill(''));
    let allFilled = true;
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        const v = state.fixed[r][c] ? state.solution[r][c] : (state.grid[r][c] || '').trim();
        eff[r][c] = v;
        if (!v) allFilled = false;
      }
    }

    /* Detecta cells errònies (valor invàlid o duplicat en fila/columna) */
    const wrong = new Set();
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        const v = eff[r][c];
        if (v && !NOTES_SET.has(v)) wrong.add(`${r},${c}`);
      }
    }
    for (let r = 0; r < N; r++) {
      const seen = {};
      for (let c = 0; c < N; c++) {
        const v = eff[r][c];
        if (!v || !NOTES_SET.has(v)) continue;
        if (seen[v] !== undefined) {
          wrong.add(`${r},${c}`); wrong.add(`${r},${seen[v]}`);
        } else seen[v] = c;
      }
    }
    for (let c = 0; c < N; c++) {
      const seen = {};
      for (let r = 0; r < N; r++) {
        const v = eff[r][c];
        if (!v || !NOTES_SET.has(v)) continue;
        if (seen[v] !== undefined) {
          wrong.add(`${r},${c}`); wrong.add(`${seen[v]},${c}`);
        } else seen[v] = r;
      }
    }

    /* Pinta cells no-fixed */
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        if (state.fixed[r][c]) continue;
        const cell = boardEl.querySelector(`.notedoku__cell[data-r="${r}"][data-c="${c}"]`);
        const v = eff[r][c];
        if (!v) continue;
        if (wrong.has(`${r},${c}`)) cell.classList.add('is-wrong');
        else cell.classList.add('is-correct');
      }
    }

    updateHud();
    if (allFilled && wrong.size === 0) handleWin();
  }

  function handleWin() {
    state.solved = true;
    setTimeout(() => global.NotePass.Router.showVictory(
      'Has resolt el Notedoku sense una sola dissonància. Les set notes en harmonia.'
    ), 400);
  }

  /* ── HUD amb botó Comprovar i comptador ───────────────────────────── */
  function updateHud() {
    if (!hudEl) return;
    let filled = 0, total = 0;
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        if (!state.fixed[r][c]) {
          total++;
          if ((state.grid[r][c] || '').trim()) filled++;
        }
      }
    }
    hudEl.innerHTML = `
      <span class="hud-pill">${filled} / ${total}</span>
      <button class="btn-check" type="button">✓ Comprovar</button>
    `;
    const btn = hudEl.querySelector('.btn-check');
    if (btn) btn.addEventListener('click', comprovar);
  }

  function autosolve() {
    if (!state) return;
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        state.grid[r][c] = state.solution[r][c];
        if (!state.fixed[r][c]) {
          const input = boardEl.querySelector(`input[data-r="${r}"][data-c="${c}"]`);
          if (input) input.value = state.solution[r][c];
        }
      }
    }
    comprovar();
  }

  /* ── Tutorial ─────────────────────────────────────────────────────── */
  function runTutorial(onDone) {
    const targetCell = findFirstEmptyCell();
    const steps = [
      {
        text: 'Aquesta és una graella <strong>7×7</strong>. Cada <em>fila</em> i cada <em>columna</em> ha de tenir exactament les set notes: <strong>DO · RE · MI · FA · SOL · LA · SI</strong>, sense repetir-ne cap.'
      },
      {
        text: 'Les caselles amb fons gris i lletres en negreta són <strong>fixes</strong>: són la pista del compositor. Les caselles blanques les has d\'omplir tu.',
        target: targetCell ? `.notedoku__cell[data-r="${targetCell.r}"][data-c="${targetCell.c}"]` : null
      },
      {
        text: 'Fes clic a una casella buida i <strong>escriu la nota</strong>: <em>DO, RE, MI, FA, SOL, LA</em> o <em>SI</em>. Pots moure\'t entre caselles amb les fletxes del teclat.'
      },
      {
        text: 'Quan creguis que ho tens tot, prem el botó <strong>✓ Comprovar</strong> de dalt a la dreta. Les caselles correctes es pintaran de verd; les errònies, de vermell. Pots comprovar tantes vegades com vulguis.'
      }
    ];
    global.NotePass.Tutorial.run(steps, onDone);
  }

  function findFirstEmptyCell() {
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        if (!state.fixed[r][c]) return { r, c };
      }
    }
    return null;
  }

  /* ── Meta ─────────────────────────────────────────────────────────── */
  const meta = {
    id: 'notedoku',
    icon: '▦',
    title: 'Notedoku',
    pitch: 'Latin Square de Notes 7×7 · DO RE MI FA SOL LA SI',
    context: 'Set notes, set files, set columnes. Cap nota es repeteix dins una mateixa fila ni ' +
             'columna. Escriu directament a les caselles, comprova quan vulguis, i ajusta fins ' +
             'que totes encaixin.',
    metaTag: 'Lògica · Set notes · Sense ritme'
  };

  global.NotePass = global.NotePass || {};
  global.NotePass.Games = global.NotePass.Games || {};
  global.NotePass.Games.Notedoku = {
    meta, init, destroy, reset, autosolve, runTutorial
  };

})(window);
