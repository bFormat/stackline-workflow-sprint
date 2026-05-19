# Stackline Workflow Sprint

Stackline Workflow Sprint is an original, browser-based falling-block puzzle
game. Stack the seven workflow shapes, clear lines, and chase a higher score
as gravity accelerates.

The game is implemented in TypeScript with Vite, renders to an HTML5 canvas,
and is deployed as a static site to GitHub Pages.

## Play

- Live build: <https://bformat.github.io/stackline-workflow-sprint/>
- Local dev: `npm install && npm run dev`
- Production build: `npm run build && npm run preview`

## Controls

### Keyboard

| Action       | Keys                  |
| ------------ | --------------------- |
| Move left    | `ArrowLeft`           |
| Move right   | `ArrowRight`          |
| Soft drop    | `ArrowDown`           |
| Hard drop    | `Space`               |
| Rotate CW    | `ArrowUp` / `X`       |
| Rotate CCW   | `Z`                   |
| Hold piece   | `Shift` / `C`         |
| Pause        | `P` / `Esc`           |
| Restart      | `R`                   |

### Mobile

On touch devices, on-screen buttons provide every action: left, right, soft
drop, rotate, hard drop, hold, pause. The playfield itself also accepts
swipe gestures (left/right to move, down to soft drop, up to rotate, fast
down-swipe to hard drop).

## Scripts

```sh
npm run dev        # Vite dev server
npm run build      # Type-check + production build to dist/
npm run preview    # Preview the production build locally
npm test           # Unit tests with Vitest
npm run lint       # ESLint
npm run typecheck  # tsc --noEmit
npm run format     # Prettier write
```

## Project layout

```
src/
  board.ts      # Playfield grid and collision helpers
  pieces.ts     # Piece shape definitions
  rng.ts        # 7-bag random generator
  rotation.ts   # Rotation system & wall kicks
  scoring.ts    # Score / level / lines bookkeeping
  gravity.ts    # Gravity table by level + lock delay
  input.ts      # Keyboard + touch input
  render.ts     # Canvas renderer
  audio.ts      # WebAudio synth (no-op when unsupported)
  ui.ts         # HUD, overlays, on-screen controls
  game.ts       # Top-level game state machine (engine)
  main.ts       # Entry point: wires modules together
tests/          # Vitest unit tests
public/         # Static assets (none required at present)
```

## Originality & attribution

Stackline Workflow Sprint is an original implementation written from scratch
for this repository. It is **inspired by the classic falling-block puzzle
genre but is not affiliated with, endorsed by, or derived from any
specific commercial product**. No trademarked names, marks, or proprietary
assets are used in the UI copy, code identifiers, or shipped files.

All visual elements are drawn procedurally on a canvas; all audio (when
enabled) is synthesised via the Web Audio API. There are no bundled
third-party assets at runtime. The only dependencies are build-time
development tools (Vite, TypeScript, ESLint, Prettier, Vitest), all of
which are MIT-licensed and listed in `package.json`.

If, in the future, any third-party image, font, or sound is added under a
permissive licence, it will be enumerated here with its source URL and
licence terms.

## Privacy & telemetry

The shipped game performs **no external network requests** at runtime. It
collects no analytics, sets no cookies, and embeds no third-party trackers
(Google Analytics, gtag, Segment, Mixpanel, Hotjar, Sentry, etc.). Once the
static bundle is loaded the game runs entirely in-browser.

## Continuous integration & deployment

- `.github/workflows/ci.yml` runs `typecheck`, `lint`, `test`, and `build`
  on every pull request and every push to `main`.
- `.github/workflows/pages.yml` builds with Vite and deploys `dist/` to
  GitHub Pages. The workflow uses least-privilege permissions
  (`contents: read`, `pages: write`, `id-token: write`) and pins official
  GitHub Actions to their major-version tags.

## Licence

MIT — see [LICENSE](./LICENSE).
