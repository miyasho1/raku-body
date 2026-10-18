import React, { useState } from 'react';
import GymWorkoutScreen from './GymWorkoutScreen';
import HomeWorkoutScreen from './HomeWorkoutScreen';

export default function WorkoutHubScreen({
  initialType = 'gym',
  goal,
  presetWorkout,
  onBack,
  onRecordSuccess
}) {
  const [workoutMode, setWorkoutMode] = useState(
    presetWorkout?.category === 'home' ? 'home' : initialType
  );

  return (
    <div className="flex flex-col space-y-3.5 pb-2">
      <div className="bg-white rounded-2xl p-2 shadow-xs border border-slate-200/80 grid grid-cols-2 gap-1.5">
        <button
          type="button"
          onClick={() => setWorkoutMode('gym')}
          className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            workoutMode === 'gym'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-slate-50 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <span>🏋️</span>
          <span>ジム・マシン</span>
        </button>

        <button
          type="button"
          onClick={() => setWorkoutMode('home')}
          className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            workoutMode === 'home'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-slate-50 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <span>🏠</span>
          <span>宅トレ・自重</span>
        </button>
      </div>

      {workoutMode === 'gym' ? (
        <GymWorkoutScreen
          goal={goal}
          presetWorkout={presetWorkout?.category === 'gym' ? presetWorkout : null}
          onBack={onBack}
          onRecordSuccess={onRecordSuccess}
          embedded
        />
      ) : (
        <HomeWorkoutScreen
          goal={goal}
          presetWorkout={presetWorkout?.category === 'home' ? presetWorkout : null}
          onBack={onBack}
          onRecordSuccess={onRecordSuccess}
          embedded
        />
      )}
    </div>
  );
}
