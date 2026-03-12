'use strict';
const GAME_VERSION = '4.2.1';
// =============================================================================
// SHADOW DIRECTIVE  —  Per-department resources, XP & capabilities system
// config.js (COUNTRIES, DEPT_CONFIG, FOREIGN_CITIES, etc.) must precede this file
// MISSION_TYPES loaded from missions.js (must precede this file)
// =============================================================================

// --- Configuration constants are now in config.js ---
// COUNTRIES, DEPT_CONFIG, FOREIGN_CITIES, CODENAME_ADJ, CODENAME_NOUN,
// HVT_HARDNESS, classifyHvtHardness, vagueEstimate, ROLE_TOOLTIPS,
// roleTooltip, roleWithTip

let G = {
  country: null, cfg: null,
  day: 1, budget: 0, confidence: 0,
  xp: 0, xpThisMonth: 0,
  monthOpsCompleted: 0, monthOpsSucceeded: 0, lastRecapDay: 0,
  missions: [], depts: {}, log: [],
  selected: null, opsCompleted: 0, opsSucceeded: 0,
  missionIdCounter: 0, usedCodenames: new Set(), nextSpawnDay: 1,
  upgrades: {}, // tracks upgrade purchase counts per upgrade id
  hvts: [], hvtIdCounter: 0,
};

// =============================================================================
// HOOK SYSTEM — allows feature files to extend core without editing game.js
// =============================================================================
const _hooks = {};
function hook(name, fn) { (_hooks[name] = _hooks[name] || []).push(fn); }
function fire(name, data) { for (const fn of _hooks[name] || []) fn(data); }

// =============================================================================
// UTILITIES
// =============================================================================

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randInt(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }
function clamp(v, lo, hi) { return Math.min(hi, Math.max(lo, v)); }
function fmt(n) { return G.cfg ? `${G.cfg.currencySymbol}${n}M` : `$${n}M`; }
function week() { return Math.ceil(G.day / 7); }

function fillTemplate(tpl, vars) {
  let result = tpl.replace(/\{(\w+)\}/g, (_, key) =>
    vars[key] !== undefined ? vars[key] : `{${key}}`);
  // Second pass: resolve nested placeholders (e.g. {military_name} inside a resolved var value)
  if (result.includes('{')) {
    result = result.replace(/\{(\w+)\}/g, (_, key) =>
      vars[key] !== undefined ? vars[key] : `[${key}]`);
  }
  return result;
}

function resolveVars(varsTemplate, baseVars) {
  const resolved = { ...baseVars };
  for (const [k, v] of Object.entries(varsTemplate || {}))
    resolved[k] = Array.isArray(v) ? pick(v) : v;
  // Resolve nested placeholders within var values (e.g. {military_name} inside element_type)
  for (const [k, v] of Object.entries(resolved)) {
    if (typeof v === 'string' && v.includes('{'))
      resolved[k] = fillTemplate(v, resolved);
  }
  return resolved;
}

function generateCodename() {
  // Build set of currently active codenames (missions + HVT-linked ops)
  const active = new Set();
  for (const m of G.missions) active.add(m.codename);
  for (let i = 0; i < 200; i++) {
    const c = `${pick(CODENAME_ADJ)} ${pick(CODENAME_NOUN)}`;
    if (!active.has(c)) return c;
  }
  return `OP-${G.missionIdCounter}`;
}

// =============================================================================
// DEPARTMENT RESOURCE SYSTEM
// =============================================================================

// Dynamically computed from active missions — always accurate, never stale
function deptAllocated(deptId) {
  let n = 0;
  for (const m of G.missions) {
    if (m.status === 'INVESTIGATING' && m.assignedInvDept === deptId) n++;
    if (m.status === 'EXECUTING' && (m.assignedExecDepts || []).includes(deptId)) n++;
  }
  return n;
}

function deptAvail(deptId) {
  const d = G.depts[deptId];
  return d ? Math.max(0, d.capacity - deptAllocated(deptId)) : 0;
}

// All missions currently using this dept (for dept panel display)
function deptAssignments(deptId) {
  const result = [];
  for (const m of G.missions) {
    if (m.status === 'INVESTIGATING' && m.assignedInvDept === deptId)
      result.push({ id: m.id, codename: m.codename, phase: 'INV', daysLeft: m.invDaysLeft });
    if (m.status === 'EXECUTING' && (m.assignedExecDepts || []).includes(deptId))
      result.push({ id: m.id, codename: m.codename, phase: 'EXEC', daysLeft: m.execDaysLeft });
  }
  return result;
}

// =============================================================================
// GAME INITIALIZATION
// =============================================================================

function initRelations(cfg) {
  const r = {};
  for (const [id, ag] of Object.entries(cfg.partnerAgencies || {}))
    r[id] = { relation: ag.startingRelation, favorsCompleted: 0, favorsFailed: 0 };
  return r;
}

function initDepts(cfg) {
  const caps  = cfg.deptCapacities;
  const depts = {};
  for (const d of DEPT_CONFIG) {
    depts[d.id] = {
      id: d.id, name: d.name, short: d.short,
      unitName: d.unitName, unitNameSingle: d.unitNameSingle,
      capacity: caps[d.id] ?? d.baseCapacity,
    };
  }
  return depts;
}

function initUpgrades() {
  const u = { budgetRegen: 0, budgetCap: 0 };
  for (const d of DEPT_CONFIG) u[d.id] = 0;
  return u;
}

function startGame(countryCode) {
  const cfg = COUNTRIES[countryCode];
  if (!cfg) return;
  G = {
    country: countryCode, cfg,
    day: 1, budget: cfg.budget, confidence: cfg.confidence,
    xp: 0, xpThisMonth: 0, intel: 0, intelLifetime: 0,
    monthOpsCompleted: 0, monthOpsSucceeded: 0, lastRecapDay: 0,
    missions: [], depts: initDepts(cfg), log: [],
    intelMessages: [], intelIdCounter: 0,
    selected: null, selectedType: null, opsCompleted: 0, opsSucceeded: 0,
    missionIdCounter: 0, usedCodenames: new Set(), nextSpawnDay: 1,
    upgrades: initUpgrades(),
    hvts: [], hvtIdCounter: 0,
    relations: initRelations(cfg),
    currentFolder: 'inbox',
  };
  showScreen('client');
  fire('game:start', G);
  spawnMission();
  if (Math.random() < 0.7) spawnMission();
  addLog(`Agency ${cfg.acronym} operational. Day 1.`, 'log-info');
  addLog(`${cfg.leaderFormal} expects results. Good luck, Director.`, 'log-info');
  render();
}

function restartGame() { G.country = null; showScreen('login'); bootTerminal(); }

function confirmAbortGame() {
  document.getElementById('modal-title').textContent = 'ABORT OPERATION';
  document.getElementById('modal-body').innerHTML = `
    <div style="padding:12px 0">
      <div style="font-size:14px;color:var(--text-hi);margin-bottom:12px;font-family:var(--font-disp);font-weight:600">CONFIRM ABORT</div>
      <div style="font-size:13px;color:var(--text-dim);line-height:1.6;margin-bottom:20px">
        All current operation progress will be lost. You will be returned to the country selection screen.
      </div>
    </div>
    <div class="modal-actions">
      <button class="btn-danger" onclick="window.abortGame()">ABORT — RETURN TO MENU</button>
      <button class="btn-neutral" onclick="hideModal()">CANCEL</button>
    </div>
  `;
  showModal();
}
window.abortGame = function() { hideModal(); restartGame(); };

// =============================================================================
// XP SYSTEM
// =============================================================================

function gainXP(amount, source) {
  if (amount <= 0) return;
  G.xp           += amount;
  G.xpThisMonth  += amount;
  addLog(`+${amount} XP — ${source}.`, 'log-xp');
}

// =============================================================================
// INTEL / INVESTIGATION HELPERS
// =============================================================================

function rollInvestigationOutcome(eff) {
  const e = clamp(eff, 0, 100) / 100;
  const r = Math.random() * 100;
  const cfCeil   = 15 - e * 12;                    // 3–15%
  const failCeil = cfCeil + 25 - e * 8;            // 17–40%
  const partCeil = failCeil + 30;                   // flat +30
  const sucCeil  = partCeil + 20 + e * 10;         // 50–60% above partCeil
  if (r < cfCeil)   return 'CRITICAL_FAILURE';
  if (r < failCeil) return 'FAILURE';
  if (r < partCeil) return 'PARTIAL';
  if (r < sucCeil)  return 'SUCCESS';
  return 'CRITICAL_SUCCESS';
}

function buildIntelFields(src, fillVars) {
  return (src.intelFields || []).map(f => ({
    key: f.key, label: f.label,
    value: src.intelFieldValues?.[f.key]
      ? fillTemplate(pick(src.intelFieldValues[f.key]), fillVars)
      : '—',
    revealed: false,
  }));
}

// =============================================================================
// MISSION GENERATION
// =============================================================================

function initPhaseFields(m) {
  const ph = m.phases[m.currentPhaseIndex];
  const phFillVars = resolveVars(ph.vars || {}, m.fillVars);

  // Build intel fields first so their resolved values can be used in briefs
  const intelFields = buildIntelFields(ph, phFillVars);
  for (const f of intelFields) {
    if (f.key && f.value && f.value !== '—') phFillVars[f.key] = f.value;
  }
  m.currentPhaseFillVars = phFillVars;

  m.invDays      = randInt(...ph.invDaysRange);
  m.invDepts     = ph.invDepts;
  m.execDays     = randInt(...ph.execDaysRange);
  m.execDepts    = ph.execDepts;
  m.baseBudget   = randInt(...ph.budgetRange);
  m.confSuccess  = ph.confSuccess;
  m.confFail     = ph.confFail;
  m.opNarrative  = fillTemplate(ph.opNarrative, phFillVars);
  m.initialReport = fillTemplate(pick(ph.investigateReports), phFillVars);
  m.fullReport    = fillTemplate(pick(ph.fullBriefs),         phFillVars);
  m.successMsgs   = ph.successOutcomes;
  m.failureMsgs   = ph.failureOutcomes;

  m.intelFields    = intelFields;
  m.intelBonus     = false;
  m.blown          = false;
  m.blownDaysLeft  = 0;
  m.lastInvOutcome = null;

  m.assignedInvDept    = null;
  m.invDaysLeft        = 0;
  m.assignedBudget     = 0;
  m.assignedExecDepts  = [];
  m.execDaysLeft       = 0;
  m.successProb        = 0;
  m.phaseFalseFlag     = false;
  m.phaseFalseFlagText = '';
  m.phaseFalseFlagPenalty = false;
}

function spawnMission(forcedType) {
  const inbox = G.missions.filter(m =>
    ['INCOMING', 'INVESTIGATING', 'READY', 'PHASE_COMPLETE'].includes(m.status));
  if (inbox.length >= 30) return;

  const NO_RANDOM_SPAWN = new Set(['ORG_INFILTRATION', 'ORG_TAKEDOWN']);
  const typeId = forcedType || pick(Object.keys(MISSION_TYPES).filter(k => !NO_RANDOM_SPAWN.has(k)));
  const tmpl   = MISSION_TYPES[typeId];
  if (!tmpl) return;

  const codename = generateCodename();
  const urgency  = randInt(...tmpl.urgencyRange);
  const threat   = randInt(...tmpl.threatRange);

  let cityName, countryName;
  if (tmpl.location === 'DOMESTIC') {
    cityName = pick(G.cfg.domesticCities); countryName = G.cfg.name;
  } else {
    const foreignPool = FOREIGN_CITIES.filter(c => c.country !== G.cfg.name);
    const loc = pick(foreignPool); cityName = loc.city; countryName = loc.country;
  }

  const pa = G.cfg.partnerAgencies || {};
  const fillVars = resolveVars(tmpl.vars || {}, {
    city: cityName, country: countryName, codename, urgency_days: String(urgency),
    agency: G.cfg.acronym, leaderTitle: G.cfg.leaderTitle,
    bureau_name: pa.BUREAU?.shortName || 'BUREAU',
    agency_name: pa.AGENCY?.shortName || 'AGENCY',
    military_name: pa.MILITARY?.shortName || 'MILITARY',
  });

  const mission = {
    id: `M${++G.missionIdCounter}`,
    typeId, codename, threat,
    label: tmpl.label, category: tmpl.category, location: tmpl.location,
    city: cityName, country: countryName,
    urgency, urgencyLeft: urgency,
    fillVars,
    isMultiPhase: tmpl.isMultiPhase || false,
    status: 'INCOMING',
    assignedInvDept: null, invDaysLeft: 0,
    assignedBudget: 0, assignedExecDepts: [], execDaysLeft: 0, successProb: 0,
    resultMsg: '', confDelta: 0, budgetDelta: 0,
    dayReceived: G.day,
    phaseFalseFlag: false, phaseFalseFlagText: '', phaseFalseFlagPenalty: false,
    followUpSpawned: false,
  };

  // Suspect generation
  const sv = tmpl.suspectVars;
  if (tmpl.hasSuspects && sv) {
    const count     = randInt(...(tmpl.targetSuspectCount || [1, 1]));
    const targetIdx = randInt(0, count - 1);
    mission.suspects = Array.from({ length: count }, (_, i) => ({
      alias:      i === targetIdx ? pick(sv.alias)           : pick(sv.decoy_alias || sv.alias),
      role:       i === targetIdx ? pick(sv.role)            : pick(sv.decoy_role  || sv.role),
      confidence: pick(sv.confidence),
      isTarget:   i === targetIdx,
      eliminated: false,
    }));
    mission.selectedSuspectIdx = count === 1 ? 0 : null;
  } else {
    mission.suspects           = [];
    mission.selectedSuspectIdx = null;
  }

  if (tmpl.isMultiPhase) {
    mission.phases            = tmpl.phases;
    mission.currentPhaseIndex = 0;
    mission.completedPhases   = [];
    mission.lastPhaseMsg      = '';
    mission.lastPhaseName     = '';
    mission.lastPhaseShortName = '';
    mission.lastPhaseConfDelta = 0;
    mission.agencyJustification = tmpl.agencyJustification
      ? fillTemplate(tmpl.agencyJustification, fillVars) : '';
    initPhaseFields(mission);
  } else {
    // Build intel fields first so resolved values can be used in briefs
    const missionIntelFields = buildIntelFields(tmpl, fillVars);
    for (const f of missionIntelFields) {
      if (f.key && f.value && f.value !== '—') fillVars[f.key] = f.value;
    }
    Object.assign(mission, {
      invDays:    randInt(...tmpl.invDaysRange),
      execDays:   randInt(...tmpl.execDaysRange),
      baseBudget: randInt(...tmpl.budgetRange),
      invDepts:   tmpl.invDepts,
      execDepts:  tmpl.execDepts,
      opNarrative:   tmpl.opNarrative ? fillTemplate(tmpl.opNarrative, fillVars) : '',
      initialReport: fillTemplate(pick(tmpl.initialReports), fillVars),
      fullReport:    fillTemplate(pick(tmpl.fullReports),    fillVars),
      successMsgs:   tmpl.successMsgs,
      failureMsgs:   tmpl.failureMsgs,
      confSuccess:   tmpl.confSuccess,
      confFail:      tmpl.confFail,
      intelFields:   missionIntelFields,
      intelBonus:    false,
      blown:         false,
      blownDaysLeft: 0,
      lastInvOutcome: null,
      agencyJustification: tmpl.agencyJustification
        ? fillTemplate(tmpl.agencyJustification, fillVars) : '',
    });
  }

  G.missions.unshift(mission);
  fire('mission:spawned', { mission });
  addLog(`New mission received: OP ${codename} [${mission.label}]`);
  G.nextSpawnDay = G.day + randInt(3, 8);
}

// =============================================================================
// DAY ADVANCEMENT
// =============================================================================

function triggerDayScanline() {
  const pane = document.getElementById('reading-pane');
  if (!pane) return;
  pane.style.position = 'relative';
  const line = document.createElement('div');
  line.className = 'day-advance-flash';
  pane.appendChild(line);
  line.addEventListener('animationend', () => line.remove());
}

function advanceDay() {
  // Snapshot mission IDs before spawning for new-arrival detection
  G._prevMissionIds = new Set(G.missions.map(m => m.id));
  G.day++;
  fire('day:pre', G);

  for (const m of G.missions) {
    if (['INCOMING', 'READY', 'PHASE_COMPLETE', 'DEAD_END'].includes(m.status)) {
      m.urgencyLeft = Math.max(0, m.urgencyLeft - 1);
      if (m.urgencyLeft === 0) expireMission(m);
    }
    if (m.status === 'BLOWN') {
      m.blownDaysLeft = Math.max(0, m.blownDaysLeft - 1);
      if (m.blownDaysLeft === 0) {
        addLog(`OP ${m.codename}: target fled — mission expired.`, 'log-warn');
        expireMission(m);
      }
    }
    if (m.status === 'INVESTIGATING') {
      m.invDaysLeft = Math.max(0, m.invDaysLeft - 1);
      m.urgencyLeft = Math.max(0, m.urgencyLeft - 1);
      if (m.invDaysLeft === 0) {
        completeInvestigation(m);
      } else if (m.urgencyLeft === 0) {
        expireMission(m);
        m.assignedInvDept = null; // free the slot
      }
    }
    if (m.status === 'EXECUTING') {
      m.execDaysLeft = Math.max(0, m.execDaysLeft - 1);
      if (m.execDaysLeft === 0) resolveOperation(m);
    }
  }

  if (G.day % 7 === 0) {
    const drain = -2;
    G.confidence = clamp(G.confidence + drain, 0, 100);
    G.budget = Math.min(G.budget + G.cfg.weeklyBudgetRegen, G.cfg.budget);
    addLog(`Weekly briefing: Confidence ${drain}%. Budget +${fmt(G.cfg.weeklyBudgetRegen)}.`, 'log-warn');
  }

  if (G.day >= G.nextSpawnDay) {
    if (Math.random() < 0.6) spawnMission();
    G.nextSpawnDay = G.day + randInt(3, 7);
  }

  // Favor missions every ~4 days, relation-weighted
  if (G.day % 5 === 0 && G.cfg?.partnerAgencies) {
    const inbox = G.missions.filter(m => !['EXECUTING', 'SUCCESS', 'FAILURE', 'ARCHIVED', 'EXPIRED'].includes(m.status));
    if (inbox.length < 6) {
      const candidates = Object.entries(G.cfg.partnerAgencies)
        .filter(([id]) => (G.relations?.[id]?.relation ?? 0) >= 25)
        .map(([id, ag]) => ({ id, ag, weight: G.relations[id].relation }));
      if (candidates.length && Math.random() < 0.40) {
        const chosen = weightedPick(candidates);
        const typeId = pick(AGENCY_FAVOR_TYPES[chosen.id] || []);
        if (typeId) {
          const prevLen = G.missions.length;
          spawnMission(typeId);
          const nm = G.missions.length > prevLen ? G.missions[0] : null;
          if (nm) {
            nm.favorOf = chosen.id;
            nm.favorAgencyName = chosen.ag.name;
            const sn = chosen.ag.shortName || chosen.id;
            nm.label = nm.label.replace(/^(BUREAU|AGENCY|MILITARY) FAVOR/, sn + ' FAVOR');
            nm.category = nm.category.replace(/^(BUREAU|AGENCY|MILITARY) FAVOR/, sn + ' FAVOR');
          }
        }
      }
    }
  }

  // Check for HVTs resurfacing from underground cooldown
  if (G.hvts) {
    for (let hi = 0; hi < G.hvts.length; hi++) {
      const hv = G.hvts[hi];
      if (hv.cooldownUntil && hv.cooldownUntil === G.day && hv.status === 'ACTIVE') {
        hv.cooldownUntil = null;
        addLog(`TARGET REACQUIRED: "${hv.alias}" has resurfaced. Operations may resume.`, 'log-info');
        const reacquireIntros = [
          '"' + hv.alias + '" is back on the grid. After weeks of silence, our monitoring stations have picked up activity consistent with the target resuming normal operational patterns.',
          'SIGINT has reacquired "' + hv.alias + '". A burst of communications from known associates suggests the target has resurfaced and resumed contact with their network. The window is reopening.',
          'Pattern-of-life analysis has flagged a match. "' + hv.alias + '" was spotted by imagery analysts at a location consistent with their known operational area. The target is no longer underground.',
          'After an extended absence, "' + hv.alias + '" has resurfaced. A trusted HUMINT source has confirmed sightings. The target appears to believe the danger has passed.',
          'One of our watchers has made a positive identification. "' + hv.alias + '" was observed moving through ' + (hv.knownFields?.city || 'the operational area') + '. Counter-surveillance was minimal — the subject appears to have relaxed their guard.',
          'Technical surveillance has reacquired "' + hv.alias + '". The target made a comms error — using a device flagged in our system. We now have a fresh intercept trail to follow.',
          'Our analysts have confirmed that "' + hv.alias + '" has broken cover. Financial activity traced to known fronts indicates the target is once again operational. The hunt can resume.',
          'A liaison service has passed intelligence confirming "' + hv.alias + '" has been sighted in ' + (hv.knownFields?.city || 'the region') + '. Multiple corroborating indicators suggest the target is no longer in hiding.',
        ];
        const reacquireClosers = [
          'Operations against this target may now be resumed. Recommend immediate allocation of surveillance resources to re-establish a track before the subject moves again.',
          'Our assessment: the target\'s security posture has degraded since going underground. This may represent our best opportunity to act before they tighten protocols again.',
          'Intelligence collection priority for this target has been elevated to IMMEDIATE. All departments should be prepared to support rapid-response operations.',
          'The target is mobile and potentially vulnerable. Time is a factor — extended delay risks another disappearance.',
        ];
        queueBriefingPopup({
          title: 'TARGET REACQUIRED',
          category: 'HVT ALERT',
          subtitle: hv.alias + ' — ' + (hv.knownFields?.city || 'Location pending') + (hv.knownFields?.country ? ', ' + hv.knownFields.country : ''),
          accent: 'var(--green)',
          body: '<p>' + pick(reacquireIntros) + '</p><p>' + pick(reacquireClosers) + '</p>',
          buttonLabel: 'ACKNOWLEDGED',
        });
      }
    }
  }

  fire('day:post', G);
  checkGameOver();
  render();
  triggerDayScanline();
  // Mark newly spawned missions for arrival animation
  if (G._prevMissionIds && typeof G._prevMissionIds.has === 'function') {
    requestAnimationFrame(() => {
      G.missions.forEach(m => {
        if (!G._prevMissionIds.has(m.id)) {
          const row = document.querySelector(`.msg-row[onclick*="${m.id}"]`);
          if (row) row.classList.add('msg-new-arrival');
        }
      });
      // Also mark new intel messages
      (G.intelMessages || []).forEach(im => {
        if (!im.read) {
          const row = document.querySelector(`.msg-row[onclick*="${im.id}"]`);
          if (row && !row.classList.contains('msg-intel-new')) row.classList.add('msg-intel-new');
        }
      });
    });
    delete G._prevMissionIds;
  }
  if (G.selected && !getMission(G.selected)) G.selected = null;

  // Monthly recap — every 30 days: presidential message + reset counters
  if (G.day - G.lastRecapDay >= 30) {
    sendPresidentialReview();
    G.lastRecapDay = G.day;
    G.monthOpsCompleted  = 0;
    G.monthOpsSucceeded  = 0;
    G.xpThisMonth        = 0;
  }
}

// =============================================================================
// TIME ADVANCEMENT — "CHECK MAIL" (inspired by Floor 13)
// Wraps advanceDay() to skip ahead until something significant happens.
// =============================================================================

function advanceToNextEvent() {
  let daysAdvanced = 0;
  const maxDays = 7;
  let eventOccurred = false;

  while (daysAdvanced < maxDays && !eventOccurred) {
    const prevMissionCount = G.missions.length;
    const prevStatuses = {};
    for (const m of G.missions) prevStatuses[m.id] = m.status;
    const prevConf = G.confidence;

    const prevIntelCount = G.intelMessages.length;
    advanceDay();
    daysAdvanced++;

    // Check if something significant happened
    if (G.missions.length !== prevMissionCount) eventOccurred = true;
    if (G.intelMessages.length !== prevIntelCount) eventOccurred = true; // new intel arrived
    for (const m of G.missions) {
      if (prevStatuses[m.id] && prevStatuses[m.id] !== m.status) eventOccurred = true;
    }
    if (G.day % 7 === 0) eventOccurred = true; // weekly briefing
    if (Math.abs(G.confidence - prevConf) >= 5) eventOccurred = true; // big confidence shift
    if (G.confidence <= 0 || G.budget <= 0) { eventOccurred = true; break; }
  }

  // Auto-switch to inbox if new intel or missions arrived
  const hasNewInbox = G.missions.some(m => m.status === 'INCOMING' && m.dayReceived === G.day)
    || G.intelMessages.some(m => !m.read);
  if (hasNewInbox && G.currentFolder !== 'inbox') {
    G.currentFolder = 'inbox';
    G.selected = null;
    G.selectedType = null;
    render();
  }

  // Show time skip interstitial
  if (daysAdvanced > 1) {
    const newMsgs = G.missions.filter(m =>
      !['EXECUTING', 'ARCHIVED'].includes(m.status)
    ).length + G.intelMessages.filter(m => !m.read).length;

    const overlay = document.createElement('div');
    overlay.className = 'time-skip-overlay';
    overlay.innerHTML = `
      <div class="time-skip-box">
        <div class="time-skip-days">${daysAdvanced} DAYS</div>
        <div class="time-skip-msg">TIME ADVANCED</div>
        <div class="time-skip-new">${newMsgs} message${newMsgs !== 1 ? 's' : ''} in inbox</div>
        <div style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);margin-top:4px">${formatGameDate(G.day)}</div>
      </div>
    `;
    function dismissOverlay() {
      if (overlay.classList.contains('time-skip-out')) return;
      overlay.classList.add('time-skip-out');
      setTimeout(() => overlay.remove(), 350);
    }
    overlay.addEventListener('click', dismissOverlay);
    document.body.appendChild(overlay);
    setTimeout(dismissOverlay, 2500);
  }
}

// =============================================================================
// FOLDER NAVIGATION
// =============================================================================

function switchFolder(folderId) {
  G.currentFolder = folderId;
  G.selected = null;
  G.selectedType = null;
  render();
}

function getFolderMissions(folderId) {
  switch (folderId) {
    case 'inbox':
      return G.missions.filter(m =>
        ['INCOMING', 'READY', 'BLOWN', 'PHASE_COMPLETE', 'DEAD_END', 'EXPIRED'].includes(m.status));
    case 'pending':
      return G.missions.filter(m => m.status === 'INVESTIGATING');
    case 'active':
      return G.missions.filter(m => m.status === 'EXECUTING');
    case 'results':
      return G.missions.filter(m => ['SUCCESS', 'FAILURE'].includes(m.status));
    case 'archive':
      return G.missions.filter(m => m.status === 'ARCHIVED').sort((a, b) => (b.archivedDay || 0) - (a.archivedDay || 0));
    default:
      return [];
  }
}

function getInboxIntelMessages() {
  return (G.intelMessages || []).filter(m => m.status !== 'ARCHIVED');
}

function getFolderCount(folderId) {
  switch (folderId) {
    case 'inbox':    return G.missions.filter(m => ['INCOMING', 'READY', 'BLOWN', 'PHASE_COMPLETE', 'DEAD_END', 'EXPIRED'].includes(m.status)).length + getInboxIntelMessages().filter(m => !m.read).length;
    case 'pending':  return G.missions.filter(m => m.status === 'INVESTIGATING').length;
    case 'active':   return G.missions.filter(m => m.status === 'EXECUTING').length;
    case 'results':  return G.missions.filter(m => ['SUCCESS', 'FAILURE'].includes(m.status)).length;
    case 'threats':  return G.hvts.filter(h => ['ACTIVE', 'TRACKED', 'DETAINED'].includes(h.status)).length;
    case 'agencies': return 0;
    case 'geo':      return G.geo?.activeEvents ? G.geo.activeEvents.filter(e => !e.resolved).length : 0;
    case 'archive':  return 0;
    default: return 0;
  }
}

function completeInvestigation(m) {
  const tmpl     = MISSION_TYPES[m.typeId];
  const phaseObj = m.isMultiPhase ? m.phases[m.currentPhaseIndex] : null;
  const effMap   = phaseObj?.invDeptEfficiency ?? tmpl?.invDeptEfficiency ?? {};
  const eff      = effMap[m.assignedInvDept] ?? 50;
  const outcome  = rollInvestigationOutcome(eff);
  m.assignedInvDept = null;
  m.lastInvOutcome  = outcome;

  if (outcome === 'CRITICAL_FAILURE') {
    m.blown = true; m.blownDaysLeft = 2; m.status = 'BLOWN';
    addLog(`⚠ CRITICAL: OP ${m.codename} — investigation compromised. Target alerted.`, 'log-warn');
    render(); return;
  }

  // Reveal fields based on outcome tier
  const hidden    = m.intelFields.filter(f => !f.revealed);
  const toReveal  = outcome === 'FAILURE'          ? 1
    : outcome === 'PARTIAL'         ? Math.ceil(hidden.length * 0.4)
    : outcome === 'SUCCESS'         ? Math.ceil(hidden.length * 0.7)
    : hidden.length; // CRITICAL_SUCCESS: all
  hidden.slice(0, toReveal).forEach(f => { f.revealed = true; });

  if (outcome === 'CRITICAL_SUCCESS') {
    m.intelBonus = true;
    addLog(`OP ${m.codename}: CRITICAL SUCCESS — all intel confirmed. Execution bonus +10%.`, 'log-success');
  } else {
    addLog(`Investigation complete: OP ${m.codename} — ${toReveal} intel field(s) revealed [${outcome}].`, 'log-info');
  }

  // Multi-phase false flag check
  if (m.isMultiPhase) {
    const ph = m.phases[m.currentPhaseIndex];
    if (ph.falseFlagChance > 0 && Math.random() < ph.falseFlagChance) {
      m.phaseFalseFlag     = true;
      m.phaseFalseFlagText = fillTemplate(pick(ph.falseFlagTexts), m.currentPhaseFillVars);
      addLog(`⚠ OP ${m.codename}: Investigation anomaly — review before proceeding.`, 'log-warn');
    }
  }

  // Wrong-suspect check
  if (m.suspects && m.suspects.length > 0 && m.selectedSuspectIdx !== null) {
    if (!m.suspects[m.selectedSuspectIdx].isTarget) {
      m.status = 'DEAD_END';
      addLog(`OP ${m.codename}: Investigation inconclusive — subject not linked to threat.`, 'log-warn');
      render(); return;
    }
  }

  m.status = 'READY';
  fire('investigation:complete', { mission: m, outcome });
}

function expireMission(m) {
  m.status = 'EXPIRED';
  // Clear any in-progress assignment so the dept unit is freed
  m.assignedInvDept   = null;
  m.assignedExecDepts = [];
  const confHit = -randInt(5, 12);
  G.confidence = clamp(G.confidence + confHit, 0, 100);
  addLog(`MISSION EXPIRED: OP ${m.codename}. Confidence ${confHit}%.`, 'log-fail');
}

// =============================================================================
// OPERATION RESOLUTION
// =============================================================================

