'use strict';
// =============================================================================
// SHADOW DIRECTIVE — Configuration Constants
// Extracted from game.js in v4.0.0 refactor.
// Must load BEFORE game.js (provides COUNTRIES, DEPT_CONFIG, FOREIGN_CITIES,
// CODENAME_ADJ, CODENAME_NOUN, HVT_HARDNESS, HVT_HARDNESS helpers,
// ROLE_TOOLTIPS, roleTooltip, roleWithTip).
// =============================================================================

// =============================================================================
// COUNTRY CONFIGURATION
// =============================================================================

const COUNTRIES = {
  USA: {
    name: 'United States', agency: 'Special Activities Agency',
    acronym: 'SAA', flag: '🇺🇸',
    factionId: 'FIVE_EYES_CORE', homeTheaterId: 'NORTH_AMERICA',
    leader: 'POTUS', leaderTitle: 'the President', leaderFormal: 'Mr. President',
    currency: '$', currencySymbol: '$',
    budget: 60, confidence: 70,
    reportsTo: 'Reports directly to POTUS',
    desc: 'The world\'s most powerful intelligence apparatus. Vast resources, but under intense scrutiny.',
    budgetLabel: '$60M', confLabel: '70%',
    weeklyBudgetRegen: 4,
    deptCapacities: {
      ANALYSIS: 8, HUMINT: 6, SIGINT: 5,
      FIELD_OPS: 4, SPECIAL_OPS: 2, FOREIGN_OPS: 4, COUNTER_INTEL: 5,
    },
    deptMaxCapacities: {
      ANALYSIS: 14, HUMINT: 10, SIGINT: 10,
      FIELD_OPS: 10, SPECIAL_OPS: 6, FOREIGN_OPS: 10, COUNTER_INTEL: 10,
    },
    maxBudgetRegen: 4, maxBudgetCap: 3,
    domesticCities: ['New York', 'Chicago', 'Los Angeles', 'Washington D.C.', 'Miami', 'Houston', 'Seattle', 'Boston', 'Atlanta', 'Denver'],
    partnerAgencies: {
      BUREAU:   { name: 'The Bureau (FBI)', shortName: 'BUREAU',  type: 'domestic', startingRelation: 60,
        desc: 'The Federal Bureau of Investigation — primary domestic counter-intelligence and counter-terrorism authority. Operates under DOJ jurisdiction exclusively within U.S. borders.',
        support: [
          { id: 'FBI_HRT',   label: 'FBI HRT',              desc: 'Hostage Rescue Team on standby.',    cost: 12, bonusType: 'execProb',  bonusValue: 15 },
          { id: 'FBI_SURV',  label: 'FBI Surveillance',     desc: 'Extended surveillance package.',     cost:  8, bonusType: 'execProb',  bonusValue: 10 },
          { id: 'FBI_INTEL', label: 'Bureau Intel Package', desc: 'Behavioral analysis + file access.', cost:  7, bonusType: 'intelField',bonusValue: 1  },
        ]},
      AGENCY:   { name: 'The Agency (CIA)', shortName: 'AGENCY',  type: 'foreign',  startingRelation: 55,
        desc: 'The Central Intelligence Agency — principal foreign intelligence service. Collects and acts on human intelligence abroad; directs covert action programs and maintains overseas station networks.',
        support: [
          { id: 'CIA_STATION', label: 'CIA Station Access',   desc: 'Station chief intelligence.',       cost: 12, bonusType: 'intelField',bonusValue: 1  },
          { id: 'CIA_PARA',    label: 'Agency Ground Branch', desc: 'Paramilitary element attached.',    cost: 15, bonusType: 'execProb',  bonusValue: 15 },
          { id: 'CIA_SIGNAL',  label: 'Agency SIGINT Link',   desc: 'NSA/CIA intercept package.',        cost:  9, bonusType: 'execProb',  bonusValue: 12 },
        ]},
      MILITARY: { name: 'Defense Intelligence Agency', shortName: 'DIA', type: 'military', startingRelation: 50,
        desc: 'The Defense Intelligence Agency — military intelligence arm of the DoD. Provides combat-relevant intelligence to warfighters and policymakers; oversees attaché networks worldwide.',
        support: [
          { id: 'JSOC_T1',    label: 'JSOC Tier 1 Element',  desc: 'Joint Special Operations Command tier-one asset (Delta Force / DEVGRU).',  cost: 20, bonusType: 'execProb',  bonusValue: 20 },
          { id: 'MARINE_QRF', label: 'Marine QRF',          desc: 'Quick Reaction Force (Marines).',    cost: 15, bonusType: 'execProb',  bonusValue: 15 },
          { id: 'DIA_HUMINT', label: 'DIA HUMINT Package',  desc: 'Defense attaché intel network.',     cost: 10, bonusType: 'intelField',bonusValue: 1  },
        ]},
    },
  },
  UK: {
    name: 'United Kingdom', agency: 'Joint Covert Operations Bureau',
    acronym: 'JCOB', flag: '🇬🇧',
    factionId: 'EUROPEAN_ACCORD', homeTheaterId: 'WESTERN_EUROPE',
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
    deptMaxCapacities: {
      ANALYSIS: 12, HUMINT: 8, SIGINT: 8,
      FIELD_OPS: 8, SPECIAL_OPS: 5, FOREIGN_OPS: 8, COUNTER_INTEL: 8,
    },
    maxBudgetRegen: 3, maxBudgetCap: 2,
    domesticCities: ['London', 'Manchester', 'Birmingham', 'Glasgow', 'Leeds', 'Bristol', 'Edinburgh', 'Cardiff', 'Liverpool', 'Sheffield'],
    partnerAgencies: {
      BUREAU:   { name: 'MI5 (Security Service)', shortName: 'MI5',  type: 'domestic', startingRelation: 62,
        desc: 'MI5 — the domestic counter-intelligence and security agency. Responsible for protecting the UK against espionage, terrorism and subversion on home soil. Has no powers of arrest; works closely with police.',
        support: [
          { id: 'MI5_SURV', label: 'MI5 Surveillance',    desc: 'A4 surveillance section.',        cost:  8, bonusType: 'execProb',  bonusValue: 10 },
          { id: 'MI5_CT',   label: 'Counter-Terror Team', desc: 'SO15 tactical attachment.',       cost: 12, bonusType: 'execProb',  bonusValue: 14 },
          { id: 'MI5_ANAL', label: 'MI5 Analyst Embed',   desc: 'Technical analysis support.',     cost:  7, bonusType: 'intelField',bonusValue: 1  },
        ]},
      AGENCY:   { name: 'MI6 / SIS', shortName: 'SIX',  type: 'foreign',  startingRelation: 58,
        desc: 'MI6 (Secret Intelligence Service) — the foreign intelligence service. Collects human intelligence overseas, runs agent networks, and conducts covert operations in support of UK national interests.',
        support: [
          { id: 'SIS_STATION', label: 'SIS Station Brief',  desc: 'Local station intelligence.',   cost: 10, bonusType: 'intelField',bonusValue: 1  },
          { id: 'SIS_PARA',    label: 'SIS Action Section', desc: 'Special Support Section team.', cost: 14, bonusType: 'execProb',  bonusValue: 14 },
          { id: 'SIS_SIGINT',  label: 'GCHQ Intercept',     desc: 'GCHQ signals package.',         cost:  9, bonusType: 'execProb',  bonusValue: 11 },
        ]},
      MILITARY: { name: 'Defence Intelligence (DI)', shortName: 'DI', type: 'military', startingRelation: 52,
        desc: 'Defence Intelligence — intelligence directorate of the UK Ministry of Defence. Provides all-source military intelligence assessments and supports joint operations and deployed forces globally.',
        support: [
          { id: 'SAS_ELEMENT',  label: 'SAS Troop',                desc: '22 SAS direct action element.', cost: 20, bonusType: 'execProb',  bonusValue: 20 },
          { id: 'SBS_MARITIME', label: 'SBS Maritime Element',     desc: 'Special Boat Service unit.',    cost: 15, bonusType: 'execProb',  bonusValue: 15 },
          { id: 'DI_HUMINT',    label: 'DI Intelligence Brief',    desc: 'Defence attaché network.',      cost:  9, bonusType: 'intelField',bonusValue: 1  },
        ]},
    },
  },
  FRANCE: {
    name: 'France', agency: 'Direction Spéciale des Opérations',
    acronym: 'DSO', flag: '🇫🇷',
    factionId: 'EUROPEAN_ACCORD', homeTheaterId: 'WESTERN_EUROPE',
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
    deptMaxCapacities: {
      ANALYSIS: 10, HUMINT: 7, SIGINT: 7,
      FIELD_OPS: 7, SPECIAL_OPS: 4, FOREIGN_OPS: 7, COUNTER_INTEL: 7,
    },
    maxBudgetRegen: 3, maxBudgetCap: 2,
    domesticCities: ['Paris', 'Lyon', 'Marseille', 'Toulouse', 'Bordeaux', 'Lille', 'Nice', 'Nantes', 'Strasbourg', 'Rennes'],
    partnerAgencies: {
      BUREAU:   { name: 'DGSI', shortName: 'DGSI', type: 'domestic', startingRelation: 58,
        desc: 'Direction Générale de la Sécurité Intérieure — France\'s domestic counter-intelligence and counter-terrorism service. Successor to the DST; operates under the Interior Ministry to protect French territory.',
        support: [
          { id: 'SDAT_SUPPORT', label: 'SDAT Anti-Terror',  desc: 'Police CT unit attached.',        cost: 10, bonusType: 'execProb',  bonusValue: 13 },
          { id: 'DGSI_CYBER',   label: 'DGSI Cyber Unit',   desc: 'Digital intercept capability.',   cost:  8, bonusType: 'execProb',  bonusValue: 11 },
          { id: 'DGSI_INTEL',   label: 'DGSI Source Pkg',   desc: 'Domestic asset network.',         cost:  7, bonusType: 'intelField',bonusValue: 1  },
        ]},
      AGENCY:   { name: 'DGSE', shortName: 'DGSE', type: 'foreign',  startingRelation: 55,
        desc: 'Direction Générale de la Sécurité Extérieure — France\'s foreign intelligence service. Conducts espionage, runs overseas agent networks, and executes covert operations via its elite Service Action.',
        support: [
          { id: 'DGSE_ACTION',  label: 'Service Action',    desc: 'DGSE direct action element.',     cost: 14, bonusType: 'execProb',  bonusValue: 15 },
          { id: 'DGSE_RESEAU',  label: 'Réseau Station',    desc: 'Foreign station network.',        cost: 10, bonusType: 'intelField',bonusValue: 1  },
          { id: 'DGSE_TECH',    label: 'DGSE Tech Bureau',  desc: 'SIGINT + ELINT package.',         cost:  9, bonusType: 'execProb',  bonusValue: 11 },
        ]},
      MILITARY: { name: 'DRM', shortName: 'DRM', type: 'military', startingRelation: 48,
        desc: 'Direction du Renseignement Militaire — military intelligence directorate of the French Armed Forces. Provides strategic and tactical intelligence assessments in support of defence operations abroad.',
        support: [
          { id: 'GIGN_ASSAULT', label: 'GIGN Assault Team', desc: 'Elite gendarmerie unit.',         cost: 18, bonusType: 'execProb',  bonusValue: 19 },
          { id: 'COS_SPECIAL',  label: 'COS Commando',      desc: 'Commandement des Opérations Spéciales element.', cost: 15, bonusType: 'execProb', bonusValue: 16 },
          { id: 'DRM_HUMINT',   label: 'DRM Intelligence',  desc: 'Military attaché network.',       cost:  9, bonusType: 'intelField',bonusValue: 1  },
        ]},
    },
  }
};

