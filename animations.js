// animations.js — reactive UI animations via hook system
// v4.0.0: resource flashes, bar ripples, staggered cards, status transitions

(function () {
  let prevConfidence = null;
  let prevBudget = null;
  let prevStatuses = {};

  hook('render:after', function (G) {
    const confEl   = document.getElementById('res-conf');
    const budgetEl = document.getElementById('res-budget');
    const confBar  = document.getElementById('conf-bar');
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

    // --- Bar ripple on change ---
    if (confBar && prevConfidence !== null && G.confidence !== prevConfidence) {
      applyBarRipple(confBar);
    }

    prevConfidence = G.confidence;
    prevBudget = G.budget;

    // --- Pulse ADVANCE DAY when incoming missions exist ---
    if (advBtn) {
      var hasIncoming = (G.missions || []).some(function (m) {
        return m.status === 'INCOMING';
      });
      if (hasIncoming) {
        advBtn.classList.add('pulse-glow');
      } else {
        advBtn.classList.remove('pulse-glow');
      }
    }

    // --- Mission status change animations ---
    var currentStatuses = {};
    for (var i = 0; i < (G.missions || []).length; i++) {
      var m = G.missions[i];
      currentStatuses[m.id] = m.status;
      if (prevStatuses[m.id] && prevStatuses[m.id] !== m.status) {
        var row = document.querySelector('.msg-row[data-id="' + m.id + '"]');
        if (row) {
          if (m.status === 'SUCCESS') applyAnimClass(row, 'msg-row-success');
          else if (m.status === 'FAILURE') applyAnimClass(row, 'msg-row-shake');
        }
      }
    }
    prevStatuses = currentStatuses;

    // --- Stagger threat/dept/geo cards ---
    applyCardStagger('.threat-card');
    applyCardStagger('.dept-card');
    applyCardStagger('.geo-theater-card');
    applyCardStagger('.elite-unit-card');
  });

  function applyFlash(el, cls) {
    el.classList.remove('flash-green', 'flash-red');
    void el.offsetWidth;
    el.classList.add(cls);
    el.addEventListener('animationend', function handler() {
      el.classList.remove(cls);
      el.removeEventListener('animationend', handler);
    });
  }

  function applyBarRipple(el) {
    el.classList.remove('bar-changing');
    void el.offsetWidth;
    el.classList.add('bar-changing');
    el.addEventListener('animationend', function handler() {
      el.classList.remove('bar-changing');
      el.removeEventListener('animationend', handler);
    });
  }

  function applyAnimClass(el, cls) {
    el.classList.remove(cls);
    void el.offsetWidth;
    el.classList.add(cls);
    el.addEventListener('animationend', function handler() {
      el.classList.remove(cls);
      el.removeEventListener('animationend', handler);
    });
  }

  // Apply staggered slide-in to freshly rendered card lists
  var _staggeredSets = {};
  function applyCardStagger(selector) {
    var cards = document.querySelectorAll(selector);
    if (!cards.length) return;
    // Build a fingerprint of the current set to avoid re-animating
    var fp = '';
    for (var i = 0; i < cards.length; i++) fp += (cards[i].dataset.id || i) + ',';
    if (_staggeredSets[selector] === fp) return;
    _staggeredSets[selector] = fp;
    for (var j = 0; j < cards.length; j++) {
      cards[j].classList.remove('card-stagger');
      void cards[j].offsetWidth;
      cards[j].style.animationDelay = (j * 40) + 'ms';
      cards[j].classList.add('card-stagger');
    }
  }
})();
