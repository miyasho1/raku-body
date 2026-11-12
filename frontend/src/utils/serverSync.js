import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './serverConfig';

export const SYNC_KINDS = [
  'meals',
  'workouts',
  'metrics',
  'logs',
  'streak',
  'body_height',
  'user_height',
  'target_weight',
  'target_calories',
  'protein_presets',
  'my_protein',
  'selected_goal',
  'body_analysis',
  'body_analysis_history',
  'body_ideal',
  'profile_basic',
  'profile_done',
  'onboarding_done'
];

const PENDING_KEY = 'raku_sync_pending';

let client = null;

export function isServerConfigured() {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

export function getServerClient() {
  if (!isServerConfigured()) return null;
  if (!client) {
    client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: true, autoRefreshToken: true, storageKey: 'rakubody-server-auth' }
    });
  }
  return client;
}

function describeAuthError(error) {
  const msg = (error && error.message) || '';
  if (/invalid login credentials/i.test(msg)) return 'メールアドレスかパスワードが違います。';
  if (/email not confirmed/i.test(msg)) return 'メールアドレスの確認がまだです。届いたメールのリンクを開いてから、ログインしてください。';
  if (/already registered|already been registered|user already exists/i.test(msg)) return 'このメールアドレスは、すでに登録されています。「ログイン」から入ってください。';
  if (/password should be at least|weak password/i.test(msg)) return 'パスワードの条件を満たしていません。8文字以上にし、英字と数字をまぜるなどして、もう一度試してください。';
  if (/invalid email|unable to validate email/i.test(msg)) return 'メールアドレスの形が正しくありません。';
  if (/rate limit|too many/i.test(msg)) return 'いまは登録やログインが混み合っています。少し待つか、研究の担当者に伝えてください。';
  if (/failed to fetch|network/i.test(msg)) return 'サーバーに接続できませんでした。電波やWi-Fiを確認してください。';
  return 'うまくいきませんでした。少し待ってから、もう一度試してください。';
}

function toAppUser(authUser, profile) {
  const name = (profile && profile.display_name) || (authUser.user_metadata && authUser.user_metadata.display_name) || 'ユーザー';
  return {
    uid: `sb_${authUser.id}`,
    id: authUser.id,
    name,
    email: authUser.email || '',
    avatarUrl: '',
    initial: name.charAt(0).toUpperCase(),
    bgColor: 'bg-blue-600',
    authProvider: 'server',
    isGuest: false,
    sessionStatus: 'authenticated',
    role: (profile && profile.role) || 'participant',
    participantCode: (profile && profile.participant_code) || ''
  };
}

async function fetchProfile(sb, userId) {
  const { data } = await sb.from('profiles').select('id, email, display_name, participant_code, role, consent_at').eq('id', userId).maybeSingle();
  return data || null;
}

export async function signUpWithEmail({ email, password, displayName, participantCode }) {
  const sb = getServerClient();
  if (!sb) return { ok: false, error: 'サーバーの設定がまだです。' };
  const { data, error } = await sb.auth.signUp({
    email: email.trim(),
    password,
    options: {
      data: {
        display_name: displayName.trim(),
        participant_code: (participantCode || '').trim(),
        consent_at: new Date().toISOString()
      }
    }
  });
  if (error) return { ok: false, error: describeAuthError(error) };
  if (!data.session) {
    return { ok: true, needsConfirm: true };
  }
  const profile = await fetchProfile(sb, data.user.id);
  return { ok: true, user: toAppUser(data.user, profile) };
}

export async function signInWithEmail({ email, password }) {
  const sb = getServerClient();
  if (!sb) return { ok: false, error: 'サーバーの設定がまだです。' };
  const { data, error } = await sb.auth.signInWithPassword({ email: email.trim(), password });
  if (error) return { ok: false, error: describeAuthError(error) };
  const profile = await fetchProfile(sb, data.user.id);
  return { ok: true, user: toAppUser(data.user, profile) };
}

export async function refreshServerUser() {
  const sb = getServerClient();
  if (!sb) return null;
  const { data } = await sb.auth.getSession();
  const session = data && data.session;
  if (!session) return null;
  const profile = await fetchProfile(sb, session.user.id);
  return toAppUser(session.user, profile);
}

export async function signOutServer() {
  const sb = getServerClient();
  if (!sb) return;
  try {
    await sb.auth.signOut();
  } catch {
  }
}

