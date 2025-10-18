import React, { useState } from 'react';
import useGameStore from '/src/store/gameStore.js';
import { shallow } from 'zustand/shallow';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip.jsx';
import WindowPreview from './WindowPreview.jsx';

const Taskbar = ({ appsConfig }) => {
    // --- THIS IS THE FIX ---
    // All state selections are now safe, using optional chaining and default values
    // to prevent crashes if the state is not ready on the initial render.
    const time = useGameStore(s => s.state?.time);
    const cash = useGameStore(s => s.state.finances?.cash ?? 0);
    const isPaused = useGameStore(s => s.state?.isPaused ?? true);
    const gameSpeed = useGameStore(s => s.state?.gameSpeed ?? 1);
    const openWindows = useGameStore(s => s.state.ui?.windows ?? {});
    const activeWindowId = useGameStore(s => s.state.ui?.activeWindowId);
    const taskbarPosition = useGameStore(s => s.state.ui?.desktopSettings?.taskbarPosition);

    const { togglePause, setGameSpeed, focusWindow } = useGameStore.getState();

    const [hoveredId, setHoveredId] = useState(null);
    
    const speeds = [
        { label: '1x', value: 1 },
        { label: '1m', value: 60 },
        { label: '5m', value: 300 },
        { label: '1h', value: 3600 }
    ];

    const handleTaskbarClick = (id) => {
        focusWindow(id);
    };

    const taskbarClasses = `absolute left-0 right-0 h-12 bg-gray-900/80 backdrop-blur-sm text-white flex items-center justify-between px-4 z-[1000] ${
        taskbarPosition === 'top' ? 'top-0 border-b border-gray-700' : 'bottom-0 border-t border-gray-700'
    }`;
    
    return (
        <div className={taskbarClasses}>
          <div className="flex items-center space-x-2 h-full">
            {Object.values(openWindows).filter(w => w.isOpen).map(win => {
              if (!appsConfig[win.appId] || !appsConfig[win.appId].icon) return null;
              const IconComponent = appsConfig[win.appId].icon;
              return (
                <TooltipProvider key={win.id} delayDuration={300}>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div onMouseEnter={() => setHoveredId(win.id)} onMouseLeave={() => setHoveredId(null)}>
                                <button onClick={() => handleTaskbarClick(win.id)} className={`p-1 rounded-md hover:bg-gray-700 ${activeWindowId === win.id && !win.isMinimized ? 'bg-accent' : ''}`}>
                                  <IconComponent />
                                </button>
                                {hoveredId === win.id && !win.isMinimized && (
                                    <div className={`absolute ${taskbarPosition === 'top' ? 'top-full mt-2' : 'bottom-full mb-2'} left-1/2 -translate-x-1/2`}>
                                        <WindowPreview window={win} />
                                    </div>
                                )}
                             </div>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>{win.title}</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
              );
            })}
          </div>
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-4">
            <div className="font-mono text-sm text-center">
              {/* Added optional chaining to prevent crash if time is not yet loaded */}
              <div>{time?.toLocaleDateString()}</div>
              <div>{time?.toLocaleTimeString()}</div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={togglePause} className="font-bold text-lg px-2">{isPaused ? '▶' : '❚❚'}</button>
              <div className="flex gap-1">
                {speeds.map(s => (
                  <button key={s.label} onClick={() => setGameSpeed(s.value)} className={`px-2 py-0.5 text-xs rounded ${gameSpeed === s.value ? 'bg-accent' : 'bg-gray-700'}`}>{s.label}</button>
                ))}
              </div>
            </div>
          </div>
          <div className="font-mono text-lg text-green-400">${cash.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}</div>
        </div>
      );
};

export default Taskbar;

