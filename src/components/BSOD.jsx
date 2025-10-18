import React from 'react';
import useGameStore from '/src/store/gameStore.js';

const BSOD = () => {
    const { addEventLog } = useGameStore.getState();

    const handleReboot = () => {
        addEventLog('Player rebooted the system from a crash.', 'PLAYER');
        // This simulates a reboot by reloading the last known good state,
        // which is more immersive than a full page refresh.
        const saves = Object.keys(localStorage).filter(key => key.startsWith('datacenter_save_'));
        if (saves.length > 0) {
            // For simplicity, load the first available save. A more complex system
            // could find the most recent one.
            const mostRecentSave = saves[0].replace('datacenter_save_', '');
            useGameStore.getState().loadGame(mostRecentSave);
        } else {
            // If no saves, start a new game.
            useGameStore.getState().newGame();
        }
    };

    return (
        <div className="absolute inset-0 bg-blue-800 text-white font-mono flex flex-col items-center justify-center p-8 z-[9999]">
            <div className="text-center">
                <p className="text-8xl mb-8">:(</p>
                <p className="text-xl">Your PC ran into a problem and needs to restart. We're just collecting some error info, and then we'll restart for you.</p>
            </div>
            <div className="mt-12 text-center">
                <p className="text-lg">For more information about this issue, you can review the debug log:</p>
                <p className="text-sm font-semibold mt-2">`debug-dump-[timestamp].json`</p>
                <p className="text-xs text-blue-300 mt-1">(This file has been automatically downloaded to your system)</p>
            </div>
             <button
                onClick={handleReboot}
                className="mt-12 bg-white text-blue-800 font-bold py-2 px-8 rounded-md hover:bg-gray-200 transition-colors"
            >
                Reboot System
            </button>
        </div>
    );
};

export default BSOD;