function resolveOperation(m) {
  const success = Math.random() * 100 <= m.successProb;
  // Freeing resources: just clear the exec depts — deptAllocated won't count
  // non-EXECUTING missions so the capacity is freed automatically once status changes.

  const fillV = m.isMultiPhase ? m.currentPhaseFillVars : m.fillVars;
  const msg   = fillTemplate(pick(success ? m.successMsgs : m.failureMsgs), fillV);

  if (m.isMultiPhase) {
    completePhase(m, success ? 'SUCCESS' : 'FAILURE', msg);
  } else {
    G.opsCompleted++;
    G.monthOpsCompleted++;
    if (success) {
      m.status = 'SUCCESS';
      m._resultNew = true; // flag for result-reveal animation
      const confGain    = randInt(...m.confSuccess);
      const budgetReturn = Math.floor(m.assignedBudget * 0.1);
      G.confidence = clamp(G.confidence + confGain, 0, 100);
      if (budgetReturn > 0) G.budget = Math.min(G.budget + budgetReturn, 999);
      m.confDelta = confGain; m.budgetDelta = budgetReturn;
      m.resultMsg = msg;
      if (typeof window.generateDebrief === 'function') {
        m.debriefHtml = window.generateDebrief(m, true);
      }
      G.opsSucceeded++;
      G.monthOpsSucceeded++;
      gainXP(m.threat * 3, `OP ${m.codename} success`);
      const intelGain = Math.ceil(m.threat / 2);
      G.intel = (G.intel || 0) + intelGain;
      G.intelLifetime = (G.intelLifetime || 0) + intelGain;
      registerOrUpdateHvt(m);
      addLog(`SUCCESS: OP ${m.codename}. +${confGain}% confidence, +${intelGain} Intel.`, 'log-success');
    } else {
      m.status = 'FAILURE';
      m._resultNew = true; // flag for result-reveal animation
      const confLoss = randInt(...m.confFail);
      G.confidence = clamp(G.confidence + confLoss, 0, 100);
      m.confDelta = confLoss; m.budgetDelta = 0;
      m.resultMsg = msg;
      if (typeof window.generateDebrief === 'function') {
        m.debriefHtml = window.generateDebrief(m, false);
      }
      gainXP(1, `OP ${m.codename} (failed)`);
      registerOrUpdateHvtFailed(m);
      addLog(`FAILURE: OP ${m.codename}. ${confLoss}% confidence.`, 'log-fail');
    }
    fire('operation:resolved', { mission: m, success });
    // Agency favor relation delta
    if (m.favorOf && G.relations?.[m.favorOf]) {
      const rel   = G.relations[m.favorOf];
      const delta = success ? randInt(6, 12) : -randInt(8, 14);
      rel.relation = clamp(rel.relation + delta, 0, 100);
      if (success) rel.favorsCompleted++; else rel.favorsFailed++;
      addLog(`${success ? 'Favor complete' : 'Favor failed'}: ${m.favorAgencyName || m.favorOf} relation ${delta > 0 ? '+' : ''}${delta}.`, success ? 'log-info' : 'log-warn');
    }
  }
}

// =============================================================================
// MULTI-PHASE MANAGEMENT
// =============================================================================

function completePhase(m, result, msg) {
  const ph = m.phases[m.currentPhaseIndex];

  m.completedPhases.push({
    phaseIndex: m.currentPhaseIndex, phaseId: ph.id,
    phaseName: ph.name, shortName: ph.shortName, result, msg,
  });

  if (result === 'FAILURE') {
    G.opsCompleted++;
    G.monthOpsCompleted++;
    m.status = 'FAILURE';
    const confLoss = randInt(...m.confFail);
    G.confidence = clamp(G.confidence + confLoss, 0, 100);
    m.confDelta = confLoss; m.budgetDelta = 0;
    m.resultMsg = msg;
    gainXP(1, `OP ${m.codename} phase failed`);
    fire('operation:resolved', { mission: m, success: false });
    addLog(`FAILURE: OP ${m.codename} [${ph.shortName}]. ${confLoss}% confidence.`, 'log-fail');
    return;
  }

  const confGain = randInt(...m.confSuccess);
  if (confGain > 0) {
    G.confidence = clamp(G.confidence + confGain, 0, 100);
    addLog(`PHASE COMPLETE: OP ${m.codename} — ${ph.shortName}. +${confGain}% confidence.`, 'log-success');
  } else {
    addLog(`PHASE COMPLETE: OP ${m.codename} — ${ph.shortName}. Proceeding.`, 'log-info');
  }

  if (ph.spawnsFollowUp && !m.followUpSpawned) {
    spawnFollowUpMission(m, ph);
    m.followUpSpawned = true;
  }

  const nextIdx = m.currentPhaseIndex + 1;
  if (nextIdx < m.phases.length) {
    m.lastPhaseMsg       = msg;
    m.lastPhaseName      = ph.name;
    m.lastPhaseShortName = ph.shortName;
    m.lastPhaseConfDelta = confGain;
    m.currentPhaseIndex  = nextIdx;
    m.status             = 'PHASE_COMPLETE';
    initPhaseFields(m);
  } else {
    G.opsCompleted++;
    G.monthOpsCompleted++;
    G.opsSucceeded++;
    G.monthOpsSucceeded++;
    m.status = 'SUCCESS';
    const budgetReturn = Math.floor(m.assignedBudget * 0.1);
    if (budgetReturn > 0) G.budget = Math.min(G.budget + budgetReturn, 999);
    m.confDelta = confGain; m.budgetDelta = budgetReturn;
    m.resultMsg = msg;
    gainXP(m.threat * 4, `OP ${m.codename} full chain`);
    registerOrUpdateHvt(m);
    fire('operation:resolved', { mission: m, success: true });
    addLog(`SUCCESS: OP ${m.codename} — Full operation complete. +${confGain}% confidence.`, 'log-success');
  }
}

const HANDLER_ALIASES = [
  // tradecraft & botanical codenames (no animals, no "THE X", no objects)
  'NIGHTSHADE', 'MERCURY', 'FULCRUM', 'GREMLIN', 'KINGPIN', 'MAGPIE',
  'VOSTOK', 'CALICO', 'HEMLOCK', 'BELLADONNA', 'FOXGLOVE', 'OLEANDER',
  'ACONITE', 'DIGITALIS', 'CURARE', 'STRYCHNINE', 'ARSENIC', 'RICIN',
  'SAFFRON', 'CINNABAR', 'QUICKSILVER', 'GALLIUM', 'RADIUM', 'CESIUM',
  'MERIDIAN', 'AZIMUTH', 'VERTEX', 'TANGENT', 'PARALLAX', 'PERIHELION',
  'SOLSTICE', 'EQUINOX', 'APOGEE', 'PERIGEE', 'ECLIPSE', 'TRANSIT',
  'RUBICON', 'VOLGA', 'DANUBE', 'TIGRIS', 'EUPHRATES', 'GANGES',
  'BOSPHORUS', 'DARDANELLES', 'GIBRALTAR', 'SUEZ', 'PANAMA', 'HORMUZ',
  'ALCHEMY', 'CRUCIBLE', 'CATALYST', 'REAGENT', 'ISOTOPE', 'FISSION',
  'CORONA', 'AURORA', 'NEBULA', 'QUASAR', 'PULSAR', 'MAGNETAR',
];

function pickUniqueAlias(pool) {
  const used = new Set(G.hvts.map(h => h.alias));
  const avail = pool.filter(a => !used.has(a));
  return pick(avail.length > 0 ? avail : pool);
}

function spawnFollowUpMission(m, phase) {
  const intelText = pick(phase.followUpIntelTexts || []);
  if (intelText) addLog(`INTELLIGENCE LEAD — OP ${m.codename}: ${intelText}`, 'log-info');
  spawnMission(phase.spawnsFollowUp);

  // Register the identified target as an ACTIVE HVT in the threats tab
  const handlerRole = m.fillVars?.handler_description || 'foreign intelligence officer — identity obtained through interrogation';
  const alias = pickUniqueAlias(HANDLER_ALIASES);
  const followUpMission = G.missions[0]; // spawnMission unshifts
  const hvtId = `H${++G.hvtIdCounter}`;
  G.hvts.push({
    id: hvtId,
    type: 'HVT',
    alias: alias,
    role: handlerRole,
    org: m.category || 'COUNTER-ESPIONAGE',
    threat: m.threat,
    location: 'FOREIGN',
    status: 'ACTIVE',
    knownFields: { city: followUpMission?.city || null, country: followUpMission?.country || null },
    gaps: ['Exact location unknown', 'Cover identity not confirmed'],
    linkedMissionIds: followUpMission ? [m.id, followUpMission.id] : [m.id],
    addedDay: G.day,
    detainedAt: null,
    detainedDay: null,
    interrogationCount: 0,
    surveillanceEstablished: false,
    handedTo: null,
    hardness: classifyHvtHardness(handlerRole),
  });
  // Link follow-up mission to this HVT
  if (followUpMission) followUpMission.linkedHvtId = hvtId;
  addLog(`NEW THREAT: ${alias} — ${handlerRole}. Added to threat tracker.`, 'log-warn');
  hvtBriefingPopup('newTarget', G.hvts[G.hvts.length - 1], { codename: m.codename, detail: 'Identified through interrogation of detained subject during OP ' + (m.codename || '???') + '.' });
}

// =============================================================================
// MISSION MANAGEMENT ACTIONS
// =============================================================================

function selectMission(id) { G.selected = id; G.selectedType = 'mission'; render(); }

// Inline confirmation panel — slides open below the clicked button
window._pendingConfirmAction = null;
window.confirmAction = function(btnEl, message, actionFn) {
  // Remove any existing confirm panel
  const existing = document.querySelector('.inline-confirm');
  if (existing) { existing.remove(); }

  window._pendingConfirmAction = actionFn;
  const panel = document.createElement('div');
  panel.className = 'inline-confirm';
  panel.innerHTML = `
    <div class="inline-confirm-inner">
      <div class="inline-confirm-msg">${message}</div>
      <div class="inline-confirm-actions">
        <button class="btn-primary btn-sm" onclick="dismissConfirm(this, true)">CONFIRM</button>
        <button class="btn-neutral btn-sm" onclick="dismissConfirm(this, false)">CANCEL</button>
      </div>
    </div>
  `;
  btnEl.parentElement.insertBefore(panel, btnEl.nextSibling);
  panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
};

// Animated dismiss for inline confirm panels
window.dismissConfirm = function(btnEl, doAction) {
  const panel = btnEl.closest('.inline-confirm');
  if (!panel) return;
  if (doAction && window._pendingConfirmAction) {
    window._pendingConfirmAction();
  }
  window._pendingConfirmAction = null;
  panel.classList.add('inline-confirm-out');
  setTimeout(() => panel.remove(), 300);
};

// Follow a mission to whatever folder it now belongs in
function followMission(missionId) {
  const m = getMission(missionId);
  if (!m) { G.selected = null; render(); return; }
  const folderMap = {
    INCOMING: 'inbox', READY: 'inbox', BLOWN: 'inbox', PHASE_COMPLETE: 'inbox',
    DEAD_END: 'inbox', EXPIRED: 'inbox',
    INVESTIGATING: 'pending',
    EXECUTING: 'active',
    SUCCESS: 'results', FAILURE: 'results',
    ARCHIVED: 'archive',
  };
  const targetFolder = folderMap[m.status] || 'inbox';
  G.currentFolder = targetFolder;
  G.selected = missionId;
  G.selectedType = 'mission';
  render();
}
function selectIntelMessage(id) { G.selected = id; G.selectedType = 'intel'; const msg = G.intelMessages.find(m => m.id === id); if (msg) msg.read = true; render(); }
function acknowledgeIntelMessage(id) { G.intelMessages = G.intelMessages.filter(m => m.id !== id); G.selected = null; G.selectedType = null; render(); }

function assignInvestigation(missionId, deptId) {
  const m    = getMission(missionId);
  const dept = G.depts[deptId];
  if (!m || !dept) return;

  if (deptAvail(deptId) < 1) {
    const cfg = DEPT_CONFIG.find(d => d.id === deptId);
    addLog(`All ${cfg?.unitName || 'units'} of ${dept.name} are currently deployed. Wait for one to return.`, 'log-warn');
    render(); return;
  }
  if (!m.invDepts.includes(deptId)) {
    addLog(`${dept.name} cannot investigate this mission type.`, 'log-warn');
    render(); return;
  }

  m.status          = 'INVESTIGATING';
  m.assignedInvDept = deptId;
  m.invDaysLeft     = m.invDays;

  const phaseLabel = m.isMultiPhase ? ` (${m.phases[m.currentPhaseIndex].shortName})` : '';
  addLog(`${dept.name} assigned to OP ${m.codename}${phaseLabel}. Est. ${m.invDays} days.`, 'log-info');
  followMission(missionId);
}

function archiveMission(missionId) {
  const m = getMission(missionId);
  if (m) {
    m.status = 'ARCHIVED';
    m.archivedDay = G.day;
  }
  pruneArchive();
  // Stay in current folder, deselect
  G.selected = null;
  G.selectedType = null;
  render();
}

function pruneArchive() {
  const archived = G.missions.filter(m => m.status === 'ARCHIVED');
  if (archived.length > 10) {
    // Sort oldest first, remove oldest to keep the 10 most recent
    archived.sort((a, b) => (a.archivedDay || 0) - (b.archivedDay || 0));
    const toRemove = new Set(archived.slice(0, archived.length - 10).map(m => m.id));
    G.missions = G.missions.filter(x => !toRemove.has(x.id));
  }
}

function dismissMission(missionId) {
  const m = getMission(missionId);
  if (!m) return;
  // Queue handover message for next day delivery
  if (typeof window._queueHandover === 'function') window._queueHandover(m);
  // Clear any assignment — deptAllocated recomputes from active missions
  m.assignedInvDept   = null;
  m.assignedExecDepts = [];
  const confHit = m.threat >= 4 ? -randInt(5, 10) : 0;
  if (confHit < 0) {
    G.confidence = clamp(G.confidence + confHit, 0, 100);
    addLog(`OP ${m.codename} dismissed. Confidence ${confHit}%.`, 'log-warn');
  } else {
    addLog(`OP ${m.codename} dismissed.`);
  }
  G.missions = G.missions.filter(x => x.id !== missionId);
  G.selected = null;
  render();
}

window.acknowledgePhaseProceeding = function(missionId) {
  const m = getMission(missionId);
  if (!m || m.status !== 'PHASE_COMPLETE') return;
  m.status = 'INCOMING';
  addLog(`OP ${m.codename}: Proceeding to ${m.phases[m.currentPhaseIndex].name}.`, 'log-info');
  followMission(missionId);
};

window.falseFlagProceed = function(missionId) {
  const m = getMission(missionId);
  if (!m || !m.phaseFalseFlag) return;
  m.phaseFalseFlagPenalty = true;
  m.phaseFalseFlag        = false;
  addLog(`OP ${m.codename}: Proceeding despite anomaly. Success probability reduced.`, 'log-warn');
  render();
};

window.falseFlagReinvestigate = function(missionId) {
  const m = getMission(missionId);
  if (!m || !m.phaseFalseFlag) return;
  m.phaseFalseFlag        = false;
  m.phaseFalseFlagPenalty = false;
  m.invDays               = randInt(2, 3);
  m.invDaysLeft           = 0;
  m.status                = 'INCOMING';
  addLog(`OP ${m.codename}: Reinvestigation ordered.`, 'log-info');
  render();
};

window.deepenInvestigation = function(missionId) {
  const m = getMission(missionId);
  if (!m || m.status !== 'READY') return;
  let deepenDeptId = null;
  for (const did of m.invDepts) {
    if (deptAvail(did) > 0) { deepenDeptId = did; break; }
  }
  if (!deepenDeptId) {
    addLog(`No departments available to deepen investigation for OP ${m.codename}.`, 'log-warn');
    render(); return;
  }
  m.deepening       = true;
  m.status          = 'INVESTIGATING';
  m.assignedInvDept = deepenDeptId;
  m.invDaysLeft     = m.deepenDays;
  addLog(`Deep investigation initiated: OP ${m.codename}. ${G.depts[deepenDeptId].short} assigned for ${m.deepenDays} day(s).`, 'log-info');
  render();
};

// =============================================================================
// SUSPECT SELECTION
// =============================================================================

function buildSuspectPanel(m, selectable) {
  if (!m.suspects || m.suspects.length === 0) return '';
  const cards = m.suspects.map((s, i) => {
    if (s.eliminated) {
      return `<div class="suspect-card suspect-eliminated">
        <div class="suspect-alias">${s.alias}</div>
        <div class="suspect-role">${s.role}</div>
        <div class="suspect-confidence conf-low">ELIMINATED</div>
      </div>`;
    }
    const isSelected = m.selectedSuspectIdx === i;
    const confCls    = s.confidence === 'HIGH' ? 'conf-high' : s.confidence === 'MODERATE' ? 'conf-med' : 'conf-low';
    const selMark    = isSelected ? `<div class="suspect-selected-mark">✓ SELECTED</div>` : '';
    if (selectable && !isSelected) {
      return `<div class="suspect-card selectable" onclick="selectSuspect('${m.id}', ${i})">
        <div class="suspect-alias">${s.alias}</div>
        <div class="suspect-role">${s.role}</div>
        <div class="suspect-confidence ${confCls}">${s.confidence} CONFIDENCE</div>
      </div>`;
    }
    return `<div class="suspect-card ${isSelected ? 'selected' : ''}">
      <div class="suspect-alias">${s.alias}</div>
      <div class="suspect-role">${s.role}</div>
      <div class="suspect-confidence ${confCls}">${s.confidence} CONFIDENCE</div>
      ${selMark}
    </div>`;
  }).join('');
  return `<div class="suspect-grid">${cards}</div>`;
}

window.selectSuspect = function(missionId, idx) {
  const m = getMission(missionId);
  if (!m) return;
  m.selectedSuspectIdx = idx;
  addLog(`OP ${m.codename}: Suspect "${m.suspects[idx].alias}" selected as primary target.`, 'log-info');
  render();
};

window.reassignSuspect = function(missionId) {
  const m = getMission(missionId);
  if (!m || m.status !== 'DEAD_END') return;
  const idx = m.selectedSuspectIdx;
  if (idx !== null && m.suspects[idx]) m.suspects[idx].eliminated = true;
  m.selectedSuspectIdx = null;
  m.status             = 'INCOMING';
  m.urgencyLeft        = Math.max(0, m.urgencyLeft - 1);
  addLog(`OP ${m.codename}: Surveillance reassigned — suspect eliminated from consideration.`, 'log-warn');
  render();
};

// =============================================================================
// OPERATION MODAL
// =============================================================================

function getHvtHardnessPenalty(m) {
  if (!m.linkedHvtId || !G.hvts) return 0;
  const h = G.hvts.find(x => x.id === m.linkedHvtId);
  if (!h) return 0;
  if (h.hardness === 'ELITE') return 10;
  if (h.hardness === 'HARD') return 5;
  return 0;
}

// Unified probability calculation — single source of truth
function calcOpProbDetails(m, budget, depts, selectedSupport) {
  const items = [];
  const minBudget        = Math.max(1, Math.floor(m.baseBudget * 0.5));
  const falseFlagPenalty = m.phaseFalseFlagPenalty ? 25 : 0;
  const total            = m.intelFields?.length || 0;
  const revealed         = m.intelFields?.filter(f => f.revealed).length || 0;
  const intelSupportFields = (selectedSupport || [])
    .filter(s => s.bonusType === 'intelField')
    .reduce((sum, s) => sum + s.bonusValue, 0);
  const eliteIntelFields = (m.attachedEliteIds || []).reduce((sum, eid) => {
    const eu = (G.eliteUnits || []).find(u => u.id === eid);
    return sum + (eu && eu.alive && eu.intelFieldBonus && depts.includes(eu.deptId) ? eu.intelFieldBonus : 0);
  }, 0);
  const effectiveRevealed = Math.min(total, revealed + intelSupportFields + eliteIntelFields);
  const intelPenalty     = total > 0 ? Math.round((1 - effectiveRevealed / total) * 30) : 0;
  const intelBonusAmt    = (effectiveRevealed >= total && total > 0) ? 10 : (m.intelBonus ? 10 : 0);
  const blownPenalty     = m.blown ? 25 : 0;
  const hardnessPenalty  = getHvtHardnessPenalty(m);
  const agencyBonus      = (selectedSupport || [])
    .filter(s => s.bonusType === 'execProb')
    .reduce((sum, s) => sum + s.bonusValue, 0);
  const budgetContrib    = Math.round(clamp((budget - minBudget) / Math.max(1, m.baseBudget - minBudget), 0, 1) * 25);
  const recDepts         = depts.filter(d =>  m.execDepts.includes(d)).length;
  const optDepts         = depts.filter(d => !m.execDepts.includes(d)).length;

  items.push({ label: 'Base', value: 35 });
  if (budgetContrib)    items.push({ label: 'Budget allocation', value: budgetContrib });
  if (recDepts)         items.push({ label: `Recommended dept${recDepts > 1 ? 's' : ''} (×${recDepts})`, value: recDepts * 12 });
  if (optDepts)         items.push({ label: `Optional dept${optDepts > 1 ? 's' : ''} (×${optDepts})`, value: optDepts * 5 });
  if (intelBonusAmt)    items.push({ label: 'Full intel confirmed', value: intelBonusAmt });
  if (intelPenalty)     items.push({ label: `Unconfirmed intel (${effectiveRevealed}/${total})`, value: -intelPenalty });
  if (falseFlagPenalty) items.push({ label: 'Anomaly detected', value: -falseFlagPenalty });
  if (blownPenalty)     items.push({ label: 'Operation compromised', value: -blownPenalty });
  if (hardnessPenalty)  items.push({ label: `Target hardness (${hardnessPenalty === 10 ? 'ELITE' : 'HARD'})`, value: -hardnessPenalty });
  if (agencyBonus)      items.push({ label: 'Agency support', value: agencyBonus });

  let p = 35 - falseFlagPenalty - intelPenalty - blownPenalty - hardnessPenalty + intelBonusAmt + agencyBonus + budgetContrib + recDepts * 12 + optDepts * 5;
  const preHook = p;
  for (const fn of _hooks['calcProb:modify'] || []) p = fn({ mission: m, prob: p, budget, depts });
  const hookDelta = p - preHook;
  if (hookDelta !== 0) {
    const attached = (m.attachedEliteIds || []);
    let eliteBonus = 0;
    for (const eid of attached) {
      const eu = (G.eliteUnits || []).find(u => u.id === eid);
      if (eu && eu.alive && eu.bonusValue && depts.includes(eu.deptId)) eliteBonus += eu.bonusValue;
    }
    if (eliteBonus) items.push({ label: 'Elite operative', value: eliteBonus });
    if (m.plotId && G.plots) {
      const plot = G.plots.find(pl => pl.id === m.plotId);
      if (plot && plot.infiltrated && plot.status === 'ACTIVE') items.push({ label: 'Infiltration intel', value: 10 });
    }
    if (typeof getMissionTheaterId === 'function' && typeof getNetworkModifier === 'function') {
      const tid = getMissionTheaterId(m);
      if (tid) {
        const netMod = getNetworkModifier(tid);
        if (netMod !== 0) items.push({ label: 'Network modifier', value: netMod });
      }
    }
  }

  const clamped = clamp(p, 10, 92);
  return { total: clamped, items };
}

function calcOpProb(m, budget, depts, selectedSupport) {
  return calcOpProbDetails(m, budget, depts, selectedSupport).total;
}

function calcOpProbBreakdown(m, budget, depts, selectedSupport) {
  return calcOpProbDetails(m, budget, depts, selectedSupport);
}

function buildProbTooltip(breakdown) {
  let tip = 'PROBABILITY BREAKDOWN\n';
  for (let i = 0; i < breakdown.items.length; i++) {
    const it = breakdown.items[i];
    if (i === 0) { tip += `${it.label}: ${it.value}%\n`; continue; }
    const sign = it.value >= 0 ? '+' : '';
    tip += `${it.label}: ${sign}${it.value}%\n`;
  }
  tip += `─────────────\nResult: ${breakdown.total}% (clamped 10–92)`;
  return tip;
}

// Network modifier badge for mission cards and op config
function networkModBadge(m) {
  if (typeof getMissionTheaterId !== 'function' || typeof getNetworkModifier !== 'function') return '';
  const tid = getMissionTheaterId(m);
  if (!tid) return '';
  const mod = getNetworkModifier(tid);
  if (mod === 0) return '';
  const theater = typeof THEATERS !== 'undefined' && THEATERS[tid] ? THEATERS[tid].name : tid;
  if (mod > 0) return `<span class="dc-badge dc-badge-netmod dc-badge-netmod-pos" data-tip="Network strength in ${theater} provides a bonus to operations.">NETWORK: +${mod}%</span>`;
  return `<span class="dc-badge dc-badge-netmod dc-badge-netmod-neg" data-tip="Weak network presence in ${theater} penalizes operations.">NETWORK: ${mod}%</span>`;
}

function networkModNote(m) {
  if (typeof getMissionTheaterId !== 'function' || typeof getNetworkModifier !== 'function') return '';
  const tid = getMissionTheaterId(m);
  if (!tid) return '';
  const mod = getNetworkModifier(tid);
  if (mod === 0) return '';
  const theater = typeof THEATERS !== 'undefined' && THEATERS[tid] ? THEATERS[tid].name : tid;
  if (mod > 0) return `<div class="op-penalty-note op-penalty-bonus">★ NETWORK ADVANTAGE: +${mod}% success probability. Strong presence in ${theater}.</div>`;
  return `<div class="op-penalty-note op-penalty-blown">⚠ WEAK NETWORK: ${mod}% success probability. Insufficient presence in ${theater}.</div>`;
}

function hardnessBadge(m) {
  const pen = getHvtHardnessPenalty(m);
  if (!pen) return '';
  const label = pen === 10 ? 'ELITE' : 'HARD';
  return `<span class="dc-badge dc-badge-netmod dc-badge-netmod-neg" data-tip="${label} target: −${pen}% success probability.">TARGET: ${label} (−${pen}%)</span>`;
}

function hardnessNote(m) {
  const pen = getHvtHardnessPenalty(m);
  if (!pen) return '';
  const label = pen === 10 ? 'ELITE' : 'HARD';
  const desc = pen === 10
    ? 'Exceptional tradecraft and operational security. Expect maximum resistance.'
    : 'Professional-grade counter-surveillance and trained resistance.';
  return `<div class="op-penalty-note op-penalty-blown">⚠ ${label} TARGET: −${pen}% success probability. ${desc}</div>`;
}

function openOperationModal(missionId) {
  const m = getMission(missionId);
  if (!m) return;

  // Check if config panel already open — toggle it off
  const existing = document.getElementById('op-config-panel');
  if (existing) {
    existing.classList.add('op-config-closing');
    setTimeout(() => existing.remove(), 300);
    return;
  }

  const minBudget = Math.max(1, Math.floor(m.baseBudget * 0.5));
  const maxBudget = Math.min(G.budget, m.baseBudget * 2);
  const defBudget = Math.min(G.budget, m.baseBudget);

  if (maxBudget < minBudget) {
    addLog(`Insufficient budget for OP ${m.codename}. Need at least ${fmt(minBudget)}.`, 'log-warn');
    render(); return;
  }

  // Pre-select first available recommended dept
  let selectedDepts = [];
  for (const did of m.execDepts) {
    if (deptAvail(did) > 0) { selectedDepts = [did]; break; }
  }

  const penaltyNote = m.phaseFalseFlagPenalty
    ? `<div class="op-penalty-note">⚠ ANOMALY PENALTY: −25% success probability due to inconclusive investigation.</div>`
    : '';
  const _total    = m.intelFields?.length || 0;
  const _revealed = m.intelFields?.filter(f => f.revealed).length || 0;
  const _intelPen = _total > 0 ? Math.round((1 - _revealed / _total) * 30) : 0;
  const intelNote = _intelPen > 0
    ? `<div class="op-penalty-note op-penalty-fuzzy">⚠ PARTIAL INTEL: −${_intelPen}% success probability. ${_revealed}/${_total} fields confirmed.</div>`
    : (m.intelBonus ? `<div class="op-penalty-note op-penalty-bonus">★ CRITICAL INTEL BONUS: +10% success probability. All fields confirmed.</div>` : '');
  const blownNote = m.blown
    ? `<div class="op-penalty-note op-penalty-blown">⚠ TARGET ALERTED: −25% success probability. ${m.blownDaysLeft} day(s) until exfiltration.</div>`
    : '';
  window._currentOpSelectedSupport = [];
  const initProb = calcOpProb(m, defBudget, selectedDepts, []);

  // Build department rows: recommended first, then others
  // Restrict incompatible departments: FOREIGN_OPS can't do domestic, FIELD_OPS can't do foreign
  const restrictedDepts = m.location === 'DOMESTIC' ? ['FOREIGN_OPS'] : m.location === 'FOREIGN' ? ['FIELD_OPS', 'COUNTER_INTEL'] : [];

  // Fix stale execDepts from geopolitics relocation (safety net for old saves)
  if (m.location === 'FOREIGN' && m.execDepts.includes('FIELD_OPS')) {
    m.execDepts = m.execDepts.map(d => d === 'FIELD_OPS' ? 'FOREIGN_OPS' : d).filter(d => d !== 'COUNTER_INTEL');
  } else if (m.location === 'DOMESTIC' && m.execDepts.includes('FOREIGN_OPS')) {
    m.execDepts = m.execDepts.map(d => d === 'FOREIGN_OPS' ? 'FIELD_OPS' : d);
  }

  const buildDeptRow = (did, isRec) => {
    const dept  = G.depts[did];
    const cfg   = DEPT_CONFIG.find(d => d.id === did);
    const avail = deptAvail(did);
    const total = dept.capacity;
    const restricted = restrictedDepts.includes(did);
    const canSelect = avail > 0 && !restricted;
    const sel       = selectedDepts.includes(did);
    const restrictTip = restricted ? (did === 'FOREIGN_OPS' ? 'Foreign Operations cannot be deployed on domestic soil.' : did === 'COUNTER_INTEL' ? 'Counter-Intelligence operates exclusively within domestic jurisdiction.' : 'Domestic field teams have no jurisdiction abroad.') : '';
    return `<div class="modal-dept-check ${sel ? 'selected' : ''} ${canSelect ? '' : 'unavail'} ${restricted ? 'restricted' : ''}"
      data-dept="${did}" onclick="toggleExecDept('${did}','${missionId}')"
      data-tip="${restricted ? restrictTip : (cfg?.tip || '')}">
      <span class="modal-dept-check-name">${dept.short}</span>
      <span class="modal-dept-avail">${avail}/${total}</span>
      <span class="modal-dept-check-status" style="color:${isRec ? 'var(--accent)' : 'var(--text-dim)'};font-size:9px">${isRec ? 'REC' : 'OPT'}</span>
      <span class="modal-dept-check-status" style="color:${restricted ? 'var(--text-dim)' : avail > 0 ? 'var(--green)' : 'var(--red)'}">${restricted ? 'N/A' : avail > 0 ? 'AVAIL' : 'FULL'}</span>
    </div>`;
  };

  const recRows   = m.execDepts.filter(did => !restrictedDepts.includes(did)).map(did => buildDeptRow(did, true)).join('');
  const otherRows = DEPT_CONFIG.filter(d => !m.execDepts.includes(d.id))
                               .map(d => buildDeptRow(d.id, false)).join('');

  const configHtml = `
    <div id="op-config-panel" class="op-config-panel">
      <div class="op-config-inner">
        <div class="op-config-hdr">
          <span class="op-config-title">CONFIGURE OPERATION</span>
          <button class="op-config-close" onclick="openOperationModal('${missionId}')">✕</button>
        </div>
        ${penaltyNote}${intelNote}${blownNote}${networkModNote(m)}${hardnessNote(m)}
        <div class="op-config-section anim-section" style="animation-delay:0.05s">
          <div class="modal-section-title">OPERATION PLAN</div>
          <div class="op-narrative">${m.opNarrative}</div>
        </div>
        <div class="op-config-section anim-section" style="animation-delay:0.1s">
          <div class="modal-section-title">BUDGET ALLOCATION</div>
          <div style="font-size:11px;color:var(--text-dim);margin-bottom:10px">
            Minimum: ${fmt(minBudget)}. Recommended: ${fmt(m.baseBudget)}. More funding = higher success.
          </div>
          <div class="modal-slider-row">
            <label>BUDGET</label>
            <input type="range" id="op-budget" min="${minBudget}" max="${maxBudget}" value="${defBudget}"
              oninput="updateModalProb('${missionId}')"
              data-tip="Available: ${fmt(G.budget)}">
            <span class="modal-slider-val" id="op-budget-val">${fmt(defBudget)}</span>
          </div>
        </div>
        <div class="op-config-section anim-section" style="animation-delay:0.15s">
          <div class="modal-section-title">RECOMMENDED DEPARTMENTS <span style="font-size:9px;color:var(--text-dim)">(each +12% success)</span></div>
          <div class="modal-dept-grid">${recRows}</div>
        </div>
        <div class="op-config-section anim-section" style="animation-delay:0.2s">
          <div class="modal-section-title">OPTIONAL SUPPORT <span style="font-size:9px;color:var(--text-dim)">(each +5% success)</span></div>
          <div class="modal-dept-grid">${otherRows}</div>
        </div>
        ${G.cfg?.partnerAgencies ? `<div class="op-config-section anim-section" style="animation-delay:0.25s">
          <div class="modal-section-title">AGENCY SUPPORT <span style="font-size:9px;color:var(--text-dim)">(costs relation points)</span></div>
          <div class="modal-dept-grid">${
            Object.entries(G.cfg.partnerAgencies).filter(([, agCfg]) => {
              if (m.location === 'DOMESTIC') return agCfg.type === 'domestic';
              return agCfg.type === 'foreign' || agCfg.type === 'military';
            }).flatMap(([agencyId, agCfg]) =>
              (agCfg.support || []).map(s => {
                const rel = G.relations?.[agencyId]?.relation ?? 0;
                const can = rel >= s.cost;
                return `<div class="agency-support-check ${can ? '' : 'unavail'}"
                  data-agency="${agencyId}" data-support="${s.id}"
                  onclick="toggleAgencySupport('${agencyId}','${s.id}','${missionId}')"
                  data-tip="${s.desc}${can ? '' : '&#10;&#10;Insufficient relation points.'}">
                  <span class="as-agency-tag">${agCfg.shortName}</span>
                  <span class="as-label">${s.label}</span>
                  <span class="support-cost-badge ${can ? '' : 'unavail-cost'}">−${s.cost} REL</span>
                  <span class="support-bonus-badge">${s.bonusType === 'execProb' ? `+${s.bonusValue}%` : `+${s.bonusValue} INTEL`}</span>
                </div>`;
              })
            ).join('')
          }</div>
        </div>` : ''}
        ${typeof window.buildEliteUnitsHtml === 'function' ? `<div class="op-config-section anim-section" style="animation-delay:0.3s">${window.buildEliteUnitsHtml(missionId, m.execDepts)}</div>` : ''}
        <div class="op-config-section anim-section" style="animation-delay:0.35s">
          <div class="prob-display" id="prob-display-tip">
            <div class="prob-label">ESTIMATED SUCCESS PROBABILITY</div>
            <div class="prob-value ${initProb >= 70 ? 'prob-high' : initProb >= 45 ? 'prob-med' : 'prob-low'}" id="op-prob-wrap">
              <span id="op-prob">${initProb}%</span>
            </div>
          </div>
        </div>
        <div class="op-config-actions anim-section" style="animation-delay:0.4s">
          <button class="btn-primary" onclick="authAndExecute('${missionId}', this)">EXECUTE OPERATION</button>
          <button class="btn-neutral" onclick="openOperationModal('${missionId}')">CANCEL</button>
        </div>
      </div>
    </div>
  `;

  // Inject the config panel after the reply section in the reading pane
  const replyEl = document.querySelector('.email-reply');
  if (replyEl) {
    replyEl.insertAdjacentHTML('afterend', configHtml);
  } else {
    // Fallback: append to reading pane
    const paneEl = document.getElementById('reading-pane');
    if (paneEl) paneEl.insertAdjacentHTML('beforeend', configHtml);
  }

  // Set probability breakdown tooltip
  const probTipEl = document.getElementById('prob-display-tip');
  if (probTipEl) probTipEl.setAttribute('data-tip', buildProbTooltip(calcOpProbBreakdown(m, defBudget, selectedDepts, [])));

  // Scroll the config panel into view
  const panel = document.getElementById('op-config-panel');
  if (panel) setTimeout(() => panel.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);

  window._currentOpMission       = missionId;
  window._currentOpSelectedDepts = selectedDepts;
  window._currentOpSelectedElites = [];
  if (typeof window.refreshEliteRelevance === 'function') window.refreshEliteRelevance();
}

