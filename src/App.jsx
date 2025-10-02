import React, { useState, useMemo, useRef, useCallback, Suspense, useEffect } from 'react';
import useGameStore from '/src/store/gameStore.js';
import useGameLoop from '/src/hooks/useGameLoop.js';

import { APPS_CONFIG } from '/src/data.js';

import LoginScreen from '/src/components/LoginScreen.jsx';
import Window from '/src/components/Window.jsx';
import Taskbar from '/src/components/Taskbar.jsx';
import DesktopIcon from '/src/components/DesktopIcon.jsx';
import Logo from '/src/components/Logo.jsx';
import ToastContainer from '/src/components/Toast.jsx';
import AlertContainer from '/src/components/Alert.jsx';

export default function App() {
    const [windows, setWindows] = useState({});
    const [activeWindowId, setActiveWindowId] = useState(null);
    const nextZIndex = useRef(10);
    const lastWindowId = useRef(0);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    
    const newGame = useGameStore(state => state.newGame);
    const loadGame = useGameStore(state => state.loadGame);
    const { theme, wallpaper } = useGameStore(state => state.state.uiSettings);
    const toasts = useGameStore(state => state.state.scripting.toasts);
    const alerts = useGameStore(state => state.state.scripting.alerts);
    const removeToast = useGameStore(state => state.removeToast);
    const removeAlert = useGameStore(state => state.removeAlert);

    useGameLoop();

    useEffect(() => {
        document.documentElement.className = theme;
    }, [theme]);

    const handleLogin = (slotName) => {
        if (slotName) loadGame(slotName);
        else newGame();
        setIsLoggedIn(true);
    };

    const openApp = useCallback((appId) => {
        const existingWindow = Object.values(windows).find(w => w.appId === appId);
        if (existingWindow) {
            if (existingWindow.isMinimized) {
                setWindows(prev => ({ ...prev, [existingWindow.id]: { ...prev[existingWindow.id], isMinimized: false, isMaximized: false } }));
            }
            focusWindow(existingWindow.id);
            return;
        }

        const newId = `win-${++lastWindowId.current}`;
        const config = APPS_CONFIG[appId];
        setWindows(prev => ({ ...prev, [newId]: { id: newId, appId, component: config.component, title: config.title, isOpen: true, isMinimized: false, isMaximized: false, zIndex: nextZIndex.current++, position: { x: 50 + lastWindowId.current * 20, y: 50 + lastWindowId.current * 20 }, size: { width: 800, height: 600 } } }));
        setActiveWindowId(newId);
    }, [windows]);

    const closeWindow = (id) => { setWindows(prev => { const newWindows = { ...prev }; delete newWindows[id]; return newWindows; }); if (activeWindowId === id) setActiveWindowId(null); };
    const minimizeWindow = (id) => { setWindows(prev => ({ ...prev, [id]: { ...prev[id], isMinimized: true } })); if (activeWindowId === id) setActiveWindowId(null); };
    const maximizeWindow = (id) => { setWindows(prev => ({ ...prev, [id]: { ...prev[id], isMaximized: !prev[id].isMaximized } })); focusWindow(id); };
    const focusWindow = (id) => { if (activeWindowId !== id) { setWindows(prev => ({ ...prev, [id]: { ...prev[id], zIndex: nextZIndex.current++ } })); setActiveWindowId(id); } };
    const handleTaskbarClick = (id) => {
        const win = windows[id];
        if (win.isMinimized) setWindows(prev => ({ ...prev, [id]: { ...prev[id], isMinimized: false, isMaximized: false } }));
        focusWindow(id);
    };
    
    if (!isLoggedIn) return <LoginScreen onLogin={handleLogin} />;
    
    const desktopApps = Object.keys(APPS_CONFIG);

    return (
        <div className="font-sans h-screen w-screen bg-cover bg-center overflow-hidden select-none transition-colors duration-500" style={{ backgroundImage: wallpaper }}>
            <div className="absolute top-4 left-4 flex items-center gap-3 bg-black/30 backdrop-blur-sm p-2 rounded-lg z-10">
                <Logo />
                <h1 className="text-2xl font-bold text-white tracking-wider">DataCenter OS</h1>
            </div>

            {/* This is the new, responsive container for all desktop icons */}
            <div className="absolute top-0 left-0 right-0 bottom-12 pt-24 p-4 flex flex-col flex-wrap content-start gap-x-2 gap-y-4">
                {desktopApps.map(appId => (
                    <div key={appId} className="w-28">
                         <DesktopIcon appId={appId} onIconClick={openApp} appsConfig={APPS_CONFIG} />
                    </div>
                ))}
            </div>
            
            <Suspense fallback={<div className="text-white">Loading...</div>}>
                {Object.values(windows).map(win => {
                    if (!win.isOpen || win.isMinimized) return null;
                    const AppToRender = win.component;
                    return (
                        <Window key={win.id} id={win.id} title={win.title} zIndex={win.zIndex} isActive={activeWindowId === win.id} isMaximized={win.isMaximized} onClose={closeWindow} onMinimize={minimizeWindow} onMaximize={maximizeWindow} onFocus={focusWindow} initialPosition={win.position} initialSize={win.size}>
                            <AppToRender />
                        </Window>
                    );
                })}
            </Suspense>

            <Taskbar openWindows={windows} onTaskbarClick={handleTaskbarClick} activeWindowId={activeWindowId} appsConfig={APPS_CONFIG} />
            <ToastContainer toasts={toasts} onDismiss={removeToast} />
            <AlertContainer alerts={alerts} onDismiss={removeAlert} />
        </div>
    );
}

