import React, { useState, useEffect } from 'react';
import WheelPicker from './WheelPicker';

export default function MetricsScreen({ onRecordSuccess }) {
  const [metrics, setMetrics] = useState([]);
  const [inputTab, setInputTab] = useState('weight');
  const [weightInt, setWeightInt] = useState(64);
  const [weightDec, setWeightDec] = useState(7);
  const [fatInt, setFatInt] = useState(20);
  const [fatDec, setFatDec] = useState(5);
  const [selectedType, setSelectedType] = useState('weight');
  const [timeRange, setTimeRange] = useState('7d');
  const [activePoint, setActivePoint] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  const weightIntOptions = Array.from({ length: 111 }, (_, i) => 40 + i);
  const decimalOptions = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  const fatIntOptions = Array.from({ length: 48 }, (_, i) => 3 + i);

  useEffect(() => {
    fetchMetrics();
    fetchLatestMetric();
  }, []);

  const fetchMetrics = async () => {
    try {
      const res = await fetch('/api/metrics');
      if (res.ok) {
        const data = await res.json();
        if (data.metrics) {
          setMetrics(data.metrics);
        }
      }
    } catch {
    }
  };

  const fetchLatestMetric = async () => {
    try {
      const res = await fetch('/api/metrics/latest');
      if (res.ok) {
        const data = await res.json();
        if (data.metric) {
          const w = data.metric.weight;
          setWeightInt(Math.floor(w));
          setWeightDec(Math.round((w % 1) * 10));

          if (data.metric.body_fat) {
            const f = data.metric.body_fat;
            setFatInt(Math.floor(f));
            setFatDec(Math.round((f % 1) * 10));
          }
        }
      }
    } catch {
    }
  };

  const currentWeightVal = parseFloat(`${weightInt}.${weightDec}`);
  const currentFatVal = parseFloat(`${fatInt}.${fatDec}`);

  const [height, setHeight] = useState(() => {
    const saved = localStorage.getItem('raku_user_height');
    return saved ? parseFloat(saved) : 170.0;
  });
  const [isHeightModalOpen, setIsHeightModalOpen] = useState(false);
  const [tempHeight, setTempHeight] = useState(height);

  const handleSaveHeight = (newH) => {
    const parsed = Math.max(100, Math.min(230, parseFloat(newH) || 170));
    setHeight(parsed);
    localStorage.setItem('raku_user_height', String(parsed));
    setIsHeightModalOpen(false);
    setMessage({ type: 'success', text: `身長を ${parsed} cm に設定・保存しました` });
  };

  const getBmiInfo = (weightVal, heightCm) => {
    if (!heightCm || heightCm <= 0) return { bmi: '-', status: '未設定', badge: 'bg-slate-100 text-slate-600 border-slate-200', standardWeight: '-' };
    const hM = heightCm / 100;
    const bmiVal = weightVal / (hM * hM);
    const rounded = parseFloat(bmiVal.toFixed(1));
    let status = '普通体重';
    let badge = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (rounded < 18.5) {
      status = '低体重 (やせ)';
      badge = 'bg-blue-50 text-blue-700 border-blue-200';
    } else if (rounded >= 25.0 && rounded < 30.0) {
      status = '肥満 (1度)';
      badge = 'bg-amber-50 text-amber-700 border-amber-200';
    } else if (rounded >= 30.0) {
      status = '肥満 (2度以上)';
      badge = 'bg-rose-50 text-rose-700 border-rose-200';
    }
    const standardWeight = parseFloat((22 * hM * hM).toFixed(1));
    return { bmi: rounded, status, badge, standardWeight };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    setMessage(null);

    try {
      const res = await fetch('/api/metrics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          weight: currentWeightVal,
          body_fat: currentFatVal,
        }),
      });

      if (res.ok) {
        setMessage({ type: 'success', text: `本日の数値を記録しました！（体重: ${currentWeightVal}kg / 体脂肪率: ${currentFatVal}%）` });
        await fetchMetrics();
        if (onRecordSuccess) {
          onRecordSuccess('体重・体脂肪率を記録しました！');
        }
      } else {
        setMessage({ type: 'error', text: '保存に失敗しました。' });
      }
    } catch {
      setMessage({ type: 'error', text: '通信エラーが発生しました。' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getFilteredMetrics = () => {
    if (timeRange === '7d') {
      return metrics.slice(-7);
    } else if (timeRange === '30d') {
      return metrics.slice(-30);
    }
    return metrics;
  };

  const filtered = getFilteredMetrics();
  const currentDiff = metrics.length >= 2
    ? (metrics[metrics.length - 1].weight - metrics[metrics.length - 2].weight).toFixed(1)
    : null;

  const dataValues = filtered.map((d) => (selectedType === 'weight' ? d.weight : d.body_fat || 0));
  const minValue = dataValues.length > 0 ? Math.min(...dataValues) : 0;
  const maxValue = dataValues.length > 0 ? Math.max(...dataValues) : 100;
  const padding = (maxValue - minValue) * 0.15 || 1;
  const plotMin = parseFloat((minValue - padding).toFixed(1));
  const plotMax = parseFloat((maxValue + padding).toFixed(1));
  const plotRange = plotMax - plotMin || 1;

  const width = 340;
  const chartHeight = 180;
  const margin = { top: 20, right: 15, bottom: 25, left: 15 };
  const graphWidth = width - margin.left - margin.right;
  const graphHeight = chartHeight - margin.top - margin.bottom;

  const points = filtered.map((d, i) => {
    const val = selectedType === 'weight' ? d.weight : d.body_fat || 0;
    const x = filtered.length === 1
      ? margin.left + graphWidth / 2
      : margin.left + (i / (filtered.length - 1)) * graphWidth;
    const y = margin.top + graphHeight - ((val - plotMin) / plotRange) * graphHeight;
    return { x, y, val, date: d.date };
  });

  const pathD = points.length > 0
    ? points.reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`, '')
    : '';

  const areaD = points.length > 0
    ? `${pathD} L ${points[points.length - 1].x} ${margin.top + graphHeight} L ${points[0].x} ${margin.top + graphHeight} Z`
    : '';

  return (
    <div className="flex flex-col min-h-[calc(100vh-5rem)] px-4 py-4 pb-40 max-w-lg mx-auto bg-slate-100 no-scrollbar [&::-webkit-scrollbar]:hidden">
      <header className="mb-4">
        <h1 className="text-lg font-bold text-slate-900">身体計測・推移</h1>
        <p className="text-xs text-slate-500 mt-0.5">体重および体脂肪率の記録と推移グラフ</p>
      </header>

      <section className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm mb-4">
        <div className="flex justify-between items-center mb-3">
          <div className="flex bg-slate-100 p-1 rounded-full border border-slate-200/70 text-xs font-bold">
            <button
              type="button"
              onClick={() => setSelectedType('weight')}
              className={`px-3 py-1.5 rounded-full transition-all cursor-pointer ${
                selectedType === 'weight'
                  ? 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              体重 (kg)
            </button>
            <button
              type="button"
              onClick={() => setSelectedType('fat')}
              className={`px-3 py-1.5 rounded-full transition-all cursor-pointer ${
                selectedType === 'fat'
                  ? 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              体脂肪率 (%)
            </button>
          </div>

          <div className="flex gap-1 text-[11px] font-bold text-slate-600 bg-slate-100 p-1 rounded-full border border-slate-200/70">
            <button
              type="button"
              onClick={() => setTimeRange('7d')}
              className={`px-2.5 py-1 rounded-full transition-all cursor-pointer ${timeRange === '7d' ? 'bg-white text-slate-900 shadow-xs border border-slate-200' : 'hover:bg-white/60'}`}
            >
              7日
            </button>
            <button
              type="button"
              onClick={() => setTimeRange('30d')}
              className={`px-2.5 py-1 rounded-full transition-all cursor-pointer ${timeRange === '30d' ? 'bg-white text-slate-900 shadow-xs border border-slate-200' : 'hover:bg-white/60'}`}
            >
              30日
            </button>
            <button
              type="button"
              onClick={() => setTimeRange('all')}
              className={`px-2.5 py-1 rounded-full transition-all cursor-pointer ${timeRange === 'all' ? 'bg-white text-slate-900 shadow-xs border border-slate-200' : 'hover:bg-white/60'}`}
            >
              全期間
            </button>
          </div>
        </div>

        <div className="flex items-baseline justify-between px-1 mb-2">
          <div>
            <span className="text-3xl font-bold text-slate-900 tracking-tight">
              {metrics.length > 0
                ? (selectedType === 'weight'
                    ? metrics[metrics.length - 1].weight
                    : metrics[metrics.length - 1].body_fat || '-')
                : '-'}
            </span>
            <span className="text-xs font-bold text-slate-500 ml-1">
              {selectedType === 'weight' ? 'kg' : '%'}
            </span>
          </div>

          {currentDiff !== null && selectedType === 'weight' && (
            <div className="text-xs font-bold px-3 py-1 rounded-full bg-teal-50 text-teal-700 border border-teal-200 shadow-xs">
              <span>前回比 </span>
              <span className="font-bold">{parseFloat(currentDiff) > 0 ? `+${currentDiff}` : currentDiff} kg</span>
            </div>
          )}
        </div>

        <div className="relative w-full overflow-hidden flex justify-center py-1">
          {filtered.length === 0 ? (
            <div className="h-40 flex items-center justify-center text-xs text-slate-400">
              記録データがありません
            </div>
          ) : (
            <svg viewBox={`0 0 ${width} ${chartHeight}`} className="w-full h-auto overflow-visible select-none">
              <line
                x1={margin.left}
                y1={margin.top}
                x2={width - margin.right}
                y2={margin.top}
                stroke="#F1F5F9"
                strokeWidth="1"
                strokeDasharray="3 3"
              />
              <line
                x1={margin.left}
                y1={margin.top + graphHeight / 2}
                x2={width - margin.right}
                y2={margin.top + graphHeight / 2}
                stroke="#F1F5F9"
                strokeWidth="1"
                strokeDasharray="3 3"
              />
              <line
                x1={margin.left}
                y1={margin.top + graphHeight}
                x2={width - margin.right}
                y2={margin.top + graphHeight}
                stroke="#E2E8F0"
                strokeWidth="1"
              />

              {pathD && (
                <path
                  d={pathD}
                  fill="none"
                  stroke="#0D9488"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {points.map((p, idx) => {
                const isSelected = activePoint?.date === p.date;
                return (
                  <g key={idx} onClick={() => setActivePoint(p)} className="cursor-pointer">
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r={isSelected ? "5.5" : "4"}
                      fill="#FFFFFF"
                      stroke="#0D9488"
                      strokeWidth={isSelected ? "3" : "2"}
                    />
                  </g>
                );
              })}

              {points.length > 0 && (
                <>
                  <text
                    x={points[0].x}
                    y={chartHeight - 5}
                    fontSize="9"
                    fill="#64748B"
                    textAnchor="start"
                    fontWeight="600"
                  >
                    {points[0].date.slice(5)}
                  </text>
                  <text
                    x={points[points.length - 1].x}
                    y={chartHeight - 5}
                    fontSize="9"
                    fill="#64748B"
                    textAnchor="end"
                    fontWeight="600"
                  >
                    {points[points.length - 1].date.slice(5)}
                  </text>
                </>
              )}
            </svg>
          )}

          {activePoint && (
            <div className="absolute top-2 right-2 bg-slate-900 text-white text-[11px] px-3 py-1 rounded-full shadow-md pointer-events-none">
              <span>{activePoint.date}: </span>
              <span className="font-bold">{activePoint.val} {selectedType === 'weight' ? 'kg' : '%'}</span>
            </div>
          )}
        </div>
      </section>

      <section className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm flex-1">
        <div className="flex bg-slate-100 p-1.5 rounded-full border border-slate-200/70 mb-4">
          <button
            type="button"
            onClick={() => setInputTab('weight')}
            className={`flex-1 py-2 text-xs font-bold rounded-full transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              inputTab === 'weight'
                ? 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white shadow-md shadow-teal-500/20'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>体重</span>
            <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
              inputTab === 'weight'
                ? 'bg-white/20 text-white'
                : 'bg-teal-50 text-teal-700 border border-teal-200'
            }`}>
              {currentWeightVal}kg
            </span>
          </button>
          <button
            type="button"
            onClick={() => setInputTab('fat')}
            className={`flex-1 py-2 text-xs font-bold rounded-full transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              inputTab === 'fat'
                ? 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white shadow-md shadow-teal-500/20'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>体脂肪率</span>
            <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
              inputTab === 'fat'
                ? 'bg-white/20 text-white'
                : 'bg-teal-50 text-teal-700 border border-teal-200'
            }`}>
              {currentFatVal}%
            </span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="py-3 px-4 bg-teal-50/60 rounded-2xl border border-teal-100 space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-[10px] font-bold text-slate-500">
                {inputTab === 'weight' ? '入力中の体重' : '入力中の体脂肪率'}
              </div>
              <button
                type="button"
                onClick={() => {
                  setTempHeight(height);
                  setIsHeightModalOpen(true);
                }}
                className="text-[11px] font-bold text-teal-700 hover:text-teal-900 bg-white border border-teal-200/80 px-2.5 py-1 rounded-full shadow-xs cursor-pointer flex items-center gap-1 transition-all"
              >
                <span>📏 身長: <strong>{height} cm</strong></span>
                <span className="text-[9px] text-teal-500">変更 ›</span>
              </button>
            </div>

            <div className="flex items-baseline justify-center gap-1">
              <span className="text-3xl font-black text-slate-900 tracking-tight tabular-nums">
                {inputTab === 'weight' ? currentWeightVal : currentFatVal}
              </span>
              <span className="text-xs font-bold text-slate-500">
                {inputTab === 'weight' ? 'kg' : '%'}
              </span>
            </div>

            {(() => {
              const bmiInfo = getBmiInfo(currentWeightVal, height);
              return (
                <div className="pt-2 border-t border-teal-100/80 flex items-center justify-between text-xs flex-wrap gap-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-bold text-slate-700">BMI:</span>
                    <span className="text-sm font-black text-slate-900 tabular-nums">
                      {bmiInfo.bmi}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shadow-2xs ${bmiInfo.badge}`}>
                      {bmiInfo.status}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500">
                    適正体重: {bmiInfo.standardWeight} kg
                  </span>
                </div>
              );
            })()}
          </div>

          <div className="flex justify-center my-1">
            <div className="relative w-[250px] bg-slate-50/60 rounded-3xl p-3.5 border border-slate-200/80 shadow-inner overflow-hidden">
              <div className="pointer-events-none absolute inset-x-2 top-1/2 -translate-y-1/2 h-11 bg-white rounded-xl border border-teal-200/80 shadow-xs z-0" />
              <div className="pointer-events-none absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-slate-50/90 via-slate-50/60 to-transparent z-10" />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-slate-50/90 via-slate-50/60 to-transparent z-10" />

              <div className="relative z-0 flex items-center justify-center gap-0.5">
                {inputTab === 'weight' ? (
                  <>
                    <WheelPicker
                      items={weightIntOptions}
                      value={weightInt}
                      onChange={setWeightInt}
                      width="w-24"
                      textAlign="end"
                      fontSize="text-2xl"
                      subFontSize="text-sm"
                    />
                    <div className="w-3 flex items-center justify-center text-2xl font-bold text-slate-900 select-none pb-1">
                      .
                    </div>
                    <WheelPicker
                      items={decimalOptions}
                      value={weightDec}
                      onChange={setWeightDec}
                      width="w-14"
                      textAlign="start"
                      fontSize="text-lg"
                      subFontSize="text-xs"
                    />
                    <div className="w-8 text-xs font-bold text-slate-500 select-none pl-1">
                      kg
                    </div>
                  </>
                ) : (
                  <>
                    <WheelPicker
                      items={fatIntOptions}
                      value={fatInt}
                      onChange={setFatInt}
                      width="w-24"
                      textAlign="end"
                      fontSize="text-2xl"
                      subFontSize="text-sm"
                    />
                    <div className="w-3 flex items-center justify-center text-2xl font-bold text-slate-900 select-none pb-1">
                      .
                    </div>
                    <WheelPicker
                      items={decimalOptions}
                      value={fatDec}
                      onChange={setFatDec}
                      width="w-14"
                      textAlign="start"
                      fontSize="text-lg"
                      subFontSize="text-xs"
                    />
                    <div className="w-8 text-xs font-bold text-slate-500 select-none pl-1">
                      %
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-13 py-3 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white font-bold rounded-2xl shadow-lg shadow-teal-500/25 transition-all text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>保存中...</span>
              </>
            ) : (
              <span>本日の計測データを保存する（{currentWeightVal}kg / {currentFatVal}%）</span>
            )}
          </button>

          {message && (
            <div className={`p-3 rounded-2xl text-xs font-bold text-center border shadow-xs ${
              message.type === 'success'
                ? 'bg-teal-50 text-teal-800 border-teal-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}>
              {message.text}
            </div>
          )}
        </form>
      </section>

      {isHeightModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
              <div className="flex items-center gap-1.5">
                <span className="text-base">📏</span>
                <h3 className="text-sm font-bold text-slate-900">身長の設定</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsHeightModalOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500 mb-4">
              設定した身長をもとに、リアルタイムでBMIおよび適正体重を自動計算します。
            </p>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center mb-4">
              <span className="text-[10px] font-bold text-slate-500 block mb-1">設定中の身長</span>
              <div className="flex items-baseline justify-center gap-1">
                <input
                  type="number"
                  step="0.1"
                  min="100"
                  max="230"
                  value={tempHeight}
                  onChange={(e) => setTempHeight(parseFloat(e.target.value) || 0)}
                  className="w-28 text-center text-3xl font-black text-slate-900 bg-white border border-slate-300 rounded-xl py-1 focus:outline-none focus:border-teal-500 tabular-nums"
                />
                <span className="text-sm font-bold text-slate-500">cm</span>
              </div>

              <div className="flex items-center justify-center gap-1.5 mt-3">
                {[-5, -1, 1, 5].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setTempHeight((prev) => Math.max(100, Math.min(230, Math.round((prev + d) * 10) / 10)))}
                    className="px-2.5 py-1 rounded-xl text-xs font-bold bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 shadow-2xs transition-all cursor-pointer"
                  >
                    {d > 0 ? `+${d}` : d}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsHeightModalOpen(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl text-xs transition-colors cursor-pointer"
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={() => handleSaveHeight(tempHeight)}
                className="flex-1 py-2.5 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white font-bold rounded-2xl text-xs shadow-md shadow-teal-500/20 transition-all cursor-pointer"
              >
                保存する
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
