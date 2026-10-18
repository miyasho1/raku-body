import React, { useState, useEffect } from 'react';

export default function AnalyticsScreen({ onSelectTab }) {
  const [period, setPeriod] = useState('week');
  const [workouts, setWorkouts] = useState([]);
  const [meals, setMeals] = useState([]);
  const [metrics, setMetrics] = useState([]);
  const [advice, setAdvice] = useState(null);
  const [correlation, setCorrelation] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [wRes, mRes, bRes, aRes, cRes] = await Promise.all([
        fetch('/api/workouts'),
        fetch('/api/meals'),
        fetch('/api/metrics'),
        fetch('/api/advice'),
        fetch('/api/correlation-analysis')
      ]);

      if (wRes.ok) {
        const wData = await wRes.json();
        setWorkouts(wData.workouts || []);
      }
      if (mRes.ok) {
        const mData = await mRes.json();
        setMeals(mData.meals || []);
      }
      if (bRes.ok) {
        const bData = await bRes.json();
        setMetrics(bData.metrics || []);
      }
      if (aRes.ok) {
        const aData = await aRes.json();
        setAdvice(aData);
      }
      if (cRes.ok) {
        const cData = await cRes.json();
        setCorrelation(cData);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const daysCount = period === 'week' ? 7 : 30;

  const getFilteredDates = () => {
    const list = [];
    const now = new Date();
    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const str = d.toISOString().slice(0, 10);
      list.push(str);
    }
    return list;
  };

  const targetDates = getFilteredDates();
  const startDateStr = targetDates[0];

  const filteredWorkouts = workouts.filter((w) => (w.log_date || w.timestamp?.slice(0, 10)) >= startDateStr);
  const filteredMeals = meals.filter((m) => (m.log_date || m.timestamp?.slice(0, 10)) >= startDateStr);
  const filteredMetrics = metrics.filter((b) => b.date >= startDateStr);

  const totalWorkoutCount = filteredWorkouts.length;

  const totalCalories = filteredMeals.reduce((acc, cur) => acc + (cur.calories || 0), 0);
  const activeMealDaysCount = new Set(filteredMeals.map((m) => m.log_date || m.timestamp?.slice(0, 10))).size || 1;
  const avgCalories = Math.round(totalCalories / (period === 'week' ? Math.min(daysCount, Math.max(1, activeMealDaysCount)) : Math.max(1, activeMealDaysCount)));

  const heightCm = parseFloat(localStorage.getItem('raku_body_height') || '170');
  const heightM = heightCm / 100;

  let latestWeight = null;
  let weightDiff = 0;
  let currentBmi = null;

  if (metrics.length > 0) {
    const sorted = [...metrics].sort((a, b) => a.date.localeCompare(b.date));
    const latest = sorted[sorted.length - 1];
    latestWeight = latest.weight;
    currentBmi = (latest.weight / (heightM * heightM)).toFixed(1);

    const periodMetrics = sorted.filter((b) => b.date >= startDateStr);
    if (periodMetrics.length > 1) {
      weightDiff = (periodMetrics[periodMetrics.length - 1].weight - periodMetrics[0].weight).toFixed(1);
    } else if (sorted.length > 1) {
      weightDiff = (latest.weight - sorted[0].weight).toFixed(1);
    }
  }

  const targetDailyCal = 2000;
  const targetDailyProtein = 100;
  const targetDailyFat = 55;
  const targetDailyCarbs = 250;
  const targetDailyFiber = 20;

  const effectiveDays = Math.max(1, activeMealDaysCount);
  const avgProtein = filteredMeals.reduce((acc, cur) => acc + (cur.protein_g || 0), 0) / effectiveDays;
  const avgFat = filteredMeals.reduce((acc, cur) => acc + (cur.fat_g || 0), 0) / effectiveDays;
  const avgCarbs = filteredMeals.reduce((acc, cur) => acc + (cur.carbs_g || 0), 0) / effectiveDays;
  const avgFiber = filteredMeals.reduce((acc, cur) => acc + (cur.fiber_g || 0), 0) / effectiveDays;

  const energyRate = Math.min(100, Math.round((avgCalories / targetDailyCal) * 100)) || 75;
  const proteinRate = Math.min(100, Math.round((avgProtein / targetDailyProtein) * 100)) || 82;
  const fatRate = Math.min(100, Math.round((avgFat / targetDailyFat) * 100)) || 68;
  const carbsRate = Math.min(100, Math.round((avgCarbs / targetDailyCarbs) * 100)) || 70;
  const fiberRate = Math.min(100, Math.round((avgFiber / targetDailyFiber) * 100)) || 60;

  const radarItems = [
    { label: 'エネルギー', rate: energyRate, value: `${avgCalories || 1850}kcal` },
    { label: 'タンパク質', rate: proteinRate, value: `${Math.round(avgProtein) || 82}g` },
    { label: '脂質', rate: fatRate, value: `${Math.round(avgFat) || 45}g` },
    { label: '炭水化物', rate: carbsRate, value: `${Math.round(avgCarbs) || 210}g` },
    { label: '食物繊維', rate: fiberRate, value: `${Math.round(avgFiber) || 14}g` }
  ];

  const radarCx = 130;
  const radarCy = 115;
  const radarR = 72;

  const getPointCoord = (index, radius) => {
    const angleDeg = -90 + index * 72;
    const rad = (angleDeg * Math.PI) / 180;
    return {
      x: radarCx + radius * Math.cos(rad),
      y: radarCy + radius * Math.sin(rad)
    };
  };

  const getPolygonPoints = (radiusMultiplier = 1) => {
    return [0, 1, 2, 3, 4]
      .map((i) => {
        const pt = getPointCoord(i, radarR * radiusMultiplier);
        return `${pt.x},${pt.y}`;
      })
      .join(' ');
  };

  const dataPolygonPoints = radarItems
    .map((item, i) => {
      const r = (Math.max(15, Math.min(100, item.rate)) / 100) * radarR;
      const pt = getPointCoord(i, r);
      return `${pt.x},${pt.y}`;
    })
    .join(' ');

  const dailyCalorieMap = {};
  targetDates.forEach((d) => {
    dailyCalorieMap[d] = 0;
  });
  filteredMeals.forEach((m) => {
    const dStr = m.log_date || m.timestamp?.slice(0, 10);
    if (dailyCalorieMap[dStr] !== undefined) {
      dailyCalorieMap[dStr] += m.calories || 0;
    }
  });

  const displayDays = period === 'week' ? targetDates : targetDates.slice(-14);

  const pCal = (avgProtein || 80) * 4;
  const fCal = (avgFat || 50) * 9;
  const cCal = (avgCarbs || 220) * 4;
  const totalPfcCal = pCal + fCal + cCal || 1;
  const pPct = Math.round((pCal / totalPfcCal) * 100);
  const fPct = Math.round((fCal / totalPfcCal) * 100);
  const cPct = 100 - pPct - fPct;

  const partMap = {
    '胸': 0,
    '背中': 0,
    '脚': 0,
    '肩': 0,
    '腕': 0,
    '体幹': 0
  };

  filteredWorkouts.forEach((w) => {
    const txt = `${w.menu_name || ''} ${w.note || ''}`;
    if (txt.includes('胸') || txt.includes('チェスト') || txt.includes('ベンチ') || txt.includes('プッシュアップ')) {
      partMap['胸'] += w.sets || 1;
    } else if (txt.includes('背中') || txt.includes('ラット') || txt.includes('デッド') || txt.includes('ローイング')) {
      partMap['背中'] += w.sets || 1;
    } else if (txt.includes('脚') || txt.includes('スクワット') || txt.includes('レッグ') || txt.includes('もも')) {
      partMap['脚'] += w.sets || 1;
    } else if (txt.includes('肩') || txt.includes('ショルダー') || txt.includes('レイズ')) {
      partMap['肩'] += w.sets || 1;
    } else if (txt.includes('腕') || txt.includes('カール') || txt.includes('トライセプス')) {
      partMap['腕'] += w.sets || 1;
    } else if (txt.includes('体幹') || txt.includes('プランク') || txt.includes('クランチ') || txt.includes('腹')) {
      partMap['体幹'] += w.sets || 1;
    } else {
      partMap['体幹'] += w.sets || 1;
    }
  });

  const partTotalSets = Object.values(partMap).reduce((a, b) => a + b, 0) || 1;
  const partList = [
    { name: '胸', sets: partMap['胸'], pct: Math.round((partMap['胸'] / partTotalSets) * 100), color: 'bg-blue-500' },
    { name: '背中', sets: partMap['背中'], pct: Math.round((partMap['背中'] / partTotalSets) * 100), color: 'bg-indigo-500' },
    { name: '脚', sets: partMap['脚'], pct: Math.round((partMap['脚'] / partTotalSets) * 100), color: 'bg-emerald-500' },
    { name: '肩', sets: partMap['肩'], pct: Math.round((partMap['肩'] / partTotalSets) * 100), color: 'bg-amber-500' },
    { name: '腕', sets: partMap['腕'], pct: Math.round((partMap['腕'] / partTotalSets) * 100), color: 'bg-purple-500' },
    { name: '体幹', sets: partMap['体幹'], pct: Math.round((partMap['体幹'] / partTotalSets) * 100), color: 'bg-teal-500' }
  ];

  const sortedParts = [...partList].sort((a, b) => a.sets - b.sets);
  const leastPart = sortedParts[0];
  const mostPart = sortedParts[sortedParts.length - 1];

  let workoutInsight = '各部位バランスよくトレーニングができています！';
  if (totalWorkoutCount > 0 && leastPart && leastPart.pct < 10) {
    workoutInsight = `今週は「${leastPart.name}」のトレーニングが不足しています。次回メニューに優先して組み込みましょう。`;
  } else if (mostPart && mostPart.pct > 40) {
    workoutInsight = `「${mostPart.name}」の刺激が中心となっています。拮抗筋や下半身も合わせて強化すると代謝が上がります。`;
  }

  const sortedMetrics = [...metrics].sort((a, b) => a.date.localeCompare(b.date));
  const metricsInPeriod = sortedMetrics.filter((m) => m.date >= startDateStr);
  const displayMetrics = metricsInPeriod.length > 0 ? metricsInPeriod : sortedMetrics.slice(-7);

  const minW = displayMetrics.length > 0 ? Math.min(...displayMetrics.map((m) => m.weight)) - 1 : 60;
  const maxW = displayMetrics.length > 0 ? Math.max(...displayMetrics.map((m) => m.weight)) + 1 : 70;
  const rangeW = maxW - minW || 1;

  const chartW = 320;
  const chartH = 120;
  const chartPadX = 30;
  const chartPadY = 20;

  const metricPoints = displayMetrics.map((m, idx) => {
    const x = chartPadX + (idx / Math.max(1, displayMetrics.length - 1)) * (chartW - chartPadX * 2);
    const y = chartPadY + (1 - (m.weight - minW) / rangeW) * (chartH - chartPadY * 2);
    return { x, y, weight: m.weight, date: m.date, bodyFat: m.body_fat };
  });

  const weightPolyline = metricPoints.map((p) => `${p.x},${p.y}`).join(' ');

  return (
    <div className="flex flex-col min-h-[calc(100vh-5rem)] px-4 py-4 pb-40 bg-slate-100 no-scrollbar [&::-webkit-scrollbar]:hidden">
      <header className="mb-3.5 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-900">総合分析ダッシュボード</h1>
          <p className="text-xs text-slate-500 mt-0.5">運動・食事・体重の統合分析と改善インサイト</p>
        </div>
        <div className="flex bg-slate-200/90 p-1 rounded-xl shadow-inner">
          <button
            type="button"
            onClick={() => setPeriod('week')}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              period === 'week'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            週間 (7日)
          </button>
          <button
            type="button"
            onClick={() => setPeriod('month')}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              period === 'month'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            月間 (30日)
          </button>
        </div>
      </header>

      <div className="grid grid-cols-3 gap-2.5 mb-4">
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-3 flex flex-col justify-between">
          <div className="text-[11px] font-bold text-slate-500">総トレーニング</div>
          <div className="my-1">
            <span className="text-xl font-black text-slate-900 tracking-tight">{totalWorkoutCount}</span>
            <span className="text-xs font-bold text-slate-600 ml-1">回</span>
          </div>
          <span className="text-[10px] text-blue-600 font-bold bg-blue-50 px-1.5 py-0.5 rounded text-center">
            {period === 'week' ? `週${totalWorkoutCount}日ペース` : `月間${totalWorkoutCount}回実施`}
          </span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-3 flex flex-col justify-between">
          <div className="text-[11px] font-bold text-slate-500">平均摂取カロリー</div>
          <div className="my-1">
            <span className="text-xl font-black text-slate-900 tracking-tight">{avgCalories || '-'}</span>
            <span className="text-xs font-bold text-slate-600 ml-0.5">kcal</span>
          </div>
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded text-center ${
            avgCalories > targetDailyCal
              ? 'bg-amber-50 text-amber-700'
              : 'bg-emerald-50 text-emerald-700'
          }`}>
            目標比 {avgCalories ? (avgCalories - targetDailyCal > 0 ? `+${avgCalories - targetDailyCal}` : avgCalories - targetDailyCal) : 0} kcal
          </span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-3 flex flex-col justify-between">
          <div className="text-[11px] font-bold text-slate-500">体重変化・BMI</div>
          <div className="my-1">
            <span className={`text-xl font-black tracking-tight ${weightDiff <= 0 ? 'text-blue-600' : 'text-slate-900'}`}>
              {weightDiff > 0 ? `+${weightDiff}` : weightDiff}
            </span>
            <span className="text-xs font-bold text-slate-600 ml-0.5">kg</span>
          </div>
          <span className="text-[10px] text-slate-700 font-bold bg-slate-100 px-1.5 py-0.5 rounded text-center">
            {currentBmi ? `BMI: ${currentBmi}` : '最新記録なし'}
          </span>
        </div>
      </div>

      <section className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h2 className="text-sm font-bold text-slate-900">栄養バランス分析</h2>
            <p className="text-xs text-slate-500">主要5項目の目標達成率</p>
          </div>
          <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200/60">
            5角形レーダー
          </span>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="w-full sm:w-[260px] flex justify-center">
            <svg width="260" height="230" viewBox="0 0 260 230" className="overflow-visible">
              <polygon points={getPolygonPoints(1)} fill="none" stroke="#E2E8F0" strokeWidth="1.5" />
              <polygon points={getPolygonPoints(0.75)} fill="none" stroke="#E2E8F0" strokeWidth="1" strokeDasharray="3 3" />
              <polygon points={getPolygonPoints(0.5)} fill="none" stroke="#E2E8F0" strokeWidth="1" strokeDasharray="3 3" />
              <polygon points={getPolygonPoints(0.25)} fill="none" stroke="#E2E8F0" strokeWidth="1" strokeDasharray="3 3" />

              {[0, 1, 2, 3, 4].map((i) => {
                const pt = getPointCoord(i, radarR);
                return (
                  <line
                    key={i}
                    x1={radarCx}
                    y1={radarCy}
                    x2={pt.x}
                    y2={pt.y}
                    stroke="#E2E8F0"
                    strokeWidth="1"
                  />
                );
              })}

              <polygon
                points={dataPolygonPoints}
                fill="rgba(59, 130, 246, 0.22)"
                stroke="#2563EB"
                strokeWidth="2.5"
                strokeLinejoin="round"
              />

              {radarItems.map((item, i) => {
                const r = (Math.max(15, Math.min(100, item.rate)) / 100) * radarR;
                const pt = getPointCoord(i, r);
                return (
                  <circle
                    key={i}
                    cx={pt.x}
                    cy={pt.y}
                    r="4"
                    fill="#2563EB"
                    stroke="#FFFFFF"
                    strokeWidth="2"
                  />
                );
              })}

              {radarItems.map((item, i) => {
                const labelPt = getPointCoord(i, radarR + 24);
                let textAnchor = 'middle';
                if (i === 1 || i === 2) textAnchor = 'start';
                if (i === 3 || i === 4) textAnchor = 'end';

                return (
                  <g key={i}>
                    <text
                      x={labelPt.x}
                      y={labelPt.y - 2}
                      textAnchor={textAnchor}
                      fontSize="10"
                      fontWeight="bold"
                      fill="#334155"
                    >
                      {item.label}
                    </text>
                    <text
                      x={labelPt.x}
                      y={labelPt.y + 10}
                      textAnchor={textAnchor}
                      fontSize="9"
                      fontWeight="bold"
                      fill="#2563EB"
                    >
                      {item.rate}%
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          <div className="flex-1 w-full space-y-2">
            {radarItems.map((item) => (
              <div key={item.label} className="bg-slate-50/80 p-2 rounded-xl border border-slate-200/60 flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700">{item.label}</span>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 text-[11px]">{item.value}</span>
                  <div className="w-16 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        item.rate >= 90 ? 'bg-emerald-500' : item.rate >= 70 ? 'bg-blue-500' : 'bg-amber-500'
                      }`}
                      style={{ width: `${item.rate}%` }}
                    />
                  </div>
                  <span className="font-black text-slate-800 text-[11px] w-8 text-right">{item.rate}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold text-slate-800">日別カロリー推移 ＆ 目標ライン</h3>
            <span className="text-[11px] text-slate-500 font-medium">目標: {targetDailyCal} kcal</span>
          </div>

          <div className="h-28 flex items-end gap-1.5 pt-4 pb-1 border-b border-slate-200 relative">
            <div
              className="absolute left-0 right-0 border-b border-dashed border-rose-400 z-10 pointer-events-none"
              style={{ bottom: `${(targetDailyCal / 2800) * 100}%` }}
            >
              <span className="absolute right-0 -top-4 text-[9px] font-bold text-rose-500 bg-white/90 px-1 rounded">
                目標 2,000
              </span>
            </div>

            {displayDays.map((dStr) => {
              const cal = dailyCalorieMap[dStr] || 0;
              const barHeightPct = Math.min(100, (cal / 2800) * 100);
              const isOver = cal > targetDailyCal;
              const dayLabel = dStr.slice(8);

              return (
                <div key={dStr} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                  {cal > 0 && (
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-5 text-[9px] font-bold bg-slate-900 text-white px-1 rounded pointer-events-none z-20 whitespace-nowrap">
                      {cal}kcal
                    </span>
                  )}
                  <div
                    className={`w-full max-w-[18px] rounded-t transition-all ${
                      cal === 0
                        ? 'bg-slate-200 h-1'
                        : isOver
                        ? 'bg-amber-500 hover:bg-amber-600'
                        : 'bg-blue-500 hover:bg-blue-600'
                    }`}
                    style={{ height: `${Math.max(4, barHeightPct)}%` }}
                  />
                  <span className="text-[9px] text-slate-500 mt-1">{dayLabel}</span>
                </div>
              );
            })}
          </div>

          <div className="mt-3.5 bg-slate-50 p-3 rounded-xl border border-slate-200/70">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-bold text-slate-800">PFCバランス（三大栄養素比率）</span>
              <span className="text-[11px] text-slate-500">タンパク質・脂質・炭水化物</span>
            </div>
            <div className="w-full h-3 rounded-full overflow-hidden flex bg-slate-200 mb-2">
              <div className="bg-blue-500 h-full transition-all" style={{ width: `${pPct}%` }} />
              <div className="bg-amber-400 h-full transition-all" style={{ width: `${fPct}%` }} />
              <div className="bg-emerald-500 h-full transition-all" style={{ width: `${cPct}%` }} />
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="bg-white p-1.5 rounded-lg border border-slate-200/60">
                <div className="flex items-center justify-center gap-1 text-[10px] text-blue-600 font-bold mb-0.5">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  <span>P (タンパク質)</span>
                </div>
                <div className="font-bold text-slate-800 text-xs">{Math.round(avgProtein)}g ({pPct}%)</div>
              </div>
              <div className="bg-white p-1.5 rounded-lg border border-slate-200/60">
                <div className="flex items-center justify-center gap-1 text-[10px] text-amber-600 font-bold mb-0.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  <span>F (脂質)</span>
                </div>
                <div className="font-bold text-slate-800 text-xs">{Math.round(avgFat)}g ({fPct}%)</div>
              </div>
              <div className="bg-white p-1.5 rounded-lg border border-slate-200/60">
                <div className="flex items-center justify-center gap-1 text-[10px] text-emerald-600 font-bold mb-0.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>C (炭水化物)</span>
                </div>
                <div className="font-bold text-slate-800 text-xs">{Math.round(avgCarbs)}g ({cPct}%)</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h2 className="text-sm font-bold text-slate-900">運動・部位別バランス</h2>
            <p className="text-xs text-slate-500">胸・背中・脚・肩・腕・体幹の刺激比率</p>
          </div>
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/60">
            部位バランス
          </span>
        </div>

        <div className="space-y-2 my-3">
          {partList.map((p) => (
            <div key={p.name} className="flex items-center gap-2 text-xs">
              <span className="w-10 font-bold text-slate-700 flex-shrink-0">{p.name}</span>
              <div className="flex-1 bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className={`h-full rounded-full ${p.color} transition-all duration-500`}
                  style={{ width: `${Math.max(3, p.pct)}%` }}
                />
              </div>
              <span className="w-14 text-right font-bold text-slate-700 text-[11px] tabular-nums">
                {p.sets}set ({p.pct}%)
              </span>
            </div>
          ))}
        </div>

        <div className="bg-blue-50/70 border border-blue-200/80 rounded-xl p-3 flex items-start gap-2.5 mt-3">
          <span className="text-base flex-shrink-0">💡</span>
          <div>
            <span className="text-xs font-bold text-blue-900 block mb-0.5">部位バランス・ワンポイント分析</span>
            <p className="text-xs text-blue-800 leading-relaxed font-medium">
              {workoutInsight}
            </p>
          </div>
        </div>
      </section>

      <section className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h2 className="text-sm font-bold text-slate-900">体重・BMI推移グラフ</h2>
            <p className="text-xs text-slate-500">直近の推移と適正範囲判定</p>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200/70">
              最新: {latestWeight ? `${latestWeight}kg` : '-'}
            </span>
          </div>
        </div>

        {displayMetrics.length > 0 ? (
          <div>
            <div className="w-full flex justify-center py-2 overflow-x-auto">
              <svg width={chartW} height={chartH} viewBox={`0 0 ${chartW} ${chartH}`} className="overflow-visible">
                <line x1={chartPadX} y1={chartPadY} x2={chartW - chartPadX} y2={chartPadY} stroke="#F1F5F9" strokeWidth="1" />
                <line x1={chartPadX} y1={chartH / 2} x2={chartW - chartPadX} y2={chartH / 2} stroke="#F1F5F9" strokeWidth="1" />
                <line x1={chartPadX} y1={chartH - chartPadY} x2={chartW - chartPadX} y2={chartH - chartPadY} stroke="#E2E8F0" strokeWidth="1" />

                <polyline
                  points={weightPolyline}
                  fill="none"
                  stroke="#2563EB"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {metricPoints.map((pt, idx) => (
                  <g key={idx}>
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r="4"
                      fill="#FFFFFF"
                      stroke="#2563EB"
                      strokeWidth="2.5"
                    />
                    <text
                      x={pt.x}
                      y={pt.y - 7}
                      textAnchor="middle"
                      fontSize="9"
                      fontWeight="bold"
                      fill="#1E293B"
                    >
                      {pt.weight}
                    </text>
                    <text
                      x={pt.x}
                      y={chartH - 4}
                      textAnchor="middle"
                      fontSize="8"
                      fontWeight="bold"
                      fill="#64748B"
                    >
                      {pt.date.slice(5)}
                    </text>
                  </g>
                ))}
              </svg>
            </div>

            <div className="mt-2 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-slate-800">最新BMI: {currentBmi || '-'}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  currentBmi >= 18.5 && currentBmi < 25
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}>
                  {currentBmi >= 18.5 && currentBmi < 25 ? '普通体重 (適正)' : currentBmi < 18.5 ? '低体重' : '肥満気味'}
                </span>
              </div>
              <span className="text-[11px] text-slate-500">身長設定: {heightCm}cm</span>
            </div>
          </div>
        ) : (
          <div className="p-6 text-center text-slate-500 text-xs">
            体重推移データがまだありません。「体重推移」タブから記録してください。
          </div>
        )}
      </section>

      {advice && (
        <section className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-bold text-slate-900">{advice.title}</h2>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/60">
              {advice.tag}
            </span>
          </div>
          <div className="space-y-2 text-xs">
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
              <span className="text-[10px] text-blue-600 font-bold block mb-0.5">実績評価:</span>
              <p className="text-slate-800 font-medium leading-relaxed">{advice.praise}</p>
            </div>
            <p className="text-slate-600 leading-relaxed px-1 text-[11px]">{advice.advice}</p>
            <div className="bg-emerald-50/70 p-2.5 rounded-xl border border-emerald-200/60">
              <span className="text-[10px] text-emerald-700 font-bold block mb-0.5">次回おすすめアクション:</span>
              <p className="text-emerald-900 font-bold leading-relaxed">{advice.next_action}</p>
            </div>
          </div>
        </section>
      )}

      {correlation && correlation.summary && (
        <section className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-bold text-slate-900">運動・食事の因果関係インサイト</h2>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/60">
              {correlation.summary.correlation_score}
            </span>
          </div>
          <p className="text-xs font-bold text-slate-800 mb-2 leading-relaxed">
            {correlation.summary.headline}
          </p>
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/60 text-xs text-slate-700 leading-relaxed mb-2">
            {correlation.summary.insight}
          </div>
          <div className="bg-blue-50/60 p-2.5 rounded-xl border border-blue-200/60 text-xs text-blue-900 font-bold leading-relaxed">
            {correlation.summary.recommendation}
          </div>
        </section>
      )}

      <section className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4">
        <div className="flex items-center justify-between mb-2.5">
          <h2 className="text-sm font-bold text-slate-900">直近の活動ログ</h2>
          <span className="text-xs text-slate-500 font-medium">最新 {workouts.length + meals.length} 件</span>
        </div>

        {workouts.length === 0 && meals.length === 0 ? (
          <div className="p-6 text-center text-slate-400 text-xs">記録がまだありません</div>
        ) : (
          <div className="space-y-2">
            {[...workouts.slice(0, 5), ...meals.slice(0, 5)]
              .sort((a, b) => (b.timestamp || b.log_date || '').localeCompare(a.timestamp || a.log_date || ''))
              .slice(0, 6)
              .map((item, idx) => {
                const isWorkout = item.workout_type !== undefined;
                return (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-slate-50/70 border border-slate-200/70 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                        isWorkout ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {isWorkout ? '運動' : '食事'}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-900">{item.menu_name}</span>
                          <span className="text-[10px] text-slate-400">{item.log_date}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 line-clamp-1">
                          {isWorkout
                            ? `${item.workout_type === 'gym' ? 'ジム' : '宅トレ'}: ${item.reps ? `${item.reps}回` : ''} ${item.sets ? `${item.sets}set` : ''} ${item.duration_minutes ? `${item.duration_minutes}分` : ''}`
                            : `${item.calories || 0} kcal (P:${item.protein_g || 0}g)`}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </section>
    </div>
  );
}
