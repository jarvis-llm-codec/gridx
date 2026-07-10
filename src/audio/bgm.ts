export interface BgmTracks {
  base: string;
  boss: string;
}

export interface BgmConfig {
  baseVolume?: number;
  bossVolume?: number;
  fadeSeconds?: number;
  onExternalState?: (active: boolean) => void;
}

type Track = 'base' | 'boss';

/** Optional file-backed music layer. It never rejects startup: synth remains the fallback. */
export class BgmManager {
  private readonly baseVolume: number;
  private readonly bossVolume: number;
  private readonly fadeSeconds: number;
  private readonly onExternalState?: (active: boolean) => void;
  private tracks: Partial<Record<Track, HTMLAudioElement>> = {};
  private current: Track | null = null;
  private enabled = false;

  constructor(config: BgmConfig = {}) {
    this.baseVolume = config.baseVolume ?? 0.32;
    this.bossVolume = config.bossVolume ?? 0.38;
    this.fadeSeconds = config.fadeSeconds ?? 1.8;
    this.onExternalState = config.onExternalState;
  }

  loadBgm(tracks: BgmTracks): void {
    this.disposeTracks();
    for (const kind of ['base', 'boss'] as const) {
      const audio = new Audio(tracks[kind]);
      audio.loop = true;
      audio.preload = 'auto';
      audio.volume = 0;
      audio.addEventListener('error', () => this.disableIfUnavailable());
      this.tracks[kind] = audio;
    }
  }

  async start(): Promise<boolean> {
    this.enabled = true;
    const base = this.tracks.base;
    if (!base) return false;
    try {
      await base.play();
      this.current = 'base';
      this.fade(base, this.baseVolume);
      this.onExternalState?.(true);
      return true;
    } catch {
      this.disableIfUnavailable();
      return false;
    }
  }

  setBossMode(boss: boolean): void {
    if (!this.enabled || !this.tracks.base || !this.tracks.boss) return;
    const next: Track = boss ? 'boss' : 'base';
    if (next === this.current) return;
    const incoming = this.tracks[next];
    const outgoing = this.current ? this.tracks[this.current] : undefined;
    if (!incoming) return;
    incoming.currentTime = 0;
    void incoming.play().catch(() => this.disableIfUnavailable());
    this.fade(incoming, next === 'boss' ? this.bossVolume : this.baseVolume);
    if (outgoing) this.fade(outgoing, 0, () => outgoing.pause());
    this.current = next;
  }

  setMuted(muted: boolean): void {
    for (const audio of Object.values(this.tracks)) if (audio) audio.muted = muted;
  }

  gameOver(): void {
    for (const audio of Object.values(this.tracks)) if (audio) this.fade(audio, 0, () => audio.pause());
    this.current = null;
  }

  restart(): void {
    this.gameOver();
    if (this.enabled) void this.start();
  }

  dispose(): void { this.disposeTracks(); }

  private fade(audio: HTMLAudioElement, target: number, done?: () => void): void {
    const start = audio.volume;
    const began = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - began) / (this.fadeSeconds * 1000));
      audio.volume = start + (target - start) * p;
      if (p < 1) requestAnimationFrame(tick); else done?.();
    };
    requestAnimationFrame(tick);
  }

  private disableIfUnavailable(): void {
    this.enabled = false;
    this.onExternalState?.(false);
    for (const audio of Object.values(this.tracks)) audio?.pause();
  }

  private disposeTracks(): void {
    for (const audio of Object.values(this.tracks)) { audio?.pause(); audio?.removeAttribute('src'); audio?.load(); }
    this.tracks = {};
    this.current = null;
  }
}
