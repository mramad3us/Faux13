'use strict';
// =============================================================================
// SHADOW DIRECTIVE — Elite Units System
// Critical successes can produce named elite units that persist in the roster
// and provide bonuses when attached to relevant operations.
// =============================================================================

// =============================================================================
// NAME GENERATION
// =============================================================================

const ELITE_UNIT_NAMES = {
  ANALYSIS:     { prefix: 'Desk',    names: ['ORACLE','CIPHER','PRISM','LENS','MOSAIC','KEYSTONE','QUILL','ATLAS','NEXUS','ARCHIVE'] },
  HUMINT:       { prefix: 'Handler', names: ['PHANTOM','SHEPHERD','BROKER','COURIER','PILGRIM','GARDENER','MIRROR','LANTERN','WHISPER','ENVOY'] },
  SIGINT:       { prefix: 'Station', names: ['ECHO','PULSE','WAVE','INTERCEPT','SPECTRUM','FREQUENCY','SIGNAL','BEACON','RELAY','OVERWATCH'] },
  FIELD_OPS:    { prefix: 'Team',    names: ['IRON WOLF','DARK ARROW','STORM LANCE','BLACK FALCON','RED SABRE','GREY HAMMER','COBALT SPEAR','STEEL VANGUARD','ASHEN TIDE','FROST DAGGER'] },
  SPECIAL_OPS:  { prefix: 'Element', names: ['REAPER','WRAITH','HAVOC','TALON','SCORPION','MAMBA','VIPER','SPECTRE','FANG','RAPTOR'] },
  FOREIGN_OPS:  { prefix: 'Cell',    names: ['NIGHTFALL','MERIDIAN','CROSSROADS','LABYRINTH','COMPASS','SILKROAD','THRESHOLD','CORRIDOR','PASSAGE','BRIDGEHEAD'] },
  COUNTER_INTEL:{ prefix: 'Section', names: ['WATCHDOG','SENTINEL','GATEKEEPER','WARDEN','BULWARK','AEGIS','RAMPART','CITADEL','BASTION','IRONWALL'] },
};

const ELITE_DESCRIPTIONS = {
  ANALYSIS:     'An elite analytical desk renowned for pattern recognition and threat assessment.',
  HUMINT:       'A veteran handler network with deep source access and exceptional tradecraft.',
  SIGINT:       'A specialist signals station with advanced intercept and decryption capability.',
  FIELD_OPS:    'A battle-tested field team known for operational discipline under pressure.',
  SPECIAL_OPS:  'A tier-one direct action element with an exceptional mission record.',
  FOREIGN_OPS:  'An elite clandestine cell with extensive foreign operational experience.',
  COUNTER_INTEL:'A dedicated CI section with a proven record of identifying and neutralizing threats.',
};

const _usedEliteNames = new Set();

function generateEliteName(deptId) {
  var cfg = ELITE_UNIT_NAMES[deptId] || { prefix: 'Unit', names: ['ALPHA','BRAVO','CHARLIE','DELTA','ECHO'] };
  var avail = cfg.names.filter(function (n) { return !_usedEliteNames.has(deptId + ':' + n); });
  var name;
  if (avail.length > 0) {
    name = pick(avail);
  } else {
    name = pick(cfg.names) + '-' + randInt(2, 99);
  }
  _usedEliteNames.add(deptId + ':' + name);
  return { prefix: cfg.prefix, name: name, full: cfg.prefix + ' ' + name };
}

// =============================================================================
// FATE RULES — which units can suffer which fates
// =============================================================================
// KIA/MIA = direct-action types (field teams, strike elements, handlers, cells)
// BURNED  = compromised identity/cover (desks, stations, handlers, sections, cells, teams)

var ELITE_FATE_RULES = {
  ANALYSIS:      { canKIA: false, canBurned: true },
  HUMINT:        { canKIA: true,  canBurned: true },
  SIGINT:        { canKIA: false, canBurned: true },
  FIELD_OPS:     { canKIA: true,  canBurned: true },
  SPECIAL_OPS:   { canKIA: true,  canBurned: false },
  FOREIGN_OPS:   { canKIA: true,  canBurned: true },
  COUNTER_INTEL: { canKIA: false, canBurned: true },
};

