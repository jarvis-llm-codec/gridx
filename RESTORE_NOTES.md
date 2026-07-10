# Deferred Post-Restoration Work

These items were intentionally kept outside the parity restoration:

- Add an approved staging Supabase project before automating leaderboard write tests. The current smoke performs no production write.
- Consider screenshot-diff and captured-audio regression baselines. Current automation proves nonblank rendering, layout bounds, interaction flow, and simulation identity, but not pixel- or waveform-identical output.
- Upgrade the Vite 5 / Vitest 1 development toolchain in a separate change. `npm audit --omit=dev` is clean; development-only audit findings should not be mixed into the restored gameplay baseline.
- Review render-only boss choreography with the canonical HTML during Jun's final visual pass, then treat any approved visual adjustment as a new baseline rather than restoration work.
