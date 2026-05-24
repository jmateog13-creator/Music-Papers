/* ============================================================================
 * CROSSNOTE.JS — Crucigrama de teoria
 * API: window.NotePass.Games.Crossnote
 * Les claus són sobre pitch i alteracions en Clau de Sol. Exactament una
 * pista (FA) recorda l'existència de la Clau de Fa.
 * ============================================================================ */
(function (global) {
  'use strict';

  const SIZE = 8;

  /* Definició del crucigrama: cada entrada té
   *  num, dir ('H' | 'V'), row, col, answer, clue
   * El numbering està pre-calculat segons les regles habituals. */
  const ENTRIES = [
    { num: 1, dir: 'H', row: 0, col: 1, answer: 'CLAU',
      clue: 'Signe que es col·loca a l\'inici del pentagrama per indicar l\'altura de les notes.' },
    { num: 2, dir: 'V', row: 0, col: 2, answer: 'LINIA',
      clue: 'El pentagrama en té cinc, paral·leles, separades per espais.' },
    { num: 3, dir: 'H', row: 2, col: 2, answer: 'NOTA',
      clue: 'Cadascun dels sons musicals; es representa amb un cap rodó al pentagrama.' },
    { num: 4, dir: 'H', row: 4, col: 1, answer: 'FA',
      clue: 'Clau musical utilitzada històricament per a registrar els instruments més greus de l\'orquestra.',
      isFa: true },
    { num: 5, dir: 'H', row: 5, col: 3, answer: 'SOL',
      clue: 'Clau més habitual per als instruments aguts; també nom de la cinquena nota.' },
    { num: 6, dir: 'V', row: 5, col: 5, answer: 'LA',
      clue: 'Sisena nota de l\'escala diatònica de DO Major.' },
    { num: 7, dir: 'H', row: 7, col: 1, answer: 'BEMOL',
      clue: 'Alteració que baixa una nota mig to; el seu símbol és ♭.' }
  ];

  let boardEl = null;
  let hudEl = null;
  let state = null;

  function init(_boardEl, _hudEl) {
    boardEl = _boardEl;
    hudEl   = _hudEl;
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
    buildState();
    render();
    updateHud();
  }

  /* Genera la graella derivant cells actius/bloquejats de les entrades */
  function buildState() {
    const active = {};              // 'r,c' → { answers:{H?:char, V?:char}, num? }
    const numberMap = {};           // 'r,c' → num
    const cellEntries = {};         // 'r,c' → array de entries que la cobreixen

    ENTRIES.forEach(e => {
      const { dr, dc } = (e.dir === 'H') ? { dr: 0, dc: 1 } : { dr: 1, dc: 0 };
      for (let i = 0; i < e.answer.length; i++) {
        const r = e.row + dr * i;
        const c = e.col + dc * i;
        const key = `${r},${c}`;
        if (!active[key]) active[key] = { value: '', solution: '' };
        active[key].solution = e.answer[i];
        if (!cellEntries[key]) cellEntries[key] = [];
        cellEntries[key].push(e);
      }
      numberMap[`${e.row},${e.col}`] = e.num;
    });

    state = {
      active,
      cellEntries,
      numberMap,
      solvedEntries: new Set(),
      solved: false
    };
  }

  function render() {
    boardEl.innerHTML = '';
    const wrap = document.createElement('div');
    wrap.className = 'crossnote';

    const grid = document.createElement('div');
    grid.className = 'crossnote__grid';
    grid.style.gridTemplateColumns = `repeat(${SIZE}, 1fr)`;

    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        const key = `${r},${c}`;
        const cell = document.createElement('div');
        cell.className = 'crossnote__cell';
        if (!state.active[key]) {
          cell.classList.add('crossnote__cell--block');
        } else {
          if (state.numberMap[key]) {
            const num = document.createElement('span');
            num.className = 'crossnote__cell-number';
            num.textContent = state.numberMap[key];
            cell.appendChild(num);
          }
          const input = document.createElement('input');
          input.type = 'text';
          input.maxLength = 1;
          input.dataset.r = r;
          input.dataset.c = c;
          input.value = state.active[key].value || '';
          input.autocapitalize = 'characters';
          input.spellcheck = false;
          input.addEventListener('input', onInput);
          input.addEventListener('keydown', onKeydown);
          input.addEventListener('focus', onFocus);
          cell.appendChild(input);
        }
        grid.appendChild(cell);
      }
    }
    wrap.appendChild(grid);

    /* Clues blocks: HORITZONTALS i VERTICALS */
    const clues = document.createElement('div');
    clues.className = 'crossnote__clues';

    const cluesH = makeClueBlock('HORITZONTALS', ENTRIES.filter(e => e.dir === 'H'));
    const cluesV = makeClueBlock('VERTICALS', ENTRIES.filter(e => e.dir === 'V'));
    clues.appendChild(cluesH);
    clues.appendChild(cluesV);

    wrap.appendChild(clues);
    boardEl.appendChild(wrap);
  }

  function makeClueBlock(title, entries) {
    const block = document.createElement('div');
    block.className = 'crossnote__clue-block';
    const t = document.createElement('h4');
    t.className = 'crossnote__clue-block-title';
    t.textContent = title;
    block.appendChild(t);
    entries.forEach(e => {
      const c = document.createElement('div');
      c.className = 'crossnote__clue';
      if (e.isFa) c.classList.add('is-fa');
      c.dataset.num = e.num;
      c.dataset.dir = e.dir;
      c.innerHTML = `<span class="crossnote__clue-num">${e.num}.</span><span>${e.clue}</span>`;
      c.addEventListener('click', () => focusEntry(e));
      block.appendChild(c);
    });
    return block;
  }

  function focusEntry(e) {
    const input = boardEl.querySelector(`input[data-r="${e.row}"][data-c="${e.col}"]`);
    if (input) input.focus();
    // marca clue actiu
    boardEl.querySelectorAll('.crossnote__clue.is-active').forEach(c => c.classList.remove('is-active'));
    boardEl.querySelectorAll(`.crossnote__clue[data-num="${e.num}"][data-dir="${e.dir}"]`).forEach(c => c.classList.add('is-active'));
  }

  function onFocus(ev) {
    /* En el focus d'una cell, marquem com a actives les entries que la contenen */
    const r = parseInt(ev.target.dataset.r, 10);
    const c = parseInt(ev.target.dataset.c, 10);
    const entries = state.cellEntries[`${r},${c}`] || [];
    boardEl.querySelectorAll('.crossnote__clue.is-active').forEach(el => el.classList.remove('is-active'));
    entries.forEach(e => {
      boardEl.querySelectorAll(`.crossnote__clue[data-num="${e.num}"][data-dir="${e.dir}"]`).forEach(el => el.classList.add('is-active'));
    });
  }

  function onInput(ev) {
    const input = ev.target;
    const val = input.value.toUpperCase().replace(/[^A-ZÀ-Ú]/g, '').slice(0, 1);
    input.value = val;
    const r = parseInt(input.dataset.r, 10);
    const c = parseInt(input.dataset.c, 10);
    state.active[`${r},${c}`].value = val;

    /* En editar, treu marques de validació prèvies */
    input.parentElement.classList.remove('is-correct', 'is-wrong');

    if (val) {
      // Avança al següent input de l'entry que estem omplint (si n'hi ha)
      advanceToNext(r, c);
    }
    updateHud();
  }

  function onKeydown(ev) {
    const input = ev.target;
    const r = parseInt(input.dataset.r, 10);
    const c = parseInt(input.dataset.c, 10);

    if (ev.key === 'Backspace' && !input.value) {
      // Retrocedeix
      moveCursor(r, c, -1);
      ev.preventDefault();
    } else if (ev.key === 'ArrowRight') {
      moveCursor(r, c, +1, 'H'); ev.preventDefault();
    } else if (ev.key === 'ArrowLeft') {
      moveCursor(r, c, -1, 'H'); ev.preventDefault();
    } else if (ev.key === 'ArrowDown') {
      moveCursor(r, c, +1, 'V'); ev.preventDefault();
    } else if (ev.key === 'ArrowUp') {
      moveCursor(r, c, -1, 'V'); ev.preventDefault();
    }
  }

  function advanceToNext(r, c) {
    /* Si la cell pertany a una entry, va al següent en aquesta direcció.
     * Si pertany a 2 entries, prefereix horitzontal. */
    const entries = state.cellEntries[`${r},${c}`] || [];
    const e = entries.find(en => en.dir === 'H') || entries[0];
    if (!e) return;
    const { dr, dc } = (e.dir === 'H') ? { dr: 0, dc: 1 } : { dr: 1, dc: 0 };
    const nr = r + dr;
    const nc = c + dc;
    const nextInput = boardEl.querySelector(`input[data-r="${nr}"][data-c="${nc}"]`);
    if (nextInput) nextInput.focus();
  }

  function moveCursor(r, c, delta, dir) {
    if (!dir) {
      // Quan és backspace sense direcció explícita: cerca l'entry més propera
      const entries = state.cellEntries[`${r},${c}`] || [];
      const e = entries.find(en => en.dir === 'H') || entries[0];
      if (!e) return;
      dir = e.dir;
    }
    const { dr, dc } = (dir === 'H') ? { dr: 0, dc: 1 } : { dr: 1, dc: 0 };
    const nr = r + dr * delta;
    const nc = c + dc * delta;
    const nextInput = boardEl.querySelector(`input[data-r="${nr}"][data-c="${nc}"]`);
    if (nextInput) nextInput.focus();
  }

  /* Validació global a petició de l'usuari (botó Comprovar).
   * Marca paraules correctes en verd i paraules amb errors en vermell. */
  function comprovar() {
    state.checkedOnce = true;
    /* Reset marques prèvies (correctes i errònies) */
    boardEl.querySelectorAll('.crossnote__cell.is-solved, .crossnote__cell.is-wrong')
           .forEach(c => c.classList.remove('is-solved', 'is-wrong'));
    boardEl.querySelectorAll('.crossnote__clue.is-solved')
           .forEach(c => c.classList.remove('is-solved'));
    state.solvedEntries.clear();

    ENTRIES.forEach(e => {
      const { dr, dc } = (e.dir === 'H') ? { dr: 0, dc: 1 } : { dr: 1, dc: 0 };
      let typed = '';
      let anyEmpty = false;
      for (let i = 0; i < e.answer.length; i++) {
        const key = `${e.row + dr * i},${e.col + dc * i}`;
        const v = state.active[key].value || '';
        if (!v) anyEmpty = true;
        typed += v;
      }
      if (typed === e.answer) {
        state.solvedEntries.add(e.num + e.dir);
        markEntrySolved(e);
      } else if (!anyEmpty) {
        /* Tot omplert però paraula incorrecta: marca cells en vermell */
        for (let i = 0; i < e.answer.length; i++) {
          const r = e.row + dr * i;
          const c = e.col + dc * i;
          const cell = boardEl.querySelector(`.crossnote__cell input[data-r="${r}"][data-c="${c}"]`);
          if (cell && !cell.parentElement.classList.contains('is-solved')) {
            cell.parentElement.classList.add('is-wrong');
          }
        }
      }
    });
    updateHud();
    if (state.solvedEntries.size === ENTRIES.length && !state.solved) handleWin();
  }

  function markEntrySolved(e) {
    const { dr, dc } = (e.dir === 'H') ? { dr: 0, dc: 1 } : { dr: 1, dc: 0 };
    for (let i = 0; i < e.answer.length; i++) {
      const r = e.row + dr * i;
      const c = e.col + dc * i;
      const cell = boardEl.querySelector(`.crossnote__cell input[data-r="${r}"][data-c="${c}"]`);
      if (cell) cell.parentElement.classList.add('is-solved');
    }
    const clue = boardEl.querySelector(`.crossnote__clue[data-num="${e.num}"][data-dir="${e.dir}"]`);
    if (clue) clue.classList.add('is-solved');
  }

  function handleWin() {
    state.solved = true;
    setTimeout(() => global.NotePass.Router.showVictory(
      'Has completat el crucigrama. Set definicions, una sola distreta amb la clau de fa.'
    ), 500);
  }

  function updateHud() {
    if (!hudEl) return;
    /* Conta cells omplertes per pista */
    let filled = 0, total = 0;
    Object.keys(state.active).forEach(k => {
      total++;
      if ((state.active[k].value || '').trim()) filled++;
    });
    hudEl.innerHTML = `
      <span class="hud-pill">${state.solvedEntries.size} / ${ENTRIES.length} paraules</span>
      <button class="btn-check" type="button">✓ Comprovar</button>
    `;
    const btn = hudEl.querySelector('.btn-check');
    if (btn) btn.addEventListener('click', comprovar);
  }

  function autosolve() {
    if (!state) return;
    ENTRIES.forEach(e => {
      const { dr, dc } = (e.dir === 'H') ? { dr: 0, dc: 1 } : { dr: 1, dc: 0 };
      for (let i = 0; i < e.answer.length; i++) {
        const r = e.row + dr * i;
        const c = e.col + dc * i;
        const key = `${r},${c}`;
        state.active[key].value = e.answer[i];
        const input = boardEl.querySelector(`input[data-r="${r}"][data-c="${c}"]`);
        if (input) input.value = e.answer[i];
      }
    });
    comprovar();
  }

  /* ── Tutorial ─────────────────────────────────────────────────────── */
  function runTutorial(onDone) {
    const steps = [
      {
        text: 'És un <strong>crucigrama clàssic</strong>: les caselles blanques s\'han d\'omplir amb una lletra; les negres són bloquejos. Cada nombre marca l\'inici d\'una paraula.'
      },
      {
        text: 'Les pistes són al costat, dividides en <strong>HORITZONTALS</strong> i <strong>VERTICALS</strong>. Clica una pista i el cursor saltarà a la casella d\'inici.'
      },
      {
        text: 'Quasi totes les pistes parlen de lectura en <strong>Clau de Sol</strong>. Però una — i només una — recorda l\'existència de la <em>Clau de Fa</em>. Atenció.'
      },
      {
        text: '<strong>Omple tot el crucigrama</strong> amb tranquil·litat i, quan acabis, prem el botó <strong>✓ Comprovar</strong> de dalt a la dreta. Les paraules correctes es pintaran de verd; les errònies, de vermell.'
      }
    ];
    global.NotePass.Tutorial.run(steps, onDone);
  }

  /* ── Meta ─────────────────────────────────────────────────────────── */
  const meta = {
    id: 'crossnote',
    icon: '#',
    title: 'Crossnote',
    pitch: 'Crucigrama de Teoria · Pitch i alteracions',
    context: 'Set definicions creuades sobre el llenguatge del pentagrama: claus, notes i alteracions. ' +
             'La major part es resol en Clau de Sol, però una sola pista — amagada entre les altres — ' +
             'reclama un coneixement més greu. Doneu-li tinta i ploma.',
    metaTag: 'Teoria · Clau de Sol + 1 pista de Clau de Fa'
  };

  global.NotePass = global.NotePass || {};
  global.NotePass.Games = global.NotePass.Games || {};
  global.NotePass.Games.Crossnote = {
    meta, init, destroy, reset, autosolve, runTutorial
  };

})(window);
