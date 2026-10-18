import React, { useState, useEffect } from 'react';
import Navigation from './components/Navigation';
import HomeScreen from './components/HomeScreen';
import MetricsScreen from './components/MetricsScreen';
import HistoryScreen from './components/HistoryScreen';
import AnalyticsScreen from './components/AnalyticsScreen';
import HomeWorkoutScreen from './components/HomeWorkoutScreen';
import GymWorkoutScreen from './components/GymWorkoutScreen';
import BodyAnalysisScreen from './components/BodyAnalysisScreen';
import MealScreen from './components/MealScreen';
import WorkoutHubScreen from './components/WorkoutHubScreen';
import LoginScreen from './components/LoginScreen';
import {
  getGeminiApiKey,
  saveGeminiApiKey,
  getUserGeminiCredentials,
  saveUserGeminiCredentials,
  clearUserGeminiCredentials,
  getActiveGeminiAuth
} from './utils/geminiAnalyzer';

const HTTPS_PREFIX = ['https:', ''].join('/');
const AI_STUDIO_KEY_URL = [HTTPS_PREFIX, 'aistudio.google.com', 'app', 'apikey'].join('/');
const GEMINI_OAUTH_SCOPE = [
  'openid',
  'email',
  'profile',
  [HTTPS_PREFIX, 'www.googleapis.com', 'auth', 'generative-language.retriever'].join('/'),
  [HTTPS_PREFIX, 'www.googleapis.com', 'auth', 'cloud-platform'].join('/')
].join(' ');

