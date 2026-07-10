// AudioEngine.ts — High-quality procedural WebAudio sound + music engine.
// No asset files: every sound and the synthwave BGM are synthesized live.
// The sim stays pure (no DOM); this module lives in the orchestrator layer and
// consumes GameEvent[] produced by stepWorld, plus a fire cue detected by the
// orchestrator (per-bullet diff), so the sim never imports audio.

import type { GameEvent, EnemyKind, ItemKind, WeaponType } from '../core/types.js';

type Maybe<T> = T | null;

/** Per-bus volume targets. BGM quieter than SFX so shots/clears cut through. */
const MIX = {
  master: 0.9,
  sfx: 0.55,
  bgm: 0.22,
};

const clamp = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v);

/**
 * Procedural synthwave audio engine.
 *
 * Lazy-initializes the AudioContext on the first user gesture (resume()) to
 * satisfy autoplay policies. BGM runs on a lookahead scheduler; SFX are
 * scheduled immediately via short-lived nodes routed through a shared bus.
 * Every SFX supports stereo panning based on world position relative to the
 * player, so kills/explodes feel spatial even on stereo output.
 */
export class AudioEngine {
  private ctx: Maybe<AudioContext> = null;
  private master: Maybe<GainNode> = null;
  private sfxBus: Maybe<GainNode> = null;
  private bgmBus: Maybe<GainNode> = null;
  private compressor: Maybe<DynamicsCompressorNode> = null;

  private muted = false;
  private started = false;

  // Shared reusable noise buffer (created once).
  private noiseBuffer: Maybe<AudioBuffer> = null;
  private lightningBuffer: Maybe<AudioBuffer> = null;
  private readonly lightningVoices = new Set<AudioBufferSourceNode>();
  private lastLightningSample = -Infinity;

  // BGM scheduler state.
  private bpm = 128;
  private nextNoteTime = 0;
  private step16 = 0; // 0..15 across a bar; advances per 16th note
  private bar = 0; // chord progression index
  private schedulerTimer: Maybe<number> = null;
  private readonly lookahead = 0.1; // seconds the scheduler runs ahead
  private readonly tickMs = 25; // setInterval cadence

  // Throttle counters (AudioContext.currentTime-based) to avoid SFX floods.
  private lastFireByWeapon: Partial<Record<WeaponType, number>> = Object.create(null);
  private lastSpawn = -Infinity;
  private spawnAccum = 0; // accumulate spawn volume within a window

  private readonly normalChords: number[][] = [
    [130.81, 155.56, 196],
    [103.83, 130.81, 155.56],
    [155.56, 196, 233.08],
    [116.54, 146.83, 174.61],
  ];
  private readonly bossChords: number[][] = [
    [130.81, 155.56, 196],
    [146.83, 174.61, 207.65],
    [130.81, 155.56, 196],
    [196, 233.08, 293.66],
  ];
  private chords = this.normalChords;
  private bossMode = false;
  private externalBgm = false;

  constructor() {}

  // ---------------------------------------------------------------- lifecycle

  /** Resume/create the context on a user gesture, then start the BGM. */
  async resume(): Promise<void> {
    if (!this.ctx) this.initContext();
    const ctx = this.ctx!;
    if (ctx.state === 'suspended') {
      try { await ctx.resume(); } catch { /* ignore */ }
    }
    if (!this.started) {
      this.started = true;
      this.nextNoteTime = ctx.currentTime + 0.08;
      this.schedulerTimer = window.setInterval(() => this.scheduler(), this.tickMs);
      void this.loadLightningSample();
    }
  }

  /** Set mute state (smoothly ramps the master gain). */
  setMuted(m: boolean): void {
    this.muted = m;
    if (!this.master || !this.ctx) return;
    const t = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(t);
    this.master.gain.setTargetAtTime(m ? 0.0001 : MIX.master, t, 0.05);
  }

  isMuted(): boolean { return this.muted; }

