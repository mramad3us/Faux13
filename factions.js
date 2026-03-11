'use strict';
// =============================================================================
// SHADOWNET v3.0.0 — Intelligence Factions & Network System
// Requires: game.js (G, hook, fire, clamp, pick, randInt, addLog, queueBriefingPopup)
// Requires: geopolitics.js (THEATERS, THEATER_IDS, getTheaterForCountry)
// =============================================================================

// =============================================================================
// FACTION DEFINITIONS
// =============================================================================

var FACTIONS = {
  FIVE_EYES_CORE:      { name: 'Five Eyes Command',            shortName: 'FVEY',    homeTheater: 'NORTH_AMERICA',  color: '#1abc9c', icon: '\u2605', agencies: 'NSA \u00b7 CIA \u00b7 CSE \u00b7 CSIS' },
  EUROPEAN_ACCORD:     { name: 'European Intelligence Accord', shortName: 'EUR.ACC', homeTheater: 'WESTERN_EUROPE', color: '#2980b9', icon: '\u2295', agencies: 'BND \u00b7 DGSE \u00b7 MI6 \u00b7 AIVD' },
  EASTERN_DIRECTORATE: { name: 'Eastern Directorate',          shortName: 'E.DIR',   homeTheater: 'EASTERN_EUROPE', color: '#3498db', icon: '\u2694', agencies: 'SVR \u00b7 GRU \u00b7 BIS' },
  CRESCENT_CIRCLE:     { name: 'Crescent Circle',              shortName: 'CRSCNT',  homeTheater: 'MIDDLE_EAST',    color: '#e67e22', icon: '\u262a', agencies: 'GIP \u00b7 Mossad \u00b7 VAJA' },
  SILK_ROAD_BUREAU:    { name: 'Silk Road Bureau',              shortName: 'SILK',    homeTheater: 'CENTRAL_ASIA',   color: '#9b59b6', icon: '\u26f0', agencies: 'ISI \u00b7 NDS \u00b7 KNB' },
  PACIFIC_RING:        { name: 'Pacific Ring Consortium',       shortName: 'PAC.R',   homeTheater: 'EAST_ASIA',      color: '#e74c3c', icon: '\ud83d\udc09', agencies: 'MSS \u00b7 RGB \u00b7 NICA' },
  SAHEL_COMPACT:       { name: 'Sahel Security Compact',        shortName: 'SAHEL',   homeTheater: 'AFRICA',         color: '#27ae60', icon: '\u25c6', agencies: 'NIA \u00b7 NISS \u00b7 GIS' },
  SOUTHERN_CROSS:      { name: 'Southern Cross Network',        shortName: 'S.CRSS',  homeTheater: 'LATIN_AMERICA',  color: '#f39c12', icon: '\u26a1', agencies: 'SEBIN \u00b7 DI \u00b7 ABIN' },
};

// Expose globally
window.FACTIONS = FACTIONS;

// =============================================================================
// HELPERS
// =============================================================================

function getTheaterIdForCountry(countryName) {
  var t = getTheaterForCountry(countryName);
  if (!t) return null;
  for (var i = 0; i < THEATER_IDS.length; i++) {
    if (THEATERS[THEATER_IDS[i]] === t) return THEATER_IDS[i];
  }
  return null;
}

function getMissionTheaterId(m) {
  if (m.location === 'DOMESTIC') return G.homeTheaterId;
  return getTheaterIdForCountry(m.country) || null;
}

function getFactionForTheater(theaterId) {
  for (var fid in FACTIONS) {
    if (FACTIONS[fid].homeTheater === theaterId) return fid;
  }
  return null;
}

// Network health bonus/malus for a given theater
function getNetworkModifier(theaterId) {
  if (!G.networks || !G.networks[theaterId]) return 0;
  var health = G.networks[theaterId].health;
  var isHome = (theaterId === G.homeTheaterId);

  if (isHome) {
    if (health > 65) return 10;
    if (health >= 30) return 0;
    if (health >= 10) return -10;
    return -20;
  } else {
    if (health > 50) return 20;
    if (health > 15) return 10;
    if (health >= 5) return 0;
    return -10;
  }
}

window.getNetworkModifier = getNetworkModifier;
window.getMissionTheaterId = getMissionTheaterId;
window.getFactionForTheater = getFactionForTheater;

