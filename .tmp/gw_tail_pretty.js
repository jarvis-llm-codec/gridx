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
      s = Math.min(1.6, Il(e));
    for (let r = 0; r < t.length; r += 3) {
      const o = n[r],
        a = n[r + 1],
        l = n[r + 2],
        c = Pn.radius,
        h = Math.acos(Math.max(-1, Math.min(1, a / c))) / Pn.capHalfAngle,
        f = Math.atan2(l, o),
        p = Math.cos(f) * h,
        g = Math.sin(f) * h,
        _ = p * fe.worldBounds,
        m = g * fe.worldBounds,
        d = Uo(e, _, m),
        y = 1 / c;
      ((t[r] = o + o * y * d), (t[r + 1] = a + a * y * d), (t[r + 2] = l + l * y * d));
    }
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
      n = new R();
    for (let s = 0; s < t; s++) {
      const r = e[s];
      (ws(r.pos.x, r.pos.z, this.impulses, n), this.dummy.position.set(n.x, n.y + r.pos.y, n.z));
      const o = Math.max(0, Math.min(1, r.life / r.lifespan)),
        a = r.size * (0.5 + o * 0.8);
      (this.dummy.scale.set(a, a, a),
        this.dummy.rotation.set(r.life * 2, r.life * 1.3, 0),
        this.dummy.updateMatrix(),
        this.mesh.setMatrixAt(s, this.dummy.matrix),
        this.color.setHex(r.color));
      const l = o;
      (this.color.multiplyScalar(l), this.mesh.setColorAt(s, this.color));
    }
    for (let s = t; s < this.mesh.count; s++)
      (this.dummy.position.set(0, -9999, 0),
        this.dummy.scale.set(0, 0, 0),
        this.dummy.updateMatrix(),
        this.mesh.setMatrixAt(s, this.dummy.matrix));
    ((this.mesh.count = Math.max(this.mesh.count, t)),
      (this.mesh.instanceMatrix.needsUpdate = !0),
      this.mesh.instanceColor && (this.mesh.instanceColor.needsUpdate = !0));
  }
}
const Zn = (i) => new Ii({ color: i, blending: ii, depthWrite: !1 });
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
      (this.enemyBulletMat = Zn(0xff3a4a)),
      (this.enemyBulletInst = new $n(this.enemyBulletGeo, this.enemyBulletMat, 512)),
      this.enemyBulletInst.instanceMatrix.setUsage(Mr),
      (this.enemyBulletInst.frustumCulled = !1),
      (this.enemyBulletInst.count = 0),
      this.group.add(this.enemyBulletInst));
    ((this.itemGeo = new ys(0.5, 0)),
      (this.itemInst = new $n(this.itemGeo, Zn(16777215), 128)),
      this.itemInst.instanceMatrix.setUsage(Mr),
      (this.itemInst.frustumCulled = !1),
      (this.itemInst.count = 0),
      this.group.add(this.itemInst));
    ((this.bossGeo = new Br(1, 1)),
      (this.bossMat = Zn(16777215)),
      (this.bossMesh = new It(this.bossGeo, this.bossMat)),
      (this.bossMesh.visible = !1),
      this.group.add(this.bossMesh));
    this._col = new Ve();
  }
  setImpulses(e) {
    this.impulses = e;
  }
  update(e, t, n, s, items, boss) {
    const r = new R(),
      o = new R(),
      a = new R(),
      l = new R();
    (hr(e.pos.x, e.pos.z, this.impulses, r, o, a, l), this.playerMesh.position.copy(r));
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
      const m = g.kind === "singularity" && g.critical ? 1 + Math.sin(s * 20) * 0.2 : 1;
      (this.dummy.scale.setScalar(m),
        this.dummy.rotation.set(s * 1.5, s * 1.2, 0),
        this.dummy.updateMatrix(),
        this.enemyInst[g.kind].setMatrixAt(_, this.dummy.matrix));
    }
    for (const g of Object.keys(this.enemyInst))
      ((this.enemyInst[g].count = f[g]), (this.enemyInst[g].instanceMatrix.needsUpdate = !0));
    let p = 0;
    for (const g of n) {
      if (g.owner !== "player" || g.spent) continue;
      (hr(g.pos.x, g.pos.z, this.impulses, r, o, a, l), this.dummy.position.copy(r));
      const _ = new R(g.vel.x, 0, g.vel.z),
        m = new Je();
      (m.lookAt(new R(), _.clone().normalize(), l),
        this.dummy.quaternion.setFromRotationMatrix(m),
        this.dummy.scale.set(g.kind === "laser" ? 1.0 : g.kind === "spread" ? 0.8 : 1, 1, g.kind === "laser" ? 2.4 : 1),
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
    // enemy / boss bullets
    let ep = 0;
    for (const g of n) {
      if (g.owner === "player" || g.spent || g.life <= 0) continue;
      (hr(g.pos.x, g.pos.z, this.impulses, r, o, a, l), this.dummy.position.copy(r));
      const _ = new R(g.vel.x, 0, g.vel.z),
        m = new Je();
      (m.lookAt(new R(), _.clone().normalize(), l),
        this.dummy.quaternion.setFromRotationMatrix(m),
        this.dummy.scale.set(1, 1, 1),
        this.dummy.updateMatrix(),
        this.enemyBulletInst.setMatrixAt(ep++, this.dummy.matrix));
    }
    for (let q = ep; q < this.enemyBulletInst.count; q++) {
      this.dummy.position.set(0, -9999, 0);
      this.dummy.scale.set(0, 0, 0);
      this.dummy.updateMatrix();
      this.enemyBulletInst.setMatrixAt(q, this.dummy.matrix);
    }
    ((this.enemyBulletInst.count = Math.max(this.enemyBulletInst.count, ep)),
      (this.enemyBulletInst.instanceMatrix.needsUpdate = !0));
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
        this.itemInst.setColorAt(ip++, this._col));
    }
    for (let q = ip; q < this.itemInst.count; q++) {
      this.dummy.position.set(0, -9999, 0);
      this.dummy.scale.set(0, 0, 0);
      this.dummy.updateMatrix();
      this.itemInst.setMatrixAt(q, this.dummy.matrix);
    }
    ((this.itemInst.count = Math.max(this.itemInst.count, ip)),
      (this.itemInst.instanceMatrix.needsUpdate = !0),
      this.itemInst.instanceColor && (this.itemInst.instanceColor.needsUpdate = !0));
    // boss
    if (boss && !boss.dead) {
      (this.bossMesh.visible = !0,
        hr(boss.pos.x, boss.pos.z, this.impulses, r, o, a, l),
        this.bossMesh.position.copy(r),
        this.bossMesh.rotation.set(s * 0.8, s * 0.6, s * 0.4),
        this.bossMesh.scale.setScalar(boss.radius * (1 + Math.sin(s * 4) * 0.05)),
        this.bossMesh.material.color.setHex(boss.color),
        (this.bossMesh.material.opacity = boss.bossType === "big" ? 1 : 0.92));
    } else {
      this.bossMesh.visible = !1;
    }
  }
  dispose() {
    (this.playerMesh.geometry.dispose(), this.playerMesh.material.dispose());
    for (const e of Object.keys(this.enemyGeo))
      (this.enemyGeo[e].dispose(), this.enemyMats[e].dispose());
    (this.bulletGeo.dispose(), this.bulletMat.dispose());
    (this.enemyBulletGeo.dispose(), this.enemyBulletMat.dispose());
    (this.itemGeo.dispose(), this.itemInst.material.dispose());
    (this.bossGeo.dispose(), this.bossMat.dispose());
  }
}
class vg {
  constructor(e, t) {
    ((this.pos = new R(0, 30, 30)),
      (this.look = new R()),
      (this.fov = fe.camera.fovBase),
      (this.camera = new Dt(fe.camera.fovBase, e, 0.1, 600)),
      (this.shakeState = { trauma: 0, seed: t }),
      this.pos.set(0, 34, 30),
      this.camera.position.copy(this.pos),
      this.camera.lookAt(0, 0, 0));
  }
  setAspect(e) {
    ((this.camera.aspect = e), this.camera.updateProjectionMatrix());
  }
  get trauma() {
    return this.shakeState.trauma;
  }
  set trauma(e) {
    this.shakeState.trauma = e;
  }
  update(e, t, n, s, r) {
    const o = new R();
    ws(e.x, e.z, n, o);
    const a = Math.hypot(t.x, t.z),
      l = new R(e.x, 0, e.z).normalize().multiplyScalar(16),
      c = new R(o.x + l.x, o.y + 34, o.z + 30 + l.z),
      u = 1 - Math.exp(-6 * r);
    this.pos.lerp(c, u);
    const h = Iu.lerp(fe.camera.fovBase, fe.camera.fovBoost, Math.min(1, a / 26));
    ((this.fov += (h - this.fov) * (1 - Math.exp(-4 * r))),
      (this.camera.fov = this.fov),
      this.camera.updateProjectionMatrix(),
      this.look.lerp(o, u),
      (this.shakeState.trauma = this.trauma));
    const f = gc(this.shakeState, s);
    (this.camera.position.set(this.pos.x + f.x, this.pos.y + f.y, this.pos.z + f.z),
      this.camera.up.set(0, 1, 0),
      this.camera.lookAt(this.look.x + f.x, this.look.y + f.y, this.look.z + f.z),
      this.camera.rotateZ(f.roll));
  }
}
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
      (this.scene = new Vm()),
      (this.scene.fog = new Lr(Xt.bg, 0.012)),
      (this.camera = new vg(e.clientWidth / e.clientHeight, t)),
      (this.grid = new mg()),
      this.scene.add(this.grid.mesh),
      (this.particles = new gg()),
      this.scene.add(this.particles.mesh),
      (this.entities = new _g()),
      this.scene.add(this.entities.group),
      (this.composer = new hg(this.renderer)),
      this.composer.addPass(new fg(this.scene, this.camera.camera)),
      (this.bloom = new li(new oe(e.clientWidth, e.clientHeight), 1.4, 0.6, 0)),
      this.composer.addPass(this.bloom),
      window.addEventListener("resize", this.onResize));
  }
  update(e, t) {
    ((this.bloom.strength = 1.4 + t.score.multiplierPulse * 0.6),
      this.grid.update(e.impulses),
      this.particles.setImpulses(e.impulses),
      this.particles.update(e.particles),
      this.entities.setImpulses(e.impulses),
      this.entities.update(e.player, e.enemies, e.bullets, e.time, e.items, e.boss),
      (this.camera.trauma = e.trauma),
      this.camera.update(e.player.pos, e.player.vel, e.impulses, e.time, fe.fixedStep));
  }
  render() {
    this.composer.render();
  }
  dispose() {
    (window.removeEventListener("resize", this.onResize),
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
      (this.bpm = 108),
      (this.nextNoteTime = 0),
      (this.step16 = 0),
      (this.bar = 0),
      (this.schedulerTimer = null),
      (this.lookahead = 0.1),
      (this.tickMs = 25),
      (this.lastFire = -1 / 0),
      (this.lastSpawn = -1 / 0),
      (this.spawnAccum = 0),
      (this.chords = [
        [220, 261.63, 329.63],
        [174.61, 220, 261.63],
        [261.63, 329.63, 392],
        [196, 246.94, 293.66]
      ]));
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
    const s = this.time;
    if (s - this.lastFire < 0.06) return;
    this.lastFire = s;
    const r = this.makePanner(t),
      o = r ?? this.sfxBus;
    r && r.connect(this.sfxBus);
    const a = n.createOscillator();
    a.type = "sawtooth";
    const l = e === "spread" ? 900 : 1200;
    (a.frequency.setValueAtTime(l, s), a.frequency.exponentialRampToValueAtTime(300, s + 0.08));
    const c = n.createBiquadFilter();
    ((c.type = "lowpass"),
      c.frequency.setValueAtTime(3200, s),
      c.frequency.exponentialRampToValueAtTime(900, s + 0.08),
      (c.Q.value = 1.1));
    const u = n.createGain();
    (u.gain.setValueAtTime(1e-4, s),
      u.gain.exponentialRampToValueAtTime(e === "spread" ? 0.16 : 0.22, s + 0.004),
      u.gain.exponentialRampToValueAtTime(1e-4, s + 0.09),
      a.connect(c),
      c.connect(u),
      u.connect(o),
      a.start(s),
      a.stop(s + 0.1));
    const h = this.noiseSource();
    if (h) {
      const f = n.createBiquadFilter();
      ((f.type = "highpass"), (f.frequency.value = 2500));
      const p = n.createGain();
      (p.gain.setValueAtTime(0.18, s),
        p.gain.exponentialRampToValueAtTime(1e-4, s + 0.03),
        h.connect(f),
        f.connect(p),
        p.connect(o),
        h.start(s),
        h.stop(s + 0.04));
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
      a = o[0];
    (e % 4 === 0 && this.bassNote(a / 2, n, (60 / this.bpm) * 0.9, r, s),
      (e === 6 || e === 14) && this.bassNote(a / 2, n, (60 / this.bpm) * 0.3, r, s, 0.5));
    const l = o[e % o.length] * (e >= 8 ? 2 : 1);
    if ((this.arpNote(l, n, (60 / this.bpm / 4) * 0.9, r, s), e === 0)) {
      const c = (60 / this.bpm) * 4 * 0.98;
      for (const u of o) this.padNote(u, n, c, r, s);
    }
    (e % 4 === 0 && this.kick(n, r, s),
      (e === 4 || e === 12) && this.snare(n, r, s),
      e % 2 === 0 && this.hat(n, r, s, !1),
      e % 4 === 2 && this.hat(n, r, s, !0));
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
      this.input.attach(e),
      this.updateMuteIcon(),
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
      this.showOverlay("GEOMETRY WARS 3D", "Click or press any key to start"),
      (this._begin = () => {
        if (this._began) return;
        this._began = !0;
        (document.removeEventListener("keydown", this._begin),
          document.removeEventListener("pointerdown", this._begin),
          (this.paused = !1),
          this.hideOverlay(),
          this.startAudio());
      }),
      (this._began = !1),
      document.addEventListener("keydown", this._begin),
      document.addEventListener("pointerdown", this._begin));
  }
  step(e) {
    if (!this._began) return;
    const t = this.input.snapshot();
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
    const n = this.playerBulletCount(),
      s = xc(this.world, this.systems, t, e);
    if ((this.updateHud(), this.audioStarted && !this.muted)) {
      const r = this.world.player.pos.x,
        o = this.world.arenaRadius;
      this.audio.playEvents(s, r, o);
      const a = this.playerBulletCount() - n;
      if (a > 0) {
        const l = Math.max(-1, Math.min(1, t.aimX || this.world.player.aim.x));
        for (let c = 0; c < a; c++) this.audio.playFire("standard", l);
      }
    }
    this.world.gameOver &&
      !this.shownGameOver &&
      ((this.shownGameOver = !0), this.showOverlay("GAME OVER", "Press R to restart"));
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
    if (this.hud.weapon) this.hud.weapon.textContent = "WPN Lv" + p.weaponLevel;
    if (this.hud.lives) this.hud.lives.textContent = "♥".repeat(Math.max(0, p.lives));
    if (this.hud.bossBar) {
      const b = this.world.boss;
      if (b && !b.dead) {
        (this.hud.bossBar.style.display = "flex"),
          (this.hud.bossFill.style.width = Math.max(0, (b.hp / b.maxHp) * 100) + "%"),
          (this.hud.bossLabel.textContent = b.bossType === "big" ? "⚠ OMEGA CORE" : "⚠ MINI BOSS");
      } else this.hud.bossBar.style.display = "none";
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
      lives: document.getElementById("hud-lives"),
      bossBar: document.getElementById("hud-boss"),
      bossFill: document.getElementById("hud-boss-fill"),
      bossLabel: document.getElementById("hud-boss-label")
    },
    t = new Sg(i, e);
  (t.start(), (window.__game = t));
}
yg();
//# sourceMappingURL=index-C4VdzWQR.js.map
