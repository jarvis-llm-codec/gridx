import { AudioEngine } from './audio/AudioEngine.js';
import { BgmManager } from './audio/bgm.js';
import { CONFIG } from './core/config.js';
import { createLoop } from './core/gameLoop.js';
import { createInputAdapter } from './input/keyboardMouse.js';
import { hashSeed } from './math/rng.js';
import { Renderer } from './render/renderer.js';
import { createWorld, stepWorld, type WorldSystems } from './sim/world.js';
import { WEAPON_DROP_ORDER, WEAPON_NAMES } from './sim/weapons.js';
import { leaderboard, type LeaderboardGame } from './ui/leaderboard.js';

const SEED = hashSeed('geometry-wars-3d-v2');

interface HudElements {
  score: HTMLElement;
  multiplier: HTMLElement;
  hp: HTMLElement;
  wave: HTMLElement;
  overlay: HTMLElement;
  title: HTMLElement;
  hint: HTMLElement;
  mute: HTMLElement;
  energyWrap: HTMLElement;
  energyFill: HTMLElement;
  weapon: HTMLElement;
  primaryWeapon: HTMLElement;
  secondaryWeapon: HTMLElement;
  lives: HTMLElement;
  bossBar: HTMLElement;
  bossFill: HTMLElement;
  bossLabel: HTMLElement;
  bossTimer: HTMLElement;
  bossTimerFill: HTMLElement;
  bossTimerLabel: HTMLElement;
  damageVignette: HTMLElement;
}

export class Game implements LeaderboardGame {
  private readonly renderer: Renderer;
  private readonly input = createInputAdapter();
  private readonly loop;
  private readonly hud: HudElements;
  private readonly audio = new AudioEngine();
  private readonly bgm = new BgmManager({ onExternalState: (active) => this.audio.setExternalBgmActive(active) });
  private world;
  private systems: WorldSystems;
  private paused = false;
  private muted = false;
  private audioStarted = false;
  private stopped = false;
  private shownGameOver = false;
  private began = false;
  private runTime = 0;

  constructor(container: HTMLElement, hud: HudElements) {
    this.hud = hud;
    const initial = createWorld(SEED);
    this.world = initial.world;
    this.systems = initial.systems;
    this.renderer = new Renderer(container, SEED);
    this.input.setMouseAimResolver((x, y, playerPos) => this.renderer.screenToArenaAim(x, y, playerPos));
    this.input.attach(container);
    this.updateMuteIcon();
    const mode = (import.meta as ImportMeta & { env?: { MODE?: string } }).env?.MODE;
    if (mode !== 'single') {
      this.bgm.loadBgm({
        base: '/assets/bgm/base.ogg',
        miniBoss: '/assets/bgm/boss_mini.ogg',
        megaBoss: '/assets/bgm/boss_mega.ogg',
      });
    }
    this.loop = createLoop({
      step: (dt) => this.step(dt),
      render: () => {
        this.renderer.update(this.world, this.systems);
        this.renderer.render();
        return !this.stopped;
      },
    }, CONFIG.fixedStep, CONFIG.maxSubsteps);
  }

  start(): void {
    this.paused = true;
    this.loop.start();
    this.showOverlay('GRIDX', '');
    leaderboard.bind(this);
    leaderboard.showMenu();
  }

  beginGame(): void {
    if (this.began) return;
    this.began = true;
    this.runTime = 0;
    leaderboard.hideAll();
    this.paused = false;
    this.hideOverlay();
    this.startAudio();
    void this.bgm.start();
  }

  private step(dt: number): void {
    if (!this.began) return;
    const input = this.input.snapshot(this.world.player.pos);
    if (leaderboard.blocking()) {
      input.pause = false;
      input.mute = false;
      input.restart = false;
    }
    if (input.pause) this.paused = !this.paused;
    if (input.mute) this.toggleMute();
    if (input.restart) this.restart();
    if (!this.audioStarted && (input.firing || input.moveX || input.moveZ || input.boost || input.restart)) {
      this.startAudio();
    }
    if (this.paused) return;
    if (!this.world.gameOver) this.runTime += dt;
    const events = stepWorld(this.world, this.systems, input, dt);
    if (events.some((event) => event.type === 'hit-player')) this.flashDamage();
    if (this.audioStarted) this.audio.setBossMode(Boolean(this.world.boss && !this.world.boss.dead));
    if (this.audioStarted) {
      const liveBoss = this.world.boss && !this.world.boss.dead ? this.world.boss : null;
      this.bgm.setBossState(liveBoss ? liveBoss.bossType : null);
    }
    this.updateHud();
    if (this.audioStarted && !this.muted) {
      this.audio.playEvents(events, this.world.player.pos.x, this.world.arenaRadius);
    }
    if (this.world.gameOver && !this.shownGameOver) {
      this.shownGameOver = true;
      this.bgm.gameOver();
      this.showOverlay('GAME OVER', '');
      leaderboard.onGameOver(this.world.player.score, this.runTime);
    }
  }

  private flashDamage(): void {
    this.hud.damageVignette.classList.remove('flash');
    void this.hud.damageVignette.offsetWidth;
    this.hud.damageVignette.classList.add('flash');
  }

