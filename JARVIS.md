---
project: geometry_wars_3d_v2
updated: 2026-07-10T05:40:48+00:00
---
# JARVIS.md — geometry_wars_3d_v2

## NOW — Current Active Task
- 2026-07-10 Status: standalone 라이트닝 추가 굵기·불규칙 지그재그 강화 완료.
- 피해/사거리/연쇄 수/0.24초 수명/1024 인스턴스 풀은 유지하면서 경로를 broadKick+sharpJitter에 절마다 좌우가 바뀌는 최소 0.82 crossSign 굴절을 합성하도록 변경해 특정 시드에서도 직선처럼 펴지지 않음.
- 3중 튜브 굵기: 주 방전 corona/body/core 5.6/3.1/1.22, branch 3.35/1.85/0.72, impact flash 4.3/2.45/1.02.
- `.tmp/weapon_system_probe.mjs`가 실제 주 방전 좌표에서 횡편차 >= 0.75와 좌우 방향 전환 >= 2를 검증함.
- 변경: `geometry_wars_3d_glm5_2.html`, `.tmp/weapon_system_probe.mjs`; 백업 `geometry_wars_3d_glm5_2.html.bak29`.
- 검증: inline module `node --check`, weapon/item-label/pickup-stress/item-magnet/wobble-golem/heart-wobble/aim-camera probes, `npm test` 115/115, `npm run build` 통과. 기존 500 kB 초과 chunk 경고만 유지. 브라우저 플레이테스트는 미실행.
Next: 실제 플레이에서 강화된 두께와 지그재그가 과하지 않고 충분히 전기처럼 보이는지 체감 확인한다.

