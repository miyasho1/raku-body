import { getUserStorageData } from './authService';

export const STEP_RULE_TEXT = '同じ名前の種目を3回記録するとステップ2、8回記録するとステップ3に上がり、回数・時間・重さ・セット数のどれかが少しずつ増えます（アプリ独自の目安です。ウォーミングアップとクールダウンは増えません。きついときは無理せず減らしてください）。';

export function loadWorkoutCounts() {
  const list = getUserStorageData('workouts', []);
  const counts = {};
  (Array.isArray(list) ? list : []).forEach((w) => {
    const name = (w && w.menu_name) || '';
    if (name) counts[name] = (counts[name] || 0) + 1;
  });
  return counts;
}

export function countFor(itemName, counts) {
  let total = 0;
  Object.entries(counts).forEach(([name, c]) => {
    if (name === itemName) total += c;
  });
  return total;
}

export function progressItem(item, counts) {
  const count = countFor(item.name, counts);
  const step = count >= 8 ? 3 : count >= 3 ? 2 : 1;
  const next = { ...item, count, step };
  if (step === 1 || item.fixed) return next;
  const up = step === 2 ? 1 : 2;
  if (item.duration > 0) {
    next.duration = item.duration + (step === 2 ? 2 : 5);
  } else if (item.unit === '秒') {
    next.reps = item.reps + 10 * up;
  } else if (item.weight > 0) {
    next.weight = item.weight + 2.5 * up;
  } else {
    next.reps = item.reps + 2 * up;
  }
  if (step === 3 && !(item.duration > 0) && item.sets < 4) next.sets = item.sets + 1;
  return next;
}

export function stepLabel(step) {
  return step === 3 ? 'ステップ3' : step === 2 ? 'ステップ2' : 'ステップ1';
}