// =============================================================================
// ZERO-SUM NETWORK SYSTEM — all faction shares per theater sum to 100%
// Internal values stored as 5-decimal floats for balanced redistribution.
// =============================================================================

function round5(v) { return Math.round(v * 100000) / 100000; }

// Create initial shares for a theater (all factions including player)
function initTheaterShares(tid) {
  var shares = {};
  // Home faction gets ~35%, rest split ~9.3% each
  for (var fid in FACTIONS) {
    var isHome = (FACTIONS[fid].homeTheater === tid);
    shares[fid] = isHome ? 35 : (100 - 35) / 7;
  }
  // Add slight noise for variety
  for (var fid in shares) {
    shares[fid] += (Math.random() - 0.5) * 3;
    if (shares[fid] < 0.5) shares[fid] = 0.5;
  }
  // Normalize to exactly 100
  var sum = 0;
  for (var fid in shares) sum += shares[fid];
  for (var fid in shares) shares[fid] = round5(shares[fid] * 100 / sum);
  return shares;
}

// Normalize shares to sum exactly to 100%, enforcing player floor
function normalizeShares(tid) {
  var net = G.networks[tid];
  if (!net || !net.factions) return;
  var pfid = G.playerFactionId;

  // Clamp negatives
  for (var fid in net.factions) {
    if (net.factions[fid] < 0) net.factions[fid] = 0;
  }

  // Enforce player floor
  var floorActive = net.floor > 0 && (net.factions[pfid] || 0) < net.floor;
  if (floorActive) {
    net.factions[pfid] = net.floor;
  }

  if (floorActive) {
    // Lock player, scale others to fill remainder
    var playerVal = net.factions[pfid];
    var othersSum = 0;
    for (var fid in net.factions) {
      if (fid !== pfid) othersSum += net.factions[fid];
    }
    var remainder = 100 - playerVal;
    if (remainder < 0) { remainder = 0; net.factions[pfid] = 100; }
    if (othersSum > 0) {
      var sc = remainder / othersSum;
      for (var fid in net.factions) {
        if (fid !== pfid) net.factions[fid] = round5(net.factions[fid] * sc);
      }
    } else {
      // Others all zero — distribute remainder equally
      var okeys = Object.keys(net.factions).filter(function (f) { return f !== pfid; });
      for (var oi = 0; oi < okeys.length; oi++) {
        net.factions[okeys[oi]] = round5(remainder / okeys.length);
      }
    }
    net.factions[pfid] = round5(net.factions[pfid]);
  } else {
    // Normal: scale everyone proportionally
    var sum = 0;
    for (var fid in net.factions) sum += net.factions[fid];
    if (sum > 0) {
      var sc = 100 / sum;
      for (var fid in net.factions) {
        net.factions[fid] = round5(net.factions[fid] * sc);
      }
    }
  }

  // Sync player health alias (used by getNetworkModifier)
  net.health = net.factions[pfid] || 0;
}

// Adjust a single faction's share; proportionally redistribute from/to others
function adjustShare(tid, fid, rawDelta) {
  var net = G.networks[tid];
  if (!net || !net.factions) return;

  var cur = net.factions[fid] || 0;
  var newVal = Math.max(0, Math.min(100, cur + rawDelta));
  var actualDelta = newVal - cur;
  if (Math.abs(actualDelta) < 0.00001) return;

  net.factions[fid] = newVal;

  // Distribute -actualDelta proportionally among others
  var othersSum = 0;
  for (var ofid in net.factions) {
    if (ofid !== fid) othersSum += net.factions[ofid];
  }
  if (othersSum > 0) {
    for (var ofid in net.factions) {
      if (ofid === fid) continue;
      var proportion = net.factions[ofid] / othersSum;
      net.factions[ofid] = Math.max(0, net.factions[ofid] - actualDelta * proportion);
    }
  }

  normalizeShares(tid);
}

// =============================================================================
// STATE INITIALIZATION
// =============================================================================