  setBossMode(enabled: boolean): void {
    if (enabled === this.bossMode) return;
    this.bossMode = enabled;
    this.bpm = enabled ? 142 : 128;
    this.chords = enabled ? this.bossChords : this.normalChords;
    if (this.bgmBus && this.ctx) {
      const time = this.ctx.currentTime;
      this.bgmBus.gain.cancelScheduledValues(time);
      this.bgmBus.gain.setTargetAtTime(this.externalBgm ? 0.0001 : (enabled ? MIX.bgm * 1.6 : MIX.bgm), time, 0.4);
    }
  }

  /** Mute only the procedural music while preserving all SFX. */
  setExternalBgmActive(active: boolean): void {
    this.externalBgm = active;
    if (!this.bgmBus || !this.ctx) return;
    const t = this.ctx.currentTime;
    this.bgmBus.gain.cancelScheduledValues(t);
    this.bgmBus.gain.setTargetAtTime(active ? 0.0001 : (this.bossMode ? MIX.bgm * 1.6 : MIX.bgm), t, 0.08);
  }

  dispose(): void {
    if (this.schedulerTimer != null) { window.clearInterval(this.schedulerTimer); this.schedulerTimer = null; }
    if (this.ctx) { this.ctx.close().catch(() => {}); this.ctx = null; }
    this.lightningVoices.clear();
    this.lightningBuffer = null;
    this.master = this.sfxBus = this.bgmBus = this.compressor = null;
    this.started = false;
  }

  // ---------------------------------------------------------------- context

  private initContext(): void {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return; // no WebAudio — engine becomes a silent no-op
    const ctx = new Ctx();
    this.ctx = ctx;

    this.compressor = ctx.createDynamicsCompressor();
    this.compressor.threshold.value = -10;
    this.compressor.knee.value = 24;
    this.compressor.ratio.value = 4;
    this.compressor.attack.value = 0.003;
    this.compressor.release.value = 0.25;

    this.master = ctx.createGain();
    this.master.gain.value = this.muted ? 0.0001 : MIX.master;

    this.sfxBus = ctx.createGain();
    this.sfxBus.gain.value = MIX.sfx;

    this.bgmBus = ctx.createGain();
    this.bgmBus.gain.value = MIX.bgm;

    this.sfxBus.connect(this.master);
    this.bgmBus.connect(this.master);
    this.master.connect(this.compressor);
    this.compressor.connect(ctx.destination);

    // Build a 2s white-noise buffer for reuse in explosions/shots/hats.
    const len = ctx.sampleRate * 2;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    this.noiseBuffer = buf;
  }

  private async loadLightningSample(): Promise<void> {
    const ctx = this.ctx;
    if (!ctx) return;
    try {
      const response = await fetch('/assets/sfx/lightning.ogg');
      if (!response.ok) return;
      this.lightningBuffer = await ctx.decodeAudioData(await response.arrayBuffer());
    } catch {
      this.lightningBuffer = null;
    }
  }

  // ---------------------------------------------------------------- helpers

  private get time(): number { return this.ctx ? this.ctx.currentTime : 0; }

  /** Stereo pan in [-1,1] from a world position relative to the player + arena. */
  private panFor(pos: { x: number }, playerX: number, arenaR: number): number {
    const r = arenaR || 26;
    return clamp((pos.x - playerX) / r, -1, 1);
  }

  private makePanner(pan: number): Maybe<StereoPannerNode> {
    if (!this.ctx) return null;
    const p = this.ctx.createStereoPanner();
    p.pan.value = clamp(pan, -1, 1);
    return p;
  }

  /** Noise source routed through an optional filter; caller connects the end. */
  private noiseSource(): Maybe<AudioBufferSourceNode> {
    if (!this.ctx || !this.noiseBuffer) return null;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    src.loop = false;
    return src;
  }

  // ---------------------------------------------------------------- SFX API

