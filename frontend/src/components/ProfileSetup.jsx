import React, { useState } from 'react';
import { getUserStorageData, setUserStorageData } from '../utils/authService';

const toTodayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const inRange = (v, min, max) => Number.isFinite(v) && v >= min && v <= max;

export default function ProfileSetup({ onDone, onLater }) {
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [targetWeight, setTargetWeight] = useState('');
  const [targetCalories, setTargetCalories] = useState('2000');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const h = parseFloat(height);
    const w = parseFloat(weight);
    const tw = parseFloat(targetWeight);
    const tc = parseInt(targetCalories, 10);
    if (!inRange(h, 100, 230)) {
      setError('身長は100〜230cmの数字で入れてください。');
      return;
    }
    if (!inRange(w, 30, 200)) {
      setError('今の体重は30〜200kgの数字で入れてください。');
      return;
    }
    if (!inRange(tw, 30, 200)) {
      setError('目標体重は30〜200kgの数字で入れてください。');
      return;
    }
    if (!inRange(tc, 800, 5000)) {
      setError('1日の目標カロリーは800〜5000kcalの数字で入れてください。');
      return;
    }
    const hStr = String(h);
    const twStr = String(tw);
    const tcStr = String(tc);
    setUserStorageData('body_height', hStr);
    setUserStorageData('user_height', hStr);
    setUserStorageData('target_weight', twStr);
    setUserStorageData('target_calories', tcStr);
    try {
      localStorage.setItem('raku_body_height', hStr);
      localStorage.setItem('raku_user_height', hStr);
      localStorage.setItem('raku_target_weight', twStr);
      localStorage.setItem('raku_target_calories', tcStr);
    } catch {
    }
    const todayStr = toTodayStr();
    const cached = getUserStorageData('metrics', []);
    const list = Array.isArray(cached) ? [...cached] : [];
    const existingIdx = list.findIndex((item) => item.date === todayStr);
    if (existingIdx >= 0) {
      list[existingIdx] = { ...list[existingIdx], weight: w };
    } else {
      list.push({ id: `metric_${Date.now()}`, date: todayStr, weight: w });
    }
    setUserStorageData('metrics', list);
    setUserStorageData('profile_done', true);
    onDone({ height: hStr, targetWeight: twStr, targetCalories: tcStr });
  };

  const field = (label, unit, value, setValue, placeholder) => (
    <label className="bg-slate-50 rounded-xl border border-slate-200/80 p-3.5 flex flex-col gap-2.5">
      <span className="text-[10px] font-bold text-slate-500">{label}</span>
      <span className="flex items-baseline gap-2.5">
        <input
          type="number"
          inputMode="decimal"
          step="0.1"
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

  return (
    <div className="absolute inset-0 z-40 flex items-end sm:items-center justify-center bg-slate-900/55 backdrop-blur-xs px-3.5 pb-3.5 pt-14">
      <form
        role="dialog"
        aria-modal="true"
        aria-label="はじめの設定"
        onSubmit={handleSubmit}
        className="w-full bg-white rounded-2xl shadow-2xl border border-slate-200/90 p-3.5 space-y-3"
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200/70 flex items-center justify-center text-2xl shrink-0">
            📝
          </div>
          <div>
            <span className="text-[10px] font-bold text-blue-600">はじめの設定</span>
            <h2 className="text-base font-black text-slate-900 leading-snug">あなたの今と目標を教えてください</h2>
          </div>
        </div>
        <p className="text-[11px] text-slate-600 leading-relaxed">
          入れた数字は、体重の推移や目標までの目安に使います。今の体重は、今日の体重の記録として保存されます。身長と目標は、あとでメニューから変えられます。体重は「体重推移」の画面で記録し直せます。
        </p>
        <div className="grid grid-cols-2 gap-2.5">
          {field('身長', 'cm', height, setHeight, '例 170')}
          {field('今の体重', 'kg', weight, setWeight, '例 65.0')}
          {field('目標体重', 'kg', targetWeight, setTargetWeight, '例 62.0')}
          {field('1日の目標カロリー', 'kcal', targetCalories, setTargetCalories, '例 2000')}
        </div>
        {error && (
          <div className="text-[11px] font-bold px-2.5 py-1.5 rounded-xl border bg-rose-50 text-rose-700 border-rose-200/80">
            {error}
          </div>
        )}
        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={onLater}
            className="py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
          >
            あとで入れる
          </button>
          <button
            type="submit"
            className="py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-2xs cursor-pointer"
          >
            保存してはじめる
          </button>
        </div>
      </form>
    </div>
  );
}
