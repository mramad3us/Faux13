# SHADOWNET

A browser-based intelligence agency management simulation inspired by the classic *Floor 13*. Take command of a covert national security directorate and navigate the murky world of espionage, counter-terrorism, and political survival.

## Play

Open `index.html` in any modern browser. No build step, no dependencies, no installation required.

```bash
open index.html
# or serve locally:
python3 -m http.server 8000
```

## Premise

You are the Director. Your agency operates in the shadows — running covert operations, tracking hostile organizations, managing political confidence, and keeping your country safe from threats it will never know about.

Three campaigns are available, each with unique agencies, budgets, and presidential personalities:

| Country | Agency | Partner Agencies | Currency |
|---------|--------|-----------------|----------|
| USA | SAA (Special Activities Authority) | FBI, CIA, DIA | USD |
| UK | JCOB (Joint Covert Operations Bureau) | MI5, MI6, DI | GBP |
| France | DSO (Direction des Services Occultes) | DGSI, DGSE, DRM | EUR |

## Core Mechanics

### Mission Pipeline

Missions arrive as classified correspondence in your inbox and flow through a defined lifecycle:

```
INCOMING → INVESTIGATING → READY → EXECUTING → SUCCESS / FAILURE
```

Each phase requires decisions: which department to assign, whether to proceed on partial intelligence, how to handle compromised operations. Declined or expired missions erode political confidence.

### Departments

Seven specialized units with limited capacity:

- **ANALYSIS** — General intelligence assessment
- **HUMINT** — Agent networks and source handling
- **SIGINT** — Electronic surveillance and intercepts
- **FIELD_OPS** — Domestic covert action teams
- **SPECIAL_OPS** — Paramilitary direct action (extremely limited)
- **FOREIGN_OPS** — International clandestine operations
- **COUNTER_INTEL** — Internal security and mole hunting

Units are consumed during operations and freed upon completion. Capacity can be upgraded with XP earned from successful missions.

### Resource Management

- **Confidence** — Political trust from leadership. Decays weekly. Hits zero = game over.
- **Budget** — Replenished weekly; spent on each operation phase.
- **XP** — Earned from successes; spent on department upgrades.

### Threat Tracking

Persistent hostile organizations and high-value targets generate linked mission chains. Threats are tracked in case files that build intelligence over time:

- **Terrorist Networks** — Multi-cell coordinated operations
- **Espionage Rings** — Foreign penetration of classified programs
- **Weapons Proliferation** — Procurement and transfer networks
- **Criminal Syndicates** — Organized crime with security implications
- **State Proxies** — Deniable hostile government operations

Organizations can be infiltrated and ultimately taken down through multi-phase operations.

### Geopolitics

Eight global theaters with independent threat levels and volatility, each represented by custom SVG icons. Long-term crises (regional wars, proxy conflicts, insurgencies, cyber campaigns, arms races, civil unrest, regime changes, naval standoffs, and intelligence wars) spawn mission chains and reshape the operational landscape.

### Consequences

Failed operations have repercussions. A botched counter-terrorism raid may trigger retaliatory attacks. A blown foreign operation causes diplomatic blowback. The consequences system creates emergent narrative pressure.

### Inter-Agency Relations

Three partner agencies per country offer support packages when relations are strong — tactical teams (FBI HRT, JSOC Tier 1, SAS, GIGN...), SIGINT capabilities, and intelligence briefs. Allied support appears in after-action debriefs with contextual narrative describing their operational contribution. Completing favor missions improves cooperation; failures and scandals degrade it.

### Elite Operatives

Critical successes can spawn named elite units — persistent specialists with unique codenames who provide bonuses on future operations. Only one elite unit per department type can be active at a time. They can also be killed, captured, or burned.

### Save System

Saves are stored in localStorage with 20 manual slots plus autosave. The save menu supports:

- **Export** — Download individual saves as portable JSON files
- **Export All** — Download all saves at once (one file per save)
- **Import** — Load saves from JSON files (multi-select supported, validated before insertion)

Exported saves are fully self-contained and can be shared or transferred between browsers.

### Codenames & Aliases

All entities use procedurally generated names from non-overlapping vocabulary pools:

| Pool | Theme | Combinations |
|------|-------|-------------|
| Mission codenames | Metals, colors, terrain, tactical | ~32,400 |
| Organization names | Sinister, atmospheric | ~7,700 |
| Case file codenames | Mythological figures | 125 |
| Handler aliases | Tradecraft, botanical, geographic | 60 |
| Leader aliases | "THE [profession]" | 80 |
| Infiltration HVT aliases | Animals | 80 |
| Foreign operative aliases | Objects, tools, instruments | 90 |

Active-entity deduplication ensures no two simultaneous missions, HVTs, or operatives share the same codename.

## Controls

| Key | Action |
|-----|--------|
| `N` | Advance one day |
| `Shift+N` | Skip to next event (check mail) |
| `U` | Open upgrades menu |
| `S` | Save game |
| `?` | Help |

## Tech Stack

Pure vanilla JavaScript — no frameworks, no build tools, no transpilation.

- **15 JS modules** loaded via `<script>` tags
- **CSS custom properties** for theming
- **localStorage** for save/load (20 slots + autosave, JSON import/export)
- **Google Fonts** (Share Tech Mono, Rajdhani, Exo 2)

## Project Structure

```
index.html        — Single-page shell: login, game client, game-over screens
game.js           — Core engine: state management, rendering, day loop, UI
missions.js       — Mission template definitions (20+ types with configs)
geopolitics.js    — Theater system, crisis events, geopolitical simulation, SVG icons
factions.js       — Faction networks, foreign operatives, counter-espionage
plots.js          — Persistent threat organizations, multi-mission chains
operatives.js     — Elite unit system: naming, fate, cooldowns
debriefs.js       — Procedural after-action reports with allied support narratives
handover.js       — Inter-agency mission handover system
events.js         — Random event catalog (100+), player choices
emails.js         — Email generation, sender/subject mapping
headlines.js      — Press headline generation
saves.js          — Save/load system, JSON import/export, old-save migration
saves/            — Exported save files
difficulty.js     — DEFCON calculation, dynamic difficulty
cascading.js      — Consequence system: failure spawns new threats
animations.js     — Targeted UI animations
style.css         — Full styling: terminal login, 3-pane email client, panels
icons/            — SVG icons: theaters, events, sidebar, UI elements
saves/            — Exported save files
```

## License

All rights reserved.
