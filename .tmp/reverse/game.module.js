import * as THREE from "three";

// Extracted game code. Bundled Three.js aliases are intentionally unresolved at this phase.

(function () {
  const e = document.createElement("link").relList;
  if (e && e.supports && e.supports("modulepreload")) return;
  for (const s of document.querySelectorAll('link[rel="modulepreload"]')) n(s);
  new MutationObserver((s) => {
    for (const r of s)
      if (r.type === "childList")
        for (const o of r.addedNodes) o.tagName === "LINK" && o.rel === "modulepreload" && n(o);
  }).observe(document, { childList: !0, subtree: !0 });
  function t(s) {
    const r = {};
    return (
      s.integrity && (r.integrity = s.integrity),
      s.referrerPolicy && (r.referrerPolicy = s.referrerPolicy),
      s.crossOrigin === "use-credentials"
        ? (r.credentials = "include")
        : s.crossOrigin === "anonymous"
          ? (r.credentials = "omit")
          : (r.credentials = "same-origin"),
      r
    );
  }
  function n(s) {
    if (s.ep) return;
    s.ep = !0;
    const r = t(s);
    fetch(s.href, r);
  }
})();
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


class mg {
  constructor() {
    this.seg = 48;
    const e = [],
      t = (r, o, a, l) => {
        const c = Ro(r, o),
          u = Ro(a, l);
        e.push(c.x, c.y, c.z, u.x, u.y, u.z);
      },
      n = this.seg;
    for (let r = 0; r <= n; r++) {
      const o = (r / n) * 2 - 1;
      for (let a = 0; a < n; a++) {
        const l = (a / n) * 2 - 1,
          c = ((a + 1) / n) * 2 - 1;
        t(o, l, o, c);
      }
    }
    for (let r = 0; r <= n; r++) {
      const o = (r / n) * 2 - 1;
      for (let a = 0; a < n; a++) {
        const l = (a / n) * 2 - 1,
          c = ((a + 1) / n) * 2 - 1;
        t(l, o, c, o);
      }
    }
    ((this.positions = new Float32Array(e)), (this.basePositions = new Float32Array(e)));
    // Precompute constant per-vertex world (x,z) sample coords for Uo. These
    // depend only on basePositions (fixed sphere geometry); recomputing
    // acos/atan2/cos/sin per vertex every frame was pure waste and a big
    // chunk of the per-frame grid cost. (OMM-009 grid O(verts*impulses))
    {
      const bp = this.basePositions, c = Pn.radius, vc = bp.length / 3;
      ((this.vertWX = new Float32Array(vc)), (this.vertWZ = new Float32Array(vc)));
      for (let r = 0, i = 0; r < bp.length; r += 3, i++) {
        const o = bp[r], a = bp[r + 1], l = bp[r + 2];
        const h = Math.acos(Math.max(-1, Math.min(1, a / c))) / Pn.capHalfAngle,
          f = Math.atan2(l, o);
        ((this.vertWX[i] = Math.cos(f) * h * fe.worldBounds),
          (this.vertWZ[i] = Math.sin(f) * h * fe.worldBounds));
      }
    }
    const s = new Rt();
    (s.setAttribute("position", new Nt(this.positions, 3)),
      (this.material = new ml({
        color: Xt.gridGlow,
        transparent: !0,
        opacity: 0.55,
        blending: ii
      })),
      (this.mesh = new Wm(s, this.material)));
  }
  update(e) {
    const t = this.positions,
      n = this.basePositions,
      wx = this.vertWX,
      wz = this.vertWZ,
      c = Pn.radius,
      y = 1 / c,
      s = Math.min(1.6, Il(e));
    for (let r = 0, i = 0; r < t.length; r += 3, i++) {
      const o = n[r],
        a = n[r + 1],
        l = n[r + 2],
        d = Uo(e, wx[i], wz[i]);
      ((t[r] = o + o * y * d), (t[r + 1] = a + a * y * d), (t[r + 2] = l + l * y * d));
    }
    // The renderer's shared world group owns the rigid event transform. This
    // mesh only applies local ripple deformation, avoiding transform drift.
    ((this.mesh.geometry.getAttribute("position").needsUpdate = !0),
      (this.material.opacity = 0.45 + s * 0.4),
      this.material.color.setHex(s > 0.01 ? Xt.gridGlow : Xt.grid));
  }
}
const Ro = (i, e) => {
  const t = Math.hypot(i, e);
  t > 1 && ((i /= t), (e /= t));
  const n = Li(i, e, Pn);
  return new R(n.x, n.y, n.z);
};
class gg {
  constructor(e = fe.particles.maxParticles) {
    ((this.dummy = new mt()), (this.color = new Ve()), (this.impulses = []), (this.max = e));
    const t = new fi(1, 1, 1),
      n = new Ii({ vertexColors: !1, transparent: !0, opacity: 1, blending: ii, depthWrite: !1 });
    ((this.mesh = new $n(t, n, e)),
      this.mesh.instanceMatrix.setUsage(Mr),
      (this.mesh.frustumCulled = !1),
      (this.mesh.count = 0),
      (this.mesh.instanceColor = new Tr(new Float32Array(e * 3), 3)));
  }
  setImpulses(e) {
    this.impulses = e;
  }
  update(e) {
    const t = Math.min(this.max, e.length),
      wb = fe.worldBounds;
    for (let s = 0; s < t; s++) {
      const r = e[s];
      // Particle sparks render at their sphere-surface base position + own
      // vertical offset only. Do NOT sample every live impulse here: that made
      // the renderer O(particles x impulses) per frame, so a boss-death +
      // multi-pickup spike (1000+ particles x 100+ impulses) stalled the tab.
      const sp = Li(r.pos.x / wb, r.pos.z / wb, Pn);
      this.dummy.position.set(sp.x, sp.y + r.pos.y, sp.z);
      const o = Math.max(0, Math.min(1, r.life / r.lifespan)),
        a = r.size * (0.4 + o * 1.35);
      (this.dummy.scale.set(a, a, a),
        this.dummy.rotation.set(r.life * 3.2, r.life * 2.1, r.life * 1.4),
        this.dummy.updateMatrix(),
        this.mesh.setMatrixAt(s, this.dummy.matrix),
        this.color.setHex(r.color));
      (this.color.multiplyScalar(0.5 + o * 1.6), this.mesh.setColorAt(s, this.color));
    }
    ((this.mesh.count = t),
      (this.mesh.instanceMatrix.needsUpdate = !0),
      this.mesh.instanceColor && (this.mesh.instanceColor.needsUpdate = !0));
  }
}
const ITEM_LABELS = Object.freeze({
    heal: "HEAL",
    boost: "BOOST",
    weapon: "WEAPON",
    life: "HEART",
    shield: "SHIELD",
    multiplier: "MULTIPLIER"
  }),
  Zn = (i) => new Ii({ color: i, blending: ii, depthWrite: !1 });
