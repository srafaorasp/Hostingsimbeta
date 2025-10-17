import React from 'react';
import useGameStore from '/src/store/gameStore.js';

const Taskbar = ({ appsConfig }) => {
    // --- THE FIX: Select state slices individually to prevent unnecessary re-renders ---
    const time = useGameStore((s) => s.state.time);
    const cash = useGameStore((s) => s.state.finances.cash);
    const isPaused = useGameStore((s) => s.state.isPaused);
    const gameSpeed = useGameStore((s) => s.state.gameSpeed);
    const openWindows = useGameStore((s) => s.state.ui.windows);
    const activeWindowId = useGameStore((s) => s.state.ui.activeWindowId);
    
    // Actions are static and can be retrieved once without causing re-renders.
    const { togglePause, setGameSpeed, focusWindow } = useGameStore.getState();
    
    const speeds = [
        { label: '1x', value: 1 },
        { label: '1m', value: 60 },
        { label: '5m', value: 300 },
        { label: '1h', value: 3600 }
    ];

    const handleTaskbarClick = (id) => {
        // The logic here is simplified, but the key is to call the stable focusWindow function
        focusWindow(id);
    };
    
    return (
        <div className="absolute bottom-0 left-0 right-0 h-12 bg-gray-900/80 backdrop-blur-sm text-white flex items-center justify-between px-4 border-t border-gray-700 z-[1000]">
          <div className="flex items-center space-x-2">
            {Object.values(openWindows).filter(w => w.isOpen).map(win => {
              if (!appsConfig[win.appId] || !appsConfig[win.appId].icon) return null;
              const IconComponent = appsConfig[win.appId].icon;
              return (
                <button key={win.id} onClick={() => handleTaskbarClick(win.id)} className={`p-1 rounded-md hover:bg-gray-700 ${activeWindowId === win.id && !win.isMinimized ? 'bg-blue-700' : ''}`}>
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
                  <button key={s.label} onClick={() => setGameSpeed(s.value)} className={`px-2 py-0.5 text-xs rounded ${gameSpeed === s.value ? 'bg-blue-600' : 'bg-gray-700'}`}>{s.label}</button>
                ))}
              </div>
            </div>
          </div>
          <div className="font-mono text-lg text-green-400">${cash.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}</div>
        </div>
      );
};

export default Taskbar;


