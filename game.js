'use strict';
// =============================================================================
// SHADOW DIRECTIVE v1.3  —  Per-department resources, XP & capabilities system
// MISSION_TYPES loaded from missions.js (must precede this file)
// =============================================================================

// =============================================================================
// CONFIGURATION
// =============================================================================

const COUNTRIES = {
  USA: {
    name: 'United States', agency: 'Special Activities Agency',
    acronym: 'SAA', flag: '🇺🇸',
    leader: 'POTUS', leaderTitle: 'the President', leaderFormal: 'Mr. President',
    currency: '$', currencySymbol: '$',
    budget: 60, confidence: 70,
    reportsTo: 'Reports directly to POTUS',
    desc: 'The world\'s most powerful intelligence apparatus. Vast resources, but under intense scrutiny.',
    budgetLabel: '$60M', confLabel: '70%',
    weeklyBudgetRegen: 4,
    // Per-department starting capacities
    deptCapacities: {
      ANALYSIS: 8, HUMINT: 6, SIGINT: 5,
      FIELD_OPS: 4, SPECIAL_OPS: 2, FOREIGN_OPS: 4, COUNTER_INTEL: 5,
    },
    domesticCities: ['New York', 'Chicago', 'Los Angeles', 'Washington D.C.', 'Miami', 'Houston', 'Seattle', 'Boston', 'Atlanta', 'Denver'],
  },
  UK: {
    name: 'United Kingdom', agency: 'Joint Covert Operations Bureau',
    acronym: 'JCOB', flag: '🇬🇧',
    leader: 'the Prime Minister', leaderTitle: 'the Prime Minister', leaderFormal: 'Prime Minister',
    currency: '£', currencySymbol: '£',
    budget: 40, confidence: 65,
    reportsTo: 'Reports directly to the Prime Minister',
    desc: 'A proud tradition of excellence. Moderate resources with strong allied networks.',
    budgetLabel: '£40M', confLabel: '65%',
    weeklyBudgetRegen: 3,
    deptCapacities: {
      ANALYSIS: 7, HUMINT: 5, SIGINT: 5,
      FIELD_OPS: 3, SPECIAL_OPS: 2, FOREIGN_OPS: 3, COUNTER_INTEL: 4,
    },
    domesticCities: ['London', 'Manchester', 'Birmingham', 'Glasgow', 'Leeds', 'Bristol', 'Edinburgh', 'Cardiff', 'Liverpool', 'Sheffield'],
  },
  FRANCE: {
    name: 'France', agency: 'Direction Spéciale des Opérations',
    acronym: 'DSO', flag: '🇫🇷',
    leader: 'the Président', leaderTitle: 'the Président de la République', leaderFormal: 'Monsieur le Président',
    currency: '€', currencySymbol: '€',
    budget: 25, confidence: 60,
    reportsTo: 'Reports directly to the Président de la République',
    desc: 'Lean and ruthless. Limited resources demand efficiency and audacity.',
    budgetLabel: '€25M', confLabel: '60%',
    weeklyBudgetRegen: 2,
    deptCapacities: {
      ANALYSIS: 6, HUMINT: 4, SIGINT: 4,
      FIELD_OPS: 3, SPECIAL_OPS: 1, FOREIGN_OPS: 3, COUNTER_INTEL: 4,
    },
    domesticCities: ['Paris', 'Lyon', 'Marseille', 'Toulouse', 'Bordeaux', 'Lille', 'Nice', 'Nantes', 'Strasbourg', 'Rennes'],
  }
};