hook('game:start', function () {
  var cfg = G.cfg;
  G.intel = 0;
  G.intelLifetime = 0;
  G.playerFactionId = cfg.factionId || 'FIVE_EYES_CORE';
  G.homeTheaterId = cfg.homeTheaterId || 'NORTH_AMERICA';

  G.networks = {};
  for (var i = 0; i < THEATER_IDS.length; i++) {
    var tid = THEATER_IDS[i];
    G.networks[tid] = {
      health: 0,
      floor: 0,
      floorDecayDay: G.day,
      factions: initTheaterShares(tid),
    };
    // Sync .health from player share
    G.networks[tid].health = G.networks[tid].factions[G.playerFactionId] || 0;
  }
});

// Backward compat for old saves
var _factionMigrated = false;
hook('render:after', function () {
  if (_factionMigrated) return;
  _factionMigrated = true;
  if (G.intel === undefined) G.intel = 0;
  if (G.intelLifetime === undefined) G.intelLifetime = 0;
  if (!G.playerFactionId) G.playerFactionId = (G.cfg && G.cfg.factionId) || 'FIVE_EYES_CORE';
  if (!G.homeTheaterId) G.homeTheaterId = (G.cfg && G.cfg.homeTheaterId) || 'NORTH_AMERICA';
  if (!G.networks) {
    G.networks = {};
    for (var i = 0; i < THEATER_IDS.length; i++) {
      var tid = THEATER_IDS[i];
      G.networks[tid] = { health: 0, floor: 0, floorDecayDay: G.day, factions: initTheaterShares(tid) };
      G.networks[tid].health = G.networks[tid].factions[G.playerFactionId] || 0;
    }
    return;
  }
  // Migrate old format: player was separate from factions dict
  for (var k = 0; k < THEATER_IDS.length; k++) {
    var t = THEATER_IDS[k];
    var n = G.networks[t];
    if (!n) continue;
    if (!n.factions || !n.factions[G.playerFactionId]) {
      // Old format — rebuild as zero-sum shares
      var oldPlayerHealth = n.health || 5;
      n.factions = initTheaterShares(t);
      // Inject old player health and re-normalize
      n.factions[G.playerFactionId] = oldPlayerHealth;
      normalizeShares(t);
    }
  }
});

// =============================================================================
// WEEKLY NETWORK TICK — drift + AI pressure + floor decay
// =============================================================================

hook('day:post', function () {
  if (!G.networks || G.day % 7 !== 0) return;

  var EQ_HOME = 35;                         // home faction equilibrium share
  var EQ_OTHER = (100 - EQ_HOME) / 7;      // ~9.286% for non-home factions

  for (var i = 0; i < THEATER_IDS.length; i++) {
    var tid = THEATER_IDS[i];
    var net = G.networks[tid];
    if (!net || !net.factions) continue;

    var theater = THEATERS[tid];
    var vol = theater ? theater.volatility : 0.3;

    // Compute raw desired value for each faction, then normalize
    for (var fid in net.factions) {
      var f = FACTIONS[fid];
      if (!f) continue;
      var isHome = (f.homeTheater === tid);
      var isPlayer = (fid === G.playerFactionId);
      var eq = isHome ? EQ_HOME : EQ_OTHER;
      var cur = net.factions[fid];

      // Drift toward equilibrium (10% of distance per week)
      var drift = (eq - cur) * 0.10;
      // Noise scaled by theater volatility
      var noise = (Math.random() - 0.5) * vol * (isPlayer ? 1.5 : 2);

      // Player-specific: geo events exert downward pressure
      if (isPlayer && G.geo && G.geo.activeEvents) {
        for (var j = 0; j < G.geo.activeEvents.length; j++) {
          var evt = G.geo.activeEvents[j];
          if (evt.theaterId === tid && !evt.resolved) {
            if (evt.typeId === 'INTELLIGENCE_WAR') noise -= 2;
            else if (evt.typeId === 'CYBER_CAMPAIGN') noise -= 1;
          }
        }
      }

      net.factions[fid] = Math.max(0, cur + drift + noise);
    }

    // Decay floor by 5% per week
    if (net.floor > 0) {
      net.floor = Math.max(0, net.floor - 5);
    }

    // Re-normalize so all shares sum to exactly 100%
    normalizeShares(tid);
  }
});

// =============================================================================
// OP SUCCESS — boost theater network health
// =============================================================================

