// This is a public Supabase client key. Database writes are protected by RLS.
const SUPABASE_URL = 'https://jxmwakjhfmgcdfvwdbmr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4bXdha2poZm1nY2RmdndkYm1yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM1NjM2MDUsImV4cCI6MjA5OTEzOTYwNX0.rlUu89d4BT3UYWsrsM8y8GDFYPIk8WRE97Z2LxVRQL8';
const HEADERS = { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` };

export interface LeaderboardGame {
  beginGame(): void;
  restart(): void;
}

interface ScoreEntry {
  name: string;
  score: number;
  playtime_s: number;
  comment?: string;
  client_v?: string;
}

// Version gate: the DB rejects inserts without the current tag, cutting off
// stale tabs / archived copies of the pre-rebalance game still submitting.
const CLIENT_V = 'gridx-2';

interface LastRun {
  score: number;
  timeS: number;
}

const element = <T extends HTMLElement>(id: string): T => document.getElementById(id) as T;
let game: LeaderboardGame | null = null;
let submitted = false;
let lastRun: LastRun | null = null;
let myEntry: ScoreEntry | null = null;

const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
};

const cleanName = (value: unknown): string => String(value || '')
  .replace(/[\u0000-\u001F]/g, ' ')
  .trim()
  .slice(0, 12);

const cleanComment = (value: unknown): string => Array.from(String(value || ''))
  .filter((character) => character.charCodeAt(0) >= 32)
  .join('')
  .trim()
  .slice(0, 40);

const blockedWords = [
  '시발', '씨발', '씨팔', '시팔', '씨빨', '시벌', '씨벌', '슈발', '쉬발', '씨바',
  '병신', '븅신', '빙신', '등신', '지랄', '존나', '존만', '좆', '좃', '씹',
  '개새', '새끼', '색기', '새키', '니미', '니애미', '느금', '앰창', '엠창',
  '썅', '호로', '후레', '자지', '보지', '걸레년', '창녀', '창놈', '미친놈', '미친년',
  '개년', '개놈', '개좆', '또라이', '돌아이', '뒤져라', '뒈져',
  'ㅅㅂ', 'ㅆㅂ', 'ㅂㅅ', 'ㅈㄹ', 'ㅈㄴ', 'ㄴㄱㅁ', 'ㅆㅅㄲ',
  'fuck', 'fck', 'fuk', 'fcuk', 'fvck', 'shit', 'bitch', 'btch', 'cunt', 'nigg',
  'faggot', 'fag', 'asshole', 'ashole', 'whore', 'slut', 'retard', 'dick',
  'cock', 'pussy', 'pusy', 'motherfuck', 'mofo', 'bastard', 'twat', 'wanker', 'jerkoff',
];

const isProfane = (value: unknown): boolean => {
  const raw = String(value || '').toLowerCase();
  const replacements: Record<string, string> = {
    '1': 'i', '!': 'i', '3': 'e', '4': 'a', '@': 'a', '0': 'o', '$': 's', '5': 's', '7': 't', '8': 'b',
  };
  const english = raw.replace(/[!@$0-9]/g, (character) => replacements[character] || '').replace(/[^a-z]/g, '');
  const collapsedEnglish = english.replace(/(.)\1+/g, '$1');
  const korean = raw.replace(/[^가-힣ㄱ-ㅎㅏ-ㅣ]/g, '');
  return blockedWords.some((word) => english.includes(word) || collapsedEnglish.includes(word) || korean.includes(word));
};

const fetchTop = async (): Promise<ScoreEntry[]> => {
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/gw_leaderboard?select=name,score,playtime_s,comment&order=score.desc&limit=100`,
    { headers: HEADERS },
  );
  if (!response.ok) throw new Error(`read ${response.status}`);
  return response.json() as Promise<ScoreEntry[]>;
};

const fetchRank = async (score: number): Promise<number | null> => {
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/gw_leaderboard?select=id&score=gt.${Math.floor(score)}`,
    { headers: { ...HEADERS, Prefer: 'count=exact', Range: '0-0' } },
  );
  if (!response.ok) throw new Error(`rank ${response.status}`);
  const total = Number.parseInt((response.headers.get('content-range') || '').split('/')[1], 10);
  return Number.isFinite(total) ? total + 1 : null;
};

const submitScore = async (name: string, score: number, time: number, comment: string): Promise<ScoreEntry> => {
  const body: ScoreEntry = {
    name: cleanName(name) || 'AAA',
    score: Math.max(0, Math.min(2147483647, Math.floor(score || 0))),
    playtime_s: Math.max(0, Math.min(2147483647, Math.floor(time || 0))),
    client_v: CLIENT_V,
  };
  const cleanedComment = cleanComment(comment);
  if (cleanedComment) body.comment = cleanedComment;
  const response = await fetch(`${SUPABASE_URL}/rest/v1/gw_leaderboard`, {
    method: 'POST',
    headers: { ...HEADERS, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(`submit ${response.status}`);
  return body;
};

const renderBoard = async (highlight: ScoreEntry | null): Promise<void> => {
  const list = element<HTMLOListElement>('gw-board-list');
  const message = element('gw-board-msg');
  list.innerHTML = '';
  message.textContent = 'LOADING…';
  try {
    const rows = await fetchTop();
    message.textContent = rows.length ? '' : 'NO SCORES YET — BE THE FIRST!';
    let foundMine = false;
    rows.forEach((row, index) => {
      const item = document.createElement('li');
      if (highlight && !foundMine && row.name === highlight.name && row.score === highlight.score) {
        item.className = 'gw-me';
        foundMine = true;
      }
      item.innerHTML = `<span class="gw-rank">${index + 1}</span><span class="gw-nm"></span><span class="gw-cm"></span><span class="gw-sc">${Number(row.score).toLocaleString()}</span><span class="gw-tm">${formatTime(row.playtime_s || 0)}</span>`;
      (item.querySelector('.gw-nm') as HTMLElement).textContent = row.name;
      if (row.comment) {
        const comment = item.querySelector('.gw-cm') as HTMLElement;
        comment.textContent = `“${row.comment}”`;
        comment.title = row.comment;
      }
      list.appendChild(item);
    });
    if (highlight && !foundMine) {
      try {
        const rank = await fetchRank(highlight.score);
        if (rank) message.textContent = `YOUR RANK: #${rank}`;
      } catch { /* rank count is optional */ }
    }
  } catch {
    const best = Number(localStorage.getItem('gw_best')) || 0;
    message.textContent = `⚠ RANKING OFFLINE${best ? ` · LOCAL BEST ${best.toLocaleString()}` : ''}`;
  }
};

