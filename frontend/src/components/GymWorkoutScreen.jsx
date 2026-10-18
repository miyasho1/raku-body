import React, { useState, useEffect } from 'react';
import WheelPicker from './WheelPicker';
import { getUserStorageData, setUserStorageData } from '../utils/authService';

export default function GymWorkoutScreen({ goal, presetWorkout, onBack, onRecordSuccess, embedded = false }) {
  const gymCourses = {
    fine_muscle: {
      id: 'fine_muscle',
      title: '細マッチョ・Vシェイプ集中',
      badge: '推奨：週2〜3回',
      target: '胸・背中・肩のアウトライン強調',
      reason: '大胸筋上部と広背筋・三角筋をマシンで安全に追い込み、逆三角形のシルエットを作ります。',
      items: [
        { name: 'チェストプレスマシン', part: '胸', weight: 35, reps: 12, sets: 3, point: '肩甲骨を寄せて胸を張り、大胸筋の収縮を意識' },
        { name: 'ラットプルダウン', part: '背中', weight: 35, reps: 12, sets: 3, point: '鎖骨に向かってバーを引き、広背筋でコントロール' },
        { name: 'ショルダープレスマシン', part: '肩', weight: 20, reps: 12, sets: 3, point: '肩をすくめず、三角筋の力で押し上げる' },
        { name: 'アブドミナルマシン', part: '腹筋', weight: 25, reps: 15, sets: 3, point: '息を吐き切りながらおへそを覗き込むように収縮' }
      ]
    },
    bulk_up: {
      id: 'bulk_up',
      title: '筋肥大・バルクアップ高重量',
      badge: '推奨：週3〜4回',
      target: 'BIG3中心・全身の筋量最大化',
      reason: '高重量コンパウンド種目で大筋群に強いメカニカルストレスを与え、厚みのある体を作ります。',
      items: [
        { name: 'ベンチプレス（または高重量チェストプレス）', part: '胸', weight: 55, reps: 8, sets: 4, point: '胸のボトムで止めず爆発的に挙上する' },
        { name: 'バーベルスクワット / レッグプレス', part: '脚', weight: 80, reps: 10, sets: 4, point: '下半身の大筋群を動員し成長ホルモン分泌を促進' },
        { name: 'シーテッドローイング', part: '背中', weight: 45, reps: 10, sets: 3, point: '背中の厚みを出すため肘を深く後ろへ引く' },
        { name: 'ケーブルプレスダウン', part: '腕', weight: 20, reps: 12, sets: 3, point: '肘を固定して上腕三頭筋を最後まで収縮させる' }
      ]
    },
    diet: {
      id: 'diet',
      title: '脂肪燃焼・代謝アップ全身',
      badge: '推奨：週2〜3回',
      target: '下半身＋背中の大筋群サーキット',
      reason: '全身の筋肉の70%が集まる脚と背中を中心に動かし、アフターバーン効果で消費カロリーを最大化します。',
      items: [
        { name: 'レッグプレスマシン', part: '脚', weight: 60, reps: 15, sets: 3, point: '高回数で太もも・ヒップの大きな筋肉を刺激' },
        { name: 'ラットプルダウン', part: '背中', weight: 30, reps: 15, sets: 3, point: '背中の褐色脂肪細胞周辺を刺激して代謝向上' },
        { name: 'チェストプレスマシン', part: '胸', weight: 25, reps: 15, sets: 3, point: 'インターバルを45秒に短縮し心拍数を維持' },
        { name: 'トレッドミル傾斜ウォーキング', part: '有酸素', weight: 0, reps: 20, sets: 1, point: '筋トレ後に傾斜5%・早歩き20分で脂肪燃焼加速' }
      ]
    },
    health: {
      id: 'health',
      title: '姿勢改善・スマート健康維持',
      badge: '推奨：週1〜2回',
      target: '背中・体幹・股関節の連動強化',
      reason: 'デスクワークによる猫背や巻き肩をリセットし、疲れにくい機能的な身体を整えます。',
      items: [
        { name: 'シーテッドローイング（軽重量）', part: '背中', weight: 25, reps: 15, sets: 3, point: '肩甲骨を寄せる意識で巻き肩・猫背を改善' },
        { name: 'レッグエクステンション', part: '脚', weight: 25, reps: 15, sets: 2, point: '膝周りの安定性を高め日常の歩行を軽快に' },
        { name: 'チェストプレスマシン', part: '胸', weight: 20, reps: 12, sets: 2, point: '呼吸を止めずに丁寧なフォームで動作' }
      ]
    }
  };

  const machineCategories = {
    '胸': ['チェストプレスマシン', 'ペックフライ（バタフライ）', 'ベンチプレス', 'インクラインプレス'],
    '背中': ['ラットプルダウン', 'シーテッドローイング', 'アシストチンニング', 'デッドリフト'],
    '脚': ['レッグプレス', 'レッグエクステンション', 'レッグカール', 'バーベルスクワット', 'アダクション / アブダクション'],
    '肩・腕・腹': ['ショルダープレスマシン', 'サイドレイズ（ダンベル/ケーブル）', 'アームカール', 'アブドミナルマシン（腹筋）']
  };

  const resolveCourseKey = () => {
    const f = goal?.target_focus || localStorage.getItem('raku_selected_goal') || 'fine_muscle';
    return gymCourses[f] ? f : 'fine_muscle';
  };

  const [activeMainTab, setActiveMainTab] = useState('record');
  const [selectedCourseKey, setSelectedCourseKey] = useState(resolveCourseKey);
  const [activePart, setActivePart] = useState('胸');
  const [menuName, setMenuName] = useState('チェストプレスマシン');
  const [weight, setWeight] = useState(35);
  const [reps, setReps] = useState(10);
  const [sets, setSets] = useState(3);
  const [note, setNote] = useState('');
  const [workouts, setWorkouts] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isBatchSubmitting, setIsBatchSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  const weightOptions = Array.from({ length: 81 }, (_, i) => i * 2.5);
  const repsOptions = Array.from({ length: 30 }, (_, i) => i + 1);
  const setsOptions = Array.from({ length: 10 }, (_, i) => i + 1);

  useEffect(() => {
    fetchWorkouts();
  }, []);

  useEffect(() => {
    if (presetWorkout) {
      setActiveMainTab('record');
      setMenuName(presetWorkout.name);
      if (presetWorkout.weight) setWeight(presetWorkout.weight);
      if (presetWorkout.reps) setReps(presetWorkout.reps);
      if (presetWorkout.sets) setSets(presetWorkout.sets);
      if (presetWorkout.point) setNote(presetWorkout.point);
    }
  }, [presetWorkout]);

  const appendLocalWorkout = (payload) => {
    const d = new Date();
    const todayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const timeStr = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:00`;
    try {
      const raw = getUserStorageData('workouts', []);
      const list = Array.isArray(raw) ? raw : [];
      list.unshift({
        id: `w_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        ...payload,
        log_date: todayStr,
        timestamp: `${todayStr} ${timeStr}`
      });
      setUserStorageData('workouts', list);
    } catch {
    }
  };

  const fetchWorkouts = async () => {
    try {
      const res = await fetch('/api/workouts?workout_type=gym');
      if (res.ok) {
        const data = await res.json();
        if (data.workouts && data.workouts.length > 0) {
          setWorkouts(data.workouts);
          return;
        }
      }
    } catch {
    }
    try {
      const raw = getUserStorageData('workouts', []);
      if (raw && Array.isArray(raw)) {
        setWorkouts(raw.filter((w) => w.workout_type === 'gym' || !w.workout_type));
      } else {
        setWorkouts([]);
      }
    } catch {
      setWorkouts([]);
    }
  };

  const handleSelectCourseItem = (item) => {
    setMenuName(item.name);
    setWeight(item.weight);
    setReps(item.reps);
    setSets(item.sets);
    setNote(item.point);
    setActiveMainTab('record');
    setMessage({ type: 'success', text: `「${item.name}」をセットしました` });
  };

  const handleBatchRecordCourse = async () => {
    const course = gymCourses[selectedCourseKey];
    if (!course || isBatchSubmitting) return;
    setIsBatchSubmitting(true);
    setMessage(null);

    try {
      for (const item of course.items) {
        const payload = {
          workout_type: 'gym',
          menu_name: item.name,
          sets: item.sets,
          reps: item.reps,
          weight: item.weight,
          duration_min: 0,
          note: `【${course.title}】${item.point}`
        };
        try {
          await fetch('/api/workouts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
        } catch {
        }
        appendLocalWorkout(payload);
      }

      setMessage({ type: 'success', text: `「${course.title}」全${course.items.length}種目を一括記録しました！` });
      fetchWorkouts();
      if (onRecordSuccess) {
        onRecordSuccess(`${course.title}（${course.items.length}種目）を記録しました！`);
      }
    } catch {
      setMessage({ type: 'error', text: '一括記録中に通信エラーが発生しました。' });
    } finally {
      setIsBatchSubmitting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!menuName.trim() || isSubmitting) return;
    setIsSubmitting(true);
    setMessage(null);

    const payload = {
      workout_type: 'gym',
      menu_name: menuName,
      sets: parseInt(sets, 10),
      reps: parseInt(reps, 10),
      weight: parseFloat(weight),
      duration_min: 0,
      note: note
    };

    appendLocalWorkout(payload);

    try {
      await fetch('/api/workouts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
    } catch {
    }

    setMessage({ type: 'success', text: `「${menuName}」を記録しました！` });
    setNote('');
    fetchWorkouts();
    if (onRecordSuccess) {
      onRecordSuccess('ジムトレーニングを記録しました！');
    }
    setIsSubmitting(false);
  };

  const currentCourse = gymCourses[selectedCourseKey];
  const totalSetsCount = workouts.reduce((sum, w) => sum + (w.sets || 1), 0);
  const totalVolumeKg = Math.round(
    workouts.reduce((sum, w) => sum + (w.weight || 0) * (w.reps || 10) * (w.sets || 1), 0)
  );
  const estimatedBurnKcal = Math.round(totalSetsCount * 18);

  return (
    <div className="flex flex-col space-y-3.5 pb-3">
      {!embedded && (
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3 py-1.5 rounded-xl transition-colors cursor-pointer shadow-2xs"
          >
            ‹ ホームへ戻る
          </button>
          <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-xl border border-indigo-200/80">
            🏋️ ジム・マシン記録
          </span>
        </div>
      )}

      {message && (
        <div className={`p-3 rounded-xl text-[11px] font-bold text-center transition-all shadow-xs ${
          message.type === 'success'
            ? 'bg-indigo-50 text-indigo-800 border border-indigo-200'
            : 'bg-rose-50 text-rose-800 border border-rose-200'
        }`}>
          {message.text}
        </div>
      )}

      <section className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80 space-y-3">
        <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveMainTab('record')}
            className={`py-1.5 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
              activeMainTab === 'record'
                ? 'bg-white text-indigo-600 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            📝 マシン記録
          </button>
          <button
            type="button"
            onClick={() => setActiveMainTab('ai')}
            className={`py-1.5 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
              activeMainTab === 'ai'
                ? 'bg-white text-indigo-600 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            ✨ AIコース
          </button>
          <button
            type="button"
            onClick={() => setActiveMainTab('history')}
            className={`py-1.5 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
              activeMainTab === 'history'
                ? 'bg-white text-indigo-600 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            📋 履歴({workouts.length})
          </button>
        </div>

        {activeMainTab === 'record' && (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-2">
              <div className="grid grid-cols-4 gap-1 bg-slate-100 p-1 rounded-xl">
                {Object.keys(machineCategories).map((part) => (
                  <button
                    key={part}
                    type="button"
                    onClick={() => {
                      setActivePart(part);
                      setMenuName(machineCategories[part][0]);
                    }}
                    className={`py-1 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                      activePart === part
                        ? 'bg-white text-indigo-600 shadow-2xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {part}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-1.5">
                {machineCategories[activePart].map((m, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setMenuName(m)}
                    className={`text-left text-[11px] px-2.5 py-2 rounded-xl border transition-all font-bold truncate cursor-pointer ${
                      menuName === m
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200/80 hover:border-indigo-300'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200/80">
              <label className="text-xs font-bold text-slate-700 shrink-0">種目名</label>
              <input
                type="text"
                value={menuName}
                onChange={(e) => setMenuName(e.target.value)}
                className="w-48 bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-900 text-right focus:outline-none focus:border-indigo-500"
                required
              />
            </div>

            <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-200/80 space-y-1.5">
              <div className="grid grid-cols-3 text-center text-[10px] font-bold text-slate-500">
                <span>重量 (kg)</span>
                <span>回数 (回)</span>
                <span>セット数</span>
              </div>

              <div className="relative bg-white rounded-xl p-1 border border-slate-200/80">
                <div className="pointer-events-none absolute inset-x-2 top-1/2 -translate-y-1/2 h-[30px] bg-indigo-50/70 rounded-lg border border-indigo-200/80 z-0" />
                <div className="relative z-0 grid grid-cols-3 items-center divide-x divide-slate-100">
                  <div className="flex justify-center">
                    <WheelPicker
                      items={weightOptions}
                      value={weight}
                      onChange={setWeight}
                      suffix="kg"
                      width="w-full"
                      height="h-[90px]"
                      itemHeight={30}
                      fontSize="text-base"
                      subFontSize="text-xs"
                    />
                  </div>
                  <div className="flex justify-center">
                    <WheelPicker
                      items={repsOptions}
                      value={reps}
                      onChange={setReps}
                      suffix="回"
                      width="w-full"
                      height="h-[90px]"
                      itemHeight={30}
                      fontSize="text-base"
                      subFontSize="text-xs"
                    />
                  </div>
                  <div className="flex justify-center">
                    <WheelPicker
                      items={setsOptions}
                      value={sets}
                      onChange={setSets}
                      suffix="set"
                      width="w-full"
                      height="h-[90px]"
                      itemHeight={30}
                      fontSize="text-base"
                      subFontSize="text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-bold rounded-xl shadow-md shadow-indigo-500/20 text-xs flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? '保存中...' : `記録を保存（${weight}kg × ${reps}回 × ${sets}セット）`}
            </button>
          </form>
        )}

        {activeMainTab === 'ai' && (
          <div className="space-y-2.5">
            <div className="grid grid-cols-4 gap-1 bg-slate-100 p-1 rounded-xl">
              {[
                { key: 'fine_muscle', label: '細マッチョ' },
                { key: 'bulk_up', label: '筋肥大' },
                { key: 'diet', label: '脂肪燃焼' },
                { key: 'health', label: '健康維持' }
              ].map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setSelectedCourseKey(tab.key)}
                  className={`py-1 px-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                    selectedCourseKey === tab.key
                      ? 'bg-white text-indigo-600 shadow-2xs'
                      : 'text-slate-600'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-extrabold text-slate-900">{currentCourse.title}</h3>
                <span className="text-[9px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-md">
                  {currentCourse.badge}
                </span>
              </div>
              <p className="text-[11px] text-slate-600 leading-snug">{currentCourse.reason}</p>

              <div className="grid grid-cols-2 gap-2">
                {currentCourse.items.map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleSelectCourseItem(item)}
                    className="bg-white rounded-xl p-2.5 border border-slate-200/80 hover:border-indigo-400 transition-all cursor-pointer flex flex-col justify-between gap-1"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700">
                        {item.part}
                      </span>
                      <span className="text-[10px] text-indigo-600 font-bold">反映 ›</span>
                    </div>
                    <span className="text-[11px] font-bold text-slate-900 truncate">{item.name}</span>
                    <span className="text-[10px] font-bold text-slate-500">
                      {item.weight > 0 ? `${item.weight}kg` : '自重'} × {item.reps}回 × {item.sets}set
                    </span>
                  </div>
                ))}
              </div>

              <button
                type="button"
                disabled={isBatchSubmitting}
                onClick={handleBatchRecordCourse}
                className="w-full py-2 bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-bold rounded-xl text-xs shadow-sm cursor-pointer disabled:opacity-50"
              >
                {isBatchSubmitting ? '一括記録中...' : `このコース（全${currentCourse.items.length}種目）を一括記録`}
              </button>
            </div>
          </div>
        )}

        {activeMainTab === 'history' && (
          <div className="space-y-2">
            {workouts.length === 0 ? (
              <div className="bg-slate-50 rounded-xl p-5 text-center border border-slate-200/70">
                <p className="text-xs text-slate-400">まだジム記録がありません</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {workouts.slice(0, 8).map((w, idx) => (
                  <div key={w.id || idx} className="bg-slate-50 rounded-xl p-2.5 border border-slate-200/80 flex flex-col justify-between gap-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-900 truncate">{w.menu_name}</span>
                      <span className="text-[9px] text-slate-400 shrink-0">{w.log_date?.slice(5)}</span>
                    </div>
                    <div className="text-[10px] font-bold text-indigo-600">
                      {w.weight > 0 ? `${w.weight}kg` : 'マシン'} × {w.reps}回 × {w.sets}set
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      <section className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xs font-extrabold text-slate-800">本日のトレーニング実績サマリー</h2>
            <p className="text-[10px] text-slate-500 mt-0.5">ジム・マシン種目の累計ボリュームと消費目安</p>
          </div>
          <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-200/70">
            計 {workouts.length} 種目
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2.5 text-center">
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/70">
            <span className="text-[10px] font-bold text-slate-500 block">総セット数</span>
            <span className="text-base font-black text-indigo-700 tabular-nums">{totalSetsCount}</span>
            <span className="text-[10px] font-bold text-slate-500 ml-0.5">set</span>
          </div>
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/70">
            <span className="text-[10px] font-bold text-slate-500 block">総挙上重量</span>
            <span className="text-base font-black text-slate-900 tabular-nums">{totalVolumeKg.toLocaleString()}</span>
            <span className="text-[10px] font-bold text-slate-500 ml-0.5">kg</span>
          </div>
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/70">
            <span className="text-[10px] font-bold text-slate-500 block">推定消費</span>
            <span className="text-base font-black text-emerald-700 tabular-nums">{estimatedBurnKcal}</span>
            <span className="text-[10px] font-bold text-slate-500 ml-0.5">kcal</span>
          </div>
        </div>
      </section>

      <section className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xs font-extrabold text-slate-800">直近のワークアウト履歴リスト</h2>
            <p className="text-[10px] text-slate-500 mt-0.5">タップで同じ重量・回数をすぐセット可能</p>
          </div>
          <button
            type="button"
            onClick={() => setActiveMainTab('history')}
            className="text-[10px] font-bold text-indigo-600 hover:underline cursor-pointer"
          >
            すべて見る ›
          </button>
        </div>

        {workouts.length === 0 ? (
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/70 text-center">
            <p className="text-xs text-slate-400">まだジムトレーニングの履歴がありません</p>
          </div>
        ) : (
          <div className="space-y-2">
            {workouts.slice(0, 4).map((w, idx) => (
              <div
                key={w.id || idx}
                onClick={() => {
                  setMenuName(w.menu_name || 'チェストプレスマシン');
                  if (w.weight !== undefined) setWeight(w.weight);
                  if (w.reps !== undefined) setReps(w.reps);
                  if (w.sets !== undefined) setSets(w.sets);
                  setActiveMainTab('record');
                }}
                className="bg-slate-50 hover:bg-indigo-50/40 rounded-xl p-3 border border-slate-200/70 flex items-center justify-between gap-2.5 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200/80 flex items-center justify-center text-sm shrink-0">
                    🏋️
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-900 truncate">{w.menu_name}</span>
                      <span className="text-[9px] text-slate-400 font-bold shrink-0">{w.log_date?.slice(5)}</span>
                    </div>
                    <p className="text-[10px] text-indigo-700 font-bold mt-0.5">
                      {w.weight > 0 ? `${w.weight}kg` : 'マシン'} × {w.reps || 10}回 × {w.sets || 3}セット
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-indigo-600 bg-white px-2.5 py-1 rounded-lg border border-indigo-200/70 shrink-0">
                  再セット
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