hook('operation:resolved', function (data) {
  if (!data.success || !G.networks) return;
  var m = data.mission;
  var tid = getMissionTheaterId(m);
  if (!tid || !G.networks[tid]) return;

  // Player gains share — proportionally taken from all other factions
  var boost = m.threat * 0.8;
  if (m.typeId === 'NETWORK_EXPANSION') boost += 5;
  adjustShare(tid, G.playerFactionId, boost);

  // Captured foreign operatives yield bonus Intel
  if (m.typeId === 'COUNTER_ESPIONAGE') {
    var bonusIntel = randInt(5, 8);
    G.intel = (G.intel || 0) + bonusIntel;
    G.intelLifetime = (G.intelLifetime || 0) + bonusIntel;
    addLog('Captured foreign operative yielded +' + bonusIntel + ' Intel.', 'log-info');
  }
});

// =============================================================================
// INFILTRATED ORG WEEKLY INTEL SUPPLY
// =============================================================================

hook('day:post', function () {
  if (!G.plots || G.day % 7 !== 0) return;
  var intelFromOrgs = 0;
  for (var i = 0; i < G.plots.length; i++) {
    var p = G.plots[i];
    if (p.status === 'ACTIVE' && p.infiltrated) {
      intelFromOrgs += 1;
    }
  }
  if (intelFromOrgs > 0) {
    G.intel = (G.intel || 0) + intelFromOrgs;
    G.intelLifetime = (G.intelLifetime || 0) + intelFromOrgs;
    addLog('Infiltrated assets produced +' + intelFromOrgs + ' Intel this week.', 'log-info');
  }
});

// =============================================================================
// PROBABILITY MODIFIER — network health affects ops
// =============================================================================

hook('calcProb:modify', function (data) {
  var m = data.mission;
  var tid = getMissionTheaterId(m);
  if (!tid) return data.prob;
  return data.prob + getNetworkModifier(tid);
});

// =============================================================================
// BOOST NETWORK FLOOR (spend Intel)
// =============================================================================

window.boostNetworkFloor = function (theaterId) {
  if (!G.networks || !G.networks[theaterId]) return;
  if ((G.intel || 0) < 10) {
    addLog('Insufficient Intel (need 10).', 'log-warn');
    return;
  }
  G.intel -= 10;
  var net = G.networks[theaterId];
  net.floor = Math.min(100, net.floor + 1);
  // If player share is below floor, push it up via adjustShare
  var playerShare = net.factions ? (net.factions[G.playerFactionId] || 0) : 0;
  if (playerShare < net.floor) {
    adjustShare(theaterId, G.playerFactionId, net.floor - playerShare);
  }
  var theater = THEATERS[theaterId];
  addLog('Network floor in ' + (theater ? theater.name : theaterId) + ' bolstered (+1%). Floor: ' + net.floor + '%.', 'log-info');
  if (typeof render === 'function') render();
};

// =============================================================================
// SPAWN NETWORK EXPANSION MISSION
// =============================================================================

window.spawnNetworkExpansion = function (theaterId) {
  if (!MISSION_TYPES || !MISSION_TYPES.NETWORK_EXPANSION) return;
  // Check if one is already active for this theater
  var active = G.missions.filter(function (m) {
    return m.typeId === 'NETWORK_EXPANSION' && m.networkTheaterId === theaterId &&
      ['INCOMING', 'READY', 'INVESTIGATING', 'EXECUTING'].indexOf(m.status) >= 0;
  });
  if (active.length > 0) {
    addLog('A network expansion operation is already active in this theater.', 'log-warn');
    return;
  }

  var theater = THEATERS[theaterId];
  if (!theater) return;
  var loc = pick(theater.cities);

  spawnMission('NETWORK_EXPANSION');
  var newest = G.missions[0];
  if (newest) {
    newest.networkTheaterId = theaterId;
    newest.city = loc.city;
    newest.country = loc.country;
    newest.location = 'FOREIGN';
    // Re-stamp text fields with correct location
    if (newest.fillVars) {
      newest.fillVars.city = loc.city;
      newest.fillVars.country = loc.country;
      newest.fillVars.theater_name = theater.name;
    }
    var textFields = ['initialReport', 'fullReport', 'opNarrative'];
    for (var i = 0; i < textFields.length; i++) {
      if (newest[textFields[i]] && newest.fillVars) {
        newest[textFields[i]] = fillTemplate(newest[textFields[i]], newest.fillVars);
      }
    }
    addLog('Network expansion operation authorized: ' + theater.name + ' theater. OP ' + newest.codename + '.', 'log-info');
  }
  if (typeof render === 'function') render();
};

