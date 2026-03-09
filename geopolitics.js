'use strict';
// =============================================================================
// SHADOW DIRECTIVE — Geopolitics System
// Theaters of operation with long-term geopolitical events that shape gameplay.
// =============================================================================

(function () {

// =============================================================================
// THEATER DEFINITIONS
// =============================================================================

var THEATERS = {
  MIDDLE_EAST: {
    id: 'MIDDLE_EAST',
    name: 'Middle East',
    shortName: 'MENA',
    icon: '☪',
    volatility: 0.85, // highest — perpetual instability
    baseRisk: 3,
    color: '#e67e22',
    countries: ['Iran', 'Iraq', 'Syria', 'Lebanon', 'Jordan', 'Yemen', 'Saudi Arabia', 'Qatar', 'UAE', 'Oman', 'Bahrain', 'Kuwait'],
    cities: [
      { city: 'Tehran', country: 'Iran' },
      { city: 'Mashhad', country: 'Iran' },
      { city: 'Damascus', country: 'Syria' },
      { city: 'Baghdad', country: 'Iraq' },
      { city: 'Mosul', country: 'Iraq' },
      { city: 'Beirut', country: 'Lebanon' },
      { city: 'Amman', country: 'Jordan' },
      { city: 'Sanaa', country: 'Yemen' },
      { city: 'Riyadh', country: 'Saudi Arabia' },
      { city: 'Doha', country: 'Qatar' },
    ],
    threatProfile: {
      orgTypes: ['terrorist_network', 'state_proxy', 'weapons_proliferation'],
      missionTypes: ['FOREIGN_HVT', 'RENDITION', 'ASSET_RESCUE', 'REGIME_OP'],
      terrorWeight: 0.6, domesticSpillover: 0.35,
    },
    eventPool: ['REGIONAL_WAR', 'PROXY_CONFLICT', 'INSURGENCY', 'INTELLIGENCE_WAR', 'ARMS_RACE', 'CIVIL_UNREST', 'REGIME_CHANGE'],
  },
  EASTERN_EUROPE: {
    id: 'EASTERN_EUROPE',
    name: 'Eastern Europe',
    shortName: 'E.EUR',
    icon: '⚔',
    volatility: 0.55,
    baseRisk: 2,
    color: '#3498db',
    countries: ['Russia', 'Ukraine', 'Belarus', 'Georgia', 'Moldova', 'Serbia', 'Romania', 'Bulgaria', 'Hungary', 'Poland', 'Czech Republic'],
    cities: [
      { city: 'Moscow', country: 'Russia' },
      { city: 'St. Petersburg', country: 'Russia' },
      { city: 'Kyiv', country: 'Ukraine' },
      { city: 'Minsk', country: 'Belarus' },
      { city: 'Tbilisi', country: 'Georgia' },
      { city: 'Belgrade', country: 'Serbia' },
      { city: 'Bucharest', country: 'Romania' },
      { city: 'Sofia', country: 'Bulgaria' },
      { city: 'Warsaw', country: 'Poland' },
    ],
    threatProfile: {
      orgTypes: ['espionage_ring', 'state_proxy', 'criminal_syndicate'],
      missionTypes: ['COUNTER_INTEL', 'MOLE_HUNT', 'FOREIGN_HVT', 'ASSET_RESCUE'],
      terrorWeight: 0.15, domesticSpillover: 0.25,
    },
    eventPool: ['REGIONAL_WAR', 'INTELLIGENCE_WAR', 'PROXY_CONFLICT', 'CYBER_CAMPAIGN', 'ARMS_RACE', 'REGIME_CHANGE'],
  },
  CENTRAL_ASIA: {
    id: 'CENTRAL_ASIA',
    name: 'Central & South Asia',
    shortName: 'C/S.ASIA',
    icon: '⛰',
    volatility: 0.70,
    baseRisk: 3,
    color: '#9b59b6',
    countries: ['Afghanistan', 'Pakistan', 'Kazakhstan', 'Uzbekistan', 'Bangladesh', 'Nepal', 'Tajikistan', 'Kyrgyzstan'],
    cities: [
      { city: 'Kabul', country: 'Afghanistan' },
      { city: 'Islamabad', country: 'Pakistan' },
      { city: 'Lahore', country: 'Pakistan' },
      { city: 'Quetta', country: 'Pakistan' },
      { city: 'Almaty', country: 'Kazakhstan' },
      { city: 'Tashkent', country: 'Uzbekistan' },
      { city: 'Dhaka', country: 'Bangladesh' },
    ],
    threatProfile: {
      orgTypes: ['terrorist_network', 'weapons_proliferation', 'state_proxy'],
      missionTypes: ['FOREIGN_HVT', 'RENDITION', 'LONG_HUNT_HVT', 'ASSET_RESCUE'],
      terrorWeight: 0.55, domesticSpillover: 0.30,
    },
    eventPool: ['REGIONAL_WAR', 'INSURGENCY', 'PROXY_CONFLICT', 'INTELLIGENCE_WAR', 'CIVIL_UNREST', 'REGIME_CHANGE'],
  },
  EAST_ASIA: {
    id: 'EAST_ASIA',
    name: 'East Asia & Pacific',
    shortName: 'E.ASIA',
    icon: '🐉',
    volatility: 0.40,
    baseRisk: 2,
    color: '#e74c3c',
    countries: ['China', 'North Korea', 'Myanmar', 'Cambodia', 'Laos', 'Thailand', 'Philippines', 'Indonesia', 'Malaysia', 'Vietnam'],
    cities: [
      { city: 'Beijing', country: 'China' },
      { city: 'Shanghai', country: 'China' },
      { city: 'Shenyang', country: 'China' },
      { city: 'Pyongyang', country: 'North Korea' },
      { city: 'Rangoon', country: 'Myanmar' },
      { city: 'Phnom Penh', country: 'Cambodia' },
      { city: 'Bangkok', country: 'Thailand' },
      { city: 'Manila', country: 'Philippines' },
      { city: 'Jakarta', country: 'Indonesia' },
    ],
    threatProfile: {
      orgTypes: ['espionage_ring', 'state_proxy', 'weapons_proliferation'],
      missionTypes: ['COUNTER_INTEL', 'MOLE_HUNT', 'FOREIGN_HVT', 'REGIME_OP'],
      terrorWeight: 0.10, domesticSpillover: 0.15,
    },
    eventPool: ['INTELLIGENCE_WAR', 'ARMS_RACE', 'PROXY_CONFLICT', 'CYBER_CAMPAIGN', 'NAVAL_STANDOFF'],
  },
  AFRICA: {
    id: 'AFRICA',
    name: 'Africa',
    shortName: 'AFRICA',
    icon: '◆',
    volatility: 0.60,
    baseRisk: 2,
    color: '#27ae60',
    countries: ['Libya', 'Sudan', 'Egypt', 'Algeria', 'Nigeria', 'Kenya', 'Somalia', 'Ethiopia', 'Senegal', 'Congo (DRC)', 'Mali', 'Niger', 'Chad'],
    cities: [
      { city: 'Tripoli', country: 'Libya' },
      { city: 'Khartoum', country: 'Sudan' },
      { city: 'Cairo', country: 'Egypt' },
      { city: 'Algiers', country: 'Algeria' },
      { city: 'Lagos', country: 'Nigeria' },
      { city: 'Kano', country: 'Nigeria' },
      { city: 'Nairobi', country: 'Kenya' },
      { city: 'Mogadishu', country: 'Somalia' },
      { city: 'Addis Ababa', country: 'Ethiopia' },
      { city: 'Bamako', country: 'Mali' },
      { city: 'Kinshasa', country: 'Congo (DRC)' },
    ],
    threatProfile: {
      orgTypes: ['terrorist_network', 'criminal_syndicate', 'state_proxy'],
      missionTypes: ['FOREIGN_HVT', 'RENDITION', 'ASSET_RESCUE', 'LONG_HUNT_HVT'],
      terrorWeight: 0.45, domesticSpillover: 0.20,
    },
    eventPool: ['INSURGENCY', 'CIVIL_UNREST', 'PROXY_CONFLICT', 'REGIONAL_WAR', 'REGIME_CHANGE', 'INTELLIGENCE_WAR'],
  },
  LATIN_AMERICA: {
    id: 'LATIN_AMERICA',
    name: 'Latin America',
    shortName: 'LATAM',
    icon: '⚡',
    volatility: 0.35,
    baseRisk: 1,
    color: '#f39c12',
    countries: ['Venezuela', 'Cuba', 'Colombia', 'Nicaragua', 'Honduras', 'Mexico', 'Brazil', 'Bolivia', 'Peru', 'Ecuador'],
    cities: [
      { city: 'Caracas', country: 'Venezuela' },
      { city: 'Havana', country: 'Cuba' },
      { city: 'Bogotá', country: 'Colombia' },
      { city: 'Medellín', country: 'Colombia' },
      { city: 'Managua', country: 'Nicaragua' },
      { city: 'Tegucigalpa', country: 'Honduras' },
      { city: 'Mexico City', country: 'Mexico' },
      { city: 'La Paz', country: 'Bolivia' },
    ],
    threatProfile: {
      orgTypes: ['criminal_syndicate', 'state_proxy', 'terrorist_network'],
      missionTypes: ['FOREIGN_HVT', 'RENDITION', 'DOMESTIC_TERROR', 'COUNTER_INTEL'],
      terrorWeight: 0.20, domesticSpillover: 0.15,
    },
    eventPool: ['CIVIL_UNREST', 'REGIME_CHANGE', 'PROXY_CONFLICT', 'INSURGENCY', 'INTELLIGENCE_WAR'],
  },
  WESTERN_EUROPE: {
    id: 'WESTERN_EUROPE',
    name: 'Western Europe',
    shortName: 'W.EUR',
    icon: '⊕',
    volatility: 0.15,
    baseRisk: 1,
    color: '#2980b9',
    countries: ['France', 'United Kingdom', 'Germany', 'Italy', 'Spain', 'Belgium', 'Netherlands', 'Austria', 'Switzerland', 'Sweden', 'Norway', 'Denmark'],
    cities: [
      { city: 'Berlin', country: 'Germany' },
      { city: 'Rome', country: 'Italy' },
      { city: 'Madrid', country: 'Spain' },
      { city: 'Brussels', country: 'Belgium' },
      { city: 'Vienna', country: 'Austria' },
      { city: 'Stockholm', country: 'Sweden' },
      { city: 'Amsterdam', country: 'Netherlands' },
    ],
    threatProfile: {
      orgTypes: ['espionage_ring', 'terrorist_network', 'criminal_syndicate'],
      missionTypes: ['COUNTER_INTEL', 'MOLE_HUNT', 'DOMESTIC_TERROR', 'SURVEILLANCE_TAKEDOWN'],
      terrorWeight: 0.25, domesticSpillover: 0.40,
    },
    eventPool: ['INTELLIGENCE_WAR', 'CYBER_CAMPAIGN', 'CIVIL_UNREST'],
  },
  NORTH_AMERICA: {
    id: 'NORTH_AMERICA',
    name: 'North America',
    shortName: 'N.AM',
    icon: '★',
    volatility: 0.08,
    baseRisk: 1,
    color: '#1abc9c',
    countries: ['United States', 'Canada'],
    cities: [
      { city: 'Washington D.C.', country: 'United States' },
      { city: 'New York', country: 'United States' },
      { city: 'Los Angeles', country: 'United States' },
      { city: 'Toronto', country: 'Canada' },
      { city: 'Ottawa', country: 'Canada' },
    ],
    threatProfile: {
      orgTypes: ['espionage_ring', 'terrorist_network'],
      missionTypes: ['COUNTER_INTEL', 'MOLE_HUNT', 'DOMESTIC_TERROR', 'DOMESTIC_HVT'],
      terrorWeight: 0.15, domesticSpillover: 0.60,
    },
    eventPool: ['INTELLIGENCE_WAR', 'CYBER_CAMPAIGN'],
  },
};

var THEATER_IDS = Object.keys(THEATERS);

// =============================================================================
// GEOPOLITICAL EVENT TEMPLATES
// =============================================================================

var GEO_EVENT_TYPES = {
  REGIONAL_WAR: {
    label: 'REGIONAL WAR',
    icon: '⚔',
    severity: 5,
    durationRange: [60, 180], // days
    riskBoost: 3,
    favorBoost: { MILITARY: 20, AGENCY: 10 },
    missionRateMultiplier: 2.5,
    orgSpawnChance: 0.6,
    terrorSpillover: 0.4,
    headlines: [
      'Open warfare has erupted in {theater}. Multiple state actors engaged. Intelligence demand critical.',
      'Armed conflict in {theater} has escalated beyond proxy status. Direct military engagement confirmed across multiple fronts.',
      'Full-scale hostilities in {theater}. Civilian displacement massive. Intelligence vacuum forming in conflict zones.',
      '{theater} ablaze: coordinated offensive has shattered a fragile ceasefire. Regional allies requesting urgent intelligence support.',
      'War in {theater}. The conflict has drawn in multiple state actors and non-state combatants. Fog of war is total.',
    ],
    ongoingFlavor: [
      'Fighting continues in {theater}. Casualty reports unreliable. Intelligence assets under extreme pressure.',
      '{theater} conflict enters new phase. Front lines shifting daily. HUMINT networks stretched thin.',
      'No ceasefire in sight for {theater}. Arms flows increasing. New armed groups emerging from the chaos.',
    ],
  },
  PROXY_CONFLICT: {
    label: 'PROXY CONFLICT',
    icon: '⚑',
    severity: 4,
    durationRange: [45, 150],
    riskBoost: 2,
    favorBoost: { MILITARY: 15, AGENCY: 10 },
    missionRateMultiplier: 2.0,
    orgSpawnChance: 0.45,
    terrorSpillover: 0.25,
    headlines: [
      'Proxy forces backed by rival powers are clashing across {theater}. Deniable operations on all sides.',
      'A shadow war in {theater} has gone hot. State-backed militias engaging in open combat under paper-thin cover.',
      'Intelligence confirms multiple foreign powers funding opposing factions in {theater}. Proxy warfare intensifying.',
      '{theater}: rival intelligence services are running parallel destabilization campaigns. Proxy forces multiplying.',
    ],
    ongoingFlavor: [
      'Proxy fighting in {theater} continues. Attribution increasingly difficult. Foreign arms shipments detected.',
      '{theater} proxy conflict grinding on. Local population caught between competing foreign agendas.',
    ],
  },
  INSURGENCY: {
    label: 'INSURGENCY',
    icon: '🔥',
    severity: 3,
    durationRange: [40, 120],
    riskBoost: 2,
    favorBoost: { MILITARY: 10, AGENCY: 5 },
    missionRateMultiplier: 1.8,
    orgSpawnChance: 0.5,
    terrorSpillover: 0.35,
    headlines: [
      'An organized insurgency has taken root in {theater}. Government forces losing ground in rural areas.',
      'Insurgent forces in {theater} have seized territory. Central authority eroding. Intelligence gaps widening.',
      '{theater}: a well-armed insurgency is exploiting governance vacuums. Recruitment accelerating.',
      'Insurgent campaign in {theater} has entered a new phase. Urban warfare tactics emerging. IED attacks daily.',
    ],
    ongoingFlavor: [
      'Insurgency in {theater} shows no signs of abating. Territory exchanges hands weekly.',
      '{theater} insurgents have established parallel governance structures. Counter-insurgency efforts stalled.',
    ],
  },
  INTELLIGENCE_WAR: {
    label: 'INTELLIGENCE WAR',
    icon: '👁',
    severity: 3,
    durationRange: [30, 120],
    riskBoost: 2,
    favorBoost: { AGENCY: 15, BUREAU: 10 },
    missionRateMultiplier: 1.6,
    orgSpawnChance: 0.35,
    terrorSpillover: 0.10,
    headlines: [
      'A coordinated intelligence offensive is underway across {theater}. Hostile services running aggressive operations.',
      '{theater}: expulsions of diplomatic personnel on both sides. Intelligence war has gone overt.',
      'Multiple allied assets in {theater} have been compromised in rapid succession. Coordinated hostile intelligence campaign suspected.',
      'Signal intercepts confirm a hostile service has launched a systematic intelligence campaign across {theater}.',
    ],
    ongoingFlavor: [
      'Intelligence war in {theater} intensifying. Asset burn rate unsustainable. Counter-intelligence overwhelmed.',
      '{theater}: hostile service operations becoming more aggressive. Allied networks under sustained pressure.',
    ],
  },
  CYBER_CAMPAIGN: {
    label: 'CYBER CAMPAIGN',
    icon: '⟁',
    severity: 2,
    durationRange: [20, 90],
    riskBoost: 1,
    favorBoost: { BUREAU: 10, AGENCY: 5 },
    missionRateMultiplier: 1.3,
    orgSpawnChance: 0.2,
    terrorSpillover: 0.05,
    headlines: [
      'A sustained state-sponsored cyber campaign has been traced to actors in {theater}. Critical infrastructure targeted.',
      '{theater}-linked cyber operations have penetrated allied government networks. Scope of compromise still being assessed.',
      'Advanced persistent threat groups operating from {theater} have launched coordinated cyber attacks against defense systems.',
    ],
    ongoingFlavor: [
      'Cyber campaign from {theater} actors continues. New attack vectors being deployed weekly.',
      '{theater} cyber operations evolving. Zero-day exploits detected. Attribution increasingly complex.',
    ],
  },
  ARMS_RACE: {
    label: 'ARMS RACE',
    icon: '☢',
    severity: 3,
    durationRange: [60, 200],
    riskBoost: 2,
    favorBoost: { MILITARY: 15, AGENCY: 10 },
    missionRateMultiplier: 1.5,
    orgSpawnChance: 0.3,
    terrorSpillover: 0.05,
    headlines: [
      'An accelerating arms buildup in {theater} has triggered alarm across allied capitals. Weapons programs advancing rapidly.',
      '{theater}: satellite imagery confirms massive expansion of military facilities. Arms race dynamics taking hold.',
      'Intelligence assessment: {theater} weapons development programs have reached a critical threshold. Strategic balance shifting.',
    ],
    ongoingFlavor: [
      'Arms race in {theater} continuing. Weapons testing detected. Diplomatic channels strained.',
      '{theater} military buildup shows no signs of slowing. Proliferation concerns mounting.',
    ],
  },
  CIVIL_UNREST: {
    label: 'CIVIL UNREST',
    icon: '⚠',
    severity: 2,
    durationRange: [15, 60],
    riskBoost: 1,
    favorBoost: { AGENCY: 5 },
    missionRateMultiplier: 1.3,
    orgSpawnChance: 0.25,
    terrorSpillover: 0.15,
    headlines: [
      'Mass protests and civil unrest have destabilized governance across {theater}. Security forces stretched thin.',
      '{theater}: widespread civil disorder creating intelligence vacuums. Extremist groups exploiting the chaos.',
      'Civil unrest in {theater} has overwhelmed local security. Governance collapse in some regions. Opportunity for hostile actors.',
    ],
    ongoingFlavor: [
      'Unrest in {theater} continues. Protest movements fracturing into radical factions.',
      '{theater} instability persists. Government legitimacy eroding. Power vacuums forming.',
    ],
  },
  REGIME_CHANGE: {
    label: 'REGIME CHANGE',
    icon: '⚖',
    severity: 4,
    durationRange: [20, 80],
    riskBoost: 2,
    favorBoost: { AGENCY: 15, MILITARY: 10 },
    missionRateMultiplier: 2.0,
    orgSpawnChance: 0.45,
    terrorSpillover: 0.20,
    headlines: [
      'A government in {theater} has fallen. Power vacuum forming. Intelligence assets scrambling to establish contact with new actors.',
      '{theater}: regime collapse. Military and civilian factions competing for control. Allied intelligence networks in disarray.',
      'Coup confirmed in {theater}. New regime consolidating power. Massive intelligence reassessment required.',
      'Government overthrown in {theater}. Chaos in the capital. Weapons stockpiles unsecured. Non-state actors moving to fill the void.',
    ],
    ongoingFlavor: [
      'Post-regime-change instability in {theater} continues. New government struggling to establish authority.',
      '{theater}: power transition ongoing. Multiple factions jockeying for position. Intelligence picture fragmented.',
    ],
  },
  NAVAL_STANDOFF: {
    label: 'NAVAL STANDOFF',
    icon: '⚓',
    severity: 3,
    durationRange: [15, 60],
    riskBoost: 2,
    favorBoost: { MILITARY: 15, AGENCY: 5 },
    missionRateMultiplier: 1.4,
    orgSpawnChance: 0.15,
    terrorSpillover: 0.05,
    headlines: [
      'Naval forces are facing off in disputed waters near {theater}. Rules of engagement unclear. Escalation risk high.',
      '{theater}: carrier groups from rival powers converging. Maritime trade routes threatened. Intelligence demand surging.',
      'A naval confrontation near {theater} has brought regional powers to the brink. Submarine activity detected.',
    ],
    ongoingFlavor: [
      'Naval standoff near {theater} continues. Patrol patterns aggressive. Incident risk elevated.',
      '{theater} maritime tension unresolved. Freedom of navigation operations ongoing. Escalation possible.',
    ],
  },
};

// =============================================================================
// BRIEFING POPUP TEXT FOR GEOPOLITICAL EVENTS
// =============================================================================

var GEO_POPUP_INTROS = [
  'The intelligence picture has changed. A development of strategic significance is unfolding — one that will reshape the operational landscape for the foreseeable future.',
  'FLASH traffic from multiple stations. A geopolitical shift is underway that demands immediate attention. The threat environment is evolving.',
  'The Director has convened an emergency assessment. A major geopolitical event has been confirmed — one with direct implications for ongoing operations.',
  'Satellite imagery, signals intelligence, and human source reporting have converged on a single conclusion: the strategic landscape has fundamentally shifted.',
  'Priority intelligence assessment. A developing situation has crossed the threshold from "watch" to "act." Resources will need to be reallocated.',
  'The morning brief carried a single item — classified URGENT. A geopolitical development that changes the calculus in an entire theater of operations.',
];

var GEO_POPUP_RESOLVED = [
  'The situation in {theater} has stabilized — or at least, returned to something resembling normalcy. The crisis has passed, though its aftershocks will be felt for some time.',
  'Intelligence assessments indicate the {event} in {theater} has concluded. Threat levels are being downgraded, though residual risks remain.',
  'The crisis in {theater} appears to be over. The geopolitical landscape has been redrawn, but the immediate threat has receded.',
  'After {duration} days of heightened alert, the {event} in {theater} has wound down. Operational tempo can be reduced — cautiously.',
  '{theater} crisis resolved. Standing down from elevated posture. Post-crisis assessment to follow.',
];

// =============================================================================
// HELPER: find theater for a country
// =============================================================================

function getTheaterForCountry(countryName) {
  for (var i = 0; i < THEATER_IDS.length; i++) {
    var t = THEATERS[THEATER_IDS[i]];
    if (t.countries.indexOf(countryName) >= 0) return t;
  }
  return null;
}

// Make available globally for other systems
window.getTheaterForCountry = getTheaterForCountry;
window.THEATERS = THEATERS;
window.THEATER_IDS = THEATER_IDS;

// =============================================================================
// STATE INITIALIZATION
// =============================================================================

hook('game:start', function () {
  G.geo = {
    theaters: {},       // { theaterId: { risk, activeEvents, history } }
    activeEvents: [],   // global active events list
    eventIdCounter: 0,
    nextCheckDay: 5,    // first check after day 5
    checkInterval: 3,   // check every 3 days
  };

  // Initialize per-theater state
  for (var i = 0; i < THEATER_IDS.length; i++) {
    var tid = THEATER_IDS[i];
    var t = THEATERS[tid];
    G.geo.theaters[tid] = {
      risk: t.baseRisk,
      eventCount: 0,
    };
  }
});

// Backward compat for old saves
var _geoMigrated = false;
hook('render:after', function () {
  if (_geoMigrated) return;
  _geoMigrated = true;
  if (!G.geo) {
    G.geo = {
      theaters: {},
      activeEvents: [],
      eventIdCounter: 0,
      nextCheckDay: G.day + 3,
      checkInterval: 3,
    };
    for (var i = 0; i < THEATER_IDS.length; i++) {
      var tid = THEATER_IDS[i];
      G.geo.theaters[tid] = { risk: THEATERS[tid].baseRisk, eventCount: 0 };
    }
  }
});

// =============================================================================
// EVENT LIFECYCLE
// =============================================================================

function generateGeoEvent(theaterId) {
  var theater = THEATERS[theaterId];
  if (!theater) return null;

  // Pick event type from theater pool
  var pool = theater.eventPool;
  var typeId = pick(pool);
  var tmpl = GEO_EVENT_TYPES[typeId];
  if (!tmpl) return null;

  // Don't stack same event type in same theater
  for (var i = 0; i < G.geo.activeEvents.length; i++) {
    var ae = G.geo.activeEvents[i];
    if (ae.theaterId === theaterId && ae.typeId === typeId) return null;
  }

  var duration = randInt(tmpl.durationRange[0], tmpl.durationRange[1]);
  var headline = pick(tmpl.headlines).replace(/\{theater\}/g, theater.name);

  var evt = {
    id: 'GE' + (++G.geo.eventIdCounter),
    typeId: typeId,
    theaterId: theaterId,
    label: tmpl.label,
    icon: tmpl.icon,
    severity: tmpl.severity,
    headline: headline,
    startDay: G.day,
    duration: duration,
    endDay: G.day + duration,
    riskBoost: tmpl.riskBoost,
    favorBoost: Object.assign({}, tmpl.favorBoost),
    missionRateMultiplier: tmpl.missionRateMultiplier,
    orgSpawned: false,
    terrorSpawned: false,
    resolved: false,
  };

  G.geo.activeEvents.push(evt);
  G.geo.theaters[theaterId].eventCount++;

  // Update theater risk
  recalcTheaterRisk(theaterId);

  // Apply favor boosts
  applyFavorBoosts(evt);

  // Show briefing popup
  var detailCard =
    '<div style="margin-top:12px;padding:8px 10px;border:1px solid ' + theater.color + '33;border-left:3px solid ' + theater.color + '99;border-radius:4px;background:' + theater.color + '0d">' +
      '<div style="font-size:11px;font-weight:700;letter-spacing:0.5px;color:' + theater.color + '">' + tmpl.icon + ' ' + tmpl.label + '</div>' +
      '<div style="font-size:9px;color:var(--text-dim);margin-top:2px">THEATER: ' + theater.name + ' · SEVERITY: ' + '■'.repeat(tmpl.severity) + '□'.repeat(5 - tmpl.severity) + '</div>' +
      '<div style="font-size:9px;margin-top:3px;color:var(--text-dim)">EST. DURATION: ' + duration + ' DAYS</div>' +
      '<div style="font-size:10px;color:var(--text-hi);margin-top:4px;line-height:1.4">' + headline + '</div>' +
    '</div>';

  queueBriefingPopup({
    title: 'GEOPOLITICAL ALERT — ' + theater.shortName,
    category: 'STRATEGIC INTELLIGENCE',
    subtitle: tmpl.label + ' — ' + theater.name,
    accent: theater.color,
    body: pick(GEO_POPUP_INTROS) + detailCard,
    buttonLabel: 'ACKNOWLEDGED',
  });

  addLog('GEO: ' + tmpl.label + ' in ' + theater.name + '. Threat level elevated. Duration: ~' + duration + ' days.', 'log-warn');

  return evt;
}

function resolveGeoEvent(evt) {
  evt.resolved = true;
  var theater = THEATERS[evt.theaterId];
  var tmpl = GEO_EVENT_TYPES[evt.typeId];
  var duration = G.day - evt.startDay;

  recalcTheaterRisk(evt.theaterId);

  // Remove favor boosts
  removeFavorBoosts(evt);

  var resolvedText = pick(GEO_POPUP_RESOLVED)
    .replace(/\{theater\}/g, theater.name)
    .replace(/\{event\}/g, tmpl.label)
    .replace(/\{duration\}/g, String(duration));

  queueBriefingPopup({
    title: 'SITUATION RESOLVED — ' + theater.shortName,
    category: 'STRATEGIC INTELLIGENCE',
    subtitle: tmpl.label + ' — ' + theater.name + ' (CONCLUDED)',
    accent: 'rgba(46, 204, 113, 0.9)',
    body: resolvedText,
    buttonLabel: 'NOTED',
  });

  addLog('GEO: ' + tmpl.label + ' in ' + theater.name + ' resolved after ' + duration + ' days. Threat level normalizing.', 'log-info');
}

function recalcTheaterRisk(theaterId) {
  var theater = THEATERS[theaterId];
  var base = theater.baseRisk;
  var boost = 0;
  for (var i = 0; i < G.geo.activeEvents.length; i++) {
    var e = G.geo.activeEvents[i];
    if (e.theaterId === theaterId && !e.resolved) {
      boost += e.riskBoost;
    }
  }
  G.geo.theaters[theaterId].risk = Math.min(5, base + boost);
}

function applyFavorBoosts(evt) {
  if (!G.relations || !evt.favorBoost) return;
  // Store boost IDs on the event for removal later
  evt._appliedBoosts = [];
  var boosts = evt.favorBoost;
  for (var agencyKey in boosts) {
    if (!G.relations[agencyKey]) continue;
    var amount = boosts[agencyKey];
    G.events.activeEffects.push({
      id: 'GEO_FAVOR_' + evt.id + '_' + agencyKey,
      label: 'Geo Crisis — ' + THEATERS[evt.theaterId].name + ' (' + agencyKey + ')',
      type: 'geo_favor_boost',
      agency: agencyKey,
      amount: amount,
      geoEventId: evt.id,
      daysLeft: evt.duration + 1, // slightly longer than event to avoid race
    });
    evt._appliedBoosts.push('GEO_FAVOR_' + evt.id + '_' + agencyKey);
  }
}

function removeFavorBoosts(evt) {
  if (!G.events || !G.events.activeEffects) return;
  G.events.activeEffects = G.events.activeEffects.filter(function (eff) {
    return eff.geoEventId !== evt.id;
  });
}

// =============================================================================
// EVENT SPAWNING — runs on day:post
// =============================================================================

function getActiveEventMult(theaterId) {
  var mult = 1;
  for (var i = 0; i < G.geo.activeEvents.length; i++) {
    var e = G.geo.activeEvents[i];
    if (e.theaterId === theaterId && !e.resolved) {
      mult = Math.max(mult, e.missionRateMultiplier);
    }
  }
  return mult;
}

function getMaxConcurrentEvents() {
  // Scale with game progress
  if (G.day < 30) return 1;
  if (G.day < 60) return 2;
  if (G.day < 120) return 3;
  return 4;
}

hook('day:post', function () {
  if (!G.geo) return;
  if (G.day < G.geo.nextCheckDay) return;

  G.geo.nextCheckDay = G.day + G.geo.checkInterval;

  // Count active (non-resolved) events
  var activeCount = 0;
  for (var i = 0; i < G.geo.activeEvents.length; i++) {
    if (!G.geo.activeEvents[i].resolved) activeCount++;
  }

  // Resolve expired events
  for (var j = G.geo.activeEvents.length - 1; j >= 0; j--) {
    var evt = G.geo.activeEvents[j];
    if (!evt.resolved && G.day >= evt.endDay) {
      resolveGeoEvent(evt);
      activeCount--;
    }
  }

  // Try to spawn new events
  if (activeCount >= getMaxConcurrentEvents()) return;

  for (var k = 0; k < THEATER_IDS.length; k++) {
    var tid = THEATER_IDS[k];
    var theater = THEATERS[tid];

    // Volatility determines chance of a new event
    var chance = theater.volatility * 0.12; // per check cycle (~every 3 days)

    // Increase chance slightly after day 20 to ensure events happen
    if (G.day > 20) chance *= 1.3;
    if (G.day > 60) chance *= 1.2;

    if (Math.random() < chance) {
      // Don't exceed max concurrent
      if (activeCount >= getMaxConcurrentEvents()) break;
      var newEvt = generateGeoEvent(tid);
      if (newEvt) {
        activeCount++;
        // Only spawn one event per check cycle
        break;
      }
    }
  }
});

// =============================================================================
// MISSION & ORG SPAWNING FROM GEO EVENTS
// =============================================================================

hook('day:post', function () {
  if (!G.geo) return;

  for (var i = 0; i < G.geo.activeEvents.length; i++) {
    var evt = G.geo.activeEvents[i];
    if (evt.resolved) continue;

    var theater = THEATERS[evt.theaterId];
    var tmpl = GEO_EVENT_TYPES[evt.typeId];
    if (!tmpl) continue;

    // Org spawning — once per event, after a few days
    if (!evt.orgSpawned && G.day >= evt.startDay + randInt(3, 8)) {
      if (Math.random() < tmpl.orgSpawnChance && G.plots && G.plots.length < 6) {
        spawnGeoOrg(evt, theater, tmpl);
        evt.orgSpawned = true;
      }
    }

    // Terror cell spawning — domestic spillover
    if (!evt.terrorSpawned && G.day >= evt.startDay + randInt(5, 15)) {
      if (Math.random() < tmpl.terrorSpillover * theater.threatProfile.terrorWeight) {
        // Spawn a domestic terror mission linked to the crisis
        spawnGeoTerrorCell(evt, theater);
        evt.terrorSpawned = true;
      }
    }
  }
});

function spawnGeoOrg(evt, theater, tmpl) {
  // Use plots.js createPlot mechanism if available, otherwise spawn missions
  if (typeof window.createPlotInTheater === 'function') {
    window.createPlotInTheater(evt.theaterId);
    return;
  }

  // Spawn a foreign mission from the theater (exclude domestic-only types)
  var typeId = pick(theater.threatProfile.missionTypes.filter(function (t) {
    return MISSION_TYPES[t] && MISSION_TYPES[t].location !== 'DOMESTIC';
  }));
  if (!typeId) return;

  var prevLen = G.missions.length;
  spawnMission(typeId);
  var m = G.missions.length > prevLen ? G.missions[0] : null;
  if (!m) return;

  // Override location to theater — fix baked text fields
  var loc = pick(theater.cities);
  var oldCity = m.city;
  var oldCountry = m.country;
  m.city = loc.city;
  m.country = loc.country;
  // Fix location tag if mission was domestic but theater is foreign
  var isDomestic = G.cfg && loc.country === G.cfg.name;
  m.location = isDomestic ? 'DOMESTIC' : 'FOREIGN';
  if (m.fillVars) {
    m.fillVars.city = loc.city;
    m.fillVars.country = loc.country;
  }
  // Replace old location in all pre-rendered text fields
  var geoTextFields = ['initialReport', 'fullReport', 'opNarrative', 'agencyJustification'];
  for (var tf = 0; tf < geoTextFields.length; tf++) {
    var fn = geoTextFields[tf];
    if (m[fn] && typeof m[fn] === 'string') {
      if (oldCity && loc.city && oldCity !== loc.city) m[fn] = m[fn].split(oldCity).join(loc.city);
      if (oldCountry && loc.country && oldCountry !== loc.country) m[fn] = m[fn].split(oldCountry).join(loc.country);
      if (m[fn].indexOf('{') >= 0 && m.fillVars) m[fn] = fillTemplate(m[fn], m.fillVars);
    }
  }
  // Fix intel field values
  if (m.intelFields) {
    for (var fi = 0; fi < m.intelFields.length; fi++) {
      var fv = m.intelFields[fi];
      if (fv.value && typeof fv.value === 'string') {
        if (oldCity && loc.city && oldCity !== loc.city) fv.value = fv.value.split(oldCity).join(loc.city);
        if (oldCountry && loc.country && oldCountry !== loc.country) fv.value = fv.value.split(oldCountry).join(loc.country);
      }
    }
  }
  // Fix success/failure message arrays
  var msgArrays = ['successMsgs', 'failureMsgs'];
  for (var ma = 0; ma < msgArrays.length; ma++) {
    if (Array.isArray(m[msgArrays[ma]])) {
      m[msgArrays[ma]] = m[msgArrays[ma]].map(function (s) {
        if (oldCity && loc.city && oldCity !== loc.city) s = s.split(oldCity).join(loc.city);
        if (oldCountry && loc.country && oldCountry !== loc.country) s = s.split(oldCountry).join(loc.country);
        return s;
      });
    }
  }
  m.threat = Math.min(5, m.threat + tmpl.severity - 2);
  m.geoEventId = evt.id;

  addLog('GEO: Crisis in ' + theater.name + ' has generated new intelligence — OP ' + m.codename + '.', 'log-warn');
}

function spawnGeoTerrorCell(evt, theater) {
  // Spawn a domestic terror mission representing spillover
  if (!MISSION_TYPES['DOMESTIC_TERROR']) return;

  var prevLen = G.missions.length;
  spawnMission('DOMESTIC_TERROR');
  var m = G.missions.length > prevLen ? G.missions[0] : null;
  if (!m) return;

  m.geoEventId = evt.id;
  m.threat = Math.min(5, m.threat + 1);

  addLog('GEO: ' + theater.name + ' crisis spillover — domestic terror cell identified. OP ' + m.codename + '.', 'log-warn');
}

// =============================================================================
// PLOTS.JS INTEGRATION — theater-aware org creation
// =============================================================================

// Expose a function for plots.js to pick theater-appropriate locations
window.createPlotInTheater = function (theaterId) {
  var theater = THEATERS[theaterId];
  if (!theater || !G.plots) return;

  // Pick org type weighted toward theater's profile
  var orgTypes = theater.threatProfile.orgTypes;
  // createPlot is inside plots.js IIFE, so we fire a hook instead
  fire('geo:spawnOrg', { theaterId: theaterId, orgTypes: orgTypes, theater: theater });
};

// =============================================================================
// RENDER: GEOPOLITICS PANEL
// =============================================================================

function renderGeoPanel() {
  var panel = document.getElementById('geo-panel');
  if (!panel || !G.geo) return;

  var html = '';

  // Theater cards
  for (var i = 0; i < THEATER_IDS.length; i++) {
    var tid = THEATER_IDS[i];
    var theater = THEATERS[tid];
    var state = G.geo.theaters[tid];
    var risk = state ? state.risk : theater.baseRisk;

    // Find active events for this theater
    var theaterEvents = [];
    for (var j = 0; j < G.geo.activeEvents.length; j++) {
      var e = G.geo.activeEvents[j];
      if (e.theaterId === tid && !e.resolved) theaterEvents.push(e);
    }

    var riskClass = risk >= 4 ? 'geo-risk-critical' : risk >= 3 ? 'geo-risk-high' : risk >= 2 ? 'geo-risk-moderate' : 'geo-risk-low';
    var riskLabel = risk >= 4 ? 'CRITICAL' : risk >= 3 ? 'HIGH' : risk >= 2 ? 'ELEVATED' : 'LOW';
    var riskBars = '';
    for (var b = 1; b <= 5; b++) {
      riskBars += '<span class="geo-risk-bar ' + (b <= risk ? riskClass : 'geo-risk-bar-empty') + '"></span>';
    }

    var eventsHtml = '';
    if (theaterEvents.length > 0) {
      for (var k = 0; k < theaterEvents.length; k++) {
        var te = theaterEvents[k];
        var remaining = te.endDay - G.day;
        var tmpl = GEO_EVENT_TYPES[te.typeId];
        var progress = Math.min(100, Math.round(((G.day - te.startDay) / te.duration) * 100));
        eventsHtml += '<div class="geo-event-entry">' +
          '<div class="geo-event-label">' + (tmpl ? tmpl.icon : '') + ' ' + te.label + '</div>' +
          '<div class="geo-event-progress-wrap">' +
            '<div class="geo-event-progress-fill" style="width:' + progress + '%;background:' + theater.color + '"></div>' +
          '</div>' +
          '<div class="geo-event-remaining">~' + remaining + 'd remaining</div>' +
        '</div>';
      }
    }

    html += '<div class="geo-theater-card' + (theaterEvents.length > 0 ? ' geo-theater-active' : '') + '" style="--theater-color:' + theater.color + '">' +
      '<div class="geo-theater-header">' +
        '<span class="geo-theater-icon" style="color:' + theater.color + '">' + theater.icon + '</span>' +
        '<span class="geo-theater-name">' + theater.name + '</span>' +
        '<span class="geo-risk-badge ' + riskClass + '">' + riskLabel + '</span>' +
      '</div>' +
      '<div class="geo-risk-bars">' + riskBars + '</div>' +
      (eventsHtml ? '<div class="geo-events-list">' + eventsHtml + '</div>' : '') +
    '</div>';
  }

  panel.innerHTML = html;
}

hook('render:after', function () {
  renderGeoPanel();

  // Update geo tab badge count (active events)
  var badge = document.getElementById('geo-count');
  if (badge && G.geo) {
    var count = 0;
    for (var i = 0; i < G.geo.activeEvents.length; i++) {
      if (!G.geo.activeEvents[i].resolved) count++;
    }
    badge.textContent = count;
    badge.style.display = count > 0 ? '' : 'none';
  }
});

// =============================================================================
// ONGOING FLAVOR — periodic log messages for active events
// =============================================================================

hook('day:post', function () {
  if (!G.geo || G.geo.activeEvents.length === 0) return;

  // ~15% chance per day for flavor log
  if (Math.random() > 0.15) return;

  var active = G.geo.activeEvents.filter(function (e) { return !e.resolved; });
  if (active.length === 0) return;

  var evt = pick(active);
  var tmpl = GEO_EVENT_TYPES[evt.typeId];
  var theater = THEATERS[evt.theaterId];
  if (!tmpl || !tmpl.ongoingFlavor || tmpl.ongoingFlavor.length === 0) return;

  var flavor = pick(tmpl.ongoingFlavor).replace(/\{theater\}/g, theater.name);
  addLog('GEO: ' + flavor, 'log-info');
});

// =============================================================================
// PRUNE RESOLVED EVENTS (keep last 10 in history)
// =============================================================================

var MAX_GEO_HISTORY = 10;

hook('day:post', function () {
  if (!G.geo) return;
  var resolved = [];
  var active = [];
  for (var i = 0; i < G.geo.activeEvents.length; i++) {
    if (G.geo.activeEvents[i].resolved) resolved.push(G.geo.activeEvents[i]);
    else active.push(G.geo.activeEvents[i]);
  }
  if (resolved.length > MAX_GEO_HISTORY) {
    resolved = resolved.slice(resolved.length - MAX_GEO_HISTORY);
  }
  G.geo.activeEvents = active.concat(resolved);
});

})();
