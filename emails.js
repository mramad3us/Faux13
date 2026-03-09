'use strict';
// =============================================================================
// SHADOWNET — Email Generation System
// Transforms game state into email-format correspondence.
// Loaded before game.js.
// =============================================================================

// --- Sender identities ---
const EMAIL_SENDERS = {
  ANALYSIS:      { name: 'Chief Analyst',            desk: 'Analysis Bureau' },
  HUMINT:        { name: 'Controller, HUMINT Div.',   desk: 'Human Intelligence Division' },
  SIGINT:        { name: 'Dir. Signals Collection',   desk: 'Signals Intelligence Division' },
  FIELD_OPS:     { name: 'Field Operations Chief',    desk: 'Field Operations Division' },
  SPECIAL_OPS:   { name: 'Commander, Special Ops',    desk: 'Special Activities Division' },
  FOREIGN_OPS:   { name: 'Foreign Ops Controller',    desk: 'Foreign Operations Division' },
  COUNTER_INTEL: { name: 'Chief, Counter-Intel',      desk: 'Counter-Intelligence Division' },

  OPS_CENTER:    { name: 'Operations Center',         desk: 'Joint Operations Center' },
  DEPUTY_DIR:    { name: 'Deputy Director (Admin)',    desk: 'Office of the Deputy Director' },
  OVERSIGHT:     { name: 'Oversight Liaison',          desk: 'Legislative Affairs Office' },
  INTEL_DIGEST:  { name: 'Global Threat Watch',        desk: 'Threat Assessment Center' },
  STATION:       { name: 'Station Chief',              desk: 'Foreign Station' },
  HR:            { name: 'Personnel Division',         desk: 'Human Resources' },
  SECURITY:      { name: 'Security Division',          desk: 'Internal Security' },
  LEADER:        { name: null, desk: null },
  WEEKLY:        { name: 'Deputy Director (Admin)',    desk: 'Office of the Deputy Director' },
  MONTHLY:       { name: null, desk: null },
};

// --- Determine sender for a mission email ---
function getEmailSender(m, status) {
  if (!m) return EMAIL_SENDERS.OPS_CENTER;
  if (status === 'INCOMING' || status === 'new') {
    if (m.location === 'FOREIGN') return EMAIL_SENDERS.STATION;
    if (m.typeId?.includes('COUNTER')) return EMAIL_SENDERS.COUNTER_INTEL;
    if (m.typeId?.includes('HVT')) return EMAIL_SENDERS.FIELD_OPS;
    return EMAIL_SENDERS.ANALYSIS;
  }
  if (status === 'READY' || status === 'BLOWN' || status === 'DEAD_END') {
    return EMAIL_SENDERS[m.assignedInvDept] || EMAIL_SENDERS[m.lastAssignedInvDept] || EMAIL_SENDERS.ANALYSIS;
  }
  if (status === 'SUCCESS' || status === 'FAILURE') return EMAIL_SENDERS.OPS_CENTER;
  if (status === 'EXECUTING') return EMAIL_SENDERS.OPS_CENTER;
  if (status === 'PHASE_COMPLETE') return EMAIL_SENDERS.OPS_CENTER;
  return EMAIL_SENDERS.ANALYSIS;
}

// --- Generate email subject line ---
function getEmailSubject(m, status) {
  if (!m) return 'No Subject';
  const code = `OP ${m.codename}`;
  const st = status || m.status;
  switch (st) {
    case 'INCOMING':
      return `${code} — New Intelligence: ${m.label || m.category}`;
    case 'INVESTIGATING':
      return `RE: ${code} — Investigation Underway`;
    case 'READY':
      if (m.phaseFalseFlag) return `RE: ${code} — ANOMALY DETECTED`;
      return `RE: ${code} — Intelligence Brief Ready`;
    case 'BLOWN':
      return `URGENT: ${code} — OPERATION COMPROMISED`;
    case 'EXECUTING':
      return `RE: ${code} — Operation In Progress`;
    case 'SUCCESS':
      return `FLASH: ${code} — Operation Successful`;
    case 'FAILURE':
      return `FLASH: ${code} — Operation Failed`;
    case 'PHASE_COMPLETE':
      return `RE: ${code} — Phase ${m.currentPhaseIndex} Complete`;
    case 'DEAD_END':
      return `RE: ${code} — Investigation Inconclusive`;
    case 'EXPIRED':
      return `RE: ${code} — Mission Window Closed`;
    default:
      return `${code} — ${m.category}`;
  }
}

// --- Priority classification ---
function getEmailPriority(m) {
  if (!m) return 'ROUTINE';
  if (m.status === 'BLOWN') return 'FLASH';
  if (m.status === 'SUCCESS' || m.status === 'FAILURE') return 'FLASH';
  if (m.threat >= 5) return 'FLASH';
  if (m.threat >= 4) return 'IMMEDIATE';
  if (m.urgencyLeft <= 2) return 'IMMEDIATE';
  if (m.threat >= 3) return 'PRIORITY';
  return 'ROUTINE';
}