// =============================================================================
// TRANSFER HVT TO FOREIGN FACTION (for Intel)
// =============================================================================

window.transferHvtToFaction = function (hvtId, factionId) {
  var h = null;
  for (var i = 0; i < (G.hvts || []).length; i++) {
    if (G.hvts[i].id === hvtId) { h = G.hvts[i]; break; }
  }
  if (!h || h.status !== 'DETAINED') return;
  if (!FACTIONS[factionId]) return;

  var faction = FACTIONS[factionId];
  var intelReward = randInt(5, 10) + (h.threat || 3);
  G.intel = (G.intel || 0) + intelReward;
  G.intelLifetime = (G.intelLifetime || 0) + intelReward;

  // Small network boost for the receiving AI faction in their home theater
  var homeTheater = faction.homeTheater;
  if (G.networks && G.networks[homeTheater]) {
    adjustShare(homeTheater, factionId, 2);
  }

  h.status = 'HANDED_OVER';
  h.handedTo = factionId;
  addLog(h.alias + ' transferred to ' + faction.name + '. +' + intelReward + ' Intel.', 'log-success');
  hvtBriefingPopup('handedOver', h, { detail: 'Transferred to ' + faction.name + ' (+' + intelReward + ' Intel)' });
  if (typeof render === 'function') render();
};

// =============================================================================
// COUNTER-ESPIONAGE: Foreign operatives detected on home soil
// =============================================================================

var FOREIGN_OPERATIVE_ALIASES = [
  'CHAMELEON', 'SHADOW', 'FROST', 'SPARROW', 'RIDDLE', 'NEEDLE',
  'COMPASS', 'WHISPER', 'DRIFT', 'CURRENT', 'ANCHOR', 'SOCKET',
  'PRISM', 'GAUGE', 'STATIC', 'SPLICE', 'THREAD', 'LENS',
];

var FOREIGN_OPERATIVE_ROLES = [
  'intelligence officer under diplomatic cover',
  'clandestine case officer running local assets',
  'signals intelligence collector operating illegally',
  'influence operative embedded in media networks',
  'technology acquisition agent targeting defense programs',
  'deep-cover illegal with no diplomatic immunity',
];

hook('day:post', function () {
  if (!G.networks || G.day % 7 !== 0) return;
  // 8% chance per week of detecting a foreign operative on home turf
  if (Math.random() >= 0.08) return;

  // Pick a random non-player faction as the source
  var factionIds = Object.keys(FACTIONS).filter(function (fid) { return fid !== G.playerFactionId; });
  var srcFactionId = pick(factionIds);
  var srcFaction = FACTIONS[srcFactionId];

  var alias = pick(FOREIGN_OPERATIVE_ALIASES);
  var role = pick(FOREIGN_OPERATIVE_ROLES);
  var city = pick(G.cfg.domesticCities);

  // Create an HVT for this operative
  var hvtId = 'H' + (++G.hvtIdCounter);
  G.hvts.push({
    id: hvtId,
    type: 'HVT',
    alias: alias,
    role: role + ' (' + srcFaction.shortName + ')',
    org: srcFaction.name,
    threat: randInt(2, 4),
    location: 'DOMESTIC',
    status: 'ACTIVE',
    knownFields: { city: city, country: G.cfg.name },
    gaps: ['Cover identity unconfirmed', 'Handler and reporting chain unknown', 'Full scope of operations unclear'],
    linkedMissionIds: [],
    addedDay: G.day,
    detainedAt: null,
    detainedDay: null,
    interrogationCount: 0,
    surveillanceEstablished: false,
    handedTo: null,
    factionId: srcFactionId,
    hvtIntelType: true,
  });

  queueBriefingPopup({
    title: 'COUNTER-INTELLIGENCE ALERT',
    category: 'THREAT INTELLIGENCE',
    subtitle: alias + ' \u2014 ' + srcFaction.shortName + ' OPERATIVE',
    accent: 'rgba(231, 76, 60, 0.9)',
    body: '<p>Counter-Intelligence has identified a suspected foreign operative on domestic soil. The individual \u2014 designated <strong>"' + alias + '"</strong> \u2014 is assessed as a <strong>' + role + '</strong> linked to the <strong>' + srcFaction.name + '</strong>.</p>' +
      '<p>Last known location: <strong>' + city + '</strong>. The operative appears to be building intelligence networks on our home territory, potentially degrading our domestic coverage.</p>' +
      '<p>Recommend immediate tracking and apprehension. Capturing this individual could yield significant intelligence on ' + srcFaction.shortName + ' operations in our theater.</p>',
    buttonLabel: 'ACKNOWLEDGED',
  });

  addLog('COUNTER-INTEL ALERT: Foreign operative "' + alias + '" (' + srcFaction.shortName + ') detected in ' + city + '.', 'log-warn');
});

