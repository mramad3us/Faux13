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
  // Support departments: these never do ground/assault work
  var SUPPORT_DEPTS = ['ANALYSIS', 'SIGINT', 'HUMINT'];
  // Action departments: capable of field/ground operations
  var ACTION_DEPTS  = ['FIELD_OPS', 'SPECIAL_OPS', 'FOREIGN_OPS', 'COUNTER_INTEL'];

  function getUnits(m) {
    var out = [];
    var depts = m.assignedExecDepts || [];
    var rec   = (typeof MISSION_TYPES !== 'undefined' && m.typeId && MISSION_TYPES[m.typeId])
              ? (MISSION_TYPES[m.typeId].execDepts || []) : [];
    for (var i = 0; i < depts.length; i++) {
      var cfg = DEPT_CONFIG.find(function(c){ return c.id === depts[i]; });
      var isSupport = SUPPORT_DEPTS.indexOf(depts[i]) >= 0 && rec.indexOf(depts[i]) < 0;
      out.push({ id: depts[i], name: cfg ? cfg.name : depts[i], short: cfg ? cfg.short : depts[i], unit: cfg ? cfg.unitNameSingle : 'unit', support: isSupport });
    }
    return out;
  }

  // Get only action (non-support) units
  function actionUnits(units) {
    var out = [];
    for (var i = 0; i < units.length; i++) { if (!units[i].support) out.push(units[i]); }
    return out.length ? out : units; // fallback to all if no action units
  }

  // Get only support units
  function supportUnits(units) {
    var out = [];
    for (var i = 0; i < units.length; i++) { if (units[i].support) out.push(units[i]); }
    return out;
  }

  // Generate a support contribution line for a support department
  function supportLine(su) {
    if (su.id === 'ANALYSIS') return P([
      su.short + ' provided real-time threat assessment and target pattern analysis from the operations center.',
      su.short + ' correlated incoming field data with existing intelligence holdings, updating the tactical picture.',
      su.short + ' ran continuous risk modeling throughout the operation, flagging anomalies to the field commander.',
      su.short + ' desk maintained the common operating picture — fusing HUMINT, SIGINT, and field reporting.',
    ]);
    if (su.id === 'SIGINT') return P([
      su.short + ' intercept team monitored all target communications throughout the operation.',
      su.short + ' provided real-time electronic surveillance — scanning radio frequencies and phone networks in the target area.',
      su.short + ' intercepted ' + R(3,12) + ' communications during the operation, relaying critical updates to the field team.',
      su.short + ' jammed hostile communications on the field commander\'s order during the final phase.',
    ]);
    if (su.id === 'HUMINT') return P([
      su.short + ' handler maintained contact with a local asset providing real-time ground truth from inside the target area.',
      su.short + ' source confirmed target disposition ' + R(30,90) + ' minutes before H-hour, enabling final GO decision.',
      su.short + ' assets provided early warning of ' + P(['police patrol patterns','guard rotation schedules','civilian traffic in the area','counter-surveillance activity']) + '.',
    ]);
    return su.short + ' provided operational support.';
  }

  // Generate support contribution events for all support units on this mission
  function supportEvents(units) {
    var su = supportUnits(units);
    var out = [];
    for (var i = 0; i < su.length; i++) out.push(supportLine(su[i]));
    return out;
  }

  // Insert support unit contributions after the first N events in an array
  // Typically after events 1-2 (departure/staging), before the breach/assault
  function withSupport(eventArray, units, afterIndex) {
    var su = supportEvents(units);
    if (!su.length) return eventArray;
    var pos = (afterIndex !== undefined ? afterIndex : 2);
    if (pos > eventArray.length) pos = eventArray.length;
    var out = eventArray.slice(0, pos);
    for (var i = 0; i < su.length; i++) out.push(su[i]);
    for (var j = pos; j < eventArray.length; j++) out.push(eventArray[j]);
    return out;
  }

  // Get attached elite units
  // Check if an elite unit is from a support (non-combat) department
  function isEliteSupport(eu) {
    return eu && eu.deptId && SUPPORT_DEPTS.indexOf(eu.deptId) >= 0;
  }

  // Generate an elite narrative line appropriate to their role
  // combat: what a FIELD_OPS/SPECIAL_OPS/FOREIGN_OPS elite would do
  // support: what an ANALYSIS/SIGINT/HUMINT elite would do from the ops center
  function eliteCombatOrSupport(eu, combatText, supportText) {
    if (!eu) return '';
    return isEliteSupport(eu) ? supportText : combatText;
  }

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

  // Prep-day events — hours apart (planning, staging, recon)
  function dayEvents(events) {
    var hour = R(5, 9);
    var min = P([0,10,15,20,30,40,45,50]);
    var out = [];
    for (var i = 0; i < events.length; i++) {
      out.push({ time: zp(hour) + zp(min) + 'Z', text: events[i] });
      hour += R(1, 3);
      min = P([0,5,10,15,20,25,30,35,40,45,50,55]);
      if (hour > 22) hour = 22;
    }
    return out;
  }

  // Assault-day events — minutes apart, tightly sequenced from H-hour
  // First few events (approach, staging) can be spaced wider, then the
  // assault itself runs in 3-10 minute gaps, then exfil slightly wider
  // If units provided, auto-inject support department contributions after event 2
  function assaultEvents(events, units) {
    if (units) events = withSupport(events, units);
    // Start in the early hours (0100-0400 typical for night raids)
    var hour = R(1, 4);
    var min = R(0, 3) * 15;
    var out = [];
    for (var i = 0; i < events.length; i++) {
      out.push({ time: zp(hour) + zp(min) + 'Z', text: events[i] });
      // First 2 events (pre-assault prep): 15-40 min gaps
      // Middle events (the assault): 3-12 min gaps
      // Last 2 events (exfil/cleanup): 10-25 min gaps
      var gap;
      if (i < 2) gap = R(15, 40);
      else if (i >= events.length - 2) gap = R(10, 25);
      else gap = R(3, 12);
      min += gap;
      while (min >= 60) { min -= 60; hour++; }
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
      var role = units[i].support ? ' — SUPPORT' : ' — PRIMARY';
      rows += '<div class="db-asset-row"><span class="db-asset-dept">' + units[i].short + '</span><span class="db-asset-type">' + units[i].unit + role + '</span></div>';
    }
    for (var j = 0; j < elites.length; j++) {
      var eTitle = (elites[j].title || 'Elite').toUpperCase();
      var eStars = typeof starsDisplay === 'function' ? starsDisplay(elites[j]) : '';
      rows += '<div class="db-asset-row db-asset-elite"><span class="db-asset-dept">' + elites[j].fullName + (eStars ? ' ' + eStars : '') + '</span><span class="db-asset-type">' + elites[j].deptName + ' — ' + eTitle + '</span></div>';
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
        actionUnits(units).length > 1 ? actionUnits(units)[1].short + ' element confirmed no counter-surveillance activity detected around the target area. Approach routes validated.' : 'Counter-surveillance sweep of approach routes completed. All clear.',
      ])});
      // Day 2 (or same day if 2-day op): The assault
      var assaultDay = execDays > 1 ? opStart + Math.max(1, execDays - 1) : opStart;
      entries.push({ day: assaultDay, events: assaultEvents([
        'Final intelligence update received. All ' + cellSize + ' subjects confirmed present at target location. GO authorization received from Director.',
        cs + ' assault element departed staging area. ' + R(3,6) + ' vehicles in convoy. Radio silence enforced. ETA to target: ' + R(8,25) + ' minutes.',
        'Outer cordon established by ' + (actionUnits(units)[0] ? actionUnits(units)[0].short : 'support') + ' team. ' + R(4,8) + ' positions covering all egress points. Local law enforcement discreetly diverted from the area of operations.',
        elites.length ? eliteCombatOrSupport(elites[0],
          elites[0].fullName + ' led the primary assault element to breach point. Final equipment check completed. Weapons status confirmed.',
          elites[0].fullName + ' provided real-time intelligence coordination from the tactical operations center. All sensor feeds and communications linked.') : cs + ' team leader confirmed all elements in position. Final equipment check. Weapons hot.',
        'H-HOUR. Breach initiated via ' + breachMethod + '. ' + P(RESIST_LIGHT) + ' Entry to target achieved in under ' + R(8,30) + ' seconds.',
        'Ground floor cleared. ' + R(1,3) + ' subjects detained in the main room. ' + (elites.length ? eliteCombatOrSupport(elites[0],
          elites[0].fullName + ' personally secured "' + alias + '" who was found ' + P(['attempting to reach a weapon','destroying documents','hiding in a back room','on a phone call','asleep','sitting at a table with maps spread out']) + '.',
          elites[0].fullName + ' confirmed target identity via live biometric feed from the assault team\'s cameras. Positive match on "' + alias + '".') : 'Primary target "' + alias + '" located and detained on the ' + P(['ground floor','second floor','in the basement','in a rear bedroom']) + '.'),
        'Building fully cleared room by room. Total subjects detained: ' + cellSize + '. ' + P(['One subject required medical treatment for a minor laceration.','No injuries to any personnel or subjects.','One assault team member sustained a minor bruise during entry — no medical treatment required.',R(1,2) + ' subjects were non-compliant and required physical restraint.']) ,
        'Sensitive site exploitation team entered the building. Evidence recovery initiated. Items catalogued on-site include: ' + evidence + '. Additionally recovered: ' + evidence2 + '.',
        'All ' + cellSize + ' detainees processed, photographed, and biometrically registered. "' + alias + '" positively identified via facial recognition database match. Transport to secure holding facility arranged.',
        'Area of operations fully sanitized. No forensic evidence of agency involvement left on-site. ' + cs + ' team and all support elements returned to base. Operation concluded.',
      ], units)});
      var assess = 'The operation against the ' + group + ' cell in ' + city + ' achieved all objectives. The planned ' + attackType + ' against ' + target + ' has been permanently disrupted. ' + cellSize + ' operatives are in custody, including cell leader "' + alias + '". ' +
        'Intelligence exploitation of seized materials is the immediate priority — ' + evidence + ' are expected to yield significant insights into the wider network. ' +
        (elites.length ? eliteCombatOrSupport(elites[0],
          elites[0].fullName + ' performance during the breach phase was exemplary and directly contributed to the rapid, non-lethal subduing of the primary target. ',
          elites[0].fullName + ' intelligence support from the operations center was critical — real-time threat updates enabled the assault team to move with confidence. ') : '') +
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
        actionUnits(units).length > 1 ? actionUnits(units)[1].short + ' counter-surveillance team completed sweep of approach routes. Routes assessed as clear.' : 'Counter-surveillance sweep completed. Approach routes assessed as viable.',
      ])});
      var failDay = execDays > 1 ? opStart + Math.max(1, execDays - 1) : opStart;
      entries.push({ day: failDay, events: assaultEvents([
        'GO authorization received. ' + cs + ' assault element departed staging area. Radio silence enforced.',
        'SIGINT FLASH: Target communications went dark approximately ' + R(15,40) + ' minutes before planned H-hour. All monitored devices simultaneously deactivated. This is a critical indicator of compromise.',
        cs + ' arrived at target location. Outer cordon established. Immediate observation revealed: ' + P(['lights extinguished in the building','a vehicle departing the rear of the property at speed','the front door standing open','no signs of occupancy','evidence of hasty evacuation visible through windows']) + '.',
        'Breach executed as planned via ' + breachMethod + '. Building entered. RESULT: Target structure is EMPTY. Signs of rapid, organized evacuation throughout. ' + P(['Food still warm on the table.','Personal effects abandoned.','Documents partially burned in a metal container.','Electronics wiped and left behind.','Mattresses and bedding present but no clothing.']),
        elites.length ? eliteCombatOrSupport(elites[0],
          elites[0].fullName + ' conducted rapid search of the entire structure. Confirmed: all ' + cellSize + ' subjects have fled. No subjects found on premises.',
          elites[0].fullName + ' cross-referenced live sensor data from the site — confirmed zero heat signatures. Structure is empty.') : 'Full building search completed. All ' + cellSize + ' subjects have evacuated. Building is empty.',
        'Forensic exploitation team entered. Limited evidence recovered: ' + P(['a single discarded phone (being analyzed)','partial fingerprints on door handles','residual chemical traces','a few scraps of burned paper','nothing of intelligence value — the site was thoroughly sanitized']) + '.',
        'SIGINT attempted to reacquire target communications. Negative contact. All known numbers and devices are offline.',
        'All teams recalled to staging area. Area of operations abandoned. ' + P(AFTERMATH_F),
      ], units)});
      var assess = 'The operation failed to achieve its objectives. ' + compromiseReason + ' The cell led by "' + alias + '" evacuated the target location before the assault element could arrive. ' +
        'The planned ' + attackType + ' against ' + target + ' remains a credible and active threat. All ' + cellSize + ' subjects are unlocated and should be considered mobile and aware. ' +
        (elites.length ? eliteCombatOrSupport(elites[0],
          elites[0].fullName + ' was deployed but had no opportunity to engage. ',
          elites[0].fullName + ' was providing operational support but the target had already evacuated. ') : '') +
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
    var isAbduction = m.isAbduction || (m.typeId || '').indexOf('ABDUCTION') >= 0;
    // Determine if this is an elimination (kill) vs capture mission
    var tid = m.typeId || '';
    var isElim = !isAbduction && (m.isElimination || tid === 'FOREIGN_HVT' || tid === 'LONG_HUNT_HVT' ||
      (m.resultMsg && /neutraliz|eliminat|killed/i.test(m.resultMsg)));
    // Organic DOMESTIC_HVT (no explicit flag) — fall back to result message
    if (tid === 'DOMESTIC_HVT' && !m.isElimination && !isElim && m.resultMsg && /apprehend|custody|arrest|captured/i.test(m.resultMsg)) {
      isElim = false;
    }

    if (success) {
      var entries = [];
      entries.push({ day: opStart, events: dayEvents([
        'Intelligence package finalized. Target identity and location confirmed via ' + P(INTEL_SRC) + '. Confidence level: HIGH.',
        unitShort(units) + ' operational planning session. ' + (isElim ? 'Strike plan' : 'Assault plan') + ' developed based on site reconnaissance and target pattern-of-life data collected over the preceding ' + R(7,30) + ' days.',
        'Equipment staging and loadout. Specialized equipment for ' + (isAbduction ? 'covert acquisition and transport' : isElim ? 'lethal direct action' : 'direct-action capture') + ' prepared and inspected.',
        elites.length ? eliteCombatOrSupport(elites[0],
          elites[0].fullName + ' briefed on primary role: ' + (isElim ?
            P(['designated marksman — primary shooter','overwatch and sniper support','tactical breach lead — lethal authorization','close-quarters assault lead','demolitions and site preparation']) :
            P(['tactical breach lead','target acquisition and handling','overwatch and sniper support','close protection during extraction','technical exploitation on-site'])) + '.',
          elites[0].fullName + ' established remote operations link. Assigned role: ' + P(['real-time intelligence fusion and target confirmation','communications monitoring and early warning','biometric identification support via live feed','pattern analysis and threat assessment throughout execution']) + '.') : cs + ' team leader assigned tactical roles and confirmed contingency procedures.',
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
      entries.push({ day: cd, events: assaultEvents([
        'H-HOUR MINUS 60. Final intelligence update: target confirmed at location. No unusual activity detected. GO authorization confirmed.',
        cs + ' assault element departed staging area. ' + weather + '. All teams moving to assigned positions.',
        'Outer security perimeter established. ' + R(2,4) + ' escape routes blocked by ' + (actionUnits(units).length > 1 ? actionUnits(units)[actionUnits(units).length-1].short : 'support') + ' elements.',
        elites.length ? eliteCombatOrSupport(elites[0],
          'H-HOUR. ' + elites[0].fullName + ' led breach element. Entry via ' + P(BREACH) + '. Security detail ' + P(['neutralized within seconds','overwhelmed before they could react','engaged and suppressed — '+R(1,3)+' hostiles down','bypassed entirely through stealth approach']) + '.',
          'H-HOUR. Breach initiated via ' + P(BREACH) + '. ' + elites[0].fullName + ' confirmed all sensor feeds active — providing overwatch from the operations center. Security detail ' + P(['neutralized within seconds','overwhelmed before they could react','engaged and suppressed','bypassed through stealth']) + '.') :
          'H-HOUR. Breach initiated via ' + P(BREACH) + '. Security detail ' + P(['neutralized within seconds','overwhelmed before they could react','engaged and suppressed','bypassed through stealth']) + '.',
        isElim ?
          'Target located in ' + P(['the main bedroom on the second floor','a ground-floor office','the basement','a reinforced safe room','the kitchen area','a meeting room with associates']) + '. Target ' + P(['reached for a weapon — immediate lethal response authorized and executed.','attempted to flee through a rear exit — intercepted by the perimeter team. Lethal action taken.','was positively identified and engaged per the authorization. Death was instantaneous.','resisted and drew a concealed firearm — eliminated in the ensuing exchange.','was engaged by the assault element. Confirmed dead at the scene.']) :
          'Target located in ' + P(['the main bedroom on the second floor','a ground-floor office','the basement','a reinforced safe room','the kitchen area','a meeting room with associates']) + '. ' + P(RESIST_LIGHT),
        isElim ?
          'Target identity confirmed via ' + P(['biometric facial recognition','fingerprint match','identifying physical characteristics','dental records comparison','DNA rapid-test kit']) + '. Positive identification: ' + target + '. Status: DECEASED.' :
          'Target positively identified via ' + P(['biometric facial recognition','fingerprint match','voice comparison','identifying physical characteristics','document verification']) + '. Identity confirmed: ' + target + '.',
        isAbduction ? 'Target sedated per medical protocol and transferred to prepared transport vehicle. Cover story for disappearance will be ' + P(['a reported vehicle accident','a staged domestic dispute','a business trip abroad','no cover — clean disappearance']) + '.' :
          isElim ? P(['Body prepared for exfiltration per protocol — no remains left at scene.','Scene staged to appear as a factional dispute. No attribution to our agency.','Body left in place. Scene sanitized of all operational evidence.','Remains removed for disposal via pre-arranged method. Scene cleaned.']) + ' Personal effects and all electronics seized for exploitation.' :
          'Target detained and processed. ' + P(['Hands zip-tied, hood applied for transport.','Target was compliant. Moved under escort.','Target initially resistant — subdued with non-lethal holds.','Target surrendered without incident.']) + ' Personal effects and all electronics seized.',
        'Site exploitation team entered. ' + R(10,25) + ' minutes of rapid evidence collection. Items recovered: ' + P(EVIDENCE) + '.',
        'Extraction commenced via ' + P(EXFIL) + '. All teams departed area of operations. No pursuit detected. ' + cs + ' confirmed clean extraction.',
        isElim ?
          'All ' + unitShort(units) + ' elements clear of the area of operations and RTB. No casualties. No attribution.' :
          'Target delivered to ' + P(['secure holding facility','forward operating base for initial interrogation','designated transfer point for onward movement','agency black site','partner nation detention facility']) + '. Chain of custody documented. All ' + unitShort(units) + ' elements accounted for and RTB.',
      ], units)});

      var assess = isElim ?
        'High-value target ' + target + ' has been eliminated in ' + city + '. The operation was executed by ' + unitList(units) +
        (elites.length ? ' with elite asset ' + elites[0].fullName + ' attached' : '') + '. Total operation time from insertion to extraction: approximately ' + R(25,90) + ' minutes. ' +
        'Target death has been confirmed via positive identification at the scene. ' +
        P(['No body was recovered — remains disposed of per standing protocol.','The scene was staged to obscure the cause of death and prevent attribution.','Body was exfiltrated for positive identification and disposal.','Remains left in place. Cover story established.']) + ' ' +
        'Seized materials from the target location are undergoing exploitation. Early assessment suggests ' + P(['significant intelligence value','connections to '+R(2,5)+' previously unknown associates','financial records that may map the target\'s support network','communications that could compromise additional operatives','limited additional intelligence — the target maintained strict operational security']) + '. ' +
        'Operational security was maintained. No attribution to ' + (G.cfg ? G.cfg.acronym : 'our agency') + ' is expected. The target\'s network will require significant time to reconstitute. ' + unitShort(units) + ' performance rated OUTSTANDING.'
        :
        'High-value target ' + target + ' has been successfully ' + (isAbduction ? 'acquired' : 'captured') + ' in ' + city + '. The operation was executed by ' + unitList(units) +
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
        elites.length ? eliteCombatOrSupport(elites[0],
          elites[0].fullName + ' attached to assault element. Final coordination with ' + cs + ' team leader.',
          elites[0].fullName + ' linked to tactical operations center. Real-time support coordination confirmed with ' + cs + ' team leader.') : cs + ' team leader conducted final rehearsal with assault element.',
      ])});
      entries.push({ day: cd, events: assaultEvents([
        'GO authorization received. Assault element departed staging. ' + weather + '.',
        'Approach to target area. ' + P(['All clear on primary route.','Minor delay — civilian vehicle on approach road required waiting.','Route clear, team making good time.','Counter-surveillance team reported all clear.']) ,
        P(['On arrival at target compound, immediately apparent that the location has been abandoned. Front door standing open, no vehicles present, no lights.','SIGINT reports: target\'s phone last pinged at this location '+R(4,18)+' hours ago. Currently offline. Probable departure.','Breach executed as planned. Building entered. Target NOT PRESENT. '+R(1,3)+' individuals found on-site — none matching target description.','Surveillance team reports target departed the location by vehicle approximately '+R(1,6)+' hours before assault element arrival. Pursuit attempted — vehicle lost in traffic.']),
        'Full search of premises conducted. ' + P(['Building shows signs of recent, hasty departure. Some personal effects remain.','Location was thoroughly sanitized. Nothing of value left behind.','Found evidence of counter-surveillance equipment — the target knew they were being watched.','A few items recovered but likely of limited intelligence value.','The building appears to be a decoy location. Intelligence was manipulated.']),
        elites.length ? eliteCombatOrSupport(elites[0],
          elites[0].fullName + ' confirmed: target has departed. No trail to follow from this location.',
          elites[0].fullName + ' ran emergency signals analysis — no electronic trace of target in the area. Confirmed departure.') : 'Assault team leader confirmed: target is not here. All rooms, outbuildings, and concealment areas checked.',
        'Operation called. All elements withdrawing. ' + P(AFTERMATH_F),
      ], units)});

      var assess = 'The operation to ' + (isAbduction ? 'acquire' : isElim ? 'neutralize' : 'capture') + ' ' + target + ' in ' + city + ' has failed. ' + compReason + ' The target departed the location before the ' + (isElim ? 'strike' : 'assault') + ' could be executed. ' +
        target + ' is now operating with heightened security awareness and will be significantly harder to locate and approach. ' +
        (elites.length ? eliteCombatOrSupport(elites[0],
          elites[0].fullName + ' was deployed but had no opportunity to engage the target. ',
          elites[0].fullName + ' was providing remote support but the target had already departed. ') : '') +
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
        'Rehearsal conducted at staging area using improvised mockup of the holding location. ' + (elites.length ? eliteCombatOrSupport(elites[0],
          elites[0].fullName + ' designated as rescue team lead.',
          elites[0].fullName + ' integrated into operations center. Assigned: real-time intelligence and communications support for the rescue element.') : cs + ' designated as assault element leader.'),
        'Medical team pre-staged with ' + P(['trauma kit and stretcher','full field surgical capability','sedation and stabilization equipment','emergency medical evacuation helicopter on standby']) + '.',
        'Support asset deployed: ' + P(['ISR drone providing continuous overhead coverage','SIGINT intercept team monitoring all communications in the target area','sniper/observer team established on elevated terrain '+R(200,600)+'m from target','quick reaction force pre-positioned '+R(3,8)+'km from target for contingency']) + '.',
      ])});
      entries.push({ day: cd, events: assaultEvents([
        'Final intelligence update: ' + R(3,8) + ' armed guards observed at the holding location. ' + rescueTarget + P([' confirmed alive — visual confirmation through window.',' last heard via intercepted communication '+R(2,6)+' hours ago. Status: believed alive.',' status unknown but no evidence of harm detected.',' confirmed alive by HUMINT source inside the guard force.']) ,
        'H-HOUR MINUS 30. ' + cs + ' team departed staging. ' + weather + '. All elements moving.',
        'Outer cordon established. Escape routes blocked. ' + (actionUnits(units).length > 1 ? actionUnits(units)[actionUnits(units).length-1].short + ' team covering rear and flanks.' : 'Support element covering rear.'),
        'H-HOUR. Breach via ' + P(BREACH) + '. ' + (elites.length ? eliteCombatOrSupport(elites[0],
          elites[0].fullName + ' first through the door. ',
          elites[0].fullName + ' confirmed no outbound communications from the compound — element of surprise intact. ') : '') + P(['Flashbang deployed. Guards disoriented.','Simultaneous entry from two points. Guards caught in crossfire.','Stealth approach achieved — first guard neutralized silently.','Explosive breach stunned all occupants.']) ,
        R(2,5) + ' guards engaged. ' + P(['All neutralized within '+R(30,90)+' seconds. No survivors among the guard force.',''+R(1,3)+' killed, remainder surrendered.','All guards suppressed and detained alive.','Brief firefight — all threats eliminated. One guard wounded and detained for questioning.']) + (elites.length ? ' ' + eliteCombatOrSupport(elites[0],
          elites[0].fullName + ' cleared the holding area.',
          elites[0].fullName + ' guided rescue team to the holding area via drone thermal imagery.') : ''),
        rescueTarget.charAt(0).toUpperCase() + rescueTarget.slice(1) + ' located in ' + P(['a locked basement room','a reinforced cell on the ground floor','a second-floor room with barred windows','a shipping container behind the main building','a crude cage in the garage area']) + '. Condition: ' + P(['dehydrated and disoriented but ambulatory','minor injuries consistent with rough handling — able to walk','physically weak but conscious and alert','uninjured — the captors had not harmed the subject','showing signs of stress but no serious physical injuries']) + '.',
        'Medical team moved in immediately. ' + P(['IV fluids administered.','Vital signs stable.','Minor wounds cleaned and dressed.','Subject able to communicate and confirmed identity.','Psychological assessment: shaken but coherent.']) + ' Cleared for transport.',
        'Extraction via ' + P(EXFIL) + '. ' + rescueTarget + ' moved under protective escort. All ' + unitShort(units) + ' teams extracted. No pursuit encountered.',
        rescueTarget.charAt(0).toUpperCase() + rescueTarget.slice(1) + ' delivered to ' + P(['a secure medical facility','the nearest agency installation','a partner nation safe house','an embassy compound','a military base hospital']) + '. Full medical evaluation and debriefing initiated.',
      ], units)});

      var assess = rescueTarget.charAt(0).toUpperCase() + rescueTarget.slice(1) + ' has been successfully recovered from captivity in ' + city + '. ' +
        unitList(units) + ' executed the rescue in approximately ' + R(15,45) + ' minutes from breach to extraction. ' + R(2,6) + ' hostiles were neutralized. ' +
        (elites.length ? eliteCombatOrSupport(elites[0],
          elites[0].fullName + ' led the rescue element with distinction, personally locating and extracting ' + rescueTarget + '. ',
          elites[0].fullName + ' provided critical operational support from the TOC, enabling rapid location and extraction of ' + rescueTarget + '. ') : '') +
        'The subject is receiving medical care and will undergo a full debriefing over the coming days. ' +
        'Operational security maintained — no media awareness. Site exploitation recovered ' + P(EVIDENCE) + ' which may provide intelligence on the captor network. ' +
        unitShort(units) + ' performance rated EXCEPTIONAL.';

      return headerSection(m, true) + deployedSection(units, elites, m) +
        '<div class="db-section-title">OPERATION TIMELINE</div>' + timeline(entries) + assessmentSection(assess);
    } else {
      var entries = [];
      entries.push({ day: opStart, events: dayEvents([
        'Intelligence placed ' + rescueTarget + ' at ' + holdingDesc + ' in ' + city + '. Source: ' + P(INTEL_SRC) + '.',
        unitShort(units) + ' developed rescue plan. ' + (elites.length ? eliteCombatOrSupport(elites[0],
          elites[0].fullName + ' designated as rescue lead.',
          elites[0].fullName + ' assigned to operations center for real-time intelligence support.') : cs + ' assigned as team leader.'),
      ])});
      entries.push({ day: cd, events: assaultEvents([
        'Assault element deployed. ' + weather + '.',
        P(['On approach, guards detected the team. Alarm raised. Sound of vehicles — captors moving '+rescueTarget+' to a vehicle.','Breach executed. Building searched thoroughly. '+rescueTarget+' NOT at this location. Intelligence was '+P(['outdated','deliberately falsified','based on a misidentified building','accurate but the captors relocated '+R(6,24)+' hours ago'])+'.','Entry achieved. Intense firefight with '+R(4,8)+' guards. During the engagement, captors executed '+P(['an escape through a pre-prepared tunnel','a vehicle breakout through a back gate','a transfer of '+rescueTarget+' via an underground passage'])+'.','Rescue team reached the holding cell. '+rescueTarget+' '+P(['had been moved within the last few hours — cell empty, still warm','was found deceased — cause of death appears to be '+P(['gunshot wound','blunt force trauma','unknown — autopsy required'])+'. Time of death estimated '+R(6,36)+' hours prior.','had already been relocated to an unknown secondary site.'])] ),
        'Operation called. All elements withdrawing. ' + (elites.length ? eliteCombatOrSupport(elites[0],
          elites[0].fullName + ' confirmed no trace of ' + rescueTarget + ' at the location. ',
          elites[0].fullName + ' ran emergency signals sweep — no electronic trace of ' + rescueTarget + ' in the area. ') : '') + P(AFTERMATH_F),
        unitShort(units) + ' teams extracted safely. ' + P(['No friendly casualties.', R(1,2) + ' team members sustained minor injuries during the firefight.','All personnel accounted for.']),
      ], units)});

      var assess = 'The rescue operation for ' + rescueTarget + ' in ' + city + ' has failed. ' +
        P(['The subject was not at the target location.','The captors were alerted and moved the subject before the assault.','Intelligence was faulty — the location was incorrect.','The subject had already been relocated.']) + ' ' +
        rescueTarget.charAt(0).toUpperCase() + rescueTarget.slice(1) + ' remains in captivity at an unknown location. ' +
        (elites.length ? eliteCombatOrSupport(elites[0],
          elites[0].fullName + ' was deployed but the situation did not permit a successful rescue. ',
          elites[0].fullName + ' provided support but the operational situation was unrecoverable. ') : '') +
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
      entries.push({ day: cd, events: assaultEvents([
        'Decision made to move to arrest. Evidence package reviewed by internal legal counsel: assessed as SUFFICIENT for prosecution and internal action.',
        'Arrest team assembled. ' + cs + ' designated as lead. Location: suspect is currently at ' + P(['their desk in the operations center','a meeting in the conference room','the parking garage about to leave for the day','the cafeteria','their personal vehicle in the parking lot']) + '.',
        'Suspect approached by ' + cs + ' team. ' + P(['Suspect immediately requested legal counsel. Declined to make any statement.','Suspect appeared shocked. Made spontaneous admissions before being advised of rights.','Suspect attempted to destroy their phone by smashing it — device partially recovered.','Suspect was calm and cooperative. Stated: "I knew this day would come."','Suspect became agitated and attempted to flee — restrained by security.']) ,
        'Suspect\'s workspace secured and sealed. Digital forensics team began imaging all devices. Personal effects catalogued. ' + P(['A one-time pad was found in the suspect\'s desk drawer.','An unauthorized encrypted USB drive was recovered from the suspect\'s bag.','A burner phone with foreign SIM card was found in the suspect\'s coat pocket.','Hidden notes with meeting locations and dates were found in a hollowed-out book.','No additional incriminating materials found at the workspace — suspect maintained strict discipline.']) ,
        'Suspect\'s residence searched under judicial authority. Recovery included: ' + P(EVIDENCE) + '.',
        'Suspect transferred to secure detention facility. Formal interrogation scheduled. Damage assessment team mobilized to review all programs and operations the suspect had access to.',
        'Full access audit initiated: suspect held ' + P(['TS/SCI clearance with access to '+R(5,15)+' compartmented programs','SECRET clearance with broad access to operational databases','TS clearance with access to source identities and agent networks','clearance to personnel files, travel records, and internal communications']) + '. Scope of potential compromise: ' + P(['SEVERE','SIGNIFICANT','MODERATE — access was somewhat limited','UNDER ASSESSMENT — full scope not yet determined']) + '.',
      ], units)});

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
      entries.push({ day: cd, events: assaultEvents([
        P(['Canary trap produced inconclusive results — no leaked document matched a single variant.','Surveillance detected that the suspect has become aware of scrutiny. Suspect altered daily patterns and began counter-surveillance runs.','Investigation stalled. Digital forensics found no unauthorized access from monitored accounts. Suspect appears to be using methods outside our monitoring scope.','Suspect abruptly resigned citing "personal reasons." Submitted resignation effective immediately and departed the building before arrest authority could be obtained.','Suspect was found to have destroyed personal devices and sanitized their workspace overnight. Evidence preservation failed.']),
        (elites.length ? elites[0].fullName + ' reported the suspect\'s evasive behavior indicates professional counter-intelligence training.' : 'Assessment: suspect demonstrates counter-intelligence awareness beyond what was anticipated.'),
        'Investigation suspended. ' + P(AFTERMATH_F),
      ], units)});

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
      entries.push({ day: cd, events: assaultEvents([
        'Final confirmation: target at expected location following predicted routine. ' + cs + ' team deployed.',
        'Acquisition point selected: ' + P(['a quiet side street during target\'s morning walk','the parking structure beneath target\'s office building','a gas station on target\'s commute route','target\'s apartment building entrance at '+rtime(),'a restaurant where target dines regularly']) + '.',
        cs + ' approach team made contact. Target ' + P(['was approached by two operatives posing as local police. Complied with instructions.','was intercepted exiting a vehicle. Sedated within '+R(5,15)+' seconds. No witnesses.','was invited into a vehicle by an operative posing as an associate. Once inside, secured.','struggled briefly before being subdued with a sedative injection. Duration of resistance: under '+R(10,30)+' seconds.']) ,
        (elites.length ? eliteCombatOrSupport(elites[0],
          elites[0].fullName + ' supervised target handling and medical monitoring during initial transport phase.',
          elites[0].fullName + ' monitored all communications in the acquisition zone — confirmed no alerts triggered. Counter-surveillance nominal.') : 'Target transferred to prepared vehicle. Medical monitoring initiated.'),
        'Counter-surveillance team confirmed: acquisition was clean. No witnesses. No CCTV in the area. ' + P(['Dummy vehicle staged at scene to delay discovery.','Target\'s phone powered down and placed in Faraday bag.','Target\'s vehicle moved to a different location.','Scene sanitized within '+R(3,8)+' minutes of acquisition.']),
        'Target transported to transfer point. In transit: target ' + P(['remained sedated and stable.','regained consciousness but was controlled.','was conscious and compliant throughout.','required additional sedation during transport.']) ,
        'Arrival at ' + P(['designated airstrip. Target loaded onto chartered aircraft.','safe house #1. Target held for '+R(2,6)+' hours before onward movement.','maritime rendezvous point. Target transferred to vessel.','embassy compound. Documentation prepared for next phase.']) ,
        'Target delivered to final destination: ' + P(['secure interrogation facility','partner nation detention center','agency black site','military detention facility']) + '. Handoff documented. Chain of custody complete.',
        'All ' + unitShort(units) + ' elements have returned to base. Operational sites sanitized. Cover story for target\'s disappearance: ' + P(['staged vehicle accident','reported missing by "concerned friend" (agency asset)','business trip abroad','no cover story — clean disappearance preferred','target\'s phone will send automated messages for '+R(2,5)+' days']) + '.',
      ], units)});

      var assess = 'Target has been successfully rendered from ' + city + ' to a secure facility. The acquisition was clean with no witnesses, no public exposure, and no law enforcement involvement. ' +
        unitList(units) + ' executed the operation precisely. ' +
        (elites.length ? eliteCombatOrSupport(elites[0],
          elites[0].fullName + ' provided critical medical supervision and target handling expertise. ',
          elites[0].fullName + ' ensured clean communications throughout — no alerts detected on any monitored channel. ') : '') +
        'Target is now available for interrogation. ' +
        'The cover story for the target\'s disappearance is in place. Monitoring of target\'s associates and family has been initiated to detect any suspicion or inquiries. As of this report, no anomalies detected.';

      return headerSection(m, true) + deployedSection(units, elites, m) +
        '<div class="db-section-title">OPERATION TIMELINE</div>' + timeline(entries) + assessmentSection(assess);
    } else {
      var entries = [];
      entries.push({ day: opStart, events: dayEvents([
        'Rendition plan approved. ' + unitShort(units) + ' acquisition team staged.',
      ])});
      entries.push({ day: cd, events: assaultEvents([
        cs + ' team deployed to acquisition point. ' + P(WEATHER) + '.',
        P(['Target arrived at acquisition point but accompanied by '+R(2,4)+' unexpected associates. Acquisition in presence of witnesses was assessed as non-viable.','Target deviated from established routine. Did not appear at the acquisition point. Alternate locations checked — negative.','Acquisition initiated but target resisted loudly. A passerby intervened. Local police were called. Team forced to disengage and withdraw.','Target\'s vehicle was intercepted but a second vehicle with unknown occupants was following. Possible security detail or counter-surveillance. Operation aborted to protect the rendition network.','On approach, team identified what appeared to be a surveillance camera not present in previous reconnaissance. Risk of identification forced abort.']),
        'Emergency withdrawal executed. All team members extracted via ' + P(['pre-planned exfiltration route','emergency vehicle swap','on-foot dispersal to safe houses','diplomatic vehicle']) + '. ' + P(AFTERMATH_F),
      ], units)});

      var assess = 'The rendition operation has failed. Target ' + target + ' remains free and is now likely aware that an acquisition attempt was made. ' +
        'The target will be extremely difficult to reacquire — expect enhanced personal security, altered routines, and possible relocation. ' +
        (elites.length ? eliteCombatOrSupport(elites[0],
          elites[0].fullName + ' managed the emergency withdrawal professionally. ',
          elites[0].fullName + ' provided critical intelligence support during the emergency withdrawal. ') : '') +
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
          (elites.length ? eliteCombatOrSupport(elites[0],
            elites[0].fullName + ' coordinated directly with local opposition forces, providing ' + P(['tactical guidance','communications support','weapons training','intelligence on regime force positions']) + '.',
            elites[0].fullName + ' provided remote intelligence support — regime force positions and communications monitored in real-time for the ground team.') : 'Agency liaison maintained coordination with opposition elements.'),
        ])});
      }
      entries.push({ day: cd, events: assaultEvents([
        'Phase 2: Local opposition elements executed coordinated actions across ' + R(2,5) + ' locations. ' + P(['Government buildings occupied','Key transportation routes blocked','Regime military units defected and joined opposition','Broadcasting facilities seized — opposition message now on national media','Border crossings taken by opposition forces']) + '.',
        'Regime control in the target area ' + P(['collapsed','degraded significantly','weakened to the point of non-functionality','fractured along ethnic/tribal lines as predicted']) + '.',
        'All agency personnel commenced withdrawal per exfiltration plan. ' + P(['All foreign operatives extracted via '+P(['helicopter','overland route','maritime pickup'])+'.','Two operatives delayed at checkpoint — resolved through bribery. All eventually extracted.','Extraction clean. No agency personnel remain in-country.']) ,
        'Post-operation assessment transmitted. Regime stability in the target area degraded by an estimated ' + R(20,50) + '%. Mission objectives achieved.',
      ], units)});

      var assess = 'The covert operation to destabilize the regime in ' + city + ' has achieved its primary objectives. ' + unitList(units) + ' maintained deniability throughout. ' +
        (elites.length ? eliteCombatOrSupport(elites[0],
          elites[0].fullName + ' provided exceptional on-the-ground coordination with local forces. ',
          elites[0].fullName + ' provided outstanding intelligence and communications support from the operations center throughout the operation. ') : '') +
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
      entries.push({ day: cd, events: assaultEvents([
        P(['Local assets failed to execute coordinated actions — the network was penetrated by regime counter-intelligence.','Opposition elements were arrested before they could act. '+R(3,8)+' local assets are now in regime custody.','Regime security forces preemptively deployed to all planned target locations. Intelligence leaked.','An agency operative was identified by regime security. Emergency extraction triggered for all foreign personnel.']),
        (elites.length ? eliteCombatOrSupport(elites[0],
          elites[0].fullName + ' organized the emergency withdrawal, ensuring all agency personnel reached extraction points.',
          elites[0].fullName + ' provided real-time route clearance data from intercepted regime communications, guiding extraction teams to safe corridors.') : 'Emergency extraction initiated for all foreign personnel.'),
        'All agency elements extracted via ' + P(EXFIL) + '. ' + P([R(1,2)+' team members sustained minor injuries during the withdrawal.','No friendly casualties.','All personnel accounted for.']) ,
        P(AFTERMATH_F),
      ], units)});

      var assess = 'The regime operation has failed. The local network was compromised, likely through regime counter-intelligence penetration. ' +
        R(2,8) + ' local assets are unaccounted for and presumed detained. All agency personnel have been extracted. ' +
        (elites.length ? eliteCombatOrSupport(elites[0],
          elites[0].fullName + ' ensured safe extraction despite the compromise. ',
          elites[0].fullName + ' provided critical intelligence during the withdrawal, enabling safe extraction. ') : '') +
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
      entries.push({ day: cd, events: assaultEvents([
        P(['Target conducted aggressive counter-surveillance and identified our observation team. Target made eye contact with surveillance operative and immediately altered behavior.','Target\'s security detail detected our technical surveillance device. Device removed and destroyed. Target is now aware of monitoring.','Target departed the area entirely. SIGINT indicates relocation to unknown location. All collection lost.','Local security services questioned our surveillance team, compromising the operation. Team extracted using cover identities.']),
        'Surveillance operation terminated. ' + P(AFTERMATH_F),
        (elites.length ? elites[0].fullName + ' recommended immediate suspension to prevent further compromise.' : 'Assessment: continuing surveillance would risk further compromise.'),
      ], units)});

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
        (elites.length ? eliteCombatOrSupport(elites[0],
          elites[0].fullName + ' assigned to lead the raid on the primary target — the organization\'s leadership location.',
          elites[0].fullName + ' assigned to coordinate all raid teams from the central operations center — real-time intelligence relay across all locations.') : 'Senior team leader assigned to the primary target location.'),
      ])});
      entries.push({ day: cd, events: assaultEvents([
        'H-HOUR. Simultaneous raids commenced at ' + R(3,7) + ' locations across ' + city + '.',
        'Location 1 (primary — leadership): ' + P(BREACH) + '. ' + R(2,5) + ' senior organization members detained. ' + P(RESIST_LIGHT),
        'Location 2 (logistics): ' + R(3,8) + ' individuals detained. ' + P(EVIDENCE) + ' recovered. Significant financial records seized.',
        'Location 3 (communications): ' + P(['Organization\'s communications hub dismantled. '+R(5,12)+' devices seized.','Encrypted radio equipment and code books recovered.','Server equipment imaged and seized.']) ,
        R(1,3) + ' additional locations raided. Combined detainees: ' + R(12,30) + ' individuals in first wave.',
        'Second wave operations over the following ' + R(6,18) + ' hours: ' + R(5,12) + ' additional arrests based on intelligence from first-wave interrogations and seized communications.',
        'Organization financial assets frozen through ' + P(['partner banking channels','judicial orders','bilateral agreements']) + '. Estimated value: $' + R(500, 5000) + 'K.',
        'All raid locations turned over to forensic exploitation teams. ' + unitShort(units) + ' teams returning to base.',
      ], units)});

      var assess = 'The coordinated takedown has effectively destroyed the target organization\'s operational capability in ' + city + '. ' +
        R(15,35) + ' individuals detained including ' + R(2,5) + ' senior leaders. Financial networks disrupted. Communications infrastructure dismantled. ' +
        (elites.length ? eliteCombatOrSupport(elites[0],
          elites[0].fullName + ' led the critical leadership raid and personally secured the organization\'s top commander. ',
          elites[0].fullName + ' coordinated intelligence across all simultaneous raid locations, enabling real-time targeting adjustments that were critical to the operation\'s success. ') : '') +
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
      entries.push({ day: cd, events: assaultEvents([
        isTakedown ?
          'Raids executed at ' + R(3,6) + ' locations. PRIMARY TARGET LOCATION: key leadership ABSENT. ' + P(['Organization received advance warning.','Only low-level members found on-site.','The location had been evacuated within the last '+R(6,24)+' hours.']) :
          'Agent extraction attempted. ' + P(['Agent reached safe house but was followed by organization security.','Agent missed the extraction window. Communications lost.','Agent was detained by the organization before reaching the rendezvous.','Agent extracted under fire — QRF deployed to assist.']),
        R(2,6) + ' individuals detained but ' + P(['none are senior leadership.','the most valuable targets escaped.','those captured have limited intelligence value.','interrogation suggests they were left behind deliberately as decoys.']),
        (elites.length ? eliteCombatOrSupport(elites[0],
          elites[0].fullName + ' ' + P(['led the QRF that secured the extraction','assisted with managing the withdrawal','confirmed that primary objectives were not achievable']) + '.',
          elites[0].fullName + ' ' + P(['provided critical signals intelligence during the withdrawal','confirmed via intercepts that primary objectives were not achievable','coordinated emergency communications to guide extraction']) + '.') : 'Assessment: primary objectives not achieved.'),
        P(AFTERMATH_F),
      ], units)});

      var assess = (isTakedown ? 'The takedown operation failed to capture the organization\'s leadership.' : 'The infiltration operation was compromised.') + ' ' +
        P(COMPROMISE) + ' ' +
        (elites.length ? eliteCombatOrSupport(elites[0],
          elites[0].fullName + ' managed the situation professionally but the overall mission was not recoverable. ',
          elites[0].fullName + ' provided intelligence support throughout but the operational situation was unrecoverable. ') : '') +
        'The organization is now fully alert and has likely dispersed and restructured. Intelligence gathered before the compromise has partial value. ' + P(AFTERMATH_F);

      return headerSection(m, false) + deployedSection(units, elites, m) +
        '<div class="db-section-title">OPERATION TIMELINE</div>' + timeline(entries) + assessmentSection(assess);
    }
  }

  // ---- FAVOR MISSIONS ----
  // Common favor setup
  function favorSetup(m) {
    var cd = currentDay();
    var execDays = m.execDays || R(2,3);
    var opStart = Math.max(1, cd - execDays);
    var fv = m.fillVars || {};
    var city = fv.city || fv.location || 'the area of operations';
    var country = fv.country || 'the target country';
    var agencyName = m.favorAgencyName || fv.agency_name || 'the requesting agency';
    var assetAlias = fv.asset_alias || fv.target_name || fv.alias || 'the subject';
    return { cd: cd, execDays: execDays, opStart: opStart, fv: fv, city: city, country: country, agencyName: agencyName, assetAlias: assetAlias };
  }

  // ---- FAVOR: EXTRACTION / RESCUE ----
  function gen_FAVOR_EXTRACT(m, units, elites, success) {
    var f = favorSetup(m);
    var cs = P(CALLSIGNS);
    var weather = P(WEATHER);
    var isMilRescue = (m.typeId || '').indexOf('MIL_RESCUE') >= 0;
    var subjectDesc = isMilRescue ? P(['the captured service member','the downed pilot','the missing operative','the detained personnel']) : ('"' + f.assetAlias + '"');

    if (success) {
      var entries = [];
      entries.push({ day: f.opStart, events: dayEvents([
        f.agencyName + ' emergency request received. ' + subjectDesc + ' needs extraction from ' + f.city + ', ' + f.country + '.',
        unitShort(units) + ' extraction team assembled. ' + cs + ' designated as team leader. Exfiltration corridors mapped and contingency routes identified.',
        'Intelligence package reviewed: last known location, hostile threat assessment, extraction window confirmed at ' + R(24,72) + ' hours.',
        (elites.length ? eliteCombatOrSupport(elites[0],
          elites[0].fullName + ' attached to extraction team. Primary role: ' + P(['point element','close protection of the asset','rear security during exfil','tactical communications']) + '.',
          elites[0].fullName + ' established secure communications link with ' + f.agencyName + ' station for real-time intelligence relay.') : 'Senior officer designated as ' + f.agencyName + ' liaison for the operation.'),
        'Medical team and emergency evacuation assets pre-staged along the exfiltration route.',
      ])});
      entries.push({ day: f.cd, events: assaultEvents([
        cs + ' team infiltrated ' + f.city + '. ' + weather + '. Moving to contact point.',
        'Contact established with ' + subjectDesc + ' at ' + P(['a pre-arranged safe house','the emergency cache location','a church in the old quarter','a vehicle in an underground parking structure','a hotel room booked under a cover identity']) + '. Subject status: ' + P(['frightened but uninjured','showing signs of stress but ambulatory','minor injuries from pursuit — able to move','exhausted but alert and cooperative']) + '.',
        (elites.length ? eliteCombatOrSupport(elites[0],
          elites[0].fullName + ' confirmed subject identity and initiated security sweep of the immediate area.',
          elites[0].fullName + ' confirmed no hostile communications activity in the area — extraction window is open.') : 'Subject identity confirmed via pre-arranged authentication protocol.'),
        'Extraction commenced. Route: ' + P(['vehicle convoy through city streets to a regional airstrip','on foot through back alleys to a vehicle swap point, then overland to the border','maritime pickup along the coast — small boat to a vessel offshore','diplomatic vehicle to the embassy, then air transfer','overland through rural terrain to a border crossing with pre-arranged passage']) + '.',
        P(['En route, a police checkpoint was encountered — bypassed via alternate route. No compromise.','Transit clean. No pursuit detected.','Minor delay: road blocked by accident. Diverted through side streets. No hostile contact.','Counter-surveillance team confirmed clean — no tails.','Subject became agitated during transit but was calmed and managed.']),
        subjectDesc + ' delivered to ' + P(['a secure agency facility','a '+f.agencyName+' station','a military base','the embassy compound','a partner nation safe house']) + '. ' + f.agencyName + ' confirmed receipt of the asset.',
        'All ' + unitShort(units) + ' personnel extracted from ' + f.country + '. Operation sites sanitized. No footprint remains.',
      ], units)});

      var assess = f.agencyName + ' asset ' + subjectDesc + ' has been successfully extracted from ' + f.city + ', ' + f.country + '. ' +
        unitList(units) + ' executed the extraction cleanly — no hostile contact, no compromise, no attribution. ' +
        (elites.length ? eliteCombatOrSupport(elites[0],
          elites[0].fullName + ' provided critical field security throughout the extraction. ',
          elites[0].fullName + ' provided vital intelligence support — real-time threat monitoring ensured the extraction corridor remained clear. ') : '') +
        'The asset is now in ' + f.agencyName + ' custody for debriefing. This successful extraction strengthens the relationship with ' + f.agencyName + '.';

      return headerSection(m, true) + deployedSection(units, elites, m) +
        '<div class="db-section-title">OPERATION TIMELINE</div>' + timeline(entries) + assessmentSection(assess);
    } else {
      var entries = [];
      entries.push({ day: f.opStart, events: dayEvents([
        f.agencyName + ' extraction request received. ' + subjectDesc + ' in danger in ' + f.city + ', ' + f.country + '.',
        unitShort(units) + ' extraction team assembled and deployed.',
      ])});
      entries.push({ day: f.cd, events: assaultEvents([
        cs + ' team moved to contact point in ' + f.city + '. ' + weather + '.',
        P(['Subject was not at the designated contact point. Emergency protocols initiated — all alternate locations checked. Negative.','Hostile forces had already located ' + subjectDesc + '. The area was compromised when the team arrived.','Team arrived at the contact point but encountered an ambush — hostile forces were waiting. Immediate withdrawal under fire.','Contact established but during extraction, a hostile checkpoint blocked the primary route. Alternate routes were also compromised.','Subject reached the contact point but was followed. Hostile pursuit forced the team to abort extraction to avoid capture of both the asset and our personnel.']),
        (elites.length ? eliteCombatOrSupport(elites[0],
          elites[0].fullName + ' organized the emergency withdrawal.',
          elites[0].fullName + ' detected hostile communications closing on the team\'s position — triggered emergency abort.') : 'Team leader called abort.') + ' All ' + unitShort(units) + ' personnel extracted safely.',
        P(AFTERMATH_F),
      ], units)});

      var assess = 'The extraction of ' + subjectDesc + ' from ' + f.city + ' has failed. ' +
        P(['The subject was not at the contact point — current location unknown.','Hostile forces had already secured the area.','The extraction route was compromised.','The subject is believed captured by hostile elements.']) + ' ' +
        (elites.length ? eliteCombatOrSupport(elites[0],
          elites[0].fullName + ' ensured all agency personnel were extracted safely despite the failed mission. ',
          elites[0].fullName + ' provided intelligence support but the operational situation was not recoverable. ') : '') +
        'This failure will negatively impact the relationship with ' + f.agencyName + '. The fate of ' + subjectDesc + ' is currently unknown.';

      return headerSection(m, false) + deployedSection(units, elites, m) +
        '<div class="db-section-title">OPERATION TIMELINE</div>' + timeline(entries) + assessmentSection(assess);
    }
  }

  // ---- FAVOR: RENDITION ----
  function gen_FAVOR_RENDITION(m, units, elites, success) {
    var f = favorSetup(m);
    var cs = P(CALLSIGNS);
    var weather = P(WEATHER);
    var target = f.fv.target_name || f.fv.alias || 'the target';

    if (success) {
      var entries = [];
      entries.push({ day: f.opStart, events: dayEvents([
        f.agencyName + ' rendition request received. Target: ' + target + ' in ' + f.city + ', ' + f.country + '.',
        unitShort(units) + ' rendition team assembled. ' + cs + ' designated as acquisition lead. Target pattern of life reviewed — acquisition window identified.',
        'Specialized equipment staged: ' + P(['sedation kit with medical supervision','covert transport vehicle with concealed compartment','false identity documents','biometric spoofing equipment for border controls']) + '.',
        (elites.length ? eliteCombatOrSupport(elites[0],
          elites[0].fullName + ' attached to acquisition team. Assigned: target handling and close protection.',
          elites[0].fullName + ' established overwatch from the operations center. Assigned: communications monitoring and early warning.') : 'Senior officer designated as operation coordinator.'),
      ])});
      entries.push({ day: f.cd, events: assaultEvents([
        'Final confirmation: target following predicted routine. ' + cs + ' team deployed to acquisition point. ' + weather + '.',
        'Acquisition executed at ' + P(['a quiet side street during target\'s morning walk','the parking structure beneath target\'s office','a gas station on target\'s commute route','a restaurant where the target dines regularly']) + '. Target ' + P(['subdued with sedative injection within '+R(5,15)+' seconds. No witnesses.','approached by operatives posing as local police. Complied with instructions.','intercepted exiting a vehicle. Secured within seconds.']) ,
        'Counter-surveillance confirmed: acquisition was clean. ' + P(['No CCTV in the area.','Dummy vehicle staged at scene.','Target\'s phone placed in Faraday bag.','Scene sanitized within '+R(3,8)+' minutes.']),
        'Target transported to ' + P(['a regional airstrip','a safe house for temporary holding','a maritime rendezvous point','the embassy compound']) + '. Handoff to ' + f.agencyName + ' completed. Chain of custody documented.',
        'All ' + unitShort(units) + ' elements extracted. Operational sites sanitized.',
      ], units)});

      var assess = 'Target ' + target + ' has been successfully rendered from ' + f.city + ' per ' + f.agencyName + ' request. Acquisition was clean — no witnesses, no compromise, no attribution. ' +
        (elites.length ? eliteCombatOrSupport(elites[0],
          elites[0].fullName + ' ensured smooth target handling throughout the operation. ',
          elites[0].fullName + ' provided continuous communications monitoring — no alerts triggered during the operation. ') : '') +
        'Target is now in ' + f.agencyName + ' custody. This successful rendition strengthens the inter-agency relationship.';

      return headerSection(m, true) + deployedSection(units, elites, m) +
        '<div class="db-section-title">OPERATION TIMELINE</div>' + timeline(entries) + assessmentSection(assess);
    } else {
      var entries = [];
      entries.push({ day: f.opStart, events: dayEvents([
        f.agencyName + ' rendition request received. Target: ' + target + ' in ' + f.city + '.',
        unitShort(units) + ' rendition team assembled and staged.',
      ])});
      entries.push({ day: f.cd, events: assaultEvents([
        cs + ' team deployed to acquisition point. ' + weather + '.',
        P(['Target deviated from routine. Did not appear at the acquisition point.','Target arrived accompanied by '+R(2,4)+' unexpected associates — acquisition non-viable.','On approach, team identified surveillance cameras not present in recon. Abort triggered.','Target\'s vehicle was intercepted but a second vehicle followed. Possible counter-surveillance.','Acquisition initiated but target resisted loudly. Passerby intervened. Team forced to disengage.']),
        'Emergency withdrawal. All team members extracted via ' + P(['pre-planned route','emergency vehicle swap','on-foot dispersal','diplomatic vehicle']) + '. ' + P(AFTERMATH_F),
      ], units)});

      var assess = 'The rendition of ' + target + ' per ' + f.agencyName + ' request has failed. Target remains free and may now be aware of the attempt. ' +
        (elites.length ? eliteCombatOrSupport(elites[0],
          elites[0].fullName + ' managed the emergency withdrawal. ',
          elites[0].fullName + ' provided intelligence support during the abort. ') : '') +
        'This failure will negatively impact the relationship with ' + f.agencyName + '. ' + P(AFTERMATH_F);

      return headerSection(m, false) + deployedSection(units, elites, m) +
        '<div class="db-section-title">OPERATION TIMELINE</div>' + timeline(entries) + assessmentSection(assess);
    }
  }

  // ---- FAVOR: SURVEILLANCE / SIGINT / COVER ----
  function gen_FAVOR_INTEL(m, units, elites, success) {
    var f = favorSetup(m);
    var weather = P(WEATHER);
    var isSigint = (m.typeId || '').indexOf('SIGINT') >= 0;
    var isCover  = (m.typeId || '').indexOf('COVER') >= 0;
    var taskDesc = isSigint ? 'signals intelligence collection' : isCover ? 'cover operation' : 'surveillance';

    if (success) {
      var entries = [];
      entries.push({ day: f.opStart, events: dayEvents([
        f.agencyName + ' request received: ' + taskDesc + ' operation in ' + f.city + ', ' + f.country + '.',
        unitShort(units) + ' assigned. Mission parameters and collection requirements reviewed.',
        (isSigint ? 'SIGINT intercept arrays configured for target frequencies and communications patterns specified by ' + f.agencyName + '.' :
         isCover  ? 'Cover operation planned: ' + P(['false flag recruitment approach','deception operation to misdirect hostile attention','cover story for '+f.agencyName+' activities in the area','diversionary operation to create operational space']) + '.' :
                    'Surveillance positions identified. Observation teams assembled with ' + f.agencyName + '-specified collection priorities.'),
        (elites.length ? eliteCombatOrSupport(elites[0],
          elites[0].fullName + ' designated as field team leader.',
          elites[0].fullName + ' established the intelligence coordination center for the operation.') : 'Senior officer designated as ' + f.agencyName + ' liaison.'),
      ])});
      var collDays = f.execDays > 2 ? f.execDays - 1 : 1;
      for (var d = 1; d < collDays && f.opStart + d < f.cd; d++) {
        entries.push({ day: f.opStart + d, events: dayEvents([
          'Collection day ' + d + '. ' + P([
            R(5,15) + ' communications intercepted. ' + R(2,6) + ' assessed as high-value.',
            'Target activity observed at ' + R(2,4) + ' locations. Pattern documented.',
            isSigint ? 'New frequency identified — target using previously unknown communications channel. Collection redirected.' :
                       'Target met with ' + R(1,3) + ' previously unknown associates. Photos and identifying data captured.',
            'Collection proceeding within ' + f.agencyName + '-specified parameters. No compromise indicators.',
          ]),
        ])});
      }
      entries.push({ day: f.cd, events: dayEvents([
        'Final collection day. All ' + f.agencyName + '-specified intelligence requirements addressed.',
        'Collection package compiled: ' + (isSigint ? R(20,80) + ' intercepted communications, frequency analysis, and ' + R(5,15) + ' priority transcripts.' :
          R(10,40) + ' pages of analysis, ' + R(30,150) + ' photographs, and complete documentation per ' + f.agencyName + ' requirements.'),
        'All surveillance assets withdrawn. ' + P(['All technical devices recovered.','Observation posts sanitized.','No forensic evidence of presence.']) ,
        'Intelligence package transmitted to ' + f.agencyName + '. ' + f.agencyName + ' confirmed receipt and expressed satisfaction.',
      ])});

      var assess = 'The ' + taskDesc + ' operation requested by ' + f.agencyName + ' in ' + f.city + ' has been completed successfully. ' +
        unitList(units) + ' met all specified collection requirements without compromise. ' +
        (elites.length ? eliteCombatOrSupport(elites[0],
          elites[0].fullName + ' led the field collection effort with distinction. ',
          elites[0].fullName + ' provided expert intelligence analysis and coordination throughout. ') : '') +
        'This successful operation strengthens the inter-agency relationship with ' + f.agencyName + '.';

      return headerSection(m, true) + deployedSection(units, elites, m) +
        '<div class="db-section-title">OPERATION TIMELINE</div>' + timeline(entries) + assessmentSection(assess);
    } else {
      var entries = [];
      entries.push({ day: f.opStart, events: dayEvents([
        f.agencyName + ' ' + taskDesc + ' request accepted. ' + unitShort(units) + ' deployed to ' + f.city + '.',
      ])});
      entries.push({ day: f.cd, events: assaultEvents([
        P(['Collection team was detected by target counter-surveillance.','Local security services questioned our personnel, compromising the operation.','Technical equipment failure rendered collection non-viable.','Intelligence provided by '+f.agencyName+' was inaccurate — target not at specified location.','Operational security breach forced immediate withdrawal.']),
        'Operation terminated. All personnel extracted. ' + P(AFTERMATH_F),
        (elites.length ? eliteCombatOrSupport(elites[0],
          elites[0].fullName + ' managed the withdrawal.',
          elites[0].fullName + ' confirmed no further compromise via signals analysis.') : 'No further compromise detected.'),
      ], units)});

      var assess = 'The ' + taskDesc + ' operation for ' + f.agencyName + ' has failed. Collection requirements were not met. ' +
        (elites.length ? eliteCombatOrSupport(elites[0],
          elites[0].fullName + ' ensured safe withdrawal of all personnel. ',
          elites[0].fullName + ' assessed that no ongoing compromise exists. ') : '') +
        'This failure will negatively impact the relationship with ' + f.agencyName + '. ' + P(AFTERMATH_F);

      return headerSection(m, false) + deployedSection(units, elites, m) +
        '<div class="db-section-title">OPERATION TIMELINE</div>' + timeline(entries) + assessmentSection(assess);
    }
  }

  // ---- FAVOR: MILITARY SIGINT INSTALLATION ----
  function gen_FAVOR_SIGINT_INSTALL(m, units, elites, success) {
    var f = favorSetup(m);
    var cs = P(CALLSIGNS);
    var weather = P(WEATHER);
    var facility = f.fv.facility_function || 'the target facility';
    var sigPkg = f.fv.sigint_package || 'a covert SIGINT collection package';
    var c2net = f.fv.c2_network || 'the adversary command network';
    var locDetail = f.fv.location_detail || 'the target installation';

    if (success) {
      var entries = [];
      entries.push({ day: f.opStart, events: dayEvents([
        f.agencyName + ' SIGINT installation request received. Target: ' + facility + ' in ' + f.city + ', ' + f.country + '. Package: ' + sigPkg + '.',
        unitShort(units) + ' infiltration team assembled. ' + cs + ' designated as team leader. SIGINT specialists assigned: package preparation and installation procedures reviewed.',
        'Facility reconnaissance completed via ' + P(['satellite imagery and local HUMINT','technical surveillance of the facility perimeter','a recruited insider with access to floor plans','SIGINT mapping of the facility\'s electronic signature','an agent who previously visited the facility under cover']) + '. Access route and installation point identified.',
        (elites.length ? eliteCombatOrSupport(elites[0],
          elites[0].fullName + ' attached to the infiltration team. Primary role: facility access and security bypass.',
          elites[0].fullName + ' calibrated the collection package for the target environment. Signal parameters configured for ' + c2net + '.') : 'Senior SIGINT specialist confirmed package readiness.'),
        'Installation window confirmed: ' + P(['a scheduled maintenance period at the facility','a shift change creating a '+R(15,45)+'-minute access gap','an organized distraction at the facility perimeter','a power cycling event that temporarily disables security cameras','a pre-arranged cover from a recruited facility employee']) + '.',
      ])});
      entries.push({ day: f.cd, events: assaultEvents([
        cs + ' team deployed to ' + f.city + '. ' + weather + '. Moved to staging position ' + R(1,3) + 'km from the target facility.',
        'Approach to facility initiated. Access via ' + P(['a maintenance entrance on the east side of the building','an underground utility corridor beneath the facility','a rooftop access point reached by adjacent building','a delivery entrance during a staged equipment delivery','a service tunnel identified during reconnaissance']) + '.',
        'Facility perimeter bypassed. Security measures encountered: ' + P(['electronic keycard locks — bypassed with cloned credentials','motion sensors — avoided via pre-mapped blind spots','armed guards on patrol — timed infiltration between rotations','CCTV cameras — looped feed for a '+R(20,40)+'-minute window','biometric access — bypassed using equipment from the recruited insider']) + '.',
        'Installation point reached: ' + P(['a communications junction box in the server room','a fiber-optic trunk line in the cable chase','an RF relay panel on the roof','a network switch room in the basement','an antenna feed point on the exterior']) + '. ' + sigPkg + ' installed in ' + R(8,20) + ' minutes. Connection to ' + c2net + ' confirmed.',
        (elites.length ? eliteCombatOrSupport(elites[0],
          elites[0].fullName + ' maintained perimeter security during the installation, neutralizing a sensor that nearly triggered an alarm.',
          elites[0].fullName + ' verified signal acquisition remotely — confirmed clean take from ' + c2net + '. Package is operational.') : 'Signal acquisition confirmed via remote verification. Package operational.'),
        'Exfiltration via ' + P(['the same route — no indication of detection','an alternate route through the utility corridor','a pre-staged vehicle at a secondary exit','on foot through adjacent terrain to a pickup point']) + '. Facility security unaware of the intrusion.',
        'All ' + unitShort(units) + ' personnel extracted from ' + f.country + '. ' + f.agencyName + ' confirmed signal acquisition and is now managing collection.',
      ], units)});

      var assess = 'The SIGINT installation at ' + locDetail + ' in ' + f.city + ' has been completed successfully. ' + sigPkg + ' is operational and providing ' + f.agencyName + ' with access to ' + c2net + '. ' +
        unitList(units) + ' executed the covert infiltration without detection — the facility remains unaware of the installation. ' +
        (elites.length ? eliteCombatOrSupport(elites[0],
          elites[0].fullName + ' was instrumental in the physical infiltration and security bypass. ',
          elites[0].fullName + ' ensured the collection package was optimally configured for the target signals environment. ') : '') +
        'This high-value installation significantly strengthens the relationship with ' + f.agencyName + ' and provides sustained intelligence access to the adversary C2 network.';

      return headerSection(m, true) + deployedSection(units, elites, m) +
        '<div class="db-section-title">OPERATION TIMELINE</div>' + timeline(entries) + assessmentSection(assess);
    } else {
      var entries = [];
      entries.push({ day: f.opStart, events: dayEvents([
        f.agencyName + ' SIGINT installation request received. Target: ' + facility + ' in ' + f.city + '.',
        unitShort(units) + ' infiltration team assembled. Package: ' + sigPkg + '. Access plan developed.',
      ])});
      entries.push({ day: f.cd, events: assaultEvents([
        cs + ' team deployed to ' + f.city + '. ' + weather + '.',
        'Approach to facility initiated. ' + P(['Security at the facility was significantly higher than intelligence indicated — additional guard patrols detected.','The access window did not materialize — the scheduled maintenance was cancelled without notice.','On approach, team was challenged by facility security. Cover story accepted but access to the installation point was denied.','The recruited insider failed to appear. Without internal support, the security bypass was not achievable.','Electronic security measures at the facility had been upgraded since the reconnaissance phase. Bypass tools were ineffective.']),
        'Installation could not be completed. ' + cs + ' team leader called abort to avoid compromise.',
        'Emergency exfiltration. All personnel extracted via ' + P(EXFIL) + '. ' + P(AFTERMATH_F),
      ], units)});

      var assess = 'The SIGINT installation at ' + locDetail + ' in ' + f.city + ' has failed. The infiltration team was unable to access the installation point. ' +
        (elites.length ? eliteCombatOrSupport(elites[0],
          elites[0].fullName + ' ensured the team\'s safe withdrawal without compromise. ',
          elites[0].fullName + ' confirmed no signals indicating facility awareness of the attempt. ') : '') +
        sigPkg + ' was not deployed. ' + f.agencyName + ' will not receive access to ' + c2net + '. ' +
        'This failure will negatively impact the relationship with ' + f.agencyName + '. A second attempt would require fundamentally different access methodology.';

      return headerSection(m, false) + deployedSection(units, elites, m) +
        '<div class="db-section-title">OPERATION TIMELINE</div>' + timeline(entries) + assessmentSection(assess);
    }
  }

  // ---- FAVOR: DISRUPTION / DETENTION / STRIKE ----
  function gen_FAVOR_ACTION(m, units, elites, success) {
    var f = favorSetup(m);
    var cs = P(CALLSIGNS);
    var weather = P(WEATHER);
    var isDetention = (m.typeId || '').indexOf('DETENTION') >= 0;
    var isStrike    = (m.typeId || '').indexOf('STRIKE') >= 0;
    var taskDesc = isDetention ? 'detention' : isStrike ? 'strike intelligence' : 'disruption';
    var target = f.fv.target_name || f.fv.alias || 'the designated target';

    if (success) {
      var entries = [];
      entries.push({ day: f.opStart, events: dayEvents([
        f.agencyName + ' ' + taskDesc + ' request received. Target: ' + target + ' in ' + f.city + '.',
        unitShort(units) + ' action team assembled. ' + cs + ' designated as team leader. Tactical plan developed per ' + f.agencyName + ' requirements.',
        isStrike ? 'Target intelligence package compiled: location, pattern of life, security posture, and environmental assessment for strike planning.' :
          'Rules of engagement confirmed with ' + f.agencyName + ' liaison. ' + P(['Lethal force authorized if necessary.','Non-lethal approach preferred.','Minimal footprint required — covert entry and exit.','Speed is the priority — no time for subtlety.']),
        (elites.length ? eliteCombatOrSupport(elites[0],
          elites[0].fullName + ' attached to action team. Primary role: ' + P(['tactical lead','close-quarters specialist','explosive entry','target acquisition']) + '.',
          elites[0].fullName + ' integrated into the operations center for real-time intelligence coordination.') : 'Senior officer designated as operation coordinator.'),
      ])});
      entries.push({ day: f.cd, events: assaultEvents([
        cs + ' team deployed to ' + f.city + '. ' + weather + '.',
        isStrike ? 'Observation position established. Target intelligence validated against strike requirements. Photographs, coordinates, and environmental data compiled.' :
          isDetention ? 'Target located at ' + P(['their known residence','a commercial establishment','a vehicle in transit','a public location']) + '. Detention team moved to intercept.' :
          'Target ' + P(['infrastructure','communications node','logistics hub','safe house','financial front']) + ' identified and approached. Entry team in position.',
        isStrike ? 'Strike package compiled: target coordinates confirmed to ' + R(1,3) + 'm accuracy. Collateral damage assessment completed. Package transmitted to ' + f.agencyName + '.' :
          isDetention ? 'Target detained. ' + P(['Subject was compliant.','Subject resisted briefly before being subdued.','Subject attempted to flee — intercepted by the outer cordon.','Subject was cooperative once credentials were presented.']) + ' Transferred to ' + f.agencyName + ' custody.' :
          P(BREACH) + '. ' + P(['Target disrupted. Equipment destroyed per specifications.','Communications infrastructure disabled.','Documents and electronics seized.','Facility rendered non-operational.']) ,
        'Objective achieved. ' + (isStrike ? 'Strike intelligence package delivered to ' + f.agencyName + ' operations center.' : P(['Site sanitized. No attribution.','Evidence of involvement eliminated.','All traces removed.'])),
        'All ' + unitShort(units) + ' personnel extracted. ' + f.agencyName + ' confirmed satisfaction with the result.',
      ], units)});

      var assess = 'The ' + taskDesc + ' operation requested by ' + f.agencyName + ' has been completed successfully. ' +
        unitList(units) + ' executed all objectives within the specified parameters. ' +
        (elites.length ? eliteCombatOrSupport(elites[0],
          elites[0].fullName + ' performance was instrumental to the operation\'s success. ',
          elites[0].fullName + ' provided critical intelligence support throughout. ') : '') +
        'This successful operation strengthens the relationship with ' + f.agencyName + '.';

      return headerSection(m, true) + deployedSection(units, elites, m) +
        '<div class="db-section-title">OPERATION TIMELINE</div>' + timeline(entries) + assessmentSection(assess);
    } else {
      var entries = [];

      if (isStrike) {
        // Strike intelligence failure: analytical/collection failure, not a field raid
        entries.push({ day: f.opStart, events: dayEvents([
          f.agencyName + ' ' + taskDesc + ' request accepted. ' + unitShort(units) + ' assigned. Target: ' + target + ' in ' + f.city + '.',
          'Intelligence collection initiated. SIGINT tasked against known communications signatures. HUMINT sources activated in ' + f.city + ' region.',
          (elites.length ? eliteCombatOrSupport(elites[0],
            elites[0].fullName + ' assigned as lead analyst for target package compilation.',
            elites[0].fullName + ' coordinating multi-source intelligence fusion from the operations center.') : 'Senior analyst designated as package lead.'),
          P(['Initial SIGINT collection returned degraded product — target appears to have changed communication patterns.','HUMINT reporting on target movements was inconsistent with satellite imagery analysis.','Preliminary target location assessment proved inconclusive. Multiple possible sites identified.','Source reporting on target security posture contained significant gaps.']),
        ])});
        entries.push({ day: f.cd, events: dayEvents([
          P(['Target has relocated from the last confirmed position. All collection must be re-baselined.','SIGINT intercepts indicate target is aware of potential monitoring — communications have gone encrypted on an unknown system.','HUMINT source in ' + f.city + ' went silent after the last scheduled reporting window. Status unknown.','Satellite pass over the target area was obscured by weather. Imagery inconclusive for ' + R(2,4) + ' consecutive collection windows.']),
          P(['Cross-referencing available intelligence: confidence level insufficient for strike authorization. Multiple data points contradict each other.','Target pattern-of-life analysis incomplete — only ' + R(20,40) + '% of required observation windows captured.','Collateral damage assessment cannot be completed without confirmed target coordinates. Package is below ' + f.agencyName + ' minimum threshold.','Environmental assessment reveals ' + P(['a school','a hospital','a residential block','a diplomatic compound']) + ' within the blast radius of the probable target location. Strike authorization unlikely without further refinement.']),
          'Intelligence package assessed as INSUFFICIENT CONFIDENCE for strike authorization. ' + f.agencyName + ' notified.',
          (elites.length ? eliteCombatOrSupport(elites[0],
            elites[0].fullName + ' flagged critical gaps in the target package that could not be resolved within the operational window.',
            elites[0].fullName + ' confirmed the analytical assessment: intelligence does not meet strike threshold.') : 'Lead analyst confirmed: targeting data does not meet required confidence level.'),
        ])});

        var assess = 'The strike intelligence operation for ' + f.agencyName + ' has failed to produce a viable targeting package. ' +
          P(['Target location could not be confirmed with sufficient precision.','Intelligence sources provided contradictory reporting on target whereabouts.','The target adopted counter-surveillance measures that degraded our collection capability.','Collection gaps in the operational window prevented completion of the required assessments.']) + ' ' +
          (elites.length ? eliteCombatOrSupport(elites[0],
            elites[0].fullName + ' identified the intelligence shortfalls early, preventing delivery of a flawed package. ',
            elites[0].fullName + ' confirmed no lasting compromise to sources or methods. ') : '') +
          'This failure will negatively impact the relationship with ' + f.agencyName + '. A new collection cycle would be required before re-attempting the target package.';
      } else {
        // Detention / disruption failure: physical field operation
        entries.push({ day: f.opStart, events: dayEvents([
          f.agencyName + ' ' + taskDesc + ' request accepted. ' + unitShort(units) + ' assigned.',
        ])});
        entries.push({ day: f.cd, events: assaultEvents([
          cs + ' team deployed to ' + f.city + '. ' + weather + '.',
          P(['Target was not at the specified location.','Operational conditions were non-viable — '+P(['unexpected security presence','civilian density too high','intelligence was inaccurate','equipment failure at a critical moment'])+'.','Operation was compromised during execution. Immediate withdrawal.','Target had been alerted. Location was abandoned.']),
          (elites.length ? eliteCombatOrSupport(elites[0],
            elites[0].fullName + ' organized the withdrawal.',
            elites[0].fullName + ' confirmed no pursuit via signals monitoring.') : 'Team leader called abort.') + ' ' + P(AFTERMATH_F),
        ], units)});

        var assess = 'The ' + taskDesc + ' operation for ' + f.agencyName + ' has failed. Objectives were not achieved. ' +
          (elites.length ? eliteCombatOrSupport(elites[0],
            elites[0].fullName + ' ensured safe withdrawal. ',
            elites[0].fullName + ' confirmed no lasting compromise. ') : '') +
          'This failure will negatively impact the relationship with ' + f.agencyName + '. ' + P(AFTERMATH_F);
      }

      return headerSection(m, false) + deployedSection(units, elites, m) +
        '<div class="db-section-title">OPERATION TIMELINE</div>' + timeline(entries) + assessmentSection(assess);
    }
  }

  // ---- NETWORK EXPANSION (clandestine source recruitment in foreign theater) ----

  function gen_NETWORK_EXPANSION(m, units, elites, success) {
    var cd = currentDay();
    var execDays = m.execDays || R(5,8);
    var opStart = Math.max(1, cd - execDays);
    var cs = P(CALLSIGNS);
    var fv = m.fillVars || {};
    var city = fv.city || 'the operational area';
    var country = fv.country || 'the target country';
    var theaterName = fv.theater_name || 'the target theater';

    var COVER_PLATFORMS = ['a commercial consulting firm','an import-export company','a foreign media bureau','a diplomatic liaison office','an NGO field office','a technology startup','a language school','a cultural exchange program'];
    var RECRUIT_TARGETS = ['a mid-level military intelligence officer','a foreign ministry official with access to classified cables','a telecommunications engineer with network access','a port authority official controlling customs records','a university professor connected to defense research','a banking executive with visibility into state-linked transactions','a local police commander with informant networks','an airport security supervisor with manifest access'];
    var RECRUIT_METHODS = ['gradual rapport-building over shared professional interests','financial inducement following identification of personal debt','ideological appeal — the source expressed disillusionment with the regime','false-flag approach under the cover of a partner intelligence service','exploitation of a compromising personal situation','professional flattery and staged career opportunities abroad','mutual contact introduction through an existing low-level asset','leveraging family ties — the source has relatives in a Western country'];
    var INFRA_TYPES = ['dead-drop sites at '+R(3,5)+' locations across the city','a secure covert communications channel using encrypted messaging','a safe house in a residential district with multiple exit routes','a brush-pass protocol for document exchange in crowded markets','a vehicle cache with emergency exfiltration kit','a signal plan using pre-arranged visual indicators','a courier network through commercial shipping routes','a backup extraction route via neighboring country border crossing'];

    if (success) {
      var numSources = R(2,4);
      var entries = [];
      // Phase 1: Arrival and cover establishment
      entries.push({ day: opStart, events: dayEvents([
        unitShort(units) + ' advance team arrived in ' + city + ' under cover. Cover platform established: ' + P(COVER_PLATFORMS) + '.',
        'Initial area familiarization. Case officers mapped the local security environment — police presence, surveillance cameras, counter-intelligence patterns.',
        'Target environment assessment completed. ' + P(['Local security services appear stretched thin — favorable operating conditions.','CI presence detected but predictable — standard precautions sufficient.','Moderate surveillance activity in the diplomatic quarter — will require careful tradecraft.','Target-rich environment. Multiple potential recruitment candidates identified through social mapping.']) ,
        elites.length ? eliteCombatOrSupport(elites[0],
          elites[0].fullName + ' embedded with the advance team. Assumed role: ' + P(['team security and counter-surveillance lead','primary recruitment handler','technical operations specialist','field team coordinator']) + '.',
          elites[0].fullName + ' established secure communications link from the operations center. Assigned: real-time intelligence support and source vetting coordination.') : cs + ' team leader established operational rhythm. Daily counter-surveillance detection routes implemented.',
      ])});
      // Phase 2: Source identification and development
      entries.push({ day: opStart + Math.min(2, execDays - 2), events: dayEvents([
        'Source development phase initiated. Primary recruitment target identified: ' + P(RECRUIT_TARGETS) + '. Designated ASSET-1.',
        'Initial contact with ASSET-1 via ' + P(['a staged social encounter at a diplomatic reception','a professional conference introduction','a mutual acquaintance in the business community','a carefully arranged meeting at a public venue']) + '. Assessment: ' + P(['receptive and potentially motivated','cautious but showed interest','ideologically sympathetic — promising','financially stressed — viable leverage point']) + '.',
        'Parallel spotting. Second potential source identified: ' + P(RECRUIT_TARGETS) + '. Designated ASSET-2. ' + P(['Approached through different case officer to compartmentalize.','Development assigned to secondary handler.','Initial assessment pending — background check in progress.']),
        P(['Counter-surveillance team confirmed no hostile monitoring of case officers.','SIGINT sweep detected no technical surveillance on team communications.','Safe house inspection completed — no signs of compromise.','Operational security review: all team members passing counter-surveillance checks.']),
      ])});
      // Phase 3: Recruitment and infrastructure
      entries.push({ day: cd, events: dayEvents([
        'ASSET-1 recruitment pitch delivered. Method: ' + P(RECRUIT_METHODS) + '. Result: ' + P(['ACCEPTED. Source agreed to cooperate. Motivation confirmed as genuine.','ACCEPTED after negotiation. Terms: regular financial compensation and eventual resettlement guarantee.','ACCEPTED. Source volunteered additional information during recruitment meeting as a sign of good faith.']) ,
        numSources > 2 ? ('Additional recruitment: ASSET-' + R(2, numSources) + ' successfully recruited via ' + P(RECRUIT_METHODS) + '. Total active sources: ' + numSources + '.') :
          'ASSET-2 development progressing. Follow-up meeting scheduled. Assessment: high probability of eventual recruitment.',
        'Clandestine infrastructure established: ' + P(INFRA_TYPES) + '. Additionally: ' + P(INFRA_TYPES) + '.',
        'First intelligence product received from ASSET-1. Content: ' + P(['internal government communications regarding military deployments','classified diplomatic correspondence revealing policy positions','security service organizational chart and personnel details','financial records linking state institutions to covert operations','technical specifications of communications monitoring systems']) + '.',
        elites.length ? eliteCombatOrSupport(elites[0],
          elites[0].fullName + ' conducted the primary recruitment meeting. ' + P(['Rapport was exceptional — source expressed full confidence in the handler.','Handled the recruitment with textbook tradecraft. No security indicators.','Managed a complex pitch under difficult conditions — nearby surveillance required an improvised venue change.']),
          elites[0].fullName + ' vetted all source reporting against existing intelligence holdings. Assessment: ' + P(['high-confidence, corroborated by independent reporting.','significant new intelligence with no contradictions in existing holdings.','consistent with known patterns — reliability rated PROBABLE.'])) : 'All recruitment activities conducted per standard tradecraft protocols. No security incidents.',
        'Exfiltration of case officers commenced. Cover platform will remain operational for ongoing source handling. Station handover to permanent resident officer initiated.',
      ])});

      var assess = 'Network expansion operation in ' + city + ', ' + country + ' (' + theaterName + ' theater) achieved all objectives. ' +
        numSources + ' human intelligence sources successfully recruited and producing. Cover platform operational and sustainable. ' +
        'Clandestine infrastructure — including dead drops, safe houses, and secure communications — established and tested. ' +
        (elites.length ? eliteCombatOrSupport(elites[0],
          elites[0].fullName + ' was instrumental in the recruitment phase, personally handling the primary source pitch. ',
          elites[0].fullName + ' provided critical vetting and analytical support from the operations center, ensuring source reliability. ') : '') +
        'Intelligence products already received include reporting on ' + P(['military dispositions','government policy deliberations','security service operations','financial networks','diplomatic communications']) + '. ' +
        theaterName + ' theater intelligence coverage has been significantly upgraded. ' + unitShort(units) + ' performance rated EXCEPTIONAL.';

      return headerSection(m, true) + deployedSection(units, elites, m) +
        '<div class="db-section-title">OPERATION TIMELINE</div>' + timeline(entries) + assessmentSection(assess);
    } else {
      var entries = [];
      entries.push({ day: opStart, events: dayEvents([
        unitShort(units) + ' team deployed to ' + city + ' under cover. Cover platform: ' + P(COVER_PLATFORMS) + '.',
        'Initial area assessment. Case officers began target environment mapping and counter-surveillance routines.',
        elites.length ? eliteCombatOrSupport(elites[0],
          elites[0].fullName + ' embedded with the team. Assumed operational role.',
          elites[0].fullName + ' linked to operations center for remote support coordination.') : cs + ' team leader established operational protocols.',
      ])});
      entries.push({ day: cd, events: dayEvents([
        P(['Cover platform compromised. Local security services visited the office with pointed questions about staff backgrounds. Team initiated emergency protocols.',
           'SIGINT detected encrypted communication mentioning the team\'s cover identities. Source unknown. Immediate threat assessment: HIGH.',
           'Counter-surveillance detected hostile monitoring of the lead case officer. Professional surveillance team — likely local CI or a rival service.',
           'Primary recruitment target failed to appear at scheduled meeting. Subsequent SIGINT indicated the target reported the contact to security services.',
           'Local security conducted an unannounced inspection of the cover platform premises. While no evidence was found, the operational environment is now hostile.']),
        P(['Emergency meeting with ASSET-1 candidate. Source was visibly nervous and ' + P(['refused further contact','claimed to have been approached by security services','demanded immediate extraction — cover potentially blown','did not recognize the case officer, indicating a possible double']) + '.',
           'Attempt to establish infrastructure at the designated safe house location found the property under surveillance. Backup locations similarly compromised.',
           'The team\'s primary communications channel showed signs of interception. Emergency cipher change enacted.']),
        'Team leader ordered operational wind-down. All recruitment activities suspended. Cover stories activated for withdrawal.',
        'Emergency exfiltration of all personnel via ' + P(['commercial flights under backup identities','overland route to neighboring country','diplomatic extraction through the embassy','maritime pickup arranged by station']) + '. All team members accounted for. ' + P(['Cover platform abandoned — likely burned.','Cover identities may be compromised.','Equipment cache left in place — sanitized of attribution.','Local assets notified to go dormant.']),
      ])});

      var assess = 'The network expansion operation in ' + city + ', ' + country + ' (' + theaterName + ') has failed. ' +
        P(['The cover platform was compromised by local counter-intelligence.','Hostile surveillance was detected before recruitment could be completed.','A recruitment target reported the approach to security services.','The operational environment deteriorated beyond acceptable risk levels.']) + ' ' +
        'No sources were successfully recruited. All personnel have been safely extracted but cover identities used in this operation should be considered burned. ' +
        (elites.length ? eliteCombatOrSupport(elites[0],
          elites[0].fullName + ' was deployed but the compromised environment prevented effective operations. ',
          elites[0].fullName + ' detected early indicators of compromise from the operations center, enabling timely extraction. ') : '') +
        theaterName + ' theater intelligence coverage remains at pre-operation levels. A new approach — using different cover, personnel, and entry points — will be required before re-attempting network development. ' +
        unitShort(units) + ' execution was professional — the failure is attributed to the hostile operating environment, not personnel performance.';

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
    FAVOR_BUREAU_SURVEILLANCE: gen_FAVOR_INTEL,
    FAVOR_BUREAU_DISRUPTION: gen_FAVOR_ACTION,
    FAVOR_BUREAU_DETENTION: gen_FAVOR_ACTION,
    FAVOR_AGENCY_RENDITION: gen_FAVOR_RENDITION,
    FAVOR_AGENCY_EXTRACTION: gen_FAVOR_EXTRACT,
    FAVOR_AGENCY_COVER: gen_FAVOR_INTEL,
    FAVOR_MIL_RESCUE: gen_FAVOR_EXTRACT,
    FAVOR_MIL_SIGINT: gen_FAVOR_SIGINT_INSTALL,
    FAVOR_MIL_STRIKE: gen_FAVOR_ACTION,
    NETWORK_EXPANSION: gen_NETWORK_EXPANSION,
    COUNTER_ESPIONAGE: gen_COUNTERINTEL,
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
