# Pulse — Student OS (v1.0.1 — Version 1 Polished)

A tactile, animated student productivity workspace built with React, Vite, Tailwind CSS v4, Framer Motion, and the Web Audio API.

## Version 1 Polished (`v1.0.1`)

Builds on `v1.0.0` with UI polish and stability fixes:

- Clean task swipe-to-delete backdrops, overflow-clipped notebook ink swatches, and sticky sidebar/topbar layout across routes.
- Explicit responsive container constraints for the dashboard weekly activity chart.
- Per-notebook scoped page undo/redo stacks, session-persisted active page memory (`sessionStorage`), touch-visible delete controls, and fixed-scale ink rendering during 3D page turns.
- Adaptive midnight-rollover timers for deadlines/calendar headers, `Escape`/dialog accessibility trapping across splash and modals, and surfaced `localStorage` quota/write warnings.

## Included in Version 1

- **Custom Opening Splash & Audio**: Kinetic multi-module opener personalized for Jhade with a fluid liquid wave reveal and synthesized Web Audio cues.
- **Dashboard**: Daily study greeting, Due Today / Overdue KPI cards, animated task progress ring, Recharts weekly activity chart, and upcoming deadlines.
- **Tasks & Deadlines**: Create, search, filter, sort, and complete assignments with mini-calendar tracking, streak stats, particle completion bursts, and synthesized sound effects.
- **Multi-Notebook Study Notes**:
  - Create custom student notebooks (name, subject tag, 6 hardcover colors, paper lining, default font).
  - Write with 6 selectable fonts (`Caveat`, `Patrick Hand`, `Kalam`, `Lora`, `Inter`, `JetBrains Mono`) and quick discussion stamps.
  - Sketch or highlight directly over lines with the DPI-aware freehand ink layer.
  - 3D spiral-hinged page-turn animation between pages with matching audio feedback.
  - Unified `Ctrl+Z` / `Ctrl+Y` (and `Cmd+Z` / `Cmd+Shift+Z`) undo & redo across freehand strokes, eraser swipes, typed text bursts, stamps, fonts, and deleted pages/notebooks.

## Planned for Upcoming Versions

- **Timetable**: Weekly class schedule view (currently a preview placeholder).
- **Focus**: Distraction-free Pomodoro timer and study session tracking (currently a preview placeholder).

## Getting Started

```bash
npm install
npm run dev
```

Build for production:

```bash
npm run build
```

## Storage

All tasks and notebooks persist locally in browser `localStorage` (`superapp_tasks_v1`, `superapp_notebooks_v1`, `superapp_sidebar_collapsed`), with active notebook pages remembered per session in `sessionStorage` (`superapp_active_page_map_v1`), with zero external backend dependencies.
