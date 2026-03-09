'use strict';
// =============================================================================
// SHADOW DIRECTIVE — Long Plots / Files System
// Persistent hostile organizations that spawn linked mission chains.
// =============================================================================

(function () {

// =============================================================================
// ORG TEMPLATES
// =============================================================================

const PLOT_ORG_TYPES = [
  {
    type: 'terrorist_network',
    label: 'TERROR NETWORK',
    region: 'EITHER',
    missionPool: ['DOMESTIC_TERROR', 'FOREIGN_HVT', 'COUNTER_INTEL'],
    threatBase: [3, 4],
    descs: [
      'A decentralized terror network with cells operating across multiple countries.',
      'A well-funded extremist organization recruiting through encrypted channels.',
      'A shadowy terror apparatus with ties to state sponsors and independent financiers.',
    ],
    objectives: [
      'a coordinated multi-site attack on critical infrastructure',
      'the assassination of a senior government official',
      'a mass-casualty event targeting civilian population centers',
      'the disruption of national elections through intimidation and violence',
    ],
  },
  {
    type: 'espionage_ring',
    label: 'ESPIONAGE RING',
    region: 'DOMESTIC',
    missionPool: ['COUNTER_INTEL', 'MOLE_HUNT', 'DOMESTIC_TERROR'],
    threatBase: [3, 5],
    descs: [
      'A foreign intelligence penetration network embedded within government institutions.',
      'A long-running espionage ring targeting classified defense programs.',
      'A hostile service network that has compromised multiple cleared personnel.',
    ],
    objectives: [
      'the systematic exfiltration of classified weapons technology',
      'the compromise of a strategic intelligence-sharing alliance',
      'the penetration of senior national security decision-making circles',
      'the recruitment of a senior cabinet-level asset for a hostile power',
    ],
  },
  {
    type: 'weapons_proliferation',
    label: 'PROLIFERATION NETWORK',
    region: 'FOREIGN',
    missionPool: ['FOREIGN_HVT', 'RENDITION', 'ASSET_RESCUE'],
    threatBase: [3, 5],
    descs: [
      'A procurement network supplying weapons technology to sanctioned states.',
      'A clandestine proliferation ring brokering restricted materials across borders.',
      'An international network facilitating the transfer of dual-use technology to hostile actors.',
    ],
    objectives: [
      'the delivery of enrichment-grade centrifuge components to a sanctioned state',
      'the transfer of advanced missile guidance systems to a hostile regime',
      'the acquisition and sale of biological weapons precursors on the black market',
      'the supply of advanced electronic warfare systems to a state sponsor of terrorism',
    ],
  },
  {
    type: 'state_proxy',
    label: 'STATE PROXY',
    region: 'FOREIGN',
    missionPool: ['FOREIGN_HVT', 'COUNTER_INTEL', 'REGIME_OP', 'ASSET_RESCUE'],
    threatBase: [4, 5],
    descs: [
      'A state-directed proxy force conducting asymmetric operations against allied interests.',
      'A government-backed paramilitary network operating under commercial cover.',
      'A deniable action arm of a hostile intelligence service.',
    ],
    objectives: [
      'the destabilization of a key allied government through covert action',
      'the establishment of a permanent covert military presence in a neutral country',
      'the systematic assassination of allied intelligence personnel abroad',
      'the creation of a parallel governing structure in a contested region',
    ],
  },
  {
    type: 'criminal_syndicate',
    label: 'CRIMINAL SYNDICATE',
    region: 'EITHER',
    missionPool: ['DOMESTIC_TERROR', 'FOREIGN_HVT', 'RENDITION'],
    threatBase: [2, 4],
    descs: [
      'A transnational criminal organization with intelligence-grade operational security.',
      'A syndicate leveraging criminal networks to provide logistical support to hostile actors.',
      'A sophisticated criminal enterprise with documented ties to state intelligence services.',
    ],
    objectives: [
      'the laundering of billions through compromised financial institutions',
      'the establishment of a narco-state corridor supplying hostile operations',
      'the infiltration and corruption of key border security personnel',
      'the operation of a smuggling network supporting weapons proliferation',
    ],
  },
];

// =============================================================================
// NAME GENERATION
// =============================================================================

const ORG_NAME_ADJ = [
  'BLACK', 'RED', 'IRON', 'CRIMSON', 'PALE', 'SCARLET', 'GREY', 'DARK',
  'SILENT', 'COLD', 'DEEP', 'HOLLOW', 'BURNING', 'STEEL', 'BROKEN',
  'BLIND', 'SLEEPING', 'SUNKEN', 'FROZEN', 'SILVER',
];

const ORG_NAME_NOUN = [
  'CRESCENT', 'COLUMN', 'DAWN', 'HORIZON', 'DIRECTIVE', 'MERIDIAN',
  'SYNDICATE', 'COVENANT', 'NETWORK', 'CIRCLE', 'FRONT', 'VANGUARD',
  'TIDE', 'AXIS', 'ECLIPSE', 'ORCHID', 'COMPASS', 'MIRROR',
  'PROTOCOL', 'CIRCUIT', 'VEIL', 'LATTICE',
];

const FILE_CODENAMES = [
  'CARDINAL', 'PHOENIX', 'CERBERUS', 'LEVIATHAN', 'CHIMERA',
  'PROMETHEUS', 'LAZARUS', 'PANDORA', 'OUROBOROS', 'MINOTAUR',
  'TYPHON', 'BASILISK', 'NIGHTFALL', 'ICARUS', 'MEDUSA',
  'HYDRA', 'KRAKEN', 'ARGUS', 'ORACLE', 'SIBYL',
  'JANUS', 'NEMESIS', 'THANATOS', 'ATLAS', 'CHARON',
];

const _usedOrgNames = new Set();
const _usedFileNames = new Set();

function generateOrgName() {
  for (let i = 0; i < 80; i++) {
    const name = 'THE ' + pick(ORG_NAME_ADJ) + ' ' + pick(ORG_NAME_NOUN);
    if (!_usedOrgNames.has(name)) { _usedOrgNames.add(name); return name; }
  }
  return 'THE ' + pick(ORG_NAME_ADJ) + ' ' + pick(ORG_NAME_NOUN) + ' ' + randInt(2, 9);
}

function generateFileName() {
  const avail = FILE_CODENAMES.filter(n => !_usedFileNames.has(n));
  const name = avail.length > 0 ? pick(avail) : pick(FILE_CODENAMES) + '-' + randInt(2, 99);
  _usedFileNames.add(name);
  return name;
}

// =============================================================================
// LEADER / SUSPECT GENERATION
// =============================================================================

const LEADER_ALIASES = [
  'THE ARCHITECT', 'THE DIRECTOR', 'THE HANDLER', 'THE BROKER',
  'THE ENGINEER', 'THE SHEPHERD', 'THE CONDUCTOR', 'THE COURIER',
  'THE GHOST', 'THE BANKER', 'THE SURGEON', 'THE WATCHER',
  'THE PROFESSOR', 'THE PILGRIM', 'THE GARDENER', 'THE BISHOP',
];

const LIEUTENANT_ROLES = [
  'logistics coordinator', 'communications handler', 'financial officer',
  'recruitment lead', 'technical specialist', 'field commander',
  'intelligence officer', 'operations planner', 'weapons specialist',
  'safe house manager', 'documents forger', 'surveillance chief',
];

// =============================================================================
// PLOT CREATION
// =============================================================================

function createPlot() {
  const orgType = pick(PLOT_ORG_TYPES);
  const totalSteps = randInt(4, 7);
  const flagThreshold = randInt(2, 3);

  // Pick region - respect org type preference
  let region, city, country;
  if (orgType.region === 'DOMESTIC') {
    region = 'DOMESTIC';
    city = pick(G.cfg.domesticCities);
    country = G.cfg.name;
  } else if (orgType.region === 'FOREIGN') {
    region = 'FOREIGN';
    const loc = pick(FOREIGN_CITIES);
    city = loc.city; country = loc.country;
  } else {
    region = Math.random() < 0.5 ? 'DOMESTIC' : 'FOREIGN';
    if (region === 'DOMESTIC') {
      city = pick(G.cfg.domesticCities); country = G.cfg.name;
    } else {
      const loc = pick(FOREIGN_CITIES);
      city = loc.city; country = loc.country;
    }
  }

  const leaderAlias = pick(LEADER_ALIASES);
  const lieutenants = [];
  const ltCount = randInt(2, 4);
  for (let i = 0; i < ltCount; i++) {
    lieutenants.push({
      role: pick(LIEUTENANT_ROLES),
      known: false,
      neutralized: false,
    });
  }

  const plot = {
    id: 'P' + (++G.plotIdCounter),
    fileName: generateFileName(),
    orgName: generateOrgName(),
    orgType: orgType.type,
    orgLabel: orgType.label,
    orgDesc: pick(orgType.descs),
    objective: pick(orgType.objectives),
    missionPool: orgType.missionPool,
    threat: randInt(...orgType.threatBase),
    region: region,
    baseCity: city,
    baseCountry: country,
    leaderAlias: leaderAlias,
    lieutenants: lieutenants,

    // Arc tracking
    totalSteps: totalSteps,
    currentStep: 0,
    missions: [],          // { missionId, stepIndex, typeId, status }
    flagged: false,
    flaggedDay: null,
    flagStepThreshold: flagThreshold,

    // Status: ACTIVE, DISRUPTED, DESTROYED, DORMANT
    status: 'ACTIVE',
    infiltrated: false,

    // Timing
    createdDay: G.day,
    nextMissionDay: G.day + randInt(1, 3),
    missionInterval: [5, 10],

    // Known intel (revealed progressively)
    knownIntel: {
      type: false,
      leader: false,
      objective: false,
      strength: false,
      baseLocation: false,
    },
  };

  G.plots.push(plot);
  return plot;
}

// =============================================================================
// MISSION SPAWNING FOR PLOTS
// =============================================================================

function spawnPlotMission(plot) {
  const step = plot.currentStep;

  // Pick mission type from pool
  const validTypes = plot.missionPool.filter(function (t) { return MISSION_TYPES[t]; });
  if (validTypes.length === 0) return;
  const typeId = pick(validTypes);

  // Spawn using core system
  const prevLen = G.missions.length;
  spawnMission(typeId);
  const m = G.missions.length > prevLen ? G.missions[0] : null;
  if (!m) return;

  // Tag mission with plot metadata
  m.plotId = plot.id;
  m.plotStep = step;
  m.plotFileName = plot.flagged ? plot.fileName : null;
  m.plotOrgName = plot.flagged ? plot.orgName : null;

  // Escalate threat based on arc progress
  var progress = step / Math.max(1, plot.totalSteps - 1);
  var escalation = Math.floor(progress * 2);
  m.threat = clamp(m.threat + escalation, 1, 5);

  // Record in plot
  plot.missions.push({
    missionId: m.id,
    stepIndex: step,
    typeId: typeId,
    codename: m.codename,
    status: 'PENDING',
  });

  // Schedule next
  plot.currentStep++;
  if (plot.currentStep < plot.totalSteps) {
    plot.nextMissionDay = G.day + randInt(...plot.missionInterval);
  }

  // Log flavor
  if (plot.flagged) {
    addLog(`FILE ${plot.fileName}: New linked intelligence — OP ${m.codename} [${m.label}].`, 'log-warn');
  }
}

// =============================================================================
// PLAYER-INITIATED ORG MISSIONS (Infiltration / Takedown)
// =============================================================================

function spawnOrgInfiltration(plotId) {
  var plot = G.plots.find(function (p) { return p.id === plotId; });
  if (!plot || plot.status !== 'ACTIVE' || plot.infiltrated) return;

  var prevLen = G.missions.length;
  spawnMission('ORG_INFILTRATION');
  var m = G.missions.length > prevLen ? G.missions[0] : null;
  if (!m) {
    addLog('Mission inbox full — cannot launch infiltration.', 'log-warn');
    return;
  }

  m.plotId = plot.id;
  m.plotFileName = plot.fileName;
  m.plotOrgName = plot.orgName;
  m.isOrgInfiltration = true;
  m.location = plot.region;
  m.threat = clamp(plot.threat, 3, 5);

  // Inject org name into fill vars for briefs
  if (m.fillVars) m.fillVars.org_name = plot.orgName;

  if (!plot.missions) plot.missions = [];
  plot.missions.push({
    missionId: m.id, stepIndex: -1, typeId: 'ORG_INFILTRATION',
    codename: m.codename, status: 'PENDING',
  });

  addLog('FILE ' + plot.fileName + ': Infiltration operation launched — OP ' + m.codename + '.', 'log-info');
  hideModal();
  render();
}

function spawnOrgTakedown(plotId) {
  var plot = G.plots.find(function (p) { return p.id === plotId; });
  if (!plot || plot.status !== 'ACTIVE' || !plot.infiltrated) return;

  // Require full intel
  var intel = plot.knownIntel;
  if (!intel.type || !intel.leader || !intel.objective || !intel.strength || !intel.baseLocation) {
    addLog('FILE ' + plot.fileName + ': Insufficient intelligence for takedown. All intel fields must be confirmed.', 'log-warn');
    return;
  }

  var prevLen = G.missions.length;
  spawnMission('ORG_TAKEDOWN');
  var m = G.missions.length > prevLen ? G.missions[0] : null;
  if (!m) {
    addLog('Mission inbox full — cannot launch takedown.', 'log-warn');
    return;
  }

  m.plotId = plot.id;
  m.plotFileName = plot.fileName;
  m.plotOrgName = plot.orgName;
  m.isOrgTakedown = true;
  m.location = plot.region;
  m.threat = 5;

  if (m.fillVars) m.fillVars.org_name = plot.orgName;

  if (!plot.missions) plot.missions = [];
  plot.missions.push({
    missionId: m.id, stepIndex: -2, typeId: 'ORG_TAKEDOWN',
    codename: m.codename, status: 'PENDING',
  });

  addLog('FILE ' + plot.fileName + ': TAKEDOWN OPERATION launched — OP ' + m.codename + '. All resources committed.', 'log-warn');
  hideModal();
  render();
}

window.spawnOrgInfiltration = spawnOrgInfiltration;
window.spawnOrgTakedown = spawnOrgTakedown;

// =============================================================================
// FLAGGING — pattern recognized by analysts
// =============================================================================

function flagPlot(plot) {
  plot.flagged = true;
  plot.flaggedDay = G.day;

  // Reveal initial intel
  plot.knownIntel.type = true;
  plot.knownIntel.baseLocation = true;

  // Retroactively tag all existing plot missions
  for (var i = 0; i < plot.missions.length; i++) {
    var rec = plot.missions[i];
    var m = G.missions.find(function (x) { return x.id === rec.missionId; });
    if (m) {
      m.plotFileName = plot.fileName;
      m.plotOrgName = plot.orgName;
    }
  }

  // Add org to threats panel as an ORG entry
  G.hvts.push({
    id: 'H' + (++G.hvtIdCounter),
    type: 'ORG',
    alias: plot.orgName,
    role: plot.orgLabel,
    org: 'FILE: ' + plot.fileName,
    threat: plot.threat,
    location: plot.region,
    status: 'ACTIVE',
    knownFields: {
      type: plot.orgLabel,
      base: plot.baseCity + ', ' + plot.baseCountry,
    },
    gaps: [
      'Network leadership unidentified',
      'Ultimate objective unknown',
      'Full organizational structure unclear',
    ],
    linkedMissionIds: plot.missions.map(function (r) { return r.missionId; }),
    linkedPlotId: plot.id,
    addedDay: G.day,
    detainedAt: null, detainedDay: null,
    interrogationCount: 0,
    surveillanceEstablished: false,
    handedTo: null,
  });

  addLog(
    'PATTERN DETECTED: Analysts have identified a coordinated campaign. ' +
    'File opened: ' + plot.fileName + ' \u2014 ' + plot.orgName + '.',
    'log-warn'
  );

  // Ominous briefing pop-up
  var ominousIntros = [
    'Something has been moving in the dark. Separate incidents — different cities, different methods — but the pattern is unmistakable. This is coordinated.',
    'The Analysis Bureau has been running correlation matrices on recent operations. The results are not encouraging. What looked like isolated incidents now forms a single, deliberate campaign.',
    'It started as noise — a suspicious contact here, an intercepted signal there. But when the pieces were assembled, a shape emerged. Something organized. Something patient.',
    'Three operations. Three different threat vectors. One shared signature buried in the tradecraft. The analysts didn\'t want to believe it at first. Now they have no choice.',
    'The connections were invisible until last night. A junior analyst flagged an anomaly in the communications metadata. When the team pulled the thread, the whole picture unraveled — and it is worse than anyone expected.',
    'What was dismissed as coincidence can no longer be ignored. The operational fingerprints are too consistent. Someone is running a coordinated campaign against us, and they have been doing it for some time.',
  ];
  var ominousClosers = [
    'A file has been opened. From this point forward, every connected operation will be tracked under a single umbrella. This is no longer a series of incidents — it is a campaign.',
    'The Director has authorized a dedicated tracking file. All linked intelligence will be consolidated. Whatever this organization is planning, we now know it exists. That is the first step.',
    'The threat has been formally classified and a file opened. The full scope of their operation remains unknown. What we do know: they are organized, they are funded, and they are not finished.',
    'A classified file has been opened. Connected assets are being retasked. The organization\'s endgame is still unclear — but the clock is now ticking for both sides.',
    'This changes the threat picture. A new file has been opened and flagged for priority attention. We may already be behind.',
  ];
  var threatLabel = plot.threat >= 4 ? 'CRITICAL' : plot.threat >= 3 ? 'HIGH' : 'ELEVATED';
  queueBriefingPopup({
    title: 'PATTERN DETECTED — NEW THREAT',
    category: 'THREAT INTELLIGENCE',
    subtitle: 'FILE ' + plot.fileName + ' — ' + plot.orgLabel + ' — THREAT LEVEL ' + threatLabel,
    accent: 'rgba(231, 76, 60, 0.9)',
    body: pick(ominousIntros) + '<br><br>' + pick(ominousClosers) +
      '<div style="margin-top:12px;padding:8px 10px;border:1px solid rgba(231,76,60,0.3);border-left:3px solid rgba(231,76,60,0.6);border-radius:4px;background:rgba(231,76,60,0.05)">' +
        '<div style="font-size:11px;font-weight:700;letter-spacing:0.5px;color:rgba(231,76,60,0.95)">' + plot.orgName + '</div>' +
        '<div style="font-size:9px;color:var(--text-dim);margin-top:2px">FILE: ' + plot.fileName + ' · ' + plot.orgLabel + ' · ' + plot.baseCity + ', ' + plot.baseCountry + '</div>' +
        '<div style="font-size:10px;color:var(--text-hi);margin-top:4px;line-height:1.4">' + plot.orgDesc + '</div>' +
      '</div>',
    buttonLabel: 'UNDERSTOOD',
  });
}

// =============================================================================
// INTEL REVEALS — progressive discovery through mission resolution
// =============================================================================

function revealPlotIntel(plot, success) {
  var revealed = [];

  // Success reveals more
  if (success) {
    if (!plot.knownIntel.objective && Math.random() < 0.5) {
      plot.knownIntel.objective = true;
      revealed.push('OBJECTIVE: ' + plot.objective);
    }
    if (!plot.knownIntel.leader && Math.random() < 0.35) {
      plot.knownIntel.leader = true;
      revealed.push('LEADERSHIP: Network led by figure known as "' + plot.leaderAlias + '"');
    }
    if (!plot.knownIntel.strength && Math.random() < 0.4) {
      plot.knownIntel.strength = true;
      var ltKnown = plot.lieutenants.filter(function (l) { return l.known; }).length;
      plot.lieutenants.forEach(function (l) { if (!l.known && Math.random() < 0.5) { l.known = true; } });
      var ltNow = plot.lieutenants.filter(function (l) { return l.known; }).length;
      if (ltNow > ltKnown) {
        revealed.push('NETWORK: ' + (ltNow - ltKnown) + ' lieutenant(s) identified');
      }
      revealed.push('STRENGTH: Estimated ' + plot.lieutenants.length + ' lieutenants, ' +
        randInt(12, 80) + ' operatives');
    }
  }

  // Update threats panel org entry
  var hvt = G.hvts.find(function (h) { return h.linkedPlotId === plot.id; });
  if (hvt) {
    if (plot.knownIntel.objective) hvt.knownFields.objective = plot.objective;
    if (plot.knownIntel.leader) hvt.knownFields.leader = plot.leaderAlias;
    if (plot.knownIntel.strength) {
      var ltStr = plot.lieutenants.filter(function (l) { return l.known; })
        .map(function (l) { return l.role; }).join(', ');
      hvt.knownFields.network = ltStr || 'Partially mapped';
    }
    // Remove gaps as intel is revealed
    hvt.gaps = [];
    if (!plot.knownIntel.leader) hvt.gaps.push('Network leadership unidentified');
    if (!plot.knownIntel.objective) hvt.gaps.push('Ultimate objective unknown');
    if (!plot.knownIntel.strength) hvt.gaps.push('Full organizational structure unclear');

    // Keep linked mission list updated
    hvt.linkedMissionIds = plot.missions.map(function (r) { return r.missionId; });
  }

  return revealed;
}

// =============================================================================
// HOOKS
// =============================================================================

// ---- Initialize state ----
hook('game:start', function () {
  G.plots = [];
  G.plotIdCounter = 0;
  G.plotNextCheck = 14;
});

// ---- Backward compat for old saves ----
var _plotMigrated = false;
hook('render:after', function () {
  if (_plotMigrated) return;
  _plotMigrated = true;
  if (!G.plots) { G.plots = []; G.plotIdCounter = 0; G.plotNextCheck = G.day + 14; }
  // Ensure infiltrated field exists on old saves
  for (var i = 0; i < G.plots.length; i++) {
    if (G.plots[i].infiltrated === undefined) G.plots[i].infiltrated = false;
  }
});

// ---- Infiltration bonus: +10% on ops against infiltrated orgs ----
hook('calcProb:modify', function (data) {
  var m = data.mission;
  if (!m.plotId || !G.plots) return data.prob;
  var plot = G.plots.find(function (p) { return p.id === m.plotId; });
  if (plot && plot.infiltrated && plot.status === 'ACTIVE') {
    return data.prob + 10;
  }
  return data.prob;
});

// ---- Day tick: maybe start new plot, spawn due missions ----
hook('day:pre', function () {
  if (!G.plots) return;

  // Maybe start a new plot
  var activePlots = G.plots.filter(function (p) { return p.status === 'ACTIVE'; });
  if (G.day >= G.plotNextCheck && activePlots.length < 2) {
    if (Math.random() < 0.30) {
      createPlot();
      G.plotNextCheck = G.day + randInt(15, 30);
    } else {
      G.plotNextCheck = G.day + randInt(5, 10);
    }
  }

  // Spawn due plot missions
  for (var i = 0; i < G.plots.length; i++) {
    var plot = G.plots[i];
    if (plot.status !== 'ACTIVE') continue;
    if (plot.currentStep >= plot.totalSteps) continue;
    if (G.day >= plot.nextMissionDay) {
      spawnPlotMission(plot);
    }
  }
});

// ---- Track mission resolution ----
hook('operation:resolved', function (data) {
  var m = data.mission;
  if (!m.plotId) return;

  var plot = G.plots.find(function (p) { return p.id === m.plotId; });
  if (!plot) return;

  // Update mission record
  for (var i = 0; i < plot.missions.length; i++) {
    if (plot.missions[i].missionId === m.id) {
      plot.missions[i].status = data.success ? 'SUCCESS' : 'FAILURE';
      break;
    }
  }

  // Check for flagging
  var resolved = plot.missions.filter(function (r) { return r.status !== 'PENDING'; }).length;
  if (!plot.flagged && resolved >= plot.flagStepThreshold) {
    flagPlot(plot);
  }

  // Reveal intel on flagged plots
  if (plot.flagged) {
    var revealed = revealPlotIntel(plot, data.success);
    for (var j = 0; j < revealed.length; j++) {
      addLog('FILE ' + plot.fileName + ': ' + revealed[j], 'log-info');
    }
  }

  // ---- Infiltration resolution ----
  if (m.isOrgInfiltration) {
    var hvtInf = G.hvts.find(function (h) { return h.linkedPlotId === plot.id; });
    if (data.success) {
      plot.infiltrated = true;
      if (hvtInf) hvtInf.knownFields.infiltration = 'ACTIVE — inside asset producing intelligence';
      addLog(
        'FILE ' + plot.fileName + ': Infiltration established. ' +
        plot.orgName + ' is now compromised from within. +10% on all linked ops.',
        'log-success'
      );
      gainXP(5, 'FILE ' + plot.fileName + ' infiltrated');
    } else {
      addLog(
        'FILE ' + plot.fileName + ': Infiltration failed. ' +
        plot.orgName + ' remains impenetrable. A new attempt may be possible.',
        'log-fail'
      );
    }
    return;
  }

  // ---- Takedown resolution ----
  if (m.isOrgTakedown) {
    var hvtTd = G.hvts.find(function (h) { return h.linkedPlotId === plot.id; });
    if (data.success) {
      plot.status = 'DESTROYED';
      if (hvtTd) hvtTd.status = 'ELIMINATED';
      plot.knownIntel.objective = true;
      plot.knownIntel.leader = true;
      plot.knownIntel.strength = true;
      revealPlotIntel(plot, true);
      addLog(
        'FILE ' + plot.fileName + ' CLOSED: ' + plot.orgName +
        ' has been permanently dismantled. All leadership neutralized.',
        'log-success'
      );
      gainXP(12, 'FILE ' + plot.fileName + ' destroyed');
    } else {
      plot.status = 'DORMANT';
      plot.infiltrated = false; // inside asset burned
      if (hvtTd) {
        hvtTd.status = 'ACTIVE';
        delete hvtTd.knownFields.infiltration;
      }
      addLog(
        'FILE ' + plot.fileName + ': Takedown failed. ' +
        plot.orgName + ' survives. Inside asset compromised. Expect retaliation.',
        'log-fail'
      );
      // Briefing popup — infiltration compromised
      var takedownFailIntros = [
        'The takedown operation against ' + plot.orgName + ' has failed catastrophically. Worse — the organization has identified our inside asset. The infiltration is burned. Months of patient work, undone in a single botched assault.',
        'It went wrong from the start. The assault teams met prepared resistance — someone tipped them off, or our operational security was compromised. Either way, our infiltration of ' + plot.orgName + ' is over. The inside asset has gone silent.',
        'The operation collapsed under its own weight. ' + plot.orgName + '\'s leadership escaped the net, and in the aftermath, our inside asset was exposed. They are presumed compromised — possibly dead. The organization will go to ground and restructure.',
        'Total failure. Not only did ' + plot.orgName + ' survive the takedown attempt, they now know we were inside. Counter-intelligence sweeps have already begun within the organization. Our infiltration capability is destroyed.',
        'The assault teams breached, but the leadership wasn\'t where we expected. A decoy operation — they were ready for us. In the chaos that followed, our inside asset\'s cover was blown. ' + plot.orgName + ' will purge its ranks and emerge harder to penetrate than before.',
        'The takedown was repelled. ' + plot.orgName + '\'s security protocols held, and our operational footprint gave away the infiltration. The inside asset has been burned. Any future attempt to penetrate this organization will start from zero.',
      ];
      var takedownFailClosers = [
        'Re-infiltration will be necessary before any further action against this organization. They will be on high alert — this will not be easy.',
        'The organization will restructure, change communication protocols, and purge suspected informants. A new infiltration operation must be mounted from scratch.',
        'All intelligence gained through the infiltration remains valid, but our access is gone. Rebuilding will require a fresh approach and considerable patience.',
        'The path forward is clear but painful: rebuild the infiltration from nothing. The organization knows we are watching. They will not make it easy.',
      ];
      queueBriefingPopup({
        title: 'TAKEDOWN FAILED — INFILTRATION BURNED',
        category: 'OPERATIONAL FAILURE',
        subtitle: 'FILE ' + plot.fileName + ' — ' + plot.orgName,
        accent: 'rgba(231, 76, 60, 0.9)',
        body: pick(takedownFailIntros) + '<br><br>' + pick(takedownFailClosers) +
          '<div style="margin-top:12px;padding:8px 10px;border:1px solid rgba(231,76,60,0.3);border-left:3px solid rgba(231,76,60,0.6);border-radius:4px;background:rgba(231,76,60,0.05)">' +
            '<div style="font-size:11px;font-weight:700;letter-spacing:0.5px;color:rgba(231,76,60,0.95)">' + plot.orgName + '</div>' +
            '<div style="font-size:9px;color:var(--text-dim);margin-top:2px">FILE: ' + plot.fileName + ' · STATUS: DORMANT · INFILTRATION: COMPROMISED</div>' +
            '<div style="font-size:9px;margin-top:3px;letter-spacing:0.8px;color:rgba(243,156,18,0.9)">ACTION REQUIRED: RE-INFILTRATION</div>' +
          '</div>',
        buttonLabel: 'ACKNOWLEDGED',
      });
    }
    return;
  }
});

// ---- Render: FILE chips on mission cards, detail banners, org progress ----
hook('render:after', function () {
  if (!G.plots || G.plots.length === 0) return;

  // Build lookup of plot-linked mission IDs
  var plotMissions = {};
  for (var p = 0; p < G.plots.length; p++) {
    var plot = G.plots[p];
    if (!plot.flagged) continue;
    for (var i = 0; i < plot.missions.length; i++) {
      plotMissions[plot.missions[i].missionId] = plot;
    }
  }

  // Badge mission cards in inbox
  var cards = document.querySelectorAll('.mission-card');
  for (var c = 0; c < cards.length; c++) {
    var card = cards[c];
    var onclick = card.getAttribute('onclick') || '';
    var match = onclick.match(/selectMission\(['"]([^'"]+)['"]\)/);
    if (!match) continue;

    var mid = match[1];
    var linkedPlot = plotMissions[mid];
    if (!linkedPlot) continue;

    // Only inject once
    if (card.querySelector('.plot-chip')) continue;

    var chip = document.createElement('span');
    chip.className = 'plot-chip';
    chip.textContent = 'FILE: ' + linkedPlot.fileName;

    var meta = card.querySelector('.mc-meta');
    if (meta) meta.appendChild(chip);
    else card.appendChild(chip);
  }

  // Detail view banner for selected plot mission
  if (!G.selected) return;

  var selMission = null;
  for (var j = 0; j < G.missions.length; j++) {
    if (G.missions[j].id === G.selected) { selMission = G.missions[j]; break; }
  }
  if (!selMission || !selMission.plotId) return;

  var selPlot = G.plots.find(function (pl) { return pl.id === selMission.plotId; });
  if (!selPlot || !selPlot.flagged) return;

  var detailEl = document.getElementById('mission-detail');
  if (!detailEl) return;
  if (detailEl.querySelector('.plot-banner')) return;

  var completedSteps = selPlot.missions.filter(function (r) { return r.status !== 'PENDING'; }).length;

  var banner = document.createElement('div');
  banner.className = 'plot-banner';
  banner.innerHTML =
    '<span class="plot-banner-label">FILE: ' + selPlot.fileName + '</span>' +
    '<span class="plot-banner-org">' + selPlot.orgName + '</span>' +
    '<span class="plot-banner-progress">' + completedSteps + '/' + selPlot.totalSteps + ' operations</span>' +
    (selMission.isOrgInfiltration ? '<span class="plot-banner-climax" style="background:var(--purple)">INFILTRATION OP</span>' : '') +
    (selMission.isOrgTakedown ? '<span class="plot-banner-climax">TAKEDOWN OP</span>' : '') +
    (selPlot.infiltrated ? '<span class="plot-banner-climax" style="background:var(--green-dim)">INFILTRATED +10%</span>' : '');

  detailEl.insertBefore(banner, detailEl.firstChild);
});

})();