class _g {
  constructor() {
    ((this.dummy = new mt()), (this.impulses = []), (this.group = new yi()));
    const e = new ys(0.7, 0);
    (e.scale(0.6, 0.5, 1.4),
      (this.playerMesh = new It(e, Zn(Xt.player))),
      this.group.add(this.playerMesh),
      (this.enemyGeo = {
        grunt: new zr(0.8, 0),
        wanderer: new ys(0.9, 0),
        singularity: new Br(1.4, 0),
        dodger: new Or(0.6, 1.4, 6)
      }),
      (this.enemyMats = {
        grunt: Zn(Si("grunt")),
        wanderer: Zn(Si("wanderer")),
        singularity: Zn(Si("singularity")),
        dodger: Zn(Si("dodger"))
      }));
    const t = 80;
    this.enemyInst = {
      grunt: new $n(this.enemyGeo.grunt, this.enemyMats.grunt, t),
      wanderer: new $n(this.enemyGeo.wanderer, this.enemyMats.wanderer, t),
      singularity: new $n(this.enemyGeo.singularity, this.enemyMats.singularity, 30),
      dodger: new $n(this.enemyGeo.dodger, this.enemyMats.dodger, t)
    };
    for (const n of Object.keys(this.enemyInst))
      (this.enemyInst[n].instanceMatrix.setUsage(Mr),
        (this.enemyInst[n].frustumCulled = !1),
        (this.enemyInst[n].count = 0),
        this.group.add(this.enemyInst[n]));
    ((this.bulletGeo = new Nr(0.18, 0.7, 4, 6)),
      this.bulletGeo.rotateX(Math.PI / 2),
      (this.bulletMat = Zn(16777215)),
      (this.bulletInst = new $n(this.bulletGeo, this.bulletMat, 512)),
      this.bulletInst.instanceMatrix.setUsage(Mr),
      (this.bulletInst.frustumCulled = !1),
      (this.bulletInst.count = 0),
      this.group.add(this.bulletInst));
    ((this.enemyBulletGeo = new Nr(0.24, 0.6, 5, 6)),
      this.enemyBulletGeo.rotateX(Math.PI / 2),
      (this.enemyBulletMat = Zn(0xff243f)),
      (this.enemyBulletInst = new $n(this.enemyBulletGeo, this.enemyBulletMat, 512)),
      this.enemyBulletInst.instanceMatrix.setUsage(Mr),
      (this.enemyBulletInst.frustumCulled = !1),
      (this.enemyBulletInst.count = 0),
      this.group.add(this.enemyBulletInst),
      (this.enemyBulletTrailMat = new Ii({ color: 0xff6a24, blending: ii, depthWrite: !1, transparent: !0, opacity: 0.28 })),
      (this.enemyBulletTrailInst = new $n(this.enemyBulletGeo, this.enemyBulletTrailMat, 512)),
      this.enemyBulletTrailInst.instanceMatrix.setUsage(Mr),
      (this.enemyBulletTrailInst.frustumCulled = !1),
      (this.enemyBulletTrailInst.count = 0),
      this.group.add(this.enemyBulletTrailInst));
    ((this.weaponFxGeo = new Nr(0.055, 0.055, 1, 6)),
      (this.weaponFxMat = new Ii({ color: 0xffffff, blending: ii, depthWrite: !1, transparent: !0, opacity: 0.88 })),
      (this.weaponFxInst = new $n(this.weaponFxGeo, this.weaponFxMat, 1024)),
      this.weaponFxInst.instanceMatrix.setUsage(Mr),
      (this.weaponFxInst.frustumCulled = !1),
      (this.weaponFxInst.count = 0),
      this.group.add(this.weaponFxInst));
    ((this.itemGeo = new ys(0.5, 0)),
      (this.itemInst = new $n(this.itemGeo, Zn(16777215), 128)),
      this.itemInst.instanceMatrix.setUsage(Mr),
      (this.itemInst.frustumCulled = !1),
      (this.itemInst.count = 0),
      this.group.add(this.itemInst),
      (this.itemRingGeo = new Nr(0.72, 0.72, 0.08, 16, 1, !0)),
      (this.itemRingMat = new Ii({ color: 16777215, wireframe: !0, blending: ii, depthWrite: !1, transparent: !0, opacity: 0.72 })),
      (this.itemRingInst = new $n(this.itemRingGeo, this.itemRingMat, 128)),
      this.itemRingInst.instanceMatrix.setUsage(Mr),
      (this.itemRingInst.frustumCulled = !1),
      (this.itemRingInst.count = 0),
      this.group.add(this.itemRingInst));
    ((this.bossGeo = {
      armor: new zr(1, 0),
      joint: new Br(1, 0),
      head: new ys(1, 0)
    }),
      (this.bossArmorMat = new Ii({
        color: 16777215,
        blending: ii,
        depthWrite: !1,
        transparent: !0,
        opacity: 1
      })),
      (this.bossJointMat = new Ii({
        color: 0x35134d,
        blending: ii,
        depthWrite: !1,
        transparent: !0,
        opacity: 0.82
      })),
      (this.bossCoreMat = new Ii({
        color: 0xfff1a8,
        blending: ii,
        depthWrite: !1,
        transparent: !0,
        opacity: 1
      })),
      (this.bossGroup = new yi()),
      (this.bossGroup.visible = !1),
      this.group.add(this.bossGroup));
    const addBossPart = (name, geometry, material, position, scale, scatter) => {
      const mesh = new It(geometry, material);
      mesh.name = `golem-${name}`;
      mesh.position.set(position[0], position[1], position[2]);
      mesh.scale.set(scale[0], scale[1], scale[2]);
      mesh.userData.basePosition = position;
      mesh.userData.baseScale = scale;
      mesh.userData.scatter = scatter;
      this.bossGroup.add(mesh);
      return mesh;
    };
    this.bossParts = {
      torso: addBossPart("torso", this.bossGeo.armor, this.bossArmorMat, [0, 1.25, 0], [0.86, 1.18, 0.72], [0.2, 2.6, -1.2]),
      core: addBossPart("core", this.bossGeo.joint, this.bossCoreMat, [0, 1.28, 0.72], [0.42, 0.42, 0.42], [0, 1.4, 3.4]),
      head: addBossPart("head", this.bossGeo.head, this.bossArmorMat, [0, 2.58, 0], [0.58, 0.62, 0.58], [-0.3, 3.2, 0.8]),
      eye: addBossPart("eye", this.bossGeo.joint, this.bossCoreMat, [0, 2.66, 0.55], [0.19, 0.12, 0.15], [0.2, 2.1, 3.8]),
      shoulderL: addBossPart("shoulder-l", this.bossGeo.armor, this.bossArmorMat, [-1.08, 1.82, 0], [0.64, 0.56, 0.68], [-4, 2.2, -0.6]),
      shoulderR: addBossPart("shoulder-r", this.bossGeo.armor, this.bossArmorMat, [1.08, 1.82, 0], [0.64, 0.56, 0.68], [4, 2.5, -0.4]),
      armL: addBossPart("arm-l", this.bossGeo.joint, this.bossJointMat, [-1.38, 1.02, 0], [0.38, 0.72, 0.38], [-4.8, 0.5, 0.5]),
      armR: addBossPart("arm-r", this.bossGeo.joint, this.bossJointMat, [1.38, 1.02, 0], [0.38, 0.72, 0.38], [4.7, 0.8, 0.8]),
      fistL: addBossPart("fist-l", this.bossGeo.armor, this.bossArmorMat, [-1.45, 0.22, 0.06], [0.58, 0.52, 0.62], [-5.4, -1.2, 1.4]),
      fistR: addBossPart("fist-r", this.bossGeo.armor, this.bossArmorMat, [1.45, 0.22, 0.06], [0.58, 0.52, 0.62], [5.2, -0.8, 1.7]),
      crownL: addBossPart("crown-l", this.bossGeo.armor, this.bossArmorMat, [-0.38, 3.12, -0.05], [0.18, 0.58, 0.18], [-1.8, 4.6, -0.8]),
      crownR: addBossPart("crown-r", this.bossGeo.armor, this.bossArmorMat, [0.38, 3.12, -0.05], [0.18, 0.58, 0.18], [2.1, 4.3, -0.5]),
      shardL: addBossPart("shard-l", this.bossGeo.armor, this.bossArmorMat, [-1.66, 1.56, -0.18], [0.22, 0.48, 0.22], [-5.8, 3.8, -2]),
      shardR: addBossPart("shard-r", this.bossGeo.armor, this.bossArmorMat, [1.66, 1.56, -0.18], [0.22, 0.48, 0.22], [5.9, 3.4, -1.7])
    };
    this.bossPartList = Object.values(this.bossParts);
    ((this._col = new Ve()), (this.lastBossVisual = null));
  }
  setImpulses(e) {
    this.impulses = e;
  }
  update(e, t, n, s, items, boss, eventWobble = 0, weaponEffects = []) {
    const r = new R(),
      o = new R(),
      a = new R(),
      l = new R(),
      eventAmount = Math.max(0, Math.min(1, eventWobble));
    (hr(e.pos.x, e.pos.z, this.impulses, r, o, a, l),
      this.playerMesh.position.copy(r));
    const c = new R();
    (ws(e.pos.x + e.aim.x, e.pos.z + e.aim.z, this.impulses, c), o.subVectors(c, r).normalize());
    const u = new Je();
    (u.lookAt(new R(), o, l),
      this.playerMesh.quaternion.setFromRotationMatrix(u),
      this.playerMesh.material.color.setHex(e.invuln > 0 ? 16777215 : Xt.player));
    const f = { grunt: 0, wanderer: 0, singularity: 0, dodger: 0 };
    for (const g of t) {
      const _ = f[g.kind]++;
      (hr(g.pos.x, g.pos.z, this.impulses, r, o, a, l), this.dummy.position.copy(r));
      const m = g.kind === "singularity" && g.critical ? 1 + Math.sin(s * 20) * 0.2 : 1,
        hitPulse = g.hitFlash > 0 ? 1 + Math.sin((g.hitFlash / 0.14) * Math.PI) * 0.16 : 1;
      (this.dummy.scale.setScalar(m * hitPulse),
        this.dummy.rotation.set(s * 1.5, s * 1.2, 0),
        this.dummy.updateMatrix(),
        this.enemyInst[g.kind].setMatrixAt(_, this.dummy.matrix),
        this._col.setHex(g.hitFlash > 0 ? 0xff8a33 : Si(g.kind)),
        this.enemyInst[g.kind].setColorAt(_, this._col));
    }
    for (const g of Object.keys(this.enemyInst))
      ((this.enemyInst[g].count = f[g]),
        (this.enemyInst[g].instanceMatrix.needsUpdate = !0),
        this.enemyInst[g].instanceColor && (this.enemyInst[g].instanceColor.needsUpdate = !0));
    let p = 0;
    for (const g of n) {
      if (g.owner !== "player" || g.spent) continue;
      (hr(g.pos.x, g.pos.z, this.impulses, r, o, a, l), this.dummy.position.copy(r));
      const _ = new R(g.vel.x, 0, g.vel.z),
        m = new Je();
      (m.lookAt(new R(), _.clone().normalize(), l),
        this.dummy.quaternion.setFromRotationMatrix(m),
        this.dummy.scale.set(
          g.kind === "missile" ? 1.45 : g.kind === "spread" ? 0.72 : 1,
          g.kind === "missile" ? 1.25 : 1,
          g.kind === "laser" ? 3.2 : g.kind === "missile" ? 1.8 : 1
        ),
        this.dummy.updateMatrix(),
        this.bulletInst.setMatrixAt(p, this.dummy.matrix),
        this._col.setHex(ec(g.kind)),
        this.bulletInst.setColorAt(p, this._col),
        p++);
    }
    for (let q = p; q < this.bulletInst.count; q++) {
      this.dummy.position.set(0, -9999, 0);
      this.dummy.scale.set(0, 0, 0);
      this.dummy.updateMatrix();
      this.bulletInst.setMatrixAt(q, this.dummy.matrix);
    }
    ((this.bulletInst.count = Math.max(this.bulletInst.count, p)),
      (this.bulletInst.instanceMatrix.needsUpdate = !0),
      this.bulletInst.instanceColor && (this.bulletInst.instanceColor.needsUpdate = !0));
    // Pooled line-like segments. Lightning is rendered as concentric additive
    // tubes (blue corona + cyan body + white-hot core) above the arena surface.
    let wp = 0;
    const fxA = new R(), fxB = new R(), fxDir = new R(), fxUp = new R(0, 1, 0),
      drawWeaponSegment = (from, to, color, width, fade = 1, height = 0) => {
        if (wp >= 1024) return;
        hr(from.x, from.z, this.impulses, fxA, o, a, l);
        hr(to.x, to.z, this.impulses, fxB, o, a, l);
        fxA.y += height;
        fxB.y += height;
        fxDir.subVectors(fxB, fxA);
        const length = fxDir.length();
        if (length < 0.001) return;
        this.dummy.position.copy(fxA).add(fxB).multiplyScalar(0.5);
        this.dummy.quaternion.setFromUnitVectors(fxUp, fxDir.normalize());
        this.dummy.scale.set(width, length, width);
        this.dummy.updateMatrix();
        this.weaponFxInst.setMatrixAt(wp, this.dummy.matrix);
        this._col.setHex(color).multiplyScalar(Math.max(0.12, fade));
        this.weaponFxInst.setColorAt(wp++, this._col);
      };
    for (const bullet of n) {
      if (bullet.owner !== "player" || bullet.spent || bullet.kind !== "missile" || !bullet.prevPos) continue;
      const tail = { x: bullet.prevPos.x - bullet.vel.x * 0.018, z: bullet.prevPos.z - bullet.vel.z * 0.018 };
      drawWeaponSegment(tail, bullet.pos, WEAPON_COLORS.missile, 1.5, 0.88);
    }
    for (const effect of weaponEffects || []) {
      const fade = effect.life / Math.max(0.001, effect.maxLife || effect.life);
      if (effect.kind === "lightning") {
        const style = effect.style || "bolt",
          height = effect.height ?? 0.72,
          haloWidth = style === "bolt" ? 5.6 : style === "branch" ? 3.35 : 4.3,
          bodyWidth = style === "bolt" ? 3.1 : style === "branch" ? 1.85 : 2.45,
          coreWidth = style === "bolt" ? 1.22 : style === "branch" ? 0.72 : 1.02,
          flashBoost = style === "flash" ? 1 : fade;
        drawWeaponSegment(effect.from, effect.to, 0x246bff, haloWidth, fade * 0.5, height);
        drawWeaponSegment(effect.from, effect.to, 0x69dcff, bodyWidth, Math.max(0.42, fade), height + 0.018);
        drawWeaponSegment(effect.from, effect.to, 0xffffff, coreWidth, Math.max(0.72, flashBoost), height + 0.036);
      } else {
        const color = effect.kind === "laser" ? WEAPON_COLORS.laser : WEAPON_COLORS.missile,
          width = effect.kind === "laser" ? 1.25 : 1.05;
        drawWeaponSegment(effect.from, effect.to, color, width, fade);
      }
    }
    for (let q = wp; q < this.weaponFxInst.count; q++) {
      this.dummy.position.set(0, -9999, 0);
      this.dummy.scale.set(0, 0, 0);
      this.dummy.updateMatrix();
      this.weaponFxInst.setMatrixAt(q, this.dummy.matrix);
    }
    ((this.weaponFxInst.count = Math.max(this.weaponFxInst.count, wp)),
      (this.weaponFxInst.instanceMatrix.needsUpdate = !0),
      this.weaponFxInst.instanceColor && (this.weaponFxInst.instanceColor.needsUpdate = !0));
    // enemy / boss bullets
    let ep = 0;
    for (const g of n) {
      if (g.owner === "player" || g.spent || g.life <= 0) continue;
      (hr(g.pos.x, g.pos.z, this.impulses, r, o, a, l), this.dummy.position.copy(r));
      const _ = new R(g.vel.x, 0, g.vel.z),
        m = new Je();
      (m.lookAt(new R(), _.clone().normalize(), l),
        this.dummy.quaternion.setFromRotationMatrix(m),
        this.dummy.scale.set(0.72, 0.72, 1.15),
        this.dummy.updateMatrix(),
        this.enemyBulletInst.setMatrixAt(ep, this.dummy.matrix),
        this.dummy.scale.set(1.35, 1.35, 1.75),
        this.dummy.updateMatrix(),
        this.enemyBulletTrailInst.setMatrixAt(ep++, this.dummy.matrix));
    }
    for (let q = ep; q < this.enemyBulletInst.count; q++) {
      this.dummy.position.set(0, -9999, 0);
      this.dummy.scale.set(0, 0, 0);
      this.dummy.updateMatrix();
      this.enemyBulletInst.setMatrixAt(q, this.dummy.matrix);
      this.enemyBulletTrailInst.setMatrixAt(q, this.dummy.matrix);
    }
    ((this.enemyBulletInst.count = Math.max(this.enemyBulletInst.count, ep)),
      (this.enemyBulletTrailInst.count = Math.max(this.enemyBulletTrailInst.count, ep)),
      (this.enemyBulletInst.instanceMatrix.needsUpdate = !0),
      (this.enemyBulletTrailInst.instanceMatrix.needsUpdate = !0));
    // items
    let ip = 0;
    for (const g of items || []) {
      const yy = Math.sin(g.bob) * 0.4 + 0.6;
      (hr(g.pos.x, g.pos.z, this.impulses, r, o, a, l), this.dummy.position.set(r.x, r.y + 0.5 + yy * 0.4, r.z),
        this.dummy.rotation.set(s * 1.5 + g.bob, s * 1.1, 0),
        this.dummy.scale.setScalar(0.7 + yy * 0.25),
        this.dummy.updateMatrix(),
        this.itemInst.setMatrixAt(ip, this.dummy.matrix),
        this._col.setHex(g.color),
        this.itemInst.setColorAt(ip, this._col),
        this.dummy.rotation.set(Math.PI / 2, s * 1.6 + g.bob, 0),
        this.dummy.scale.setScalar(0.95 + yy * 0.18),
        this.dummy.updateMatrix(),
        this.itemRingInst.setMatrixAt(ip, this.dummy.matrix),
        this.itemRingInst.setColorAt(ip++, this._col));
    }
    for (let q = ip; q < this.itemInst.count; q++) {
      this.dummy.position.set(0, -9999, 0);
      this.dummy.scale.set(0, 0, 0);
      this.dummy.updateMatrix();
      this.itemInst.setMatrixAt(q, this.dummy.matrix);
      this.itemRingInst.setMatrixAt(q, this.dummy.matrix);
    }
    ((this.itemInst.count = Math.max(this.itemInst.count, ip)),
      (this.itemRingInst.count = Math.max(this.itemRingInst.count, ip)),
      (this.itemInst.instanceMatrix.needsUpdate = !0),
      (this.itemRingInst.instanceMatrix.needsUpdate = !0),
      this.itemInst.instanceColor && (this.itemInst.instanceColor.needsUpdate = !0),
      this.itemRingInst.instanceColor && (this.itemRingInst.instanceColor.needsUpdate = !0));
    // boss: cache a render-only snapshot so a defeated boss can wobble/fade
    // with the death event after simulation safely clears world.boss.
    if (boss && !boss.dead)
      this.lastBossVisual = {
        pos: { x: boss.pos.x, z: boss.pos.z },
        radius: boss.radius,
        color: boss.color,
        bossType: boss.bossType,
        phase: boss.phase,
        hp: boss.hp,
        maxHp: boss.maxHp,
        fireCooldown: boss.fireCooldown,
        fireInterval: boss.fireInterval,
        hitFlash: boss.hitFlash || 0,
        rageLevel: boss.rageLevel || 0
      };
    const renderBoss = boss && !boss.dead ? boss : eventAmount > 0 ? this.lastBossVisual : null,
      bossDeathEcho = renderBoss && renderBoss !== boss;
    if (renderBoss) {
      const hpRatio = Math.max(0, Math.min(1, renderBoss.hp / Math.max(1, renderBoss.maxHp))),
        armorOpen = (1 - hpRatio) * (renderBoss.bossType === "big" ? 0.58 : 0.42),
        phase = renderBoss.phase ?? s,
        stride = Math.sin(phase * 3.4),
        heavyBob = Math.abs(Math.sin(phase * 1.7)) * 0.08,
        charge = bossDeathEcho
          ? 0
          : 1 - Math.max(0, Math.min(1, renderBoss.fireCooldown / Math.max(0.01, renderBoss.fireInterval))),
        deathProgress = bossDeathEcho ? 1 - eventAmount : 0,
        echoScale = bossDeathEcho ? 0.92 + eventAmount * 0.08 : 1,
        // Keep the mega boss imposing without filling the screen: its linear
        // scale is cbrt(2) times the mini, which reads as roughly twice the mass.
        size = fe.boss.mini.radius * 0.55 * (renderBoss.bossType === "big" ? Math.cbrt(2) : 1),
        p = this.bossParts;
      (this.bossGroup.visible = !0,
        hr(renderBoss.pos.x, renderBoss.pos.z, this.impulses, r, o, a, l),
        this.bossGroup.position.copy(r),
        this.bossGroup.rotation.set(stride * 0.035, phase * 0.16, -stride * 0.045),
        this.bossGroup.scale.setScalar(size * echoScale * (1 + Math.sin(phase * 4) * 0.018)));
      // Death breakup temporarily multiplies every part's scale. Restore the
      // immutable authored transforms first so that effect cannot accumulate
      // across frames or leak into the next boss that reuses this hierarchy.
      for (const part of this.bossPartList) {
        part.position.set(...part.userData.basePosition);
        part.rotation.set(0, 0, 0);
        part.scale.set(...part.userData.baseScale);
      }
      p.torso.position.set(0, 1.25 + heavyBob, -armorOpen * 0.08);
      p.torso.scale.set(0.86 + armorOpen * 0.08, 1.18, 0.72 + armorOpen * 0.12);
      p.torso.rotation.set(stride * 0.04, phase * 0.22, -stride * 0.06);
      p.core.position.set(0, 1.28 + heavyBob, 0.72 + armorOpen * 0.46);
      p.core.scale.setScalar(0.42 * (1 + charge * 0.5 + (1 - hpRatio) * 0.22));
      p.core.rotation.set(phase * 1.8, -phase * 2.2, phase * 1.4);
      p.head.position.set(0, 2.58 + heavyBob * 0.6, armorOpen * 0.08);
      p.head.rotation.set(stride * 0.06, -phase * 0.13, 0);
      p.eye.position.set(0, 2.66 + heavyBob * 0.6, 0.55 + armorOpen * 0.18);
      p.eye.scale.set(0.19 + charge * 0.09, 0.12 + charge * 0.05, 0.15 + charge * 0.08);
      p.shoulderL.position.set(-1.08 - armorOpen * 0.5, 1.82 + stride * 0.08, 0);
      p.shoulderR.position.set(1.08 + armorOpen * 0.5, 1.82 - stride * 0.08, 0);
      p.shoulderL.rotation.set(phase * 0.18, phase * 0.7, stride * 0.12);
      p.shoulderR.rotation.set(-phase * 0.18, -phase * 0.7, -stride * 0.12);
      p.armL.position.set(-1.38 + charge * 0.28, 1.02 + charge * 0.35 - stride * 0.12, charge * 0.22);
      p.armR.position.set(1.38 - charge * 0.28, 1.02 + charge * 0.35 + stride * 0.12, charge * 0.22);
      p.armL.rotation.set(stride * 0.2, 0, -charge * 0.35);
      p.armR.rotation.set(-stride * 0.2, 0, charge * 0.35);
      p.fistL.position.set(-1.45 + charge * 0.62, 0.22 + charge * 1.02 - stride * 0.16, 0.06 + charge * 0.48);
      p.fistR.position.set(1.45 - charge * 0.62, 0.22 + charge * 1.02 + stride * 0.16, 0.06 + charge * 0.48);
      p.fistL.rotation.set(phase * 0.8, phase * 0.42, -charge * 0.55);
      p.fistR.rotation.set(-phase * 0.8, -phase * 0.42, charge * 0.55);
      const crownScale = renderBoss.bossType === "big" ? 1 + (1 - hpRatio) * 0.45 : 0.72 + (1 - hpRatio) * 0.28;
      p.crownL.position.set(-0.38 - armorOpen * 0.22, 3.12 + armorOpen * 0.3, -0.05);
      p.crownR.position.set(0.38 + armorOpen * 0.22, 3.12 + armorOpen * 0.3, -0.05);
      p.crownL.scale.set(0.18 * crownScale, 0.58 * crownScale, 0.18 * crownScale);
      p.crownR.scale.copy(p.crownL.scale);
      p.crownL.rotation.set(0, phase * 0.5, -0.3 - armorOpen * 0.4);
      p.crownR.rotation.set(0, -phase * 0.5, 0.3 + armorOpen * 0.4);
      const shardOrbit = phase * 0.9;
      p.shardL.position.set(-1.66 - armorOpen * 0.65, 1.56 + Math.sin(shardOrbit) * 0.18, -0.18 + Math.cos(shardOrbit) * 0.16);
      p.shardR.position.set(1.66 + armorOpen * 0.65, 1.56 - Math.sin(shardOrbit) * 0.18, -0.18 - Math.cos(shardOrbit) * 0.16);
      p.shardL.rotation.set(phase * 1.2, phase * 1.7, phase * 0.8);
      p.shardR.rotation.set(-phase * 1.1, -phase * 1.6, -phase * 0.9);
      if (deathProgress > 0)
        for (const part of this.bossPartList) {
          const scatter = part.userData.scatter;
          part.position.x += scatter[0] * deathProgress;
          part.position.y += scatter[1] * deathProgress - deathProgress * deathProgress * 2.2;
          part.position.z += scatter[2] * deathProgress;
          part.rotation.x += deathProgress * 4.2;
          part.rotation.y += deathProgress * 5.4;
          part.scale.multiplyScalar(1 + deathProgress * 0.16);
        }
      const palette = Xt.bossPalette[renderBoss.bossType] || Xt.bossPalette.mini,
        flash = (renderBoss.hitFlash || 0) > 0,
        alpha = (renderBoss.bossType === "big" ? 1 : 0.94) * (bossDeathEcho ? eventAmount : 1);
      (this.bossArmorMat.color.setHex(flash ? 0xffffff : palette.armor),
        this.bossJointMat.color.setHex(flash ? 0xffffff : palette.joint),
        this.bossCoreMat.color.setHex(flash ? 0xffffff : palette.core),
        (this.bossArmorMat.opacity = alpha),
        (this.bossJointMat.opacity = alpha * 0.78),
        (this.bossCoreMat.opacity = alpha * (0.82 + charge * 0.18)));
    } else {
      ((this.bossGroup.visible = !1), (this.lastBossVisual = null));
    }
  }
  dispose() {
    (this.playerMesh.geometry.dispose(), this.playerMesh.material.dispose());
    for (const e of Object.keys(this.enemyGeo))
      (this.enemyGeo[e].dispose(), this.enemyMats[e].dispose());
    (this.bulletGeo.dispose(), this.bulletMat.dispose());
    (this.enemyBulletGeo.dispose(), this.enemyBulletMat.dispose(), this.enemyBulletTrailMat.dispose());
    (this.weaponFxGeo.dispose(), this.weaponFxMat.dispose());
    (this.itemGeo.dispose(), this.itemInst.material.dispose(), this.itemRingGeo.dispose(), this.itemRingMat.dispose());
    (this.bossGeo.armor.dispose(),
      this.bossGeo.joint.dispose(),
      this.bossGeo.head.dispose(),
      this.bossArmorMat.dispose(),
      this.bossJointMat.dispose(),
      this.bossCoreMat.dispose());
  }
}
class vg {
  constructor(e, t) {
    ((this.pos = new R(0, 30, 30)),
      (this.look = new R()),
      (this.fov = fe.camera.fovBase),
      (this.zoom = 1),
      (this.zoomTarget = 1),
      (this.camera = new Dt(fe.camera.fovBase, e, 0.1, 600)),
      (this.shakeState = { trauma: 0, seed: t }),
      this.pos.set(0, 34, 30),
      this.camera.position.copy(this.pos),
      this.camera.lookAt(0, 0, 0));
  }
  setAspect(e) {
    ((this.camera.aspect = e), this.camera.updateProjectionMatrix());
  }
  adjustZoom(deltaY) {
    this.zoomTarget = Math.max(
      fe.camera.zoomMin,
      Math.min(fe.camera.zoomMax, this.zoomTarget * Math.exp(deltaY * fe.camera.zoomWheelSpeed))
    );
  }
  get trauma() {
    return this.shakeState.trauma;
  }
  set trauma(e) {
    this.shakeState.trauma = e;
  }
  update(e, t, n, s, r, eventWobble = 0) {
    const o = new R();
    ws(e.x, e.z, n, o);
    const zoomEase = 1 - Math.exp(-fe.camera.zoomLambda * r),
      u = 1 - Math.exp(-6 * r);
    this.zoom += (this.zoomTarget - this.zoom) * zoomEase;
    const c = new R(o.x, o.y + 34 * this.zoom, o.z + 30 * this.zoom);
    this.pos.lerp(c, u);
    (this.look.lerp(o, u), (this.shakeState.trauma = this.trauma));
    const f = gc(this.shakeState, s),
      p = Math.max(0, Math.min(1, eventWobble)),
      w = p * p,
      wx = Math.sin(s * 18) * fe.camera.eventWobbleShift * w,
      wy = Math.sin(s * 23 + 1.1) * fe.camera.eventWobbleShift * 0.55 * w,
      roll = Math.sin(s * 16 + 0.4) * fe.camera.eventWobbleRoll * w;
    (this.camera.position.set(this.pos.x + f.x + wx, this.pos.y + f.y + wy, this.pos.z + f.z),
      this.camera.up.set(0, 1, 0),
      this.camera.lookAt(this.look.x + f.x, this.look.y + f.y, this.look.z + f.z),
      this.camera.rotateZ(roll),
      (this.camera.fov = fe.camera.fovBase + Math.sin(s * 12.5) * fe.camera.eventWobbleFov * w),
      this.camera.updateProjectionMatrix(),
      this.camera.updateMatrixWorld());
  }
}
const setWorldEventTransform = (group, eventWobble, time) => {
  const eventAmount = Math.max(0, Math.min(1, eventWobble)),
    eventPower = eventAmount * eventAmount;
  (group.position.set(
    Math.sin(time * 18) * fe.camera.eventEntityShift * eventPower,
    Math.sin(time * 23 + 1.1) * fe.camera.eventEntityLift * eventPower,
    0
  ),
    (group.rotation.z = Math.sin(time * 16 + 0.4) * fe.camera.eventEntityRoll * eventPower),
    group.scale.setScalar(1 + Math.sin(time * 12.5) * fe.camera.eventEntityScale * eventPower));
};
class xg {
  constructor(e, t) {
    ((this.onResize = () => {
      const n = this.renderer.domElement.parentElement;
      if (!n) return;
      const s = n.clientWidth,
        r = n.clientHeight;
      (this.renderer.setSize(s, r), this.composer.setSize(s, r), this.camera.setAspect(s / r));
    }),
      (this.renderer = new pl({ antialias: !0, alpha: !1 })),
      this.renderer.setPixelRatio(Math.min(2, window.devicePixelRatio)),
      this.renderer.setSize(e.clientWidth, e.clientHeight),
      this.renderer.setClearColor(Xt.bg, 1),
      e.appendChild(this.renderer.domElement),
      (this.itemLabelLayer = document.createElement("div")),
      (this.itemLabelLayer.id = "item-label-layer"),
      this.itemLabelLayer.setAttribute("aria-hidden", "true"),
      e.appendChild(this.itemLabelLayer),
      (this.itemLabels = new Map()),
      (this.itemLabelPoint = new R()),
      (this.itemLabelTangent = new R()),
      (this.itemLabelBitangent = new R()),
      (this.itemLabelNormal = new R()),
      (this.scene = new Vm()),
      (this.scene.fog = new Lr(Xt.bg, 0.012)),
      (this.camera = new vg(e.clientWidth / e.clientHeight, t)),
      (this.eventGroup = new yi()),
      this.scene.add(this.eventGroup),
      (this.grid = new mg()),
      this.eventGroup.add(this.grid.mesh),
      (this.particles = new gg()),
      this.eventGroup.add(this.particles.mesh),
      (this.entities = new _g()),
      this.eventGroup.add(this.entities.group),
      (this.composer = new hg(this.renderer)),
      this.composer.addPass(new fg(this.scene, this.camera.camera)),
      (this.bloom = new li(new oe(e.clientWidth, e.clientHeight), 1.4, 0.6, 0.32)),
      this.composer.addPass(this.bloom),
      (this.onWheel = (n) => {
        n.preventDefault();
        this.camera.adjustZoom(n.deltaY);
      }),
      this.renderer.domElement.addEventListener("wheel", this.onWheel, { passive: !1 }),
      window.addEventListener("resize", this.onResize));
  }
  syncItemLabels(items) {
    const active = new Set(),
      width = this.renderer.domElement.clientWidth,
      height = this.renderer.domElement.clientHeight;
    this.eventGroup.updateWorldMatrix(!0, !1);
    this.camera.camera.updateMatrixWorld();
    for (const item of items || []) {
      active.add(item.id);
      let label = this.itemLabels.get(item.id);
      if (!label) {
        label = document.createElement("span");
        label.className = "item-label";
        label.dataset.itemKind = item.kind;
        label.textContent = item.kind === "weapon" && item.weaponType
          ? `WEAPON · ${WEAPON_NAMES[item.weaponType]}`
          : ITEM_LABELS[item.kind] || item.kind.toUpperCase();
        label.style.setProperty("--item-color", `#${(item.color ?? 0xffffff).toString(16).padStart(6, "0")}`);
        this.itemLabelLayer.appendChild(label);
        this.itemLabels.set(item.id, label);
      }
      const bob = Math.sin(item.bob) * 0.4 + 0.6;
      hr(
        item.pos.x,
        item.pos.z,
        this.entities.impulses,
        this.itemLabelPoint,
        this.itemLabelTangent,
        this.itemLabelBitangent,
        this.itemLabelNormal
      );
      this.itemLabelPoint.y += 1.75 + bob * 0.35;
      this.eventGroup.localToWorld(this.itemLabelPoint);
      this.itemLabelPoint.project(this.camera.camera);
      const visible =
        width > 0 &&
        height > 0 &&
        this.itemLabelPoint.z >= -1 &&
        this.itemLabelPoint.z <= 1 &&
        Math.abs(this.itemLabelPoint.x) <= 1.08 &&
        Math.abs(this.itemLabelPoint.y) <= 1.08;
      label.style.display = visible ? "block" : "none";
      if (visible) {
        const x = (this.itemLabelPoint.x * 0.5 + 0.5) * width,
          y = (-this.itemLabelPoint.y * 0.5 + 0.5) * height;
        label.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -100%)`;
        label.style.opacity = String(Math.min(1, Math.max(0, item.life / 1.5)));
      }
    }
    for (const [id, label] of this.itemLabels)
      if (!active.has(id)) {
        label.remove();
        this.itemLabels.delete(id);
      }
  }
  screenToArenaAim(ndcX, ndcY, playerPos) {
    this.camera.camera.updateMatrixWorld();
    this.eventGroup.updateWorldMatrix(!0, !1);
    const worldOrigin = this.camera.camera.position.clone(),
      worldPoint = new R(ndcX, -ndcY, 0.5).unproject(this.camera.camera),
      worldDir = worldPoint.sub(worldOrigin).normalize(),
      localOrigin = this.eventGroup.worldToLocal(worldOrigin.clone()),
      localPoint = this.eventGroup.worldToLocal(worldOrigin.clone().add(worldDir)),
      localDir = localPoint.sub(localOrigin).normalize(),
      b = localOrigin.dot(localDir),
      c = localOrigin.lengthSq() - Pn.radius * Pn.radius,
      disc = b * b - c;
    if (disc < 0) return null;
    const root = Math.sqrt(disc),
      near = -b - root,
      far = -b + root,
      distance = near > 0 ? near : far;
    if (distance <= 0) return null;
    const hit = localOrigin.addScaledVector(localDir, distance).normalize(),
      theta = Math.acos(Math.max(-1, Math.min(1, hit.y))),
      radial = Math.min(1, theta / Pn.capHalfAngle) * fe.worldBounds,
      azimuth = Math.atan2(hit.z, hit.x),
      targetX = Math.cos(azimuth) * radial,
      targetZ = Math.sin(azimuth) * radial,
      dx = targetX - playerPos.x,
      dz = targetZ - playerPos.z,
      len = Math.hypot(dx, dz);
    return len > 1e-4 ? { x: dx / len, z: dz / len } : null;
  }
  update(e, t) {
    ((this.bloom.strength = 1.4 + t.score.multiplierPulse * 0.6),
      setWorldEventTransform(this.eventGroup, e.eventWobble, e.time),
      this.grid.update(e.impulses),
      this.particles.setImpulses(e.impulses),
      this.particles.update(e.particles),
      this.entities.setImpulses(e.impulses),
      this.entities.update(e.player, e.enemies, e.bullets, e.time, e.items, e.boss, e.eventWobble, e.weaponEffects),
      (this.camera.trauma = e.trauma),
      this.camera.update(e.player.pos, e.player.vel, e.impulses, e.time, fe.fixedStep, e.eventWobble),
      this.syncItemLabels(e.items));
  }
  render() {
    this.composer.render();
  }
  dispose() {
    (window.removeEventListener("resize", this.onResize),
      this.renderer.domElement.removeEventListener("wheel", this.onWheel),
      this.itemLabels.clear(),
      this.itemLabelLayer.remove(),
      this.entities.dispose(),
      this.renderer.dispose(),
      this.renderer.domElement.remove());
  }
}
const us = { master: 0.9, sfx: 0.55, bgm: 0.22 },
  hs = (i, e, t) => (i < e ? e : i > t ? t : i);
class Mg {
  constructor() {
    ((this.ctx = null),
      (this.master = null),
      (this.sfxBus = null),
      (this.bgmBus = null),
      (this.compressor = null),
      (this.muted = !1),
      (this.started = !1),
      (this.noiseBuffer = null),
      (this.bpm = 128),
      (this.nextNoteTime = 0),
      (this.step16 = 0),
      (this.bar = 0),
      (this.schedulerTimer = null),
      (this.lookahead = 0.1),
      (this.tickMs = 25),
      (this.lastFireByWeapon = Object.create(null)),
      (this.lastSpawn = -1 / 0),
      (this.spawnAccum = 0),
      (this.normalChords = [
        [130.81, 155.56, 196],
        [103.83, 130.81, 155.56],
        [155.56, 196, 233.08],
        [116.54, 146.83, 174.61]
      ]),
      (this.bossChords = [
        [130.81, 155.56, 196],
        [146.83, 174.61, 207.65],
        [130.81, 155.56, 196],
        [196, 233.08, 293.66]
      ]),
      (this.chords = this.normalChords),
      (this.bossMode = !1));
  }
  async resume() {
    this.ctx || this.initContext();
    const e = this.ctx;
    if (e.state === "suspended")
      try {
        await e.resume();
      } catch {}
    this.started ||
      ((this.started = !0),
      (this.nextNoteTime = e.currentTime + 0.08),
      (this.schedulerTimer = window.setInterval(() => this.scheduler(), this.tickMs)));
  }
  setMuted(e) {
    if (((this.muted = e), !this.master || !this.ctx)) return;
    const t = this.ctx.currentTime;
    (this.master.gain.cancelScheduledValues(t),
      this.master.gain.setTargetAtTime(e ? 1e-4 : us.master, t, 0.05));
  }
  isMuted() {
    return this.muted;
  }
  setBossMode(e) {
    if (e === this.bossMode) return;
    this.bossMode = e;
    this.bpm = e ? 142 : 128;
    this.chords = e ? this.bossChords : this.normalChords;
    if (this.bgmBus && this.ctx) {
      const t = this.ctx.currentTime;
      (this.bgmBus.gain.cancelScheduledValues(t),
        this.bgmBus.gain.setTargetAtTime(e ? us.bgm * 1.6 : us.bgm, t, 0.4));
    }
  }
  dispose() {
    (this.schedulerTimer != null &&
      (window.clearInterval(this.schedulerTimer), (this.schedulerTimer = null)),
      this.ctx && (this.ctx.close().catch(() => {}), (this.ctx = null)),
      (this.master = this.sfxBus = this.bgmBus = this.compressor = null),
      (this.started = !1));
  }
  initContext() {
    const e = window.AudioContext || window.webkitAudioContext;
    if (!e) return;
    const t = new e();
    ((this.ctx = t),
      (this.compressor = t.createDynamicsCompressor()),
      (this.compressor.threshold.value = -10),
      (this.compressor.knee.value = 24),
      (this.compressor.ratio.value = 4),
      (this.compressor.attack.value = 0.003),
      (this.compressor.release.value = 0.25),
      (this.master = t.createGain()),
      (this.master.gain.value = this.muted ? 1e-4 : us.master),
      (this.sfxBus = t.createGain()),
      (this.sfxBus.gain.value = us.sfx),
      (this.bgmBus = t.createGain()),
      (this.bgmBus.gain.value = us.bgm),
      this.sfxBus.connect(this.master),
      this.bgmBus.connect(this.master),
      this.master.connect(this.compressor),
      this.compressor.connect(t.destination));
    const n = t.sampleRate * 2,
      s = t.createBuffer(1, n, t.sampleRate),
      r = s.getChannelData(0);
    for (let o = 0; o < n; o++) r[o] = Math.random() * 2 - 1;
    this.noiseBuffer = s;
  }
  get time() {
    return this.ctx ? this.ctx.currentTime : 0;
  }
  panFor(e, t, n) {
    const s = n || 26;
    return hs((e.x - t) / s, -1, 1);
  }
  makePanner(e) {
    if (!this.ctx) return null;
    const t = this.ctx.createStereoPanner();
    return ((t.pan.value = hs(e, -1, 1)), t);
  }
  noiseSource() {
    if (!this.ctx || !this.noiseBuffer) return null;
    const e = this.ctx.createBufferSource();
    return ((e.buffer = this.noiseBuffer), (e.loop = !1), e);
  }
  playFire(e, t = 0) {
    const n = this.ctx;
    if (!n || !this.sfxBus) return;
    const s = this.time,
      fireGap = e === "lightning" ? 0.12 : e === "missile" ? 0.1 : e === "laser" ? 0.08 : 0.06,
      lastFire = this.lastFireByWeapon[e] ?? -1 / 0;
    if (s - lastFire < fireGap) return;
    this.lastFireByWeapon[e] = s;
    const r = this.makePanner(t),
      o = r ?? this.sfxBus;
    r && r.connect(this.sfxBus);
    const a = n.createOscillator();
    a.type = "sawtooth";
    const isLightning = e === "lightning",
      pitches = { blaster: 1200, missile: 260, lightning: 1850, laser: 1050 },
      l = pitches[e] || 1200,
      end = e === "missile" ? 90 : isLightning ? 210 : 300,
      duration = isLightning ? 0.18 : 0.09;
    (a.frequency.setValueAtTime(l, s), a.frequency.exponentialRampToValueAtTime(end, s + duration));
    const c = n.createBiquadFilter();
    ((c.type = "lowpass"),
      c.frequency.setValueAtTime(isLightning ? 5200 : 3200, s),
      c.frequency.exponentialRampToValueAtTime(isLightning ? 1250 : 900, s + duration),
      (c.Q.value = isLightning ? 2.4 : 1.1));
    const u = n.createGain();
    (u.gain.setValueAtTime(1e-4, s),
      u.gain.exponentialRampToValueAtTime(isLightning ? 0.34 : e === "missile" ? 0.26 : 0.22, s + 0.004),
      u.gain.exponentialRampToValueAtTime(1e-4, s + duration),
      a.connect(c),
      c.connect(u),
      u.connect(o),
      a.start(s),
      a.stop(s + duration + 0.02));
    if (isLightning) {
      const thunder = n.createOscillator(), thunderGain = n.createGain();
      thunder.type = "square";
      thunder.frequency.setValueAtTime(310, s);
      thunder.frequency.exponentialRampToValueAtTime(72, s + 0.16);
      thunderGain.gain.setValueAtTime(0.2, s);
      thunderGain.gain.exponentialRampToValueAtTime(1e-4, s + 0.17);
      thunder.connect(thunderGain);
      thunderGain.connect(o);
      thunder.start(s);
      thunder.stop(s + 0.18);
    }
    const h = this.noiseSource();
    if (h) {
      const f = n.createBiquadFilter();
      ((f.type = "highpass"), (f.frequency.value = isLightning ? 1050 : 2500));
      const p = n.createGain(), noiseDuration = isLightning ? 0.14 : 0.03;
      (p.gain.setValueAtTime(isLightning ? 0.3 : 0.18, s),
        p.gain.exponentialRampToValueAtTime(1e-4, s + noiseDuration),
        h.connect(f),
        f.connect(p),
        p.connect(o),
        h.start(s),
        h.stop(s + noiseDuration + 0.01));
    }
  }
  playKill(e, t = 0) {
    const n = this.ctx;
    if (!n || !this.sfxBus) return;
    const s = this.time,
      r = e === "singularity",
      o = this.makePanner(t),
      a = o ?? this.sfxBus;
    o && o.connect(this.sfxBus);
    const l = this.noiseSource();
    if (l) {
      const g = n.createBiquadFilter();
      ((g.type = "lowpass"),
        g.frequency.setValueAtTime(r ? 1800 : 2600, s),
        g.frequency.exponentialRampToValueAtTime(r ? 120 : 400, s + (r ? 0.5 : 0.18)),
        (g.Q.value = r ? 6 : 2));
      const _ = n.createGain(),
        m = r ? 0.5 : 0.28;
      (_.gain.setValueAtTime(1e-4, s),
        _.gain.exponentialRampToValueAtTime(m, s + 0.006),
        _.gain.exponentialRampToValueAtTime(1e-4, s + (r ? 0.6 : 0.22)),
        l.connect(g),
        g.connect(_),
        _.connect(a),
        l.start(s),
        l.stop(s + (r ? 0.62 : 0.24)));
    }
    const c = n.createOscillator();
    c.type = r ? "sine" : "triangle";
    const u = r ? 130 : e === "dodger" ? 520 : e === "wanderer" ? 380 : 300,
      h = r ? 42 : u * 0.35;
    (c.frequency.setValueAtTime(u, s),
      c.frequency.exponentialRampToValueAtTime(h, s + (r ? 0.5 : 0.16)));
    const f = n.createGain(),
      p = r ? 0.4 : 0.18;
    if (
      (f.gain.setValueAtTime(1e-4, s),
      f.gain.exponentialRampToValueAtTime(p, s + 0.006),
      f.gain.exponentialRampToValueAtTime(1e-4, s + (r ? 0.55 : 0.18)),
      c.connect(f),
      f.connect(a),
      c.start(s),
      c.stop(s + (r ? 0.6 : 0.2)),
      r)
    ) {
      const g = this.noiseSource();
      if (g) {
        const _ = n.createBiquadFilter();
        ((_.type = "highpass"), (_.frequency.value = 3e3));
        const m = n.createGain();
        (m.gain.setValueAtTime(0.25, s),
          m.gain.exponentialRampToValueAtTime(1e-4, s + 0.35),
          g.connect(_),
          _.connect(m),
          m.connect(a),
          g.start(s),
          g.stop(s + 0.36));
      }
    }
  }
  playHitPlayer(e, t = 0) {
    const n = this.ctx;
    if (!n || !this.sfxBus) return;
    const s = this.time,
      r = this.makePanner(t),
      o = r ?? this.sfxBus;
    r && r.connect(this.sfxBus);
    const a = n.createOscillator();
    ((a.type = "sine"),
      a.frequency.setValueAtTime(150, s),
      a.frequency.exponentialRampToValueAtTime(55, s + 0.22));
    const l = n.createGain();
    (l.gain.setValueAtTime(1e-4, s),
      l.gain.exponentialRampToValueAtTime(0.32, s + 0.005),
      l.gain.exponentialRampToValueAtTime(1e-4, s + 0.26),
      a.connect(l),
      l.connect(o),
      a.start(s),
      a.stop(s + 0.28));
    const c = n.createOscillator(),
      u = n.createOscillator();
    ((c.type = "square"),
      (u.type = "square"),
      (c.frequency.value = 220),
      (u.frequency.value = 233));
    const h = n.createGain();
    (h.gain.setValueAtTime(1e-4, s),
      h.gain.exponentialRampToValueAtTime(0.1 * hs(e / 20, 0.5, 1.4), s + 0.01),
      h.gain.exponentialRampToValueAtTime(1e-4, s + 0.18),
      c.connect(h),
      u.connect(h),
      h.connect(o),
      c.start(s),
      u.start(s),
      c.stop(s + 0.2),
      u.stop(s + 0.2));
    const f = this.noiseSource();
    if (f) {
      const p = n.createBiquadFilter();
      ((p.type = "lowpass"), (p.frequency.value = 700));
      const g = n.createGain();
      (g.gain.setValueAtTime(0.2, s),
        g.gain.exponentialRampToValueAtTime(1e-4, s + 0.14),
        f.connect(p),
        p.connect(g),
        g.connect(o),
        f.start(s),
        f.stop(s + 0.15));
    }
  }
  playMultiplierUp(e) {
    const t = this.ctx;
    if (!t || !this.sfxBus) return;
    const n = this.time,
      s = [440, 554, 660, 880],
      r = hs(Math.floor(e), 1, 5),
      o = Math.min(s.length, 2 + r);
    for (let a = 0; a < o; a++) {
      const l = n + a * 0.06,
        c = t.createOscillator();
      ((c.type = "square"), (c.frequency.value = s[a]));
      const u = t.createGain();
      (u.gain.setValueAtTime(1e-4, l),
        u.gain.exponentialRampToValueAtTime(0.12, l + 0.005),
        u.gain.exponentialRampToValueAtTime(1e-4, l + 0.12));
      const h = t.createOscillator();
      ((h.type = "triangle"), (h.frequency.value = s[a] * 2));
      const f = t.createGain();
      (f.gain.setValueAtTime(1e-4, l),
        f.gain.exponentialRampToValueAtTime(0.05, l + 0.005),
        f.gain.exponentialRampToValueAtTime(1e-4, l + 0.1),
        c.connect(u),
        h.connect(f),
        u.connect(this.sfxBus),
        f.connect(this.sfxBus),
        c.start(l),
        h.start(l),
        c.stop(l + 0.14),
        h.stop(l + 0.12));
    }
  }
  playGameOver() {
    const e = this.ctx;
    if (!e || !this.sfxBus) return;
    const t = this.time,
      n = e.createOscillator();
    ((n.type = "sawtooth"),
      n.frequency.setValueAtTime(420, t),
      n.frequency.exponentialRampToValueAtTime(60, t + 1.2));
    const s = e.createBiquadFilter();
    ((s.type = "lowpass"),
      s.frequency.setValueAtTime(2600, t),
      s.frequency.exponentialRampToValueAtTime(300, t + 1.2));
    const r = e.createGain();
    (r.gain.setValueAtTime(1e-4, t),
      r.gain.exponentialRampToValueAtTime(0.28, t + 0.02),
      r.gain.exponentialRampToValueAtTime(1e-4, t + 1.3),
      n.connect(s),
      s.connect(r),
      r.connect(this.sfxBus),
      n.start(t),
      n.stop(t + 1.35));
    const o = this.noiseSource();
    if (o) {
      const a = e.createBiquadFilter();
      ((a.type = "lowpass"), (a.frequency.value = 500));
      const l = e.createGain();
      (l.gain.setValueAtTime(0.18, t),
        l.gain.exponentialRampToValueAtTime(1e-4, t + 0.9),
        o.connect(a),
        a.connect(l),
        l.connect(this.sfxBus),
        o.start(t),
        o.stop(t + 1));
    }
  }
  playSpawn(e, t = 0) {
    const n = this.ctx;
    if (!n || !this.sfxBus) return;
    const s = this.time;
    if (((this.spawnAccum += 1), s - this.lastSpawn < 0.04 && this.spawnAccum > 3)) return;
    (s - this.lastSpawn >= 0.12 && (this.spawnAccum = 0), (this.lastSpawn = s));
    const r = this.makePanner(t),
      o = r ?? this.sfxBus;
    r && r.connect(this.sfxBus);
    const a = n.createOscillator();
    a.type = "sine";
    const l = e === "singularity" ? 220 : e === "wanderer" ? 520 : e === "dodger" ? 660 : 380;
    (a.frequency.setValueAtTime(l * 0.6, s), a.frequency.exponentialRampToValueAtTime(l, s + 0.05));
    const c = n.createGain(),
      u = e === "singularity" ? 0.14 : 0.06;
    (c.gain.setValueAtTime(1e-4, s),
      c.gain.exponentialRampToValueAtTime(u, s + 0.01),
      c.gain.exponentialRampToValueAtTime(1e-4, s + 0.1),
      a.connect(c),
      c.connect(o),
      a.start(s),
      a.stop(s + 0.12));
  }
  playSkill(e = 0) {
    const n = this.ctx;
    if (!n || !this.sfxBus) return;
    const s = this.time,
      r = this.makePanner(e),
      o = r ?? this.sfxBus;
    r && r.connect(this.sfxBus);
    const a = n.createOscillator();
    ((a.type = "sawtooth"),
      a.frequency.setValueAtTime(180, s),
      a.frequency.exponentialRampToValueAtTime(1400, s + 0.18),
      a.frequency.exponentialRampToValueAtTime(120, s + 0.6));
    const l = n.createBiquadFilter();
    ((l.type = "lowpass"),
      l.frequency.setValueAtTime(400, s),
      l.frequency.exponentialRampToValueAtTime(5000, s + 0.18),
      l.frequency.exponentialRampToValueAtTime(300, s + 0.6),
      (l.Q.value = 6));
    const c = n.createGain();
    (c.gain.setValueAtTime(1e-4, s),
      c.gain.exponentialRampToValueAtTime(0.34, s + 0.02),
      c.gain.exponentialRampToValueAtTime(1e-4, s + 0.62),
      a.connect(l),
      l.connect(c),
      c.connect(o),
      a.start(s),
      a.stop(s + 0.66));
    const h = this.noiseSource();
    if (h) {
      const f = n.createBiquadFilter();
      ((f.type = "bandpass"), (f.frequency.value = 1200), (f.Q.value = 1.2));
      const p = n.createGain();
      (p.gain.setValueAtTime(0.22, s),
        p.gain.exponentialRampToValueAtTime(1e-4, s + 0.3),
        h.connect(f),
        f.connect(p),
        p.connect(o),
        h.start(s),
        h.stop(s + 0.32));
    }
  }
  playPickup(e, t = 0) {
    const n = this.ctx;
    if (!n || !this.sfxBus) return;
    const s = this.time,
      r = this.makePanner(t),
      o = r ?? this.sfxBus;
    r && r.connect(this.sfxBus);
    const base = e === "life" ? 880 : e === "weapon" ? 660 : e === "shield" ? 520 : 740;
    for (let i = 0; i < 2; i++) {
      const tt = s + i * 0.05,
        a = n.createOscillator();
      ((a.type = "triangle"), (a.frequency.value = base * (i ? 1.5 : 1)));
      const c = n.createGain();
      (c.gain.setValueAtTime(1e-4, tt),
        c.gain.exponentialRampToValueAtTime(0.16, tt + 0.005),
        c.gain.exponentialRampToValueAtTime(1e-4, tt + 0.12),
        a.connect(c),
        c.connect(o),
        a.start(tt),
        a.stop(tt + 0.14));
    }
  }
  playBossFire(e = 0) {
    const n = this.ctx;
    if (!n || !this.sfxBus) return;
    const s = this.time,
      r = this.makePanner(e),
      o = r ?? this.sfxBus;
    r && r.connect(this.sfxBus);
    const a = n.createOscillator();
    ((a.type = "square"),
      a.frequency.setValueAtTime(160, s),
      a.frequency.exponentialRampToValueAtTime(70, s + 0.16));
    const c = n.createGain();
    (c.gain.setValueAtTime(1e-4, s),
      c.gain.exponentialRampToValueAtTime(0.18, s + 0.005),
      c.gain.exponentialRampToValueAtTime(1e-4, s + 0.18),
      a.connect(c),
      c.connect(o),
      a.start(s),
      a.stop(s + 0.2));
  }
  playBossHit(e = 0) {
    const n = this.ctx;
    if (!n || !this.sfxBus) return;
    const s = this.time,
      r = this.makePanner(e),
      o = r ?? this.sfxBus;
    r && r.connect(this.sfxBus);
    const h = this.noiseSource();
    if (h) {
      const f = n.createBiquadFilter();
      ((f.type = "bandpass"), (f.frequency.value = 900), (f.Q.value = 1));
      const p = n.createGain();
      (p.gain.setValueAtTime(0.16, s),
        p.gain.exponentialRampToValueAtTime(1e-4, s + 0.08),
        h.connect(f),
        f.connect(p),
        p.connect(o),
        h.start(s),
        h.stop(s + 0.1));
    }
  }
  playBossDead(e = 0) {
    const n = this.ctx;
    if (!n || !this.sfxBus) return;
    const s = this.time,
      r = this.makePanner(e),
      o = r ?? this.sfxBus;
    r && r.connect(this.sfxBus);
    const a = n.createOscillator();
    ((a.type = "sawtooth"),
      a.frequency.setValueAtTime(420, s),
      a.frequency.exponentialRampToValueAtTime(50, s + 1.1));
    const l = n.createBiquadFilter();
    ((l.type = "lowpass"),
      l.frequency.setValueAtTime(3000, s),
      l.frequency.exponentialRampToValueAtTime(200, s + 1.1));
    const c = n.createGain();
    (c.gain.setValueAtTime(1e-4, s),
      c.gain.exponentialRampToValueAtTime(0.4, s + 0.02),
      c.gain.exponentialRampToValueAtTime(1e-4, s + 1.3),
      a.connect(l),
      l.connect(c),
      c.connect(o),
      a.start(s),
      a.stop(s + 1.35));
    const h = this.noiseSource();
    if (h) {
      const f = n.createBiquadFilter();
      ((f.type = "lowpass"), (f.frequency.value = 600));
      const p = n.createGain();
      (p.gain.setValueAtTime(0.3, s),
        p.gain.exponentialRampToValueAtTime(1e-4, s + 1.0),
        h.connect(f),
        f.connect(p),
        p.connect(o),
        h.start(s),
        h.stop(s + 1.05));
    }
  }
  playEvents(e, t, n) {
    if (!(!this.ctx || this.muted))
      for (const s of e)
        switch (s.type) {
          case "kill":
            this.playKill(s.kind, this.panFor(s.pos, t, n));
            break;
          case "explode":
            this.playKill("singularity", this.panFor(s.pos, t, n));
            break;
          case "hit-player":
            this.playHitPlayer(s.damage, this.panFor(s.pos, t, n));
            break;
          case "shockwave":
            this.playKill("singularity", this.panFor(s.pos, t, n));
            break;
          case "spawn":
            this.playSpawn(s.kind, this.panFor(s.pos, t, n));
            break;
          case "multiplier-up":
            this.playMultiplierUp(s.value);
            break;
          case "game-over":
            this.playGameOver();
            break;
          case "skill-fire":
            this.playSkill(this.panFor(s.pos, t, n));
            break;
          case "weapon-fire":
            this.playFire(s.weapon, this.panFor(s.pos, t, n));
            break;
          case "pickup":
            this.playPickup(s.kind, this.panFor(s.pos, t, n));
            break;
          case "boss-fire":
            this.playBossFire(this.panFor(s.pos, t, n));
            break;
          case "boss-hit":
            this.playBossHit(this.panFor(s.pos, t, n));
            break;
          case "boss-dead":
            this.playBossDead(this.panFor(s.pos, t, n));
            break;
          case "revive":
            this.playMultiplierUp(4);
            break;
        }
  }
  scheduler() {
    const e = this.ctx;
    if (!e || !this.bgmBus) return;
    const t = 60 / this.bpm / 4;
    for (; this.nextNoteTime < e.currentTime + this.lookahead;)
      (this.scheduleStep(this.step16, this.bar, this.nextNoteTime),
        (this.nextNoteTime += t),
        (this.step16 = (this.step16 + 1) % 16),
        this.step16 === 0 && (this.bar = (this.bar + 1) % this.chords.length));
  }
  scheduleStep(e, t, n) {
    const s = this.ctx,
      r = this.bgmBus,
      o = this.chords[t],
      a = o[0],
      boss = this.bossMode,
      sd = 60 / this.bpm / 4;
    if (boss) {
      this.bassNote(a / 2, n, sd * 0.85, r, s, e % 2 === 0 ? 1 : 0.6);
      e % 2 === 1 && this.stabNote(o[2] * 2, n, r, s);
      const l = o[e % o.length] * (e >= 8 ? 2 : 1.5);
      this.arpNote(l, n, sd * 0.7, r, s);
      e % 2 === 0 && this.kick(n, r, s);
      (e === 4 || e === 12) && this.snare(n, r, s);
      e % 2 === 0 && this.hat(n, r, s, !1);
      this.hat(n, r, s, !0);
    } else {
      (e % 4 === 0 && this.bassNote(a / 2, n, (60 / this.bpm) * 0.9, r, s),
        (e === 6 || e === 14) && this.bassNote(a / 2, n, (60 / this.bpm) * 0.3, r, s, 0.5));
      const l = o[e % o.length] * (e >= 8 ? 2 : 1);
      if ((this.arpNote(l, n, sd * 0.9, r, s), e === 0)) {
        const c = (60 / this.bpm) * 4 * 0.98;
        for (const u of o) this.padNote(u, n, c, r, s);
      }
      (e % 4 === 0 && this.kick(n, r, s),
        (e === 4 || e === 12) && this.snare(n, r, s),
        e % 2 === 0 && this.hat(n, r, s, !1),
        e % 4 === 2 && this.hat(n, r, s, !0));
    }
  }
  bassNote(e, t, n, s, r, o = 1) {
    const a = r.createOscillator();
    ((a.type = "sawtooth"), (a.frequency.value = e));
    const l = r.createOscillator();
    ((l.type = "sine"), (l.frequency.value = e / 2));
    const c = r.createBiquadFilter();
    ((c.type = "lowpass"),
      c.frequency.setValueAtTime(900, t),
      c.frequency.exponentialRampToValueAtTime(180, t + n),
      (c.Q.value = 4));
    const u = r.createGain();
    (u.gain.setValueAtTime(1e-4, t),
      u.gain.exponentialRampToValueAtTime(0.32 * o, t + 0.02),
      u.gain.setValueAtTime(0.28 * o, t + n * 0.5),
      u.gain.exponentialRampToValueAtTime(1e-4, t + n));
    const h = r.createGain();
    ((h.gain.value = 0.5),
      a.connect(c),
      l.connect(c),
      c.connect(u),
      u.connect(s),
      a.start(t),
      l.start(t),
      a.stop(t + n + 0.02),
      l.stop(t + n + 0.02));
  }
  arpNote(e, t, n, s, r) {
    const o = r.createOscillator();
    ((o.type = "square"), (o.frequency.value = e));
    const a = r.createOscillator();
    ((a.type = "triangle"), (a.frequency.value = e * 1.005));
    const l = r.createGain();
    (l.gain.setValueAtTime(1e-4, t),
      l.gain.exponentialRampToValueAtTime(0.1, t + 0.005),
      l.gain.exponentialRampToValueAtTime(1e-4, t + n));
    const c = r.createDelay(1);
    c.delayTime.value = 60 / this.bpm / 2;
    const u = r.createGain();
    u.gain.value = 0.32;
    const h = r.createGain();
    ((h.gain.value = 0.45),
      o.connect(l),
      a.connect(l),
      l.connect(s),
      l.connect(c),
      c.connect(u),
      u.connect(c),
      c.connect(h),
      h.connect(s),
      o.start(t),
      a.start(t),
      o.stop(t + n + 0.02),
      a.stop(t + n + 0.02));
  }
  stabNote(e, t, n, s) {
    const r = s.createOscillator(),
      o = s.createOscillator(),
      a = s.createBiquadFilter(),
      l = s.createGain();
    ((r.type = "sawtooth"),
      (r.frequency.value = e),
      (o.type = "square"),
      (o.frequency.value = e * 1.03),
      (a.type = "bandpass"),
      a.frequency.setValueAtTime(e * 2, t),
      (a.Q.value = 3),
      l.gain.setValueAtTime(1e-4, t),
      l.gain.exponentialRampToValueAtTime(0.12, t + 0.004),
      l.gain.exponentialRampToValueAtTime(1e-4, t + 0.12),
      r.connect(a),
      o.connect(a),
      a.connect(l),
      l.connect(n),
      r.start(t),
      o.start(t),
      r.stop(t + 0.14),
      o.stop(t + 0.14));
  }
  padNote(e, t, n, s, r) {
    const o = r.createOscillator();
    ((o.type = "sawtooth"), (o.frequency.value = e));
    const a = r.createOscillator();
    ((a.type = "sawtooth"), (a.frequency.value = e * 1.01));
    const l = r.createBiquadFilter();
    ((l.type = "lowpass"), (l.frequency.value = 1400), (l.Q.value = 0.7));
    const c = r.createGain();
    (c.gain.setValueAtTime(1e-4, t),
      c.gain.linearRampToValueAtTime(0.05, t + n * 0.25),
      c.gain.setValueAtTime(0.05, t + n * 0.6),
      c.gain.exponentialRampToValueAtTime(1e-4, t + n),
      o.connect(l),
      a.connect(l),
      l.connect(c),
      c.connect(s),
      o.start(t),
      a.start(t),
      o.stop(t + n + 0.02),
      a.stop(t + n + 0.02));
  }
  kick(e, t, n) {
    const s = n.createOscillator();
    ((s.type = "sine"),
      s.frequency.setValueAtTime(150, e),
      s.frequency.exponentialRampToValueAtTime(45, e + 0.12));
    const r = n.createGain();
    (r.gain.setValueAtTime(1e-4, e),
      r.gain.exponentialRampToValueAtTime(0.5, e + 0.004),
      r.gain.exponentialRampToValueAtTime(1e-4, e + 0.18),
      s.connect(r),
      r.connect(t),
      s.start(e),
      s.stop(e + 0.2));
    const o = this.noiseSource();
    if (o) {
      const a = n.createBiquadFilter();
      ((a.type = "highpass"), (a.frequency.value = 1200));
      const l = n.createGain();
      (l.gain.setValueAtTime(0.12, e),
        l.gain.exponentialRampToValueAtTime(1e-4, e + 0.02),
        o.connect(a),
        a.connect(l),
        l.connect(t),
        o.start(e),
        o.stop(e + 0.03));
    }
  }
  snare(e, t, n) {
    const s = this.noiseSource();
    if (!s) return;
    const r = n.createBiquadFilter();
    ((r.type = "bandpass"), (r.frequency.value = 1800), (r.Q.value = 0.8));
    const o = n.createGain();
    (o.gain.setValueAtTime(1e-4, e),
      o.gain.exponentialRampToValueAtTime(0.28, e + 0.003),
      o.gain.exponentialRampToValueAtTime(1e-4, e + 0.16),
      s.connect(r),
      r.connect(o),
      o.connect(t),
      s.start(e),
      s.stop(e + 0.18));
    const a = n.createOscillator();
    ((a.type = "triangle"), (a.frequency.value = 220));
    const l = n.createGain();
    (l.gain.setValueAtTime(0.08, e),
      l.gain.exponentialRampToValueAtTime(1e-4, e + 0.08),
      a.connect(l),
      l.connect(t),
      a.start(e),
      a.stop(e + 0.1));
  }
  hat(e, t, n, s) {
    const r = this.noiseSource();
    if (!r) return;
    const o = n.createBiquadFilter();
    ((o.type = "highpass"), (o.frequency.value = 7e3));
    const a = n.createGain();
    (a.gain.setValueAtTime(s ? 0.08 : 0.05, e),
      a.gain.exponentialRampToValueAtTime(1e-4, e + (s ? 0.12 : 0.03)),
      r.connect(o),
      o.connect(a),
      a.connect(t),
      r.start(e),
      r.stop(e + (s ? 0.14 : 0.04)));
  }
}
const fr = Ll("geometry-wars-3d-v2");
class Sg {
  constructor(e, t) {
    ((this.input = Cl()),
      (this.paused = !1),
      (this.muted = !1),
      (this.audio = new Mg()),
      (this.audioStarted = !1),
      (this.stopped = !1),
      (this.shownGameOver = !1),
      (this.hud = t));
    const n = Zr(fr);
    ((this.world = n.world),
      (this.systems = n.systems),
      (this.renderer = new xg(e, fr)),
      this.input.setMouseAimResolver((x, y, playerPos) => this.renderer.screenToArenaAim(x, y, playerPos)),
      this.input.attach(e),
      this.updateMuteIcon(),
      (this.runTime = 0),
      (this.loop = wl(
        {
          step: (s) => this.step(s),
          render: () => (
            this.renderer.update(this.world, this.systems),
            this.renderer.render(),
            !this.stopped
          )
        },
        fe.fixedStep,
        fe.maxSubsteps
      )));
  }
  start() {
    ((this.paused = !0),
      this.loop.start(),
      this.showOverlay("GEOMETRY WARS 3D", ""),
      (this._begin = () => {
        if (this._began) return;
        this._began = !0;
        ((this.runTime = 0),
          GWLB.hideAll(),
          (this.paused = !1),
          this.hideOverlay(),
          this.startAudio());
      }),
      (this._began = !1),
      GWLB.bind(this),
      GWLB.showMenu());
  }
  step(e) {
    if (!this._began) return;
    const t = this.input.snapshot(this.world.player.pos);
    GWLB.blocking() && ((t.pause = !1), (t.mute = !1), (t.restart = !1));
    if (
      (t.pause && (this.paused = !this.paused),
      t.mute && this.toggleMute(),
      t.restart && this.restart(),
      !this.audioStarted &&
        (t.firing || t.moveX || t.moveZ || t.boost || t.restart) &&
        this.startAudio(),
      this.paused)
    )
      return;
    this.world.gameOver || (this.runTime += e);
    const s = xc(this.world, this.systems, t, e);
    if (s.some((event) => event.type === "hit-player")) this.flashDamage();
    this.audioStarted && this.audio.setBossMode(!!(this.world.boss && !this.world.boss.dead));
    if ((this.updateHud(), this.audioStarted && !this.muted)) {
      const r = this.world.player.pos.x,
        o = this.world.arenaRadius;
      this.audio.playEvents(s, r, o);
    }
    this.world.gameOver &&
      !this.shownGameOver &&
      ((this.shownGameOver = !0),
        this.showOverlay("GAME OVER", ""),
        GWLB.onGameOver(this.world.player.score, this.runTime));
  }
  flashDamage() {
    const el = this.hud.damageVignette;
    if (!el) return;
    el.classList.remove("flash");
    void el.offsetWidth;
    el.classList.add("flash");
  }
  playerBulletCount() {
    let e = 0;
    for (const t of this.world.bullets) t.owner === "player" && e++;
    return e;
  }
  toggleMute() {
    ((this.muted = !this.muted), this.audio.setMuted(this.muted), this.updateMuteIcon());
  }
  updateMuteIcon() {
    ((this.hud.mute.textContent = this.muted ? "🔇" : "🔊"),
      (this.hud.mute.style.opacity = this.muted ? "1" : "0.5"));
  }
  startAudio() {
    ((this.audioStarted = !0), this.audio.resume().catch(() => {}));
  }
  restart() {
    const e = Zr(fr + Math.floor(Math.random() * 1e9));
    ((this.world = e.world),
      (this.systems = e.systems),
      (this.shownGameOver = !1),
      (this.paused = !1),
      (this.runTime = 0),
      GWLB.hideAll(),
      this.hideOverlay(),
      this.audioStarted && !this.muted && this.audio.playMultiplierUp(3));
  }
  updateHud() {
    const p = this.world.player;
    (
      (this.hud.score.textContent = p.score.toLocaleString()),
      (this.hud.multiplier.textContent = "×" + p.multiplier),
      (this.hud.hp.textContent = Math.max(0, Math.ceil(p.hp)) + ""),
      (this.hud.wave.textContent = "W" + this.systems.spawn.wave)
    );
    const e = this.systems.score.multiplierPulse;
    this.hud.multiplier.style.transform = `scale(${1 + e * 0.4})`;
    if (this.hud.energyFill) {
      const pct = Math.min(100, (p.energy / fe.player.maxEnergy) * 100);
      this.hud.energyFill.style.width = pct + "%";
      const full = p.energy >= fe.player.skillCost - 0.01;
      (this.hud.energyFill.style.opacity = full ? "1" : "0.65"),
        this.hud.energyWrap.classList.toggle("ready", full);
    }
    if (this.hud.primaryWeapon) this.hud.primaryWeapon.textContent = "MAIN BLASTER · ALWAYS";
    if (this.hud.secondaryWeapon) {
      const secondary = WEAPON_DROP_ORDER.includes(p.secondaryWeapon) ? p.secondaryWeapon : null;
      this.hud.secondaryWeapon.textContent = secondary ? `SUB ${WEAPON_NAMES[secondary]} · LV${p.weaponLevels[secondary]}` : "SUB EMPTY";
      this.hud.secondaryWeapon.style.opacity = secondary ? "1" : "0.46";
    }
    if (this.hud.lives) this.hud.lives.textContent = "♥".repeat(Math.max(0, p.lives));
    if (this.hud.bossBar) {
      const b = this.world.boss;
      if (b && !b.dead) {
        (this.hud.bossBar.style.display = "flex"),
          (this.hud.bossFill.style.width = Math.max(0, (b.hp / b.maxHp) * 100) + "%"),
          (this.hud.bossLabel.textContent = b.bossType === "big" ? "⚠ MEGA BOSS" : "⚠ MINI BOSS");
      } else this.hud.bossBar.style.display = "none";
    }
    if (this.hud.bossTimer) {
      const b = this.world.boss;
      if (b && !b.dead) {
        this.hud.bossTimer.style.display = "none";
      } else {
        const sp = this.systems.spawn;
        const max = sp.bossTimerMax || fe.boss.firstDelay;
        const t = Math.max(0, sp.bossTimer);
        const frac = Math.max(0, Math.min(1, 1 - t / max));
        this.hud.bossTimer.style.display = "flex";
        this.hud.bossTimerFill.style.width = (frac * 100) + "%";
        this.hud.bossTimerLabel.textContent = "Next Boss " + Math.ceil(t) + "s";
        this.hud.bossTimerFill.style.background =
          frac > 0.7 ? "linear-gradient(90deg, #ff2bd6, #ff3a4a)" :
          frac > 0.4 ? "linear-gradient(90deg, #ff7733, #ff8a3a)" :
          "linear-gradient(90deg, #39e0ff, #4af0ff)";
      }
    }
  }
  showOverlay(e, t) {
    ((this.hud.overlay.style.display = "flex"),
      (this.hud.title.textContent = e),
      (this.hud.hint.textContent = t));
  }
  hideOverlay() {
    this.hud.overlay.style.display = "none";
  }
  dispose() {
    ((this.stopped = !0),
      this.loop.stop(),
      this.input.detach(),
      this.renderer.dispose(),
      this.audio.dispose());
  }
}
const GWLB = (() => {
  const SB_URL = "https://jxmwakjhfmgcdfvwdbmr.supabase.co";
  const SB_ANON =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4bXdha2poZm1nY2RmdndkYm1yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM1NjM2MDUsImV4cCI6MjA5OTEzOTYwNX0.rlUu89d4BT3UYWsrsM8y8GDFYPIk8WRE97Z2LxVRQL8";
  const HDRS = { apikey: SB_ANON, Authorization: "Bearer " + SB_ANON };
  const $ = (id) => document.getElementById(id);
  let game = null,
    submitted = false,
    lastRun = null,
    myEntry = null;
  function fmtTime(s) {
    const m = Math.floor(s / 60),
      r = Math.floor(s % 60);
    return m + ":" + String(r).padStart(2, "0");
  }
  function cleanName(v) {
    return String(v || "").replace(/[\u0000-\u001F]/g, " ").trim().slice(0, 12);
  }
  function cleanComment(v) {
    return Array.from(String(v || ""))
      .filter((c) => c.charCodeAt(0) >= 32)
      .join("")
      .trim()
      .slice(0, 40);
  }
  const GW_BAD = [
    "시발", "씨발", "씨팔", "시팔", "씨빨", "시벌", "씨벌", "슈발", "쉬발", "씨바",
    "병신", "븅신", "빙신", "등신", "지랄", "존나", "존만", "좆", "좃", "씹",
    "개새", "새끼", "색기", "새키", "니미", "니애미", "느금", "앰창", "엠창",
    "썅", "호로", "후레", "자지", "보지", "걸레년", "창녀", "창놈", "미친놈", "미친년",
    "개년", "개놈", "개좆", "또라이", "돌아이", "뒤져라", "뒈져",
    "ㅅㅂ", "ㅆㅂ", "ㅂㅅ", "ㅈㄹ", "ㅈㄴ", "ㄴㄱㅁ", "ㅆㅅㄲ",
    "fuck", "fck", "fuk", "fcuk", "fvck", "shit", "bitch", "btch", "cunt", "nigg",
    "faggot", "fag", "asshole", "ashole", "whore", "slut", "retard", "dick",
    "cock", "pussy", "pusy", "motherfuck", "mofo", "bastard", "twat", "wanker", "jerkoff"
  ];
  function isProfane(v) {
    const raw = String(v || "").toLowerCase();
    const leet = { "1": "i", "!": "i", "3": "e", "4": "a", "@": "a", "0": "o", "$": "s", "5": "s", "7": "t", "8": "b" };
    const en = raw.replace(/[!@$0-9]/g, (c) => leet[c] || "").replace(/[^a-z]/g, "");
    const enC = en.replace(/(.)\1+/g, "$1");
    const ko = raw.replace(/[^가-힣ㄱ-ㅎㅏ-ㅣ]/g, "");
    return GW_BAD.some((w) => en.includes(w) || enC.includes(w) || ko.includes(w));
  }
  async function fetchTop() {
    const r = await fetch(
      SB_URL + "/rest/v1/gw_leaderboard?select=name,score,playtime_s,comment&order=score.desc&limit=100",
      { headers: HDRS }
    );
    if (!r.ok) throw new Error("read " + r.status);
    return r.json();
  }
  async function fetchRank(score) {
    const r = await fetch(
      SB_URL + "/rest/v1/gw_leaderboard?select=id&score=gt." + Math.floor(score),
      { headers: { ...HDRS, Prefer: "count=exact", Range: "0-0" } }
    );
    if (!r.ok) throw new Error("rank " + r.status);
    const total = parseInt((r.headers.get("content-range") || "").split("/")[1], 10);
    return Number.isFinite(total) ? total + 1 : null;
  }
  async function submitScore(name, score, timeS, comment) {
    const body = {
      name: cleanName(name) || "AAA",
      score: Math.max(0, Math.min(2147483647, Math.floor(score || 0))),
      playtime_s: Math.max(0, Math.min(2147483647, Math.floor(timeS || 0)))
    };
    const cm = cleanComment(comment);
    if (cm) body.comment = cm;
    const r = await fetch(SB_URL + "/rest/v1/gw_leaderboard", {
      method: "POST",
      headers: { ...HDRS, "Content-Type": "application/json", Prefer: "return=minimal" },
      body: JSON.stringify(body)
    });
    if (!r.ok) throw new Error("submit " + r.status);
    return body;
  }
  async function renderBoard(highlight) {
    const list = $("gw-board-list"),
      msg = $("gw-board-msg");
    list.innerHTML = "";
    msg.textContent = "LOADING…";
    try {
      const rows = await fetchTop();
      msg.textContent = rows.length ? "" : "NO SCORES YET — BE THE FIRST!";
      let mine = false;
      rows.forEach((row, i) => {
        const li = document.createElement("li");
        if (highlight && !mine && row.name === highlight.name && row.score === highlight.score) {
          li.className = "gw-me";
          mine = true;
        }
        li.innerHTML =
          '<span class="gw-rank">' +
          (i + 1) +
          '</span><span class="gw-nm"></span><span class="gw-cm"></span><span class="gw-sc">' +
          Number(row.score).toLocaleString() +
          '</span><span class="gw-tm">' +
          fmtTime(row.playtime_s || 0) +
          "</span>";
        li.querySelector(".gw-nm").textContent = row.name;
        if (row.comment) {
          const cm = li.querySelector(".gw-cm");
          cm.textContent = "“" + row.comment + "”";
          cm.title = row.comment;
        }
        list.appendChild(li);
      });
      if (highlight && !mine) {
        try {
          const rank = await fetchRank(highlight.score);
          if (rank) msg.textContent = "YOUR RANK: #" + rank;
        } catch (_) {}
      }
    } catch (_) {
      const best = +localStorage.getItem("gw_best") || 0;
      msg.textContent = "⚠ RANKING OFFLINE" + (best ? " · LOCAL BEST " + best.toLocaleString() : "");
    }
  }
  function show(el, on) {
    el.style.display = on ? "flex" : "none";
  }
  function showMenu() {
    ((myEntry = null), show($("gw-menu"), true), show($("gw-gameover"), false), show($("gw-board"), false));
    $("overlay-hint").textContent = "WASD Move · Mouse Aim · Touch OK";
  }
  function showBoard(from) {
    (show($("gw-menu"), false), show($("gw-board"), true));
    $("gw-board-close").style.display = from === "menu" ? "" : "none";
    renderBoard(myEntry);
  }
  function onGameOver(score, timeS) {
    ((submitted = false),
      (lastRun = { score: Math.floor(score || 0), timeS: Math.floor(timeS || 0) }),
      (myEntry = null));
    const best = +localStorage.getItem("gw_best") || 0;
    if (lastRun.score > best) localStorage.setItem("gw_best", String(lastRun.score));
    $("gw-final").textContent = "SCORE " + lastRun.score.toLocaleString() + " · TIME " + fmtTime(lastRun.timeS);
    $("gw-name").value = cleanName(localStorage.getItem("gw_name") || "");
    $("gw-comment").value = "";
    $("gw-entry").style.display = "flex";
    $("gw-entry-msg").textContent = "";
    $("gw-submit-btn").disabled = false;
    (show($("gw-menu"), false), show($("gw-board"), false), show($("gw-gameover"), true));
    $("overlay-hint").textContent = "";
  }
  async function doSubmit() {
    if (submitted || !lastRun) return;
    const btn = $("gw-submit-btn"),
      msg = $("gw-entry-msg");
    const name = cleanName($("gw-name").value);
    const comment = cleanComment($("gw-comment").value);
    if (!name) {
      msg.textContent = "ENTER YOUR NAME";
      $("gw-name").focus();
      return;
    }
    if (isProfane(name) || isProfane(comment)) {
      msg.textContent = "🚫 KEEP IT CLEAN!";
      return;
    }
    ((btn.disabled = true), (msg.textContent = "SUBMITTING…"));
    try {
      const body = await submitScore(name, lastRun.score, lastRun.timeS, comment);
      ((submitted = true), (myEntry = body));
      localStorage.setItem("gw_name", body.name);
      ((msg.textContent = ""), ($("gw-entry").style.display = "none"), $("gw-name").blur());
      showBoard();
      show($("gw-gameover"), true);
    } catch (err) {
      const blocked = /submit 4/.test(String(err && err.message));
      ((btn.disabled = false),
        (msg.textContent = blocked ? "🚫 BLOCKED — TRY NICER WORDS" : "⚠ SUBMIT FAILED — TAP TO RETRY"));
    }
  }
  function blocking() {
    const a = document.activeElement;
    return a === $("gw-name") || a === $("gw-comment");
  }
  function hideAll() {
    if (blocking()) document.activeElement.blur();
    (show($("gw-menu"), false), show($("gw-gameover"), false), show($("gw-board"), false));
  }
  function bind(g) {
    if (game) return;
    game = g;
    $("gw-start-btn").addEventListener("click", () => game._begin && game._begin());
    $("gw-board-btn").addEventListener("click", () => showBoard("menu"));
    $("gw-board-close").addEventListener("click", () => showMenu());
    $("gw-restart-btn").addEventListener("click", () => game.restart());
    $("gw-submit-btn").addEventListener("click", doSubmit);
    for (const fid of ["gw-name", "gw-comment"]) {
      $(fid).addEventListener("keydown", (ev) => {
        ev.stopPropagation();
        if (ev.key === "Enter") {
          ev.preventDefault();
          doSubmit();
        }
      });
      $(fid).addEventListener("keyup", (ev) => ev.stopPropagation());
    }
  }
  return { bind, showMenu, showBoard, onGameOver, hideAll, blocking };
})();
function yg() {
  const i = document.getElementById("app"),
    e = {
      score: document.getElementById("hud-score"),
      multiplier: document.getElementById("hud-mult"),
      hp: document.getElementById("hud-hp"),
      wave: document.getElementById("hud-wave"),
      overlay: document.getElementById("overlay"),
      title: document.getElementById("overlay-title"),
      hint: document.getElementById("overlay-hint"),
      mute: document.getElementById("hud-mute"),
      energyWrap: document.getElementById("hud-energy"),
      energyFill: document.getElementById("hud-energy-fill"),
      weapon: document.getElementById("hud-weapon"),
      primaryWeapon: document.getElementById("hud-primary"),
      secondaryWeapon: document.getElementById("hud-secondary"),
      lives: document.getElementById("hud-lives"),
      bossBar: document.getElementById("hud-boss"),
      bossFill: document.getElementById("hud-boss-fill"),
      bossLabel: document.getElementById("hud-boss-label"),
      bossTimer: document.getElementById("hud-bosstimer"),
      bossTimerFill: document.getElementById("hud-bosstimer-fill"),
      bossTimerLabel: document.getElementById("hud-bosstimer-label"),
      damageVignette: document.getElementById("damage-vignette")
    },
    t = new Sg(i, e);
  (t.start(), (window.__game = t));
}
yg();
