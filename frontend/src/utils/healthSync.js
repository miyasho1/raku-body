import { getServerClient } from './serverSync';
import { getUserStorageData, setUserStorageData } from './authService';

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';

function makeCode() {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => CODE_CHARS[b % CODE_CHARS.length]).join('');
}

async function currentUserId(sb) {
  const { data } = await sb.auth.getSession();
  return data && data.session ? data.session.user.id : null;
}

export async function getHealthCode() {
  const sb = getServerClient();
  if (!sb) return { ok: false };
  const uid = await currentUserId(sb);
  if (!uid) return { ok: false };
  const { data, error } = await sb.from('health_link_codes').select('code').eq('user_id', uid).maybeSingle();
  if (error) return { ok: false, notReady: true };
  if (data && data.code) return { ok: true, code: data.code };
  return regenerateHealthCode();
}

export async function regenerateHealthCode() {
  const sb = getServerClient();
  if (!sb) return { ok: false };
  const uid = await currentUserId(sb);
  if (!uid) return { ok: false };
  const code = makeCode();
  const { error } = await sb.from('health_link_codes').upsert({ user_id: uid, code, created_at: new Date().toISOString() }, { onConflict: 'user_id' });
  if (error) return { ok: false, notReady: true };
  return { ok: true, code };
}

const dayStr = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export async function pullHealthImports(appUid) {
  const sb = getServerClient();
  if (!sb || !appUid) return { ok: false };
  const uid = await currentUserId(sb);
  if (!uid) return { ok: false };
  const since = new Date();
  since.setDate(since.getDate() - 90);
  const { data, error } = await sb
    .from('health_imports')
    .select('day, steps, active_kcal, basal_kcal, weight, received_at')
    .eq('user_id', uid)
    .gte('day', dayStr(since))
    .order('day', { ascending: true });
  if (error || !Array.isArray(data)) return { ok: false };
  try {
    localStorage.setItem(`raku_user_${appUid}_health_daily`, JSON.stringify(data));
  } catch {
  }
  const metrics = getUserStorageData('metrics', []);
  const list = Array.isArray(metrics) ? [...metrics] : [];
  let changed = false;
  data.forEach((row) => {
    const w = Number(row.weight);
    if (!Number.isFinite(w) || w <= 0) return;
    if (list.some((m) => m.date === row.day)) return;
    list.push({ id: `metric_health_${row.day}`, date: row.day, weight: Number(w.toFixed(1)), source: 'health' });
    changed = true;
  });
  if (changed) setUserStorageData('metrics', list);
  return { ok: true, count: data.length, last: data.length > 0 ? data[data.length - 1].received_at : null };
}

export function getHealthDaily() {
  const list = getUserStorageData('health_daily', []);
  return Array.isArray(list) ? list : [];
}