window.toggleExecDept = function(deptId, missionId) {
  const m = getMission(missionId);
  // Enforce location restrictions
  if (m) {
    if (m.location === 'DOMESTIC' && deptId === 'FOREIGN_OPS') return;
    if (m.location === 'FOREIGN' && (deptId === 'FIELD_OPS' || deptId === 'COUNTER_INTEL')) return;
  }
  const arr = window._currentOpSelectedDepts;
  const idx = arr.indexOf(deptId);
  if (idx >= 0) {
    arr.splice(idx, 1);
  } else {
    if (deptAvail(deptId) < 1) return; // can't add a full dept
    arr.push(deptId);
  }
  document.querySelectorAll('.modal-dept-check').forEach(el => {
    if (el.dataset.dept === deptId) el.classList.toggle('selected', arr.includes(deptId));
  });
  if (typeof window.refreshEliteRelevance === 'function') window.refreshEliteRelevance();
  window.updateModalProb(missionId);
};

window.toggleAgencySupport = function(agencyId, supportId, missionId) {
  const m = getMission(missionId);
  if (!m) return;
  const agCfg   = G.cfg?.partnerAgencies?.[agencyId];
  const support = agCfg?.support?.find(s => s.id === supportId);
  if (!support) return;
  const rel = G.relations?.[agencyId]?.relation ?? 0;
  if (rel < support.cost) return; // insufficient relation
  const arr = window._currentOpSelectedSupport;
  const idx = arr.findIndex(x => x.supportId === supportId);
  if (idx >= 0) {
    arr.splice(idx, 1);
  } else {
    arr.push({ agencyId, supportId, label: support.label, bonusType: support.bonusType, bonusValue: support.bonusValue, cost: support.cost });
  }
  const selected = idx < 0; // true if we just added it
  document.querySelectorAll('.agency-support-check').forEach(el => {
    if (el.dataset.agency === agencyId && el.dataset.support === supportId)
      el.classList.toggle('selected', selected);
  });
  window.updateModalProb(missionId);
};

window.updateModalProb = function(missionId) {
  const m = getMission(missionId);
  if (!m) return;
  const bi = document.getElementById('op-budget');
  if (!bi) return;
  const b  = parseInt(bi.value);
  const bv = document.getElementById('op-budget-val');
  if (bv) bv.textContent = fmt(b);
  // Temporarily attach elite IDs so calcProb:modify hook can pick them up
  const prevElites = m.attachedEliteIds;
  m.attachedEliteIds = window._currentOpSelectedElites || [];
  const depts = window._currentOpSelectedDepts || [];
  const support = window._currentOpSelectedSupport || [];
  const p       = calcOpProb(m, b, depts, support);
  const breakdown = calcOpProbBreakdown(m, b, depts, support);
  m.attachedEliteIds = prevElites; // restore
  const probEl  = document.getElementById('op-prob');
  const probWrap = document.getElementById('op-prob-wrap');
  const probDisp = document.getElementById('prob-display-tip');
  if (probEl)   probEl.textContent = `${p}%`;
  if (probWrap) probWrap.className = 'prob-value ' + (p >= 70 ? 'prob-high' : p >= 45 ? 'prob-med' : 'prob-low');
  if (probDisp) probDisp.setAttribute('data-tip', buildProbTooltip(breakdown));
};

window.authAndExecute = function(missionId, btnEl) {
  if (!btnEl) { window.executeOperation(missionId); return; }
  btnEl.disabled = true;

  // Animate cancel button out and center the execute button
  const actionsRow = btnEl.closest('.op-config-actions');
  const cancelBtn = actionsRow?.querySelector('.btn-neutral');
  if (cancelBtn) {
    cancelBtn.style.width = cancelBtn.offsetWidth + 'px';
    cancelBtn.style.overflow = 'hidden';
    cancelBtn.offsetHeight; // force reflow
    cancelBtn.classList.add('btn-fade-out');
  }

  if (actionsRow) actionsRow.classList.add('op-actions-centering');

  // Replace button content with spinner
  btnEl.innerHTML = '<span class="op-spinner"></span> PROCESSING';
  btnEl.classList.add('btn-processing');

  setTimeout(() => {
    window.executeOperation(missionId);
  }, 1200);
};

window.executeOperation = function(missionId) {
  const m = getMission(missionId);
  if (!m) return;
  const bi     = document.getElementById('op-budget');
  const budget = bi ? parseInt(bi.value) : m.baseBudget;
  const depts  = window._currentOpSelectedDepts || [];
  const agSupport = window._currentOpSelectedSupport || [];

  if (G.budget < budget) { addLog('Insufficient budget.', 'log-warn'); render(); return; }

  // Verify dept availability (re-check at commit time)
  for (const did of depts) {
    if (deptAvail(did) < 1) {
      const cfg = DEPT_CONFIG.find(d => d.id === did);
      addLog(`${cfg?.name || did} has no available ${cfg?.unitName || 'units'}.`, 'log-warn');
      render(); return;
    }
  }

  G.budget -= budget;

  // Apply agency support: deduct relation costs + reveal intel fields for intelField bonuses
  m.agencySupport = [];
  for (const s of agSupport) {
    if (G.relations?.[s.agencyId]) {
      G.relations[s.agencyId].relation = clamp(G.relations[s.agencyId].relation - s.cost, 0, 100);
    }
    if (s.bonusType === 'intelField') {
      const hidden = m.intelFields?.filter(f => !f.revealed) || [];
      for (let i = 0; i < s.bonusValue && i < hidden.length; i++) hidden[i].revealed = true;
    }
    m.agencySupport.push(s);
  }

  // Attach elite units and start their cooldown
  m.attachedEliteIds  = (window._currentOpSelectedElites || []).slice();
  for (const eid of m.attachedEliteIds) {
    const eu = (G.eliteUnits || []).find(u => u.id === eid);
    if (eu) eu.lastDeployedDay = G.day;
  }
  m.successProb       = calcOpProb(m, budget, depts, agSupport);
  m.status            = 'EXECUTING';
  m.execDaysLeft      = m.execDays;
  m.assignedBudget    = budget;
  m.assignedExecDepts = depts;
  // Note: deptAllocated automatically increases because status=EXECUTING and depts are listed

  const phaseLabel   = m.isMultiPhase ? ` [${m.phases[m.currentPhaseIndex].shortName}]` : '';
  const supportNote  = agSupport.length ? ` · ${agSupport.length} agency support` : '';
  const eliteNote    = m.attachedEliteIds.length ? ` · ${m.attachedEliteIds.length} elite unit(s)` : '';
  addLog(`OP ${m.codename}${phaseLabel} launched. ${fmt(budget)} · ${depts.length} dept(s)${supportNote}${eliteNote} · ETA ${m.execDays}d.`, 'log-info');
  hideModal(); // still safe to call — no-ops if modal isn't open
  followMission(m.id);
  // Launch glow on the reading pane
  requestAnimationFrame(() => {
    const pane = document.getElementById('reading-pane');
    if (pane) {
      const wrap = pane.querySelector('.email-wrap') || pane.firstElementChild;
      if (wrap) { wrap.classList.add('op-launching'); wrap.addEventListener('animationend', () => wrap.classList.remove('op-launching'), { once: true }); }
    }
  });
};

// =============================================================================
// PRESIDENTIAL MONTHLY REVIEW
// =============================================================================

// --- US messages (DJT voice) ---
const PRES_MSGS_US = {
  great: [
    "Director — Tremendous month. Truly tremendous. Many people are saying this is the best intelligence work they've ever seen, and frankly, I agree. I picked you, so really this is also my success. Maybe mostly my success. But you helped.",
    "Just got your numbers. Incredible. The best numbers. Nobody's had numbers like this, maybe ever. I showed them to the Joint Chiefs and they were speechless. Literally could not speak. That's how good you are. Almost as good as me.",
    "Director — I want you to know, I always believed in you. Even when other people — very weak people, by the way — said we should replace you, I said no. I said this person is a winner. And I was right. I'm always right.",
    "Beautiful work this month. Really beautiful. Like a perfect phone call. The senators are calling ME now, saying 'Sir, your intelligence agency is doing an incredible job.' They actually call me Sir, they do.",
    "You know what they're saying on the news? They're saying your agency is doing great. Even the fake news is saying it. When THEY admit it, you know it's really something special. Congratulations. I take full credit.",
    "Director — Fox & Friends mentioned your operations this morning. Very positively. I TiVo'd it. I've watched it three times. Your success rate is almost as high as my electoral college margin, which was historic by the way.",
    "I told the Prime Minister about your work and he couldn't believe it. His intelligence people are terrible — not like ours. Ours are the best. You're the best. After me, obviously.",
    "Your numbers are so good I almost didn't believe them. I said 'are these real?' They said yes. I said 'check again.' Still real. Fantastic. Nobody does intelligence like we do intelligence.",
    "Director — People are saying this might be the greatest month in intelligence history. I don't know if that's true but a lot of people are saying it. Smart people. The best people. Many of them work for me.",
    "The First Lady read your report and said 'wow.' Just 'wow.' She doesn't say wow very often. I've only gotten maybe ten or fifteen wows, tops. So that's very impressive. Very impressive.",
  ],
  good: [
    "Director — Good month. Not great — I've seen great, believe me, I invented great — but good. Solid. Like a B+. I was always an A+ student myself but B+ is fine for you.",
    "Your report came in. I read it. Well, I looked at the graphs. The graphs were going up. Up is good. I like up. Keep making things go up and we won't have any problems.",
    "Not bad, Director. Not bad. The fake news hasn't mentioned us once this month, which means nobody screwed up badly enough to notice. In this business, that's basically a medal.",
    "Director — My advisors say you're doing 'adequately.' I told them adequate is a very low-energy word, but they said it's actually fine. So — fine. You're fine. Keep being fine.",
    "I mentioned your agency at Mar-a-Lago last weekend. Nobody booed. In fact, a very important person — I can't say who, but very important — said 'sounds like they know what they're doing.' High praise.",
    "Your numbers are decent. Could be better, could be worse. Like a well-done steak. Some people say that's wrong but I say it's exactly how it should be. With ketchup. The point is, keep going.",
    "Director — The NSC meeting about your department only lasted 12 minutes. That's almost a record. My meetings are usually much shorter because I make decisions very quickly, but 12 minutes is good for regular people.",
    "Looked at your success rate. It's okay. It's like my golf handicap — there's room for improvement but it's still better than most people's. And most people are not very good. At golf or intelligence.",
    "Director — You're doing a solid job. Not a spectacular job, but solid. Like the wall. The wall is solid. Very solid. Nobody builds walls like me but your intelligence work is somewhat wall-like in its solidity.",
    "Things are stable. I like stable. Stable genius — that's what they call me. You're not a genius, but you're stable, and that's half the equation. The important half is the genius part, which is mine.",
  ],
  meh: [
    "Director — I looked at your monthly numbers and I have to be honest, they're not great. And I know great. I'm very familiar with great. These numbers are not it. Sad!",
    "Your report is sitting on my desk. It's been sitting there for three days because every time I pick it up I get a little depressed. Not very depressed — I don't get depressed, I'm a very positive person — but a little.",
    "Director — People are starting to talk. Not good talk. The kind of talk that happens before someone gets a very nice letter thanking them for their service. I'm not saying that's happening. But people are talking.",
    "I showed your numbers to a friend of mine — very successful guy, tremendous businessman — and he said 'Sir, I would fire that person.' I said let's give them another month. You're welcome. Don't waste it.",
    "Director — The Democrats are asking questions about your agency. THE DEMOCRATS. When the Democrats notice something is wrong, it's really wrong, because usually they can't find their own offices. Think about that.",
    "Your success rate this month reminds me of a casino I used to own. Not one of the good ones. One of the ones that had 'challenges.' We don't talk about those anymore. Like we might not talk about you.",
    "Director — I don't want to say I'm disappointed because that's a very strong word and I use words very carefully. But if there was a word between 'fine' and 'disappointed,' that would be the word. Find that word.",
    "The Vice President offered to take over your daily briefings. THE VICE PRESIDENT. Nobody wants that. Get your numbers up before I have to let him do something.",
    "Director — My approval ratings went down 1.5 points this month. Now, I'm not saying that's your fault. But I'm not NOT saying it either. Just... do better.",
    "I played golf this weekend and my caddie — great guy, very smart for a caddie — asked if everything was okay with national security. A CADDIE is worried. That's where we are right now.",
  ],
  bad: [
    "Director — This is a disaster. A total disaster. I've seen disasters — I've fixed many disasters, some of the biggest disasters ever — and this is definitely one. Your numbers are a catastrophe. Worse than CNN's ratings, and that's saying something.",
    "I just read your monthly report and honestly, I think my phone autocorrect could run your agency better. It changed 'intelligence' to 'unintelligence' the other day and I'm starting to think it was right.",
    "Director — Very bad month. The worst month. People are saying it might be the worst month in the history of intelligence, and intelligence has been around for a very long time. Since at least the 1800s. Maybe longer.",
    "I had a meeting with the Joint Chiefs today. They didn't mention your agency at all. NOT EVEN ONCE. They've given up on you. When the military gives up on you, that's very bad. Almost as bad as your numbers.",
    "Director — I'm going to be very direct with you. I'm a very direct person, everyone says so. Your performance is terrible. Just terrible. I've seen better work from my interns, and my interns are mostly there for the photos.",
    "Your agency's performance this month makes my impeachment hearings look like a spa day. And I HATED those hearings. Do you understand how bad you have to be to make impeachment look relaxing? That bad.",
    "Director — I talked to Putin last week. Even HE said your agency seems to be struggling. PUTIN. When your enemies feel sorry for you, it's time to take a long, hard look in the mirror. A very long look.",
    "The fake news is actually being NICE to me this week because your failures make such good content they don't need to attack me anymore. You've united the country, Director. Against your own competence.",
    "Director — I'm not going to fire you. Yet. But I want you to know that I've already mentally redecorated your office for your replacement. I'm thinking gold curtains. Very classy. Much better than whatever's happening in there now.",
    "Spoke with several world leaders today. They all asked the same question: 'Is everything okay over there?' No. No it is not. It is the opposite of okay. Please fix this before I have to explain your numbers at the G7. Again.",
  ],
};

// --- UK messages (dry, understated, PM voice) ---
const PRES_MSGS_UK = {
  great: [
    "Director — I reviewed your monthly figures over tea this morning. I shall not exaggerate, as that would be unseemly, but they are... rather good. The Cabinet Secretary nearly raised an eyebrow. For him, that's practically a standing ovation.",
    "Your operational record this month is the sort of thing one doesn't mention at dinner but privately feels rather smug about. Well done. I've informed the Palace that things are, and I quote, 'in hand.'",
    "Director — The Intelligence and Security Committee has nothing critical to say about your department. I want you to understand how extraordinary that sentence is. They have something critical to say about oxygen.",
    "Splendid work. The Home Secretary described your performance as 'not entirely displeasing,' which in Westminster is the equivalent of a ticker-tape parade. I suggest you frame those words.",
    "Your numbers have arrived and I must say, they restore one's faith in the civil service. Not entirely — let's not go mad — but measurably. The Chief of Defence Staff sent what I believe was meant to be a compliment. Hard to tell with military types.",
    "Director — I mentioned your agency at PMQs and the Leader of the Opposition had nothing to say. Nothing. Do you understand how unprecedented that is? The man objects to the weather. You've silenced him. Remarkable.",
    "I shared your results with the Foreign Secretary over a rather decent claret. He said 'finally.' One word, but from him, that's Shakespearean praise. Carry on exactly as you are.",
    "Your department has performed with a quiet competence that is, frankly, the most British thing I've encountered since a queue formed spontaneously at the Palace gates. Well done.",
    "Director — The Americans called to ask how we're managing such results with our budget. I told them it was a combination of expertise and not spending forty million on office furniture. They didn't laugh. I did.",
    "This month's briefing was the first in my tenure that didn't require a stiff drink afterwards. I'd call that progress. The Deputy PM called it 'adequate,' which from her is practically romantic.",
  ],
  good: [
    "Director — Your monthly report arrived. It's fine. Not the sort of fine that means someone is about to cry, but genuinely, unremarkably fine. In government, that's rather an achievement.",
    "Decent month. Nothing caught fire, nobody defected, and The Guardian hasn't published anything embarrassing about us. That's three wins by Whitehall standards. Four if you count the catering improving.",
    "Director — I reviewed your numbers between the Home Affairs Committee and a very tedious reception at Lancaster House. They were, on balance, acceptable. Rather like the canapés.",
    "Your performance is steady. The Permanent Secretary described it as 'within parameters.' He describes everything as within parameters, including his own marriage, so take from that what you will.",
    "Director — Things appear to be ticking along. The weekly intelligence briefing lasted only nine minutes, which means nothing went spectacularly wrong. Nine minutes. A personal best for this government.",
    "I showed your report to the Defence Secretary. He nodded. Not enthusiastically — the man doesn't do enthusiasm — but it was a definite nod. Upward motion. Chin involved. Positive.",
    "Your agency is performing with the reliable mediocrity of a British Rail service that arrives only four minutes late. Honestly, I mean that as a compliment. We've all recalibrated our expectations in this job.",
    "Director — The backbenchers haven't asked a single question about intelligence this month. Blessed, beautiful silence. If you can maintain this level of invisibility, we shall get along famously.",
    "Reviewed your figures. Success rate is respectable. Not the sort of thing one writes home about, but then one doesn't write home about intelligence matters at all, so the point is rather moot.",
    "Director — My Chief of Staff summarised your month as 'uneventful.' Given that the last three months were described as 'concerning,' 'alarming,' and 'Tuesday' respectively, I'd call that an improvement.",
  ],
  meh: [
    "Director — Your monthly figures have arrived and I shall be diplomatic. They are not what one would call encouraging. Nor what one would call catastrophic. They inhabit a sort of grey middle ground, like Swindon.",
    "I've been studying your report. It has the unmistakable quality of something written by people who are working very hard and achieving remarkably little. Like Brexit negotiations, but with more acronyms.",
    "Director — The Home Secretary has used the phrase 'room for improvement,' which in Westminster means 'I am composing your resignation letter in my head.' Consider this a friendly warning.",
    "Your success rate is, to put it charitably, inconsistent. The Chancellor compared it to the economy, which was not the compliment he thought it was. Neither found it amusing.",
    "Director — I don't wish to be harsh, but my constituency postman has a better completion rate than your operations this month. He's called Derek. Derek is outperforming British intelligence. Reflect on that.",
    "The Intelligence Committee chair took me aside after Prime Minister's Questions to express 'gentle concern.' When a politician uses the word 'gentle,' they mean the opposite. Sort it out.",
    "Director — I've received a letter from the Shadow Home Secretary. It was polite, which means it was threatening. She's noticed. When the Opposition notices, one has approximately three weeks before it becomes a headline.",
    "Your numbers remind me of England's cricket performance — occasional flashes of brilliance surrounded by vast expanses of confusion. We both know how that usually ends. Poorly.",
    "Director — The Palace enquired whether 'everything was quite alright' with national security. When the Palace enquires, it is not actually a question. It is a command wrapped in politeness. Do better.",
    "I met with the heads of MI5 and MI6 yesterday. They were both, in their own uniquely passive-aggressive ways, rather critical of your coordination. When those two agree on anything, one should worry.",
  ],
  bad: [
    "Director — I shall be blunt, which as you know is not my natural inclination. Your monthly performance is appalling. The sort of appalling that generates select committee inquiries and very long editorials in The Times.",
    "Your report arrived this morning. I read it twice, hoping I'd misunderstood something fundamental. I hadn't. The Chief of Defence Staff has begun sentences with 'when your replacement arrives,' which I found presumptuous but understandable.",
    "Director — The Americans have offered to 'help.' The AMERICANS. The country that spells 'colour' wrong has offered to assist with our intelligence operations. I cannot adequately convey how humiliating that is.",
    "I had to address the 1922 Committee yesterday. A backbencher asked if we still had an intelligence service. He wasn't joking. Nobody laughed. The silence was excruciating, rather like your operational record.",
    "Director — Downing Street has received more complaint letters about your agency than about the council tax increase. The council tax went up seventeen percent. Think about what that means.",
    "The Daily Mail is running a three-part investigation into intelligence failures. Part one landed this morning. It was accurate. I hate it when they're accurate. Part two publishes Thursday. Fix something before then.",
    "Director — I've been Prime Minister for long enough to know when something has gone properly wrong, as opposed to the usual low-level wrongness. This is the first sort. The proper sort. The career-ending sort, if uncorrected.",
    "I showed your figures to the Cabinet. The room went quiet in the specific way it goes quiet before someone suggests a reshuffle. I defended you. I shouldn't have had to. Don't make me do it again.",
    "Director — The French intelligence service sent a sympathy card. I am not joking. It arrived via diplomatic bag. Handwritten. They included a bottle of burgundy. This is the lowest point of my premiership.",
    "Your monthly performance has been raised at the NATO security council. BY OUR ALLIES. They're worried about us, Director. The Belgians are worried about us. Belgium. A country that once couldn't form a government for 589 days is concerned about our competence.",
  ],
};

// --- France messages (literary, philosophical, Président voice) ---
const PRES_MSGS_FR = {
  great: [
    "Directeur — J'ai lu votre rapport ce matin. Enfin, un document qui ne me donne pas envie de démissionner. Vos résultats sont excellents. Comme on dit à l'Élysée : 'Ce n'est pas un désastre.' Chez nous, c'est le plus beau compliment.",
    "Bravo. Le Conseil de Défense a été étonné par vos chiffres, ce qui est remarquable car ces gens ne sont étonnés par rien, pas même par la qualité catastrophique du café de l'Élysée.",
    "Directeur — Votre travail ce mois-ci est le genre de chose qui me réconcilie presque avec la bureaucratie française. Presque. Ne poussons pas trop loin l'optimisme, on est en France.",
    "Le Premier Ministre m'a appelé pour me féliciter de vos résultats. Je lui ai rappelé que c'est MOI qui vous ai nommé. Il y a eu un silence. Un bon silence. Le silence d'un homme qui sait qu'il a perdu un point.",
    "Directeur — J'ai mentionné vos opérations lors du dîner avec la Chancelière allemande. Elle a dit 'impressionnant.' Une Allemande qui dit 'impressionnant' à propos du renseignement français — on n'avait pas vu ça depuis la Résistance.",
    "Vos résultats sont superbes. Le Ministre de la Défense m'a demandé votre secret. Je lui ai dit que c'était le talent et un budget dérisoire. Il n'a pas ri. Moi si. Deux fois.",
    "Directeur — Le Quai d'Orsay est ravi. Le QUAI D'ORSAY. Ces gens ne sont jamais ravis. Ils sont 'satisfaits,' parfois 'pas mécontents,' mais jamais ravis. Vous avez accompli l'impossible.",
    "J'ai lu vos chiffres entre deux crises ministérielles. Ils m'ont presque mis de bonne humeur. Vous êtes la seule chose dans ce gouvernement qui fonctionne comme prévu. Et peut-être l'ascenseur du bloc B.",
    "Directeur — Les Américains sont jaloux de nos résultats. LES AMÉRICAINS. Avec leur budget qui fait dix fois le nôtre. Comme quoi, l'argent ne fait pas le renseignement. Mais il aide, soyons honnêtes.",
    "Votre mois a été exceptionnel. J'envisage de vous décorer. Pas la Légion d'Honneur — on la donne à n'importe qui de nos jours — mais quelque chose. Un mot gentil, peut-être. C'est plus rare.",
  ],
  good: [
    "Directeur — Votre rapport est arrivé. Il est correct. Pas brillant, pas catastrophique. Correct. En France, c'est le mot qu'on utilise quand on ne veut froisser personne tout en étant vaguement déçu.",
    "Mois convenable. Le Secrétaire Général de la Défense a qualifié vos résultats de 'satisfaisants.' C'est le mot qu'il utilise aussi pour décrire la cantine de Matignon, alors calibrez vos attentes.",
    "Directeur — Les chiffres sont raisonnables. Comme un bourgogne de supermarché : on ne s'en vante pas, mais ça fait le travail. On espère quand même mieux le mois prochain.",
    "J'ai survolé votre bilan entre une réforme des retraites et une grève SNCF. Il m'a semblé acceptable. Mais à ce stade de la journée, tout me semble acceptable tant que ça ne prend pas feu.",
    "Directeur — Le Conseil de Défense a duré seize minutes. C'est un record de brièveté. En France, les réunions courtes sont suspectes, mais je choisis d'y voir un signe positif.",
    "Vos résultats sont dans la moyenne. La moyenne française, certes, qui est plus haute que la plupart. C'est un compliment géographique. Prenez-le comme vous voudrez.",
    "Directeur — Rien de spectaculaire, rien de honteux. Vous êtes le fonctionnaire que la République mérite : compétent, discret, et légèrement sous-payé. Continuez.",
    "Le Ministre de l'Intérieur n'a rien dit sur votre département ce mois-ci. En politique française, le silence est un cadeau. Un cadeau rare, fragile, et temporaire. Profitez-en.",
    "Directeur — J'ai montré vos chiffres au Directeur de Cabinet. Il a haussé un sourcil. UN sourcil. L'autre est resté immobile. C'est un résultat mitigé, sourcilièrement parlant.",
    "Mois solide. Pas le genre de mois qui inspire un discours, mais le genre qui ne provoque pas de motion de censure. En France, c'est déjà une victoire.",
  ],
  meh: [
    "Directeur — Vos chiffres sont... comment dire... décevants. Pas le genre de déception qui provoque un remaniement. Plutôt le genre qui provoque un soupir long et philosophique, suivi d'un deuxième café.",
    "J'ai lu votre rapport. Puis j'ai regardé par la fenêtre pendant dix minutes en me demandant si De Gaulle avait ce genre de problèmes. Il en avait probablement. Ça ne me console pas.",
    "Directeur — Le Quai d'Orsay qualifie vos performances de 'perfectibles.' C'est le mot que les diplomates utilisent quand ils veulent dire 'lamentable' mais qu'ils sont trop bien élevés pour le dire.",
    "Vos résultats me rappellent la cuisine d'un restaurant qui a perdu son étoile Michelin. Techniquement comestible. Officiellement décevant. On sent qu'il y a eu mieux autrefois.",
    "Directeur — L'Assemblée Nationale commence à poser des questions. LES DÉPUTÉS. Les mêmes qui ne trouvent pas le bouton pour voter commencent à s'inquiéter de notre renseignement. Mesurez l'ironie.",
    "Le Ministre de la Défense m'a suggéré de 'reconsidérer certaines nominations.' Il ne vous a pas nommé directement. Il n'avait pas besoin de le faire. La subtilité française est un art cruel.",
    "Directeur — Ma cote de popularité a baissé de deux points. En France, la cote du Président baisse toujours, c'est une tradition nationale. Mais je préférerais que ce ne soit pas à cause de vous.",
    "J'ai dîné avec le Président du Sénat hier soir. Il m'a posé des questions sur votre agence avec une douceur suspecte. En politique, la douceur est le prélude au couteau.",
    "Directeur — Les résultats sont médiocres. Je ne dis pas ça pour être cruel. Je le dis parce que quelqu'un doit le dire, et en France, c'est toujours le Président qui dit les choses désagréables. C'est dans la Constitution. Presque.",
    "Votre taux de réussite est comparable à celui du système ferroviaire français : en théorie excellent, en pratique... variable. On s'habitue, mais on ne devrait pas.",
  ],
  bad: [
    "Directeur — Je vais être direct, ce qui en France est un acte de bravoure. Vos résultats sont catastrophiques. Le genre de catastrophe qui fait la une du Canard Enchaîné et les délices de l'opposition.",
    "Votre rapport mensuel est le document le plus déprimant que j'ai lu depuis le dernier rapport du Commissariat au Plan. Et celui-là parlait de l'effondrement démographique. Le vôtre est pire, car il est évitable.",
    "Directeur — Les Britanniques m'ont envoyé un message de 'solidarité.' LES BRITANNIQUES. Le pays du Brexit nous offre sa solidarité en matière de renseignement. On en est là. On en est exactement là.",
    "J'ai dû répondre à une question au Conseil Européen sur nos capacités de renseignement. Le Premier Ministre luxembourgeois avait l'air inquiet. LE LUXEMBOURG S'INQUIÈTE POUR NOUS. Le Luxembourg.",
    "Directeur — Le Canard Enchaîné a publié un dessin de votre agence. Vous êtes représenté en canard sans tête. C'est injuste. Les canards sans tête sont au moins rapides. Vos opérations ne le sont pas.",
    "Le Conseil de Défense a duré trois heures. TROIS HEURES. La dernière fois qu'un Conseil de Défense a duré aussi longtemps, c'était pendant une vraie guerre. Nous ne sommes pas en guerre. Nous sommes juste incompétents.",
    "Directeur — J'ai envisagé de vous remplacer par un algorithme. Mon conseiller numérique dit que ce serait 'techniquement faisable et possiblement préférable.' Il ne plaisantait pas. Moi non plus.",
    "Les Américains ont proposé de nous 'prêter' des analystes. PRÊTER. Comme on prête un parapluie à quelqu'un qui a oublié le sien. Sauf que le parapluie, c'est notre souveraineté, et il pleut très fort.",
    "Directeur — Ma femme m'a demandé si 'tout allait bien au travail.' Elle ne pose jamais cette question. Elle a lu Le Monde. Le Monde a lu votre bilan. Tout le monde a lu votre bilan. C'est un désastre public.",
    "Je me suis réveillé ce matin en pensant à Napoléon. Pas pour les victoires — pour Sainte-Hélène. C'est là où finissent les dirigeants qui s'entourent de gens qui ne font pas leur travail. Je n'irai pas à Sainte-Hélène, Directeur.",
  ],
};

