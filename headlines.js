'use strict';
// =============================================================================
// SHADOW DIRECTIVE — Headlines / News Wire System
// Generates realistic press headlines after operations resolve.
// The player's agency is NEVER named publicly. Credit goes to partner agencies.
// =============================================================================

(function () {

  // =========================================================================
  // PUBLIC AGENCY NAME MAP (shortName → press-friendly name)
  // =========================================================================
  const PUBLIC_AGENCIES = {
    // US
    'BUREAU': 'the FBI', 'AGENCY': 'the CIA', 'DIA': 'the Pentagon',
    // UK
    'MI5': 'MI5', 'SIX': 'MI6', 'DI': 'the Ministry of Defence',
    // France
    'DGSI': 'the DGSI', 'DGSE': 'the DGSE', 'DRM': 'French military intelligence',
  };

  // =========================================================================
  // HEADLINE TEMPLATES
  // =========================================================================

  const HEADLINES_SUCCESS_DOMESTIC = [
    '{public_agency} Foils Terror Plot Targeting {target} in {city}',
    'Authorities Announce Arrests in {city} Following Counter-Terror Operation',
    'Security Services Disrupt Planned Attack on {target} in {city}',
    '{public_agency} Confirms Detention of Suspected {group} Operatives',
    'Officials Credit Intelligence Cooperation in Prevention of {city} Attack',
    'Suspected Terror Cell Dismantled in {city}, Sources Say',
    'Multiple Arrests Made in Connection to Planned {attack_type} in {city}',
    '{public_agency} Operation in {city} Leads to Multiple Arrests',
    'Authorities Confirm Disruption of {attack_type} Plot in {city}',
    '{public_agency} Says Planned Attack on {target} Has Been Averted',
    'Law Enforcement Sources Confirm Terror Cell Neutralized in {city}',
    'Senior {group} Operative Detained in {city}, Officials Say',
    '{public_agency} Credits Multi-Agency Effort in {city} Takedown',
    'Threat to {target} in {city} Eliminated, Security Officials Confirm',
  ];

  const HEADLINES_SUCCESS_FOREIGN = [
    'Reports of Targeted Strike in {city}, {country} — No Official Comment',
    'Unconfirmed: Senior Militant Killed in {country} Operation',
    'Officials Decline Comment on Reports of Covert Action in {country}',
    '{country} Government Protests \'Foreign Interference\' After {city} Incident',
    'Western Intelligence Sources Linked to Operation in {city}',
    'Unnamed Officials Confirm Neutralization of High-Value Target in {country}',
    'Security Sources Report Successful Operation Against {group} in {country}',
    'Militant Leader Reported Dead Following {city} Raid — Unconfirmed',
    '{country} Media Reports Foreign-Backed Operation Near {city}',
    'Western Governments Deny Involvement in {city} Incident',
    'Sources: Covert Operation in {country} Yields High-Value Detention',
    'Pentagon Declines Comment on Reported Strike in {city}, {country}',
  ];

  const HEADLINES_FAILURE_QUIET = [
    'Unconfirmed Reports of Security Incident in {city}',
    'Officials Deny Knowledge of Operations Near {city}',
    'Brief Security Alert in {city} Ends Without Incident, Authorities Say',
    'Minor Disturbance Near {target} in {city} Under Investigation',
    'Authorities Dismiss Reports of Intelligence Operation in {city}',
    '{city} Police Cordon Lifted After Brief Alert — No Arrests Made',
    'Witnesses Report Activity Near {target} in {city}; Officials Offer No Comment',
    'Security Presence in {city} Draws Brief Attention, Quickly Disperses',
  ];

  const HEADLINES_FAILURE_NOISY = [
    'Intelligence Failure: {casualties} Dead After Bungled Operation in {city}',
    'Questions Mount Over Secret Government Program After {city} Disaster',
    'Leaked Documents Suggest Unauthorized Covert Operation in {city}',
    '\'Shadow Agency\' Blamed in {city} Intelligence Debacle — {casualties} Casualties',
    'Congressional Inquiry Launched After {city} Raid Goes Wrong',
    'Sources: Rogue Intelligence Unit Behind Failed {city} Operation',
    'Whistleblower Claims Secret Agency Responsible for {city} Catastrophe',
    '{casualties} Dead in {city}: Families Demand Answers on Covert Operation',
    'Unnamed Intelligence Service Under Fire After {city} Operation Kills {casualties}',
    'Investigators Probe Shadow Government Role in {city} Disaster',
    'Opposition Demands Inquiry Into Covert Action That Left {casualties} Dead in {city}',
    'International Outcry After Botched Intelligence Operation in {city}, {country}',
    'Former Officials: {city} Debacle Points to Unauthorized Black Program',
    'Media Obtains Evidence of Secret Operation Behind {city} Tragedy',
  ];

  // =========================================================================
  // HELPER — resolve a public agency name for press credit
  // =========================================================================
  function getPublicAgencyName(mission) {
    // If agency support was used, credit the first supporting agency
    if (mission.agencySupport && mission.agencySupport.length > 0) {
      const agencyId = mission.agencySupport[0].agencyId;
      const agCfg = G.cfg.partnerAgencies?.[agencyId];
      if (agCfg && PUBLIC_AGENCIES[agCfg.shortName]) {
        return PUBLIC_AGENCIES[agCfg.shortName];
      }
    }
    // Default: domestic bureau for domestic ops, foreign agency otherwise
    if (mission.location === 'DOMESTIC') {
      const bureau = G.cfg.partnerAgencies?.BUREAU;
      return bureau ? (PUBLIC_AGENCIES[bureau.shortName] || 'authorities') : 'authorities';
    }
    const agency = G.cfg.partnerAgencies?.AGENCY;
    return agency ? (PUBLIC_AGENCIES[agency.shortName] || 'intelligence officials') : 'intelligence officials';
  }

  // =========================================================================
  // HELPER — fill template placeholders
  // =========================================================================
  function fillHeadline(template, vars) {
    return template.replace(/\{(\w+)\}/g, function (_, key) {
      return vars[key] !== undefined ? vars[key] : key;
    });
  }

  // =========================================================================
  // INIT STATE
  // =========================================================================
  hook('game:start', function () {
    G.headlines = [];
  });

  // =========================================================================
  // GENERATE HEADLINE ON OPERATION RESOLVED
  // =========================================================================
  hook('operation:resolved', function (data) {
    var m = data.mission;
    var success = data.success;
    var isDomestic = m.location === 'DOMESTIC';
    var isNoisy = !success && (m.blown || m.threat >= 4);

    var template, positive, category;

    if (success) {
      if (isDomestic) {
        // Domestic success — always generate, credit public agency
        template = pick(HEADLINES_SUCCESS_DOMESTIC);
        positive = true;
        category = 'domestic';
      } else {
        // Foreign success — 60% chance (covert ops stay quiet)
        if (Math.random() > 0.6) return;
        template = pick(HEADLINES_SUCCESS_FOREIGN);
        positive = true;
        category = 'foreign';
      }
    } else {
      if (isNoisy) {
        // Noisy failure — always generate, reference shadow agency
        template = pick(HEADLINES_FAILURE_NOISY);
        positive = false;
        category = 'failure-noisy';
      } else {
        // Quiet failure — 30% chance
        if (Math.random() > 0.3) return;
        template = pick(HEADLINES_FAILURE_QUIET);
        positive = false;
        category = 'failure-quiet';
      }
    }

    // Build variable map from mission fillVars + extras
    var vars = Object.assign({}, m.fillVars || {}, {
      city: m.city || 'an undisclosed location',
      country: m.country || 'a foreign nation',
      public_agency: getPublicAgencyName(m),
    });

    // Ensure casualties exist for failure headlines
    if (!vars.casualties) {
      vars.casualties = String(randInt(4, 38));
    }

    var text = fillHeadline(template, vars);

    G.headlines.unshift({
      day: G.day,
      text: text,
      positive: positive,
      category: category,
    });

    // Cap at 20 stored headlines
    if (G.headlines.length > 20) {
      G.headlines.length = 20;
    }
  });

  // =========================================================================
  // TICKER RENDERING
  // =========================================================================
  var _styleInjected = false;
  var _tickerIndex = 0;
  var _lastCycleTime = 0;
  var CYCLE_MS = 6000;

  function injectStyle() {
    if (_styleInjected) return;
    _styleInjected = true;
    var style = document.createElement('style');
    style.textContent =
      '#headline-ticker {' +
      '  background: #060810;' +
      '  border-bottom: 1px solid var(--border);' +
      '  padding: 4px 16px;' +
      '  font-family: var(--font-mono);' +
      '  font-size: 10px;' +
      '  letter-spacing: 0.5px;' +
      '  overflow: hidden;' +
      '  white-space: nowrap;' +
      '  height: 24px;' +
      '  display: flex;' +
      '  align-items: center;' +
      '}' +
      '#headline-ticker .wire-label {' +
      '  color: #3a3e50;' +
      '  margin-right: 10px;' +
      '  flex-shrink: 0;' +
      '  font-weight: bold;' +
      '  text-transform: uppercase;' +
      '}' +
      '#headline-ticker .wire-text {' +
      '  overflow: hidden;' +
      '  text-overflow: ellipsis;' +
      '  animation: wire-slide 0.6s ease-out;' +
      '}' +
      '#headline-ticker .wire-text.positive {' +
      '  color: #3a7a4a;' +
      '}' +
      '#headline-ticker .wire-text.negative {' +
      '  color: #7a3a3a;' +
      '}' +
      '#headline-ticker .wire-text.idle {' +
      '  color: #252838;' +
      '}' +
      '#headline-ticker .wire-prefix {' +
      '  color: #4a4e60;' +
      '  margin-right: 6px;' +
      '}' +
      '@keyframes wire-slide {' +
      '  from { opacity: 0; transform: translateX(30px); }' +
      '  to   { opacity: 1; transform: translateX(0); }' +
      '}';
    document.head.appendChild(style);
  }

  function getPrefix(headline) {
    if (!headline) return '[WIRE]';
    if (headline.category === 'failure-noisy') return '[CLASSIFIED]';
    if (headline.category === 'foreign') return '[MEDIA]';
    return '[PRESS]';
  }

  hook('render:after', function () {
    injectStyle();

    var ticker = document.getElementById('headline-ticker');
    if (!ticker) {
      ticker = document.createElement('div');
      ticker.id = 'headline-ticker';
      var agencyBar = document.getElementById('agency-bar');
      if (agencyBar && agencyBar.nextSibling) {
        agencyBar.parentNode.insertBefore(ticker, agencyBar.nextSibling);
      } else if (agencyBar) {
        agencyBar.parentNode.appendChild(ticker);
      } else {
        return; // no anchor point
      }
    }

    // No headlines yet
    if (!G.headlines || G.headlines.length === 0) {
      ticker.innerHTML =
        '<span class="wire-label">[WIRE]</span>' +
        '<span class="wire-text idle">NO PRESS ACTIVITY</span>';
      return;
    }

    // Cycle headlines every CYCLE_MS
    var now = Date.now();
    if (now - _lastCycleTime >= CYCLE_MS) {
      _lastCycleTime = now;
      _tickerIndex = (_tickerIndex + 1) % G.headlines.length;
    }

    var idx = clamp(_tickerIndex, 0, G.headlines.length - 1);
    var h = G.headlines[idx];
    var cls = h.positive ? 'positive' : 'negative';
    var prefix = getPrefix(h);

    ticker.innerHTML =
      '<span class="wire-label">[WIRE]</span>' +
      '<span class="wire-text ' + cls + '">' +
        '<span class="wire-prefix">' + prefix + '</span>' +
        'DAY ' + h.day + ' — ' + h.text.toUpperCase() +
      '</span>';
  });

})();
