import React from 'react';
import { useGameStore } from '../store/gameStore';
import { formatGameTime, formatDuration } from '../lib/utils';

const TaskRunner = () => {
  const { activeTasks, gameTime } = useGameStore();

  const calculateProgress = (task) => {
    const totalDuration = task.completionTime.getTime() - task.startTime.getTime();
    if (totalDuration <= 0) return 100;
    const elapsed = gameTime.getTime() - task.startTime.getTime();
    return Math.min(100, (elapsed / totalDuration) * 100);
  };

  if (activeTasks.length === 0) {
    return (
      <div className="p-4 text-center text-gray-400">
        <p>No active tasks.</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {activeTasks.map((task) => {
        const progress = calculateProgress(task);
        const remainingTime = Math.max(0, task.completionTime.getTime() - gameTime.getTime());

        return (
          <div key={task.id} className="bg-gray-800 p-3 rounded-lg border border-gray-700">
            <div className="flex justify-between items-center mb-2">
              <span className="font-semibold text-white">{task.name}</span>
              <span className="text-sm text-gray-400">
                ETA: {formatDuration(remainingTime)}
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-4 border border-gray-600">
              <div
                className="bg-blue-600 h-full rounded-full transition-all duration-150"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
             <div className="text-right text-xs text-gray-300 mt-1">
                {Math.floor(progress)}%
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default TaskRunner;

