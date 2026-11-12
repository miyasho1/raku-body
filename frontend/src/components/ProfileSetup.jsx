import React, { useState } from 'react';
import { getUserStorageData, setUserStorageData } from '../utils/authService';
import { GOAL_OPTIONS, getSavedGoal, saveGoal } from '../utils/goals';
import { ACTIVITY_OPTIONS, buildRecommendation } from '../utils/counseling';

const toTodayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const inRange = (v, min, max) => Number.isFinite(v) && v >= min && v <= max;

const latestWeight = () => {
  const list = getUserStorageData('metrics', []);
  if (!Array.isArray(list) || list.length === 0) return '';
  const sorted = [...list].sort((a, b) => (a.date || '').localeCompare(b.date || ''));
  const w = sorted[sorted.length - 1].weight;
  return Number.isFinite(Number(w)) ? String(w) : '';
};

export default function ProfileSetup({ onDone, onLater, isEdit = false }) {
  const basic = getUserStorageData('profile_basic', null) || {};
  const [stepIdx, setStepIdx] = useState(0);
  const [goal, setGoal] = useState(() => getSavedGoal());
  const [sex, setSex] = useState(basic.sex || '');
  const [age, setAge] = useState(basic.age ? String(basic.age) : '');
  const [activity, setActivity] = useState(basic.activity || '');
  const [height, setHeight] = useState(() => {
    const h = getUserStorageData('body_height', null);
    return h ? String(h) : '';
  });
  const [initialWeight] = useState(() => (isEdit ? latestWeight() : ''));
  const [weight, setWeight] = useState(initialWeight);
  const [targetWeight, setTargetWeight] = useState('');
  const [targetCalories, setTargetCalories] = useState('');
  const [rec, setRec] = useState(null);
  const [error, setError] = useState('');

  const handleNext = (e) => {
    e.preventDefault();
    const h = parseFloat(height);
    const w = parseFloat(weight);
    const a = parseInt(age, 10);
    if (!goal) return setError('目的を1つ選んでください。');
    if (!sex) return setError('性別を選んでください（消費カロリーの計算に使います）。');
    if (!inRange(a, 15, 100)) return setError('年齢は15〜100の数字で入れてください。');
    if (!inRange(h, 100, 230)) return setError('身長は100〜230cmの数字で入れてください。');
    if (!inRange(w, 30, 200)) return setError('今の体重は30〜200kgの数字で入れてください。');
    if (!activity) return setError('ふだんの活動量を選んでください。');
    const r = buildRecommendation({ goal, sex, age: a, height: h, weight: w, activity });
    setRec(r);
    setTargetWeight(String(r.target));
    setTargetCalories(String(r.intake));
    setError('');
    setStepIdx(1);
  };

  const handleSave = (e) => {
    e.preventDefault();
    const h = parseFloat(height);
    const w = parseFloat(weight);
    const tw = parseFloat(targetWeight);
    const tc = parseInt(targetCalories, 10);
    if (!inRange(tw, 30, 200)) return setError('目標体重は30〜200kgの数字で入れてください。');
    if (!inRange(tc, 800, 5000)) return setError('1日に食べる量の目標は800〜5000kcalの数字で入れてください。');
    const hStr = String(h);
    const twStr = String(tw);
    const tcStr = String(tc);
    setUserStorageData('body_height', hStr);
    setUserStorageData('user_height', hStr);
    setUserStorageData('target_weight', twStr);
    setUserStorageData('target_calories', tcStr);
    setUserStorageData('profile_basic', { sex, age: parseInt(age, 10), activity });
    try {
      localStorage.setItem('raku_body_height', hStr);
      localStorage.setItem('raku_user_height', hStr);
      localStorage.setItem('raku_target_weight', twStr);
      localStorage.setItem('raku_target_calories', tcStr);
    } catch {
    }
    const weightChanged = !isEdit || parseFloat(weight) !== parseFloat(initialWeight);
    const todayStr = toTodayStr();
    const cached = weightChanged ? getUserStorageData('metrics', []) : [];
    const list = Array.isArray(cached) ? [...cached] : [];
    const existingIdx = list.findIndex((item) => item.date === todayStr);
    if (existingIdx >= 0) {
      list[existingIdx] = { ...list[existingIdx], weight: w };
    } else {
      list.push({ id: `metric_${Date.now()}`, date: todayStr, weight: w });
    }
    if (weightChanged) setUserStorageData('metrics', list);
    saveGoal(goal);
    setUserStorageData('profile_done', true);
    onDone({ height: hStr, targetWeight: twStr, targetCalories: tcStr, goal });
  };

  const numField = (label, unit, value, setValue, placeholder, step = '0.1') => (
    <label className="bg-slate-50 rounded-xl border border-slate-200/80 p-3.5 flex flex-col gap-2.5">
      <span className="text-[10px] font-bold text-slate-500">{label}</span>
      <span className="flex items-baseline gap-2.5">
        <input
          type="number"
          inputMode="decimal"
          step={step}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setError('');
          }}
          placeholder={placeholder}
          className="w-full min-w-0 bg-white border border-slate-200 rounded-xl px-2 py-1.5 text-sm font-black text-slate-900 tabular-nums focus:outline-none focus:border-blue-500"
        />
        <span className="text-[10px] font-bold text-slate-500 shrink-0">{unit}</span>
      </span>
    </label>
  );

  const choice = (selected, onPick, label, desc) => (
    <button
      type="button"
      onClick={() => {
        onPick();
        setError('');
      }}
      className={`px-3.5 py-2 rounded-xl border text-left cursor-pointer ${selected ? 'bg-blue-50 border-blue-400' : 'bg-white border-slate-200'}`}
    >
      <span className={`text-xs font-extrabold block ${selected ? 'text-blue-700' : 'text-slate-800'}`}>{label}</span>
      {desc && <span className="text-[10px] text-slate-500 block leading-snug">{desc}</span>}
    </button>
  );

  return (
    <div className="absolute inset-0 z-40 flex items-end sm:items-center justify-center bg-slate-900/55 backdrop-blur-xs px-3.5 pb-3.5 pt-14">
      <form
        role="dialog"
        aria-modal="true"
        aria-label="はじめの設定"
        onSubmit={stepIdx === 0 ? handleNext : handleSave}
        className="w-full max-h-full overflow-y-auto bg-white rounded-2xl shadow-2xl border border-slate-200/90 p-3.5 space-y-3"
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200/70 flex items-center justify-center text-2xl shrink-0">
            {stepIdx === 0 ? '📝' : '🎯'}
          </div>
          <div>
            <span className="text-[10px] font-bold text-blue-600">{isEdit ? '目標の相談' : 'はじめの設定'} {stepIdx + 1}/2</span>
            <h2 className="text-base font-black text-slate-900 leading-snug">
              {stepIdx === 0 ? 'どうなりたいか教えてください' : 'あなたへのおすすめの目標'}
            </h2>
          </div>
        </div>

        {stepIdx === 0 && (
          <>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              答えをもとに、目標体重と、1日に食べる量の目安を計算します。次の画面で、自分で変えることもできます。
            </p>
            <div className="space-y-2.5">
              <span className="text-[10px] font-bold text-slate-500 block">どうなりたいですか（運動メニューのおすすめも変わります）</span>
              <div className="grid grid-cols-2 gap-2.5">
                {GOAL_OPTIONS.map((g) => (
                  <React.Fragment key={g.key}>{choice(goal === g.key, () => setGoal(g.key), g.label, g.desc)}</React.Fragment>
                ))}
              </div>
            </div>
            <div className="space-y-2.5">
              <span className="text-[10px] font-bold text-slate-500 block">性別（消費カロリーの計算に使います）</span>
              <div className="grid grid-cols-2 gap-2.5">
                {choice(sex === 'male', () => setSex('male'), '男性')}
                {choice(sex === 'female', () => setSex('female'), '女性')}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {numField('年齢', '歳', age, setAge, '例 20', '1')}
              {numField('身長', 'cm', height, setHeight, '例 170')}
              {numField('今の体重', 'kg', weight, setWeight, '例 65.0')}
            </div>
            <div className="space-y-2.5">
              <span className="text-[10px] font-bold text-slate-500 block">ふだんの活動量</span>
              <div className="grid grid-cols-3 gap-2.5">
                {ACTIVITY_OPTIONS.map((a) => (
                  <React.Fragment key={a.key}>{choice(activity === a.key, () => setActivity(a.key), a.label, a.desc)}</React.Fragment>
                ))}
              </div>
            </div>
          </>
        )}

        {stepIdx === 1 && rec && (
          <>
            <div className="grid grid-cols-2 gap-2.5">
              <div className="bg-slate-50 rounded-xl border border-slate-200/80 p-3.5">
                <span className="text-[10px] font-bold text-slate-500 block">今のBMI</span>
                <span className="text-lg font-black text-slate-900 tabular-nums">{rec.bmi}</span>
                <span className="text-[10px] text-slate-600 block">{rec.bmiLabel}</span>
              </div>
              <div className="bg-slate-50 rounded-xl border border-slate-200/80 p-3.5">
                <span className="text-[10px] font-bold text-slate-500 block">1日の消費の目安</span>
                <span className="text-lg font-black text-slate-900 tabular-nums">{rec.tdee.toLocaleString()}</span>
                <span className="text-[10px] text-slate-600"> kcal</span>
              </div>
            </div>

            <div className="bg-indigo-50 rounded-xl border border-indigo-200/80 p-3.5 space-y-2.5">
              <span className="text-[11px] font-extrabold text-indigo-900 block">🎯 目標体重のおすすめ：{rec.target}kg（BMI {rec.targetBmi}）</span>
              <p className="text-[10px] text-indigo-900 leading-relaxed">{rec.targetReason}</p>
              <span className="text-[11px] font-extrabold text-indigo-900 block">🍽 1日に食べる量（摂取カロリー）のおすすめ：{rec.intake.toLocaleString()}kcal</span>
              <p className="text-[10px] text-indigo-900 leading-relaxed">
                {rec.planLabel}。消費の目安は、基礎代謝（約{rec.bmr.toLocaleString()}kcal）×活動量（{rec.pal}）で計算しています。{rec.highBmi ? '（BMIが25以上のときは、消費の目安が多めに出ることがあります）' : ''}
              </p>
              {rec.weeks !== null && rec.weeks > 0 && (
                <p className="text-[10px] text-indigo-900 leading-relaxed">計算上は、目標まで約{rec.weeks}週間です。</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {numField('目標体重', 'kg', targetWeight, setTargetWeight, '例 62.0')}
              {numField('1日に食べる量の目標', 'kcal', targetCalories, setTargetCalories, '例 2000', '50')}
            </div>
            <p className="text-[10px] text-slate-500 leading-relaxed">
              BMIの区分は日本肥満学会の基準（18.5〜25未満が普通体重、22が標準）、基礎代謝と活動量は厚生労働省「日本人の食事摂取基準（2020年版）」の値（活動量の係数は18〜64歳の値（1.50／1.75／2.00）を使い、65歳以上は少し下げています）をもとにしています。目標体重の決め方、食べる量の増減（−400kcalなど）、週数の計算（体重1kg＝約7200kcalとして計算）は、アプリ独自の目安です。医療的な指導ではありません。持病がある人や体調に不安がある人は、医師に相談してください。今の体重は、今日の体重の記録として保存されます（相談し直すときは、体重を書き換えたときだけ保存します）。目標は、あとでメニューの「目標を相談し直す」から変えられます。
            </p>
          </>
        )}

        {error && (
          <div className="text-[11px] font-bold px-3.5 py-2 rounded-xl border bg-rose-50 text-rose-700 border-rose-200/80">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-2.5">
          {stepIdx === 0 ? (
            <button type="button" onClick={onLater} className="py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer">
              {isEdit ? '閉じる' : 'あとで入れる'}
            </button>
          ) : (
            <button type="button" onClick={() => { setStepIdx(0); setError(''); }} className="py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer">
              ‹ 戻る
            </button>
          )}
          <button type="submit" className="py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-2xs cursor-pointer">
            {stepIdx === 0 ? 'おすすめを見る ›' : '保存してはじめる'}
          </button>
        </div>
      </form>
    </div>
  );
}
