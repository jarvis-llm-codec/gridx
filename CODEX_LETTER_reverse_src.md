# Codex 편지 — Geometry Wars 3D: 단일 HTML → src/ 역복원 캠페인

## 0. 미션 (한 줄)
살아있는 정본인 **단일 HTML**(`geometry_wars_3d_glm5_2.html`, ~658KB)을 **모듈러 TypeScript `src/`로 역복원**해서, `vite build`가 지금 게임과 **동작 동일(parity)** 한 산출물을 다시 뽑을 수 있게 만든다. 목적: GitHub 오픈소스 공개용 코드베이스.

## 1. 역사 — 왜 이 일이 필요한가
- 7/7~7/8: `src/`(TS+vite) 스캐폴드로 시작, HTML은 빌드 산출물이었다.
- **7/8 11:41 이후 src 동결.** 그 뒤 ~20회 반복(bak2~bak21)은 전부 **HTML 직접 수술**로 진행됨 (분해→패치→재조립 파이프라인, `.tmp/`에 도구 잔존).
- 그래서 지금: 무기 시스템·NOVA·보스 타이머·MEGA BOSS·스폰 케이던스·글로벌 랭킹(GWLB)은 **HTML에만 존재**. src는 3일 전 화석.
- **HTML이 유일한 ground truth다. src가 아니라.**

## 2. 자산 지도 (이미 있는 것들 — 재활용해라)
| 자산 | 위치 | 용도 |
|---|---|---|
| 정본 HTML | `geometry_wars_3d_glm5_2.html` | ground truth. 첫 작업 전에 `.bak_reverse_base`로 백업 떠라 |
| 분해 파이프라인 | `.tmp/gw_prefix.txt`, `gw_suffix.txt`, `gw_three.js`, `gw_module.js`, `gw_front.js`, `gw_tail.js`, `gw_assembled.html` | HTML = prefix + (three.js + 게임코드) + suffix 구조 분해 선례. 단, 7/8 기준이라 **재추출 필요** |
| 화석 src | `src/` (172KB) | **모듈 경계·네이밍·타입의 설계도.** core/(config·gameLoop·palette·types) input/ math/(rng·sphereMapping·vec3·wave) physics/collision render/(cameraController·entityRenderer·gridMesh·particleRenderer·project·renderer) sim/ systems/ audio/AudioEngine + main.ts |
| 테스트 | `tests/` + vitest 설정(vite.config.ts) + `.tmp_sim_harness.cjs` | 패리티 검증의 뼈대 |
| 진화 히스토리 | `*.bak` ~ `*.bak21` | 특정 기능이 언제 어떻게 들어왔는지 diff 고고학 가능 |
| 기능별 추출 모듈 | `.tmp/geometry_wars_3d_glm5_2_*_module.mjs` (weapon/boss/golem/wobble 등) | 과거 프로브들 — 기능 단위 경계 힌트 |

## 3. 최소화 식별자 대응표 (HTML 게임코드의 주요 심볼)
클래스/함수명만 뭉개졌고 **속성·메서드명은 살아있다** (`score`, `bossTimer`, `secondaryWeapon` 등).
| 최소화명 | 정체 (추정 근거 포함) | 화석 src 대응 |
|---|---|---|
| `Sg` | 게임 셸 클래스 (start/step/restart/updateHud/showOverlay) | main.ts의 Game/App 역할 |
| `Mg` | 오디오 엔진 | audio/AudioEngine.ts |
| `xg` | 렌더러 (update/render/screenToArenaAim/dispose) | render/renderer.ts |
| `wl` | 고정스텝 게임루프 팩토리 (step/render, fixedStep, maxSubsteps) | core/gameLoop.ts |
| `Zr` | 월드 팩토리 (seed → {world, systems}) | sim 계열 |
| `fr` | 시드/설정 상수 | core/config.ts |
| `fe` | 게임 설정 객체 (fe.fixedStep, fe.player.maxEnergy, fe.boss.firstDelay) | core/config.ts |
| `Cl` | 인풋 시스템 팩토리 (snapshot/attach/detach/setMouseAimResolver) | input/ |
| `xc` | 월드 스텝 함수 (world, systems, input, dt → events) | sim/systems 오케스트레이터 |
| `yg` | 부트스트랩 (DOM 바인딩 → new Sg) | main.ts |
| `GWLB` | 글로벌 랭킹 모듈 — **압축 안 된 가독 코드** (자비스 친작, 7/10) | 신규 `src/ui/leaderboard.ts`로 |
| `WEAPON_DROP_ORDER`, `WEAPON_NAMES` | 무기 시스템 상수 (가독명 생존) | 신규 sim/weapons 계열 |

## 4. 단계 계획 — 각 단계마다 검증 게이트. 게이트 통과 전 다음 단계 금지.
### Phase 0: 준비
- `git init` + 현 상태 전체 첫 커밋 (bak/.tmp 포함 — 복원 과정 자체를 히스토리로 남긴다. node_modules는 .gitignore 유지)
- 정본 HTML 백업: `geometry_wars_3d_glm5_2.html.bak_reverse_base`
- **게이트**: `git log` 1커밋, 백업 존재.

### Phase 1: 분해 (반나절 예상)
- 정본 HTML에서 3분할 재추출: ①HTML 셸(prefix/suffix) ②three.js 라이브러리부 ③게임 코드부(~140KB)
- three.js 버전 식별 (`REVISION` 상수 검색) → npm 의존성 버전 확정. **three.js는 복원 대상 아님 — 의존성으로 대체.**
- **게이트**: ③게임코드만 + `import * as THREE from 'three'` 치환으로 `node --check` 통과. 추출물 크기 보고.