// Each department's resource pool — unit names and base caps are defined here;
// starting capacity is set per-country in COUNTRIES.deptCapacities.
const DEPT_CONFIG = [
  {
    id: 'ANALYSIS', name: 'Analysis Bureau', short: 'ANALYSIS',
    unitName: 'analysts', unitNameSingle: 'analyst',
    baseCapacity: 8, maxCapacity: 14, xpCostPerUnit: 4,
    desc: 'Processes raw intel, produces assessments',
    tip: 'Best general-purpose investigator — required for most mission types. Analysts can be spread across many simultaneous investigations. Does not contribute to direct-action operations.',
  },
  {
    id: 'HUMINT', name: 'Human Intelligence', short: 'HUMINT',
    unitName: 'handlers', unitNameSingle: 'handler',
    baseCapacity: 6, maxCapacity: 10, xpCostPerUnit: 5,
    desc: 'Runs agents, assets, and informants',
    tip: 'Manages human agents and informants worldwide. Handlers can be committed to multiple simultaneous operations. Essential for cell-based threats and HVT tracking.',
  },
  {
    id: 'SIGINT', name: 'Signals Intelligence', short: 'SIGINT',
    unitName: 'intercept teams', unitNameSingle: 'intercept team',
    baseCapacity: 5, maxCapacity: 10, xpCostPerUnit: 5,
    desc: 'Electronic surveillance and interception',
    tip: 'Electronic surveillance and communications interception. Intercept teams can monitor multiple targets simultaneously. Particularly effective on tech-savvy or communications-dependent threats.',
  },
  {
    id: 'FIELD_OPS', name: 'Field Operations', short: 'FIELD OPS',
    unitName: 'field teams', unitNameSingle: 'field team',
    baseCapacity: 4, maxCapacity: 10, xpCostPerUnit: 6,
    desc: 'Domestic covert field teams',
    tip: 'Domestic covert field teams for surveillance, arrest, and direct action. Each team can only run one active mission. Field teams are a limited resource — deploying too many simultaneously leaves you exposed.',
  },
  {
    id: 'SPECIAL_OPS', name: 'Special Activities', short: 'SPECIAL OPS',
    unitName: 'strike units', unitNameSingle: 'strike unit',
    baseCapacity: 2, maxCapacity: 6, xpCostPerUnit: 12,
    desc: 'Paramilitary and direct-action capability',
    tip: 'Paramilitary direct-action units. Extremely scarce and high-impact. Each unit can only run one operation at a time. Prioritize carefully — committing your last unit to a low-value mission may leave you unable to respond to a critical threat.',
  },
  {
    id: 'FOREIGN_OPS', name: 'Foreign Operations', short: 'FOREIGN OPS',
    unitName: 'operatives', unitNameSingle: 'operative',
    baseCapacity: 4, maxCapacity: 10, xpCostPerUnit: 6,
    desc: 'International clandestine operations',
    tip: 'Runs all international clandestine operations. Each operative can only run one foreign operation at a time. Required for foreign HVT, rendition, asset rescue, and regime operations.',
  },
  {
    id: 'COUNTER_INTEL', name: 'Counter-Intelligence', short: 'COUNTER-INTEL',
    unitName: 'officers', unitNameSingle: 'officer',
    baseCapacity: 5, maxCapacity: 10, xpCostPerUnit: 5,
    desc: 'Internal security and mole-hunting',
    tip: 'Internal security and mole-hunting. Officers can handle multiple investigations simultaneously. Required for insider threat and domestic HVT operations.',
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
// UTILITIES
// =============================================================================

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randInt(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }
function clamp(v, lo, hi) { return Math.min(hi, Math.max(lo, v)); }
function fmt(n) { return G.cfg ? `${G.cfg.currencySymbol}${n}M` : `$${n}M`; }
function week() { return Math.ceil(G.day / 7); }

function fillTemplate(tpl, vars) {
  return tpl.replace(/\{(\w+)\}/g, (_, key) =>
    vars[key] !== undefined ? vars[key] : `[${key}]`);
}

function resolveVars(varsTemplate, baseVars) {
  const resolved = { ...baseVars };
  for (const [k, v] of Object.entries(varsTemplate || {}))
    resolved[k] = Array.isArray(v) ? pick(v) : v;
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
    xp: 0, xpThisMonth: 0,
    monthOpsCompleted: 0, monthOpsSucceeded: 0, lastRecapDay: 0,
    missions: [], depts: initDepts(cfg), log: [],
    selected: null, opsCompleted: 0, opsSucceeded: 0,
    missionIdCounter: 0, usedCodenames: new Set(), nextSpawnDay: 1,
    upgrades: initUpgrades(),
    hvts: [], hvtIdCounter: 0,
  };
  showScreen('game');
  spawnMission();
  if (Math.random() < 0.7) spawnMission();
  addLog(`Agency ${cfg.acronym} operational. Day 1.`, 'log-info');
  addLog(`${cfg.leaderFormal} expects results. Good luck, Director.`, 'log-info');
  render();
}

function restartGame() { G.country = null; showScreen('select'); }

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
// MISSION GENERATION
// =============================================================================

function initPhaseFields(m) {
  const ph = m.phases[m.currentPhaseIndex];
  const phFillVars = resolveVars(ph.vars || {}, m.fillVars);
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

  m.partialReport = ph.partialBriefs ? fillTemplate(pick(ph.partialBriefs), m.currentPhaseFillVars) : null;
  m.intelDepth    = 0;
  m.deepenDays    = ph.deepenDays || 1;
  m.deepening     = false;

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
  if (inbox.length >= 6) return;

  const typeId = forcedType || pick(Object.keys(MISSION_TYPES));
  const tmpl   = MISSION_TYPES[typeId];
  if (!tmpl) return;

  const codename = generateCodename();
  const urgency  = randInt(...tmpl.urgencyRange);
  const threat   = randInt(...tmpl.threatRange);

  let cityName, countryName;
  if (tmpl.location === 'DOMESTIC') {
    cityName = pick(G.cfg.domesticCities); countryName = G.cfg.name;
  } else {
    const loc = pick(FOREIGN_CITIES); cityName = loc.city; countryName = loc.country;
  }

  const fillVars = resolveVars(tmpl.vars || {}, {
    city: cityName, country: countryName, codename, urgency_days: String(urgency),
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
    initPhaseFields(mission);
  } else {
    Object.assign(mission, {
      invDays:    randInt(...tmpl.invDaysRange),
      execDays:   randInt(...tmpl.execDaysRange),
      baseBudget: randInt(...tmpl.budgetRange),
      invDepts:   tmpl.invDepts,
      execDepts:  tmpl.execDepts,
      opNarrative:   tmpl.opNarrative || '',
      initialReport: fillTemplate(pick(tmpl.initialReports), fillVars),
      fullReport:    fillTemplate(pick(tmpl.fullReports),    fillVars),
      partialReport: tmpl.partialReports ? fillTemplate(pick(tmpl.partialReports), fillVars) : null,
      intelDepth:    0,
      deepenDays:    tmpl.deepenDays || 1,
      deepening:     false,
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
    if (['INCOMING', 'READY', 'PHASE_COMPLETE', 'DEAD_END'].includes(m.status)) {
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

  checkGameOver();
  render();
  if (G.selected && !getMission(G.selected)) G.selected = null;

  // Monthly recap — every 30 days
  if (G.day - G.lastRecapDay >= 30) {
    G.lastRecapDay = G.day;
    showCapabilitiesMenu(true);
  }
}

function completeInvestigation(m) {
  if (m.deepening) {
    m.intelDepth      = 1;
    m.deepening       = false;
    m.assignedInvDept = null;
    addLog(`Deep investigation complete: OP ${m.codename} — Full intel confirmed.`, 'log-info');
    m.status = 'READY';
    render(); return;
  }

  m.assignedInvDept = null; // frees the dept unit automatically

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
  addLog(`Investigation complete: OP ${m.codename} — Intel brief ready.`, 'log-info');
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
      const confGain    = randInt(...m.confSuccess);
      const budgetReturn = Math.floor(m.assignedBudget * 0.1);
      G.confidence = clamp(G.confidence + confGain, 0, 100);
      if (budgetReturn > 0) G.budget = Math.min(G.budget + budgetReturn, 999);
      m.confDelta = confGain; m.budgetDelta = budgetReturn;
      m.resultMsg = msg;
      G.opsSucceeded++;
      G.monthOpsSucceeded++;
      gainXP(m.threat * 3, `OP ${m.codename} success`);
      registerOrUpdateHvt(m);
      addLog(`SUCCESS: OP ${m.codename}. +${confGain}% confidence.`, 'log-success');
    } else {
      m.status = 'FAILURE';
      const confLoss = randInt(...m.confFail);
      G.confidence = clamp(G.confidence + confLoss, 0, 100);
      m.confDelta = confLoss; m.budgetDelta = 0;
      m.resultMsg = msg;
      gainXP(1, `OP ${m.codename} (failed)`);
      registerOrUpdateHvtFailed(m);
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
    addLog(`SUCCESS: OP ${m.codename} — Full operation complete. +${confGain}% confidence.`, 'log-success');
  }
}

function spawnFollowUpMission(m, phase) {
  const intelText = pick(phase.followUpIntelTexts || []);
  if (intelText) addLog(`INTELLIGENCE LEAD — OP ${m.codename}: ${intelText}`, 'log-info');
  spawnMission(phase.spawnsFollowUp);
}

// =============================================================================
// MISSION MANAGEMENT ACTIONS
// =============================================================================

function selectMission(id) { G.selected = id; render(); }

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
  const avail      = deptAvail(deptId); // still shows pre-assignment since we just set status
  addLog(`${dept.name} assigned to OP ${m.codename}${phaseLabel}. Est. ${m.invDays} days.`, 'log-info');
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
  render();
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

function calcOpProb(m, budget, depts) {
  const minBudget    = Math.max(1, Math.floor(m.baseBudget * 0.5));
  const falseFlagPenalty = m.phaseFalseFlagPenalty ? 25 : 0;
  const fuzzyPenalty = (m.intelDepth === 0 && m.partialReport) ? 15 : 0;
  let p = 35 - falseFlagPenalty - fuzzyPenalty;
  p += Math.round(clamp((budget - minBudget) / Math.max(1, m.baseBudget - minBudget), 0, 1) * 25);
  p += depts.filter(d =>  m.execDepts.includes(d)).length * 12; // recommended
  p += depts.filter(d => !m.execDepts.includes(d)).length *  5; // optional
  return clamp(p, 10, 92);
}

function openOperationModal(missionId) {
  const m = getMission(missionId);
  if (!m) return;

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

  const phaseLabel  = m.isMultiPhase ? ` — ${m.phases[m.currentPhaseIndex].name.toUpperCase()}` : '';
  const penaltyNote = m.phaseFalseFlagPenalty
    ? `<div class="op-penalty-note">⚠ ANOMALY PENALTY: −25% success probability due to inconclusive investigation.</div>`
    : '';
  const fuzzyNote = (m.intelDepth === 0 && m.partialReport)
    ? `<div class="op-penalty-note op-penalty-fuzzy">⚠ PARTIAL INTEL: −15% success probability. Deepen investigation for full intel.</div>`
    : '';
  const initProb = calcOpProb(m, defBudget, selectedDepts);

  // Build department rows: recommended first, then others
  const buildDeptRow = (did, isRec) => {
    const dept  = G.depts[did];
    const cfg   = DEPT_CONFIG.find(d => d.id === did);
    const avail = deptAvail(did);
    const total = dept.capacity;
    const alloc = deptAllocated(did);
    const canSelect = avail > 0;
    const sel       = selectedDepts.includes(did);
    return `<div class="modal-dept-check ${sel ? 'selected' : ''} ${canSelect ? '' : 'unavail'}"
      data-dept="${did}" onclick="toggleExecDept('${did}','${missionId}')"
      data-tip="${cfg?.tip || ''}">
      <span class="modal-dept-check-name">${dept.short}</span>
      <span class="modal-dept-avail">${avail}/${total}</span>
      <span class="modal-dept-check-status" style="color:${isRec ? 'var(--accent)' : 'var(--text-dim)'};font-size:9px">${isRec ? 'REC' : 'OPT'}</span>
      <span class="modal-dept-check-status" style="color:${avail > 0 ? 'var(--green)' : 'var(--red)'}">${avail > 0 ? 'AVAIL' : 'FULL'}</span>
    </div>`;
  };

  const recRows   = m.execDepts.map(did => buildDeptRow(did, true)).join('');
  const otherRows = DEPT_CONFIG.filter(d => !m.execDepts.includes(d.id))
                               .map(d => buildDeptRow(d.id, false)).join('');

  document.getElementById('modal-title').textContent = `OP ${m.codename}${phaseLabel} — CONFIGURE OPERATION`;
  document.getElementById('modal-body').innerHTML = `
    ${penaltyNote}${fuzzyNote}
    <div class="modal-section">
      <div class="modal-section-title">OPERATION PLAN</div>
      <div class="op-narrative">${m.opNarrative}</div>
    </div>
    <div class="modal-section">
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
    <div class="modal-section">
      <div class="modal-section-title">RECOMMENDED DEPARTMENTS <span style="font-size:9px;color:var(--text-dim)">(each +12% success)</span></div>
      <div class="modal-dept-grid">${recRows}</div>
    </div>
    <div class="modal-section">
      <div class="modal-section-title">OPTIONAL SUPPORT <span style="font-size:9px;color:var(--text-dim)">(each +5% success)</span></div>
      <div class="modal-dept-grid">${otherRows}</div>
    </div>
    <div class="modal-section">
      <div class="prob-display" data-tip="Estimated success probability. Budget and recommended departments are the main drivers.${m.phaseFalseFlagPenalty ? ' Reduced 25% due to anomaly.' : ''}">
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

  window._currentOpMission       = missionId;
  window._currentOpSelectedDepts = selectedDepts;
  showModal();
}

window.toggleExecDept = function(deptId, missionId) {
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
  const p       = calcOpProb(m, b, window._currentOpSelectedDepts || []);
  const probEl  = document.getElementById('op-prob');
  const probWrap = document.getElementById('op-prob-wrap');
  if (probEl)   probEl.textContent = `${p}%`;
  if (probWrap) probWrap.className = 'prob-value ' + (p >= 70 ? 'prob-high' : p >= 45 ? 'prob-med' : 'prob-low');
};

window.executeOperation = function(missionId) {
  const m = getMission(missionId);
  if (!m) return;
  const bi     = document.getElementById('op-budget');
  const budget = bi ? parseInt(bi.value) : m.baseBudget;
  const depts  = window._currentOpSelectedDepts || [];

  if (G.budget < budget) { addLog('Insufficient budget.', 'log-warn'); hideModal(); render(); return; }

  // Verify dept availability (re-check at commit time)
  for (const did of depts) {
    if (deptAvail(did) < 1) {
      const cfg = DEPT_CONFIG.find(d => d.id === did);
      addLog(`${cfg?.name || did} has no available ${cfg?.unitName || 'units'}.`, 'log-warn');
      hideModal(); render(); return;
    }
  }

  G.budget -= budget;

  m.successProb       = calcOpProb(m, budget, depts);
  m.status            = 'EXECUTING';
  m.execDaysLeft      = m.execDays;
  m.assignedBudget    = budget;
  m.assignedExecDepts = depts;
  // Note: deptAllocated automatically increases because status=EXECUTING and depts are listed

  const deptSummary  = depts.map(d => G.depts[d]?.short || d).join(', ') || 'no depts';
  const phaseLabel   = m.isMultiPhase ? ` [${m.phases[m.currentPhaseIndex].shortName}]` : '';
  addLog(`OP ${m.codename}${phaseLabel} launched. ${fmt(budget)} · ${depts.length} dept(s) · ETA ${m.execDays}d.`, 'log-info');
  hideModal();
  G.selected = m.id;
  render();
};

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

  // Reset monthly counters after showing the summary
  if (isMonthly) {
    G.monthOpsCompleted  = 0;
    G.monthOpsSucceeded  = 0;
    G.xpThisMonth        = 0;
  }

  const renderUpgradeRows = () => {
    let html = '';

    // Department upgrades
    for (const dcfg of DEPT_CONFIG) {
      const dept     = G.depts[dcfg.id];
      const purchased = G.upgrades[dcfg.id] || 0;
      const maxExtra  = dcfg.maxCapacity - dept.capacity; // remaining upgrades possible
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
      const remaining = bu.maxPurchases - purchased;
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
    const maxExtra = dcfg.maxCapacity - dept.capacity;
    if (maxExtra <= 0 || G.xp < cost) return;
    G.xp -= cost;
    dept.capacity++;
    G.upgrades[id] = (G.upgrades[id] || 0) + 1;
    addLog(`UPGRADE: +1 ${dcfg.unitNameSingle} for ${dcfg.name}. Capacity now ${dept.capacity}.`, 'log-info');
  } else if (type === 'budget') {
    const bu = BUDGET_UPGRADES.find(b => b.id === id);
    if (!bu) return;
    const purchased = G.upgrades[id] || 0;
    if (purchased >= bu.maxPurchases || G.xp < bu.xpCost) return;
    G.xp -= bu.xpCost;
    G.upgrades[id] = purchased + 1;
    bu.apply();
    addLog(`UPGRADE: ${bu.label}.`, 'log-info');
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
      const maxExtra = d.maxCapacity - dpt.capacity;
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
      const remaining = bu.maxPurchases - purchased;
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
    <div class="go-stat"><span class="go-stat-val">${G.day}</span><span class="go-stat-lbl">DAYS</span></div>
    <div class="go-stat"><span class="go-stat-val">${G.opsSucceeded}</span><span class="go-stat-lbl">SUCCESSES</span></div>
    <div class="go-stat"><span class="go-stat-val">${G.opsCompleted}</span><span class="go-stat-lbl">OPERATIONS</span></div>
    <div class="go-stat"><span class="go-stat-val">${G.xp}</span><span class="go-stat-lbl">TOTAL XP</span></div>
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

const HVT_REGISTER_TYPES = new Set(['FOREIGN_HVT', 'DOMESTIC_HVT', 'RENDITION', 'SURVEILLANCE_TAKEDOWN', 'LONG_HUNT_HVT', 'MOLE_HUNT']);
const HVT_FAIL_TYPES      = new Set(['FOREIGN_HVT', 'DOMESTIC_HVT', 'LONG_HUNT_HVT']);

function hvtAliasFromMission(m) {
  if (m.selectedSuspectIdx !== null && m.suspects?.[m.selectedSuspectIdx])
    return m.suspects[m.selectedSuspectIdx].alias;
  return m.fillVars?.alias || m.fillVars?.target_alias || m.fillVars?.suspect_name || 'UNKNOWN';
}
function hvtRoleFromMission(m) {
  if (m.selectedSuspectIdx !== null && m.suspects?.[m.selectedSuspectIdx])
    return m.suspects[m.selectedSuspectIdx].role;
  return m.fillVars?.hvt_role || m.fillVars?.target_role || m.fillVars?.rendition_role || 'Unknown';
}

function registerOrUpdateHvt(m) {
  if (!HVT_REGISTER_TYPES.has(m.typeId)) return;
  const idx = G.hvts.findIndex(h => h.linkedMissionIds.includes(m.id));
  if (idx >= 0) {
    const h = G.hvts[idx];
    h.status = 'NEUTRALIZED';
    h.gaps   = [];
    return;
  }
  G.hvts.push({
    id: `H${++G.hvtIdCounter}`,
    type: (m.typeId.includes('HVT') || m.typeId === 'RENDITION') ? 'HVT' : 'ORG',
    alias: hvtAliasFromMission(m),
    role:  hvtRoleFromMission(m),
    org:   m.category,
    threat: m.threat,
    status: 'NEUTRALIZED',
    knownFields: { city: m.city, country: m.country || null },
    gaps: [],
    linkedMissionIds: [m.id],
    addedDay: G.day,
  });
}

function registerOrUpdateHvtFailed(m) {
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
    status: 'ACTIVE',
    knownFields: { city: m.city, country: m.country || null },
    gaps: ['Identity requires verification', 'Current location unconfirmed', 'Security detail size unknown'],
    linkedMissionIds: [m.id],
    addedDay: G.day,
  });
}

window.openHvtMissionModal = function(hvtId) {
  const h = G.hvts.find(h => h.id === hvtId);
  if (!h || h.status !== 'ACTIVE') return;

  // Build list of applicable mission types based on HVT location context
  const isForeign = !!(h.knownFields.country && h.knownFields.country !== (G.cfg?.name || ''));
  let availableTypeIds = isForeign
    ? ['FOREIGN_HVT', 'LONG_HUNT_HVT', 'RENDITION']
    : ['DOMESTIC_HVT', 'SURVEILLANCE_TAKEDOWN'];
  if (h.knownFields.address) availableTypeIds.push('SEARCH_PREMISES');
  availableTypeIds = availableTypeIds.filter(t => MISSION_TYPES[t]);

  if (availableTypeIds.length === 0) {
    addLog('No available mission types for this target.', 'log-warn');
    return;
  }

  document.getElementById('modal-title').textContent = `ASSIGN MISSION — ${h.alias}`;
  document.getElementById('modal-body').innerHTML = `
    <div class="modal-section">
      <div class="modal-section-title">TARGET: ${h.alias}</div>
      <div style="font-size:12px;color:var(--text-dim);margin-bottom:4px">${h.role}</div>
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
  spawnMission(typeId);
  const newest = G.missions[0];
  if (newest) {
    newest.linkedHvtId = hvtId;
    if (!h.linkedMissionIds.includes(newest.id)) h.linkedMissionIds.push(newest.id);
    addLog(`New mission spawned for target ${h.alias}: OP ${newest.codename}.`, 'log-info');
  }
  hideModal();
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

function render() {
  renderHeader();
  renderInbox();
  renderDetail();
  renderDepts();
  renderActiveOps();
  renderThreats();
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
  const xpEl = document.getElementById('res-xp');
  if (xpEl) xpEl.textContent = `${G.xp} XP`;

  const confGroup = document.getElementById('res-conf')?.closest('.res-group');
  if (confGroup) confGroup.dataset.tip = `Your standing with ${G.cfg?.leaderTitle}. Falls 2% each week. Hit 0% and you are dismissed.`;

  const budgetGroup = document.getElementById('res-budget')?.closest('.res-group');
  if (budgetGroup) budgetGroup.dataset.tip = `Available operational budget. Regenerates ${fmt(G.cfg?.weeklyBudgetRegen || 0)}/week. Running dry ends the agency.`;

  const xpGroup = document.getElementById('res-xp')?.closest('.res-group');
  if (xpGroup) xpGroup.dataset.tip = 'Experience points earned from completed operations. Spend at the monthly review or via the UPGRD button to expand department capacities and budget.';

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
    const chip = {
      INCOMING:       '<span class="mc-status status-incoming">INCOMING</span>',
      INVESTIGATING:  '<span class="mc-status status-investigating">INVESTIGATING</span>',
      READY:          `<span class="mc-status ${m.phaseFalseFlag ? 'status-anomaly' : 'status-ready'}">${m.phaseFalseFlag ? '⚠ ANOMALY' : 'BRIEF READY'}</span>`,
      PHASE_COMPLETE: '<span class="mc-status status-phase-complete">PHASE DONE</span>',
      DEAD_END:       '<span class="mc-status status-dead-end">DEAD END</span>',
      EXPIRED:        '<span class="mc-status status-expired">EXPIRED</span>',
    }[m.status] || '';

    return `<div class="mission-card threat-${m.threat} ${isSelected ? 'selected' : ''}"
      onclick="selectMission('${m.id}')">
      <div class="mc-type">${m.category}</div>
      <div class="mc-codename">OP ${m.codename}${phaseTag}</div>
      <div class="mc-meta">
        ${chip}
        <span class="mc-deadline ${deadlineCls}">${daysLeft}d LEFT</span>
      </div>
    </div>`;
  }).join('');
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
    INCOMING:       ['INCOMING',       'status-incoming'],
    INVESTIGATING:  ['INVESTIGATING',  'status-investigating'],
    READY:          [m.phaseFalseFlag ? '⚠ ANOMALY' : 'BRIEF READY', m.phaseFalseFlag ? 'status-anomaly' : 'status-ready'],
    PHASE_COMPLETE: ['PHASE COMPLETE', 'status-phase-complete'],
    DEAD_END:       ['DEAD END',       'status-dead-end'],
    EXECUTING:      ['EXECUTING',      'status-executing'],
    SUCCESS:        ['SUCCESS',        'status-success'],
    FAILURE:        ['FAILURE',        'status-failure'],
    EXPIRED:        ['EXPIRED',        'status-expired'],
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
    const hasUnselectedSuspects = m.suspects && m.suspects.length > 1 && m.selectedSuspectIdx === null;

    if (hasUnselectedSuspects) {
      // Suspect selection gate: show report + suspect grid, no dept assignment yet
      content += `
        <div class="dc-section">
          ${phaseHdr}
          <div class="dc-section-title">INITIAL INTELLIGENCE REPORT</div>
          <div class="dc-report">${m.initialReport}</div>
        </div>
        <div class="dc-section">
          <div class="dc-section-title">SUSPECT IDENTIFICATION</div>
          <div class="suspect-instructions">Multiple subjects flagged. Select the primary target before assigning an investigation department.</div>
          ${buildSuspectPanel(m, true)}
        </div>
        <div class="dc-actions">
          <button class="btn-danger" onclick="dismissMission('${m.id}')"
            data-tip="${m.threat >= 4 ? 'WARNING: Dismissing a high-threat mission carries a confidence penalty.' : 'Archive this mission without taking action.'}">
            DISMISS / ARCHIVE
          </button>
        </div>
      `;
    } else {
      // Suspect already selected (or no suspects): show report + read-only suspect panel + dept assignment
      const suspectSection = m.suspects && m.suspects.length > 0
        ? `<div class="dc-section">
            <div class="dc-section-title">IDENTIFIED SUSPECT</div>
            ${buildSuspectPanel(m, false)}
          </div>`
        : '';
      const deptGrid = `<div class="dc-dept-grid">
          ${m.invDepts.map(did => {
            const dept  = G.depts[did];
            const avail = deptAvail(did);
            const total = dept.capacity;
            const cfg   = DEPT_CONFIG.find(d => d.id === did);
            return `<button class="dc-dept-btn ${avail > 0 ? '' : 'unavail'}" ${avail > 0 ? '' : 'disabled'}
              onclick="assignInvestigation('${m.id}','${did}')"
              data-tip="${cfg?.tip || ''}${avail > 0 ? '' : '\n\nNo units available — all committed to other missions.'}">
              ${dept.short}
              <span class="dc-dept-avail">${avail}/${total}</span>
            </button>`;
          }).join('')}
        </div>`;
      content += `
        <div class="dc-section">
          ${phaseHdr}
          <div class="dc-section-title">INITIAL INTELLIGENCE REPORT</div>
          <div class="dc-report">${m.initialReport}</div>
        </div>
        ${suspectSection}
        <div class="dc-section">
          <div class="dc-section-title">ASSIGN DEPARTMENT TO INVESTIGATE</div>
          <div style="font-size:12px;color:var(--text-dim);margin-bottom:8px;">
            Assign a department to lead the investigation. Costs 1 unit for ${m.invDays} day(s). Other missions can simultaneously use the same department if capacity allows.
          </div>
          ${deptGrid}
        </div>
        <div class="dc-actions">
          <button class="btn-danger" onclick="dismissMission('${m.id}')"
            data-tip="${m.threat >= 4 ? 'WARNING: Dismissing a high-threat mission carries a confidence penalty.' : 'Archive this mission without taking action.'}">
            DISMISS / ARCHIVE
          </button>
        </div>
      `;
    }

  } else if (m.status === 'INVESTIGATING') {
    const progress   = Math.round(((m.invDays - m.invDaysLeft) / m.invDays) * 100);
    const deptName   = G.depts[m.assignedInvDept]?.name || '—';
    const phaseLabel = m.isMultiPhase ? ` — ${m.phases[m.currentPhaseIndex].name}` : '';
    const deepeningNote = m.deepening
      ? `<div class="intel-deepening-note">DEEP INVESTIGATION IN PROGRESS — Full intel package being assembled.</div>`
      : '';
    content += `
      ${deepeningNote}
      <div class="dc-section">
        <div class="dc-section-title">INITIAL INTELLIGENCE REPORT</div>
        <div class="dc-report">${m.initialReport}</div>
      </div>
      <div class="dc-section">
        <div class="dc-section-title">INVESTIGATION IN PROGRESS${phaseLabel}</div>
        <div style="font-size:12px;color:var(--text-dim);margin-bottom:8px;">
          <strong>${deptName}</strong> — 1 unit committed. ${m.invDaysLeft} day(s) remaining.
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
              data-tip="Accept the risk and proceed. Success probability reduced by 25%.">
              PROCEED ANYWAY (−25% PROB)
            </button>
            <button class="btn-neutral" onclick="falseFlagReinvestigate('${m.id}')"
              data-tip="Order a reinvestigation. Returns to INCOMING — assign a department again.">
              REINVESTIGATE
            </button>
          </div>
        </div>
      `;
    } else if (m.intelDepth === 0 && m.partialReport) {
      const phaseLabel = m.isMultiPhase ? ` — ${m.phases[m.currentPhaseIndex].name.toUpperCase()}` : '';
      content += `
        <div class="dc-section">
          <div class="dc-section-title">PRELIMINARY INTELLIGENCE BRIEF${phaseLabel} <span class="intel-depth-note">[PARTIAL — UNCONFIRMED]</span></div>
          <div class="dc-report intel-partial">${m.partialReport}</div>
        </div>
        <div class="dc-actions">
          <button class="btn-primary" onclick="openOperationModal('${m.id}')"
            data-tip="Execute with partial intel. −15% success probability penalty.">
            EXECUTE WITH PARTIAL INTEL
          </button>
          <button class="btn-neutral" onclick="deepenInvestigation('${m.id}')"
            data-tip="Commit a department to deepen investigation for full intel. Costs ${m.deepenDays} additional day(s).">
            DEEPEN INVESTIGATION
          </button>
          <button class="btn-danger" onclick="dismissMission('${m.id}')"
            data-tip="${m.threat >= 4 ? 'WARNING: Dismissing a high-threat mission carries a confidence penalty.' : 'Archive without action.'}">
            ARCHIVE — DO NOT ACT
          </button>
        </div>
      `;
    } else {
      const phaseLabel = m.isMultiPhase ? ` — ${m.phases[m.currentPhaseIndex].name.toUpperCase()}` : '';
      const confirmedBadge = m.intelDepth === 1 ? `<span class="intel-confirmed-badge">FULL INTEL CONFIRMED</span>` : '';
      content += `
        <div class="dc-section">
          <div class="dc-section-title">INTELLIGENCE BRIEF — CLASSIFIED${phaseLabel} ${confirmedBadge}</div>
          <div class="dc-report">${m.fullReport}</div>
        </div>
        <div class="dc-actions">
          <button class="btn-primary" onclick="openOperationModal('${m.id}')"
            data-tip="Configure and execute the operation.">
            APPROVE OPERATION
          </button>
          <button class="btn-danger" onclick="dismissMission('${m.id}')"
            data-tip="${m.threat >= 4 ? 'WARNING: Dismissing a high-threat mission carries a confidence penalty.' : 'Archive without action.'}">
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
          data-tip="Proceed to the next phase. You will need to assign a department to investigate.">
          PROCEED TO NEXT PHASE
        </button>
      </div>
    `;

  } else if (m.status === 'EXECUTING') {
    const progress   = Math.round(((m.execDays - m.execDaysLeft) / m.execDays) * 100);
    const deployed   = (m.assignedExecDepts || []).map(did => {
      const d = G.depts[did];
      const cfg = DEPT_CONFIG.find(c => c.id === did);
      return `${d?.short || did} (1 ${cfg?.unitNameSingle || 'unit'})`;
    }).join(', ') || 'None';
    const phaseLabel = m.isMultiPhase
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
        <div style="margin-top:12px;font-size:11px;color:var(--text-dim);line-height:1.9">
          Budget committed: <strong style="color:var(--text)">${fmt(m.assignedBudget)}</strong><br>
          Deployed: <strong style="color:var(--text)">${deployed}</strong><br>
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

  } else if (m.status === 'DEAD_END') {
    const suspectAlias = m.suspects?.[m.selectedSuspectIdx]?.alias || 'UNKNOWN';
    content += `
      <div class="dead-end-box">
        <div class="dead-end-title">INVESTIGATION INCONCLUSIVE</div>
        <div class="dead-end-msg">Subject "${suspectAlias}" is not linked to the identified threat. Surveillance target was incorrect — the real actor remains at large.</div>
      </div>
      <div class="dc-section" style="margin-top:12px">
        <div class="dc-section-title">ASSESSED SUSPECT</div>
        ${buildSuspectPanel(m, false)}
      </div>
      <div class="dc-actions" style="margin-top:12px">
        <button class="btn-neutral" onclick="reassignSuspect('${m.id}')"
          data-tip="Mark this suspect as eliminated and reassign surveillance to a remaining subject. Costs 1 urgency day.">
          REASSIGN SURVEILLANCE (−1 URGENCY DAY)
        </button>
        <button class="btn-danger" onclick="dismissMission('${m.id}')"
          data-tip="Dismiss this mission without further action.">
          DISMISS
        </button>
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

  const active      = G.hvts.filter(h => h.status === 'ACTIVE');
  const neutralized = G.hvts.filter(h => h.status === 'NEUTRALIZED');
  countEl.textContent = active.length;

  if (G.hvts.length === 0) {
    panelEl.innerHTML = '<div class="no-ops-msg">No tracked threats.</div>';
    return;
  }

  const buildCard = h => {
    const isActive   = h.status === 'ACTIVE';
    const typeBadge  = `<span class="threat-type-badge ${h.type === 'HVT' ? 'hvt-badge' : 'org-badge'}">${h.type}</span>`;
    const statusChip = isActive
      ? `<span class="threat-status-chip threat-status-active">ACTIVE</span>`
      : `<span class="threat-status-chip threat-status-neutralized">NEUTRALIZED</span>`;

    const knownHtml = Object.entries(h.knownFields || {}).filter(([, v]) => v).map(([k, v]) =>
      `<div class="threat-field-row">
        <span class="threat-field-key">${k.toUpperCase()}</span>
        <span class="threat-field-val">${v}</span>
      </div>`).join('');

    const gapsHtml = h.gaps && h.gaps.length > 0
      ? `<div class="threat-gaps">
          <div class="threat-gaps-title">INTEL GAPS</div>
          ${h.gaps.map(g => `<div class="threat-gap-item">• ${g}</div>`).join('')}
        </div>`
      : '';

    const linkedBadges = h.linkedMissionIds.map(mid => {
      const m = getMission(mid);
      return m ? `<span class="threat-linked-badge" onclick="selectMission('${mid}')" style="cursor:pointer">OP ${m.codename}</span>` : '';
    }).filter(Boolean).join('');

    const assignBtn = isActive
      ? `<button class="btn-threat-assign" onclick="openHvtMissionModal('${h.id}')">ASSIGN MISSION</button>`
      : '';

    return `<div class="threat-card ${isActive ? 'threat-card-active' : 'threat-card-neutralized'}">
      <div class="threat-card-hdr">
        ${typeBadge}
        <span class="threat-alias">${h.alias}</span>
        ${statusChip}
      </div>
      <div class="threat-role">${h.role}</div>
      <div class="threat-org">${h.org}</div>
      ${knownHtml ? `<div class="threat-known-fields">${knownHtml}</div>` : ''}
      ${gapsHtml}
      ${linkedBadges ? `<div class="threat-linked">${linkedBadges}</div>` : ''}
      ${assignBtn}
    </div>`;
  };

  let html = '';
  if (active.length > 0) {
    html += `<div class="threat-section-title">ACTIVE THREATS</div>${active.map(buildCard).join('')}`;
  }
  if (neutralized.length > 0) {
    html += `<div class="threat-section-title">NEUTRALIZED</div>${neutralized.map(buildCard).join('')}`;
  }
  panelEl.innerHTML = html;
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
        <p>You are the Director of a covert intelligence agency. Missions arrive as raw intelligence reports. Investigate them, decide what to act on, and execute operations before the window closes. Keep Confidence above zero to stay in command.</p>
      </div>
      <div class="help-section">
        <div class="help-section-title">DEPARTMENT RESOURCES</div>
        <p>Each department has a limited pool of units — analysts, field teams, strike units, etc. Assigning a department to investigate or execute a mission commits one unit from that pool for the duration. Multiple missions can draw from the same department simultaneously, as long as capacity allows.</p>
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
          <div class="help-flow-step"><span class="help-step-num">2</span><div><strong>INVESTIGATING</strong> — Department works the case. Other missions can use the same dept if capacity allows.</div></div>
          <div class="help-flow-step"><span class="help-step-num">3</span><div><strong>BRIEF READY</strong> — Full intel unlocked. Approve or archive.</div></div>
          <div class="help-flow-step"><span class="help-step-num">4</span><div><strong>CONFIGURE</strong> — Set budget. Select departments (each recommended dept +12%, optional +5%). No staff slider — resource cost is one unit per assigned department.</div></div>
          <div class="help-flow-step"><span class="help-step-num">5</span><div><strong>EXECUTING</strong> — Operation runs. Each assigned department has one unit committed until resolution.</div></div>
          <div class="help-flow-step"><span class="help-step-num">6</span><div><strong>RESULT</strong> — Earn confidence and XP. Archive to clear.</div></div>
        </div>
      </div>
      <div class="help-section">
        <div class="help-section-title">XP & CAPABILITIES</div>
        <p>You earn XP for each completed mission — more for higher-threat successes. Every 30 days a <strong>Monthly Review</strong> fires automatically, letting you spend XP to expand department capacity or increase budget. You can also open the upgrade shop anytime via the <strong>UPGRD</strong> button.</p>
        <p style="margin-top:8px">Unspent XP carries over. Prioritize scarce departments (Special Ops, Field Ops) early.</p>
      </div>
      <div class="help-section">
        <div class="help-section-title">MULTI-PHASE OPERATIONS</div>
        <p>Some operations span multiple phases — surveillance, evidence collection, and a final action. Each phase requires its own investigation and execution. ⚠ False flag anomalies can occur mid-investigation: proceed with a probability penalty or reinvestigate.</p>
      </div>
      <div class="help-section">
        <div class="help-section-title">RESOURCES</div>
        <div class="help-resource-row"><strong>CONFIDENCE</strong> — Drops 2% weekly, falls on failures, rises on successes. Hits 0% and you're out.</div>
        <div class="help-resource-row" style="margin-top:8px"><strong>BUDGET</strong> — Spent on operations. Regenerates weekly. Running dry defunds the agency.</div>
        <div class="help-resource-row" style="margin-top:8px"><strong>XP</strong> — Earned from operations. Spend at monthly reviews to grow your capabilities.</div>
      </div>
      <div class="help-section">
        <div class="help-section-title">CONTROLS</div>
        <div class="help-resource-row"><strong>→ / N</strong> — Advance day. <strong>ESC</strong> — Close modal. <strong>?</strong> — This handbook. <strong>U</strong> — Open upgrade shop.</div>
      </div>
    </div>
  `;
  showModal();
}

// =============================================================================
// MODAL / SCREEN SYSTEM
// =============================================================================

function showModal()     { document.getElementById('modal-overlay').classList.remove('hidden'); }
function hideModal()     { document.getElementById('modal-overlay').classList.add('hidden'); }
function closeModalBg(e) { if (e.target === document.getElementById('modal-overlay')) hideModal(); }

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
  grid.innerHTML = Object.entries(COUNTRIES).map(([code, cfg]) => {
    const caps = cfg.deptCapacities;
    const capRows = DEPT_CONFIG.map(d =>
      `<div class="c-cap-row"><span>${d.short}</span><span>${caps[d.id]} ${d.unitName}</span></div>`
    ).join('');
    return `
    <div class="country-card">
      <div class="country-flag">${cfg.flag}</div>
      <div class="country-name">${cfg.name}</div>
      <div class="country-agency">${cfg.agency}</div>
      <div class="country-reports">${cfg.reportsTo}</div>
      <div class="country-stats">
        <div class="c-stat"><span class="c-stat-lbl">BUDGET</span><span class="c-stat-val">${cfg.budgetLabel}</span></div>
        <div class="c-stat"><span class="c-stat-lbl">CONFIDENCE</span><span class="c-stat-val">${cfg.confLabel}</span></div>
        <div class="c-stat"><span class="c-stat-lbl">REGEN</span><span class="c-stat-val">${cfg.currencySymbol}${cfg.weeklyBudgetRegen}M/wk</span></div>
      </div>
      <div class="c-capacities">${capRows}</div>
      <div class="country-desc">${cfg.desc}</div>
      <button class="btn-assume" onclick="startGame('${code}')">ASSUME COMMAND</button>
    </div>`;
  }).join('');
}

// =============================================================================
// KEYBOARD SHORTCUTS
// =============================================================================

document.addEventListener('keydown', e => {
  if (e.key === 'ArrowRight' || e.key === 'n') {
    if (document.getElementById('screen-game')?.classList.contains('active') &&
        !document.getElementById('modal-overlay')?.classList.contains('hidden') === false)
      advanceDay();
  }
  if (e.key === 'Escape') hideModal();
  if (e.key === '?')
    if (document.getElementById('screen-game')?.classList.contains('active')) showHelp();
  if (e.key === 'u' || e.key === 'U')
    if (document.getElementById('screen-game')?.classList.contains('active')) showCapabilitiesMenu(false);
});

// =============================================================================
// BOOTSTRAP
// =============================================================================

document.addEventListener('DOMContentLoaded', () => {
  renderCountrySelect();
  showScreen('select');
  document.getElementById('btn-advance').addEventListener('click', advanceDay);
  document.getElementById('btn-help').addEventListener('click', showHelp);
  document.getElementById('btn-capabilities')?.addEventListener('click', () => showCapabilitiesMenu(false));
  document.getElementById('btn-abort-game')?.addEventListener('click', confirmAbortGame);
  initTooltips();
});
