import { create } from 'zustand';
import { produce } from 'immer';
import { HARDWARE_CATALOG, ISP_CONTRACTS, CLIENT_CONTRACTS, SCRIPT_PERMISSIONS, APPS_CONFIG, GRID_POWER_COST_PER_KWH } from '/src/data.js';

// Helper function to create a fresh initial state
const createInitialState = () => {
    const initialIcons = Object.keys(APPS_CONFIG).map((appId, index) => ({
        appId,
        position: { x: 20, y: 20 + index * 90 },
    }));

    return {
        time: new Date(2025, 8, 29, 8, 0, 0),
        lastMonth: 8,
        isPaused: true,
        isBooted: false,
        gameSpeed: 1,
        finances: { cash: 75000, monthlyRevenue: 0, lastBill: 0 },
        inventory: {}, // Inventory is now obsolete but kept for save game compatibility for now.
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
            desktopIcons: initialIcons,
            windows: {},
            activeWindowId: null,
            nextZIndex: 10,
            lastWindowId: 0,
        },
        scripting: {
            agents: { 'system': { name: 'system', permissions: Object.keys(SCRIPT_PERMISSIONS), isCallable: false } },
            scripts: {},
            toasts: [],
            alerts: [],
        },
    }
};


// Helper function for deep merging states, crucial for loading games.
const deepMerge = (target, source) => {
    for (const key in source) {
        if (source[key] instanceof Object && key in target && target[key] instanceof Object) {
            deepMerge(target[key], source[key]);
        } else {
            target[key] = source[key];
        }
    }
    return target;
};


