import { create } from 'zustand';
import { HARDWARE_CATALOG, ISP_CONTRACTS, CLIENT_CONTRACTS, SCRIPT_PERMISSIONS, APPS_CONFIG } from '/src/data.js';
import { produce } from 'immer';

// Helper function to handle deep merging of nested objects for loading save games.
const deepMerge = (target, source) => {
    for (const key in source) {
        if (source[key] instanceof Object && key in target && !Array.isArray(source[key])) {
             deepMerge(target[key], source[key]);
        } else {
            target[key] = source[key];
        }
    }
    return target;
};


// Helper to generate a list of usable IPs from a CIDR block notation
const cidrToIpRange = (baseIp, cidrSuffix) => {
    const mask = parseInt(cidrSuffix.replace('/', ''), 10);
    if (isNaN(mask) || mask < 24 || mask > 30) return [];

    const ipParts = baseIp.split('.').map(Number);
    const startIpInt = (ipParts[0] << 24) | (ipParts[1] << 16) | (ipParts[2] << 8) | ipParts[3];
    
    const numAddresses = 1 << (32 - mask);
    const ips = [];

    // We skip network (0) and broadcast (last) addresses
    for (let i = 1; i < numAddresses - 1; i++) {
        const currentIpInt = startIpInt + i;
        const ipStr = [
            (currentIpInt >>> 24) & 255,
            (currentIpInt >>> 16) & 255,
            (currentIpInt >>> 8) & 255,
            currentIpInt & 255
        ].join('.');
        ips.push(ipStr);
    }
    return ips;
};

const initialData = {
    time: new Date(2025, 8, 29, 8, 0, 0),
    lastMonth: 8,
    isPaused: true,
    gameSpeed: 1,
    finances: { cash: 75000, monthlyRevenue: 0, lastBill: 0 },
    inventory: {},
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
    eventLog: [{ id: Date.now(), time: new Date(), message: "System OS booted successfully." }],
    ui: {
        desktopSettings: { 
            theme: 'dark', 
            wallpaper: `url('https://placehold.co/1920x1000/0a1829/1c2a3b?text=DataCenter+OS')` 
        },
        windows: {},
        activeWindowId: null,
        nextZIndex: 10,
        lastWindowId: 0,
    },
    scripting: { 
        agents: {
            'system': { name: 'system', permissions: Object.keys(SCRIPT_PERMISSIONS), isCallable: false }
        }, 
        scripts: {},
        toasts: [],
        alerts: [],
    },
};

