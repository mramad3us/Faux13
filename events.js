'use strict';
// =============================================================================
// SHADOW DIRECTIVE — Random Events System v1.0
// Loaded after game.js. Uses hook/fire system for integration.
// =============================================================================

// =============================================================================
// EVENT DEFINITIONS
// =============================================================================

const EVENT_CATALOG = [

  // ---------------------------------------------------------------------------
  // POLITICAL (weighted negative)
  // ---------------------------------------------------------------------------
  {
    id: 'BUDGET_HEARING',
    category: 'POLITICAL',
    weight: 8,
    sentiment: 'negative',
    label: 'BUDGET HEARING',
    hasChoice: true,
    description: () =>
      `The parliamentary oversight committee has called an emergency session on ${G.cfg.acronym} expenditures. ` +
      `${G.cfg.leaderFormal} cannot shield you from this one.`,
    choices: [
      {
        label: 'COOPERATE — Open the books',
        cls: 'btn-neutral',
        effect(ev) {
          const loss = randInt(4, 8);
          G.budget = Math.max(0, G.budget - loss);
          addLog(`EVENT: Budget hearing concluded. Auditors clawed back ${fmt(loss)}. Compliance noted.`, 'log-warn');
        },
      },
      {
        label: 'STONEWALL — Invoke national security',
        cls: 'btn-danger',
        effect(ev) {
          const confLoss = randInt(4, 8);
          G.confidence = clamp(G.confidence - confLoss, 0, 100);
          addLog(`EVENT: ${G.cfg.acronym} stonewalled oversight. Political fallout: confidence -${confLoss}%.`, 'log-fail');
        },
      },
    ],
  },

  {
    id: 'LEADERSHIP_CHANGE',
    category: 'POLITICAL',
    weight: 4,
    sentiment: 'negative',
    hasChoice: false,
    label: 'LEADERSHIP CHANGE',
    effect() {
      const newConf = randInt(55, 65);
      const delta = newConf - G.confidence;
      G.confidence = newConf;
      const direction = delta >= 0 ? `+${delta}` : `${delta}`;
      addLog(`EVENT: ${G.cfg.leaderTitle.charAt(0).toUpperCase() + G.cfg.leaderTitle.slice(1)} replaced. New leadership — confidence reset to ${newConf}% (${direction}%).`, 'log-warn');
    },
  },

  {
    id: 'POLITICAL_SCANDAL',
    category: 'POLITICAL',
    weight: 6,
    sentiment: 'positive',
    hasChoice: false,
    label: 'POLITICAL SCANDAL',
    effect() {
      const gain = randInt(4, 7);
      G.confidence = clamp(G.confidence + gain, 0, 100);
      addLog(`EVENT: Unrelated political scandal dominates news cycle. Media heat diverted from ${G.cfg.acronym}. Confidence +${gain}%.`, 'log-success');
    },
  },

  {
    id: 'OVERSIGHT_INVESTIGATION',
    category: 'POLITICAL',
    weight: 7,
    sentiment: 'negative',
    hasChoice: false,
    label: 'OVERSIGHT INVESTIGATION',
    effect() {
      G.events.activeEffects.push({
        id: 'OVERSIGHT_DRAIN',
        label: 'Oversight Investigation',
        type: 'confidence_drain',
        perDay: randInt(1, 2),
        daysLeft: 3,
      });
      addLog(`EVENT: Parliamentary oversight committee opened formal investigation into ${G.cfg.acronym}. Confidence will drain for 3 days.`, 'log-fail');
    },
  },

  // ---------------------------------------------------------------------------
  // INTERNAL
  // ---------------------------------------------------------------------------
  {
    id: 'MOLE_SCARE',
    category: 'INTERNAL',
    weight: 7,
    sentiment: 'negative',
    hasChoice: false,
    label: 'MOLE SCARE',
    effect() {
      const deptIds = DEPT_CONFIG.map(d => d.id);
      const targetDept = pick(deptIds);
      const dept = G.depts[targetDept];
      if (dept && dept.capacity > 1) {
        dept.capacity -= 1;
        G.events.activeEffects.push({
          id: 'MOLE_SCARE_' + targetDept,
          label: `Mole Scare — ${dept.short}`,
          type: 'capacity_reduction',
          dept: targetDept,
          amount: 1,
          daysLeft: 5,
        });
        addLog(`EVENT: Counter-intelligence flagged possible penetration in ${dept.name}. Section locked down — capacity reduced by 1 for 5 days.`, 'log-fail');
      } else {
        addLog(`EVENT: Counter-intelligence sweep completed. No penetration found. Operations resume.`, 'log-info');
      }
    },
  },

  {
    id: 'EQUIPMENT_FAILURE',
    category: 'INTERNAL',
    weight: 6,
    sentiment: 'negative',
    hasChoice: false,
    label: 'EQUIPMENT FAILURE',
    effect() {
      const deptIds = DEPT_CONFIG.map(d => d.id);
      const targetDept = pick(deptIds);
      const dept = G.depts[targetDept];
      G.events.activeEffects.push({
        id: 'EQUIP_FAIL_' + targetDept,
        label: `Equipment Failure — ${dept.short}`,
        type: 'efficiency_penalty',
        dept: targetDept,
        penalty: 20,
        daysLeft: 3,
      });
      addLog(`EVENT: Critical systems failure in ${dept.name}. Efficiency degraded by 20% for 3 days.`, 'log-warn');
    },
  },

  {
    id: 'RECRUITMENT_DRIVE',
    category: 'INTERNAL',
    weight: 5,
    sentiment: 'positive',
    hasChoice: true,
    label: 'RECRUITMENT DRIVE',
    description: () =>
      `Personnel division reports a pool of qualified candidates available for fast-track placement. ` +
      `Select a department to receive +1 temporary capacity for 10 days.`,
    choices: DEPT_CONFIG.map(d => ({
      label: `${d.short} (+1 capacity, 10 days)`,
      cls: 'btn-primary',
      effect() {
        const dept = G.depts[d.id];
        dept.capacity += 1;
        G.events.activeEffects.push({
          id: 'RECRUIT_' + d.id,
          label: `Recruitment — ${d.short}`,
          type: 'capacity_boost',
          dept: d.id,
          amount: 1,
          daysLeft: 10,
        });
        addLog(`EVENT: Fast-track recruit assigned to ${dept.name}. +1 capacity for 10 days.`, 'log-success');
      },
    })),
  },

  {
    id: 'INTERNAL_WHISTLEBLOWER',
    category: 'INTERNAL',
    weight: 6,
    sentiment: 'negative',
    hasChoice: true,
    label: 'INTERNAL WHISTLEBLOWER',
    description: () =>
      `An ${G.cfg.acronym} employee has contacted a journalist with classified material. ` +
      `The story has not run yet. You have a narrow window.`,
    choices: [
      {
        label: 'SILENCE — Legal pressure and reassignment',
        cls: 'btn-danger',
        effect() {
          const cost = randInt(3, 6);
          G.budget = Math.max(0, G.budget - cost);
          addLog(`EVENT: Whistleblower contained. Legal fees and settlement: ${fmt(cost)}. Story killed.`, 'log-warn');
        },
      },
      {
        label: 'LET IT PLAY — Accept the exposure',
        cls: 'btn-neutral',
        effect() {
          const confLoss = randInt(5, 9);
          G.confidence = clamp(G.confidence - confLoss, 0, 100);
          addLog(`EVENT: Whistleblower story published. Confidence -${confLoss}%. Damage manageable but persistent.`, 'log-fail');
        },
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // EXTERNAL
  // ---------------------------------------------------------------------------
  {
    id: 'ALLIED_INTEL_GIFT',
    category: 'EXTERNAL',
    weight: 5,
    sentiment: 'positive',
    hasChoice: false,
    label: 'ALLIED INTELLIGENCE',
    effect() {
      const active = G.missions.filter(m => m.status === 'INVESTIGATING' || m.status === 'READY');
      if (active.length > 0) {
        const m = pick(active);
        if (m.intelFields && m.intelFields.length > 0) {
          const unrevealed = m.intelFields.filter(f => !f.revealed);
          if (unrevealed.length > 0) {
            const field = pick(unrevealed);
            field.revealed = true;
            addLog(`EVENT: Allied service provided intelligence on OP ${m.codename}. ${field.label} confirmed.`, 'log-success');
            return;
          }
        }
        addLog(`EVENT: Allied intelligence received — corroborates existing data on OP ${m.codename}. No new information.`, 'log-info');
      } else {
        const xpGain = randInt(1, 3);
        G.xp += xpGain;
        addLog(`EVENT: Allied service shared general intelligence package. +${xpGain} XP.`, 'log-info');
      }
    },
  },

  {
    id: 'FOREIGN_AGENCY_OFFER',
    category: 'EXTERNAL',
    weight: 5,
    sentiment: 'mixed',
    hasChoice: true,
    label: 'FOREIGN AGENCY OFFER',
    condition: () => G.relations && Object.keys(G.relations).length >= 2,
    description: () => {
      const agencies = Object.keys(G.relations);
      const a = agencies[0];
      const b = agencies[1];
      const nameA = G.cfg.partnerAgencies[a]?.shortName || a;
      const nameB = G.cfg.partnerAgencies[b]?.shortName || b;
      return `${nameA} is offering a joint intelligence-sharing arrangement. ` +
        `Accepting will strengthen ties with ${nameA} but ${nameB} views it as a slight.`;
    },
    choices: [
      {
        label: 'ACCEPT — Strengthen first partner',
        cls: 'btn-primary',
        effect() {
          const agencies = Object.keys(G.relations);
          const a = agencies[0];
          const b = agencies[1];
          const nameA = G.cfg.partnerAgencies[a]?.shortName || a;
          const nameB = G.cfg.partnerAgencies[b]?.shortName || b;
          const gain = randInt(5, 10);
          const loss = randInt(3, 6);
          G.relations[a].relation = clamp(G.relations[a].relation + gain, 0, 100);
          G.relations[b].relation = clamp(G.relations[b].relation - loss, 0, 100);
          addLog(`EVENT: Joint arrangement with ${nameA} accepted. Relations: ${nameA} +${gain}, ${nameB} -${loss}.`, 'log-info');
        },
      },
      {
        label: 'DECLINE — Maintain neutrality',
        cls: 'btn-neutral',
        effect() {
          addLog(`EVENT: Joint arrangement declined. No change to inter-agency relations.`, 'log-info');
        },
      },
    ],
  },

  {
    id: 'MEDIA_LEAK',
    category: 'EXTERNAL',
    weight: 8,
    sentiment: 'negative',
    hasChoice: false,
    label: 'MEDIA LEAK',
    effect() {
      const exposed = G.missions.filter(m => m.status === 'INVESTIGATING' || m.status === 'EXECUTING');
      if (exposed.length > 0) {
        const m = pick(exposed);
        const confLoss = randInt(3, 7);
        G.confidence = clamp(G.confidence - confLoss, 0, 100);
        addLog(`EVENT: Media outlet published details of an active operation. OP ${m.codename} partially compromised. Confidence -${confLoss}%.`, 'log-fail');
      } else {
        const confLoss = randInt(1, 3);
        G.confidence = clamp(G.confidence - confLoss, 0, 100);
        addLog(`EVENT: Media leak about ${G.cfg.acronym} activities. No active operations compromised. Confidence -${confLoss}%.`, 'log-warn');
      }
    },
  },

  {
    id: 'DIPLOMATIC_INCIDENT',
    category: 'EXTERNAL',
    weight: 6,
    sentiment: 'negative',
    hasChoice: false,
    label: 'DIPLOMATIC INCIDENT',
    effect() {
      const foreignDept = G.depts['FOREIGN_OPS'];
      if (foreignDept) {
        G.events.activeEffects.push({
          id: 'DIPLOMATIC_FREEZE',
          label: 'Diplomatic Incident — FOREIGN_OPS',
          type: 'capacity_reduction',
          dept: 'FOREIGN_OPS',
          amount: Math.min(2, foreignDept.capacity - 1),
          daysLeft: 4,
        });
        const reduction = Math.min(2, foreignDept.capacity - 1);
        foreignDept.capacity -= reduction;
        addLog(`EVENT: Diplomatic incident abroad. Foreign operations restricted — FOREIGN_OPS capacity -${reduction} for 4 days.`, 'log-fail');
      } else {
        addLog(`EVENT: Diplomatic incident abroad. No direct operational impact.`, 'log-warn');
      }
    },
  },

  // ---------------------------------------------------------------------------
  // OPPORTUNITY
  // ---------------------------------------------------------------------------
  {
    id: 'BLACK_MARKET_INTEL',
    category: 'OPPORTUNITY',
    weight: 5,
    sentiment: 'mixed',
    hasChoice: true,
    label: 'BLACK MARKET INTEL',
    description: () => {
      const cost = Math.max(2, Math.min(6, Math.floor(G.budget * 0.12)));
      return `A broker on the gray market is offering a cache of signals intelligence. ` +
        `Asking price: ${fmt(cost)}. Authenticity is plausible but unverified.`;
    },
    choices: [
      {
        label: 'BUY — Acquire the package',
        cls: 'btn-primary',
        effect() {
          const cost = Math.max(2, Math.min(6, Math.floor(G.budget * 0.12)));
          if (G.budget >= cost) {
            G.budget -= cost;
            const xpGain = randInt(3, 6);
            G.xp += xpGain;
            addLog(`EVENT: Black market intel acquired for ${fmt(cost)}. Analysis yielded +${xpGain} XP.`, 'log-success');
          } else {
            addLog(`EVENT: Insufficient funds to acquire black market intel. Broker walked.`, 'log-warn');
          }
        },
      },
      {
        label: 'PASS — Too risky',
        cls: 'btn-neutral',
        effect() {
          addLog(`EVENT: Black market offer declined. Broker contact burned as a precaution.`, 'log-info');
        },
      },
    ],
  },

  {
    id: 'DEFECTOR_WALKIN',
    category: 'OPPORTUNITY',
    weight: 4,
    sentiment: 'positive',
    hasChoice: false,
    label: 'DEFECTOR WALK-IN',
    effect() {
      const active = G.missions.filter(m =>
        ['INCOMING', 'READY', 'INVESTIGATING'].includes(m.status)
      );
      if (active.length > 0) {
        const m = pick(active);
        if (m.intelFields) {
          const unrevealed = m.intelFields.filter(f => !f.revealed);
          if (unrevealed.length > 0) {
            const field = pick(unrevealed);
            field.revealed = true;
            addLog(`EVENT: Defector walk-in provided actionable intelligence on OP ${m.codename}. ${field.label} confirmed.`, 'log-success');
            return;
          }
        }
        const xpGain = randInt(2, 4);
        G.xp += xpGain;
        addLog(`EVENT: Defector walk-in debriefed. General intelligence value: +${xpGain} XP.`, 'log-success');
      } else {
        const xpGain = randInt(2, 4);
        G.xp += xpGain;
        addLog(`EVENT: Defector walk-in debriefed. No active operations to benefit — general intel value: +${xpGain} XP.`, 'log-info');
      }
    },
  },

  {
    id: 'EMERGENCY_FUNDING',
    category: 'OPPORTUNITY',
    weight: 5,
    sentiment: 'positive',
    hasChoice: false,
    label: 'EMERGENCY FUNDING',
    effect() {
      const boost = randInt(4, 10);
      G.budget += boost;
      addLog(`EVENT: ${G.cfg.leaderFormal} authorized emergency discretionary funds. +${fmt(boost)}.`, 'log-success');
    },
  },

  {
    id: 'TECH_BREAKTHROUGH',
    category: 'OPPORTUNITY',
    weight: 3,
    sentiment: 'positive',
    hasChoice: false,
    label: 'TECHNOLOGY BREAKTHROUGH',
    effect() {
      const deptIds = DEPT_CONFIG.map(d => d.id);
      const targetDept = pick(deptIds);
      const dept = G.depts[targetDept];
      // Store permanent modifier
      if (!G.events.efficiencyMods) G.events.efficiencyMods = {};
      G.events.efficiencyMods[targetDept] = (G.events.efficiencyMods[targetDept] || 0) + 5;
      addLog(`EVENT: R&D breakthrough in ${dept.name}. Permanent +5% efficiency modifier applied.`, 'log-success');
    },
  },

  {
    id: 'COMMS_BLACKOUT',
    category: 'INTERNAL',
    weight: 5,
    sentiment: 'negative',
    hasChoice: false,
    label: 'COMMUNICATIONS BLACKOUT',
    effect() {
      const sigint = G.depts['SIGINT'];
      if (sigint && sigint.capacity > 1) {
        sigint.capacity -= 1;
        G.events.activeEffects.push({
          id: 'COMMS_BLACKOUT_SIGINT',
          label: 'Comms Blackout — SIGINT',
          type: 'capacity_reduction',
          dept: 'SIGINT',
          amount: 1,
          daysLeft: 3,
        });
        addLog(`EVENT: Encrypted communications relay compromised. SIGINT capacity -1 for 3 days.`, 'log-fail');
      } else {
        addLog(`EVENT: Communications relay interrupted. Backup systems held. No operational impact.`, 'log-warn');
      }
    },
  },

  {
    id: 'ASSET_BURNED',
    category: 'EXTERNAL',
    weight: 6,
    sentiment: 'negative',
    hasChoice: false,
    label: 'ASSET BURNED',
    effect() {
      const humint = G.depts['HUMINT'];
      if (humint && humint.capacity > 1) {
        humint.capacity -= 1;
        G.events.activeEffects.push({
          id: 'ASSET_BURNED_HUMINT',
          label: 'Asset Burned — HUMINT',
          type: 'capacity_reduction',
          dept: 'HUMINT',
          amount: 1,
          daysLeft: 4,
        });
        addLog(`EVENT: Foreign service identified and expelled a HUMINT asset. Handler recalled. Capacity -1 for 4 days.`, 'log-fail');
      } else {
        addLog(`EVENT: Reports of a compromised asset overseas. Assessment: low-value contact. Minimal impact.`, 'log-warn');
      }
    },
  },

  {
    id: 'CYBER_INTRUSION',
    category: 'INTERNAL',
    weight: 6,
    sentiment: 'negative',
    hasChoice: true,
    label: 'CYBER INTRUSION',
    description: () =>
      `Network operations detected an advanced persistent threat inside ${G.cfg.acronym} systems. ` +
      `The intrusion is contained but not eliminated. Full purge requires a shutdown.`,
    choices: [
      {
        label: 'FULL PURGE — Shut down and rebuild',
        cls: 'btn-danger',
        effect() {
          const cost = randInt(3, 5);
          G.budget = Math.max(0, G.budget - cost);
          addLog(`EVENT: Full network purge completed. Cost: ${fmt(cost)}. Systems secure.`, 'log-warn');
        },
      },
      {
        label: 'MONITOR — Track the intruder',
        cls: 'btn-neutral',
        effect() {
          if (Math.random() < 0.4) {
            const xpGain = randInt(2, 4);
            G.xp += xpGain;
            addLog(`EVENT: Counter-intelligence tracked the intrusion to a foreign service. Valuable counter-intel gathered. +${xpGain} XP.`, 'log-success');
          } else {
            const confLoss = randInt(3, 6);
            G.confidence = clamp(G.confidence - confLoss, 0, 100);
            addLog(`EVENT: Intrusion persisted. Data exfiltrated before containment. Confidence -${confLoss}%.`, 'log-fail');
          }
        },
      },
    ],
  },

  {
    id: 'SAFE_HOUSE_COMPROMISED',
    category: 'EXTERNAL',
    weight: 5,
    sentiment: 'negative',
    hasChoice: false,
    label: 'SAFE HOUSE COMPROMISED',
    effect() {
      const cost = randInt(2, 5);
      G.budget = Math.max(0, G.budget - cost);
      addLog(`EVENT: Overseas safe house compromised. Emergency relocation and sanitization: ${fmt(cost)}.`, 'log-warn');
    },
  },
];

// =============================================================================
// EVENT ENGINE
// =============================================================================

const EVENTS_CONFIG = {
  baseChance: 0.15,
  minDaysBetween: 5,
  minGameDay: 5,
  negativeWeight: 1.5,  // Negative events weighted 1.5x -> roughly 60/40
};

/**
 * Pick a weighted random event from the catalog.
 */
function pickEvent() {
  const eligible = EVENT_CATALOG.filter(ev => {
    if (ev.condition && !ev.condition()) return false;
    return true;
  });
  if (eligible.length === 0) return null;

  // Build weighted pool: negative events get a multiplier
  const weighted = eligible.map(ev => {
    let w = ev.weight || 5;
    if (ev.sentiment === 'negative') w *= EVENTS_CONFIG.negativeWeight;
    return { ev, w };
  });

  const total = weighted.reduce((s, e) => s + e.w, 0);
  let roll = Math.random() * total;
  for (const entry of weighted) {
    roll -= entry.w;
    if (roll <= 0) return entry.ev;
  }
  return weighted[weighted.length - 1].ev;
}

/**
 * Show an event modal for events that require player choice.
 */
function showEventModal(ev) {
  const title = document.getElementById('modal-title');
  const body = document.getElementById('modal-body');

  title.textContent = `CLASSIFIED — ${ev.label}`;

  const desc = typeof ev.description === 'function' ? ev.description() : (ev.description || '');
  const choicesHtml = ev.choices.map((c, i) =>
    `<button class="${c.cls || 'btn-neutral'}" onclick="window._resolveEvent(${i})" style="margin:4px 0;width:100%">${c.label}</button>`
  ).join('');

  body.innerHTML = `
    <div class="modal-section">
      <div class="modal-section-title" style="font-family:var(--font-disp);letter-spacing:1px">${ev.category} EVENT — DAY ${G.day}</div>
      <p style="font-family:var(--font-body);font-size:12px;line-height:1.5;margin:8px 0">${desc}</p>
    </div>
    <div class="modal-section">
      <div class="modal-section-title">RESPONSE OPTIONS</div>
      <div style="display:flex;flex-direction:column;gap:2px;margin-top:6px">
        ${choicesHtml}
      </div>
    </div>
  `;

  // Store choices for resolution
  window._pendingEventChoices = ev.choices;
  showModal();
}

/**
 * Resolve a player's event choice.
 */
window._resolveEvent = function(choiceIndex) {
  const choices = window._pendingEventChoices;
  if (!choices || !choices[choiceIndex]) return;
  choices[choiceIndex].effect();
  window._pendingEventChoices = null;
  hideModal();
  render();
};

/**
 * Process active temporary effects — remove expired ones and apply ongoing ones.
 */
function tickActiveEffects() {
  const remaining = [];
  for (const eff of G.events.activeEffects) {
    eff.daysLeft--;

    // Apply ongoing effects
    if (eff.type === 'confidence_drain' && eff.daysLeft >= 0) {
      G.confidence = clamp(G.confidence - eff.perDay, 0, 100);
      addLog(`ONGOING: ${eff.label} — confidence -${eff.perDay}%.`, 'log-warn');
    }

    if (eff.daysLeft > 0) {
      remaining.push(eff);
    } else {
      // Expire: reverse capacity effects
      if (eff.type === 'capacity_reduction') {
        const dept = G.depts[eff.dept];
        if (dept) dept.capacity += eff.amount;
        addLog(`RESOLVED: ${eff.label} — ${dept ? dept.short : eff.dept} capacity restored.`, 'log-info');
      }
      if (eff.type === 'capacity_boost') {
        const dept = G.depts[eff.dept];
        if (dept) dept.capacity = Math.max(1, dept.capacity - eff.amount);
        addLog(`RESOLVED: ${eff.label} — temporary personnel rotated out.`, 'log-info');
      }
      if (eff.type === 'efficiency_penalty') {
        addLog(`RESOLVED: ${eff.label} — systems restored to nominal.`, 'log-info');
      }
      if (eff.type === 'confidence_drain') {
        addLog(`RESOLVED: ${eff.label} — political pressure subsided.`, 'log-info');
      }
    }
  }
  G.events.activeEffects = remaining;
}

/**
 * Get the current efficiency modifier for a department from events.
 * Returns a penalty value (0 = no penalty, 20 = 20% penalty, etc.)
 * Also includes permanent tech breakthrough bonuses (as negative penalty = bonus).
 */
function getEventEfficiencyMod(deptId) {
  if (!G.events) return 0;
  let mod = 0;

  // Temporary penalties
  for (const eff of G.events.activeEffects) {
    if (eff.type === 'efficiency_penalty' && eff.dept === deptId) {
      mod += eff.penalty;
    }
  }

  // Permanent bonuses from tech breakthroughs
  if (G.events.efficiencyMods && G.events.efficiencyMods[deptId]) {
    mod -= G.events.efficiencyMods[deptId];
  }

  return mod;
}

// =============================================================================
// HOOKS
// =============================================================================

// Initialize event state when game starts
hook('game:start', () => {
  G.events = {
    lastEventDay: 0,
    activeEffects: [],
    history: [],
    efficiencyMods: {},
  };
});

// Tick active effects at start of each day
hook('day:pre', () => {
  if (!G.events) return;
  if (G.events.activeEffects.length > 0) {
    tickActiveEffects();
  }
});

// Roll for random event at end of each day
hook('day:post', () => {
  if (!G.events) return;
  if (G.day < EVENTS_CONFIG.minGameDay) return;
  if (G.day - G.events.lastEventDay < EVENTS_CONFIG.minDaysBetween) return;
  if (Math.random() > EVENTS_CONFIG.baseChance) return;

  const ev = pickEvent();
  if (!ev) return;

  G.events.lastEventDay = G.day;
  G.events.history.push({ id: ev.id, day: G.day });

  if (ev.hasChoice) {
    showEventModal(ev);
  } else {
    // Auto-resolve
    if (ev.effect) ev.effect();
    render();
  }
});