function sendPresidentialReview() {
  const ops = G.monthOpsCompleted;
  const wins = G.monthOpsSucceeded;
  const rate = ops > 0 ? wins / ops : 0;
  const conf = G.confidence;

  const countryMsgs = G.country === 'UK' ? PRES_MSGS_UK : G.country === 'FRANCE' ? PRES_MSGS_FR : PRES_MSGS_US;

  let tier;
  if (conf >= 70 && rate >= 0.7)      tier = 'great';
  else if (conf >= 45 && rate >= 0.5)  tier = 'good';
  else if (conf >= 25 || rate >= 0.3)  tier = 'meh';
  else                                  tier = 'bad';

  const msg = pick(countryMsgs[tier]);
  const leader = G.cfg?.leaderFormal || 'Mr. President';
  const statsLine = `<div style="margin-top:14px;padding:10px 12px;border:1px solid var(--border);border-radius:4px;background:var(--bg-2);font-family:var(--font-mono);font-size:10px;line-height:1.8;color:var(--text-dim)">
    MONTHLY PERFORMANCE REVIEW — DAY ${G.day}<br>
    Operations completed: <span style="color:var(--text)">${ops}</span> ·
    Successes: <span style="color:var(--green)">${wins}</span> ·
    Failures: <span style="color:var(--red)">${ops - wins}</span><br>
    Public confidence: <span style="color:${conf >= 60 ? 'var(--green)' : conf >= 35 ? 'var(--amber)' : 'var(--red)'}">${conf}%</span> ·
    XP earned: <span style="color:var(--accent)">+${G.xpThisMonth}</span> ·
    XP bank: <span style="color:var(--accent)">${G.xp}</span>
  </div>`;

  queueBriefingPopup({
    title: `MONTHLY REVIEW — FROM THE DESK OF ${leader.toUpperCase()}`,
    category: 'POLITICAL',
    subtitle: `Confidence: ${conf}% · Success rate: ${ops > 0 ? Math.round(rate * 100) : '—'}%`,
    accent: conf >= 50 ? 'rgba(0,201,167,0.85)' : 'rgba(243,156,18,0.85)',
    body: `<div style="font-style:italic;color:var(--text);line-height:1.8">${msg}</div>${statsLine}`,
    buttonLabel: ops > 0 ? 'ACKNOWLEDGED' : 'NOTED',
  });

  addLog(`Monthly review from ${leader}. Confidence: ${conf}%.`, conf >= 50 ? 'log-info' : 'log-warn');
}

// =============================================================================
// CAPABILITIES / MONTHLY RECAP
// =============================================================================

// Budget upgrade caps
const BUDGET_UPGRADES = [
  { id: 'budgetRegen', label: '+2M weekly budget regen', xpCost: 8,  maxPurchases: 4,
    apply: () => { G.cfg.weeklyBudgetRegen += 2; } },
  { id: 'budgetCap',   label: '+10M max budget cap',     xpCost: 15, maxPurchases: 3,
    apply: () => { G.cfg.budget += 10; } },
];

const INSTANT_UPGRADES = [
  { id: 'cashInfusion', label: '+$5M immediate budget', xpCost: 100,
    apply: () => { G.budget = Math.min(G.budget + 5, G.cfg.budget); } },
];

function showCapabilitiesMenu(isMonthly = false) {
  const prevXP   = G.xp - G.xpThisMonth;
  const monthXP  = G.xpThisMonth;

  const monthSummaryHtml = isMonthly ? `
    <div class="recap-summary">
      <div class="recap-stat-row">
        <div class="recap-stat"><span class="recap-val">${G.monthOpsCompleted}</span><span class="recap-lbl">OPS THIS MONTH</span></div>
        <div class="recap-stat"><span class="recap-val" style="color:var(--green)">${G.monthOpsSucceeded}</span><span class="recap-lbl">SUCCESSES</span></div>
        <div class="recap-stat"><span class="recap-val" style="color:var(--red)">${G.monthOpsCompleted - G.monthOpsSucceeded}</span><span class="recap-lbl">FAILURES</span></div>
        <div class="recap-stat"><span class="recap-val" style="color:var(--accent)">+${monthXP}</span><span class="recap-lbl">XP EARNED</span></div>
      </div>
    </div>` : '';

  const renderUpgradeRows = () => {
    let html = '';

    // Department upgrades
    for (const dcfg of DEPT_CONFIG) {
      const dept     = G.depts[dcfg.id];
      const purchased = G.upgrades[dcfg.id] || 0;
      const countryMax = (G.cfg.deptMaxCapacities && G.cfg.deptMaxCapacities[dcfg.id]) || dcfg.maxCapacity;
      const maxExtra  = countryMax - dept.capacity; // remaining upgrades possible
      const cost      = dcfg.xpCostPerUnit;
      const canAfford = G.xp >= cost;
      const canBuy    = maxExtra > 0 && canAfford;
      html += `<div class="upgrade-row" id="upg-${dcfg.id}">
        <div class="upgrade-info">
          <span class="upgrade-label">${dcfg.name}</span>
          <span class="upgrade-current">+1 ${dcfg.unitNameSingle} &nbsp;<span style="color:var(--text-dim)">(${dept.capacity} → ${dept.capacity + 1}${maxExtra <= 0 ? ' — MAX' : ''})</span></span>
        </div>
        <div class="upgrade-cost-wrap">
          <span class="upgrade-cost">${cost} XP</span>
          <button class="btn-upgrade ${canBuy ? '' : 'disabled'}" ${canBuy ? '' : 'disabled'}
            onclick="buyUpgrade('dept','${dcfg.id}')">ACQUIRE</button>
        </div>
      </div>`;
    }

    // Budget upgrades
    for (const bu of BUDGET_UPGRADES) {
      const purchased = G.upgrades[bu.id] || 0;
      const mxP = (bu.id === 'budgetRegen' && G.cfg.maxBudgetRegen !== undefined) ? G.cfg.maxBudgetRegen
                : (bu.id === 'budgetCap' && G.cfg.maxBudgetCap !== undefined) ? G.cfg.maxBudgetCap
                : bu.maxPurchases;
      const remaining = mxP - purchased;
      const canAfford = G.xp >= bu.xpCost;
      const canBuy    = remaining > 0 && canAfford;
      html += `<div class="upgrade-row" id="upg-${bu.id}">
        <div class="upgrade-info">
          <span class="upgrade-label">${bu.label}</span>
          <span class="upgrade-current" style="color:var(--text-dim)">(${remaining > 0 ? `${remaining} remaining` : 'MAX'})</span>
        </div>
        <div class="upgrade-cost-wrap">
          <span class="upgrade-cost">${bu.xpCost} XP</span>
          <button class="btn-upgrade ${canBuy ? '' : 'disabled'}" ${canBuy ? '' : 'disabled'}
            onclick="buyUpgrade('budget','${bu.id}')">ACQUIRE</button>
        </div>
      </div>`;
    }

    // Instant upgrades (unlimited purchases)
    for (const iu of INSTANT_UPGRADES) {
      const canAfford = G.xp >= iu.xpCost;
      html += `<div class="upgrade-row" id="upg-${iu.id}">
        <div class="upgrade-info">
          <span class="upgrade-label">${iu.label}</span>
          <span class="upgrade-current" style="color:var(--text-dim)">(unlimited)</span>
        </div>
        <div class="upgrade-cost-wrap">
          <span class="upgrade-cost">${iu.xpCost} XP</span>
          <button class="btn-upgrade ${canAfford ? '' : 'disabled'}" ${canAfford ? '' : 'disabled'}
            onclick="buyUpgrade('instant','${iu.id}')">ACQUIRE</button>
        </div>
      </div>`;
    }

    return html;
  };

  document.getElementById('modal-title').textContent =
    isMonthly ? `MONTHLY OPERATIONAL REVIEW — DAY ${G.day}` : 'CAPABILITIES & UPGRADES';

  document.getElementById('modal-body').innerHTML = `
    ${monthSummaryHtml}
    <div class="xp-bank-display">
      <span class="xp-bank-label">XP BANK</span>
      <span class="xp-bank-val" id="xp-bank-current">${G.xp} XP</span>
    </div>
    <div class="modal-section">
      <div class="modal-section-title">DEPARTMENT RESOURCES</div>
      <div id="upgrade-list">${renderUpgradeRows()}</div>
    </div>
    <div class="modal-actions">
      <button class="btn-neutral" onclick="hideModal()">CONTINUE</button>
    </div>
  `;
  showModal();
}

window.buyUpgrade = function(type, id) {
  const dept = G.depts[id];
  const dcfg = DEPT_CONFIG.find(d => d.id === id);

  if (type === 'dept') {
    if (!dcfg || !dept) return;
    const cost     = dcfg.xpCostPerUnit;
    const countryMax = (G.cfg.deptMaxCapacities && G.cfg.deptMaxCapacities[id]) || dcfg.maxCapacity;
    const maxExtra = countryMax - dept.capacity;
    if (maxExtra <= 0 || G.xp < cost) return;
    G.xp -= cost;
    dept.capacity++;
    G.upgrades[id] = (G.upgrades[id] || 0) + 1;
    addLog(`UPGRADE: +1 ${dcfg.unitNameSingle} for ${dcfg.name}. Capacity now ${dept.capacity}.`, 'log-info');
  } else if (type === 'budget') {
    const bu = BUDGET_UPGRADES.find(b => b.id === id);
    if (!bu) return;
    const purchased = G.upgrades[id] || 0;
    const maxP = (id === 'budgetRegen' && G.cfg.maxBudgetRegen !== undefined) ? G.cfg.maxBudgetRegen
               : (id === 'budgetCap' && G.cfg.maxBudgetCap !== undefined) ? G.cfg.maxBudgetCap
               : bu.maxPurchases;
    if (purchased >= maxP || G.xp < bu.xpCost) return;
    G.xp -= bu.xpCost;
    G.upgrades[id] = purchased + 1;
    bu.apply();
    addLog(`UPGRADE: ${bu.label}.`, 'log-info');
  } else if (type === 'instant') {
    const iu = INSTANT_UPGRADES.find(u => u.id === id);
    if (!iu || G.xp < iu.xpCost) return;
    G.xp -= iu.xpCost;
    iu.apply();
    addLog(`UPGRADE: ${iu.label}.`, 'log-info');
  }

  // Refresh modal body in-place
  const xpEl = document.getElementById('xp-bank-current');
  if (xpEl) xpEl.textContent = `${G.xp} XP`;
  const listEl = document.getElementById('upgrade-list');
  if (listEl) {
    // Re-render upgrade rows
    let html = '';
    for (const d of DEPT_CONFIG) {
      const dpt      = G.depts[d.id];
      const cMax     = (G.cfg.deptMaxCapacities && G.cfg.deptMaxCapacities[d.id]) || d.maxCapacity;
      const maxExtra = cMax - dpt.capacity;
      const cost     = d.xpCostPerUnit;
      const canBuy   = maxExtra > 0 && G.xp >= cost;
      html += `<div class="upgrade-row" id="upg-${d.id}">
        <div class="upgrade-info">
          <span class="upgrade-label">${d.name}</span>
          <span class="upgrade-current">+1 ${d.unitNameSingle} &nbsp;<span style="color:var(--text-dim)">(${dpt.capacity} → ${dpt.capacity + 1}${maxExtra <= 0 ? ' — MAX' : ''})</span></span>
        </div>
        <div class="upgrade-cost-wrap">
          <span class="upgrade-cost">${cost} XP</span>
          <button class="btn-upgrade ${canBuy ? '' : 'disabled'}" ${canBuy ? '' : 'disabled'}
            onclick="buyUpgrade('dept','${d.id}')">ACQUIRE</button>
        </div>
      </div>`;
    }
    for (const bu of BUDGET_UPGRADES) {
      const purchased = G.upgrades[bu.id] || 0;
      const mxP = (bu.id === 'budgetRegen' && G.cfg.maxBudgetRegen !== undefined) ? G.cfg.maxBudgetRegen
                : (bu.id === 'budgetCap' && G.cfg.maxBudgetCap !== undefined) ? G.cfg.maxBudgetCap
                : bu.maxPurchases;
      const remaining = mxP - purchased;
      const canBuy    = remaining > 0 && G.xp >= bu.xpCost;
      html += `<div class="upgrade-row" id="upg-${bu.id}">
        <div class="upgrade-info">
          <span class="upgrade-label">${bu.label}</span>
          <span class="upgrade-current" style="color:var(--text-dim)">(${remaining > 0 ? `${remaining} remaining` : 'MAX'})</span>
        </div>
        <div class="upgrade-cost-wrap">
          <span class="upgrade-cost">${bu.xpCost} XP</span>
          <button class="btn-upgrade ${canBuy ? '' : 'disabled'}" ${canBuy ? '' : 'disabled'}
            onclick="buyUpgrade('budget','${bu.id}')">ACQUIRE</button>
        </div>
      </div>`;
    }
    for (const iu of INSTANT_UPGRADES) {
      const canAfford = G.xp >= iu.xpCost;
      html += `<div class="upgrade-row" id="upg-${iu.id}">
        <div class="upgrade-info">
          <span class="upgrade-label">${iu.label}</span>
          <span class="upgrade-current" style="color:var(--text-dim)">(unlimited)</span>
        </div>
        <div class="upgrade-cost-wrap">
          <span class="upgrade-cost">${iu.xpCost} XP</span>
          <button class="btn-upgrade ${canAfford ? '' : 'disabled'}" ${canAfford ? '' : 'disabled'}
            onclick="buyUpgrade('instant','${iu.id}')">ACQUIRE</button>
        </div>
      </div>`;
    }
    listEl.innerHTML = html;
  }
  render(); // update header XP display
};

// =============================================================================
// GAME OVER
// =============================================================================

function checkGameOver() {
  if (G.confidence <= 0) {
    triggerGameOver('DISMISSED', `${G.cfg.leaderFormal} has lost confidence in your leadership. You have been relieved of command.`);
  } else if (G.budget <= 0 && G.day % 7 === 0) {
    triggerGameOver('DEFUNDED', 'The agency has been defunded. Without resources, operations cannot continue.');
  }
}

function triggerGameOver(title, msg) {
  document.getElementById('go-title').textContent = title;
  document.getElementById('go-message').textContent = msg;
  document.getElementById('go-stats').innerHTML = `
    <div class="go-stat go-stagger" style="--stagger:0"><span class="go-stat-val">${G.day}</span><span class="go-stat-lbl">DAYS</span></div>
    <div class="go-stat go-stagger" style="--stagger:1"><span class="go-stat-val">${G.opsSucceeded}</span><span class="go-stat-lbl">SUCCESSES</span></div>
    <div class="go-stat go-stagger" style="--stagger:2"><span class="go-stat-val">${G.opsCompleted}</span><span class="go-stat-lbl">OPERATIONS</span></div>
    <div class="go-stat go-stagger" style="--stagger:3"><span class="go-stat-val">${G.xp}</span><span class="go-stat-lbl">TOTAL XP</span></div>
  `;
  showScreen('gameover');
}

// =============================================================================
// HVT / THREAT TRACKER
// =============================================================================

window.switchRightTab = function(tab) {
  document.querySelectorAll('.panel-tab').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.right-tab-pane').forEach(p => p.classList.remove('active'));
  document.getElementById(`tab-${tab}`)?.classList.add('active');
  document.getElementById(`right-tab-${tab}`)?.classList.add('active');
};

const BLACK_SITE_NAMES = [
  'Black Site ECHO-7', 'Black Site FOXTROT', 'Safe House BRAVO-4',
  'Forward Site DELTA', 'Auxiliary Site KILO', 'Station WHISKEY-3',
  'Camp NIGHTFALL', 'Annex SIGMA', 'Facility REDLINE', 'Site COBALT',
  'Black Site ALPHA-2', 'Forward Base TITAN', 'Extraction Point ZULU',
];

const SURVEILLANCE_TYPES = new Set(['HVT_SURVEILLANCE_DOM', 'HVT_SURVEILLANCE_FOR']);
const ABDUCTION_TYPES    = new Set(['HVT_ABDUCTION_DOM', 'HVT_ABDUCTION_FOR']);

const AGENCY_FAVOR_TYPES = {
  BUREAU:   ['FAVOR_BUREAU_SURVEILLANCE', 'FAVOR_BUREAU_DISRUPTION', 'FAVOR_BUREAU_DETENTION'],
  AGENCY:   ['FAVOR_AGENCY_RENDITION', 'FAVOR_AGENCY_EXTRACTION', 'FAVOR_AGENCY_COVER'],
  MILITARY: ['FAVOR_MIL_RESCUE', 'FAVOR_MIL_SIGINT', 'FAVOR_MIL_STRIKE'],
};

function weightedPick(arr) {
  const total = arr.reduce((s, x) => s + x.weight, 0);
  let r = Math.random() * total;
  for (const x of arr) { r -= x.weight; if (r <= 0) return x; }
  return arr[arr.length - 1];
}


const HVT_REGISTER_TYPES = new Set([
  'FOREIGN_HVT', 'DOMESTIC_HVT', 'RENDITION', 'SURVEILLANCE_TAKEDOWN', 'LONG_HUNT_HVT', 'MOLE_HUNT',
  'HVT_SURVEILLANCE_DOM', 'HVT_SURVEILLANCE_FOR', 'HVT_ABDUCTION_DOM', 'HVT_ABDUCTION_FOR',
  'FAVOR_BUREAU_DETENTION', 'FAVOR_AGENCY_RENDITION',
  'DOMESTIC_TERROR', 'COUNTER_INTEL', 'ASSET_RESCUE', 'REGIME_OP',
]);
const HVT_FAIL_TYPES      = new Set(['FOREIGN_HVT', 'DOMESTIC_HVT', 'LONG_HUNT_HVT', 'DOMESTIC_TERROR', 'COUNTER_INTEL']);
// Types that produce a TRACKED status (surveillance only — no capture)
const HVT_TRACKED_TYPES   = new Set(['HVT_SURVEILLANCE_DOM', 'HVT_SURVEILLANCE_FOR']);
// Types that produce DETAINED status (target captured)
const HVT_DETAINED_TYPES  = new Set(['RENDITION', 'SURVEILLANCE_TAKEDOWN', 'FAVOR_BUREAU_DETENTION', 'FAVOR_AGENCY_RENDITION', 'HVT_ABDUCTION_DOM', 'HVT_ABDUCTION_FOR']);

function hvtAliasFromMission(m) {
  if (m.selectedSuspectIdx !== null && m.suspects?.[m.selectedSuspectIdx])
    return m.suspects[m.selectedSuspectIdx].alias;
  var v = m.fillVars || {};
  return v.alias || v.target_alias || v.suspect_name || v.detention_subject || v.rendition_target || v.extraction_target || v.codename || 'UNKNOWN';
}
function hvtRoleFromMission(m) {
  if (m.selectedSuspectIdx !== null && m.suspects?.[m.selectedSuspectIdx])
    return m.suspects[m.selectedSuspectIdx].role;
  var v = m.fillVars || {};
  return v.hvt_role || v.target_role || v.rendition_role || v.subject_profile || 'Unknown';
}

// =============================================================================
// HVT BRIEFING POP-UPS — vivid flavor text for threat lifecycle events
// =============================================================================

const HVT_POPUP_TEXT = {
  newTarget: {
    intros: [
      'A name has surfaced — pulled from the noise of intercepted transmissions, cross-referenced against a dozen watchlists. The analysts are certain: this one is real.',
      'Field reporting and signals intelligence have converged on a single individual. The profile is thin, but the threat signature is unmistakable.',
      'A new face in the file. Flagged during the aftermath of OP {codename}, this individual has been assessed as a person of operational interest.',
      'The intelligence is fragmentary but consistent. Someone is operating in the shadows — directing, financing, or facilitating hostile activity. We have a name.',
      'Buried in the operational debris of a recent mission, a thread emerged. Pulled carefully, it led to a previously unknown individual with concerning connections.',
      'An analyst working the overnight shift noticed an anomaly in the pattern of life data. By morning, a new file had been opened.',
    ],
    category: 'THREAT IDENTIFICATION',
    accent: 'rgba(243, 156, 18, 0.9)',
  },
  newTargetFailed: {
    intros: [
      'The operation failed — but not without producing intelligence. In the wreckage of OP {codename}, a name was recovered. Someone we hadn\'t seen before.',
      'It was a costly failure. But the one thing worse than a blown operation is a blown operation that teaches nothing. This one gave up a name.',
      'The target slipped through. But in the chaos of the failed extraction, a new thread was pulled. We may have lost the battle, but we found the next one.',
      'Post-mortem analysis of the failed operation has flagged a previously unknown individual. The connection is circumstantial — but in this business, coincidence is a luxury we cannot afford.',
      'The failure stings. But the debrief produced something unexpected — a name, a location, a pattern of movement. Someone we need to watch.',
    ],
    category: 'POST-OP INTELLIGENCE',
    accent: 'rgba(231, 76, 60, 0.85)',
  },
  tracked: {
    intros: [
      'Surveillance is in place. Eyes on the target around the clock — cameras, microphones, a rotating team of watchers. They don\'t know we\'re there. Not yet.',
      'The surveillance net has been deployed. Every movement, every contact, every phone call — all being recorded. The target is now living inside our observation.',
      'The watchers are in position. Three teams rotating twelve-hour shifts, supported by SIGINT intercepts and overhead imagery. The target is under continuous observation.',
      'A careful web of surveillance has been woven around the target. They move through their daily routine unaware that every step is being catalogued.',
      'The operation is delicate — too close and we spook the target, too far and we lose them. But the team has found the balance. Surveillance is active.',
      'Phone cloned. Apartment wired. Cover team deployed. The target has become the most watched person in the city — and they have no idea.',
    ],
    category: 'SURVEILLANCE ESTABLISHED',
    accent: 'rgba(52, 152, 219, 0.9)',
  },
  detained: {
    intros: [
      'The snatch was clean. One moment the target was walking freely — the next, a van, a hood, and silence. They are now in our custody.',
      'Target acquired. The extraction team moved at 0340 hours — a precision operation lasting under ninety seconds. The subject is now secured in a black site.',
      'It happened fast. A staged vehicle breakdown, a diversionary argument on the street corner, and then the team moved. The target never saw it coming.',
      'The abduction team reports success. Target was taken without witnesses, sedated, and transferred through the exfiltration chain. Currently held at a secure facility.',
      'A door kicked in before dawn. A groggy target dragged from bed. By the time anyone noticed they were missing, the subject was already in a windowless room hundreds of miles away.',
      'The rendition was textbook. Months of preparation compressed into forty-five seconds of controlled violence. The target is now answering to us.',
    ],
    category: 'TARGET DETAINED',
    accent: 'rgba(155, 89, 182, 0.9)',
  },
  neutralized: {
    intros: [
      'The operation is concluded. The threat has been neutralized — permanently removed from the board. The intelligence community sleeps a little easier tonight.',
      'Target neutralized. The operational file will be sealed and archived. One fewer name on the watchlist.',
      'It\'s done. Months of work, hundreds of man-hours, millions in funding — all culminating in a single decisive action. The target will trouble us no more.',
      'The threat has been eliminated with prejudice. No loose ends, no complications. The after-action report will be brief.',
      'A clean resolution. The kind of outcome that justifies the existence of agencies like ours. Threat neutralized, file closed.',
    ],
    category: 'THREAT NEUTRALIZED',
    accent: 'rgba(46, 204, 113, 0.9)',
  },
  eliminated: {
    intros: [
      'The order was given. There was no trial, no appeal, no public record. In the calculus of national security, this was the only arithmetic that worked.',
      'It is done. The detention facility reports the subject is no longer among the living. The paperwork will say what it needs to say.',
      'The Director signed the order at 0600. By 0615, it was carried out. Some threats cannot be managed — only ended.',
      'A quiet room. A final decision. The kind that doesn\'t appear in any official record but changes the threat landscape all the same.',
      'The detainee has been terminated. The moral weight of the decision will be debated by people who weren\'t in the room. Those who were already know the answer.',
    ],
    category: 'SUBJECT ELIMINATED',
    accent: 'rgba(192, 57, 43, 0.95)',
  },
  handedOver: {
    intros: [
      'The prisoner transfer was completed under cover of darkness. A handshake, a signed document that doesn\'t officially exist, and the detainee changed custody.',
      'The handover went smoothly. Our allies now hold the subject — and with them, the responsibility of extraction. In return, we received something more valuable: goodwill.',
      'A black sedan at a service entrance. A hooded figure transferred between vehicles. The detainee now belongs to someone else\'s interrogation program.',
      'The transfer is complete. We\'ve traded a detainee for diplomatic capital. In this business, relationships are the only currency that appreciates.',
      'The subject was moved to allied custody in the early hours. A strategic calculation: the intelligence value was diminishing, but the alliance value was not.',
    ],
    category: 'DETAINEE TRANSFERRED',
    accent: 'rgba(41, 128, 185, 0.9)',
  },
  released: {
    intros: [
      'The cell door opened and the detainee walked out — bewildered, blinking, but alive. They don\'t know they\'re still inside our world. Every step they take from now on is being watched.',
      'We let them go. Not out of mercy, but out of calculation. A released target returns to their network, their contacts, their habits — and we\'ll be watching every move.',
      'The subject was released from custody under controlled conditions. They believe they escaped through a bureaucratic oversight. In reality, they\'re now the most valuable surveillance asset we have.',
      'Freedom — or the illusion of it. The detainee has been released into an environment we control. Every phone they pick up, every door they walk through, every face they meet — catalogued.',
      'The release was staged to perfection. The subject has no reason to suspect continued monitoring. We\'re obviously still keeping an eye on them — but now they\'ll lead us to the rest.',
    ],
    category: 'CONTROLLED RELEASE',
    accent: 'rgba(52, 152, 219, 0.9)',
  },
  goneToGround: {
    intros: [
      'The failed operation has spooked the target. "{alias}" has abandoned known patterns, changed vehicles, and gone dark on all monitored communications. Our assessment: the subject has activated counter-surveillance protocols and will remain underground for the foreseeable future.',
      'In the aftermath of the failed operation, "{alias}" has gone to ground. SIGINT reports all known phone numbers deactivated within hours. Physical surveillance assets report the target has vacated their last known residence. The network is clearly on high alert.',
      'The botched attempt against "{alias}" has triggered an immediate security lockdown across the target\'s network. Safe houses are being cleared, communication channels rotated, and known associates have dispersed. Direct action against this individual is suspended until the target resurfaces.',
      'Our failed operation has not gone unnoticed. "{alias}" — {role} — has entered a hardened posture. Counter-intelligence sources indicate the target has relocated to a protected environment and is being shielded by the organization\'s security apparatus. Operations against this target are on hold.',
      'The target knows we came for them. "{alias}" has executed what appears to be a pre-planned disappearance protocol — evidence of advance preparation against exactly this scenario. All operational approaches to this target are suspended pending intelligence reassessment.',
    ],
    category: 'TARGET GONE TO GROUND',
    accent: 'rgba(243, 156, 18, 0.9)',
  },
  lostSurveillance: {
    intros: [
      'The operation went wrong — and the target knows it. Within hours of the failed attempt, the subject abandoned all known patterns. Safehouses emptied, phones discarded, contacts scattered. Our surveillance network is blind.',
      'They made us. The botched operation triggered an immediate security protocol — countersurveillance sweeps, route changes, new communication channels. Months of careful observation, gone in an instant.',
      'The failed strike had consequences beyond the mission itself. The target has gone underground — vanished from every surveillance feed, every intercept, every pattern of life we painstakingly built. We\'re back to square one.',
      'The watchers report the target\'s apartment is empty. Neighbors say a moving van came in the night. Phones are dead, email accounts deleted, known associates unreachable. The surveillance net has been shredded.',
      'It was inevitable — a failed direct action always carries this risk. The target is in the wind now, likely under protective custody or operating through cutouts. Every asset we positioned has been burned.',
      'The aftermath is worse than the failure itself. Not only did the operation fail, but the target has activated what appears to be a pre-planned escape protocol. They were ready for us. We were not ready for this.',
    ],
    category: 'SURVEILLANCE LOST',
    accent: 'rgba(231, 76, 60, 0.85)',
  },
};

function hvtBriefingPopup(type, h, extra) {
  var cfg = HVT_POPUP_TEXT[type];
  if (!cfg) return;
  var intros = cfg.intros;
  if (!extra?.codename) intros = intros.filter(function(t) { return t.indexOf('{codename}') === -1; }) || intros;
  var intro = pick(intros.length ? intros : cfg.intros);
  if (extra?.codename) intro = intro.replace(/\{codename\}/g, extra.codename);
  if (h.alias) intro = intro.replace(/\{alias\}/g, h.alias);
  if (h.role) intro = intro.replace(/\{role\}/g, h.role);
  var location = '';
  if (h.knownFields?.city) location = h.knownFields.city;
  if (h.knownFields?.country) location += (location ? ', ' : '') + h.knownFields.country;

  var subtitle = h.alias + (h.role ? ' — ' + h.role : '');
  if (location) subtitle += ' · ' + location;

  var statusColor = {
    ACTIVE: 'rgba(243,156,18,0.9)', TRACKED: 'rgba(52,152,219,0.9)',
    DETAINED: 'rgba(155,89,182,0.9)', NEUTRALIZED: 'rgba(46,204,113,0.9)',
    ELIMINATED: 'rgba(192,57,43,0.95)', HANDED_OVER: 'rgba(41,128,185,0.9)',
  }[h.status] || 'var(--text-dim)';

  var detailLines = '<div style="font-size:11px;font-weight:700;letter-spacing:0.5px;color:' + statusColor + '">' + h.alias + '</div>';
  detailLines += '<div style="font-size:9px;color:var(--text-dim);margin-top:2px">' + roleWithTip(h.role || 'Unknown role') + '</div>';
  if (location) detailLines += '<div style="font-size:9px;color:var(--text-dim)">' + location + '</div>';
  detailLines += '<div style="font-size:9px;margin-top:3px;letter-spacing:0.8px;color:' + statusColor + '">STATUS: ' + h.status + '</div>';
  if (extra?.detail) detailLines += '<div style="font-size:10px;color:var(--text-hi);margin-top:4px;line-height:1.4">' + extra.detail + '</div>';

  var borderColor = cfg.accent.replace('0.9', '0.3').replace('0.85', '0.3').replace('0.95', '0.3');
  var borderLeftColor = cfg.accent.replace('0.9', '0.6').replace('0.85', '0.6').replace('0.95', '0.6');
  var bgColor = cfg.accent.replace('0.9', '0.05').replace('0.85', '0.05').replace('0.95', '0.05');

  queueBriefingPopup({
    title: cfg.category,
    category: 'THREAT INTELLIGENCE',
    subtitle: subtitle,
    accent: cfg.accent,
    body: intro +
      '<div style="margin-top:12px;padding:8px 10px;border:1px solid ' + borderColor + ';border-left:3px solid ' + borderLeftColor + ';border-radius:4px;background:' + bgColor + '">' +
        detailLines +
      '</div>',
    buttonLabel: 'ACKNOWLEDGED',
  });
}

