'use strict';
// =============================================================================
// SHADOW DIRECTIVE — After-Action Debrief System v2
// Procedurally generates comprehensive operational debriefs with full timelines.
// =============================================================================

(function () {

  // ===========================================================================
  // CSS INJECTION (ensures styles load regardless of stylesheet caching)
  // ===========================================================================

  var _cssInjected = false;
  function injectCSS() {
    if (_cssInjected) return;
    _cssInjected = true;
    var s = document.createElement('style');
    s.textContent =
      '.db-wrap { margin-top:16px; border:1px solid var(--border); border-radius:4px; background:var(--bg-2,rgba(0,0,0,0.2)); overflow:hidden; }' +
      '.db-success { border-left:3px solid var(--green); }' +
      '.db-failure { border-left:3px solid var(--red); }' +
      '.db-toggle { display:flex; align-items:center; gap:10px; padding:12px 16px; cursor:pointer; user-select:none; transition:background 0.2s; }' +
      '.db-toggle:hover { background:rgba(255,255,255,0.03); }' +
      '.db-toggle-arrow { font-size:9px; color:var(--text-muted); transition:transform 0.3s cubic-bezier(0.16,1,0.3,1); display:inline-block; }' +
      '.db-open .db-toggle-arrow { transform:rotate(90deg); }' +
      '.db-toggle-label { font-family:var(--font-disp); font-size:12px; font-weight:700; letter-spacing:1.5px; color:var(--text-dim); }' +
      '.db-open .db-toggle-label { color:var(--text); }' +
      '.db-body { max-height:0; overflow:hidden; transition:max-height 0.5s cubic-bezier(0.16,1,0.3,1),opacity 0.3s ease; opacity:0; border-top:1px solid transparent; }' +
      '.db-open .db-body { max-height:5000px; opacity:1; border-top-color:var(--border); }' +
      '.db-classification { font-family:var(--font-mono); font-size:10px; letter-spacing:2px; color:var(--red,#e84848); padding:14px 18px 4px; opacity:0.7; }' +
      '.db-title { font-family:var(--font-disp); font-size:15px; font-weight:700; letter-spacing:1px; color:var(--text-hi,#fff); padding:2px 18px; }' +
      '.db-subtitle { font-family:var(--font-mono); font-size:11px; color:var(--text-dim); padding:2px 18px 14px; border-bottom:1px solid var(--border); margin-bottom:10px; }' +
      '.db-section-title { font-family:var(--font-disp); font-size:11px; font-weight:700; letter-spacing:1.5px; color:var(--text-dim); padding:12px 18px 6px; text-transform:uppercase; }' +
      '.db-assets { padding:0 18px 8px; display:flex; flex-wrap:wrap; gap:6px; }' +
      '.db-asset-row { display:inline-flex; align-items:center; gap:6px; font-family:var(--font-mono); font-size:10px; padding:4px 10px; border:1px solid var(--border); border-radius:3px; background:rgba(255,255,255,0.02); }' +
      '.db-asset-dept { color:var(--text); font-weight:600; letter-spacing:0.5px; }' +
      '.db-asset-type { color:var(--text-dim); }' +
      '.db-asset-elite { border-color:rgba(46,204,113,0.3); background:rgba(46,204,113,0.04); }' +
      '.db-asset-elite .db-asset-dept { color:var(--green); }' +
      '.db-meta { font-family:var(--font-mono); font-size:10px; color:var(--text-muted); padding:4px 18px 12px; border-bottom:1px solid var(--border); }' +
      '.db-day { font-family:var(--font-disp); font-size:11px; font-weight:700; letter-spacing:1px; color:var(--teal,#00c8b4); padding:10px 18px 4px; }' +
      '.db-event { font-family:var(--font-mono); font-size:11px; line-height:1.7; color:var(--text); padding:3px 18px 3px 36px; position:relative; }' +
      '.db-event::before { content:""; position:absolute; left:24px; top:11px; width:4px; height:4px; border-radius:50%; background:var(--text-dim); }' +
      '.db-time { color:var(--text-dim); margin-right:6px; font-size:10px; letter-spacing:0.5px; }' +
      '.db-assessment { font-family:var(--font-mono); font-size:11px; line-height:1.8; color:var(--text); padding:6px 18px 18px; font-style:italic; }';
    document.head.appendChild(s);
  }

  // Inject immediately
  if (document.head) injectCSS();
  else document.addEventListener('DOMContentLoaded', injectCSS);

  // ===========================================================================
  // HELPERS
  // ===========================================================================

  const P = typeof pick === 'function' ? pick : function (a) { return a[Math.floor(Math.random() * a.length)]; };
  const R = typeof randInt === 'function' ? randInt : function (a, b) { return a + Math.floor(Math.random() * (b - a + 1)); };
  function zp(n) { return n < 10 ? '0' + n : '' + n; }

  // Game date from day number
  const GAME_START = new Date(2025, 0, 6);
  const MO = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];

  function gdate(day) {
    const d = new Date(GAME_START);
    d.setDate(d.getDate() + (day - 1));
    return zp(d.getDate()) + ' ' + MO[d.getMonth()] + ' ' + d.getFullYear();
  }

  function stamp(day, h, m) {
    return gdate(day) + ', ' + zp(h) + zp(m) + 'Z';
  }

  function rtime() { return zp(R(0,23)) + zp(P([0,5,10,15,20,25,30,35,40,45,50,55])) + 'Z'; }

  // Get deployed dept info
  function getUnits(m) {
    var out = [];
    var depts = m.assignedExecDepts || [];
    for (var i = 0; i < depts.length; i++) {
      var cfg = DEPT_CONFIG.find(function(c){ return c.id === depts[i]; });
      out.push({ id: depts[i], name: cfg ? cfg.name : depts[i], short: cfg ? cfg.short : depts[i], unit: cfg ? cfg.unitNameSingle : 'unit' });
    }
    return out;
  }

  // Get attached elite units
  function getElites(m) {
    var out = [];
    var ids = m.attachedEliteIds || [];
    if (typeof G !== 'undefined' && G.eliteUnits) {
      for (var i = 0; i < ids.length; i++) {
        var eu = G.eliteUnits.find(function(u){ return u.id === ids[i]; });
        if (eu) out.push(eu);
      }
    }
    return out;
  }

  function unitList(units) {
    if (!units.length) return 'assigned personnel';
    return units.map(function(u){ return u.short + ' ' + u.unit; }).join(', ');
  }

  function unitShort(units) {
    if (!units.length) return 'assigned teams';
    return units.map(function(u){ return u.short; }).join('/');
  }

  function eliteStr(elites) {
    if (!elites.length) return '';
    return elites.map(function(e){ return e.fullName + ' (' + e.deptName + ')'; }).join(', ');
  }

  // ===========================================================================
  // VOCABULARY POOLS
  // ===========================================================================

  var CALLSIGNS = ['VANGUARD','PHANTOM','RAPTOR','SENTINEL','SHADOW','CONDOR','REAPER','NOMAD','SPECTER','BRAVO','DELTA','ECHO','FOXTROT','ZULU','VALOR','APEX','KEYSTONE','STILETTO','HAMMER','TRIDENT','OVERWATCH','HARBINGER','FALCON','BLACKOUT','TEMPEST','WARDEN','GRYPHON','IRONSIDE','LANCE','ROGUE'];
  var WEATHER = ['Clear skies, visibility unlimited','Overcast, ceiling at 800ft','Light rain, intermittent','Dense fog, visibility under 200m','High winds, 35kt gusting to 50kt','Scattered cloud cover, moonlit','Pre-dawn darkness, new moon','Heavy cloud cover, no moonlight','Drizzle, wet surfaces','Cold front moving through, variable conditions'];
  var BREACH = ['dynamic entry through primary door','coordinated multi-point breach at three entry points','stealth infiltration through rear access','rooftop insertion via fast-rope','vehicle-mounted ram at front gate','underground tunnel approach to basement level','diversionary blast on east wall with primary entry from the west','ladder assault to second-floor windows','explosive breaching of reinforced door','silent lock-bypass entry'];
  var RESIST_LIGHT = ['Targets offered no resistance. All subjects complied with verbal commands.','Minimal resistance. One subject attempted to flee on foot but was tackled by perimeter team.','No armed resistance. Two subjects were non-compliant but were subdued with non-lethal force.','Brief resistance from one individual who was quickly restrained.','Subjects appeared shocked by the speed of entry. Compliance was immediate.'];
  var RESIST_HEAVY = ['Organized defensive fire from multiple positions. Two-way firefight lasting approximately '+R(45,180)+' seconds.','Heavy armed resistance from '+R(3,6)+' individuals using automatic weapons. Suppressive fire required.','Target security opened fire immediately upon breach. Extended room-by-room clearance under fire.','Ambush-style resistance from prepared positions. Team took cover and methodically cleared threats.','Intense initial contact with '+R(2,4)+' armed hostiles. Engagement required tactical withdrawal and re-approach.'];
  var EXFIL = ['rotary-wing extraction via unmarked helicopter','ground vehicle convoy using three armored SUVs','relay through pre-positioned safe house network','commercial cover — targets moved via civilian transport under guard','maritime pickup at pre-arranged coastal rendezvous','overland border crossing using forged documentation','diplomatic vehicle with embassy plates','private aircraft from regional airstrip','underground railroad of agency safe houses across '+R(2,4)+' cities'];
  var EVIDENCE = ['encrypted laptops and mobile phones','hard drives containing operational planning documents','financial ledgers and foreign currency totaling $'+R(50,500)+'K','weapons cache including '+R(2,8)+' firearms and ammunition','forged identity documents for '+R(3,8)+' aliases','surveillance photography of '+R(2,5)+' potential targets','chemical/explosive precursor materials','communications equipment including encrypted radios','maps, floor plans, and reconnaissance notes','USB drives with encrypted files and correspondence'];
  var INTEL_SRC = ['HUMINT source within the target organization','SIGINT intercept of encrypted communications','pattern-of-life analysis over '+R(14,60)+' days','financial intelligence tracing suspicious transactions','partner agency intelligence sharing','satellite imagery analysis','open-source intelligence compilation','defector debriefing','technical surveillance device placement','cyber exploitation of target communications network'];
  var COMPROMISE = ['Counter-surveillance by the target detected our approach team approximately '+R(10,30)+' minutes before H-hour.','An encrypted communication from an unknown source warned the target.','A local informant with ties to the target organization tipped them off.','Electronic jamming equipment failed to suppress the target\'s alert system.','An unplanned civilian encounter during the approach phase created noise that alerted sentries.','The target had pre-positioned early warning lookouts that our intelligence had not identified.','Weather conditions forced a change in approach route, adding '+R(15,40)+' minutes and closing the window.','Operational security was breached through an intercepted radio transmission during staging.'];
  var AFTERMATH_F = ['Full forensic sanitization of all operational sites is underway.','Cover identities used in this operation are being evaluated for potential compromise.','Partner agencies have been notified at minimal-disclosure level per standing protocols.','A comprehensive damage assessment has been initiated.','Post-mortem review board has been convened and will report within 72 hours.','All personnel have been accounted for and extracted to secure locations.','Residual intelligence exploitation of recovered materials continues.','Medical treatment for injured personnel is ongoing; all are in stable condition.','Counter-intelligence sweep of the operational chain has been ordered.'];

  // ===========================================================================
  // TIMELINE BUILDER — Multi-day, detailed
  // ===========================================================================

  /**
   * Build a detailed multi-day timeline. Each entry is { day, events[] }.
   * Outputs formatted HTML lines.
   */
  function timeline(entries) {
    var lines = [];
    for (var i = 0; i < entries.length; i++) {
      var e = entries[i];
      var dayLabel = gdate(e.day);
      lines.push('<div class="db-day">' + dayLabel + '</div>');
      for (var j = 0; j < e.events.length; j++) {
        var ev = e.events[j];
        lines.push('<div class="db-event"><span class="db-time">' + ev.time + '</span> ' + ev.text + '</div>');
      }
    }
    return lines.join('\n');
  }

  // Generate an event at a random time within a range
  function evt(hMin, hMax, text) {
    return { time: rtime(), text: text };
  }

  // Generate a realistic time-ordered set of events for a day
  function dayEvents(events) {
    // Assign hours in ascending order
    var hour = R(0, 4);
    var out = [];
    for (var i = 0; i < events.length; i++) {
      var m = P([0,5,10,15,20,25,30,35,40,45,50,55]);
      out.push({ time: zp(hour) + zp(m) + 'Z', text: events[i] });
      hour += R(1, 3);
      if (hour > 23) hour = 23;
    }
    return out;
  }

  // ===========================================================================
  // SECTION BUILDERS
  // ===========================================================================

  function headerSection(m, success) {
    var cls = P(['TOP SECRET // NOFORN','TOP SECRET // SCI','SECRET // REL FVEY','TOP SECRET // ORCON']);
    var status = success ? 'OBJECTIVES ACHIEVED' : 'OBJECTIVES NOT ACHIEVED';
    return '<div class="db-classification">' + cls + '</div>' +
      '<div class="db-title">AFTER-ACTION REPORT</div>' +
      '<div class="db-subtitle">OP ' + (m.codename || 'UNKNOWN') + ' — ' + status + '</div>';
  }

  function deployedSection(units, elites, m) {
    var rows = '';
    for (var i = 0; i < units.length; i++) {
      rows += '<div class="db-asset-row"><span class="db-asset-dept">' + units[i].short + '</span><span class="db-asset-type">' + units[i].unit + '</span></div>';
    }
    for (var j = 0; j < elites.length; j++) {
      rows += '<div class="db-asset-row db-asset-elite"><span class="db-asset-dept">' + elites[j].fullName + '</span><span class="db-asset-type">' + elites[j].deptName + ' — ELITE</span></div>';
    }
    var budget = m.assignedBudget ? '$' + m.assignedBudget + 'M' : 'CLASSIFIED';
    var prob = m.successProb ? m.successProb + '%' : '—';
    return '<div class="db-section-title">DEPLOYED ASSETS</div>' +
      '<div class="db-assets">' + rows + '</div>' +
      '<div class="db-meta">Budget committed: ' + budget + ' · Pre-operation success assessment: ' + prob + '</div>';
  }

  function assessmentSection(text) {
    return '<div class="db-section-title">ASSESSMENT</div><div class="db-assessment">' + text + '</div>';
  }

  // ===========================================================================
  // CATEGORY GENERATORS — each returns full HTML body
  // ===========================================================================

  function currentDay() { return (typeof G !== 'undefined' && G.day) ? G.day : 1; }

  // ---- COUNTER-TERRORISM (DOMESTIC_TERROR) ----

  function gen_DOMESTIC_TERROR(m, units, elites, success) {
    var cd = currentDay();
    var execDays = m.execDays || R(2,3);
    var opStart = Math.max(1, cd - execDays);
    var cs = P(CALLSIGNS);
    var cs2 = P(CALLSIGNS.filter(function(c){ return c !== cs; }));
    var fv = m.fillVars || {};
    var alias = fv.alias || 'PRIMARY TARGET';
    var target = fv.target || 'the target location';
    var city = fv.city || 'the operational area';
    var cellSize = fv.cell_size || R(3,6);
    var attackType = fv.attack_type || 'planned attack';
    var group = fv.group || 'the threat organization';
    var weather = P(WEATHER);
    var breachMethod = P(BREACH);
    var evidence = P(EVIDENCE);
    var evidence2 = P(EVIDENCE.filter(function(e){ return e !== evidence; }));

    if (success) {
      var entries = [];
      // Day 1: Staging and surveillance
      entries.push({ day: opStart, events: dayEvents([
        cs + ' team assembled at forward staging area. Operational briefing conducted by ' + unitShort(units) + ' command element. Weather assessment: ' + weather + '.',
        'Advance reconnaissance team deployed to ' + city + '. Confirmed target building visual. Building is a ' + P(['two-story residential structure','commercial warehouse','ground-floor apartment complex','mixed-use building in dense urban area','isolated farmhouse compound','row house in residential neighborhood']) + '.',
        'SIGINT intercept team established electronic surveillance perimeter. All target communications monitored in real-time. ' + R(3,8) + ' active devices detected within the target structure.',
        'Surveillance team (' + cs2 + ') reported ' + cellSize + ' individuals observed entering the building over a ' + R(2,5) + '-hour period. Pattern consistent with cell meeting.',
        units.length > 1 ? units[1].short + ' element confirmed no counter-surveillance activity detected around the target area. Approach routes validated.' : 'Counter-surveillance sweep of approach routes completed. All clear.',
      ])});
      // Day 2 (or same day if 2-day op): The assault
      var assaultDay = execDays > 1 ? opStart + Math.max(1, execDays - 1) : opStart;
      entries.push({ day: assaultDay, events: dayEvents([
        'Final intelligence update received. All ' + cellSize + ' subjects confirmed present at target location. GO authorization received from Director.',
        cs + ' assault element departed staging area. ' + R(3,6) + ' vehicles in convoy. Radio silence enforced. ETA to target: ' + R(8,25) + ' minutes.',
        'Outer cordon established by ' + (units[0] ? units[0].short : 'support') + ' team. ' + R(4,8) + ' positions covering all egress points. Local law enforcement discreetly diverted from the area of operations.',
        elites.length ? elites[0].fullName + ' led the primary assault element to breach point. Final equipment check completed. Weapons status confirmed.' : cs + ' team leader confirmed all elements in position. Final equipment check. Weapons hot.',
        'H-HOUR. Breach initiated via ' + breachMethod + '. ' + P(RESIST_LIGHT) + ' Entry to target achieved in under ' + R(8,30) + ' seconds.',
        'Ground floor cleared. ' + R(1,3) + ' subjects detained in the main room. ' + (elites.length ? elites[0].fullName + ' personally secured "' + alias + '" who was found ' + P(['attempting to reach a weapon','destroying documents','hiding in a back room','on a phone call','asleep','sitting at a table with maps spread out']) + '.' : 'Primary target "' + alias + '" located and detained on the ' + P(['ground floor','second floor','in the basement','in a rear bedroom']) + '.'),
        'Building fully cleared room by room. Total subjects detained: ' + cellSize + '. ' + P(['One subject required medical treatment for a minor laceration.','No injuries to any personnel or subjects.','One assault team member sustained a minor bruise during entry — no medical treatment required.',R(1,2) + ' subjects were non-compliant and required physical restraint.']) ,
        'Sensitive site exploitation team entered the building. Evidence recovery initiated. Items catalogued on-site include: ' + evidence + '. Additionally recovered: ' + evidence2 + '.',
        'All ' + cellSize + ' detainees processed, photographed, and biometrically registered. "' + alias + '" positively identified via facial recognition database match. Transport to secure holding facility arranged.',
        'Area of operations fully sanitized. No forensic evidence of agency involvement left on-site. ' + cs + ' team and all support elements returned to base. Operation concluded.',
      ])});
      var assess = 'The operation against the ' + group + ' cell in ' + city + ' achieved all objectives. The planned ' + attackType + ' against ' + target + ' has been permanently disrupted. ' + cellSize + ' operatives are in custody, including cell leader "' + alias + '". ' +
        'Intelligence exploitation of seized materials is the immediate priority — ' + evidence + ' are expected to yield significant insights into the wider network. ' +
        (elites.length ? elites[0].fullName + ' performance during the breach phase was exemplary and directly contributed to the rapid, non-lethal subduing of the primary target. ' : '') +
        'Operational security was maintained throughout. No media or public awareness of the operation has been detected. ' +
        unitShort(units) + ' coordination rated EXCELLENT. Recommend commendation for ' + cs + ' team leader.';

      return headerSection(m, true) + deployedSection(units, elites, m) +
        '<div class="db-section-title">OPERATION TIMELINE</div>' + timeline(entries) +
        assessmentSection(assess);
    } else {
      var entries = [];
      var compromiseReason = P(COMPROMISE);
      entries.push({ day: opStart, events: dayEvents([
        cs + ' team assembled at forward staging area. Final operational briefing conducted. Weather: ' + weather + '.',
        'Advance team deployed for final reconnaissance of target building in ' + city + '. Initial visual confirmed — building appears occupied.',
        'SIGINT monitoring initiated. Target communications active. No indication of target awareness.',
        units.length > 1 ? units[1].short + ' counter-surveillance team completed sweep of approach routes. Routes assessed as clear.' : 'Counter-surveillance sweep completed. Approach routes assessed as viable.',
      ])});
      var failDay = execDays > 1 ? opStart + Math.max(1, execDays - 1) : opStart;
      entries.push({ day: failDay, events: dayEvents([
        'GO authorization received. ' + cs + ' assault element departed staging area. Radio silence enforced.',
        'SIGINT FLASH: Target communications went dark approximately ' + R(15,40) + ' minutes before planned H-hour. All monitored devices simultaneously deactivated. This is a critical indicator of compromise.',
        cs + ' arrived at target location. Outer cordon established. Immediate observation revealed: ' + P(['lights extinguished in the building','a vehicle departing the rear of the property at speed','the front door standing open','no signs of occupancy','evidence of hasty evacuation visible through windows']) + '.',
        'Breach executed as planned via ' + breachMethod + '. Building entered. RESULT: Target structure is EMPTY. Signs of rapid, organized evacuation throughout. ' + P(['Food still warm on the table.','Personal effects abandoned.','Documents partially burned in a metal container.','Electronics wiped and left behind.','Mattresses and bedding present but no clothing.']),
        elites.length ? elites[0].fullName + ' conducted rapid search of the entire structure. Confirmed: all ' + cellSize + ' subjects have fled. No subjects found on premises.' : 'Full building search completed. All ' + cellSize + ' subjects have evacuated. Building is empty.',
        'Forensic exploitation team entered. Limited evidence recovered: ' + P(['a single discarded phone (being analyzed)','partial fingerprints on door handles','residual chemical traces','a few scraps of burned paper','nothing of intelligence value — the site was thoroughly sanitized']) + '.',
        'SIGINT attempted to reacquire target communications. Negative contact. All known numbers and devices are offline.',
        'All teams recalled to staging area. Area of operations abandoned. ' + P(AFTERMATH_F),
      ])});
      var assess = 'The operation failed to achieve its objectives. ' + compromiseReason + ' The cell led by "' + alias + '" evacuated the target location before the assault element could arrive. ' +
        'The planned ' + attackType + ' against ' + target + ' remains a credible and active threat. All ' + cellSize + ' subjects are unlocated and should be considered mobile and aware. ' +
        (elites.length ? elites[0].fullName + ' was deployed but had no opportunity to engage. ' : '') +
        'An immediate counter-intelligence review of the operational chain has been ordered. ' +
        'The source of the compromise must be identified before any re-attempt. ' + P(AFTERMATH_F) + ' ' +
        unitShort(units) + ' performance was professional despite the outcome — the failure originated in the intelligence chain, not execution.';

      return headerSection(m, false) + deployedSection(units, elites, m) +
        '<div class="db-section-title">OPERATION TIMELINE</div>' + timeline(entries) +
        assessmentSection(assess);
    }
  }

  // ---- HVT OPERATIONS (FOREIGN_HVT, DOMESTIC_HVT, LONG_HUNT, ABDUCTION) ----

  function gen_HVT(m, units, elites, success) {
    var cd = currentDay();
    var execDays = m.execDays || R(2,4);
    var opStart = Math.max(1, cd - execDays);
    var cs = P(CALLSIGNS);
    var fv = m.fillVars || {};
    var target = fv.target_name || fv.alias || fv.hvt_name || 'the high-value target';
    var city = fv.city || fv.location || 'the target area';
    var weather = P(WEATHER);
    var isAbduction = (m.typeId || '').indexOf('ABDUCTION') >= 0;

    if (success) {
      var entries = [];
      entries.push({ day: opStart, events: dayEvents([
        'Intelligence package finalized. Target identity and location confirmed via ' + P(INTEL_SRC) + '. Confidence level: HIGH.',
        unitShort(units) + ' operational planning session. Assault plan developed based on site reconnaissance and target pattern-of-life data collected over the preceding ' + R(7,30) + ' days.',
        'Equipment staging and loadout. Specialized equipment for ' + (isAbduction ? 'covert acquisition and transport' : 'direct-action capture') + ' prepared and inspected.',
        elites.length ? elites[0].fullName + ' briefed on primary role: ' + P(['tactical breach lead','target acquisition and handling','overwatch and sniper support','close protection during extraction','technical exploitation on-site']) + '.' : cs + ' team leader assigned tactical roles and confirmed contingency procedures.',
        'Forward staging area established ' + R(3,12) + 'km from target location. Communications check completed. All elements confirmed operational.',
      ])});
      if (execDays > 2) {
        entries.push({ day: opStart + 1, events: dayEvents([
          'Final surveillance pass of target location. Target confirmed present. Security detail observed: ' + R(1,5) + ' armed individuals in a ' + P(['fixed perimeter pattern','rotating patrol','static guard posts at entrance','mobile escort configuration']) + '.',
          'SIGINT confirmed target\'s phone active at location. Voice identification positive. Target is conducting ' + P(['routine business calls','encrypted communications with unknown parties','personal calls — appears relaxed','no calls — device on standby']) + '.',
          'Approach route finalized. Primary: ' + P(['vehicle approach via main road','foot infiltration through adjacent property','approach from elevated terrain to the north','maritime approach along the coastline','helicopter insertion to a nearby clearing']) + '. Alternate route briefed in case of compromise.',
          'Weather forecast for execution window: ' + weather + '. Assessment: ' + P(['FAVORABLE','ACCEPTABLE','CHALLENGING BUT VIABLE','OPTIMAL FOR COVERT OPERATIONS']) + '.',
        ])});
      }
      entries.push({ day: cd, events: dayEvents([
        'H-HOUR MINUS 60. Final intelligence update: target confirmed at location. No unusual activity detected. GO authorization confirmed.',
        cs + ' assault element departed staging area. ' + weather + '. All teams moving to assigned positions.',
        'Outer security perimeter established. ' + R(2,4) + ' escape routes blocked by ' + (units.length > 1 ? units[units.length-1].short : 'support') + ' elements.',
        elites.length ? 'H-HOUR. ' + elites[0].fullName + ' led breach element. Entry via ' + P(BREACH) + '. Security detail ' + P(['neutralized within seconds','overwhelmed before they could react','engaged and suppressed — '+R(1,3)+' hostiles down','bypassed entirely through stealth approach']) + '.' :
          'H-HOUR. Breach initiated via ' + P(BREACH) + '. Security detail ' + P(['neutralized within seconds','overwhelmed before they could react','engaged and suppressed','bypassed through stealth']) + '.',
        'Target located in ' + P(['the main bedroom on the second floor','a ground-floor office','the basement','a reinforced safe room','the kitchen area','a meeting room with associates']) + '. ' + P(RESIST_LIGHT),
        'Target positively identified via ' + P(['biometric facial recognition','fingerprint match','voice comparison','identifying physical characteristics','document verification']) + '. Identity confirmed: ' + target + '.',
        isAbduction ? 'Target sedated per medical protocol and transferred to prepared transport vehicle. Cover story for disappearance will be ' + P(['a reported vehicle accident','a staged domestic dispute','a business trip abroad','no cover — clean disappearance']) + '.' :
          'Target detained and processed. ' + P(['Hands zip-tied, hood applied for transport.','Target was compliant. Moved under escort.','Target initially resistant — subdued with non-lethal holds.','Target surrendered without incident.']) + ' Personal effects and all electronics seized.',
        'Site exploitation team entered. ' + R(10,25) + ' minutes of rapid evidence collection. Items recovered: ' + P(EVIDENCE) + '.',
        'Extraction commenced via ' + P(EXFIL) + '. All teams departed area of operations. No pursuit detected. ' + cs + ' confirmed clean extraction.',
        'Target delivered to ' + P(['secure holding facility','forward operating base for initial interrogation','designated transfer point for onward movement','agency black site','partner nation detention facility']) + '. Chain of custody documented. All ' + unitShort(units) + ' elements accounted for and RTB.',
      ])});

      var assess = 'High-value target ' + target + ' has been successfully ' + (isAbduction ? 'acquired' : 'captured') + ' in ' + city + '. The operation was executed by ' + unitList(units) +
        (elites.length ? ' with elite asset ' + elites[0].fullName + ' attached' : '') + '. Total operation time from breach to extraction: approximately ' + R(25,90) + ' minutes. ' +
        'The target is now in secure custody and ' + P(['initial tactical questioning has begun','is being prepared for extended debriefing','has indicated willingness to cooperate on certain topics','is refusing to communicate — enhanced rapport-building techniques authorized','is providing limited but potentially valuable information']) + '. ' +
        'Seized materials from the target location are undergoing exploitation by the Analysis Bureau. Early assessment suggests ' + P(['significant intelligence value','connections to '+R(2,5)+' previously unknown associates','financial records that may map the target\'s support network','communications that could compromise additional operatives','limited additional intelligence — the target maintained strict operational security']) + '. ' +
        'Operational security was maintained. No attribution to ' + (G.cfg ? G.cfg.acronym : 'our agency') + ' is expected. ' + unitShort(units) + ' performance rated OUTSTANDING.';

      return headerSection(m, true) + deployedSection(units, elites, m) +
        '<div class="db-section-title">OPERATION TIMELINE</div>' + timeline(entries) + assessmentSection(assess);
    } else {
      var entries = [];
      var compReason = P(COMPROMISE);
      entries.push({ day: opStart, events: dayEvents([
        'Intelligence package reviewed. Target location assessed as confirmed. ' + unitShort(units) + ' operation plan approved.',
        'Staging area established. Equipment and personnel pre-positioned. Communications checks completed.',
        elites.length ? elites[0].fullName + ' attached to assault element. Final coordination with ' + cs + ' team leader.' : cs + ' team leader conducted final rehearsal with assault element.',
      ])});
      entries.push({ day: cd, events: dayEvents([
        'GO authorization received. Assault element departed staging. ' + weather + '.',
        'Approach to target area. ' + P(['All clear on primary route.','Minor delay — civilian vehicle on approach road required waiting.','Route clear, team making good time.','Counter-surveillance team reported all clear.']) ,
        P(['On arrival at target compound, immediately apparent that the location has been abandoned. Front door standing open, no vehicles present, no lights.','SIGINT reports: target\'s phone last pinged at this location '+R(4,18)+' hours ago. Currently offline. Probable departure.','Breach executed as planned. Building entered. Target NOT PRESENT. '+R(1,3)+' individuals found on-site — none matching target description.','Surveillance team reports target departed the location by vehicle approximately '+R(1,6)+' hours before assault element arrival. Pursuit attempted — vehicle lost in traffic.']),
        'Full search of premises conducted. ' + P(['Building shows signs of recent, hasty departure. Some personal effects remain.','Location was thoroughly sanitized. Nothing of value left behind.','Found evidence of counter-surveillance equipment — the target knew they were being watched.','A few items recovered but likely of limited intelligence value.','The building appears to be a decoy location. Intelligence was manipulated.']),
        elites.length ? elites[0].fullName + ' confirmed: target has departed. No trail to follow from this location.' : 'Assault team leader confirmed: target is not here. All rooms, outbuildings, and concealment areas checked.',
        'Operation called. All elements withdrawing. ' + P(AFTERMATH_F),
      ])});

      var assess = 'The operation to ' + (isAbduction ? 'acquire' : 'capture') + ' ' + target + ' in ' + city + ' has failed. ' + compReason + ' The target departed the location before the assault could be executed. ' +
        target + ' is now operating with heightened security awareness and will be significantly harder to locate and approach. ' +
        (elites.length ? elites[0].fullName + ' was deployed but had no opportunity to engage the target. ' : '') +
        'Immediate actions: counter-intelligence review of the intelligence chain, reactivation of all HUMINT and SIGINT collection assets in the target area, and assessment of whether the target\'s network has been alerted. ' +
        P(AFTERMATH_F) + ' ' + unitShort(units) + ' execution was professional — the failure lies in the intelligence timeline, not operational performance.';

      return headerSection(m, false) + deployedSection(units, elites, m) +
        '<div class="db-section-title">OPERATION TIMELINE</div>' + timeline(entries) + assessmentSection(assess);
    }
  }

  // ---- RESCUE (ASSET_RESCUE, HOSTILE_RESCUE) ----

  function gen_RESCUE(m, units, elites, success) {
    var cd = currentDay();
    var execDays = m.execDays || R(2,3);
    var opStart = Math.max(1, cd - execDays);
    var cs = P(CALLSIGNS);
    var fv = m.fillVars || {};
    var city = fv.city || fv.location || 'the target area';
    var weather = P(WEATHER);
    var isHostile = (m.typeId || '').indexOf('HOSTILE') >= 0;
    var rescueTarget = isHostile ? P(['the hostage','the captured operative','the detained national','the kidnapped individual']) : P(['the compromised asset','the burned agent','the endangered operative','the at-risk source']);
    var holdingDesc = P(['a fortified compound','an underground facility','a remote rural building','a commercial warehouse','a residential safe house','an abandoned factory']);

    if (success) {
      var entries = [];
      entries.push({ day: opStart, events: dayEvents([
        'Intelligence confirmed: ' + rescueTarget + ' is being held at ' + holdingDesc + ' in ' + city + '. Location identified via ' + P(INTEL_SRC) + '.',
        'Tactical planning session. ' + unitShort(units) + ' developed rescue plan. Primary concern: ' + P(['hostage survival during breach','guard force size and armament','proximity to civilian population','extraction route security','time sensitivity — captors may move the hostage']) + '.',
        'Rehearsal conducted at staging area using improvised mockup of the holding location. ' + (elites.length ? elites[0].fullName + ' designated as rescue team lead.' : cs + ' designated as assault element leader.'),
        'Medical team pre-staged with ' + P(['trauma kit and stretcher','full field surgical capability','sedation and stabilization equipment','emergency medical evacuation helicopter on standby']) + '.',
        'Support asset deployed: ' + P(['ISR drone providing continuous overhead coverage','SIGINT intercept team monitoring all communications in the target area','sniper/observer team established on elevated terrain '+R(200,600)+'m from target','quick reaction force pre-positioned '+R(3,8)+'km from target for contingency']) + '.',
      ])});
      entries.push({ day: cd, events: dayEvents([
        'Final intelligence update: ' + R(3,8) + ' armed guards observed at the holding location. ' + rescueTarget + P([' confirmed alive — visual confirmation through window.',' last heard via intercepted communication '+R(2,6)+' hours ago. Status: believed alive.',' status unknown but no evidence of harm detected.',' confirmed alive by HUMINT source inside the guard force.']) ,
        'H-HOUR MINUS 30. ' + cs + ' team departed staging. ' + weather + '. All elements moving.',
        'Outer cordon established. Escape routes blocked. ' + (units.length > 1 ? units[units.length-1].short + ' team covering rear and flanks.' : 'Support element covering rear.'),
        'H-HOUR. Breach via ' + P(BREACH) + '. ' + (elites.length ? elites[0].fullName + ' first through the door. ' : '') + P(['Flashbang deployed. Guards disoriented.','Simultaneous entry from two points. Guards caught in crossfire.','Stealth approach achieved — first guard neutralized silently.','Explosive breach stunned all occupants.']) ,
        R(2,5) + ' guards engaged. ' + P(['All neutralized within '+R(30,90)+' seconds. No survivors among the guard force.',''+R(1,3)+' killed, remainder surrendered.','All guards suppressed and detained alive.','Brief firefight — all threats eliminated. One guard wounded and detained for questioning.']) + (elites.length ? ' ' + elites[0].fullName + ' cleared the holding area.' : ''),
        rescueTarget.charAt(0).toUpperCase() + rescueTarget.slice(1) + ' located in ' + P(['a locked basement room','a reinforced cell on the ground floor','a second-floor room with barred windows','a shipping container behind the main building','a crude cage in the garage area']) + '. Condition: ' + P(['dehydrated and disoriented but ambulatory','minor injuries consistent with rough handling — able to walk','physically weak but conscious and alert','uninjured — the captors had not harmed the subject','showing signs of stress but no serious physical injuries']) + '.',
        'Medical team moved in immediately. ' + P(['IV fluids administered.','Vital signs stable.','Minor wounds cleaned and dressed.','Subject able to communicate and confirmed identity.','Psychological assessment: shaken but coherent.']) + ' Cleared for transport.',
        'Extraction via ' + P(EXFIL) + '. ' + rescueTarget + ' moved under protective escort. All ' + unitShort(units) + ' teams extracted. No pursuit encountered.',
        rescueTarget.charAt(0).toUpperCase() + rescueTarget.slice(1) + ' delivered to ' + P(['a secure medical facility','the nearest agency installation','a partner nation safe house','an embassy compound','a military base hospital']) + '. Full medical evaluation and debriefing initiated.',
      ])});

      var assess = rescueTarget.charAt(0).toUpperCase() + rescueTarget.slice(1) + ' has been successfully recovered from captivity in ' + city + '. ' +
        unitList(units) + ' executed the rescue in approximately ' + R(15,45) + ' minutes from breach to extraction. ' + R(2,6) + ' hostiles were neutralized. ' +
        (elites.length ? elites[0].fullName + ' led the rescue element with distinction, personally locating and extracting ' + rescueTarget + '. ' : '') +
        'The subject is receiving medical care and will undergo a full debriefing over the coming days. ' +
        'Operational security maintained — no media awareness. Site exploitation recovered ' + P(EVIDENCE) + ' which may provide intelligence on the captor network. ' +
        unitShort(units) + ' performance rated EXCEPTIONAL.';

      return headerSection(m, true) + deployedSection(units, elites, m) +
        '<div class="db-section-title">OPERATION TIMELINE</div>' + timeline(entries) + assessmentSection(assess);
    } else {
      var entries = [];
      entries.push({ day: opStart, events: dayEvents([
        'Intelligence placed ' + rescueTarget + ' at ' + holdingDesc + ' in ' + city + '. Source: ' + P(INTEL_SRC) + '.',
        unitShort(units) + ' developed rescue plan. ' + (elites.length ? elites[0].fullName + ' designated as rescue lead.' : cs + ' assigned as team leader.'),
      ])});
      entries.push({ day: cd, events: dayEvents([
        'Assault element deployed. ' + weather + '.',
        P(['On approach, guards detected the team. Alarm raised. Sound of vehicles — captors moving '+rescueTarget+' to a vehicle.','Breach executed. Building searched thoroughly. '+rescueTarget+' NOT at this location. Intelligence was '+P(['outdated','deliberately falsified','based on a misidentified building','accurate but the captors relocated '+R(6,24)+' hours ago'])+'.','Entry achieved. Intense firefight with '+R(4,8)+' guards. During the engagement, captors executed '+P(['an escape through a pre-prepared tunnel','a vehicle breakout through a back gate','a transfer of '+rescueTarget+' via an underground passage'])+'.','Rescue team reached the holding cell. '+rescueTarget+' '+P(['had been moved within the last few hours — cell empty, still warm','was found deceased — cause of death appears to be '+P(['gunshot wound','blunt force trauma','unknown — autopsy required'])+'. Time of death estimated '+R(6,36)+' hours prior.','had already been relocated to an unknown secondary site.'])] ),
        'Operation called. All elements withdrawing. ' + (elites.length ? elites[0].fullName + ' confirmed no trace of ' + rescueTarget + ' at the location. ' : '') + P(AFTERMATH_F),
        unitShort(units) + ' teams extracted safely. ' + P(['No friendly casualties.', R(1,2) + ' team members sustained minor injuries during the firefight.','All personnel accounted for.']),
      ])});

      var assess = 'The rescue operation for ' + rescueTarget + ' in ' + city + ' has failed. ' +
        P(['The subject was not at the target location.','The captors were alerted and moved the subject before the assault.','Intelligence was faulty — the location was incorrect.','The subject had already been relocated.']) + ' ' +
        rescueTarget.charAt(0).toUpperCase() + rescueTarget.slice(1) + ' remains in captivity at an unknown location. ' +
        (elites.length ? elites[0].fullName + ' was deployed but the situation did not permit a successful rescue. ' : '') +
        'Immediate priority: re-establishing intelligence on ' + rescueTarget + '\'s location. Every hour increases the risk to the subject. ' + P(AFTERMATH_F);

      return headerSection(m, false) + deployedSection(units, elites, m) +
        '<div class="db-section-title">OPERATION TIMELINE</div>' + timeline(entries) + assessmentSection(assess);
    }
  }

  // ---- COUNTER-INTELLIGENCE / MOLE HUNT ----

  function gen_COUNTERINTEL(m, units, elites, success) {
    var cd = currentDay();
    var execDays = m.execDays || R(3,5);
    var opStart = Math.max(1, cd - execDays);
    var cs = P(CALLSIGNS);
    var fv = m.fillVars || {};
    var city = fv.city || 'headquarters area';

    if (success) {
      var entries = [];
      entries.push({ day: opStart, events: dayEvents([
        'Counter-intelligence investigation entered decisive phase. ' + unitShort(units) + ' compiled findings from the preceding investigation period.',
        'Canary trap methodology deployed: ' + R(3,6) + ' unique documents seeded through the suspect pool. Each variant contained traceable modifications invisible to the reader.',
        'Physical surveillance authorized on primary suspect. ' + (elites.length ? elites[0].fullName + ' assigned to the surveillance detail.' : 'Two-person surveillance teams established rotating coverage.'),
        'Digital forensics team initiated covert monitoring of suspect\'s workstation access patterns, email traffic, and file transfers.',
      ])});
      if (execDays > 2) {
        entries.push({ day: opStart + 1, events: dayEvents([
          'Canary trap result: leaked document matched the variant provided to the primary suspect. Correlation confidence: ' + R(90,99) + '%.',
          'Surveillance observed suspect making an unscheduled stop at ' + P(['a public park','a coffee shop','a hotel lobby','a parking garage','a bookstore','a mall food court']) + '. Duration: ' + R(8,25) + ' minutes. Possible meeting.',
          'Financial review completed. Suspect\'s accounts show ' + P(['unexplained deposits totaling $'+R(30,200)+'K over '+R(6,18)+' months','a lifestyle inconsistent with declared income','transfers to offshore accounts through multiple shell entities','large cash withdrawals on dates that correlate with known leak incidents','no obvious financial anomalies — suspect may be ideologically motivated']) + '.',
          'SIGINT intercept: suspect\'s personal phone placed a call to a number associated with ' + P(['a known foreign intelligence front organization','an individual under existing counter-intelligence investigation','a diplomatic mission of a hostile nation','an encrypted messaging service frequently used by foreign intelligence','a previously unidentified number — now flagged for monitoring']) + '.',
        ])});
      }
      entries.push({ day: cd, events: dayEvents([
        'Decision made to move to arrest. Evidence package reviewed by internal legal counsel: assessed as SUFFICIENT for prosecution and internal action.',
        'Arrest team assembled. ' + cs + ' designated as lead. Location: suspect is currently at ' + P(['their desk in the operations center','a meeting in the conference room','the parking garage about to leave for the day','the cafeteria','their personal vehicle in the parking lot']) + '.',
        'Suspect approached by ' + cs + ' team. ' + P(['Suspect immediately requested legal counsel. Declined to make any statement.','Suspect appeared shocked. Made spontaneous admissions before being advised of rights.','Suspect attempted to destroy their phone by smashing it — device partially recovered.','Suspect was calm and cooperative. Stated: "I knew this day would come."','Suspect became agitated and attempted to flee — restrained by security.']) ,
        'Suspect\'s workspace secured and sealed. Digital forensics team began imaging all devices. Personal effects catalogued. ' + P(['A one-time pad was found in the suspect\'s desk drawer.','An unauthorized encrypted USB drive was recovered from the suspect\'s bag.','A burner phone with foreign SIM card was found in the suspect\'s coat pocket.','Hidden notes with meeting locations and dates were found in a hollowed-out book.','No additional incriminating materials found at the workspace — suspect maintained strict discipline.']) ,
        'Suspect\'s residence searched under judicial authority. Recovery included: ' + P(EVIDENCE) + '.',
        'Suspect transferred to secure detention facility. Formal interrogation scheduled. Damage assessment team mobilized to review all programs and operations the suspect had access to.',
        'Full access audit initiated: suspect held ' + P(['TS/SCI clearance with access to '+R(5,15)+' compartmented programs','SECRET clearance with broad access to operational databases','TS clearance with access to source identities and agent networks','clearance to personnel files, travel records, and internal communications']) + '. Scope of potential compromise: ' + P(['SEVERE','SIGNIFICANT','MODERATE — access was somewhat limited','UNDER ASSESSMENT — full scope not yet determined']) + '.',
      ])});

      var assess = 'The counter-intelligence investigation has successfully identified and neutralized an insider threat. The suspect had been passing classified information to ' + P(['a hostile foreign intelligence service','an adversary nation\'s intelligence apparatus','a non-state actor with intelligence capabilities','a foreign government via an intermediary network']) + ' for an estimated ' + R(3,24) + ' months. ' +
        unitList(units) + ' conducted the investigation with appropriate discretion, preventing the suspect from learning of the inquiry until the arrest. ' +
        (elites.length ? elites[0].fullName + ' was instrumental during the surveillance phase, documenting critical meetings that established the suspect\'s guilt. ' : '') +
        'Damage assessment is the immediate priority. All operations and sources the suspect had access to must be evaluated for compromise. Preliminary estimates suggest ' + R(5,40) + ' intelligence products may have been passed to the adversary. ' +
        'The suspect is in custody and formal interrogation will commence within 24 hours.';

      return headerSection(m, true) + deployedSection(units, elites, m) +
        '<div class="db-section-title">OPERATION TIMELINE</div>' + timeline(entries) + assessmentSection(assess);
    } else {
      var entries = [];
      entries.push({ day: opStart, events: dayEvents([
        'Investigation focused on primary suspect. ' + unitShort(units) + ' initiated surveillance and canary trap protocols.',
        'Canary documents distributed through suspect pool.',
      ])});
      entries.push({ day: cd, events: dayEvents([
        P(['Canary trap produced inconclusive results — no leaked document matched a single variant.','Surveillance detected that the suspect has become aware of scrutiny. Suspect altered daily patterns and began counter-surveillance runs.','Investigation stalled. Digital forensics found no unauthorized access from monitored accounts. Suspect appears to be using methods outside our monitoring scope.','Suspect abruptly resigned citing "personal reasons." Submitted resignation effective immediately and departed the building before arrest authority could be obtained.','Suspect was found to have destroyed personal devices and sanitized their workspace overnight. Evidence preservation failed.']),
        (elites.length ? elites[0].fullName + ' reported the suspect\'s evasive behavior indicates professional counter-intelligence training.' : 'Assessment: suspect demonstrates counter-intelligence awareness beyond what was anticipated.'),
        'Investigation suspended. ' + P(AFTERMATH_F),
      ])});

      var assess = 'The counter-intelligence investigation has failed to conclusively identify and neutralize the insider threat. ' +
        P(['The suspect detected the investigation and took evasive action before sufficient evidence could be gathered.','The canary trap methodology failed to produce definitive results, suggesting the leak may operate through channels we have not identified.','The suspect fled before an arrest could be executed.','Insufficient evidence was gathered for prosecution or internal action.']) + ' ' +
        'The leak may still be active. Intelligence damage continues to accumulate. ' +
        (elites.length ? elites[0].fullName + ' notes the suspect\'s tradecraft suggests professional intelligence training. ' : '') +
        'A fundamental reassessment of investigative approach is required. ' + P(AFTERMATH_F);

      return headerSection(m, false) + deployedSection(units, elites, m) +
        '<div class="db-section-title">OPERATION TIMELINE</div>' + timeline(entries) + assessmentSection(assess);
    }
  }

  // ---- RENDITION ----

  function gen_RENDITION(m, units, elites, success) {
    var cd = currentDay();
    var execDays = m.execDays || R(2,3);
    var opStart = Math.max(1, cd - execDays);
    var cs = P(CALLSIGNS);
    var fv = m.fillVars || {};
    var target = fv.target_name || fv.alias || 'the subject';
    var city = fv.city || 'the operational area';

    if (success) {
      var entries = [];
      entries.push({ day: opStart, events: dayEvents([
        'Target pattern of life established over preceding ' + R(7,21) + ' days. Target follows a ' + P(['predictable daily routine','semi-regular pattern with some variation','highly irregular schedule requiring adaptive planning']) + '.',
        'Rendition plan approved by Director. Legal authorities confirmed under ' + P(['covert action finding','executive order','bilateral intelligence agreement','standing rendition authority']) + '.',
        unitShort(units) + ' acquisition team assembled. Specialized equipment: ' + P(['sedation kit with medical supervision','covert transport vehicle with concealed compartment','false identity documents for target\'s cover story','biometric spoofing equipment for border controls']) + '.',
        'Transfer logistics confirmed. Route: ' + city + ' → ' + P(['regional airstrip ('+R(30,120)+'km)','safe house network ('+R(3,5)+' waypoints)','maritime extraction point','border crossing with pre-arranged passage','embassy vehicle to diplomatic compound']) + ' → final destination.',
      ])});
      entries.push({ day: cd, events: dayEvents([
        'Final confirmation: target at expected location following predicted routine. ' + cs + ' team deployed.',
        'Acquisition point selected: ' + P(['a quiet side street during target\'s morning walk','the parking structure beneath target\'s office building','a gas station on target\'s commute route','target\'s apartment building entrance at '+rtime(),'a restaurant where target dines regularly']) + '.',
        cs + ' approach team made contact. Target ' + P(['was approached by two operatives posing as local police. Complied with instructions.','was intercepted exiting a vehicle. Sedated within '+R(5,15)+' seconds. No witnesses.','was invited into a vehicle by an operative posing as an associate. Once inside, secured.','struggled briefly before being subdued with a sedative injection. Duration of resistance: under '+R(10,30)+' seconds.']) ,
        (elites.length ? elites[0].fullName + ' supervised target handling and medical monitoring during initial transport phase.' : 'Target transferred to prepared vehicle. Medical monitoring initiated.'),
        'Counter-surveillance team confirmed: acquisition was clean. No witnesses. No CCTV in the area. ' + P(['Dummy vehicle staged at scene to delay discovery.','Target\'s phone powered down and placed in Faraday bag.','Target\'s vehicle moved to a different location.','Scene sanitized within '+R(3,8)+' minutes of acquisition.']),
        'Target transported to transfer point. In transit: target ' + P(['remained sedated and stable.','regained consciousness but was controlled.','was conscious and compliant throughout.','required additional sedation during transport.']) ,
        'Arrival at ' + P(['designated airstrip. Target loaded onto chartered aircraft.','safe house #1. Target held for '+R(2,6)+' hours before onward movement.','maritime rendezvous point. Target transferred to vessel.','embassy compound. Documentation prepared for next phase.']) ,
        'Target delivered to final destination: ' + P(['secure interrogation facility','partner nation detention center','agency black site','military detention facility']) + '. Handoff documented. Chain of custody complete.',
        'All ' + unitShort(units) + ' elements have returned to base. Operational sites sanitized. Cover story for target\'s disappearance: ' + P(['staged vehicle accident','reported missing by "concerned friend" (agency asset)','business trip abroad','no cover story — clean disappearance preferred','target\'s phone will send automated messages for '+R(2,5)+' days']) + '.',
      ])});

      var assess = 'Target has been successfully rendered from ' + city + ' to a secure facility. The acquisition was clean with no witnesses, no public exposure, and no law enforcement involvement. ' +
        unitList(units) + ' executed the operation precisely. ' +
        (elites.length ? elites[0].fullName + ' provided critical medical supervision and target handling expertise. ' : '') +
        'Target is now available for interrogation. ' +
        'The cover story for the target\'s disappearance is in place. Monitoring of target\'s associates and family has been initiated to detect any suspicion or inquiries. As of this report, no anomalies detected.';

      return headerSection(m, true) + deployedSection(units, elites, m) +
        '<div class="db-section-title">OPERATION TIMELINE</div>' + timeline(entries) + assessmentSection(assess);
    } else {
      var entries = [];
      entries.push({ day: opStart, events: dayEvents([
        'Rendition plan approved. ' + unitShort(units) + ' acquisition team staged.',
      ])});
      entries.push({ day: cd, events: dayEvents([
        cs + ' team deployed to acquisition point. ' + P(WEATHER) + '.',
        P(['Target arrived at acquisition point but accompanied by '+R(2,4)+' unexpected associates. Acquisition in presence of witnesses was assessed as non-viable.','Target deviated from established routine. Did not appear at the acquisition point. Alternate locations checked — negative.','Acquisition initiated but target resisted loudly. A passerby intervened. Local police were called. Team forced to disengage and withdraw.','Target\'s vehicle was intercepted but a second vehicle with unknown occupants was following. Possible security detail or counter-surveillance. Operation aborted to protect the rendition network.','On approach, team identified what appeared to be a surveillance camera not present in previous reconnaissance. Risk of identification forced abort.']),
        'Emergency withdrawal executed. All team members extracted via ' + P(['pre-planned exfiltration route','emergency vehicle swap','on-foot dispersal to safe houses','diplomatic vehicle']) + '. ' + P(AFTERMATH_F),
      ])});

      var assess = 'The rendition operation has failed. Target ' + target + ' remains free and is now likely aware that an acquisition attempt was made. ' +
        'The target will be extremely difficult to reacquire — expect enhanced personal security, altered routines, and possible relocation. ' +
        (elites.length ? elites[0].fullName + ' managed the emergency withdrawal professionally. ' : '') +
        P(AFTERMATH_F) + ' ' + unitShort(units) + ' team was not compromised — identities remain secure.';

      return headerSection(m, false) + deployedSection(units, elites, m) +
        '<div class="db-section-title">OPERATION TIMELINE</div>' + timeline(entries) + assessmentSection(assess);
    }
  }

  // ---- REGIME OP ----

  function gen_REGIME(m, units, elites, success) {
    var cd = currentDay();
    var execDays = m.execDays || R(3,5);
    var opStart = Math.max(1, cd - execDays);
    var fv = m.fillVars || {};
    var city = fv.city || fv.location || 'the theater of operations';

    if (success) {
      var entries = [];
      entries.push({ day: opStart, events: dayEvents([
        'Covert operations network activated in-country. Ground team confirmed ' + R(5,15) + ' local assets operational and ready.',
        unitShort(units) + ' elements infiltrated the area of operations over the preceding ' + R(24,72) + ' hours using ' + P(['commercial cover','diplomatic credentials','NGO cover','military liaison cover','journalist credentials']) + '.',
        'Communications established with local opposition leadership. Coordination plan confirmed. Opposition elements will execute their actions on signal.',
      ])});
      if (execDays > 2) {
        entries.push({ day: opStart + Math.floor(execDays/2), events: dayEvents([
          'Phase 1 initiated: ' + P(['information operation launched — regime communications disrupted via cyber intrusion','key infrastructure target disabled through sabotage','financial disruption — regime accounts frozen through partner banking channels','media operation — leaked documents undermining regime credibility distributed','key regime official approached and turned — defection agreement secured']) + '.',
          'Regime security forces responded to Phase 1. Assessment: ' + P(['confused and disorganized','reactive but unfocused','effective in some areas but spread thin','paralyzed by contradictory orders from competing factions within the regime']) + '.',
          (elites.length ? elites[0].fullName + ' coordinated directly with local opposition forces, providing ' + P(['tactical guidance','communications support','weapons training','intelligence on regime force positions']) + '.' : 'Agency liaison maintained coordination with opposition elements.'),
        ])});
      }
      entries.push({ day: cd, events: dayEvents([
        'Phase 2: Local opposition elements executed coordinated actions across ' + R(2,5) + ' locations. ' + P(['Government buildings occupied','Key transportation routes blocked','Regime military units defected and joined opposition','Broadcasting facilities seized — opposition message now on national media','Border crossings taken by opposition forces']) + '.',
        'Regime control in the target area ' + P(['collapsed','degraded significantly','weakened to the point of non-functionality','fractured along ethnic/tribal lines as predicted']) + '.',
        'All agency personnel commenced withdrawal per exfiltration plan. ' + P(['All foreign operatives extracted via '+P(['helicopter','overland route','maritime pickup'])+'.','Two operatives delayed at checkpoint — resolved through bribery. All eventually extracted.','Extraction clean. No agency personnel remain in-country.']) ,
        'Post-operation assessment transmitted. Regime stability in the target area degraded by an estimated ' + R(20,50) + '%. Mission objectives achieved.',
      ])});

      var assess = 'The covert operation to destabilize the regime in ' + city + ' has achieved its primary objectives. ' + unitList(units) + ' maintained deniability throughout. ' +
        (elites.length ? elites[0].fullName + ' provided exceptional on-the-ground coordination with local forces. ' : '') +
        'No attribution to ' + (G.cfg ? G.cfg.acronym : 'our agency') + ' is expected. The strategic effects will compound over the coming weeks as the regime struggles to respond. ' +
        'All agency personnel and assets have been extracted. Local opposition elements are operating independently as planned.';

      return headerSection(m, true) + deployedSection(units, elites, m) +
        '<div class="db-section-title">OPERATION TIMELINE</div>' + timeline(entries) + assessmentSection(assess);
    } else {
      var entries = [];
      entries.push({ day: opStart, events: dayEvents([
        unitShort(units) + ' initiated the operation. Ground assets activated.',
        'Local opposition elements notified. Coordination commenced.',
      ])});
      entries.push({ day: cd, events: dayEvents([
        P(['Local assets failed to execute coordinated actions — the network was penetrated by regime counter-intelligence.','Opposition elements were arrested before they could act. '+R(3,8)+' local assets are now in regime custody.','Regime security forces preemptively deployed to all planned target locations. Intelligence leaked.','An agency operative was identified by regime security. Emergency extraction triggered for all foreign personnel.']),
        (elites.length ? elites[0].fullName + ' organized the emergency withdrawal, ensuring all agency personnel reached extraction points.' : 'Emergency extraction initiated for all foreign personnel.'),
        'All agency elements extracted via ' + P(EXFIL) + '. ' + P([R(1,2)+' team members sustained minor injuries during the withdrawal.','No friendly casualties.','All personnel accounted for.']) ,
        P(AFTERMATH_F),
      ])});

      var assess = 'The regime operation has failed. The local network was compromised, likely through regime counter-intelligence penetration. ' +
        R(2,8) + ' local assets are unaccounted for and presumed detained. All agency personnel have been extracted. ' +
        (elites.length ? elites[0].fullName + ' ensured safe extraction despite the compromise. ' : '') +
        'The regime is now aware of external interference and will harden its defenses accordingly. ' + P(AFTERMATH_F);

      return headerSection(m, false) + deployedSection(units, elites, m) +
        '<div class="db-section-title">OPERATION TIMELINE</div>' + timeline(entries) + assessmentSection(assess);
    }
  }

  // ---- SURVEILLANCE (HVT_SURVEILLANCE_DOM/FOR) ----

  function gen_SURVEILLANCE(m, units, elites, success) {
    var cd = currentDay();
    var execDays = m.execDays || R(3,5);
    var opStart = Math.max(1, cd - execDays);
    var fv = m.fillVars || {};
    var target = fv.target_name || fv.alias || 'the target';
    var city = fv.city || 'the operational area';

    if (success) {
      var entries = [];
      entries.push({ day: opStart, events: dayEvents([
        'Surveillance operation initiated. ' + unitShort(units) + ' deployed observation teams to ' + city + '.',
        'Primary observation post established at ' + P(['an elevated position '+R(150,400)+'m from target\'s known location','a rented apartment with direct line of sight','a commercial vehicle parked on the target\'s street','a cooperating business adjacent to the target\'s routine path']) + '.',
        'SIGINT coverage initiated: ' + P(['target phone IMSI captured and monitored','email and messaging accounts under passive collection','all communications within '+R(200,500)+'m radius intercepted and filtered','known associate communications also brought under coverage']) + '.',
        'Technical surveillance device emplaced: ' + P(['audio device in target\'s vehicle','tracking beacon on target\'s primary vehicle','covert camera covering building entrance','network tap on target\'s WiFi router']) + '.',
      ])});
      for (var d = 1; d < Math.min(execDays, 4); d++) {
        var dayNum = opStart + d;
        if (dayNum >= cd) break;
        entries.push({ day: dayNum, events: dayEvents([
          'Day ' + (d+1) + ' surveillance log: Target ' + P(['followed routine pattern. Departed residence at '+rtime()+', arrived at known location at '+rtime()+'.','deviated from routine — visited an unfamiliar address for '+R(30,120)+' minutes. Address logged for investigation.','met with '+R(1,3)+' previously unknown individual(s) at '+P(['a café','a park bench','a vehicle in a parking lot','a restaurant','an office building lobby'])+'. Photos captured.','remained at primary location all day. '+R(5,15)+' phone calls intercepted.','traveled to '+R(2,3)+' locations. All documented with photo/video evidence.']),
          P(['SIGINT captured '+R(3,12)+' communications of intelligence value.','Financial transaction detected: target made a '+P(['cash deposit','wire transfer','cryptocurrency transaction','cash withdrawal'])+' of approximately $'+R(1,50)+'K.','Target conducted what appears to be a counter-surveillance run — drove an evasive route for '+R(15,40)+' minutes before returning to routine. Our team was NOT detected.','Associate identified: '+P(['a known member of the target organization','a previously unknown contact — now flagged for investigation','a diplomatic figure from a '+P(['hostile','neutral','allied'])+' nation','a financial intermediary'])+'.','No significant activity this period. Target appears to be in a holding pattern.']),
        ])});
      }
      entries.push({ day: cd, events: dayEvents([
        'Final collection day. All remaining intelligence gaps addressed.',
        'Surveillance package withdrawn. ' + P(['All technical devices recovered.','Audio device left in place for continued collection.','Observation posts sanitized — no forensic evidence of our presence.','All teams extracted sequentially to avoid pattern recognition.']) ,
        'Final intelligence package compiled: ' + R(15,50) + ' pages of analysis, ' + R(50,200) + ' photographs, ' + R(10,100) + ' communications intercepts, and complete pattern-of-life documentation.',
      ])});

      var assess = 'Extended surveillance of ' + target + ' in ' + city + ' has been completed. ' + unitList(units) + ' maintained covert observation for ' + execDays + ' days without detection. ' +
        (elites.length ? elites[0].fullName + ' identified critical patterns and contacts that were not previously known. ' : '') +
        'Key products: complete pattern of life, ' + R(2,5) + ' safe house locations, ' + R(3,8) + ' associate identities, communications patterns mapped, and security detail assessment (' + R(1,5) + ' personnel). ' +
        'This intelligence package enables high-confidence direct-action planning against the target.';

      return headerSection(m, true) + deployedSection(units, elites, m) +
        '<div class="db-section-title">OPERATION TIMELINE</div>' + timeline(entries) + assessmentSection(assess);
    } else {
      var entries = [];
      entries.push({ day: opStart, events: dayEvents([
        'Surveillance teams deployed to ' + city + '. Observation positions established.',
        'Initial collection began. Target sighted at known location.',
      ])});
      entries.push({ day: cd, events: dayEvents([
        P(['Target conducted aggressive counter-surveillance and identified our observation team. Target made eye contact with surveillance operative and immediately altered behavior.','Target\'s security detail detected our technical surveillance device. Device removed and destroyed. Target is now aware of monitoring.','Target departed the area entirely. SIGINT indicates relocation to unknown location. All collection lost.','Local security services questioned our surveillance team, compromising the operation. Team extracted using cover identities.']),
        'Surveillance operation terminated. ' + P(AFTERMATH_F),
        (elites.length ? elites[0].fullName + ' recommended immediate suspension to prevent further compromise.' : 'Assessment: continuing surveillance would risk further compromise.'),
      ])});

      var assess = 'The surveillance operation against ' + target + ' has failed. The target became aware of our monitoring, rendering all further collection at this location non-viable. ' +
        (elites.length ? elites[0].fullName + ' assessed that the target\'s counter-surveillance training is at a professional level. ' : '') +
        'Intelligence collected before compromise has partial value but the target has now changed patterns, locations, and communications. Reestablishing surveillance will require a fundamentally different approach and significant time investment. ' + P(AFTERMATH_F);

      return headerSection(m, false) + deployedSection(units, elites, m) +
        '<div class="db-section-title">OPERATION TIMELINE</div>' + timeline(entries) + assessmentSection(assess);
    }
  }

  // ---- ORG INFILTRATION / ORG TAKEDOWN / SURVEILLANCE_TAKEDOWN ----

  function gen_ORG(m, units, elites, success) {
    var cd = currentDay();
    var execDays = m.execDays || R(2,4);
    var opStart = Math.max(1, cd - execDays);
    var fv = m.fillVars || {};
    var city = fv.city || fv.location || 'the target area';
    var isTakedown = (m.typeId || '').indexOf('TAKEDOWN') >= 0;

    if (success && isTakedown) {
      var entries = [];
      entries.push({ day: opStart, events: dayEvents([
        'Coordinated takedown operation authorized. Intelligence package confirmed: ' + R(3,7) + ' target locations identified across ' + city + ' area.',
        unitShort(units) + ' assembled ' + R(3,6) + ' simultaneous assault teams. Each team briefed on their specific target location, expected occupants, and rules of engagement.',
        'Synchronization plan established. All teams will execute simultaneously at H-hour to prevent targets from warning each other.',
        (elites.length ? elites[0].fullName + ' assigned to lead the raid on the primary target — the organization\'s leadership location.' : 'Senior team leader assigned to the primary target location.'),
      ])});
      entries.push({ day: cd, events: dayEvents([
        'H-HOUR. Simultaneous raids commenced at ' + R(3,7) + ' locations across ' + city + '.',
        'Location 1 (primary — leadership): ' + P(BREACH) + '. ' + R(2,5) + ' senior organization members detained. ' + P(RESIST_LIGHT),
        'Location 2 (logistics): ' + R(3,8) + ' individuals detained. ' + P(EVIDENCE) + ' recovered. Significant financial records seized.',
        'Location 3 (communications): ' + P(['Organization\'s communications hub dismantled. '+R(5,12)+' devices seized.','Encrypted radio equipment and code books recovered.','Server equipment imaged and seized.']) ,
        R(1,3) + ' additional locations raided. Combined detainees: ' + R(12,30) + ' individuals in first wave.',
        'Second wave operations over the following ' + R(6,18) + ' hours: ' + R(5,12) + ' additional arrests based on intelligence from first-wave interrogations and seized communications.',
        'Organization financial assets frozen through ' + P(['partner banking channels','judicial orders','bilateral agreements']) + '. Estimated value: $' + R(500, 5000) + 'K.',
        'All raid locations turned over to forensic exploitation teams. ' + unitShort(units) + ' teams returning to base.',
      ])});

      var assess = 'The coordinated takedown has effectively destroyed the target organization\'s operational capability in ' + city + '. ' +
        R(15,35) + ' individuals detained including ' + R(2,5) + ' senior leaders. Financial networks disrupted. Communications infrastructure dismantled. ' +
        (elites.length ? elites[0].fullName + ' led the critical leadership raid and personally secured the organization\'s top commander. ' : '') +
        'The organization\'s ability to reconstitute is assessed as LOW. Ongoing exploitation of seized materials is expected to yield intelligence on partner organizations and external support networks. ' +
        unitShort(units) + ' coordination across ' + R(3,7) + ' simultaneous operations was exceptional.';

      return headerSection(m, true) + deployedSection(units, elites, m) +
        '<div class="db-section-title">OPERATION TIMELINE</div>' + timeline(entries) + assessmentSection(assess);
    } else if (success) {
      // Infiltration success
      var entries = [];
      entries.push({ day: opStart, events: dayEvents([
        'Infiltration operation concluded. Agent successfully extracted from within the target organization without compromise.',
        'Agent debriefing commenced. ' + (elites.length ? elites[0].fullName + ' conducted the primary debrief sessions.' : unitShort(units) + ' debrief team assigned.'),
        'Initial intelligence product reviewed: organization structure, membership, finances, and operational plans documented in detail.',
      ])});
      entries.push({ day: cd, events: dayEvents([
        'Debriefing session ' + R(3,6) + ' completed. Agent provided comprehensive information on: ' + P(['the organization\'s cell structure ('+R(3,8)+' cells identified)','leadership hierarchy and decision-making processes','financial flows including '+R(2,5)+' funding sources','communications architecture and encryption methods','planned operations for the next '+R(1,6)+' months','recruitment pipeline and radicalization methods']),
        'Agent confirmed safe. Cover identity ' + P(['remains intact — potential for re-insertion','is partially burned — re-insertion not recommended','was deliberately terminated as part of the extraction plan','assessed as still viable for limited future use']) + '.',
        'Final intelligence package compiled and distributed to relevant departments.',
      ])});

      var assess = 'The infiltration produced exceptional intelligence on the target organization. The agent penetrated the inner circle and maintained position for ' + R(2,8) + ' months. ' +
        (elites.length ? elites[0].fullName + ' served as primary handler and extracted critical details during debriefing. ' : '') +
        'Intelligence products include: complete organizational chart (' + R(10,40) + ' identified members), financial network mapping, operational planning documents, and safe house locations (' + R(3,7) + ' sites). ' +
        'This intelligence enables high-confidence takedown planning.';

      return headerSection(m, true) + deployedSection(units, elites, m) +
        '<div class="db-section-title">OPERATION TIMELINE</div>' + timeline(entries) + assessmentSection(assess);
    } else {
      var entries = [];
      entries.push({ day: opStart, events: dayEvents([
        (isTakedown ? 'Takedown operation planning finalized. Teams assembled.' : 'Agent reported possible compromise within the organization.'),
        unitShort(units) + ' ' + (isTakedown ? 'prepared simultaneous raid packages.' : 'activated emergency extraction protocols.'),
      ])});
      entries.push({ day: cd, events: dayEvents([
        isTakedown ?
          'Raids executed at ' + R(3,6) + ' locations. PRIMARY TARGET LOCATION: key leadership ABSENT. ' + P(['Organization received advance warning.','Only low-level members found on-site.','The location had been evacuated within the last '+R(6,24)+' hours.']) :
          'Agent extraction attempted. ' + P(['Agent reached safe house but was followed by organization security.','Agent missed the extraction window. Communications lost.','Agent was detained by the organization before reaching the rendezvous.','Agent extracted under fire — QRF deployed to assist.']),
        R(2,6) + ' individuals detained but ' + P(['none are senior leadership.','the most valuable targets escaped.','those captured have limited intelligence value.','interrogation suggests they were left behind deliberately as decoys.']),
        (elites.length ? elites[0].fullName + ' ' + P(['led the QRF that secured the extraction','assisted with managing the withdrawal','confirmed that primary objectives were not achievable']) + '.' : 'Assessment: primary objectives not achieved.'),
        P(AFTERMATH_F),
      ])});

      var assess = (isTakedown ? 'The takedown operation failed to capture the organization\'s leadership.' : 'The infiltration operation was compromised.') + ' ' +
        P(COMPROMISE) + ' ' +
        (elites.length ? elites[0].fullName + ' managed the situation professionally but the overall mission was not recoverable. ' : '') +
        'The organization is now fully alert and has likely dispersed and restructured. Intelligence gathered before the compromise has partial value. ' + P(AFTERMATH_F);

      return headerSection(m, false) + deployedSection(units, elites, m) +
        '<div class="db-section-title">OPERATION TIMELINE</div>' + timeline(entries) + assessmentSection(assess);
    }
  }

  // ---- FAVOR MISSIONS (all FAVOR_ types) ----

  function gen_FAVOR(m, units, elites, success) {
    var cd = currentDay();
    var execDays = m.execDays || R(2,3);
    var opStart = Math.max(1, cd - execDays);
    var fv = m.fillVars || {};
    var city = fv.city || fv.location || 'the area of operations';
    var agencyName = m.favorAgencyName || 'the requesting agency';

    if (success) {
      var entries = [];
      entries.push({ day: opStart, events: dayEvents([
        'Inter-agency coordination established. ' + agencyName + ' provided detailed briefing on the requested operation.',
        unitShort(units) + ' assigned to execute. Mission parameters reviewed and accepted.',
        'Joint planning session with ' + agencyName + ' liaison. Rules of engagement and information-sharing protocols established.',
        (elites.length ? elites[0].fullName + ' designated as primary liaison and operational lead.' : 'Senior officer designated as agency representative for the joint operation.'),
      ])});
      entries.push({ day: cd, events: dayEvents([
        unitShort(units) + ' deployed to ' + city + '. ' + P(WEATHER) + '.',
        'Primary objective engaged. ' + P(['Target located and secured as requested.','Surveillance package delivered to partner agency specifications.','Extraction completed per partner requirements.','Direct action executed per joint operational plan.','Intelligence collection completed — products transferred to requesting agency.']),
        P(RESIST_LIGHT),
        'Objective achieved. Results package compiled and ' + P(['transmitted securely to '+agencyName+'.','handed over to '+agencyName+' liaison on-site.','uploaded to shared intelligence database.']) ,
        'All ' + unitShort(units) + ' personnel extracted. Operation closed. ' + agencyName + ' expressed satisfaction with the result.',
      ])});

      var assess = 'The inter-agency operation requested by ' + agencyName + ' has been completed successfully. ' + unitList(units) + ' executed all requested tasks within the specified parameters. ' +
        (elites.length ? elites[0].fullName + ' served effectively as operational liaison, ensuring smooth coordination between agencies. ' : '') +
        'This successful favor strengthens our relationship with ' + agencyName + ' and builds operational capital for future reciprocal support. ' +
        unitShort(units) + ' demonstrated excellent interoperability with partner requirements.';

      return headerSection(m, true) + deployedSection(units, elites, m) +
        '<div class="db-section-title">OPERATION TIMELINE</div>' + timeline(entries) + assessmentSection(assess);
    } else {
      var entries = [];
      entries.push({ day: opStart, events: dayEvents([
        agencyName + ' request received and accepted. ' + unitShort(units) + ' assigned.',
      ])});
      entries.push({ day: cd, events: dayEvents([
        unitShort(units) + ' deployed. ' + P(WEATHER) + '.',
        P(['Objective could not be achieved — '+P(['target was not at the specified location','operational conditions were non-viable','the intelligence provided by '+agencyName+' was inaccurate','unexpected opposition rendered the approach unsafe','equipment failure at a critical moment'])+'.','Operation was compromised during execution. Teams withdrew.','Partially completed before conditions forced abort.']),
        (elites.length ? elites[0].fullName + ' managed the withdrawal. ' : '') + P(AFTERMATH_F),
      ])});

      var assess = 'The inter-agency operation requested by ' + agencyName + ' has failed. ' + unitShort(units) + ' were unable to achieve the stated objectives. ' +
        (elites.length ? elites[0].fullName + ' was deployed but mission parameters made success impossible. ' : '') +
        'This failure will negatively impact the relationship with ' + agencyName + '. Diplomatic remediation is recommended. ' + P(AFTERMATH_F);

      return headerSection(m, false) + deployedSection(units, elites, m) +
        '<div class="db-section-title">OPERATION TIMELINE</div>' + timeline(entries) + assessmentSection(assess);
    }
  }

  // ===========================================================================
  // TYPE MAPPING
  // ===========================================================================

  var GENERATORS = {
    DOMESTIC_TERROR: gen_DOMESTIC_TERROR,
    FOREIGN_HVT: gen_HVT,
    DOMESTIC_HVT: gen_HVT,
    LONG_HUNT_HVT: gen_HVT,
    HVT_ABDUCTION_DOM: gen_HVT,
    HVT_ABDUCTION_FOR: gen_HVT,
    ASSET_RESCUE: gen_RESCUE,
    HOSTILE_RESCUE: gen_RESCUE,
    COUNTER_INTEL: gen_COUNTERINTEL,
    MOLE_HUNT: gen_COUNTERINTEL,
    RENDITION: gen_RENDITION,
    REGIME_OP: gen_REGIME,
    HVT_SURVEILLANCE_DOM: gen_SURVEILLANCE,
    HVT_SURVEILLANCE_FOR: gen_SURVEILLANCE,
    SURVEILLANCE_TAKEDOWN: gen_ORG,
    ORG_INFILTRATION: gen_ORG,
    ORG_TAKEDOWN: gen_ORG,
    FAVOR_BUREAU_SURVEILLANCE: gen_FAVOR,
    FAVOR_BUREAU_DISRUPTION: gen_FAVOR,
    FAVOR_BUREAU_DETENTION: gen_FAVOR,
    FAVOR_AGENCY_RENDITION: gen_FAVOR,
    FAVOR_AGENCY_EXTRACTION: gen_FAVOR,
    FAVOR_AGENCY_COVER: gen_FAVOR,
    FAVOR_MIL_RESCUE: gen_FAVOR,
    FAVOR_MIL_SIGINT: gen_FAVOR,
    FAVOR_MIL_STRIKE: gen_FAVOR,
  };

  // ===========================================================================
  // MAIN ENTRY POINT
  // ===========================================================================

  window.generateDebrief = function (m, success) {
    var mtype = m.typeId || m.missionType || m.type;
    var gen = GENERATORS[mtype];
    if (!gen) return '';

    var units = getUnits(m);
    var elites = getElites(m);
    var html = gen(m, units, elites, success);

    // Fill remaining template vars
    var fillV = m.isMultiPhase ? (m.currentPhaseFillVars || m.fillVars) : m.fillVars;
    if (fillV && typeof fillTemplate === 'function') {
      html = fillTemplate(html, fillV);
    }

    return '<div class="db-wrap ' + (success ? 'db-success' : 'db-failure') + '">' +
      '<div class="db-toggle" onclick="this.parentElement.classList.toggle(\'db-open\')">' +
        '<span class="db-toggle-arrow">&#9654;</span>' +
        '<span class="db-toggle-label">FULL OPERATIONAL DEBRIEF</span>' +
      '</div>' +
      '<div class="db-body">' + html + '</div>' +
    '</div>';
  };

})();
