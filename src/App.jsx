import React, { Suspense, useEffect } from 'react';
import useGameStore from '/src/store/gameStore.js';
import useGameLoop from '/src/hooks/useGameLoop.js';
import { APPS_CONFIG } from '/src/data.js';
import { shallow } from 'zustand/shallow';

import LoginScreen from '/src/components/LoginScreen.jsx';
import Window from '/src/components/Window.jsx';
import Taskbar from '/src/components/Taskbar.jsx';
import DesktopIcon from '/src/components/DesktopIcon.jsx';
import Logo from '/src/components/Logo.jsx';
import ToastContainer from '/src/components/Toast.jsx';
import AlertContainer from '/src/components/Alert.jsx';

export default function App() {
    // --- THE FIX: All state selectors now point to the nested 'state' object ---
    const isBooted = useGameStore((s) => s.state.isBooted);
    const wallpaper = useGameStore((s) => s.state.ui.desktopSettings.wallpaper);
    const theme = useGameStore((s) => s.state.ui.desktopSettings.theme);
    const windows = useGameStore((s) => s.state.ui.windows);
    const activeWindowId = useGameStore((s) => s.state.ui.activeWindowId);
    const toasts = useGameStore((s) => s.state.scripting.toasts);
    const alerts = useGameStore((s) => s.state.scripting.alerts);
    
    // --- Action hooks are unchanged as actions are now top-level and stable ---
    const { newGame, loadGame, openApp, closeWindow, minimizeWindow, maximizeWindow, focusWindow, removeToast, removeAlert } = useGameStore(
        (state) => ({
            newGame: state.newGame,
            loadGame: state.loadGame,
            openApp: state.openApp,
            closeWindow: state.closeWindow,
            minimizeWindow: state.minimizeWindow,
            maximizeWindow: state.maximizeWindow,
            focusWindow: state.focusWindow,
            removeToast: state.removeToast,
            removeAlert: state.removeAlert,
        }),
        shallow
    );

    useGameLoop();

    useEffect(() => {
        document.documentElement.className = theme;
    }, [theme]);

    const handleLogin = (slotName) => {
        if (slotName) loadGame(slotName);
        else newGame();
    };
    
    if (!isBooted) {
        return <LoginScreen onLogin={handleLogin} />;
    }

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
                    const AppToRender = APPS_CONFIG[win.appId]?.component;
                    if (!AppToRender) return null; 
                    return (
                        <Window key={win.id} id={win.id} title={win.title} zIndex={win.zIndex} isActive={activeWindowId === win.id} isMaximized={win.isMaximized} onClose={closeWindow} onMinimize={minimizeWindow} onMaximize={maximizeWindow} onFocus={focusWindow} initialPosition={win.position} initialSize={win.size}>
                            <AppToRender />
                        </Window>
                    );
                })}
            </Suspense>

            <Taskbar appsConfig={APPS_CONFIG} />
            <ToastContainer toasts={toasts} onDismiss={removeToast} />
            <AlertContainer alerts={alerts} onDismiss={removeAlert} />
        </div>
    );
}

