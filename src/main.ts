// main.ts — Game orchestrator. Wires sim (stepWorld) + renderer + input + loop.
// Owns high-level state (running/paused/game-over/restart), HUD overlay, audio.

import { CONFIG } from './core/config.js';
import { createLoop } from './core/gameLoop.js';
import { createInputAdapter } from './input/keyboardMouse.js';
import { createWorld, stepWorld, type WorldSystems } from './sim/world.js';
import { Renderer } from './render/renderer.js';
import { AudioEngine } from './audio/AudioEngine.js';
import { hashSeed } from './math/rng.js';

const SEED = hashSeed('geometry-wars-3d-v2');

interface HudEls {
  score: HTMLElement;
  multiplier: HTMLElement;
  hp: HTMLElement;
  wave: HTMLElement;
  overlay: HTMLElement;
  title: HTMLElement;
  hint: HTMLElement;
  mute: HTMLElement;
}

export class Game {
  private renderer: Renderer;
  private input = createInputAdapter();
  private loop;
  private world;
  private systems: WorldSystems;
  private paused = false;
  private muted = false;
  private hud: HudEls;
  private audio = new AudioEngine();
  private audioStarted = false;

  constructor(container: HTMLElement, hud: HudEls) {
    this.hud = hud;
    const init = createWorld(SEED);
    this.world = init.world;
    this.systems = init.systems;
    this.renderer = new Renderer(container, SEED);
    this.input.attach(container);
    this.updateMuteIcon();
    this.loop = createLoop(
      {
        step: (dt) => this.step(dt),
        render: () => {
          this.renderer.update(this.world, this.systems);
          this.renderer.render();
          return !this.stopped;
        },
      },
      CONFIG.fixedStep,
      CONFIG.maxSubsteps
    );
  }

  private stopped = false;

  start(): void {
    this.loop.start();
    this.showOverlay('GEOMETRY WARS 3D', 'WASD move · Mouse/Space fire · Shift boost · P pause · M mute');
  }

  private step(dt: number): void {
    const input = this.input.snapshot();
    if (input.pause) this.paused = !this.paused;
    if (input.mute) this.toggleMute();
    if (input.restart) this.restart();
    // Resume audio on first interaction (browser autoplay policy requires a gesture).
    if (!this.audioStarted && (input.firing || input.moveX || input.moveZ || input.boost || input.restart)) {
      this.startAudio();
    }
    if (this.paused) return;
    const bulletsBefore = this.playerBulletCount();
    const events = stepWorld(this.world, this.systems, input, dt);
    this.updateHud();
    if (this.audioStarted && !this.muted) {
      const px = this.world.player.pos.x;
      const ar = this.world.arenaRadius;
      this.audio.playEvents(events, px, ar);
      // Fire cue: play a zap per newly spawned player bullet.
      const fired = this.playerBulletCount() - bulletsBefore;
      if (fired > 0) {
        const pan = Math.max(-1, Math.min(1, input.aimX || this.world.player.aim.x));
        for (let i = 0; i < fired; i++) this.audio.playFire('standard', pan);
      }
    }
    if (this.world.gameOver && !this.shownGameOver) {
      this.shownGameOver = true;
      this.showOverlay('GAME OVER', 'Press R to restart');
    }
  }
  private shownGameOver = false;

  private playerBulletCount(): number {
    let n = 0;
    for (const b of this.world.bullets) if (b.owner === 'player') n++;
    return n;
  }

  private toggleMute(): void {
    this.muted = !this.muted;
    this.audio.setMuted(this.muted);
    this.updateMuteIcon();
  }

  private updateMuteIcon(): void {
    this.hud.mute.textContent = this.muted ? '\u{1F507}' : '\u{1F50A}';
    this.hud.mute.style.opacity = this.muted ? '1' : '0.5';
  }

  private startAudio(): void {
    this.audioStarted = true;
    this.audio.resume().catch(() => {});
  }

  private restart(): void {
    const init = createWorld(SEED + Math.floor(Math.random() * 1e9));
    this.world = init.world;
    this.systems = init.systems;
    this.shownGameOver = false;
    this.paused = false;
    this.hideOverlay();
    if (this.audioStarted && !this.muted) this.audio.playMultiplierUp(3);
  }

  private updateHud(): void {
    this.hud.score.textContent = this.world.player.score.toLocaleString();
    this.hud.multiplier.textContent = '×' + this.world.player.multiplier;
    this.hud.hp.textContent = Math.max(0, Math.ceil(this.world.player.hp)) + '';
    this.hud.wave.textContent = 'W' + this.systems.spawn.wave;
    const pulse = this.systems.score.multiplierPulse;
    (this.hud.multiplier as HTMLElement).style.transform = `scale(${1 + pulse * 0.4})`;
  }

  private showOverlay(title: string, hint: string): void {
    this.hud.overlay.style.display = 'flex';
    this.hud.title.textContent = title;
    this.hud.hint.textContent = hint;
  }
  private hideOverlay(): void {
    this.hud.overlay.style.display = 'none';
  }

  dispose(): void {
    this.stopped = true;
    this.loop.stop();
    this.input.detach();
    this.renderer.dispose();
    this.audio.dispose();
  }
}

// --- Boot ---
function boot(): void {
  const container = document.getElementById('app')!;
  const hud: HudEls = {
    score: document.getElementById('hud-score')!,
    multiplier: document.getElementById('hud-mult')!,
    hp: document.getElementById('hud-hp')!,
    wave: document.getElementById('hud-wave')!,
    overlay: document.getElementById('overlay')!,
    title: document.getElementById('overlay-title')!,
    hint: document.getElementById('overlay-hint')!,
    mute: document.getElementById('hud-mute')!,
  };
  const game = new Game(container, hud);
  game.start();
  (window as unknown as { __game: Game }).__game = game;
}

boot();