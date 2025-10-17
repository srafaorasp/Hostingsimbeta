import React, { Suspense, useEffect, useRef } from 'react';
import useGameStore from './store/gameStore.js';
import useGameLoop from './hooks/useGameLoop.js';
import { APPS_CONFIG } from './data.js';
import { useDrop } from 'react-dnd';
import { ContextMenu, ContextMenuTrigger, ContextMenuContent, ContextMenuItem } from './components/ui/context-menu.jsx';
import { shallow } from 'zustand/shallow';

import LoginScreen from './components/LoginScreen.jsx';
import Window from './components/Window.jsx';
import Taskbar from './components/Taskbar.jsx';
import DesktopIcon from './components/DesktopIcon.jsx';
import Logo from './components/Logo.jsx';
import ToastContainer from './components/Toast.jsx';
import AlertContainer from './components/Alert.jsx';


const Desktop = () => {
    // --- THIS IS THE FIX ---
    // 1. Select reactive state with targeted hooks.
    const desktopIcons = useGameStore(s => s.state.ui.desktopIcons, shallow);
    
    // 2. Get stable actions non-reactively.
    const { openApp, updateIconPosition, setWallpaper } = useGameStore.getState();

    const fileInputRef = useRef(null);

    const handleWallpaperChange = (e) => {
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (event) => setWallpaper(event.target.result);
            reader.readAsDataURL(file);
        }
    };
    
    const [, drop] = useDrop(() => ({
        accept: 'desktop-icon',
        drop: (item, monitor) => {
            const delta = monitor.getDifferenceFromInitialOffset();
            const icon = desktopIcons.find(i => i.appId === item.id);
            if (!icon) return;
            const left = Math.round(icon.position.x + delta.x);
            const top = Math.round(icon.position.y + delta.y);
            updateIconPosition(item.id, { x: left, y: top });
        },
    }), [desktopIcons]); // updateIconPosition is stable and not needed here

    return (
        <ContextMenu>
            <ContextMenuTrigger>
                <div ref={drop} className="absolute inset-0 pt-20 pb-12 px-4">
                    {desktopIcons.map(icon => (
                        <DesktopIcon 
                            key={icon.appId} 
                            appId={icon.appId} 
                            onIconClick={openApp} 
                            appsConfig={APPS_CONFIG}
                            position={icon.position}
                        />
                    ))}
                </div>
            </ContextMenuTrigger>
            <ContextMenuContent>
                <ContextMenuItem onSelect={() => fileInputRef.current.click()}>
                    Change Wallpaper
                </ContextMenuItem>
            </ContextMenuContent>
            <input type="file" accept="image/*" ref={fileInputRef} onChange={handleWallpaperChange} className="hidden" />
        </ContextMenu>
    );
};


export default function App() {
    // --- THIS IS THE FIX ---
    // 1. Use targeted, granular hooks for each piece of state that needs to be reactive.
    const isBooted = useGameStore(s => s.state.isBooted);
    const theme = useGameStore(s => s.state.ui.desktopSettings.theme);
    const wallpaper = useGameStore(s => s.state.ui.desktopSettings.wallpaper);
    const windows = useGameStore(s => s.state.ui.windows, shallow);
    const activeWindowId = useGameStore(s => s.state.ui.activeWindowId);
    const toasts = useGameStore(s => s.state.scripting.toasts, shallow);
    const alerts = useGameStore(s => s.state.scripting.alerts, shallow);

    // 2. Get stable actions non-reactively from the store's state.
    const {
        loadGame,
        newGame,
        closeWindow,
        minimizeWindow,
        maximizeWindow,
        focusWindow,
        removeToast,
        removeAlert,
    } = useGameStore.getState();

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
            <Desktop />

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