function resolveEliteFate(deptId) {
  var rules = ELITE_FATE_RULES[deptId] || { canKIA: true, canBurned: true };
  var options = [];
  if (rules.canKIA)    options.push('KIA', 'MIA');
  if (rules.canBurned) options.push('BURNED');
  if (options.length === 0) options.push('BURNED');
  return pick(options);
}

// =============================================================================
// COOLDOWN — 7 day cooldown between uses
// =============================================================================

var ELITE_COOLDOWN_DAYS = 7;

function isEliteOnCooldown(unit) {
  if (!unit.lastDeployedDay) return false;
  return (G.day - unit.lastDeployedDay) < ELITE_COOLDOWN_DAYS;
}

function eliteCooldownRemaining(unit) {
  if (!unit.lastDeployedDay) return 0;
  return Math.max(0, ELITE_COOLDOWN_DAYS - (G.day - unit.lastDeployedDay));
}

// =============================================================================
// ELITE UNIT CREATION
// =============================================================================

function createEliteUnit(deptId, missionCodename) {
  var id = 'EU' + (++G.eliteIdCounter);
  var naming = generateEliteName(deptId);
  var dcfg = DEPT_CONFIG.find(function (d) { return d.id === deptId; });

  var unit = {
    id: id,
    deptId: deptId,
    deptName: dcfg ? dcfg.name : deptId,
    prefix: naming.prefix,
    name: naming.name,
    fullName: naming.full,
    desc: ELITE_DESCRIPTIONS[deptId] || 'An elite unit with exceptional operational capability.',
    bonusValue: 8,
    missionsCompleted: 1,
    forgedOnMission: missionCodename,
    forgedDay: G.day,
    alive: true,
    fate: null,         // null | 'KIA' | 'MIA' | 'BURNED'
    deathDay: null,
    deathMission: null,
    lastDeployedDay: null,
  };
  G.eliteUnits.push(unit);
  return unit;
}

// =============================================================================
// STATE INIT
// =============================================================================

hook('game:start', function () {
  G.eliteUnits = [];
  G.eliteIdCounter = 0;
  // Migrate legacy operatives/squads
  G.operatives = [];
  G.squads = [];
  G.operativeIdCounter = 0;
  G.squadIdCounter = 0;
});

// Backward compat for old saves
var _eliteMigrated = false;
hook('render:after', function () {
  if (_eliteMigrated) return;
  _eliteMigrated = true;
  if (!G.eliteUnits) { G.eliteUnits = []; G.eliteIdCounter = 0; }
  // Migrate old units: add fate/cooldown fields
  for (var i = 0; i < G.eliteUnits.length; i++) {
    var u = G.eliteUnits[i];
    if (u.fate === undefined) u.fate = u.alive ? null : 'KIA';
    if (u.lastDeployedDay === undefined) u.lastDeployedDay = null;
  }
});

// =============================================================================
// ELITE UNIT GENERATION (on operation critical success — 10% chance)
// =============================================================================