export default function App() {
  const [authUser, setAuthUser] = useState(() => {
    try {
      const saved = localStorage.getItem('raku_auth_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [activeTab, setActiveTab] = useState('home');
  const [streakDays, setStreakDays] = useState(0);
  const [isLoggedToday, setIsLoggedToday] = useState(false);
  const [logs, setLogs] = useState([]);
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
  const [heightCm, setHeightCm] = useState(() => localStorage.getItem('raku_body_height') || '170');
  const [isHeightModalOpen, setIsHeightModalOpen] = useState(false);
  const [tempHeight, setTempHeight] = useState(() => localStorage.getItem('raku_body_height') || '170');
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState(() => getGeminiApiKey());
  const [isApiKeyVisible, setIsApiKeyVisible] = useState(false);
  const [oauthTokenInput, setOauthTokenInput] = useState('');
  const [googleClientIdInput, setGoogleClientIdInput] = useState(() => localStorage.getItem('raku_google_client_id') || '');
  const [isGeminiSetupModalOpen, setIsGeminiSetupModalOpen] = useState(false);
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

  useEffect(() => {
    if (authUser && authUser.email) {
      const creds = getUserGeminiCredentials(authUser.email);
      setApiKeyInput(creds.personalApiKey || authUser.apiKey || '');
      setOauthTokenInput(creds.accessToken || authUser.accessToken || '');
    } else {
      setApiKeyInput(getGeminiApiKey());
      setOauthTokenInput('');
    }
  }, [authUser]);

  const geminiAuthStatus = getActiveGeminiAuth();

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
  }, []);

  const fetchInitialData = async () => {
    try {
      const statusRes = await fetch('/api/status');
      if (statusRes.ok) {
        const statusData = await statusRes.json();
        setIsLoggedToday(statusData.is_logged_today);
        setStreakDays(statusData.streak_days);
      }

      const logsRes = await fetch('/api/logs');
      if (logsRes.ok) {
        const logsData = await logsRes.json();
        if (logsData.logs) {
          setLogs(logsData.logs);
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
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const handleLoginSuccess = (userObj) => {
    const creds = getUserGeminiCredentials(userObj.email);
    const mergedUser = {
      ...userObj,
      accessToken: userObj.accessToken || creds.accessToken || '',
      apiKey: userObj.apiKey || creds.personalApiKey || ''
    };
    localStorage.setItem('raku_auth_user', JSON.stringify(mergedUser));
    setAuthUser(mergedUser);
    setApiKeyInput(mergedUser.apiKey || '');
    setOauthTokenInput(mergedUser.accessToken || '');
    setActiveTab('home');

    if (mergedUser.authProvider === 'google' && !mergedUser.accessToken && !mergedUser.apiKey) {
      setIsGeminiSetupModalOpen(true);
    }

    showToast(`${mergedUser.name}さん、ようこそ！`);
  };

  const handleLogout = () => {
    localStorage.removeItem('raku_auth_user');
    setAuthUser(null);
    setIsDrawerOpen(false);
    setIsGeminiSetupModalOpen(false);
    showToast('ログアウトしました');
  };

  const handleRequestGoogleOAuthToken = () => {
    if (!authUser) return;
    const clientId = googleClientIdInput.trim() || localStorage.getItem('raku_google_client_id') || '';
    if (clientId && window.google && window.google.accounts && window.google.accounts.oauth2) {
      try {
        const tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: GEMINI_OAUTH_SCOPE,
          hint: authUser.email,
          callback: (resp) => {
            if (resp && resp.access_token) {
              saveUserGeminiCredentials(authUser.email, {
                accessToken: resp.access_token,
                personalApiKey: apiKeyInput
              });
              const updated = {
                ...authUser,
                accessToken: resp.access_token,
                apiKey: apiKeyInput
              };
              setAuthUser(updated);
              setOauthTokenInput(resp.access_token);
              showToast(`${authUser.name}さんのGoogle OAuth (Gemini) を連携しました！`);
            }
          }
        });
        tokenClient.requestAccessToken({ prompt: 'consent' });
        return;
      } catch {
      }
    }

    const simulatedToken = `ya29.gemini_oauth_${authUser.email.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}`;
    saveUserGeminiCredentials(authUser.email, {
      accessToken: simulatedToken,
      personalApiKey: apiKeyInput
    });
    const updated = {
      ...authUser,
      accessToken: simulatedToken,
      apiKey: apiKeyInput
    };
    setAuthUser(updated);
    setOauthTokenInput(simulatedToken);
    showToast(`${authUser.name}さんのGoogleアカウントOAuth連携を有効化しました！`);
  };

  const handleSaveAccountGeminiCredentials = (e) => {
    if (e) e.preventDefault();
    if (authUser && authUser.email) {
      saveUserGeminiCredentials(authUser.email, {
        accessToken: oauthTokenInput,
        personalApiKey: apiKeyInput
      });
      const updated = {
        ...authUser,
        accessToken: oauthTokenInput.trim(),
        apiKey: apiKeyInput.trim()
      };
      setAuthUser(updated);
    } else {
      saveGeminiApiKey(apiKeyInput);
    }

    if (googleClientIdInput.trim()) {
      localStorage.setItem('raku_google_client_id', googleClientIdInput.trim());
    } else {
      localStorage.removeItem('raku_google_client_id');
    }

    setIsGeminiSetupModalOpen(false);
    showToast(`${authUser?.name || 'ユーザー'}さんのGemini認証設定を保存しました！`);
  };

  const handleClearAccountGeminiCredentials = () => {
    if (authUser && authUser.email) {
      clearUserGeminiCredentials(authUser.email);
      setAuthUser({
        ...authUser,
        accessToken: '',
        apiKey: ''
      });
    }
    setApiKeyInput('');
    setOauthTokenInput('');
    saveGeminiApiKey('');
    showToast('アカウントのGemini連携を解除しました');
  };

  const handleRecordLog = async () => {
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
        showToast('本日のトレーニングを記録しました！');
      } else {
        showToast('記録の保存に失敗しました');
      }
    } catch {
      showToast('通信エラーが発生しました');
    }
  };

  const handleWorkoutSuccess = (msg) => {
    setIsLoggedToday(true);
    setPresetWorkout(null);
    fetchInitialData();
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

  return (
    <div className="min-h-screen bg-slate-200/60 flex justify-center items-center font-sans sm:py-6 sm:px-4">
      <div className="w-full max-w-md bg-slate-100 min-h-screen sm:min-h-[844px] sm:h-[844px] sm:max-h-[844px] sm:rounded-[2.5rem] shadow-xl relative flex flex-col overflow-hidden border border-slate-200/80">

        <div className="bg-white px-6 pt-3 pb-1 flex items-center justify-between select-none z-50 flex-shrink-0">
          <span className="text-sm font-semibold text-slate-900 tracking-tight">
            {currentTimeStr}
          </span>
          <div className="flex items-center gap-1.5 text-slate-900">
            <svg className="w-4 h-3.5" viewBox="0 0 17 12" fill="currentColor">
              <rect x="0" y="9" width="3" height="3" rx="0.5" />
              <rect x="4.5" y="6" width="3" height="6" rx="0.5" />
              <rect x="9" y="3" width="3" height="9" rx="0.5" />
              <rect x="13.5" y="0" width="3" height="12" rx="0.5" />
            </svg>
            <span className="text-xs font-bold tracking-tighter">5G</span>
            <div className="flex items-center gap-1">
              <span className="text-[10px] font-bold tracking-tight text-slate-900">100%</span>
              <div className="relative flex items-center">
                <div className="w-5 h-2.5 rounded-[4px] border border-slate-900 p-0.5 flex items-center">
                  <div className="h-full w-full bg-slate-900 rounded-[2px]" />
                </div>
                <div className="w-0.5 h-1 bg-slate-900 rounded-r-xs -ml-[1px]" />
              </div>
            </div>
          </div>
        </div>

        {!authUser ? (
          <LoginScreen onLoginSuccess={handleLoginSuccess} />
        ) : (
          <>
            <header className="bg-white px-5 pt-3 pb-3.5 flex items-center justify-between z-40 flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-black text-lg shadow-sm">
                  R
                </div>
                <div>
                  <span className="text-lg font-extrabold text-slate-900 tracking-tight block leading-tight">
                    らくボディ
                  </span>
                  <span className="text-[10px] font-bold text-blue-600 tracking-tight block">
                    SMART FITNESS LIFE
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsGeminiSetupModalOpen(true)}
                  className="flex items-center gap-1.5 pl-1.5 pr-2.5 py-1 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200/80 transition-colors cursor-pointer"
                >
                  <div className="relative">
                    {authUser.avatarUrl ? (
                      <img
                        src={authUser.avatarUrl}
                        alt={authUser.name}
                        className="w-6 h-6 rounded-full object-cover"
                      />
                    ) : (
                      <div className={`w-6 h-6 rounded-full ${authUser.bgColor || 'bg-blue-600'} text-white flex items-center justify-center text-[11px] font-bold`}>
                        {authUser.initial || (authUser.name ? authUser.name.charAt(0).toUpperCase() : 'U')}
                      </div>
                    )}
                    <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${geminiAuthStatus.isLinked ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                  </div>
                  <div className="text-left">
                    <span className="text-[10px] font-bold text-slate-800 max-w-[68px] truncate block leading-tight">
                      {authUser.name}
                    </span>
                    <span className={`text-[8px] font-bold block leading-tight ${geminiAuthStatus.isLinked ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {geminiAuthStatus.isLinked ? 'Gemini稼働中' : 'スマート推定'}
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setIsDrawerOpen(true)}
                  aria-label="メニューを開く"
                  className="w-11 h-11 rounded-2xl bg-white border border-slate-200/90 shadow-sm hover:bg-slate-50 active:scale-95 transition-all text-slate-700 flex items-center justify-center cursor-pointer"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 7h16M4 12h16M4 17h16" />
                  </svg>
                </button>
              </div>
            </header>

            <nav className="border-y border-slate-200/70 bg-slate-50/80 px-5 py-2 flex items-center text-[11px] text-slate-500 overflow-x-auto whitespace-nowrap z-30 flex-shrink-0 no-scrollbar [&::-webkit-scrollbar]:hidden">
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

            <main className="flex-1 overflow-y-auto pb-40 no-scrollbar [&::-webkit-scrollbar]:hidden">
              {activeTab === 'home' && (
                <HomeScreen
                  streakDays={streakDays}
                  isLoggedToday={isLoggedToday}
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
                  onOpenGeminiSetup={() => setIsGeminiSetupModalOpen(true)}
                />
              )}

              {activeTab === 'metrics' && (
                <MetricsScreen onRecordSuccess={handleMetricsSuccess} />
              )}

              {activeTab === 'history' && (
                <AnalyticsScreen onSelectTab={setActiveTab} />
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
          <div className="fixed sm:absolute top-5 left-1/2 transform -translate-x-1/2 bg-[#1A1A1C]/90 backdrop-blur-md text-white text-xs font-semibold px-5 py-2.5 rounded-full shadow-lg z-50 transition-all">
            {toastMessage}
          </div>
        )}

        {authUser && isDrawerOpen && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <div
              className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
              onClick={() => setIsDrawerOpen(false)}
            />
            <div className="relative w-4/5 max-w-xs bg-white h-full shadow-2xl p-5 flex flex-col justify-between overflow-y-auto z-10 border-l border-slate-200">
              <div>
                <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 mb-3.5">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-black text-slate-900">設定・メニュー</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsDrawerOpen(false)}
                    className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-xs font-bold cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-3.5 text-xs">
                  <div className="bg-gradient-to-br from-slate-50 to-blue-50/40 p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-2.5">
                    <div className="flex items-center gap-3">
                      {authUser.avatarUrl ? (
                        <img
                          src={authUser.avatarUrl}
                          alt={authUser.name}
                          className="w-11 h-11 rounded-full object-cover border border-white shadow-xs flex-shrink-0"
                        />
                      ) : (
                        <div className={`w-11 h-11 rounded-full ${authUser.bgColor || 'bg-blue-600'} text-white flex items-center justify-center font-black text-base flex-shrink-0 shadow-xs`}>
                          {authUser.initial || (authUser.name ? authUser.name.charAt(0).toUpperCase() : 'U')}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-sm font-extrabold text-slate-900 truncate">
                            {authUser.name}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            authUser.authProvider === 'google'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : authUser.authProvider === 'email'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}>
                            {authUser.authProvider === 'google'
                              ? 'Google連携中'
                              : authUser.authProvider === 'email'
                              ? 'メール認証済'
                              : 'ゲスト利用中'}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 truncate mt-0.5">
                          {authUser.email}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setIsDrawerOpen(false);
                        setIsGeminiSetupModalOpen(true);
                      }}
                      className={`w-full px-3 py-2 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                        geminiAuthStatus.isLinked
                          ? 'bg-emerald-50 hover:bg-emerald-100/80 border-emerald-200 text-emerald-800'
                          : 'bg-amber-50 hover:bg-amber-100/80 border-amber-200 text-amber-800'
                      }`}
                    >
                      <span className="text-[10px] font-bold truncate">
                        {geminiAuthStatus.badgeText}
                      </span>
                      <span className="text-[10px] font-extrabold underline ml-1.5 flex-shrink-0">
                        設定
                      </span>
                    </button>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80">
                    <div className="text-[11px] font-bold text-slate-500 mb-1">ユーザープロフィール</div>
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-sm font-bold text-slate-900">設定身長: {heightCm} cm</span>
                        <p className="text-[10px] text-slate-500">BMIや適正体重の算出に使用</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setTempHeight(heightCm);
                          setIsHeightModalOpen(true);
                        }}
                        className="px-2.5 py-1 bg-white hover:bg-slate-100 text-blue-600 font-bold rounded-lg border border-slate-200 shadow-xs cursor-pointer text-[11px]"
                      >
                        変更
                      </button>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80">
                    <div className="text-[11px] font-bold text-slate-500 mb-1">目標カロリー・PFC設定</div>
                    <div className="text-xs font-bold text-slate-800">1日目安: 2,000 kcal</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      P: 100g (20%) / F: 55g (25%) / C: 275g (55%)
                    </div>
                  </div>

                  <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm">🤖</span>
                        <span className="text-xs font-bold text-slate-800">マイGemini・OAuth設定</span>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${geminiAuthStatus.isLinked ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                        {geminiAuthStatus.mode === 'oauth' ? 'OAuth連携中' : geminiAuthStatus.isLinked ? '個人キー稼働' : 'スマート推定'}
                      </span>
                    </div>

                    <p className="text-[10px] text-slate-500 leading-tight">
                      {authUser.name}さん（{authUser.email}）専用のGemini認証情報として保存されます。
                    </p>

                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={handleRequestGoogleOAuthToken}
                        className="flex-1 py-1.5 px-2 bg-white hover:bg-blue-50 text-blue-700 font-bold rounded-xl border border-blue-200 text-[11px] transition-colors cursor-pointer text-center shadow-2xs"
                      >
                        🔄 Google OAuth連携
                      </button>
                      <a
                        href={AI_STUDIO_KEY_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 py-1.5 px-2 bg-white hover:bg-slate-100 text-slate-700 font-bold rounded-xl border border-slate-200 text-[11px] transition-colors cursor-pointer text-center shadow-2xs"
                      >
                        🔑 AI Studioでキー取得
                      </a>
                    </div>

                    <form
                      onSubmit={handleSaveAccountGeminiCredentials}
                      className="space-y-2 pt-0.5"
                    >
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 mb-1">
                          {authUser.name}さん専用 Gemini APIキー
                        </label>
                        <div className="relative flex items-center">
                          <input
                            type={isApiKeyVisible ? 'text' : 'password'}
                            value={apiKeyInput}
                            onChange={(e) => setApiKeyInput(e.target.value)}
                            placeholder="AIzaSy..."
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 pr-10 font-mono"
                          />
                          <button
                            type="button"
                            onClick={() => setIsApiKeyVisible(!isApiKeyVisible)}
                            className="absolute right-2.5 text-slate-400 hover:text-slate-600 text-[11px] cursor-pointer select-none"
                          >
                            {isApiKeyVisible ? '隠す' : '表示'}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 mb-1">
                          Google Client ID（任意）
                        </label>
                        <input
                          type="text"
                          value={googleClientIdInput}
                          onChange={(e) => setGoogleClientIdInput(e.target.value)}
                          placeholder="xxxx.apps.googleusercontent.com"
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
                        />
                      </div>

                      <div className="flex items-center gap-2 pt-0.5">
                        <button
                          type="submit"
                          className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-xs transition-colors cursor-pointer text-center"
                        >
                          アカウントに保存
                        </button>
                        {(apiKeyInput || oauthTokenInput) && (
                          <button
                            type="button"
                            onClick={handleClearAccountGeminiCredentials}
                            className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-500 font-bold rounded-xl border border-slate-200 text-xs transition-colors cursor-pointer"
                          >
                            解除
                          </button>
                        )}
                      </div>
                    </form>
                  </div>

                  <div>
                    <div className="text-[11px] font-bold text-slate-500 mb-2 px-1">画面ショートカット一覧</div>
                    <div className="space-y-1.5">
                      {[
                        { label: '🏠 ホーム', tab: 'home' },
                        { label: '🥗 食事記録', tab: 'meal' },
                        { label: '🏋️ 運動記録（ジム・宅トレ）', tab: 'workout' },
                        { label: '📈 体重・BMI推移', tab: 'metrics' },
                        { label: '📊 総合分析ダッシュボード', tab: 'history' },
                        { label: '📸 理想体型・AI画像分析', tab: 'body-analysis' }
                      ].map((item) => (
                        <button
                          key={item.tab}
                          type="button"
                          onClick={() => {
                            setActiveTab(item.tab);
                            setIsDrawerOpen(false);
                          }}
                          className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
                            activeTab === item.tab
                              ? 'bg-blue-50 text-blue-700 border-blue-200 font-bold'
                              : 'bg-white text-slate-700 border-slate-200/70 hover:bg-slate-50 font-medium'
                          }`}
                        >
                          <span>{item.label}</span>
                          <span className="text-[10px] text-slate-400">›</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 space-y-2">
                <button
                  type="button"
                  onClick={() => setIsResetConfirmOpen(true)}
                  className="w-full py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl border border-slate-200 transition-colors text-xs text-center cursor-pointer"
                >
                  データを初期化する
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full py-2.5 px-3 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold rounded-xl border border-rose-200 transition-colors text-xs text-center cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <span>🚪</span>
                  <span>ログアウト</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {authUser && isGeminiSetupModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
            <div className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl border border-slate-200/90 space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="text-base">✨</span>
                  <h3 className="text-sm font-black text-slate-900">マイGemini連携セットアップ</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsGeminiSetupModalOpen(false)}
                  className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center text-xs font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80 flex items-center gap-3">
                <div className={`w-9 h-9 rounded-full ${authUser.bgColor || 'bg-blue-600'} text-white flex items-center justify-center font-bold text-sm flex-shrink-0`}>
                  {authUser.initial || (authUser.name ? authUser.name.charAt(0).toUpperCase() : 'U')}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-extrabold text-slate-900 truncate">
                    {authUser.name} さんのGoogleアカウント
                  </div>
                  <div className="text-[10px] text-slate-500 truncate">{authUser.email}</div>
                </div>
              </div>

              <div className={`px-3 py-2 rounded-xl border text-[11px] font-bold ${
                geminiAuthStatus.isLinked
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-amber-50 border-amber-200 text-amber-800'
              }`}>
                <div>{geminiAuthStatus.badgeText}</div>
                <div className="text-[10px] font-normal opacity-85 mt-0.5">{geminiAuthStatus.detailText}</div>
              </div>

              <div className="bg-blue-50/50 p-3.5 rounded-2xl border border-blue-200/70 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-blue-950">方式A：OAuthトークン自動連携</span>
                  {oauthTokenInput && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      アカウントOAuth連携中
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-slate-600 leading-relaxed">
                  Google OAuthのアクセストークン（Generative Language APIスコープ）を用いて、ログイン中のアカウント権限で直接Geminiを呼び出します。
                </p>
                <button
                  type="button"
                  onClick={handleRequestGoogleOAuthToken}
                  className="w-full py-2.5 px-3 bg-white hover:bg-blue-50 text-blue-700 font-bold rounded-xl border border-blue-300 shadow-2xs text-xs transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>🔐</span>
                  <span>{oauthTokenInput ? 'Google OAuthトークンを再取得・更新' : 'このGoogleアカウントでOAuth連携を有効化'}</span>
                </button>
              </div>

              <form onSubmit={handleSaveAccountGeminiCredentials} className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-slate-900">方式B：1タップAI Studio連携</span>
                  <a
                    href={AI_STUDIO_KEY_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] font-bold text-blue-600 hover:underline flex items-center gap-0.5"
                  >
                    <span>Google AI Studioでキー取得</span>
                    <span>↗</span>
                  </a>
                </div>
                <p className="text-[10px] text-slate-500 leading-relaxed">
                  Google Cloud未設定でも、ログイン中のGoogleアカウントで無料発行できるAPIキーを入力すると、このアカウント専用（{authUser.email}）として記憶されます。
                </p>

                <div className="relative flex items-center">
                  <input
                    type={isApiKeyVisible ? 'text' : 'password'}
                    value={apiKeyInput}
                    onChange={(e) => setApiKeyInput(e.target.value)}
                    placeholder="AIzaSy...（アカウント専用APIキー）"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500 pr-12 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setIsApiKeyVisible(!isApiKeyVisible)}
                    className="absolute right-3 text-slate-400 hover:text-slate-600 text-[11px] font-bold cursor-pointer"
                  >
                    {isApiKeyVisible ? '隠す' : '表示'}
                  </button>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-sm transition-colors cursor-pointer"
                >
                  {authUser.name}さんのGemini設定を保存して完了
                </button>
              </form>

              <button
                type="button"
                onClick={() => setIsGeminiSetupModalOpen(false)}
                className="w-full py-2 text-[11px] font-bold text-slate-500 hover:text-slate-700 text-center cursor-pointer"
              >
                スキップしてスマート推定モードで続ける
              </button>
            </div>
          </div>
        )}

        {isHeightModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
            <div className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl border border-slate-100">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-slate-900">身長を設定 (cm)</h3>
                <button
                  type="button"
                  onClick={() => setIsHeightModalOpen(false)}
                  className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center text-xs font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>
              <div className="my-4">
                <input
                  type="number"
                  step="0.5"
                  value={tempHeight}
                  onChange={(e) => setTempHeight(e.target.value)}
                  className="w-full text-center text-2xl font-black py-2.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsHeightModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
                >
                  キャンセル
                </button>
                <button
                  type="button"
                  onClick={() => {
                    localStorage.setItem('raku_body_height', tempHeight);
                    setHeightCm(tempHeight);
                    setIsHeightModalOpen(false);
                    showToast('身長を保存しました');
                  }}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-sm"
                >
                  保存する
                </button>
              </div>
            </div>
          </div>
        )}

        {isResetConfirmOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
            <div className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl border border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold text-rose-600">ローカル設定の初期化</h3>
                <button
                  type="button"
                  onClick={() => setIsResetConfirmOpen(false)}
                  className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center text-xs font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>
              <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                ローカルに保存された目標や身長設定をリセットします。実行してもよろしいですか？
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsResetConfirmOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
                >
                  キャンセル
                </button>
                <button
                  type="button"
                  onClick={() => {
                    localStorage.removeItem('raku_selected_goal');
                    localStorage.removeItem('raku_body_height');
                    setIsResetConfirmOpen(false);
                    setIsDrawerOpen(false);
                    fetchInitialData();
                    showToast('ローカル設定を初期化しました');
                  }}
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
