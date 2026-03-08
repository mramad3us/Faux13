'use strict';
// =============================================================================
// SHADOW DIRECTIVE — Operatives & Squads System
// Depends on game.js (hook, fire, pick, randInt, clamp, addLog, render, G, DEPT_CONFIG)
// =============================================================================

// =============================================================================
// NAME POOLS
// =============================================================================

const OP_FIRST_NAMES = [
  'James','Viktor','Elena','Marcus','Natasha','Declan','Yuri','Claire','Hassan',
  'Ingrid','Rafael','Mei','Dmitri','Sarah','Karim','Lena','Jack','Anya','Pierre',
  'Zara','Nikolai','Grace','Eduardo','Fiona','Omar','Katya','Lucas','Mireille',
  'Sergei','Anika','Ethan','Nadia','Hugo','Diana','Ivan','Camille','Rashid',
  'Isla','Anton','Valentina','Connor','Liora','Felix','Sabine','Aleksandr',
  'Rhea','Tobias','Ines','Roman','Leila','Max','Petra','Julian','Suki','Kael',
];

const OP_LAST_NAMES = [
  'Mercer','Volkov','Navarro','Chen','Okafor','Petrova','Ashford','Karim',
  'Duval','Reeves','Kozlov','Vasquez','Tanaka','Novak','Bishop','Moreau',
  'Strand','Al-Rashid','Fischer','Delacroix','Barrett','Kuznetsova','Santos',
  'Eriksson','Callahan','Zhao','Marchetti','Hendricks','Toure','Kowalski',
  'Raines','Yamamoto','Deveraux','Cross','Beckett','Orlov','Salazar','Werner',
  'Holt','Pavlova','Sinclair','Adeyemi','Brennan','Liang','Khoury','Thorne',
  'Jansen','Reyes','Sato','Gallagher','Burke','Stein','Dubois','Ivanova',
];

const OP_CALLSIGNS = [
  'VIPER','GHOST','ROOK','BISHOP','REAPER','SPHINX','WOLF','HAWK','ORACLE',
  'SHADOW','RAVEN','SPECTRE','FANG','CIPHER','STALKER','MAMBA','APEX','BASILISK',
  'DAGGER','PHANTOM','COBRA','JACKAL','VALKYRIE','NOMAD','WRAITH','TEMPEST',
  'ONYX','MANTIS','SCORPION','ECHO','HAVOC','SABLE','TALON','ZENITH',
];

const SQUAD_PREFIXES = [
  'Iron','Silver','Storm','Black','Red','Steel','Dark','Obsidian','Crimson',
  'Grey','Shadow','Cobalt','Ashen','Frost','Thunder','Midnight','Bronze',
  'Arctic','Ember','Pale',
];

const SQUAD_SUFFIXES = [
  'Wolves','Hawks','Ravens','Daggers','Protocol','Talon','Serpents','Horizon',
  'Shield','Lance','Spear','Falcons','Phantom','Vanguard','Sabre','Tide',
  'Hammer','Sentinel','Arrow','Omen',
];

// Track used names to avoid duplicates within a session
const _usedCallsigns = new Set();
const _usedSquadNames = new Set();

function generateOperativeName() {
  return pick(OP_FIRST_NAMES) + ' ' + pick(OP_LAST_NAMES);
}

function generateCallsign() {
  const avail = OP_CALLSIGNS.filter(c => !_usedCallsigns.has(c));
  const cs = avail.length > 0 ? pick(avail) : pick(OP_CALLSIGNS) + '-' + randInt(2, 99);
  _usedCallsigns.add(cs);
  return cs;
}

function generateSquadName() {
  for (let i = 0; i < 50; i++) {
    const name = pick(SQUAD_PREFIXES) + ' ' + pick(SQUAD_SUFFIXES);
    if (!_usedSquadNames.has(name)) { _usedSquadNames.add(name); return name; }
  }
  return pick(SQUAD_PREFIXES) + ' ' + pick(SQUAD_SUFFIXES) + ' ' + randInt(2, 9);
}

// =============================================================================
// CREATION HELPERS
// =============================================================================

const SOLO_DEPTS = new Set(['ANALYSIS', 'HUMINT', 'SIGINT', 'COUNTER_INTEL']);

