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
  // sinister & atmospheric (no overlap with mission CODENAME_ADJ)
  'BLACK', 'RED', 'PALE', 'GREY', 'DARK', 'DEEP', 'HOLLOW', 'BROKEN',
  'BLIND', 'SLEEPING', 'SUNKEN', 'WHITE', 'HIDDEN', 'LOST', 'DEAD',
  'VEILED', 'NAMELESS', 'FACELESS', 'ENDLESS', 'ANCIENT',
  'ETERNAL', 'FORSAKEN', 'WRETCHED', 'SILENT', 'BLEEDING',
  'CROOKED', 'TWISTED', 'SEVERED', 'BURIED', 'DROWNED',
  'SCARRED', 'BLIGHTED', 'WITHERED', 'ASHEN', 'LEADEN',
  'SHATTERED', 'RUSTED', 'CORRODED', 'TARNISHED', 'ROTTING',
  'SHROUDED', 'UNSEEN', 'UNSPOKEN', 'UNKNOWN', 'UNNAMED',
  'PHANTOM', 'SPECTRAL', 'INFERNAL', 'ABYSSAL', 'NOCTURNAL',
  'FADING', 'DYING', 'THIRSTING', 'STARVING', 'FESTERING',
  'SMOLDERING', 'CRAWLING', 'CREEPING', 'WRITHING', 'GATHERING',
  'RISING', 'FALLING', 'WANING', 'SPREADING', 'REACHING',
  'PATIENT', 'RESTLESS', 'RUTHLESS', 'MERCILESS', 'RELENTLESS',
  'BITTER', 'SAVAGE', 'CRUEL', 'VICIOUS', 'CUNNING',
];

const ORG_NAME_NOUN = [
  // organizations & abstract concepts (no overlap with mission CODENAME_NOUN)
  'CRESCENT', 'COLUMN', 'HORIZON', 'DIRECTIVE', 'MERIDIAN',
  'SYNDICATE', 'COVENANT', 'NETWORK', 'CIRCLE', 'FRONT', 'VANGUARD',
  'AXIS', 'ECLIPSE', 'ORCHID', 'COMPASS', 'MIRROR',
  'PROTOCOL', 'CIRCUIT', 'VEIL', 'LATTICE',
  'HAND', 'EYE', 'VOICE', 'SHADOW', 'THRONE',
  'DOCTRINE', 'MANDATE', 'DECREE', 'EDICT', 'TRIBUNAL',
  'CONCLAVE', 'ASSEMBLY', 'COUNCIL', 'CONGRESS', 'PARLIAMENT',
  'ORDER', 'BROTHERHOOD', 'FELLOWSHIP', 'GUILD', 'CHAPTER',
  'LEGION', 'BRIGADE', 'CADRE', 'CELL', 'CABAL',
  'HARVEST', 'DOMINION', 'EMPIRE', 'SOVEREIGNTY', 'HEGEMONY',
  'PACT', 'ACCORD', 'COMPACT', 'ALLIANCE', 'CONSORTIUM',
  'FOUNDATION', 'INSTITUTE', 'BUREAU', 'MINISTRY', 'DIRECTORATE',
  'TIDE', 'CURRENT', 'UNDERTOW', 'RIPTIDE', 'DRIFT',
  'THRESHOLD', 'PASSAGE', 'CORRIDOR', 'GATEWAY', 'CONDUIT',
  'WEB', 'SPIRAL', 'LABYRINTH', 'MAZE', 'NEXUS',
  'DAWN', 'DUSK', 'TWILIGHT', 'MIDNIGHT', 'SOLSTICE',
  'EMBER', 'CINDER', 'SPARK', 'FURNACE', 'CRUCIBLE',
  'SERPENT', 'SPIDER', 'SCORPION', 'LOCUST', 'MOTH',
  'ROOT', 'BRANCH', 'THORN', 'VINE', 'CANOPY',
  'SHROUD', 'MASK', 'VEIL', 'CLOAK', 'MANTLE',
  'SIGNAL', 'CIPHER', 'CODEX', 'ARCHIVE', 'LEDGER',
  'WOUND', 'FRACTURE', 'SCAR', 'BLIGHT', 'PLAGUE',
];

