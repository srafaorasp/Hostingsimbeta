import React, { useState, useCallback, Suspense, useEffect } from 'react';
import useGameStore from '/src/store/gameStore.js';
import useGameLoop from '/src/hooks/useGameLoop.js';

import Icons from '/src/components/Icons.jsx';
import LoginScreen from '/src/components/LoginScreen.jsx';
import Window from '/src/components/Window.jsx';
import Taskbar from '/src/components/Taskbar.jsx';
import DesktopIcon from '/src/components/DesktopIcon.jsx';
import Logo from '/src/components/Logo.jsx';
import ToastContainer from '/src/components/Toast.jsx';
import AlertContainer from '/src/components/Alert.jsx';

// Moved from data.js to here to resolve build issues
const APPS_CONFIG = {
    'OrderUp': { title: 'OrderUp', icon: Icons.FolderIcon, component: React.lazy(() => import('/src/apps/OrderUp.jsx')) },
    'TaskRunner': { title: 'TaskRunner', icon: Icons.CalendarIcon, component: React.lazy(() => import('/src/apps/TaskRunner.jsx')) },
    'TeamView': { title: 'TeamView', icon: Icons.UsersIcon, component: React.lazy(() => import('/src/apps/TeamView.jsx')) },
    'NetAdmin': { title: 'NetAdmin', icon: Icons.TerminalIcon, component: React.lazy(() => import('/src/apps/NetAdmin.jsx')) },
    'LayoutView': { title: 'LayoutView', icon: Icons.LayoutIcon, component: React.lazy(() => import('/src/apps/LayoutView.jsx')) },
    'SiteView': { title: 'SiteView', icon: Icons.CameraIcon, component: React.lazy(() => import('/src/apps/SiteView.jsx')) },
    'EnviroMon': { title: 'EnviroMon', icon: Icons.PowerIcon, component: React.lazy(() => import('/src/apps/EnviroMon.jsx')) },
    'ClientConnect': { title: 'ClientConnect', icon: Icons.GlobeIcon, component: React.lazy(() => import('/src/apps/ClientConnect.jsx')) },
    'SysLog': { title: 'SysLog', icon: Icons.AlertIcon, component: React.lazy(() => import('/src/apps/SysLog.jsx')) },
    'SystemSettings': { title: 'System Settings', icon: Icons.SettingsIcon, component: React.lazy(() => import('/src/apps/SystemSettings.jsx')) },
    'ISPConnect': { title: 'ISP Connect', icon: Icons.WifiIcon, component: React.lazy(() => import('/src/apps/ISPConnect.jsx')) },
    'PowerManager': { title: 'Power Manager', icon: Icons.BatteryIcon, component: React.lazy(() => import('/src/apps/PowerManager.jsx')) },
    'ScriptIDE': { title: 'ScriptIDE', icon: Icons.CodeIcon, component: React.lazy(() => import('/src/apps/ScriptIDE.jsx')) },
    'ScriptingGuide': { title: 'Scripting Guide', icon: Icons.BookIcon, component: React.lazy(() => import('/src/apps/ScriptingGuide.jsx')) },
};

export default function App() {
    const [windows, setWindows] = useState({});
    const [activeWindowId, setActiveWindowId] = useState(null);
    const [nextZIndex, setNextZIndex] = useState(10);
    const [lastWindowId, setLastWindowId] = useState(0);
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
                setWindows(prev => ({ ...prev, [existingWindow.id]: { ...prev[existingWindow.id], isMinimized: false } }));
            }
            focusWindow(existingWindow.id);
            return;
        }

        const newId = `win-${lastWindowId + 1}`;
        setLastWindowId(prev => prev + 1);
        const config = APPS_CONFIG[appId];
        setWindows(prev => ({ ...prev, [newId]: { id: newId, appId, component: config.component, title: config.title, isOpen: true, isMinimized: false, isMaximized: false, zIndex: nextZIndex, position: { x: 50 + (lastWindowId % 10) * 20, y: 50 + (lastWindowId % 10) * 20 }, size: { width: 800, height: 600 } } }));
        setNextZIndex(prev => prev + 1);
        setActiveWindowId(newId);
    }, [windows, nextZIndex, lastWindowId]);

    const closeWindow = (id) => { setWindows(prev => { const newWindows = { ...prev }; delete newWindows[id]; return newWindows; }); if (activeWindowId === id) setActiveWindowId(null); };
    const minimizeWindow = (id) => { setWindows(prev => ({ ...prev, [id]: { ...prev[id], isMinimized: true } })); if (activeWindowId === id) setActiveWindowId(null); };
    const maximizeWindow = (id) => { setWindows(prev => ({ ...prev, [id]: { ...prev[id], isMaximized: !prev[id].isMaximized } })); focusWindow(id); };
    const focusWindow = (id) => { if (activeWindowId !== id) { setWindows(prev => ({ ...prev, [id]: { ...prev[id], zIndex: nextZIndex } })); setNextZIndex(prev => prev + 1); setActiveWindowId(id); } };
    const handleTaskbarClick = (id) => {
        const win = windows[id];
        if (win.isMinimized) setWindows(prev => ({ ...prev, [id]: { ...prev[id], isMinimized: false } }));
        focusWindow(id);
    };
    
    if (!isLoggedIn) return <LoginScreen onLogin={handleLogin} />;

    return (
        <div className="font-sans h-screen w-screen bg-cover bg-center overflow-hidden select-none transition-colors duration-500" style={{ backgroundImage: wallpaper }}>
            {/* Desktop Area */}
            <div className="absolute inset-0 pt-20 pb-12 px-4">
                 <div className="flex flex-col flex-wrap h-full content-start gap-x-4 gap-y-2">
                    {Object.keys(APPS_CONFIG).map(appId => <DesktopIcon key={appId} appId={appId} onIconClick={openApp} appsConfig={APPS_CONFIG} />)}
                </div>
            </div>

            {/* OS Header */}
            <div className="absolute top-0 left-0 right-0 h-16 flex items-center p-4">
                 <div className="flex items-center gap-3 bg-black/30 backdrop-blur-sm p-2 rounded-lg">
                    <Logo />
                    <h1 className="text-2xl font-bold text-white tracking-wider">DataCenter OS</h1>
                </div>
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