hook('operation:resolved', function (data) {
  var m = data.mission;
  if (!data.success) {
    // Death/compromise chance for attached elite units on failed ops
    handleEliteCasualties(m);
    return;
  }

  // Credit attached elite units with a completed mission
  var attached = m.attachedEliteIds || [];
  for (var a = 0; a < attached.length; a++) {
    for (var b = 0; b < (G.eliteUnits || []).length; b++) {
      if (G.eliteUnits[b].id === attached[a] && G.eliteUnits[b].alive) {
        G.eliteUnits[b].missionsCompleted++;
        break;
      }
    }
  }

  // Only trigger on high-quality successes
  if (Math.random() > 0.10) return;

  // Cap: max 10 alive elite units
  var aliveCount = 0;
  for (var c = 0; c < (G.eliteUnits || []).length; c++) {
    if (G.eliteUnits[c].alive) aliveCount++;
  }
  if (aliveCount >= 6) return;

  // Pick a dept that was used in the op
  var depts = m.assignedExecDepts || [];
  if (depts.length === 0) return;
  var deptId = pick(depts);

  var unit = createEliteUnit(deptId, m.codename || '???');
  var dcfg = DEPT_CONFIG.find(function (d) { return d.id === deptId; });
  var deptName = dcfg ? dcfg.name : deptId;
  var opName = m.codename || '???';
  addLog(
    'ELITE UNIT DISTINGUISHED: ' + unit.fullName + ' (' + deptName +
    ') has proven exceptional during OP ' + opName + '. Added to agency roster.',
    'log-success'
  );

  // Briefing pop-up
  var flavorIntros = [
    'Under fire, under pressure, and against the odds — a unit proved itself beyond all expectation.',
    'When the operation hung by a thread, one team held the line. The kind of performance that doesn\'t get forgotten.',
    'Operational records will show a clean success. What they won\'t capture is the margin — razor-thin, held by skill alone.',
    'There are operations that test equipment and operations that test people. OP ' + opName + ' tested people. One unit passed.',
    'Every agency has its legends. Most of them begin exactly like this — one impossible night, one team that refused to fail.',
    'The after-action report was filed in three sentences. Sometimes brevity says more than detail.',
    'They moved through the operation like professionals — no hesitation, no waste. The kind of precision that earns a name.',
    'Command flagged the performance for special recognition before the dust had settled. That doesn\'t happen often.',
  ];
  var flavorClosers = [
    unit.fullName + ' has been formally designated as an elite asset and added to the agency\'s permanent roster.',
    'Effective immediately, ' + unit.fullName + ' is recognized as an elite unit — cleared for priority operations.',
    unit.fullName + ' has earned its callsign. They are now a named asset available for future mission attachment.',
    'By authority of the Director, ' + unit.fullName + ' is elevated to elite status. They will be remembered.',
    unit.fullName + ' is now on the books. When the next impossible assignment lands — they\'ll be the first call.',
  ];
  queueBriefingPopup({
    title: 'ELITE UNIT DISTINGUISHED',
    category: 'ROSTER UPDATE',
    subtitle: deptName.toUpperCase() + ' — OP ' + opName,
    accent: 'rgba(46, 204, 113, 0.9)',
    body: pick(flavorIntros) + '<br><br>' + pick(flavorClosers) +
      '<div style="margin-top:12px;padding:8px 10px;border:1px solid rgba(46,204,113,0.3);border-left:3px solid rgba(46,204,113,0.6);border-radius:4px;background:rgba(46,204,113,0.05)">' +
        '<div style="font-size:11px;font-weight:700;letter-spacing:0.5px;color:rgba(46,204,113,0.95)">' + unit.fullName + '</div>' +
        '<div style="font-size:9px;color:var(--text-dim);margin-top:2px">' + deptName + ' · +' + unit.bonusValue + '% bonus · Forged in OP ' + opName + '</div>' +
        '<div style="font-size:10px;color:var(--text-hi);margin-top:4px;line-height:1.4">' + unit.desc + '</div>' +
      '</div>',
    buttonLabel: 'ACKNOWLEDGED',
  });
});

// =============================================================================
// CASUALTIES (on failed operations — only attached units at risk)
// =============================================================================

var CASUALTY_POPUP_KIA = [
  'There is no gentle way to deliver this news. {name} was lost during OP {op}. Confirmed killed in action. No survivors recovered from the operational site.',
  'Command received the flash report at 0300. {name} walked into a prepared ambush. The firefight lasted eleven minutes. When the extraction team arrived, there was nothing left to extract.',
  'The satellite feed went dark mid-operation. By the time signals were reacquired, {name} had ceased to exist as a functional unit. Forensic recovery confirmed: total loss.',
  '{name} held their position when the operation collapsed around them. They bought the extraction window with their lives. Every member is confirmed KIA.',
  'The after-action assessment is unambiguous. {name} engaged a superior force during OP {op} and was destroyed. Their final transmission was a calm request for fire support that never arrived.',
  'It was supposed to be routine. It was not. {name} encountered resistance that exceeded every projection. By the time command realized the scale of the trap, it was already over.',
];

var CASUALTY_POPUP_MIA = [
  '{name} went silent during OP {op}. Last known contact was a fragmentary radio burst — coordinates unverifiable. No bodies recovered. No wreckage found.',
  'The extraction window opened and closed. {name} never made it to the pickup point. Search teams have found nothing — no equipment, no remains, no trace.',
  'Forty-eight hours of silence. {name} missed every checkpoint, every dead-drop, every fallback protocol. They have simply vanished.',
  '{name} entered the operational area on schedule and was never heard from again. Overhead imagery shows nothing. SIGINT intercepts: silence. It is as if they were never there.',
  'The last communication from {name} during OP {op} was a truncated burst transmission. Decrypted, it read: "COMPROMISED. GOING DARK." That was three days ago.',
  'No contact. No signal. No bodies. {name} is classified MIA effective immediately. Standing search order issued, but prospects are assessed as grim.',
];