function createOperative(dept) {
  const id = 'OP' + (++G.operativeIdCounter);
  const op = {
    id,
    name: generateOperativeName(),
    callsign: generateCallsign(),
    dept,
    missionsCompleted: 0,
    kills: 0,
    recruited: G.day,
    alive: true,
    deathDay: null,
    deathMission: null,
  };
  G.operatives.push(op);
  return op;
}

function createSquad(dept) {
  const id = 'SQ' + (++G.squadIdCounter);
  const count = randInt(2, 4);
  const members = [];
  for (let i = 0; i < count; i++) {
    const op = createOperative(dept);
    members.push(op.id);
  }
  const sq = {
    id,
    name: generateSquadName(),
    dept,
    members,
    missionsCompleted: 0,
    formed: G.day,
    active: true,
  };
  G.squads.push(sq);
  return sq;
}

// =============================================================================
// STATE INIT
// =============================================================================

hook('game:start', () => {
  G.operatives = [];
  G.squads = [];
  G.operativeIdCounter = 0;
  G.squadIdCounter = 0;
});

// =============================================================================
// RECRUITMENT (on investigation critical success)
// =============================================================================

hook('investigation:complete', ({ mission, outcome }) => {
  if (outcome !== 'CRITICAL_SUCCESS') return;
  if (Math.random() > 0.05) return;

  const dept = mission.assignedInvDept || (mission.execDepts && mission.execDepts[0]) || 'FIELD_OPS';
  const dcfg = DEPT_CONFIG.find(d => d.id === dept);

  if (SOLO_DEPTS.has(dept)) {
    const op = createOperative(dept);
    addLog(`RECRUITMENT: Agent ${op.name} '${op.callsign}' has been identified as an exceptional asset. Assigned to ${dcfg?.name || dept}.`, 'log-success');
  } else {
    const sq = createSquad(dept);
    addLog(`SQUAD FORMED: ${sq.name} \u2014 ${dcfg?.name || dept}. ${sq.members.length} operatives assigned.`, 'log-success');
  }
  render();
});

// =============================================================================
// DEATH MECHANICS (on failed operations)
// =============================================================================

hook('operation:resolved', ({ mission, success }) => {
  if (success) {
    // Credit surviving operatives with a mission completion
    creditMissionComplete(mission);
    return;
  }

  const threat = mission.threat || 3;
  const deathChance = threat * 3; // percent
  const deptsUsed = new Set(mission.assignedExecDepts || []);
  const codename = mission.codename || '???';

  // Individual operatives
  for (const op of G.operatives) {
    if (!op.alive) continue;
    if (!deptsUsed.has(op.dept)) continue;
    if (Math.random() * 100 < deathChance) {
      op.alive = false;
      op.deathDay = G.day;
      op.deathMission = codename;
      addLog(`OPERATIVE KIA: Agent ${op.name} '${op.callsign}' killed during OP ${codename}. ${DEPT_CONFIG.find(d => d.id === op.dept)?.name || op.dept} mourns the loss.`, 'log-fail');
    }
  }

  // Squad members
  for (const sq of G.squads) {
    if (!sq.active) continue;
    if (!deptsUsed.has(sq.dept)) continue;
    let casualties = 0;
    for (const memberId of sq.members) {
      const op = G.operatives.find(o => o.id === memberId);
      if (!op || !op.alive) continue;
      if (Math.random() * 100 < deathChance) {
        op.alive = false;
        op.deathDay = G.day;
        op.deathMission = codename;
        casualties++;
        addLog(`SQUAD CASUALTY: ${op.name} of ${sq.name} KIA during OP ${codename}.`, 'log-fail');
      }
    }
    // Disband if all dead
    const alive = sq.members.filter(id => { const o = G.operatives.find(x => x.id === id); return o && o.alive; });
    if (alive.length === 0) {
      sq.active = false;
      addLog(`SQUAD DISBANDED: ${sq.name} \u2014 no surviving members.`, 'log-fail');
    }
  }
});

function creditMissionComplete(mission) {
  const deptsUsed = new Set(mission.assignedExecDepts || []);
  for (const op of G.operatives) {
    if (op.alive && deptsUsed.has(op.dept)) op.missionsCompleted++;
  }
  for (const sq of G.squads) {
    if (sq.active && deptsUsed.has(sq.dept)) sq.missionsCompleted++;
  }
}

// =============================================================================
// PROBABILITY BONUS
// =============================================================================

