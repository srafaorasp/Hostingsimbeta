import React, { Suspense, useEffect } from 'react';
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
    // --- State is now managed by Zustand ---
    const [isLoggedIn, setIsLoggedIn] = React.useState(false); // Local UI state, doesn't need to be saved.
    
    // --- Selectors for game state ---
    const newGame = useGameStore(state => state.newGame);
    const loadGame = useGameStore(state => state.loadGame);
    const { theme, wallpaper } = useGameStore(state => state.state.ui.desktopSettings);
    const toasts = useGameStore(state => state.state.scripting.toasts);
    const alerts = useGameStore(state => state.state.scripting.alerts);
    const removeToast = useGameStore(state => state.removeToast);
    const removeAlert = useGameStore(state => state.removeAlert);

    // --- Selectors for UI state ---
    const { windows, activeWindowId } = useGameStore(state => state.state.ui);

    // --- Selectors for UI actions ---
    const openApp = useGameStore(state => state.openApp);
    const closeWindow = useGameStore(state => state.closeWindow);
    const minimizeWindow = useGameStore(state => state.minimizeWindow);
    const maximizeWindow = useGameStore(state => state.maximizeWindow);
    const focusWindow = useGameStore(state => state.focusWindow);
    const handleTaskbarClick = useGameStore(state => state.handleTaskbarClick);

    useGameLoop();

    useEffect(() => {
        document.documentElement.className = theme;
    }, [theme]);

    const handleLogin = (slotName) => {
        if (slotName) loadGame(slotName);
        else newGame();
        setIsLoggedIn(true);
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
                    const AppToRender = APPS_CONFIG[win.appId].component;
                    return (
                        <Window 
                            key={win.id} 
                            id={win.id} 
                            title={win.title} 
                            zIndex={win.zIndex} 
                            isActive={activeWindowId === win.id} 
                            isMaximized={win.isMaximized} 
                            onClose={closeWindow} 
                            onMinimize={minimizeWindow} 
                            onMaximize={maximizeWindow} 
                            onFocus={focusWindow} 
                            initialPosition={win.position} 
                            initialSize={win.size}
                        >
                            <AppToRender />
                        </Window>
                    );
                })}
            </Suspense>

            <Taskbar 
                openWindows={windows} 
                onTaskbarClick={handleTaskbarClick} 
                activeWindowId={activeWindowId} 
                appsConfig={APPS_CONFIG}
            />
            <ToastContainer toasts={toasts} onDismiss={removeToast} />
            <AlertContainer alerts={alerts} onDismiss={removeAlert} />
        </div>
    );
}

