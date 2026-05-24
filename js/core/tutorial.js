/* ============================================================================
 * TUTORIAL.JS — Motor de tutorials scripted (spotlight + texts)
 * API: window.NotePass.Tutorial.run(steps, onFinish)
 *   steps = [{ text, target?: selector | element, requireClick?: bool, advance?: 'auto'|'click' }]
 * ============================================================================ */
(function (global) {
  'use strict';

  const overlay   = () => document.getElementById('tutorial-overlay');
  const spotlight = () => document.getElementById('tutorial-spotlight');
  const text      = () => document.getElementById('tutorial-text');
  const stepLbl   = () => document.getElementById('tutorial-step');

  let currentSteps = [];
  let currentIdx   = 0;
  let onFinishCb   = null;
  let waitingClick = null;
  let clickHandler = null;

  function start(steps, onFinish) {
    currentSteps = steps || [];
    currentIdx = 0;
    onFinishCb = onFinish || (() => {});
    overlay().hidden = false;
    overlay().setAttribute('aria-hidden', 'false');
    showStep(0);
  }

  function showStep(idx) {
    if (idx >= currentSteps.length) return finish();
    currentIdx = idx;
    const step = currentSteps[idx];

    text().innerHTML = step.text;
    stepLbl().textContent = `Pas ${idx + 1}/${currentSteps.length}`;

    /* Spotlight: si hi ha target, retallem la zona perquè es vegi a sota */
    if (step.target) {
      const el = typeof step.target === 'string'
        ? document.querySelector(step.target)
        : step.target;
      if (el) {
        positionSpotlight(el);
      } else {
        spotlight().classList.remove('is-active');
      }
    } else {
      spotlight().classList.remove('is-active');
    }

    /* Avançament: per defecte, click al botó "Següent". Si requireClick=true,
       espera un clic sobre el target real per avançar. */
    cleanupClick();
    if (step.requireClick && step.target) {
      const el = typeof step.target === 'string'
        ? document.querySelector(step.target)
        : step.target;
      if (el) {
        clickHandler = (e) => {
          if (el.contains(e.target) || el === e.target) {
            // Donem un mini-tempo perquè el joc reaccioni primer
            setTimeout(() => next(), 100);
          }
        };
        document.addEventListener('click', clickHandler, true);
        // Per a guiat estricte, fem el veil clicable PERÒ deixem passar el clic
        // al target. Solució: el veil oculta i el spotlight permet clic al sota
        // perquè desactivem pointer-events del spotlight (CSS) i el veil no
        // ocupa la zona del spotlight (s'oculta amb has-spotlight).
        overlay().classList.add('has-spotlight');
      }
    } else {
      overlay().classList.remove('has-spotlight');
    }
  }

  function positionSpotlight(el) {
    const rect = el.getBoundingClientRect();
    const pad  = 8;
    const sp   = spotlight();
    sp.style.left   = (rect.left - pad) + 'px';
    sp.style.top    = (rect.top  - pad) + 'px';
    sp.style.width  = (rect.width  + pad * 2) + 'px';
    sp.style.height = (rect.height + pad * 2) + 'px';
    sp.classList.add('is-active');
  }

  function next() {
    showStep(currentIdx + 1);
  }

  function skip() {
    finish();
  }

  function finish() {
    cleanupClick();
    overlay().hidden = true;
    overlay().setAttribute('aria-hidden', 'true');
    overlay().classList.remove('has-spotlight');
    spotlight().classList.remove('is-active');
    const cb = onFinishCb;
    currentSteps = [];
    onFinishCb = null;
    if (typeof cb === 'function') cb();
  }

  function cleanupClick() {
    if (clickHandler) {
      document.removeEventListener('click', clickHandler, true);
      clickHandler = null;
    }
  }

  function isActive() {
    return !overlay().hidden;
  }

  /* ── Public API ───────────────────────────────────────────────────── */
  global.NotePass = global.NotePass || {};
  global.NotePass.Tutorial = {
    run: start,
    next,
    skip,
    finish,
    isActive
  };

  /* ── Wire-up dels botons del card ─────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', () => {
    document.addEventListener('click', (e) => {
      const a = e.target.closest('[data-action]');
      if (!a) return;
      if (a.dataset.action === 'tutorial-next') next();
      if (a.dataset.action === 'tutorial-skip') skip();
    });
  });

})(window);