### Phase 2: 패리티 하네스 먼저 (복원 전에!)
- `.tmp_sim_harness.cjs` 를 기반으로 **원본 게임코드의 시뮬 궤적 골든 파일** 생성: 고정 시드로 N스텝(예: 3판 × 3000스텝) 돌려 world 상태 스냅샷(플레이어 pos/hp/score, 적 수, 보스 상태, 스폰 카운트) 시퀀스를 JSON으로 덤프.
- 이게 이후 모든 복원의 채점기다. **복원 코드는 같은 시드에서 같은 궤적을 내야 한다.**
- **게이트**: 골든 JSON 존재 + 같은 입력 두 번 돌려 결정론(deterministic) 확인.

### Phase 3: 모듈 역이식 (본작업 — 가장 김)
- 순서: **math → core(config 전체 수치!) → sim → systems → physics → input → audio → render → ui(GWLB) → main.ts**
- 화석 src의 모듈 경계·네이밍을 따르되, **동작은 무조건 HTML 기준.** 화석과 충돌하면 화석을 버려라.
- **수치 튜닝값(fe 설정 객체 전체)은 1비트도 바꾸지 마라.** 게임 밸런스가 곧 제품이다.
- 리팩터링 유혹 금지: "더 나은 구조"보다 "같은 동작"이 이번 미션. 개선 아이디어는 `RESTORE_NOTES.md`에 적고 넘어가라.
- GWLB(랭킹)는 가독 코드니 그대로 `src/ui/leaderboard.ts`로 이식. **Supabase anon 키는 공개 설계**(RLS 보호)이므로 그대로 포함 — 단 상단 주석으로 "public client key, protected by RLS" 명시.
- 모듈 하나 이식할 때마다: `tsc --noEmit` 통과 + 해당 모듈 단위 테스트(vitest) 추가.
- **게이트**: 전 모듈 tsc clean + vitest 통과.

### Phase 4: 빌드 + 패리티 판정
- `vite build` 성공 → 빌드 산출물로 Phase 2 골든 궤적 재생 → **JSON diff = 0** (부동소수 허용오차 1e-9).
- 단일 파일 산출 경로 복구: `vite-plugin-singlefile` 추가, `build:single` 스크립트로 **배포용 자기완결 HTML** 재생산 (gh-pages 배포 파이프라인 유지용).
- **게이트**: ①패리티 diff 0 ②build:single 산출 HTML을 브라우저에서 열어 실플레이 스모크(시작버튼→플레이→게임오버→랭킹 표시) — 스모크는 Jun 눈확인으로 최종.

### Phase 5: 마감
- `README.restore.md`: 복원 방법론·패리티 증거·잔여 리스크 3줄 요약
- src 화석과 최종본의 구조 diff 요약 (뭐가 새로 생겼나: weapons, boss systems, GWLB 등)
- **게이트**: Jun + 자비스(왕 GAN) 리뷰.

## 5. 제약 / 하우스룰
- **배포는 건드리지 마라**: gh-pages, jarvis-code-release 레포, Supabase 전부 손대지 않는다. 이 폴더 안에서만 작업.
- 정본 HTML은 **읽기 전용으로 취급** (백업 후에도 수정 금지 — 복원 실패 시 유일한 진실이다).
- 커밋은 Phase 단위 + 모듈 단위로 잘게. 메시지 영어 `type(scope): description`.
- 상태 보고는 DONE(증거 첨부)/BLOCKED(원인+다음 액션)/NEEDS_CONTEXT만. "될 것 같다" 금지.
- 한 Phase 끝나기 전 다음 Phase 시작 금지 (Sequential Focus).
- 토큰/시간이 아깝다고 게이트를 건너뛰지 마라. 패리티 깨진 복원본은 0원짜리다.

## 6. 완료 기준 (최종 Acceptance)
1. `npm run build` + `npm run build:single` 성공
2. build:single 산출 HTML이 정본과 **시뮬 궤적 동일** (Phase 2 골든 기준, diff 0)
3. 실플레이 스모크: 시작 메뉴/플레이/무기 드랍/보스/NOVA/게임오버/랭킹 등록·표시 전부 동작 (Jun 확인)
4. `tsc --noEmit` clean, vitest 전체 통과
5. 정본 HTML 무손상 (해시 동일)

## 7. 예상 난관 (미리 알려줌)
- **렌더/셰이더부가 제일 지저분** — three.js 셰이더 청크 인라인이 섞여 있음. render/는 마지막에, 패리티는 시뮬 기준(렌더는 눈확인)으로 타협 가능.
- RNG: `Zr(fr + Math.floor(Math.random()*1e9))` 재시작 시드 구조 유지할 것 — 골든 궤적은 고정 시드 주입으로 우회.
- 이름 복원은 화석 src + 속성명으로 유추하되, 불확실하면 보수적으로 (`worldStep` 같은 서술명 OK, 창작 금지).

---
작업 폴더: `C:\jarvis_workspace\geometry_wars_3d_v2\`
끝나면 Phase별 결과 요약 + 패리티 증거 경로를 보고. 자비스가 왕 GAN 2차 리뷰 후 오픈소스 레포 구성으로 넘어간다.
