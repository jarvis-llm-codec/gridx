const fe = {
    fixedStep: 1 / 60,
    maxSubsteps: 8,
    sphereRadius: 60,
    capHalfAngle: 0.448,
    worldBounds: 26,
    player: {
      radius: 0.55,
      speed: 16,
      boostSpeed: 26,
      accel: 90,
      friction: 6,
      maxHp: 100,
      fireInterval: 0.09,
      bulletSpeed: 42,
      bulletLife: 1.1,
      bulletDamage: 1,
      bulletRadius: 0.28,
      maxBoost: 1,
      boostDrain: 0.55,
      boostRegen: 0.18,
      invulnTime: 1.6,
      maxLives: 3,
      maxEnergy: 100,
      energyRegen: 8,
      energyPerKill: 2.2,
      skillCost: 100,
      skillDamage: 12,
      skillRadius: 14,
      maxWeaponLevel: 3,
      shieldTime: 1.4,
      weapons: {
        blaster: { interval: 0.09, damage: 1 },
        missile: { interval: 0.48, damage: 4.5, blastRadius: 2.6, turnRate: 5.4 },
        lightning: { interval: 0.38, damage: 1.8, range: 17 },
        laser: { interval: 0.22, damage: 1.65 }
      }
    },
    enemies: {
      grunt: { radius: 0.7, hp: 1, score: 100, speed: 7, spawnWeight: 5 },
      wanderer: { radius: 0.85, hp: 2, score: 250, speed: 9, spawnWeight: 3 },
      singularity: {
        radius: 1.6,
        hp: 6,
        score: 600,
        speed: 3.5,
        spawnWeight: 1,
        pullRadius: 9,
        explodeTime: 4,
        pullForce: 26
      },
      dodger: {
        radius: 0.65,
        hp: 2,
        score: 400,
        speed: 11,
        spawnWeight: 2,
        dodgeRange: 6,
        dodgeSpeed: 24,
        dodgeCooldown: 1.4
      }
    },
    score: { multiplierStep: 1.25, multiplierMax: 25, comboWindow: 3 },
    spawn: {
      baseInterval: 1.5,
      minInterval: 0.35,
      intervalDecay: 0.94,
      maxAlive: 60,
      maxAlivePerWave: 4,
      maxAliveCap: 140,
      waveBudgetGrowth: 4,
      spawnRingPad: 2
    },
    particles: {
      perKill: 64,
      perBigKill: 150,
      maxParticles: 5e3,
      lifespan: 1.5,
      damping: 0.9,
      speed: 17,
      muzzle: 8,
      pickup: 30,
      hitPlayer: 26
    },
    camera: {
      fovBase: 62,
      fovBoost: 62,
      traumaDecay: 2.2,
      shakeAmp: 0.55,
      rollAmp: 0,
      shakeLambda: 8,
      eventWobbleDecay: 1.25,
      eventWobbleShift: 0.42,
      eventWobbleRoll: 0.012,
      eventWobbleFov: 1.6,
      eventEntityShift: 0.32,
      eventEntityLift: 0.16,
      eventEntityRoll: 0.035,
      eventEntityScale: 0.025,
      zoomMin: 0.78,
      zoomMax: 1.38,
      zoomWheelSpeed: 0.00075,
      zoomLambda: 7
    },
    grid: { impulseStrength: 6, maxImpulses: 20 },
    items: {
      radius: 0.5,
      lifespan: 12,
      dropChance: 0.3,
      bossDropCount: 6,
      bossWeaponDrops: { mini: 2, big: 3 },
      dropWeights: { life: 5, heal: 4, weapon: 5, boost: 2, shield: 2, multiplier: 1 },
      magnetRadius: 11,
      magnetPull: 36,
      colors: {
        heal: 0x33ff88,
        boost: 0xff2bd6,
        weapon: 0xffdd33,
        life: 0x19f0ff,
        shield: 0x9966ff,
        multiplier: 0xff7733
      }
    },
    boss: {
      miniWave: 3,
      bigWave: 10,
      firstDelay: 42,
      interval: 52,
      intervalMin: 38,
      postThirdIntervalCut: 5,
      postThirdIntervalMin: 26,
      postThirdHpGrowth: 0.45,
      postThirdSpeedGrowth: 0.08,
      postThirdFireAccel: 0.13,
      postThirdBulletSpeedGrowth: 0.09,
      postThirdDamageGrowth: 2,
      postThirdExtraBullets: 2,
      mini: {
        radius: 2.2,
        hp: 70,
        score: 5000,
        speed: 5,
        fireInterval: 1.1,
        bulletSpeed: 20,
        bulletLife: 3.5,
        bulletDamage: 14,
        color: 0x247cff
      },
      big: {
        radius: 3.4,
        hp: 260,
        score: 25000,
        speed: 4,
        fireInterval: 0.7,
        bulletSpeed: 25,
        bulletLife: 4.5,
        bulletDamage: 18,
        color: 0xff4b1f
      }
    }
  },
  wl = (i, e, t) => {
    let n = 0,
      s = 0,
      r = 0,
      o = !1;
    const a = i.now ?? (() => (typeof performance < "u" ? performance.now() : Date.now())),
      l = () => {
        if (!o) return;
        const h = a() / 1e3;
        r === 0 && (r = h);
        let f = h - r;
        ((r = h), f > 0.25 && (f = 0.25), (s += f));
        let p = 0;
        for (; s >= e && p < t;) (i.step(e), (s -= e), p++);
        p === t && (s = 0);
        const g = s / e;
        if (!i.render(g)) {
          u();
          return;
        }
        n = requestAnimationFrame(l);
      },
      c = () => {
        o || ((o = !0), (r = 0), (s = 0), (n = requestAnimationFrame(l)));
      },
      u = () => {
        ((o = !1), n && cancelAnimationFrame(n), (n = 0));
      };
    return {
      start: c,
      stop: u,
      get running() {
        return o;
      }
    };
  },
  Rl = () => ({
    moveX: 0,
    moveZ: 0,
    aimX: 0,
    aimZ: 0,
    firing: !1,
    boost: !1,
    pause: !1,
    mute: !1,
    restart: !1,
    skill: !1
  }),
  Cl = () => {
    const i = new Set();
    let e = 0,
      t = 0,
      n = !1,
      s = !1,
      r = !1,
      o = !1,
      a = !1,
      l = !1,
      c = !1,
      u = null,
      sk = !1,
      aimResolver = null,
      lastResolvedAim = null;
    const isTouch = () => "ontouchstart" in window || navigator.maxTouchPoints > 0;
    const JD = 70;
    let jl, jr, kl, kr, bb, bp, bm, bs;
    const tm = { id: null, ox: 0, oy: 0, dx: 0, dy: 0 },
      ta = { id: null, ox: 0, oy: 0, dx: 0, dy: 0 };
    let tb = !1;
    const h = (S) => (C) => {
        const A = C.key.toLowerCase();
        (["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(A) && C.preventDefault(),
          S ? i.add(A) : i.delete(A),
          S &&
            (A === "p" && (o = !0),
             A === "m" && (a = !0),
             A === "r" && (l = !0),
             (A === "f" || A === "q") && (sk = !0)));
      },
      f = h(!0),
      p = h(!1),
      g = (S) => {
        if (!u) return;
        const C = u.getBoundingClientRect(),
          A = C.left + C.width / 2,
          w = C.top + C.height / 2;
        ((e = (S.clientX - A) / (C.width / 2)), (t = (S.clientY - w) / (C.height / 2)), (n = !0));
      },
      _ = (S) => {
        S.button === 0 && (s = !0);
      },
      m = (S) => {
        S.button === 0 && (s = !1);
      },
      d = () => {
        (i.clear(), (s = !1), (r = !1));
      },
      y = (S, C) => i.has(S) || i.has(C),
      mkJ = () => {
        const b = document.createElement("div");
        b.className = "joy";
        const k = document.createElement("div");
        k.className = "knob";
        b.appendChild(k);
        return [b, k];
      },
      shJ = (J, x, y) => {
        J[0].style.left = x + "px";
        J[0].style.top = y + "px";
        J[0].classList.add("show");
      },
      hdJ = (J) => {
        J[0].classList.remove("show");
        J[1].style.transform = "translate(-50%,-50%)";
      },
      stK = (J, dx, dy) => {
        const cl = Math.max(-JD, Math.min(JD, dx)),
          ct = Math.max(-JD, Math.min(JD, dy));
        J[1].style.transform = "translate(calc(-50% + " + cl + "px),calc(-50% + " + ct + "px))";
      },
      ts = (E) => {
        if (!u) return;
        const R = u.getBoundingClientRect();
        for (const T of E.changedTouches) {
          if (T.target === bb || T.target === bp || T.target === bm || T.target === bs) continue;
          const hx = (T.clientX - R.left) / R.width;
          if (hx < 0.5) {
            if (tm.id !== null) continue;
            tm.id = T.identifier;
            tm.ox = T.clientX;
            tm.oy = T.clientY;
            tm.dx = 0;
            tm.dy = 0;
            shJ([jl, kl], T.clientX, T.clientY);
            stK([jl, kl], 0, 0);
          } else {
            if (ta.id !== null) continue;
            ta.id = T.identifier;
            ta.ox = T.clientX;
            ta.oy = T.clientY;
            ta.dx = 0;
            ta.dy = 0;
            shJ([jr, kr], T.clientX, T.clientY);
            stK([jr, kr], 0, 0);
          }
        }
      },
      tmv = (E) => {
        for (const T of E.changedTouches) {
          if (T.identifier === tm.id) {
            let dx = T.clientX - tm.ox,
              dy = T.clientY - tm.oy,
              m = Math.hypot(dx, dy);
            m > JD && ((dx = (dx / m) * JD), (dy = (dy / m) * JD));
            tm.dx = dx;
            tm.dy = dy;
            stK([jl, kl], dx, dy);
          }
          if (T.identifier === ta.id) {
            let dx = T.clientX - ta.ox,
              dy = T.clientY - ta.oy,
              m = Math.hypot(dx, dy);
            m > JD && ((dx = (dx / m) * JD), (dy = (dy / m) * JD));
            ta.dx = dx;
            ta.dy = dy;
            stK([jr, kr], dx, dy);
          }
        }
        E.preventDefault();
      },
      te = (E) => {
        for (const T of E.changedTouches) {
          if (T.identifier === tm.id) {
            tm.id = null;
            tm.dx = 0;
            tm.dy = 0;
            hdJ([jl, kl]);
          }
          if (T.identifier === ta.id) {
            ta.id = null;
            ta.dx = 0;
            ta.dy = 0;
            hdJ([jr, kr]);
          }
        }
      };
    const x = () => {
      c &&
        ((c = !1),
        window.removeEventListener("keydown", f),
        window.removeEventListener("keyup", p),
        u &&
          (u.removeEventListener("mousemove", g),
          u.removeEventListener("mousedown", _),
          u.removeEventListener("touchstart", ts),
          u.removeEventListener("touchmove", tmv),
          u.removeEventListener("touchend", te),
          u.removeEventListener("touchcancel", te)),
        window.removeEventListener("mouseup", m),
        window.removeEventListener("blur", d),
        (u = null),
        i.clear(),
        (tm.id = null),
        (ta.id = null));
      if (jl) {
        [jl, jr, bb, bp, bm, bs].forEach((el) => el && el.remove());
        jl = jr = bb = bp = bm = bs = null;
      }
    };
    return {
      aimFromMouse: !0,
      setMouseAimResolver(resolver) {
        aimResolver = resolver;
      },
      attach(S) {
        (c && x(),
          (u = S),
          (c = !0),
          window.addEventListener("keydown", f),
          window.addEventListener("keyup", p),
          S.addEventListener("mousemove", g),
          S.addEventListener("mousedown", _),
          window.addEventListener("mouseup", m),
          window.addEventListener("blur", d));
        if (isTouch()) {
          const L = mkJ(),
            Rr = mkJ();
          ((jl = L[0]), (kl = L[1]), (jr = Rr[0]), (kr = Rr[1]));
          document.body.appendChild(jl);
          document.body.appendChild(jr);
          const mkB = (id, tx, stFn, enFn) => {
            const b = document.createElement("div");
            b.id = id;
            b.textContent = tx;
            b.addEventListener(
              "touchstart",
              (ev) => {
                stFn();
                ev.preventDefault();
                ev.stopPropagation();
              },
              { passive: !1 }
            );
            b.addEventListener(
              "touchend",
              (ev) => {
                enFn && enFn();
                ev.preventDefault();
                ev.stopPropagation();
              },
              { passive: !1 }
            );
            return b;
          };
          bb = mkB(
            "joy-btn",
            "BOOST",
            () => {
              tb = !0;
            },
            () => {
              tb = !1;
            }
          );
          bp = mkB("joy-btn2", "II", () => {
            o = !0;
          });
          bm = mkB("joy-btn3", "R", () => {
            l = !0;
          });
          bs = mkB("joy-btn4", "BOMB", () => {
            sk = !0;
          });
          document.body.appendChild(bb);
          document.body.appendChild(bp);
          document.body.appendChild(bm);
          document.body.appendChild(bs);
          S.addEventListener("touchstart", ts, { passive: !1 });
          S.addEventListener("touchmove", tmv, { passive: !1 });
          S.addEventListener("touchend", te, { passive: !1 });
          S.addEventListener("touchcancel", te, { passive: !1 });
        }
      },
      detach() {
        x();
      },
      snapshot(playerPos) {
        const S = Rl();
        let C = 0,
          A = 0;
        (y("a", "arrowleft") && (C -= 1),
          y("d", "arrowright") && (C += 1),
          y("w", "arrowup") && (A -= 1),
          y("s", "arrowdown") && (A += 1));
        if (tm.id !== null) {
          ((C = tm.dx / JD), (A = tm.dy / JD));
        }
        const w = Math.hypot(C, A);
        if (
          (w > 0.01 && ((S.moveX = C / Math.max(1, w)), (S.moveZ = A / Math.max(1, w))),
          n && (e || t))
        ) {
          const resolved = aimResolver && playerPos ? aimResolver(e, t, playerPos) : null;
          if (resolved && Number.isFinite(resolved.x) && Number.isFinite(resolved.z)) lastResolvedAim = resolved;
          const mouseAim = lastResolvedAim || (() => {
            const U = Math.hypot(e, t);
            return U > 0.001 ? { x: e / U, z: t / U } : null;
          })();
          mouseAim && ((S.aimX = mouseAim.x), (S.aimZ = mouseAim.z));
        } else (S.moveX || S.moveZ) && ((S.aimX = S.moveX), (S.aimZ = S.moveZ));
        if (ta.id !== null) {
          const U = Math.hypot(ta.dx, ta.dy);
          U > 0.001 && ((S.aimX = ta.dx / U), (S.aimZ = ta.dy / U));
        }
        return (
          (S.firing = s || y(" ", "") || ta.id !== null),
          (S.boost = y("shift", "shiftleft") || r || tb),
          (S.pause = o),
          (S.mute = a),
          (S.restart = l),
          (S.skill = sk),
          (o = !1),
          (a = !1),
          (l = !1),
          (sk = !1),
          S
        );
      }
    };
  },
  Co = (i) => {
    let e = i >>> 0;
    const t = () => {
      e = (e + 1831565813) | 0;
      let n = e;
      return (
        (n = Math.imul(n ^ (n >>> 15), n | 1)),
        (n ^= n + Math.imul(n ^ (n >>> 7), n | 61)),
        ((n ^ (n >>> 14)) >>> 0) / 4294967296
      );
    };
    return {
      next: t,
      range: (n, s) => n + t() * (s - n),
      int: (n, s) => {
        const r = Math.ceil(n),
          o = Math.floor(s);
        return r + Math.floor(t() * (o - r + 1));
      },
      chance: (n) => t() < n,
      pick: (n) => n[Math.floor(t() * n.length)],
      sign: () => (t() < 0.5 ? -1 : 1),
      dir2: () => {
        const n = t() * Math.PI * 2;
        return { x: Math.cos(n), z: Math.sin(n) };
      },
      fork: (n) => Co((i ^ (n * 2654435761)) >>> 0),
      state: () => e
    };
  },
  Pl = (i) => Co(i >>> 0),
  Ll = (i) => {
    let e = 2166136261;
    for (let t = 0; t < i.length; t++) ((e ^= i.charCodeAt(t)), (e = Math.imul(e, 16777619)));
    return e >>> 0;
  },
  Po = (i = 0, e = 0, t = 0) => ({ x: i, y: e, z: t }),
  ei = (i, e) => ({ x: i.x - e.x, y: i.y - e.y, z: i.z - e.z }),
  Dl = (i) => Math.hypot(i.x, i.y, i.z),
  dr = (i, e) => Math.hypot(i.x - e.x, i.z - e.z),
  dn = (i) => {
    const e = Math.hypot(i.x, i.z);
    return e < 1e-9 ? { x: 0, y: 0, z: 0 } : { x: i.x / e, y: 0, z: i.z / e };
  },
  Lo = (i, e, t, n) => ({
    x: i,
    z: e,
    strength: t,
    age: 0,
    lifespan: n?.lifespan ?? 2.4,
    wavelength: n?.wavelength ?? 14,
    speed: n?.speed ?? 60,
    eventTier: n?.eventTier ?? "ordinary",
    coupleEntities: n?.coupleEntities ?? !1
  }),
  Ul = (i, e) => {
    const t = [];
    for (const n of i) {
      const s = n.age + e;
      s >= n.lifespan || t.push({ ...n, age: s });
    }
    // Cap live ripple count so the grid's O(vertices x impulses) sampling stays
    // bounded. Ordinary ripples remain grid-only; major death ripples can opt
    // into moving entities with the exact same sampled surface displacement.
    // Keep the most recent impulses by dropping the oldest from the front.
    if (t.length > fe.grid.maxImpulses) t.splice(0, t.length - fe.grid.maxImpulses);
    return t;
  },
  Do = (i) => {
    const e = i.age / i.lifespan,
      t = Math.max(0, 1 - e);
    return i.strength * t * t;
  },
  Uo = (i, e, t, n = !1) => {
    let s = 0;
    for (const r of i) {
      if (n && !r.coupleEntities) continue;
      const o = e - r.x,
        a = t - r.z,
        l = Math.hypot(o, a),
        c = r.age * r.speed,
        u = l - c;
      if (Math.abs(u) > r.wavelength * 2) continue;
      const h = (u / r.wavelength) * Math.PI * 2,
        f = Math.exp(-(u * u) / (2 * r.wavelength * r.wavelength)),
        p = Do(r) * f;
      s += Math.sin(h) * p;
    }
    return s;
  },
  Il = (i) => {
    let e = 0;
    for (const t of i) e += Do(t);
    return e;
  };
let Nl = 1e5;
const Fl = () => ++Nl,
  Ol = (i = { x: 0, y: 0, z: 0 }) => ({
    id: Fl(),
    tag: "player",
    pos: { ...i },
    vel: Po(),
    radius: fe.player.radius,
    hp: fe.player.maxHp,
    maxHp: fe.player.maxHp,
    aim: { x: 0, y: 0, z: -1 },
    fireCooldown: 0,
    fireInterval: 0.045,
    boost: fe.player.maxBoost,
    alive: !0,
    invuln: fe.player.invulnTime,
    multiplier: 1,
    score: 0,
    energy: 0,
    weaponLevel: 1,
    weaponLevels: { blaster: 1, missile: 0, lightning: 0, laser: 0 },
    primaryWeapon: "blaster",
    secondaryWeapon: null,
    weaponCooldowns: { primary: 0, secondary: 0 },
    lives: fe.player.maxLives,
    shield: 0,
    hitCount: 0
  }),
  Bl = (i, e, t, n) => {
    if (!i.alive) return;
    if (e.aimX || e.aimZ) {
      const g = dn({ x: e.aimX, z: e.aimZ });
      (g.x || g.z) && (i.aim = g);
    }
    const s = fe.player,
      r = e.boost && i.boost > 0.01,
      o = r ? s.boostSpeed : s.speed,
      a = r ? s.accel * 1.5 : s.accel;
    let l = e.moveX,
      c = e.moveZ;
    const u = Math.hypot(l, c);
    if ((u > 1 && ((l /= u), (c /= u)), (i.vel.x += l * a * t), (i.vel.z += c * a * t), u < 0.01)) {
      const g = Math.max(0, 1 - s.friction * t);
      ((i.vel.x *= g), (i.vel.z *= g));
    }
    const h = Math.hypot(i.vel.x, i.vel.z);
    if (h > o) {
      const g = o / h;
      ((i.vel.x *= g), (i.vel.z *= g));
    }
    ((i.pos.x += i.vel.x * t), (i.pos.z += i.vel.z * t));
    const f = n.arenaRadius - i.radius,
      p = Math.hypot(i.pos.x, i.pos.z);
    if (p > f) {
      const g = f / p;
      ((i.pos.x *= g), (i.pos.z *= g));
      const _ = i.pos.x / f,
        m = i.pos.z / f,
        d = i.vel.x * _ + i.vel.z * m;
      d > 0 && ((i.vel.x -= d * _), (i.vel.z -= d * m));
    }
    (r
      ? (i.boost = Math.max(0, i.boost - s.boostDrain * t))
      : (i.boost = Math.min(s.maxBoost, i.boost + s.boostRegen * t)),
      (i.fireCooldown = Math.max(0, i.fireCooldown - t)),
      (i.weaponCooldowns.primary = Math.max(0, i.weaponCooldowns.primary - t)),
      (i.weaponCooldowns.secondary = Math.max(0, i.weaponCooldowns.secondary - t)),
      (i.invuln = Math.max(0, i.invuln - t)),
      (i.energy = Math.min(s.maxEnergy, i.energy + s.energyRegen * t)),
      (i.shield = Math.max(0, i.shield - t)));
  },
  zl = (i, e) =>
    !e || !i.alive || i.fireCooldown > 0 ? !1 : ((i.fireCooldown = i.fireInterval), !0),
  qr = (i, e, t) => {
    if (!i.alive || i.invuln > 0) return !1;
    t.events.push({ type: "hit-player", pos: { ...i.pos }, damage: e });
    ic(i.pos, fe.particles.hitPlayer, 0xff3a4a, t);
    const killPlayer = () => {
      ((i.hp = 0),
        (i.alive = !1),
        (i.hitCount = 0),
        (t.gameOver = !0),
        (t.eventWobble = Math.max(t.eventWobble || 0, 1)),
        t.events.push({
          type: "explode",
          pos: { ...i.pos },
          radius: 3,
          strength: 1.4,
          color: 3399167
        }),
        t.events.push({ type: "game-over", pos: { ...i.pos } }),
        t.impulses.push(
          Lo(i.pos.x, i.pos.z, fe.grid.impulseStrength * 3.2, {
            lifespan: 2.8,
            wavelength: 16,
            speed: 48,
            eventTier: "death",
            coupleEntities: !0
          })
        ));
    };
    if (i.lives <= 0) return (killPlayer(), !0);
    i.hitCount = (i.hitCount || 0) + 1;
    if (i.hitCount < 3) {
      // first/second hit of the trio: no life lost, brief shield + knockback
      ((i.hp = i.maxHp),
        (i.alive = !0),
        (i.invuln = fe.player.shieldTime),
        (i.shield = fe.player.shieldTime),
        t.impulses.push(Lo(i.pos.x, i.pos.z, fe.grid.impulseStrength * 1.5)));
      return !0;
    }
    // third hit: consume one life, but recover exactly where the hit happened.
    // Resetting pos to arena center felt like an unintended teleport and also
    // detached the event ripple from the player. Stop momentum only.
    ((i.hitCount = 0),
      (i.lives -= 1),
      (t.eventWobble = Math.max(t.eventWobble || 0, 0.72)),
      (i.hp = i.maxHp),
      (i.alive = !0),
      (i.invuln = fe.player.shieldTime),
      (i.shield = fe.player.shieldTime),
      (Object.keys(i.weaponLevels).forEach((weapon) => {
        if (i.weaponLevels[weapon] > 0) i.weaponLevels[weapon] = Math.max(1, i.weaponLevels[weapon] - 1);
      })),
      (i.weaponLevel = Math.max(i.weaponLevels[i.primaryWeapon], i.secondaryWeapon ? i.weaponLevels[i.secondaryWeapon] : 0)),
      (i.vel = { x: 0, y: 0, z: 0 }),
      t.events.push({ type: "revive", pos: { ...i.pos } }),
      t.impulses.push(
        Lo(i.pos.x, i.pos.z, fe.grid.impulseStrength * 2, {
          eventTier: "heart",
          coupleEntities: !0
        })
      ));
    if (i.lives <= 0) return (killPlayer(), !0);
    return !0;
  };
const PRIMARY_WEAPON = "blaster",
  WEAPON_TYPES = Object.freeze([PRIMARY_WEAPON, "missile", "lightning", "laser"]),
  WEAPON_DROP_ORDER = Object.freeze(["missile", "lightning", "laser"]),
  WEAPON_NAMES = Object.freeze({ blaster: "BLASTER", missile: "MISSILE", lightning: "LIGHTNING", laser: "LASER" }),
  WEAPON_COLORS = Object.freeze({ blaster: 0x88ffff, missile: 0xff7a18, lightning: 0xc8f7ff, laser: 0xff2bd6 });
let Gl = 2e5;
const Vl = () => ++Gl,
  // Bullet factory with optional overrides (kind/speed/life/damage/radius/pierce)
  Fb = (owner, pos, dir, world, opts = {}) => {
    const o = opts.speed ?? fe.player.bulletSpeed,
      a = opts.life ?? fe.player.bulletLife,
      l = opts.damage ?? fe.player.bulletDamage,
      c = opts.radius ?? fe.player.bulletRadius,
      kind = opts.kind ?? "standard",
      pierce = opts.pierce ?? !1;
    const u = {
      id: Vl(),
      tag: "bullet",
      pos: { ...pos },
      vel: { x: dir.x * o, y: 0, z: dir.z * o },
      radius: c,
      owner,
      kind,
      life: a,
      damage: l,
      spent: !1,
      pierce,
      level: opts.level ?? 1,
      turnRate: opts.turnRate ?? 0,
      blastRadius: opts.blastRadius ?? 0,
      hitIds: [],
      prevPos: { ...pos }
    };
    return (world.bullets.push(u), u);
  },
  rotatedWeaponDir = (dir, angle) => {
    const ca = Math.cos(angle), sa = Math.sin(angle);
    return { x: dir.x * ca - dir.z * sa, z: dir.x * sa + dir.z * ca };
  },
  fireWeaponSlot = (p, world, weapon, slot) => {
    if (!weapon || p.weaponCooldowns[slot] > 0) return !1;
    const level = Math.max(1, Math.min(fe.player.maxWeaponLevel, p.weaponLevels[weapon] || 1)),
      cfg = fe.player.weapons[weapon],
      dir = p.aim,
      side = slot === "primary" ? -0.18 : 0.18,
      px = -dir.z,
      pz = dir.x,
      muzzle = { x: p.pos.x + dir.x * (p.radius + 0.28) + px * side, y: 0, z: p.pos.z + dir.z * (p.radius + 0.28) + pz * side },
      spawn = (shotDir, opts = {}) => Fb("player", muzzle, shotDir, world, { level, ...opts });
    p.weaponCooldowns[slot] = cfg.interval * (slot === "secondary" ? 1.12 : 1) * (1 - (level - 1) * 0.08);
    if (weapon === "blaster") {
      const count = level;
      for (let k = 0; k < count; k++) {
        const offset = (k - (count - 1) / 2) * 0.24;
        Fb("player", { x: muzzle.x + px * offset, y: 0, z: muzzle.z + pz * offset }, dir, world, { kind: "standard", damage: cfg.damage * (1 + (level - 1) * 0.12), level });
      }
    } else if (weapon === "missile") {
      const count = level === 3 ? 2 : 1;
      for (let k = 0; k < count; k++) spawn(rotatedWeaponDir(dir, (k - (count - 1) / 2) * 0.16), {
        kind: "missile", speed: 18 + level * 1.5, life: 3.1, damage: cfg.damage + level * 0.9,
        radius: 0.36, turnRate: cfg.turnRate + level * 0.8, blastRadius: cfg.blastRadius + level * 0.25
      });
    } else if (weapon === "lightning") {
      world.pendingLightning.push({ pos: { ...muzzle }, dir: { ...dir }, level, damage: cfg.damage + (level - 1) * 0.65, range: cfg.range + level });
    } else if (weapon === "laser") {
      spawn(dir, { kind: "laser", speed: 72, life: 0.72 + level * 0.08, damage: cfg.damage + level * 0.5, radius: 0.42 + level * 0.04, pierce: !0 });
      world.weaponEffects.push({ kind: "laser", from: { ...muzzle }, to: { x: muzzle.x + dir.x * (9 + level * 2), z: muzzle.z + dir.z * (9 + level * 2) }, life: 0.09, maxLife: 0.09 });
    }
    world.events.push({ type: "weapon-fire", pos: { ...muzzle }, weapon, level, slot });
    return !0;
  },
  kl = (p, world) => {
    // The blaster is an always-on survival baseline. Special pickups may only
    // replace/upgrade the secondary slot, never displace the primary weapon.
    p.primaryWeapon = PRIMARY_WEAPON;
    fireWeaponSlot(p, world, PRIMARY_WEAPON, "primary");
    fireWeaponSlot(p, world, WEAPON_DROP_ORDER.includes(p.secondaryWeapon) ? p.secondaryWeapon : null, "secondary");
  },
  fireSkill = (world, sys) => {
    const i = world.player,
      r = fe.player.skillRadius;
    world.events.push({ type: "skill", pos: { ...i.pos }, radius: r, color: 1703935 });
    world.impulses.push(Lo(i.pos.x, i.pos.z, fe.grid.impulseStrength * 4));
    // 600 particles in one NOVA use would violate the no-single-frame-spike rule
    // (OMM-007); stagger through pendingBursts like boss death.
    world.pendingBursts.push({ pos: { ...i.pos }, remaining: fe.particles.perBigKill * 4, color: 1703935, perFrame: 130 });
    for (const en of world.enemies) {
      if (en.dead) continue;
      if (Math.hypot(en.pos.x - i.pos.x, en.pos.z - i.pos.z) <= r + en.radius) {
        Io(en, fe.player.skillDamage) && fs(world, sys, en);
      }
    }
    for (const b of world.bullets)
      if (b.owner !== "player" && Math.hypot(b.pos.x - i.pos.x, b.pos.z - i.pos.z) <= r) b.spent = !0;
    if (world.boss && !world.boss.dead && Math.hypot(world.boss.pos.x - i.pos.x, world.boss.pos.z - i.pos.z) <= r + world.boss.radius) {
      bossHit(world.boss, fe.player.skillDamage, world, sys);
    }
    sys.shake = pc(sys.shake, 0.8);
    world.trauma = sys.shake.trauma;
  },
  Wl = (b, dt, world) => {
    b.prevPos = { ...b.pos };
    if (b.kind === "missile" && b.owner === "player") {
      const targets = world.enemies.filter((enemy) => !enemy.dead);
      if (world.boss && !world.boss.dead) targets.push(world.boss);
      let target = null, best = 15 * 15;
      for (const candidate of targets) {
        const dx = candidate.pos.x - b.pos.x, dz = candidate.pos.z - b.pos.z, d2 = dx * dx + dz * dz;
        if (d2 < best) { best = d2; target = candidate; }
      }
      if (target) {
        const dx = target.pos.x - b.pos.x, dz = target.pos.z - b.pos.z, len = Math.hypot(dx, dz) || 1,
          speed = Math.hypot(b.vel.x, b.vel.z), turn = Math.min(1, (b.turnRate || 5) * dt),
          nx = b.vel.x / Math.max(0.001, speed) * (1 - turn) + dx / len * turn,
          nz = b.vel.z / Math.max(0.001, speed) * (1 - turn) + dz / len * turn,
          nl = Math.hypot(nx, nz) || 1;
        b.vel.x = nx / nl * speed;
        b.vel.z = nz / nl * speed;
      }
    }
    ((b.pos.x += b.vel.x * dt), (b.pos.z += b.vel.z * dt), (b.life -= dt));
  },
  Xl = (i, e) => (i.spent || i.life <= 0 ? !1 : Math.hypot(i.pos.x, i.pos.z) <= e + 2);
let ql = 3e5;
const Yl = () => ++ql,
  Kl = (i, e, t) => {
    const n = fe.enemies[i];
    return {
      id: Yl(),
      tag: "enemy",
      pos: { ...e },
      vel: Po(),
      radius: n.radius,
      hp: n.hp,
      maxHp: n.hp,
      score: n.score,
      kind: i,
      behaviorTimer: t.rng.range(0, 2),
      phase: t.rng.next() * Math.PI * 2,
      critical: !1,
      jitter: { x: t.rng.sign(), y: 0, z: t.rng.sign() },
      dead: !1
    };
  },
  Io = (i, e) => ((i.hitFlash = 0.14), (i.hp -= e), i.hp <= 0 ? ((i.hp = 0), (i.dead = !0), !0) : !1),
  Ri = (i, e, t, n) => {
    ((i.vel.x = e.x * t), (i.vel.z = e.z * t), (i.pos.x += i.vel.x * n), (i.pos.z += i.vel.z * n));
  },
  Zl = (i) => {
    const { enemy: e, player: t, dt: n } = i,
      s = ei(t.pos, e.pos),
      r = dn(s);
    Ri(e, { x: r.x, z: r.z }, fe.enemies.grunt.speed, n);
  },
  Jl = (i) => {
    const { enemy: e, player: t, dt: n } = i,
      s = ei(t.pos, e.pos),
      r = dn(s);
    e.phase += n * 3;
    const o = { x: -r.z, z: r.x },
      a = Math.sin(e.phase + e.jitter.x) * 0.5,
      l = { x: r.x + o.x * a, z: r.z + o.z * a },
      c = Math.hypot(l.x, l.z) || 1;
    Ri(e, { x: l.x / c, z: l.z / c }, fe.enemies.wanderer.speed, n);
  },
  $l = (i) => {
    const { enemy: e, player: t, bullets: n, world: s, dt: r } = i,
      o = fe.enemies.singularity,
      a = ei(t.pos, e.pos),
      l = dn(a);
    Ri(e, { x: l.x * 0.5, z: l.z * 0.5 }, o.speed, r);
    const c = o.pullRadius,
      u = o.pullForce;
    if (dr(t.pos, e.pos) < c) {
      const h = ei(e.pos, t.pos),
        f = dn(h),
        p = Dl(h),
        g = u * (1 - p / c);
      ((t.vel.x += f.x * g * r), (t.vel.z += f.z * g * r));
    }
    for (const h of n)
      if (!(h.owner !== "player" || h.spent) && dr(h.pos, e.pos) < c) {
        const f = ei(e.pos, h.pos),
          p = dn(f);
        ((h.vel.x += p.x * u * 0.3 * r), (h.vel.z += p.z * u * 0.3 * r));
      }
    ((e.behaviorTimer += r),
      !e.critical &&
        e.behaviorTimer >= o.explodeTime * 0.66 &&
        ((e.critical = !0),
        s.events.push({ type: "shockwave", pos: { ...e.pos }, strength: 0.6 })));
  },
  jl = (i) => {
    const { enemy: e, player: t, bullets: n, dt: s } = i,
      r = fe.enemies.dodger,
      o = ei(t.pos, e.pos),
      a = dn(o);
    e.behaviorTimer -= s;
    let l = { x: 0, z: 0 },
      c = !1;
    if (e.behaviorTimer <= 0)
      for (const u of n) {
        if (u.owner !== "player" || u.spent) continue;
        if (dr(u.pos, e.pos) < r.dodgeRange) {
          const f = dn(u.vel);
          ((l = { x: -f.z, z: f.x }), e.jitter.x < 0 && (l = { x: f.z, z: -f.x }), (c = !0));
          break;
        }
      }
    c
      ? (Ri(e, l, r.dodgeSpeed, s), (e.behaviorTimer = r.dodgeCooldown))
      : Ri(e, { x: a.x, z: a.z }, r.speed, s);
  },
  Ql = (i) => {
    switch (i.enemy.kind) {
      case "grunt":
        return Zl(i);
      case "wanderer":
        return Jl(i);
      case "singularity":
        return $l(i);
      case "dodger":
        return jl(i);
    }
  },
  // ---------------- Items ----------------
  nextWeaponDrop = (world) => {
    const levels = world.player.weaponLevels,
      reserved = new Set(world.items.filter((item) => item.kind === "weapon" && !item.dead).map((item) => item.weaponType)),
      locked = WEAPON_DROP_ORDER.find((weapon) => !levels[weapon] && !reserved.has(weapon));
    return locked || world.rng.pick(WEAPON_DROP_ORDER);
  },
  randomItemKind = (world) => {
    const pool = Object.entries(fe.items.dropWeights).flatMap(([kind, weight]) => Array(weight).fill(kind));
    return world.rng.pick(pool);
  },
  makeItem = (kind, pos, world) => {
    const colors = fe.items.colors,
      weaponType = kind === "weapon" ? nextWeaponDrop(world) : null;
    return {
      id: Yl(),
      tag: "item",
      kind,
      weaponType,
      pos: { ...pos },
      vel: { x: 0, y: 0, z: 0 },
      radius: fe.items.radius,
      life: fe.items.lifespan,
      bob: world.rng.next() * Math.PI * 2,
      color: weaponType ? WEAPON_COLORS[weaponType] : colors[kind],
      dead: !1
    };
  },
  stepItems = (world, dt) => {
    for (const it of world.items) {
      it.life -= dt;
      it.bob += dt * 2.6;
      it.pos.x += it.vel.x * dt;
      it.pos.z += it.vel.z * dt;
      it.vel.x *= 0.92;
      it.vel.z *= 0.92;
      if (it.life <= 0) it.dead = !0;
    }
    const p = world.player;
    const magnetRadius = fe.items.magnetRadius;
    const magnetPull = fe.items.magnetPull;
    if (p.alive) {
      for (const it of world.items) {
        if (it.dead) continue;
        const dx = p.pos.x - it.pos.x;
        const dz = p.pos.z - it.pos.z;
        const dist = Math.hypot(dx, dz);
        // magnet: pull items toward player when within magnetRadius
        if (dist <= magnetRadius && dist > 0.001) {
          const pull = 1 - dist / magnetRadius; // 0..1, stronger when closer
          const mag = magnetPull * pull * (0.25 + 0.75 * pull);
          it.vel.x += (dx / dist) * mag * dt;
          it.vel.z += (dz / dist) * mag * dt;
        }
        if (dist <= p.radius + it.radius + 0.5) {
          it.dead = !0;
          applyItem(p, it, world);
          // Route pickup burst through pendingBursts so multi-pickups in one
          // frame (e.g. 6 boss drops grabbed together) can't spawn 180+ bright
          // additive particles in a single frame -> GPU/bloom stall. The
          // global drain budget in Jr keeps total per-frame spawn bounded.
          world.pendingBursts.push({ pos: { ...it.pos }, remaining: fe.particles.pickup, color: fe.items.colors[it.kind] ?? 16777215, perFrame: 40 });
          world.events.push({ type: "pickup", pos: { ...it.pos }, kind: it.kind });
        }
      }
    }
    world.items = world.items.filter((it) => !it.dead);
  },
  equipWeapon = (p, weapon) => {
    if (!weapon || !WEAPON_DROP_ORDER.includes(weapon)) return;
    p.primaryWeapon = PRIMARY_WEAPON;
    p.weaponLevels[PRIMARY_WEAPON] = 1;
    p.weaponLevels[weapon] = Math.min(fe.player.maxWeaponLevel, (p.weaponLevels[weapon] || 0) + 1);
    p.secondaryWeapon = weapon;
    p.weaponLevel = p.weaponLevels[weapon];
  },
  applyItem = (p, item, world) => {
    const kind = item.kind;
    switch (kind) {
      case "heal":
        if (p.lives < fe.player.maxLives) p.lives += 1;
        else {
          p.hp = Math.min(p.maxHp, p.hp + 30);
          p.invuln = Math.max(p.invuln, fe.player.shieldTime);
        }
        break;
      case "boost":
        p.boost = fe.player.maxBoost;
        break;
      case "weapon":
        equipWeapon(p, item.weaponType || nextWeaponDrop(world));
        break;
      case "life":
        p.lives = Math.min(fe.player.maxLives + 3, p.lives + 1);
        break;
      case "shield":
        p.invuln = Math.max(p.invuln, fe.player.shieldTime);
        p.shield = fe.player.shieldTime;
        break;
      case "multiplier":
        p.multiplier = Math.min(fe.score.multiplierMax, p.multiplier + 3);
        p.score += 1000 * p.multiplier;
        break;
    }
  },
  // ---------------- Boss ----------------
  bossRageForNumber = (bossNumber) => {
    const level = Math.max(0, bossNumber - 3),
      cfg = fe.boss;
    return {
      level,
      hpMul: 1 + level * cfg.postThirdHpGrowth,
      speedMul: Math.min(1.75, 1 + level * cfg.postThirdSpeedGrowth),
      fireMul: Math.max(0.42, 1 - level * cfg.postThirdFireAccel),
      bulletSpeedMul: Math.min(1.7, 1 + level * cfg.postThirdBulletSpeedGrowth),
      damageAdd: level * cfg.postThirdDamageGrowth,
      extraBullets: Math.min(12, level * cfg.postThirdExtraBullets)
    };
  },
  bossForWave = (wave) =>
    wave % 10 === 0 ? "big" : wave % 10 === fe.boss.miniWave ? "mini" : null,
  makeBoss = (type, world, bossNumber = 1) => {
    const b = fe.boss[type],
      rage = bossRageForNumber(bossNumber),
      e = Kl("singularity", { x: 0, y: 0, z: 0 }, world),
      hp = Math.ceil(b.hp * rage.hpMul);
    e.kind = "boss";
    e.bossType = type;
    e.bossNumber = bossNumber;
    e.rageLevel = rage.level;
    e.radius = b.radius;
    e.hp = hp;
    e.maxHp = hp;
    e.score = Math.round(b.score * (1 + rage.level * 0.25));
    e.speed = b.speed * rage.speedMul;
    e.color = b.color;
    e.fireCooldown = rage.level > 0 ? Math.min(0.9, b.fireInterval * rage.fireMul) : 1.6;
    e.fireInterval = b.fireInterval * rage.fireMul;
    e.bulletSpeed = b.bulletSpeed * rage.bulletSpeedMul;
    e.bulletLife = b.bulletLife;
    e.bulletDamage = b.bulletDamage + rage.damageAdd;
    e.extraBullets = rage.extraBullets;
    e.phase = 0;
    e.behaviorTimer = 0;
    e.dead = !1;
    return e;
  },
  stepBoss = (world, sys, dt) => {
    const b = world.boss;
    if (!b || b.dead) return;
    const p = world.player;
    b.phase += dt;
    b.behaviorTimer += dt;
    b.fireCooldown -= dt;
    b.hitFlash = Math.max(0, (b.hitFlash || 0) - dt);
    const toP = { x: p.pos.x - b.pos.x, z: p.pos.z - b.pos.z },
      d = Math.hypot(toP.x, toP.z) || 1,
      tang = { x: -toP.z / d, z: toP.x / d };
    let vx = (toP.x / d) * 0.4 + tang.x * 0.8,
      vz = (toP.z / d) * 0.4 + tang.z * 0.8;
    if (d < 8) {
      vx = -toP.x / d;
      vz = -toP.z / d;
    }
    b.pos.x += vx * b.speed * dt;
    b.pos.z += vz * b.speed * dt;
    const ar = world.arenaRadius - b.radius,
      rr = Math.hypot(b.pos.x, b.pos.z);
    if (rr > ar) {
      b.pos.x *= ar / rr;
      b.pos.z *= ar / rr;
    }
    if (b.fireCooldown <= 0) {
      b.fireCooldown = b.fireInterval;
      const aimed = { x: toP.x / d, z: toP.z / d },
        n = (b.bossType === "big" ? 14 : 10) + (b.extraBullets || 0);
      if (b.bossType === "big" && Math.floor(b.behaviorTimer) % 2 === 0) {
        const lanes = Math.min(7, 3 + Math.floor((b.extraBullets || 0) / 2)),
          mid = (lanes - 1) / 2;
        for (let lane = 0; lane < lanes; lane++) {
          const ang = (lane - mid) * 0.16,
            ca = Math.cos(ang),
            sa = Math.sin(ang),
            dir = { x: aimed.x * ca - aimed.z * sa, z: aimed.x * sa + aimed.z * ca };
          Fb("boss", { x: b.pos.x, y: 0, z: b.pos.z }, dir, world, {
            kind: "enemy",
            speed: b.bulletSpeed,
            life: b.bulletLife,
            damage: b.bulletDamage,
            radius: 0.34
          });
        }
      } else {
        const off = b.phase * 0.6;
        for (let k = 0; k < n; k++) {
          const ang = (k / n) * Math.PI * 2 + off,
            dir = { x: Math.cos(ang), z: Math.sin(ang) };
          Fb("boss", { x: b.pos.x, y: 0, z: b.pos.z }, dir, world, {
            kind: "enemy",
            speed: b.bulletSpeed,
            life: b.bulletLife,
            damage: b.bulletDamage,
            radius: 0.32
          });
        }
      }
      world.events.push({ type: "boss-fire", pos: { ...b.pos } });
    }
  },
  bossHit = (b, dmg, world, sys) => {
    if (!b || b.dead) return;
    b.hp -= dmg;
    b.hitFlash = 0.14;
    world.events.push({ type: "boss-hit", pos: { ...b.pos } });
    if (b.hp <= 0) {
      b.hp = 0;
      b.dead = !0;
      world.player.score += b.score;
      world.player.energy = fe.player.maxEnergy;
      world.pendingBursts.push({ pos: { ...b.pos }, remaining: fe.particles.perBigKill * 6, color: b.color, perFrame: 130 });
      world.impulses.push(
        Lo(b.pos.x, b.pos.z, fe.grid.impulseStrength * 4, {
          lifespan: 3,
          wavelength: 18,
          speed: 46,
          eventTier: "death",
          coupleEntities: !0
        })
      );
      sys.shake = pc(sys.shake, 1);
      world.trauma = 1;
      world.eventWobble = 1;
      world.events.push({ type: "boss-dead", pos: { ...b.pos }, score: b.score });
      const guaranteedWeapons = fe.items.bossWeaponDrops[b.bossType] || 0;
      for (let i = 0; i < fe.items.bossDropCount; i++) {
        const a = world.rng.next() * Math.PI * 2,
          r = world.rng.range(0, 3),
          kind = i < guaranteedWeapons ? "weapon" : randomItemKind(world);
        world.items.push(makeItem(kind, { x: b.pos.x + Math.cos(a) * r, y: 0, z: b.pos.z + Math.sin(a) * r }, world));
      }
      if (world.bossActiveWave) world.bossDefeatedWaves.add(world.bossActiveWave);
      sys.spawn.bossIndex = (sys.spawn.bossIndex || 0) + 1;
      const _defeated = sys.spawn.bossIndex || 0,
        _spike = Math.max(0, _defeated - 2),
        _min = _spike > 0 ? fe.boss.postThirdIntervalMin : fe.boss.intervalMin,
        _ni = Math.max(_min, fe.boss.interval - _defeated * 2.5 - _spike * fe.boss.postThirdIntervalCut);
      sys.spawn.bossTimer = _ni;
      sys.spawn.bossTimerMax = _ni;
      world.boss = null;
      world.bossActiveWave = 0;
    }
  },
  Xt = {
    player: 3399167,
    enemyColor: { grunt: 16720486, wanderer: 16755234, singularity: 11158783, dodger: 4521881 },
    bulletColor: { standard: 8978431, spread: 6750156, missile: 0xff7a18, lightning: 0xc8f7ff, laser: 1703935, enemy: 0xff3a4a },
    bossPalette: {
      mini: { armor: 0x247cff, joint: 0x071d5c, core: 0x7df9ff },
      big: { armor: 0xff4b1f, joint: 0x521008, core: 0xffd166 }
    },
    sparkPool: [16777215, 8978431, 16737996, 16755234, 6750156, 11167487, 16777215],
    grid: 17578,
    gridGlow: 3386111,
    bg: 329231
  },
  Si = (i) => Xt.enemyColor[i],
  ec = (i) => Xt.bulletColor[i];
let tc = 4e5;
const nc = () => ++tc,
  ic = (i, e, t, n, s) => {
    const r = fe.particles;
    if (n.particles.length > r.maxParticles) return;
    const o = r.speed,
      a = r.lifespan,
      pool = Xt.sparkPool;
    for (let u = 0; u < e && !(n.particles.length >= r.maxParticles); u++) {
      const tier = n.rng.next(),
        h = n.rng.next() * Math.PI * 2,
        baseCol = n.rng.chance(0.62) ? t : n.rng.pick(pool);
      let rad, life, spd, vy, col;
      if (tier < 0.16) {
        // bright hot core flash
        rad = 0.3 + n.rng.next() * 0.18;
        life = a * (0.35 + n.rng.next() * 0.25);
        spd = o * (0.9 + n.rng.next() * 0.6);
        vy = (n.rng.next() - 0.5) * 2 * o * 0.5;
        col = n.rng.chance(0.7) ? 16777215 : baseCol;
      } else if (tier < 0.6) {
        // fast streak
        rad = 0.1 + n.rng.next() * 0.08;
        life = a * (0.55 + n.rng.next() * 0.5);
        spd = o * (0.7 + n.rng.next() * 0.9);
        vy = (n.rng.next() - 0.4) * 2 * o * 0.4;
        col = baseCol;
      } else {
        // slow drifting ember
        rad = 0.14 + n.rng.next() * 0.1;
        life = a * (0.8 + n.rng.next() * 0.7);
        spd = o * (0.2 + n.rng.next() * 0.45);
        vy = (n.rng.next() - 0.5) * 2 * o * 0.25;
        col = baseCol;
      }
      n.particles.push({
        id: nc(),
        tag: "particle",
        pos: { ...i },
        vel: { x: Math.cos(h) * spd, y: vy, z: Math.sin(h) * spd },
        radius: rad,
        life: life,
        lifespan: life,
        damping: r.damping,
        color: col,
        size: rad
      });
    }
  },
  sc = (i, e) => {
    const t = Math.pow(i.damping, e * 60);
    ((i.vel.x *= t),
      (i.vel.y *= t),
      (i.vel.z *= t),
      (i.vel.y -= 9 * e * 0.3),
      (i.pos.x += i.vel.x * e),
      (i.pos.y += i.vel.y * e),
      (i.pos.z += i.vel.z * e),
      (i.life -= e));
  },
  rc = () => ({ combo: 0, lastKillTime: -1 / 0, multiplier: 1, multiplierPulse: 0 }),
  ac = (i, e, t, n) => {
    const s = fe.score,
      o = n - i.lastKillTime <= s.comboWindow ? i.combo + 1 : 1,
      a = Math.min(s.multiplierMax, Math.max(1, Math.floor(o * s.multiplierStep))),
      l = e.score * i.multiplier;
    ((t.score += l), (t.multiplier = a));
    const c = [{ type: "kill", pos: e.pos, kind: e.kind, score: l }];
    return (
      a > i.multiplier && c.push({ type: "multiplier-up", value: a }),
      { sys: { combo: o, lastKillTime: n, multiplier: a, multiplierPulse: 1 }, events: c }
    );
  },
  oc = (i, e) => ({ ...i, multiplierPulse: Math.max(0, i.multiplierPulse - e * 2.2) }),
  lc = (i) => ({ ...i, combo: 0, multiplier: 1, lastKillTime: -1 / 0 }),
  cc = () => ({ timer: 0, wave: 1, budget: fe.spawn.waveBudgetGrowth, killsThisWave: 0, bossTimer: fe.boss.firstDelay, bossTimerMax: fe.boss.firstDelay, bossIndex: 0 }),
  uc = (i) => {
    const e = Object.keys(fe.enemies);
    let t = 0;
    for (const s of e) t += fe.enemies[s].spawnWeight;
    let n = i.next() * t;
    for (const s of e) if (((n -= fe.enemies[s].spawnWeight), n <= 0)) return s;
    return e[0];
  },
  Yr = (i) => {
    const e = fe.spawn,
      t = e.baseInterval * Math.pow(e.intervalDecay, i - 1);
    return Math.max(e.minInterval, t);
  },
  hc = (i, e, t) => {
    if (i.gameOver) return { sys: e, events: [] };
    const n = fe.spawn;
    let s = e.timer + t;
    const r = [],
      o = i.arenaRadius - n.spawnRingPad;
    for (; s >= Yr(e.wave);)
      if (((s -= Yr(e.wave)), i.enemies.length < Math.min(n.maxAliveCap, n.maxAlive + e.wave * n.maxAlivePerWave))) {
        const a = uc(i.rng),
          l = i.rng.next() * Math.PI * 2,
          c = o * (0.7 + i.rng.next() * 0.3),
          u = { x: Math.cos(l) * c, y: 0, z: Math.sin(l) * c },
          h = Kl(a, u, i);
        (i.enemies.push(h), r.push({ type: "spawn", pos: u, kind: a }));
      }
    return { sys: { ...e, timer: s }, events: r };
  },
  fc = (i, e) => {
    const t = e;
    return t >= i.budget
      ? {
          ...i,
          wave: i.wave + 1,
          budget: i.wave * fe.spawn.waveBudgetGrowth + fe.spawn.waveBudgetGrowth,
          killsThisWave: 0
        }
      : { ...i, killsThisWave: t };
  },
  dc = (i) => ({ trauma: 0, seed: i }),
  pc = (i, e) => ({ ...i, trauma: Math.min(1, i.trauma + e) }),
  mc = (i, e) => ({ ...i, trauma: Math.max(0, i.trauma - e * fe.camera.traumaDecay) }),
  gc = (i, e) => {
    const t = i.trauma * i.trauma * fe.camera.shakeAmp,
      n = i.seed,
      s =
        Math.sin(e * fe.camera.shakeLambda + n) +
        Math.sin(e * fe.camera.shakeLambda * 1.7 + n * 1.3) * 0.5,
      r =
        Math.sin(e * (fe.camera.shakeLambda + 3.3) + n * 2.1) +
        Math.sin(e * (fe.camera.shakeLambda + 5.1) + n * 3.7) * 0.5,
      o = Math.sin(e * (fe.camera.shakeLambda + 2.1) + n * 5.2);
    return { x: s * t, y: r * t * 0.6, z: o * t * 0.4, roll: s * i.trauma * fe.camera.rollAmp };
  },
  _c = (i, e) => {
    const t = i.radius + e.radius,
      n = i.pos.x - e.pos.x,
      s = i.pos.z - e.pos.z;
    return n * n + s * s <= t * t;
  };
class vc {
  constructor(e) {
    if (((this.buckets = new Map()), e <= 0)) throw new Error("cellSize must be > 0");
    this.cell = e;
  }
  key(e, t) {
    const n = e >= 0 ? e * 2 : e * -2 - 1,
      s = t >= 0 ? t * 2 : t * -2 - 1;
    return ((n + s) * (n + s + 1)) / 2 + s;
  }
  clear() {
    this.buckets.clear();
  }
  insert(e) {
    const t = Math.max(0, Math.ceil(e.radius / this.cell)),
      n = Math.floor(e.pos.x / this.cell),
      s = Math.floor(e.pos.z / this.cell);
    for (let r = -t; r <= t; r++)
      for (let o = -t; o <= t; o++) {
        const a = this.key(n + r, s + o);
        let l = this.buckets.get(a);
        (l || ((l = []), this.buckets.set(a, l)), l.push(e));
      }
  }
  queryCandidates(e) {
    const t = Math.max(0, Math.ceil(e.radius / this.cell)),
      n = Math.floor(e.pos.x / this.cell),
      s = Math.floor(e.pos.z / this.cell),
      r = new Set(),
      o = [];
    for (let a = -t; a <= t; a++)
      for (let l = -t; l <= t; l++) {
        const c = this.buckets.get(this.key(n + a, s + l));
        if (c) for (const u of c) r.has(u) || (r.add(u), o.push(u));
      }
    return o;
  }
}
const Kr = (i, e, t, n) => {
    const [s, r] = i.length <= e.length ? [i, e] : [e, i],
      o = new vc(t);
    for (const c of r) o.insert(c);
    const a = [],
      l = new Set();
    for (const c of s) {
      const u = o.queryCandidates(c);
      for (const h of u) {
        if (c === h) continue;
        const f = i.includes(c) ? c : h,
          p = f === c ? h : c,
          g = f.id < p.id ? f.id * 100003 + p.id : p.id * 100003 + f.id;
        l.has(g) || (n && !n(f, p)) || (_c(f, p) && (l.add(g), a.push({ a: f, b: p })));
      }
    }
    return a;
  },
  Zr = (i) => {
    const e = Pl(i),
      t = fe.worldBounds,
      n = Ol(),
      s = {
        seed: i,
        rng: e,
        time: 0,
        arenaRadius: t,
        player: n,
        bullets: [],
        enemies: [],
        particles: [],
        impulses: [],
        events: [],
        items: [],
        boss: null,
        bossActiveWave: 0,
        bossDefeatedWaves: new Set(),
        spawnState: { timer: 0, wave: 1, budget: fe.spawn.waveBudgetGrowth, toSpawn: 0 },
        pendingBursts: [],
        pendingLightning: [],
        weaponEffects: [],
        trauma: 0,
        eventWobble: 0,
        gameOver: !1,
        nextId: 1
      },
      r = { score: rc(), spawn: cc(), shake: dc(i ^ 11256099) };
    return { world: s, systems: r };
  },
  fs = (i, e, t) => {
    const n = Si(t.kind),
      s = ac(e.score, t, i.player, i.time);
    ((e.score = s.sys), i.events.push(...s.events));
    i.player.energy = Math.min(fe.player.maxEnergy, i.player.energy + fe.player.energyPerKill);
    const r = t.kind === "singularity",
      shakeGain = { grunt: 0, wanderer: 0.05, dodger: 0.08, singularity: 0.62 }[t.kind] || 0;
    (ic(t.pos, r ? fe.particles.perBigKill : fe.particles.perKill, n, i),
      r &&
        i.impulses.push(
          Lo(t.pos.x, t.pos.z, fe.grid.impulseStrength * 2, {
            lifespan: 1.45,
            wavelength: 6.5,
            speed: 18,
            eventTier: "localBlast",
            coupleEntities: !0
          })
        ),
      shakeGain > 0 && (e.shake = pc(e.shake, shakeGain)),
      (i.trauma = e.shake.trauma),
      (e.spawn.killsThisWave += 1),
      (e.spawn = fc(e.spawn, e.spawn.killsThisWave)));
    if (i.rng.chance(fe.items.dropChance)) {
      i.items.push(makeItem(randomItemKind(i), { ...t.pos }, i));
    }
    if (t.kind === "singularity")
      for (const o of i.enemies) {
        if (o === t || o.dead) continue;
        Math.hypot(o.pos.x - t.pos.x, o.pos.z - t.pos.z) <
          fe.enemies.singularity.pullRadius * 1.2 &&
          Io(o, 3) &&
          fs(i, e, o);
      }
  },
  addWeaponArc = (world, kind, from, to, seed = 0) => {
    const isLightning = kind === "lightning",
      dx = to.x - from.x, dz = to.z - from.z, len = Math.hypot(dx, dz) || 1,
      segments = isLightning ? Math.max(8, Math.min(14, Math.ceil(len * 0.85))) : 1,
      forwardX = dx / len, forwardZ = dz / len,
      px = -forwardZ, pz = forwardX,
      boltLife = 0.24;
    let prev = { ...from };
    for (let step = 1; step <= segments; step++) {
      const t = step / segments,
        taper = Math.sin(Math.PI * t),
        broadKick = Math.sin((seed + step * 0.73) * 12.9898 + world.time * 31.7) * 0.9,
        sharpJitter = Math.sin((seed * 1.91 - step * 2.37) * 5.398 + world.time * 47.1) * 0.42,
        electricNoise = broadKick + sharpJitter,
        crossSign = step % 2 === 0 ? 1 : -1,
        edge = step === segments ? 0 : (crossSign * (0.82 + Math.abs(electricNoise) * 0.32) + electricNoise * 0.22) * taper,
        next = { x: from.x + dx * t + px * edge, z: from.z + dz * t + pz * edge };
      world.weaponEffects.push({ kind, style: isLightning ? "bolt" : "trail", from: prev, to: next, height: isLightning ? 0.72 : 0, life: isLightning ? boltLife : 0.12, maxLife: isLightning ? boltLife : 0.12 });
      if (isLightning && step < segments - 1 && step % 3 === 0) {
        const branchNoise = Math.sin((seed + step * 3.17) * 19.19),
          side = branchNoise < 0 ? -1 : 1,
          branchLength = 1.15 + Math.abs(branchNoise) * 1.35,
          branchMid = { x: next.x + forwardX * branchLength * 0.28 + px * side * branchLength * 0.42, z: next.z + forwardZ * branchLength * 0.28 + pz * side * branchLength * 0.42 },
          branchTip = { x: next.x + forwardX * branchLength * 0.48 + px * side * branchLength, z: next.z + forwardZ * branchLength * 0.48 + pz * side * branchLength };
        world.weaponEffects.push(
          { kind, style: "branch", from: { ...next }, to: branchMid, height: 0.68, life: 0.19, maxLife: 0.19 },
          { kind, style: "branch", from: branchMid, to: branchTip, height: 0.61, life: 0.16, maxLife: 0.16 }
        );
      }
      prev = next;
    }
    if (isLightning) {
      for (let ray = 0; ray < 5; ray++) {
        const angle = ray * Math.PI * 0.4 + seed * 0.31,
          radius = 0.72 + (ray % 2) * 0.38;
        world.weaponEffects.push({
          kind, style: "flash", from: { ...to },
          to: { x: to.x + Math.cos(angle) * radius, z: to.z + Math.sin(angle) * radius },
          height: 0.76, life: 0.13, maxLife: 0.13
        });
      }
    }
  },
  resolveLightning = (world, sys) => {
    for (const shot of world.pendingLightning) {
      const hit = new Set(),
        maxChains = 2 + shot.level;
      let from = { ...shot.pos };
      for (let chain = 0; chain < maxChains; chain++) {
        const targets = world.enemies.filter((target) => !target.dead && !hit.has(target.id));
        if (world.boss && !world.boss.dead && !hit.has(world.boss.id)) targets.push(world.boss);
        let target = null, best = (chain === 0 ? shot.range : 8 + shot.level) ** 2;
        for (const candidate of targets) {
          const dx = candidate.pos.x - from.x, dz = candidate.pos.z - from.z, d2 = dx * dx + dz * dz;
          if (chain === 0 && (dx * shot.dir.x + dz * shot.dir.z) / Math.max(0.001, Math.sqrt(d2)) < 0.1) continue;
          if (d2 < best) { best = d2; target = candidate; }
        }
        if (!target) {
          if (chain === 0) addWeaponArc(world, "lightning", from, { x: from.x + shot.dir.x * 8, z: from.z + shot.dir.z * 8 }, chain);
          break;
        }
        hit.add(target.id);
        addWeaponArc(world, "lightning", from, target.pos, chain + target.id);
        const damage = shot.damage * Math.max(0.55, 1 - chain * 0.12);
        if (target === world.boss) bossHit(target, damage * 0.8, world, sys);
        else if (Io(target, damage)) fs(world, sys, target);
        from = { ...target.pos };
      }
    }
    world.pendingLightning.length = 0;
  },
  detonateMissile = (world, sys, missile) => {
    if (missile.spent) return;
    missile.spent = !0;
    const radius = missile.blastRadius || 2.6;
    for (const target of world.enemies) {
      if (target.dead) continue;
      const distance = Math.hypot(target.pos.x - missile.pos.x, target.pos.z - missile.pos.z);
      if (distance <= radius + target.radius) {
        const damage = missile.damage * Math.max(0.35, 1 - distance / (radius + target.radius));
        if (Io(target, damage)) fs(world, sys, target);
      }
    }
    const boss = world.boss;
    if (boss && !boss.dead) {
      const distance = Math.hypot(boss.pos.x - missile.pos.x, boss.pos.z - missile.pos.z);
      if (distance <= radius + boss.radius) bossHit(boss, missile.damage * Math.max(0.3, 1 - distance / (radius + boss.radius)), world, sys);
    }
    world.pendingBursts.push({ pos: { ...missile.pos }, remaining: 34, color: WEAPON_COLORS.missile, perFrame: 34 });
    world.events.push({ type: "missile-explode", pos: { ...missile.pos }, radius });
    for (let ray = 0; ray < 8; ray++) {
      const angle = ray / 8 * Math.PI * 2;
      addWeaponArc(world, "missile", missile.pos, { x: missile.pos.x + Math.cos(angle) * radius, z: missile.pos.z + Math.sin(angle) * radius }, ray);
    }
  },
  xc = (i, e, t, n) => {
    if (((i.events = []), i.gameOver))
      return (
        Jr(i, n),
        (i.eventWobble = Math.max(0, (i.eventWobble || 0) - n * fe.camera.eventWobbleDecay)),
        i.events
      );
    (
      (i.time += n),
      Bl(i.player, t, n, i),
      zl(i.player, t.firing) && kl(i.player, i),
      t.skill &&
        i.player.alive &&
        i.player.energy >= fe.player.skillCost &&
        ((i.player.energy -= fe.player.skillCost),
        fireSkill(i, e),
        i.events.push({ type: "skill-fire", pos: { ...i.player.pos } }))
    );
    const s = hc(i, e.spawn, n);
    ((e.spawn = s.sys), i.events.push(...s.events));
    // Boss spawn / step (timer-driven gauge)
    {
      if (!i.boss) {
        e.spawn.bossTimer = Math.max(0, e.spawn.bossTimer - n);
        if (e.spawn.bossTimer <= 0) {
          const bossNumber = (e.spawn.bossIndex || 0) + 1,
            bt = (e.spawn.bossIndex % 3 === 2) ? "big" : "mini";
          i.boss = makeBoss(bt, i, bossNumber);
          i.bossActiveWave = e.spawn.wave;
          e.spawn.bossTimer = fe.boss.interval;
          i.events.push({ type: "boss-spawn", pos: { ...i.boss.pos }, bossType: bt, bossNumber, rageLevel: i.boss.rageLevel });
        }
      }
      if (i.boss && !i.boss.dead) stepBoss(i, e, n);
    }
    const r = i.bullets.filter((l) => l.owner === "player" && !l.spent);
    for (const l of i.enemies) {
      if (l.dead) continue;
      l.hitFlash = Math.max(0, (l.hitFlash || 0) - n);
      Ql({ enemy: l, player: i.player, bullets: r, world: i, dt: n });
      const c = i.arenaRadius - l.radius,
        u = Math.hypot(l.pos.x, l.pos.z);
      if (u > c) {
        const h = c / u;
        ((l.pos.x *= h), (l.pos.z *= h));
      }
      l.kind === "singularity" &&
        l.behaviorTimer >= fe.enemies.singularity.explodeTime &&
        ((l.dead = !0),
        Math.hypot(i.player.pos.x - l.pos.x, i.player.pos.z - l.pos.z) <
          fe.enemies.singularity.pullRadius && qr(i.player, 25, i),
        fs(i, e, l));
    }
    for (const l of i.bullets) Wl(l, n, i);
    resolveLightning(i, e);
    for (const missile of i.bullets)
      if (missile.kind === "missile" && missile.owner === "player" && !missile.spent && missile.life <= 0) detonateMissile(i, e, missile);
    const o = i.bullets.filter((l) => l.owner === "player" && !l.spent && l.life > 0),
      a = Kr(o, i.enemies, 4, (l, c) => l.tag === "bullet" && c.tag === "enemy");
    for (const { a: l, b: c } of a) {
      const u = l.tag === "bullet" ? l : c,
        h = l.tag === "enemy" ? l : c;
      if (u.spent || h.dead || u.hitIds.includes(h.id)) continue;
      u.hitIds.push(h.id);
      if (u.kind === "missile") detonateMissile(i, e, u);
      else {
        if (!u.pierce) u.spent = !0;
        if (Io(h, u.damage)) fs(i, e, h);
      }
    }
    // player bullets vs boss
    if (i.boss && !i.boss.dead) {
      const boss = i.boss;
      for (const b of i.bullets) {
        if (b.owner !== "player" || b.spent || b.life <= 0 || b.hitIds.includes(boss.id)) continue;
        if (boss.dead) break;
        if (Math.hypot(b.pos.x - boss.pos.x, b.pos.z - boss.pos.z) <= b.radius + boss.radius) {
          b.hitIds.push(boss.id);
          if (b.kind === "missile") detonateMissile(i, e, b);
          else {
            if (!b.pierce) b.spent = !0;
            bossHit(boss, b.damage, i, e);
          }
        }
      }
    }
    // boss bullets vs player
    if (i.player.alive) {
      for (const b of i.bullets) {
        if (b.owner === "player" || b.spent || b.life <= 0) continue;
        if (Math.hypot(b.pos.x - i.player.pos.x, b.pos.z - i.player.pos.z) <= b.radius + i.player.radius) {
          b.spent = !0;
          qr(i.player, b.damage, i);
        }
      }
    }
    if (i.player.alive) {
      const l = Kr([i.player], i.enemies, 4, (c, u) => (c.tag === "enemy" ? c : u).tag === "enemy");
      for (const { a: c, b: u } of l) {
        const h = c.tag === "enemy" ? c : u;
        h.dead ||
          (qr(i.player, h.kind === "singularity" ? 30 : 15, i),
          h.kind !== "singularity" && ((h.dead = !0), fs(i, e, h)));
      }
      // player body vs boss
      if (i.boss && !i.boss.dead) {
        if (
          Math.hypot(i.boss.pos.x - i.player.pos.x, i.boss.pos.z - i.player.pos.z) <=
          i.boss.radius + i.player.radius
        )
          qr(i.player, 22, i);
      }
    }
    stepItems(i, n);
    return (
      i.events.some((l) => l.type === "hit-player" && i.player.alive) &&
        ((e.score = lc(e.score)), (i.player.multiplier = 1)),
      Jr(i, n),
      (e.score = oc(e.score, n)),
      (e.shake = mc(e.shake, n)),
      (i.trauma = e.shake.trauma),
      (i.eventWobble = Math.max(0, (i.eventWobble || 0) - n * fe.camera.eventWobbleDecay)),
      i.events
    );
  },
  Jr = (i, e) => {
    for (const t of i.particles) sc(t, e);
    if (i.pendingBursts.length) {
      const kept = [];
      // Global per-frame spawn budget across ALL bursts. Prevents a single
      // frame from spawning 150+ bright additive particles when several bursts
      // overlap (boss death + multi-pickup + NOVA) -> bloom/GPU stall.
      let budget = 150;
      for (const br of i.pendingBursts) {
        const n = Math.min(br.perFrame, br.remaining, budget);
        if (n > 0) {
          ic(br.pos, n, br.color, i);
          br.remaining -= n;
          budget -= n;
        }
        if (br.remaining > 0) kept.push(br);
      }
      i.pendingBursts = kept;
    }
    for (const effect of i.weaponEffects) effect.life -= e;
    ((i.weaponEffects = i.weaponEffects.filter((effect) => effect.life > 0)),
      (i.particles = i.particles.filter((t) => t.life > 0)),
      (i.bullets = i.bullets.filter((t) => Xl(t, i.arenaRadius))),
      (i.enemies = i.enemies.filter((t) => !t.dead)),
      (i.impulses = Ul(i.impulses, e)));
  };

