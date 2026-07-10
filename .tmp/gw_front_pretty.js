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
      skillRadius: 7,
      maxWeaponLevel: 5,
      shieldTime: 5
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
      waveBudgetGrowth: 4,
      spawnRingPad: 2
    },
    particles: {
      perKill: 26,
      perBigKill: 60,
      maxParticles: 3e3,
      lifespan: 1.1,
      damping: 0.92,
      speed: 14
    },
    camera: {
      fovBase: 62,
      fovBoost: 78,
      traumaDecay: 1.4,
      shakeAmp: 1.6,
      rollAmp: 0.18,
      shakeLambda: 8
    },
    grid: { impulseStrength: 6 },
    items: {
      radius: 0.5,
      lifespan: 12,
      dropChance: 0.13,
      bossDropCount: 5,
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
      mini: {
        radius: 2.2,
        hp: 70,
        score: 5000,
        speed: 5,
        fireInterval: 1.1,
        bulletSpeed: 20,
        bulletLife: 3.5,
        bulletDamage: 14,
        color: 0xff7733
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
        color: 0xff2bd6
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
      sk = !1;
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
          bs = mkB("joy-btn4", "SKILL", () => {
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
      snapshot() {
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
          const U = Math.hypot(e, t);
          U > 0.001 && ((S.aimX = e / U), (S.aimZ = t / U));
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
    speed: n?.speed ?? 60
  }),
  Ul = (i, e) => {
    const t = [];
    for (const n of i) {
      const s = n.age + e;
      s >= n.lifespan || t.push({ ...n, age: s });
    }
    return t;
  },
  Do = (i) => {
    const e = i.age / i.lifespan,
      t = Math.max(0, 1 - e);
    return i.strength * t * t;
  },
  Uo = (i, e, t) => {
    let n = 0;
    for (const s of i) {
      const r = e - s.x,
        o = t - s.z,
        a = Math.hypot(r, o),
        l = s.age * s.speed,
        c = a - l;
      if (Math.abs(c) > s.wavelength * 2) continue;
      const u = (c / s.wavelength) * Math.PI * 2,
        h = Math.exp(-(c * c) / (2 * s.wavelength * s.wavelength)),
        f = Do(s) * h;
      n += Math.sin(u) * f;
    }
    return n;
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
    fireInterval: fe.player.fireInterval,
    boost: fe.player.maxBoost,
    alive: !0,
    invuln: fe.player.invulnTime,
    multiplier: 1,
    score: 0,
    energy: 0,
    weaponLevel: 1,
    lives: fe.player.maxLives,
    shield: 0
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
      (i.invuln = Math.max(0, i.invuln - t)),
      (i.energy = Math.min(s.maxEnergy, i.energy + s.energyRegen * t)),
      (i.shield = Math.max(0, i.shield - t)));
  },
  zl = (i, e) =>
    !e || !i.alive || i.fireCooldown > 0 ? !1 : ((i.fireCooldown = i.fireInterval), !0),
  qr = (i, e, t) =>
    !i.alive || i.invuln > 0
      ? !1
      : ((i.hp -= e),
        t.events.push({ type: "hit-player", pos: { ...i.pos }, damage: e }),
        i.hp <= 0
          ? i.lives > 0
            ? ((i.lives -= 1),
              (i.hp = i.maxHp),
              (i.alive = !0),
              (i.invuln = fe.player.shieldTime),
              (i.shield = fe.player.shieldTime),
              (i.weaponLevel = Math.max(1, i.weaponLevel - 1)),
              t.events.push({ type: "revive", pos: { ...i.pos } }),
              t.impulses.push(Lo(i.pos.x, i.pos.z, fe.grid.impulseStrength * 2)),
              !0)
            : ((i.hp = 0),
              (i.alive = !1),
              (t.gameOver = !0),
              t.events.push({
                type: "explode",
                pos: { ...i.pos },
                radius: 3,
                strength: 1.4,
                color: 3399167
              }),
              t.events.push({ type: "game-over", pos: { ...i.pos } }),
              t.impulses.push(Lo(i.pos.x, i.pos.z, fe.grid.impulseStrength * 2.5)),
              !0)
          : ((i.invuln = fe.player.invulnTime), !1));
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
      pierce
    };
    return (world.bullets.push(u), u);
  },
  kl = (i, e) => {
    const t = i.aim,
      bx = i.pos.x + t.x * (i.radius + 0.2),
      bz = i.pos.z + t.z * (i.radius + 0.2),
      lv = i.weaponLevel,
      px = -t.z,
      pz = t.x;
    const mk = (ox, oz, opts) => Fb("player", { x: bx + ox, y: 0, z: bz + oz }, t, e, opts);
    if (lv <= 1) mk(0, 0, {});
    else if (lv === 2) {
      mk(px * 0.25, pz * 0.25, {});
      mk(-px * 0.25, -pz * 0.25, {});
    } else if (lv === 3) {
      mk(0, 0, {});
      mk(px * 0.3, pz * 0.3, {});
      mk(-px * 0.3, -pz * 0.3, {});
    } else if (lv === 4) {
      for (let k = -2; k <= 2; k++) {
        const ang = k * 0.18,
          ca = Math.cos(ang),
          sa = Math.sin(ang),
          d = { x: t.x * ca - t.z * sa, z: t.x * sa + t.z * ca };
        Fb("player", { x: bx, y: 0, z: bz }, d, e, {
          kind: "spread",
          radius: 0.26,
          damage: 0.8,
          life: 0.9
        });
      }
    } else {
      Fb("player", { x: bx, y: 0, z: bz }, t, e, {
        kind: "laser",
        radius: 0.5,
        damage: 3,
        life: 1.4,
        speed: 60,
        pierce: !0
      });
      Fb("player", { x: bx + px * 0.3, y: 0, z: bz + pz * 0.3 }, t, e, { kind: "spread", damage: 1, life: 0.8 });
      Fb("player", { x: bx - px * 0.3, y: 0, z: bz - pz * 0.3 }, t, e, { kind: "spread", damage: 1, life: 0.8 });
    }
  },
  fireSkill = (world, sys) => {
    const i = world.player,
      r = fe.player.skillRadius;
    world.events.push({ type: "skill", pos: { ...i.pos }, radius: r, color: 1703935 });
    world.impulses.push(Lo(i.pos.x, i.pos.z, fe.grid.impulseStrength * 4));
    ic(i.pos, fe.particles.perBigKill * 2, 1703935, world);
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
  Wl = (i, e) => {
    ((i.pos.x += i.vel.x * e), (i.pos.z += i.vel.z * e), (i.life -= e));
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
  Io = (i, e) => ((i.hp -= e), i.hp <= 0 ? ((i.hp = 0), (i.dead = !0), !0) : !1),
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
  makeItem = (kind, pos, world) => {
    const colors = fe.items.colors;
    return {
      id: Yl(),
      tag: "item",
      kind,
      pos: { ...pos },
      vel: { x: 0, y: 0, z: 0 },
      radius: fe.items.radius,
      life: fe.items.lifespan,
      bob: world.rng.next() * Math.PI * 2,
      color: colors[kind],
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
    if (p.alive) {
      for (const it of world.items) {
        if (it.dead) continue;
        if (Math.hypot(it.pos.x - p.pos.x, it.pos.z - p.pos.z) <= p.radius + it.radius + 0.5) {
          it.dead = !0;
          applyItem(p, it.kind, world);
          world.events.push({ type: "pickup", pos: { ...it.pos }, kind: it.kind });
        }
      }
    }
    world.items = world.items.filter((it) => !it.dead);
  },
  applyItem = (p, kind, world) => {
    switch (kind) {
      case "heal":
        p.hp = Math.min(p.maxHp, p.hp + 30);
        break;
      case "boost":
        p.boost = fe.player.maxBoost;
        break;
      case "weapon":
        p.weaponLevel = Math.min(fe.player.maxWeaponLevel, p.weaponLevel + 1);
        break;
      case "life":
        p.lives = p.lives + 1;
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
  bossForWave = (wave) =>
    wave % 10 === 0 ? "big" : wave % 10 === fe.boss.miniWave ? "mini" : null,
  makeBoss = (type, world) => {
    const b = fe.boss[type],
      e = Kl("singularity", { x: 0, y: 0, z: 0 }, world);
    e.kind = "boss";
    e.bossType = type;
    e.radius = b.radius;
    e.hp = b.hp;
    e.maxHp = b.hp;
    e.score = b.score;
    e.speed = b.speed;
    e.color = b.color;
    e.fireCooldown = 1.6;
    e.fireInterval = b.fireInterval;
    e.bulletSpeed = b.bulletSpeed;
    e.bulletLife = b.bulletLife;
    e.bulletDamage = b.bulletDamage;
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
        n = b.bossType === "big" ? 14 : 10;
      if (b.bossType === "big" && Math.floor(b.behaviorTimer) % 2 === 0) {
        for (let i = -1; i <= 1; i++) {
          const ang = i * 0.16,
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
    world.events.push({ type: "boss-hit", pos: { ...b.pos } });
    if (b.hp <= 0) {
      b.hp = 0;
      b.dead = !0;
      world.player.score += b.score;
      world.player.energy = fe.player.maxEnergy;
      ic(b.pos, fe.particles.perBigKill * 3, b.color, world);
      world.impulses.push(Lo(b.pos.x, b.pos.z, fe.grid.impulseStrength * 4));
      sys.shake = pc(sys.shake, 1);
      world.trauma = 1;
      world.events.push({ type: "boss-dead", pos: { ...b.pos }, score: b.score });
      for (let i = 0; i < fe.items.bossDropCount; i++) {
        const a = world.rng.next() * Math.PI * 2,
          r = world.rng.range(0, 3),
          kinds = Object.keys(fe.items.colors),
          k = world.rng.pick(kinds);
        world.items.push(makeItem(k, { x: b.pos.x + Math.cos(a) * r, y: 0, z: b.pos.z + Math.sin(a) * r }, world));
      }
      if (world.bossActiveWave) world.bossDefeatedWaves.add(world.bossActiveWave);
      world.boss = null;
      world.bossActiveWave = 0;
    }
  },
  Xt = {
    player: 3399167,
    enemyColor: { grunt: 16720486, wanderer: 16755234, singularity: 11158783, dodger: 4521881 },
    bulletColor: { standard: 8978431, spread: 6750156, laser: 1703935, enemy: 0xff3a4a },
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
      l = 0.16,
      c = 0.35;
    for (let u = 0; u < e && !(n.particles.length >= r.maxParticles); u++) {
      const h = n.rng.next() * Math.PI * 2,
        f = o * (0.4 + n.rng.next() * 0.6),
        p = (n.rng.next() - 0.5) * 2 * o * c,
        g = n.rng.chance(0.5) ? t : n.rng.pick(Xt.sparkPool);
      n.particles.push({
        id: nc(),
        tag: "particle",
        pos: { ...i },
        vel: { x: Math.cos(h) * f, y: p, z: Math.sin(h) * f },
        radius: l,
        life: a * (0.5 + n.rng.next() * 0.5),
        lifespan: a,
        damping: r.damping,
        color: g,
        size: l
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
  cc = () => ({ timer: 0, wave: 1, budget: fe.spawn.waveBudgetGrowth, killsThisWave: 0 }),
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
      if (((s -= Yr(e.wave)), i.enemies.length < n.maxAlive)) {
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
          wave: i.wave + 1,
          budget: i.wave * fe.spawn.waveBudgetGrowth + fe.spawn.waveBudgetGrowth,
          killsThisWave: 0,
          timer: i.timer
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
        trauma: 0,
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
    const r = t.kind === "singularity";
    if (
      (ic(t.pos, r ? fe.particles.perBigKill : fe.particles.perKill, n, i),
      i.impulses.push(Lo(t.pos.x, t.pos.z, fe.grid.impulseStrength * (r ? 2 : 1))),
      (e.shake = pc(e.shake, r ? 0.7 : 0.18)),
      (i.trauma = e.shake.trauma),
      (e.spawn.killsThisWave += 1),
      (e.spawn = fc(e.spawn, e.spawn.killsThisWave)),
      i.rng.chance(fe.items.dropChance))
    ) {
      const kinds = Object.keys(fe.items.colors),
        k = i.rng.pick(kinds);
      i.items.push(makeItem(k, { ...t.pos }, i));
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
  xc = (i, e, t, n) => {
    if (((i.events = []), i.gameOver)) return (Jr(i, n), i.events);
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
    // Boss spawn / step
    {
      const bt = bossForWave(e.spawn.wave);
      if (bt && !i.boss && !i.bossDefeatedWaves.has(e.spawn.wave)) {
        i.boss = makeBoss(bt, i);
        i.bossActiveWave = e.spawn.wave;
        i.events.push({ type: "boss-spawn", pos: { ...i.boss.pos }, bossType: bt });
      }
      if (i.boss && !i.boss.dead) stepBoss(i, e, n);
    }
    const r = i.bullets.filter((l) => l.owner === "player" && !l.spent);
    for (const l of i.enemies) {
      if (l.dead) continue;
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
    for (const l of i.bullets) Wl(l, n);
    const o = i.bullets.filter((l) => l.owner === "player" && !l.spent && l.life > 0),
      a = Kr(o, i.enemies, 4, (l, c) => l.tag === "bullet" && c.tag === "enemy");
    for (const { a: l, b: c } of a) {
      const u = l.tag === "bullet" ? l : c,
        h = l.tag === "enemy" ? l : c;
      u.spent ||
        h.dead ||
        ((u.pierce ? null : (u.spent = !0)), Io(h, u.damage) && fs(i, e, h));
    }
    // player bullets vs boss
    if (i.boss && !i.boss.dead) {
      for (const b of i.bullets) {
        if (b.owner !== "player" || b.spent || b.life <= 0) continue;
        if (Math.hypot(b.pos.x - i.boss.pos.x, b.pos.z - i.boss.pos.z) <= b.radius + i.boss.radius) {
          if (!b.pierce) b.spent = !0;
          bossHit(i.boss, b.damage, i, e);
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
      i.events
    );
  },
  Jr = (i, e) => {
    for (const t of i.particles) sc(t, e);
    ((i.particles = i.particles.filter((t) => t.life > 0)),
      (i.bullets = i.bullets.filter((t) => Xl(t, i.arenaRadius))),
      (i.enemies = i.enemies.filter((t) => !t.dead)),
      (i.impulses = Ul(i.impulses, e)));
  };
