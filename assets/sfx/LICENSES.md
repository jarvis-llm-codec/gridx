# SFX Candidates — Sources & Licenses

Downloaded 2026-07-10. 전부 **CC0** (public domain) — 크레딧 의무 없음 (예의상 README 크레딧 예정).

| Pack | Author | License | Files | Source |
|---|---|---|---|---|
| Sci-Fi Sounds (`Audio/`) | Kenney | **CC0** | 73 ogg — laser/explosion/impact/forceField/engine | https://kenney.nl/assets/sci-fi-sounds |
| Digital Audio (`digital/`) | Kenney | **CC0** | 60 ogg — powerUp/phaser/zap/pepSound | https://kenney.nl/assets/digital-audio |
| 100 CC0 SFX #2 (`sfx100/`) | rubberduck | **CC0** | 100 ogg — thunder 포함 | https://opengameart.org/content/100-cc0-sfx-2 |

## 가공본 (자비스, ffmpeg)
- `thunder_crack_short.ogg` (1.4s) / `thunder_crack_mid.ogg` (2.6s) — `sfx100v2_thunder_01.ogg`(5.3s)에서 앞 크랙만 페이드아웃 컷. CC0 원본의 파생물 = CC0.

## 이벤트 슬롯 매핑 (Jun 귀 판정 대기 — audition_sfx.html)
| 슬롯 | 게임 이벤트 | ★ 자비스 픽 |
|---|---|---|
| 1 | 발사 (연사) | laserRetro_000 or laserSmall_000 |
| 2 | 적 폭발 | explosionCrunch_000 |
| 3 | 빅킬/NOVA | lowFrequency_explosion_000 |
| 4 | 플레이어 피격 | impactMetal_000 |
| 5 | 아이템 픽업 | powerUp2 |
| 6 | 멀티플라이어 업 | phaserUp3 |
| 7 | 보스 등장 | forceField_000 |
| 8 | ⚡라이트닝 무기 | thunder_crack_short (Jun 특별 요청: "콰광") |

확정되면 선정본만 `assets/sfx/<event>.ogg`로 복사, candidates/는 레포 제외.

## ✅ 확정 (2026-07-10, Jun 귀 판정) — 스코프: 라이트닝 무기 발사음 1건만 교체
- **채택 = cand3a_hi_eq** → `assets/sfx/lightning.ogg`
- 원본: `hit.wav` (faxcorp, Electricity Game Sound Pack, **CC0**) — https://opengameart.org/content/electricity-game-sound-pack
- 가공: 앞 1.2s 컷 + 페이드아웃 + highshelf 5kHz +9dB (자비스, ffmpeg). CC0 파생물 = CC0.
- ⚠️ 나머지 효과음은 전부 기존 신스 유지 (Jun 명시). 8슬롯 교체안은 폐기.

## ✅ SFX 전면 확정 (2026-07-10 밤, Jun "올 B" 판정 — BGM 무거워져 신스가 안 어울림)
| 이벤트 | 파일 | 원본 | 출처 |
|---|---|---|---|
| 발사 | fire.ogg | laserSmall_000 | Kenney Sci-Fi (CC0) |
| 적 폭발 | explosion.ogg | explosionCrunch_000 | Kenney Sci-Fi (CC0) |
| 빅킬/NOVA | bigkill.ogg | lowFrequency_explosion_000 | Kenney Sci-Fi (CC0) |
| 피격 | hit.ogg | impactMetal_000 | Kenney Sci-Fi (CC0) |
| 픽업 | pickup.ogg | powerUp5 | Kenney Digital (CC0) |
| 멀티업 | multiplier.ogg | phaserUp5 | Kenney Digital (CC0) |
| 보스 등장 | boss.ogg | forceField_000 | Kenney Sci-Fi (CC0) |
| ⚡라이트닝 | lightning.ogg | (기확정, faxcorp CC0 가공) | — |
| 사망 대폭발 (보스/주인공) | death.ogg | deathboom.wav 앞 3.2s 페이드컷 | faxcorp Electricity (CC0) |