hook('calcProb:modify', ({ mission, prob, budget, depts }) => {
  const deptsUsed = new Set(depts);
  let bonus = 0;

  // +2% per alive operative matching a used dept (cap +10%)
  for (const op of (G.operatives || [])) {
    if (!op.alive) continue;
    // Skip operatives that are squad members (they contribute via squad bonus)
    if ((G.squads || []).some(sq => sq.active && sq.members.includes(op.id))) continue;
    if (deptsUsed.has(op.dept)) bonus += 2;
  }
  bonus = Math.min(bonus, 10);

  // +3% per surviving squad matching dept used
  let squadBonus = 0;
  for (const sq of (G.squads || [])) {
    if (!sq.active) continue;
    if (deptsUsed.has(sq.dept)) squadBonus += 3;
  }

  return prob + bonus + squadBonus;
});

// =============================================================================
// CSS INJECTION
// =============================================================================

let _rosterCssInjected = false;
function injectRosterCSS() {
  if (_rosterCssInjected) return;
  _rosterCssInjected = true;
  const style = document.createElement('style');
  style.textContent = `
.roster-card {
  border-radius: var(--radius, 4px);
  padding: 10px 12px;
  margin-bottom: 6px;
  font-size: 11px;
  font-family: var(--font-mono, monospace);
}
.roster-operative {
  background: rgba(46, 204, 113, 0.05);
  border: 1px solid rgba(46, 204, 113, 0.2);
  border-left: 3px solid rgba(46, 204, 113, 0.6);
}
.roster-squad {
  background: rgba(52, 152, 219, 0.05);
  border: 1px solid rgba(52, 152, 219, 0.2);
  border-left: 3px solid rgba(52, 152, 219, 0.6);
}
.roster-dead {
  background: rgba(231, 76, 60, 0.05);
  border: 1px solid rgba(231, 76, 60, 0.15);
  border-left: 3px solid rgba(231, 76, 60, 0.3);
  opacity: 0.55;
}
.roster-dead .roster-name {
  text-decoration: line-through;
  color: rgba(231, 76, 60, 0.7);
}
.roster-hdr {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
}
.roster-name {
  font-weight: 600;
  color: var(--text-hi, #e0e0e0);
  letter-spacing: 0.5px;
  flex: 1;
}
.roster-callsign {
  font-size: 9px;
  letter-spacing: 1px;
  padding: 2px 5px;
  border-radius: var(--radius, 4px);
  background: rgba(46, 204, 113, 0.12);
  color: rgba(46, 204, 113, 0.9);
  border: 1px solid rgba(46, 204, 113, 0.25);
}
.roster-squad-badge {
  font-size: 9px;
  letter-spacing: 1px;
  padding: 2px 5px;
  border-radius: var(--radius, 4px);
  background: rgba(52, 152, 219, 0.12);
  color: rgba(52, 152, 219, 0.9);
  border: 1px solid rgba(52, 152, 219, 0.25);
}
.roster-dept {
  font-size: 9px;
  color: var(--text-dim, #888);
  letter-spacing: 0.8px;
}
.roster-stats {
  display: flex;
  gap: 8px;
  margin-top: 4px;
  flex-wrap: wrap;
}
.roster-stat {
  font-size: 9px;
  padding: 1px 5px;
  border-radius: 3px;
  background: var(--bg3, rgba(255,255,255,0.04));
  color: var(--text-dim, #888);
  letter-spacing: 0.5px;
}
.roster-members {
  margin-top: 5px;
  padding-left: 8px;
  border-left: 1px solid var(--border, rgba(255,255,255,0.08));
  font-size: 10px;
  color: var(--text-dim, #888);
}
.roster-members div { padding: 1px 0; }
.roster-members .roster-kia { color: rgba(231, 76, 60, 0.7); text-decoration: line-through; }
.roster-section-hdr {
  font-size: 10px;
  letter-spacing: 1.5px;
  color: var(--text-dim, #888);
  margin: 10px 0 4px;
  padding-bottom: 3px;
  border-bottom: 1px solid var(--border, rgba(255,255,255,0.08));
}
#roster-panel { padding: 8px; }
`;
  document.head.appendChild(style);
}

// =============================================================================
// RENDERING (inject ROSTER tab into right panel)
// =============================================================================

let _rosterTabInjected = false;

