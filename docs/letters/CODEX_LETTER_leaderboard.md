# Codex 편지 — Geometry Wars 3D 글로벌 랭킹(Supabase) 붙이기

## 0. 미션 (한 줄)
게임오버 시 **이름 입력 → 점수·플레이시간을 Supabase에 제출 → TOP 20 랭킹 오버레이 표시**.
백엔드(테이블·정책·권한)는 **이미 만들고 REST로 실측 검증 완료**. 너는 프론트(단일 HTML)만 붙이면 된다.

## 1. 대상 파일 (단 하나)
`C:\jarvis_workspace\geometry_wars_3d_v2\geometry_wars_3d_glm5_2.html`
- **단일 자기완결 HTML**(약 6,800줄). 빌드 스텝 없음. 새 npm 의존성/외부 스크립트 추가 금지 — 전부 이 파일 안에 인라인.
- 배포는 GitHub Pages(`gh-pages` 브랜치)로 별도 처리하니 너는 **배포 신경 X**, 이 파일만 수정.
- 기존 게임 로직 깨지 마라. 추가는 기존 코드 스타일(vanilla JS) 그대로.

## 2. 백엔드 계약 (검증 완료 — 그대로 사용)
- **Project URL**: `https://jxmwakjhfmgcdfvwdbmr.supabase.co`
- **anon public key** (클라이언트 임베드 안전 — 공개용이며 RLS로 보호됨. 이 키를 HTML 상수로 박아라):
  ```
  eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4bXdha2poZm1nY2RmdndkYm1yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM1NjM2MDUsImV4cCI6MjA5OTEzOTYwNX0.rlUu89d4BT3UYWsrsM8y8GDFYPIk8WRE97Z2LxVRQL8
  ```
- **테이블 `public.gw_leaderboard`** 컬럼:
  | 컬럼 | 타입 | 제약 |
  |------|------|------|
  | `id` | bigint identity | PK (자동, INSERT 시 넣지 마라) |
  | `name` | text | **1~12자** (초과 시 서버가 400) |
  | `score` | int | **>= 0** |
  | `playtime_s` | int | **>= 0**, 기본 0 |
  | `created_at` | timestamptz | 자동 now() (넣지 마라) |

### 읽기 (TOP 20)
```
GET {URL}/rest/v1/gw_leaderboard?select=name,score,playtime_s,created_at&order=score.desc&limit=20
Headers: apikey: {ANON}   Authorization: Bearer {ANON}
```
→ 200, JSON 배열(점수 내림차순).

### 쓰기 (점수 제출)
```
POST {URL}/rest/v1/gw_leaderboard
Headers: apikey: {ANON}   Authorization: Bearer {ANON}
         Content-Type: application/json   Prefer: return=minimal
Body: {"name":"<=12자","score":<int>,"playtime_s":<int>}
```
→ 201 성공. (이름 12자 초과/score 음수면 400 — 제출 전에 클라에서 먼저 클램프.)

fetch 예시:
```js
const SB_URL = 'https://jxmwakjhfmgcdfvwdbmr.supabase.co';
const SB_ANON = '...위 키...';
const sbHeaders = { apikey: SB_ANON, Authorization: 'Bearer ' + SB_ANON };

async function fetchTop20() {
  const r = await fetch(`${SB_URL}/rest/v1/gw_leaderboard?select=name,score,playtime_s&order=score.desc&limit=20`,
                        { headers: sbHeaders });
  if (!r.ok) throw new Error('leaderboard read ' + r.status);
  return r.json();
}
async function submitScore(name, score, playtimeS) {
  const body = { name: String(name).slice(0,12) || 'AAA',
                 score: Math.max(0, Math.floor(score)),
                 playtime_s: Math.max(0, Math.floor(playtimeS)) };
  const r = await fetch(`${SB_URL}/rest/v1/gw_leaderboard`, {
    method: 'POST',
    headers: { ...sbHeaders, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
    body: JSON.stringify(body) });
  if (!r.ok) throw new Error('submit ' + r.status);
}
```

## 3. 기능 요구사항
1. **플레이시간**: 이미 경과시간 로직이 있음(파일 ~`5608`줄 `elapsed`/`running`). **새 타이머 만들지 말고 그 값을 초 단위로 재사용**해서 `playtime_s`로 제출.
2. **게임오버 → 이름 입력 UI**:
   - 게임오버 처리부(아래 §4 앵커)에 훅 추가.
   - 오버레이에 최종 점수 + **이름 입력**(최대 12자) + **[제출]** + **[건너뛰기]**.
   - 프리필: `localStorage`에 마지막 이름 저장/복원(다음판 자동 채움). 3글자 아케이드 스타일이든 자유 텍스트든 게임 네온 무드에 맞춰라.
   - **모바일 지원**: 이 게임 터치 컨트롤 있음. 이름 입력이 키보드+터치 둘 다 되게.