var MAX_CLOSED_HVTS = 5;
var CLOSED_STATUSES = new Set(['NEUTRALIZED', 'ELIMINATED', 'HANDED_OVER']);

function pruneClosedHvts() {
  var closed = [];
  for (var i = 0; i < G.hvts.length; i++) {
    if (CLOSED_STATUSES.has(G.hvts[i].status)) closed.push(i);
  }
  if (closed.length <= MAX_CLOSED_HVTS) return;
  var toRemove = closed.slice(0, closed.length - MAX_CLOSED_HVTS);
  for (var j = toRemove.length - 1; j >= 0; j--) {
    G.hvts.splice(toRemove[j], 1);
  }
}

function registerOrUpdateHvt(m) {
  if (!HVT_REGISTER_TYPES.has(m.typeId)) return;

  // Surveillance missions: mark surveillanceEstablished + TRACKED on linked HVT
  if (SURVEILLANCE_TYPES.has(m.typeId)) {
    const linkedHvtId = m.linkedHvtId;
    if (linkedHvtId) {
      const h = G.hvts.find(x => x.id === linkedHvtId);
      if (h) {
        h.surveillanceEstablished = true;
        h.gaps = [];
        if (h.status === 'ACTIVE') {
          h.status = 'TRACKED';
          h.trackedDay = G.day;
          h.trackedExpiry = G.day + randInt(20, 40);
        }
        addLog(`Surveillance established on ${h.alias}.`, 'log-info');
        hvtBriefingPopup('tracked', h, { codename: m.codename });
      }
    }
    return;
  }

  // Abduction missions: detain linked HVT
  if (ABDUCTION_TYPES.has(m.typeId)) {
    const linkedHvtId = m.linkedHvtId;
    if (linkedHvtId) {
      const h = G.hvts.find(x => x.id === linkedHvtId);
      if (h && (h.status === 'ACTIVE' || h.status === 'TRACKED')) {
        h.status      = 'DETAINED';
        h.detainedAt  = pick(BLACK_SITE_NAMES);
        h.detainedDay = G.day;
        addLog(`${h.alias} abducted and detained at ${h.detainedAt}.`, 'log-success');
        hvtBriefingPopup('detained', h, { codename: m.codename, detail: 'Held at: ' + h.detainedAt });
      }
    }
    return;
  }

  // Determine outcome status
  function resolveHvtStatus(typeId) {
    if (HVT_DETAINED_TYPES.has(typeId)) return 'DETAINED';
    if (HVT_TRACKED_TYPES.has(typeId)) return 'TRACKED';
    return 'NEUTRALIZED';
  }

  const idx = G.hvts.findIndex(h => h.linkedMissionIds.includes(m.id));
  if (idx >= 0) {
    const h = G.hvts[idx];
    // ORG entries are managed exclusively by the plots.js infiltrate→takedown chain
    if (h.type === 'ORG') return;
    const newSt = resolveHvtStatus(m.typeId);
    h.status = newSt;
    if (newSt === 'DETAINED') {
      h.detainedAt  = pick(BLACK_SITE_NAMES);
      h.detainedDay = G.day;
    }
    if (newSt === 'TRACKED') {
      h.surveillanceEstablished = true;
      h.trackedDay = G.day;
      h.trackedExpiry = G.day + randInt(20, 40);
    }
    h.gaps = [];
    const popupType = newSt === 'DETAINED' ? 'detained' : newSt === 'TRACKED' ? 'tracked' : 'neutralized';
    hvtBriefingPopup(popupType, h, { codename: m.codename, detail: newSt === 'DETAINED' ? 'Held at: ' + h.detainedAt : undefined });
    return;
  }

  // New HVT entry
  const newStatus  = resolveHvtStatus(m.typeId);
  const entry = {
    id: `H${++G.hvtIdCounter}`,
    type: 'HVT',
    alias: hvtAliasFromMission(m),
    role:  hvtRoleFromMission(m),
    org:   m.category,
    threat: m.threat,
    location: m.location || 'FOREIGN',
    status: newStatus,
    knownFields: { city: m.city, country: m.country || null },
    gaps: newStatus === 'TRACKED' ? ['Security detail size unknown'] : [],
    linkedMissionIds: [m.id],
    addedDay: G.day,
    detainedAt:   newStatus === 'DETAINED' ? pick(BLACK_SITE_NAMES) : null,
    detainedDay:  newStatus === 'DETAINED' ? G.day : null,
    interrogationCount: 0,
    surveillanceEstablished: newStatus === 'TRACKED',
    trackedDay: newStatus === 'TRACKED' ? G.day : null,
    trackedExpiry: newStatus === 'TRACKED' ? G.day + randInt(20, 40) : null,
    handedTo: null,
    factionId: null,
    hvtIntelType: false,
  };
  entry.hardness = classifyHvtHardness(entry.role);
  // Assign faction for intelligence-type HVTs
  if (typeof window.assignHvtFaction === 'function') {
    window.assignHvtFaction(entry, m.typeId, m.country);
  }
  G.hvts.push(entry);

  // Favor rendition/detention: immediately hand over to requesting agency
  const FAVOR_HANDOVER_TYPES = new Set(['FAVOR_AGENCY_RENDITION', 'FAVOR_BUREAU_DETENTION']);
  if (FAVOR_HANDOVER_TYPES.has(m.typeId) && m.favorOf && newStatus === 'DETAINED') {
    const agCfg = G.cfg?.partnerAgencies?.[m.favorOf];
    entry.status = 'HANDED_OVER';
    entry.handedTo = m.favorOf;
    const agName = agCfg?.name || m.favorAgencyName || m.favorOf;
    hvtBriefingPopup('handedOver', entry, { codename: m.codename, detail: 'Target captured and transferred directly to ' + agName + ' per favor agreement.' });
    return;
  }

  // Only show pop-up for targets that remain active threats — neutralized-on-arrival needs no fanfare
  if (newStatus !== 'NEUTRALIZED') {
    const popupType = newStatus === 'DETAINED' ? 'detained' : newStatus === 'TRACKED' ? 'tracked' : 'newTarget';
    hvtBriefingPopup(popupType, entry, { codename: m.codename, detail: newStatus === 'DETAINED' ? 'Held at: ' + entry.detainedAt : undefined });
  }
}

const HVT_SURVLOSS_TYPES = new Set([
  'HVT_ABDUCTION_DOM', 'HVT_ABDUCTION_FOR',
  'DOMESTIC_HVT', 'FOREIGN_HVT', 'LONG_HUNT_HVT', 'RENDITION', 'SURVEILLANCE_TAKEDOWN',
]);

// Relocate an HVT to a different city within the same theater (or domestic pool)
function relocateHvt(h) {
  if (!h || !h.knownFields) return;
  var oldCity = h.knownFields.city;
  var candidates = [];
  if (h.location === 'DOMESTIC' && G.cfg && G.cfg.domesticCities) {
    candidates = G.cfg.domesticCities.filter(function(c) { return c !== oldCity; })
      .map(function(c) { return { city: c, country: G.cfg.name }; });
  } else if (typeof THEATERS !== 'undefined') {
    var homeCountry = G.cfg ? G.cfg.name : null;
    // Find theater containing the current city
    var theaterIds = Object.keys(THEATERS);
    for (var ti = 0; ti < theaterIds.length; ti++) {
      var th = THEATERS[theaterIds[ti]];
      if (th.cities && th.cities.some(function(c) { return c.city === oldCity; })) {
        candidates = th.cities.filter(function(c) { return c.city !== oldCity && c.country !== homeCountry; });
        break;
      }
    }
    // Fallback: pick from all foreign cities
    if (candidates.length === 0 && typeof FOREIGN_CITIES !== 'undefined') {
      candidates = FOREIGN_CITIES.filter(function(c) { return c.city !== oldCity && c.country !== homeCountry; });
    }
  }
  if (candidates.length > 0) {
    var newLoc = pick(candidates);
    h.knownFields.city = newLoc.city;
    h.knownFields.country = newLoc.country;
  }
}

// Pick city/country for a spawned HVT based on source HVT's location.
// 80% chance: same theater, different city. 20% chance: different theater entirely.
function pickHvtSpawnLocation(sourceHvt) {
  var oldCity = sourceHvt.knownFields ? sourceHvt.knownFields.city : null;
  var sameTheater = Math.random() < 0.80;

  if (sourceHvt.location === 'DOMESTIC' && G.cfg && G.cfg.domesticCities) {
    // Domestic: always same theater (domestic), just different city
    var domCandidates = G.cfg.domesticCities.filter(function(c) { return c !== oldCity; });
    if (domCandidates.length > 0) { var c = pick(domCandidates); return { city: c, country: G.cfg.name }; }
    return { city: oldCity, country: G.cfg ? G.cfg.name : null };
  }

  if (typeof THEATERS === 'undefined') return { city: oldCity, country: sourceHvt.knownFields ? sourceHvt.knownFields.country : null };

  // Find source theater
  var sourceTheaterId = null;
  var theaterIds = Object.keys(THEATERS);
  for (var i = 0; i < theaterIds.length; i++) {
    var th = THEATERS[theaterIds[i]];
    if (th.cities && th.cities.some(function(c) { return c.city === oldCity; })) {
      sourceTheaterId = theaterIds[i];
      break;
    }
  }

  var homeCountry = G.cfg ? G.cfg.name : null;
  var candidates = [];
  if (sameTheater && sourceTheaterId) {
    // Same theater, different city
    candidates = THEATERS[sourceTheaterId].cities.filter(function(c) { return c.city !== oldCity && c.country !== homeCountry; });
  }
  if (!sameTheater || candidates.length === 0) {
    // Different theater
    var otherTheaters = theaterIds.filter(function(t) { return t !== sourceTheaterId && THEATERS[t].cities && THEATERS[t].cities.length > 0; });
    if (otherTheaters.length > 0) {
      var picked = pick(otherTheaters);
      candidates = THEATERS[picked].cities.filter(function(c) { return c.country !== homeCountry; });
    }
  }
  // Fallback
  if (candidates.length === 0 && typeof FOREIGN_CITIES !== 'undefined') {
    candidates = FOREIGN_CITIES.filter(function(c) { return c.city !== oldCity && c.country !== homeCountry; });
  }
  if (candidates.length > 0) { var loc = pick(candidates); return { city: loc.city, country: loc.country }; }
  return { city: oldCity, country: sourceHvt.knownFields ? sourceHvt.knownFields.country : null };
}

function registerOrUpdateHvtFailed(m) {
  // Set cooldown on the linked HVT — target goes to ground
  if (m.linkedHvtId) {
    const linked = G.hvts.find(x => x.id === m.linkedHvtId);
    if (linked && (linked.status === 'ACTIVE' || linked.status === 'TRACKED')) {
      const hCfg = HVT_HARDNESS[linked.hardness || 'MODERATE'] || HVT_HARDNESS.MODERATE;
      linked.cooldownUntil = G.day + randInt(...hCfg.cooldown);
      relocateHvt(linked);
      const cooldownDays = linked.cooldownUntil - G.day;
      addLog(`TARGET ALERT: "${linked.alias}" has gone to ground. Our analysts estimate it will take ${vagueEstimate(cooldownDays)} to reacquire.`, 'log-warn');
      hvtBriefingPopup('goneToGround', linked, {
        codename: m.codename,
        detail: `Target classification: ${hCfg.label}. Our services estimate it will take ${vagueEstimate(cooldownDays)} to reestablish a track on this target.`,
      });
    }
  }

  // Failed abduct/eliminate on a TRACKED HVT → lose surveillance
  if (HVT_SURVLOSS_TYPES.has(m.typeId) && m.linkedHvtId) {
    const h = G.hvts.find(x => x.id === m.linkedHvtId);
    if (h && h.status === 'TRACKED') {
      h.status = 'ACTIVE';
      h.surveillanceEstablished = false;
      h.trackedDay = null;
      h.trackedExpiry = null;
      h.gaps = ['Current location unconfirmed', 'Security detail size unknown', 'Subject adopted new patterns'];
      relocateHvt(h);
      addLog(`SURVEILLANCE LOST: ${h.alias} has gone underground after failed operation.`, 'log-fail');
      hvtBriefingPopup('lostSurveillance', h, { codename: m.codename });
      return;
    }
  }

  if (!HVT_FAIL_TYPES.has(m.typeId)) return;
  const idx = G.hvts.findIndex(h => h.linkedMissionIds.includes(m.id));
  if (idx >= 0) {
    const h = G.hvts[idx];
    if (!h.linkedMissionIds.includes(m.id)) h.linkedMissionIds.push(m.id);
    return; // already tracked — don't downgrade from NEUTRALIZED
  }
  G.hvts.push({
    id: `H${++G.hvtIdCounter}`,
    type: 'HVT',
    alias: hvtAliasFromMission(m),
    role:  hvtRoleFromMission(m),
    org:   m.category,
    threat: m.threat,
    location: m.location || 'FOREIGN',
    status: 'ACTIVE',
    knownFields: { city: m.city, country: m.country || null },
    gaps: ['Identity requires verification', 'Current location unconfirmed', 'Security detail size unknown'],
    linkedMissionIds: [m.id],
    addedDay: G.day,
    detainedAt:   null,
    detainedDay:  null,
    interrogationCount: 0,
    surveillanceEstablished: false,
    handedTo: null,
    factionId: null,
    hvtIntelType: false,
  });
  var failEntry = G.hvts[G.hvts.length - 1];
  failEntry.hardness = classifyHvtHardness(failEntry.role);
  if (typeof window.assignHvtFaction === 'function') {
    window.assignHvtFaction(failEntry, m.typeId, m.country);
  }
  hvtBriefingPopup('newTargetFailed', failEntry, { codename: m.codename });
}

window.openHvtMissionModal = function(hvtId) {
  const h = G.hvts.find(h => h.id === hvtId);
  if (!h || (h.status !== 'ACTIVE' && h.status !== 'TRACKED')) return;

  // Build list of applicable mission types based on HVT location context
  const isForeign = !!(h.knownFields.country && h.knownFields.country !== (G.cfg?.name || ''));
  let availableTypeIds = isForeign
    ? ['FOREIGN_HVT', 'LONG_HUNT_HVT', 'RENDITION']
    : ['DOMESTIC_HVT', 'SURVEILLANCE_TAKEDOWN'];
  if (h.knownFields.address) availableTypeIds.push('SEARCH_PREMISES');

  // Add surveillance/abduction options based on surveillance status
  if (!h.surveillanceEstablished) {
    availableTypeIds.push(isForeign ? 'HVT_SURVEILLANCE_FOR' : 'HVT_SURVEILLANCE_DOM');
  } else {
    availableTypeIds.push(isForeign ? 'HVT_ABDUCTION_FOR' : 'HVT_ABDUCTION_DOM');
  }

  availableTypeIds = availableTypeIds.filter(t => MISSION_TYPES[t]);

  if (availableTypeIds.length === 0) {
    addLog('No available mission types for this target.', 'log-warn');
    return;
  }

  document.getElementById('modal-title').textContent = `ASSIGN MISSION — ${h.alias}`;
  document.getElementById('modal-body').innerHTML = `
    <div class="modal-section">
      <div class="modal-section-title">TARGET: ${h.alias}</div>
      <div style="font-size:12px;color:var(--text-dim);margin-bottom:4px">${roleWithTip(h.role)}</div>
      <div style="font-size:11px;color:var(--text-dim);margin-bottom:12px">${h.org} · ${h.knownFields.city || ''}${h.knownFields.country ? ', ' + h.knownFields.country : ''}</div>
    </div>
    <div class="modal-section">
      <div class="modal-section-title">SELECT MISSION TYPE</div>
      <div class="hvt-mission-grid">
        ${availableTypeIds.map(typeId => {
          const tmpl = MISSION_TYPES[typeId];
          return `<div class="hvt-mission-option" onclick="spawnHvtMission('${hvtId}','${typeId}')">
            <div class="hvt-mo-label">${tmpl.label}</div>
            <div class="hvt-mo-cat">${tmpl.category}</div>
          </div>`;
        }).join('')}
      </div>
    </div>
    <div class="modal-actions">
      <button class="btn-neutral" onclick="hideModal()">CANCEL</button>
    </div>
  `;
  showModal();
};

window.spawnHvtMission = function(hvtId, typeId) {
  const h = G.hvts.find(h => h.id === hvtId);
  if (!h) return;
  // Block if target is in cooldown
  if (h.cooldownUntil && G.day < h.cooldownUntil) {
    addLog(`"${h.alias}" has gone to ground. Our analysts estimate it will take ${vagueEstimate(h.cooldownUntil - G.day)} to reacquire.`, 'log-warn');
    return;
  }
  spawnMission(typeId);
  const newest = G.missions[0];
  if (newest) {
    newest.linkedHvtId = hvtId;
    // Apply hardness threat modifier
    const hCfg = HVT_HARDNESS[h.hardness || 'MODERATE'] || HVT_HARDNESS.MODERATE;
    if (hCfg.threatMod !== 0) {
      newest.threat = clamp(newest.threat + hCfg.threatMod, 1, 5);
    }
    // Mark elimination vs capture intent when spawned from threats tab
    const ELIM_TYPES = new Set(['DOMESTIC_HVT', 'FOREIGN_HVT', 'LONG_HUNT_HVT']);
    const ABDUCT_TYPES = new Set(['HVT_ABDUCTION_DOM', 'HVT_ABDUCTION_FOR']);
    if (ELIM_TYPES.has(typeId))   newest.isElimination = true;
    if (ABDUCT_TYPES.has(typeId)) newest.isAbduction = true;
    // For elimination missions, filter out capture-sounding success messages
    if (newest.isElimination && Array.isArray(newest.successMsgs)) {
      const elimOnly = newest.successMsgs.filter(s => !/apprehend|custody|captured|arrest|taken into/i.test(s));
      if (elimOnly.length > 0) newest.successMsgs = elimOnly;
    }
    // Override location to match HVT's known location
    const oldCity    = newest.city;
    const oldCountry = newest.country;
    // Derive country from city if missing (lookup in FOREIGN_CITIES)
    var hvtCity = h.knownFields?.city || null;
    var hvtCountry = h.knownFields?.country || null;
    if (hvtCity && !hvtCountry) {
      var match = FOREIGN_CITIES.find(function (fc) { return fc.city === hvtCity; });
      if (match) hvtCountry = match.country;
    }
    if (hvtCity)    newest.city    = hvtCity;
    if (hvtCountry) newest.country = hvtCountry;
    // Override target identity in fillVars and re-stamp all baked text fields
    if (newest.fillVars) {
      if (hvtCity)    newest.fillVars.city    = hvtCity;
      if (hvtCountry) newest.fillVars.country = hvtCountry;
      const oldAlias = newest.fillVars.alias || newest.fillVars.target_alias || newest.fillVars.suspect_name;
      const oldRole  = newest.fillVars.hvt_role || newest.fillVars.target_role || newest.fillVars.rendition_role;
      newest.fillVars.alias = h.alias;
      newest.fillVars.target_alias = h.alias;
      newest.fillVars.suspect_name = h.alias;
      if (h.role) {
        newest.fillVars.hvt_role = h.role;
        newest.fillVars.target_role = h.role;
        newest.fillVars.rendition_role = h.role;
      }
      // Replace old alias/role/location in all pre-rendered text fields
      const textFields = ['initialReport', 'fullReport', 'opNarrative', 'agencyJustification'];
      for (const f of textFields) {
        if (newest[f] && typeof newest[f] === 'string') {
          if (oldAlias) newest[f] = newest[f].split(oldAlias).join(h.alias);
          if (oldRole && h.role) newest[f] = newest[f].split(oldRole).join(h.role);
          if (oldCity && newest.city && oldCity !== newest.city) newest[f] = newest[f].split(oldCity).join(newest.city);
          if (oldCountry && newest.country && oldCountry !== newest.country) newest[f] = newest[f].split(oldCountry).join(newest.country);
        }
      }
      // Also fix intel field values
      if (newest.intelFields) {
        for (const field of newest.intelFields) {
          if (field.value && typeof field.value === 'string') {
            if (oldAlias) field.value = field.value.split(oldAlias).join(h.alias);
            if (oldRole && h.role) field.value = field.value.split(oldRole).join(h.role);
            if (oldCity && newest.city && oldCity !== newest.city) field.value = field.value.split(oldCity).join(newest.city);
            if (oldCountry && newest.country && oldCountry !== newest.country) field.value = field.value.split(oldCountry).join(newest.country);
          }
        }
      }
      // Fix success/failure message templates (arrays of strings, rendered later)
      for (const arr of ['successMsgs', 'failureMsgs']) {
        if (Array.isArray(newest[arr])) {
          newest[arr] = newest[arr].map(s => {
            if (oldAlias) s = s.split(oldAlias).join(h.alias);
            if (oldRole && h.role) s = s.split(oldRole).join(h.role);
            if (oldCity && newest.city && oldCity !== newest.city) s = s.split(oldCity).join(newest.city);
            if (oldCountry && newest.country && oldCountry !== newest.country) s = s.split(oldCountry).join(newest.country);
            return s;
          });
        }
      }
      // Final pass: re-apply fillTemplate to catch any remaining {placeholders}
      const allTextFields = ['initialReport', 'fullReport', 'opNarrative', 'agencyJustification'];
      for (const f of allTextFields) {
        if (newest[f] && typeof newest[f] === 'string' && newest[f].includes('{')) {
          newest[f] = fillTemplate(newest[f], newest.fillVars);
        }
      }
      for (const arr of ['successMsgs', 'failureMsgs']) {
        if (Array.isArray(newest[arr])) {
          newest[arr] = newest[arr].map(s => s.includes('{') ? fillTemplate(s, newest.fillVars) : s);
        }
      }
      // Threat-initiated: we know exactly who the target is — single suspect
      newest.suspects = [{
        alias: h.alias,
        role: h.role || newest.fillVars.hvt_role || newest.fillVars.target_role || 'Unknown',
        confidence: 'HIGH',
        isTarget: true,
        eliminated: false,
      }];
      newest.selectedSuspectIdx = 0;
    }
    if (!h.linkedMissionIds.includes(newest.id)) h.linkedMissionIds.push(newest.id);
    addLog(`New mission spawned for target ${h.alias}: OP ${newest.codename}.`, 'log-info');
  }
  hideModal();
  render();
};

// ---- HVT detention action functions ----

window.executeTarget = function(hvtId) {
  const h = G.hvts.find(x => x.id === hvtId);
  if (!h || h.status !== 'DETAINED') return;
  h.status = 'ELIMINATED';
  const gain = randInt(3, 7);
  G.confidence = clamp(G.confidence + gain, 0, 100);
  addLog(`${h.alias} executed. +${gain}% confidence.`, 'log-success');
  hvtBriefingPopup('eliminated', h);
  render();
};

window.handoverTarget = function(hvtId, agencyId) {
  const h = G.hvts.find(x => x.id === hvtId);
  if (!h || h.status !== 'DETAINED') return;
  if (!G.cfg?.partnerAgencies?.[agencyId]) return;
  const agCfg = G.cfg.partnerAgencies[agencyId];
  // Type restriction: domestic agency handles domestic HVTs, foreign/military handles foreign
  if (agCfg.type === 'domestic' && h.location === 'FOREIGN') {
    addLog(`${agCfg.name} handles domestic cases only. Cannot accept a foreign HVT.`, 'log-warn');
    return;
  }
  if (agCfg.type !== 'domestic' && h.location === 'DOMESTIC') {
    addLog(`${agCfg.name} operates on foreign targets only. Cannot accept a domestic HVT.`, 'log-warn');
    return;
  }
  h.status  = 'HANDED_OVER';
  h.handedTo = agencyId;
  const relGain = randInt(10, 15);
  const confGain = randInt(3, 6);
  if (G.relations[agencyId]) G.relations[agencyId].relation = clamp(G.relations[agencyId].relation + relGain, 0, 100);
  G.confidence = clamp(G.confidence + confGain, 0, 100);
  addLog(`${h.alias} handed over to ${agCfg.name}. +${relGain} relation, +${confGain}% confidence.`, 'log-success');
  hvtBriefingPopup('handedOver', h, { detail: 'Transferred to: ' + agCfg.name + ' (+' + relGain + ' relation, +' + confGain + '% confidence)' });
  render();
};

window.interrogateTarget = function(hvtId) {
  const h = G.hvts.find(x => x.id === hvtId);
  if (!h || h.status !== 'DETAINED') return;
  if (h.interrogationCount >= 3) {
    addLog(`${h.alias}: maximum interrogation sessions reached.`, 'log-warn');
    return;
  }
  if (h.interrogationCooldown && G.day < h.interrogationCooldown) {
    addLog(`${h.alias}: subject needs recovery time. Next session available in ${h.interrogationCooldown - G.day} days.`, 'log-warn');
    return;
  }
  h.interrogationCount++;
  h.interrogationCooldown = G.day + 7;
  const interrogIntel = randInt(3, 5);
  G.intel = (G.intel || 0) + interrogIntel;
  G.intelLifetime = (G.intelLifetime || 0) + interrogIntel;

  // 60% chance to reveal a new HVT from the same network
  if (Math.random() < 0.60) {
    const newAlias = pickUniqueAlias(HANDLER_ALIASES);
    const orgLabel = h.org || 'Unknown Network';
    const newRole = pick(['logistics coordinator', 'communications handler', 'safe house operator', 'courier', 'recruiter', 'financial facilitator', 'cell commander', 'weapons specialist']);
    const newId = `H${++G.hvtIdCounter}`;
    const spawnLoc = pickHvtSpawnLocation(h);
    const newHvt = {
      id: newId, type: 'HVT', alias: newAlias, role: newRole,
      org: orgLabel, threat: Math.min((h.threat || 2) + 1, 5),
      location: h.location || 'FOREIGN', status: 'ACTIVE',
      knownFields: { city: spawnLoc.city, country: spawnLoc.country },
      gaps: ['Identity requires verification', 'Current location unconfirmed', 'Security detail unknown'],
      linkedMissionIds: [], addedDay: G.day,
      detainedAt: null, detainedDay: null, interrogationCount: 0,
      surveillanceEstablished: false, handedTo: null,
      factionId: h.factionId || null, hvtIntelType: h.hvtIntelType || false,
      linkedPlotId: h.linkedPlotId || null,
      hardness: classifyHvtHardness(newRole),
    };
    G.hvts.push(newHvt);
    addLog(`Interrogation session ${h.interrogationCount}/3: ${h.alias} yielded intelligence (+${interrogIntel} Intel). New target revealed: "${newAlias}" — ${newRole}.`, 'log-info');
    hvtBriefingPopup('newTarget', newHvt, { detail: `Revealed during interrogation session ${h.interrogationCount}/3 of "${h.alias}". Same network: ${orgLabel}.` });
  } else {
    addLog(`Interrogation session ${h.interrogationCount}/3: ${h.alias} yielded intelligence (+${interrogIntel} Intel). No new leads.`, 'log-info');
  }
  render();
};

window.releaseTarget = function(hvtId) {
  const h = G.hvts.find(x => x.id === hvtId);
  if (!h || h.status !== 'DETAINED') return;
  h.status = 'TRACKED';
  h.surveillanceEstablished = true;
  h.trackedDay = G.day;
  h.trackedExpiry = G.day + randInt(20, 40);
  h.detainedAt = null;
  relocateHvt(h);
  addLog(`CONTROLLED RELEASE: "${h.alias}" released from custody. Surveillance reactivated.`, 'log-info');
  hvtBriefingPopup('released', h, { detail: 'Subject released under controlled conditions. Tracking package deployed — surveillance window: ' + (h.trackedExpiry - G.day) + ' days.' });
  render();
};

// =============================================================================
// LOGGING
// =============================================================================

function addLog(text, cls = '') {
  G.log.unshift({ text: `D${G.day}: ${text}`, cls });
  if (G.log.length > 50) G.log.pop();
}

// =============================================================================
// RENDERING
// =============================================================================

function getMission(id) { return G.missions.find(m => m.id === id) || null; }

function renderAgencyBar() {
  const el = document.getElementById('agency-bar');
  if (!el || !G.cfg?.partnerAgencies) { if (el) el.innerHTML = ''; return; }
  el.innerHTML = Object.entries(G.cfg.partnerAgencies).map(([id, agCfg]) => {
    const rel = G.relations?.[id]?.relation ?? 0;
    const barCls = rel >= 70 ? 'rel-high' : rel >= 40 ? 'rel-med' : 'rel-low';
    const typeLabel = agCfg.type === 'domestic' ? 'DOMESTIC'
      : agCfg.type === 'military' ? 'MILITARY' : 'FOREIGN';
    const tooltip = `${agCfg.name} · ${typeLabel}&#10;Relation: ${rel}/100&#10;&#10;${agCfg.desc || ''}`;
    return `<div class="agency-rel-chip" data-tip="${tooltip}">
      <span class="agency-rel-name">${agCfg.shortName}</span>
      <div class="agency-rel-bar-wrap"><div class="agency-rel-bar-fill ${barCls}" style="width:${rel}%"></div></div>
      <span class="agency-rel-pct ${barCls}">${rel}</span>
    </div>`;
  }).join('');
}

function render() {
  renderHeader();
  renderAgencyBar();
  renderFolderSidebar();
  renderMessageList();
  renderReadingPane();
  // Update hidden compatibility elements for other modules
  renderDepts();
  renderActiveOps();
  renderThreats();
  renderLog();
  renderStatusBar();
  fire('render:after', G);
}

function renderStatusBar() {
  const logEl = document.getElementById('footer-log');
  if (logEl && G.log.length > 0) {
    logEl.innerHTML = G.log.slice(0, 3).map(e =>
      `<span class="log-entry ${e.cls}">${e.text}</span>`
    ).join('');
  }
  const rightEl = document.getElementById('footer-right');
  if (rightEl) {
    const activeOps = G.missions.filter(m => m.status === 'EXECUTING').length;
    const pendingOps = G.missions.filter(m => m.status === 'INVESTIGATING').length;
    rightEl.textContent = `${activeOps} active · ${pendingOps} pending · Day ${G.day}`;
  }
}

// Track previous values for targeted stat-flash animations
let _prevConf = null, _prevBudget = null, _prevXp = null, _prevIntel = null;

function flashStat(el, direction) {
  if (!el) return;
  el.classList.remove('stat-flash-up', 'stat-flash-down');
  void el.offsetWidth;
  el.classList.add(direction > 0 ? 'stat-flash-up' : 'stat-flash-down');
}