hook('render:after', () => {
  injectRosterCSS();

  // Inject tab button and pane if not yet present
  if (!_rosterTabInjected && !document.getElementById('tab-roster')) {
    const tabBar = document.querySelector('.panel-right .panel-hdr-tabs');
    if (!tabBar) return;
    const btn = document.createElement('button');
    btn.className = 'panel-tab';
    btn.id = 'tab-roster';
    btn.setAttribute('onclick', "switchRightTab('roster')");
    btn.innerHTML = 'ROSTER <span class="panel-badge" id="roster-count">0</span>';
    tabBar.appendChild(btn);

    const pane = document.createElement('div');
    pane.id = 'right-tab-roster';
    pane.className = 'right-tab-pane';
    pane.innerHTML = '<div id="roster-panel"></div>';
    const panelRight = document.querySelector('.panel-right');
    if (panelRight) panelRight.appendChild(pane);
    _rosterTabInjected = true;
  }

  renderRoster();
});

function renderRoster() {
  const el = document.getElementById('roster-panel');
  if (!el) return;

  const ops = G.operatives || [];
  const squads = G.squads || [];

  // Update badge count
  const aliveCount = ops.filter(o => o.alive).length;
  const activeSquads = squads.filter(s => s.active).length;
  const badge = document.getElementById('roster-count');
  if (badge) badge.textContent = String(aliveCount + activeSquads);

  let html = '';

  // Solo operatives (not in any active squad)
  const squadMemberIds = new Set();
  for (const sq of squads) {
    if (sq.active) sq.members.forEach(id => squadMemberIds.add(id));
  }
  const soloOps = ops.filter(o => !squadMemberIds.has(o.id));
  const aliveOps = soloOps.filter(o => o.alive);
  const deadOps = soloOps.filter(o => !o.alive);

  if (aliveOps.length || deadOps.length) {
    html += '<div class="roster-section-hdr">OPERATIVES</div>';
    for (const op of aliveOps) html += renderOpCard(op, false);
    for (const op of deadOps) html += renderOpCard(op, true);
  }

  if (squads.length) {
    html += '<div class="roster-section-hdr">SQUADS</div>';
    const active = squads.filter(s => s.active);
    const disbanded = squads.filter(s => !s.active);
    for (const sq of active) html += renderSquadCard(sq, false);
    for (const sq of disbanded) html += renderSquadCard(sq, true);
  }

  if (!html) {
    html = '<div style="color:var(--text-dim,#888);font-size:11px;padding:12px;text-align:center;letter-spacing:0.5px;">NO OPERATIVES RECRUITED</div>';
  }

  el.innerHTML = html;
}

function renderOpCard(op, dead) {
  const dcfg = DEPT_CONFIG.find(d => d.id === op.dept);
  return `<div class="roster-card ${dead ? 'roster-dead' : 'roster-operative'}">
  <div class="roster-hdr">
    <span class="roster-callsign">${op.callsign}</span>
    <span class="roster-name">${op.name}</span>
  </div>
  <div class="roster-dept">${dcfg?.name || op.dept}</div>
  <div class="roster-stats">
    <span class="roster-stat">MISSIONS: ${op.missionsCompleted}</span>
    <span class="roster-stat">DAY ${op.recruited}</span>
    ${dead ? `<span class="roster-stat" style="color:rgba(231,76,60,0.9)">KIA DAY ${op.deathDay}${op.deathMission ? ' \u2014 OP ' + op.deathMission : ''}</span>` : ''}
  </div>
</div>`;
}

function renderSquadCard(sq, disbanded) {
  const dcfg = DEPT_CONFIG.find(d => d.id === sq.dept);
  const members = sq.members.map(id => G.operatives.find(o => o.id === id)).filter(Boolean);
  const aliveCount = members.filter(m => m.alive).length;
  return `<div class="roster-card ${disbanded ? 'roster-dead' : 'roster-squad'}">
  <div class="roster-hdr">
    <span class="roster-squad-badge">SQUAD</span>
    <span class="roster-name">${sq.name}</span>
  </div>
  <div class="roster-dept">${dcfg?.name || sq.dept} \u2014 ${aliveCount}/${members.length} active</div>
  <div class="roster-stats">
    <span class="roster-stat">MISSIONS: ${sq.missionsCompleted}</span>
    <span class="roster-stat">FORMED DAY ${sq.formed}</span>
  </div>
  <div class="roster-members">
    ${members.map(m => `<div class="${m.alive ? '' : 'roster-kia'}">${m.callsign} \u2014 ${m.name}${m.alive ? '' : ' (KIA)'}</div>`).join('')}
  </div>
</div>`;
}
