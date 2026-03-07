'use strict';
// =============================================================================
// SHADOW DIRECTIVE v1.2  —  Multi-phase operations
// MISSION_TYPES is now loaded from missions.js (must be included before this)
// =============================================================================

// =============================================================================
// CONFIGURATION
// =============================================================================

const COUNTRIES = {
  USA: {
    name: 'United States', agency: 'National Special Activities Directorate',
    acronym: 'NSAD', flag: '🇺🇸',
    leader: 'POTUS', leaderTitle: 'the President', leaderFormal: 'Mr. President',
    currency: '$', currencySymbol: '$',
    budget: 60, staff: 300, confidence: 70,
    reportsTo: 'Reports directly to POTUS',
    desc: 'The world\'s most powerful intelligence apparatus at your command. Vast resources, but under intense scrutiny.',
    budgetLabel: '$60M', staffLabel: '300', confLabel: '70%',
    domesticCities: ['New York', 'Chicago', 'Los Angeles', 'Washington D.C.', 'Miami', 'Houston', 'Seattle', 'Boston', 'Atlanta', 'Denver'],
    weeklyBudgetRegen: 4,
  },
  UK: {
    name: 'United Kingdom', agency: 'Strategic Intelligence Executive',
    acronym: 'SIE', flag: '🇬🇧',
    leader: 'the Prime Minister', leaderTitle: 'the Prime Minister', leaderFormal: 'Prime Minister',
    currency: '£', currencySymbol: '£',
    budget: 40, staff: 200, confidence: 65,
    reportsTo: 'Reports directly to the Prime Minister',
    desc: 'A proud tradition of intelligence excellence. Moderate resources with strong allied networks.',
    budgetLabel: '£40M', staffLabel: '200', confLabel: '65%',
    domesticCities: ['London', 'Manchester', 'Birmingham', 'Glasgow', 'Leeds', 'Bristol', 'Edinburgh', 'Cardiff', 'Liverpool', 'Sheffield'],
    weeklyBudgetRegen: 3,
  },
  FRANCE: {
    name: 'France', agency: 'Direction Spéciale des Opérations',
    acronym: 'DSO', flag: '🇫🇷',
    leader: 'the Président', leaderTitle: 'the Président de la République', leaderFormal: 'Monsieur le Président',
    currency: '€', currencySymbol: '€',
    budget: 25, staff: 150, confidence: 60,
    reportsTo: 'Reports directly to the Président de la République',
    desc: 'Lean and ruthless. Limited resources demand efficiency and audacity.',
    budgetLabel: '€25M', staffLabel: '150', confLabel: '60%',
    domesticCities: ['Paris', 'Lyon', 'Marseille', 'Toulouse', 'Bordeaux', 'Lille', 'Nice', 'Nantes', 'Strasbourg', 'Rennes'],
    weeklyBudgetRegen: 2,
  }
};

const DEPT_CONFIG = [
  {
    id: 'ANALYSIS', name: 'Analysis Bureau', short: 'ANALYSIS',
    desc: 'Processes raw intel, produces assessments',
    tip: 'Best general-purpose investigator — required for most mission types. Turns vague intercepts into actionable intelligence briefings. Does not contribute to direct-action operations.',
  },
  {
    id: 'HUMINT', name: 'Human Intelligence', short: 'HUMINT',
    desc: 'Runs agents, assets, and informants',
    tip: 'Manages human agents and informants worldwide. Essential for cell-based threats, networks, and operations requiring in-person access. Strong execution bonus when the target involves human networks.',
  },
  {
    id: 'SIGINT', name: 'Signals Intelligence', short: 'SIGINT',
    desc: 'Electronic surveillance and interception',
    tip: 'Electronic surveillance and communications interception. Best at locating mobile targets and tracking planning activity. Particularly effective on tech-savvy or communications-dependent threats.',
  },
  {
    id: 'FIELD_OPS', name: 'Field Operations', short: 'FIELD OPS',
    desc: 'Domestic covert field teams',
    tip: 'Domestic covert field teams for surveillance, arrest, and direct action. Primary executor for most domestic operations. Cannot be used for foreign missions. Will show DEPLOYED and become unavailable during active operations.',
  },
  {
    id: 'SPECIAL_OPS', name: 'Special Activities', short: 'SPECIAL OPS',
    desc: 'Paramilitary and direct-action capability',
    tip: 'Paramilitary direct-action unit. Highest execution success bonus of any department. Required for high-threat neutralizations, hostage rescue, and renditions. Scarce — do not waste on low-priority missions.',
  },
  {
    id: 'FOREIGN_OPS', name: 'Foreign Operations', short: 'FOREIGN OPS',
    desc: 'International clandestine operations',
    tip: 'Runs all international clandestine operations. Required for foreign HVT, rendition, asset rescue, and regime operations. Cannot be used on domestic missions. Will show DEPLOYED during active foreign operations.',
  },
  {
    id: 'COUNTER_INTEL', name: 'Counter-Intelligence', short: 'COUNTER-INTEL',
    desc: 'Internal security and mole-hunting',
    tip: 'Internal security and mole-hunting. Specializes in counter-espionage investigations. Required for insider threat and domestic HVT operations. Also provides a defensive bonus against enemy intelligence activity.',
  },
];

// =============================================================================
// WORLD LOCATIONS
// =============================================================================

const FOREIGN_CITIES = [
  { city: 'Moscow', country: 'Russia' },
  { city: 'Tehran', country: 'Iran' },
  { city: 'Pyongyang', country: 'North Korea' },
  { city: 'Damascus', country: 'Syria' },
  { city: 'Caracas', country: 'Venezuela' },
  { city: 'Havana', country: 'Cuba' },
  { city: 'Minsk', country: 'Belarus' },
  { city: 'Kabul', country: 'Afghanistan' },
  { city: 'Baghdad', country: 'Iraq' },
  { city: 'Tripoli', country: 'Libya' },
  { city: 'Khartoum', country: 'Sudan' },
  { city: 'Islamabad', country: 'Pakistan' },
  { city: 'Bogotá', country: 'Colombia' },
  { city: 'Lagos', country: 'Nigeria' },
  { city: 'Belgrade', country: 'Serbia' },
];

const CODENAME_ADJ = ['IRON', 'SHADOW', 'BLACK', 'SILENT', 'STEEL', 'CRIMSON', 'GOLDEN', 'BROKEN', 'DARK',
  'SWIFT', 'BURNING', 'COLD', 'GHOST', 'HOLLOW', 'WHITE', 'SILVER', 'STONE', 'BLIND', 'FALLEN'];
const CODENAME_NOUN = ['FALCON', 'HAMMER', 'DAWN', 'TIDE', 'SERPENT', 'ARROW', 'STORM', 'SHIELD',
  'WOLF', 'LANCE', 'STAR', 'ANVIL', 'BLADE', 'CROWN', 'GATE', 'RAVEN', 'TOWER', 'MIRROR', 'VEIL', 'FIST'];

// =============================================================================
// GAME STATE
// =============================================================================

let G = {
  country: null, cfg: null,
  day: 1, budget: 0, staffUsed: 0, staffTotal: 0, confidence: 0,
  missions: [], depts: {}, log: [],
  selected: null, opsCompleted: 0, opsSucceeded: 0,
  missionIdCounter: 0, usedCodenames: new Set(), nextSpawnDay: 1,
};

// =============================================================================
// UTILITIES
// =============================================================================

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randInt(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }
function clamp(v, min, max) { return Math.min(max, Math.max(min, v)); }
function fmt(n) { return G.cfg ? `${G.cfg.currencySymbol}${n}M` : `$${n}M`; }
function week() { return Math.ceil(G.day / 7); }

// All vars in fillVars are pre-resolved strings — simple token replacement
function fillTemplate(tpl, vars) {
  return tpl.replace(/\{(\w+)\}/g, (_, key) => {
    if (vars[key] !== undefined) return vars[key];
    return `[${key}]`;
  });
}