// =============================================================================
// HVT FACTION ASSIGNMENT HELPER
// =============================================================================

// Called from game.js when creating HVTs — determines if an HVT should be
// associated with a faction based on mission type and country
window.assignHvtFaction = function (hvt, missionTypeId, country) {
  var INTEL_MISSION_TYPES = {
    COUNTER_INTEL: true, MOLE_HUNT: true,
    HVT_SURVEILLANCE_DOM: true, HVT_SURVEILLANCE_FOR: true,
  };
  // Espionage-type HVTs get faction association
  if (INTEL_MISSION_TYPES[missionTypeId]) {
    hvt.hvtIntelType = true;
    var tid = getTheaterIdForCountry(country);
    if (tid) {
      hvt.factionId = getFactionForTheater(tid);
    }
  }
};

// =============================================================================
// CSS INJECTION
// =============================================================================

var _factionCssInjected = false;
function injectFactionCSS() {
  if (_factionCssInjected) return;
  _factionCssInjected = true;
  var style = document.createElement('style');
  style.textContent = [
    // Network section container
    '.geo-network-section { padding: 4px 0 2px; border-top: 1px solid rgba(255,255,255,0.04); margin-top: 4px; }',
    '.geo-network-section .geo-network-player { margin-bottom: 2px; }',
    '.geo-network-ai { opacity: 0.75; }',
    '.geo-network-ai .geo-network-bar { height: 4px !important; }',
    '.geo-network-label-you { font-weight: 700; }',
    // Network health bar in theater cards
    '.geo-network-row { display: flex; align-items: center; gap: 6px; padding: 2px 0 1px; }',
    '.geo-network-label { font-size: 7px; letter-spacing: 0.8px; color: var(--text-dim); font-family: var(--font-mono); min-width: 52px; cursor: help; }',
    '.geo-network-bar { flex: 1; height: 6px; background: rgba(255,255,255,0.06); border-radius: 3px; overflow: hidden; position: relative; }',
    '.geo-network-fill { height: 100%; border-radius: 3px; transition: width 0.4s ease, background 0.3s; }',
    '.geo-network-val { font-size: 8px; font-family: var(--font-mono); color: var(--text-dim); min-width: 30px; text-align: right; }',
    '.geo-network-modifier { font-size: 7px; font-family: var(--font-mono); padding: 1px 3px; border-radius: 2px; }',
    '.geo-network-modifier.positive { color: rgba(46,204,113,0.9); background: rgba(46,204,113,0.1); }',
    '.geo-network-modifier.negative { color: rgba(231,76,60,0.9); background: rgba(231,76,60,0.1); }',
    '.geo-network-modifier.neutral { color: var(--text-dim); }',
    // Faction badge
    '.geo-faction-badge { font-size: 7px; letter-spacing: 0.8px; padding: 1px 5px; border-radius: 2px; font-family: var(--font-mono); opacity: 0.7; display: inline-block; margin-left: 4px; }',
    // Action buttons on theater cards
    '.geo-actions { display: flex; gap: 4px; padding: 4px 0 0; }',
    '.geo-action-btn { font-family: var(--font-mono); font-size: 8px; letter-spacing: 0.5px; padding: 3px 6px; border-radius: 3px; cursor: pointer; border: 1px solid; transition: background 0.15s, color 0.15s; }',
    '.geo-action-btn.boost { border-color: rgba(52,152,219,0.4); background: rgba(52,152,219,0.08); color: rgba(52,152,219,0.9); }',
    '.geo-action-btn.boost:hover { background: rgba(52,152,219,0.2); }',
    '.geo-action-btn.expand { border-color: rgba(46,204,113,0.4); background: rgba(46,204,113,0.08); color: rgba(46,204,113,0.9); }',
    '.geo-action-btn.expand:hover { background: rgba(46,204,113,0.2); }',
    '.geo-action-btn.disabled { opacity: 0.3; cursor: not-allowed; pointer-events: none; }',
    // Faction transfer buttons in threats panel
    '.faction-transfer-row { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 4px; }',
    '.faction-transfer-btn { font-family: var(--font-mono); font-size: 8px; letter-spacing: 0.5px; padding: 2px 6px; border-radius: 3px; cursor: pointer; border: 1px solid rgba(155,89,182,0.3); background: rgba(155,89,182,0.08); color: rgba(155,89,182,0.9); transition: background 0.15s; }',
    '.faction-transfer-btn:hover { background: rgba(155,89,182,0.2); }',
    // Floor indicator
    '.geo-floor-indicator { font-size: 7px; color: rgba(52,152,219,0.7); font-family: var(--font-mono); }',
  ].join('\n');
  document.head.appendChild(style);
}

