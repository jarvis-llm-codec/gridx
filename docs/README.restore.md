# Source Restoration Record

The canonical 658,249-byte HTML was preserved byte-for-byte and reverse-extracted into modular TypeScript.
Three deterministic 3,000-step runs match the original and the built simulation bundle at `1e-9` tolerance.
Vite, self-contained HTML, desktop Chrome, and touch-mobile Chrome gates pass; a human production leaderboard submission remains intentionally manual.

## Canonical Input

- Ground truth: `geometry_wars_3d_glm5_2.html`
- Baseline copy: `geometry_wars_3d_glm5_2.html.bak_reverse_base`
- SHA-256 for both: `4DBB6B707725B9B01314BD9EAEC4C7A3C6EC7CCFCFF1D79FA383F3DF9F3EBFBF`
- Bundled dependency: Three.js r160, matching npm `three@0.160.x`
- Extraction manifest: `.tmp/reverse/manifest.json`

Run the extraction again with:

```powershell
node scripts/extract-ground-truth.mjs
node --check .tmp/reverse/game.module.js
```

The extractor splits the HTML shell, game front/tail, and bundled Three.js block. It also refuses to finish unless reassembly has the canonical SHA-256.

## Restoration Phases

| Phase | Commit | Gate |
|---|---|---|
| 0: baseline | `3c6185c` | Git root commit and hash-identical backup |
| 1: extraction | `e52f55e` | r160 identified; 144,214-byte game module passes `node --check` |
| 2: golden | `09e44a9` | 3 seeds x 3,000 steps are deterministic |
| 3A: core | `9ef0864` | canonical balance/config values and core tests |
| 3B: simulation | `bfea93f` | weapons, items, NOVA, lives, timer bosses, rage scaling |
| 3C: input | `7c3a65a` | projected mouse aim, Q/F NOVA, touch controls |
| 3D: application | `a7405ea` | render, audio, HUD, leaderboard, and Vite shell |
| 4: parity | `53a256b` | source/built parity, normal/single builds, browser smoke |

## Structural Changes

The fossil module layout remains the base architecture. New canonical feature boundaries are:

- `src/sim/weapons.ts`: always-on blaster, missile, lightning, laser, and weapon effects
- `src/sim/items.ts`: deterministic drops, magnet pickup, upgrades, shields, and lives
- `src/sim/boss.ts`: timer-driven mini/mega bosses, post-third rage scaling, and rewards
- `src/ui/leaderboard.ts`: Supabase leaderboard UI and input moderation
- `src/sim/world.ts`: restored collision/combat orchestration and delayed particle budgets

Existing modules were expanded rather than replaced: shared types/config, wave coupling, input, procedural audio, Three.js rendering, HUD, and the game shell now represent the canonical feature set.

## Verification

```powershell
npm run typecheck
npm test
npm run golden:verify
npm run parity:verify
npm run parity:built
npm run build
npm run build:single
npm run smoke:browser -- http://127.0.0.1:4173/
npm audit --omit=dev
```

Verified results at restoration close:

- TypeScript: clean
- Vitest: 21 files, 141 tests passed
- Source trajectory: 3/3 scenarios passed
- Built Vite simulation trajectory: 3/3 scenarios passed
- Normal build: `dist/index.html`
- Self-contained build: `dist-single/index.html`, 590,995 bytes, no external JS/CSS/assets references
- Production dependency audit: 0 vulnerabilities
- Desktop/touch-mobile Chrome: menu, leaderboard, start, NOVA, boss, game-over, canvas-pixel and layout checks passed

## Evidence

- Original trajectory: `tests/golden/original-sim-trajectory.json`
- Built-bundle parity report: `.tmp/reverse/built-parity-report.json`
- Browser report: `.tmp/reverse/browser-smoke-report.json`
- Screenshots: `.tmp/reverse/smoke-*.png`
- Canonical extraction metrics: `.tmp/reverse/manifest.json`

## Remaining Acceptance

The automated smoke deliberately does not POST a score to the production Supabase project. Final human acceptance should play a complete run and confirm weapon drops, boss/NOVA feel, game-over entry, score registration, and leaderboard highlighting. The canonical HTML remains untouched for direct visual/audio comparison.