  /** Player fired a bullet (called per actual bullet spawned). */
  playFire(kind: WeaponType, pan = 0): void {
    const ctx = this.ctx; if (!ctx || !this.sfxBus) return;
    const t = this.time;
    const fireGap = kind === 'lightning' ? 0.12 : kind === 'missile' ? 0.1 : kind === 'laser' ? 0.08 : 0.06;
    const lastFire = this.lastFireByWeapon[kind] ?? -Infinity;
    if (t - lastFire < fireGap) return;
    this.lastFireByWeapon[kind] = t;

    if (kind === 'lightning' && this.lightningBuffer && t - this.lastLightningSample >= 0.075) {
      this.lastLightningSample = t;
      if (this.lightningVoices.size >= 4) {
        const oldest = this.lightningVoices.values().next().value as AudioBufferSourceNode | undefined;
        oldest?.stop();
        if (oldest) this.lightningVoices.delete(oldest);
      }
      const sample = ctx.createBufferSource();
      sample.buffer = this.lightningBuffer;
      const gain = ctx.createGain();
      gain.gain.value = 0.55;
      const panner = this.makePanner(pan);
      sample.connect(gain);
      gain.connect(panner ?? this.sfxBus);
      panner?.connect(this.sfxBus);
      this.lightningVoices.add(sample);
      sample.addEventListener('ended', () => this.lightningVoices.delete(sample), { once: true });
      sample.start(t);
      return;
    }

    const panner = this.makePanner(pan);
    const out: AudioNode = panner ?? this.sfxBus;
    if (panner) panner.connect(this.sfxBus);

    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    const lightning = kind === 'lightning';
    const base = { blaster: 1200, missile: 260, lightning: 1850, laser: 1050 }[kind];
    const end = kind === 'missile' ? 90 : lightning ? 210 : 300;
    const duration = lightning ? 0.18 : 0.09;
    osc.frequency.setValueAtTime(base, t);
    osc.frequency.exponentialRampToValueAtTime(end, t + duration);

    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(lightning ? 5200 : 3200, t);
    lp.frequency.exponentialRampToValueAtTime(lightning ? 1250 : 900, t + duration);
    lp.Q.value = lightning ? 2.4 : 1.1;

    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(lightning ? 0.34 : kind === 'missile' ? 0.26 : 0.22, t + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, t + duration);

    osc.connect(lp); lp.connect(g); g.connect(out as AudioNode);
    osc.start(t); osc.stop(t + duration + 0.02);

    if (lightning) {
      const thunder = ctx.createOscillator();
      thunder.type = 'square';
      thunder.frequency.setValueAtTime(310, t);
      thunder.frequency.exponentialRampToValueAtTime(72, t + 0.16);
      const thunderGain = ctx.createGain();
      thunderGain.gain.setValueAtTime(0.2, t);
      thunderGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.17);
      thunder.connect(thunderGain); thunderGain.connect(out);
      thunder.start(t); thunder.stop(t + 0.18);
    }