var CASUALTY_POPUP_BURNED = [
  '{name} has been compromised. Their identities, methods, and network of contacts are now in hostile hands. The unit is burned — permanently and irrevocably.',
  'It came from a single intercepted communication. Within hours, every asset, cover identity, and safe house connected to {name} was exposed. The damage is total.',
  'A hostile intelligence service published {name}\'s operational details on an encrypted channel. Covers blown, sources exposed, methods catalogued. They are finished.',
  '{name} was burned during OP {op}. A counterintelligence sweep caught their signature. Every contact they\'ve ever made is now under hostile surveillance.',
  'The compromise was surgical. Someone inside the chain knew exactly where to cut. {name}\'s entire operational infrastructure — covers, communications, safe houses — all of it, gone.',
  'A defector delivered {name}\'s complete operational file to a hostile service. Names, methods, frequencies, dead-drop locations. The unit cannot be salvaged.',
];

function handleEliteCasualties(m) {
  var threat = m.threat || 3;
  var deathChance = threat * 3; // percent per attached elite unit

  for (var j = 0; j < (G.eliteUnits || []).length; j++) {
    var unit = G.eliteUnits[j];
    if (!unit.alive) continue;
    // Only at risk if was attached to this specific op
    if (!m.attachedEliteIds || m.attachedEliteIds.indexOf(unit.id) < 0) continue;
    if (Math.random() * 100 < deathChance) {
      var fate = resolveEliteFate(unit.deptId);
      unit.alive = false;
      unit.fate = fate;
      unit.deathDay = G.day;
      unit.deathMission = m.codename || '???';

      var fateLabel = fate === 'KIA' ? 'KILLED IN ACTION' : fate === 'MIA' ? 'MISSING IN ACTION' : 'COMPROMISED';
      addLog(
        'ELITE UNIT ' + fateLabel + ': ' + unit.fullName + ' — OP ' +
        (m.codename || '???') + '. ' + unit.deptName + ' mourns the loss.',
        'log-fail'
      );

      // Flavor pop-up
      var pool = fate === 'KIA' ? CASUALTY_POPUP_KIA : fate === 'MIA' ? CASUALTY_POPUP_MIA : CASUALTY_POPUP_BURNED;
      var flavorText = pick(pool)
        .replace(/\{name\}/g, unit.fullName)
        .replace(/\{op\}/g, m.codename || '???');

      var accentColor = fate === 'BURNED' ? 'rgba(243, 156, 18, 0.9)' : 'rgba(192, 57, 43, 0.95)';
      var borderAccent = fate === 'BURNED' ? 'rgba(243,156,18,' : 'rgba(192,57,43,';
      var fateTag = '<span style="display:inline-block;padding:1px 5px;border-radius:3px;font-size:9px;font-weight:700;letter-spacing:1px;' +
        (fate === 'BURNED'
          ? 'background:rgba(243,156,18,0.15);color:rgba(243,156,18,0.95);border:1px solid rgba(243,156,18,0.3)'
          : 'background:rgba(192,57,43,0.15);color:rgba(192,57,43,0.95);border:1px solid rgba(192,57,43,0.3)') +
        '">' + fate + '</span>';

      queueBriefingPopup({
        title: fateLabel,
        category: 'CASUALTY REPORT',
        subtitle: unit.fullName + ' — ' + unit.deptName,
        accent: accentColor,
        body: flavorText +
          '<div style="margin-top:12px;padding:8px 10px;border:1px solid ' + borderAccent + '0.3);border-left:3px solid ' + borderAccent + '0.6);border-radius:4px;background:' + borderAccent + '0.05)">' +
            '<div style="display:flex;align-items:center;gap:6px">' +
              '<span style="font-size:11px;font-weight:700;letter-spacing:0.5px;color:' + borderAccent + '0.95)">' + unit.fullName + '</span>' +
              fateTag +
            '</div>' +
            '<div style="font-size:9px;color:var(--text-dim);margin-top:2px">' + unit.deptName + ' · ' + unit.missionsCompleted + ' ops completed · Forged Day ' + unit.forgedDay + '</div>' +
            '<div style="font-size:9px;color:' + borderAccent + '0.8);margin-top:3px">Lost during OP ' + (m.codename || '???') + ' — Day ' + G.day + '</div>' +
          '</div>',
        buttonLabel: 'UNDERSTOOD',
      });
    }
  }
}

