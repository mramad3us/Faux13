'use strict';
// =============================================================================
// SHADOW DIRECTIVE — Geopolitics System
// Theaters of operation with long-term geopolitical events that shape gameplay.
// =============================================================================

(function () {

// --- Inline SVG icons (source files in icons/theaters/ and icons/events/) ---
var GEO_ICONS = {
  // theaters (source: icons/theaters/*.svg)
  'middle-east':     '<svg viewBox="0 0 64 64" fill="currentColor"><path d="M8 50h48v-8c0-16-10-28-24-34C18 14 8 26 8 42z"/><rect x="6" y="50" width="52" height="6" rx="1"/><rect x="31" y="4" width="2" height="6"/><path d="M36 11a5 5 0 11-8 0 3.5 3.5 0 108 0z"/></svg>',
  'eastern-europe':  '<svg viewBox="0 0 64 64" fill="currentColor"><rect x="22" y="34" width="20" height="22" rx="1"/><path d="M20 34h24c0-10-3-16-6-20 1-4-1-8-6-12-5 4-7 8-6 12-3 4-6 10-6 20z"/><rect x="31" y="0" width="2" height="6"/><circle cx="32" cy="0" r="2.5"/></svg>',
  'central-asia':    '<svg viewBox="0 0 64 64" fill="currentColor"><path d="M0 58l14-30 6 10 12-32 12 26 6-12 14 38z"/><path d="M26 18l6-12 6 12-3 6h-6z" opacity="0.3"/></svg>',
  'east-asia':       '<svg viewBox="0 0 64 64" fill="currentColor"><path d="M32 4L10 18h44z"/><path d="M32 20L14 32h36z"/><path d="M32 34L18 44h28z"/><rect x="28" y="44" width="8" height="14"/><rect x="24" y="58" width="16" height="4" rx="1"/></svg>',
  'africa':          '<svg viewBox="0 0 64 64" fill="currentColor"><ellipse cx="32" cy="20" rx="28" ry="16"/><rect x="30" y="34" width="4" height="22"/><rect x="22" y="56" width="20" height="4" rx="2"/></svg>',
  'latin-america':   '<svg viewBox="0 0 64 64" fill="currentColor"><path d="M2 58h60v-10H50V38H42V28H22v10H14v10H2z"/><rect x="28" y="18" width="8" height="10"/></svg>',
  'western-europe':  '<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M12 58V26L32 6 52 26v32"/><line x1="12" y1="38" x2="52" y2="38"/><line x1="32" y1="58" x2="32" y2="38"/><circle cx="32" cy="22" r="7"/></svg>',
  'north-america':   '<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round"><path d="M32 4L8 16v16c0 16 10 24 24 28 14-4 24-12 24-28V16z"/><path d="M32 20l3.5 7 7.5 1-5.5 5 1.5 7.5L32 36l-7 4.5 1.5-7.5-5.5-5 7.5-1z" fill="currentColor" stroke="none"/></svg>',
  // events (source: icons/events/*.svg)
  'regional-war':    '<svg viewBox="0 0 64 64" fill="currentColor"><path d="M32 4l5 16 14-10-6 16 16 2-14 10 10 14-16-6-9 14-9-14-16 6 10-14-14-10 16-2-6-16 14 10z"/></svg>',
  'proxy-conflict':  '<svg viewBox="0 0 64 64" fill="currentColor"><path d="M4 32l14-12v8h6v8H18v8z"/><path d="M60 32L46 20v8h-6v8h6v8z"/><rect x="30" y="12" width="4" height="40" rx="1"/></svg>',
  'insurgency':      '<svg viewBox="0 0 64 64" fill="currentColor"><path d="M32 2c-10 14-20 22-20 34a20 20 0 0040 0C52 24 42 16 32 2z"/></svg>',
  'intelligence-war':'<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="3"><path d="M2 32s12-22 30-22 30 22 30 22-12 22-30 22S2 32 2 32z"/><circle cx="32" cy="32" r="11"/><circle cx="32" cy="32" r="4" fill="currentColor" stroke="none"/></svg>',
  'cyber-campaign':  '<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="6" width="56" height="40" rx="3"/><path d="M16 20l10 8-10 8"/><line x1="30" y1="36" x2="46" y2="36"/><path d="M22 56h20M32 46v10"/></svg>',
  'arms-race':       '<svg viewBox="0 0 64 64" fill="currentColor"><path d="M32 2c-5 10-8 20-8 32h16c0-12-3-22-8-32z"/><rect x="24" y="34" width="16" height="12" rx="1"/><path d="M20 52l4-6v6z"/><path d="M44 52l-4-6v6z"/><path d="M28 46h8v10l-4 6-4-6z"/></svg>',
  'civil-unrest':    '<svg viewBox="0 0 64 64" fill="currentColor"><rect x="4" y="26" width="10" height="12" rx="1"/><path d="M14 22l30-14v48L14 42z"/><path d="M50 22c5 5 5 15 0 20" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><path d="M56 14c8 8 8 28 0 36" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>',
  'regime-change':   '<svg viewBox="0 0 64 64" fill="currentColor"><g transform="rotate(-20 32 36)"><path d="M10 48h44V30l-11 8-11-14-11 14-11-8z"/><rect x="10" y="48" width="44" height="6" rx="1"/><circle cx="16" cy="30" r="3"/><circle cx="32" cy="20" r="3"/><circle cx="48" cy="30" r="3"/></g></svg>',
  'naval-standoff':  '<svg viewBox="0 0 64 64" fill="currentColor"><path d="M4 40h56l-8 14H12z"/><rect x="24" y="28" width="18" height="12" rx="1"/><rect x="14" y="32" width="10" height="8" rx="1"/><rect x="30" y="16" width="4" height="12"/><path d="M34 16h14" fill="none" stroke="currentColor" stroke-width="2"/><path d="M2 58c4-4 8-4 12 0s8 4 12 0 8-4 12 0 8 4 12 0 8-4 12 0" fill="none" stroke="currentColor" stroke-width="2.5"/></svg>',
};

// --- Helper: render a colored inline SVG icon ---
function geoIcon(iconKey, color, size) {
  var s = size || 16;
  var svg = GEO_ICONS[iconKey] || '';
  return '<span class="geo-svg-icon" style="width:' + s + 'px;height:' + s + 'px;color:' + color + '">' + svg + '</span>';
}

// =============================================================================
// THEATER DEFINITIONS
// =============================================================================

var THEATERS = {
  MIDDLE_EAST: {
    id: 'MIDDLE_EAST',
    name: 'Middle East',
    shortName: 'MENA',
    iconKey: 'middle-east',
    volatility: 0.85, // highest — perpetual instability
    baseRisk: 3,
    color: '#e67e22',
    countries: ['Iran', 'Iraq', 'Syria', 'Lebanon', 'Jordan', 'Yemen', 'Saudi Arabia', 'Qatar', 'UAE', 'Oman', 'Bahrain', 'Kuwait'],
    cities: [
      { city: 'Tehran', country: 'Iran' },
      { city: 'Mashhad', country: 'Iran' },
      { city: 'Isfahan', country: 'Iran' },
      { city: 'Tabriz', country: 'Iran' },
      { city: 'Baghdad', country: 'Iraq' },
      { city: 'Mosul', country: 'Iraq' },
      { city: 'Basra', country: 'Iraq' },
      { city: 'Erbil', country: 'Iraq' },
      { city: 'Damascus', country: 'Syria' },
      { city: 'Aleppo', country: 'Syria' },
      { city: 'Homs', country: 'Syria' },
      { city: 'Beirut', country: 'Lebanon' },
      { city: 'Tripoli', country: 'Lebanon' },
      { city: 'Sidon', country: 'Lebanon' },
      { city: 'Amman', country: 'Jordan' },
      { city: 'Zarqa', country: 'Jordan' },
      { city: 'Irbid', country: 'Jordan' },
      { city: 'Sanaa', country: 'Yemen' },
      { city: 'Aden', country: 'Yemen' },
      { city: 'Taiz', country: 'Yemen' },
      { city: 'Riyadh', country: 'Saudi Arabia' },
      { city: 'Jeddah', country: 'Saudi Arabia' },
      { city: 'Dammam', country: 'Saudi Arabia' },
      { city: 'Doha', country: 'Qatar' },
      { city: 'Al Wakrah', country: 'Qatar' },
      { city: 'Al Khor', country: 'Qatar' },
      { city: 'Dubai', country: 'UAE' },
      { city: 'Abu Dhabi', country: 'UAE' },
      { city: 'Sharjah', country: 'UAE' },
      { city: 'Muscat', country: 'Oman' },
      { city: 'Salalah', country: 'Oman' },
      { city: 'Sohar', country: 'Oman' },
      { city: 'Manama', country: 'Bahrain' },
      { city: 'Muharraq', country: 'Bahrain' },
      { city: 'Riffa', country: 'Bahrain' },
      { city: 'Kuwait City', country: 'Kuwait' },
      { city: 'Hawalli', country: 'Kuwait' },
      { city: 'Al Ahmadi', country: 'Kuwait' },
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
    iconKey: 'eastern-europe',
    volatility: 0.55,
    baseRisk: 2,
    color: '#3498db',
    countries: ['Russia', 'Ukraine', 'Belarus', 'Georgia', 'Moldova', 'Serbia', 'Romania', 'Bulgaria', 'Hungary', 'Poland', 'Czech Republic'],
    cities: [
      { city: 'Moscow', country: 'Russia' },
      { city: 'St. Petersburg', country: 'Russia' },
      { city: 'Novosibirsk', country: 'Russia' },
      { city: 'Yekaterinburg', country: 'Russia' },
      { city: 'Volgograd', country: 'Russia' },
      { city: 'Kyiv', country: 'Ukraine' },
      { city: 'Odesa', country: 'Ukraine' },
      { city: 'Kharkiv', country: 'Ukraine' },
      { city: 'Lviv', country: 'Ukraine' },
      { city: 'Minsk', country: 'Belarus' },
      { city: 'Gomel', country: 'Belarus' },
      { city: 'Brest', country: 'Belarus' },
      { city: 'Tbilisi', country: 'Georgia' },
      { city: 'Batumi', country: 'Georgia' },
      { city: 'Kutaisi', country: 'Georgia' },
      { city: 'Chișinău', country: 'Moldova' },
      { city: 'Bălți', country: 'Moldova' },
      { city: 'Tiraspol', country: 'Moldova' },
      { city: 'Belgrade', country: 'Serbia' },
      { city: 'Novi Sad', country: 'Serbia' },
      { city: 'Niš', country: 'Serbia' },
      { city: 'Bucharest', country: 'Romania' },
      { city: 'Cluj-Napoca', country: 'Romania' },
      { city: 'Timișoara', country: 'Romania' },
      { city: 'Sofia', country: 'Bulgaria' },
      { city: 'Plovdiv', country: 'Bulgaria' },
      { city: 'Varna', country: 'Bulgaria' },
      { city: 'Budapest', country: 'Hungary' },
      { city: 'Debrecen', country: 'Hungary' },
      { city: 'Szeged', country: 'Hungary' },
      { city: 'Warsaw', country: 'Poland' },
      { city: 'Kraków', country: 'Poland' },
      { city: 'Gdańsk', country: 'Poland' },
      { city: 'Prague', country: 'Czech Republic' },
      { city: 'Brno', country: 'Czech Republic' },
      { city: 'Ostrava', country: 'Czech Republic' },
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
    iconKey: 'central-asia',
    volatility: 0.70,
    baseRisk: 3,
    color: '#9b59b6',
    countries: ['Afghanistan', 'Pakistan', 'Kazakhstan', 'Uzbekistan', 'Bangladesh', 'Nepal', 'Tajikistan', 'Kyrgyzstan'],
    cities: [
      { city: 'Kabul', country: 'Afghanistan' },
      { city: 'Kandahar', country: 'Afghanistan' },
      { city: 'Herat', country: 'Afghanistan' },
      { city: 'Mazar-i-Sharif', country: 'Afghanistan' },
      { city: 'Islamabad', country: 'Pakistan' },
      { city: 'Lahore', country: 'Pakistan' },
      { city: 'Quetta', country: 'Pakistan' },
      { city: 'Karachi', country: 'Pakistan' },
      { city: 'Peshawar', country: 'Pakistan' },
      { city: 'Almaty', country: 'Kazakhstan' },
      { city: 'Astana', country: 'Kazakhstan' },
      { city: 'Shymkent', country: 'Kazakhstan' },
      { city: 'Tashkent', country: 'Uzbekistan' },
      { city: 'Samarkand', country: 'Uzbekistan' },
      { city: 'Bukhara', country: 'Uzbekistan' },
      { city: 'Dhaka', country: 'Bangladesh' },
      { city: 'Chittagong', country: 'Bangladesh' },
      { city: 'Khulna', country: 'Bangladesh' },
      { city: 'Kathmandu', country: 'Nepal' },
      { city: 'Pokhara', country: 'Nepal' },
      { city: 'Lalitpur', country: 'Nepal' },
      { city: 'Dushanbe', country: 'Tajikistan' },
      { city: 'Khujand', country: 'Tajikistan' },
      { city: 'Kulob', country: 'Tajikistan' },
      { city: 'Bishkek', country: 'Kyrgyzstan' },
      { city: 'Osh', country: 'Kyrgyzstan' },
      { city: 'Jalal-Abad', country: 'Kyrgyzstan' },
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
    iconKey: 'east-asia',
    volatility: 0.40,
    baseRisk: 2,
    color: '#e74c3c',
    countries: ['China', 'North Korea', 'Myanmar', 'Cambodia', 'Laos', 'Thailand', 'Philippines', 'Indonesia', 'Malaysia', 'Vietnam'],
    cities: [
      { city: 'Beijing', country: 'China' },
      { city: 'Shanghai', country: 'China' },
      { city: 'Shenyang', country: 'China' },
      { city: 'Guangzhou', country: 'China' },
      { city: 'Chengdu', country: 'China' },
      { city: 'Pyongyang', country: 'North Korea' },
      { city: 'Hamhung', country: 'North Korea' },
      { city: 'Chongjin', country: 'North Korea' },
      { city: 'Rangoon', country: 'Myanmar' },
      { city: 'Mandalay', country: 'Myanmar' },
      { city: 'Naypyidaw', country: 'Myanmar' },
      { city: 'Phnom Penh', country: 'Cambodia' },
      { city: 'Siem Reap', country: 'Cambodia' },
      { city: 'Battambang', country: 'Cambodia' },
      { city: 'Vientiane', country: 'Laos' },
      { city: 'Luang Prabang', country: 'Laos' },
      { city: 'Savannakhet', country: 'Laos' },
      { city: 'Bangkok', country: 'Thailand' },
      { city: 'Chiang Mai', country: 'Thailand' },
      { city: 'Phuket', country: 'Thailand' },
      { city: 'Manila', country: 'Philippines' },
      { city: 'Cebu', country: 'Philippines' },
      { city: 'Davao', country: 'Philippines' },
      { city: 'Jakarta', country: 'Indonesia' },
      { city: 'Surabaya', country: 'Indonesia' },
      { city: 'Bandung', country: 'Indonesia' },
      { city: 'Medan', country: 'Indonesia' },
      { city: 'Kuala Lumpur', country: 'Malaysia' },
      { city: 'Penang', country: 'Malaysia' },
      { city: 'Johor Bahru', country: 'Malaysia' },
      { city: 'Hanoi', country: 'Vietnam' },
      { city: 'Ho Chi Minh City', country: 'Vietnam' },
      { city: 'Da Nang', country: 'Vietnam' },
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
    iconKey: 'africa',
    volatility: 0.60,
    baseRisk: 2,
    color: '#27ae60',
    countries: ['Libya', 'Sudan', 'Egypt', 'Algeria', 'Nigeria', 'Kenya', 'Somalia', 'Ethiopia', 'Senegal', 'Congo (DRC)', 'Mali', 'Niger', 'Chad'],
    cities: [
      { city: 'Tripoli', country: 'Libya' },
      { city: 'Benghazi', country: 'Libya' },
      { city: 'Misrata', country: 'Libya' },
      { city: 'Khartoum', country: 'Sudan' },
      { city: 'Omdurman', country: 'Sudan' },
      { city: 'Port Sudan', country: 'Sudan' },
      { city: 'Cairo', country: 'Egypt' },
      { city: 'Alexandria', country: 'Egypt' },
      { city: 'Giza', country: 'Egypt' },
      { city: 'Algiers', country: 'Algeria' },
      { city: 'Oran', country: 'Algeria' },
      { city: 'Constantine', country: 'Algeria' },
      { city: 'Lagos', country: 'Nigeria' },
      { city: 'Kano', country: 'Nigeria' },
      { city: 'Abuja', country: 'Nigeria' },
      { city: 'Port Harcourt', country: 'Nigeria' },
      { city: 'Nairobi', country: 'Kenya' },
      { city: 'Mombasa', country: 'Kenya' },
      { city: 'Kisumu', country: 'Kenya' },
      { city: 'Mogadishu', country: 'Somalia' },
      { city: 'Hargeisa', country: 'Somalia' },
      { city: 'Kismayo', country: 'Somalia' },
      { city: 'Addis Ababa', country: 'Ethiopia' },
      { city: 'Dire Dawa', country: 'Ethiopia' },
      { city: 'Mekelle', country: 'Ethiopia' },
      { city: 'Dakar', country: 'Senegal' },
      { city: 'Saint-Louis', country: 'Senegal' },
      { city: 'Thiès', country: 'Senegal' },
      { city: 'Kinshasa', country: 'Congo (DRC)' },
      { city: 'Lubumbashi', country: 'Congo (DRC)' },
      { city: 'Goma', country: 'Congo (DRC)' },
      { city: 'Bamako', country: 'Mali' },
      { city: 'Timbuktu', country: 'Mali' },
      { city: 'Gao', country: 'Mali' },
      { city: 'Niamey', country: 'Niger' },
      { city: 'Zinder', country: 'Niger' },
      { city: 'Maradi', country: 'Niger' },
      { city: "N'Djamena", country: 'Chad' },
      { city: 'Moundou', country: 'Chad' },
      { city: 'Abéché', country: 'Chad' },
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
    iconKey: 'latin-america',
    volatility: 0.35,
    baseRisk: 1,
    color: '#f39c12',
    countries: ['Venezuela', 'Cuba', 'Colombia', 'Nicaragua', 'Honduras', 'Mexico', 'Brazil', 'Bolivia', 'Peru', 'Ecuador'],
    cities: [
      { city: 'Caracas', country: 'Venezuela' },
      { city: 'Maracaibo', country: 'Venezuela' },
      { city: 'Valencia', country: 'Venezuela' },
      { city: 'Havana', country: 'Cuba' },
      { city: 'Santiago de Cuba', country: 'Cuba' },
      { city: 'Camagüey', country: 'Cuba' },
      { city: 'Bogotá', country: 'Colombia' },
      { city: 'Medellín', country: 'Colombia' },
      { city: 'Cali', country: 'Colombia' },
      { city: 'Barranquilla', country: 'Colombia' },
      { city: 'Managua', country: 'Nicaragua' },
      { city: 'León', country: 'Nicaragua' },
      { city: 'Granada', country: 'Nicaragua' },
      { city: 'Tegucigalpa', country: 'Honduras' },
      { city: 'San Pedro Sula', country: 'Honduras' },
      { city: 'La Ceiba', country: 'Honduras' },
      { city: 'Mexico City', country: 'Mexico' },
      { city: 'Guadalajara', country: 'Mexico' },
      { city: 'Monterrey', country: 'Mexico' },
      { city: 'Tijuana', country: 'Mexico' },
      { city: 'São Paulo', country: 'Brazil' },
      { city: 'Rio de Janeiro', country: 'Brazil' },
      { city: 'Brasília', country: 'Brazil' },
      { city: 'Manaus', country: 'Brazil' },
      { city: 'La Paz', country: 'Bolivia' },
      { city: 'Santa Cruz', country: 'Bolivia' },
      { city: 'Cochabamba', country: 'Bolivia' },
      { city: 'Lima', country: 'Peru' },
      { city: 'Arequipa', country: 'Peru' },
      { city: 'Cusco', country: 'Peru' },
      { city: 'Quito', country: 'Ecuador' },
      { city: 'Guayaquil', country: 'Ecuador' },
      { city: 'Cuenca', country: 'Ecuador' },
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
    iconKey: 'western-europe',
    volatility: 0.15,
    baseRisk: 1,
    color: '#2980b9',
    countries: ['France', 'United Kingdom', 'Germany', 'Italy', 'Spain', 'Belgium', 'Netherlands', 'Austria', 'Switzerland', 'Sweden', 'Norway', 'Denmark'],
    cities: [
      { city: 'Paris', country: 'France' },
      { city: 'Lyon', country: 'France' },
      { city: 'Marseille', country: 'France' },
      { city: 'London', country: 'United Kingdom' },
      { city: 'Manchester', country: 'United Kingdom' },
      { city: 'Edinburgh', country: 'United Kingdom' },
      { city: 'Berlin', country: 'Germany' },
      { city: 'Munich', country: 'Germany' },
      { city: 'Hamburg', country: 'Germany' },
      { city: 'Frankfurt', country: 'Germany' },
      { city: 'Rome', country: 'Italy' },
      { city: 'Milan', country: 'Italy' },
      { city: 'Naples', country: 'Italy' },
      { city: 'Madrid', country: 'Spain' },
      { city: 'Barcelona', country: 'Spain' },
      { city: 'Seville', country: 'Spain' },
      { city: 'Brussels', country: 'Belgium' },
      { city: 'Antwerp', country: 'Belgium' },
      { city: 'Ghent', country: 'Belgium' },
      { city: 'Amsterdam', country: 'Netherlands' },
      { city: 'Rotterdam', country: 'Netherlands' },
      { city: 'The Hague', country: 'Netherlands' },
      { city: 'Vienna', country: 'Austria' },
      { city: 'Graz', country: 'Austria' },
      { city: 'Salzburg', country: 'Austria' },
      { city: 'Zurich', country: 'Switzerland' },
      { city: 'Geneva', country: 'Switzerland' },
      { city: 'Bern', country: 'Switzerland' },
      { city: 'Stockholm', country: 'Sweden' },
      { city: 'Gothenburg', country: 'Sweden' },
      { city: 'Malmö', country: 'Sweden' },
      { city: 'Oslo', country: 'Norway' },
      { city: 'Bergen', country: 'Norway' },
      { city: 'Trondheim', country: 'Norway' },
      { city: 'Copenhagen', country: 'Denmark' },
      { city: 'Aarhus', country: 'Denmark' },
      { city: 'Odense', country: 'Denmark' },
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
    iconKey: 'north-america',
    volatility: 0.08,
    baseRisk: 1,
    color: '#1abc9c',
    countries: ['United States', 'Canada'],
    cities: [
      { city: 'Washington D.C.', country: 'United States' },
      { city: 'New York', country: 'United States' },
      { city: 'Los Angeles', country: 'United States' },
      { city: 'Chicago', country: 'United States' },
      { city: 'Houston', country: 'United States' },
      { city: 'Miami', country: 'United States' },
      { city: 'Toronto', country: 'Canada' },
      { city: 'Ottawa', country: 'Canada' },
      { city: 'Vancouver', country: 'Canada' },
      { city: 'Montreal', country: 'Canada' },
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
    iconKey: 'regional-war',
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
    iconKey: 'proxy-conflict',
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
    iconKey: 'insurgency',
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
    iconKey: 'intelligence-war',
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
    iconKey: 'cyber-campaign',
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
    iconKey: 'arms-race',
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
    iconKey: 'civil-unrest',
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
    iconKey: 'regime-change',
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
    iconKey: 'naval-standoff',
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
    iconKey: tmpl.iconKey,
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
      '<div style="font-size:11px;font-weight:700;letter-spacing:0.5px;color:' + theater.color + ';display:flex;align-items:center;gap:4px">' + geoIcon(tmpl.iconKey, theater.color, 12) + ' ' + tmpl.label + '</div>' +
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
  // Swap FIELD_OPS ↔ FOREIGN_OPS and remove COUNTER_INTEL from foreign ops
  if (m.execDepts && Array.isArray(m.execDepts)) {
    for (var di = 0; di < m.execDepts.length; di++) {
      if (!isDomestic && m.execDepts[di] === 'FIELD_OPS') m.execDepts[di] = 'FOREIGN_OPS';
      else if (isDomestic && m.execDepts[di] === 'FOREIGN_OPS') m.execDepts[di] = 'FIELD_OPS';
    }
    if (!isDomestic) m.execDepts = m.execDepts.filter(function(d){ return d !== 'COUNTER_INTEL'; });
  }
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

window.renderGeoPanel = function renderGeoPanel() {
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
          '<div class="geo-event-label">' + (tmpl && tmpl.iconKey ? geoIcon(tmpl.iconKey, theater.color, 11) + ' ' : '') + te.label + '</div>' +
          '<div class="geo-event-progress-wrap">' +
            '<div class="geo-event-progress-fill" style="width:' + progress + '%;background:' + theater.color + '"></div>' +
          '</div>' +
          '<div class="geo-event-remaining">~' + remaining + 'd remaining</div>' +
        '</div>';
      }
    }

    // Network health bar + faction badge + actions (from factions.js)
    var networkHtml = typeof window.renderNetworkBar === 'function' ? window.renderNetworkBar(tid) : '';
    var factionBadge = typeof window.renderFactionBadge === 'function' ? window.renderFactionBadge(tid) : '';
    var actionsHtml = typeof window.renderTheaterActions === 'function' ? window.renderTheaterActions(tid) : '';

    html += '<div class="geo-theater-card' + (theaterEvents.length > 0 ? ' geo-theater-active' : '') + '" style="--theater-color:' + theater.color + '">' +
      '<div class="geo-theater-header">' +
        '<span class="geo-theater-icon">' + geoIcon(theater.iconKey, theater.color, 16) + '</span>' +
        '<span class="geo-theater-name">' + theater.name + factionBadge + '</span>' +
        '<span class="geo-risk-badge ' + riskClass + '">' + riskLabel + '</span>' +
      '</div>' +
      '<div class="geo-risk-bars">' + riskBars + '</div>' +
      networkHtml +
      actionsHtml +
      (eventsHtml ? '<div class="geo-events-list">' + eventsHtml + '</div>' : '') +
    '</div>';
  }

  panel.innerHTML = html;
};

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
