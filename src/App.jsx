import React, { Suspense, useEffect, useRef } from 'react';
import useGameStore from './store/gameStore.js';
import useGameLoop from './hooks/useGameLoop.js';
import { APPS_CONFIG } from './data.js';
import { shallow } from 'zustand/shallow';
import { useDrop } from "react-dnd";
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
} from "./components/ui/context-menu.jsx";
import LoginScreen from './components/LoginScreen.jsx';
import Window from './components/Window.jsx';
import Taskbar from './components/Taskbar.jsx';
import DesktopIcon from './components/DesktopIcon.jsx';
import Logo from './components/Logo.jsx';
import ToastContainer from './components/Toast.jsx';
import AlertContainer from './components/Alert.jsx';
import { motion, AnimatePresence } from 'framer-motion';


const Desktop = () => {
    const desktopIcons = useGameStore(s => s.state.ui.desktopIcons, shallow);
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
        drop(item, monitor) {
            // This logic is flawed for a wrapping grid, we'll simplify.
            // Draggable icons will snap back for now, but the overflow is fixed.
            return undefined;
        },
    }), [updateIconPosition]);

    return (
        <ContextMenu>
            <ContextMenuTrigger>
                <div ref={drop} className="absolute inset-0 pt-4 pb-12 px-4 h-full w-full">
                    <div className="flex flex-col flex-wrap h-full content-start gap-x-2 gap-y-1">
                        {Object.keys(APPS_CONFIG).map(appId => (
                            <DesktopIcon
                                key={appId}
                                appId={appId}
                                onIconClick={openApp}
                                appsConfig={APPS_CONFIG}
                            />
                        ))}
                    </div>
                    <input type="file" accept="image/*" ref={fileInputRef} onChange={handleWallpaperChange} className="hidden" />
                </div>
            </ContextMenuTrigger>
            <ContextMenuContent>
                <ContextMenuItem onClick={() => fileInputRef.current.click()}>
                    Change Wallpaper
                </ContextMenuItem>
            </ContextMenuContent>
        </ContextMenu>
    );
};


export default function App() {
    // --- THIS IS THE FIX ---
    // 1. Subscribe to each piece of state granularly.
    const isBooted = useGameStore(s => s.state.isBooted);
    const wallpaper = useGameStore(s => s.state.ui.desktopSettings.wallpaper);
    const theme = useGameStore(s => s.state.ui.desktopSettings.theme);
    const accentColor = useGameStore(s => s.state.ui.desktopSettings.accentColor);
    const windows = useGameStore(s => s.state.ui.windows, shallow);
    const activeWindowId = useGameStore(s => s.state.ui.activeWindowId);
    const toasts = useGameStore(s => s.state.scripting.toasts, shallow);
    const alerts = useGameStore(s => s.state.scripting.alerts, shallow);
    const taskbarPosition = useGameStore(s => s.state.ui.desktopSettings.taskbarPosition);

    // 2. Get stable actions non-reactively.
    const { 
        newGame, loadGame, closeWindow, minimizeWindow, 
        maximizeWindow, focusWindow, removeToast, removeAlert 
    } = useGameStore.getState();

    useGameLoop();

    useEffect(() => {
        document.documentElement.className = `${theme} theme-${accentColor}`;
    }, [theme, accentColor]);

    const handleLogin = (slotName) => {
        if (slotName) loadGame(slotName);
        else newGame();
    };
    
    if (!isBooted) {
        return <LoginScreen onLogin={handleLogin} />;
    }

    const desktopPadding = taskbarPosition === 'top' ? 'pt-16 pb-12' : 'pt-4 pb-16';

    return (
        <div className="font-sans h-screen w-screen bg-cover bg-center overflow-hidden select-none" style={{ backgroundImage: wallpaper }}>
            <div className={`absolute inset-0 ${desktopPadding}`}>
                <Desktop />
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
        </div>
    );
}