// =============================================================================
// PROBABILITY BONUS (via calcProb:modify)
// =============================================================================

hook('calcProb:modify', function (data) {
  var m = data.mission;
  var depts = data.depts;
  var deptsUsed = {};
  for (var i = 0; i < depts.length; i++) deptsUsed[depts[i]] = true;

  // Check attached elite units
  var attached = (m.attachedEliteIds || []);
  var bonus = 0;
  for (var j = 0; j < attached.length; j++) {
    var unit = null;
    for (var k = 0; k < (G.eliteUnits || []).length; k++) {
      if (G.eliteUnits[k].id === attached[j]) { unit = G.eliteUnits[k]; break; }
    }
    if (!unit || !unit.alive) continue;
    if (deptsUsed[unit.deptId]) {
      bonus += unit.bonusValue;
    }
  }
  return data.prob + bonus;
});

// =============================================================================
// CONFIGURE MODAL INTEGRATION — render elite units section
// =============================================================================

// Called from game.js openOperationModal to build elite units HTML
window.buildEliteUnitsHtml = function (missionId, execDepts) {
  if (!G.eliteUnits || G.eliteUnits.length === 0) return '';

  var aliveUnits = [];
  for (var i = 0; i < G.eliteUnits.length; i++) {
    if (G.eliteUnits[i].alive) aliveUnits.push(G.eliteUnits[i]);
  }
  if (aliveUnits.length === 0) return '';

  var rows = '';
  for (var k = 0; k < aliveUnits.length; k++) {
    var u = aliveUnits[k];
    var onCooldown = isEliteOnCooldown(u);
    var cdRemaining = eliteCooldownRemaining(u);
    var cdNote = onCooldown ? ' [COOLDOWN ' + cdRemaining + 'd]' : '';
    var cdTip = onCooldown ? '&#10;&#10;On cooldown — available in ' + cdRemaining + ' day(s).' : '';
    rows += '<div class="elite-unit-check' + (onCooldown ? ' on-cooldown' : '') + '"' +
      ' data-elite="' + u.id + '" data-dept="' + u.deptId + '"' +
      ' onclick="toggleEliteUnit(\'' + u.id + '\',\'' + missionId + '\')"' +
      ' data-tip="' + u.desc + cdTip + '">' +
      '<span class="elite-dept-tag">' + u.deptName + '</span>' +
      '<span class="elite-unit-label">' + u.fullName + cdNote + '</span>' +
      '<span class="elite-bonus-badge">+' + u.bonusValue + '%</span>' +
      '<span class="elite-missions-badge">' + u.missionsCompleted + ' ops</span>' +
      '</div>';
  }

  return '<div class="modal-section">' +
    '<div class="modal-section-title">ELITE UNITS <span style="font-size:9px;color:var(--text-dim)">(' + aliveUnits.length + ' available — select to attach, bonus applies when matching dept is selected)</span></div>' +
    '<div class="modal-dept-grid">' + rows + '</div>' +
    '</div>';
};

// Refresh elite unit visual relevance based on currently selected depts
window.refreshEliteRelevance = function () {
  var selectedDepts = window._currentOpSelectedDepts || [];
  var deptSet = {};
  for (var i = 0; i < selectedDepts.length; i++) deptSet[selectedDepts[i]] = true;
  var els = document.querySelectorAll('.elite-unit-check');
  for (var j = 0; j < els.length; j++) {
    var dept = els[j].dataset.dept;
    if (dept && !deptSet[dept]) {
      els[j].classList.add('dimmed');
    } else {
      els[j].classList.remove('dimmed');
    }
  }
};

// Toggle elite unit selection
window._currentOpSelectedElites = [];

