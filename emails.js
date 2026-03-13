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
    if (m.location === 'FOREIGN') {
      // Use theater-specific station name if available
      var theaterId = m.theaterId || (typeof getMissionTheaterId === 'function' ? getMissionTheaterId(m) : null);
      if (theaterId && typeof THEATERS !== 'undefined' && THEATERS[theaterId]) {
        return { name: 'Station Chief', desk: THEATERS[theaterId].name + ' Station' };
      }
      return EMAIL_SENDERS.STATION;
    }
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
    case 'ARCHIVED':
      return `RE: ${code} — File Closed`;
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
  { id: 'inbox',    label: 'Inbox',        iconImg: 'icons/inbox.svg',
    iconSvg: `<svg class="fi-svg fi-inbox" viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path class="fi-tray-top" d="M12 30l8-16h24l8 16"/><path class="fi-tray-body" d="M12 30v14a2 2 0 002 2h36a2 2 0 002-2V30"/><path class="fi-tray-shelf" d="M12 30h12a2 2 0 012 2v2a2 2 0 002 2h8a2 2 0 002-2v-2a2 2 0 012-2h12"/><path class="fi-arrow" d="M32 18v10M28 24l4 4 4-4"/></svg>` },
  { id: 'pending',  label: 'Pending',      iconImg: 'icons/pending.svg',
    iconSvg: `<svg class="fi-svg fi-pending" viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle class="fi-ring" cx="32" cy="32" r="26"/><path class="fi-glass" d="M22 16h20v8l-6 8 6 8v8H22v-8l6-8-6-8z"/><path class="fi-sand" d="M26 44c0-2 2-4 6-6 4 2 6 4 6 6"/></svg>` },
  { id: 'active',   label: 'Active Ops',   iconImg: 'icons/active.svg',
    iconSvg: `<svg class="fi-svg fi-active" viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle class="fi-ring" cx="32" cy="32" r="26"/><polygon class="fi-play" points="26,20 26,44 46,32" fill="currentColor" stroke="none"/></svg>` },
  { id: 'results',  label: 'Results',      iconImg: 'icons/results.svg',
    iconSvg: `<svg class="fi-svg fi-results" viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle class="fi-ring" cx="32" cy="32" r="26"/><rect class="fi-bar fi-bar1" x="20" y="36" width="4" height="6" rx="0.5"/><rect class="fi-bar fi-bar2" x="26" y="30" width="4" height="12" rx="0.5"/><rect class="fi-bar fi-bar3" x="32" y="26" width="4" height="16" rx="0.5"/><rect class="fi-bar fi-bar4" x="38" y="22" width="4" height="20" rx="0.5"/><path class="fi-baseline" d="M20 46h24"/></svg>` },
  { id: 'threats',  label: 'Threat Files', iconImg: 'icons/threats.svg',
    iconSvg: `<svg class="fi-svg fi-threats" viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><g class="fi-skull-group"><path class="fi-bell" d="M32 6C18 6 10 16 10 28c0 8 4 14 8 18v6a2 2 0 002 2h24a2 2 0 002-2v-6c4-4 8-10 8-18C54 16 46 6 32 6z"/><circle class="fi-eye fi-eye-l" cx="24" cy="26" r="4" fill="currentColor"/><circle class="fi-eye fi-eye-r" cx="40" cy="26" r="4" fill="currentColor"/><path class="fi-strike" d="M28 38v8"/><path class="fi-strike" d="M32 38v8"/><path class="fi-strike" d="M36 38v8"/><path class="fi-base" d="M20 54h24"/><path class="fi-base" d="M22 58h20"/></g><circle class="fi-bullet" cx="-4" cy="24" r="2.5" fill="currentColor" stroke="none"/><path class="fi-crack" d="M14 18l6 4-2 6 5 2-1 6 4 3" stroke-width="2" fill="none"/><circle class="fi-impact" cx="14" cy="20" r="0" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>` },
  { id: 'agencies', label: 'Agencies',     iconImg: 'icons/agencies.svg',
    iconSvg: `<svg class="fi-svg fi-agencies" viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle class="fi-ring" cx="32" cy="32" r="26"/><circle class="fi-head fi-head-c" cx="32" cy="22" r="5"/><path class="fi-body fi-body-c" d="M22 46c0-6 4-10 10-10s10 4 10 10"/><circle class="fi-head fi-head-l" cx="18" cy="28" r="4"/><path class="fi-body fi-body-l" d="M10 44c0-4 3-8 8-8"/><circle class="fi-head fi-head-r" cx="46" cy="28" r="4"/><path class="fi-body fi-body-r" d="M54 44c0-4-3-8-8-8"/></svg>` },
  { id: 'geo',      label: 'World Intel',  iconImg: 'icons/world-intel.svg',
    iconSvg: `<svg class="fi-svg fi-globe" viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle class="fi-sphere" cx="32" cy="32" r="24"/><ellipse class="fi-meridian" cx="32" cy="32" rx="10" ry="24"/><path class="fi-lat fi-lat1" d="M10 22h44"/><path class="fi-lat fi-lat2" d="M8 32h48"/><path class="fi-lat fi-lat3" d="M10 42h44"/></svg>` },
  { id: 'archive',  label: 'Archive',      iconImg: 'icons/archive.svg',
    iconSvg: `<svg class="fi-svg fi-archive" viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect class="fi-lid" x="10" y="12" width="44" height="10" rx="2"/><path class="fi-box" d="M14 22v26a2 2 0 002 2h32a2 2 0 002-2V22"/><path class="fi-slot" d="M26 32h12"/></svg>` },
];
