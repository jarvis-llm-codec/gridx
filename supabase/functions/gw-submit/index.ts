// GRIDX score submission gateway.
// The leaderboard is client-authoritative, so this function is the ONLY writer:
// direct anon INSERT on gw_leaderboard is revoked. Everything funnels here, where
// we apply per-IP rate limiting + plausibility checks the client cannot bypass.
import { createClient } from 'jsr:@supabase/supabase-js@2';

const RATE_MAX = 5; // max submissions...
const RATE_WINDOW_S = 600; // ...per IP per 10 minutes
const PLAYTIME_MAX = 1800; // 30 min cap (real games < 15 min)
const RATE_PER_SEC = 6000; // score/sec ceiling (~1.5x observed human max)
const CLIENT_V = 'gridx-2';

const CORS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const reply = (obj: unknown, status: number): Response =>
  new Response(JSON.stringify(obj), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });

// Keep only printable characters (drops control bytes without embedding them in source).
const printable = (value: unknown): string =>
  Array.from(String(value ?? '')).filter((c) => c.charCodeAt(0) >= 32).join('');

const cleanName = (value: unknown): string => printable(value).trim().slice(0, 12) || 'AAA';
const cleanComment = (value: unknown): string => printable(value).trim().slice(0, 40);

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return reply({ error: 'method' }, 405);

  let payload: Record<string, unknown>;
  try {
    payload = await req.json();
  } catch {
    return reply({ error: 'bad json' }, 400);
  }

  const name = cleanName(payload.name);
  const comment = cleanComment(payload.comment);
  const score = Math.floor(Number(payload.score) || 0);
  const playtime = Math.floor(Number(payload.playtime_s) || 0);

  if (!Number.isFinite(score) || score < 0 || score > 2147483647) return reply({ error: 'score' }, 400);
  if (!Number.isFinite(playtime) || playtime < 0 || playtime > PLAYTIME_MAX) return reply({ error: 'playtime' }, 400);
  if (score > (playtime + 30) * RATE_PER_SEC) return reply({ error: 'implausible' }, 400);

  const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'unknown';

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false } },
  );

  const since = new Date(Date.now() - RATE_WINDOW_S * 1000).toISOString();
  const { count, error: countError } = await supabase
    .from('gw_submit_log')
    .select('*', { count: 'exact', head: true })
    .eq('ip', ip)
    .gte('created_at', since);
  if (countError) return reply({ error: 'rate check failed' }, 500);
  if ((count ?? 0) >= RATE_MAX) return reply({ error: 'rate limit' }, 429);

  await supabase.from('gw_submit_log').insert({ ip });

  const row: Record<string, unknown> = { name, score, playtime_s: playtime, client_v: CLIENT_V };
  if (comment) row.comment = comment;

  const { error } = await supabase.from('gw_leaderboard').insert(row);
  if (error) {
    // Constraint / profanity-trigger rejections surface here as a clean 400.
    return reply({ error: 'rejected', detail: error.message }, 400);
  }

  return reply({ ok: true, name, score, playtime_s: playtime }, 200);
});