window.toggleEliteUnit = function (eliteId, missionId) {
  var unit = null;
  for (var i = 0; i < (G.eliteUnits || []).length; i++) {
    if (G.eliteUnits[i].id === eliteId) { unit = G.eliteUnits[i]; break; }
  }
  if (!unit || !unit.alive) return;
  if (isEliteOnCooldown(unit)) return; // can't select during cooldown

  var arr = window._currentOpSelectedElites;
  var idx = arr.indexOf(eliteId);
  if (idx >= 0) {
    arr.splice(idx, 1);
  } else {
    arr.push(eliteId);
  }
  var selected = idx < 0;
  var els = document.querySelectorAll('.elite-unit-check');
  for (var j = 0; j < els.length; j++) {
    if (els[j].dataset.elite === eliteId) {
      if (selected) els[j].classList.add('selected');
      else els[j].classList.remove('selected');
    }
  }
  window.updateModalProb(missionId);
};

// =============================================================================
// RETIRE ELITE UNIT
// =============================================================================

window.retireEliteUnit = function (eliteId) {
  var unit = null;
  for (var i = 0; i < (G.eliteUnits || []).length; i++) {
    if (G.eliteUnits[i].id === eliteId) { unit = G.eliteUnits[i]; break; }
  }
  if (!unit || !unit.alive) return;

  // Check if currently deployed
  var deployed = false;
  for (var j = 0; j < (G.missions || []).length; j++) {
    var m = G.missions[j];
    if (m.status === 'EXECUTING' && (m.attachedEliteIds || []).indexOf(eliteId) >= 0) {
      deployed = true;
      break;
    }
  }
  if (deployed) {
    addLog('Cannot retire ' + unit.fullName + ' — currently deployed on active operation.', 'log-warn');
    return;
  }

  unit.alive = false;
  unit.fate = 'RETIRED';
  unit.deathDay = G.day;
  unit.deathMission = null;
  addLog(unit.fullName + ' (' + unit.deptName + ') honorably retired from active duty.', 'log-info');
  renderRoster();
};

// =============================================================================
// CSS INJECTION
// =============================================================================