3. **제출**: `submitScore(name, finalScore, playtimeS)`. 성공하면 랭킹 다시 fetch해 갱신.
4. **TOP 20 랭킹표**: 오버레이에 순위/이름/점수/시간 표. 방금 낸 내 점수가 20위 안이면 **하이라이트**. 20위 밖이면 "네 순위: N위"라도 계산해 보여주면 베스트(선택).
5. **시작 화면에서도 보기**(선택, 여유되면): 시작 오버레이에 "🏆 LEADERBOARD" 토글로 TOP 20 미리보기.
6. **오프라인/실패 그레이스풀**:
   - fetch 실패해도 **게임/오버레이 절대 크래시 X**. "랭킹 서버 연결 실패" 문구 + 로컬 최고기록(localStorage) 폴백 표시.
   - 제출 실패 시 localStorage에 pending 저장했다가 다음 로드 때 재시도(선택, 하되 과하면 생략 가능).
7. **로컬 캐시**: 내 최고 점수 + 마지막 이름은 localStorage에도 저장(오프라인 폴백 + 프리필용).

## 4. 통합 앵커 (이 근처를 찾아 훅)
- **게임오버 처리/오버레이 표시**: `7296`~`7326`(`gameOver`/`GameOver`), 그리고 오버레이 DOM 조작 `7405`~`7407`(`getElementById("overlay...")`).
- **최종 점수 상태**: `score` state 다수 — `1307`,`1671`,`1887`(`score =`) 등. 게임오버 시점의 최종 score를 잡아라.
- **경과시간**: `~5608`(`elapsed`,`running`). 이걸 초로 변환해 playtime.
- **오버레이 마크업**: 파일 맨 끝 `<div id="overlay">`(제목 `#overlay-title`, 힌트 `#overlay-hint`) — 여기 확장하거나 별도 랭킹 패널 추가.
- 정확한 함수명/구조는 네가 파일 읽고 확정. 위는 시작점 힌트일 뿐.

## 5. 제약 / 주의
- 자기완결 HTML 유지(외부 CDN 스크립트 신규 추가 금지, fetch 호출은 OK — GitHub Pages는 CSP 제약 없음).
- 이름 **sanitize**: trim, 12자 클램프, 개행/제어문자 제거. 빈 이름이면 기본값(예 `AAA`).
- **anti-cheat는 최소**만: 점수는 클라 신뢰(anon이라 조작 가능 — 재미용, 감수). 명백히 말도 안 되는 점수(예: `Number.MAX_SAFE_INTEGER`)만 클라에서 컷.
- 게임오버당 **제출 1회**로 제한(중복 POST 방지 플래그).
- 성능: 랭킹 fetch는 게임오버/시작 화면에서만. 게임 루프 안에서 호출 금지.

## 6. 완료 기준 (Acceptance)
1. 게임오버 → 이름 입력 → 제출 시 네트워크 탭에 **POST 201**.
2. 오버레이에 TOP 20이 **점수 내림차순**으로 뜨고, 내 점수 하이라이트.
3. 새로고침/다른 기기에서 열어도 **같은 랭킹**이 보인다(전역 공유 확인).
4. 오프라인(네트워크 끊고) 상태에서 게임오버해도 **크래시 없이** 폴백 문구 + 로컬기록.
5. 이름 13자 넣어도 클라가 12자로 잘라 제출(서버 400 안 나게).
6. 기존 게임플레이/컨트롤 회귀 없음.

검증용 curl(구현 후 손으로도 확인 가능):
```bash
# 읽기
curl -s "https://jxmwakjhfmgcdfvwdbmr.supabase.co/rest/v1/gw_leaderboard?select=name,score,playtime_s&order=score.desc&limit=20" \
 -H "apikey: <ANON>" -H "Authorization: Bearer <ANON>"
```

## 7. 작업 후
- 이 파일만 수정해서 저장. 배포는 자비스/Jun이 gh-pages로 처리.
- 변경 요약 + 어디에 훅 넣었는지 3~5줄로 보고. (자비스가 왕 GAN 2차 리뷰함.)

---
※ 참고: 테이블에 검증용 더미행 `ZZZ_VERIFY`가 있을 수 있음(자비스가 SQL로 지울 예정) — 무시.
