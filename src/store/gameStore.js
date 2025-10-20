import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { persist, createJSONStorage } from 'zustand/middleware';
import { nanoid } from 'nanoid';
import localforage from 'localforage';
import { APPS_CONFIG, startingScenarios, TASKS_CONFIG } from '../data';
import dayjs from 'dayjs';

const useGameStore = create(
  persist(
    immer((set, get) => ({
      // Core Game State
      isGameLoaded: false,
      isLoggedIn: false,
      hasError: false,
      gameDate: dayjs().startOf('day').add(8, 'hour').toISOString(),
      realTime: new Date().toISOString(),
      timeSpeed: 1, // 1 = normal, 10 = 10x speed, etc.
      companyName: '',
      cash: 0,
      monthlyProfit: 0,

      // UI State
      ui: {
        wallpaper: 'bg-blue-900',
        desktopIcons: [],
        windows: {}, // { appId: { isOpen, position, size, zIndex } }
        nextZIndex: 1,
        activeWindow: null,
        toast: { show: false, message: '', type: 'info' },
      },

      // Game Data
      logs: [],
      employees: [],
      hardware: [], // All hardware assets owned by the player
      tasks: [],
      ispContracts: [],

      // --- ACTIONS --- //

      // Game Lifecycle
      loadGame: async () => {
        try {
          const savedState = await localforage.getItem('gameState');
          if (savedState) {
            set((state) => {
              // Basic merge
              Object.assign(state, savedState);

              // Ensure nested objects that might be undefined in old saves are present
              state.ui = { ...get().ui, ...savedState.ui };
              state.ui.windows = savedState.ui?.windows || {};
              state.isGameLoaded = true;
              state.isLoggedIn = true; // Assume if they load, they are logged in
            });
            get().addLog('Game loaded successfully.', 'success', { meta: 'system' });
          } else {
             // This happens on first ever launch.
             set({ isGameLoaded: true, isLoggedIn: false });
          }
        } catch (error) {
          console.error("Failed to load game:", error);
          get().setErrorState(error);
        }
      },

      newGame: (scenarioId) => {
        const scenario = startingScenarios.find(s => s.id === scenarioId);
        if (!scenario) {
          get().setErrorState(new Error(`Scenario with id ${scenarioId} not found.`));
          return;
        }

         // Reset state to a clean slate before applying scenario
        set(state => {
            // Reset core properties
            state.isLoggedIn = true;
            state.gameDate = dayjs().startOf('day').add(8, 'hour').toISOString();
            state.timeSpeed = 1;
            state.companyName = 'My Hosting Company';
            state.cash = scenario.startingCash;
            state.monthlyProfit = 0;

            // Reset UI
            state.ui.wallpaper = 'bg-blue-900';
            state.ui.desktopIcons = Object.keys(APPS_CONFIG).map((appId, index) => ({
                id: nanoid(),
                appId,
                position: { x: 20, y: 20 + index * 100 },
            }));
            state.ui.windows = {};
            state.ui.nextZIndex = 1;
            state.ui.activeWindow = null;

            // Reset Data
            state.logs = [];
            state.employees = scenario.startingStaff;
            state.hardware = scenario.startingHardware;
            state.tasks = [];
            state.ispContracts = [];
        });


        get().addLog(`New game started with the "${scenario.name}" scenario.`, 'info', { meta: 'system' });
        set({ isGameLoaded: true });
      },

      // Time Management
      advanceTime: (minutes) => {
        set((state) => {
          state.gameDate = dayjs(state.gameDate).add(minutes, 'minute').toISOString();
          state.realTime = new Date().toISOString();
        });
        // Here you would trigger checks for events, task progress, etc.
        get().updateTasks();
      },

       updateTasks: () => {
        set(state => {
            const now = dayjs(state.gameDate);
            const completedTasks = [];

            state.tasks = state.tasks.filter(task => {
                if (task.status === 'completed' || task.status === 'failed') return false; // Already done

                const endTime = dayjs(task.startTime).add(task.durationMinutes, 'minute');

                if (now.isAfter(endTime)) {
                    // Task is complete
                    task.status = 'completed';
                    completedTasks.push(task);
                    return false; // Remove from active tasks
                }
                return true; // Keep in active tasks
            });

            if (completedTasks.length > 0) {
                 get().addLog(`${completedTasks.length} task(s) completed.`, 'success', { meta: 'tasks' });
                 // TODO: Handle onCompleteEffect for each task
            }
        });
    },

      // UI Actions
      openWindow: (appId) => {
        set((state) => {
          const { windows, nextZIndex } = state.ui;
          if (!windows[appId]) {
            windows[appId] = { isOpen: true, zIndex: nextZIndex };
          } else {
            windows[appId].isOpen = true;
            windows[appId].zIndex = nextZIndex;
          }
          state.ui.nextZIndex += 1;
          state.ui.activeWindow = appId;
        });
      },

      closeWindow: (appId) => {
        set((state) => {
          if (state.ui.windows[appId]) {
            state.ui.windows[appId].isOpen = false;
          }
          if (state.ui.activeWindow === appId) {
             // Find the next highest z-index to make active
             const openWindows = Object.entries(state.ui.windows)
                .filter(([, win]) => win.isOpen && win.appId !== appId)
                .sort(([, a], [, b]) => b.zIndex - a.zIndex);
             state.ui.activeWindow = openWindows.length > 0 ? openWindows[0][0] : null;
          }
        });
      },

       focusWindow: (appId) => {
        set((state) => {
          if (state.ui.windows[appId] && state.ui.activeWindow !== appId) {
            state.ui.windows[appId].zIndex = state.ui.nextZIndex;
            state.ui.nextZIndex += 1;
            state.ui.activeWindow = appId;
          }
        });
      },

      setWallpaper: (wallpaperClass) => {
        set((state) => {
          state.ui.wallpaper = wallpaperClass;
        });
      },

      updateIconPosition: (iconId, position) => {
        set(state => {
          const icon = state.ui.desktopIcons.find(i => i.id === iconId);
          if (icon) {
            icon.position = position;
          }
        });
      },

      // Logging
      addLog: (message, type = 'info', metadata = {}) => {
        set((state) => {
          state.logs.unshift({
            id: nanoid(),
            message,
            type, // 'info', 'success', 'warning', 'error'
            gameTimestamp: state.gameDate,
            realTimestamp: new Date().toISOString(),
            metadata,
          });
          // Optional: Trim logs if they get too long
          if (state.logs.length > 200) {
            state.logs.pop();
          }
        });
      },

       // Task Management
      addTask: (taskId, employeeId, targetId = null) => {
        const taskConfig = TASKS_CONFIG.find(t => t.id === taskId);
        if (!taskConfig) {
            get().addLog(`Attempted to start unknown task: ${taskId}`, 'error');
            return;
        }

        set(state => {
            state.tasks.push({
                id: nanoid(),
                taskId,
                employeeId,
                targetId,
                status: 'inprogress',
                startTime: state.gameDate,
                durationMinutes: taskConfig.durationMinutes,
            });
        });
        get().addLog(`Task started: ${taskConfig.description}`, 'info', { meta: 'tasks' });
      },

      // Error Handling
      setErrorState: (error) => {
        console.error("A critical error occurred:", error);
        set({ hasError: true });
      },

    })),
    {
      name: 'hostingsim-gamestate',
      storage: createJSONStorage(() => localforage),
      // This part is crucial for handling non-serializable parts like functions
      partialize: (state) =>
        Object.fromEntries(
          Object.entries(state).filter(([key]) => ![].includes(key))
        ),
    }
  )
);

export default useGameStore;

