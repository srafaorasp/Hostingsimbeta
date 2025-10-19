import React, { useState, useEffect } from 'react';
import useGameStore from '../store/gameStore';
import Icons from './Icons';
import StartMenu from './StartMenu'; // Assuming StartMenu is in the same directory

const Taskbar = () => {
    const { windows, toggleWindow, bringToFront, appsConfig } = useGameStore();
    const [isStartMenuOpen, setIsStartMenuOpen] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());

    const gameTime = useGameStore(state => state.gameTime);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000); // Update every second
        return () => clearInterval(timer);
    }, []);

    const handleAppClick = (appId) => {
        toggleWindow(appId);
        bringToFront(appId);
    };

    const formatGameTime = (date) => {
        const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        return date.toLocaleDateString("en-US", options);
    }

    const formatRealTime = (date) => {
        return date.toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit' });
    }

    return (
        <>
            {isStartMenuOpen && <StartMenu closeMenu={() => setIsStartMenuOpen(false)} />}
            <div className="absolute bottom-0 left-0 right-0 h-10 bg-gray-800 bg-opacity-90 backdrop-blur-sm flex items-center justify-between px-2 z-50 border-t border-gray-700">
                <div className="flex items-center">
                    {/* Start Button */}
                    <button
                        onClick={() => setIsStartMenuOpen(!isStartMenuOpen)}
                        className="px-3 py-1 bg-green-500 hover:bg-green-600 rounded text-white font-bold"
                    >
                        Start
                    </button>

                    {/* Pinned/Open Apps */}
                    <div className="flex items-center ml-2 space-x-1">
                        {Object.keys(windows).map((appId) => {
                            const app = appsConfig[appId];
                            if (!app) return null;
                            const Icon = app.icon;
                            const isActive = windows[appId].isOpen;
                            return (
                                <button
                                    key={appId}
                                    onClick={() => handleAppClick(appId)}
                                    className={`p-2 rounded hover:bg-gray-700 ${isActive ? 'bg-gray-600' : ''}`}
                                    title={app.title}
                                >
                                    <Icon className="w-5 h-5 text-white" />
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* System Tray */}
                <div className="flex items-center text-xs text-gray-300 space-x-2 pr-2">
                    <div className="text-right">
                        <div>{formatRealTime(currentTime)}</div>
                        <div>{formatGameTime(gameTime)}</div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Taskbar;

