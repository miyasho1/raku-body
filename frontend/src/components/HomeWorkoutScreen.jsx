import React, { useState, useEffect } from 'react';
import WheelPicker from './WheelPicker';

export default function HomeWorkoutScreen({ goal, presetWorkout, onBack, onRecordSuccess, embedded = false }) {
  const homeCourses = {
    fine_muscle: {
      id: 'fine_muscle',
      title: '自宅Vシェイプ・引き締め自重',
      badge: '器具なし・15分',
      reason: 'プッシュアップとプランクを組み合わせ、自宅でも胸板と腹筋のラインをシャープに際立たせます。',
      items: [
        { name: 'プッシュアップ（腕立て伏せ）', part: '胸・腕', reps: 15, sets: 3, duration: 0, point: '胸が床すれすれになるまで深く下ろす' },
        { name: 'ワイドスクワット', part: '脚・尻', reps: 20, sets: 3, duration: 0, point: 'つま先を外に向け、内ももとヒップを意識' },
        { name: 'プランク（体幹キープ）', part: '体幹', reps: 1, sets: 3, duration: 3, point: '頭からかかとまで一直線をキープ（60秒×3）' },
        { name: 'バイシクルクランチ', part: '腹筋', reps: 20, sets: 3, duration: 0, point: 'おへそを見ながら対角の肘と膝を近づける' }
      ]
    },
    diet: {
      id: 'diet',
      title: '脂肪燃焼HIIT＆有酸素コンボ',
      badge: '高燃焼・20分',
      reason: '全身を使った自重サーキットで心拍数を上げた後、有酸素運動を行うことで効率よく体脂肪を燃やします。',
      items: [
        { name: 'バーピージャンプ（マイルド可）', part: '全身燃焼', reps: 12, sets: 3, duration: 5, point: '一定のリズムで全身を大きく動かす' },
        { name: '自重スクワット', part: '下半身', reps: 20, sets: 3, duration: 0, point: '太ももの大きな筋肉を動かして代謝を点火' },
        { name: 'マウンテンクライマー', part: '腹筋・有酸素', reps: 30, sets: 3, duration: 0, point: 'お腹に力を入れたまま素早く脚を入れ替える' },
        { name: '早歩きウォーキング / 踏み台昇降', part: '有酸素', reps: 1, sets: 1, duration: 20, point: '少し息が弾むペースで20分間継続' }
      ]
    },
    bulk_up: {
      id: 'bulk_up',
      title: '高負荷スロー自重トレーニング',
      badge: '筋肥大・20分',
      reason: '3秒かけて下ろし3秒かけて上げるスロートレーニング法により、自重でも高重量並みの刺激を与えます。',
      items: [
        { name: 'デクライン・プッシュアップ（足上げ）', part: '胸上部', reps: 12, sets: 4, duration: 0, point: '椅子に足を乗せて大胸筋への負荷を高める' },
        { name: 'ブルガリアンスクワット', part: '片脚高負荷', reps: 12, sets: 3, duration: 0, point: '片脚ずつ体重を乗せ、太ももと臀部を追い込む' },
        { name: 'パイクプッシュアップ', part: '肩・三頭筋', reps: 10, sets: 3, duration: 0, point: 'お尻を高く上げて三角筋に負荷を集中させる' }
      ]
    },
    health: {
      id: 'health',
      title: 'リフレッシュ・姿勢＆体幹ケア',
      badge: '習慣化・10分',
      reason: '関節に優しい自重運動とストレッチ要素で、血流を促進し日々のコンディションを整えます。',
      items: [
        { name: 'スロースクワット', part: '下半身', reps: 12, sets: 2, duration: 0, point: '膝がつま先より前に出ないよう椅子に座る軌道で' },
        { name: 'プランク（体幹キープ）', part: '体幹', reps: 1, sets: 2, duration: 2, point: '腰を反らさずお腹を凹ませた状態をキープ' },
        { name: 'ウォーキング・散歩', part: '有酸素', reps: 1, sets: 1, duration: 15, point: '背筋を伸ばし、腕を振ってリズミカルに歩く' }
      ]
    }
  };

  const homeCategories = {
    '自重（上半身・体幹）': ['プッシュアップ（腕立て伏せ）', 'プランク（体幹キープ）', 'クランチ（腹筋）', 'バイシクルクランチ', 'バックエクステンション（背筋）'],
    '自重（下半身）': ['自重スクワット', 'ワイドスクワット', 'ブルガリアンスクワット', 'ヒップリフト', 'フロントランジ'],
    '有酸素・燃焼': ['ウォーキング・早歩き', 'ジョギング・ランニング', 'バーピージャンプ', 'エアロバイク / ステッパー', '全身ストレッチ・ヨガ']
  };

  const resolveCourseKey = () => {
    const f = goal?.target_focus || localStorage.getItem('raku_selected_goal') || 'fine_muscle';
    return homeCourses[f] ? f : 'fine_muscle';
  };

  const [activeMainTab, setActiveMainTab] = useState('record');
  const [selectedCourseKey, setSelectedCourseKey] = useState(resolveCourseKey);
  const [activeCat, setActiveCat] = useState('自重（上半身・体幹）');
  const [menuName, setMenuName] = useState('プッシュアップ（腕立て伏せ）');
  const [sets, setSets] = useState(3);
  const [reps, setReps] = useState(15);
  const [durationMin, setDurationMin] = useState(15);
  const [note, setNote] = useState('');
  const [workouts, setWorkouts] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isBatchSubmitting, setIsBatchSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  const repsOptions = Array.from({ length: 50 }, (_, i) => i + 1);
  const setsOptions = Array.from({ length: 10 }, (_, i) => i + 1);
  const durationOptions = Array.from({ length: 24 }, (_, i) => (i + 1) * 5);

  useEffect(() => {
    fetchWorkouts();
  }, []);

  useEffect(() => {
    if (presetWorkout) {
      setActiveMainTab('record');
      setMenuName(presetWorkout.name);
      if (presetWorkout.sets) setSets(presetWorkout.sets);
      if (presetWorkout.reps) setReps(presetWorkout.reps);
      if (presetWorkout.point) setNote(presetWorkout.point);
    }
  }, [presetWorkout]);

  const appendLocalWorkout = (payload) => {
    const d = new Date();
    const todayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const timeStr = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:00`;
    try {
      const raw = localStorage.getItem('raku_demo_workouts');
      const list = raw ? JSON.parse(raw) : [];
      list.unshift({
        id: `w_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        ...payload,
        log_date: todayStr,
        timestamp: `${todayStr} ${timeStr}`
      });
      localStorage.setItem('raku_demo_workouts', JSON.stringify(list));
    } catch {
    }
  };

  const fetchWorkouts = async () => {
    try {
      const res = await fetch('/api/workouts?workout_type=home');
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
      const raw = localStorage.getItem('raku_demo_workouts');
      if (raw) {
        const all = JSON.parse(raw);
        const homeOnly = all.filter((w) => w.workout_type === 'home');
        setWorkouts(homeOnly.length > 0 ? homeOnly : all.slice(0, 4));
      } else {
        setWorkouts([]);
      }
    } catch {
      setWorkouts([]);
    }
  };

  const handleSelectCourseItem = (item) => {
    setMenuName(item.name);
    setReps(item.reps);
    setSets(item.sets);
    setDurationMin(item.duration || 10);
    setNote(item.point);
    setActiveMainTab('record');
    setMessage({ type: 'success', text: `「${item.name}」をセットしました` });
  };

  const handleBatchRecordCourse = async () => {
    const course = homeCourses[selectedCourseKey];
    if (!course || isBatchSubmitting) return;
    setIsBatchSubmitting(true);
    setMessage(null);

    try {
      for (const item of course.items) {
        const payload = {
          workout_type: 'home',
          menu_name: item.name,
          sets: item.sets,
          reps: item.reps,
          weight: 0,
          duration_min: item.duration || 0,
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

    const isCardio = activeCat === '有酸素・燃焼';
    const payload = {
      workout_type: 'home',
      menu_name: menuName,
      sets: parseInt(sets, 10),
      reps: isCardio ? 1 : parseInt(reps, 10),
      weight: 0,
      duration_min: isCardio ? parseInt(durationMin, 10) : 0,
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
      onRecordSuccess('宅トレを記録しました！');
    }
    setIsSubmitting(false);
  };

  const currentCourse = homeCourses[selectedCourseKey];
  const isCardioCategory = activeCat === '有酸素・燃焼';
  const totalSetsCount = workouts.reduce((sum, w) => sum + (w.sets || 1), 0);
  const totalMinutes = workouts.reduce((sum, w) => sum + (w.duration_min || (w.sets || 1) * 3), 0);
  const estimatedBurnKcal = Math.round(totalSetsCount * 14 + totalMinutes * 4);

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
          <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-xl border border-blue-200/80">
            🏠 宅トレ・自重記録
          </span>
        </div>
      )}

      {message && (
        <div className={`p-3 rounded-xl text-[11px] font-bold text-center transition-all shadow-xs ${
          message.type === 'success'
            ? 'bg-blue-50 text-blue-800 border border-blue-200'
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
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            📝 宅トレ記録
          </button>
          <button
            type="button"
            onClick={() => setActiveMainTab('ai')}
            className={`py-1.5 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
              activeMainTab === 'ai'
                ? 'bg-white text-blue-600 shadow-xs'
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
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            📋 履歴({workouts.length})
          </button>
        </div>

        {activeMainTab === 'record' && (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-2">
              <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl">
                {Object.keys(homeCategories).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      setActiveCat(cat);
                      setMenuName(homeCategories[cat][0]);
                    }}
                    className={`py-1 text-[10px] font-bold rounded-lg transition-all cursor-pointer truncate px-1 ${
                      activeCat === cat
                        ? 'bg-white text-blue-600 shadow-2xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {cat === '自重（上半身・体幹）' ? '上半身・体幹' : cat === '自重（下半身）' ? '下半身' : '有酸素・燃焼'}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-1.5">
                {homeCategories[activeCat].map((m, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setMenuName(m)}
                    className={`text-left text-[11px] px-2.5 py-2 rounded-xl border transition-all font-bold truncate cursor-pointer ${
                      menuName === m
                        ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200/80 hover:border-blue-300'
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
                className="w-48 bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-900 text-right focus:outline-none focus:border-blue-500"
                required
              />
            </div>

            <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-200/80 space-y-1.5">
              <div className="grid grid-cols-2 text-center text-[10px] font-bold text-slate-500">
                <span>{isCardioCategory ? '運動時間 (分)' : '回数 (回)'}</span>
                <span>セット数</span>
              </div>

              <div className="relative bg-white rounded-xl p-1 border border-slate-200/80">
                <div className="pointer-events-none absolute inset-x-2 top-1/2 -translate-y-1/2 h-[30px] bg-blue-50/70 rounded-lg border border-blue-200/80 z-0" />
                <div className="relative z-0 grid grid-cols-2 items-center divide-x divide-slate-100">
                  <div className="flex justify-center">
                    {isCardioCategory ? (
                      <WheelPicker
                        items={durationOptions}
                        value={durationMin}
                        onChange={setDurationMin}
                        suffix="分"
                        width="w-full"
                        height="h-[90px]"
                        itemHeight={30}
                        fontSize="text-base"
                        subFontSize="text-xs"
                      />
                    ) : (
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
                    )}
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
              className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-md shadow-blue-500/20 text-xs flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting
                ? '保存中...'
                : isCardioCategory
                ? `記録を保存（${durationMin}分 × ${sets}セット）`
                : `記録を保存（${reps}回 × ${sets}セット）`}
            </button>
          </form>
        )}

        {activeMainTab === 'ai' && (
          <div className="space-y-2.5">
            <div className="grid grid-cols-4 gap-1 bg-slate-100 p-1 rounded-xl">
              {[
                { key: 'fine_muscle', label: '引き締め' },
                { key: 'diet', label: '脂肪燃焼' },
                { key: 'bulk_up', label: '高負荷自重' },
                { key: 'health', label: '姿勢・体幹' }
              ].map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setSelectedCourseKey(tab.key)}
                  className={`py-1 px-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                    selectedCourseKey === tab.key
                      ? 'bg-white text-blue-600 shadow-2xs'
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
                <span className="text-[9px] font-bold bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-md">
                  {currentCourse.badge}
                </span>
              </div>
              <p className="text-[11px] text-slate-600 leading-snug">{currentCourse.reason}</p>

              <div className="grid grid-cols-2 gap-2">
                {currentCourse.items.map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleSelectCourseItem(item)}
                    className="bg-white rounded-xl p-2.5 border border-slate-200/80 hover:border-blue-400 transition-all cursor-pointer flex flex-col justify-between gap-1"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700">
                        {item.part}
                      </span>
                      <span className="text-[10px] text-blue-600 font-bold">反映 ›</span>
                    </div>
                    <span className="text-[11px] font-bold text-slate-900 truncate">{item.name}</span>
                    <span className="text-[10px] font-bold text-slate-500">
                      {item.duration > 0 ? `${item.duration}分` : `${item.reps}回`} × {item.sets}set
                    </span>
                  </div>
                ))}
              </div>

              <button
                type="button"
                disabled={isBatchSubmitting}
                onClick={handleBatchRecordCourse}
                className="w-full py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl text-xs shadow-sm cursor-pointer disabled:opacity-50"
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
                <p className="text-xs text-slate-400">まだ宅トレ記録がありません</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {workouts.slice(0, 8).map((w, idx) => (
                  <div key={w.id || idx} className="bg-slate-50 rounded-xl p-2.5 border border-slate-200/80 flex flex-col justify-between gap-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-900 truncate">{w.menu_name}</span>
                      <span className="text-[9px] text-slate-400 shrink-0">{w.log_date?.slice(5)}</span>
                    </div>
                    <div className="text-[10px] font-bold text-blue-600">
                      {w.duration_min > 0 ? `${w.duration_min}分` : `${w.reps}回`} × {w.sets}set
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
            <h2 className="text-xs font-extrabold text-slate-800">本日の宅トレ実績サマリー</h2>
            <p className="text-[10px] text-slate-500 mt-0.5">自重・有酸素運動の累計実績と消費カロリー目安</p>
          </div>
          <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-200/70">
            計 {workouts.length} 種目
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2.5 text-center">
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/70">
            <span className="text-[10px] font-bold text-slate-500 block">総セット数</span>
            <span className="text-base font-black text-blue-700 tabular-nums">{totalSetsCount}</span>
            <span className="text-[10px] font-bold text-slate-500 ml-0.5">set</span>
          </div>
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/70">
            <span className="text-[10px] font-bold text-slate-500 block">推定運動時間</span>
            <span className="text-base font-black text-slate-900 tabular-nums">{totalMinutes}</span>
            <span className="text-[10px] font-bold text-slate-500 ml-0.5">分</span>
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
            <h2 className="text-xs font-extrabold text-slate-800">直近の宅トレ・有酸素履歴リスト</h2>
            <p className="text-[10px] text-slate-500 mt-0.5">タップで同じ種目・回数をすぐセット可能</p>
          </div>
          <button
            type="button"
            onClick={() => setActiveMainTab('history')}
            className="text-[10px] font-bold text-blue-600 hover:underline cursor-pointer"
          >
            すべて見る ›
          </button>
        </div>

        {workouts.length === 0 ? (
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/70 text-center">
            <p className="text-xs text-slate-400">まだ宅トレの履歴がありません</p>
          </div>
        ) : (
          <div className="space-y-2">
            {workouts.slice(0, 4).map((w, idx) => (
              <div
                key={w.id || idx}
                onClick={() => {
                  setMenuName(w.menu_name || 'プッシュアップ（腕立て伏せ）');
                  if (w.reps !== undefined) setReps(w.reps);
                  if (w.sets !== undefined) setSets(w.sets);
                  if (w.duration_min) setDurationMin(w.duration_min);
                  setActiveMainTab('record');
                }}
                className="bg-slate-50 hover:bg-blue-50/40 rounded-xl p-3 border border-slate-200/70 flex items-center justify-between gap-2.5 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 border border-blue-200/80 flex items-center justify-center text-sm shrink-0">
                    🏠
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-900 truncate">{w.menu_name}</span>
                      <span className="text-[9px] text-slate-400 font-bold shrink-0">{w.log_date?.slice(5)}</span>
                    </div>
                    <p className="text-[10px] text-blue-700 font-bold mt-0.5">
                      {w.duration_min > 0 ? `${w.duration_min}分` : `${w.reps || 15}回`} × {w.sets || 3}セット
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-blue-600 bg-white px-2.5 py-1 rounded-lg border border-blue-200/70 shrink-0">
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