// =============================================================================
// DEPARTMENT CONFIGURATION
// =============================================================================

const DEPT_CONFIG = [
  {
    id: 'ANALYSIS', name: 'Analysis Bureau', short: 'ANALYSIS',
    unitName: 'desks', unitNameSingle: 'desk',
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
    unitName: 'cells', unitNameSingle: 'cell',
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
  // Middle East
  { city: 'Tehran', country: 'Iran' }, { city: 'Mashhad', country: 'Iran' }, { city: 'Isfahan', country: 'Iran' }, { city: 'Tabriz', country: 'Iran' },
  { city: 'Baghdad', country: 'Iraq' }, { city: 'Mosul', country: 'Iraq' }, { city: 'Basra', country: 'Iraq' }, { city: 'Erbil', country: 'Iraq' },
  { city: 'Damascus', country: 'Syria' }, { city: 'Aleppo', country: 'Syria' }, { city: 'Homs', country: 'Syria' },
  { city: 'Beirut', country: 'Lebanon' }, { city: 'Tripoli', country: 'Lebanon' }, { city: 'Sidon', country: 'Lebanon' },
  { city: 'Amman', country: 'Jordan' }, { city: 'Zarqa', country: 'Jordan' }, { city: 'Irbid', country: 'Jordan' },
  { city: 'Sanaa', country: 'Yemen' }, { city: 'Aden', country: 'Yemen' }, { city: 'Taiz', country: 'Yemen' },
  { city: 'Riyadh', country: 'Saudi Arabia' }, { city: 'Jeddah', country: 'Saudi Arabia' }, { city: 'Dammam', country: 'Saudi Arabia' },
  { city: 'Doha', country: 'Qatar' }, { city: 'Al Wakrah', country: 'Qatar' }, { city: 'Al Khor', country: 'Qatar' },
  { city: 'Dubai', country: 'UAE' }, { city: 'Abu Dhabi', country: 'UAE' }, { city: 'Sharjah', country: 'UAE' },
  { city: 'Muscat', country: 'Oman' }, { city: 'Salalah', country: 'Oman' }, { city: 'Sohar', country: 'Oman' },
  { city: 'Manama', country: 'Bahrain' }, { city: 'Muharraq', country: 'Bahrain' }, { city: 'Riffa', country: 'Bahrain' },
  { city: 'Kuwait City', country: 'Kuwait' }, { city: 'Hawalli', country: 'Kuwait' }, { city: 'Al Ahmadi', country: 'Kuwait' },
  // Eastern Europe
  { city: 'Moscow', country: 'Russia' }, { city: 'St. Petersburg', country: 'Russia' }, { city: 'Novosibirsk', country: 'Russia' }, { city: 'Yekaterinburg', country: 'Russia' }, { city: 'Volgograd', country: 'Russia' },
  { city: 'Kyiv', country: 'Ukraine' }, { city: 'Odesa', country: 'Ukraine' }, { city: 'Kharkiv', country: 'Ukraine' }, { city: 'Lviv', country: 'Ukraine' },
  { city: 'Minsk', country: 'Belarus' }, { city: 'Gomel', country: 'Belarus' }, { city: 'Brest', country: 'Belarus' },
  { city: 'Tbilisi', country: 'Georgia' }, { city: 'Batumi', country: 'Georgia' }, { city: 'Kutaisi', country: 'Georgia' },
  { city: 'Chișinău', country: 'Moldova' }, { city: 'Bălți', country: 'Moldova' }, { city: 'Tiraspol', country: 'Moldova' },
  { city: 'Belgrade', country: 'Serbia' }, { city: 'Novi Sad', country: 'Serbia' }, { city: 'Niš', country: 'Serbia' },
  { city: 'Bucharest', country: 'Romania' }, { city: 'Cluj-Napoca', country: 'Romania' }, { city: 'Timișoara', country: 'Romania' },
  { city: 'Sofia', country: 'Bulgaria' }, { city: 'Plovdiv', country: 'Bulgaria' }, { city: 'Varna', country: 'Bulgaria' },
  { city: 'Budapest', country: 'Hungary' }, { city: 'Debrecen', country: 'Hungary' }, { city: 'Szeged', country: 'Hungary' },
  { city: 'Warsaw', country: 'Poland' }, { city: 'Kraków', country: 'Poland' }, { city: 'Gdańsk', country: 'Poland' },
  { city: 'Prague', country: 'Czech Republic' }, { city: 'Brno', country: 'Czech Republic' }, { city: 'Ostrava', country: 'Czech Republic' },
  // Central & South Asia
  { city: 'Kabul', country: 'Afghanistan' }, { city: 'Kandahar', country: 'Afghanistan' }, { city: 'Herat', country: 'Afghanistan' }, { city: 'Mazar-i-Sharif', country: 'Afghanistan' },
  { city: 'Islamabad', country: 'Pakistan' }, { city: 'Lahore', country: 'Pakistan' }, { city: 'Quetta', country: 'Pakistan' }, { city: 'Karachi', country: 'Pakistan' }, { city: 'Peshawar', country: 'Pakistan' },
  { city: 'Almaty', country: 'Kazakhstan' }, { city: 'Astana', country: 'Kazakhstan' }, { city: 'Shymkent', country: 'Kazakhstan' },
  { city: 'Tashkent', country: 'Uzbekistan' }, { city: 'Samarkand', country: 'Uzbekistan' }, { city: 'Bukhara', country: 'Uzbekistan' },
  { city: 'Dhaka', country: 'Bangladesh' }, { city: 'Chittagong', country: 'Bangladesh' }, { city: 'Khulna', country: 'Bangladesh' },
  { city: 'Kathmandu', country: 'Nepal' }, { city: 'Pokhara', country: 'Nepal' }, { city: 'Lalitpur', country: 'Nepal' },
  { city: 'Dushanbe', country: 'Tajikistan' }, { city: 'Khujand', country: 'Tajikistan' }, { city: 'Kulob', country: 'Tajikistan' },
  { city: 'Bishkek', country: 'Kyrgyzstan' }, { city: 'Osh', country: 'Kyrgyzstan' }, { city: 'Jalal-Abad', country: 'Kyrgyzstan' },
  // East Asia & Pacific
  { city: 'Beijing', country: 'China' }, { city: 'Shanghai', country: 'China' }, { city: 'Shenyang', country: 'China' }, { city: 'Guangzhou', country: 'China' }, { city: 'Chengdu', country: 'China' },
  { city: 'Pyongyang', country: 'North Korea' }, { city: 'Hamhung', country: 'North Korea' }, { city: 'Chongjin', country: 'North Korea' },
  { city: 'Rangoon', country: 'Myanmar' }, { city: 'Mandalay', country: 'Myanmar' }, { city: 'Naypyidaw', country: 'Myanmar' },
  { city: 'Phnom Penh', country: 'Cambodia' }, { city: 'Siem Reap', country: 'Cambodia' }, { city: 'Battambang', country: 'Cambodia' },
  { city: 'Vientiane', country: 'Laos' }, { city: 'Luang Prabang', country: 'Laos' }, { city: 'Savannakhet', country: 'Laos' },
  { city: 'Bangkok', country: 'Thailand' }, { city: 'Chiang Mai', country: 'Thailand' }, { city: 'Phuket', country: 'Thailand' },
  { city: 'Manila', country: 'Philippines' }, { city: 'Cebu', country: 'Philippines' }, { city: 'Davao', country: 'Philippines' },
  { city: 'Jakarta', country: 'Indonesia' }, { city: 'Surabaya', country: 'Indonesia' }, { city: 'Bandung', country: 'Indonesia' }, { city: 'Medan', country: 'Indonesia' },
  { city: 'Kuala Lumpur', country: 'Malaysia' }, { city: 'Penang', country: 'Malaysia' }, { city: 'Johor Bahru', country: 'Malaysia' },
  { city: 'Hanoi', country: 'Vietnam' }, { city: 'Ho Chi Minh City', country: 'Vietnam' }, { city: 'Da Nang', country: 'Vietnam' },
  // Africa
  { city: 'Tripoli', country: 'Libya' }, { city: 'Benghazi', country: 'Libya' }, { city: 'Misrata', country: 'Libya' },
  { city: 'Khartoum', country: 'Sudan' }, { city: 'Omdurman', country: 'Sudan' }, { city: 'Port Sudan', country: 'Sudan' },
  { city: 'Cairo', country: 'Egypt' }, { city: 'Alexandria', country: 'Egypt' }, { city: 'Giza', country: 'Egypt' },
  { city: 'Algiers', country: 'Algeria' }, { city: 'Oran', country: 'Algeria' }, { city: 'Constantine', country: 'Algeria' },
  { city: 'Lagos', country: 'Nigeria' }, { city: 'Kano', country: 'Nigeria' }, { city: 'Abuja', country: 'Nigeria' }, { city: 'Port Harcourt', country: 'Nigeria' },
  { city: 'Nairobi', country: 'Kenya' }, { city: 'Mombasa', country: 'Kenya' }, { city: 'Kisumu', country: 'Kenya' },
  { city: 'Mogadishu', country: 'Somalia' }, { city: 'Hargeisa', country: 'Somalia' }, { city: 'Kismayo', country: 'Somalia' },
  { city: 'Addis Ababa', country: 'Ethiopia' }, { city: 'Dire Dawa', country: 'Ethiopia' }, { city: 'Mekelle', country: 'Ethiopia' },
  { city: 'Dakar', country: 'Senegal' }, { city: 'Saint-Louis', country: 'Senegal' }, { city: 'Thiès', country: 'Senegal' },
  { city: 'Kinshasa', country: 'Congo (DRC)' }, { city: 'Lubumbashi', country: 'Congo (DRC)' }, { city: 'Goma', country: 'Congo (DRC)' },
  { city: 'Bamako', country: 'Mali' }, { city: 'Timbuktu', country: 'Mali' }, { city: 'Gao', country: 'Mali' },
  { city: 'Niamey', country: 'Niger' }, { city: 'Zinder', country: 'Niger' }, { city: 'Maradi', country: 'Niger' },
  { city: "N'Djamena", country: 'Chad' }, { city: 'Moundou', country: 'Chad' }, { city: 'Abéché', country: 'Chad' },
  // Latin America
  { city: 'Caracas', country: 'Venezuela' }, { city: 'Maracaibo', country: 'Venezuela' }, { city: 'Valencia', country: 'Venezuela' },
  { city: 'Havana', country: 'Cuba' }, { city: 'Santiago de Cuba', country: 'Cuba' }, { city: 'Camagüey', country: 'Cuba' },
  { city: 'Bogotá', country: 'Colombia' }, { city: 'Medellín', country: 'Colombia' }, { city: 'Cali', country: 'Colombia' }, { city: 'Barranquilla', country: 'Colombia' },
  { city: 'Managua', country: 'Nicaragua' }, { city: 'León', country: 'Nicaragua' }, { city: 'Granada', country: 'Nicaragua' },
  { city: 'Tegucigalpa', country: 'Honduras' }, { city: 'San Pedro Sula', country: 'Honduras' }, { city: 'La Ceiba', country: 'Honduras' },
  { city: 'Mexico City', country: 'Mexico' }, { city: 'Guadalajara', country: 'Mexico' }, { city: 'Monterrey', country: 'Mexico' }, { city: 'Tijuana', country: 'Mexico' },
  { city: 'São Paulo', country: 'Brazil' }, { city: 'Rio de Janeiro', country: 'Brazil' }, { city: 'Brasília', country: 'Brazil' }, { city: 'Manaus', country: 'Brazil' },
  { city: 'La Paz', country: 'Bolivia' }, { city: 'Santa Cruz', country: 'Bolivia' }, { city: 'Cochabamba', country: 'Bolivia' },
  { city: 'Lima', country: 'Peru' }, { city: 'Arequipa', country: 'Peru' }, { city: 'Cusco', country: 'Peru' },
  { city: 'Quito', country: 'Ecuador' }, { city: 'Guayaquil', country: 'Ecuador' }, { city: 'Cuenca', country: 'Ecuador' },
  // Western Europe
  { city: 'Paris', country: 'France' }, { city: 'Lyon', country: 'France' }, { city: 'Marseille', country: 'France' },
  { city: 'London', country: 'United Kingdom' }, { city: 'Manchester', country: 'United Kingdom' }, { city: 'Edinburgh', country: 'United Kingdom' },
  { city: 'Berlin', country: 'Germany' }, { city: 'Munich', country: 'Germany' }, { city: 'Hamburg', country: 'Germany' }, { city: 'Frankfurt', country: 'Germany' },
  { city: 'Rome', country: 'Italy' }, { city: 'Milan', country: 'Italy' }, { city: 'Naples', country: 'Italy' },
  { city: 'Madrid', country: 'Spain' }, { city: 'Barcelona', country: 'Spain' }, { city: 'Seville', country: 'Spain' },
  { city: 'Brussels', country: 'Belgium' }, { city: 'Antwerp', country: 'Belgium' }, { city: 'Ghent', country: 'Belgium' },
  { city: 'Amsterdam', country: 'Netherlands' }, { city: 'Rotterdam', country: 'Netherlands' }, { city: 'The Hague', country: 'Netherlands' },
  { city: 'Vienna', country: 'Austria' }, { city: 'Graz', country: 'Austria' }, { city: 'Salzburg', country: 'Austria' },
  { city: 'Zurich', country: 'Switzerland' }, { city: 'Geneva', country: 'Switzerland' }, { city: 'Bern', country: 'Switzerland' },
  { city: 'Stockholm', country: 'Sweden' }, { city: 'Gothenburg', country: 'Sweden' }, { city: 'Malmö', country: 'Sweden' },
  { city: 'Oslo', country: 'Norway' }, { city: 'Bergen', country: 'Norway' }, { city: 'Trondheim', country: 'Norway' },
  { city: 'Copenhagen', country: 'Denmark' }, { city: 'Aarhus', country: 'Denmark' }, { city: 'Odense', country: 'Denmark' },
  // North America
  { city: 'Washington D.C.', country: 'United States' }, { city: 'New York', country: 'United States' }, { city: 'Los Angeles', country: 'United States' }, { city: 'Chicago', country: 'United States' }, { city: 'Houston', country: 'United States' }, { city: 'Miami', country: 'United States' },
  { city: 'Toronto', country: 'Canada' }, { city: 'Ottawa', country: 'Canada' }, { city: 'Vancouver', country: 'Canada' }, { city: 'Montreal', country: 'Canada' },
];

// =============================================================================
// CODENAMES
// =============================================================================

const CODENAME_ADJ = [
  // metals & materials
  'IRON', 'STEEL', 'CHROME', 'COPPER', 'COBALT', 'TITANIUM', 'NICKEL', 'TUNGSTEN', 'PLATINUM', 'BRASS',
  'GRANITE', 'OBSIDIAN', 'ONYX', 'FLINT', 'MARBLE', 'BASALT', 'SLATE', 'QUARTZ', 'CARBON', 'KEVLAR',
  // colors & light
  'CRIMSON', 'GOLDEN', 'SILVER', 'SCARLET', 'AMBER', 'AZURE', 'INDIGO', 'ROUGE', 'VIOLET', 'IVORY',
  'SABLE', 'VERMILLION', 'OCHRE', 'CERULEAN', 'TAWNY', 'RUSSET', 'UMBER', 'SEPIA', 'PEWTER', 'GILDED',
  // weather & nature
  'FROZEN', 'BURNING', 'COLD', 'SWIFT', 'THUNDER', 'ARCTIC', 'BOREAL', 'ARID', 'TORRID', 'TROPIC',
  'COASTAL', 'ALPINE', 'POLAR', 'TIDAL', 'LUNAR', 'SOLAR', 'STELLAR', 'ORBITAL', 'VOLCANIC', 'SEISMIC',
  // qualities & conditions
  'SILENT', 'SHADOW', 'PHANTOM', 'GHOST', 'FALLEN', 'STERLING', 'MIDNIGHT', 'TITAN', 'EMBER', 'THORN',
  'RAPID', 'COVERT', 'LETHAL', 'PRIMAL', 'SAVAGE', 'FIERCE', 'ROGUE', 'FERAL', 'DIRE', 'STARK',
  'GRIM', 'HARD', 'BRUTE', 'LEAN', 'KEEN', 'BOLD', 'DEFT', 'PRIME', 'GRAND', 'NOBLE',
  // tactical
  'FORWARD', 'FINAL', 'TOTAL', 'DOUBLE', 'TRIPLE', 'HEAVY', 'LIGHT', 'LONG', 'SHORT', 'CROSS',
  'COUNTER', 'OVER', 'UNDER', 'OUTER', 'INNER', 'UPPER', 'LOWER', 'FIRST', 'SECOND', 'THIRD',
  // terrain & cardinal
  'NORTH', 'SOUTH', 'EAST', 'WEST', 'SUMMIT', 'VALLEY', 'RIDGE', 'DELTA', 'MESA', 'CANYON',
  'STEPPE', 'TUNDRA', 'TAIGA', 'SAHEL', 'DUNE', 'REEF', 'SHOAL', 'CAPE', 'FJORD', 'STRAIT',
  // ancient & mythic
  'ROMAN', 'SPARTAN', 'TROJAN', 'VIKING', 'SAXON', 'CELTIC', 'GOTHIC', 'MONGOL', 'AZTEC', 'NORSE',
  'OLYMPIAN', 'TITAN', 'IRON', 'PRAETORIAN', 'CENTURION', 'LEGION', 'IMPERIAL', 'ROYAL', 'CRUSADER', 'TEMPLAR',
  // additional variety
  'JADE', 'CORAL', 'OPAL', 'GARNET', 'TOPAZ', 'BERYL', 'AGATE', 'JASPER', 'PYRITE', 'ZIRCON',
  'CIPHER', 'SIGNAL', 'VECTOR', 'MATRIX', 'VERTEX', 'APEX', 'ZENITH', 'NADIR', 'FULCRUM', 'NEXUS',
];

const CODENAME_NOUN = [
  // predators & animals
  'FALCON', 'WOLF', 'RAVEN', 'CONDOR', 'VIPER', 'HAWK', 'MANTIS', 'SERPENT', 'PANTHER', 'JAGUAR',
  'OSPREY', 'KESTREL', 'MERLIN', 'HARRIER', 'RAPTOR', 'COBRA', 'MAMBA', 'PYTHON', 'SCORPION', 'WOLVERINE',
  'LYNX', 'COUGAR', 'STALLION', 'HORNET', 'BARRACUDA', 'MARLIN', 'STINGRAY', 'HAMMERHEAD', 'ORCA', 'GRYPHON',
  'JACKAL', 'HYENA', 'MONGOOSE', 'PEREGRINE', 'GOSHAWK', 'SHRIKE', 'IBIS', 'HERON', 'CRANE', 'SWIFT',
  // weapons & tools
  'HAMMER', 'ARROW', 'LANCE', 'ANVIL', 'BLADE', 'DAGGER', 'CROSSBOW', 'SABRE', 'CLAYMORE', 'HALBERD',
  'PIKE', 'JAVELIN', 'TOMAHAWK', 'TRIDENT', 'MACE', 'FLAIL', 'MUSKET', 'MORTAR', 'CANNON', 'TREBUCHET',
  'BAYONET', 'GAUNTLET', 'RAMPART', 'PALISADE', 'BULWARK', 'FORTRESS', 'REDOUBT', 'PARAPET', 'STOCKADE', 'BATTLEMENT',
  // weather & forces
  'STORM', 'TEMPEST', 'THUNDER', 'AVALANCHE', 'BLIZZARD', 'CYCLONE', 'TYPHOON', 'MONSOON', 'TORNADO', 'MAELSTROM',
  'INFERNO', 'WILDFIRE', 'FIRESTORM', 'HAILSTORM', 'WHIRLWIND', 'GALE', 'SQUALL', 'DELUGE', 'TORRENT', 'CASCADE',
  // structures & features
  'TOWER', 'GATE', 'SHIELD', 'CROWN', 'STAR', 'CITADEL', 'BASTION', 'RAMPART', 'SPIRE', 'VAULT',
  'BUNKER', 'KEEP', 'TURRET', 'BRIDGE', 'BEACON', 'OUTPOST', 'WATCHTOWER', 'CHECKPOINT', 'PERIMETER', 'STRONGHOLD',
  // people & roles
  'WARDEN', 'REAPER', 'WRAITH', 'SPECTER', 'WARLOCK', 'SENTINEL', 'PALADIN', 'RANGER', 'MARSHAL', 'GUARDIAN',
  'HUNTER', 'STALKER', 'TRACKER', 'SCOUT', 'PIONEER', 'PATHFINDER', 'DRAGOON', 'HUSSAR', 'LANCER', 'GRENADIER',
  // abstract & tactical
  'FIST', 'TALON', 'CLAW', 'TUSK', 'FANG', 'BARB', 'SPUR', 'EDGE', 'POINT', 'APEX',
  'SURGE', 'SALVO', 'VOLLEY', 'BROADSIDE', 'ONSLAUGHT', 'REPRISAL', 'GAMBIT', 'OVERTURE', 'PRELUDE', 'CRESCENDO',
  // geographic
  'SUMMIT', 'GLACIER', 'CANYON', 'PLATEAU', 'RIDGE', 'RAVINE', 'GORGE', 'CRATER', 'CALDERA', 'ARCHIPELAGO',
  'PENINSULA', 'ISTHMUS', 'TRIBUTARY', 'ESTUARY', 'WATERSHED', 'HEADLAND', 'PROMONTORY', 'ESCARPMENT', 'MORAINE', 'PINNACLE',
];

// =============================================================================
// HVT HARDNESS SYSTEM
// =============================================================================

const HVT_HARDNESS = {
  SOFT:     { level: 1, label: 'SOFT',     color: '#2ecc71', cooldown: [3, 10],  threatMod: -1 },
  MODERATE: { level: 2, label: 'MODERATE',  color: '#f39c12', cooldown: [7, 25],  threatMod: 0 },
  HARD:     { level: 3, label: 'HARD',     color: '#e74c3c', cooldown: [25, 60], threatMod: 1 },
  ELITE:    { level: 4, label: 'ELITE',    color: '#c0392b', cooldown: [40, 90], threatMod: 1 },
};

function vagueEstimate(days) {
  if (days <= 5)  return 'a few days';
  if (days <= 12) return 'one to two weeks';
  if (days <= 25) return 'several weeks';
  if (days <= 50) return 'a month or more';
  return 'an extended period — possibly months';
}

function classifyHvtHardness(role) {
  if (!role) return 'MODERATE';
  const r = role.toLowerCase();
  if (/\bcommander\b|operations chief|security chief|war crimes|paramilitary/.test(r)) return 'ELITE';
  if (/attack coordinator|target selection|operational director/.test(r)) return 'ELITE';
  if (/deep.cover|illegal.*no.*immunity/.test(r)) return 'ELITE';
  if (/intelligence|espionage|case officer|mole handler|clandestine|hostile/.test(r)) return 'HARD';
  if (/access agent|dead-drop|influence operative|signals tech|wmd/.test(r)) return 'HARD';
  if (/acquisition agent|diplomatic cover|operations officer/.test(r)) return 'HARD';
  if (/scientist|researcher|forger|front company|technology thief/.test(r)) return 'SOFT';
  return 'MODERATE';
}

// =============================================================================
// ROLE TOOLTIPS
// =============================================================================

const ROLE_TOOLTIPS = [
  // ELITE tier
  [/cell commander|terror.*commander/i, 'ELITE — Commands a semi-autonomous terror cell. Trained in operational security, counter-interrogation, and compartmentalized communications. Losing this target means the cell reconstitutes under new leadership.'],
  [/paramilitary commander/i, 'ELITE — Commands irregular military forces. Combat-hardened, experienced in asymmetric warfare, and capable of directing large-scale operations. Extremely dangerous if cornered.'],
  [/network commander|senior.*commander/i, 'ELITE — Senior leadership figure directing multiple cells or operational branches. Extensive counter-intelligence awareness and deep organizational knowledge.'],
  [/operations chief|operational director/i, 'ELITE — Directs the operational arm of a hostile network. Coordinates attacks, logistics, and personnel across regions. Removal cripples the network\'s ability to act.'],
  [/security chief/i, 'ELITE — Runs internal security for a hostile organization. Expert at identifying infiltrators and maintaining operational secrecy. The hardest target to approach undetected.'],
  [/attack coordinator|attack planner/i, 'ELITE — Plans and coordinates attacks against high-value targets. Deep knowledge of tactics, timing, and target selection. Neutralizing this individual prevents future operations.'],
  [/war crimes/i, 'ELITE — Wanted for documented atrocities. Heavily protected and constantly moving. International priority target with significant political implications.'],
  [/deep.cover|illegal.*no.*immunity/i, 'ELITE — A professional intelligence officer operating without diplomatic protection. Years of training in tradecraft, cover identity maintenance, and counter-surveillance. The most dangerous category of operative — they have nothing to fall back on if exposed.'],
  [/proxy commander/i, 'ELITE — Directs deniable operations on behalf of a hostile state. Combines military command experience with intelligence tradecraft. State resources back their security.'],
  [/wmd|chemical weapons/i, 'HARD — Specialist in weapons of mass destruction procurement or development. High-priority target due to catastrophic potential. Often protected by state actors.'],
  // HARD tier
  [/case officer/i, 'HARD — Trained intelligence professional who recruits and handles human sources. Expert in clandestine meetings, dead-drops, and agent communications. Formal counter-surveillance training.'],
  [/intelligence officer|intelligence operative|espionage operative/i, 'HARD — Professional intelligence operative with formal training in tradecraft, surveillance detection, and covert communications. Operates under strict security protocols.'],
  [/mole handler/i, 'HARD — Manages penetration agents inside foreign governments or agencies. Extremely cautious — a single mistake burns the mole. Uses the most secure communication methods available.'],
  [/access agent/i, 'HARD — Recruited or placed to gain access to sensitive facilities, personnel, or information. Trained in social engineering and cover maintenance. Difficult to identify.'],
  [/dead.drop/i, 'HARD — Specialist in covert communications infrastructure. Manages physical and digital dead-drop networks for agent handling. Trained in counter-surveillance and site selection.'],
  [/influence operative/i, 'HARD — Conducts covert influence operations through media, political, or social channels. Skilled at building networks of unwitting assets. Difficult to distinguish from legitimate actors.'],
  [/signals? (intelligence|tech)/i, 'HARD — Technical specialist in electronic surveillance, interception, and signals exploitation. Operates sophisticated collection equipment and knows how to avoid detection.'],
  [/clandestine/i, 'HARD — Operates in a covert capacity with formal intelligence training. Skilled in cover identity management, surveillance detection, and secure communications.'],
  [/hostile.*recruiter|state recruiter/i, 'HARD — Recruits assets for a hostile intelligence service. Expert at identifying vulnerabilities in potential targets and building rapport under false pretenses.'],
  [/procurement (agent|specialist)|acquisition agent/i, 'HARD — Acquires restricted technology, materials, or equipment for hostile programs. Operates through front companies and cutouts. Difficult to track through legitimate commerce.'],
  [/diplomatic cover/i, 'HARD — Intelligence officer operating under diplomatic immunity. Has access to embassy resources, secure communications, and a legal safety net that complicates operations.'],
  [/intelligence liaison/i, 'HARD — Liaison between a state intelligence service and proxy forces. Coordinates covert support, training, and equipment transfers. Formally trained in tradecraft.'],
  [/operations officer/i, 'HARD — Directs and coordinates field operations for a hostile network. Trained in planning, logistics, and operational security. A key link between leadership and active cells.'],
  [/covert operations planner/i, 'HARD — Plans clandestine operations for a state proxy or hostile network. Formal military or intelligence training in operational planning and security.'],
  [/saboteur/i, 'HARD — Trained in covert destruction of infrastructure, equipment, or facilities. Operates alone or in small teams with specialized skills.'],
  // SOFT tier
  [/scientist|researcher/i, 'SOFT — Technical specialist with no formal security or intelligence training. Relies on routine rather than tradecraft. Vulnerable to surveillance and straightforward approaches.'],
  [/forger|certificate forger/i, 'SOFT — Document specialist who produces false credentials. Technical skill but minimal operational security awareness. Usually works from a fixed location.'],
  [/front company|front business/i, 'SOFT — Operates a legitimate business as cover for illicit activities. Little to no counter-surveillance training. Follows predictable patterns tied to the business.'],
  [/technology thief/i, 'SOFT — Steals sensitive technology through industrial espionage. Technical expertise but limited tradecraft. Often detected through their access patterns rather than fieldwork.'],
  [/materials scientist/i, 'SOFT — Specialist in restricted materials relevant to weapons programs. Academic background with no field training. A high-value but operationally simple target.'],
  // MODERATE tier
  [/bomb.?maker|bombmaking/i, 'MODERATE — Constructs explosive devices for terror operations. Technical skill in ordnance but limited counter-intelligence training. Often identified through materials procurement patterns.'],
  [/financier|financial facilitator|money launderer/i, 'MODERATE — Manages financial flows for hostile networks. Operates through banking systems and informal transfer networks. Some operational awareness but not formally trained.'],
  [/courier|weapons courier|intelligence courier/i, 'MODERATE — Transports materials, messages, or funds between network nodes. Knows routes and contacts but limited broader operational knowledge. Moderate security awareness from experience.'],
  [/logistics (handler|coordinator)/i, 'MODERATE — Manages supply chains, safe houses, and transport for hostile operations. Practical security awareness from experience but no formal intelligence training.'],
  [/recruiter|recruitment (coordinator|officer|director)/i, 'MODERATE — Identifies and recruits new members for hostile networks. Social skills and some operational awareness, but follows detectable patterns of contact.'],
  [/safe house operator/i, 'MODERATE — Maintains safe locations for operatives and materials. Knows locations and contacts but maintains a low profile. Moderate awareness of surveillance.'],
  [/weapons (specialist|broker|smuggler)/i, 'MODERATE — Handles weapons procurement, storage, or distribution. Practical field experience and some security awareness. Often trackable through supply chain contacts.'],
  [/communications (handler|officer)/i, 'MODERATE — Manages communications for hostile networks. Some technical knowledge of encrypted systems but not a trained intelligence professional.'],
  [/cell coordinator/i, 'MODERATE — Coordinates between cells or operational nodes. Knows more of the network structure than most members. Moderate security discipline from operational necessity.'],
  [/arms supplier/i, 'MODERATE — Supplies weapons to hostile networks through black market or diverted military channels. Operates in criminal circles with practical but informal security habits.'],
  [/propaganda coordinator/i, 'MODERATE — Produces and distributes propaganda for hostile networks. Operates semi-publicly, making them easier to locate but politically sensitive to act against.'],
  [/smuggling|smuggler/i, 'MODERATE — Manages illicit transport routes across borders. Street-level operational awareness and knowledge of evasion techniques, but no formal training.'],
  [/corrupt official/i, 'MODERATE — A compromised insider providing access or protection to hostile networks. Position offers some protection but limited tradecraft.'],
  [/enforcement chief/i, 'MODERATE — Directs enforcement or intimidation operations for criminal organizations. Dangerous in confrontation but limited in counter-intelligence awareness.'],
  [/cartel liaison/i, 'MODERATE — Coordinates between organized crime and other hostile networks. Streetwise and cautious but operates within detectable criminal patterns.'],
  [/shipping coordinator|transport broker/i, 'MODERATE — Manages shipping routes and logistics for illicit cargo. Operates through commercial systems that leave trackable records.'],
  [/fugitive/i, 'MODERATE — A wanted individual operating in hiding. Has some awareness of how to evade pursuit but lacks formal training. Reliant on support networks that can be compromised.'],
  [/rogue/i, 'MODERATE — A former professional now operating outside institutional control. Retains some training but lacks the resources and support of a state apparatus.'],
  [/extremist/i, 'MODERATE — Operates within domestic radical networks. Ideologically motivated with variable tradecraft — some are disciplined, others reckless.'],
  [/informant/i, 'MODERATE — A source providing intelligence, potentially under duress or for payment. Limited operational awareness but may be protected by handlers.'],
  [/witness/i, 'SOFT — A civilian with knowledge relevant to an investigation. No operational training or security awareness. Must be handled carefully for legal and ethical reasons.'],
  [/double.agent/i, 'HARD — An operative serving two masters. Trained in deception and compartmentation. Extremely difficult to assess true loyalties.'],
];

function roleTooltip(role) {
  if (!role) return '';
  for (let i = 0; i < ROLE_TOOLTIPS.length; i++) {
    if (ROLE_TOOLTIPS[i][0].test(role)) return ROLE_TOOLTIPS[i][1];
  }
  return '';
}

function roleWithTip(role) {
  const tip = roleTooltip(role);
  if (!tip) return role || '';
  return `<span data-tip="${tip.replace(/"/g, '&quot;')}">${role}</span>`;
}