// Animated number counting — values roll to their target
function animateValue(el, start, end, suffix, duration) {
  if (!el || start === end) return;
  const range = end - start;
  const startTime = performance.now();
  const dur = Math.min(duration || 400, 800);
  function tick(now) {
    const t = Math.min((now - startTime) / dur, 1);
    const ease = 1 - Math.pow(1 - t, 3); // ease-out cubic
    const current = Math.round(start + range * ease);
    el.textContent = (suffix === '$' ? fmt(current) : current + (suffix || ''));
    if (t < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

function renderHeader() {
  const agencyEl = document.getElementById('hdr-agency');
  if (agencyEl) agencyEl.textContent = G.cfg ? `SECURE MAIL — ${G.cfg.acronym} DIRECTOR'S TERMINAL` : 'SHADOWNET';

  const dateEl = document.getElementById('hdr-date');
  if (dateEl) dateEl.textContent = typeof formatGameDate === 'function' ? formatGameDate(G.day) : `DAY ${G.day}`;

  const confPct = G.confidence;
  const bar     = document.getElementById('conf-bar');
  if (bar) {
    bar.style.width      = `${confPct}%`;
    bar.style.background = confPct >= 60 ? 'var(--green)' : confPct >= 35 ? 'var(--amber)' : 'var(--red)';
  }
  // Update both new and old stat elements, with flash on change
  const statConf = document.getElementById('stat-conf');
  if (statConf) {
    if (_prevConf !== null && confPct !== _prevConf) {
      flashStat(statConf, confPct - _prevConf);
      animateValue(statConf, _prevConf, confPct, '%', 500);
    } else {
      statConf.textContent = `${confPct}%`;
    }
  }
  _prevConf = confPct;

  const statBudget = document.getElementById('stat-budget');
  if (statBudget) {
    if (_prevBudget !== null && G.budget !== _prevBudget) {
      flashStat(statBudget, G.budget - _prevBudget);
      animateValue(statBudget, _prevBudget, G.budget, '$', 600);
    } else {
      statBudget.textContent = fmt(G.budget);
    }
    const budgetStat = statBudget.closest('.hdr-stat');
    if (budgetStat && G.cfg) budgetStat.setAttribute('data-tip', `Available operational budget. Regenerates ${fmt(G.cfg.weeklyBudgetRegen)}/week (cap: ${fmt(G.cfg.budget)}).`);
  }
  _prevBudget = G.budget;

  const statXp = document.getElementById('stat-xp');
  if (statXp) {
    if (_prevXp !== null && G.xp !== _prevXp) {
      flashStat(statXp, G.xp - _prevXp);
      animateValue(statXp, _prevXp, G.xp, '', 500);
    } else {
      statXp.textContent = `${G.xp}`;
    }
  }
  _prevXp = G.xp;

  const statIntel = document.getElementById('stat-intel');
  if (statIntel) {
    const intel = G.intel || 0;
    if (_prevIntel !== null && intel !== _prevIntel) {
      flashStat(statIntel, intel - _prevIntel);
      animateValue(statIntel, _prevIntel, intel, '', 500);
    } else {
      statIntel.textContent = `${intel}`;
    }
  }
  _prevIntel = G.intel || 0;

  // Hidden compat elements
  const confEl = document.getElementById('res-conf');
  if (confEl) confEl.textContent = `${confPct}%`;
  const budgetEl = document.getElementById('res-budget');
  if (budgetEl) budgetEl.textContent = fmt(G.budget);
  const xpEl = document.getElementById('res-xp');
  if (xpEl) xpEl.textContent = `${G.xp}`;
}

let _prevFolderCounts = {};
function renderFolderSidebar() {
  const el = document.getElementById('sidebar');
  if (!el) return;

  const folders = typeof MAIL_FOLDERS !== 'undefined' ? MAIL_FOLDERS : [
    { id: 'inbox', label: 'Inbox', icon: '✉' },
    { id: 'pending', label: 'Pending', icon: '◌' },
    { id: 'active', label: 'Active Ops', icon: '◉' },
    { id: 'results', label: 'Results', icon: '🫆' },
    { id: 'threats', label: 'Threat Files', icon: '☠' },
    { id: 'agencies', label: 'Agencies', icon: '🤝' },
    { id: 'geo', label: 'World Intel', icon: '🌎' },
    { id: 'archive', label: 'Archive', icon: '📥' },
  ];

  el.innerHTML = folders.map(f => {
    const count = getFolderCount(f.id);
    const isActive = G.currentFolder === f.id;
    const hasUrgent = f.id === 'inbox' && G.missions.some(m => m.status === 'BLOWN' || (m.threat >= 5 && m.status === 'INCOMING'));
    const badgeHtml = count > 0
      ? `<span class="folder-badge ${hasUrgent ? 'folder-badge-urgent' : ''}">${count}</span>`
      : '';
    const iconHtml = f.iconImg
      ? `<img class="folder-icon-img" src="${f.iconImg}" alt="${f.label}">`
      : `<span class="folder-icon ${f.iconCls || ''}">${f.icon}</span>`;
    return `<div class="folder-item ${isActive ? 'active' : ''}" onclick="switchFolder('${f.id}')">
      ${iconHtml}
      <span class="folder-label">${f.label}</span>
      ${badgeHtml}
    </div>`;
  }).join('') + '<div class="folder-divider"></div>' +
  `<div class="folder-item ${G.currentFolder === 'depts' ? 'active' : ''}" onclick="switchFolder('depts')">
    <img class="folder-icon-img" src="icons/departments.svg" alt="Departments"><span class="folder-label">Departments</span>
  </div>` +
  `<div class="folder-item ${G.currentFolder === 'roster' ? 'active' : ''}" onclick="switchFolder('roster')">
    <img class="folder-icon-img" src="icons/elite-roster.svg" alt="Elite Roster"><span class="folder-label">Elite Roster</span>
    ${(G.eliteUnits?.filter(u => u.alive).length || 0) > 0 ? `<span class="folder-badge">${G.eliteUnits.filter(u => u.alive).length}</span>` : ''}
  </div>`;

  // Pop-animate badges whose counts changed
  el.querySelectorAll('.folder-item').forEach(item => {
    const folderId = (item.getAttribute('onclick') || '').match(/'(\w+)'/)?.[1];
    const badge = item.querySelector('.folder-badge');
    if (folderId && badge) {
      const newCount = parseInt(badge.textContent) || 0;
      if (_prevFolderCounts[folderId] !== undefined && _prevFolderCounts[folderId] !== newCount) {
        badge.classList.add('badge-pop');
        setTimeout(() => badge.classList.remove('badge-pop'), 400);
      }
      _prevFolderCounts[folderId] = newCount;
    }
  });
}

function renderMessageList() {
  const listEl = document.getElementById('mlp-list');
  const titleEl = document.getElementById('mlp-title');
  const countEl = document.getElementById('mlp-count');
  if (!listEl) return;

  const folder = G.currentFolder;

  // For non-mission folders, render special content in reading pane instead
  if (['threats', 'agencies', 'geo', 'depts', 'roster'].includes(folder)) {
    const folderNames = { threats: 'THREAT FILES', agencies: 'AGENCY RELATIONS', geo: 'GEOPOLITICS', depts: 'DEPARTMENTS', roster: 'ELITE ROSTER' };
    if (titleEl) titleEl.textContent = folderNames[folder] || folder.toUpperCase();
    if (countEl) countEl.textContent = '';
    listEl.innerHTML = '<div class="msg-list-empty">View details in reading pane →</div>';
    return;
  }

  const missions = getFolderMissions(folder);
  const intelMsgs = folder === 'inbox' ? getInboxIntelMessages() : [];
  const totalCount = missions.length + intelMsgs.length;
  const folderLabels = { inbox: 'INBOX', pending: 'PENDING', active: 'ACTIVE OPS', results: 'RESULTS', archive: 'ARCHIVE' };
  if (titleEl) titleEl.textContent = folderLabels[folder] || folder.toUpperCase();
  if (countEl) countEl.textContent = `${totalCount}`;

  // Also update hidden inbox-count for compatibility
  const inboxCountEl = document.getElementById('inbox-count');
  if (inboxCountEl) inboxCountEl.textContent = getFolderCount('inbox');

  if (totalCount === 0) {
    listEl.innerHTML = '<div class="msg-list-empty">No messages.</div>';
    return;
  }

  // Build intel message rows (shown at top of inbox)
  const intelRows = intelMsgs.map(im => {
    const isSelected = G.selected === im.id && G.selectedType === 'intel';
    const senderMap = {
      POLITICAL: 'Oversight Liaison', INTERNAL: 'Security Division', EXTERNAL: 'Global Threat Watch',
      OPPORTUNITY: 'Deputy Director', NOTICE: 'Operations Center', ALERT: 'Operations Center',
      PERSONNEL: 'Personnel Division', GEOPOLITICS: 'Global Threat Watch',
    };
    const senderName = senderMap[im.category] || 'Operations Center';
    const unreadCls = im.read ? '' : 'msg-unread';
    return `<div class="msg-row ${isSelected ? 'msg-selected' : ''} ${unreadCls}" onclick="selectIntelMessage('${im.id}')">
      <span class="msg-priority msg-priority-normal">🫆</span>
      <span class="msg-from">${senderName}</span>
      <span class="msg-subject">${im.title}${im.subtitle ? ' — ' + im.subtitle : ''}</span>
      <span class="msg-status status-intel">${im.category}</span>
    </div>`;
  }).join('');

  // Build mission rows
  const missionRows = missions.map(m => {
    const isSelected = G.selected === m.id && G.selectedType !== 'intel';
    const sender = typeof getEmailSender === 'function' ? getEmailSender(m, m.status) : { name: 'Operations', desk: '' };
    const subject = typeof getEmailSubject === 'function' ? getEmailSubject(m, m.status) : `OP ${m.codename}`;
    const priority = typeof getEmailPriority === 'function' ? getEmailPriority(m) : 'normal';
    const daysLeft = m.status === 'BLOWN' ? m.blownDaysLeft : (m.urgencyLeft ?? '');
    const deadlineCls = daysLeft <= 2 ? 'urgent' : daysLeft <= 5 ? 'warn' : '';

    const statusChip = {
      INCOMING:       '<span class="msg-status status-incoming">NEW</span>',
      INVESTIGATING:  '<span class="msg-status status-investigating">PENDING</span>',
      READY:          `<span class="msg-status ${m.phaseFalseFlag ? 'status-anomaly' : 'status-ready'}">${m.phaseFalseFlag ? 'ANOMALY' : 'READY'}</span>`,
      BLOWN:          '<span class="msg-status status-blown">URGENT</span>',
      PHASE_COMPLETE: '<span class="msg-status status-phase-complete">PHASE</span>',
      DEAD_END:       '<span class="msg-status status-dead-end">DEAD END</span>',
      EXPIRED:        '<span class="msg-status status-expired">EXPIRED</span>',
      EXECUTING:      '<span class="msg-status status-executing">ACTIVE</span>',
      SUCCESS:        '<span class="msg-status status-success">SUCCESS</span>',
      FAILURE:        '<span class="msg-status status-failure">FAILED</span>',
      ARCHIVED:       '<span class="msg-status status-archived">ARCHIVED</span>',
    }[m.status] || '';

    const prioIcon = priority === 'FLASH' ? '!!' : priority === 'IMMEDIATE' ? '!' : priority === 'PRIORITY' ? '▸' : '·';
    const prioCls = priority === 'FLASH' ? 'msg-priority-critical' : priority === 'IMMEDIATE' ? 'msg-priority-high' : 'msg-priority-normal';
    const favorTag = m.favorOf ? `<span class="msg-favor-chip">FAVOR</span>` : '';

    return `<div class="msg-row ${isSelected ? 'msg-selected' : ''}" onclick="selectMission('${m.id}')">
      <span class="msg-priority ${prioCls}">${prioIcon}</span>
      <span class="msg-from">${sender.name || 'Operations'}</span>
      <span class="msg-subject">${subject}${favorTag ? ' ' + favorTag : ''}</span>
      ${statusChip}
      ${daysLeft !== '' ? `<span class="msg-deadline ${deadlineCls}">${daysLeft}d</span>` : ''}
    </div>`;
  }).join('');

  listEl.innerHTML = intelRows + missionRows;
}

function renderPhaseRoadmap(m) {
  if (!m.isMultiPhase) return '';
  const nodes = m.phases.map((ph, i) => {
    const cp = m.completedPhases.find(c => c.phaseIndex === i);
    let cls, icon;
    if (cp)                          { cls = cp.result === 'SUCCESS' ? 'phase-node-done' : 'phase-node-fail'; icon = cp.result === 'SUCCESS' ? '✓' : '✕'; }
    else if (i === m.currentPhaseIndex) { cls = 'phase-node-active'; icon = '→'; }
    else                               { cls = 'phase-node-pending'; icon = String(i + 1); }
    return `<div class="phase-node ${cls}" data-tip="${ph.name}">
      <div class="phase-node-icon">${icon}</div>
      <div class="phase-node-label">${ph.shortName}</div>
    </div>${i < m.phases.length - 1 ? '<div class="phase-connector"></div>' : ''}`;
  }).join('');
  return `<div class="phase-roadmap">${nodes}</div>`;
}

function renderReadingPane() {
  const paneEl = document.getElementById('reading-pane');
  if (!paneEl) return;
  // Apple-style crossfade: brief fade-in on each content swap
  paneEl.classList.remove('rp-fade-in');
  void paneEl.offsetHeight; // force reflow to restart animation
  paneEl.classList.add('rp-fade-in');

  const folder = G.currentFolder;

  // Non-mission folders render their own content
  if (folder === 'threats') {
    renderThreatsInPane(paneEl);
    return;
  }
  if (folder === 'agencies') {
    renderAgenciesInPane(paneEl);
    return;
  }
  if (folder === 'geo') {
    renderGeoInPane(paneEl);
    return;
  }
  if (folder === 'depts') {
    renderDeptsInPane(paneEl);
    return;
  }
  if (folder === 'roster') {
    renderRosterInPane(paneEl);
    return;
  }

  // Mission-based folders: show selected mission as email
  if (!G.selected) {
    paneEl.innerHTML = `<div class="rp-empty">
      <div class="rp-empty-icon">🫆</div>
      <div class="rp-empty-title">SHADOWNET SECURE MAIL</div>
      <div class="rp-empty-sub">Select a message to decrypt and read.</div>
    </div>`;
    return;
  }

  // Intel message rendering
  if (G.selectedType === 'intel') {
    const im = (G.intelMessages || []).find(m => m.id === G.selected);
    if (!im) { G.selected = null; G.selectedType = null; renderReadingPane(); return; }
    const senderMap = {
      POLITICAL: EMAIL_SENDERS.OVERSIGHT, INTERNAL: EMAIL_SENDERS.SECURITY,
      EXTERNAL: EMAIL_SENDERS.INTEL_DIGEST, OPPORTUNITY: EMAIL_SENDERS.DEPUTY_DIR,
      NOTICE: EMAIL_SENDERS.OPS_CENTER, ALERT: EMAIL_SENDERS.OPS_CENTER,
      PERSONNEL: EMAIL_SENDERS.HR, GEOPOLITICS: EMAIL_SENDERS.INTEL_DIGEST,
    };
    const sender = senderMap[im.category] || EMAIL_SENDERS.OPS_CENTER;
    const subject = im.title + (im.subtitle ? ' — ' + im.subtitle : '');
    const emailHeader = typeof buildEmailHeader === 'function'
      ? buildEmailHeader(sender, subject, { priority: 'ROUTINE' })
      : '';
    const replyHtml = typeof buildReplySection === 'function'
      ? buildReplySection([{ label: im.buttonLabel || 'ACKNOWLEDGED', cls: 'reply-primary', onclick: `acknowledgeIntelMessage('${im.id}')` }])
      : '';
    const sig = typeof buildEmailSignature === 'function' ? buildEmailSignature(sender) : '';
    paneEl.innerHTML = `<div class="email-wrap">
      ${emailHeader}
      <div class="email-body">
        <div class="dc-section">
          <div class="dc-report">${im.body}</div>
        </div>
        ${sig}
      </div>
      ${replyHtml}
    </div>`;
    return;
  }

  const m = getMission(G.selected);
  if (!m) { G.selected = null; G.selectedType = null; renderReadingPane(); return; }

  // Build email header
  const sender = typeof getEmailSender === 'function' ? getEmailSender(m, m.status) : { name: 'Operations', desk: 'Joint Operations Center' };
  const subject = typeof getEmailSubject === 'function' ? getEmailSubject(m, m.status) : `OP ${m.codename}`;
  const priority = typeof getEmailPriority === 'function' ? getEmailPriority(m) : 'normal';
  const emailHeader = typeof buildEmailHeader === 'function'
    ? buildEmailHeader(sender, subject, { priority })
    : '';

  // Build mission detail content (same as before, but wrapped in email format)
  const threatLabel = m.threat >= 5 ? 'CRITICAL' : m.threat >= 4 ? 'HIGH' : m.threat >= 3 ? 'MODERATE' : 'LOW';
  const threatCls   = m.threat >= 4 ? 'threat-high' : m.threat >= 3 ? 'threat-med' : 'threat-low';
  const locCls      = m.location === 'FOREIGN' ? 'location-foreign' : 'location-domestic';

  const favorBannerHtml = m.favorOf
    ? `<div class="favor-banner"><span class="favor-lbl">FAVOR</span> <span class="favor-agency">${m.favorAgencyName || m.favorOf}</span> — Complete to improve inter-agency relations.</div>`
    : '';

  // Find linked threat/org for this mission
  let linkedThreatBadge = '';
  if (m.linkedHvtId) {
    const lh = G.hvts.find(h => h.id === m.linkedHvtId);
    if (lh) linkedThreatBadge = `<span class="dc-badge dc-badge-linked" data-tip="Linked ${lh.type}">${lh.type}: ${lh.alias || lh.name}</span>`;
  } else if (m.plotFileName) {
    linkedThreatBadge = `<span class="dc-badge dc-badge-linked" data-tip="Linked case file">FILE: ${m.plotFileName}</span>`;
  }

  let bodyContent = `
    ${favorBannerHtml}
    <div class="dc-meta-row">
      <span class="dc-badge">${m.category}</span>
      <span class="dc-badge ${threatCls}" data-tip="Threat ${m.threat}/5.">THREAT: ${threatLabel}</span>
      <span class="dc-badge ${locCls}">${m.location === 'FOREIGN' ? `${m.city}, ${m.country}` : `${m.city} [DOMESTIC]`}</span>
      <span class="dc-badge">DEADLINE: ${m.urgencyLeft}d</span>
      ${linkedThreatBadge}
      ${networkModBadge(m)}${hardnessBadge(m)}
    </div>
    ${renderPhaseRoadmap(m)}
  `;

  let replyHtml = '';

  if (m.status === 'INCOMING') {
    const phaseHdr = m.isMultiPhase
      ? `<div style="font-size:11px;color:var(--teal);margin-bottom:8px;font-family:var(--font-mono)">PHASE ${m.currentPhaseIndex + 1} OF ${m.phases.length}: ${m.phases[m.currentPhaseIndex].name.toUpperCase()}</div>`
      : '';
    const hasUnselectedSuspects = m.suspects && m.suspects.length > 1 && m.selectedSuspectIdx === null;

    bodyContent += `
      <div class="dc-section">
        ${phaseHdr}
        <div class="dc-section-title">INTELLIGENCE REPORT</div>
        <div class="dc-report">${m.initialReport}</div>
      </div>
    `;

    if (hasUnselectedSuspects) {
      bodyContent += `
        <div class="dc-section">
          <div class="dc-section-title">SUSPECT IDENTIFICATION</div>
          <div class="suspect-instructions">Director — multiple subjects flagged. Please select the primary target before I can assign an investigation team.</div>
          ${buildSuspectPanel(m, true)}
        </div>
      `;
      replyHtml = buildReplySection([
        { label: 'DECLINE — Archive without action', cls: 'reply-danger',
          onclick: `confirmAction(this, '${m.threat >= 4 ? 'WARNING: Dismissing a high-threat mission will incur a confidence penalty.' : 'Archive this mission without taking action?'}', function(){ dismissMission('${m.id}') })` }
      ]);
    } else {
      const suspectSection = m.suspects && m.suspects.length > 0
        ? `<div class="dc-section"><div class="dc-section-title">IDENTIFIED SUSPECT</div>${buildSuspectPanel(m, false)}</div>` : '';
      const agencyJustHtml = m.agencyJustification
        ? `<div class="agency-justification"><span class="agency-just-lbl">OPERATIONAL AUTHORITY</span><div class="agency-just-text">${m.agencyJustification}</div></div>` : '';
      bodyContent += `${agencyJustHtml}${suspectSection}`;

      // Department assignment as reply options
      const _tmpl = MISSION_TYPES[m.typeId];
      const _phObj = m.isMultiPhase ? m.phases[m.currentPhaseIndex] : null;
      const _effMap = _phObj?.invDeptEfficiency ?? _tmpl?.invDeptEfficiency ?? {};
      const effClass = e => e >= 75 ? 'eff-high' : e >= 50 ? 'eff-med' : 'eff-low';

      const deptButtons = m.invDepts.map(did => {
        const dept = G.depts[did];
        const avail = deptAvail(did);
        const total = dept.capacity;
        const eff = _effMap[did] ?? 50;
        return {
          label: `Assign ${dept.name} to investigate (${avail}/${total} avail, ${eff}% efficiency, ${m.invDays}d)`,
          cls: avail > 0 ? '' : '',
          onclick: `confirmAction(this, 'Deploy 1 ${dept.short} unit to OP ${m.codename} for ${m.invDays} days?', function(){ assignInvestigation('${m.id}','${did}') })`,
          disabled: avail <= 0,
          tip: avail > 0 ? '' : 'No units available.'
        };
      });
      deptButtons.push({
        label: 'DECLINE — Archive without action',
        cls: 'reply-danger',
        onclick: `confirmAction(this, '${m.threat >= 4 ? 'WARNING: Dismissing a high-threat mission will incur a confidence penalty.' : 'Archive this mission without taking action?'}', function(){ dismissMission('${m.id}') })`,
      });
      replyHtml = buildReplySection(deptButtons);
    }

  } else if (m.status === 'INVESTIGATING') {
    const progress = Math.round(((m.invDays - m.invDaysLeft) / m.invDays) * 100);
    const deptName = G.depts[m.assignedInvDept]?.name || '—';
    const phaseLabel = m.isMultiPhase ? ` — ${m.phases[m.currentPhaseIndex].name}` : '';
    bodyContent += `
      <div class="dc-section">
        <div class="dc-section-title">INTELLIGENCE REPORT</div>
        <div class="dc-report">${m.initialReport}</div>
      </div>
      <div class="dc-section">
        <div class="dc-section-title">INVESTIGATION STATUS${phaseLabel}</div>
        <div style="font-size:12px;color:var(--text-dim);margin-bottom:8px;">
          Director — <strong>${deptName}</strong> has 1 unit committed. ${m.invDaysLeft} day(s) remaining. Results will be forwarded upon completion.
        </div>
        <div class="progress-wrap">
          <div class="progress-fill" style="width:${progress}%;background:var(--accent)"></div>
        </div>
      </div>
    `;

  } else if (m.status === 'READY') {
    if (m.phaseFalseFlag) {
      bodyContent += `
        <div class="false-flag-box">
          <div class="false-flag-title">INVESTIGATION ANOMALY DETECTED</div>
          <div class="false-flag-text">${m.phaseFalseFlagText}</div>
        </div>
      `;
      replyHtml = buildReplySection([
        { label: 'Proceed despite anomaly (-25% success probability)', cls: 'reply-danger', onclick: `falseFlagProceed('${m.id}')` },
        { label: 'Order reinvestigation', cls: '', onclick: `falseFlagReinvestigate('${m.id}')` }
      ]);
    } else {
      const phaseLabel = m.isMultiPhase ? ` — ${m.phases[m.currentPhaseIndex].name.toUpperCase()}` : '';
      const intelFields = m.intelFields || [];
      const totalFields = intelFields.length;
      const revealedCnt = intelFields.filter(f => f.revealed).length;
      const allRevealed = totalFields === 0 || revealedCnt === totalFields;
      const outcomeBadge = m.lastInvOutcome
        ? `<span class="intel-outcome-banner outcome-${m.lastInvOutcome.toLowerCase()}">${m.lastInvOutcome.replace('_', ' ')}</span>` : '';
      const intelTable = totalFields > 0 ? `
        <div class="intel-fields-table">
          ${intelFields.map(f => f.revealed
            ? `<div class="intel-field-row intel-field-revealed"><span class="intel-field-label">${f.label}</span><span class="intel-field-value">${f.value}</span></div>`
            : `<div class="intel-field-row intel-field-hidden"><span class="intel-field-label">${f.label}</span><span class="intel-field-value">UNKNOWN</span></div>`
          ).join('')}
        </div>
        <div class="intel-coverage-note">${revealedCnt}/${totalFields} intel fields confirmed ${outcomeBadge}</div>
      ` : '';

      const bonusBadge = m.intelBonus
        ? `<span style="color:var(--green);font-size:10px;font-family:var(--font-mono);margin-left:8px">CRITICAL INTEL BONUS +10%</span>` : '';

      bodyContent += `
        <div class="dc-section">
          <div class="dc-section-title">CLASSIFIED INTELLIGENCE BRIEF${phaseLabel}${bonusBadge}</div>
          ${intelTable}
          <div class="dc-report" style="margin-top:10px">${m.fullReport}</div>
        </div>
      `;

      // Continue investigation option
      if (!allRevealed) {
        const _tmpl2 = MISSION_TYPES[m.typeId];
        const _phObj2 = m.isMultiPhase ? m.phases[m.currentPhaseIndex] : null;
        const _eff2 = _phObj2?.invDeptEfficiency ?? _tmpl2?.invDeptEfficiency ?? {};
        const effCls2 = e => e >= 75 ? 'eff-high' : e >= 50 ? 'eff-med' : 'eff-low';
        bodyContent += `
          <div class="continue-inv-section">
            <div class="dc-section-title">CONTINUE INVESTIGATION</div>
            <div style="font-size:11px;color:var(--text-dim);margin-bottom:8px;">Assign a department to reveal more intel fields.</div>
            <div class="dc-dept-grid">${m.invDepts.map(did => {
              const dept = G.depts[did];
              const avail = deptAvail(did);
              const total = dept.capacity;
              const eff = _eff2[did] ?? 50;
              return `<button class="dc-dept-btn ${avail > 0 ? '' : 'unavail'}" ${avail > 0 ? '' : 'disabled'}
                onclick="assignInvestigation('${m.id}','${did}')">
                ${dept.short} <span class="dc-dept-avail">${avail}/${total}</span>
                <span class="dept-eff-badge ${effCls2(eff)}">${eff}%</span>
              </button>`;
            }).join('')}</div>
          </div>
        `;
      }

      replyHtml = buildReplySection([
        { label: 'APPROVE OPERATION — Configure and execute', cls: 'reply-primary', onclick: `openOperationModal('${m.id}')` },
        { label: 'ARCHIVE — Do not act', cls: 'reply-danger', onclick: `confirmAction(this, '${m.threat >= 4 ? 'WARNING: Dismissing a high-threat mission will incur a confidence penalty.' : 'Archive this mission without taking action?'}', function(){ dismissMission('${m.id}') })` }
      ]);
    }

  } else if (m.status === 'BLOWN') {
    bodyContent += `
      <div class="blown-warning">
        <div class="blown-title">OPERATION COMPROMISED — TARGET ALERTED</div>
        <div class="blown-msg">Director — investigation was exposed. Target is mobilizing. ${m.blownDaysLeft} day(s) before exfiltration window closes. Immediate execution carries a -25% probability penalty.</div>
      </div>
    `;
    replyHtml = buildReplySection([
      { label: 'EXECUTE NOW (-25% penalty)', cls: 'reply-danger', onclick: `openOperationModal('${m.id}')` },
      { label: 'ABORT — Archive', cls: '', onclick: `confirmAction(this, 'Abort the operation and archive?', function(){ dismissMission('${m.id}') })` }
    ]);

  } else if (m.status === 'PHASE_COMPLETE') {
    const nextPh = m.phases[m.currentPhaseIndex];
    const confText = m.lastPhaseConfDelta > 0
      ? `<span class="delta-item delta-pos">CONFIDENCE +${m.lastPhaseConfDelta}%</span>` : '';
    bodyContent += `
      <div class="result-box success">
        <div class="result-title">PHASE COMPLETE: ${m.lastPhaseName}</div>
        <div class="result-msg">${m.lastPhaseMsg}</div>
        <div class="result-deltas">${confText}</div>
      </div>
      <div class="phase-next-box">
        <div class="phase-next-title">NEXT: ${nextPh.name.toUpperCase()}</div>
        <div class="phase-next-desc">${fillTemplate(nextPh.opNarrative, m.currentPhaseFillVars)}</div>
      </div>
    `;
    replyHtml = buildReplySection([
      { label: 'PROCEED TO NEXT PHASE', cls: 'reply-primary', onclick: `acknowledgePhaseProceeding('${m.id}')` }
    ]);

  } else if (m.status === 'EXECUTING') {
    const progress = Math.round(((m.execDays - m.execDaysLeft) / m.execDays) * 100);
    const deployed = (m.assignedExecDepts || []).map(did => {
      const d = G.depts[did]; const cfg = DEPT_CONFIG.find(c => c.id === did);
      return `${d?.short || did} (1 ${cfg?.unitNameSingle || 'unit'})`;
    }).join(', ') || 'None';
    const phaseLabel = m.isMultiPhase
      ? `<div style="font-size:11px;color:var(--teal);margin-bottom:8px;font-family:var(--font-mono)">EXECUTING: ${m.phases[m.currentPhaseIndex].name.toUpperCase()}</div>` : '';
    bodyContent += `
      <div class="dc-section">
        ${phaseLabel}
        <div class="dc-section-title">OPERATION IN PROGRESS</div>
        <div style="font-size:13px;color:var(--purple);margin-bottom:6px;font-family:var(--font-disp);font-weight:600">
          ${m.execDaysLeft} day(s) until operation completion.
        </div>
        <div class="progress-wrap"><div class="progress-fill" style="width:${progress}%;background:var(--purple)"></div></div>
      </div>
      <div class="dc-section">
        <div class="dc-section-title">OPERATION DETAILS</div>
        <div style="font-size:12px;line-height:1.7;color:var(--text-dim);font-style:italic">${m.opNarrative}</div>
        <div style="margin-top:12px;font-size:11px;color:var(--text-dim);line-height:1.9">
          Budget committed: <strong style="color:var(--text)">${fmt(m.assignedBudget)}</strong><br>
          Deployed: <strong style="color:var(--text)">${deployed}</strong><br>
          Estimated success: <strong style="color:${m.successProb >= 70 ? 'var(--green)' : m.successProb >= 45 ? 'var(--amber)' : 'var(--red)'}">${m.successProb}%</strong>
        </div>
      </div>
    `;

  } else if (m.status === 'SUCCESS') {
    if (typeof window.generateDebrief === 'function') {
      m.debriefHtml = window.generateDebrief(m, true);
    }
    bodyContent += `
      <div class="result-box success">
        <div class="result-title">OPERATION SUCCESSFUL</div>
        <div class="result-msg">${m.resultMsg}</div>
        <div class="result-deltas">
          <span class="delta-item delta-pos">CONFIDENCE +${m.confDelta}%</span>
          ${m.budgetDelta > 0 ? `<span class="delta-item delta-pos">BUDGET RECOVERY +${fmt(m.budgetDelta)}</span>` : ''}
        </div>
      </div>
      ${m.debriefHtml || ''}
    `;
    replyHtml = buildReplySection([
      { label: 'ACKNOWLEDGED — Archive this report', cls: '', onclick: `archiveMission('${m.id}')` }
    ]);

  } else if (m.status === 'FAILURE') {
    if (typeof window.generateDebrief === 'function') {
      m.debriefHtml = window.generateDebrief(m, false);
    }
    bodyContent += `
      <div class="result-box failure">
        <div class="result-title">OPERATION FAILED</div>
        <div class="result-msg">${m.resultMsg}</div>
        <div class="result-deltas">
          <span class="delta-item delta-neg">CONFIDENCE ${m.confDelta}%</span>
        </div>
      </div>
      ${m.debriefHtml || ''}
    `;
    replyHtml = buildReplySection([
      { label: 'ACKNOWLEDGED — Archive this report', cls: '', onclick: `archiveMission('${m.id}')` }
    ]);

  } else if (m.status === 'DEAD_END') {
    const suspectAlias = m.suspects?.[m.selectedSuspectIdx]?.alias || 'UNKNOWN';
    bodyContent += `
      <div class="dead-end-box">
        <div class="dead-end-title">INVESTIGATION INCONCLUSIVE</div>
        <div class="dead-end-msg">Director — subject "${suspectAlias}" is not linked to the identified threat. The real actor remains at large.</div>
      </div>
      <div class="dc-section" style="margin-top:12px">
        <div class="dc-section-title">ASSESSED SUSPECT</div>
        ${buildSuspectPanel(m, false)}
      </div>
    `;
    replyHtml = buildReplySection([
      { label: 'Reassign surveillance (-1 urgency day)', cls: '', onclick: `confirmAction(this, 'Reassign surveillance? This will cost 1 urgency day.', function(){ reassignSuspect('${m.id}') })` },
      { label: 'Dismiss this mission', cls: 'reply-danger', onclick: `confirmAction(this, 'Dismiss this mission permanently?', function(){ dismissMission('${m.id}') })` }
    ]);

  } else if (m.status === 'EXPIRED') {
    bodyContent += `
      <div class="result-box failure">
        <div class="result-title">MISSION WINDOW CLOSED</div>
        <div class="result-msg">The deadline has passed. No action was taken.</div>
      </div>
    `;
    replyHtml = buildReplySection([
      { label: 'ACKNOWLEDGED — Archive', cls: '', onclick: `archiveMission('${m.id}')` }
    ]);

  } else if (m.status === 'ARCHIVED') {
    const wasSuccess = m.confDelta > 0;
    if (typeof window.generateDebrief === 'function') {
      m.debriefHtml = window.generateDebrief(m, wasSuccess);
    }
    bodyContent += `
      <div class="result-box ${wasSuccess ? 'success' : 'failure'}">
        <div class="result-title">${wasSuccess ? 'OPERATION SUCCESSFUL' : 'OPERATION CLOSED'}</div>
        <div class="result-msg">${m.resultMsg || 'No further details available.'}</div>
      </div>
      ${m.debriefHtml || ''}
      <div style="font-family:var(--font-mono);font-size:9px;color:var(--text-muted);margin-top:8px">ARCHIVED — DAY ${m.archivedDay || '?'}</div>
    `;
  }

  // Build email signature
  const sigHtml = typeof buildEmailSignature === 'function' ? buildEmailSignature(sender) : '';

  paneEl.innerHTML = `<div class="email-wrap">
    ${emailHeader}
    <div class="email-body">
      ${bodyContent}
      ${sigHtml}
    </div>
    ${replyHtml}
  </div>`;

  // Targeted animation: reveal result boxes on first view after resolution
  if (m._resultNew && (m.status === 'SUCCESS' || m.status === 'FAILURE')) {
    delete m._resultNew;
    requestAnimationFrame(() => {
      const box = paneEl.querySelector('.result-box');
      if (box) box.classList.add('result-reveal');
    });
  }
}

// Render threats directly in the reading pane
function renderThreatsInPane(paneEl) {
  if (typeof pruneClosedHvts === 'function') pruneClosedHvts();
  // Re-use existing renderThreats logic but output to paneEl
  const el = document.getElementById('threats-panel');
  if (el) renderThreats(); // populate hidden element
  paneEl.innerHTML = `
    <div class="email-body">
      <div class="dc-section-title">THREAT FILES — ACTIVE DOSSIERS</div>
      ${el ? el.innerHTML : '<div class="no-ops-msg">No tracked threats.</div>'}
    </div>
  `;
}

// Render agencies in reading pane
function renderAgenciesInPane(paneEl) {
  if (!G.cfg?.partnerAgencies) { paneEl.innerHTML = '<div class="no-ops-msg">No agency data.</div>'; return; }
  const cards = Object.entries(G.cfg.partnerAgencies).map(([id, agCfg]) => {
    const rel = G.relations?.[id]?.relation ?? 0;
    const barCls = rel >= 70 ? 'rel-high' : rel >= 40 ? 'rel-med' : 'rel-low';
    const typeLabel = agCfg.type === 'domestic' ? 'DOMESTIC COUNTER-INTELLIGENCE'
      : agCfg.type === 'military' ? 'MILITARY INTELLIGENCE' : 'FOREIGN INTELLIGENCE';
    return `<div class="dc-section">
      <div class="dc-section-title">${agCfg.name}</div>
      <div style="font-size:10px;color:var(--text-dim);margin-bottom:6px">${typeLabel}</div>
      <div style="font-size:11px;color:var(--text);line-height:1.6;margin-bottom:10px">${agCfg.desc || ''}</div>
      <div class="dept-capacity-row">
        <div class="dept-cap-bar-wrap"><div class="dept-cap-bar-fill ${barCls}" style="width:${rel}%"></div></div>
        <span class="dept-cap-label" style="color:${rel >= 70 ? 'var(--green)' : rel >= 40 ? 'var(--amber)' : 'var(--red)'}">${rel}/100 RELATION</span>
      </div>
      ${agCfg.support ? `<div style="margin-top:8px;font-size:10px;color:var(--text-dim)">
        ${agCfg.support.map(s => `<div style="padding:2px 0">▸ ${s.label} — ${s.desc} (cost: ${s.cost} rel)</div>`).join('')}
      </div>` : ''}
    </div>`;
  }).join('');
  paneEl.innerHTML = `<div class="email-body">${cards}</div>`;
}

// Render geopolitics in reading pane
function renderGeoInPane(paneEl) {
  // Ensure geo-panel is up-to-date before copying (it normally updates in render:after, after the reading pane)
  if (typeof window.renderGeoPanel === 'function') window.renderGeoPanel();
  const geoEl = document.getElementById('geo-panel');
  paneEl.innerHTML = `
    <div class="email-body">
      <div class="dc-section-title">GLOBAL THEATER STATUS</div>
      ${geoEl ? geoEl.innerHTML : '<div class="no-ops-msg">Monitoring global theaters...</div>'}
    </div>
  `;
}

// Render departments in reading pane
function renderDeptsInPane(paneEl) {
  const deptEl = document.getElementById('dept-panel');
  if (deptEl) renderDepts(); // populate hidden element
  const activeEl = document.getElementById('active-ops-panel');
  if (activeEl) renderActiveOps(); // populate hidden element
  paneEl.innerHTML = `
    <div class="email-body">
      <div class="dc-section-title">DEPARTMENT STATUS</div>
      ${deptEl ? deptEl.innerHTML : ''}
      <div class="dc-section-title" style="margin-top:16px">ACTIVE OPERATIONS</div>
      ${activeEl ? activeEl.innerHTML : '<div class="no-ops-msg">No active operations.</div>'}
    </div>
  `;
}

// Render elite roster in reading pane
function renderRosterInPane(paneEl) {
  // The operatives.js module renders into a #roster-panel element.
  // We create one inside the reading pane so it has somewhere to render.
  paneEl.innerHTML = `
    <div class="email-body">
      <div class="dc-section-title">ELITE UNITS — AGENCY ROSTER</div>
      <div id="roster-panel"></div>
    </div>
  `;
  // If renderRoster exists (from operatives.js), call it to populate
  if (typeof renderRoster === 'function') renderRoster();
}

// Keep old renderDetail as compatibility stub
function renderDetail() {
  // No-op: reading pane handles this now
}

function renderDepts() {
  const el = document.getElementById('dept-panel');
  el.innerHTML = DEPT_CONFIG.map(dcfg => {
    const dept    = G.depts[dcfg.id];
    const alloc   = deptAllocated(dcfg.id);
    const avail   = dept.capacity - alloc;
    const cap     = dept.capacity;
    const pct     = cap > 0 ? Math.round((alloc / cap) * 100) : 0;
    const barColor = avail === 0 ? 'var(--red)' : avail <= 1 ? 'var(--amber)' : 'var(--green)';
    const assigns  = deptAssignments(dcfg.id);

    const assignList = assigns.length > 0
      ? assigns.map(a => {
          const icon = a.phase === 'INV' ? '🔍' : '⚡';
          return `<div class="dept-assign-entry" onclick="selectMission('${a.id}')"
            style="cursor:pointer" data-tip="Click to view OP ${a.codename}">
            ${icon} OP ${a.codename} <span style="color:var(--text-dim)">${a.phase} · ${a.daysLeft}d</span>
          </div>`;
        }).join('')
      : '';

    return `<div class="dept-card" data-tip="${dcfg.tip}">
      <div class="dept-name">${dcfg.name}</div>
      <div class="dept-desc">${dcfg.desc}</div>
      <div class="dept-capacity-row">
        <div class="dept-cap-bar-wrap">
          <div class="dept-cap-bar-fill" style="width:${pct}%;background:${barColor}"></div>
        </div>
        <span class="dept-cap-label" style="color:${barColor}">${avail}/${cap} ${dcfg.unitName}</span>
      </div>
      ${assignList ? `<div class="dept-assign-list">${assignList}</div>` : ''}
    </div>`;
  }).join('');
}

function renderActiveOps() {
  const ops = G.missions.filter(m => m.status === 'EXECUTING');
  document.getElementById('active-count').textContent = ops.length;
  const el = document.getElementById('active-ops-panel');
  if (ops.length === 0) {
    el.innerHTML = '<div class="no-ops-msg">No active operations.</div>';
    return;
  }
  el.innerHTML = ops.map(m => {
    const progress = Math.round(((m.execDays - m.execDaysLeft) / m.execDays) * 100);
    const phaseTag = m.isMultiPhase
      ? ` <span style="font-size:9px;color:var(--teal)">· ${m.phases[m.currentPhaseIndex].shortName}</span>`
      : '';
    const deptTags = (m.assignedExecDepts || []).map(did => G.depts[did]?.short || did).join(' · ');
    return `<div class="active-op-card" onclick="selectMission('${m.id}')" style="cursor:pointer"
      data-tip="${m.execDaysLeft}d remaining · ${m.successProb}% success est.${m.isMultiPhase ? ` · Phase ${m.currentPhaseIndex + 1}/${m.phases.length}` : ''}">
      <div class="aoc-name">OP ${m.codename}${phaseTag}</div>
      <div class="aoc-days">${m.execDaysLeft}d · ${m.successProb}% est.<span style="font-size:9px;color:var(--text-dim);margin-left:6px">${deptTags}</span></div>
      <div class="progress-wrap" style="margin-top:4px">
        <div class="progress-fill" style="width:${progress}%;background:var(--purple)"></div>
      </div>
    </div>`;
  }).join('');
}

function renderThreats() {
  const countEl = document.getElementById('threat-count');
  const panelEl = document.getElementById('threats-panel');
  if (!countEl || !panelEl) return;
  pruneClosedHvts();

  const tracked     = G.hvts.filter(h => h.status === 'ACTIVE' || h.status === 'DETAINED' || h.status === 'TRACKED');
  countEl.textContent = tracked.length;

  if (G.hvts.length === 0) {
    panelEl.innerHTML = '<div class="no-ops-msg">No tracked threats.</div>';
    return;
  }

  const buildCard = h => {
    const typeBadge = `<span class="threat-type-badge ${h.type === 'HVT' ? 'hvt-badge' : 'org-badge'}">${h.type}</span>`;
    const hCfg = h.type === 'HVT' ? (HVT_HARDNESS[h.hardness || 'MODERATE'] || HVT_HARDNESS.MODERATE) : null;
    const hardnessBadge = hCfg ? `<span class="threat-hardness-badge" style="color:${hCfg.color};border-color:${hCfg.color}" data-tip="Target classification: ${hCfg.label}&#10;Threat modifier: ${hCfg.threatMod >= 0 ? '+' : ''}${hCfg.threatMod}">${hCfg.label}</span>` : '';

    // Status chip
    const statusChipMap = {
      ACTIVE:       `<span class="threat-status-chip threat-status-active">ACTIVE</span>`,
      TRACKED:      `<span class="threat-status-chip threat-status-tracked">TRACKED</span>`,
      NEUTRALIZED:  `<span class="threat-status-chip threat-status-neutralized">NEUTRALIZED</span>`,
      DETAINED:     `<span class="threat-status-chip threat-status-detained">DETAINED</span>`,
      ELIMINATED:   `<span class="threat-status-chip threat-status-eliminated">ELIMINATED</span>`,
      HANDED_OVER:  `<span class="threat-status-chip threat-status-handed-over">TRANSFERRED</span>`,
    };
    const statusChip = statusChipMap[h.status] || `<span class="threat-status-chip">${h.status}</span>`;

    const knownHtml = Object.entries(h.knownFields || {}).filter(([, v]) => v).map(([k, v]) => {
      const val = String(v);
      // Multi-value fields (comma-separated) get bullet points — except location fields
      const locationKeys = new Set(['city', 'country', 'baselocation', 'base', 'location', 'address']);
      const parts = val.includes(',') && !locationKeys.has(k.toLowerCase()) ? val.split(',').map(s => s.trim()).filter(Boolean) : null;
      const capitalize = s => s.charAt(0).toUpperCase() + s.slice(1);
      if (parts && parts.length > 1) {
        return `<div class="threat-field-row threat-field-block">
          <span class="threat-field-key">${k.toUpperCase()}</span>
          <div class="threat-field-list">${parts.map(p => `<div class="threat-field-list-item">▸ ${capitalize(p)}</div>`).join('')}</div>
        </div>`;
      }
      return `<div class="threat-field-row">
        <span class="threat-field-key">${k.toUpperCase()}</span>
        <span class="threat-field-val">${capitalize(val)}</span>
      </div>`;
    }).join('');

    const gapsHtml = h.gaps && h.gaps.length > 0 && h.status === 'ACTIVE'
      ? `<div class="threat-gaps">
          <div class="threat-gaps-title">INTEL GAPS</div>
          ${h.gaps.map(g => `<div class="threat-gap-item">• ${g}</div>`).join('')}
        </div>`
      : '';

    const linkedBadges = h.linkedMissionIds.map(mid => {
      const m = getMission(mid);
      return m ? `<span class="threat-linked-badge" onclick="followMission('${mid}')" style="cursor:pointer">OP ${m.codename}</span>` : '';
    }).filter(Boolean).join('');

    // Check if there's already an active player-initiated mission for this threat
    const activeMissionStatuses = new Set(['INCOMING', 'INVESTIGATING', 'READY', 'BRIEF_READY', 'EXECUTING', 'PHASE_COMPLETE']);
    const hasActiveMission = G.missions.some(m =>
      m.linkedHvtId === h.id && activeMissionStatuses.has(m.status)
    );
    const hasActiveOrgOp = h.linkedPlotId && G.missions.some(m =>
      (m.isOrgInfiltration || m.isOrgTakedown) &&
      m.plotId === h.linkedPlotId &&
      activeMissionStatuses.has(m.status)
    );
    const opBusy = hasActiveMission || hasActiveOrgOp;
    const busyTip = 'An operation targeting this threat is already in progress.';

    // Cooldown & status-specific action sections
    const cooldownActive = h.cooldownUntil && G.day < h.cooldownUntil;
    let actionSection = '';

    if (opBusy) {
      actionSection = `<div class="surv-indicator" style="color:var(--accent)">◉ OPERATION IN PROGRESS</div>`;
    } else if (cooldownActive && (h.status === 'ACTIVE' || h.status === 'TRACKED')) {
      actionSection = `<div class="surv-indicator" style="color:var(--text-dim)">◉ TARGET UNDERGROUND — OPERATIONS SUSPENDED</div>`;
    }
    // ORG entries have their own action logic (infiltrate / takedown)
    else if (h.type === 'ORG' && h.linkedPlotId && h.status === 'ACTIVE') {
      const plot = G.plots?.find(p => p.id === h.linkedPlotId);
      if (plot) {
        const intel = plot.knownIntel || {};
        const hasIntel = intel.leader || intel.objective || intel.strength; // beyond auto-revealed type/baseLocation
        const allIntel = intel.type && intel.leader && intel.objective && intel.strength && intel.baseLocation;
        const infiltrated = !!plot.infiltrated;
        const canTakedown = allIntel && infiltrated;

        let orgBtns = '';
        if (infiltrated) {
          orgBtns += `<div class="surv-indicator" style="color:var(--green)">◉ INFILTRATED — +10% on linked ops</div>`;
        }
        if (!infiltrated && hasIntel) {
          orgBtns += `<button class="btn-threat-assign" onclick="spawnOrgInfiltration('${plot.id}')" data-tip="Launch multi-phase infiltration op. Requires at least 1 intel field beyond type/location.">INFILTRATE</button>`;
        } else if (!infiltrated && !hasIntel) {
          orgBtns += `<button class="btn-threat-assign unavail" disabled data-tip="Gather more intel on this organization before attempting infiltration.">INFILTRATE</button>`;
        }
        if (canTakedown) {
          orgBtns += `<button class="btn-threat-assign danger" onclick="spawnOrgTakedown('${plot.id}')" data-tip="Launch full org takedown. Requires ALL intel + active infiltration.">TAKEDOWN</button>`;
        } else {
          const missing = [];
          if (!allIntel) missing.push('full intel');
          if (!infiltrated) missing.push('infiltration');
          orgBtns += `<button class="btn-threat-assign unavail" disabled data-tip="Requires: ${missing.join(' + ')}">TAKEDOWN</button>`;
        }

        actionSection = `<div class="threat-handover-row">${orgBtns}</div>`;
      }
    } else if (h.status === 'ACTIVE') {
      const trackTypeId = h.location === 'DOMESTIC' ? 'HVT_SURVEILLANCE_DOM' : 'HVT_SURVEILLANCE_FOR';
      const trackAvail = MISSION_TYPES[trackTypeId];
      actionSection = `
        <div class="threat-handover-row">
          ${trackAvail ? `<button class="btn-threat-assign" onclick="spawnHvtMission('${h.id}','${trackTypeId}')">TRACK</button>` : ''}
        </div>`;
    } else if (h.status === 'TRACKED') {
      actionSection = `
        <div class="surv-indicator">◉ SURVEILLANCE ESTABLISHED</div>
        <div class="threat-handover-row">
          <button class="btn-threat-assign" onclick="spawnHvtMission('${h.id}','${h.location === 'DOMESTIC' ? 'HVT_ABDUCTION_DOM' : 'HVT_ABDUCTION_FOR'}')">ABDUCT</button>
          <button class="btn-threat-assign" onclick="spawnHvtMission('${h.id}','${h.location === 'DOMESTIC' ? 'DOMESTIC_HVT' : 'FOREIGN_HVT'}')">ELIMINATE</button>
          <button class="btn-threat-action" onclick="dropSurveillance('${h.id}')" data-tip="Abandon surveillance. Target reverts to ACTIVE.">DROP SURV.</button>
        </div>`;
    } else if (h.status === 'DETAINED') {
      const daysCustody = G.day - (h.detainedDay || G.day);
      const interrogCount = h.interrogationCount || 0;
      // Build handover buttons filtered by location compatibility
      const handoverBtns = Object.entries(G.cfg?.partnerAgencies || {})
        .filter(([, agCfg]) => {
          if (agCfg.type === 'domestic' && h.location === 'FOREIGN') return false;
          if (agCfg.type !== 'domestic' && h.location === 'DOMESTIC') return false;
          return true;
        })
        .map(([agencyId, agCfg]) =>
          `<button class="btn-threat-action handover-btn" onclick="handoverTarget('${h.id}','${agencyId}')" data-tip="Hand over to ${agCfg.name}. Relation +10-15.">→ ${agCfg.shortName}</button>`
        ).join('');
      actionSection = `
        <div class="detention-info">HELD AT: ${h.detainedAt || '—'} · Day ${daysCustody} in custody</div>
        <div class="threat-interrogate-count">${interrogCount}/3 SESSIONS</div>
        <div class="threat-handover-row">
          <button class="btn-threat-action ${interrogCount >= 3 || (h.interrogationCooldown && G.day < h.interrogationCooldown) ? 'unavail' : ''}" onclick="interrogateTarget('${h.id}')"
            data-tip="${h.interrogationCooldown && G.day < h.interrogationCooldown ? 'Subject recovering. Next session in ' + (h.interrogationCooldown - G.day) + ' days.' : 'Conduct interrogation session. Yields Intel + 60% chance to reveal a new HVT from the same network. Max 3 sessions. 7-day cooldown between sessions.'}">
            INTERROGATE ${interrogCount}/3${h.interrogationCooldown && G.day < h.interrogationCooldown ? ' (' + (h.interrogationCooldown - G.day) + 'd)' : ''}
          </button>
          <button class="btn-threat-action" onclick="releaseTarget('${h.id}')"
            data-tip="Release target and reinstate surveillance. Subject returns to TRACKED status — useful for passive intelligence gathering.">RELEASE</button>
          <button class="btn-threat-action danger" onclick="executeTarget('${h.id}')"
            data-tip="Execute the target. +3-7 confidence.">EXECUTE</button>
        </div>
        ${handoverBtns ? `<div class="threat-handover-row">${handoverBtns}</div>` : ''}
        ${typeof window.renderFactionTransferBtns === 'function' ? window.renderFactionTransferBtns(h) : ''}`;
    } else if (h.status === 'ELIMINATED') {
      actionSection = `<div class="threat-fate-badge threat-status-eliminated" style="padding:3px 8px">ELIMINATED — D${h.addedDay}</div>`;
    } else if (h.status === 'HANDED_OVER') {
      const agName = G.cfg?.partnerAgencies?.[h.handedTo]?.name || (typeof FACTIONS !== 'undefined' && FACTIONS[h.handedTo] ? FACTIONS[h.handedTo].name : null) || h.handedTo || '—';
      actionSection = `<div class="threat-fate-badge threat-status-handed-over" style="padding:3px 8px">Transferred to ${agName}</div>`;
    }

    const cardCls = (h.status === 'ACTIVE' || h.status === 'TRACKED' || h.status === 'DETAINED')
      ? 'threat-card-active'
      : 'threat-card-neutralized';

    const cooldownHtml = cooldownActive
      ? `<div class="threat-cooldown">TARGET UNDERGROUND — est. ${vagueEstimate(h.cooldownUntil - G.day)}</div>`
      : '';

    return `<div class="threat-card ${cardCls}">
      <div class="threat-card-hdr">
        ${typeBadge}
        <span class="threat-alias">${h.alias}</span>
        ${hardnessBadge}
        ${statusChip}
      </div>
      <div class="threat-role">${roleWithTip(h.role)}</div>
      <div class="threat-org">${h.org}</div>
      ${knownHtml ? `<div class="threat-known-fields">${knownHtml}</div>` : ''}
      ${gapsHtml}
      ${linkedBadges ? `<div class="threat-linked">${linkedBadges}</div>` : ''}
      ${cooldownHtml}
      ${actionSection}
    </div>`;
  };

  const active      = G.hvts.filter(h => h.status === 'ACTIVE');
  const trackedHvts = G.hvts.filter(h => h.status === 'TRACKED');
  const detained    = G.hvts.filter(h => h.status === 'DETAINED');
  const neutralized = G.hvts.filter(h => h.status === 'NEUTRALIZED');
  const eliminated  = G.hvts.filter(h => h.status === 'ELIMINATED' || h.status === 'HANDED_OVER');

  let html = '';
  if (trackedHvts.length > 0) html += `<div class="threat-section-title">UNDER SURVEILLANCE</div>${trackedHvts.map(buildCard).join('')}`;
  if (active.length > 0)    html += `<div class="threat-section-title">ACTIVE THREATS</div>${active.map(buildCard).join('')}`;
  if (detained.length > 0)  html += `<div class="threat-section-title">DETAINED</div>${detained.map(buildCard).join('')}`;
  if (neutralized.length > 0) html += `<div class="threat-section-title">NEUTRALIZED</div>${neutralized.map(buildCard).join('')}`;
  if (eliminated.length > 0) html += `<div class="threat-section-title">CLOSED</div>${eliminated.map(buildCard).join('')}`;
  panelEl.innerHTML = html;
}

window.dropSurveillance = function(hvtId) {
  const h = G.hvts.find(x => x.id === hvtId);
  if (!h || !h.surveillanceEstablished) return;
  h.surveillanceEstablished = false;
  if (h.status === 'TRACKED') h.status = 'ACTIVE';
  addLog(`Surveillance on ${h.alias} terminated. Target reverted to ACTIVE.`, 'log-warn');
  render();
};

function renderLog() {
  const el = document.getElementById('event-log');
  el.innerHTML = G.log.slice(0, 8).map(e => `<div class="log-entry ${e.cls}">${e.text}</div>`).join('');
}

// =============================================================================
// TOOLTIP SYSTEM
// =============================================================================

function initTooltips() {
  const tip = document.createElement('div');
  tip.id = 'game-tooltip'; tip.className = 'game-tooltip';
  document.body.appendChild(tip);
  document.addEventListener('mousemove', e => {
    const el = e.target.closest('[data-tip]');
    if (el && el.dataset.tip) {
      tip.textContent = el.dataset.tip;
      tip.classList.add('visible');
      tip.style.left = '0px'; tip.style.top = '0px';
      requestAnimationFrame(() => {
        const z = parseFloat(getComputedStyle(document.documentElement).zoom) || 1;
        const mx = e.clientX / z, my = e.clientY / z;
        const tw = tip.offsetWidth, th = tip.offsetHeight;
        const vw = window.innerWidth / z, vh = window.innerHeight / z;
        const preferX = mx + 12;
        const preferY = my + 14;
        const lx = Math.min(preferX, vw - tw - 10);
        const ly = (preferY + th + 10 > vh)
          ? my - th - 8
          : preferY;
        tip.style.left = Math.max(8, lx) + 'px';
        tip.style.top  = Math.max(8, ly) + 'px';
      });
    } else {
      tip.classList.remove('visible');
    }
  });
  document.addEventListener('mouseleave', () => tip.classList.remove('visible'));
}

// =============================================================================
// HELP MODAL
// =============================================================================

function showHelp() {
  document.getElementById('modal-title').textContent = 'DIRECTOR\'S HANDBOOK';
  document.getElementById('modal-body').innerHTML = `
    <div class="help-content">
      <div class="help-section">
        <div class="help-section-title">OVERVIEW</div>
        <p>You are the Director of a covert intelligence agency. Missions arrive as raw intelligence reports. Investigate them, decide what to act on, and execute operations before the window closes. Keep Confidence above zero to stay in command.</p>
      </div>

      <div class="help-section">
        <div class="help-section-title">DEPARTMENT RESOURCES</div>
        <p>Each department has a limited pool of units (desks, cells, squads, etc.). Assigning a department to investigate or execute a mission commits one unit for the duration. Multiple missions can draw from the same department simultaneously, as long as capacity allows.</p>
        <p style="margin-top:8px">Monitor capacity in the Departments panel. A full department (0 available) cannot accept new assignments until an active mission concludes.</p>
        ${DEPT_CONFIG.map(d => `<div class="help-dept-row">
          <div class="help-dept-name">${d.name} <span style="color:var(--text-dim);font-weight:400">(${d.unitName})</span></div>
          <div class="help-dept-tip">${d.tip}</div>
        </div>`).join('')}
      </div>

      <div class="help-section">
        <div class="help-section-title">MISSION FLOW</div>
        <div class="help-flow">
          <div class="help-flow-step"><span class="help-step-num">1</span><div><strong>INCOMING</strong> — Assign a department to investigate. Costs 1 unit for the investigation period.</div></div>
          <div class="help-flow-step"><span class="help-step-num">2</span><div><strong>INVESTIGATING</strong> — Department works the case. Intel fields are revealed progressively.</div></div>
          <div class="help-flow-step"><span class="help-step-num">3</span><div><strong>BRIEF READY</strong> — Full intel unlocked. Approve or archive. All fields confirmed grants a +10% intel bonus.</div></div>
          <div class="help-flow-step"><span class="help-step-num">4</span><div><strong>CONFIGURE</strong> — Set budget, departments (recommended +12%, optional +5%), and agency support assets. Intel support assets count as revealed fields for probability.</div></div>
          <div class="help-flow-step"><span class="help-step-num">5</span><div><strong>EXECUTING</strong> — Operation runs. Each assigned department has one unit committed until resolution.</div></div>
          <div class="help-flow-step"><span class="help-step-num">6</span><div><strong>RESULT</strong> — Earn confidence and XP. Archive to clear.</div></div>
        </div>
      </div>

      <div class="help-section">
        <div class="help-section-title">MULTI-PHASE OPERATIONS</div>
        <p>Some operations span multiple phases — surveillance, evidence collection, and a final action. Each phase requires its own investigation and execution. False flag anomalies can occur mid-investigation: proceed with a probability penalty or reinvestigate.</p>
        <p style="margin-top:8px">Infiltration ops (3 phases) and Org Takedowns (4 phases) are the longest multi-phase operations in the game.</p>
      </div>

      <div class="help-section">
        <div class="help-section-title">INTER-AGENCY RELATIONS</div>
        <p>The agency bar below the header shows your relationship with partner agencies (domestic bureau, foreign intelligence, military). Relations range from 0 to 100.</p>
        <p style="margin-top:8px"><strong>Favor missions</strong> appear periodically from agencies with relation 25+. Completing favors improves the relationship; failing them damages it.</p>
        <p style="margin-top:8px"><strong>Agency support</strong> can be requested during operation configuration. Each asset costs relation points with that agency. Support types include execution probability bonuses (+X%) and intel field bonuses (+N fields revealed).</p>
      </div>

      <div class="help-section">
        <div class="help-section-title">THREATS & HVT TRACKER</div>
        <p>The Threats tab tracks High-Value Targets and hostile Organizations. HVTs progress through a lifecycle:</p>
        <div class="help-flow" style="margin-top:6px">
          <div class="help-flow-step"><span class="help-step-num" style="background:var(--red-dim)">A</span><div><strong>ACTIVE</strong> — Target at large. Use TRACK to launch a surveillance mission.</div></div>
          <div class="help-flow-step"><span class="help-step-num" style="background:var(--accent2)">T</span><div><strong>TRACKED</strong> — Under surveillance. Choose ABDUCT (capture alive) or ELIMINATE (neutralize). Surveillance <strong>expires</strong> after 20–40 days — target reverts to ACTIVE if not acted upon.</div></div>
          <div class="help-flow-step"><span class="help-step-num" style="background:var(--amber-dim)">D</span><div><strong>DETAINED</strong> — In custody. INTERROGATE (max 3 sessions — yields Intel + 60% chance to reveal a new HVT from the same network), RELEASE (return to TRACKED for passive intelligence), EXECUTE (+confidence), HAND OVER to a partner agency (+relation), or FACTION TRANSFER (intel-type HVTs only — earn Intel).</div></div>
        </div>
        <p style="margin-top:8px"><strong>Passive intelligence:</strong> TRACKED HVTs affiliated with a faction or ORG have a 10% daily chance to yield Intel and expose a new ACTIVE target from their network — making RELEASE a strategic option.</p>
        <p style="margin-top:8px">Failed HVT and counter-terror ops automatically register escaped targets as ACTIVE threats.</p>
      </div>

      <div class="help-section">
        <div class="help-section-title">HVT HARDNESS</div>
        <p>Every HVT is classified by <strong>hardness</strong> — how difficult they are to operate against. Classification is based on the target's role:</p>
        <div style="font-size:10px;line-height:1.8;margin-top:6px">
          <span style="color:#2ecc71"><strong>SOFT</strong></span> — Scientists, technical specialists, forgers. Low counter-surveillance training. Cooldown: 3–10 days. Threat: −1.<br>
          <span style="color:#f39c12"><strong>MODERATE</strong></span> — Terrorists, criminals, couriers, facilitators, financiers. Operational but not tradecraft-trained. Cooldown: 7–25 days.<br>
          <span style="color:#e74c3c"><strong>HARD</strong></span> — Intelligence officers, espionage operatives, hostile state agents. Trained in tradecraft and counter-surveillance. Cooldown: 25–60 days. Threat: +1.<br>
          <span style="color:#c0392b"><strong>ELITE</strong></span> — Senior commanders, military chiefs, paramilitary leaders. Heavily protected. Cooldown: 40–90 days. Threat: +1.
        </div>
        <p style="margin-top:8px"><strong>Cooldown:</strong> When an operation against an HVT fails, the target goes to ground for a duration based on their hardness. During cooldown, all operations against that target are suspended. You'll receive a briefing when the target resurfaces.</p>
        <p style="margin-top:8px"><strong>Threat modifier:</strong> Missions spawned from the threats panel have their threat level adjusted by the target's hardness — SOFT targets generate easier ops, HARD and ELITE targets generate harder ones.</p>
      </div>

      <div class="help-section">
        <div class="help-section-title">LONG PLOTS & ORGANIZATIONS</div>
        <p>Hostile organizations run persistent plots — linked chains of missions that escalate over time. After enough linked missions are resolved, analysts flag the pattern and open a <strong>FILE</strong>. The organization appears in the Threats tab as an ORG entry.</p>
        <p style="margin-top:8px"><strong>Dismantling an org requires two major operations:</strong></p>
        <div class="help-flow" style="margin-top:6px">
          <div class="help-flow-step"><span class="help-step-num" style="background:var(--purple)">1</span><div><strong>INFILTRATE</strong> (3-phase op) — Available when you have intel beyond type/location. On success: +10% bonus on all ops against that org.</div></div>
          <div class="help-flow-step"><span class="help-step-num" style="background:var(--red)">2</span><div><strong>TAKEDOWN</strong> (4-phase op) — Available only when ALL intel is confirmed AND the org is infiltrated. On success: org permanently destroyed.</div></div>
        </div>
        <p style="margin-top:8px">Intel is revealed progressively through successful linked missions. Interrogating detained org members can also reveal intelligence.</p>
        <p style="margin-top:8px"><strong>Infiltration decay:</strong> Infiltrated organizations have a 20% chance each year to lose their infiltration status — the inside asset is compromised through routine security tightening. The +10% bonus and weekly Intel production cease, and a new infiltration operation must be launched.</p>
      </div>

      <div class="help-section">
        <div class="help-section-title">DEFCON</div>
        <p>The <strong>DEFCON</strong> badge reflects your operational pressure — how stretched your resources are right now.</p>
        <p style="margin-top:4px">
          <span style="color:#3cbf3c">DEFCON 5</span> (relaxed) →
          <span style="color:#2cc4b0">4</span> →
          <span style="color:#d4a017">3</span> →
          <span style="color:#e04040">2</span> →
          <span style="color:#ff2020">DEFCON 1</span> (overwhelmed)
        </p>
        <p style="margin-top:8px">Calculated from department utilization (70% weight) and unhandled inbox missions (30% weight). DEFCON drops when departments are near capacity and missions pile up. It rises when you have spare resources. Expand department capacity via upgrades to keep pressure manageable.</p>
      </div>

      <div class="help-section">
        <div class="help-section-title">ELITE UNITS</div>
        <p>As departments gain experience, elite specialist units can be created — dedicated teams attached to specific operations for a probability bonus. Maximum ${MAX_ELITE_UNITS} active elite units at any time; duplicate department types are not permitted (e.g., only one SIGINT elite can be active).</p>
        <p style="margin-top:8px"><strong>Cooldown:</strong> After deployment, an elite unit is unavailable for 7 days. Plan assignments carefully.</p>
        <p style="margin-top:8px"><strong>Risk of loss:</strong> When an operation with attached elite units fails, those units may be lost permanently:</p>
        <div class="help-flow" style="margin-top:6px">
          <div class="help-flow-step"><span class="help-step-num" style="background:var(--red)">KIA</span><div>Confirmed killed in action. Applies to direct-action types: field teams, strike elements, handlers, cells.</div></div>
          <div class="help-flow-step"><span class="help-step-num" style="background:var(--red)">MIA</span><div>Missing in action — no recovered bodies. Applies to the same direct-action types.</div></div>
          <div class="help-flow-step"><span class="help-step-num" style="background:var(--amber)">BURNED</span><div>Cover compromised, identity exposed. Applies to intelligence types: desks, stations, intercept teams.</div></div>
        </div>
        <p style="margin-top:8px">Lost units are honored in the <strong>Hall of Fame</strong> section of the roster panel.</p>
      </div>

      <div class="help-section">
        <div class="help-section-title">GEOPOLITICS</div>
        <p>The world is divided into 8 <strong>theaters of operation</strong>, each with a base volatility reflecting real-world instability. The <strong>GEO</strong> tab shows all theaters with their current risk level (1–5) and any active geopolitical events.</p>
        <p style="margin-top:8px"><strong>Theaters</strong> (ordered by volatility):</p>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:2px 12px;margin-top:4px;font-size:10px">
          <div><span class="geo-svg-icon" style="width:12px;height:12px;color:#e67e22"><svg viewBox="0 0 64 64" fill="currentColor"><path d="M8 50h48v-8c0-16-10-28-24-34C18 14 8 26 8 42z"/><rect x="6" y="50" width="52" height="6" rx="1"/><rect x="31" y="4" width="2" height="6"/><path d="M36 11a5 5 0 11-8 0 3.5 3.5 0 108 0z"/></svg></span> Middle East <span style="color:var(--text-dim)">(highest)</span></div>
          <div><span class="geo-svg-icon" style="width:12px;height:12px;color:#9b59b6"><svg viewBox="0 0 64 64" fill="currentColor"><path d="M0 58l14-30 6 10 12-32 12 26 6-12 14 38z"/></svg></span> Central/South Asia</div>
          <div><span class="geo-svg-icon" style="width:12px;height:12px;color:#27ae60"><svg viewBox="0 0 64 64" fill="currentColor"><ellipse cx="32" cy="20" rx="28" ry="16"/><rect x="30" y="34" width="4" height="22"/><rect x="22" y="56" width="20" height="4" rx="2"/></svg></span> Africa</div>
          <div><span class="geo-svg-icon" style="width:12px;height:12px;color:#3498db"><svg viewBox="0 0 64 64" fill="currentColor"><rect x="22" y="34" width="20" height="22" rx="1"/><path d="M20 34h24c0-10-3-16-6-20 1-4-1-8-6-12-5 4-7 8-6 12-3 4-6 10-6 20z"/></svg></span> Eastern Europe</div>
          <div><span class="geo-svg-icon" style="width:12px;height:12px;color:#e74c3c"><svg viewBox="0 0 64 64" fill="currentColor"><path d="M32 4L10 18h44z"/><path d="M32 20L14 32h36z"/><path d="M32 34L18 44h28z"/><rect x="28" y="44" width="8" height="14"/></svg></span> East Asia & Pacific</div>
          <div><span class="geo-svg-icon" style="width:12px;height:12px;color:#f39c12"><svg viewBox="0 0 64 64" fill="currentColor"><path d="M2 58h60v-10H50V38H42V28H22v10H14v10H2z"/><rect x="28" y="18" width="8" height="10"/></svg></span> Latin America</div>
          <div><span class="geo-svg-icon" style="width:12px;height:12px;color:#2980b9"><svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M12 58V26L32 6 52 26v32"/><line x1="12" y1="38" x2="52" y2="38"/><line x1="32" y1="58" x2="32" y2="38"/><circle cx="32" cy="22" r="7"/></svg></span> Western Europe</div>
          <div><span class="geo-svg-icon" style="width:12px;height:12px;color:#1abc9c"><svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round"><path d="M32 4L8 16v16c0 16 10 24 24 28 14-4 24-12 24-28V16z"/><path d="M32 20l3.5 7 7.5 1-5.5 5 1.5 7.5L32 36l-7 4.5 1.5-7.5-5.5-5 7.5-1z" fill="currentColor" stroke="none"/></svg></span> North America <span style="color:var(--text-dim)">(lowest)</span></div>
        </div>
        <p style="margin-top:8px"><strong>Geopolitical events</strong> are long-term crises (weeks to months) that reshape the threat landscape:</p>
        <div style="font-size:10px;line-height:1.6;margin-top:4px">
          <strong><span class="geo-svg-icon" style="width:10px;height:10px"><svg viewBox="0 0 64 64" fill="currentColor"><path d="M32 4l5 16 14-10-6 16 16 2-14 10 10 14-16-6-9 14-9-14-16 6 10-14-14-10 16-2-6-16 14 10z"/></svg></span> Regional War</strong> · <strong><span class="geo-svg-icon" style="width:10px;height:10px"><svg viewBox="0 0 64 64" fill="currentColor"><path d="M4 32l14-12v8h6v8H18v8z"/><path d="M60 32L46 20v8h-6v8h6v8z"/><rect x="30" y="12" width="4" height="40" rx="1"/></svg></span> Proxy Conflict</strong> · <strong><span class="geo-svg-icon" style="width:10px;height:10px"><svg viewBox="0 0 64 64" fill="currentColor"><path d="M32 2c-10 14-20 22-20 34a20 20 0 0040 0C52 24 42 16 32 2z"/></svg></span> Insurgency</strong> · <strong><span class="geo-svg-icon" style="width:10px;height:10px"><svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="3"><path d="M2 32s12-22 30-22 30 22 30 22-12 22-30 22S2 32 2 32z"/><circle cx="32" cy="32" r="11"/><circle cx="32" cy="32" r="4" fill="currentColor" stroke="none"/></svg></span> Intelligence War</strong> · <strong><span class="geo-svg-icon" style="width:10px;height:10px"><svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="6" width="56" height="40" rx="3"/><path d="M16 20l10 8-10 8"/><line x1="30" y1="36" x2="46" y2="36"/><path d="M22 56h20M32 46v10"/></svg></span> Cyber Campaign</strong> · <strong><span class="geo-svg-icon" style="width:10px;height:10px"><svg viewBox="0 0 64 64" fill="currentColor"><path d="M32 2c-5 10-8 20-8 32h16c0-12-3-22-8-32z"/><rect x="24" y="34" width="16" height="12" rx="1"/><path d="M20 52l4-6v6z"/><path d="M44 52l-4-6v6z"/><path d="M28 46h8v10l-4 6-4-6z"/></svg></span> Arms Race</strong> · <strong><span class="geo-svg-icon" style="width:10px;height:10px"><svg viewBox="0 0 64 64" fill="currentColor"><rect x="4" y="26" width="10" height="12" rx="1"/><path d="M14 22l30-14v48L14 42z"/><path d="M50 22c5 5 5 15 0 20" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><path d="M56 14c8 8 8 28 0 36" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg></span> Civil Unrest</strong> · <strong><span class="geo-svg-icon" style="width:10px;height:10px"><svg viewBox="0 0 64 64" fill="currentColor"><g transform="rotate(-20 32 36)"><path d="M10 48h44V30l-11 8-11-14-11 14-11-8z"/><rect x="10" y="48" width="44" height="6" rx="1"/><circle cx="16" cy="30" r="3"/><circle cx="32" cy="20" r="3"/><circle cx="48" cy="30" r="3"/></g></svg></span> Regime Change</strong> · <strong><span class="geo-svg-icon" style="width:10px;height:10px"><svg viewBox="0 0 64 64" fill="currentColor"><path d="M4 40h56l-8 14H12z"/><rect x="24" y="28" width="18" height="12" rx="1"/><rect x="14" y="32" width="10" height="8" rx="1"/><rect x="30" y="16" width="4" height="12"/></svg></span> Naval Standoff</strong>
        </div>
        <p style="margin-top:8px"><strong>Effects of active crises:</strong></p>
        <div style="font-size:10px;line-height:1.7;margin-top:2px">
          ▸ Theater risk level increases (more dangerous missions)<br>
          ▸ Partner agency favor availability increases (MILITARY, AGENCY, BUREAU depending on crisis type)<br>
          ▸ New hostile organizations may emerge in the theater<br>
          ▸ Domestic terror cells may spawn as crisis spillover<br>
          ▸ Higher-volatility theaters generate events more frequently
        </div>
        <p style="margin-top:8px">Events resolve naturally after their duration. Up to 4 simultaneous crises can be active as the game progresses.</p>
      </div>

      <div class="help-section">
        <div class="help-section-title">INTELLIGENCE FACTIONS & NETWORKS</div>
        <p>Eight rival intelligence factions compete for influence across all theaters. Each faction has a <strong>home theater</strong> where they hold ~35% network share; elsewhere they hold ~9%. Your faction is highlighted in the network health bar on the GEO panel.</p>
        <p style="margin-top:8px"><strong>Zero-sum system:</strong> All faction shares per theater always sum to exactly 100%. When your share increases, it comes proportionally from the others — and vice versa.</p>
        <p style="margin-top:8px"><strong>Growing your network:</strong></p>
        <div style="font-size:10px;line-height:1.7;margin-top:4px">
          ▸ <strong>Successful operations</strong> — Completing missions in a theater boosts your share (proportional to threat level)<br>
          ▸ <strong>Network expansion</strong> — Use the EXPAND NETWORK button in the GEO panel to launch a dedicated operation that significantly grows your presence in a theater (+5 bonus on top of threat-based boost)<br>
          ▸ <strong>Bolster</strong> — Spend 10 Intel to raise your network floor +1% in a theater for one week, preventing erosion
        </div>
        <p style="margin-top:8px"><strong>Erosion:</strong> Without active operations, your network share drifts toward equilibrium over time. Geopolitical events can also erode your presence.</p>
        <p style="margin-top:8px"><strong>Faction transfer:</strong> Intel-type detained HVTs (espionage, counter-intel) can be transferred to rival factions in exchange for Intel. The receiving faction gains a small network boost in their home theater.</p>
      </div>

      <div class="help-section">
        <div class="help-section-title">SURVEILLANCE & FAILED OPS</div>
        <p>Failing an <strong>abduct</strong> or <strong>eliminate</strong> operation on a TRACKED HVT causes <strong>loss of surveillance</strong>. The target reverts to ACTIVE, relocates to a new city, and goes underground. During this period, all operations against the target are suspended. Your analysts will provide a rough estimate of how long it will take to reacquire the target.</p>
        <p style="margin-top:8px">Failing any HVT-linked operation — including surveillance — also triggers the underground period. Harder targets are more difficult to reacquire.</p>
        <p style="margin-top:8px">Similarly, a failed <strong>org takedown</strong> burns your infiltration — the inside asset is compromised and the organization must be re-infiltrated from scratch before another takedown attempt.</p>
      </div>

      <div class="help-section">
        <div class="help-section-title">RANDOM EVENTS</div>
        <p>Political crises, internal incidents, external threats, and opportunities appear periodically. Some offer choices with trade-offs. Events can affect confidence, budget, department capacity, or agency relations.</p>
      </div>

      <div class="help-section">
        <div class="help-section-title">CASCADING CONSEQUENCES</div>
        <p>Failed operations can spawn retaliatory threats — a failed counter-terror op may embolden attackers, a failed foreign op may blow back on the agency. Success prevents escalation; failure compounds it.</p>
      </div>

      <div class="help-section">
        <div class="help-section-title">XP & CAPABILITIES</div>
        <p>Earn XP for completed missions — more for higher-threat successes. Every 30 days a <strong>Monthly Review</strong> fires, letting you spend XP to expand department capacity or improve budget regen/cap. Open the upgrade shop anytime via <strong>UPGRD</strong>.</p>
        <p style="margin-top:8px">Unspent XP carries over. Prioritize scarce departments early.</p>
      </div>

      <div class="help-section">
        <div class="help-section-title">RESOURCES</div>
        <div class="help-resource-row"><strong>CONFIDENCE</strong> — Drops 2%/week (more at high DEFCON), falls on failures, rises on successes. Hits 0% = game over.</div>
        <div class="help-resource-row" style="margin-top:8px"><strong>BUDGET</strong> — Spent on operations. Regenerates weekly (upgradeable). Running dry ends the agency.</div>
        <div class="help-resource-row" style="margin-top:8px"><strong>XP</strong> — Earned from operations. Spend at monthly reviews or anytime via UPGRD.</div>
        <div class="help-resource-row" style="margin-top:8px"><strong>INTEL</strong> — Earned from interrogations, tracked HVT surveillance intercepts, infiltrated ORG weekly reports, faction transfers, and successful operations. Spend on BOLSTER (10 Intel = +1% network floor for one week).</div>
      </div>

      <div class="help-section">
        <div class="help-section-title">CONTROLS</div>
        <div class="help-resource-row"><strong>N</strong> — Advance 1 day &nbsp; <strong>Shift+N / →</strong> — Check mail (skip to next event) &nbsp; <strong>ESC</strong> — Close modal &nbsp; <strong>?</strong> — This handbook &nbsp; <strong>U</strong> — Upgrades &nbsp; <strong>S</strong> — Save/Load</div>
      </div>
    </div>
  `;
  showModal();
}

// =============================================================================
// MODAL / SCREEN SYSTEM
// =============================================================================

function showModal()     { document.getElementById('modal-overlay').classList.remove('hidden'); }
function hideModal() {
  const overlay = document.getElementById('modal-overlay');
  if (!overlay || overlay.classList.contains('hidden')) return;
  overlay.classList.add('modal-closing');
  setTimeout(() => {
    overlay.classList.add('hidden');
    overlay.classList.remove('modal-closing');
  }, 250);
}
function closeModalBg(e) { if (e.target === document.getElementById('modal-overlay')) hideModal(); }

// ---- Briefing messages — routed to inbox as intel messages ----

function queueBriefingPopup(cfg) {
  if (!G || !G.intelMessages) return; // guard before game starts
  const msg = {
    id: `IM_${++G.intelIdCounter}`,
    type: 'intel',
    title: cfg.title || 'BRIEFING',
    category: cfg.category || 'NOTICE',
    subtitle: cfg.subtitle || '',
    accent: cfg.accent || 'var(--accent)',
    body: cfg.body || '',
    buttonLabel: cfg.buttonLabel || 'ACKNOWLEDGED',
    day: G.day,
    read: false,
    status: 'UNREAD',
  };
  G.intelMessages.unshift(msg);
  // Auto-prune: keep last 30 intel messages
  if (G.intelMessages.length > 30) G.intelMessages.length = 30;
}

// Legacy compat — in case anything still calls these
window.dismissBriefingPopup = function() { hideModal(); };

function showScreen(name) {
  const map = { select: 'login', game: 'client' };
  const mapped = map[name] || name;
  const current = document.querySelector('.screen.active');
  const next = document.getElementById(`screen-${mapped}`);
  if (!next || next === current) return;
  if (current) {
    current.classList.add('screen-exit');
    // Start new screen slightly after exit begins for overlap
    setTimeout(() => {
      next.classList.add('active', 'screen-enter');
      setTimeout(() => next.classList.remove('screen-enter'), 600);
    }, 200);
    setTimeout(() => current.classList.remove('active', 'screen-exit'), 450);
  } else {
    next.classList.add('active', 'screen-enter');
    setTimeout(() => next.classList.remove('screen-enter'), 600);
  }
}

// =============================================================================
// LOGIN TERMINAL — Boot sequence + profile selection
// =============================================================================

function bootTerminal() {
  const output = document.getElementById('term-output');
  const profiles = document.getElementById('login-profiles');
  const auth = document.getElementById('login-auth');
  if (!output) return;

  output.innerHTML = '';
  profiles.classList.add('hidden');
  auth.classList.add('hidden');

  // Check for existing saves
  let hasSave = false;
  let saveInfo = null;
  try {
    const raw = localStorage.getItem('shadowDirective_saves');
    if (raw) {
      const saves = JSON.parse(raw);
      const auto = saves['__autosave__'];
      if (auto) { hasSave = true; saveInfo = auto; }
      else {
        const keys = Object.keys(saves);
        if (keys.length > 0) {
          const newest = keys.sort((a, b) => saves[b].timestamp - saves[a].timestamp)[0];
          hasSave = true; saveInfo = saves[newest];
        }
      }
    }
  } catch (e) {}

  if (hasSave && saveInfo) {
    bootDirectorLogin(output, saveInfo);
  } else {
    bootNewGameTerminal(output, profiles);
  }
}

function bootDirectorLogin(output, saveInfo) {
  const loginLines = [
    { text: `🫆 SHADOWNET SECURE TERMINAL v${GAME_VERSION}`, delay: 0, cls: 'term-hi' },
    { text: '════════════════════════════════════', delay: 80, cls: 'term-dim' },
    { text: '', delay: 120 },
    { text: 'SECURE UPLINK ....... ESTABLISHED', delay: 250 },
    { text: 'CRYPTO MODULE ....... AES-256-GCM ACTIVE', delay: 450 },
    { text: 'SESSION STATUS ...... PREVIOUS SESSION DETECTED', delay: 700, cls: 'term-class' },
    { text: '', delay: 850 },
    { text: 'DIRECTOR AUTHENTICATION REQUIRED:', delay: 1000, cls: 'term-hi' },
  ];

  let idx = 0;
  function typeLine() {
    if (idx >= loginLines.length) {
      setTimeout(() => showDirectorLoginForm(output, saveInfo), 300);
      return;
    }
    const line = loginLines[idx++];
    setTimeout(() => {
      const div = document.createElement('div');
      div.className = `term-line ${line.cls || ''}`;
      div.textContent = line.text;
      output.appendChild(div);
      output.scrollTop = output.scrollHeight;
      typeLine();
    }, line.delay - (idx > 1 ? loginLines[idx - 2].delay : 0));
  }
  typeLine();
}

function showDirectorLoginForm(output, saveInfo) {
  const agency = saveInfo.agency || 'SAA';
  const country = saveInfo.country || 'Unknown';
  const day = saveInfo.day || 1;

  const form = document.createElement('div');
  form.className = 'director-login-form';
  form.innerHTML = `
    <div class="dl-header">
      <div class="dl-fingerprint">🫆</div>
      <div class="dl-title">SECURE ACCESS</div>
      <div class="dl-subtitle">${agency} — ${country} · Day ${day}</div>
    </div>
    <div class="dl-fields">
      <div class="dl-field">
        <label class="dl-label">OPERATOR ID</label>
        <div class="dl-input-wrap">
          <input type="text" class="dl-input" id="dl-username" readonly autocomplete="off" />
          <span class="dl-input-cursor"></span>
        </div>
      </div>
      <div class="dl-field">
        <label class="dl-label">ACCESS KEY</label>
        <div class="dl-input-wrap">
          <input type="password" class="dl-input" id="dl-password" readonly autocomplete="off" />
          <span class="dl-input-cursor"></span>
        </div>
      </div>
    </div>
    <button class="dl-login-btn hidden" id="dl-login-btn">
      <span class="dl-login-text">AUTHENTICATE</span>
      <span class="dl-login-icon">→</span>
    </button>
    <div class="dl-forgot">
      <a href="#" class="dl-forgot-link" id="dl-new-game">New identity? Request access credentials</a>
    </div>
  `;

  output.parentElement.appendChild(form);
  requestAnimationFrame(() => form.classList.add('dl-visible'));

  // Auto-fill username with dots
  const userInput = form.querySelector('#dl-username');
  const passInput = form.querySelector('#dl-password');
  const loginBtn = form.querySelector('#dl-login-btn');
  const userWrap = userInput.closest('.dl-input-wrap');
  const passWrap = passInput.closest('.dl-input-wrap');

  const username = '••••••••••••';
  const password = '••••••••••••••••';
  let uIdx = 0, pIdx = 0;

  // Start username autofill after form appears
  setTimeout(() => {
    userWrap.classList.add('dl-typing');
    const uInterval = setInterval(() => {
      if (uIdx < username.length) {
        userInput.value += username[uIdx++];
      } else {
        clearInterval(uInterval);
        userWrap.classList.remove('dl-typing');
        userWrap.classList.add('dl-complete');
        // Start password autofill
        setTimeout(() => {
          passWrap.classList.add('dl-typing');
          const pInterval = setInterval(() => {
            if (pIdx < password.length) {
              passInput.value += password[pIdx++];
            } else {
              clearInterval(pInterval);
              passWrap.classList.remove('dl-typing');
              passWrap.classList.add('dl-complete');
              // Show login button
              setTimeout(() => {
                loginBtn.classList.remove('hidden');
                loginBtn.classList.add('dl-btn-visible');
              }, 200);
            }
          }, 50);
        }, 300);
      }
    }, 60);
  }, 400);

  // Login button — load most recent save
  loginBtn.addEventListener('click', () => {
    loginBtn.disabled = true;
    loginBtn.querySelector('.dl-login-text').textContent = 'AUTHENTICATING...';
    loginBtn.classList.add('dl-btn-auth');

    // Reuse the biometric auth animation inline
    setTimeout(() => {
      loginBtn.querySelector('.dl-login-text').textContent = 'IDENTITY CONFIRMED';
      loginBtn.classList.remove('dl-btn-auth');
      loginBtn.classList.add('dl-btn-success');

      setTimeout(() => {
        // Load the save
        const slotId = getSaveSlotToLoad();
        if (typeof window._loadSlot === 'function' && slotId) {
          window._loadSlot(slotId);
        }
      }, 600);
    }, 1200);
  });

  // New game link
  form.querySelector('#dl-new-game').addEventListener('click', (e) => {
    e.preventDefault();
    form.classList.add('dl-exit');
    setTimeout(() => {
      form.remove();
      output.innerHTML = '';
      const profiles = document.getElementById('login-profiles');
      const auth = document.getElementById('login-auth');
      profiles.classList.add('hidden');
      auth.classList.add('hidden');
      bootNewGameTerminal(output, profiles);
    }, 400);
  });
}

function getSaveSlotToLoad() {
  try {
    const raw = localStorage.getItem('shadowDirective_saves');
    if (!raw) return null;
    const saves = JSON.parse(raw);
    if (saves['__autosave__']) return '__autosave__';
    const keys = Object.keys(saves);
    if (keys.length === 0) return null;
    keys.sort((a, b) => saves[b].timestamp - saves[a].timestamp);
    return keys[0];
  } catch (e) { return null; }
}

function bootNewGameTerminal(output, profiles) {
  const lines = [
    { text: `🫆 SHADOWNET SECURE TERMINAL v${GAME_VERSION}`, delay: 0, cls: 'term-hi' },
    { text: '════════════════════════════════════', delay: 80, cls: 'term-dim' },
    { text: '', delay: 120 },
    { text: 'BIOS CHECK .......... OK', delay: 200 },
    { text: 'CRYPTO MODULE ....... AES-256-GCM READY', delay: 350 },
    { text: 'SECURE UPLINK ....... ESTABLISHING', delay: 500 },
    { text: 'HANDSHAKE ........... COMPLETE', delay: 800 },
    { text: 'IDENTITY VAULT ...... DECRYPTING', delay: 1000 },
    { text: '', delay: 1150 },
    { text: 'CLASSIFICATION: TOP SECRET // SCI // NOFORN', delay: 1250, cls: 'term-class' },
    { text: 'WARNING: Unauthorized access is a federal crime under 18 U.S.C. § 1030.', delay: 1450, cls: 'term-warn' },
    { text: '', delay: 1600 },
    { text: 'SELECT IDENTITY PROFILE:', delay: 1700, cls: 'term-hi' },
  ];

  let idx = 0;
  function typeLine() {
    if (idx >= lines.length) {
      setTimeout(() => renderProfileCards(), 200);
      return;
    }
    const line = lines[idx++];
    setTimeout(() => {
      const div = document.createElement('div');
      div.className = `term-line ${line.cls || ''}`;
      div.textContent = line.text;
      output.appendChild(div);
      output.scrollTop = output.scrollHeight;
      typeLine();
    }, line.delay - (idx > 1 ? lines[idx - 2].delay : 0));
  }
  typeLine();
}

function renderProfileCards() {
  const profiles = document.getElementById('login-profiles');
  if (!profiles) return;

  profiles.innerHTML = Object.entries(COUNTRIES).map(([code, cfg]) => {
    const caps = cfg.deptCapacities;
    const totalCap = Object.values(caps).reduce((s, v) => s + v, 0);
    return `
    <div class="profile-card" onclick="selectProfile('${code}')">
      <div class="profile-flag">${cfg.flag}</div>
      <div class="profile-info">
        <div class="profile-name">${cfg.agency}</div>
        <div class="profile-country">${cfg.name}</div>
        <div class="profile-meta">
          <span>${cfg.budgetLabel} budget</span>
          <span>${cfg.confLabel} confidence</span>
          <span>${totalCap} personnel</span>
        </div>
        <div class="profile-desc">${cfg.desc}</div>
        <div class="profile-reports">${cfg.reportsTo}</div>
      </div>
    </div>`;
  }).join('');

  profiles.classList.remove('hidden');
}

window.selectProfile = function(countryCode) {
  const cfg = COUNTRIES[countryCode];
  if (!cfg) return;

  const profiles = document.getElementById('login-profiles');
  const auth = document.getElementById('login-auth');
  const output = document.getElementById('term-output');

  // Hide profile cards, show auth sequence
  profiles.classList.add('hidden');

  // Add terminal lines for auth
  const authLines = [
    `PROFILE SELECTED: ${cfg.agency} (${cfg.acronym})`,
    `CLEARANCE: TOP SECRET // SCI`,
    `AUTHENTICATING ............`,
  ];
  authLines.forEach(text => {
    const div = document.createElement('div');
    div.className = 'term-line term-hi';
    div.textContent = text;
    output.appendChild(div);
  });
  output.scrollTop = output.scrollHeight;

  // Show auth animation
  auth.classList.remove('hidden');
  const authLinesEl = document.getElementById('auth-lines');
  const authBar = document.getElementById('auth-bar');

  authLinesEl.innerHTML = `
    <div class="auth-line">BIOMETRIC SCAN ........ <span class="auth-pending">VERIFYING</span></div>
    <div class="auth-line">RETINA PATTERN ........ <span class="auth-pending">VERIFYING</span></div>
    <div class="auth-line">VOICE PRINT ........... <span class="auth-pending">VERIFYING</span></div>
    <div class="auth-line">CRYPTO KEY ............ <span class="auth-pending">VERIFYING</span></div>
  `;

  let progress = 0;
  const authSteps = authLinesEl.querySelectorAll('.auth-pending');
  let stepIdx = 0;

  const interval = setInterval(() => {
    progress += randInt(8, 18);
    if (progress > 100) progress = 100;
    authBar.style.width = `${progress}%`;

    // Complete auth steps
    if (progress >= 25 && stepIdx === 0) { authSteps[0].textContent = 'CONFIRMED'; authSteps[0].className = 'auth-ok'; stepIdx++; }
    if (progress >= 50 && stepIdx === 1) { authSteps[1].textContent = 'CONFIRMED'; authSteps[1].className = 'auth-ok'; stepIdx++; }
    if (progress >= 75 && stepIdx === 2) { authSteps[2].textContent = 'CONFIRMED'; authSteps[2].className = 'auth-ok'; stepIdx++; }
    if (progress >= 100) {
      authSteps[3].textContent = 'CONFIRMED'; authSteps[3].className = 'auth-ok';
      clearInterval(interval);

      // Add final lines
      setTimeout(() => {
        const div1 = document.createElement('div');
        div1.className = 'term-line term-success';
        div1.textContent = 'IDENTITY CONFIRMED — ACCESS GRANTED';
        output.appendChild(div1);
        const div2 = document.createElement('div');
        div2.className = 'term-line term-hi';
        div2.textContent = `Welcome, Director. ${cfg.acronym} SECURE MAIL loading...`;
        output.appendChild(div2);
        output.scrollTop = output.scrollHeight;

        // Start the game after a brief pause
        setTimeout(() => startGame(countryCode), 800);
      }, 400);
    }
  }, 120);
};

// =============================================================================
// KEYBOARD SHORTCUTS
// =============================================================================

document.addEventListener('keydown', e => {
  const clientActive = document.getElementById('screen-client')?.classList.contains('active');
  if (e.key === 'n') {
    if (clientActive && document.getElementById('modal-overlay')?.classList.contains('hidden'))
      advanceDay();
  }
  if (e.key === 'N' || e.key === 'ArrowRight') {
    if (clientActive && document.getElementById('modal-overlay')?.classList.contains('hidden'))
      advanceToNextEvent();
  }
  if (e.key === 'Escape') hideModal();
  if (e.key === '?')
    if (clientActive) showHelp();
  if (e.key === 'u' || e.key === 'U')
    if (clientActive) showCapabilitiesMenu(false);
  if ((e.key === 's' || e.key === 'S') && document.activeElement?.tagName !== 'INPUT')
    if (clientActive && typeof showSaveMenu === 'function') showSaveMenu();
});

// =============================================================================
// BOOTSTRAP
// =============================================================================

document.addEventListener('DOMContentLoaded', () => {
  showScreen('login');
  bootTerminal();
  document.getElementById('btn-advance').addEventListener('click', advanceToNextEvent);
  document.getElementById('btn-help').addEventListener('click', showHelp);
  document.getElementById('btn-capabilities')?.addEventListener('click', () => showCapabilitiesMenu(false));
  document.getElementById('btn-abort-game')?.addEventListener('click', confirmAbortGame);
  document.getElementById('btn-save')?.addEventListener('click', () => { if (typeof showSaveMenu === 'function') showSaveMenu(); });
  initTooltips();
});
