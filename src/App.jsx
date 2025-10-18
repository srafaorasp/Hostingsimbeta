import React from 'react';
import useGameStore from "./store/gameStore";
import { useGameLoop } from "./hooks/useGameLoop";
import LoginScreen from "./components/LoginScreen";
import DesktopIcon from "./components/DesktopIcon";
import Window from "./components/Window";
import Taskbar from "./components/Taskbar";
import Toast from './components/Toast';
import TutorialTooltip from './components/TutorialTooltip';
import { APPS_CONFIG } from './data';
import BSOD from './components/BSOD';
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  const { loggedIn, login, newGame, openWindows, windows, focusedWindow, toast } = useGameStore();
  useGameLoop();

  if (!loggedIn) {
    return <LoginScreen onLogin={login} onNewGame={newGame} />;
  }

  const desktopIcons = Object.values(APPS_CONFIG).map((app) => (
    <DesktopIcon key={app.id} appId={app.id} />
  ));

  const activeWindows = openWindows.map((appId) => (
    <Window key={appId} appId={appId} />
  ));

  return (
    <ErrorBoundary fallback={<BSOD />}>
      <div className="bg-blue-900 bg-cover bg-center h-screen w-screen font-sans text-white overflow-hidden">
        <div className="absolute inset-0 bg-black bg-opacity-40"></div>
        <div className="relative h-full w-full">
          {/* Desktop Icons */}
          <div className="p-4 flex flex-col flex-wrap content-start h-full">
            {desktopIcons}
          </div>

          {/* Windows */}
          {activeWindows}

          {/* Tutorial */}
          <TutorialTooltip />

          {/* Toast */}
          <Toast toast={toast} />

          {/* Taskbar */}
          <Taskbar />
        </div>
      </div>
    </ErrorBoundary>
  );
}

export default App;