var _eliteCssInjected = false;
function injectEliteCSS() {
  if (_eliteCssInjected) return;
  _eliteCssInjected = true;
  var style = document.createElement('style');
  style.textContent = [
    // Roster panel cards
    '.roster-card { border-radius: var(--radius, 4px); padding: 10px 12px; margin-bottom: 6px; font-size: 11px; font-family: var(--font-mono, monospace); }',
    '.roster-elite { background: rgba(46, 204, 113, 0.05); border: 1px solid rgba(46, 204, 113, 0.2); border-left: 3px solid rgba(46, 204, 113, 0.6); }',
    '.roster-dead { background: rgba(231, 76, 60, 0.05); border: 1px solid rgba(231, 76, 60, 0.15); border-left: 3px solid rgba(231, 76, 60, 0.3); opacity: 0.55; }',
    '.roster-burned { background: rgba(243, 156, 18, 0.05); border: 1px solid rgba(243, 156, 18, 0.15); border-left: 3px solid rgba(243, 156, 18, 0.3); opacity: 0.55; }',
    '.roster-dead .roster-name, .roster-burned .roster-name { text-decoration: line-through; }',
    '.roster-dead .roster-name { color: rgba(231, 76, 60, 0.7); }',
    '.roster-burned .roster-name { color: rgba(243, 156, 18, 0.7); }',
    '.roster-hdr { display: flex; align-items: center; gap: 6px; margin-bottom: 4px; }',
    '.roster-name { font-weight: 600; color: var(--text-hi, #e0e0e0); letter-spacing: 0.5px; flex: 1; }',
    '.roster-type-badge { font-size: 9px; letter-spacing: 1px; padding: 2px 5px; border-radius: var(--radius, 4px); background: rgba(46, 204, 113, 0.12); color: rgba(46, 204, 113, 0.9); border: 1px solid rgba(46, 204, 113, 0.25); }',
    '.roster-fate-badge { font-size: 8px; letter-spacing: 1px; padding: 2px 5px; border-radius: 3px; font-weight: 700; }',
    '.roster-fate-kia, .roster-fate-mia { background: rgba(192, 57, 43, 0.15); color: rgba(192, 57, 43, 0.95); border: 1px solid rgba(192, 57, 43, 0.3); }',
    '.roster-fate-burned { background: rgba(243, 156, 18, 0.15); color: rgba(243, 156, 18, 0.95); border: 1px solid rgba(243, 156, 18, 0.3); }',
    '.roster-fate-retired { background: rgba(100, 149, 237, 0.15); color: rgba(100, 149, 237, 0.95); border: 1px solid rgba(100, 149, 237, 0.3); }',
    '.roster-retired { background: rgba(100, 149, 237, 0.05); border: 1px solid rgba(100, 149, 237, 0.15); border-left: 3px solid rgba(100, 149, 237, 0.3); opacity: 0.55; }',
    '.roster-retired .roster-name { text-decoration: line-through; color: rgba(100, 149, 237, 0.7); }',
    '.btn-retire { font-family: var(--font-mono, monospace); font-size: 9px; letter-spacing: 1px; padding: 3px 8px; border: 1px solid rgba(100, 149, 237, 0.3); background: rgba(100, 149, 237, 0.08); color: rgba(100, 149, 237, 0.8); border-radius: 3px; cursor: pointer; transition: background 0.15s, color 0.15s; }',
    '.btn-retire:hover { background: rgba(100, 149, 237, 0.2); color: rgba(100, 149, 237, 1); }',
    '.roster-dept { font-size: 9px; color: var(--text-dim, #888); letter-spacing: 0.8px; }',
    '.roster-stats { display: flex; gap: 8px; margin-top: 4px; flex-wrap: wrap; }',
    '.roster-stat { font-size: 9px; padding: 1px 5px; border-radius: 3px; background: var(--bg3, rgba(255,255,255,0.04)); color: var(--text-dim, #888); letter-spacing: 0.5px; }',
    '.roster-section-hdr { font-size: 10px; letter-spacing: 1.5px; color: var(--text-dim, #888); margin: 10px 0 4px; padding-bottom: 3px; border-bottom: 1px solid var(--border, rgba(255,255,255,0.08)); }',
    '#roster-panel { padding: 8px; }',
    // Configure modal elite unit checks
    '.elite-unit-check { display: flex; align-items: center; gap: 6px; padding: 6px 8px; border: 1px solid var(--border2); border-radius: var(--radius); cursor: pointer; transition: border-color 0.15s, background 0.15s; font-family: var(--font-mono); font-size: 10px; }',
    '.elite-unit-check:hover { border-color: var(--green); background: rgba(46, 204, 113, 0.05); }',
    '.elite-unit-check.selected { border-color: var(--green); background: rgba(46, 204, 113, 0.1); }',
    '.elite-unit-check.dimmed { opacity: 0.4; }',
    '.elite-unit-check.dimmed .elite-bonus-badge::after { content: " (no matching dept)"; font-weight: 400; color: var(--text-dim); font-size: 8px; }',
    '.elite-unit-check.on-cooldown { opacity: 0.35; cursor: not-allowed; border-style: dashed; }',
    '.elite-unit-check.on-cooldown:hover { border-color: var(--border2); background: transparent; }',
    '.elite-dept-tag { font-size: 8px; letter-spacing: 0.8px; padding: 1px 4px; border-radius: 2px; background: rgba(46, 204, 113, 0.12); color: rgba(46, 204, 113, 0.9); border: 1px solid rgba(46, 204, 113, 0.2); white-space: nowrap; }',
    '.elite-unit-label { flex: 1; color: var(--text-hi); letter-spacing: 0.3px; }',
    '.elite-bonus-badge { font-size: 9px; color: var(--green); font-weight: 700; white-space: nowrap; }',
    '.elite-missions-badge { font-size: 8px; color: var(--text-dim); white-space: nowrap; }',
    '.roster-cooldown { font-size: 8px; color: var(--accent); letter-spacing: 0.5px; }',
  ].join('\n');
  document.head.appendChild(style);
}

// =============================================================================
// ROSTER TAB RENDERING
// =============================================================================

var _rosterTabInjected = false;

