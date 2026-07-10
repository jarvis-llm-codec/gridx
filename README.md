# GEOMETRY WARS 3D

A **Geometry Wars 3: Dimensions**–style 3D twin-stick shooter built with
**Three.js + TypeScript**, architected for *scalable, regression-safe growth*.

> The simulation is 100% DOM-free and Three.js-free. Every non-deterministic
> source (spawns, AI jitter, particle spread, camera shake) is driven by a
> **seeded RNG**, so the same `(seed, input-sequence)` always yields the same
> state. That is what makes the unit/regression suite trustworthy.

## Quick start

```bash
npm install
npm run dev        # open the printed http://localhost:5173
npm test           # run the full Vitest regression suite
npm run typecheck  # tsc --noEmit across src + tests
npm run build      # typecheck + production bundle
```

**Controls**

| Action | Keyboard | Mouse |
| --- | --- | --- |
| Move | `W A S D` / Arrows | — |
| Aim | (follows movement) | Mouse position (screen-relative) |
| Fire | `Space` / `Shift`(boost) | Left button (hold) |
| Boost | `Shift` | — |
| Pause | `P` | — |
| Mute | `M` | — |

## Architecture (separation of concerns)

```
src/
  math/        Pure math (Vec3, seeded RNG, wave distortion, sphere mapping)
  core/        Types, config, palette, fixed-timestep GameLoop
  input/       InputState (pure data) + DOM keyboard/mouse adapter
  physics/     Collision (circlesOverlap2 + SpatialHash broad-phase)
  systems/     Score/multiplier, Spawn pacing, CameraShake
  sim/         World (deterministic core), player/bullet/enemy, behaviours, particles
  render/      Three.js only: renderer+bloom, wobbling sphere grid, camera, instanced particles, entities
  main.ts      Browser entry: wires sim <-> render <-> input <-> loop

tests/         Vitest regression suite (mirrors src/)
```

### Why it scales to "hundreds of features" without side-effects

1. **The simulation never imports Three.js or the DOM.** `stepWorld(world, input, dt)`
   returns decoupled `GameEvent[]` (kills, explosions, shockwaves, game-over).
   Renderer/audio *subscribe* to events; they never feed state back into gameplay.
2. **Collisions & scoring are generic over entity types.** They only read
   `position` / `radius` / `hp` / `score` — they never `switch` on enemy type.
   Adding `EnemyType = 'spiral'` means: one new factory branch + one behaviour
   function. Collision, spawn, and scoring logic are untouched.
3. **SpatialHash is a pure accelerator.** Broad-phase only narrows *candidates*;
   narrow-phase still calls `circlesOverlap2`. A test asserts the hash matches a
   brute-force O(n·m) reference, so the accelerator can never change a result.
4. **DI everywhere.** `World` holds an injected `RNG`, `SpawnSystem`, and
   `CameraShake`. Tests construct them directly with fixed seeds.
5. **Fixed timestep** (`GameLoop`) keeps physics deterministic and replayable.

## Implementing a new enemy (extension recipe)

1. Add the discriminant in `src/core/types.ts` (`EnemyType`).
2. Add its stats in `src/core/config.ts` (`CONFIG.enemy.<type>`).
3. Add a factory branch in `src/sim/enemy.ts` (`enemyStats` / `createEnemy`).
4. Add a `case` in `src/sim/enemyBehaviors.ts` (write `e.velocity`).
5. Add its colour in `src/core/palette.ts` + a geometry in
   `src/render/entityRenderer.ts`.

No collision, scoring, or spawn code changes. Re-run `npm test`.

## Regression guarantees (covered by tests)

- `tests/sim/world.test.ts` — **identical seed + input ⇒ identical state** (the
  core regression invariant), plus combat, lives, game-over, and wave-progression.
- `tests/physics/collision.test.ts` — SpatialHash ≣ brute force across 30 random
  layouts.
- `tests/math/*` — vector math, wave continuity, RNG determinism, sphere mapping.
- `tests/systems/*` — multiplier curve, spawn determinism, shake bounds.
- `tests/sim/*` — particle pool bounds, enemy steering vectors.

## Visual features

- **Wobbling sphere grid** — wireframe lat/long sphere displaced each frame by
  pure sine/cosine `waveOffset`, brightened by `waveEnergy` (vertex colours).
- **Bloom** — `EffectComposer` + `UnrealBloomPass` + `OutputPass`; all objects
  use bright emissive/additive materials.
- **Camera** — exponential lerp follow, speed-driven dynamic FOV, trauma-based
  3D shake + roll on big explosions / singularity detonations.
- **Hyper-particles** — a single `InstancedMesh` of thousands of voxels; each
  particle has velocity, damping, lifespan, and a fading neon colour.