function readPending() {
  try {
    const raw = localStorage.getItem(PENDING_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writePending(p) {
  try {
    localStorage.setItem(PENDING_KEY, JSON.stringify(p));
  } catch {
  }
}

let flushTimer = null;
let flushing = false;

export async function flushPending() {
  const sb = getServerClient();
  if (!sb || flushing) return;
  const { data } = await sb.auth.getSession();
  const session = data && data.session;
  if (!session) return;
  const pending = readPending();
  const mine = pending[session.user.id] || {};
  const kinds = Object.keys(mine);
  if (kinds.length === 0) return;
  flushing = true;
  try {
    const rows = kinds.map((kind) => ({
      user_id: session.user.id,
      kind,
      data: mine[kind],
      updated_at: new Date().toISOString()
    }));
    const { error } = await sb.from('user_records').upsert(rows, { onConflict: 'user_id,kind' });
    if (!error) {
      const latest = readPending();
      const latestMine = latest[session.user.id] || {};
      kinds.forEach((k) => {
        if (JSON.stringify(latestMine[k]) === JSON.stringify(mine[k])) delete latestMine[k];
      });
      latest[session.user.id] = latestMine;
      writePending(latest);
    }
  } catch {
  } finally {
    flushing = false;
    const rest = readPending()[session.user.id] || {};
    if (Object.keys(rest).length > 0 && JSON.stringify(rest) !== JSON.stringify(mine)) scheduleFlush();
  }
}

function scheduleFlush() {
  if (flushTimer) clearTimeout(flushTimer);
  flushTimer = setTimeout(() => {
    flushTimer = null;
    flushPending();
  }, 1500);
}

export function queueServerSave(serverUserId, kind, rawValue) {
  if (!serverUserId || !SYNC_KINDS.includes(kind)) return;
  let value = rawValue;
  if (typeof rawValue === 'string') {
    try {
      value = JSON.parse(rawValue);
    } catch {
      value = rawValue;
    }
  }
  const pending = readPending();
  pending[serverUserId] = { ...(pending[serverUserId] || {}), [kind]: value };
  writePending(pending);
  scheduleFlush();
}

const GLOBAL_SETTING_KEYS = {
  body_height: ['raku_body_height', 'raku_user_height'],
  target_weight: ['raku_target_weight'],
  target_calories: ['raku_target_calories']
};

export function syncGlobalSettingsFromUser(appUid) {
  Object.entries(GLOBAL_SETTING_KEYS).forEach(([kind, globals]) => {
    let value = null;
    try {
      const raw = localStorage.getItem(`raku_user_${appUid}_${kind}`);
      value = raw === null ? null : JSON.parse(raw);
    } catch {
      value = null;
    }
    globals.forEach((g) => {
      try {
        if (value === null || value === undefined || value === '') localStorage.removeItem(g);
        else localStorage.setItem(g, String(value));
      } catch {
      }
    });
  });
}

export async function pullServerRecords(appUid) {
  const sb = getServerClient();
  if (!sb) return 0;
  await flushPending();
  const { data: sess } = await sb.auth.getSession();
  if (!sess || !sess.session) return 0;
  const { data, error } = await sb.from('user_records').select('kind, data').eq('user_id', sess.session.user.id);
  if (error || !Array.isArray(data)) return 0;
  data.forEach((row) => {
    if (!SYNC_KINDS.includes(row.kind)) return;
    try {
      const serialized = typeof row.data === 'string' ? row.data : JSON.stringify(row.data);
      localStorage.setItem(`raku_user_${appUid}_${row.kind}`, serialized);
    } catch {
    }
  });
  return data.length;
}

export async function pushAllLocalRecords(appUid, serverUserId) {
  SYNC_KINDS.forEach((kind) => {
    const raw = localStorage.getItem(`raku_user_${appUid}_${kind}`);
    if (raw !== null) queueServerSave(serverUserId, kind, raw);
  });
  await flushPending();
}

export async function fetchAdminOverview() {
  const sb = getServerClient();
  if (!sb) return { ok: false, error: 'サーバーの設定がまだです。' };
  const [{ data: profiles, error: pErr }, { data: records, error: rErr }] = await Promise.all([
    sb.from('profiles').select('id, email, display_name, participant_code, role, consent_at, created_at').order('created_at', { ascending: true }),
    sb.from('user_records').select('user_id, kind, data, updated_at')
  ]);
  if (pErr || rErr) return { ok: false, error: 'データを読み込めませんでした（管理者の権限があるか確認してください）。' };
  return { ok: true, profiles: profiles || [], records: records || [] };
}

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => flushPending());
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') flushPending();
  });
}
