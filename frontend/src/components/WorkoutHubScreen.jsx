import React, { useState } from 'react';
import HomeWorkoutScreen from './HomeWorkoutScreen';
import GymWorkoutScreen from './GymWorkoutScreen';

export default function WorkoutHubScreen({ initialType = 'gym', goal, presetWorkout, onBack, onRecordSuccess }) {
  const [workoutType, setWorkoutType] = useState(initialType);

  return (
    <div className="flex flex-col min-h-full">
      <div className="px-5 pt-3 pb-2 bg-slate-100">
        <div className="flex bg-slate-200/70 p-1.5 rounded-full border border-slate-300/60 max-w-xs mx-auto shadow-inner">
          <button
            type="button"
            onClick={() => setWorkoutType('gym')}
            className={`flex-1 py-2 text-xs font-bold rounded-full transition-all duration-200 cursor-pointer ${
              workoutType === 'gym'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/25'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ジム・マシン記録
          </button>
          <button
            type="button"
            onClick={() => setWorkoutType('home')}
            className={`flex-1 py-2 text-xs font-bold rounded-full transition-all duration-200 cursor-pointer ${
              workoutType === 'home'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/25'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            宅トレ・自重運動
          </button>
        </div>
      </div>

      <div className="flex-1">
        {workoutType === 'gym' ? (
          <GymWorkoutScreen
            goal={goal}
            presetWorkout={presetWorkout}
            onBack={onBack}
            onRecordSuccess={onRecordSuccess}
          />
        ) : (
          <HomeWorkoutScreen
            goal={goal}
            presetWorkout={presetWorkout}
            onBack={onBack}
            onRecordSuccess={onRecordSuccess}
          />
        )}
      </div>
    </div>
  );
}
