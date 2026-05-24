/* ============================================================================
 * PENTAGRAMA.JS — Renderer SVG de pentagrames en Clau de Sol
 * API: window.NotePass.Pentagrama
 * Inputs: notes amb forma { pitch: 'G4', accidental: '#'|'b'|'n'|null, id?, label? }
 * Options: width, height, notes, staffSpacing, showLabels, className
 * ============================================================================ */
(function (global) {
  'use strict';

  const SVG_NS = 'http://www.w3.org/2000/svg';

  /* Mapeig de pitch → posició diatònica relativa a E4 (línia inferior).
   * Cada pas amunt = +1 (E4=0, F4=1, G4=2 → línia G4 = 2a línia des de baix). */
  const PITCH_TO_POS = {
    'C4': -2, 'D4': -1, 'E4': 0, 'F4': 1, 'G4': 2, 'A4': 3, 'B4': 4,
    'C5':  5, 'D5':  6, 'E5': 7, 'F5': 8, 'G5': 9, 'A5':10, 'B5':11,
    'C6': 12
  };

  const NAME_TO_PITCHES = {
    'DO':  ['C4', 'C5'],
    'RE':  ['D4', 'D5'],
    'MI':  ['E4', 'E5'],
    'FA':  ['F4', 'F5'],
    'SOL': ['G4', 'G5'],
    'LA':  ['A4', 'A5'],
    'SI':  ['B4', 'B5']
  };

  function pitchToName(pitch) {
    return { C:'DO', D:'RE', E:'MI', F:'FA', G:'SOL', A:'LA', B:'SI' }[pitch[0]];
  }

  function pitchToPos(pitch) {
    if (!(pitch in PITCH_TO_POS)) throw new Error('Pitch fora de rang: ' + pitch);
    return PITCH_TO_POS[pitch];
  }

  /* ============================================================================
   * Clau de Sol amb el caràcter Unicode 𝄞 (U+1D11E). Posada amb el baseline
   * sobre la línia E4 (5a línia, la inferior), el "ull" del glyph aterra
   * aproximadament a la línia G4 (2a línia des de baix) — que és exactament
   * on l'estàndard la situa.
   * ============================================================================ */
  function makeGClef(centerX, bottomLineY, staffSpacing) {
    const clef = document.createElementNS(SVG_NS, 'text');
    clef.setAttribute('x', centerX);
    clef.setAttribute('y', bottomLineY + staffSpacing * 0.55);
    clef.setAttribute('font-size', staffSpacing * 5);
    clef.setAttribute('text-anchor', 'middle');
    clef.setAttribute('dominant-baseline', 'alphabetic');
    clef.classList.add('clef-text');
    clef.textContent = '\u{1D11E}';
    return clef;
  }

  /* ── Render principal ──────────────────────────────────────────────── */
  function render(opts) {
    const cfg = Object.assign({
      width: 520,
      height: 180,
      notes: [],
      staffSpacing: 12,
      showLabels: false,
      className: ''
    }, opts || {});

    const sp = cfg.staffSpacing;
    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('viewBox', `0 0 ${cfg.width} ${cfg.height}`);
    svg.setAttribute('xmlns', SVG_NS);
    svg.classList.add('pentagrama-svg');
    if (cfg.className) svg.classList.add(...cfg.className.split(' '));

    const staffStartX = Math.max(60, sp * 4);
    const staffEndX   = cfg.width - 20;
    const staffMidY   = cfg.height / 2;
    const topLineY    = staffMidY - 2 * sp;
    const bottomLineY = staffMidY + 2 * sp;
    const g4Y         = bottomLineY - 2 * (sp / 2) * 2;   // = staffMidY (B4 line) - sp = línia G4

    /* 5 línies del pentagrama */
    for (let i = 0; i < 5; i++) {
      const y = topLineY + i * sp;
      const line = document.createElementNS(SVG_NS, 'line');
      line.setAttribute('x1', staffStartX);
      line.setAttribute('x2', staffEndX);
      line.setAttribute('y1', y);
      line.setAttribute('y2', y);
      line.classList.add('staff-line');
      svg.appendChild(line);
    }

    /* Barres verticals d'inici i final */
    [staffStartX, staffEndX].forEach(x => {
      const bar = document.createElementNS(SVG_NS, 'line');
      bar.setAttribute('x1', x);
      bar.setAttribute('x2', x);
      bar.setAttribute('y1', topLineY);
      bar.setAttribute('y2', bottomLineY);
      bar.classList.add('staff-line');
      bar.setAttribute('stroke-width', '1.5');
      svg.appendChild(bar);
    });

    /* Clau de Sol — baseline a la línia E4; el ull cau sobre G4 */
    const clef = makeGClef(staffStartX + sp * 1.8, bottomLineY, sp);
    svg.appendChild(clef);

    /* Notes distribuïdes */
    const notesStartX = staffStartX + sp * 5;
    const notesEndX   = staffEndX - sp * 1.5;
    const N = cfg.notes.length;
    const step = N > 1 ? (notesEndX - notesStartX) / (N - 1) : 0;
    const baseY = bottomLineY;             // y de la posició 0 (E4)
    const noteHeadRX = sp * 0.6;
    const noteHeadRY = sp * 0.42;

    cfg.notes.forEach((note, i) => {
      const x = N > 1 ? notesStartX + i * step : (notesStartX + notesEndX) / 2;
      const pos = pitchToPos(note.pitch);
      const y = baseY - pos * (sp / 2);

      const noteGroup = document.createElementNS(SVG_NS, 'g');
      noteGroup.classList.add('note-group');
      if (note.id) noteGroup.dataset.id = note.id;

      /* Ledger lines si la nota cau fora del pentagrama */
      const ledgerLen = sp * 0.85;
      if (pos < 0) {
        for (let p = -2; p >= pos; p -= 2) {
          const ledY = baseY - p * (sp / 2);
          const led = document.createElementNS(SVG_NS, 'line');
          led.setAttribute('x1', x - ledgerLen);
          led.setAttribute('x2', x + ledgerLen);
          led.setAttribute('y1', ledY);
          led.setAttribute('y2', ledY);
          led.classList.add('ledger-line');
          noteGroup.appendChild(led);
        }
      } else if (pos > 8) {
        for (let p = 10; p <= pos; p += 2) {
          const ledY = baseY - p * (sp / 2);
          const led = document.createElementNS(SVG_NS, 'line');
          led.setAttribute('x1', x - ledgerLen);
          led.setAttribute('x2', x + ledgerLen);
          led.setAttribute('y1', ledY);
          led.setAttribute('y2', ledY);
          led.classList.add('ledger-line');
          noteGroup.appendChild(led);
        }
      }

      /* Alteració a l'esquerra del cap */
      if (note.accidental) {
        const acc = document.createElementNS(SVG_NS, 'text');
        acc.setAttribute('x', x - sp * 1.5);
        acc.setAttribute('y', y + sp * 0.4);
        acc.setAttribute('font-size', sp * 1.9);
        acc.classList.add('accidental');
        acc.textContent = ({ '#': '♯', 'b': '♭', 'n': '♮' })[note.accidental] || '';
        noteGroup.appendChild(acc);
      }

      /* Cap de nota (ellipse inclinada) */
      const head = document.createElementNS(SVG_NS, 'ellipse');
      head.setAttribute('cx', x);
      head.setAttribute('cy', y);
      head.setAttribute('rx', noteHeadRX);
      head.setAttribute('ry', noteHeadRY);
      head.setAttribute('transform', `rotate(-20 ${x} ${y})`);
      head.classList.add('note-head');
      if (note.interactive) {
        head.classList.add('note-target');
        if (note.id) head.dataset.id = note.id;
      }
      if (note.className) head.classList.add(...note.className.split(' '));
      noteGroup.appendChild(head);

      /* Plica */
      if (note.stem !== false) {
        const stem = document.createElementNS(SVG_NS, 'line');
        const stemLen = sp * 3;
        if (pos <= 4) {
          stem.setAttribute('x1', x + noteHeadRX * 0.85);
          stem.setAttribute('x2', x + noteHeadRX * 0.85);
          stem.setAttribute('y1', y - 1);
          stem.setAttribute('y2', y - stemLen);
        } else {
          stem.setAttribute('x1', x - noteHeadRX * 0.85);
          stem.setAttribute('x2', x - noteHeadRX * 0.85);
          stem.setAttribute('y1', y + 1);
          stem.setAttribute('y2', y + stemLen);
        }
        stem.setAttribute('stroke', 'currentColor');
        stem.setAttribute('stroke-width', '1.4');
        stem.classList.add('note-stem');
        noteGroup.appendChild(stem);
      }

      if (cfg.showLabels) {
        const lbl = document.createElementNS(SVG_NS, 'text');
        lbl.setAttribute('x', x);
        lbl.setAttribute('y', bottomLineY + sp * 3);
        lbl.classList.add('note-label');
        lbl.textContent = pitchToName(note.pitch);
        noteGroup.appendChild(lbl);
      }

      svg.appendChild(noteGroup);
    });

    return svg;
  }

  /* ── Public API ───────────────────────────────────────────────────── */
  global.NotePass = global.NotePass || {};
  global.NotePass.Pentagrama = {
    render,
    pitchToName,
    pitchToPos,
    PITCH_TO_POS,
    NAME_TO_PITCHES
  };

})(window);