    // Tiny noise transient for the "click".
    const n = this.noiseSource(); if (n) {
      const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = lightning ? 1050 : 2500;
      const ng = ctx.createGain();
      const noiseDuration = lightning ? 0.14 : 0.03;
      ng.gain.setValueAtTime(lightning ? 0.3 : 0.18, t);
      ng.gain.exponentialRampToValueAtTime(0.0001, t + noiseDuration);
      n.connect(hp); hp.connect(ng); ng.connect(out as AudioNode);
      n.start(t); n.stop(t + noiseDuration + 0.01);
    }
  }

  /** Enemy killed. Scales with kind (singularity = huge explosion). */
  playKill(kind: EnemyKind, pan = 0): void {
    const ctx = this.ctx; if (!ctx || !this.sfxBus) return;
    const t = this.time;
    const big = kind === 'singularity';

    const panner = this.makePanner(pan);
    const dest: AudioNode = panner ?? this.sfxBus;
    if (panner) panner.connect(this.sfxBus);

    // Noise body through a sweeping lowpass.
    const n = this.noiseSource(); if (n) {
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.setValueAtTime(big ? 1800 : 2600, t);
      lp.frequency.exponentialRampToValueAtTime(big ? 120 : 400, t + (big ? 0.5 : 0.18));
      lp.Q.value = big ? 6 : 2;
      const g = ctx.createGain();
      const peak = big ? 0.5 : 0.28;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(peak, t + 0.006);
      g.gain.exponentialRampToValueAtTime(0.0001, t + (big ? 0.6 : 0.22));
      n.connect(lp); lp.connect(g); g.connect(dest);
      n.start(t); n.stop(t + (big ? 0.62 : 0.24));
    }

    // Tonal pop / sub boom.
    const osc = ctx.createOscillator();
    osc.type = big ? 'sine' : 'triangle';
    const f0 = big ? 130 : kind === 'dodger' ? 520 : kind === 'wanderer' ? 380 : 300;
    const f1 = big ? 42 : f0 * 0.35;
    osc.frequency.setValueAtTime(f0, t);
    osc.frequency.exponentialRampToValueAtTime(f1, t + (big ? 0.5 : 0.16));
    const og = ctx.createGain();
    const peak = big ? 0.4 : 0.18;
    og.gain.setValueAtTime(0.0001, t);
    og.gain.exponentialRampToValueAtTime(peak, t + 0.006);
    og.gain.exponentialRampToValueAtTime(0.0001, t + (big ? 0.55 : 0.18));
    osc.connect(og); og.connect(dest);
    osc.start(t); osc.stop(t + (big ? 0.6 : 0.2));

    if (big) {
      // Bright crackle layer for the singularity detonation.
      const c = this.noiseSource(); if (c) {
        const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 3000;
        const cg = ctx.createGain();
        cg.gain.setValueAtTime(0.25, t);
        cg.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
        c.connect(hp); hp.connect(cg); cg.connect(dest);
        c.start(t); c.stop(t + 0.36);
      }
    }
  }

  /** Player took damage. */
  playHitPlayer(damage: number, pan = 0): void {
    const ctx = this.ctx; if (!ctx || !this.sfxBus) return;
    const t = this.time;
    const panner = this.makePanner(pan);
    const dest: AudioNode = panner ?? this.sfxBus;
    if (panner) panner.connect(this.sfxBus);

    // Heavy thud: low sine + noise burst.
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.exponentialRampToValueAtTime(55, t + 0.22);
    const og = ctx.createGain();
    og.gain.setValueAtTime(0.0001, t);
    og.gain.exponentialRampToValueAtTime(0.32, t + 0.005);
    og.gain.exponentialRampToValueAtTime(0.0001, t + 0.26);
    osc.connect(og); og.connect(dest);
    osc.start(t); osc.stop(t + 0.28);

    // Dissonant sting (two detuned squares) — conveys "ouch".
    const a = ctx.createOscillator(); const b = ctx.createOscillator();
    a.type = 'square'; b.type = 'square';
    a.frequency.value = 220; b.frequency.value = 233; // near-unison beat
    const sg = ctx.createGain();
    sg.gain.setValueAtTime(0.0001, t);
    sg.gain.exponentialRampToValueAtTime(0.10 * clamp(damage / 20, 0.5, 1.4), t + 0.01);
    sg.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
    a.connect(sg); b.connect(sg); sg.connect(dest);
    a.start(t); b.start(t); a.stop(t + 0.2); b.stop(t + 0.2);

    const n = this.noiseSource(); if (n) {
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 700;
      const ng = ctx.createGain();
      ng.gain.setValueAtTime(0.2, t); ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.14);
      n.connect(lp); lp.connect(ng); ng.connect(dest);
      n.start(t); n.stop(t + 0.15);
    }
  }

  /** Multiplier stepped up — a short rising arpeggio blip. */
  playMultiplierUp(value: number): void {
    const ctx = this.ctx; if (!ctx || !this.sfxBus) return;
    const t = this.time;
    const notes = [440, 554, 660, 880]; // A4 → C#5 → E5 → A5
    const stepUp = clamp(Math.floor(value), 1, 5);
    const count = Math.min(notes.length, 2 + stepUp);
    for (let i = 0; i < count; i++) {
      const when = t + i * 0.06;
      const osc = ctx.createOscillator();
      osc.type = 'square';
      osc.frequency.value = notes[i];
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, when);
      g.gain.exponentialRampToValueAtTime(0.12, when + 0.005);
      g.gain.exponentialRampToValueAtTime(0.0001, when + 0.12);
      // Slight detuned layer for shimmer.
      const osc2 = ctx.createOscillator(); osc2.type = 'triangle'; osc2.frequency.value = notes[i] * 2;
      const g2 = ctx.createGain();
      g2.gain.setValueAtTime(0.0001, when);
      g2.gain.exponentialRampToValueAtTime(0.05, when + 0.005);
      g2.gain.exponentialRampToValueAtTime(0.0001, when + 0.1);
      osc.connect(g); osc2.connect(g2); g.connect(this.sfxBus); g2.connect(this.sfxBus);
      osc.start(when); osc2.start(when); osc.stop(when + 0.14); osc2.stop(when + 0.12);
    }
  }

  /** Game over — a long descending lament. */
  playGameOver(): void {
    const ctx = this.ctx; if (!ctx || !this.sfxBus) return;
    const t = this.time;
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(420, t);
    osc.frequency.exponentialRampToValueAtTime(60, t + 1.2);
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass';
    lp.frequency.setValueAtTime(2600, t); lp.frequency.exponentialRampToValueAtTime(300, t + 1.2);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.28, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 1.3);
    osc.connect(lp); lp.connect(g); g.connect(this.sfxBus);
    osc.start(t); osc.stop(t + 1.35);

    const n = this.noiseSource(); if (n) {
      const lp2 = ctx.createBiquadFilter(); lp2.type = 'lowpass'; lp2.frequency.value = 500;
      const ng = ctx.createGain();
      ng.gain.setValueAtTime(0.18, t); ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.9);
      n.connect(lp2); lp2.connect(ng); ng.connect(this.sfxBus);
      n.start(t); n.stop(t + 1.0);
    }
  }

  /** Enemy spawned — a soft telegraph blip. Throttled to avoid spam. */
  playSpawn(kind: EnemyKind, pan = 0): void {
    const ctx = this.ctx; if (!ctx || !this.sfxBus) return;
    const t = this.time;
    // Bucket spawns: allow a short cluster then gate for a few ms.
    this.spawnAccum += 1;
    if (t - this.lastSpawn < 0.04 && this.spawnAccum > 3) return;
    if (t - this.lastSpawn >= 0.12) this.spawnAccum = 0;
    this.lastSpawn = t;

    const panner = this.makePanner(pan);
    const dest: AudioNode = panner ?? this.sfxBus;
    if (panner) panner.connect(this.sfxBus);

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    const f = kind === 'singularity' ? 220 : kind === 'wanderer' ? 520 : kind === 'dodger' ? 660 : 380;
    osc.frequency.setValueAtTime(f * 0.6, t);
    osc.frequency.exponentialRampToValueAtTime(f, t + 0.05);
    const g = ctx.createGain();
    const vol = kind === 'singularity' ? 0.14 : 0.06;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.1);
    osc.connect(g); g.connect(dest);
    osc.start(t); osc.stop(t + 0.12);
  }

  playSkill(pan = 0): void {
    const ctx = this.ctx; if (!ctx || !this.sfxBus) return;
    const time = this.time;
    const panner = this.makePanner(pan); const output: AudioNode = panner ?? this.sfxBus;
    panner?.connect(this.sfxBus);
    const oscillator = ctx.createOscillator(); oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(180, time);
    oscillator.frequency.exponentialRampToValueAtTime(1400, time + 0.18);
    oscillator.frequency.exponentialRampToValueAtTime(120, time + 0.6);
    const filter = ctx.createBiquadFilter(); filter.type = 'lowpass'; filter.Q.value = 6;
    filter.frequency.setValueAtTime(400, time);
    filter.frequency.exponentialRampToValueAtTime(5000, time + 0.18);
    filter.frequency.exponentialRampToValueAtTime(300, time + 0.6);
    const gain = ctx.createGain(); gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(0.34, time + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.62);
    oscillator.connect(filter); filter.connect(gain); gain.connect(output);
    oscillator.start(time); oscillator.stop(time + 0.66);
  }

  playPickup(kind: ItemKind, pan = 0): void {
    const ctx = this.ctx; if (!ctx || !this.sfxBus) return;
    const start = this.time;
    const panner = this.makePanner(pan); const output: AudioNode = panner ?? this.sfxBus;
    panner?.connect(this.sfxBus);
    const base = kind === 'life' ? 880 : kind === 'weapon' ? 660 : kind === 'shield' ? 520 : 740;
    for (let index = 0; index < 2; index += 1) {
      const time = start + index * 0.05;
      const oscillator = ctx.createOscillator(); oscillator.type = 'triangle';
      oscillator.frequency.value = base * (index ? 1.5 : 1);
      const gain = ctx.createGain(); gain.gain.setValueAtTime(0.0001, time);
      gain.gain.exponentialRampToValueAtTime(0.16, time + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.12);
      oscillator.connect(gain); gain.connect(output); oscillator.start(time); oscillator.stop(time + 0.14);
    }
  }

  playBossFire(pan = 0): void {
    this.playBossTone(pan, 160, 70, 0.18);
  }

  playBossHit(pan = 0): void {
    const ctx = this.ctx; if (!ctx || !this.sfxBus) return;
    const time = this.time; const panner = this.makePanner(pan); const output: AudioNode = panner ?? this.sfxBus;
    panner?.connect(this.sfxBus);
    const noise = this.noiseSource(); if (!noise) return;
    const filter = ctx.createBiquadFilter(); filter.type = 'bandpass'; filter.frequency.value = 900; filter.Q.value = 1;
    const gain = ctx.createGain(); gain.gain.setValueAtTime(0.16, time); gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.08);
    noise.connect(filter); filter.connect(gain); gain.connect(output); noise.start(time); noise.stop(time + 0.1);
  }

  playBossDead(pan = 0): void {
    const ctx = this.ctx; if (!ctx || !this.sfxBus) return;
    const time = this.time; const panner = this.makePanner(pan); const output: AudioNode = panner ?? this.sfxBus;
    panner?.connect(this.sfxBus);
    const oscillator = ctx.createOscillator(); oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(420, time); oscillator.frequency.exponentialRampToValueAtTime(50, time + 1.1);
    const filter = ctx.createBiquadFilter(); filter.type = 'lowpass';
    filter.frequency.setValueAtTime(3000, time); filter.frequency.exponentialRampToValueAtTime(200, time + 1.1);
    const gain = ctx.createGain(); gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(0.4, time + 0.02); gain.gain.exponentialRampToValueAtTime(0.0001, time + 1.3);
    oscillator.connect(filter); filter.connect(gain); gain.connect(output); oscillator.start(time); oscillator.stop(time + 1.35);
  }

  private playBossTone(pan: number, startFrequency: number, endFrequency: number, duration: number): void {
    const ctx = this.ctx; if (!ctx || !this.sfxBus) return;
    const time = this.time; const panner = this.makePanner(pan); const output: AudioNode = panner ?? this.sfxBus;
    panner?.connect(this.sfxBus);
    const oscillator = ctx.createOscillator(); oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(startFrequency, time);
    oscillator.frequency.exponentialRampToValueAtTime(endFrequency, time + duration - 0.02);
    const gain = ctx.createGain(); gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(0.18, time + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);
    oscillator.connect(gain); gain.connect(output); oscillator.start(time); oscillator.stop(time + duration + 0.02);
  }

  // ---------------------------------------------------------------- events

  /** Consume a batch of GameEvent[] from the sim step. Positional pan from world. */
  playEvents(events: GameEvent[], playerX: number, arenaR: number): void {
    if (!this.ctx || this.muted) return;
    for (const e of events) {
      switch (e.type) {
        case 'kill': this.playKill(e.kind, this.panFor(e.pos, playerX, arenaR)); break;
        case 'explode': this.playKill('singularity', this.panFor(e.pos, playerX, arenaR)); break;
        case 'hit-player': this.playHitPlayer(e.damage, this.panFor(e.pos, playerX, arenaR)); break;
        case 'shockwave': this.playKill('singularity', this.panFor(e.pos, playerX, arenaR)); break;
        case 'spawn': this.playSpawn(e.kind, this.panFor(e.pos, playerX, arenaR)); break;
        case 'multiplier-up': this.playMultiplierUp(e.value); break;
        case 'game-over': this.playGameOver(); break;
        case 'skill-fire': this.playSkill(this.panFor(e.pos, playerX, arenaR)); break;
        case 'weapon-fire': this.playFire(e.weapon, this.panFor(e.pos, playerX, arenaR)); break;
        case 'pickup': this.playPickup(e.kind, this.panFor(e.pos, playerX, arenaR)); break;
        case 'boss-fire': this.playBossFire(this.panFor(e.pos, playerX, arenaR)); break;
        case 'boss-hit': this.playBossHit(this.panFor(e.pos, playerX, arenaR)); break;
        case 'boss-dead': this.playBossDead(this.panFor(e.pos, playerX, arenaR)); break;
        case 'revive': this.playMultiplierUp(4); break;
      }
    }
  }

  // ---------------------------------------------------------------- BGM

  // Synthwave progression in A minor: Am - F - C - G (one chord per bar).
  private scheduler(): void {
    const ctx = this.ctx; if (!ctx || !this.bgmBus) return;
    const secPer16 = (60 / this.bpm) / 4;
    while (this.nextNoteTime < ctx.currentTime + this.lookahead) {
      this.scheduleStep(this.step16, this.bar, this.nextNoteTime);
      this.nextNoteTime += secPer16;
      this.step16 = (this.step16 + 1) % 16;
      if (this.step16 === 0) this.bar = (this.bar + 1) % this.chords.length;
    }
  }

  private scheduleStep(step16: number, bar: number, when: number): void {
    const ctx = this.ctx!; const bus = this.bgmBus!;
    const chord = this.chords[bar];
    const root = chord[0];

    // --- Bass: root on each beat (steps 0,4,8,12), octave-low saw. ---
    if (step16 % 4 === 0) {
      this.bassNote(root / 2, when, (60 / this.bpm) * 0.9, bus, ctx);
    }
    // Extra off-beat bass ghost on step 6/14 for groove.
    if (step16 === 6 || step16 === 14) {
      this.bassNote(root / 2, when, (60 / this.bpm) * 0.3, bus, ctx, 0.5);
    }

    // --- Arpeggio: 16th notes cycling through the chord, plucked synth. ---
    const note = chord[step16 % chord.length] * (step16 >= 8 ? 2 : 1);
    this.arpNote(note, when, (60 / this.bpm) / 4 * 0.9, bus, ctx);

    // --- Pad: sustain the chord at the start of each bar. ---
    if (step16 === 0) {
      const dur = (60 / this.bpm) * 4 * 0.98;
      for (const f of chord) this.padNote(f, when, dur, bus, ctx);
    }

    // --- Drums ---
    if (step16 % 4 === 0) this.kick(when, bus, ctx);              // four-on-floor
    if (step16 === 4 || step16 === 12) this.snare(when, bus, ctx); // backbeat
    if (step16 % 2 === 0) this.hat(when, bus, ctx, false);         // 8th hats
    if (step16 % 4 === 2) this.hat(when, bus, ctx, true);          // off-hat accent
  }

  private bassNote(freq: number, when: number, dur: number, bus: GainNode, ctx: AudioContext, vol = 1): void {
    const osc = ctx.createOscillator(); osc.type = 'sawtooth'; osc.frequency.value = freq;
    const sub = ctx.createOscillator(); sub.type = 'sine'; sub.frequency.value = freq / 2;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass';
    lp.frequency.setValueAtTime(900, when);
    lp.frequency.exponentialRampToValueAtTime(180, when + dur);
    lp.Q.value = 4;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(0.32 * vol, when + 0.02);
    g.gain.setValueAtTime(0.28 * vol, when + dur * 0.5);
    g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    const sg = ctx.createGain(); sg.gain.value = 0.5;
    osc.connect(lp); sub.connect(lp); lp.connect(g); g.connect(bus);
    osc.start(when); sub.start(when); osc.stop(when + dur + 0.02); sub.stop(when + dur + 0.02);
  }

  private arpNote(freq: number, when: number, dur: number, bus: GainNode, ctx: AudioContext): void {
    const osc = ctx.createOscillator(); osc.type = 'square'; osc.frequency.value = freq;
    const osc2 = ctx.createOscillator(); osc2.type = 'triangle'; osc2.frequency.value = freq * 1.005;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(0.10, when + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    // Echo via a delay feedback loop for that synthwave tail.
    const delay = ctx.createDelay(1.0); delay.delayTime.value = (60 / this.bpm) / 2;
    const fb = ctx.createGain(); fb.gain.value = 0.32;
    const wet = ctx.createGain(); wet.gain.value = 0.45;
    osc.connect(g); osc2.connect(g); g.connect(bus);
    g.connect(delay); delay.connect(fb); fb.connect(delay); delay.connect(wet); wet.connect(bus);
    osc.start(when); osc2.start(when); osc.stop(when + dur + 0.02); osc2.stop(when + dur + 0.02);
  }

  private padNote(freq: number, when: number, dur: number, bus: GainNode, ctx: AudioContext): void {
    const osc = ctx.createOscillator(); osc.type = 'sawtooth'; osc.frequency.value = freq;
    const det = ctx.createOscillator(); det.type = 'sawtooth'; det.frequency.value = freq * 1.01;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1400; lp.Q.value = 0.7;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, when);
    g.gain.linearRampToValueAtTime(0.05, when + dur * 0.25);
    g.gain.setValueAtTime(0.05, when + dur * 0.6);
    g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    osc.connect(lp); det.connect(lp); lp.connect(g); g.connect(bus);
    osc.start(when); det.start(when); osc.stop(when + dur + 0.02); det.stop(when + dur + 0.02);
  }

  private kick(when: number, bus: GainNode, ctx: AudioContext): void {
    const osc = ctx.createOscillator(); osc.type = 'sine';
    osc.frequency.setValueAtTime(150, when);
    osc.frequency.exponentialRampToValueAtTime(45, when + 0.12);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(0.5, when + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, when + 0.18);
    osc.connect(g); g.connect(bus);
    osc.start(when); osc.stop(when + 0.2);
    // Click transient.
    const n = this.noiseSource(); if (n) {
      const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 1200;
      const ng = ctx.createGain(); ng.gain.setValueAtTime(0.12, when); ng.gain.exponentialRampToValueAtTime(0.0001, when + 0.02);
      n.connect(hp); hp.connect(ng); ng.connect(bus); n.start(when); n.stop(when + 0.03);
    }
  }

  private snare(when: number, bus: GainNode, ctx: AudioContext): void {
    const n = this.noiseSource(); if (!n) return;
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1800; bp.Q.value = 0.8;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(0.28, when + 0.003);
    g.gain.exponentialRampToValueAtTime(0.0001, when + 0.16);
    n.connect(bp); bp.connect(g); g.connect(bus);
    n.start(when); n.stop(when + 0.18);
    // Tonal body.
    const osc = ctx.createOscillator(); osc.type = 'triangle'; osc.frequency.value = 220;
    const og = ctx.createGain(); og.gain.setValueAtTime(0.08, when); og.gain.exponentialRampToValueAtTime(0.0001, when + 0.08);
    osc.connect(og); og.connect(bus); osc.start(when); osc.stop(when + 0.1);
  }

  private hat(when: number, bus: GainNode, ctx: AudioContext, open: boolean): void {
    const n = this.noiseSource(); if (!n) return;
    const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 7000;
    const g = ctx.createGain();
    g.gain.setValueAtTime(open ? 0.08 : 0.05, when);
    g.gain.exponentialRampToValueAtTime(0.0001, when + (open ? 0.12 : 0.03));
    n.connect(hp); hp.connect(g); g.connect(bus);
    n.start(when); n.stop(when + (open ? 0.14 : 0.04));
  }
}
