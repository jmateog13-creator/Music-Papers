/* ============================================================================
 * MAIN-FRONT.JS — Controlador de la portada (index.html)
 *   - Posa la data del masthead.
 *   - Llegeix localStorage i marca els articles dels jocs ja completats
 *     (segell verd "Completat ✓").
 * ============================================================================ */
(function () {
  'use strict';

  // 1r ESO (?curs=1) desa els jocs fets a part
  const LS_COMPLETED_KEY = 'notepass:completed' + (new URLSearchParams(location.search).get('curs') === '1' ? '_c1' : '');

  document.addEventListener('DOMContentLoaded', () => {
    // 1r ESO: els enllaços als passatemps mantenen ?curs=1
    if (location.search.includes('curs=1')) document.querySelectorAll('a[href$=".html"]').forEach(a => { a.href = a.getAttribute('href') + location.search; });
    setMastheadDate();
    markCompletedArticles();
  });

  function setMastheadDate() {
    const el = document.getElementById('masthead-date');
    if (!el) return;
    const today = new Date();
    const dies = ['Diumenge', 'Dilluns', 'Dimarts', 'Dimecres', 'Dijous', 'Divendres', 'Dissabte'];
    const mesos = ['gener', 'febrer', 'març', 'abril', 'maig', 'juny',
                   'juliol', 'agost', 'setembre', 'octubre', 'novembre', 'desembre'];
    el.textContent = `${dies[today.getDay()]}, ${today.getDate()} de ${mesos[today.getMonth()]} de ${today.getFullYear()}`;
  }

  function markCompletedArticles() {
    let completed = [];
    try {
      const raw = localStorage.getItem(LS_COMPLETED_KEY);
      completed = raw ? JSON.parse(raw) : [];
    } catch (_) { return; }

    if (!completed.length) return;

    completed.forEach(id => {
      const article = document.querySelector(`.column[data-game="${id}"]`);
      if (!article) return;
      article.classList.add('is-completed');
      /* Insereix segell visual */
      const seal = document.createElement('span');
      seal.className = 'column__seal';
      seal.title = 'Passatemps completat';
      seal.textContent = '✓';
      article.appendChild(seal);
    });
  }

})();
