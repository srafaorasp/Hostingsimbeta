import React, { Suspense, useEffect, useRef } from 'react';
import useGameStore from '/src/store/gameStore.js';
import useGameLoop from '/src/hooks/useGameLoop.js';
import { APPS_CONFIG } from '/src/data.js';
import { useDrop } from 'react-dnd';
import { ContextMenu, ContextMenuTrigger, ContextMenuContent, ContextMenuItem } from "/src/components/ui/context-menu.jsx";
import LoginScreen from '/src/components/LoginScreen.jsx';
import Window from '/src/components/Window.jsx';
import Taskbar from '/src/components/Taskbar.jsx';
import DesktopIcon from '/src/components/DesktopIcon.jsx';
import Logo from '/src/components/Logo.jsx';
import ToastContainer from '/src/components/Toast.jsx';
import AlertContainer from '/src/components/Alert.jsx';
import { shallow } from 'zustand/shallow';
import { AnimatePresence } from 'framer-motion';
import ErrorBoundary from '/src/components/ErrorBoundary.jsx';
import BSOD from '/src/components/BSOD.jsx';


const Desktop = () => {
    const { openApp, updateIconPosition, addEventLog } = useGameStore.getState();
    // --- THIS IS A FIX ---
    // Safely access desktopIcons and provide a default empty array
    const desktopIcons = useGameStore(s => s.state.ui?.desktopIcons || [], shallow);

    const fileInputRef = useRef(null);
    const { setWallpaper } = useGameStore.getState();

    const handleWallpaperChange = (e) => {
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setWallpaper(event.target.result);
                addEventLog('Wallpaper changed.', 'Player', 'PLAYER');
            };
            reader.readAsDataURL(file);
        }
    };

    const [, drop] = useDrop(() => ({
        accept: 'icon',
        drop: (item, monitor) => {
            const delta = monitor.getDifferenceFromInitialOffset();
            const left = Math.round(item.position.x + delta.x);
            const top = Math.round(item.position.y + delta.y);
            updateIconPosition(item.appId, { x: left, y: top });
        },
    }), [updateIconPosition]);

    return (
        <ContextMenu>
            <ContextMenuTrigger>
                <div ref={drop} className="absolute inset-0 h-full w-full">
                     <div className="flex flex-col flex-wrap h-full content-start gap-x-1 gap-y-1 p-2">
                        {Object.keys(APPS_CONFIG).map(appId => {
                            return <DesktopIcon key={appId} appId={appId} onIconClick={() => openApp(appId)} appsConfig={APPS_CONFIG} />
                        })}
                    </div>
                </div>
            </ContextMenuTrigger>
            <ContextMenuContent>
                <ContextMenuItem onClick={() => fileInputRef.current.click()}>
                    Change Wallpaper
                </ContextMenuItem>
            </ContextMenuContent>
            <input type="file" accept="image/*" ref={fileInputRef} onChange={handleWallpaperChange} className="hidden" />
        </ContextMenu>
    );
};

export default function App() {
    const { newGame, loadGame } = useGameStore.getState();
    const isBooted = useGameStore(s => s.state.isBooted);
    const hasCrashed = useGameStore(s => s.state.hasCrashed);

    const { wallpaper, theme, accentColor, taskbarPosition } = useGameStore(
        s => s.state.ui?.desktopSettings || { wallpaper: '', theme: 'dark', accentColor: 'blue', taskbarPosition: 'bottom' },
        shallow
    );
    
    const { windows, activeWindowId, toasts, alerts } = useGameStore(
        s => ({
            windows: s.state.ui?.windows || {},
            activeWindowId: s.state.ui?.activeWindowId || null,
            toasts: s.state.scripting?.toasts || [],
            alerts: s.state.scripting?.alerts || [],
        }),
        shallow
    );

    const { closeWindow, minimizeWindow, maximizeWindow, focusWindow, removeToast, removeAlert } = useGameStore.getState();

    useGameLoop();

    useEffect(() => {
        document.documentElement.className = `${theme} theme-${accentColor}`;
    }, [theme, accentColor]);

    const handleLogin = (slotName) => {
        if (slotName) loadGame(slotName);
        else newGame();
    };
    
    if (hasCrashed) {
        return <BSOD />;
    }

    if (!isBooted) {
        return <LoginScreen onLogin={handleLogin} />;
    }

    const desktopPadding = taskbarPosition === 'top' ? 'pt-12 pb-4' : 'pt-4 pb-12';

    return (
        <div className="font-sans h-screen w-screen bg-cover bg-center overflow-hidden select-none transition-colors duration-500 bg-bg-dark" style={{ backgroundImage: wallpaper }}>
             <ErrorBoundary>
                {/* Desktop Area */}
                <div className={`absolute inset-0 px-2 ${desktopPadding}`}>
                    <Desktop />
                </div>

                {/* OS Header */}
                <div className="absolute top-0 left-0 right-0 h-10 flex items-center p-4">
                    <div className="flex items-center gap-3 bg-black/30 backdrop-blur-sm p-2 rounded-lg">
                        <Logo />
                        <h1 className="text-xl font-bold text-white tracking-wider">DataCenter OS</h1>
                    </div>
                </div>
                
                <Suspense fallback={<div className="text-white">Loading...</div>}>
                    <AnimatePresence>
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
                    </AnimatePresence>
                </Suspense>

                <Taskbar appsConfig={APPS_CONFIG} />
                <ToastContainer toasts={toasts} onDismiss={removeToast} />
                <AlertContainer alerts={alerts} onDismiss={removeAlert} />
            </ErrorBoundary>
        </div>
    );
}

