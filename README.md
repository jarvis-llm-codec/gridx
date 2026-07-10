# GRIDX

**A Geometry Wars–inspired 3D twin-stick arena shooter — built end-to-end with AI.**

🎮 **[Play it now](https://jarvis-llm-codec.github.io/gridx/)** — no install, no ads, no monetization. Ever.

Fight geometric swarms on a neon sphere. Grab weapons, pop your NOVA, survive the mini-boss, then face the MEGA BOSS at 200 BPM. Global leaderboard included — register your score with a one-line comment.

## The story

This game was built by AI agents, driven by one person (and play-tested by his son):

- **[JARVIS Code](https://jlc-codec.org/)** orchestrated the build — **GLM 5.2** iterated the game as a single self-contained HTML file, **GPT 5.6 (Codex)** reverse-restored that 640KB artifact back into this modular TypeScript codebase, and **Claude** integrated, reviewed, and shipped.
- The reverse-restoration is verified by a **golden-trajectory parity harness**: 3 seeds × 3,000 simulation steps, identical to the original within 1e-9. The full journey — including the AI's working letters (`CODEX_LETTER_*.md`) and restoration notes — is preserved in this repo's history.
- The simulation is 100% DOM-free and deterministic (seeded RNG), which is what makes the parity suite trustworthy.

## Run it

```bash
npm install
npm run dev           # dev server
npm run build         # production build
npm run build:single  # single self-contained HTML (the arcade-cartridge format)
npm test              # 143 unit tests
npm run parity:verify # golden simulation parity vs. the original
```

## Controls

WASD/Arrows move · Mouse aim · Click/Space fire · Shift boost · Q/F bomb (NOVA) · P pause · M mute · R restart. Touch supported (left stick move, right stick aim+fire).

## Contributing

PRs welcome — this project exists to be played with. Good first ideas: new enemy types, new weapons, gamepad support, new bolt visuals. Rules: keep it fun, keep it free, no ads, no tracking. Gameplay balance changes need a new parity baseline (see `docs/RESTORE_NOTES.md`).

## Leaderboard

Backed by Supabase with row-level security and a server-side profanity trigger. The anon key in the client is public by design (RLS-protected). Be nice on the board.

## Credits

- **Music**: "Deadly Contracts" & "Going Undercover" by [Tomasz Kucza](https://opengameart.org/content/retro-synthwave-loops) (CC-BY 4.0) · "Hard Boss Battle 1" by MintoDog (CC0)
- **SFX**: [Kenney](https://kenney.nl) Sci-Fi Sounds & Digital Audio (CC0) · faxcorp Electricity Game Sound Pack (CC0) · BMacZero Tesla recordings (CC0) · rubberduck 100 CC0 SFX #2 (CC0)
- **Engine**: [three.js](https://threejs.org) (MIT)
- Full per-file attribution in `assets/bgm/LICENSES.md` and `assets/sfx/LICENSES.md`

"Geometry Wars" is a trademark of Activision Publishing, Inc. GRIDX is an independent fan-inspired work, not affiliated with or endorsed by Activision.

## License

[Apache-2.0](LICENSE) © 2026 Jun Kim
