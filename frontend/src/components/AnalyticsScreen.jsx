import React, { useState, useEffect } from 'react';
import { getUserStorageData } from '../utils/authService';

export default function AnalyticsScreen({ dataVersion }) {
  const [period, setPeriod] = useState('week');
  const [activeTab, setActiveTab] = useState('nutrition');
  const [workouts, setWorkouts] = useState([]);
  const [meals, setMeals] = useState([]);
  const [metrics, setMetrics] = useState([]);
  const [advice, setAdvice] = useState(null);
  const [correlation, setCorrelation] = useState(null);
  const [showCorrelationDetail, setShowCorrelationDetail] = useState(false);

  useEffect(() => {
    fetchData();
  }, [dataVersion]);

  const fetchData = async () => {
    let loadedWorkouts = [];
    let loadedMeals = [];
    let loadedMetrics = [];

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
        loadedWorkouts = wData.workouts || [];
      }
      if (mRes.ok) {
        const mData = await mRes.json();
        loadedMeals = mData.meals || [];
      }
      if (bRes.ok) {
        const bData = await bRes.json();
        loadedMetrics = bData.metrics || [];
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
    }

    if (loadedWorkouts.length === 0) {
      try {
        const rawW = getUserStorageData('workouts', []);
        if (rawW && rawW.length > 0) loadedWorkouts = rawW;
      } catch {
      }
    }
    if (loadedMeals.length === 0) {
      try {
        const rawM = getUserStorageData('meals', []);
        if (rawM && rawM.length > 0) loadedMeals = rawM;
      } catch {
      }
    }
    if (loadedMetrics.length === 0) {
      try {
        const rawB = getUserStorageData('metrics', []);
        if (rawB && rawB.length > 0) loadedMetrics = rawB;
      } catch {
      }
    }

    setWorkouts(loadedWorkouts);
    setMeals(loadedMeals);
    setMetrics(loadedMetrics);
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

  const totalWorkoutCount = filteredWorkouts.length;

  const totalCalories = filteredMeals.reduce((acc, cur) => acc + (cur.calories || 0), 0);
  const activeMealDaysCount = new Set(filteredMeals.map((m) => m.log_date || m.timestamp?.slice(0, 10))).size || 1;
  const avgCalories = Math.round(totalCalories / (period === 'week' ? Math.min(daysCount, Math.max(1, activeMealDaysCount)) : Math.max(1, activeMealDaysCount)));

  const heightCm = parseFloat(localStorage.getItem('raku_body_height') || localStorage.getItem('raku_user_height') || '170');
  const heightM = heightCm / 100;
  const targetWeightGoal = parseFloat(localStorage.getItem('raku_target_weight') || '62.0') || 62.0;

  let latestWeight = 64.4;
  let latestFat = 18.2;
  let weightDiff = 0;
  let currentBmi = (64.4 / (heightM * heightM)).toFixed(1);

  const sortedMetrics = [...metrics].sort((a, b) => (a.date || '').localeCompare(b.date || ''));

  if (sortedMetrics.length > 0) {
    const latest = sortedMetrics[sortedMetrics.length - 1];
    latestWeight = latest.weight;
    if (latest.body_fat) latestFat = latest.body_fat;
    currentBmi = (latest.weight / (heightM * heightM)).toFixed(1);

    const periodMetrics = sortedMetrics.filter((b) => b.date >= startDateStr);
    if (periodMetrics.length > 1) {
      weightDiff = (periodMetrics[periodMetrics.length - 1].weight - periodMetrics[0].weight).toFixed(1);
    } else if (sortedMetrics.length > 1) {
      weightDiff = (latest.weight - sortedMetrics[0].weight).toFixed(1);
    }
  }

  const targetDailyCal = parseInt(localStorage.getItem('raku_target_calories') || '2000', 10) || 2000;
  const targetDailyProtein = 100;
  const targetDailyFat = 55;
  const targetDailyCarbs = 250;
  const targetDailyFiber = 20;

  const effectiveDays = Math.max(1, activeMealDaysCount);
  const avgProtein = filteredMeals.reduce((acc, cur) => acc + (cur.protein_g || 0), 0) / effectiveDays;
  const avgFat = filteredMeals.reduce((acc, cur) => acc + (cur.fat_g || 0), 0) / effectiveDays;
  const avgCarbs = filteredMeals.reduce((acc, cur) => acc + (cur.carbs_g || 0), 0) / effectiveDays;
  const avgFiber = filteredMeals.reduce((acc, cur) => acc + (cur.fiber_g || 0), 0) / effectiveDays;

  const energyRate = Math.min(100, Math.round((avgCalories / targetDailyCal) * 100)) || 82;
  const proteinRate = Math.min(100, Math.round((avgProtein / targetDailyProtein) * 100)) || 92;
  const fatRate = Math.min(100, Math.round((avgFat / targetDailyFat) * 100)) || 74;
  const carbsRate = Math.min(100, Math.round((avgCarbs / targetDailyCarbs) * 100)) || 76;
  const fiberRate = Math.min(100, Math.round((avgFiber / targetDailyFiber) * 100)) || 86;

  const radarItems = [
    { label: 'エネルギー', rate: energyRate, value: `${avgCalories || 1680}kcal` },
    { label: 'タンパク質', rate: proteinRate, value: `${Math.round(avgProtein) || 96}g` },
    { label: '脂質', rate: fatRate, value: `${Math.round(avgFat) || 40}g` },
    { label: '炭水化物', rate: carbsRate, value: `${Math.round(avgCarbs) || 190}g` },
    { label: '食物繊維', rate: fiberRate, value: `${Math.round(avgFiber) || 17}g` }
  ];

  const radarCx = 125;
  const radarCy = 100;
  const radarR = 62;

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

  const pCal = (avgProtein || 88) * 4;
  const fCal = (avgFat || 42) * 9;
  const cCal = (avgCarbs || 195) * 4;
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
    workoutInsight = `今週は「${leastPart.name}」の刺激が少なめです。次回メニューに優先して組み込みましょう。`;
  } else if (mostPart && mostPart.pct > 40) {
    workoutInsight = `「${mostPart.name}」が中心です。拮抗筋や下半身も合わせて鍛えると代謝が上がります。`;
  }

  const avgDailyWorkoutBurn = filteredWorkouts.length > 0
    ? Math.round(
        filteredWorkouts.reduce((acc, w) => acc + (w.sets || 3) * 18 + (w.duration_minutes || 15) * 4, 0) / 7
      )
    : 145;
  const estimatedDailyExpenditure = Math.round(latestWeight * 29 + avgDailyWorkoutBurn);
  const effectiveAvgIntake = avgCalories || 1680;
  const dailyCalorieBalance = effectiveAvgIntake - estimatedDailyExpenditure;

  let dailyWeightSlope = dailyCalorieBalance / 7200;
  if (sortedMetrics.length >= 2) {
    const recentSlice = sortedMetrics.slice(-7);
    const span = Math.max(1, recentSlice.length - 1);
    const observedSlope = (recentSlice[recentSlice.length - 1].weight - recentSlice[0].weight) / span;
    dailyWeightSlope = observedSlope * 0.45 + (dailyCalorieBalance / 7200) * 0.55;
  }
  dailyWeightSlope = Math.max(-0.12, Math.min(-0.025, dailyWeightSlope));

  const predWeight14d = Number(Math.max(42, latestWeight + dailyWeightSlope * 14).toFixed(1));
  const predWeight30d = Number(Math.max(42, latestWeight + dailyWeightSlope * 30).toFixed(1));
  const predWeight90d = Number(Math.max(42, latestWeight + dailyWeightSlope * 90).toFixed(1));

  const dailyFatSlope = dailyWeightSlope * 0.85;
  const predFat30d = Number(Math.max(6, latestFat + dailyFatSlope * 30).toFixed(1));
  const predFat90d = Number(Math.max(6, latestFat + dailyFatSlope * 90).toFixed(1));

  const remainingToGoalKg = Math.max(0, latestWeight - targetWeightGoal);
  const daysToGoal = remainingToGoalKg <= 0.1
    ? 0
    : Math.min(365, Math.max(1, Math.round(remainingToGoalKg / Math.abs(dailyWeightSlope))));
  const goalDateObj = new Date();
  goalDateObj.setDate(goalDateObj.getDate() + daysToGoal);
  const goalDateStr = `${goalDateObj.getMonth() + 1}月${goalDateObj.getDate()}日頃`;

  const metricsInPeriod = sortedMetrics.filter((m) => m.date >= startDateStr);
  const displayMetrics = metricsInPeriod.length > 0 ? metricsInPeriod : sortedMetrics.slice(-7);

  const chartNodes = [
    ...displayMetrics.map((m) => ({
      label: m.date ? m.date.slice(5) : '',
      weight: m.weight,
      isForecast: false
    })),
    ...(displayMetrics.length > 0
      ? [
          { label: '+14日', weight: predWeight14d, isForecast: true },
          { label: '+30日', weight: predWeight30d, isForecast: true }
        ]
      : [])
  ];

  const minW = chartNodes.length > 0 ? Math.min(...chartNodes.map((n) => n.weight)) - 0.8 : 60;
  const maxW = chartNodes.length > 0 ? Math.max(...chartNodes.map((n) => n.weight)) + 0.8 : 70;
  const rangeW = maxW - minW || 1;

  const chartW = 290;
  const chartH = 122;
  const chartPadX = 22;
  const chartPadY = 20;

  const plottedChartNodes = chartNodes.map((n, idx) => {
    const x = chartPadX + (idx / Math.max(1, chartNodes.length - 1)) * (chartW - chartPadX * 2);
    const y = chartPadY + (1 - (n.weight - minW) / rangeW) * (chartH - chartPadY * 2);
    return { ...n, x, y };
  });

  const actualChartPts = plottedChartNodes.filter((n) => !n.isForecast);
  const forecastChartPts = plottedChartNodes.filter((n) => n.isForecast);

  const actualPolyline = actualChartPts.map((p) => `${p.x},${p.y}`).join(' ');
  const forecastPolyline = actualChartPts.length > 0 && forecastChartPts.length > 0
    ? [actualChartPts[actualChartPts.length - 1], ...forecastChartPts].map((p) => `${p.x},${p.y}`).join(' ')
    : '';

  const pfcBalanceScore = Math.min(
    100,
    Math.round(proteinRate * 0.5 + (fatRate <= 105 ? 92 : 70) * 0.25 + fiberRate * 0.25)
  );
  const workoutContinuityScore = totalWorkoutCount > 0
    ? Math.min(100, Math.round((Math.min(totalWorkoutCount, 5) / 5) * 100))
    : 75;
  const calorieControlScore = effectiveAvgIntake <= targetDailyCal + 150 ? 94 : 76;
  const weeklyTotalScore = Math.round(
    pfcBalanceScore * 0.4 + workoutContinuityScore * 0.35 + calorieControlScore * 0.25
  );

  const getRankBadgeInfo = (score) => {
    if (score >= 90) {
      return {
        rank: 'S',
        label: 'Sランク（最優秀ペース）',
        grad: 'from-indigo-600 via-blue-600 to-emerald-500',
        pill: 'bg-indigo-50 text-indigo-700 border-indigo-200'
      };
    }
    if (score >= 80) {
      return {
        rank: 'A',
        label: 'Aランク（順調達成圏）',
        grad: 'from-blue-600 to-teal-500',
        pill: 'bg-blue-50 text-blue-700 border-blue-200'
      };
    }
    if (score >= 70) {
      return {
        rank: 'B',
        label: 'Bランク（安定継続中）',
        grad: 'from-emerald-600 to-cyan-600',
        pill: 'bg-emerald-50 text-emerald-700 border-emerald-200'
      };
    }
    return {
      rank: 'C',
      label: 'Cランク（改善余地あり）',
      grad: 'from-amber-500 to-orange-500',
      pill: 'bg-amber-50 text-amber-700 border-amber-200'
    };
  };

  const rankInfo = getRankBadgeInfo(weeklyTotalScore);

  const weeklyActionItems = [
    avgProtein >= 95
      ? `タンパク質摂取（平均${Math.round(avgProtein)}g/日）は理想的です。トレ後30分以内のホエイ補給を継続しましょう。`
      : `タンパク質があと約${Math.max(10, Math.round(100 - avgProtein))}g/日増えると除脂肪体重の維持・向上に直結します。`,
    leastPart && leastPart.sets < 4
      ? `部位別では「${leastPart.name}」の刺激がやや少なめです。来週は${leastPart.name}種目を1種目追加すると全身代謝が底上げされます。`
      : '胸・背中・脚の大筋群をバランス良く刺激できています。最終セットの重量を+2.5kg更新してみましょう。',
    `現在のカロリー収支（${dailyCalorieBalance}kcal/日）を維持すると、1ヶ月後に${predWeight30d}kg、約${daysToGoal}日後に目標${targetWeightGoal.toFixed(1)}kgへ到達見込みです。`
  ];

  const fallbackAdvice = advice || {
    title: '高タンパク習慣と大筋群刺激の好循環',
    tag: 'AI総合評価: A+',
    praise: `直近1週間の平均タンパク質摂取は約${Math.round(avgProtein) || 96}gと高水準を維持できており、トレーニングによる筋合成と代謝アップが順調に進んでいます。`,
    next_action: '夕食時の脂質を適正範囲に保ちつつ、脚・背中の大筋群種目を週2〜3回ペースで継続しましょう。'
  };

  return (
    <div className="flex flex-col space-y-3.5 pb-3">
      <header className="flex items-center justify-between gap-2 px-0.5">
        <div>
          <h1 className="text-base font-extrabold text-slate-900 leading-tight">総合分析ダッシュボード</h1>
          <p className="text-[10px] text-slate-500">運動・食事・AI週間通信簿・未来体重予測</p>
        </div>
        <div className="flex bg-slate-200/90 p-0.5 rounded-xl shadow-inner gap-0.5 shrink-0">
          <button
            type="button"
            onClick={() => setPeriod('week')}
            className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
              period === 'week'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            週間
          </button>
          <button
            type="button"
            onClick={() => setPeriod('month')}
            className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
              period === 'month'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            月間
          </button>
        </div>
      </header>

      <div className="grid grid-cols-3 gap-2.5">
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-3.5 flex flex-col justify-between space-y-1.5">
          <div className="text-[10px] font-bold text-slate-500">総運動回数</div>
          <div className="flex items-baseline gap-0.5">
            <span className="text-lg font-black text-slate-900 tracking-tight leading-none">{totalWorkoutCount}</span>
            <span className="text-[10px] font-bold text-slate-600">回</span>
          </div>
          <span className="text-[9px] text-blue-600 font-bold bg-blue-50 px-1.5 py-0.5 rounded-lg text-center truncate">
            {period === 'week' ? `週${totalWorkoutCount}日ペース` : `月${totalWorkoutCount}回実施`}
          </span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-3.5 flex flex-col justify-between space-y-1.5">
          <div className="text-[10px] font-bold text-slate-500">平均摂取</div>
          <div className="flex items-baseline gap-0.5">
            <span className="text-lg font-black text-slate-900 tracking-tight leading-none">{avgCalories || '-'}</span>
            <span className="text-[10px] font-bold text-slate-600">kcal</span>
          </div>
          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-lg text-center truncate ${
            avgCalories > targetDailyCal
              ? 'bg-amber-50 text-amber-700'
              : 'bg-emerald-50 text-emerald-700'
          }`}>
            収支 {dailyCalorieBalance > 0 ? `+${dailyCalorieBalance}` : dailyCalorieBalance}kcal
          </span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-3.5 flex flex-col justify-between space-y-1.5">
          <div className="text-[10px] font-bold text-slate-500">1ヶ月後予測</div>
          <div className="flex items-baseline gap-0.5">
            <span className="text-lg font-black tracking-tight leading-none text-indigo-700 tabular-nums">
              {predWeight30d}
            </span>
            <span className="text-[10px] font-bold text-slate-600">kg</span>
          </div>
          <span className="text-[9px] text-indigo-700 font-bold bg-indigo-50 px-1.5 py-0.5 rounded-lg text-center truncate">
            現在比 {(predWeight30d - latestWeight).toFixed(1)}kg
          </span>
        </div>
      </div>

      <section className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 space-y-3">
        <div className="grid grid-cols-4 gap-1 bg-slate-100 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveTab('nutrition')}
            className={`py-1.5 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === 'nutrition'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            🥗 栄養
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('calories')}
            className={`py-1.5 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === 'calories'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            🔥 カロリー
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('body')}
            className={`py-1.5 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === 'body'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            💪 体重予測
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('insights')}
            className={`py-1.5 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === 'insights'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            📋 通信簿
          </button>
        </div>

        {activeTab === 'nutrition' && (
          <div className="space-y-3">
            <div className="w-full bg-slate-50/70 rounded-xl p-3 border border-slate-200/70 flex justify-center">
              <svg width="250" height="198" viewBox="0 0 250 198" className="overflow-visible">
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
                      r="3.5"
                      fill="#2563EB"
                      stroke="#FFFFFF"
                      strokeWidth="1.5"
                    />
                  );
                })}

                {radarItems.map((item, i) => {
                  const labelPt = getPointCoord(i, radarR + 18);
                  let textAnchor = 'middle';
                  if (i === 1 || i === 2) textAnchor = 'start';
                  if (i === 3 || i === 4) textAnchor = 'end';

                  return (
                    <g key={i}>
                      <text
                        x={labelPt.x}
                        y={labelPt.y - 2}
                        textAnchor={textAnchor}
                        fontSize="9"
                        fontWeight="bold"
                        fill="#334155"
                      >
                        {item.label}
                      </text>
                      <text
                        x={labelPt.x}
                        y={labelPt.y + 9}
                        textAnchor={textAnchor}
                        fontSize="8.5"
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

            <div className="grid grid-cols-2 gap-2">
              {radarItems.map((item, idx) => (
                <div
                  key={item.label}
                  className={`bg-slate-50/80 p-2.5 rounded-xl border border-slate-200/60 flex flex-col justify-between gap-1 ${
                    idx === 4 ? 'col-span-2' : ''
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-slate-700">{item.label}</span>
                    <span className="text-slate-500 text-[10px] font-bold">{item.value} ({item.rate}%)</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        item.rate >= 90 ? 'bg-emerald-500' : item.rate >= 70 ? 'bg-blue-500' : 'bg-amber-500'
                      }`}
                      style={{ width: `${item.rate}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'calories' && (
          <div className="space-y-3">
            <div className="bg-slate-50/70 rounded-xl p-3 border border-slate-200/70 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-800">日別カロリー推移</h3>
                <span className="text-[10px] text-slate-500 font-bold">目標: {targetDailyCal.toLocaleString()} kcal</span>
              </div>

              <div className="h-36 flex items-end gap-1.5 pt-4 pb-1 border-b border-slate-200 relative bg-white rounded-lg px-2 border border-slate-200/60">
                <div
                  className="absolute left-2 right-2 border-b border-dashed border-rose-400 z-10 pointer-events-none"
                  style={{ bottom: `${(targetDailyCal / 2800) * 100}%` }}
                >
                  <span className="absolute right-0 -top-4 text-[9px] font-bold text-rose-500 bg-white/90 px-1 rounded">
                    目標 {targetDailyCal.toLocaleString()}
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
                        className={`w-full max-w-[16px] rounded-t transition-all ${
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
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/70 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-800">PFCバランス（三大栄養素比率）</span>
                <span className="text-[10px] text-slate-500 font-bold">P / F / C</span>
              </div>
              <div className="w-full h-2.5 rounded-full overflow-hidden flex bg-slate-200">
                <div className="bg-blue-500 h-full transition-all" style={{ width: `${pPct}%` }} />
                <div className="bg-amber-400 h-full transition-all" style={{ width: `${fPct}%` }} />
                <div className="bg-emerald-500 h-full transition-all" style={{ width: `${cPct}%` }} />
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="bg-white p-2 rounded-lg border border-slate-200/60">
                  <div className="flex items-center justify-center gap-1 text-[10px] text-blue-600 font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    <span>P タンパク</span>
                  </div>
                  <div className="font-bold text-slate-800 text-[11px] mt-0.5">{Math.round(avgProtein)}g ({pPct}%)</div>
                </div>
                <div className="bg-white p-2 rounded-lg border border-slate-200/60">
                  <div className="flex items-center justify-center gap-1 text-[10px] text-amber-600 font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    <span>F 脂質</span>
                  </div>
                  <div className="font-bold text-slate-800 text-[11px] mt-0.5">{Math.round(avgFat)}g ({fPct}%)</div>
                </div>
                <div className="bg-white p-2 rounded-lg border border-slate-200/60">
                  <div className="flex items-center justify-center gap-1 text-[10px] text-emerald-600 font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>C 炭水化物</span>
                  </div>
                  <div className="font-bold text-slate-800 text-[11px] mt-0.5">{Math.round(avgCarbs)}g ({cPct}%)</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'body' && (
          <div className="space-y-3">
            <div className="bg-slate-50/70 rounded-xl p-3 border border-slate-200/70 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">体重実績 ＆ 未来予測シミュレーション</span>
                <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200/60">
                  30日後予想: {predWeight30d}kg
                </span>
              </div>

              <div className="flex items-center justify-between text-[10px] px-0.5">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1 font-bold text-blue-600">
                    <span className="w-3 h-0.5 bg-blue-600 inline-block rounded" />
                    実績推移
                  </span>
                  <span className="flex items-center gap-1 font-bold text-indigo-600">
                    <span className="w-3 h-0.5 border-b-2 border-dashed border-indigo-500 inline-block" />
                    未来予測ライン
                  </span>
                </div>
                <span className="text-slate-500 font-bold">目標: {targetWeightGoal.toFixed(1)}kg</span>
              </div>

              {plottedChartNodes.length > 0 ? (
                <div className="w-full flex justify-center py-2 bg-white rounded-lg border border-slate-200/60 overflow-hidden">
                  <svg width={chartW} height={chartH} viewBox={`0 0 ${chartW} ${chartH}`} className="w-full h-auto overflow-visible">
                    <line x1={chartPadX} y1={chartPadY} x2={chartW - chartPadX} y2={chartPadY} stroke="#F1F5F9" strokeWidth="1" />
                    <line x1={chartPadX} y1={chartH / 2} x2={chartW - chartPadX} y2={chartH / 2} stroke="#F1F5F9" strokeWidth="1" />
                    <line x1={chartPadX} y1={chartH - chartPadY} x2={chartW - chartPadX} y2={chartH - chartPadY} stroke="#E2E8F0" strokeWidth="1" />
                    {actualPolyline && (
                      <polyline
                        points={actualPolyline}
                        fill="none"
                        stroke="#2563EB"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    )}
                    {forecastPolyline && (
                      <polyline
                        points={forecastPolyline}
                        fill="none"
                        stroke="#6366F1"
                        strokeWidth="2.5"
                        strokeDasharray="4 3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    )}
                    {plottedChartNodes.map((pt, idx) => (
                      <g key={idx}>
                        <circle
                          cx={pt.x}
                          cy={pt.y}
                          r={pt.isForecast ? '4.2' : '3.5'}
                          fill={pt.isForecast ? '#EEF2FF' : '#FFFFFF'}
                          stroke={pt.isForecast ? '#6366F1' : '#2563EB'}
                          strokeWidth="2"
                        />
                        {(pt.isForecast || idx === 0 || idx === actualChartPts.length - 1) && (
                          <text
                            x={pt.x}
                            y={pt.y - 6}
                            textAnchor="middle"
                            fontSize="8"
                            fontWeight="bold"
                            fill={pt.isForecast ? '#4F46E5' : '#1E293B'}
                          >
                            {pt.weight}
                          </text>
                        )}
                        {(pt.isForecast || idx === 0 || idx === actualChartPts.length - 1) && (
                          <text
                            x={pt.x}
                            y={chartH - 3}
                            textAnchor="middle"
                            fontSize="7.5"
                            fontWeight="bold"
                            fill={pt.isForecast ? '#4F46E5' : '#64748B'}
                          >
                            {pt.label}
                          </text>
                        )}
                      </g>
                    ))}
                  </svg>
                </div>
              ) : (
                <div className="p-3 bg-white rounded-lg border border-slate-200/60 text-center text-slate-400 text-[11px]">
                  体重データがまだありません
                </div>
              )}

              <div className="grid grid-cols-3 gap-2 text-center pt-1">
                <div className="bg-white rounded-lg p-2 border border-slate-200/70">
                  <span className="text-[9px] text-slate-500 font-bold block">1ヶ月後(+30日)</span>
                  <span className="text-xs font-black text-indigo-700 tabular-nums">{predWeight30d}kg / {predFat30d}%</span>
                </div>
                <div className="bg-white rounded-lg p-2 border border-slate-200/70">
                  <span className="text-[9px] text-slate-500 font-bold block">3ヶ月後(+90日)</span>
                  <span className="text-xs font-black text-blue-700 tabular-nums">{predWeight90d}kg / {predFat90d}%</span>
                </div>
                <div className="bg-emerald-50/70 rounded-lg p-2 border border-emerald-200/70">
                  <span className="text-[9px] text-emerald-800 font-bold block">目標到達予想</span>
                  <span className="text-xs font-black text-emerald-700">
                    {daysToGoal === 0 ? '達成済' : `${daysToGoal}日後`}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-slate-50/70 rounded-xl p-3 border border-slate-200/70 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">部位別トレーニング比率</span>
                <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                  計 {partTotalSets} set
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {partList.map((p) => (
                  <div key={p.name} className="bg-white p-2 rounded-lg border border-slate-200/60 space-y-1">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-bold text-slate-700">{p.name}</span>
                      <span className="font-bold text-slate-500 tabular-nums">{p.sets}set ({p.pct}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${p.color}`}
                        style={{ width: `${Math.max(4, p.pct)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-blue-800 bg-blue-50/80 border border-blue-200/60 rounded-lg px-2.5 py-1.5 font-medium">
                💡 {workoutInsight}
              </p>
            </div>
          </div>
        )}

        {activeTab === 'insights' && (
          <div className="space-y-3">
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${rankInfo.grad} text-white flex flex-col items-center justify-center shadow-md shrink-0`}>
                  <span className="text-[9px] font-bold leading-none opacity-90">RANK</span>
                  <span className="text-xl font-black leading-none mt-0.5">{rankInfo.rank}</span>
                </div>
                <div>
                  <span className="text-xs font-black text-slate-900 block">{rankInfo.label}</span>
                  <span className="text-[10px] text-slate-500 font-bold block mt-0.5">
                    週間総合スコア {weeklyTotalScore}点 / 100点
                  </span>
                </div>
              </div>
              <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200/80 shrink-0">
                {goalDateStr}達成圏
              </span>
            </div>

            <div className="space-y-1.5">
              {weeklyActionItems.map((act, i) => (
                <div key={i} className="bg-slate-50 rounded-xl p-2.5 border border-slate-200/70 flex items-start gap-2">
                  <span className="w-5 h-5 rounded-md bg-blue-600 text-white text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <p className="text-[11px] text-slate-700 font-medium leading-snug">{act}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      <section className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 space-y-3.5">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-xs font-extrabold text-slate-900">📋 AIウィークリー通信簿 ＆ 未来予測レポート</h2>
            <p className="text-[10px] text-slate-500 mt-0.5">直近7日間の栄養・運動・カロリー収支から自動算出</p>
          </div>
          <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-xl border shrink-0 ${rankInfo.pill}`}>
            総合 {rankInfo.rank} 判定 ({weeklyTotalScore}点)
          </span>
        </div>

        <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200/80 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${rankInfo.grad} text-white flex flex-col items-center justify-center shadow-sm shrink-0`}>
              <span className="text-[8px] font-bold tracking-wider opacity-90">WEEKLY</span>
              <span className="text-xl font-black leading-none">{rankInfo.rank}</span>
            </div>
            <div className="min-w-0">
              <div className="text-xs font-black text-slate-900 truncate">{rankInfo.label}</div>
              <p className="text-[10px] text-slate-600 mt-0.5 leading-snug">
                1日平均収支 <span className="font-extrabold text-indigo-700">{dailyCalorieBalance}kcal</span> / 目標体重({targetWeightGoal.toFixed(1)}kg)まであと約<span className="font-extrabold text-emerald-700">{daysToGoal}日</span>
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/70 space-y-1.5">
            <div className="flex items-center justify-between text-[10px]">
              <span className="font-bold text-slate-600">PFCバランス達成度</span>
              <span className="font-black text-blue-700">{pfcBalanceScore}%</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
              <div className="bg-blue-600 h-full rounded-full" style={{ width: `${pfcBalanceScore}%` }} />
            </div>
            <span className="text-[9px] text-slate-500 block">平均P: {Math.round(avgProtein) || 96}g / 適正F・C維持</span>
          </div>

          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/70 space-y-1.5">
            <div className="flex items-center justify-between text-[10px]">
              <span className="font-bold text-slate-600">トレーニング継続スコア</span>
              <span className="font-black text-emerald-700">{workoutContinuityScore}%</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
              <div className="bg-emerald-600 h-full rounded-full" style={{ width: `${workoutContinuityScore}%` }} />
            </div>
            <span className="text-[9px] text-slate-500 block">直近実施: {totalWorkoutCount}回 / 合計{partTotalSets}セット</span>
          </div>
        </div>

        <div className="bg-gradient-to-r from-indigo-50/70 via-blue-50/70 to-emerald-50/70 rounded-xl p-3 border border-indigo-200/70 space-y-2">
          <div className="flex items-center justify-between text-[10px]">
            <span className="font-extrabold text-indigo-950">🔮 現在のペース維持時の未来体型シミュレーション</span>
            <span className="font-bold text-emerald-700 bg-white/90 px-2 py-0.5 rounded-md border border-emerald-200/70">
              達成予定: {daysToGoal === 0 ? '達成済' : goalDateStr}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-white/95 rounded-lg p-2 border border-slate-200/70">
              <span className="text-[9px] text-slate-500 font-bold block">現在</span>
              <span className="text-xs font-black text-slate-900 tabular-nums block">{latestWeight}kg</span>
              <span className="text-[9px] text-slate-500 block">体脂肪 {latestFat}%</span>
            </div>
            <div className="bg-white/95 rounded-lg p-2 border border-indigo-200/80">
              <span className="text-[9px] text-indigo-700 font-bold block">1ヶ月後(+30日)</span>
              <span className="text-xs font-black text-indigo-700 tabular-nums block">{predWeight30d}kg</span>
              <span className="text-[9px] text-indigo-600 font-bold block">体脂肪 {predFat30d}%</span>
            </div>
            <div className="bg-white/95 rounded-lg p-2 border border-blue-200/80">
              <span className="text-[9px] text-blue-700 font-bold block">3ヶ月後(+90日)</span>
              <span className="text-xs font-black text-blue-700 tabular-nums block">{predWeight90d}kg</span>
              <span className="text-[9px] text-blue-600 font-bold block">体脂肪 {predFat90d}%</span>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-[11px] font-extrabold text-slate-800">🎯 来週に向けたAIの具体的改善アクション</div>
          {weeklyActionItems.map((actionText, idx) => (
            <div
              key={idx}
              className="bg-slate-50 rounded-xl p-2.5 border border-slate-200/70 flex items-start gap-2.5"
            >
              <span className="w-5 h-5 rounded-lg bg-indigo-600 text-white text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">
                {idx + 1}
              </span>
              <span className="text-[11px] text-slate-700 leading-relaxed font-medium">{actionText}</span>
            </div>
          ))}
        </div>

        {correlation && correlation.summary && (
          <div className="bg-slate-50 rounded-xl border border-slate-200/70 overflow-hidden">
            <button
              type="button"
              onClick={() => setShowCorrelationDetail(!showCorrelationDetail)}
              className="w-full p-3 flex items-center justify-between text-left cursor-pointer hover:bg-slate-100/70 transition-colors"
            >
              <div className="min-w-0 pr-2">
                <span className="text-[10px] font-bold text-indigo-600 block">運動×栄養シナジー ({correlation.summary.correlation_score})</span>
                <span className="text-xs font-bold text-slate-800 truncate block">{correlation.summary.headline}</span>
              </div>
              <span className="text-xs text-slate-400 font-bold shrink-0">{showCorrelationDetail ? '▲' : '▼'}</span>
            </button>
            {showCorrelationDetail && (
              <div className="px-3 pb-3 pt-1 border-t border-slate-200/60 space-y-2 text-[11px]">
                <p className="text-slate-600 leading-relaxed">{correlation.summary.insight}</p>
                <div className="bg-emerald-50/70 p-2 rounded-lg border border-emerald-200/60 text-emerald-900 font-bold">
                  {correlation.summary.recommendation}
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      <section className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xs font-extrabold text-slate-800">直近の活動タイムライン</h2>
            <p className="text-[10px] text-slate-500 mt-0.5">運動・食事・プロテインの統合ログ</p>
          </div>
          <span className="text-[10px] text-slate-500 font-bold bg-slate-100 px-2 py-0.5 rounded-lg">
            最新 4 件
          </span>
        </div>

        {workouts.length === 0 && meals.length === 0 ? (
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/70 text-center text-slate-400 text-xs">
            記録がまだありません
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2.5">
            {[...workouts.slice(0, 4), ...meals.slice(0, 4)]
              .sort((a, b) => (b.timestamp || b.log_date || '').localeCompare(a.timestamp || a.log_date || ''))
              .slice(0, 4)
              .map((item, idx) => {
                const isWorkout = item.workout_type !== undefined;
                return (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 flex flex-col justify-between gap-1 text-[11px]"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                        isWorkout ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {isWorkout ? '運動' : '食事'}
                      </span>
                      <span className="text-[9px] text-slate-400 font-bold">{item.log_date?.slice(5)}</span>
                    </div>
                    <span className="font-bold text-slate-900 truncate mt-0.5">{item.menu_name}</span>
                    <span className="text-[10px] text-slate-500 truncate">
                      {isWorkout
                        ? `${item.sets || 1}set ${item.reps ? `×${item.reps}回` : ''}`
                        : `${item.calories || 0}kcal (P:${item.protein_g || 0}g)`}
                    </span>
                  </div>
                );
              })}
          </div>
        )}
      </section>
    </div>
  );
}