const useGameStore = create((set, get) => ({
    // --- THE FIX: All state is now nested under a 'state' property ---
    state: createInitialState(),

    // --- System & Time ---
    newGame: () => set({ state: { ...createInitialState(), isBooted: true, eventLog: [{ id: Date.now(), time: new Date(), message: "New session started." }] } }),
    saveGame: (slotName) => {
        const dataToSave = get().state; // Read from state
        const stateString = JSON.stringify({ ...dataToSave, time: dataToSave.time.toISOString(), eventLog: dataToSave.eventLog.map(e => ({ ...e, time: e.time.toISOString() })) });
        localStorage.setItem(`datacenter_save_${slotName}`, stateString);
    },
    loadGame: (slotName) => {
        const savedStateJSON = localStorage.getItem(`datacenter_save_${slotName}`);
        if (savedStateJSON) {
            const savedData = JSON.parse(savedStateJSON);
            const wallpaper = localStorage.getItem('datacenter_wallpaper');
            let freshState = createInitialState();
            const mergedData = deepMerge(freshState, savedData);

            const rehydratedData = {
                ...mergedData,
                isBooted: true,
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
    addEventLog: (message, source = "System") => {
        const logEntry = { id: Date.now() + Math.random(), time: get().state.time, message: `[${source}] ${message}` };
        set(produce(draft => {
            draft.state.eventLog.unshift(logEntry);
            if (draft.state.eventLog.length > 200) draft.state.eventLog.pop();
        }));
    },
    
    // --- UI State Management ---
    openApp: (appId) => set(produce(draft => {
        const existingWindow = Object.values(draft.state.ui.windows).find(w => w.appId === appId);
        if (existingWindow) {
            if (existingWindow.isMinimized) {
                existingWindow.isMinimized = false;
            }
            get().focusWindow(existingWindow.id); 
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
    })),
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
        get().focusWindow(id);
    })),
    focusWindow: (id) => set(produce(draft => {
        if (!draft.state.ui.windows[id]) return;

        if (draft.state.ui.activeWindowId !== id) {
            draft.state.ui.windows[id].zIndex = draft.state.ui.nextZIndex;
            draft.state.ui.nextZIndex += 1;
            draft.state.ui.activeWindowId = id;
        }
    })),
    setTheme: (themeName) => set(produce(draft => { draft.state.ui.desktopSettings.theme = themeName; })),
    setWallpaper: (wallpaperUrl) => {
        localStorage.setItem('datacenter_wallpaper', wallpaperUrl);
        set(produce(draft => { draft.state.ui.desktopSettings.wallpaper = wallpaperUrl; }));
    },
    updateWindowState: (id, updates) => set(produce(draft => {
        if (draft.state.ui.windows[id]) {
            if (updates.position) draft.state.ui.windows[id].position = updates.position;
            if (updates.size) draft.state.ui.windows[id].size = updates.size;
        }
    })),
    updateIconPosition: (appId, position) => set(produce(draft => {
        const icon = draft.state.ui.desktopIcons.find(icon => icon.appId === appId);
        if (icon) {
            icon.position = position;
        }
    })),
    
    // --- Finances ---
    spendCash: (amount) => set(produce(draft => { draft.state.finances.cash -= amount; })),
    addCash: (amount) => set(produce(draft => { draft.state.finances.cash += amount; })),
    purchaseAndStageItem: (item, quantity) => set(produce(draft => {
        const totalCost = item.price * quantity;
        if (draft.state.finances.cash >= totalCost) {
            draft.state.finances.cash -= totalCost;
            for (let i = 0; i < quantity; i++) {
                const stagedId = `${item.id}_${Date.now() + i}`;
                draft.state.stagedHardware.push({ id: stagedId, type: item.id, location: 'Tech Room' });
            }
            get().addEventLog(`Purchased and staged ${quantity} x ${item.name}.`, 'Commerce');
        } else {
            get().addEventLog(`Purchase failed. Not enough cash for ${quantity} x ${item.name}.`, 'Error');
        }
    })),
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
    // addToInventory is no longer used for purchases, but kept for save game compatibility
    addToInventory: (item, count = 1) => set(produce(draft => {
        draft.state.inventory[item.id] = (draft.state.inventory[item.id] || 0) + count;
    })),
    stageHardware: (task) => set(produce(draft => {
        const stagedId = `${task.onCompleteEffect.item}_${Date.now()}`;
        draft.state.stagedHardware.push({ id: stagedId, type: task.onCompleteEffect.item, location: 'Tech Room' });
        get().addEventLog(`Hardware staged: ${task.onCompleteEffect.item}`);
    })),
    installHardware: (task, itemDetails) => set(produce(draft => {
        const stagedItemIndex = draft.state.stagedHardware.findIndex(h => h.id === task.requiredStaged);
        if (stagedItemIndex === -1) {
            get().addEventLog(`Staged item ${task.requiredStaged} not found for installation.`, 'Error');
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
            get().addEventLog(`Target location ${task.targetLocation} not found for hardware installation.`, 'Error');
            draft.state.stagedHardware.push(stagedItem); // Return item to staged
            return;
        }
        get().addEventLog(`${itemDetails.name} installed.`);
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
            get().addEventLog(`Task aborted: ${task.description}`);
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
        get().addEventLog(`${employee.name} has been hired.`);
    })),

    // --- Core Gameplay Functions ---
    signIspContract: (contract, cidr) => set(produce(draft => {
        if (draft.state.network.ispContract) {
            get().addEventLog("An ISP contract is already active.", "Error");
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
        draft.state.scripting.scripts = Object.fromEntries(Object.entries(draft.state.scripting.scripts).filter(([_, s]) => s.agentName !== name));
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
    createScript: (agentName, scriptName) => set(produce(draft => {
        const id = `script_${Date.now()}`;
        draft.state.scripting.scripts[id] = {
            id,
            agentName,
            name: scriptName,
            content: `# ${scriptName} for ${agentName}\n\n`,
            status: 'paused',
            interval: 60,
            lastRunTime: null,
        };
    })),
    updateScript: (id, updates) => set(produce(draft => {
        if (draft.state.scripting.scripts[id]) {
            Object.assign(draft.state.scripting.scripts[id], updates);
        }
    })),
    deleteScript: (id) => set(produce(draft => {
        delete draft.state.scripting.scripts[id];
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
}));

export default useGameStore;

