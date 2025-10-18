import { create } from 'zustand';
import { produce } from 'immer';
import { HARDWARE_CATALOG, ISP_CONTRACTS, CLIENT_CONTRACTS, SCRIPT_PERMISSIONS, APPS_CONFIG, GRID_POWER_COST_PER_KWH, ACHIEVEMENT_DEFINITIONS } from '../data.js';

// Helper function to create a fresh initial state
const createInitialState = () => ({
    time: new Date(2025, 8, 29, 8, 0, 0),
    lastMonth: 8,
    isPaused: true,
    isBooted: false,
    hasCrashed: false,
    gameSpeed: 1,
    finances: {
        cash: 75000,
        monthlyRevenue: 0,
        lastBill: 0,
    },
    history: {
        cashHistory: [],
        powerHistory: [],
        tempHistory: [],
    },
    stagedHardware: [],
    employees: [],
    tasks: [],
    dataCenterLayout: {},
    nextRackSlot: 1,
    power: { capacity: 0, load: 0, gridActive: true, totalConsumedKwh: 0 },
    cooling: { capacity: 0, load: 0 },
    serverRoomTemp: 21.0,
    network: { capacity: 0, load: 0, ispContract: null, publicIpBlock: null, assignedPublicIps: {} },
    nextInternalIp: 10,
    activeContracts: [],
    eventLog: [{ id: Date.now(), time: new Date(), source: 'System', level: 'INFO', message: "System OS booted successfully." }],
    ui: {
        desktopSettings: {
            theme: 'dark',
            accentColor: 'blue',
            taskbarPosition: 'bottom',
            wallpaper: `url('https://placehold.co/1920x1000/0a1829/1c2a3b?text=DataCenter+OS')`
        },
        windows: {},
        activeWindowId: null,
        nextZIndex: 10,
        lastWindowId: 0,
        desktopIcons: Object.keys(APPS_CONFIG).map((appId, index) => ({
            appId,
            position: { x: 20 + Math.floor(index / 8) * 110, y: 20 + (index % 8) * 100 }
        })),
    },
    scripting: {
        agents: { 'system': { name: 'system', permissions: Object.keys(SCRIPT_PERMISSIONS), isCallable: false } },
        fileSystem: {
            '/home/system/example.js': {
                content: '# Welcome to the ScriptIDE!\n# Use this file to automate tasks.\n\n# Example: Send a notification\nplayer notify "Hello World" "This is a test notification from a script."',
                agentName: 'system',
                status: 'paused',
                interval: 60,
                lastRunTime: null,
            }
        },
        daemons: {},
        toasts: [],
        alerts: [],
    },
    tutorial: {
        isActive: true,
        step: 0,
        targetElement: null,
    },
    achievements: {
        unlocked: [],
    }
});


// Helper function for deep merging states, crucial for loading games.
const deepMerge = (target, source) => {
    for (const key in source) {
        if (source[key] instanceof Object && key in target && target[key] instanceof Object) {
            // Special handling for arrays to avoid merging, we want to replace them
            if (Array.isArray(source[key])) {
                 target[key] = source[key];
            } else {
                deepMerge(target[key], source[key]);
            }
        } else {
            target[key] = source[key];
        }
    }
    return target;
};


