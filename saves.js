'use strict';
// =============================================================================
// SHADOW DIRECTIVE — Save System
// Uses localStorage. Supports multiple named save slots + autosave.
// =============================================================================

(function () {

  const STORAGE_KEY = 'shadowDirective_saves';
  const AUTOSAVE_ID = '__autosave__';
  const MAX_SAVES   = 20;

  // =========================================================================
  // SERIALIZATION HELPERS
  // =========================================================================

  function serializeState() {
    // Deep-clone G, converting Sets to arrays for JSON
    const snap = JSON.parse(JSON.stringify(G, function (key, value) {
      if (value instanceof Set) return { __set__: true, values: [...value] };
      if (typeof value === 'function') return undefined;
      return value;
    }));
    // cfg is a reference to COUNTRIES[code] — store the code, restore the ref
    snap._countryCode = G.country;
    delete snap.cfg;
    return snap;
  }

  function deserializeState(snap) {
    const cfg = COUNTRIES[snap._countryCode];
    if (!cfg) return null;

    const restored = reviveSets(snap);
    restored.cfg = cfg;
    delete restored._countryCode;
    return restored;
  }

  function reviveSets(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj.__set__) return new Set(obj.values);
    if (Array.isArray(obj)) return obj.map(reviveSets);
    const out = {};
    for (const [k, v] of Object.entries(obj)) {
      out[k] = reviveSets(v);
    }
    return out;
  }

  // =========================================================================
  // STORAGE ACCESS
  // =========================================================================

  function loadAllSaves() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }

  function persistAllSaves(saves) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saves));
    } catch (e) {
      addLog('SAVE ERROR: Storage full or unavailable.', 'log-fail');
    }
  }

  // =========================================================================
  // PUBLIC API
  // =========================================================================

  function saveGame(slotId, label) {
    const saves = loadAllSaves();
    const isAuto = slotId === AUTOSAVE_ID;
    saves[slotId] = {
      label: label || (isAuto ? 'Autosave' : 'Manual Save'),
      agency: G.cfg?.acronym || '—',
      country: G.cfg?.name || '—',
      day: G.day,
      confidence: G.confidence,
      timestamp: Date.now(),
      data: serializeState(),
    };

    // Enforce max saves (exclude autosave from count)
    const manualKeys = Object.keys(saves).filter(k => k !== AUTOSAVE_ID);
    if (manualKeys.length > MAX_SAVES) {
      // Remove oldest
      manualKeys.sort((a, b) => saves[a].timestamp - saves[b].timestamp);
      delete saves[manualKeys[0]];
    }

    persistAllSaves(saves);
    if (!isAuto) addLog('Game saved.', 'log-info');
  }

  function loadGame(slotId) {
    const saves = loadAllSaves();
    const entry = saves[slotId];
    if (!entry || !entry.data) return false;

    const restored = deserializeState(entry.data);
    if (!restored) return false;

    // Replace G contents
    Object.keys(G).forEach(k => delete G[k]);
    Object.assign(G, restored);

    // Migrate old saves: re-fill mission text fields that may contain raw placeholders
    migrateMissionText();

    showScreen('game');
    render();
    addLog('Game loaded.', 'log-info');
    return true;
  }

  function migrateMissionText() {
    if (!G.missions || !G.cfg) return;
    const pa = G.cfg.partnerAgencies || {};
    const baseVars = {
      agency: G.cfg.acronym,
      leaderTitle: G.cfg.leaderTitle,
      bureau_name: pa.BUREAU?.shortName || 'BUREAU',
      agency_name: pa.AGENCY?.shortName || 'AGENCY',
      military_name: pa.MILITARY?.shortName || 'MILITARY',
    };
    const textFields = ['opNarrative', 'initialReport', 'fullReport', 'agencyJustification', 'resultMsg'];
    for (const m of G.missions) {
      const vars = Object.assign({}, baseVars, m.fillVars || {});
      for (const field of textFields) {
        if (m[field] && typeof m[field] === 'string' && m[field].includes('{')) {
          m[field] = fillTemplate(m[field], vars);
        }
      }
    }
  }

  function deleteSave(slotId) {
    const saves = loadAllSaves();
    delete saves[slotId];
    persistAllSaves(saves);
  }

  // =========================================================================
  // MIGRATE EXISTING MISSIONS — fix raw placeholders from older sessions
  // =========================================================================

  let _migrated = false;
  hook('render:after', function () {
    if (_migrated || !G.country) return;
    _migrated = true;
    migrateMissionText();
  });

  // =========================================================================
  // AUTOSAVE — hook into day advance
  // =========================================================================

  hook('day:post', function () {
    saveGame(AUTOSAVE_ID, 'Autosave');
  });

  // =========================================================================
  // SAVE MENU UI
  // =========================================================================

  function formatDate(ts) {
    const d = new Date(ts);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) +
      ' ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  }

  function showSaveMenu() {
    const saves = loadAllSaves();
    const keys = Object.keys(saves).sort((a, b) => {
      // Autosave first, then newest
      if (a === AUTOSAVE_ID) return -1;
      if (b === AUTOSAVE_ID) return 1;
      return saves[b].timestamp - saves[a].timestamp;
    });

    const inGame = G.country !== null;

    let slotsHtml = '';
    if (keys.length === 0) {
      slotsHtml = '<div style="color:var(--text-dim);font-size:11px;padding:16px;text-align:center;">NO SAVES FOUND</div>';
    } else {
      slotsHtml = keys.map(k => {
        const s = saves[k];
        const isAuto = k === AUTOSAVE_ID;
        const label = isAuto ? 'AUTOSAVE' : (s.label || 'Save');
        const tagCls = isAuto ? 'save-tag-auto' : 'save-tag-manual';
        return `<div class="save-slot">
          <div class="save-slot-info">
            <span class="save-tag ${tagCls}">${label}</span>
            <span class="save-agency">${s.agency} — ${s.country}</span>
            <span class="save-detail">Day ${s.day} · Conf ${s.confidence}%</span>
            <span class="save-date">${formatDate(s.timestamp)}</span>
          </div>
          <div class="save-slot-actions">
            <button class="btn-primary save-btn" onclick="window._loadSlot('${k}')">LOAD</button>
            <button class="btn-danger save-btn save-btn-del" onclick="window._deleteSlot('${k}')">DEL</button>
          </div>
        </div>`;
      }).join('');
    }

    const newSaveSection = inGame ? `
      <div class="modal-section">
        <div class="modal-section-title">NEW SAVE</div>
        <div style="display:flex;gap:6px;align-items:center;margin-top:6px;">
          <input type="text" id="save-name-input" class="save-name-input" placeholder="Save name (optional)" maxlength="40">
          <button class="btn-primary" onclick="window._createSave()">SAVE</button>
        </div>
      </div>` : '';

    document.getElementById('modal-title').textContent = 'SAVE / LOAD';
    document.getElementById('modal-body').innerHTML = `
      ${newSaveSection}
      <div class="modal-section">
        <div class="modal-section-title">SAVED GAMES</div>
        <div class="save-slots-list">${slotsHtml}</div>
      </div>
      <div style="margin-top:10px;text-align:right;">
        <button class="btn-neutral" onclick="hideModal()">CLOSE</button>
      </div>
    `;
    showModal();
  }

  // --- Global callbacks for modal buttons ---
  window._createSave = function () {
    const input = document.getElementById('save-name-input');
    const name = input ? input.value.trim() : '';
    const slotId = 'save_' + Date.now();
    saveGame(slotId, name || 'Manual Save — Day ' + G.day);
    showSaveMenu(); // refresh
  };

  window._loadSlot = function (slotId) {
    if (loadGame(slotId)) {
      hideModal();
    } else {
      addLog('Failed to load save.', 'log-fail');
    }
  };

  window._deleteSlot = function (slotId) {
    deleteSave(slotId);
    showSaveMenu(); // refresh
  };

  window.showSaveMenu = showSaveMenu;

  // =========================================================================
  // CHECK FOR SAVES ON BOOT — offer to resume on select screen
  // =========================================================================

  document.addEventListener('DOMContentLoaded', function () {
    const saves = loadAllSaves();
    if (Object.keys(saves).length === 0) return;

    const selectScreen = document.getElementById('screen-select');
    if (!selectScreen) return;

    const resumeBar = document.createElement('div');
    resumeBar.id = 'resume-bar';
    resumeBar.className = 'resume-bar';

    const auto = saves[AUTOSAVE_ID];
    const msg = auto
      ? `Autosave available: ${auto.agency} \u2014 Day ${auto.day}`
      : `${Object.keys(saves).length} save(s) available`;

    resumeBar.innerHTML = `
      <span class="resume-msg">${msg}</span>
      <button class="btn-primary resume-btn" onclick="showSaveMenu()">LOAD GAME</button>
    `;
    selectScreen.querySelector('.select-content').appendChild(resumeBar);
  });

})();
