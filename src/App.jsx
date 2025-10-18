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
    const { openApp, updateIconPosition, setWallpaper } = useGameStore.getState();
    const desktopIcons = useGameStore(s => s.state.ui.desktopIcons || [], shallow);
    const fileInputRef = useRef(null);

    const [, drop] = useDrop(() => ({
        accept: 'icon',
        drop: (item, monitor) => {
            const delta = monitor.getDifferenceFromInitialOffset();
            const left = Math.round(item.position.x + delta.x);
            const top = Math.round(item.position.y + delta.y);
            updateIconPosition(item.appId, { x: left, y: top });
            return undefined; // react-dnd requires a return value
        },
    }), [updateIconPosition]);

    return (
        <ContextMenu>
            <ContextMenuTrigger>
                {/* --- THIS IS THE FIX --- */}
                {/* This div is now a clean, relative container that correctly defines the desktop area */}
                {/* All conflicting flexbox classes have been removed */}
                <div ref={drop} className="relative h-full w-full">
                    {desktopIcons.map(iconConfig => {
                        if (!iconConfig) return null;
                        return (
                            <DesktopIcon
                                key={iconConfig.appId}
                                appId={iconConfig.appId}
                                onIconClick={openApp}
                                appsConfig={APPS_CONFIG}
                                position={iconConfig.position}
                            />
                        );
                    })}
                </div>
            </ContextMenuTrigger>
            <ContextMenuContent>
                <ContextMenuItem onClick={() => fileInputRef.current && fileInputRef.current.click()}>
                    Change Wallpaper
                </ContextMenuItem>
            </ContextMenuContent>
            <input type="file" accept="image/*" ref={fileInputRef} className="hidden" onChange={(e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => setWallpaper(`url(${event.target.result})`);
                    reader.readAsDataURL(file);
                }
            }} />
        </ContextMenu>
    );
};

export default function App() {
    useGameLoop();
    const { newGame, loadGame } = useGameStore.getState();

    const isBooted = useGameStore(s => s.state.isBooted);
    const hasCrashed = useGameStore(s => s.state.hasCrashed);
    const uiState = useGameStore(s => s.state.ui || {}, shallow);
    const { windows = {}, activeWindowId, toasts = [], alerts = [] } = uiState;
    const { theme, accentColor, wallpaper, taskbarPosition } = uiState.desktopSettings || {};

    useEffect(() => {
        document.documentElement.className = theme;
        document.documentElement.style.setProperty('--accent-color', `hsl(var(--accent-${accentColor}))`);
    }, [theme, accentColor]);

    if (hasCrashed) {
        return <BSOD />;
    }

    if (!isBooted) {
        return <LoginScreen onNewGame={newGame} onLoadGame={loadGame} />;
    }
    
    const desktopPadding = taskbarPosition === 'top' ? 'pt-16 pb-12' : 'pt-8 pb-20';

    return (
        <ErrorBoundary>
            <div className="font-sans h-screen w-screen bg-cover bg-center overflow-hidden select-none transition-colors duration-500" style={{ backgroundImage: wallpaper }}>
                {/* This container correctly defines the space for the Desktop component */}
                <div className={`absolute inset-0 ${desktopPadding} px-4`}>
                     <Desktop />
                </div>
                <div className="absolute top-0 left-0 right-0 h-16 flex items-center p-4 pointer-events-none">
                     <div className="flex items-center gap-3 bg-black/30 backdrop-blur-sm p-2 rounded-lg">
                        <Logo />
                        <h1 className="text-2xl font-bold text-white tracking-wider">DataCenter OS</h1>
                    </div>
                </div>
                
                <Suspense fallback={<div className="text-white">Loading...</div>}>
                    <AnimatePresence>
                        {Object.values(windows).map(win => {
                            if (!win.isOpen || win.isMinimized) return null;
                            const AppToRender = APPS_CONFIG[win.appId]?.component;
                            if (!AppToRender) return null; 
                            return (
                                <Window key={win.id} id={win.id} title={win.title} zIndex={win.zIndex} isActive={activeWindowId === win.id} isMaximized={win.isMaximized} position={win.position} size={win.size}>
                                    <AppToRender />
                                </Window>
                            );
                        })}
                    </AnimatePresence>
                </Suspense>

                <Taskbar appsConfig={APPS_CONFIG} />
                <ToastContainer toasts={toasts} />
                <AlertContainer alerts={alerts} />
            </div>
        </ErrorBoundary>
    );
}

