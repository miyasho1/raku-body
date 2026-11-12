import { getUserStorageData, setUserStorageData } from './authService';

export const GOAL_OPTIONS = [
  { key: 'fine_muscle', label: '細マッチョ', desc: '引き締めて筋肉をつける' },
  { key: 'diet', label: 'ダイエット', desc: '体脂肪を減らす' },
  { key: 'bulk_up', label: '筋肉を大きく', desc: '体を大きくする' },
  { key: 'health', label: '健康・姿勢', desc: '無理なく体を整える' }
];

export const goalLabel = (key) => (GOAL_OPTIONS.find((g) => g.key === key) || GOAL_OPTIONS[0]).label;

export function getSavedGoal() {
  const saved = getUserStorageData('selected_goal', null);
  return GOAL_OPTIONS.some((g) => g.key === saved) ? saved : null;
}

export function saveGoal(key) {
  if (!GOAL_OPTIONS.some((g) => g.key === key)) return;
  setUserStorageData('selected_goal', key);
  try {
    localStorage.setItem('raku_selected_goal', key);
  } catch {
  }
}
