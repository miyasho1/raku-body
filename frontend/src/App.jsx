import React, { useState, useEffect } from 'react';
import Navigation from './components/Navigation';
import HomeScreen from './components/HomeScreen';
import MetricsScreen from './components/MetricsScreen';
import AnalyticsScreen from './components/AnalyticsScreen';
import HomeWorkoutScreen from './components/HomeWorkoutScreen';
import GymWorkoutScreen from './components/GymWorkoutScreen';
import BodyAnalysisScreen from './components/BodyAnalysisScreen';
import MealScreen from './components/MealScreen';
import WorkoutHubScreen from './components/WorkoutHubScreen';
import LoginScreen from './components/LoginScreen';
import { seedOneWeekDemoData, resetAllAppData } from './utils/demoData';
import {
  getCurrentAuthUser,
  setAuthUserSession,
  clearAuthUserSession,
  clearGuestSessionData,
  getUserStorageData,
  setUserStorageData
} from './utils/authService';

export default function App() {
  const [authUser, setAuthUser] = useState(() => getCurrentAuthUser());
  const [activeTab, setActiveTab] = useState('home');
  const [streakDays, setStreakDays] = useState(() => {
    const savedStreak = getUserStorageData('streak', 0);
    return parseInt(savedStreak, 10) || 0;
  });
  const [isLoggedToday, setIsLoggedToday] = useState(false);
  const [logs, setLogs] = useState([]);
  const [dataVersion, setDataVersion] = useState(0);
  const [isSeedingDemo, setIsSeedingDemo] = useState(false);
  const [presetWorkout, setPresetWorkout] = useState(null);
  const [workoutHubInitial, setWorkoutHubInitial] = useState('gym');
  const [goal, setGoal] = useState(() => {
    const savedFocus = localStorage.getItem('raku_selected_goal');
    return {
      arms: 4,
      chest: 4,
      waist: 1,
      legs: 3,
      preset_name: savedFocus === 'bulk_up' ? 'マッスル' : savedFocus === 'diet' ? 'ダイエット' : savedFocus === 'health' ? '健康維持' : '細マッチョ',
      target_focus: savedFocus || 'fine_muscle'
    };
  });
  const [toastMessage, setToastMessage] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isMobileGuideOpen, setIsMobileGuideOpen] = useState(false);
  const [lanIp, setLanIp] = useState('192.168.1.10');
  const [heightCm, setHeightCm] = useState(() => localStorage.getItem('raku_body_height') || localStorage.getItem('raku_user_height') || '170');
  const [targetWeightKg, setTargetWeightKg] = useState(() => localStorage.getItem('raku_target_weight') || '62.0');
  const [targetCaloriesKcal, setTargetCaloriesKcal] = useState(() => localStorage.getItem('raku_target_calories') || '2000');
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [currentTimeStr, setCurrentTimeStr] = useState(() => {
    const now = new Date();
    return `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`;
  });

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTimeStr(`${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`);
    };
    updateTime();
    const timer = setInterval(updateTime, 10000);
    return () => clearInterval(timer);
  }, []);

  const getBreadcrumbs = () => {
    switch (activeTab) {
      case 'body-analysis':
        return [
          { label: 'ホーム', tab: 'home' },
          { label: 'AI画像分析', tab: null }
        ];
      case 'workout':
        return [
          { label: 'ホーム', tab: 'home' },
          { label: '運動記録', tab: null }
        ];
      case 'gym-workout':
        return [
          { label: 'ホーム', tab: 'home' },
          { label: '運動記録', tab: 'workout' },
          { label: 'ジム・マシン記録', tab: null }
        ];
      case 'home-workout':
        return [
          { label: 'ホーム', tab: 'home' },
          { label: '運動記録', tab: 'workout' },
          { label: '宅トレ・自重運動', tab: null }
        ];
      case 'meal':
        return [
          { label: 'ホーム', tab: 'home' },
          { label: '食事記録', tab: null }
        ];
      case 'metrics':
        return [
          { label: 'ホーム', tab: 'home' },
          { label: '体重推移', tab: null }
        ];
      case 'history':
        return [
          { label: 'ホーム', tab: 'home' },
          { label: '総合分析', tab: null }
        ];
      case 'home':
      default:
        return [
          { label: 'ホーム', tab: null }
        ];
    }
  };

  useEffect(() => {
    fetchInitialData();
    fetchNetworkInfo();
  }, []);

  const fetchNetworkInfo = async () => {
    try {
      const res = await fetch('/api/network-info');
      if (res.ok) {
        const data = await res.json();
        if (data && data.lan_ip) {
          setLanIp(data.lan_ip);
        }
      }
    } catch {
    }
  };

  const fetchInitialData = async () => {
    try {
      if (localStorage.getItem('raku_device_initialized') !== 'true') {
        localStorage.setItem('raku_device_initialized', 'true');
      }
    } catch {
    }

    let statusLoaded = false;
    let logsLoaded = false;

    try {
      const statusRes = await fetch('/api/status');
      if (statusRes.ok) {
        const statusData = await statusRes.json();
        setIsLoggedToday(statusData.is_logged_today);
        setStreakDays(statusData.streak_days);
        statusLoaded = true;
      }

      const logsRes = await fetch('/api/logs');
      if (logsRes.ok) {
        const logsData = await logsRes.json();
        if (logsData.logs) {
          setLogs(logsData.logs);
          logsLoaded = true;
        }
      }

      const goalRes = await fetch('/api/goal');
      if (goalRes.ok) {
        const goalData = await goalRes.json();
        if (goalData.goal) {
          setGoal(goalData.goal);
          if (goalData.goal.target_focus) {
            localStorage.setItem('raku_selected_goal', goalData.goal.target_focus);
          }
        }
      }
    } catch {
    }

    if (!statusLoaded) {
      try {
        const savedStreak = getUserStorageData('streak', 0);
        const parsedStreak = parseInt(savedStreak, 10) || 0;
        setStreakDays(parsedStreak);
        setIsLoggedToday(parsedStreak > 0);
      } catch {
      }
    }

    if (!logsLoaded) {
      try {
        const savedLogs = getUserStorageData('logs', []);
        setLogs(Array.isArray(savedLogs) ? savedLogs : []);
      } catch {
      }
    }
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const handleLoginSuccess = (userObj) => {
    setAuthUserSession(userObj);
    setAuthUser(userObj);
    setActiveTab('home');
    setDataVersion((v) => v + 1);
    fetchInitialData();
    showToast(`${userObj.name}さん、ようこそ！`);
  };

  const handleLogout = () => {
    if (authUser?.isGuest || authUser?.authProvider === 'guest') {
      clearGuestSessionData();
    }
    clearAuthUserSession();
    setAuthUser(null);
    setIsDrawerOpen(false);
    setLogs([]);
    setStreakDays(0);
    setIsLoggedToday(false);
    setDataVersion((v) => v + 1);
    showToast('ログアウトしました');
  };

  const handleSaveProfileSettings = (e) => {
    if (e) e.preventDefault();
    const cleanHeight = String(Math.max(100, Math.min(230, parseFloat(heightCm) || 170)));
    const cleanWeight = String(Math.max(30, Math.min(200, parseFloat(targetWeightKg) || 62)));
    const cleanCalories = String(Math.max(800, Math.min(5000, parseInt(targetCaloriesKcal, 10) || 2000)));
    setHeightCm(cleanHeight);
    setTargetWeightKg(cleanWeight);
    setTargetCaloriesKcal(cleanCalories);
    setUserStorageData('body_height', cleanHeight);
    setUserStorageData('user_height', cleanHeight);
    setUserStorageData('target_weight', cleanWeight);
    setUserStorageData('target_calories', cleanCalories);
    localStorage.setItem('raku_body_height', cleanHeight);
    localStorage.setItem('raku_user_height', cleanHeight);
    localStorage.setItem('raku_target_weight', cleanWeight);
    localStorage.setItem('raku_target_calories', cleanCalories);
    setDataVersion((v) => v + 1);
    showToast('基本プロフィール・目標設定を保存しました');
  };

  const handleSeedOneWeekDemo = async () => {
    if (isSeedingDemo) return;
    setIsSeedingDemo(true);
    try {
      const dataset = await seedOneWeekDemoData(authUser?.uid);
      setStreakDays(dataset.streakDays);
      setIsLoggedToday(true);
      setLogs(dataset.logs);
      await fetchInitialData();
      setDataVersion((v) => v + 1);
      setIsDrawerOpen(false);
      showToast('📊 過去7日間分の食事・運動・体重サンプルデータを一括投入しました！');
    } finally {
      setIsSeedingDemo(false);
    }
  };

  const handleExecuteResetData = async () => {
    await resetAllAppData(authUser?.uid);
    localStorage.setItem('raku_device_initialized', 'true');
    setStreakDays(0);
    setIsLoggedToday(false);
    setLogs([]);
    setHeightCm('170');
    setTargetWeightKg('62.0');
    setTargetCaloriesKcal('2000');
    setDataVersion((v) => v + 1);
    setIsResetConfirmOpen(false);
    setIsDrawerOpen(false);
    showToast('🗑️ すべての記録データと設定を初期化しました');
  };

  const handleRecordLog = async () => {
    const d = new Date();
    const todayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const timeStr = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:00`;
    const localEntry = {
      id: `log_${Date.now()}`,
      category: 'トレーニング完了',
      note: 'ワンタップで簡単記録',
      log_date: todayStr,
      timestamp: `${todayStr} ${timeStr}`
    };

    try {
      const rawLogs = getUserStorageData('logs', []);
      const parsedLogs = Array.isArray(rawLogs) ? rawLogs : [];
      parsedLogs.unshift(localEntry);
      setUserStorageData('logs', parsedLogs);
      const nextStreak = Math.max(1, streakDays || 1);
      setUserStorageData('streak', String(nextStreak));
    } catch {
    }

    try {
      const res = await fetch('/api/log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          category: 'トレーニング完了',
          note: 'ワンタップで簡単記録'
        })
      });

      if (res.ok) {
        const data = await res.json();
        setIsLoggedToday(true);
        setStreakDays(data.streak_days);
        setLogs((prev) => [data.data, ...prev]);
        setDataVersion((v) => v + 1);
        showToast('本日のトレーニングを記録しました！');
        return;
      }
    } catch {
    }

    setIsLoggedToday(true);
    setStreakDays((prev) => Math.max(1, prev));
    setLogs((prev) => [localEntry, ...prev]);
    setDataVersion((v) => v + 1);
    showToast('本日のトレーニングを記録しました！');
  };

  const handleWorkoutSuccess = (msg) => {
    setIsLoggedToday(true);
    setPresetWorkout(null);
    fetchInitialData();
    setDataVersion((v) => v + 1);
    showToast(msg);
  };

  const handleApplyWorkoutMenu = (menu) => {
    setPresetWorkout(menu);
    if (menu.category === 'gym') {
      setActiveTab('gym-workout');
    } else {
      setActiveTab('home-workout');
    }
  };

  const handleMetricsSuccess = () => {
    setDataVersion((v) => v + 1);
    showToast('計測データを保存しました！');
  };

  const getNavActiveTab = () => {
    if (activeTab === 'home' || activeTab === 'body-analysis') return 'home';
    if (activeTab === 'meal') return 'meal';
    if (activeTab === 'workout' || activeTab === 'home-workout' || activeTab === 'gym-workout') return 'workout';
    if (activeTab === 'metrics') return 'metrics';
    if (activeTab === 'history') return 'history';
    return 'home';
  };

  const activePort = typeof window !== 'undefined' && window.location.port ? window.location.port : '3000';
  const isPublicOrigin = typeof window !== 'undefined' && window.location.hostname && window.location.hostname !== 'localhost' && !window.location.hostname.startsWith('127.');
  const mobileAccessUrl = isPublicOrigin ? window.location.origin : `http://${lanIp}:${activePort}`;

  const handleCopyLanUrl = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(mobileAccessUrl);
        showToast(`接続URL（${mobileAccessUrl}）をコピーしました`);
      }
    } catch {
      showToast(`接続URL: ${mobileAccessUrl}`);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-slate-100 sm:bg-slate-200/70 flex justify-center items-center font-sans sm:py-4 sm:px-4">
      <div className="w-full sm:max-w-[430px] h-[100dvh] sm:h-[880px] sm:my-auto relative overflow-hidden flex flex-col rounded-none sm:rounded-[44px] shadow-none sm:shadow-2xl border-0 sm:border sm:border-slate-300 bg-slate-100">

        <div className="hidden sm:flex bg-white h-[48px] px-6 pt-2 pb-1 items-center justify-between select-none shrink-0 z-30 relative">
          <div className="w-[92px] flex items-center justify-start">
            <span className="text-[13px] font-bold text-slate-900 tracking-tight tabular-nums">
              {currentTimeStr}
            </span>
          </div>

          <div className="w-[160px] flex items-center justify-center pointer-events-none shrink-0">
            <div className="w-[120px] h-[32px] bg-black rounded-full flex items-center justify-between px-3 shadow-inner border border-slate-900/90">
              <div className="w-2.5 h-2.5 rounded-full bg-neutral-900/90 border border-neutral-800/80" />
              <div className="w-3 h-3 rounded-full bg-slate-900 border border-slate-700/80 flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-950/90" />
              </div>
            </div>
          </div>

          <div className="w-[92px] flex items-center justify-end gap-1.5 text-slate-900">
            <svg className="w-3.5 h-3 shrink-0" viewBox="0 0 17 12" fill="currentColor">
              <rect x="0" y="9" width="3" height="3" rx="0.5" />
              <rect x="4.5" y="6" width="3" height="6" rx="0.5" />
              <rect x="9" y="3" width="3" height="9" rx="0.5" />
              <rect x="13.5" y="0" width="3" height="12" rx="0.5" />
            </svg>
            <span className="text-[11px] font-bold tracking-tighter shrink-0">5G</span>
            <div className="relative flex items-center shrink-0">
              <div className="w-6 h-3 rounded-[4px] border border-slate-900 p-0.5 flex items-center justify-center relative">
                <div className="h-full w-full bg-slate-900 rounded-[2px]" />
              </div>
              <div className="w-0.5 h-1.5 bg-slate-900 rounded-r-xs -ml-[1px]" />
            </div>
          </div>
        </div>

        {!authUser ? (
          <LoginScreen onLoginSuccess={handleLoginSuccess} />
        ) : (
          <>
            <header className="bg-white px-4 safe-top-mobile pb-3 flex items-center justify-between shrink-0 z-20">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-black text-base shadow-2xs">
                  R
                </div>
                <div>
                  <span className="text-base font-extrabold text-slate-900 tracking-tight block leading-tight">
                    らくボディ
                  </span>
                  <span className="text-[9px] font-bold text-blue-600 tracking-tight block">
                    SMART FITNESS LIFE
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsDrawerOpen(true)}
                  className="flex items-center gap-1.5 pl-2 pr-2.5 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 transition-colors cursor-pointer"
                >
                  {authUser.avatarUrl ? (
                    <img
                      src={authUser.avatarUrl}
                      alt={authUser.name}
                      className="w-5 h-5 rounded-full object-cover"
                    />
                  ) : (
                    <div className={`w-5 h-5 rounded-full ${authUser.bgColor || 'bg-blue-600'} text-white flex items-center justify-center text-[10px] font-bold`}>
                      {authUser.initial || (authUser.name ? authUser.name.charAt(0).toUpperCase() : 'U')}
                    </div>
                  )}
                  <span className="text-[11px] font-bold text-slate-800 max-w-[88px] truncate block leading-tight">
                    {authUser.name}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsDrawerOpen(true)}
                  aria-label="メニューを開く"
                  className="w-9 h-9 rounded-xl bg-white border border-slate-200/90 shadow-2xs hover:bg-slate-50 active:scale-95 transition-all text-slate-700 flex items-center justify-center cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 7h16M4 12h16M4 17h16" />
                  </svg>
                </button>
              </div>
            </header>

            <nav className="border-y border-slate-200/80 bg-slate-50/90 px-4 py-1.5 flex items-center text-[11px] text-slate-500 overflow-x-auto whitespace-nowrap shrink-0 z-20 no-scrollbar [&::-webkit-scrollbar]:hidden">
              {getBreadcrumbs().map((bc, idx) => (
                <React.Fragment key={idx}>
                  {idx > 0 && <span className="mx-1.5 text-slate-400">›</span>}
                  {bc.tab ? (
                    <button
                      type="button"
                      onClick={() => setActiveTab(bc.tab)}
                      className="font-medium text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                    >
                      {bc.label}
                    </button>
                  ) : (
                    <span className="font-bold text-slate-800">{bc.label}</span>
                  )}
                </React.Fragment>
              ))}
            </nav>

            <main className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-3.5 no-scrollbar [&::-webkit-scrollbar]:hidden">
              {activeTab === 'home' && (
                <HomeScreen
                  streakDays={streakDays}
                  isLoggedToday={isLoggedToday}
                  dataVersion={dataVersion}
                  goal={goal}
                  onRecordLog={handleRecordLog}
                  onSelectWorkoutType={(type) => {
                    setWorkoutHubInitial(type);
                    setActiveTab('workout');
                  }}
                  onOpenBodyAnalysis={() => setActiveTab('body-analysis')}
                />
              )}

              {activeTab === 'body-analysis' && (
                <BodyAnalysisScreen
                  onBack={() => setActiveTab('home')}
                  onApplyWorkoutMenu={handleApplyWorkoutMenu}
                />
              )}

              {activeTab === 'workout' && (
                <WorkoutHubScreen
                  initialType={workoutHubInitial}
                  goal={goal}
                  presetWorkout={presetWorkout}
                  onBack={() => {
                    setPresetWorkout(null);
                    setActiveTab('home');
                  }}
                  onRecordSuccess={handleWorkoutSuccess}
                />
              )}

              {activeTab === 'home-workout' && (
                <HomeWorkoutScreen
                  goal={goal}
                  presetWorkout={presetWorkout}
                  onBack={() => {
                    setPresetWorkout(null);
                    setActiveTab('home');
                  }}
                  onRecordSuccess={handleWorkoutSuccess}
                />
              )}

              {activeTab === 'gym-workout' && (
                <GymWorkoutScreen
                  goal={goal}
                  presetWorkout={presetWorkout}
                  onBack={() => {
                    setPresetWorkout(null);
                    setActiveTab('home');
                  }}
                  onRecordSuccess={handleWorkoutSuccess}
                />
              )}

              {activeTab === 'meal' && (
                <MealScreen
                  onRecordSuccess={handleWorkoutSuccess}
                  dataVersion={dataVersion}
                />
              )}

              {activeTab === 'metrics' && (
                <MetricsScreen
                  onRecordSuccess={handleMetricsSuccess}
                  dataVersion={dataVersion}
                />
              )}

              {activeTab === 'history' && (
                <AnalyticsScreen
                  onSelectTab={setActiveTab}
                  dataVersion={dataVersion}
                />
              )}
            </main>

            <Navigation
              activeTab={getNavActiveTab()}
              onSelectTab={(tabId) => {
                if (tabId === 'workout') {
                  setWorkoutHubInitial('gym');
                }
                setActiveTab(tabId);
              }}
            />
          </>
        )}

        {toastMessage && (
          <div className="absolute top-16 left-1/2 transform -translate-x-1/2 max-w-[calc(100%-2rem)] bg-slate-900/95 backdrop-blur-md text-white text-xs font-semibold px-5 py-2.5 rounded-2xl shadow-lg z-50 transition-all text-center">
            {toastMessage}
          </div>
        )}

        {authUser && isDrawerOpen && (
          <div className="absolute inset-0 z-40 flex justify-end overflow-hidden">
            <div
              className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
              onClick={() => setIsDrawerOpen(false)}
            />
            <div className="relative w-[85%] max-w-[345px] bg-white h-full shadow-2xl pt-12 sm:pt-14 pb-5 px-4 flex flex-col justify-between overflow-y-auto z-10 border-l border-slate-200 animate-in slide-in-from-right duration-200">
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                  <span className="text-sm font-black text-slate-900">メニュー・プロフィール設定</span>
                  <button
                    type="button"
                    onClick={() => setIsDrawerOpen(false)}
                    className="w-7 h-7 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-xs font-bold cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 flex items-center gap-3">
                  {authUser.avatarUrl ? (
                    <img
                      src={authUser.avatarUrl}
                      alt={authUser.name}
                      className="w-10 h-10 rounded-xl object-cover border border-white shadow-xs shrink-0"
                    />
                  ) : (
                    <div className={`w-10 h-10 rounded-xl ${authUser.bgColor || 'bg-blue-600'} text-white flex items-center justify-center font-black text-sm shrink-0 shadow-xs`}>
                      {authUser.initial || (authUser.name ? authUser.name.charAt(0).toUpperCase() : 'U')}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-extrabold text-slate-900 truncate">
                      {authUser.name}
                    </div>
                    <div className="text-[11px] text-slate-500 truncate mt-0.5">
                      {authUser.email}
                    </div>
                  </div>
                </div>

                <form onSubmit={handleSaveProfileSettings} className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 space-y-2">
                  <div className="text-xs font-extrabold text-slate-800">基本プロフィール・目標設定</div>

                  <div className="flex items-center justify-between gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200/80">
                    <label className="text-[11px] font-bold text-slate-700 shrink-0">身長</label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        step="0.5"
                        min="100"
                        max="230"
                        value={heightCm}
                        onChange={(e) => setHeightCm(e.target.value)}
                        className="w-20 text-right text-xs font-extrabold text-slate-900 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:border-blue-500 tabular-nums"
                      />
                      <span className="text-[10px] font-bold text-slate-500">cm</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200/80">
                    <label className="text-[11px] font-bold text-slate-700 shrink-0">目標体重</label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        step="0.1"
                        min="30"
                        max="200"
                        value={targetWeightKg}
                        onChange={(e) => setTargetWeightKg(e.target.value)}
                        className="w-20 text-right text-xs font-extrabold text-slate-900 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:border-blue-500 tabular-nums"
                      />
                      <span className="text-[10px] font-bold text-slate-500">kg</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200/80">
                    <label className="text-[11px] font-bold text-slate-700 shrink-0">目標カロリー</label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        step="50"
                        min="800"
                        max="5000"
                        value={targetCaloriesKcal}
                        onChange={(e) => setTargetCaloriesKcal(e.target.value)}
                        className="w-20 text-right text-xs font-extrabold text-slate-900 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:border-blue-500 tabular-nums"
                      />
                      <span className="text-[10px] font-bold text-slate-500">kcal</span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-2xs transition-colors cursor-pointer"
                  >
                    設定を保存
                  </button>
                </form>

                <div className="bg-slate-50 rounded-2xl border border-slate-200/80 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setIsMobileGuideOpen(!isMobileGuideOpen)}
                    className="w-full p-3.5 flex items-center justify-between text-left cursor-pointer hover:bg-slate-100/70 transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-sm">📱</span>
                      <div className="min-w-0">
                        <span className="text-xs font-extrabold text-slate-800 block leading-tight">
                          スマホ実機で開く（接続URL案内）
                        </span>
                        <span className="text-[10px] text-blue-600 font-bold truncate block mt-0.5 tabular-nums">
                          {mobileAccessUrl}
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 shrink-0">
                      {isMobileGuideOpen ? '▲' : '▼'}
                    </span>
                  </button>

                  {isMobileGuideOpen && (
                    <div className="px-3.5 pb-3.5 pt-1 border-t border-slate-200/60 space-y-2">
                      <div className="bg-white rounded-xl p-2.5 border border-slate-200/80 flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <span className="text-[9px] text-slate-400 font-bold block">同一Wi-Fi（LAN）アクセスURL</span>
                          <span className="text-xs font-black text-indigo-700 truncate block tabular-nums">
                            {mobileAccessUrl}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={handleCopyLanUrl}
                          className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-lg text-[10px] border border-indigo-200/80 shrink-0 cursor-pointer"
                        >
                          コピー
                        </button>
                      </div>
                      <div className="text-[10px] text-slate-600 space-y-1 leading-relaxed bg-blue-50/60 p-2.5 rounded-xl border border-blue-200/60">
                        <p className="font-bold text-blue-900">🍏 iPhoneネイティブ全画面（PWA）手順:</p>
                        <p>1. PCと同じWi-Fiに繋いだiPhoneのSafariで上記URLを開く</p>
                        <p>2. 共有ボタンから「ホーム画面に追加」をタップすると全画面アプリとして起動します</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 space-y-2">
                  <div className="text-xs font-extrabold text-slate-800">デモデータ操作 / データリセット</div>
                  <button
                    type="button"
                    disabled={isSeedingDemo}
                    onClick={handleSeedOneWeekDemo}
                    className="w-full py-2.5 px-3 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-bold rounded-xl text-xs text-center cursor-pointer shadow-xs transition-all disabled:opacity-50"
                  >
                    {isSeedingDemo ? '投入中...' : '📊 1週間分のサンプルデータを投入'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsResetConfirmOpen(true)}
                    className="w-full py-2 px-3 bg-white hover:bg-slate-100 text-slate-600 font-bold rounded-xl border border-slate-200/90 transition-colors text-[11px] text-center cursor-pointer shadow-2xs"
                  >
                    🗑️ データを初期化
                  </button>
                </div>
              </div>

              <div className="pt-3 mt-3 border-t border-slate-100 space-y-2">
                <div className="bg-emerald-50/80 rounded-xl p-2 border border-emerald-200/80 text-center">
                  <p className="text-[10px] font-bold text-emerald-900 leading-relaxed">
                    🔒 記録データはお使いの端末内にのみ保存され、他のユーザーや外部に共有されることはありません
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full py-2.5 px-3 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold rounded-xl border border-rose-200/80 transition-colors text-xs text-center cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <span>🚪</span>
                  <span>ログアウト</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {isResetConfirmOpen && (
          <div className="absolute inset-0 z-40 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs pt-14 pb-6 px-4">
            <div className="w-full bg-white rounded-2xl p-4 shadow-2xl border border-slate-200/90 space-y-3.5">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="text-sm font-bold text-rose-600">🗑️ データを初期化</h3>
                <button
                  type="button"
                  onClick={() => setIsResetConfirmOpen(false)}
                  className="w-7 h-7 rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center text-xs font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                食事・運動・体重の記録データおよび設定をすべて初期状態にリセットします。よろしいですか？
              </p>
              <div className="flex gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsResetConfirmOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
                >
                  キャンセル
                </button>
                <button
                  type="button"
                  onClick={handleExecuteResetData}
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-sm"
                >
                  初期化する
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
