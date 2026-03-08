'use strict';
// =============================================================================
// SHADOW DIRECTIVE — Difficulty Escalation System
// Hooks into core game loop to progressively increase challenge over time.
// =============================================================================

// ---- Initialise difficulty state on game start ----
hook('game:start', function () {
  G.difficulty = { level: 1.0, lastEscalation: 0 };
});

// ---- Escalate difficulty every 10 days ----
hook('day:pre', function () {
  if (G.day === 0) return;
  const diff = G.difficulty;
  if (!diff) return;

  // Check if 10 days have elapsed since last escalation
  if (G.day - diff.lastEscalation >= 10) {
    const increment = G.day > 50 ? 0.12 : 0.08;
    diff.level = Math.min(3.0, diff.level + increment);
    diff.lastEscalation = G.day;
  }
});

// ---- Scale spawned mission threat & budget ----
hook('mission:spawned', function (data) {
  const m    = data.mission;
  const diff = G.difficulty;
  if (!diff || diff.level <= 1.0) return;

  // Threat escalation
  m.threat = clamp(
    m.threat + Math.floor((diff.level - 1) * 2),
    1,
    5
  );

  // Budget escalation (single-phase missions have baseBudget)
  if (m.baseBudget) {
    m.baseBudget = Math.ceil(m.baseBudget * (1 + (diff.level - 1) * 0.3));
  }
});

// ---- Extra confidence drain at higher difficulty ----
hook('day:post', function () {
  const diff = G.difficulty;
  if (!diff) return;

  // Only apply on weekly tick days
  if (G.day % 7 !== 0) return;

  if (diff.level >= 2.0) {
    G.confidence = clamp(G.confidence - 2, 0, 100);
    addLog('Heightened geopolitical tensions erode public confidence. (-2)', 'log-warn');
  } else if (diff.level >= 1.5) {
    G.confidence = clamp(G.confidence - 1, 0, 100);
    addLog('Rising threat environment strains confidence. (-1)', 'log-warn');
  }
});

// ---- DEFCON badge rendering ----
hook('render:after', function () {
  const diff = G.difficulty;
  if (!diff) return;

  const lvl = diff.level;
  let label, color;
  if (lvl >= 2.5)      { label = 'DEFCON 1'; color = '#ff2020'; }
  else if (lvl >= 2.0) { label = 'DEFCON 2'; color = '#e04040'; }
  else if (lvl >= 1.6) { label = 'DEFCON 3'; color = '#d4a017'; }
  else if (lvl >= 1.3) { label = 'DEFCON 4'; color = '#2cc4b0'; }
  else                 { label = 'DEFCON 5'; color = '#3cbf3c'; }

  const dateEl = document.getElementById('hdr-date');
  if (!dateEl) return;

  let badge = document.getElementById('defcon-badge');
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

  badge.textContent = label;
  badge.style.background = color;
  badge.style.color = lvl >= 1.6 ? '#000' : '#fff';

  // Pulse animation for DEFCON 1
  if (lvl >= 2.5) {
    badge.style.animation = 'defcon-pulse 0.8s ease-in-out infinite alternate';
    if (!document.getElementById('defcon-pulse-style')) {
      const style = document.createElement('style');
      style.id = 'defcon-pulse-style';
      style.textContent = `@keyframes defcon-pulse {
        from { opacity: 1; box-shadow: 0 0 4px ${color}; }
        to   { opacity: 0.55; box-shadow: 0 0 12px ${color}; }
      }`;
      document.head.appendChild(style);
    }
  } else {
    badge.style.animation = 'none';
  }
});