const useGameStore = create((set, get) => ({
    state: createInitialState(),

    // --- System & Time ---
    newGame: () => {
        get().addEventLog('Starting new game session.', 'PLAYER');
        set({ state: { ...createInitialState(), isBooted: true, eventLog: [{ id: Date.now(), time: new Date(), source: 'System', level: 'INFO', message: "New session started." }] } });
    },
    saveGame: (slotName) => {
        get().addEventLog(`Game saved to slot: ${slotName}`, 'PLAYER');
        const dataToSave = get().state;
        const stateString = JSON.stringify({ ...dataToSave, time: dataToSave.time.toISOString(), eventLog: dataToSave.eventLog.map(e => ({ ...e, time: e.time.toISOString() })) });
        localStorage.setItem(`datacenter_save_${slotName}`, stateString);
    },
    loadGame: (slotName) => {
        const savedStateJSON = localStorage.getItem(`datacenter_save_${slotName}`);
        if (savedStateJSON) {
            get().addEventLog(`Loading game from slot: ${slotName}`, 'PLAYER');
            const savedData = JSON.parse(savedStateJSON);
            const wallpaper = localStorage.getItem('datacenter_wallpaper');
            let freshState = createInitialState();
            
            // --- FIX FOR ICON POSITIONS ---
            // If the save file has icon positions, don't overwrite them with the default.
            if (savedData.ui && savedData.ui.desktopIcons) {
                delete freshState.ui.desktopIcons;
            }

            const mergedData = deepMerge(freshState, savedData);

            const rehydratedData = {
                ...mergedData,
                isBooted: true,
                hasCrashed: false, // Always reset crash state on load
                time: new Date(savedData.time || freshState.time),
                eventLog: (savedData.eventLog || []).map(e => ({ ...e, time: new Date(e.time) })),
            };
            if (wallpaper) rehydratedData.ui.desktopSettings.wallpaper = wallpaper;
            set({ state: rehydratedData });
        }
    },
    advanceTime: (seconds) => set(produce(draft => {
        const newTime = new Date(draft.state.time);
        newTime.setSeconds(newTime.getSeconds() + seconds);
        draft.state.time = newTime;
        const kwhConsumedThisTick = (draft.state.power.load / 1000) * (seconds / 3600);
        draft.state.power.totalConsumedKwh += kwhConsumedThisTick;
    })),
    togglePause: () => set(produce(draft => { draft.state.isPaused = !draft.state.isPaused; })),
    setGameSpeed: (speed) => set(produce(draft => { draft.state.gameSpeed = speed; })),
    addEventLog: (message, level = 'INFO', source = "System") => {
        const logEntry = { id: Date.now() + Math.random(), time: get().state.time, source, level, message };
        set(produce(draft => {
            draft.state.eventLog.unshift(logEntry);
            if (draft.state.eventLog.length > 200) draft.state.eventLog.pop();
        }));
    },
    triggerBSOD: () => set(produce(draft => { draft.state.hasCrashed = true; })),
    
    // --- UI State Management ---
    openApp: (appId) => {
        set(produce(draft => {
            const existingWindow = Object.values(draft.state.ui.windows).find(w => w.appId === appId);
            if (existingWindow) {
                if (existingWindow.isMinimized) {
                    existingWindow.isMinimized = false;
                }
                draft.state.ui.activeWindowId = existingWindow.id;
                existingWindow.zIndex = draft.state.ui.nextZIndex;
                draft.state.ui.nextZIndex += 1;
                return;
            }

            const newId = `win-${draft.state.ui.lastWindowId + 1}`;
            draft.state.ui.lastWindowId += 1;
            draft.state.ui.windows[newId] = {
                id: newId,
                appId,
                title: APPS_CONFIG[appId].title,
                isOpen: true,
                isMinimized: false,
                isMaximized: false,
                zIndex: draft.state.ui.nextZIndex,
                position: { x: 50 + (draft.state.ui.lastWindowId % 10) * 20, y: 50 + (draft.state.ui.lastWindowId % 10) * 20 },
                size: { width: 800, height: 600 }
            };
            draft.state.ui.nextZIndex += 1;
            draft.state.ui.activeWindowId = newId;
        }));
        get().addEventLog(`Opened app: ${APPS_CONFIG[appId].title}`, 'PLAYER');
    },
    closeWindow: (id) => set(produce(draft => {
        delete draft.state.ui.windows[id];
        if (draft.state.ui.activeWindowId === id) draft.state.ui.activeWindowId = null;
    })),
    minimizeWindow: (id) => set(produce(draft => {
        if (draft.state.ui.windows[id]) {
            draft.state.ui.windows[id].isMinimized = true;
        }
        if (draft.state.ui.activeWindowId === id) draft.state.ui.activeWindowId = null;
    })),
    maximizeWindow: (id) => set(produce(draft => {
        if (draft.state.ui.windows[id]) {
            draft.state.ui.windows[id].isMaximized = !draft.state.ui.windows[id].isMaximized;
        }
        if (!draft.state.ui.windows[id].isMaximized) {
             draft.state.ui.windows[id].zIndex = get().state.ui.nextZIndex;
             set(produce(d => { d.state.ui.nextZIndex += 1; }));
        }
    })),
    focusWindow: (id) => set(produce(draft => {
        if (!draft.state.ui.windows[id]) return;

        if (draft.state.ui.activeWindowId !== id) {
            draft.state.ui.windows[id].zIndex = draft.state.ui.nextZIndex;
            draft.state.ui.nextZIndex += 1;
            draft.state.ui.activeWindowId = id;
        }
         if (draft.state.ui.windows[id].isMinimized) {
            draft.state.ui.windows[id].isMinimized = false;
        }
    })),
    updateWindowState: (id, updates) => set(produce(draft => {
        const win = draft.state.ui.windows[id];
        if (win) {
            Object.assign(win, updates);
        }
    })),
    updateIconPosition: (appId, position) => set(produce(draft => {
        const icon = draft.state.ui.desktopIcons.find(i => i.appId === appId);
        if (icon) {
            icon.position = position;
        }
    })),
    setTheme: (themeName) => {
        get().addEventLog(`Theme changed to: ${themeName}`, 'PLAYER');
        set(produce(draft => { draft.state.ui.desktopSettings.theme = themeName; }));
    },
    setAccentColor: (color) => {
        get().addEventLog(`Accent color changed to: ${color}`, 'PLAYER');
        set(produce(draft => { draft.state.ui.desktopSettings.accentColor = color; }));
    },
    setTaskbarPosition: (position) => {
        get().addEventLog(`Taskbar position changed to: ${position}`, 'PLAYER');
        set(produce(draft => { draft.state.ui.desktopSettings.taskbarPosition = position; }));
    },
    setWallpaper: (wallpaperUrl) => {
        localStorage.setItem('datacenter_wallpaper', wallpaperUrl);
        set(produce(draft => { draft.state.ui.desktopSettings.wallpaper = wallpaperUrl; }));
    },
    
    // --- Finances ---
    spendCash: (amount) => set(produce(draft => { draft.state.finances.cash -= amount; })),
    addCash: (amount) => set(produce(draft => { draft.state.finances.cash += amount; })),
    processMonthlyBilling: () => set(produce(draft => {
        const { network, employees, power, time } = draft.state;
        const ispCost = network.ispContract ? network.ispContract.monthlyCost : 0;
        const employeeSalaries = employees.reduce((acc, emp) => acc + (emp.salary / 12), 0);
        const powerBill = power.totalConsumedKwh * GRID_POWER_COST_PER_KWH;
        const totalExpenses = ispCost + employeeSalaries + powerBill;
        const totalRevenue = draft.state.finances.monthlyRevenue;
        
        draft.state.finances.cash += (totalRevenue - totalExpenses);
        draft.state.finances.lastBill = totalExpenses;
        draft.state.power.totalConsumedKwh = 0;
        draft.state.lastMonth = time.getMonth();
        get().addEventLog(`Monthly billing processed. Revenue: $${totalRevenue.toFixed(2)}, Expenses: $${totalExpenses.toFixed(2)}`, 'INFO', 'Finance');
    })),

    // --- Inventory & Hardware ---
    purchaseAndStageItem: (item, quantity) => {
        const totalCost = item.price * quantity;
        if (get().state.finances.cash >= totalCost) {
            get().spendCash(totalCost);
            set(produce(draft => {
                for (let i = 0; i < quantity; i++) {
                    const stagedId = `${item.id}_${Date.now() + i}`;
                    draft.state.stagedHardware.push({ id: stagedId, type: item.id, location: 'Tech Room' });
                }
            }));
            get().addEventLog(`Purchased ${quantity}x ${item.name}`, 'PLAYER');
        }
    },
    stageHardware: (task) => set(produce(draft => {
        const stagedId = `${task.onCompleteEffect.item}_${Date.now()}`;
        draft.state.stagedHardware.push({ id: stagedId, type: task.onCompleteEffect.item, location: 'Tech Room' });
        get().addEventLog(`Hardware staged: ${task.onCompleteEffect.item}`, 'INFO', 'Tasks');
    })),
    installHardware: (task, itemDetails) => set(produce(draft => {
        const stagedItemIndex = draft.state.stagedHardware.findIndex(h => h.id === task.requiredStaged);
        if (stagedItemIndex === -1) {
            get().addEventLog(`Staged item ${task.requiredStaged} not found for installation.`, 'ERROR', 'Tasks');
            return;
        }
        
        const [stagedItem] = draft.state.stagedHardware.splice(stagedItemIndex, 1);
        const newItem = { id: stagedItem.id, type: stagedItem.type, status: 'INSTALLED' };

        if (itemDetails.type === 'RACK') {
             const slotId = `A${draft.state.nextRackSlot++}`;
             draft.state.dataCenterLayout[slotId] = { ...newItem, contents: [] };
        } else if (task.targetLocation && draft.state.dataCenterLayout[task.targetLocation]) {
             draft.state.dataCenterLayout[task.targetLocation].contents.push(newItem);
        } else {
            get().addEventLog(`Target location ${task.targetLocation} not found for hardware installation.`, 'ERROR', 'Tasks');
            draft.state.stagedHardware.push(stagedItem); // Return item to staged
            return;
        }
        get().addEventLog(`${itemDetails.name} installed in ${task.targetLocation || 'facility'}.`, 'INFO', 'Tasks');
    })),
    bringHardwareOnline: (task) => set(produce(draft => {
        const rack = Object.values(draft.state.dataCenterLayout).find(r => r.contents?.some(d => d.id === task.targetItem));
        if (rack) {
            const device = rack.contents.find(d => d.id === task.targetItem);
            if (device) device.status = 'ONLINE';
        }
    })),
    connectRackToPdu: (task) => set(produce(draft => {
       if(draft.state.dataCenterLayout[task.targetLocation]) {
           draft.state.dataCenterLayout[task.targetLocation].pdu = task.targetPdu;
       }
    })),
    configureLan: (task) => set(produce(draft => {
        const rack = Object.values(draft.state.dataCenterLayout).find(r => r.contents?.some(d => d.id === task.targetItem));
        if (rack) {
            const device = rack.contents.find(d => d.id === task.targetItem);
            if (device) {
                device.status = 'LAN_CONFIGURED';
                device.hostname = task.hostname;
                device.internalIp = task.ip;
                draft.state.nextInternalIp++;
            }
        }
    })),
    configureWan: (task) => set(produce(draft => {
        const rack = Object.values(draft.state.dataCenterLayout).find(r => r.contents?.some(d => d.id === task.targetItem));
        if (rack) {
            const device = rack.contents.find(d => d.id === task.targetItem);
            if (device) {
                device.status = 'NETWORKED';
                device.publicIp = task.publicIp;
                draft.state.network.assignedPublicIps[device.id] = task.publicIp;
            }
        }
    })),

    // --- Task & Employee Management ---
    createTask: (taskDef) => {
        set(produce(draft => {
            const taskId = `task_${Date.now()}`;
            const newTask = { ...taskDef, id: taskId, status: 'Pending', assignedTo: null, completionTime: null };
            
            draft.state.tasks.push(newTask);
        }));
        get().addEventLog(`New task created: ${taskDef.description}`, 'PLAYER');
    },
    abortTask: (taskId) => {
        const task = get().state.tasks.find(t => t.id === taskId);
        if (task) {
            get().addEventLog(`Task aborted: ${task.description}`, 'PLAYER');
            set(produce(draft => {
                const taskIndex = draft.state.tasks.findIndex(t => t.id === taskId);
                if (taskIndex > -1) {
                    const task = draft.state.tasks[taskIndex];
                    if (task.assignedTo) {
                        const employee = draft.state.employees.find(e => e.id === task.assignedTo);
                        if (employee) {
                            employee.status = 'Idle';
                            employee.assignedTaskId = null;
                        }
                    }
                    draft.state.tasks.splice(taskIndex, 1);
                }
            }));
        }
    },
    updateTask: (taskId, updates) => set(produce(draft => {
        const task = draft.state.tasks.find(t => t.id === taskId);
        if (task) Object.assign(task, updates);
    })),
    removeTask: (taskId) => set(produce(draft => {
        draft.state.tasks = draft.state.tasks.filter(t => t.id !== taskId);
    })),
    updateEmployee: (employeeId, updates) => set(produce(draft => {
        const employee = draft.state.employees.find(e => e.id === employeeId);
        if (employee) Object.assign(employee, updates);
    })),
    hireEmployee: (employee) => {
        set(produce(draft => {
            draft.state.employees.push({ ...employee, status: 'Idle', assignedTaskId: null, location: 'Break Room' });
        }));
        get().addEventLog(`${employee.name} has been hired.`, 'PLAYER');
    },

    // --- Core Gameplay Functions ---
    signIspContract: (contract, cidr) => {
        if (get().state.network.ispContract) {
            get().addEventLog("An ISP contract is already active.", "ERROR", "Network");
            return;
        }
        set(produce(draft => {
            const [baseIp, prefix] = cidr.split('/');
            const numAddresses = Math.pow(2, 32 - parseInt(prefix)) - 2;
            const ips = Array.from({ length: numAddresses }, (_, i) => {
                return `198.51.100.${i + 1}`; // Example static IP range
            });

            draft.state.network.ispContract = contract;
            draft.state.network.publicIpBlock = { cidr, ips };
            draft.state.finances.cash -= contract.monthlyCost;
        }));
        get().addEventLog(`Signed contract with ${contract.name}. Leased IP block ${cidr}.`, 'PLAYER');
    },
    acceptContract: (contractId) => {
        if (get().state.activeContracts.includes(contractId)) return;
        const contract = CLIENT_CONTRACTS.find(c => c.id === contractId);
        if (contract) {
            set(produce(draft => {
                draft.state.activeContracts.push(contractId);
                draft.state.finances.monthlyRevenue += contract.monthlyRevenue;
            }));
            get().addEventLog(`Accepted contract: ${contract.name}.`, 'PLAYER');
        }
    },
    toggleGridPower: () => {
        const newStatus = !get().state.power.gridActive;
        get().addEventLog(`City power grid is now ${newStatus ? 'ONLINE' : 'OFFLINE'}.`, 'PLAYER');
        set(produce(draft => { draft.state.power.gridActive = newStatus; }));
    },
    updatePowerAndCooling: (power, cooling, temp) => set(produce(draft => {
        draft.state.power.load = power.totalLoad;
        draft.state.power.capacity = power.totalCapacity;
        draft.state.cooling.load = cooling.totalLoad;
        draft.state.cooling.capacity = cooling.totalCapacity;
        draft.state.serverRoomTemp = temp;
    })),
    
    // --- Scripting & File System ---
    deployDaemon: (serverId, config) => {
        get().addEventLog(`Deployed monitoring daemon to server ${serverId}.`, 'PLAYER');
        set(produce(draft => { draft.state.scripting.daemons[serverId] = config; }));
    },
    removeDaemon: (serverId) => {
        get().addEventLog(`Removed monitoring daemon from server ${serverId}.`, 'PLAYER');
        set(produce(draft => { delete draft.state.scripting.daemons[serverId]; }));
    },
    createFile: (path, content, metadata) => {
        get().addEventLog(`Created file: ${path}`, 'PLAYER');
        set(produce(draft => { draft.state.scripting.fileSystem[path] = { content, ...metadata }; }));
    },
    updateFile: (path, content) => set(produce(draft => {
        if (draft.state.scripting.fileSystem[path]) {
            draft.state.scripting.fileSystem[path].content = content;
        }
    })),
    deleteFile: (path) => {
        get().addEventLog(`Deleted file: ${path}`, 'PLAYER');
        set(produce(draft => { delete draft.state.scripting.fileSystem[path]; }));
    },
    renameFile: (oldPath, newPath) => {
        get().addEventLog(`Renamed file from ${oldPath} to ${newPath}`, 'PLAYER');
        set(produce(draft => {
            if (draft.state.scripting.fileSystem[oldPath]) {
                draft.state.scripting.fileSystem[newPath] = draft.state.scripting.fileSystem[oldPath];
                delete draft.state.scripting.fileSystem[oldPath];
            }
        }));
    },

    addToast: (title, message) => set(produce(draft => {
        const id = `toast_${Date.now()}`;
        draft.state.scripting.toasts.push({ id, title, message });
    })),
    removeToast: (id) => set(produce(draft => {
        draft.state.scripting.toasts = draft.state.scripting.toasts.filter(t => t.id !== id);
    })),
    addAlert: (title, message) => set(produce(draft => {
        const id = `alert_${Date.now()}`;
        draft.state.scripting.alerts.push({ id, title, message });
    })),
    removeAlert: (id) => set(produce(draft => {
        draft.state.scripting.alerts = draft.state.scripting.alerts.filter(a => a.id !== id);
    })),

    // --- Tutorial & Achievements ---
    advanceTutorial: () => set(produce(draft => { draft.state.tutorial.step += 1; })),
    setTutorialTarget: (elementId) => set(produce(draft => { draft.state.tutorial.targetElement = elementId; })),
    unlockAchievement: (achievementId) => {
        const { addToast } = get();
        const achievement = ACHIEVEMENT_DEFINITIONS[achievementId];
        if (achievement && !get().state.achievements.unlocked.includes(achievementId)) {
            set(produce(draft => { draft.state.achievements.unlocked.push(achievementId); }));
            addToast("🏆 Achievement Unlocked!", achievement.title);
        }
    },
}));

export default useGameStore;