// --- Date/time formatting ---
function formatGameDate(day) {
  const start = new Date(2025, 0, 6);
  const d = new Date(start);
  d.setDate(d.getDate() + (day - 1));
  const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

function formatGameTime(day) {
  const h = 6 + (day * 7 + 3) % 12;
  const m = (day * 13 + 7) % 60;
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
}

// --- Classification banner ---
function getClassificationBanner() {
  return 'TOP SECRET // SCI // NOFORN';
}

// --- Build email header HTML ---
function buildEmailHeader(sender, subject, opts = {}) {
  const cfg = typeof G !== 'undefined' ? G.cfg : null;
  const senderName = sender.name || (cfg ? cfg.leaderFormal : 'Director');
  const senderDesk = sender.desk || (cfg ? `Office of ${cfg.leaderTitle}` : 'Executive Office');
  const date = opts.date || (typeof G !== 'undefined' ? formatGameDate(G.day) : '—');
  const time = opts.time || (typeof G !== 'undefined' ? formatGameTime(G.day) : '—');
  const agency = cfg ? cfg.acronym : '—';
  const priority = opts.priority || 'ROUTINE';
  const prioCls = priority === 'FLASH' ? 'prio-flash' : priority === 'IMMEDIATE' ? 'prio-imm' : '';

  return `
    <div class="email-class">${getClassificationBanner()}</div>
    <div class="email-hdr">
      <div class="email-field"><span class="email-field-lbl">FROM:</span> <span class="email-field-val">${senderName}, ${senderDesk}</span></div>
      <div class="email-field"><span class="email-field-lbl">TO:</span> <span class="email-field-val">Director, ${agency}</span></div>
      <div class="email-field"><span class="email-field-lbl">DATE:</span> <span class="email-field-val">${date} ${time}Z</span></div>
      <div class="email-field"><span class="email-field-lbl">SUBJ:</span> <span class="email-field-val ${prioCls}">${subject}</span></div>
      ${priority !== 'ROUTINE' ? `<div class="email-field"><span class="email-field-lbl">PREC:</span> <span class="email-field-val ${prioCls}">${priority}</span></div>` : ''}
      ${opts.cc ? `<div class="email-field"><span class="email-field-lbl">CC:</span> <span class="email-field-val">${opts.cc}</span></div>` : ''}
    </div>
  `;
}

// --- Build reply/action section ---
function buildReplySection(buttons) {
  if (!buttons || buttons.length === 0) return '';
  const btns = buttons.map(b =>
    `<button class="reply-btn ${b.cls || ''}" onclick="${b.onclick}" ${b.disabled ? 'disabled' : ''}
      ${b.tip ? `data-tip="${b.tip}"` : ''}>
      <span class="reply-icon">▸</span> ${b.label}
      ${b.sub ? `<span class="reply-btn-sub">${b.sub}</span>` : ''}
    </button>`
  ).join('');
  return `
    <div class="email-reply">
      <div class="reply-label">REPLY — SELECT ACTION</div>
      <div class="reply-actions">${btns}</div>
    </div>
  `;
}

// --- Build email signature ---
function buildEmailSignature(sender) {
  const senderName = sender.name || 'Operations';
  const senderDesk = sender.desk || '';
  return `
    <div class="email-closing">
      <div class="email-sig-name">${senderName}</div>
      <div class="email-sig-desk">${senderDesk}</div>
      <div class="email-sig-class">This message is classified ${getClassificationBanner()}. Unauthorized disclosure is subject to criminal prosecution.</div>
    </div>
  `;
}

// --- Event email senders ---
function getEventSender(event) {
  if (!event) return EMAIL_SENDERS.OPS_CENTER;
  switch (event.category) {
    case 'POLITICAL':    return EMAIL_SENDERS.OVERSIGHT;
    case 'INTERNAL':     return EMAIL_SENDERS.SECURITY;
    case 'EXTERNAL':     return EMAIL_SENDERS.INTEL_DIGEST;
    case 'OPPORTUNITY':  return EMAIL_SENDERS.DEPUTY_DIR;
    default: return EMAIL_SENDERS.OPS_CENTER;
  }
}

// --- Folder definitions ---
const MAIL_FOLDERS = [
  { id: 'inbox',    label: 'Inbox',        icon: '▸' },
  { id: 'pending',  label: 'Pending',      icon: '◌' },
  { id: 'active',   label: 'Active Ops',   icon: '◉' },
  { id: 'results',  label: 'Results',      icon: '◆' },
  { id: 'threats',  label: 'Threat Files', icon: '▲' },
  { id: 'agencies', label: 'Agencies',     icon: '◇' },
  { id: 'geo',      label: 'World Intel',  icon: '⊕' },
  { id: 'archive',  label: 'Archive',      icon: '□' },
];
