import React from 'react';
import useGameStore from '../store/gameStore';
import { formatCurrency, formatDate } from '../lib/utils';
import { APPS_CONFIG } from '../data';
import WindowPreview from './WindowPreview';
import { Clock, DollarSign } from 'lucide-react';


const Taskbar = () => {
  const { openWindows, focusedWindow, setFocusedWindow, cash, time } = useGameStore(
    (state) => ({
      openWindows: state.openWindows,
      focusedWindow: state.focusedWindow,
      setFocusedWindow: state.setFocusedWindow,
      cash: state.cash,
      time: state.time,
    })
  );

  return (
    <div className="absolute bottom-0 left-0 right-0 h-10 bg-gray-900 bg-opacity-80 backdrop-blur-sm flex items-center justify-between px-2 border-t border-gray-700">
      {/* Start Button / Menu */}
      <div className="px-2 py-1 rounded hover:bg-gray-700 cursor-pointer">
        <span className="font-bold text-sm">Start</span>
      </div>

      {/* Open Windows */}
      <div className="flex-grow flex items-center px-2 space-x-1">
        {openWindows.map((appId) => {
          const app = APPS_CONFIG[appId];
          const isFocused = focusedWindow === appId;
          return (
            <WindowPreview key={appId} appId={appId}>
              <button
                onClick={() => setFocusedWindow(appId)}
                className={`h-8 px-3 text-sm flex items-center rounded border-b-2 ${
                  isFocused
                    ? 'bg-gray-600 border-blue-400'
                    : 'bg-gray-700 hover:bg-gray-600 border-transparent'
                }`}
              >
                {/* Icon would go here */}
                <span>{app.name}</span>
              </button>
            </WindowPreview>
          );
        })}
      </div>

      {/* System Tray */}
      <div className="flex items-center space-x-4 text-sm px-2">
         <div className="flex items-center">
           <DollarSign size={16} className="mr-1 text-green-400" />
           <span>{formatCurrency(cash)}</span>
        </div>
        <div className="flex items-center">
            <Clock size={16} className="mr-1" />
           <span>{formatDate(time)}</span>
        </div>
      </div>
    </div>
  );
};

export default Taskbar;
