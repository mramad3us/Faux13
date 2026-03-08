'use strict';
// =============================================================================
// SHADOW DIRECTIVE — Cascading Consequences System
// Failed operations can spawn retaliatory / follow-up threats, creating
// emergent pressure that compounds over time.
// =============================================================================

const CONSEQUENCE_MAP = {
  'COUNTER-TERRORISM': {
    chance: 0.35,
    types: ['DOMESTIC_TERROR'],
    label: 'RETALIATORY THREAT',
    logMsg: 'Intelligence suggests the failed operation has emboldened hostile actors.',
  },
  'FOREIGN OPERATIONS': {
    chance: 0.30,
    types: ['FOREIGN_HVT', 'ASSET_RESCUE'],
    label: 'BLOWBACK',
    logMsg: 'Foreign networks are capitalizing on the intelligence failure.',
  },
  'COUNTER-INTELLIGENCE': {
    chance: 0.25,
    types: ['COUNTER_INTEL', 'MOLE_HUNT'],
    label: 'INTERNAL COMPROMISE',
    logMsg: 'The failed operation may have exposed internal vulnerabilities.',
  },
  'HVT OPERATIONS': {
    chance: 0.30,
    types: ['FOREIGN_HVT', 'DOMESTIC_HVT'],
    label: 'TARGET ESCALATION',
    logMsg: 'The target has strengthened their security posture following our failure.',
  },
};

const CONSEQUENCE_DEFAULT = {
  chance: 0.20,
  types: ['DOMESTIC_TERROR', 'COUNTER_INTEL'],
  label: 'UNFORESEEN FALLOUT',
  logMsg: 'The failure has triggered unexpected consequences across the intelligence landscape.',
};

// ---- On operation failure, roll for cascading consequence ----
hook('operation:resolved', function (data) {
  if (data.success) return;

  const failed   = data.mission;
  const entry    = CONSEQUENCE_MAP[failed.category] || CONSEQUENCE_DEFAULT;
  const diffMult = G.difficulty?.level || 1;
  const chance   = Math.min(entry.chance * diffMult, 0.70);

  if (Math.random() > chance) return;

  // Pick a consequence mission type that actually exists in MISSION_TYPES
  const validTypes = entry.types.filter(function (t) { return MISSION_TYPES[t]; });
  if (validTypes.length === 0) return;

  const typeId = pick(validTypes);

  // Spawn the retaliatory mission
  spawnMission(typeId);

  // The newly spawned mission is at index 0 (unshift in spawnMission)
  const spawned = G.missions[0];
  if (!spawned) return;

  // Tag it as a consequence
  spawned.isConsequence  = true;
  spawned.consequenceOf  = failed.codename;

  addLog(
    'CASCADING THREAT: ' + entry.label + ' \u2014 ' + entry.logMsg +
    ' New mission: OP ' + spawned.codename + '.',
    'log-fail'
  );
});

// ---- Reduce urgency on consequence missions (more pressure) ----
hook('mission:spawned', function (data) {
  const m = data.mission;
  if (!m.isConsequence) return;

  const reduction = randInt(2, 3);
  m.urgency      = Math.max(3, m.urgency - reduction);
  m.urgencyLeft  = Math.max(3, m.urgencyLeft - reduction);
});

// ---- Render "RETALIATION" chip on consequence mission cards ----
hook('render:after', function () {
  // Build a quick lookup of consequence mission ids
  const consequenceIds = {};
  for (var i = 0; i < G.missions.length; i++) {
    var m = G.missions[i];
    if (m.isConsequence) consequenceIds[m.id] = m;
  }

  // Badge inbox cards
  var cards = document.querySelectorAll('.mission-card');
  for (var c = 0; c < cards.length; c++) {
    var card = cards[c];
    // Extract mission id from the onclick attribute
    var onclick = card.getAttribute('onclick') || '';
    var match   = onclick.match(/selectMission\(['"]([^'"]+)['"]\)/);
    if (!match) continue;

    var mid = match[1];
    if (!consequenceIds[mid]) continue;

    // Only inject once
    if (card.querySelector('.cascade-chip')) continue;

    var chip       = document.createElement('span');
    chip.className = 'cascade-chip';
    chip.textContent = 'RETALIATION';
    chip.style.cssText = [
      'display:inline-block',
      'background:#b22222',
      'color:#fff',
      'font-size:0.65em',
      'font-weight:700',
      'letter-spacing:0.08em',
      'padding:1px 6px',
      'border-radius:2px',
      'margin-left:6px',
      'vertical-align:middle',
    ].join(';');

    // Append into the meta row
    var meta = card.querySelector('.mc-meta');
    if (meta) {
      meta.appendChild(chip);
    } else {
      card.appendChild(chip);
    }
  }

  // Detail-view banner for selected consequence mission
  if (!G.selected) return;

  var sel = null;
  for (var j = 0; j < G.missions.length; j++) {
    if (G.missions[j].id === G.selected) { sel = G.missions[j]; break; }
  }
  if (!sel || !sel.isConsequence) return;

  var detailEl = document.getElementById('mission-detail');
  if (!detailEl) return;

  // Only inject once per render
  if (detailEl.querySelector('.cascade-banner')) return;

  var banner       = document.createElement('div');
  banner.className = 'cascade-banner';
  banner.style.cssText = [
    'background:#3a1010',
    'border:1px solid #b22222',
    'color:#ff9090',
    'padding:6px 12px',
    'margin-bottom:10px',
    'font-size:0.85em',
    'font-weight:600',
    'letter-spacing:0.04em',
    'border-radius:3px',
  ].join(';');
  banner.textContent = 'This mission is a consequence of the failed OP ' +
    sel.consequenceOf + '.';

  detailEl.insertBefore(banner, detailEl.firstChild);
});
