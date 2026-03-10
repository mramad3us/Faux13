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

Six global theaters with independent threat levels and volatility. Long-term crises (regional wars, proxy conflicts, cyber campaigns) spawn mission chains and reshape the operational landscape.

### Consequences

Failed operations have repercussions. A botched counter-terrorism raid may trigger retaliatory attacks. A blown foreign operation causes diplomatic blowback. The consequences system creates emergent narrative pressure.

### Inter-Agency Relations

Three partner agencies per country offer support packages when relations are strong. Completing favor missions improves cooperation; failures and scandals degrade it.

### Elite Operatives

Critical successes can spawn named elite units — persistent specialists with unique codenames who provide bonuses on future operations. They can also be killed, captured, or burned.

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

- **14 JS modules** loaded via `<script>` tags
- **CSS custom properties** for theming
- **localStorage** for save/load (20 slots + autosave)
- **Google Fonts** (Share Tech Mono, Rajdhani, Exo 2)

## Project Structure

```
index.html        — Single-page shell: login, game client, game-over screens
game.js           — Core engine: state management, rendering, day loop, UI
missions.js       — Mission template definitions (20+ types with configs)
geopolitics.js    — Theater system, crisis events, geopolitical simulation
plots.js          — Persistent threat organizations, multi-mission chains
operatives.js     — Elite unit system: naming, fate, cooldowns
events.js         — Random event catalog (100+), player choices
emails.js         — Email generation, sender/subject mapping
headlines.js      — Press headline generation
saves.js          — Save/load system, old-save migration
difficulty.js     — DEFCON calculation, dynamic difficulty
cascading.js      — Consequence system: failure spawns new threats
animations.js     — Targeted UI animations
style.css         — Full styling: terminal login, 3-pane email client, panels
```

## License

All rights reserved.