## MAP — Project Map and Symbol Index
- Entry: src/main.ts -> Game orchestrator (boot() wires #app + HUD + AudioEngine). index.html at project root.
- Standalone playable artifact: `geometry_wars_3d_glm5_2.html`; backups through `geometry_wars_3d_glm5_2.html.bak27`.
- Standalone event tiers: `Lo` carries `eventTier`/`coupleEntities`; `fs` permits only singularity `localBlast`; `qr` owns heart/player-death tiers; `bossHit` owns boss-death tier.
- Standalone boss renderer: `_g.bossGroup` + `bossParts`; each update restores every part from `userData.basePosition/baseScale` before animation/death breakup; `Xt.bossPalette` maps mini blue and big magma; mega visual scale is mini scale × `Math.cbrt(2)` while gameplay radius stays unchanged.
- Standalone weapons: `PRIMARY_WEAPON` permanently fixes BLASTER as primary; `WEAPON_DROP_ORDER` contains MISSILE/LIGHTNING/LASER only; player owns `weaponLevels`, `secondaryWeapon`, independent cooldowns; `kl` always fires BLASTER plus the valid secondary; `fireWeaponSlot` implements blaster/homing missile/chain lightning/piercing laser.
- Standalone weapon drops: `fe.items.dropWeights` + `randomItemKind` centralize ordinary/boss random loot; effective ordinary weapon chance is 7.89%; `bossWeaponDrops` guarantees mini 2 and big 3 diverse special rewards through `nextWeaponDrop` reservation.
- Standalone weapon visuals: `_g.weaponFxInst` is a pooled 1024-segment renderer for missile trails, lightning arcs, and laser afterglow; `weaponEffects` is simulation-owned and pruned in `Jr`.
- Standalone item labels: `ITEM_LABELS`; `xg.syncItemLabels` projects item positions through shared `eventGroup` and live camera into `#item-label-layer`, keyed/cleaned by item id; weapon items append subtype names.
- Standalone input/aim: `Cl` captures pointer NDC; `xg.screenToArenaAim` performs camera-ray/eventGroup-local sphere intersection; `Sg.step` passes current player position into input snapshot.
- Standalone camera/render: `vg` fixed-offset camera + smoothed wheel zoom; `_g` entity renderer owns enemy hit colors, enemy-bullet trail instances, item ring instances.
- Sim (pure, no Three.js/DOM): src/sim/{world,player,enemy,bullet,particles}.ts + src/sim/enemyBehaviors.ts.
- Regression probes: `.tmp/weapon_system_probe.mjs`, `.tmp/item_label_probe.mjs`, `.tmp/wobble_golem_probe.cjs`, `.tmp/aim_camera_probe.mjs`, `.tmp/heart_wobble_probe.cjs`, `.tmp/item_magnet_probe.mjs`, `.tmp/pickup_stress_probe.mjs`.
- Tests: tests/ — 115 tests. Commands: `npm test`, `npm run build`, `npm run typecheck`.

## LAW — Learned Agent Warnings
- LAW-001: 결합 울렁임을 변경할 때 -> rigid transform은 공통 `eventGroup`에 한 번만 적용하고, `coupleEntities: true`는 singularity localBlast·heart loss·player death·boss death에만 허용하며 `ws`가 같은 `Uo` 표면 변위를 샘플링해야 함 -> `node .tmp/heart_wobble_probe.cjs`와 `node .tmp/wobble_golem_probe.cjs`.
- LAW-002: 하트 소진 또는 플레이어 사망 경로를 변경할 때 -> 하트 소진은 위치 보존+속도만 0+eventWobble 0.72, 최종 사망은 같은 위치의 death 파동+eventWobble 1이어야 하며 게임오버에서도 감쇠해야 함 -> 두 wobble probe.
- LAW-003: 적 처치 연출을 변경할 때 -> grunt/wanderer/dodger는 지면 impulse를 만들지 않고 singularity만 짧은 `localBlast` 결합 파동을 만들며 NOVA/일반 피격은 기존 grid-only 원칙을 유지함 -> `node .tmp/wobble_golem_probe.cjs`와 heart probe의 regularEntity 검사.
- LAW-004: 마우스 조준 또는 카메라 추적을 변경할 때 -> 화면 중심 2D 벡터를 조준으로 사용하지 말고 카메라 광선을 `eventGroup` 로컬 구면에 교차시켜 게임 XZ로 역변환하며, 카메라 추적 오프셋은 플레이어 중심 이격 방향에 따라 회전하지 않아야 함 -> `node .tmp/aim_camera_probe.mjs`.
- LAW-005: standalone 보스 외형을 변경할 때 -> gameplay boss AI/충돌 반경과 death snapshot을 유지하고 `bossGroup` 파트 계층에서 애니메이션하며, dispose에서 공유 geometry/material을 각각 한 번 정리해야 함 -> module `node --check`와 `wobble_golem_probe`.
- LAW-006: standalone 무기·탄환·드롭을 변경할 때 -> `PRIMARY_WEAPON` BLASTER는 항상 발사되고 WEAPON은 MISSILE/LIGHTNING/LASER 보조 슬롯만 교체·강화해야 하며, 일반/보스 랜덤 아이템은 `randomItemKind`와 `fe.items.dropWeights`를 공유하고 미니 2개·메가 3개 무기 보장 및 잠긴 subtype 중복 예약 방지를 유지해야 함. Piercing projectile은 `hitIds`, 무기 잔광은 `weaponFxInst` 풀과 `weaponEffects` 수명 정리를 사용 -> `node .tmp/weapon_system_probe.mjs`, module `node --check`, pickup stress probe.

## BAN — Forbidden Actions
- Format: `BAN-001: Never <action>; because <failure>; verify <check>`.
- Use for known-dangerous actions, not generic caution.

## HABIT — User and Project Preferences
- HABIT-001: When 화면 흔들림을 조정할 때, 작은 적 처치는 지면 무파동, 자폭형은 짧은 국소 지면+인접 캐릭터 파동, 하트 소진은 중간 강도, 플레이어·보스 사망은 전장 전체 최대 강도를 선호한다.
- HABIT-002: When 보스 외형을 설계할 때, 단순 구체보다 여러 도형이 결합·분리되고 코어/장갑/관절이 애니메이션되는 몬스터형 기하학 골렘을 선호한다.
- HABIT-003: When 미니/메가 보스를 시각적으로 구분할 때, 미니는 파란색 계열, 메가는 마그마색 계열을 선호하며 메가가 화면을 가득 채우지 않기를 원한다.
- HABIT-004: When 아이템 정보를 표시할 때, 아이템 위를 따라다니는 영어 라벨로 종류를 즉시 식별할 수 있기를 선호한다.
- HABIT-005: When 무기체계를 구성할 때, 기본 BLASTER는 획득 여부와 무관하게 항상 주무기로 발사하고 보조 슬롯은 호밍 미사일·체인 라이트닝·레이저 중 하나를 운용하며 같은 보조무기 중복 획득으로 Lv1→3 강화되는 방식을 선호한다.
- HABIT-006: When 라이트닝을 연출할 때, 가느다란 선보다 굵은 주 방전·갈라지는 전기 가지·강한 착탄 섬광이 한눈에 보이는 ‘콰광’ 타격감을 선호한다.

## WHY — Why History Yells (Decision Rationale)
- 머즘 플래시 제거 -> 발사 시마다 파티클이 터지면 화면이 산만함 -> kl()의 ic 호출 삭제 -> 트레이드오프: 화려함 감소, 가독성 증가.
- 보스 폭발 6배 -> 기존 보스 사망 임팩트 부족 -> 약 900 파티클 예약 -> 트레이드오프: 단발 GPU 급증.
- BGM 다크신스+보스 긴박 모드 -> 기존 108BPM 진행이 약함 -> Cm 기반 128BPM, 보스 142BPM -> 트레이드오프: 더 어둡고 공격적.
- 보스 3번 이후 급상승 -> 4번째부터 압박 증가 요구 -> HP/속도/탄막/간격 동시 스케일 -> 트레이드오프: 후반 난도 급상승.
- 멀미 완화 -> 지속 시야 변형이 가독성을 해침 -> FOV 62·롤 제거·일반 파동 grid-only -> 트레이드오프: 일상 충격 과장 감소.
- 사건 등급제 -> 모든 처치에 같은 지면 파동은 중요도와 가독성을 망침 -> 작은 적 무파동, singularity 국소 결합, heart 중간, player/boss death 최대 -> 트레이드오프: 일부 작은 처치의 물리감 감소.
- 기하학 골렘 -> 단일 구형 보스는 몬스터 실루엣과 상태 전달이 약함 -> 충돌/AI는 유지하고 14파트 계층 렌더와 상태 애니메이션 적용 -> 트레이드오프: 렌더 메시와 갱신 연산 소폭 증가.
- 메가 보스 체적 2배 제한 -> 기존 메가 골렘이 화면을 너무 많이 점유함 -> 미니 선형 스케일의 `Math.cbrt(2)`배로 렌더만 축소 -> 트레이드오프: 충돌 반경보다 외형이 작아 보일 수 있음.
- 보스 팔레트 분리 -> 크기 외에도 보스 등급을 즉시 구분해야 함 -> 미니 청색/시안, 메가 용암 주황/황색 -> 트레이드오프: 기존 보스 색상과의 연속성 감소.
- 기본총 상시+보조 3종 -> 특수무기 자동 장착이 기본총을 밀어내 초반/교전 난도를 과도하게 높임 -> BLASTER를 영구 주무기로 고정하고 MISSILE/LIGHTNING/LASER만 보조로 교체·강화 -> 트레이드오프: SHOTGUN과 두 특수무기 동시 장착 자유도 제거.
- 무기 효과 풀링 -> 번개 분절과 미사일 궤적을 매 발마다 Three 객체로 만들면 GC/드로콜이 증가 -> 1024 segment InstancedMesh 재사용 -> 트레이드오프: 효과 동시량이 1024개로 제한됨.
- 무기 드롭 상향+보스 보장 -> 기존 실효 2.75%와 보스 무기 0개 확률 약 45%가 새 무기를 거의 못 보게 함 -> 일반 7.89%, 미니 2개·메가 3개 특수무기 보장 -> 트레이드오프: 무기 해금·강화 속도가 빨라짐.

## OMM — Oh My Mistake (Failure Retrospectives)
### OMM-010: Item pickup config namespace must use `fe.items`, not render palette `Xt`
- Trigger: When editing item pickup visuals, pickup bursts, item colors, or `stepItems` in `geometry_wars_3d_glm5_2.html`.
- Mistake: Pickup burst used `Xt.items.colors[it.kind]`, but `Xt` is the render palette and has no `items` object. This caused `TypeError` on every item pickup, making the game appear frozen exactly when eating yellow/any item.
- Rule: Gameplay/config values come from `fe.*`; render palette values come from `Xt.*`. Never invent nested palette paths unless they exist in `Xt`.
- Required action: For any pickup change, grep for `Xt.items` and replace with `fe.items`; run a direct pickup probe that executes `stepItems/xc` with every item kind.
- Verify: `node .tmp/pickup_stress_probe.mjs`; `node --check .tmp/geometry_wars_3d_glm5_2_module.mjs`; `npm test`.

### OMM-011: Event wobble requires shared hierarchy and coupled surface sampling
- Trigger: When editing heart-loss revive, boss-death presentation, eventWobble, GridMesh, EntityRenderer, `Lo`, `Uo`, `ws`, or renderer scene parenting in `geometry_wars_3d_glm5_2.html`.
- Mistake: The grid mesh and entity group duplicated identical-looking rigid transform formulas, but entities still ignored the grid's local `Uo` vertex displacement. The old probe compared source strings only, so it passed while the player visibly detached from the moving ground.
- Rule: Rigid event transforms must live on one shared `eventGroup`; only death-event impulses may set `coupleEntities: true`; entity surface mapping must sample exactly those tagged impulses. Preserve player position on heart loss and clear velocity only.
- Required action: Inspect actual scene parenting plus local surface mapping, not just formula text. Confirm ordinary impulses remain grid-only and heart/boss death impulses are tagged.
- Verify: `node --check .tmp/geometry_wars_3d_glm5_2_ground_coupling_module.mjs`; `node .tmp/heart_wobble_probe.cjs`; `npm test`; `npm run build`.

### OMM-012: Reused boss parts must reset before death breakup
- Trigger: When editing `_g.bossGroup`, `bossPartList`, boss death disassembly, or any per-part scale/position/rotation animation.
- Mistake: Death echo called `part.scale.multiplyScalar(...)` every frame without restoring untouched parts. The first boss looked correct, but accumulated scales leaked into the reused hierarchy and made the second mini boss fill the screen.
- Rule: Restore every part from immutable `userData.basePosition/baseScale` and zero rotation once per update before applying live animation or death scatter; never let multiplicative transient transforms persist between frames or bosses.
- Required action: Keep the reset loop before the `deathProgress` block and ensure every newly added boss part stores authored transforms.
- Verify: `node .tmp/wobble_golem_probe.cjs`; inline-module `node --check`; defeat one mini boss and inspect the next mini boss visually.

## RAW — Raw Evidence Pointers
- 2026-07-09 request: 아이템 자석 강화. Changed `geometry_wars_3d_glm5_2.html`; backup bak14. Evidence: module syntax, item probe, 115 tests.
- 2026-07-10 request: 멀미 완화 및 하트/보스 사망 결합 파동 복원. Backups bak15-bak19. Evidence: heart wobble probe, syntax, tests, build.
- 2026-07-10 request: 마우스 조준·카메라·휠 줌·위협 시각 구분. Backup bak20. Evidence: aim/heart/item probes, 115 tests, build.
- 2026-07-10 request: 작은 적 지면 파동 제거, 자폭/하트/사망 사건 등급제, 기하학 골렘 보스. Backup bak21. Evidence: wobble/golem probes, module syntax, 115 tests, build.
- 2026-07-10 request: 메가 보스 축소, 미니 청색/메가 마그마색 팔레트. Changed standalone + wobble probe; backup bak22. Evidence: golem/size/palette probe, module syntax, 115 tests, build.
- 2026-07-10 request: 아이템 위 영어 추적 라벨. Changed standalone, added item label probe; backup bak23. Evidence: label/pickup/magnet/wobble probes, syntax, 115 tests, build.
- 2026-07-10 request: 두 번째 미니 보스가 화면 전체를 덮는 버그 수정. Changed standalone + golem probe; backup bak24. Evidence: golem probe, syntax, 115 tests, build.
- 2026-07-10 request: 5종 무기·2슬롯·Lv3 강화·전용 이펙트 구현. Changed standalone, added weapon probe, updated heart/golem probes; backup bak25. Evidence: weapon/all standalone probes, syntax, 115 tests, build.
- 2026-07-10 request: 무기가 거의 안 나오는 문제 수정. Changed standalone + weapon probe; backup bak26. New ordinary chance 7.89%, mini 2 and big 4 diverse weapons. Evidence: weapon/pickup/item-label/wobble/heart probes, syntax, 115 tests, build.
- 2026-07-10 request: 기본총을 항상 유지하고 호밍 미사일·레이저·라이트닝만 보조무기로 운용. Changed standalone + weapon/wobble/heart probes; backup bak27. New contract: BLASTER always primary, special secondary pool MISSILE/LIGHTNING/LASER, mini 2/big 3 guarantees, SHOTGUN removed. Evidence: `WEAPON_SYSTEM_OK`, `SECONDARY_POOL_CLEAN`, pickup/item-label/wobble/heart probes, module syntax, `npm test` 115 passed, `npm run build` passed with existing >500 kB warning.
- 2026-07-10 request: 라이트닝을 굵고 선명한 콰광 연출로 강화. Changed standalone + weapon probe; backup bak28. Evidence: 3-layer bolt/branch/flash checks, standalone regression probes, module syntax, 115 tests, build.
- 2026-07-10 request: 라이트닝을 조금 더 굵게 하고 직선적이지 않은 전기형 엇나감 강화. Changed standalone + weapon probe; backup bak29. Evidence: path lateral deviation >=0.75 and >=2 direction flips, all standalone probes, module syntax, `npm test` 115/115, build.

