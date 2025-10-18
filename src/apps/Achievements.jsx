import React from 'react';
import useGameStore from '/src/store/gameStore.js';
import { ACHIEVEMENT_DEFINITIONS } from '/src/data.js';
import { Trophy } from 'lucide-react';
import { shallow } from 'zustand/shallow';

const Achievements = () => {
    const unlocked = useGameStore(s => s.state.achievements.unlocked, shallow);

    const unlockedAchievements = Object.values(ACHIEVEMENT_DEFINITIONS).filter(a => unlocked.includes(a.id));
    const inProgressAchievements = Object.values(ACHIEVEMENT_DEFINITIONS).filter(a => !unlocked.includes(a.id));

    return (
        <div className="p-4 bg-gray-800 text-gray-200 h-full flex flex-col space-y-4">
            <h2 className="text-xl font-bold border-b border-gray-600 pb-2 flex items-center gap-2">
                <Trophy className="text-yellow-400" />
                Achievements
            </h2>

            <div className="bg-gray-900 p-3 rounded-md flex-grow overflow-y-auto">
                <h3 className="font-bold text-lg mb-3 text-green-400">Unlocked ({unlockedAchievements.length})</h3>
                <div className="space-y-3">
                    {unlockedAchievements.length > 0 ? unlockedAchievements.map(ach => (
                        <div key={ach.id} className="p-3 bg-gray-700/50 rounded-md border-l-4 border-green-500">
                            <p className="font-bold text-white">{ach.title}</p>
                            <p className="text-sm text-gray-400">{ach.description}</p>
                        </div>
                    )) : <p className="text-gray-500">No achievements unlocked yet.</p>}
                </div>
            </div>

            <div className="bg-gray-900 p-3 rounded-md flex-grow overflow-y-auto">
                <h3 className="font-bold text-lg mb-3 text-gray-400">In Progress ({inProgressAchievements.length})</h3>
                <div className="space-y-3">
                    {inProgressAchievements.map(ach => (
                        <div key={ach.id} className="p-3 bg-gray-800/50 rounded-md border-l-4 border-gray-600">
                            <p className="font-bold text-gray-300">{ach.title}</p>
                            <p className="text-sm text-gray-500">{ach.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Achievements;