const show = (target: HTMLElement, visible: boolean): void => {
  target.style.display = visible ? 'flex' : 'none';
};

const showMenu = (): void => {
  myEntry = null;
  show(element('gw-menu'), true);
  show(element('gw-gameover'), false);
  show(element('gw-board'), false);
  element('overlay-hint').textContent = 'WASD Move · Mouse Aim · Touch OK';
};

const showBoard = (from?: 'menu'): void => {
  show(element('gw-menu'), false);
  show(element('gw-board'), true);
  element('gw-board-close').style.display = from === 'menu' ? '' : 'none';
  void renderBoard(myEntry);
};

const onGameOver = (score: number, time: number): void => {
  submitted = false;
  lastRun = { score: Math.floor(score || 0), timeS: Math.floor(time || 0) };
  myEntry = null;
  const best = Number(localStorage.getItem('gw_best')) || 0;
  if (lastRun.score > best) localStorage.setItem('gw_best', String(lastRun.score));
  element('gw-final').textContent = `SCORE ${lastRun.score.toLocaleString()} · TIME ${formatTime(lastRun.timeS)}`;
  element<HTMLInputElement>('gw-name').value = cleanName(localStorage.getItem('gw_name') || '');
  element<HTMLInputElement>('gw-comment').value = '';
  element('gw-entry').style.display = 'flex';
  element('gw-entry-msg').textContent = '';
  element<HTMLButtonElement>('gw-submit-btn').disabled = false;
  show(element('gw-menu'), false);
  show(element('gw-board'), false);
  show(element('gw-gameover'), true);
  element('overlay-hint').textContent = '';
};

const doSubmit = async (): Promise<void> => {
  if (submitted || !lastRun) return;
  const button = element<HTMLButtonElement>('gw-submit-btn');
  const message = element('gw-entry-msg');
  const name = cleanName(element<HTMLInputElement>('gw-name').value);
  const comment = cleanComment(element<HTMLInputElement>('gw-comment').value);
  if (!name) {
    message.textContent = 'ENTER YOUR NAME';
    element<HTMLInputElement>('gw-name').focus();
    return;
  }
  if (isProfane(name) || isProfane(comment)) {
    message.textContent = '🚫 KEEP IT CLEAN!';
    return;
  }
  button.disabled = true;
  message.textContent = 'SUBMITTING…';
  try {
    const body = await submitScore(name, lastRun.score, lastRun.timeS, comment);
    submitted = true;
    myEntry = body;
    localStorage.setItem('gw_name', body.name);
    message.textContent = '';
    element('gw-entry').style.display = 'none';
    element<HTMLInputElement>('gw-name').blur();
    showBoard();
    show(element('gw-gameover'), true);
  } catch (error) {
    button.disabled = false;
    message.textContent = /submit 4/.test(error instanceof Error ? error.message : String(error))
      ? '🚫 BLOCKED — TRY NICER WORDS'
      : '⚠ SUBMIT FAILED — TAP TO RETRY';
  }
};

const blocking = (): boolean =>
  document.activeElement === element('gw-name') || document.activeElement === element('gw-comment');

const hideAll = (): void => {
  if (blocking()) (document.activeElement as HTMLElement).blur();
  show(element('gw-menu'), false);
  show(element('gw-gameover'), false);
  show(element('gw-board'), false);
};

const bind = (targetGame: LeaderboardGame): void => {
  if (game) return;
  game = targetGame;
  // Anonymous load counter (gw_pings, insert-only) — GitHub Pages exposes no
  // request stats, so the game counts its own boots. Fire and forget.
  void fetch(`${SUPABASE_URL}/rest/v1/gw_pings`, {
    method: 'POST',
    headers: { ...HEADERS, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
    body: '{}',
  }).catch(() => {});
  element('gw-start-btn').addEventListener('click', () => game?.beginGame());
  element('gw-board-btn').addEventListener('click', () => showBoard('menu'));
  element('gw-board-close').addEventListener('click', showMenu);
  element('gw-restart-btn').addEventListener('click', () => game?.restart());
  element('gw-submit-btn').addEventListener('click', () => void doSubmit());
  for (const id of ['gw-name', 'gw-comment']) {
    element(id).addEventListener('keydown', (event) => {
      event.stopPropagation();
      if (event.key === 'Enter') {
        event.preventDefault();
        void doSubmit();
      }
    });
    element(id).addEventListener('keyup', (event) => event.stopPropagation());
  }
};

export const leaderboard = { bind, showMenu, showBoard, onGameOver, hideAll, blocking };