// Pre-resolve an array of vars into strings (pick once per spawn)
function resolveVars(varsTemplate, baseVars) {
  const resolved = { ...baseVars };
  for (const [k, v] of Object.entries(varsTemplate || {})) {
    resolved[k] = Array.isArray(v) ? pick(v) : v;
  }
  return resolved;
}

function generateCodename() {
  for (let i = 0; i < 100; i++) {
    const c = `${pick(CODENAME_ADJ)} ${pick(CODENAME_NOUN)}`;
    if (!G.usedCodenames.has(c)) { G.usedCodenames.add(c); return c; }
  }
  return `OP ${G.missionIdCounter}`;
}

// =============================================================================
// GAME INITIALIZATION
// =============================================================================

function initDepts() {
  const depts = {};
  for (const d of DEPT_CONFIG) {
    depts[d.id] = { ...d, busy: false, busyType: null, busyMissionId: null };
  }
  return depts;
}

function startGame(countryCode) {
  const cfg = COUNTRIES[countryCode];
  if (!cfg) return;
  G = {
    country: countryCode, cfg,
    day: 1, budget: cfg.budget, staffUsed: 0, staffTotal: cfg.staff, confidence: cfg.confidence,
    missions: [], depts: initDepts(), log: [],
    selected: null, opsCompleted: 0, opsSucceeded: 0,
    missionIdCounter: 0, usedCodenames: new Set(), nextSpawnDay: 1,
  };
  showScreen('game');
  spawnMission();
  if (Math.random() < 0.7) spawnMission();
  addLog(`Agency ${cfg.acronym} operational. Day 1.`, 'log-info');
  addLog(`${cfg.leaderFormal} expects results. Good luck, Director.`, 'log-info');
  render();
}

function restartGame() { G.country = null; showScreen('select'); }

// =============================================================================
// MISSION GENERATION
// =============================================================================

