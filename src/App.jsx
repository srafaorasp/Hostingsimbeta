import React, { useState, useEffect } from 'react';
import useGameStore from './store/gameStore';
import useGameLoop from './hooks/useGameLoop';
import LoginScreen from './components/LoginScreen';
import Window from './components/Window';
import Taskbar from './components/Taskbar';
import Toast from './components/Toast';
import DesktopIcon from './components/DesktopIcon';
import { APPS_CONFIG } from './data';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "./components/ui/context-menu";
import StartMenu from './components/StartMenu';
import { AnimatePresence } from 'framer-motion';
import BSOD from './store/BSOD';
import ErrorBoundary from './store/ErrorBoundary';

function App() {
  const {
    isLoggedIn,
    isGameLoaded,
    ui,
    windows,
    openWindow,
    setWallpaper,
    hasError,
    loadGame, // Get the loadGame action
  } = useGameStore();

  useGameLoop(); // Start the game loop

  // Load the game data when the app component mounts
  useEffect(() => {
    loadGame();
  }, [loadGame]);


  const [isStartMenuOpen, setStartMenuOpen] = useState(false);

  if (hasError) {
    return <BSOD />;
  }

  if (!isGameLoaded) {
    return <div className="bg-black h-screen w-screen flex items-center justify-center"><p className="text-white">Loading Game Data...</p></div>;
  }

  if (!isLoggedIn) {
    return <LoginScreen />;
  }

  const toggleStartMenu = () => setStartMenuOpen(prev => !prev);
  const closeStartMenu = () => {
    if (isStartMenuOpen) {
      setStartMenuOpen(false);
    }
  };


  return (
    <DndProvider backend={HTML5Backend}>
      <div className={`h-screen w-screen font-sans overflow-hidden select-none ${ui.wallpaper}`}>
        <ContextMenu>
          <ContextMenuTrigger className="h-full w-full">
            {/* Desktop Area */}
            <div className="absolute inset-0" onClick={closeStartMenu}>
              {ui.desktopIcons.map((icon) => {
                const app = APPS_CONFIG[icon.appId];
                if (!app) return null;
                return (
                  <DesktopIcon
                    key={icon.id}
                    id={icon.id}
                    app={app}
                    initialPosition={icon.position}
                    onDoubleClick={() => openWindow(icon.appId)}
                  />
                );
              })}

              <AnimatePresence>
                {Object.values(windows).filter(w => w.isOpen).sort((a, b) => a.zIndex - b.zIndex).map((win) => {
                   const app = APPS_CONFIG[win.appId];
                   if (!app) return null;
                   return <Window key={win.appId} appId={win.appId} title={app.title}><app.component /></Window>;
                })}
              </AnimatePresence>

            </div>
          </ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem onClick={() => setWallpaper('bg-blue-900')}>Blue Wallpaper</ContextMenuItem>
            <ContextMenuItem onClick={() => setWallpaper('bg-gray-900')}>Gray Wallpaper</ContextMenuItem>
            <ContextMenuItem onClick={() => setWallpaper('bg-purple-900')}>Purple Wallpaper</ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>

        <AnimatePresence>
          {isStartMenuOpen && <StartMenu closeMenu={closeStartMenu} />}
        </AnimatePresence>

        <Taskbar toggleStartMenu={toggleStartMenu} />
        <Toast />
      </div>
    </DndProvider>
  );
}

export default App;

