# Stackline Sprint

Stackline Sprint is an original browser-based falling-block puzzle game built
with [Vite](https://vitejs.dev/). Seven uniquely-named pieces — **Bar, Cube,
Crown, Hook, Crook, Wave, Zag** — fall onto a 10×20 board; clear lines, climb
levels, and chase a high score.

> **Original work, no affiliation.** Stackline Sprint is not affiliated with
> or derived from any other commercial puzzle title. All piece names, colors,
> shapes-as-assets, sounds, copy, and layout were designed for this project.
> Pacing inspiration from competitive falling-block puzzle games is general
> only; no trademarks, trade dress, or asset files of any other title are
> used.

## Quick start

```bash
npm ci          # install pinned dependencies
npm run dev     # start the Vite dev server
npm test        # run the Vitest unit suite
npm run lint    # run ESLint
npm run build   # produce a static dist/ ready to deploy
npm run preview # serve the built dist/ locally for sanity checking
```

The game renders directly into `index.html` — there is no landing page or
splash screen between the page load and the playfield.

## Controls

### Keyboard

| Action               | Default keys                  |
| -------------------- | ----------------------------- |
| Move left / right    | Left / Right arrows, A / D    |
| Soft drop            | Down arrow, S                 |
| Hard drop            | Space                         |
| Rotate clockwise     | Up arrow, X, W                |
| Rotate counter-cw    | Z, Ctrl                       |
| Hold                 | C, Shift                      |
| Pause                | Esc, P                        |
| Restart              | R                             |

Bindings live as a configurable constant in
[`src/ui/input.js`](src/ui/input.js); rebind by editing `KEY_BINDINGS`.

### Touch

On mobile-sized viewports (~375px wide), an on-screen touch pad appears at the
bottom of the screen with buttons for move, rotate, soft drop, hard drop, and
hold. Move and soft-drop buttons auto-repeat when held.

## Project layout

```
src/
  game/    pure game logic — board, pieces, rotation, scoring, gravity, hold
  ui/      DOM glue — renderer, keyboard input, touch pad
tests/     Vitest unit suites for each game-logic module
```

## Tests

`npm test` runs the Vitest suites in `tests/`. Coverage includes:

- piece rotation and wall-kick behaviour
- line-clear detection
- the scoring formula
- level / gravity progression
- the 7-bag-equivalent randomizer
- hold-slot rules

## Deployment

Pushes to `main` trigger the workflow at
[`.github/workflows/pages.yml`](.github/workflows/pages.yml) which runs lint,
tests, and the production build, then publishes `dist/` to GitHub Pages using
the official `actions/configure-pages`, `actions/upload-pages-artifact`, and
`actions/deploy-pages` actions.

PRs and non-main pushes run the lighter [`ci.yml`](.github/workflows/ci.yml)
which verifies lint, tests, and the build without deploying.

## Dependencies

Only build / dev dependencies are used, all installed from npm — no external
script CDNs are loaded by the page:

- `vite` — dev server and build
- `vitest` — unit testing
- `eslint` (with `@eslint/js` and `globals`) — linting

## License

MIT — see [LICENSE](LICENSE).
