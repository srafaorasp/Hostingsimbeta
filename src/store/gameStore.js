import { create } from 'zustand';
import { HARDWARE_CATALOG, ISP_CONTRACTS, CLIENT_CONTRACTS } from '/src/data.js';
import { produce } from 'immer';

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
    nextRackSlot: 1, // Restored missing property
    power: { capacity: 0, load: 0, gridActive: true, totalConsumedKwh: 0 },
    cooling: { capacity: 0, load: 0 },
    serverRoomTemp: 21.0,
    network: { capacity: 0, load: 0, ispContract: null, publicIpBlock: null, assignedPublicIps: {} },
    nextInternalIp: 10,
    activeContracts: [],
    eventLog: [{ id: Date.now(), time: new Date(), message: "System OS booted successfully." }],
    uiSettings: { theme: 'dark', wallpaper: `url('https://placehold.co/1920x1000/0a1829/1c2a3b?text=DataCenter+OS')` },
    scripting: { 
        agents: {}, 
        scripts: {},
        toasts: [],
        alerts: [],
    },
};

const useGameStore = create((set, get) => ({
    state: { ...initialData },

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
            const mergedData = { ...initialData, ...savedData };
            const rehydratedData = {
                ...mergedData,
                time: new Date(savedData.time || initialData.time),
                eventLog: (savedData.eventLog || []).map(e => ({ ...e, time: new Date(e.time) })),
            };
            if (wallpaper) rehydratedData.uiSettings.wallpaper = `url(${wallpaper})`;
            set({ state: rehydratedData });
        }
    },
    advanceTime: (seconds) => set(produce(draft => {
        const newTime = new Date(draft.time);
        newTime.setSeconds(newTime.getSeconds() + seconds);
        draft.time = newTime;
        const kwhConsumedThisTick = (draft.power.load / 1000) * (seconds / 3600);
        draft.power.totalConsumedKwh += kwhConsumedThisTick;
    })),
    togglePause: () => set(produce(draft => { draft.isPaused = !draft.isPaused; })),
    setGameSpeed: (speed) => set(produce(draft => { draft.gameSpeed = speed; })),
    addEventLog: (message, source = "System") => {
        const logEntry = { id: Date.now() + Math.random(), time: get().state.time, message: `[${source}] ${message}` };
        set(produce(draft => {
            draft.eventLog.unshift(logEntry);
            if (draft.eventLog.length > 200) draft.eventLog.pop();
        }));
    },

    // --- UI Settings ---
    setTheme: (themeName) => set(produce(draft => { draft.uiSettings.theme = themeName; })),
    setWallpaper: (wallpaperUrl) => {
        localStorage.setItem('datacenter_wallpaper', wallpaperUrl);
        set(produce(draft => { draft.uiSettings.wallpaper = `url(${wallpaperUrl})`; }));
    },

    // --- Finances ---
    spendCash: (amount) => set(produce(draft => { draft.finances.cash -= amount; })),
    addCash: (amount) => set(produce(draft => { draft.finances.cash += amount; })),
    processMonthlyBilling: () => set(produce(draft => {
        const ispCost = draft.network.ispContract ? draft.network.ispContract.monthlyCost : 0;
        const employeeSalaries = draft.employees.reduce((acc, emp) => acc + (emp.salary / 12), 0);
        const powerBill = draft.power.totalConsumedKwh * 0.14;
        const totalExpenses = ispCost + employeeSalaries + powerBill;
        const totalRevenue = draft.finances.monthlyRevenue;
        
        draft.finances.cash += (totalRevenue - totalExpenses);
        draft.finances.lastBill = totalExpenses;
        draft.power.totalConsumedKwh = 0;
        draft.lastMonth = draft.time.getMonth();
        get().addEventLog(`Monthly billing processed. Revenue: $${totalRevenue.toFixed(2)}, Expenses: $${totalExpenses.toFixed(2)}`, 'Finance');
    })),

    // --- Inventory & Hardware ---
    addToInventory: (item, count = 1) => set(produce(draft => {
        draft.inventory[item.id] = (draft.inventory[item.id] || 0) + count;
    })),
    stageHardware: (task) => set(produce(draft => {
        const stagedId = `${task.onCompleteEffect.item}_${Date.now()}`;
        draft.stagedHardware.push({ id: stagedId, type: task.onCompleteEffect.item, location: 'Tech Room' });
        get().addEventLog(`Hardware staged: ${task.onCompleteEffect.item}`);
    })),
    installHardware: (task) => set(produce(draft => {
        const stagedItemIndex = draft.stagedHardware.findIndex(h => h.id === task.requiredStaged);
        if (stagedItemIndex === -1) return;
        const [stagedItem] = draft.stagedHardware.splice(stagedItemIndex, 1);
        const itemDetails = HARDWARE_CATALOG.find(h => h.id === stagedItem.type);
        
        // --- THE FIX: Use the correct top-level nextRackSlot property ---
        const slotId = `A${draft.nextRackSlot++}`;
        const newItem = { id: stagedItem.id, type: stagedItem.type, status: 'INSTALLED', contents: [] };

        if (itemDetails.type === 'RACK') {
             draft.dataCenterLayout[slotId] = newItem;
        } else if (task.targetLocation && draft.dataCenterLayout[task.targetLocation]) {
             draft.dataCenterLayout[task.targetLocation].contents.push(newItem);
        }
        get().addEventLog(`${itemDetails.name} installed.`);
    })),
    bringHardwareOnline: (task) => set(produce(draft => {
        // ...
    })),
    connectRackToPdu: (task) => set(produce(draft => {
       if(draft.dataCenterLayout[task.targetLocation]) {
           draft.dataCenterLayout[task.targetLocation].pdu = task.targetPdu;
       }
    })),

    // --- Task & Employee Management ---
    createTask: (taskDef) => set(produce(draft => {
        const taskId = `task_${Date.now()}`;
        const newTask = { ...taskDef, id: taskId, status: 'Pending', assignedTo: null, completionTime: null };
        
        if (taskDef.requiredHardware) {
            for (const [itemId, count] of Object.entries(taskDef.requiredHardware)) {
                if (draft.inventory[itemId] >= count) {
                    draft.inventory[itemId] -= count;
                } else {
                    get().addEventLog(`Not enough ${itemId} in inventory.`, "Error");
                    return;
                }
            }
        }
        draft.tasks.push(newTask);
        get().addEventLog(`New task created: ${taskDef.description}`);
    })),
    abortTask: (taskId) => set(produce(draft => {
        // ...
    })),
    updateTask: (taskId, updates) => set(produce(draft => {
        const task = draft.tasks.find(t => t.id === taskId);
        if (task) Object.assign(task, updates);
    })),
    removeTask: (taskId) => set(produce(draft => {
        draft.tasks = draft.tasks.filter(t => t.id !== taskId);
    })),
    updateEmployee: (employeeId, updates) => set(produce(draft => {
        const employee = draft.employees.find(e => e.id === employeeId);
        if (employee) Object.assign(employee, updates);
    })),
    hireEmployee: (employee) => set(produce(draft => {
        draft.employees.push({ ...employee, status: 'Idle', assignedTaskId: null, location: 'Break Room' });
        get().addEventLog(`${employee.name} has been hired.`);
    })),

    // --- Core Gameplay Functions ---
    signIspContract: (contract, cidr) => set(produce(draft => {
        // ...
    })),
    acceptContract: (contractId) => set(produce(draft => {
        // ...
    })),
    toggleGridPower: () => set(produce(draft => {
        // ...
    })),
    
    // --- Scripting System ---
    createScriptAgent: (name) => set(produce(draft => { /* ... */ })),
    setAgentCallable: (name, isCallable) => set(produce(draft => { /* ... */ })),
    updateAgentPermissions: (name, permissions) => set(produce(draft => { /* ... */ })),
    createScript: (name, agentName) => set(produce(draft => { /* ... */ })),
    updateScript: (id, updates) => set(produce(draft => { /* ... */ })),
    deleteScript: (id) => set(produce(draft => { /* ... */ })),
    addToast: (title, message) => set(produce(draft => { /* ... */ })),
    removeToast: (id) => set(produce(draft => { /* ... */ })),
    addAlert: (title, message) => set(produce(draft => { /* ... */ })),
    removeAlert: (id) => set(produce(draft => { /* ... */ })),
}));

export default useGameStore;

