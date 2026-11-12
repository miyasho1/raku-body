import React from 'react';

const CHART_W = 300;
const CHART_H = 96;
const PAD_X = 16;
const PAD_TOP = 14;
const PAD_BOTTOM = 22;

const formatShortDate = (dateStr) => {
  if (!dateStr || dateStr.length < 10) return '';
  return `${parseInt(dateStr.slice(5, 7), 10)}/${parseInt(dateStr.slice(8, 10), 10)}`;
};

const formatSigned = (val) => `${val > 0 ? '+' : ''}${val.toFixed(1)}`;

export default function WeightTrendCard({ metrics, targetWeight, todayStr, onRecord }) {
  const sorted = [...(Array.isArray(metrics) ? metrics : [])]
    .filter((m) => m && typeof m.weight === 'number' && m.date)
    .sort((a, b) => a.date.localeCompare(b.date));
  const recent = sorted.slice(-7);
  const latest = recent[recent.length - 1];
  const isRecordedToday = Boolean(latest && latest.date === todayStr);

  if (!latest) {
    return (
      <section className="bg-white rounded-2xl p-3.5 shadow-sm border border-slate-200/80 space-y-3">
        <div className="flex items-center justify-between gap-2.5">
          <h2 className="text-xs font-extrabold text-slate-800">体重の推移</h2>
          <span className="text-[10px] font-bold text-slate-400">記録 0件</span>
        </div>
        <div className="bg-slate-50 rounded-xl p-3.5 border border-dashed border-slate-300 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200/70 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
            </svg>
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-800">まだ体重の記録がありません</p>
            <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">記録すると、ここに体重の推移グラフが表示されます</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onRecord}
          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-bold shadow-2xs cursor-pointer"
        >
          最初の体重を記録する ›
        </button>
      </section>
    );
  }

  const first = recent[0];
  const diff = latest.weight - first.weight;
  const toGoal = typeof targetWeight === 'number' && targetWeight > 0 ? latest.weight - targetWeight : null;
  const isTowardGoal = toGoal === null || diff === 0 ? null : (toGoal > 0 ? diff < 0 : diff > 0);

  const weights = recent.map((m) => m.weight);
  const rawMin = Math.min(...weights);
  const rawMax = Math.max(...weights);
  const span = Math.max(rawMax - rawMin, 1);
  const minW = rawMin - span * 0.2;
  const maxW = rawMax + span * 0.2;
  const plotW = CHART_W - PAD_X * 2;
  const plotH = CHART_H - PAD_TOP - PAD_BOTTOM;
  const points = recent.map((m, i) => ({
    x: recent.length === 1 ? CHART_W / 2 : PAD_X + (plotW * i) / (recent.length - 1),
    y: PAD_TOP + plotH * (1 - (m.weight - minW) / (maxW - minW)),
    label: formatShortDate(m.date)
  }));
  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const areaPath = `${linePath} L${points[points.length - 1].x.toFixed(1)},${PAD_TOP + plotH} L${points[0].x.toFixed(1)},${PAD_TOP + plotH} Z`;

  return (
    <section className="bg-white rounded-2xl p-3.5 shadow-sm border border-slate-200/80 space-y-3">
      <div className="flex items-center justify-between gap-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <h2 className="text-xs font-extrabold text-slate-800 shrink-0">体重の推移</h2>
          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md border shrink-0 ${
            isRecordedToday
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80'
              : 'bg-amber-50 text-amber-700 border-amber-200/80'
          }`}>
            {isRecordedToday ? '今日は記録済み' : '今日は未記録'}
          </span>
        </div>
        <button
          type="button"
          onClick={onRecord}
          className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold shadow-2xs cursor-pointer shrink-0"
        >
          記録する ›
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2.5">
        <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-200/70">
          <span className="text-[10px] text-slate-500 font-bold block">最新</span>
          <span className="text-base font-black text-slate-900 tabular-nums">{latest.weight.toFixed(1)}</span>
          <span className="text-[10px] text-slate-500 ml-0.5">kg</span>
          <span className="text-[9px] text-slate-400 block">{formatShortDate(latest.date)}</span>
        </div>
        <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-200/70">
          <span className="text-[10px] text-slate-500 font-bold block">{recent.length >= 2 ? `直近${recent.length}回の差` : '変化'}</span>
          <span className={`text-base font-black tabular-nums ${
            recent.length < 2 || isTowardGoal === null
              ? 'text-slate-900'
              : isTowardGoal
              ? 'text-emerald-600'
              : 'text-amber-600'
          }`}>
            {recent.length >= 2 ? formatSigned(diff) : '-'}
          </span>
          <span className="text-[10px] text-slate-500 ml-0.5">kg</span>
          <span className="text-[9px] text-slate-400 block">{recent.length >= 2 ? `${formatShortDate(first.date)}から` : '2回目から表示'}</span>
        </div>
        <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-200/70">
          <span className="text-[10px] text-slate-500 font-bold block">目標まで</span>
          <span className="text-base font-black text-slate-900 tabular-nums">
            {toGoal === null ? '-' : Math.abs(toGoal).toFixed(1)}
          </span>
          <span className="text-[10px] text-slate-500 ml-0.5">kg</span>
          <span className="text-[9px] text-slate-400 block">
            {toGoal === null ? '目標未設定' : `目標 ${targetWeight.toFixed(1)}kg`}
          </span>
        </div>
      </div>

      {recent.length >= 2 ? (
        <div className="bg-slate-50 rounded-xl px-2.5 pt-2.5 pb-1 border border-slate-200/70">
          <svg viewBox={`0 0 ${CHART_W} ${CHART_H}`} className="w-full h-auto" role="img" aria-label="直近の体重推移グラフ">
            <path d={areaPath} fill="#10b981" fillOpacity="0.08" />
            <path d={linePath} fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            {points.map((p, i) => (
              <g key={i}>
                <circle cx={p.x} cy={p.y} r={i === points.length - 1 ? 4 : 2.5} fill={i === points.length - 1 ? '#059669' : '#ffffff'} stroke="#059669" strokeWidth="1.5" />
                <text x={p.x} y={CHART_H - 6} textAnchor="middle" fontSize="9" fill="#94a3b8">{p.label}</text>
              </g>
            ))}
          </svg>
        </div>
      ) : (
        <div className="bg-slate-50 rounded-xl p-2.5 border border-dashed border-slate-300 text-center">
          <p className="text-[10px] text-slate-500 font-medium">あと1回記録すると、推移グラフが表示されます</p>
        </div>
      )}
    </section>
  );
}
