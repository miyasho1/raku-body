import React, { useState, useEffect } from 'react';
import WheelPicker from './WheelPicker';
import { getUserStorageData, setUserStorageData } from '../utils/authService';

export default function MetricsScreen({ onRecordSuccess, dataVersion }) {
  const [activeTab, setActiveTab] = useState('record');
  const [metrics, setMetrics] = useState([]);
  const [meals, setMeals] = useState([]);
  const [workouts, setWorkouts] = useState([]);
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
    fetchActivityContext();
  }, [dataVersion]);

  const fetchActivityContext = async () => {
    let loadedMeals = [];
    let loadedWorkouts = [];
    try {
      const [mRes, wRes] = await Promise.all([fetch('/api/meals'), fetch('/api/workouts')]);
      if (mRes.ok) {
        const mData = await mRes.json();
        loadedMeals = mData.meals || [];
      }
      if (wRes.ok) {
        const wData = await wRes.json();
        loadedWorkouts = wData.workouts || [];
      }
    } catch {
    }
    if (loadedMeals.length === 0) {
      try {
        const rawM = getUserStorageData('meals', []);
        if (rawM && rawM.length > 0) loadedMeals = rawM;
      } catch {
      }
    }
    if (loadedWorkouts.length === 0) {
      try {
        const rawW = getUserStorageData('workouts', []);
        if (rawW && rawW.length > 0) loadedWorkouts = rawW;
      } catch {
      }
    }
    setMeals(loadedMeals);
    setWorkouts(loadedWorkouts);
  };

  const fetchMetrics = async () => {
    try {
      const res = await fetch('/api/metrics');
      if (res.ok) {
        const data = await res.json();
        if (data.metrics && data.metrics.length > 0) {
          setMetrics(data.metrics);
          return;
        }
      }
    } catch {
    }
    try {
      const cached = getUserStorageData('metrics', []);
      setMetrics(Array.isArray(cached) ? cached : []);
    } catch {
      setMetrics([]);
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
          return;
        }
      }
    } catch {
    }
    try {
      const list = getUserStorageData('metrics', []);
      if (list && Array.isArray(list) && list.length > 0) {
        const latest = list[list.length - 1];
        setWeightInt(Math.floor(latest.weight));
        setWeightDec(Math.round((latest.weight % 1) * 10));
        if (latest.body_fat) {
          setFatInt(Math.floor(latest.body_fat));
          setFatDec(Math.round((latest.body_fat % 1) * 10));
        }
      }
    } catch {
    }
  };

  const currentWeightVal = parseFloat(`${weightInt}.${weightDec}`);
  const currentFatVal = parseFloat(`${fatInt}.${fatDec}`);

  const [height, setHeight] = useState(() => {
    const saved = localStorage.getItem('raku_body_height') || localStorage.getItem('raku_user_height');
    return saved ? parseFloat(saved) : 170.0;
  });
  const [isHeightModalOpen, setIsHeightModalOpen] = useState(false);
  const [tempHeight, setTempHeight] = useState(height);

  const handleSaveHeight = (newH) => {
    const parsed = Math.max(100, Math.min(230, parseFloat(newH) || 170));
    setHeight(parsed);
    localStorage.setItem('raku_user_height', String(parsed));
    localStorage.setItem('raku_body_height', String(parsed));
    setIsHeightModalOpen(false);
    setMessage({ type: 'success', text: `身長を ${parsed} cm に保存しました` });
  };

  const getBmiInfo = (weightVal, heightCm) => {
    if (!heightCm || heightCm <= 0) return { bmi: '-', status: '未設定', badge: 'bg-slate-100 text-slate-600 border-slate-200', standardWeight: '-' };
    const hM = heightCm / 100;
    const bmiVal = weightVal / (hM * hM);
    const rounded = parseFloat(bmiVal.toFixed(1));
    let status = '適正体重';
    let badge = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (rounded < 18.5) {
      status = '低体重';
      badge = 'bg-blue-50 text-blue-700 border-blue-200';
    } else if (rounded >= 25.0 && rounded < 30.0) {
      status = '肥満(1度)';
      badge = 'bg-amber-50 text-amber-700 border-amber-200';
    } else if (rounded >= 30.0) {
      status = '肥満(2度+)';
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

    const d = new Date();
    const todayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    try {
      const cached = getUserStorageData('metrics', []);
      const list = Array.isArray(cached) ? cached : [];
      const existingIdx = list.findIndex((item) => item.date === todayStr);
      if (existingIdx >= 0) {
        list[existingIdx] = { ...list[existingIdx], weight: currentWeightVal, body_fat: currentFatVal };
      } else {
        list.push({ id: `metric_${Date.now()}`, date: todayStr, weight: currentWeightVal, body_fat: currentFatVal });
      }
      setUserStorageData('metrics', list);
    } catch {
    }

    try {
      await fetch('/api/metrics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          weight: currentWeightVal,
          body_fat: currentFatVal,
        }),
      });
    } catch {
    }

    setMessage({ type: 'success', text: `記録しました！（${currentWeightVal}kg / ${currentFatVal}%）` });
    await fetchMetrics();
    if (onRecordSuccess) {
      onRecordSuccess('体重・体脂肪率を記録しました！');
    }
    setIsSubmitting(false);
  };

  const sortedAllMetrics = [...metrics].sort((a, b) => (a.date || '').localeCompare(b.date || ''));

  const getFilteredMetrics = () => {
    if (timeRange === '7d') {
      return sortedAllMetrics.slice(-7);
    } else if (timeRange === '30d') {
      return sortedAllMetrics.slice(-30);
    }
    return sortedAllMetrics;
  };

  const filtered = getFilteredMetrics();
  const currentDiff = sortedAllMetrics.length >= 2
    ? (sortedAllMetrics[sortedAllMetrics.length - 1].weight - sortedAllMetrics[sortedAllMetrics.length - 2].weight).toFixed(1)
    : null;

  const targetWeightGoal = parseFloat(localStorage.getItem('raku_target_weight') || '62.0') || 62.0;

  const recent7Meals = meals.slice(0, 28);
  const mealDaysCount = new Set(recent7Meals.map((m) => m.log_date || m.timestamp?.slice(0, 10))).size || 1;
  const avgDailyIntake = recent7Meals.length > 0
    ? Math.round(recent7Meals.reduce((acc, m) => acc + (m.calories || 0), 0) / mealDaysCount)
    : 1680;
  const avgDailyWorkoutBurn = workouts.length > 0
    ? Math.round((workouts.slice(0, 7).reduce((acc, w) => acc + (w.sets || 3) * 18 + (w.duration_minutes || 15) * 4, 0)) / 7)
    : 140;
  const estimatedTdee = Math.round(currentWeightVal * 29 + avgDailyWorkoutBurn);
  const dailyCalorieBalance = avgDailyIntake - estimatedTdee;

  let dailyWeightSlope = dailyCalorieBalance / 7200;
  if (sortedAllMetrics.length >= 2) {
    const firstM = sortedAllMetrics[Math.max(0, sortedAllMetrics.length - 7)];
    const lastM = sortedAllMetrics[sortedAllMetrics.length - 1];
    const spanDays = Math.max(1, sortedAllMetrics.slice(-7).length - 1);
    const observedSlope = (lastM.weight - firstM.weight) / spanDays;
    dailyWeightSlope = observedSlope * 0.45 + (dailyCalorieBalance / 7200) * 0.55;
  }
  dailyWeightSlope = Math.max(-0.12, Math.min(-0.02, dailyWeightSlope));

  const baseWeightForSim = sortedAllMetrics.length > 0 ? sortedAllMetrics[sortedAllMetrics.length - 1].weight : currentWeightVal;
  const baseFatForSim = sortedAllMetrics.length > 0 && sortedAllMetrics[sortedAllMetrics.length - 1].body_fat
    ? sortedAllMetrics[sortedAllMetrics.length - 1].body_fat
    : currentFatVal;

  const predWeight14d = Number(Math.max(42, baseWeightForSim + dailyWeightSlope * 14).toFixed(1));
  const predWeight30d = Number(Math.max(42, baseWeightForSim + dailyWeightSlope * 30).toFixed(1));
  const predWeight90d = Number(Math.max(42, baseWeightForSim + dailyWeightSlope * 90).toFixed(1));

  const dailyFatSlope = dailyWeightSlope * 0.85;
  const predFat14d = Number(Math.max(6, baseFatForSim + dailyFatSlope * 14).toFixed(1));
  const predFat30d = Number(Math.max(6, baseFatForSim + dailyFatSlope * 30).toFixed(1));
  const predFat90d = Number(Math.max(6, baseFatForSim + dailyFatSlope * 90).toFixed(1));

  const remainingToGoalKg = Math.max(0, baseWeightForSim - targetWeightGoal);
  const daysToGoal = remainingToGoalKg <= 0.1
    ? 0
    : Math.min(365, Math.max(1, Math.round(remainingToGoalKg / Math.abs(dailyWeightSlope))));
  const goalDateObj = new Date();
  goalDateObj.setDate(goalDateObj.getDate() + daysToGoal);
  const goalDateStr = `${goalDateObj.getMonth() + 1}月${goalDateObj.getDate()}日頃`;

  const futureForecastNodes = [
    {
      date: '+14日予想',
      shortLabel: '+14日',
      val: selectedType === 'weight' ? predWeight14d : predFat14d,
      isForecast: true
    },
    {
      date: '+30日(1ヶ月後)',
      shortLabel: '+30日',
      val: selectedType === 'weight' ? predWeight30d : predFat30d,
      isForecast: true
    }
  ];

  const actualNodes = filtered.map((d) => ({
    date: d.date,
    shortLabel: d.date ? d.date.slice(5) : '',
    val: selectedType === 'weight' ? d.weight : d.body_fat || currentFatVal,
    isForecast: false
  }));

  const combinedNodes = actualNodes.length > 0 ? [...actualNodes, ...futureForecastNodes] : [];
  const allValues = combinedNodes.map((n) => n.val);
  const minValue = allValues.length > 0 ? Math.min(...allValues) : 0;
  const maxValue = allValues.length > 0 ? Math.max(...allValues) : 100;
  const padding = (maxValue - minValue) * 0.18 || 1;
  const plotMin = parseFloat((minValue - padding).toFixed(1));
  const plotMax = parseFloat((maxValue + padding).toFixed(1));
  const plotRange = plotMax - plotMin || 1;

  const width = 310;
  const chartHeight = 172;
  const margin = { top: 22, right: 20, bottom: 26, left: 18 };
  const graphWidth = width - margin.left - margin.right;
  const graphHeight = chartHeight - margin.top - margin.bottom;

  const plottedNodes = combinedNodes.map((n, i) => {
    const x = combinedNodes.length === 1
      ? margin.left + graphWidth / 2
      : margin.left + (i / (combinedNodes.length - 1)) * graphWidth;
    const y = margin.top + graphHeight - ((n.val - plotMin) / plotRange) * graphHeight;
    return { ...n, x, y };
  });

  const actualPlotted = plottedNodes.filter((n) => !n.isForecast);
  const forecastPlotted = plottedNodes.filter((n) => n.isForecast);

  const actualPathD = actualPlotted.length > 0
    ? actualPlotted.reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`, '')
    : '';

  const forecastPointsWithAnchor = actualPlotted.length > 0
    ? [actualPlotted[actualPlotted.length - 1], ...forecastPlotted]
    : [];
  const forecastPathD = forecastPointsWithAnchor.length > 1
    ? forecastPointsWithAnchor.reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`, '')
    : '';

  const bmiInfo = getBmiInfo(currentWeightVal, height);
  const diffToGoal = (currentWeightVal - targetWeightGoal).toFixed(1);
  const leanMassKg = (currentWeightVal * (1 - currentFatVal / 100)).toFixed(1);

  return (
    <div className="flex flex-col space-y-3.5 pb-3">
      <header className="flex items-center justify-between px-0.5">
        <div>
          <h1 className="text-base font-extrabold text-slate-900 leading-tight">身体計測・未来予測</h1>
          <p className="text-[10px] text-slate-500">体重・体脂肪率・目標達成シミュレーション</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setTempHeight(height);
            setIsHeightModalOpen(true);
          }}
          className="text-[11px] font-bold text-teal-700 bg-white border border-teal-200/80 px-3 py-1.5 rounded-xl shadow-2xs cursor-pointer flex items-center gap-1"
        >
          <span>📏 身長: {height}cm</span>
          <span className="text-[9px] text-teal-500">変更</span>
        </button>
      </header>

      {message && (
        <div className={`p-3 rounded-xl text-[11px] font-bold text-center border shadow-xs ${
          message.type === 'success'
            ? 'bg-teal-50 text-teal-800 border-teal-200'
            : 'bg-rose-50 text-rose-800 border border-rose-200'
        }`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-3 gap-2.5">
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-3.5 flex flex-col justify-between space-y-1.5">
          <span className="text-[10px] font-bold text-slate-500">選択中の体重</span>
          <div className="flex items-baseline gap-0.5">
            <span className="text-lg font-black text-slate-900 tabular-nums leading-none">{currentWeightVal}</span>
            <span className="text-[10px] font-bold text-slate-500">kg</span>
          </div>
          <span className="text-[9px] font-bold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded-lg text-center truncate">
            {currentDiff !== null ? `前回比 ${parseFloat(currentDiff) > 0 ? `+${currentDiff}` : currentDiff}kg` : `適正 ${bmiInfo.standardWeight}kg`}
          </span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-3.5 flex flex-col justify-between space-y-1.5">
          <span className="text-[10px] font-bold text-slate-500">体脂肪率</span>
          <div className="flex items-baseline gap-0.5">
            <span className="text-lg font-black text-slate-900 tabular-nums leading-none">{currentFatVal}</span>
            <span className="text-[10px] font-bold text-slate-500">%</span>
          </div>
          <span className="text-[9px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded-lg text-center truncate">
            除脂肪 {leanMassKg}kg
          </span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-3.5 flex flex-col justify-between space-y-1.5">
          <span className="text-[10px] font-bold text-slate-500">算出BMI</span>
          <div className="flex items-baseline gap-0.5">
            <span className="text-lg font-black text-slate-900 tabular-nums leading-none">{bmiInfo.bmi}</span>
          </div>
          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-lg text-center truncate border ${bmiInfo.badge}`}>
            {bmiInfo.status}
          </span>
        </div>
      </div>

      <section className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm space-y-3">
        <div className="grid grid-cols-2 gap-1 bg-slate-100 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveTab('record')}
            className={`py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === 'record'
                ? 'bg-white text-teal-700 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            📝 計測を記録
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('chart')}
            className={`py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === 'chart'
                ? 'bg-white text-teal-700 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            📈 推移＆未来予測グラフ
          </button>
        </div>

        {activeTab === 'record' ? (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80 flex flex-col items-center space-y-2">
                <div className="w-full flex items-center justify-between px-0.5">
                  <span className="text-[11px] font-bold text-slate-700">体重 (kg)</span>
                  <span className="text-xs font-black text-teal-700 tabular-nums">{currentWeightVal}kg</span>
                </div>
                <div className="relative w-full bg-white rounded-lg p-1.5 border border-slate-200/80 flex justify-center overflow-hidden">
                  <div className="pointer-events-none absolute inset-x-1.5 top-1/2 -translate-y-1/2 h-[32px] bg-teal-50/70 rounded border border-teal-200/80 z-0" />
                  <div className="relative z-0 flex items-center justify-center">
                    <WheelPicker
                      items={weightIntOptions}
                      value={weightInt}
                      onChange={setWeightInt}
                      width="w-14"
                      height="h-[102px]"
                      itemHeight={34}
                      textAlign="end"
                      fontSize="text-base"
                      subFontSize="text-xs"
                    />
                    <span className="w-2 text-center text-base font-bold text-slate-900 select-none">.</span>
                    <WheelPicker
                      items={decimalOptions}
                      value={weightDec}
                      onChange={setWeightDec}
                      width="w-10"
                      height="h-[102px]"
                      itemHeight={34}
                      textAlign="start"
                      fontSize="text-sm"
                      subFontSize="text-[10px]"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80 flex flex-col items-center space-y-2">
                <div className="w-full flex items-center justify-between px-0.5">
                  <span className="text-[11px] font-bold text-slate-700">体脂肪率 (%)</span>
                  <span className="text-xs font-black text-teal-700 tabular-nums">{currentFatVal}%</span>
                </div>
                <div className="relative w-full bg-white rounded-lg p-1.5 border border-slate-200/80 flex justify-center overflow-hidden">
                  <div className="pointer-events-none absolute inset-x-1.5 top-1/2 -translate-y-1/2 h-[32px] bg-teal-50/70 rounded border border-teal-200/80 z-0" />
                  <div className="relative z-0 flex items-center justify-center">
                    <WheelPicker
                      items={fatIntOptions}
                      value={fatInt}
                      onChange={setFatInt}
                      width="w-14"
                      height="h-[102px]"
                      itemHeight={34}
                      textAlign="end"
                      fontSize="text-base"
                      subFontSize="text-xs"
                    />
                    <span className="w-2 text-center text-base font-bold text-slate-900 select-none">.</span>
                    <WheelPicker
                      items={decimalOptions}
                      value={fatDec}
                      onChange={setFatDec}
                      width="w-10"
                      height="h-[102px]"
                      itemHeight={34}
                      textAlign="start"
                      fontSize="text-sm"
                      subFontSize="text-[10px]"
                    />
                  </div>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white font-bold rounded-xl shadow-md shadow-teal-500/20 transition-all text-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? '保存中...' : `本日の計測データを保存する（${currentWeightVal}kg / ${currentFatVal}%）`}
            </button>
          </form>
        ) : (
          <div className="space-y-3">
            <div className="flex justify-between items-center gap-2">
              <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200/70 text-[11px] font-bold gap-1">
                <button
                  type="button"
                  onClick={() => setSelectedType('weight')}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    selectedType === 'weight'
                      ? 'bg-teal-600 text-white shadow-2xs'
                      : 'text-slate-600'
                  }`}
                >
                  体重 (kg)
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedType('fat')}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    selectedType === 'fat'
                      ? 'bg-teal-600 text-white shadow-2xs'
                      : 'text-slate-600'
                  }`}
                >
                  体脂肪率 (%)
                </button>
              </div>

              <div className="flex gap-1 text-[10px] font-bold text-slate-600 bg-slate-100 p-1 rounded-xl border border-slate-200/70">
                {['7d', '30d', 'all'].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setTimeRange(r)}
                    className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
                      timeRange === r ? 'bg-white text-slate-900 shadow-2xs' : ''
                    }`}
                  >
                    {r === '7d' ? '7日' : r === '30d' ? '30日' : '全期間'}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-slate-50/70 rounded-xl p-3 border border-slate-200/70 space-y-2">
              <div className="flex items-center justify-between text-[10px] px-0.5">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1 font-bold text-teal-700">
                    <span className="w-3 h-0.5 bg-teal-600 inline-block rounded" />
                    実績推移
                  </span>
                  <span className="flex items-center gap-1 font-bold text-indigo-600">
                    <span className="w-3 h-0.5 border-b-2 border-dashed border-indigo-500 inline-block" />
                    AI未来予測ライン
                  </span>
                </div>
                <span className="font-bold text-slate-500">タップで数値詳細</span>
              </div>

              <div className="relative w-full overflow-hidden flex justify-center bg-white rounded-lg p-3 border border-slate-200/60">
                {plottedNodes.length === 0 ? (
                  <div className="h-36 flex items-center justify-center text-xs text-slate-400">
                    記録データがありません
                  </div>
                ) : (
                  <svg viewBox={`0 0 ${width} ${chartHeight}`} className="w-full h-auto overflow-visible select-none">
                    <line x1={margin.left} y1={margin.top} x2={width - margin.right} y2={margin.top} stroke="#F1F5F9" strokeWidth="1" strokeDasharray="3 3" />
                    <line x1={margin.left} y1={margin.top + graphHeight / 2} x2={width - margin.right} y2={margin.top + graphHeight / 2} stroke="#F1F5F9" strokeWidth="1" strokeDasharray="3 3" />
                    <line x1={margin.left} y1={margin.top + graphHeight} x2={width - margin.right} y2={margin.top + graphHeight} stroke="#E2E8F0" strokeWidth="1" />

                    {actualPathD && (
                      <path
                        d={actualPathD}
                        fill="none"
                        stroke="#0D9488"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    )}

                    {forecastPathD && (
                      <path
                        d={forecastPathD}
                        fill="none"
                        stroke="#6366F1"
                        strokeWidth="2.5"
                        strokeDasharray="4 3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    )}

                    {plottedNodes.map((p, idx) => {
                      const isSelected = activePoint?.date === p.date;
                      return (
                        <g key={idx} onClick={() => setActivePoint(p)} className="cursor-pointer">
                          <circle
                            cx={p.x}
                            cy={p.y}
                            r={isSelected ? '5.5' : p.isForecast ? '4.5' : '3.8'}
                            fill={p.isForecast ? '#EEF2FF' : '#FFFFFF'}
                            stroke={p.isForecast ? '#6366F1' : '#0D9488'}
                            strokeWidth={isSelected ? '2.5' : '2'}
                          />
                          {(p.isForecast || idx === actualPlotted.length - 1) && (
                            <text
                              x={p.x}
                              y={p.y - 7}
                              textAnchor="middle"
                              fontSize="8"
                              fontWeight="bold"
                              fill={p.isForecast ? '#4F46E5' : '#0F766E'}
                            >
                              {p.val}
                            </text>
                          )}
                        </g>
                      );
                    })}

                    {actualPlotted.length > 0 && (
                      <text x={actualPlotted[0].x} y={chartHeight - 4} fontSize="8" fill="#64748B" textAnchor="start" fontWeight="600">
                        {actualPlotted[0].shortLabel}
                      </text>
                    )}
                    {actualPlotted.length > 1 && (
                      <text x={actualPlotted[actualPlotted.length - 1].x} y={chartHeight - 4} fontSize="8" fill="#0F766E" textAnchor="middle" fontWeight="700">
                        現在
                      </text>
                    )}
                    {forecastPlotted.map((fp, fIdx) => (
                      <text key={fIdx} x={fp.x} y={chartHeight - 4} fontSize="8" fill="#4F46E5" textAnchor="middle" fontWeight="700">
                        {fp.shortLabel}
                      </text>
                    ))}
                  </svg>
                )}

                {activePoint && (
                  <div className="absolute top-2 right-2 bg-slate-900 text-white text-[10px] px-2.5 py-1 rounded-lg shadow-md pointer-events-none">
                    <span>{activePoint.date}: </span>
                    <span className="font-bold">{activePoint.val} {selectedType === 'weight' ? 'kg' : '%'}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </section>

      <section className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xs font-extrabold text-slate-800">🔮 AI未来体重・体脂肪予測シミュレーション</h2>
            <p className="text-[10px] text-slate-500 mt-0.5">
              1日平均収支 {dailyCalorieBalance > 0 ? `+${dailyCalorieBalance}` : dailyCalorieBalance}kcal ペース維持時
            </p>
          </div>
          <span className="text-[10px] font-extrabold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-xl border border-indigo-200/80">
            目標 {targetWeightGoal.toFixed(1)}kg
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2.5 text-center">
          <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-200/70">
            <span className="text-[9px] font-bold text-slate-500 block">1ヶ月後(+30日)</span>
            <span className="text-sm font-black text-indigo-700 tabular-nums block mt-0.5">{predWeight30d}kg</span>
            <span className="text-[9px] font-bold text-slate-500 block">体脂肪 {predFat30d}%</span>
          </div>
          <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-200/70">
            <span className="text-[9px] font-bold text-slate-500 block">3ヶ月後(+90日)</span>
            <span className="text-sm font-black text-blue-700 tabular-nums block mt-0.5">{predWeight90d}kg</span>
            <span className="text-[9px] font-bold text-slate-500 block">体脂肪 {predFat90d}%</span>
          </div>
          <div className="bg-emerald-50/70 rounded-xl p-2.5 border border-emerald-200/80">
            <span className="text-[9px] font-bold text-emerald-800 block">目標到達予想</span>
            <span className="text-sm font-black text-emerald-700 tabular-nums block mt-0.5">
              {daysToGoal === 0 ? '達成済！' : `約${daysToGoal}日後`}
            </span>
            <span className="text-[9px] font-bold text-emerald-700 block">
              {daysToGoal === 0 ? 'キープ推奨' : goalDateStr}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center pt-0.5">
          <div className="bg-slate-50 rounded-lg py-1.5 px-2 border border-slate-200/60">
            <span className="text-[9px] text-slate-500 block">目標との差</span>
            <span className="text-xs font-black text-slate-800 tabular-nums">
              {parseFloat(diffToGoal) > 0 ? `+${diffToGoal}` : diffToGoal}kg
            </span>
          </div>
          <div className="bg-slate-50 rounded-lg py-1.5 px-2 border border-slate-200/60">
            <span className="text-[9px] text-slate-500 block">適正体重(BMI22)</span>
            <span className="text-xs font-black text-slate-800 tabular-nums">{bmiInfo.standardWeight}kg</span>
          </div>
          <div className="bg-slate-50 rounded-lg py-1.5 px-2 border border-slate-200/60">
            <span className="text-[9px] text-slate-500 block">推定除脂肪体重</span>
            <span className="text-xs font-black text-teal-700 tabular-nums">{leanMassKg}kg</span>
          </div>
        </div>
      </section>

      <section className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xs font-extrabold text-slate-800">直近の身体計測履歴リスト</h2>
            <p className="text-[10px] text-slate-500 mt-0.5">日別の体重・体脂肪率・BMIログ</p>
          </div>
          <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-lg">
            全 {metrics.length} 件
          </span>
        </div>

        {metrics.length === 0 ? (
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/70 text-center">
            <p className="text-xs text-slate-400">まだ身体計測の記録がありません</p>
          </div>
        ) : (
          <div className="space-y-2">
            {[...metrics]
              .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
              .slice(0, 5)
              .map((m, idx) => {
                const rowBmi = getBmiInfo(m.weight, height);
                return (
                  <div
                    key={m.id || idx}
                    className="bg-slate-50 rounded-xl p-3 border border-slate-200/70 flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 border border-teal-200/80 flex items-center justify-center text-xs font-black shrink-0">
                        {m.date ? m.date.slice(5) : '記録'}
                      </div>
                      <div>
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-xs font-black text-slate-900 tabular-nums">{m.weight}kg</span>
                          {m.body_fat && (
                            <span className="text-[11px] font-bold text-teal-700 tabular-nums">/ {m.body_fat}%</span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-500 block">
                          BMI {rowBmi.bmi}（{rowBmi.status}）
                        </span>
                      </div>
                    </div>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md border ${rowBmi.badge}`}>
                      {rowBmi.status}
                    </span>
                  </div>
                );
              })}
          </div>
        )}
      </section>

      {isHeightModalOpen && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-xs pt-14 pb-5 px-4">
          <div className="w-full bg-white rounded-2xl p-4 shadow-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">📏 身長の設定</h3>
              <button
                type="button"
                onClick={() => setIsHeightModalOpen(false)}
                className="w-7 h-7 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">現在の身長 (cm)</span>
                <input
                  type="number"
                  step="0.1"
                  min="100"
                  max="230"
                  value={tempHeight}
                  onChange={(e) => setTempHeight(parseFloat(e.target.value) || 0)}
                  className="w-24 text-right text-lg font-black text-slate-900 bg-white border border-slate-300 rounded-lg px-2.5 py-1 focus:outline-none tabular-nums"
                />
              </div>

              <div className="grid grid-cols-4 gap-1.5">
                {[-5, -1, 1, 5].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setTempHeight((prev) => Math.max(100, Math.min(230, Math.round((prev + d) * 10) / 10)))}
                    className="py-1 rounded-lg text-xs font-bold bg-white border border-slate-200 text-slate-700 cursor-pointer"
                  >
                    {d > 0 ? `+${d}` : d}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setIsHeightModalOpen(false)}
                className="py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={() => handleSaveHeight(tempHeight)}
                className="py-2.5 bg-gradient-to-r from-teal-600 to-cyan-600 text-white font-bold rounded-xl text-xs shadow-md cursor-pointer"
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
