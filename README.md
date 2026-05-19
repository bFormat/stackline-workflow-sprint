# Stackline Workflow Sprint

An original browser-based falling-block game. Stack the falling shapes,
clear rows, climb the levels. The first screen is the playable game —
there is no landing page, splash gate, or route guard.

The game and all of its visuals, copy, palette, and naming are
independently designed.

## Quick start

```bash
npm ci
npm run dev      # local dev server
npm test         # unit tests
npm run lint     # TypeScript typecheck
npm run build    # production build to dist/
npm run preview  # serve the built site locally
```

## Controls

- Arrow Left / Right or A / D — move
- Arrow Up or W / X — rotate clockwise
- Z — rotate counter-clockwise
- Arrow Down or S — soft drop
- Space — hard drop
- C or Shift — hold the current piece
- P or Esc — pause
- R — restart

Mobile / small-viewport users get on-screen control buttons.

## HUD features

- Live **score**, **level**, and **lines-cleared** readouts
- A **hold slot** with one-per-drop swap rule
- A **next queue** that previews the upcoming four shapes
- A **ghost piece** that previews where the current shape will land
- **Pause** and **restart** buttons (and matching keyboard shortcuts)

## Project layout

```
src/
  game/      # pure game logic (board, shapes, scoring, RNG, engine)
  ui/        # canvas rendering and input bindings
  main.ts    # entrypoint that wires everything to the DOM
  style.css  # responsive layout
tests/       # vitest unit tests for the game logic
.github/workflows/pages.yml  # GitHub Pages build + deploy workflow
```

## Deployment

Pushing to `main` triggers `.github/workflows/pages.yml`, which runs
`npm ci && npm run build` from a fresh checkout, uploads the contents of
`dist/`, and publishes the site through the official
`actions/deploy-pages` action.