hook('render:after', function () {
  injectFactionCSS();
});

// =============================================================================
// EXPOSE for geopolitics.js theater card rendering
// =============================================================================

function getHealthColor(health, isPlayer, isHome) {
  if (isPlayer) {
    if (isHome) {
      return health > 65 ? 'rgba(46,204,113,0.8)' : health >= 30 ? 'rgba(241,196,15,0.7)' : health >= 10 ? 'rgba(231,76,60,0.7)' : 'rgba(192,57,43,0.9)';
    }
    return health > 50 ? 'rgba(46,204,113,0.8)' : health > 15 ? 'rgba(52,152,219,0.7)' : health >= 5 ? 'rgba(241,196,15,0.7)' : 'rgba(231,76,60,0.7)';
  }
  // AI factions: use their faction color at varying opacity
  return null; // caller uses faction color
}

window.renderNetworkBar = function (theaterId) {
  if (!G.networks || !G.networks[theaterId]) return '';
  var net = G.networks[theaterId];
  if (!net.factions) return '';
  var health = Math.round(net.factions[G.playerFactionId] || 0);
  var isHome = (theaterId === G.homeTheaterId);
  var modifier = getNetworkModifier(theaterId);

  // Player row
  var playerFaction = FACTIONS[G.playerFactionId];
  var fillColor = getHealthColor(health, true, isHome);
  var playerTheaterName = (G.homeTheaterId && THEATERS[G.homeTheaterId]) ? THEATERS[G.homeTheaterId].name : 'Unknown';
  var playerTip = playerFaction ? (playerFaction.name + '&#10;Home: ' + playerTheaterName + '&#10;Agencies: ' + playerFaction.agencies) : 'Your faction';

  var modStr = '';
  if (modifier > 0) modStr = '<span class="geo-network-modifier positive">+' + modifier + '%</span>';
  else if (modifier < 0) modStr = '<span class="geo-network-modifier negative">' + modifier + '%</span>';
  else modStr = '<span class="geo-network-modifier neutral">\u00b10%</span>';

  var floorStr = net.floor > 0 ? ' <span class="geo-floor-indicator">\u2191' + net.floor + '%</span>' : '';

  var html = '<div class="geo-network-section">';
  html += '<div class="geo-network-row geo-network-player">' +
    '<span class="geo-network-label geo-network-label-you" style="color:' + (playerFaction ? playerFaction.color : 'var(--green)') + '" data-tip="' + playerTip + '">' + (playerFaction ? playerFaction.icon + ' ' + playerFaction.shortName : 'YOU') + '</span>' +
    '<div class="geo-network-bar"><div class="geo-network-fill" style="width:' + health + '%;background:' + fillColor + '"></div></div>' +
    '<span class="geo-network-val">' + health + '%' + floorStr + '</span>' +
    modStr +
  '</div>';

  // Other faction rows
  if (net.factions) {
    // Sort: home faction first, then by health descending (exclude player)
    var sortedFids = Object.keys(net.factions).filter(function (f) { return f !== G.playerFactionId; }).sort(function (a, b) {
      var aHome = FACTIONS[a] && FACTIONS[a].homeTheater === theaterId ? 1 : 0;
      var bHome = FACTIONS[b] && FACTIONS[b].homeTheater === theaterId ? 1 : 0;
      if (aHome !== bHome) return bHome - aHome;
      return net.factions[b] - net.factions[a];
    });
    for (var fi = 0; fi < sortedFids.length; fi++) {
      var fid = sortedFids[fi];
      var f = FACTIONS[fid];
      if (!f) continue;
      var aiHealth = Math.round(net.factions[fid]);
      var aiIsHome = (f.homeTheater === theaterId);
      var aiHomeTheater = THEATERS[f.homeTheater] ? THEATERS[f.homeTheater].name : f.homeTheater;
      var aiTip = f.name + '&#10;Home: ' + aiHomeTheater + '&#10;Agencies: ' + f.agencies;
      html += '<div class="geo-network-row geo-network-ai">' +
        '<span class="geo-network-label" style="color:' + f.color + '" data-tip="' + aiTip + '">' + f.icon + ' ' + f.shortName + '</span>' +
        '<div class="geo-network-bar"><div class="geo-network-fill" style="width:' + aiHealth + '%;background:' + f.color + ';opacity:' + (aiIsHome ? '0.8' : '0.5') + '"></div></div>' +
        '<span class="geo-network-val">' + aiHealth + '%</span>' +
      '</div>';
    }
  }

  html += '</div>';
  return html;
};