// Initialize/reset per-phase fields on the mission from phases[currentPhaseIndex]
function initPhaseFields(m) {
  const ph = m.phases[m.currentPhaseIndex];
  // Merge shared top-level vars with phase-specific vars (all pre-resolved)
  const phFillVars = resolveVars(ph.vars || {}, m.fillVars);
  m.currentPhaseFillVars = phFillVars;

  m.invDays    = randInt(...ph.invDaysRange);
  m.invDepts   = ph.invDepts;
  m.execDays   = randInt(...ph.execDaysRange);
  m.execDepts  = ph.execDepts;
  m.baseBudget = randInt(...ph.budgetRange);
  m.baseStaff  = randInt(...ph.staffRange);
  m.confSuccess = ph.confSuccess;
  m.confFail    = ph.confFail;
  m.opNarrative = fillTemplate(ph.opNarrative, phFillVars);
  m.initialReport = fillTemplate(pick(ph.investigateReports), phFillVars);
  m.fullReport    = fillTemplate(pick(ph.fullBriefs), phFillVars);
  m.successMsgs   = ph.successOutcomes;
  m.failureMsgs   = ph.failureOutcomes;

  // Reset phase-level operational state
  m.assignedInvDept    = null;
  m.invDaysLeft        = 0;
  m.assignedBudget     = 0;
  m.assignedStaff      = 0;
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
  if (inbox.length >= 6) return;

  const typeId = forcedType || pick(Object.keys(MISSION_TYPES));
  const tmpl = MISSION_TYPES[typeId];
  if (!tmpl) return;

  const codename  = generateCodename();
  const urgency   = randInt(...tmpl.urgencyRange);
  const threat    = randInt(...tmpl.threatRange);

  let cityName, countryName;
  if (tmpl.location === 'DOMESTIC') {
    cityName    = pick(G.cfg.domesticCities);
    countryName = G.cfg.name;
  } else {
    const loc = pick(FOREIGN_CITIES);
    cityName    = loc.city;
    countryName = loc.country;
  }

  // Pre-resolve all top-level vars once at spawn time
  const fillVars = resolveVars(tmpl.vars || {}, {
    city:        cityName,
    country:     countryName,
    codename:    codename,
    urgency_days: String(urgency),
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
    assignedBudget: 0, assignedStaff: 0, assignedExecDepts: [],
    execDaysLeft: 0, successProb: 0,
    resultMsg: '', confDelta: 0, budgetDelta: 0,
    dayReceived: G.day,
    phaseFalseFlag: false, phaseFalseFlagText: '', phaseFalseFlagPenalty: false,
    followUpSpawned: false,
  };

  if (tmpl.isMultiPhase) {
    mission.phases           = tmpl.phases;
    mission.currentPhaseIndex = 0;
    mission.completedPhases  = [];
    mission.lastPhaseMsg     = '';
    mission.lastPhaseName    = '';
    mission.lastPhaseShortName = '';
    mission.lastPhaseConfDelta = 0;
    initPhaseFields(mission);
  } else {
    // Single-phase — resolve all text at spawn time
    Object.assign(mission, {
      invDays:    randInt(...tmpl.invDaysRange),
      execDays:   randInt(...tmpl.execDaysRange),
      baseBudget: randInt(...tmpl.budgetRange),
      baseStaff:  randInt(...tmpl.staffRange),
      invDepts:   tmpl.invDepts,
      execDepts:  tmpl.execDepts,
      opNarrative:  tmpl.opNarrative || '',
      initialReport: fillTemplate(pick(tmpl.initialReports), fillVars),
      fullReport:    fillTemplate(pick(tmpl.fullReports),    fillVars),
      successMsgs:   tmpl.successMsgs,
      failureMsgs:   tmpl.failureMsgs,
      confSuccess:   tmpl.confSuccess,
      confFail:      tmpl.confFail,
    });
  }

  G.missions.unshift(mission);
  addLog(`New mission received: OP ${codename} [${tmpl.label}]`);
  G.nextSpawnDay = G.day + randInt(3, 8);
}

// =============================================================================
// DAY ADVANCEMENT
// =============================================================================

function advanceDay() {
  G.day++;

  for (const m of G.missions) {
    if (['INCOMING', 'READY', 'PHASE_COMPLETE'].includes(m.status)) {
      m.urgencyLeft = Math.max(0, m.urgencyLeft - 1);
      if (m.urgencyLeft === 0) expireMission(m);
    }
    if (m.status === 'INVESTIGATING') {
      m.invDaysLeft = Math.max(0, m.invDaysLeft - 1);
      m.urgencyLeft = Math.max(0, m.urgencyLeft - 1);
      if (m.invDaysLeft === 0) {
        completeInvestigation(m);
      } else if (m.urgencyLeft === 0) {
        expireMission(m);
        freeDept(m.assignedInvDept, m.id);
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
    addLog(`Weekly briefing: Confidence ${drain}%. Budget regenerated +${fmt(G.cfg.weeklyBudgetRegen)}.`, 'log-warn');
  }

  if (G.day >= G.nextSpawnDay) {
    if (Math.random() < 0.6) spawnMission();
    G.nextSpawnDay = G.day + randInt(3, 7);
  }

  checkGameOver();
  render();
  if (G.selected && !getMission(G.selected)) G.selected = null;
}

function completeInvestigation(m) {
  freeDept(m.assignedInvDept, m.id);
  m.assignedInvDept = null;

  // Check for false flag (multi-phase only)
  if (m.isMultiPhase) {
    const ph = m.phases[m.currentPhaseIndex];
    if (ph.falseFlagChance > 0 && Math.random() < ph.falseFlagChance) {
      m.phaseFalseFlag     = true;
      m.phaseFalseFlagText = fillTemplate(pick(ph.falseFlagTexts), m.currentPhaseFillVars);
      addLog(`⚠ OP ${m.codename}: Investigation anomaly detected — review before proceeding.`, 'log-warn');
    }
  }

  m.status = 'READY';
  addLog(`Investigation complete: OP ${m.codename} — Intel brief ready.`, 'log-info');
}

function expireMission(m) {
  m.status = 'EXPIRED';
  const confHit = -randInt(5, 12);
  G.confidence = clamp(G.confidence + confHit, 0, 100);
  addLog(`MISSION EXPIRED: OP ${m.codename}. Confidence ${confHit}%.`, 'log-fail');
}

// =============================================================================
// OPERATION RESOLUTION
// =============================================================================

function resolveOperation(m) {
  const success = Math.random() * 100 <= m.successProb;

  G.staffUsed = Math.max(0, G.staffUsed - m.assignedStaff);
  for (const did of m.assignedExecDepts || []) freeDept(did, m.id);

  const fillV = m.isMultiPhase ? m.currentPhaseFillVars : m.fillVars;
  const msg   = fillTemplate(pick(success ? m.successMsgs : m.failureMsgs), fillV);

  if (m.isMultiPhase) {
    completePhase(m, success ? 'SUCCESS' : 'FAILURE', msg);
  } else {
    G.opsCompleted++;
    if (success) {
      m.status = 'SUCCESS';
      const confGain    = randInt(...m.confSuccess);
      const budgetReturn = Math.floor(m.assignedBudget * 0.1);
      G.confidence = clamp(G.confidence + confGain, 0, 100);
      if (budgetReturn > 0) G.budget = Math.min(G.budget + budgetReturn, 999);
      m.confDelta = confGain; m.budgetDelta = budgetReturn;
      m.resultMsg = msg;
      G.opsSucceeded++;
      addLog(`SUCCESS: OP ${m.codename}. +${confGain}% confidence.`, 'log-success');
    } else {
      m.status = 'FAILURE';
      const confLoss = randInt(...m.confFail);
      G.confidence = clamp(G.confidence + confLoss, 0, 100);
      m.confDelta = confLoss; m.budgetDelta = 0;
      m.resultMsg = msg;
      addLog(`FAILURE: OP ${m.codename}. ${confLoss}% confidence.`, 'log-fail');
    }
  }
}

// =============================================================================
// MULTI-PHASE MANAGEMENT
// =============================================================================

function completePhase(m, result, msg) {
  const ph = m.phases[m.currentPhaseIndex];

  m.completedPhases.push({
    phaseIndex: m.currentPhaseIndex,
    phaseId:    ph.id,
    phaseName:  ph.name,
    shortName:  ph.shortName,
    result, msg,
  });

  if (result === 'FAILURE') {
    G.opsCompleted++;
    m.status    = 'FAILURE';
    const confLoss = randInt(...m.confFail);
    G.confidence = clamp(G.confidence + confLoss, 0, 100);
    m.confDelta = confLoss; m.budgetDelta = 0;
    m.resultMsg = msg;
    addLog(`FAILURE: OP ${m.codename} [${ph.shortName}]. ${confLoss}% confidence.`, 'log-fail');
    return;
  }

  // Phase succeeded
  const confGain = randInt(...m.confSuccess);
  if (confGain > 0) {
    G.confidence = clamp(G.confidence + confGain, 0, 100);
    addLog(`PHASE COMPLETE: OP ${m.codename} — ${ph.shortName}. +${confGain}% confidence.`, 'log-success');
  } else {
    addLog(`PHASE COMPLETE: OP ${m.codename} — ${ph.shortName}. Proceeding.`, 'log-info');
  }

  // Spawn follow-up mission if this phase triggers one
  if (ph.spawnsFollowUp && !m.followUpSpawned) {
    spawnFollowUpMission(m, ph);
    m.followUpSpawned = true;
  }

  const nextIdx = m.currentPhaseIndex + 1;
  if (nextIdx < m.phases.length) {
    // More phases remain
    m.lastPhaseMsg       = msg;
    m.lastPhaseName      = ph.name;
    m.lastPhaseShortName = ph.shortName;
    m.lastPhaseConfDelta = confGain;
    m.currentPhaseIndex  = nextIdx;
    m.status             = 'PHASE_COMPLETE';
    initPhaseFields(m); // pre-initialize next phase fields
  } else {
    // Final phase — mission success
    G.opsCompleted++;
    G.opsSucceeded++;
    m.status = 'SUCCESS';
    const budgetReturn = Math.floor(m.assignedBudget * 0.1);
    if (budgetReturn > 0) G.budget = Math.min(G.budget + budgetReturn, 999);
    m.confDelta   = confGain;
    m.budgetDelta = budgetReturn;
    m.resultMsg   = msg;
    addLog(`SUCCESS: OP ${m.codename} — Full operation complete. +${confGain}% confidence.`, 'log-success');
  }
}

function spawnFollowUpMission(m, phase) {
  const intelText = pick(phase.followUpIntelTexts || []);
  if (intelText) addLog(`INTELLIGENCE LEAD — OP ${m.codename}: ${intelText}`, 'log-info');
  spawnMission(phase.spawnsFollowUp);
}

// =============================================================================
// DEPARTMENT MANAGEMENT
// =============================================================================

function freeDept(deptId, missionId) {
  const d = G.depts[deptId];
  if (d && d.busyMissionId === missionId) {
    d.busy = false; d.busyType = null; d.busyMissionId = null;
  }
}

function assignDeptDeployed(deptId, missionId) {
  const d = G.depts[deptId];
  if (d && !d.busy) {
    d.busy = true; d.busyType = 'DEPLOYED'; d.busyMissionId = missionId;
  }
}

// =============================================================================
// MISSION MANAGEMENT ACTIONS
// =============================================================================

function selectMission(id) { G.selected = id; render(); }

function assignInvestigation(missionId, deptId) {
  const m    = getMission(missionId);
  const dept = G.depts[deptId];
  if (!m || !dept) return;
  if (dept.busy) { addLog(`${dept.name} is currently assigned. Choose another.`, 'log-warn'); render(); return; }
  if (!m.invDepts.includes(deptId)) { addLog(`${dept.name} cannot investigate this mission type.`, 'log-warn'); render(); return; }

  m.status          = 'INVESTIGATING';
  m.assignedInvDept = deptId;
  m.invDaysLeft     = m.invDays;
  dept.busy = true; dept.busyType = 'INVESTIGATING'; dept.busyMissionId = missionId;

  const phaseLabel = m.isMultiPhase ? ` (${m.phases[m.currentPhaseIndex].shortName})` : '';
  addLog(`${dept.name} assigned to investigate OP ${m.codename}${phaseLabel}. Est. ${m.invDays} days.`, 'log-info');
  render();
}

function archiveMission(missionId) {
  G.missions = G.missions.filter(x => x.id !== missionId);
  if (G.selected === missionId) G.selected = null;
  render();
}

function dismissMission(missionId) {
  const m = getMission(missionId);
  if (!m) return;
  if (m.status === 'INVESTIGATING') freeDept(m.assignedInvDept, missionId);
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

// Acknowledge phase completion and proceed to next phase
window.acknowledgePhaseProceeding = function(missionId) {
  const m = getMission(missionId);
  if (!m || m.status !== 'PHASE_COMPLETE') return;
  m.status = 'INCOMING';
  addLog(`OP ${m.codename}: Proceeding to ${m.phases[m.currentPhaseIndex].name}.`, 'log-info');
  render();
};

// False flag: proceed with -25% probability penalty
window.falseFlagProceed = function(missionId) {
  const m = getMission(missionId);
  if (!m || !m.phaseFalseFlag) return;
  m.phaseFalseFlagPenalty = true;
  m.phaseFalseFlag = false;
  addLog(`OP ${m.codename}: Proceeding despite anomaly. Success probability reduced.`, 'log-warn');
  render();
};

// False flag: reinvestigate — return to INCOMING
window.falseFlagReinvestigate = function(missionId) {
  const m = getMission(missionId);
  if (!m || !m.phaseFalseFlag) return;
  m.phaseFalseFlag        = false;
  m.phaseFalseFlagPenalty = false;
  m.invDays     = randInt(2, 3);
  m.invDaysLeft = 0;
  m.status      = 'INCOMING';
  addLog(`OP ${m.codename}: Reinvestigation ordered. Assign a department to re-examine the evidence.`, 'log-info');
  render();
};

// =============================================================================
// OPERATION MODAL
// =============================================================================

function openOperationModal(missionId) {
  const m = getMission(missionId);
  if (!m) return;

  const minBudget = Math.max(1, Math.floor(m.baseBudget * 0.5));
  const maxBudget = Math.min(G.budget, m.baseBudget * 2);
  const defBudget = Math.min(G.budget, m.baseBudget);
  const minStaff  = Math.max(1, Math.floor(m.baseStaff * 0.5));
  const maxStaff  = Math.min(G.staffTotal - G.staffUsed, m.baseStaff * 2);
  const defStaff  = Math.min(maxStaff, m.baseStaff);

  if (maxBudget < minBudget) {
    addLog(`Insufficient budget for OP ${m.codename}. Need at least ${fmt(minBudget)}.`, 'log-warn');
    render(); return;
  }
  if (maxStaff < minStaff) {
    addLog(`Insufficient available staff for OP ${m.codename}.`, 'log-warn');
    render(); return;
  }

  let selectedDepts = [];
  for (const did of m.execDepts) {
    if (!G.depts[did].busy) { selectedDepts = [did]; break; }
  }

  const falseFlagPenalty = m.phaseFalseFlagPenalty ? 25 : 0;
  const calcProb = (budget, staff, depts) => {
    let p = 40 - falseFlagPenalty;
    p += Math.round(clamp((budget - minBudget) / Math.max(1, m.baseBudget - minBudget), 0, 1) * 25);
    p += Math.round(clamp((staff - minStaff)   / Math.max(1, m.baseStaff  - minStaff),  0, 1) * 20);
    p += depts.filter(d => m.execDepts.includes(d)).length * 8;
    return clamp(p, 10, 92);
  };

  const deptRows = m.execDepts.map(did => {
    const dept = G.depts[did];
    const avail = !dept.busy;
    return `<div class="modal-dept-check ${selectedDepts.includes(did) ? 'selected' : ''} ${avail ? '' : 'unavail'}"
      data-dept="${did}" onclick="toggleExecDept('${did}','${missionId}')"
      data-tip="${DEPT_CONFIG.find(d => d.id === did)?.tip || ''}">
      <span class="modal-dept-check-name">${dept.short}</span>
      <span class="modal-dept-check-status" style="color:var(--accent);font-size:9px">REC</span>
      <span class="modal-dept-check-status" style="color:${avail ? 'var(--green)' : 'var(--red)'}">${avail ? 'AVAIL' : 'BUSY'}</span>
    </div>`;
  }).join('');

  const otherDepts = DEPT_CONFIG.filter(d => !m.execDepts.includes(d.id)).map(d => {
    const dept = G.depts[d.id];
    const avail = !dept.busy;
    return `<div class="modal-dept-check ${selectedDepts.includes(d.id) ? 'selected' : ''}"
      data-dept="${d.id}" onclick="toggleExecDept('${d.id}','${missionId}')"
      data-tip="${d.tip}">
      <span class="modal-dept-check-name">${dept.short}</span>
      <span class="modal-dept-check-status" style="color:${avail ? 'var(--text-dim)' : 'var(--red)'};font-size:9px">${avail ? 'OPT' : 'BUSY'}</span>
    </div>`;
  }).join('');

  const initProb    = calcProb(defBudget, defStaff, selectedDepts);
  const phaseLabel  = m.isMultiPhase ? ` — ${m.phases[m.currentPhaseIndex].name.toUpperCase()}` : '';
  const penaltyNote = falseFlagPenalty > 0
    ? `<div style="background:rgba(231,76,60,0.1);border:1px solid rgba(231,76,60,0.3);border-radius:4px;padding:8px 10px;margin-bottom:12px;font-size:11px;color:var(--red)">⚠ ANOMALY PENALTY: Success probability reduced by 25% due to inconclusive investigation.</div>`
    : '';

  document.getElementById('modal-title').textContent = `OP ${m.codename}${phaseLabel} — CONFIGURE OPERATION`;
  document.getElementById('modal-body').innerHTML = `
    ${penaltyNote}
    <div class="modal-section">
      <div class="modal-section-title">OPERATION PLAN</div>
      <div class="op-narrative">${m.opNarrative}</div>
    </div>
    <div class="modal-section">
      <div class="modal-section-title">ALLOCATED RESOURCES</div>
      <div style="font-size:11px;color:var(--text-dim);margin-bottom:10px">
        Minimum: ${fmt(minBudget)} / ${minStaff} agents. Recommended: ${fmt(m.baseBudget)} / ${m.baseStaff} agents. More resources = higher success probability.
      </div>
      <div class="modal-slider-row">
        <label>BUDGET</label>
        <input type="range" id="op-budget" min="${minBudget}" max="${maxBudget}" value="${defBudget}"
          oninput="updateModalProb('${missionId}')"
          data-tip="Set the operational budget. More funding improves success probability. Available: ${fmt(G.budget)}">
        <span class="modal-slider-val" id="op-budget-val">${fmt(defBudget)}</span>
      </div>
      <div class="modal-slider-row">
        <label>STAFF</label>
        <input type="range" id="op-staff" min="${minStaff}" max="${maxStaff}" value="${defStaff}"
          oninput="updateModalProb('${missionId}')"
          data-tip="Number of agents to deploy. More staff improves success probability. Available: ${G.staffTotal - G.staffUsed}">
        <span class="modal-slider-val" id="op-staff-val">${defStaff} agents</span>
      </div>
    </div>
    <div class="modal-section">
      <div class="modal-section-title">RECOMMENDED DEPARTMENTS <span style="font-size:9px;color:var(--text-dim)">(each adds +8% success)</span></div>
      <div class="modal-dept-grid">${deptRows}</div>
    </div>
    <div class="modal-section">
      <div class="modal-section-title">OPTIONAL SUPPORT</div>
      <div class="modal-dept-grid">${otherDepts}</div>
    </div>
    <div class="modal-section">
      <div class="prob-display" data-tip="Estimated probability of mission success.${falseFlagPenalty > 0 ? ' Reduced 25% due to anomaly.' : ''}">
        <div class="prob-label">ESTIMATED SUCCESS PROBABILITY</div>
        <div class="prob-value ${initProb >= 70 ? 'prob-high' : initProb >= 45 ? 'prob-med' : 'prob-low'}" id="op-prob-wrap">
          <span id="op-prob">${initProb}%</span>
        </div>
      </div>
    </div>
    <div class="modal-actions">
      <button class="btn-primary" onclick="executeOperation('${missionId}')">EXECUTE OPERATION</button>
      <button class="btn-neutral" onclick="hideModal()">CANCEL</button>
    </div>
  `;

  window._currentOpMission      = missionId;
  window._currentOpSelectedDepts = selectedDepts;
  showModal();
}

window.toggleExecDept = function(deptId, missionId) {
  const arr = window._currentOpSelectedDepts;
  const idx = arr.indexOf(deptId);
  if (idx >= 0) arr.splice(idx, 1); else arr.push(deptId);
  document.querySelectorAll('.modal-dept-check').forEach(el => {
    if (el.dataset.dept === deptId) el.classList.toggle('selected', arr.includes(deptId));
  });
  window.updateModalProb(missionId);
};

window.updateModalProb = function(missionId) {
  const m = getMission(missionId);
  if (!m) return;
  const bi = document.getElementById('op-budget');
  const si = document.getElementById('op-staff');
  if (!bi || !si) return;
  const b = parseInt(bi.value), s = parseInt(si.value);
  const bv = document.getElementById('op-budget-val');
  const sv = document.getElementById('op-staff-val');
  if (bv) bv.textContent = fmt(b);
  if (sv) sv.textContent = `${s} agents`;
  const minBudget = Math.max(1, Math.floor(m.baseBudget * 0.5));
  const minStaff  = Math.max(1, Math.floor(m.baseStaff  * 0.5));
  const falseFlagPenalty = m.phaseFalseFlagPenalty ? 25 : 0;
  let p = 40 - falseFlagPenalty;
  p += Math.round(clamp((b - minBudget) / Math.max(1, m.baseBudget - minBudget), 0, 1) * 25);
  p += Math.round(clamp((s - minStaff)  / Math.max(1, m.baseStaff  - minStaff),  0, 1) * 20);
  p += (window._currentOpSelectedDepts || []).filter(d => m.execDepts.includes(d)).length * 8;
  p = clamp(p, 10, 92);
  const probEl   = document.getElementById('op-prob');
  const probWrap = document.getElementById('op-prob-wrap');
  if (probEl)   probEl.textContent  = `${p}%`;
  if (probWrap) probWrap.className  = 'prob-value ' + (p >= 70 ? 'prob-high' : p >= 45 ? 'prob-med' : 'prob-low');
};

window.executeOperation = function(missionId) {
  const m = getMission(missionId);
  if (!m) return;
  const bi     = document.getElementById('op-budget');
  const si     = document.getElementById('op-staff');
  const budget = bi ? parseInt(bi.value) : m.baseBudget;
  const staff  = si ? parseInt(si.value) : m.baseStaff;
  const depts  = window._currentOpSelectedDepts || [];

  if (G.budget < budget) { addLog('Insufficient budget.', 'log-warn'); hideModal(); render(); return; }
  if (G.staffTotal - G.staffUsed < staff) { addLog('Insufficient available staff.', 'log-warn'); hideModal(); render(); return; }

  G.budget    -= budget;
  G.staffUsed += staff;

  const minBudget = Math.max(1, Math.floor(m.baseBudget * 0.5));
  const minStaff  = Math.max(1, Math.floor(m.baseStaff  * 0.5));
  const falseFlagPenalty = m.phaseFalseFlagPenalty ? 25 : 0;
  let p = 40 - falseFlagPenalty;
  p += Math.round(clamp((budget - minBudget) / Math.max(1, m.baseBudget - minBudget), 0, 1) * 25);
  p += Math.round(clamp((staff  - minStaff)  / Math.max(1, m.baseStaff  - minStaff),  0, 1) * 20);
  p += depts.filter(d => m.execDepts.includes(d)).length * 8;
  m.successProb = clamp(p, 10, 92);

  m.status            = 'EXECUTING';
  m.execDaysLeft      = m.execDays;
  m.assignedBudget    = budget;
  m.assignedStaff     = staff;
  m.assignedExecDepts = depts;

  for (const did of depts) assignDeptDeployed(did, missionId);

  const phaseLabel = m.isMultiPhase ? ` [${m.phases[m.currentPhaseIndex].shortName}]` : '';
  addLog(`OP ${m.codename}${phaseLabel} launched. ${fmt(budget)} allocated. ${staff} agents. ETA ${m.execDays}d.`, 'log-info');
  hideModal();
  G.selected = m.id;
  render();
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
    <div class="go-stat"><span class="go-stat-val">${G.day}</span><span class="go-stat-lbl">DAYS</span></div>
    <div class="go-stat"><span class="go-stat-val">${G.opsSucceeded}</span><span class="go-stat-lbl">SUCCESSES</span></div>
    <div class="go-stat"><span class="go-stat-val">${G.opsCompleted}</span><span class="go-stat-lbl">OPERATIONS</span></div>
    <div class="go-stat"><span class="go-stat-val">${G.confidence}%</span><span class="go-stat-lbl">FINAL CONF.</span></div>
  `;
  showScreen('gameover');
}

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

function render() {
  renderHeader();
  renderInbox();
  renderDetail();
  renderDepts();
  renderActiveOps();
  renderLog();
}

function renderHeader() {
  document.getElementById('hdr-agency').textContent = G.cfg ? `${G.cfg.acronym} — ${G.cfg.agency}` : '—';
  document.getElementById('hdr-date').textContent   = `DAY ${G.day} · WEEK ${week()} · ${G.cfg ? G.cfg.leaderTitle.toUpperCase() : ''}`;

  const confPct = G.confidence;
  const bar     = document.getElementById('conf-bar');
  if (bar) {
    bar.style.width      = `${confPct}%`;
    bar.style.background = confPct >= 60 ? 'var(--green)' : confPct >= 35 ? 'var(--amber)' : 'var(--red)';
  }
  document.getElementById('res-conf').textContent   = `${confPct}%`;
  document.getElementById('res-budget').textContent = fmt(G.budget);
  document.getElementById('res-staff').textContent  = `${G.staffUsed} / ${G.staffTotal}`;

  const confGroup = document.getElementById('res-conf')?.closest('.res-group');
  if (confGroup) confGroup.dataset.tip = `Your standing with ${G.cfg?.leaderTitle}. Falls 2% each week. Hit 0% and you are dismissed.`;

  const budgetGroup = document.getElementById('res-budget')?.closest('.res-group');
  if (budgetGroup) budgetGroup.dataset.tip = `Available operational budget. Regenerates ${fmt(G.cfg?.weeklyBudgetRegen || 0)}/week.`;

  const staffGroup = document.getElementById('res-staff')?.closest('.res-group');
  if (staffGroup) staffGroup.dataset.tip = `Agents deployed / total available. Returned after operation concludes.`;

  const advBtn = document.getElementById('btn-advance');
  if (advBtn) advBtn.dataset.tip = 'Advance time by one day. Keyboard: → or N';
}

function renderInbox() {
  const inbox = G.missions.filter(m =>
    !['EXECUTING', 'SUCCESS', 'FAILURE', 'ARCHIVED'].includes(m.status));
  document.getElementById('inbox-count').textContent = inbox.length;
  const el = document.getElementById('mission-inbox');

  if (inbox.length === 0) {
    el.innerHTML = '<div style="text-align:center;padding:24px;font-family:var(--font-mono);font-size:10px;color:var(--text-dim);opacity:0.5">NO PENDING MISSIONS</div>';
    return;
  }

  el.innerHTML = inbox.map(m => {
    const isSelected  = G.selected === m.id;
    const daysLeft    = m.urgencyLeft;
    const deadlineCls = daysLeft <= 2 ? 'urgent' : daysLeft <= 5 ? 'warn' : '';
    const phaseTag    = m.isMultiPhase
      ? ` <span style="font-size:9px;color:var(--teal);font-family:var(--font-mono)">[${m.currentPhaseIndex + 1}/${m.phases.length}]</span>`
      : '';
    const statusChip = {
      INCOMING:      '<span class="mc-status status-incoming">INCOMING</span>',
      INVESTIGATING: '<span class="mc-status status-investigating">INVESTIGATING</span>',
      READY:         `<span class="mc-status ${m.phaseFalseFlag ? 'status-anomaly' : 'status-ready'}">${m.phaseFalseFlag ? '⚠ ANOMALY' : 'BRIEF READY'}</span>`,
      PHASE_COMPLETE:'<span class="mc-status status-phase-complete">PHASE DONE</span>',
      EXPIRED:       '<span class="mc-status status-expired">EXPIRED</span>',
    }[m.status] || '';

    return `<div class="mission-card threat-${m.threat} ${isSelected ? 'selected' : ''}"
      onclick="selectMission('${m.id}')">
      <div class="mc-type">${m.category}</div>
      <div class="mc-codename">OP ${m.codename}${phaseTag}</div>
      <div class="mc-meta">
        ${statusChip}
        <span class="mc-deadline ${deadlineCls}">${daysLeft}d LEFT</span>
      </div>
    </div>`;
  }).join('');
}

// Phase roadmap HTML for multi-phase missions
function renderPhaseRoadmap(m) {
  if (!m.isMultiPhase) return '';
  const nodes = m.phases.map((ph, i) => {
    const cp = m.completedPhases.find(c => c.phaseIndex === i);
    let cls, icon;
    if (cp) {
      cls  = cp.result === 'SUCCESS' ? 'phase-node-done' : 'phase-node-fail';
      icon = cp.result === 'SUCCESS' ? '✓' : '✕';
    } else if (i === m.currentPhaseIndex) {
      cls = 'phase-node-active'; icon = '→';
    } else {
      cls = 'phase-node-pending'; icon = String(i + 1);
    }
    return `<div class="phase-node ${cls}" data-tip="${ph.name}">
      <div class="phase-node-icon">${icon}</div>
      <div class="phase-node-label">${ph.shortName}</div>
    </div>${i < m.phases.length - 1 ? '<div class="phase-connector"></div>' : ''}`;
  }).join('');
  return `<div class="phase-roadmap">${nodes}</div>`;
}

function renderDetail() {
  const detailEl = document.getElementById('mission-detail');
  const titleEl  = document.getElementById('detail-panel-title');
  const chipEl   = document.getElementById('detail-status-chip');

  if (!G.selected) {
    titleEl.textContent = 'BRIEFING ROOM';
    chipEl.textContent = ''; chipEl.className = 'detail-status-chip';
    detailEl.innerHTML = `<div class="detail-empty">
      <div class="empty-icon">◈</div>
      <div class="empty-title">AWAITING SELECTION</div>
      <div class="empty-sub">Select a mission from the inbox to review its intelligence brief.</div>
    </div>`;
    return;
  }

  const m = getMission(G.selected);
  if (!m) { G.selected = null; renderDetail(); return; }

  titleEl.textContent = `OP ${m.codename}`;

  const chipMap = {
    INCOMING:      ['INCOMING',      'status-incoming'],
    INVESTIGATING: ['INVESTIGATING',  'status-investigating'],
    READY:         [m.phaseFalseFlag ? '⚠ ANOMALY' : 'BRIEF READY', m.phaseFalseFlag ? 'status-anomaly' : 'status-ready'],
    PHASE_COMPLETE:['PHASE COMPLETE', 'status-phase-complete'],
    EXECUTING:     ['EXECUTING',      'status-executing'],
    SUCCESS:       ['SUCCESS',        'status-success'],
    FAILURE:       ['FAILURE',        'status-failure'],
    EXPIRED:       ['EXPIRED',        'status-expired'],
  };
  const [sl, sc] = chipMap[m.status] || ['—', ''];
  chipEl.textContent = sl; chipEl.className = `detail-status-chip mc-status ${sc}`;

  const threatLabel = m.threat >= 5 ? 'CRITICAL' : m.threat >= 4 ? 'HIGH' : m.threat >= 3 ? 'MODERATE' : 'LOW';
  const threatCls   = m.threat >= 4 ? 'threat-high' : m.threat >= 3 ? 'threat-med' : 'threat-low';
  const locCls      = m.location === 'FOREIGN' ? 'location-foreign' : 'location-domestic';

  let content = `
    <div class="dc-header">
      <div class="dc-codename">OP ${m.codename}</div>
      <div class="dc-meta-row">
        <span class="dc-badge">${m.category}</span>
        <span class="dc-badge ${threatCls}" data-tip="Threat ${m.threat}/5. ${m.threat >= 4 ? 'Failure seriously damages confidence.' : 'Moderate consequences.'}">THREAT: ${threatLabel}</span>
        <span class="dc-badge ${locCls}">${m.location === 'FOREIGN' ? `${m.city}, ${m.country}` : `${m.city} [DOMESTIC]`}</span>
        <span class="dc-badge">DEADLINE: ${m.urgencyLeft}d</span>
      </div>
    </div>
    ${renderPhaseRoadmap(m)}
  `;

  if (m.status === 'INCOMING') {
    const phaseHdr = m.isMultiPhase
      ? `<div style="font-size:11px;color:var(--teal);margin-bottom:8px;font-family:var(--font-mono)">PHASE ${m.currentPhaseIndex + 1} OF ${m.phases.length}: ${m.phases[m.currentPhaseIndex].name.toUpperCase()}</div>`
      : '';
    content += `
      <div class="dc-section">
        ${phaseHdr}
        <div class="dc-section-title">INITIAL INTELLIGENCE REPORT</div>
        <div class="dc-report">${m.initialReport}</div>
      </div>
      <div class="dc-section">
        <div class="dc-section-title">ASSIGN DEPARTMENT TO INVESTIGATE</div>
        <div style="font-size:12px;color:var(--text-dim);margin-bottom:8px;">
          Assign a department to investigate. Est. ${m.invDays} day(s). Department will be occupied during investigation.
        </div>
        <div class="dc-dept-grid">
          ${m.invDepts.map(did => {
            const dept = G.depts[did];
            const avail = !dept.busy;
            const cfg   = DEPT_CONFIG.find(d => d.id === did);
            return `<button class="dc-dept-btn" ${avail ? '' : 'disabled'}
              onclick="assignInvestigation('${m.id}','${did}')"
              data-tip="${cfg?.tip || ''}${avail ? '' : '\n\n[Currently occupied — unavailable]'}">
              ${dept.short}${avail ? '' : ' [BUSY]'}
            </button>`;
          }).join('')}
        </div>
      </div>
      <div class="dc-actions">
        <button class="btn-danger" onclick="dismissMission('${m.id}')"
          data-tip="${m.threat >= 4 ? 'WARNING: Dismissing a high-threat mission carries a confidence penalty.' : 'Archive this mission without taking action.'}">
          DISMISS / ARCHIVE
        </button>
      </div>
    `;

  } else if (m.status === 'INVESTIGATING') {
    const progress   = Math.round(((m.invDays - m.invDaysLeft) / m.invDays) * 100);
    const phaseLabel = m.isMultiPhase ? ` — ${m.phases[m.currentPhaseIndex].name}` : '';
    content += `
      <div class="dc-section">
        <div class="dc-section-title">INITIAL INTELLIGENCE REPORT</div>
        <div class="dc-report">${m.initialReport}</div>
      </div>
      <div class="dc-section">
        <div class="dc-section-title">INVESTIGATION IN PROGRESS${phaseLabel}</div>
        <div style="font-size:12px;color:var(--text-dim);margin-bottom:8px;">
          <strong>${G.depts[m.assignedInvDept]?.name || '—'}</strong> is working the case. ${m.invDaysLeft} day(s) remaining. Advance the day to progress.
        </div>
        <div class="progress-wrap">
          <div class="progress-fill" style="width:${progress}%;background:var(--accent)"></div>
        </div>
      </div>
    `;

  } else if (m.status === 'READY') {
    if (m.phaseFalseFlag) {
      content += `
        <div class="false-flag-box">
          <div class="false-flag-title">⚠ INVESTIGATION ANOMALY DETECTED</div>
          <div class="false-flag-text">${m.phaseFalseFlagText}</div>
          <div class="false-flag-actions">
            <button class="btn-danger" onclick="falseFlagProceed('${m.id}')"
              data-tip="Accept the risk and proceed. Success probability will be reduced by 25%.">
              PROCEED ANYWAY (−25% PROB)
            </button>
            <button class="btn-neutral" onclick="falseFlagReinvestigate('${m.id}')"
              data-tip="Order a reinvestigation. The mission returns to INCOMING — assign a new department.">
              REINVESTIGATE
            </button>
          </div>
        </div>
      `;
    } else {
      const phaseLabel = m.isMultiPhase ? ` — ${m.phases[m.currentPhaseIndex].name.toUpperCase()}` : '';
      content += `
        <div class="dc-section">
          <div class="dc-section-title">INTELLIGENCE BRIEF — CLASSIFIED${phaseLabel}</div>
          <div class="dc-report">${m.fullReport}</div>
        </div>
        <div class="dc-actions">
          <button class="btn-primary" onclick="openOperationModal('${m.id}')"
            data-tip="Open the operation configuration screen. Set budget, staff, and departments, then execute.">
            APPROVE OPERATION
          </button>
          <button class="btn-danger" onclick="dismissMission('${m.id}')"
            data-tip="${m.threat >= 4 ? 'WARNING: Dismissing a high-threat mission carries a confidence penalty.' : 'Archive this mission. No operation will be launched.'}">
            ARCHIVE — DO NOT ACT
          </button>
        </div>
      `;
    }

  } else if (m.status === 'PHASE_COMPLETE') {
    const nextPh   = m.phases[m.currentPhaseIndex];
    const confText = m.lastPhaseConfDelta > 0
      ? `<span class="delta-item delta-pos">CONFIDENCE +${m.lastPhaseConfDelta}%</span>` : '';
    content += `
      <div class="result-box success">
        <div class="result-title">PHASE COMPLETE: ${m.lastPhaseName}</div>
        <div class="result-msg">${m.lastPhaseMsg}</div>
        <div class="result-deltas">${confText}</div>
      </div>
      <div class="phase-next-box">
        <div class="phase-next-title">NEXT: ${nextPh.name.toUpperCase()}</div>
        <div class="phase-next-desc">${fillTemplate(nextPh.opNarrative, m.currentPhaseFillVars)}</div>
      </div>
      <div class="dc-actions" style="margin-top:12px">
        <button class="btn-primary" onclick="acknowledgePhaseProceeding('${m.id}')"
          data-tip="Confirm phase completion and begin the next phase. You will need to assign a department to investigate.">
          PROCEED TO NEXT PHASE
        </button>
      </div>
    `;

  } else if (m.status === 'EXECUTING') {
    const progress    = Math.round(((m.execDays - m.execDaysLeft) / m.execDays) * 100);
    const deployed    = (m.assignedExecDepts || []).map(did => G.depts[did]?.short || did).join(', ') || 'None';
    const phaseLabel  = m.isMultiPhase
      ? `<div style="font-size:11px;color:var(--teal);margin-bottom:8px;font-family:var(--font-mono)">EXECUTING: ${m.phases[m.currentPhaseIndex].name.toUpperCase()}</div>`
      : '';
    content += `
      <div class="dc-section">
        ${phaseLabel}
        <div class="dc-section-title">OPERATION IN PROGRESS</div>
        <div style="font-size:13px;color:var(--purple);margin-bottom:6px;font-family:var(--font-disp);font-weight:600">
          ${m.execDaysLeft} day(s) until operation completion.
        </div>
        <div class="progress-wrap">
          <div class="progress-fill" style="width:${progress}%;background:var(--purple)"></div>
        </div>
      </div>
      <div class="dc-section">
        <div class="dc-section-title">OPERATION DETAILS</div>
        <div style="font-size:12px;line-height:1.7;color:var(--text-dim);font-style:italic">${m.opNarrative}</div>
        <div style="margin-top:12px;font-size:11px;color:var(--text-dim);line-height:1.8">
          Budget committed: <strong style="color:var(--text)">${fmt(m.assignedBudget)}</strong><br>
          Staff deployed: <strong style="color:var(--text)">${m.assignedStaff} agents</strong><br>
          Departments: <strong style="color:var(--text)">${deployed}</strong><br>
          Estimated success: <strong style="color:${m.successProb >= 70 ? 'var(--green)' : m.successProb >= 45 ? 'var(--amber)' : 'var(--red)'}">${m.successProb}%</strong>
        </div>
      </div>
    `;

  } else if (m.status === 'SUCCESS') {
    content += `
      <div class="result-box success">
        <div class="result-title">OPERATION SUCCESS</div>
        <div class="result-msg">${m.resultMsg}</div>
        <div class="result-deltas">
          <span class="delta-item delta-pos">CONFIDENCE +${m.confDelta}%</span>
          ${m.budgetDelta > 0 ? `<span class="delta-item delta-pos">BUDGET RECOVERY +${fmt(m.budgetDelta)}</span>` : ''}
        </div>
      </div>
      <div class="dc-actions" style="margin-top:12px">
        <button class="btn-neutral" onclick="archiveMission('${m.id}')">DEBRIEF COMPLETE — ARCHIVE</button>
      </div>
    `;

  } else if (m.status === 'FAILURE') {
    content += `
      <div class="result-box failure">
        <div class="result-title">OPERATION FAILED</div>
        <div class="result-msg">${m.resultMsg}</div>
        <div class="result-deltas">
          <span class="delta-item delta-neg">CONFIDENCE ${m.confDelta}%</span>
        </div>
      </div>
      <div class="dc-actions" style="margin-top:12px">
        <button class="btn-neutral" onclick="archiveMission('${m.id}')">DEBRIEF COMPLETE — ARCHIVE</button>
      </div>
    `;

  } else if (m.status === 'EXPIRED') {
    content += `
      <div class="result-box failure">
        <div class="result-title">MISSION WINDOW CLOSED</div>
        <div class="result-msg">The mission deadline has passed. No action was taken.</div>
      </div>
      <div class="dc-actions" style="margin-top:12px">
        <button class="btn-neutral" onclick="archiveMission('${m.id}')">ARCHIVE</button>
      </div>
    `;
  }

  detailEl.innerHTML = content;
}

function renderDepts() {
  const el = document.getElementById('dept-panel');
  el.innerHTML = DEPT_CONFIG.map(d => {
    const dept       = G.depts[d.id];
    const busy       = dept.busy;
    const isDeployed = dept.busyType === 'DEPLOYED';
    const busyM      = busy ? getMission(dept.busyMissionId) : null;
    let statusLabel, statusCls, daysInfo = '';

    if (!busy) {
      statusLabel = 'AVAILABLE'; statusCls = 'dept-free';
    } else if (isDeployed) {
      statusLabel = 'DEPLOYED'; statusCls = 'dept-deployed';
      daysInfo    = busyM ? `OP ${busyM.codename} · ${busyM.execDaysLeft}d` : '';
    } else {
      statusLabel = 'INVESTIGATING'; statusCls = 'dept-busy';
      daysInfo    = busyM ? `OP ${busyM.codename} · ${busyM.invDaysLeft}d` : '';
    }

    const statusTip = !busy
      ? 'Available for assignment.'
      : isDeployed
        ? `Deployed on OP ${busyM?.codename || '?'}. Returns when the operation concludes.`
        : `Investigating OP ${busyM?.codename || '?'}. ${busyM?.invDaysLeft || '?'} day(s) remaining.`;

    return `<div class="dept-card" data-tip="${d.tip}">
      <div class="dept-name">${d.name}</div>
      <div class="dept-desc">${d.desc}</div>
      <div class="dept-status-row">
        <span class="dept-status ${statusCls}" data-tip="${statusTip}">${statusLabel}</span>
        ${daysInfo ? `<span class="dept-assign-days">${daysInfo}</span>` : ''}
      </div>
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
    const progress  = Math.round(((m.execDays - m.execDaysLeft) / m.execDays) * 100);
    const phaseTag  = m.isMultiPhase
      ? ` <span style="font-size:9px;color:var(--teal)">· ${m.phases[m.currentPhaseIndex].shortName}</span>`
      : '';
    return `<div class="active-op-card" onclick="selectMission('${m.id}')" style="cursor:pointer"
      data-tip="Click to view. ${m.execDaysLeft}d remaining. ${m.successProb}% est. success.${m.isMultiPhase ? ` Phase ${m.currentPhaseIndex + 1}/${m.phases.length}.` : ''}">
      <div class="aoc-name">OP ${m.codename}${phaseTag}</div>
      <div class="aoc-days">${m.execDaysLeft}d remaining · ${m.successProb}% est.</div>
      <div class="progress-wrap" style="margin-top:4px">
        <div class="progress-fill" style="width:${progress}%;background:var(--purple)"></div>
      </div>
    </div>`;
  }).join('');
}

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
      const x = e.clientX + 16, y = e.clientY - 8;
      tip.style.left = '0px'; tip.style.top = '0px';
      requestAnimationFrame(() => {
        const tw = tip.offsetWidth, th = tip.offsetHeight;
        tip.style.left = Math.min(x, window.innerWidth  - tw - 10) + 'px';
        tip.style.top  = Math.max(8, Math.min(y, window.innerHeight - th - 10)) + 'px';
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
        <p>You are the Director of a covert intelligence agency answering directly to your head of state. Missions arrive as raw, unverified intelligence reports. Your job: investigate them, decide what to do, and execute operations before the window closes.</p>
        <p style="margin-top:8px">Your tenure depends on keeping <strong>Confidence</strong> above zero. Successes earn it. Failures and expired missions cost it. Resources are finite. The threats are not.</p>
      </div>
      <div class="help-section">
        <div class="help-section-title">MISSION FLOW</div>
        <div class="help-flow">
          <div class="help-flow-step"><span class="help-step-num">1</span><div><strong>INCOMING</strong> — A vague initial report lands on your desk. Assign a department to investigate and unlock the full intelligence brief.</div></div>
          <div class="help-flow-step"><span class="help-step-num">2</span><div><strong>INVESTIGATING</strong> — The assigned department works the case. Advance days to let it complete.</div></div>
          <div class="help-flow-step"><span class="help-step-num">3</span><div><strong>BRIEF READY</strong> — Full classified intelligence is unlocked. Review and decide: approve or archive.</div></div>
          <div class="help-flow-step"><span class="help-step-num">4</span><div><strong>CONFIGURE</strong> — Set budget and staff. Each recommended department adds +8% success probability.</div></div>
          <div class="help-flow-step"><span class="help-step-num">5</span><div><strong>EXECUTING</strong> — The operation runs. Departments are DEPLOYED and unavailable.</div></div>
          <div class="help-flow-step"><span class="help-step-num">6</span><div><strong>RESULT</strong> — Success earns confidence and a small budget recovery. Failure costs confidence.</div></div>
        </div>
      </div>
      <div class="help-section">
        <div class="help-section-title">MULTI-PHASE OPERATIONS</div>
        <p>Some operations require multiple sequential phases — surveillance, evidence collection, and a final action. Each phase must be investigated and executed in turn. A phase roadmap is displayed in the briefing panel.</p>
        <p style="margin-top:8px"><strong>⚠ Investigation Anomalies</strong> — A false flag may be detected during evidence-gathering phases. You can proceed with a −25% probability penalty, or reinvestigate at the cost of time.</p>
        <p style="margin-top:8px"><strong>Follow-up Missions</strong> — Some phases (e.g. interrogation) generate new missions based on intelligence extracted during the operation.</p>
      </div>
      <div class="help-section">
        <div class="help-section-title">DEPARTMENTS</div>
        ${DEPT_CONFIG.map(d => `<div class="help-dept-row">
          <div class="help-dept-name">${d.name}</div>
          <div class="help-dept-tip">${d.tip}</div>
        </div>`).join('')}
      </div>
      <div class="help-section">
        <div class="help-section-title">RESOURCES</div>
        <div class="help-resource-row"><strong>CONFIDENCE</strong> — Your standing with your head of state. Declines 2% per week. Plummets after failures. Reaches 0% and you are dismissed.</div>
        <div class="help-resource-row" style="margin-top:8px"><strong>BUDGET</strong> — Operational funds. Spent when launching operations. Regenerates partially each week. Running dry ends the agency.</div>
        <div class="help-resource-row" style="margin-top:8px"><strong>STAFF</strong> — Available agents. Committed to active operations and returned when they conclude.</div>
      </div>
      <div class="help-section">
        <div class="help-section-title">MISSION TYPES</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">
          ${Object.values(MISSION_TYPES).map(t => `<div style="background:var(--bg4);border:1px solid var(--border);border-radius:4px;padding:8px 10px">
            <div style="font-family:var(--font-disp);font-weight:700;font-size:11px;color:var(--text-hi);margin-bottom:2px">${t.label}</div>
            <div style="font-size:10px;color:var(--text-dim)">${t.location === 'FOREIGN' ? '🌍 Foreign' : '🏠 Domestic'} · ${t.isMultiPhase ? `Multi-phase (${t.phases.length} phases)` : `Threat ${t.threatRange[0]}–${t.threatRange[1]}`}</div>
          </div>`).join('')}
        </div>
      </div>
      <div class="help-section">
        <div class="help-section-title">CONTROLS</div>
        <div class="help-resource-row"><strong>ADVANCE DAY</strong> — Keyboard: <strong>→</strong> or <strong>N</strong></div>
        <div class="help-resource-row" style="margin-top:4px"><strong>ESC</strong> — Close any open modal.</div>
        <div class="help-resource-row" style="margin-top:4px"><strong>?</strong> — Open this handbook at any time.</div>
        <div class="help-resource-row" style="margin-top:4px">Hover over most interface elements for contextual help.</div>
      </div>
    </div>
  `;
  showModal();
}

// =============================================================================
// MODAL SYSTEM
// =============================================================================

function showModal()    { document.getElementById('modal-overlay').classList.remove('hidden'); }
function hideModal()    { document.getElementById('modal-overlay').classList.add('hidden'); }
function closeModalBg(e){ if (e.target === document.getElementById('modal-overlay')) hideModal(); }

// =============================================================================
// SCREEN MANAGEMENT
// =============================================================================

function showScreen(name) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const el = document.getElementById(`screen-${name}`);
  if (el) el.classList.add('active');
}

// =============================================================================
// COUNTRY SELECTION RENDER
// =============================================================================

function renderCountrySelect() {
  const grid = document.getElementById('country-grid');
  grid.innerHTML = Object.entries(COUNTRIES).map(([code, cfg]) => `
    <div class="country-card">
      <div class="country-flag">${cfg.flag}</div>
      <div class="country-name">${cfg.name}</div>
      <div class="country-agency">${cfg.agency}</div>
      <div class="country-reports">${cfg.reportsTo}</div>
      <div class="country-stats">
        <div class="c-stat"><span class="c-stat-lbl">BUDGET</span><span class="c-stat-val">${cfg.budgetLabel}</span></div>
        <div class="c-stat"><span class="c-stat-lbl">STAFF</span><span class="c-stat-val">${cfg.staffLabel}</span></div>
        <div class="c-stat"><span class="c-stat-lbl">CONFIDENCE</span><span class="c-stat-val">${cfg.confLabel}</span></div>
      </div>
      <div class="country-desc">${cfg.desc}</div>
      <button class="btn-assume" onclick="startGame('${code}')">ASSUME COMMAND</button>
    </div>
  `).join('');
}

// =============================================================================
// KEYBOARD SHORTCUTS
// =============================================================================

document.addEventListener('keydown', e => {
  if (e.key === 'ArrowRight' || e.key === 'n') {
    if (document.getElementById('screen-game')?.classList.contains('active') &&
        !document.getElementById('modal-overlay')?.classList.contains('hidden') === false) {
      advanceDay();
    }
  }
  if (e.key === 'Escape') hideModal();
  if (e.key === '?') {
    if (document.getElementById('screen-game')?.classList.contains('active')) showHelp();
  }
});

// =============================================================================
// BOOTSTRAP
// =============================================================================

document.addEventListener('DOMContentLoaded', () => {
  renderCountrySelect();
  showScreen('select');
  document.getElementById('btn-advance').addEventListener('click', advanceDay);
  document.getElementById('btn-help').addEventListener('click', showHelp);
  initTooltips();
});