const FILE_CODENAMES = [
  // mythological & legendary figures (unique to this pool)
  'CARDINAL', 'PHOENIX', 'CERBERUS', 'LEVIATHAN', 'CHIMERA',
  'PROMETHEUS', 'LAZARUS', 'PANDORA', 'OUROBOROS', 'MINOTAUR',
  'TYPHON', 'BASILISK', 'NIGHTFALL', 'ICARUS', 'MEDUSA',
  'HYDRA', 'KRAKEN', 'ARGUS', 'SIBYL', 'JANUS',
  'NEMESIS', 'THANATOS', 'ATLAS', 'CHARON', 'ORPHEUS',
  // greek & roman
  'HERMES', 'ARES', 'ATHENA', 'HADES', 'POSEIDON',
  'APOLLO', 'ARTEMIS', 'HEPHAESTUS', 'DEMETER', 'PERSEPHONE',
  'ACHILLES', 'ODYSSEUS', 'HECTOR', 'AJAX', 'PERSEUS',
  'THESEUS', 'DAEDALUS', 'MINOS', 'SISYPHUS', 'TANTALUS',
  'CYCLOPS', 'CENTAUR', 'SIREN', 'HARPY', 'SPHINX',
  // norse & celtic
  'ODIN', 'THOR', 'LOKI', 'FENRIR', 'SURTUR',
  'HEIMDALL', 'BALDUR', 'TYR', 'FREYA', 'VALKYRIE',
  'MIDGARD', 'RAGNAROK', 'BIFROST', 'YGGDRASIL', 'JORMUNGANDR',
  // mesopotamian & egyptian
  'ANUBIS', 'OSIRIS', 'HORUS', 'THOTH', 'SOBEK',
  'AMMIT', 'SEKHMET', 'BASTET', 'MARDUK', 'TIAMAT',
  'GILGAMESH', 'ENKIDU', 'ISHTAR', 'MOLOCH', 'BAAL',
  // legendary creatures & concepts
  'BEHEMOTH', 'GOLEM', 'DJINN', 'IFRIT', 'WENDIGO',
  'REVENANT', 'SPECTER', 'BANSHEE', 'WRAITH', 'LICH',
  'MANTICORE', 'WYVERN', 'DRAKE', 'GARGOYLE', 'COCKATRICE',
  'NAGA', 'RAKSHASA', 'YAKSHA', 'ASURA', 'KITSUNE',
  'TENGU', 'ONI', 'JOTUNN', 'DRAUGR', 'EINHERJAR',
  // additional mythic
  'STYX', 'LETHE', 'ACHERON', 'TARTARUS', 'ELYSIUM',
  'COLOSSUS', 'TITAN', 'ORACLE', 'PYTHIA', 'CASSANDRA',
  'DELPHI', 'AVALON', 'CAMELOT', 'VALHALLA', 'SHANGRI-LA',
  'NIRVANA', 'ARCADIA', 'HYPERION', 'CALYPSO', 'CIRCE',
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
  // "THE [title]" format — ominous role-based names
  'THE ARCHITECT', 'THE DIRECTOR', 'THE HANDLER', 'THE BROKER',
  'THE ENGINEER', 'THE SHEPHERD', 'THE CONDUCTOR', 'THE COURIER',
  'THE GHOST', 'THE BANKER', 'THE SURGEON', 'THE WATCHER',
  'THE PROFESSOR', 'THE PILGRIM', 'THE GARDENER', 'THE BISHOP',
  'THE ACCOUNTANT', 'THE CHEMIST', 'THE COLLECTOR', 'THE COMMISSIONER',
  'THE DENTIST', 'THE DOCTOR', 'THE ELECTRICIAN', 'THE FISHERMAN',
  'THE GENERAL', 'THE GOVERNOR', 'THE HISTORIAN', 'THE INNKEEPER',
  'THE JUDGE', 'THE KEEPER', 'THE LIBRARIAN', 'THE LOCKSMITH',
  'THE MECHANIC', 'THE NAVIGATOR', 'THE OPERATOR', 'THE PHARMACIST',
  'THE QUARTERMASTER', 'THE REGISTRAR', 'THE SCULPTOR', 'THE TAILOR',
  'THE UNDERTAKER', 'THE VINTNER', 'THE WEAVER', 'THE BUTCHER',
  'THE CARPENTER', 'THE CLOCKMAKER', 'THE FERRYMAN', 'THE GLAZIER',
  'THE JEWELER', 'THE MAGISTRATE', 'THE NOTARY', 'THE ORACLE',
  'THE PATRIARCH', 'THE RECTOR', 'THE SEXTON', 'THE TREASURER',
  'THE USHER', 'THE VICEROY', 'THE WARDEN', 'THE ZEALOT',
  'THE APOSTLE', 'THE CONFESSOR', 'THE DEACON', 'THE ELDER',
  'THE HERMIT', 'THE INQUISITOR', 'THE MONK', 'THE PREACHER',
  'THE REVEREND', 'THE SCRIBE', 'THE ABBOT', 'THE CARDINAL',
  'THE CHANCELLOR', 'THE CONSUL', 'THE PROVOST', 'THE REGENT',
  'THE STEWARD', 'THE ADJUTANT', 'THE AUDITOR', 'THE BAILIFF',
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
    const pool = FOREIGN_CITIES.filter(c => c.country !== (G.cfg ? G.cfg.name : ''));
    const loc = pick(pool.length > 0 ? pool : FOREIGN_CITIES);
    city = loc.city; country = loc.country;
  } else {
    region = Math.random() < 0.5 ? 'DOMESTIC' : 'FOREIGN';
    if (region === 'DOMESTIC') {
      city = pick(G.cfg.domesticCities); country = G.cfg.name;
    } else {
      const pool = FOREIGN_CITIES.filter(c => c.country !== (G.cfg ? G.cfg.name : ''));
      const loc = pick(pool.length > 0 ? pool : FOREIGN_CITIES);
      city = loc.city; country = loc.country;
    }
  }

  const leaderAlias = pickUniqueAlias(LEADER_ALIASES);
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
// GEO-EVENT INTEGRATION — create theater-specific plots
// =============================================================================