const useGameStore = create((set, get) => ({
    state: { ...initialData },

    // --- Window Management Actions ---
    openApp: (appId) => set(produce(draft => {
        const existingWindow = Object.values(draft.state.ui.windows).find(w => w.appId === appId);
        if (existingWindow) {
            if (existingWindow.isMinimized) {
                draft.state.ui.windows[existingWindow.id].isMinimized = false;
            }
            // Use a separate focus call to avoid re-implementing logic
            const currentNextZIndex = draft.state.ui.nextZIndex;
            draft.state.ui.windows[existingWindow.id].zIndex = currentNextZIndex;
            draft.state.ui.nextZIndex = currentNextZIndex + 1;
            draft.state.ui.activeWindowId = existingWindow.id;
            return;
        }

        const newId = `win-${draft.state.ui.lastWindowId + 1}`;
        draft.state.ui.lastWindowId += 1;
        const config = APPS_CONFIG[appId];
        draft.state.ui.windows[newId] = { 
            id: newId, 
            appId, 
            title: config.title, 
            isOpen: true, 
            isMinimized: false, 
            isMaximized: false, 
            zIndex: draft.state.ui.nextZIndex, 
            position: { x: 50 + (draft.state.ui.lastWindowId % 10) * 20, y: 50 + (draft.state.ui.lastWindowId % 10) * 20 }, 
            size: { width: 800, height: 600 } 
        };
        draft.state.ui.nextZIndex += 1;
        draft.state.ui.activeWindowId = newId;
    })),
    closeWindow: (id) => set(produce(draft => {
        delete draft.state.ui.windows[id];
        if (draft.state.ui.activeWindowId === id) {
            draft.state.ui.activeWindowId = null;
        }
    })),
    minimizeWindow: (id) => set(produce(draft => {
        if (draft.state.ui.windows[id]) {
            draft.state.ui.windows[id].isMinimized = true;
            if (draft.state.ui.activeWindowId === id) {
                draft.state.ui.activeWindowId = null;
            }
        }
    })),
    maximizeWindow: (id) => set(produce(draft => {
        if (draft.state.ui.windows[id]) {
            draft.state.ui.windows[id].isMaximized = !draft.state.ui.windows[id].isMaximized;
            // Focus the window when maximizing
            const currentNextZIndex = draft.state.ui.nextZIndex;
            draft.state.ui.windows[id].zIndex = currentNextZIndex;
            draft.state.ui.nextZIndex = currentNextZIndex + 1;
            draft.state.ui.activeWindowId = id;
        }
    })),
    focusWindow: (id) => set(produce(draft => {
        if (draft.state.ui.activeWindowId !== id && draft.state.ui.windows[id]) {
            const currentNextZIndex = draft.state.ui.nextZIndex;
            draft.state.ui.windows[id].zIndex = currentNextZIndex;
            draft.state.ui.nextZIndex = currentNextZIndex + 1;
            draft.state.ui.activeWindowId = id;
        }
    })),
    handleTaskbarClick: (id) => set(produce(draft => {
        const win = draft.state.ui.windows[id];
        if (!win) return;
        if (win.isMinimized) {
            win.isMinimized = false;
        }
        // Always focus the window on taskbar click
        const currentNextZIndex = draft.state.ui.nextZIndex;
        win.zIndex = currentNextZIndex;
        draft.state.ui.nextZIndex = currentNextZIndex + 1;
        draft.state.ui.activeWindowId = id;
    })),

    // --- System & Time ---
    newGame: () => set({ state: { ...initialData, eventLog: [{ id: Date.now(), time: new Date(), message: "New session started." }] } }),
    saveGame: (slotName) => {
        const dataToSave = get().state;
        const stateString = JSON.stringify({ ...dataToSave, time: dataToSave.time.toISOString(), eventLog: dataToSave.eventLog.map(e => ({ ...e, time: e.time.toISOString() })) });
        localStorage.setItem(`datacenter_save_${slotName}`, stateString);
    },
    loadGame: (slotName) => {
        const savedStateJSON = localStorage.getItem(`datacenter_save_${slotName}`);
        if (savedStateJSON) {
            const savedData = JSON.parse(savedStateJSON);
            const wallpaper = localStorage.getItem('datacenter_wallpaper');
            
            const mergedData = deepMerge({ ...initialData }, savedData);

            const rehydratedData = {
                ...mergedData,
                time: new Date(savedData.time || initialData.time),
                eventLog: (savedData.eventLog || []).map(e => ({ ...e, time: new Date(e.time) })),
            };
            if (wallpaper) rehydratedData.ui.desktopSettings.wallpaper = `url(${wallpaper})`;
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
    addEventLog: (message, source = "System") => {
        const logEntry = { id: Date.now() + Math.random(), time: get().state.time, message: `[${source}] ${message}` };
        set(produce(draft => {
            draft.state.eventLog.unshift(logEntry);
            if (draft.state.eventLog.length > 200) draft.state.eventLog.pop();
        }));
    },

    // --- UI Settings ---
    setTheme: (themeName) => set(produce(draft => { draft.state.ui.desktopSettings.theme = themeName; })),
    setWallpaper: (wallpaperUrl) => {
        localStorage.setItem('datacenter_wallpaper', wallpaperUrl);
        set(produce(draft => { draft.state.ui.desktopSettings.wallpaper = `url(${wallpaperUrl})`; }));
    },

    // --- Finances ---
    spendCash: (amount) => set(produce(draft => { draft.state.finances.cash -= amount; })),
    addCash: (amount) => set(produce(draft => { draft.state.finances.cash += amount; })),
    processMonthlyBilling: () => set(produce(draft => {
        const ispCost = draft.state.network.ispContract ? draft.state.network.ispContract.monthlyCost : 0;
        const employeeSalaries = draft.state.employees.reduce((acc, emp) => acc + (emp.salary / 12), 0);
        const powerBill = draft.state.power.totalConsumedKwh * 0.14;
        const totalExpenses = ispCost + employeeSalaries + powerBill;
        const totalRevenue = draft.state.finances.monthlyRevenue;
        
        draft.state.finances.cash += (totalRevenue - totalExpenses);
        draft.state.finances.lastBill = totalExpenses;
        draft.state.power.totalConsumedKwh = 0;
        draft.state.lastMonth = draft.state.time.getMonth();
        get().addEventLog(`Monthly billing processed. Revenue: $${totalRevenue.toFixed(2)}, Expenses: $${totalExpenses.toFixed(2)}`, 'Finance');
    })),

    // --- Inventory & Hardware ---
    addToInventory: (item, count = 1) => set(produce(draft => {
        draft.state.inventory[item.id] = (draft.state.inventory[item.id] || 0) + count;
    })),
    stageHardware: (task) => set(produce(draft => {
        const stagedId = `${task.onCompleteEffect.item}_${Date.now()}`;
        draft.state.stagedHardware.push({ id: stagedId, type: task.onCompleteEffect.item, location: 'Tech Room' });
        get().addEventLog(`Hardware staged: ${task.onCompleteEffect.item}`);
    })),
    installHardware: (task) => set(produce(draft => {
        const stagedItemIndex = draft.state.stagedHardware.findIndex(h => h.id === task.requiredStaged);
        if (stagedItemIndex === -1) return;
        const [stagedItem] = draft.state.stagedHardware.splice(stagedItemIndex, 1);
        const itemDetails = HARDWARE_CATALOG.find(h => h.id === stagedItem.type);
        
        const slotId = `A${draft.state.nextRackSlot++}`;
        const newItem = { id: stagedItem.id, type: stagedItem.type, status: 'INSTALLED', contents: [] };

        if (itemDetails.type === 'RACK') {
             draft.state.dataCenterLayout[slotId] = newItem;
        } else if (task.targetLocation && draft.state.dataCenterLayout[task.targetLocation]) {
             draft.state.dataCenterLayout[task.targetLocation].contents.push(newItem);
        }
        get().addEventLog(`${itemDetails.name} installed.`);
    })),
    bringHardwareOnline: (task) => set(produce(draft => {
        const rack = draft.state.dataCenterLayout[task.targetLocation];
        if (!rack || !rack.contents) return;
        const item = rack.contents.find(i => i.id === task.targetItem);
        if (!item) return;

        const details = HARDWARE_CATALOG.find(h => h.id === item.type);
        if (!details) return;

        item.status = 'ONLINE';
        draft.state.power.load += details.powerDraw || 0;
        draft.state.cooling.load += details.heatOutput || 0;
        get().addEventLog(`${details.name} at ${task.targetLocation} is now ONLINE.`);
    })),
    
    updateEnvironment: ({ powerLoad, coolingLoad, serverRoomTemp }) => set(produce(draft => {
        draft.state.power.load = powerLoad;
        draft.state.cooling.load = coolingLoad;
        draft.state.serverRoomTemp = serverRoomTemp;
    })),

    failHardware: (rackId, itemId) => set(produce(draft => {
        const rack = draft.state.dataCenterLayout[rackId];
        if (!rack || !rack.contents) return;
        const item = rack.contents.find(i => i.id === itemId);
        if (!item) return;

        item.status = 'OFFLINE_FAILED';
        const details = HARDWARE_CATALOG.find(h => h.id === item.type);
        const itemName = details ? details.name : `Device ${itemId.slice(-4)}`;
        
        get().addAlert('Hardware Failure', `${itemName} in rack ${rackId} has failed due to critical conditions!`);
    })),

    connectRackToPdu: (task) => set(produce(draft => {
       if(draft.state.dataCenterLayout[task.targetLocation]) {
           draft.state.dataCenterLayout[task.targetLocation].pdu = task.targetPdu;
       }
    })),

    // --- Task & Employee Management ---
    createTask: (taskDef) => set(produce(draft => {
        const taskId = `task_${Date.now()}`;
        const newTask = { ...taskDef, id: taskId, status: 'Pending', assignedTo: null, completionTime: null };
        
        if (taskDef.requiredHardware) {
            for (const [itemId, count] of Object.entries(taskDef.requiredHardware)) {
                if (draft.state.inventory[itemId] >= count) {
                    draft.state.inventory[itemId] -= count;
                } else {
                    get().addEventLog(`Not enough ${itemId} in inventory.`, "Error");
                    return;
                }
            }
        }
        draft.state.tasks.push(newTask);
        get().addEventLog(`New task created: ${taskDef.description}`);
    })),
    abortTask: (taskId) => set(produce(draft => {
        const taskIndex = draft.state.tasks.findIndex(t => t.id === taskId);
        if (taskIndex === -1) return;

        const [task] = draft.state.tasks.splice(taskIndex, 1);

        if (task.assignedTo) {
            const employee = draft.state.employees.find(e => e.id === task.assignedTo);
            if (employee) {
                employee.status = 'Idle';
                employee.assignedTaskId = null;
            }
        }

        if (task.requiredHardware) {
            for (const [itemId, count] of Object.entries(task.requiredHardware)) {
                draft.state.inventory[itemId] = (draft.state.inventory[itemId] || 0) + count;
            }
        }
        
        get().addEventLog(`Task aborted: ${task.description}`);
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
        get().addEventLog(`${employee.name} has been hired.`);
    })),

    // --- Core Gameplay Functions ---
    signIspContract: (contract, cidr) => set(produce(draft => {
        if (draft.state.network.ispContract) {
            get().addEventLog(`An ISP contract is already active.`, "Error");
            return;
        }
        if (draft.state.finances.cash < contract.monthlyCost) {
            get().addEventLog(`Not enough cash to sign contract with ${contract.name}.`, "Error");
            return;
        }

        draft.state.finances.cash -= contract.monthlyCost;
        draft.state.network.ispContract = contract;
        
        const baseIp = '198.51.100.0';
        const ips = cidrToIpRange(baseIp, cidr);
        draft.state.network.publicIpBlock = { cidr: `${baseIp}${cidr}`, ips };

        get().addEventLog(`Signed contract with ${contract.name}. Leased public IP block: ${baseIp}${cidr}.`);
    })),
    acceptContract: (contractId) => set(produce(draft => {
        if (draft.state.activeContracts.includes(contractId)) return;
        
        const contract = CLIENT_CONTRACTS.find(c => c.id === contractId);
        if (!contract) return;

        draft.state.activeContracts.push(contractId);
        draft.state.finances.monthlyRevenue += contract.monthlyRevenue;
        get().addEventLog(`Accepted contract: ${contract.name}. Monthly revenue increased by $${contract.monthlyRevenue.toLocaleString()}.`);
    })),
    toggleGridPower: () => set(produce(draft => {
        draft.state.power.gridActive = !draft.state.power.gridActive;
        get().addEventLog(`City power grid connection is now ${draft.state.power.gridActive ? 'ONLINE' : 'OFFLINE'}.`);
    })),
    
    // --- Scripting System ---
    createScriptAgent: (name) => set(produce(draft => {
        if (draft.state.scripting.agents[name]) {
            get().addEventLog(`Agent '${name}' already exists.`, 'ScriptError');
            return;
        }
        draft.state.scripting.agents[name] = { name, permissions: [], isCallable: false };
        get().addEventLog(`Script agent '${name}' created.`, 'Automation');
    })),
    deleteScriptAgent: (name) => set(produce(draft => {
        if (name === 'system') {
            get().addEventLog(`Cannot delete the 'system' agent.`, 'ScriptError');
            return;
        }
        if (!draft.state.scripting.agents[name]) return;

        delete draft.state.scripting.agents[name];
        
        for (const scriptId in draft.state.scripting.scripts) {
            if (draft.state.scripting.scripts[scriptId].agentName === name) {
                delete draft.state.scripting.scripts[scriptId];
            }
        }
        get().addEventLog(`Script agent '${name}' and all associated scripts have been deleted.`, 'Automation');
    })),
    setAgentCallable: (name, isCallable) => set(produce(draft => {
        const agent = draft.state.scripting.agents[name];
        if (agent) agent.isCallable = isCallable;
    })),
    updateAgentPermissions: (name, permissions) => set(produce(draft => {
        const agent = draft.state.scripting.agents[name];
        if (agent) agent.permissions = permissions;
    })),
    createScript: (agentName, scriptName) => set(produce(draft => {
        const scriptId = `script_${Date.now()}`;
        draft.state.scripting.scripts[scriptId] = {
            id: scriptId,
            agentName: agentName,
            name: scriptName,
            content: '# Your script here...\n',
            status: 'paused',
            interval: 10,
            lastRunTime: null,
        };
        get().addEventLog(`New script '${scriptName}' created for agent '${agentName}'.`, 'Automation');
    })),
    updateScript: (id, updates) => set(produce(draft => {
        const script = draft.state.scripting.scripts[id];
        if (script) {
            Object.assign(script, updates);
        }
    })),
    deleteScript: (id) => set(produce(draft => {
        if (draft.state.scripting.scripts[id]) {
            delete draft.state.scripting.scripts[id];
        }
    })),
    addToast: (title, message) => set(produce(draft => {
        const toastId = `toast_${Date.now() + Math.random()}`;
        draft.state.scripting.toasts.push({ id: toastId, title, message });
    })),
    removeToast: (id) => set(produce(draft => {
        draft.state.scripting.toasts = draft.state.scripting.toasts.filter(t => t.id !== id);
    })),
    addAlert: (title, message) => set(produce(draft => {
        const alertId = `alert_${Date.now() + Math.random()}`;
        draft.state.scripting.alerts.push({ id: alertId, title, message });
    })),
    removeAlert: (id) => set(produce(draft => {
        draft.state.scripting.alerts = draft.state.scripting.alerts.filter(a => a.id !== id);
    })),
}));

export default useGameStore;