window.renderFactionBadge = function (theaterId) {
  var fid = getFactionForTheater(theaterId);
  if (!fid || !FACTIONS[fid]) return '';
  var f = FACTIONS[fid];
  var isPlayer = (fid === G.playerFactionId);
  var bgColor = isPlayer ? 'rgba(46,204,113,0.15)' : 'rgba(255,255,255,0.06)';
  var borderColor = isPlayer ? 'rgba(46,204,113,0.3)' : 'rgba(255,255,255,0.1)';
  var textColor = isPlayer ? 'rgba(46,204,113,0.9)' : 'var(--text-dim)';
  return '<span class="geo-faction-badge" style="background:' + bgColor + ';border:1px solid ' + borderColor + ';color:' + textColor + '" data-tip="' + f.name + ': ' + f.agencies + '">' + f.shortName + (isPlayer ? ' (YOU)' : '') + '</span>';
};

window.renderTheaterActions = function (theaterId) {
  var isHome = (theaterId === G.homeTheaterId);
  var html = '<div class="geo-actions">';

  // Boost network button (costs 10 Intel)
  var canBoost = (G.intel || 0) >= 10;
  html += '<button class="geo-action-btn boost' + (canBoost ? '' : ' disabled') + '" onclick="boostNetworkFloor(\'' + theaterId + '\')" data-tip="Spend 10 Intel to raise network floor +1% for one week.">BOLSTER (10 INT)</button>';

  // Expand network button (foreign theaters only)
  if (!isHome) {
    var hasActive = G.missions.some(function (m) {
      return m.typeId === 'NETWORK_EXPANSION' && m.networkTheaterId === theaterId &&
        ['INCOMING', 'READY', 'INVESTIGATING', 'EXECUTING'].indexOf(m.status) >= 0;
    });
    html += '<button class="geo-action-btn expand' + (hasActive ? ' disabled' : '') + '" onclick="spawnNetworkExpansion(\'' + theaterId + '\')" data-tip="Launch a network expansion operation in this theater.">' + (hasActive ? 'OP ACTIVE' : 'EXPAND NETWORK') + '</button>';
  }

  html += '</div>';
  return html;
};

// Faction transfer buttons for detained intelligence HVTs
window.renderFactionTransferBtns = function (hvt) {
  if (!hvt.hvtIntelType || hvt.status !== 'DETAINED') return '';
  var btns = '';
  for (var fid in FACTIONS) {
    if (fid === G.playerFactionId) continue;
    var f = FACTIONS[fid];
    btns += '<button class="faction-transfer-btn" onclick="transferHvtToFaction(\'' + hvt.id + '\',\'' + fid + '\')" data-tip="Transfer to ' + f.name + ' (' + f.agencies + '). Earn Intel.">\u2192 ' + f.shortName + '</button>';
  }
  if (!btns) return '';
  return '<div style="font-size:8px;color:var(--text-dim);margin-top:6px;letter-spacing:0.5px">FACTION TRANSFER (earn Intel)</div>' +
    '<div class="faction-transfer-row">' + btns + '</div>';
};