hook('geo:spawnOrg', function (data) {
  if (!G.plots || G.plots.length >= 6) return;

  var theater = data.theater;
  if (!theater) return;

  // Pick org type matching theater profile
  var matchingTypes = PLOT_ORG_TYPES.filter(function (ot) {
    return data.orgTypes.indexOf(ot.type) >= 0;
  });
  if (matchingTypes.length === 0) matchingTypes = PLOT_ORG_TYPES;
  var orgType = pick(matchingTypes);

  var totalSteps = randInt(4, 7);
  var flagThreshold = randInt(2, 3);

  // Use theater location
  var loc = pick(theater.cities);
  var city = loc.city;
  var country = loc.country;

  var leaderAlias = pickUniqueAlias(LEADER_ALIASES);
  var lieutenants = [];
  var ltCount = randInt(2, 4);
  for (var i = 0; i < ltCount; i++) {
    lieutenants.push({ role: pick(LIEUTENANT_ROLES), known: false, neutralized: false });
  }

  var plot = {
    id: 'P' + (++G.plotIdCounter),
    fileName: generateFileName(),
    orgName: generateOrgName(),
    orgType: orgType.type,
    orgLabel: orgType.label,
    orgDesc: pick(orgType.descs),
    objective: pick(orgType.objectives),
    missionPool: orgType.missionPool,
    threat: randInt(orgType.threatBase[0], orgType.threatBase[1]),
    region: 'FOREIGN',
    baseCity: city,
    baseCountry: country,
    leaderAlias: leaderAlias,
    lieutenants: lieutenants,
    totalSteps: totalSteps,
    currentStep: 0,
    missions: [],
    flagged: false,
    flaggedDay: null,
    flagStepThreshold: flagThreshold,
    status: 'ACTIVE',
    infiltrated: false,
    createdDay: G.day,
    nextMissionDay: G.day + randInt(1, 3),
    missionInterval: [4, 8], // slightly faster than normal — crisis-born
    knownIntel: { type: false, leader: false, objective: false, strength: false, baseLocation: false },
    geoTheaterId: data.theaterId,
  };

  G.plots.push(plot);
  addLog('GEO: New organization identified in ' + theater.name + ' — crisis-linked activity detected in ' + city + ', ' + country + '.', 'log-warn');
});

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

  // Override location for geo-linked orgs to stay in theater
  if (plot.geoTheaterId && typeof THEATERS !== 'undefined' && THEATERS[plot.geoTheaterId]) {
    var tCities = THEATERS[plot.geoTheaterId].cities;
    if (tCities && tCities.length > 0) {
      var tLoc = pick(tCities);
      var pOldCity = m.city;
      var pOldCountry = m.country;
      m.city = tLoc.city;
      m.country = tLoc.country;
      // Fix location tag if overriding to a foreign country
      var pIsDomestic = G.cfg && tLoc.country === G.cfg.name;
      m.location = pIsDomestic ? 'DOMESTIC' : 'FOREIGN';
      if (m.fillVars) { m.fillVars.city = tLoc.city; m.fillVars.country = tLoc.country; }
      // Fix baked text fields
      var pFields = ['initialReport', 'fullReport', 'opNarrative', 'agencyJustification'];
      for (var pf = 0; pf < pFields.length; pf++) {
        if (m[pFields[pf]] && typeof m[pFields[pf]] === 'string') {
          if (pOldCity && tLoc.city && pOldCity !== tLoc.city) m[pFields[pf]] = m[pFields[pf]].split(pOldCity).join(tLoc.city);
          if (pOldCountry && tLoc.country && pOldCountry !== tLoc.country) m[pFields[pf]] = m[pFields[pf]].split(pOldCountry).join(tLoc.country);
          if (m[pFields[pf]].indexOf('{') >= 0 && m.fillVars) m[pFields[pf]] = fillTemplate(m[pFields[pf]], m.fillVars);
        }
      }
      if (m.intelFields) {
        for (var pi = 0; pi < m.intelFields.length; pi++) {
          var piv = m.intelFields[pi];
          if (piv.value && typeof piv.value === 'string') {
            if (pOldCity && tLoc.city && pOldCity !== tLoc.city) piv.value = piv.value.split(pOldCity).join(tLoc.city);
            if (pOldCountry && tLoc.country && pOldCountry !== tLoc.country) piv.value = piv.value.split(pOldCountry).join(tLoc.country);
          }
        }
      }
    }
  }

  // Infiltrated orgs: inside asset reveals all intel on spawned missions
  if (plot.infiltrated && m.intelFields) {
    for (var ri = 0; ri < m.intelFields.length; ri++) m.intelFields[ri].revealed = true;
  }

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
  // Reveal all org intel on infiltrated plots (fix for old saves)
  for (var ipl = 0; ipl < G.plots.length; ipl++) {
    var iplot = G.plots[ipl];
    if (iplot.infiltrated && iplot.knownIntel) {
      iplot.knownIntel.objective = true;
      iplot.knownIntel.leader = true;
      iplot.knownIntel.strength = true;
      if (iplot.lieutenants) iplot.lieutenants.forEach(function (l) { l.known = true; });
      revealPlotIntel(iplot, true);
    }
  }
  // Reveal all intel on missions linked to infiltrated orgs (fix for old saves)
  if (G.missions && G.plots) {
    var infiltratedIds = {};
    for (var ip = 0; ip < G.plots.length; ip++) {
      if (G.plots[ip].infiltrated) infiltratedIds[G.plots[ip].id] = true;
    }
    for (var im = 0; im < G.missions.length; im++) {
      var mm = G.missions[im];
      if (mm.plotId && infiltratedIds[mm.plotId] && mm.intelFields && mm.status !== 'COMPLETED' && mm.status !== 'FAILED') {
        for (var fi = 0; fi < mm.intelFields.length; fi++) mm.intelFields[fi].revealed = true;
      }
    }
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

// ---- Infiltration intel: surface new HVT from inside asset ----

const INFILTRATION_HVT_ALIASES = [
  // animal codenames — predators & dangerous creatures
  'JACKAL', 'VIPER', 'SCORPION', 'HYENA', 'COBRA', 'LYNX',
  'MANTIS', 'HORNET', 'SCARAB', 'PANTHER', 'PYTHON', 'WOLVERINE',
  'BARRACUDA', 'MAMBA', 'TAIPAN', 'ADDER', 'ASP', 'KRAIT',
  'SIDEWINDER', 'COPPERHEAD', 'DIAMONDBACK', 'BUSHMASTER', 'FER-DE-LANCE', 'BOOMSLANG',
  'LEOPARD', 'CHEETAH', 'OCELOT', 'PUMA', 'CARACAL', 'SERVAL',
  'DINGO', 'COYOTE', 'FOX', 'BADGER', 'WEASEL', 'MARTEN',
  'OSPREY', 'VULTURE', 'BUZZARD', 'KITE', 'OWL', 'NIGHTHAWK',
  'WASP', 'BEETLE', 'CENTIPEDE', 'TARANTULA', 'WIDOW', 'RECLUSE',
  'PIRANHA', 'MORAY', 'LAMPREY', 'REMORA', 'GROUPER', 'TRIGGERFISH',
  'MONGOOSE', 'STOAT', 'FERRET', 'MINK', 'OTTER', 'FISHER',
  'IGUANA', 'MONITOR', 'GECKO', 'SKINK', 'BASILISK', 'KOMODO',
  'CICADA', 'CRICKET', 'LOCUST', 'FIREFLY', 'MOTH', 'DRAGONFLY',
  'PELICAN', 'CORMORANT', 'ALBATROSS', 'GANNET', 'TERN', 'PETREL',
  'MUSKOX', 'BUFFALO', 'BOAR', 'BISON', 'RHINO', 'HIPPO',
];

var INFILTRATION_HVT_ROLES = {
  terrorist_network:      ['cell commander', 'bomb-maker', 'recruitment coordinator', 'financier', 'logistics handler', 'weapons courier'],
  espionage_ring:         ['case officer', 'access agent', 'dead-drop coordinator', 'signals technician', 'mole handler', 'intelligence courier'],
  weapons_proliferation:  ['procurement agent', 'end-user certificate forger', 'transport broker', 'materials scientist', 'shipping coordinator', 'front company director'],
  state_proxy:            ['paramilitary commander', 'intelligence liaison', 'covert operations planner', 'arms supplier', 'propaganda coordinator', 'safe house operator'],
  criminal_syndicate:     ['money launderer', 'smuggling route manager', 'corrupt official contact', 'enforcement chief', 'front business operator', 'cartel liaison'],
};

var INFILTRATION_INTEL_BODIES = [
  '<p>Our inside asset within <strong>{orgName}</strong> has transmitted an emergency dead-drop report identifying a previously unknown operative. The individual — designated <strong>"{alias}"</strong> — is described as a <strong>{role}</strong> operating within the organization\'s command structure.</p><p>The asset reports that "{alias}" has been observed at {location} and is believed to be actively involved in ongoing operations. The asset assesses the individual as a high-value intelligence target.</p><p>FILE {fileName} — asset continues to produce. Handle with care; this intelligence must not be actioned in a way that compromises the source.</p>',
  '<p>Encrypted burst transmission received from our penetration agent inside <strong>{orgName}</strong>. The asset has identified a key figure — <strong>"{alias}"</strong>, a <strong>{role}</strong> — who has recently surfaced in the organization\'s operational planning.</p><p>According to the asset, "{alias}" operates from {location} and has direct access to the network\'s senior leadership. The asset recommends immediate tracking.</p><p>SOURCE: FILE {fileName} — inside asset. CLASSIFICATION: This intelligence derives from an extraordinarily sensitive source. Protect accordingly.</p>',
  '<p>Intelligence product from our embedded asset within <strong>{orgName}</strong>. During a routine operational meeting, the asset observed a previously unidentified individual referred to internally as <strong>"{alias}"</strong>.</p><p>Subsequent reporting confirms "{alias}" serves as a <strong>{role}</strong> within the organization and was last reported at {location}. The asset describes this individual as influential and operationally active.</p><p>FILE {fileName} — continuing to exploit infiltration access. This product is graded A2 (reliable source, probably true).</p>',
  '<p>Our agent inside <strong>{orgName}</strong> has surfaced a new name: <strong>"{alias}"</strong> — a <strong>{role}</strong> operating in {location}.</p><p>The asset reports this individual plays a key role in the organization\'s current operational tempo and represents a viable target for tracking or direct action. The asset was able to observe "{alias}" directly during a recent internal meeting and confirms the identification with high confidence.</p><p>FILE {fileName} — asset intelligence production remains active. Source protection paramount.</p>',
];

function spawnInfiltrationHvt(plot) {
  var alias = pickUniqueAlias(INFILTRATION_HVT_ALIASES);
  var roles = INFILTRATION_HVT_ROLES[plot.orgType] || INFILTRATION_HVT_ROLES.terrorist_network;
  var role = pick(roles);

  // Determine location from org's region
  var hvtLocation = plot.region;
  var city, country;
  if (plot.region === 'DOMESTIC') {
    city = pick(G.cfg.domesticCities);
    country = G.cfg.name;
  } else {
    var homeCountry = G.cfg ? G.cfg.name : null;
    var foreignPool = FOREIGN_CITIES.filter(function(c) { return c.country !== homeCountry; });
    var loc = pick(foreignPool.length > 0 ? foreignPool : FOREIGN_CITIES);
    city = loc.city;
    country = loc.country;
  }

  var hvtId = 'H' + (++G.hvtIdCounter);
  G.hvts.push({
    id: hvtId,
    type: 'HVT',
    alias: alias,
    role: role,
    org: plot.orgLabel + ' — FILE ' + plot.fileName,
    threat: Math.min(plot.threat + 1, 5),
    location: hvtLocation,
    status: 'ACTIVE',
    knownFields: { city: city, country: country },
    gaps: ['Exact movements unknown', 'Security detail uncharacterized', 'Role within organization partially understood'],
    linkedMissionIds: [],
    addedDay: G.day,
    detainedAt: null,
    detainedDay: null,
    interrogationCount: 0,
    surveillanceEstablished: false,
    handedTo: null,
    linkedPlotId: plot.id,
    factionId: plot.factionId || null,
    hvtIntelType: false,
    hardness: typeof classifyHvtHardness === 'function' ? classifyHvtHardness(role) : 'MODERATE',
  });

  var locationText = city + ', ' + country;
  var bodyTemplate = pick(INFILTRATION_INTEL_BODIES);
  var body = bodyTemplate
    .replace(/\{orgName\}/g, plot.orgName)
    .replace(/\{alias\}/g, alias)
    .replace(/\{role\}/g, role)
    .replace(/\{location\}/g, locationText)
    .replace(/\{fileName\}/g, plot.fileName);

  queueBriefingPopup({
    title: 'INFILTRATION INTELLIGENCE — FILE ' + plot.fileName,
    category: 'ASSET-DERIVED INTELLIGENCE',
    subtitle: plot.orgName + ' — INSIDE ASSET REPORT',
    accent: 'rgba(46, 204, 113, 0.9)',
    body: body,
    buttonLabel: 'ACKNOWLEDGED',
  });

  addLog('FILE ' + plot.fileName + ': Inside asset identifies new target — "' + alias + '" (' + role + '). Added to threat tracker.', 'log-info');
}

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

  // Infiltrated ORGs: weekly 5% chance to surface a new HVT
  if (G.day % 7 === 0) {
    for (var j = 0; j < G.plots.length; j++) {
      var ip = G.plots[j];
      if (ip.status !== 'ACTIVE' || !ip.infiltrated) continue;
      if (Math.random() >= 0.05) continue;
      spawnInfiltrationHvt(ip);
    }
  }

  // HVT surveillance expiry: TRACKED → ACTIVE when surveillance package expires
  for (var hi = 0; hi < (G.hvts || []).length; hi++) {
    var hvt = G.hvts[hi];
    if (hvt.status !== 'TRACKED' || !hvt.trackedExpiry) continue;
    if (G.day >= hvt.trackedExpiry) {
      hvt.status = 'ACTIVE';
      hvt.surveillanceEstablished = false;
      hvt.trackedDay = null;
      hvt.trackedExpiry = null;
      hvt.gaps = ['Location unconfirmed', 'Current pattern of life unknown', 'Security posture reassessment needed'];
      addLog('INTEL DECAY: Surveillance on "' + hvt.alias + '" has gone stale. Target reverted to ACTIVE — re-establish tracking.', 'log-warn');
      var DECAY_MESSAGES = [
        'Our surveillance package on "' + hvt.alias + '" has expired. The target has shifted patterns — last known routine is no longer reliable. The observation team reports the subject has adopted new counter-surveillance measures, changed vehicles, and altered daily routes. We need a fresh surveillance operation to re-establish tracking.',
        'Intelligence on "' + hvt.alias + '" is degrading beyond operational usefulness. The target appears to have relocated from the last known safe house. Electronic signatures have gone cold and physical surveillance assets lost contact ' + randInt(3, 8) + ' days ago. A new surveillance mission is required to reacquire.',
        'The tracking data on "' + hvt.alias + '" is now considered stale. Our observation posts have been rotated out per protocol and the replacement team reports the target\'s pattern of life has changed significantly. Previous intelligence should be treated as unreliable. Recommend re-tasking surveillance resources.',
        'Operational window on "' + hvt.alias + '" has closed. The subject\'s security detail has been refreshed and our technical collection devices at the last known location are no longer producing. The target is effectively dark. A new surveillance package must be deployed before we can resume operations.',
      ];
      queueBriefingPopup({
        title: 'SURVEILLANCE EXPIRY',
        category: 'INTELLIGENCE DECAY',
        subtitle: '"' + hvt.alias + '" — Tracking Lost',
        accent: 'rgba(243, 156, 18, 0.9)',
        body: '<p>' + pick(DECAY_MESSAGES) + '</p>',
        buttonLabel: 'ACKNOWLEDGED',
      });
    }
  }

  // HVT cooldown expiry: target resurfaces after going to ground
  for (var ci = 0; ci < (G.hvts || []).length; ci++) {
    var ch = G.hvts[ci];
    if (!ch.cooldownUntil) continue;
    if (G.day >= ch.cooldownUntil && (ch.status === 'ACTIVE' || ch.status === 'TRACKED')) {
      ch.cooldownUntil = null;
      addLog('TARGET RESURFACED: "' + ch.alias + '" has been detected again. Operations may resume.', 'log-info');

      var RESURFACE_MESSAGES = [
        '"' + ch.alias + '" has resurfaced. After weeks underground, the target has been detected resuming contact with known associates. Pattern-of-life indicators suggest the subject believes the threat has passed. Our operational window is reopening.',
        'Intelligence sources report "' + ch.alias + '" is active again. The target has re-established communication channels and returned to a semi-regular pattern of movement. The period of heightened security appears to have ended.',
        'The wait is over. "' + ch.alias + '" has emerged from hiding and resumed operations. Our analysts have confirmed the target is back at known locations and has relaxed counter-surveillance measures. Operations against this target may now resume.',
        'SIGINT has reacquired "' + ch.alias + '". After an extended period underground, the target has made the mistake of returning to old habits — using previously identified communication methods and frequenting known locations. The subject is once again within our operational reach.',
      ];

      queueBriefingPopup({
        title: 'TARGET RESURFACED',
        category: 'THREAT INTELLIGENCE',
        subtitle: '"' + ch.alias + '" — Operational Window Reopened',
        accent: 'rgba(46, 204, 113, 0.9)',
        body: '<p>' + pick(RESURFACE_MESSAGES) + '</p>',
        buttonLabel: 'ACKNOWLEDGED',
      });
    }
  }

  // ORG infiltration decay: yearly check, 20% chance to lose infiltration
  if (G.day % 365 === 0 && G.day > 1) {
    for (var oi = 0; oi < G.plots.length; oi++) {
      var org = G.plots[oi];
      if (org.status !== 'ACTIVE' || !org.infiltrated) continue;
      if (Math.random() >= 0.20) continue;
      org.infiltrated = false;
      // Update linked HVT
      var orgHvt = G.hvts ? G.hvts.find(function (h) { return h.linkedPlotId === org.id; }) : null;
      if (orgHvt && orgHvt.knownFields) {
        delete orgHvt.knownFields.infiltration;
      }
      var INFIL_LOST_REASONS = [
        'Our inside asset within ' + org.orgName + ' has gone silent. The last scheduled contact was missed ' + randInt(5, 14) + ' days ago, and fallback protocols have gone unanswered. Assessment: the organization conducted routine security tightening and our operative was either identified or forced out. The infiltration must be considered burned.',
        org.orgName + ' has undergone a major internal restructuring. Key personnel have been rotated, compartmentalization protocols have been tightened, and our compromised contact no longer has access to sensitive operations. The infiltration advantage is lost. A new penetration operation would need to start from scratch.',
        'Counter-intelligence within ' + org.orgName + ' has purged several suspected informants. While we have no confirmation our asset was specifically identified, all communications channels have been severed and safe house protocols compromised. We must assume the worst and mark the infiltration as lost.',
        'The individual we turned inside ' + org.orgName + ' has departed the organization. Debriefing indicates they were reassigned to a position with no operational value. Our intelligence access has evaporated. The organization\'s internal structure has shifted enough that a fresh infiltration will be required.',
        org.orgName + ' has implemented new encrypted communication systems and physical security measures that our surveillance infrastructure cannot penetrate. The technical apparatus placed during the original infiltration is no longer producing intelligence. Without a new insertion, we are operating blind.',
      ];
      addLog('INFILTRATION LOST: Inside asset in ' + org.orgName + ' compromised. Infiltration status revoked.', 'log-fail');
      queueBriefingPopup({
        title: 'INFILTRATION COMPROMISED',
        category: 'INTELLIGENCE LOSS',
        subtitle: org.orgName + ' — Asset Burned',
        accent: 'rgba(231, 76, 60, 0.9)',
        body: '<p>' + pick(INFIL_LOST_REASONS) + '</p><p>The +10% operational bonus for ' + org.orgName + ' is no longer in effect. Weekly intelligence from the inside asset has ceased. A new infiltration operation must be authorized to restore access.</p>',
        buttonLabel: 'ACKNOWLEDGED',
      });
    }
  }

  // Tracked HVTs with faction/ORG affiliation: 10% daily chance to yield Intel + spawn new HVT
  for (var ti = 0; ti < (G.hvts || []).length; ti++) {
    var th = G.hvts[ti];
    if (th.status !== 'TRACKED') continue;
    if (!th.factionId && !th.linkedPlotId) continue;
    if (Math.random() >= 0.10) continue;

    var intelYield = randInt(1, 3);
    G.intel = (G.intel || 0) + intelYield;
    G.intelLifetime = (G.intelLifetime || 0) + intelYield;

    // Spawn a new ACTIVE HVT from the same network
    var newAlias = pickUniqueAlias(INFILTRATION_HVT_ALIASES);
    var rolePool = ['courier', 'cell coordinator', 'logistics handler', 'communications officer', 'recruiter', 'financial facilitator', 'safe house operator', 'weapons specialist'];
    var linkedPlot = th.linkedPlotId ? G.plots.find(function (p) { return p.id === th.linkedPlotId; }) : null;
    var newRole;
    if (linkedPlot) {
      var orgRoles = INFILTRATION_HVT_ROLES[linkedPlot.orgType] || rolePool;
      newRole = pick(orgRoles);
    } else {
      newRole = pick(rolePool);
    }

    var newHvtId = 'H' + (++G.hvtIdCounter);
    var spawnLoc = typeof pickHvtSpawnLocation === 'function' ? pickHvtSpawnLocation(th) : { city: th.knownFields ? th.knownFields.city : null, country: th.knownFields ? th.knownFields.country : null };
    G.hvts.push({
      id: newHvtId, type: 'HVT', alias: newAlias, role: newRole,
      org: th.org || 'Unknown Network',
      threat: Math.min((th.threat || 2), 5),
      location: th.location || 'FOREIGN', status: 'ACTIVE',
      knownFields: { city: spawnLoc.city, country: spawnLoc.country },
      gaps: ['Identity requires verification', 'Current location unconfirmed', 'Role within network unconfirmed'],
      linkedMissionIds: [], addedDay: G.day,
      detainedAt: null, detainedDay: null, interrogationCount: 0,
      surveillanceEstablished: false, handedTo: null,
      factionId: th.factionId || null, hvtIntelType: th.hvtIntelType || false,
      linkedPlotId: th.linkedPlotId || null,
      hardness: typeof classifyHvtHardness === 'function' ? classifyHvtHardness(newRole) : 'MODERATE',
    });

    addLog('SIGINT INTERCEPT: Surveillance on "' + th.alias + '" picked up contact with "' + newAlias + '" (+' + intelYield + ' Intel). New target added.', 'log-info');

    var TRACKED_INTEL_MESSAGES = [
      'Our surveillance package on "' + th.alias + '" intercepted a coded communication with an unknown individual. Signals analysis and pattern-of-life tracking have identified this contact as <strong>"' + newAlias + '"</strong> — a <strong>' + newRole + '</strong> operating within the same network. The intercepted traffic suggests an active operational relationship.',
      'Passive monitoring of "' + th.alias + '" recorded a clandestine meeting at a previously unknown location. The other participant has been identified through facial recognition as <strong>"' + newAlias + '"</strong>, believed to serve as a <strong>' + newRole + '</strong>. This confirms the network is larger than initially assessed.',
      'Technical collection devices deployed against "' + th.alias + '" captured references to an associate: <strong>"' + newAlias + '"</strong>. Cross-referencing with existing intelligence databases suggests this individual functions as a <strong>' + newRole + '</strong> within the organization. Recommend immediate tracking.',
      'The observation team on "' + th.alias + '" reported a dead-drop exchange with an unidentified operative. Subsequent follow-up identified the contact as <strong>"' + newAlias + '"</strong>, assessed to be a <strong>' + newRole + '</strong>. The dead-drop contents suggest ongoing coordination on active operations.',
    ];

    queueBriefingPopup({
      title: 'SURVEILLANCE INTELLIGENCE',
      category: 'SIGNALS INTERCEPT',
      subtitle: '"' + th.alias + '" — Network Contact Identified',
      accent: 'rgba(52, 152, 219, 0.9)',
      body: '<p>' + pick(TRACKED_INTEL_MESSAGES) + '</p><p>+' + intelYield + ' Intel acquired. New target <strong>"' + newAlias + '"</strong> added to the threat tracker as ACTIVE.</p>',
      buttonLabel: 'ACKNOWLEDGED',
    });
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
      // Inside asset reveals all org intel
      plot.knownIntel.objective = true;
      plot.knownIntel.leader = true;
      plot.knownIntel.strength = true;
      plot.lieutenants.forEach(function (l) { l.known = true; });
      revealPlotIntel(plot, true);
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
