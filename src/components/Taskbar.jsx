import React from 'react';
import useGameStore from '/src/store/gameStore.js';

const Taskbar = ({ openWindows, onTaskbarClick, activeWindowId, appsConfig }) => {
    // Correctly select data from the nested state object
    const time = useGameStore(state => state.state.time);
    const cash = useGameStore(state => state.state.finances.cash);
    const isPaused = useGameStore(state => state.state.isPaused);
    const gameSpeed = useGameStore(state => state.state.gameSpeed);
    
    // Actions are still selected from the top level
    const togglePause = useGameStore(state => state.togglePause);
    const setGameSpeed = useGameStore(state => state.setGameSpeed);
    
    const speeds = [1, 5, 15, 60];
    
    return (
        <div className="absolute bottom-0 left-0 right-0 h-12 bg-gray-900/80 backdrop-blur-sm text-white flex items-center justify-between px-4 border-t border-gray-700 z-[1000]">
          <div className="flex items-center space-x-2">
            {Object.values(openWindows).filter(w => w.isOpen).map(win => {
              if (!appsConfig[win.appId] || !appsConfig[win.appId].icon) return null;
              const IconComponent = appsConfig[win.appId].icon;
              return (
                <button key={win.id} onClick={() => onTaskbarClick(win.id)} className={`p-1 rounded-md hover:bg-gray-700 ${activeWindowId === win.id && !win.isMinimized ? 'bg-blue-700' : ''}`}>
                  <IconComponent />
                </button>
              );
            })}
          </div>
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-4">
            <div className="font-mono text-sm text-center">
              <div>{time.toLocaleDateString()}</div>
              <div>{time.toLocaleTimeString()}</div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={togglePause} className="font-bold text-lg px-2">{isPaused ? '▶' : '❚❚'}</button>
              <div className="flex gap-1">
                {speeds.map(s => (
                  <button key={s} onClick={() => setGameSpeed(s)} className={`px-2 py-0.5 text-xs rounded ${gameSpeed === s ? 'bg-blue-600' : 'bg-gray-700'}`}>{s}x</button>
                ))}
              </div>
            </div>
          </div>
          <div className="font-mono text-lg text-green-400">${cash.toLocaleString()}</div>
        </div>
      );
};

export default Taskbar;

