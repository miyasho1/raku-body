import { setAuthUserSession, clearGuestSessionData, clearAuthUserSession } from './authService';
import { pullServerRecords, pushAllLocalRecords, syncGlobalSettingsFromUser, signOutServer, SYNC_KINDS } from './serverSync';

const SAMPLE_PROTEIN_IDS = ['preset_gold_whey', 'preset_savas_whey', 'preset_myprotein_wpi', 'preset_savas_soy'];
const DEMO_LIST_KINDS = ['meals', 'workouts', 'metrics', 'logs'];

function readGuest(k) {
  const raw = localStorage.getItem(`raku_user_guest_${k}`) ?? localStorage.getItem(`raku_demo_${k}`);
  if (raw === null) return null;
  if (k === 'my_protein' || k === 'protein_presets') {
    try {
      const v = JSON.parse(raw);
      const isSample = (p) => Boolean(p && typeof p.id === 'string' && SAMPLE_PROTEIN_IDS.includes(p.id));
      if (Array.isArray(v)) {
        const real = v.filter((p) => !isSample(p));
        return real.length > 0 ? JSON.stringify(real) : null;
      }
      return isSample(v) ? null : raw;
    } catch {
      return null;
    }
  }
  if (!DEMO_LIST_KINDS.includes(k)) return raw;
  try {
    const list = JSON.parse(raw);
    if (!Array.isArray(list)) return raw;
    const real = list.filter((item) => !(item && typeof item.id === 'string' && item.id.startsWith('demo_')));
    return real.length > 0 ? JSON.stringify(real) : null;
  } catch {
    return null;
  }
}

function guestKindsFor(uid) {
  return SYNC_KINDS.filter((k) => {
    if (k === 'streak') return false;
    try {
      return readGuest(k) !== null && localStorage.getItem(`raku_user_${uid}_${k}`) === null;
    } catch {
      return false;
    }
  });
}

export async function finishServerLogin(user, { carryOver = 'ask' } = {}) {
  setAuthUserSession(user);
  let pulled = null;
  try {
    pulled = await pullServerRecords(user.uid);
  } catch {
    pulled = null;
  }
  if (pulled === null) {
    clearAuthUserSession();
    await signOutServer();
    return { ok: false, pulled: null, carried: false, error: 'サーバーから記録を読み込めませんでした。通信を確認して、もう一度ログインしてください（お試しの記録はそのまま残っています）。' };
  }
  let carried = false;
  if (pulled === 0) {
    const kinds = guestKindsFor(user.uid);
    const hasRecords = kinds.some((k) => ['meals', 'workouts', 'metrics'].includes(k));
    const doCarry = hasRecords && (carryOver === 'always' || (carryOver === 'ask' && window.confirm('この端末に「お試し」で付けた記録があります。このアカウントに引き継ぎますか？（引き継ぐと、記録はサーバーに保存されます。サンプルデータは引き継ぎません）')));
    if (doCarry) {
      kinds.forEach((k) => {
        try {
          localStorage.setItem(`raku_user_${user.uid}_${k}`, readGuest(k));
        } catch {
        }
      });
      carried = true;
    }
    await pushAllLocalRecords(user.uid, user.id);
    if (carried) clearGuestSessionData();
  }
  syncGlobalSettingsFromUser(user.uid);
  return { ok: true, pulled, carried };
}
