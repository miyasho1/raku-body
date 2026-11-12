import React, { useEffect, useState } from 'react';
import { fetchAdminOverview } from '../utils/serverSync';

const countOf = (v) => (Array.isArray(v) ? v.length : 0);

const formatDateTime = (iso) => {
  if (!iso) return '-';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '-';
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
};

const stamp = () => {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}`;
};

const downloadText = (text, name, type) => {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

const csvCell = (v) => {
  if (v === null || v === undefined) return '';
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

const parseAnalysis = (meal) => {
  if (!meal.analysis_json) return null;
  try {
    return typeof meal.analysis_json === 'string' ? JSON.parse(meal.analysis_json) : meal.analysis_json;
  } catch {
    return null;
  }
};

const recordTypeOf = (meal) => {
  const note = meal.note || '';
  const name = meal.menu_name || '';
  if (/割り）$/.test(name) || note.startsWith('プロテイン')) return 'protein_drink';
  const analysis = parseAnalysis(meal);
  if (note.startsWith('成分表OCR') || (analysis && analysis.recorded)) return 'label';
  if (meal.ai_original || (analysis && analysis.ai_original)) return 'meal_photo';
  return 'manual';
};

const parseAiOriginal = (meal) => {
  if (meal.ai_original) return meal.ai_original;
  if (meal.analysis_json) {
    try {
      const parsed = typeof meal.analysis_json === 'string' ? JSON.parse(meal.analysis_json) : meal.analysis_json;
      return parsed.ai_original || null;
    } catch {
      return null;
    }
  }
  return null;
};

export default function AdminScreen({ onClose }) {
  const [state, setState] = useState({ loading: true, error: '', profiles: [], records: [] });

  const load = async () => {
    setState((s) => ({ ...s, loading: true, error: '' }));
    const result = await fetchAdminOverview();
    if (!result.ok) {
      setState({ loading: false, error: result.error, profiles: [], records: [] });
      return;
    }
    setState({ loading: false, error: '', profiles: result.profiles, records: result.records });
  };

  useEffect(() => {
    load();
  }, []);

  const byUser = {};
  state.records.forEach((r) => {
    if (!byUser[r.user_id]) byUser[r.user_id] = { kinds: {}, lastUpdated: null };
    byUser[r.user_id].kinds[r.kind] = r.data;
    if (!byUser[r.user_id].lastUpdated || r.updated_at > byUser[r.user_id].lastUpdated) {
      byUser[r.user_id].lastUpdated = r.updated_at;
    }
  });

  const participants = state.profiles.map((p) => {
    const u = byUser[p.id] || { kinds: {}, lastUpdated: null };
    return {
      ...p,
      meals: countOf(u.kinds.meals),
      workouts: countOf(u.kinds.workouts),
      metrics: countOf(u.kinds.metrics),
      lastUpdated: u.lastUpdated
    };
  });

  const handleExportJson = () => {
    const data = state.profiles.map((p) => ({ profile: p, records: (byUser[p.id] || { kinds: {} }).kinds }));
    downloadText(JSON.stringify({ app: 'raku-body-admin', exported_at: new Date().toISOString(), participants: data }, null, 2), `raku-body_全員の記録_${stamp()}.json`, 'application/json');
  };

  const handleExportMealsCsv = () => {
    const header = ['participant_code', 'display_name', 'date', 'record_type', 'menu_name', 'calories', 'protein_g', 'fat_g', 'carbs_g', 'ai_calories', 'ai_protein_g', 'ai_fat_g', 'ai_carbs_g', 'source'];
    const lines = [header.join(',')];
    state.profiles.forEach((p) => {
      const meals = (byUser[p.id] && byUser[p.id].kinds.meals) || [];
      (Array.isArray(meals) ? meals : []).forEach((m) => {
        const type = recordTypeOf(m);
        const ai = type === 'meal_photo' || type === 'label' ? parseAiOriginal(m) || {} : {};
        lines.push([
          p.participant_code, p.display_name, m.log_date || (m.timestamp || '').slice(0, 10), type, m.menu_name,
          m.calories, m.protein_g, m.fat_g, m.carbs_g,
          ai.calories, ai.protein_g, ai.fat_g, ai.carbs_g,
          m.source || (ai.calories !== undefined ? 'ai_gemini' : '')
        ].map(csvCell).join(','));
      });
    });
    downloadText(`﻿${lines.join('\n')}`, `raku-body_食事の記録_${stamp()}.csv`, 'text/csv');
  };

  return (
    <div className="absolute inset-0 z-40 bg-slate-900/55 backdrop-blur-xs flex items-end justify-center px-3.5 pb-3.5 pt-14">
      <div className="w-full max-h-full overflow-y-auto bg-white rounded-2xl shadow-2xl border border-slate-200/90 p-3.5 space-y-3">
        <div className="flex items-center justify-between gap-2.5">
          <div>
            <span className="text-[10px] font-bold text-indigo-600">管理者モード</span>
            <h2 className="text-base font-black text-slate-900 leading-snug">参加者の記録</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center text-xs font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            disabled={state.loading || state.profiles.length === 0}
            onClick={handleExportJson}
            className="py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold cursor-pointer disabled:opacity-50"
          >
            全員の記録（JSON）
          </button>
          <button
            type="button"
            disabled={state.loading || state.profiles.length === 0}
            onClick={handleExportMealsCsv}
            className="py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold cursor-pointer disabled:opacity-50"
          >
            食事とAIの値（CSV）
          </button>
        </div>
        <p className="text-[10px] text-slate-500 leading-relaxed">
          書き出したファイルには参加者の記録とメールアドレスが入っています。研究室の外に出さず、使い終わったら消してください。
        </p>

        {state.loading && <div className="text-xs text-slate-500 text-center py-3.5">読み込み中...</div>}
        {state.error && (
          <div className="text-[11px] font-bold px-2.5 py-1.5 rounded-xl border bg-rose-50 text-rose-700 border-rose-200/80">{state.error}</div>
        )}

        {!state.loading && !state.error && (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-800">登録者 {participants.length}人（管理者を含む）</span>
              <button type="button" onClick={load} className="text-[11px] font-bold text-blue-600 cursor-pointer">再読み込み</button>
            </div>
            {participants.map((p) => (
              <div key={p.id} className="bg-slate-50 rounded-xl border border-slate-200/80 p-3.5 space-y-2.5">
                <div className="flex items-center justify-between gap-2.5">
                  <div className="min-w-0">
                    <div className="text-xs font-extrabold text-slate-900 truncate">
                      {p.display_name || '（名前なし）'}
                      {p.participant_code ? <span className="text-slate-500 font-bold"> ・ {p.participant_code}</span> : null}
                    </div>
                    <div className="text-[10px] text-slate-500 truncate">{p.email}</div>
                  </div>
                  {p.role === 'admin' && (
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-xl border bg-indigo-50 text-indigo-700 border-indigo-200/80 shrink-0">管理者</span>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-2.5 text-center">
                  <div className="bg-white rounded-xl border border-slate-200/80 py-1.5">
                    <div className="text-[9px] text-slate-500 font-bold">食事</div>
                    <div className="text-sm font-black text-slate-900 tabular-nums">{p.meals}</div>
                  </div>
                  <div className="bg-white rounded-xl border border-slate-200/80 py-1.5">
                    <div className="text-[9px] text-slate-500 font-bold">運動</div>
                    <div className="text-sm font-black text-slate-900 tabular-nums">{p.workouts}</div>
                  </div>
                  <div className="bg-white rounded-xl border border-slate-200/80 py-1.5">
                    <div className="text-[9px] text-slate-500 font-bold">体重</div>
                    <div className="text-sm font-black text-slate-900 tabular-nums">{p.metrics}</div>
                  </div>
                </div>
                <div className="text-[10px] text-slate-500">最終更新 {formatDateTime(p.lastUpdated)} ／ 登録 {formatDateTime(p.created_at)}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
