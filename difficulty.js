'use strict';
// =============================================================================
// SHADOW DIRECTIVE — DEFCON System
// Reactive threat level based on resource pressure (dept workload + inbox).
// DEFCON 5 = relaxed (lots of spare capacity), DEFCON 1 = critical (overwhelmed).
// =============================================================================

// ---- Initialise state on game start ----
hook('game:start', function () {
  G.defcon = 5;
});

// ---- Backward compat for old saves ----
var _defconMigrated = false;
hook('render:after', function () {
  if (_defconMigrated) return;
  _defconMigrated = true;
  if (G.defcon === undefined) G.defcon = 5;
  // Remove legacy difficulty object from old saves
  delete G.difficulty;
});

// =============================================================================
// DEFCON CALCULATION — runs every render
// =============================================================================

function calcDefcon() {
  // 1) Department utilization: ratio of allocated / total capacity across all depts
  var totalCap = 0;
  var totalAlloc = 0;
  for (var i = 0; i < DEPT_CONFIG.length; i++) {
    var d = G.depts[DEPT_CONFIG[i].id];
    if (!d) continue;
    totalCap += d.capacity;
    totalAlloc += deptAllocated(DEPT_CONFIG[i].id);
  }
  var deptUtil = totalCap > 0 ? totalAlloc / totalCap : 0; // 0 = idle, 1 = maxed

  // 2) Inbox pressure: pending missions (INCOMING or BRIEF_READY) vs manageable threshold
  var pending = 0;
  for (var j = 0; j < G.missions.length; j++) {
    var st = G.missions[j].status;
    if (st === 'INCOMING' || st === 'BRIEF_READY') pending++;
  }
  var inboxPressure = Math.min(1, pending / 6); // 6+ unhandled = max pressure

  // 3) Combine: dept utilization is primary (70%), inbox pressure is secondary (30%)
  var pressure = deptUtil * 0.7 + inboxPressure * 0.3;

  // Map pressure [0..1] to DEFCON [5..1]
  if (pressure >= 0.85) return 1;
  if (pressure >= 0.65) return 2;
  if (pressure >= 0.45) return 3;
  if (pressure >= 0.25) return 4;
  return 5;
}

// =============================================================================
// DEFCON BADGE RENDERING
// =============================================================================

var DEFCON_LABELS = {
  5: { label: 'DEFCON 5', color: '#3cbf3c', textColor: '#fff' },
  4: { label: 'DEFCON 4', color: '#2cc4b0', textColor: '#fff' },
  3: { label: 'DEFCON 3', color: '#d4a017', textColor: '#000' },
  2: { label: 'DEFCON 2', color: '#e04040', textColor: '#000' },
  1: { label: 'DEFCON 1', color: '#ff2020', textColor: '#000' },
};

hook('render:after', function () {
  var defcon = calcDefcon();
  G.defcon = defcon;

  var info = DEFCON_LABELS[defcon] || DEFCON_LABELS[5];

  var dateEl = document.getElementById('hdr-date');
  if (!dateEl) return;

  var badge = document.getElementById('defcon-badge');
  if (!badge) {
    badge = document.createElement('span');
    badge.id = 'defcon-badge';
    badge.style.cssText = [
      'display:inline-block',
      'margin-left:8px',
      'padding:1px 7px',
      'font-size:0.72em',
      'font-weight:700',
      'letter-spacing:0.08em',
      'border-radius:3px',
      'vertical-align:middle',
      'font-family:inherit',
    ].join(';');
    dateEl.appendChild(badge);
  }

  badge.textContent = info.label;
  badge.style.background = info.color;
  badge.style.color = info.textColor;

  // Pulse animation for DEFCON 1
  if (defcon === 1) {
    badge.style.animation = 'defcon-pulse 0.8s ease-in-out infinite alternate';
    if (!document.getElementById('defcon-pulse-style')) {
      var style = document.createElement('style');
      style.id = 'defcon-pulse-style';
      style.textContent = '@keyframes defcon-pulse { ' +
        'from { opacity: 1; box-shadow: 0 0 4px ' + info.color + '; } ' +
        'to   { opacity: 0.55; box-shadow: 0 0 12px ' + info.color + '; } }';
      document.head.appendChild(style);
    }
  } else {
    badge.style.animation = 'none';
  }
});