  private toggleMute(): void {
    this.muted = !this.muted;
    this.audio.setMuted(this.muted);
    this.bgm.setMuted(this.muted);
    this.updateMuteIcon();
  }

  private updateMuteIcon(): void {
    this.hud.mute.textContent = this.muted ? '🔇' : '🔊';
    this.hud.mute.style.opacity = this.muted ? '1' : '0.5';
  }

  private startAudio(): void {
    this.audioStarted = true;
    void this.audio.resume().catch(() => {});
  }

  restart(): void {
    const next = createWorld(SEED + Math.floor(Math.random() * 1e9));
    this.world = next.world;
    this.systems = next.systems;
    this.shownGameOver = false;
    this.paused = false;
    this.runTime = 0;
    leaderboard.hideAll();
    this.hideOverlay();
    this.bgm.restart();
    if (this.audioStarted && !this.muted) this.audio.playMultiplierUp(3);
  }

  private updateHud(): void {
    const player = this.world.player;
    this.hud.score.textContent = player.score.toLocaleString();
    this.hud.multiplier.textContent = `×${player.multiplier}`;
    this.hud.hp.textContent = String(Math.max(0, Math.ceil(player.hp)));
    this.hud.wave.textContent = `W${this.systems.spawn.wave}`;
    this.hud.multiplier.style.transform = `scale(${1 + this.systems.score.multiplierPulse * 0.4})`;
    const energy = Math.min(100, (player.energy / CONFIG.player.maxEnergy) * 100);
    this.hud.energyFill.style.width = `${energy}%`;
    const skillReady = player.energy >= CONFIG.player.skillCost - 0.01;
    this.hud.energyFill.style.opacity = skillReady ? '1' : '0.65';
    this.hud.energyWrap.classList.toggle('ready', skillReady);
    this.hud.primaryWeapon.textContent = 'MAIN BLASTER · ALWAYS';
    const secondary = player.secondaryWeapon && WEAPON_DROP_ORDER.includes(player.secondaryWeapon)
      ? player.secondaryWeapon
      : null;
    this.hud.secondaryWeapon.textContent = secondary
      ? `SUB ${WEAPON_NAMES[secondary]} · LV${player.weaponLevels[secondary]}`
      : 'SUB EMPTY';
    this.hud.secondaryWeapon.style.opacity = secondary ? '1' : '0.46';
    this.hud.lives.textContent = '♥'.repeat(Math.max(0, player.lives));
    const boss = this.world.boss;
    if (boss && !boss.dead) {
      this.hud.bossBar.style.display = 'flex';
      this.hud.bossFill.style.width = `${Math.max(0, (boss.hp / boss.maxHp) * 100)}%`;
      this.hud.bossLabel.textContent = boss.bossType === 'big' ? '⚠ MEGA BOSS' : '⚠ MINI BOSS';
      this.hud.bossTimer.style.display = 'none';
    } else {
      this.hud.bossBar.style.display = 'none';
      const maximum = this.systems.spawn.bossTimerMax || CONFIG.boss.firstDelay;
      const remaining = Math.max(0, this.systems.spawn.bossTimer);
      const progress = Math.max(0, Math.min(1, 1 - remaining / maximum));
      this.hud.bossTimer.style.display = 'flex';
      this.hud.bossTimerFill.style.width = `${progress * 100}%`;
      this.hud.bossTimerLabel.textContent = `Next Boss ${Math.ceil(remaining)}s`;
      this.hud.bossTimerFill.style.background = progress > 0.7
        ? 'linear-gradient(90deg, #ff2bd6, #ff3a4a)'
        : progress > 0.4
          ? 'linear-gradient(90deg, #ff7733, #ff8a3a)'
          : 'linear-gradient(90deg, #39e0ff, #4af0ff)';
    }
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
    this.bgm.dispose();
  }
}

const required = <T extends HTMLElement>(id: string): T => {
  const target = document.getElementById(id);
  if (!target) throw new Error(`Missing required element #${id}`);
  return target as T;
};

const boot = (): void => {
  const game = new Game(required('app'), {
    score: required('hud-score'),
    multiplier: required('hud-mult'),
    hp: required('hud-hp'),
    wave: required('hud-wave'),
    overlay: required('overlay'),
    title: required('overlay-title'),
    hint: required('overlay-hint'),
    mute: required('hud-mute'),
    energyWrap: required('hud-energy'),
    energyFill: required('hud-energy-fill'),
    weapon: required('hud-weapon'),
    primaryWeapon: required('hud-primary'),
    secondaryWeapon: required('hud-secondary'),
    lives: required('hud-lives'),
    bossBar: required('hud-boss'),
    bossFill: required('hud-boss-fill'),
    bossLabel: required('hud-boss-label'),
    bossTimer: required('hud-bosstimer'),
    bossTimerFill: required('hud-bosstimer-fill'),
    bossTimerLabel: required('hud-bosstimer-label'),
    damageVignette: required('damage-vignette'),
  });
  game.start();
  (window as typeof window & { __game: Game }).__game = game;
};

boot();
