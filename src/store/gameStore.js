import { create } from 'zustand';
import { produce } from 'immer';
import { HARDWARE_CATALOG, ISP_CONTRACTS, CLIENT_CONTRACTS, SCRIPT_PERMISSIONS, APPS_CONFIG, GRID_POWER_COST_PER_KWH, TASK_DEFINITIONS, ACHIEVEMENT_DEFINITIONS } from '../data.js';
import { playSound } from '../game/soundManager.js';

// Helper function to create a fresh initial state
const createInitialState = () => ({
    time: new Date(2025, 8, 29, 8, 0, 0),
    lastMonth: 8,
    isPaused: true,
    isBooted: false,
    gameSpeed: 1,
    hasCrashed: false,
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
            wallpaper: `url('https://placehold.co/1920x1080/0a1829/1c2a3b?text=DataCenter+OS')`
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
        fileSystem: {},
        daemons: {},
        toasts: [],
        alerts: [],
    },
    tutorial: {
        isActive: true,
        step: 0,
        targetElement: null,
        steps: [
            { text: "Welcome to DataCenter OS. First, let's hire a technician to help us. Open the TeamView app.", trigger: { action: 'openApp', appId: 'TeamView' }, target: 'icon-TeamView' },
            { text: "Great. Now hire Alex Chen. You'll need him for hardware tasks.", trigger: { action: 'hireEmployee', employeeId: 'emp_001' }, target: null },
            { text: "Next, we need a server rack. Open the OrderUp app to buy one.", trigger: { action: 'openApp', appId: 'OrderUp' }, target: 'icon-OrderUp' },
            { text: "Purchase a 'Standard Server Rack'.", trigger: { action: 'purchaseItem', itemId: 'rack_std_01' }, target: null },
            { text: "Good. Now, open TaskRunner to manage jobs.", trigger: { action: 'openApp', appId: 'TaskRunner' }, target: 'icon-TaskRunner' },
            { text: "Finally, schedule the 'Install Server Rack' task. Your technician will take it from there.", trigger: { action: 'createTask', taskId: 'install_rack' }, target: null },
            { text: "You're all set! The tutorial is complete. Good luck.", trigger: { action: 'end' }, target: null },
        ]
    },
    achievements: {
        unlocked: [],
    }
});


// Helper function for deep merging states, crucial for loading games.
const deepMerge = (target, source) => {
    for (const key in source) {
        if (source.hasOwnProperty(key)) {
            if (source[key] instanceof Object && key in target && target[key] instanceof Object) {
                deepMerge(target[key], source[key]);
            } else {
                target[key] = source[key];
            }
        }
    }
    return target;
};


