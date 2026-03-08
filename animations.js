// animations.js — reactive UI animations via hook system
// Tracks resource deltas and applies flash/pulse classes.

(function () {
  let prevConfidence = null;
  let prevBudget = null;

  hook('render:after', function (G) {
    const confEl   = document.getElementById('res-conf');
    const budgetEl = document.getElementById('res-budget');
    const advBtn   = document.getElementById('btn-advance');

    // --- Flash resource changes ---
    if (prevConfidence !== null && confEl) {
      if (G.confidence > prevConfidence) applyFlash(confEl, 'flash-green');
      else if (G.confidence < prevConfidence) applyFlash(confEl, 'flash-red');
    }

    if (prevBudget !== null && budgetEl) {
      if (G.budget > prevBudget) applyFlash(budgetEl, 'flash-green');
      else if (G.budget < prevBudget) applyFlash(budgetEl, 'flash-red');
    }

    prevConfidence = G.confidence;
    prevBudget = G.budget;

    // --- Pulse ADVANCE DAY when incoming missions exist ---
    if (advBtn) {
      const hasIncoming = (G.missions || []).some(function (m) {
        return m.status === 'INCOMING';
      });
      if (hasIncoming) {
        advBtn.classList.add('pulse-glow');
      } else {
        advBtn.classList.remove('pulse-glow');
      }
    }
  });

  function applyFlash(el, cls) {
    el.classList.remove('flash-green', 'flash-red');
    // Force reflow so re-adding the same class restarts the animation
    void el.offsetWidth;
    el.classList.add(cls);
    el.addEventListener('animationend', function handler() {
      el.classList.remove(cls);
      el.removeEventListener('animationend', handler);
    });
  }
})();