hook('render:after', function () {
  injectEliteCSS();

  if (!_rosterTabInjected && !document.getElementById('tab-roster')) {
    var tabBar = document.querySelector('.panel-right .panel-hdr-tabs');
    if (!tabBar) return;
    var btn = document.createElement('button');
    btn.className = 'panel-tab';
    btn.id = 'tab-roster';
    btn.setAttribute('onclick', "switchRightTab('roster')");
    btn.innerHTML = 'ROSTER <span class="panel-badge" id="roster-count">0</span>';
    tabBar.appendChild(btn);

    var pane = document.createElement('div');
    pane.id = 'right-tab-roster';
    pane.className = 'right-tab-pane';
    pane.innerHTML = '<div id="roster-panel"></div>';
    var panelRight = document.querySelector('.panel-right');
    if (panelRight) panelRight.appendChild(pane);
    _rosterTabInjected = true;
  }

  renderRoster();
});

function renderRoster() {
  var el = document.getElementById('roster-panel');
  if (!el) return;

  var units = G.eliteUnits || [];
  var alive = units.filter(function (u) { return u.alive; });
  var fallen = units.filter(function (u) { return !u.alive; });

  var badge = document.getElementById('roster-count');
  if (badge) badge.textContent = String(alive.length);

  var html = '';

  if (alive.length > 0) {
    html += '<div class="roster-section-hdr">ACTIVE ELITE UNITS (' + alive.length + '/6)</div>';
    for (var i = 0; i < alive.length; i++) html += renderEliteCard(alive[i]);
  }

  if (fallen.length > 0) {
    html += '<div class="roster-section-hdr">HALL OF FAME</div>';
    for (var j = 0; j < fallen.length; j++) html += renderEliteCard(fallen[j]);
  }

  if (!html) {
    html = '<div style="color:var(--text-dim,#888);font-size:11px;padding:12px;text-align:center;letter-spacing:0.5px;">NO ELITE UNITS<br><span style="font-size:9px;margin-top:4px;display:block">Critical successes have a 10% chance to produce an elite unit.</span></div>';
  }

  el.innerHTML = html;
}

function renderEliteCard(u) {
  var isFallen = !u.alive;
  var fate = u.fate || 'KIA';
  var isBurned = fate === 'BURNED';
  var isRetired = fate === 'RETIRED';
  var cardClass = isFallen ? (isRetired ? 'roster-retired' : (isBurned ? 'roster-burned' : 'roster-dead')) : 'roster-elite';

  var fateBadge = '';
  if (isFallen) {
    var fateClass = isRetired ? 'roster-fate-retired' : (fate === 'BURNED' ? 'roster-fate-burned' : 'roster-fate-kia');
    fateBadge = '<span class="roster-fate-badge ' + fateClass + '">' + fate + '</span>';
  }

  var cooldownNote = '';
  if (!isFallen && isEliteOnCooldown(u)) {
    cooldownNote = '<span class="roster-cooldown">COOLDOWN ' + eliteCooldownRemaining(u) + 'd</span>';
  }

  return '<div class="roster-card ' + cardClass + '">' +
    '<div class="roster-hdr">' +
      '<span class="roster-type-badge">' + u.prefix.toUpperCase() + '</span>' +
      '<span class="roster-name">' + u.fullName + '</span>' +
      fateBadge +
    '</div>' +
    '<div class="roster-dept">' + u.deptName + (cooldownNote ? ' · ' + cooldownNote : '') + '</div>' +
    '<div class="roster-stats">' +
      '<span class="roster-stat">+' + u.bonusValue + '% BONUS</span>' +
      '<span class="roster-stat">OPS: ' + u.missionsCompleted + '</span>' +
      '<span class="roster-stat">FORGED DAY ' + u.forgedDay + ' \u2014 OP ' + u.forgedOnMission + '</span>' +
      (isFallen ? '<span class="roster-stat" style="color:' + (isBurned ? 'rgba(243,156,18,0.9)' : 'rgba(231,76,60,0.9)') + '">' + fate + ' DAY ' + u.deathDay + (u.deathMission ? ' \u2014 OP ' + u.deathMission : '') + '</span>' : '') +
    '</div>' +
    (!isFallen ? '<div style="margin-top:6px;text-align:right"><button class="btn-retire" onclick="retireEliteUnit(\'' + u.id + '\')" data-tip="Honorably discharge this unit from active duty.">RETIRE</button></div>' : '') +
  '</div>';
}