const useGameStore = create((set, get) => ({
    // All state is nested under a 'state' property
    state: createInitialState(),

    // --- System & Time ---
    newGame: () => {
        playSound('ui_click');
        set({ state: { ...createInitialState(), isBooted: true, tutorial: { ...createInitialState().tutorial, isActive: true }, eventLog: [{ id: Date.now(), time: new Date(), source: 'System', level: 'PLAYER', message: "New session started." }] } });
    },
    saveGame: (slotName) => {
        const dataToSave = get().state; 
        const stateString = JSON.stringify({ ...dataToSave, time: dataToSave.time.toISOString(), eventLog: dataToSave.eventLog.map(e => ({ ...e, time: e.time.toISOString() })) });
        localStorage.setItem(`datacenter_save_${slotName}`);
        get().addEventLog(`Session saved as "${slotName}".`, 'System', 'PLAYER');
    },
    loadGame: (slotName) => {
        playSound('ui_click');
        const savedStateJSON = localStorage.getItem(`datacenter_save_${slotName}`);
        if (savedStateJSON) {
            const savedData = JSON.parse(savedStateJSON);
            const wallpaper = localStorage.getItem('datacenter_wallpaper');
            let freshState = createInitialState();
            
            // This ensures new properties in freshState are kept if not in savedData
            const mergedData = deepMerge(freshState, savedData);

            const rehydratedData = {
                ...mergedData,
                isBooted: true,
                time: new Date(savedData.time || freshState.time),
                eventLog: (savedData.eventLog || []).map(e => ({ ...e, time: new Date(e.time) })),
                // Ensure tutorial is off for loaded games
                tutorial: { ...mergedData.tutorial, isActive: false },
            };
            if (wallpaper) rehydratedData.ui.desktopSettings.wallpaper = wallpaper;

            // Migration for old saves from before the file system update
            if (savedData.scripting && savedData.scripting.scripts && !savedData.scripting.fileSystem) {
                rehydratedData.scripting.fileSystem = {};
                Object.values(savedData.scripting.scripts).forEach(script => {
                    const path = `/home/${script.agentName}/${script.name}.js`;
                    rehydratedData.scripting.fileSystem[path] = { ...script, path };
                });
            }
            
            set({ state: rehydratedData });
            get().addEventLog(`Session "${slotName}" loaded.`, 'System', 'PLAYER');
        }
    },
    advanceTime: (seconds) => set(produce(draft => {
        const newTime = new Date(draft.state.time);
        newTime.setSeconds(newTime.getSeconds() + seconds);
        draft.state.time = newTime;
        const kwhConsumedThisTick = (draft.state.power.load / 1000) * (seconds / 3600);
        draft.state.power.totalConsumedKwh += kwhConsumedThisTick;
    })),
    togglePause: () => set(produce(draft => { 
        playSound('ui_click');
        draft.state.isPaused = !draft.state.isPaused; 
    })),
    setGameSpeed: (speed) => set(produce(draft => { 
        playSound('ui_click');
        draft.state.gameSpeed = speed; 
    })),
    addEventLog: (message, source = "System", level = "INFO") => {
        const logEntry = { id: Date.now() + Math.random(), time: new Date(get().state.time), source, level, message: `[${source}] ${message}` };
        set(produce(draft => {
            draft.state.eventLog.unshift(logEntry);
            if (draft.state.eventLog.length > 200) draft.state.eventLog.pop();
        }));
    },
    triggerBSOD: () => set(produce(draft => { draft.state.hasCrashed = true; })),
    reboot: () => window.location.reload(),
    
    // --- UI State Management ---
    openApp: (appId) => set(produce(draft => {
        const existingWindow = Object.values(draft.state.ui.windows).find(w => w.appId === appId);
        if (existingWindow) {
            if (existingWindow.isMinimized) {
                existingWindow.isMinimized = false;
            }
            get().focusWindow(existingWindow.id); 
            playSound('window_open');
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
        playSound('window_open');
        get().addEventLog(`Opened app: ${appId}`, 'Player', 'PLAYER');
    })),
    closeWindow: (id) => set(produce(draft => {
        delete draft.state.ui.windows[id];
        if (draft.state.ui.activeWindowId === id) draft.state.ui.activeWindowId = null;
        playSound('window_close');
    })),
    minimizeWindow: (id) => set(produce(draft => {
        if (draft.state.ui.windows[id]) {
            draft.state.ui.windows[id].isMinimized = true;
        }
        if (draft.state.ui.activeWindowId === id) draft.state.ui.activeWindowId = null;
        playSound('window_close');
    })),
    maximizeWindow: (id) => set(produce(draft => {
        if (draft.state.ui.windows[id]) {
            draft.state.ui.windows[id].isMaximized = !draft.state.ui.windows[id].isMaximized;
        }
        get().focusWindow(id);
        playSound('ui_click');
    })),
    focusWindow: (id) => set(produce(draft => {
        if (!draft.state.ui.windows[id] || draft.state.ui.activeWindowId === id) return;

        draft.state.ui.windows[id].zIndex = draft.state.ui.nextZIndex;
        draft.state.ui.nextZIndex += 1;
        draft.state.ui.activeWindowId = id;
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
    setTheme: (themeName) => set(produce(draft => { draft.state.ui.desktopSettings.theme = themeName; get().addEventLog(`Theme set to ${themeName}`, 'Player', 'PLAYER'); })),
    setAccentColor: (colorName) => set(produce(draft => { draft.state.ui.desktopSettings.accentColor = colorName; get().addEventLog(`Accent color set to ${colorName}`, 'Player', 'PLAYER'); })),
    setTaskbarPosition: (position) => set(produce(draft => { draft.state.ui.desktopSettings.taskbarPosition = position; get().addEventLog(`Taskbar position set to ${position}`, 'Player', 'PLAYER'); })),
    setWallpaper: (wallpaperUrl) => {
        localStorage.setItem('datacenter_wallpaper', wallpaperUrl);
        set(produce(draft => { draft.state.ui.desktopSettings.wallpaper = wallpaperUrl; }));
        get().addEventLog(`Wallpaper changed.`, 'Player', 'PLAYER');
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
        get().addEventLog(`Monthly billing processed. Revenue: $${totalRevenue.toFixed(2)}, Expenses: $${totalExpenses.toFixed(2)}`, 'Finance');
    })),

    // --- Inventory & Hardware ---
    purchaseAndStageItem: (item, quantity) => set(produce(draft => {
        const totalCost = item.price * quantity;
        if (draft.state.finances.cash >= totalCost) {
            draft.state.finances.cash -= totalCost;
            for (let i = 0; i < quantity; i++) {
                const stagedId = `${item.id}_${Date.now() + i}`;
                draft.state.stagedHardware.push({ id: stagedId, type: item.id, location: 'Tech Room' });
            }
            get().addEventLog(`Purchased ${quantity}x ${item.name}.`, 'Player', 'PLAYER');
            if(get().state.tutorial.isActive && get().state.tutorial.steps[get().state.tutorial.step]?.trigger.action === 'purchaseItem') {
                get().advanceTutorial();
            }
        }
    })),
    stageHardware: (task) => set(produce(draft => {
        const stagedId = `${task.onCompleteEffect.item}_${Date.now()}`;
        draft.state.stagedHardware.push({ id: stagedId, type: task.onCompleteEffect.item, location: 'Tech Room' });
        get().addEventLog(`Hardware staged: ${task.onCompleteEffect.item}`, 'System', 'INFO');
    })),
    installHardware: (task, itemDetails) => set(produce(draft => {
        const stagedItemIndex = draft.state.stagedHardware.findIndex(h => h.id === task.requiredStaged);
        if (stagedItemIndex === -1) {
            get().addEventLog(`Staged item ${task.requiredStaged} not found for installation.`, 'System', 'ERROR');
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
            get().addEventLog(`Target location ${task.targetLocation} not found for hardware installation.`, 'System', 'ERROR');
            draft.state.stagedHardware.push(stagedItem); // Return item to staged
            return;
        }
        get().addEventLog(`${itemDetails.name} installed.`, 'System', 'INFO');
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
    createTask: (taskDef) => set(produce(draft => {
        const taskId = `task_${Date.now()}`;
        const newTask = { ...taskDef, id: taskId, status: 'Pending', assignedTo: null, completionTime: null };
        draft.state.tasks.push(newTask);
        get().addEventLog(`New task created: ${taskDef.description}`, 'Player', 'PLAYER');
        if(get().state.tutorial.isActive && get().state.tutorial.steps[get().state.tutorial.step]?.trigger.action === 'createTask') {
            get().advanceTutorial();
        }
    })),
    abortTask: (taskId) => set(produce(draft => {
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
            get().addEventLog(`Task aborted: ${task.description}`, 'Player', 'PLAYER');
        }
    })),
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
    hireEmployee: (employee) => set(produce(draft => {
        draft.state.employees.push({ ...employee, status: 'Idle', assignedTaskId: null, location: 'Break Room' });
        get().addEventLog(`${employee.name} has been hired.`, 'Player', 'PLAYER');
         if(get().state.tutorial.isActive && get().state.tutorial.steps[get().state.tutorial.step]?.trigger.action === 'hireEmployee') {
            get().advanceTutorial();
        }
    })),

    // --- Core Gameplay Functions ---
    signIspContract: (contract, cidr) => set(produce(draft => {
        if (draft.state.network.ispContract) {
            get().addEventLog("An ISP contract is already active.", "System", "ERROR");
            return;
        }
        const [baseIp, prefix] = cidr.split('/');
        const numAddresses = Math.pow(2, 32 - parseInt(prefix)) - 2;
        const ips = Array.from({ length: numAddresses }, (_, i) => {
            const ipParts = baseIp.split('.').map(Number);
            ipParts[3] += (i + 1);
            return ipParts.join('.');
        });

        draft.state.network.ispContract = contract;
        draft.state.network.publicIpBlock = { cidr, ips };
        draft.state.finances.cash -= contract.monthlyCost;
        get().addEventLog(`Signed contract with ${contract.name}. Leased IP block ${cidr}.`, "Network");
    })),
    acceptContract: (contractId) => set(produce(draft => {
        if (draft.state.activeContracts.includes(contractId)) return;
        const contract = CLIENT_CONTRACTS.find(c => c.id === contractId);
        if (contract) {
            draft.state.activeContracts.push(contractId);
            draft.state.finances.monthlyRevenue += contract.monthlyRevenue;
            get().addEventLog(`Accepted contract: ${contract.name}.`, 'Client');
        }
    })),
    toggleGridPower: () => set(produce(draft => {
        draft.state.power.gridActive = !draft.state.power.gridActive;
        get().addEventLog(`City power grid is now ${draft.state.power.gridActive ? 'ONLINE' : 'OFFLINE'}.`, 'Power');
    })),
    updatePowerAndCooling: (power, cooling, temp) => set(produce(draft => {
        draft.state.power.load = power.totalLoad;
        draft.state.power.capacity = power.totalCapacity;
        draft.state.cooling.load = cooling.totalLoad;
        draft.state.cooling.capacity = cooling.totalCapacity;
        draft.state.serverRoomTemp = temp;
    })),
    
    // --- Scripting System ---
    createScriptAgent: (name) => set(produce(draft => {
        if (!draft.state.scripting.agents[name]) {
            draft.state.scripting.agents[name] = { name, permissions: [], isCallable: false };
        }
    })),
    deleteScriptAgent: (name) => set(produce(draft => {
        if (name === 'system') return;
        delete draft.state.scripting.agents[name];
        // Also delete files associated with this agent
        const newFileSystem = {};
        for (const path in draft.state.scripting.fileSystem) {
            if (!path.startsWith(`/home/${name}/`)) {
                newFileSystem[path] = draft.state.scripting.fileSystem[path];
            }
        }
        draft.state.scripting.fileSystem = newFileSystem;
    })),
    setAgentCallable: (name, isCallable) => set(produce(draft => {
        if (draft.state.scripting.agents[name]) {
            draft.state.scripting.agents[name].isCallable = isCallable;
        }
    })),
    updateAgentPermissions: (name, permissions) => set(produce(draft => {
        if (draft.state.scripting.agents[name]) {
            draft.state.scripting.agents[name].permissions = permissions;
        }
    })),
    createFile: (path, metadata) => set(produce(draft => {
        if (!draft.state.scripting.fileSystem[path]) {
            draft.state.scripting.fileSystem[path] = {
                path,
                content: `# New script at ${path}\n`,
                status: 'paused',
                interval: 60,
                lastRunTime: null,
                ...metadata
            };
        }
    })),
    updateFile: (path, updates) => set(produce(draft => {
        if (draft.state.scripting.fileSystem[path]) {
            Object.assign(draft.state.scripting.fileSystem[path], updates);
        }
    })),
    deleteFile: (path) => set(produce(draft => {
        delete draft.state.scripting.fileSystem[path];
    })),
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

    // --- Daemon Manager ---
    deployDaemon: (serverId, config) => set(produce(draft => {
        draft.state.scripting.daemons[serverId] = config;
        get().addEventLog(`Monitoring daemon deployed to ${serverId}.`, 'Player', 'PLAYER');
    })),
    removeDaemon: (serverId) => set(produce(draft => {
        delete draft.state.scripting.daemons[serverId];
        get().addEventLog(`Monitoring daemon removed from ${serverId}.`, 'Player', 'PLAYER');
    })),

    // --- Tutorial ---
    advanceTutorial: () => set(produce(draft => {
        playSound('ui_click');
        const nextStep = draft.state.tutorial.step + 1;
        if (nextStep < draft.state.tutorial.steps.length) {
            draft.state.tutorial.step = nextStep;
            if (draft.state.tutorial.steps[nextStep].trigger.action === 'end') {
                draft.state.tutorial.isActive = false;
            }
        } else {
            draft.state.tutorial.isActive = false;
        }
    })),

    // --- Achievements ---
    unlockAchievement: (id) => set(produce(draft => {
        if (!draft.state.achievements.unlocked.includes(id)) {
            draft.state.achievements.unlocked.push(id);
            const achievement = ACHIEVEMENT_DEFINITIONS.find(a => a.id === id);
            if (achievement) {
                get().addToast("Achievement Unlocked!", achievement.title);
            }
        }
    })),
}));

export default useGameStore;

