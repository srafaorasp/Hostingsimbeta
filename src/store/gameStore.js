import { create } from 'zustand';

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
    uiSettings: { theme: 'dark', wallpaper: `url('https://placehold.co/1920x1000/0a1829/1c2a3b?text=DataCenter+OS')` },
    scripting: { agents: {}, toasts: [], alerts: [], daemons: {} },
};

const useGameStore = create((set, get) => ({
    state: { ...initialData },

    // --- Save/Load System ---
    newGame: () => set({ state: { ...initialData } }),
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
            if (wallpaper) {
                rehydratedData.uiSettings.wallpaper = wallpaper;
            }
            set({ state: rehydratedData });
        }
    },
    deleteGame: (slotName) => {
        localStorage.removeItem(`datacenter_save_${slotName}`);
    },

    // --- Core Game Actions ---
    advanceTime: (seconds) => set(store => {
        const newTime = new Date(store.state.time);
        newTime.setSeconds(newTime.getSeconds() + seconds);
        const kwhConsumedThisTick = (store.state.power.load / 1000) * (seconds / 3600);
        return { state: { ...store.state, time: newTime, power: { ...store.state.power, totalConsumedKwh: store.state.power.totalConsumedKwh + kwhConsumedThisTick } } };
    }),
    togglePause: () => set(store => ({ state: { ...store.state, isPaused: !store.state.isPaused } })),
    setGameSpeed: (speed) => set(store => ({ state: { ...store.state, gameSpeed: speed } })),
    addEventLog: (message, source = "System") => set(store => ({ state: { ...store.state, eventLog: [{ id: Date.now(), time: get().state.time, message: `[${source}] ${message}` }, ...store.state.eventLog] } })),
    
    // --- UI Actions ---
    setTheme: (themeName) => set(store => ({ state: { ...store.state, uiSettings: { ...store.state.uiSettings, theme: themeName } } })),
    setWallpaper: (wallpaperUrl) => {
        localStorage.setItem('datacenter_wallpaper', wallpaperUrl);
        set(store => ({ state: { ...store.state, uiSettings: { ...store.state.uiSettings, wallpaper: wallpaperUrl } } }));
    },
    
    // --- Finance Actions ---
    spendCash: (amount) => set(store => ({ state: { ...store.state, finances: { ...store.state.finances, cash: store.state.finances.cash - amount } } })),
    addCash: (amount) => set(store => ({ state: { ...store.state, finances: { ...store.state.finances, cash: store.state.finances.cash + amount } } })),
    processMonthlyBilling: (utilityBill, totalRevenue) => set(store => {
        const newTime = get().state.time;
        const cashAfterBills = store.state.finances.cash - utilityBill + totalRevenue;
        get().addEventLog(`Monthly billing processed. Revenue: $${totalRevenue.toLocaleString()}. Power Bill: $${utilityBill.toLocaleString()}.`, 'Finance');
        return {
            state: {
                ...store.state,
                lastMonth: newTime.getMonth(),
                finances: {
                    ...store.state.finances,
                    cash: cashAfterBills,
                    lastBill: utilityBill
                },
                power: { ...store.state.power, totalConsumedKwh: 0 }
            }
        };
    }),
    
    // --- Inventory & Hardware Actions ---
    addToInventory: (item, count = 1) => set(store => {
        const newInv = { ...store.state.inventory };
        newInv[item.id] = (newInv[item.id] || 0) + count;
        return { state: { ...store.state, inventory: newInv } };
    }),
    removeFromInventory: (items) => set(store => {
        const newInv = { ...store.state.inventory };
        Object.entries(items).forEach(([itemId, count]) => {
            newInv[itemId] = (newInv[itemId] || 0) - count;
            if (newInv[itemId] <= 0) delete newInv[itemId];
        });
        return { state: { ...store.state, inventory: newInv } };
    }),

    // --- Employee Actions ---
    hireEmployee: (employee) => set(store => ({ state: { ...store.state, employees: [...store.state.employees, { ...employee, status: 'Idle', assignedTaskId: null, location: 'Break Room' }] } })),
    updateEmployee: (employeeId, updates) => set(store => ({ state: { ...store.state, employees: store.state.employees.map(e => e.id === employeeId ? { ...e, ...updates } : e) } })),

    // --- Task Actions ---
    createTask: (taskDef) => set(store => {
        const newTask = {
            ...taskDef,
            id: `task_${Date.now()}_${Math.random()}`,
            status: 'Pending',
            assignedTo: null,
            completionTime: null,
        };
        let newInv = { ...store.state.inventory };
        if (taskDef.requiredHardware) {
            Object.entries(taskDef.requiredHardware).forEach(([itemId, count]) => {
                newInv[itemId] = (newInv[itemId] || 0) - count;
                if (newInv[itemId] <= 0) delete newInv[itemId];
            });
        }
        return { 
            state: { 
                ...store.state, 
                tasks: [...store.state.tasks, newTask],
                inventory: newInv 
            } 
        };
    }),
    updateTask: (taskId, updates) => set(store => ({ state: { ...store.state, tasks: store.state.tasks.map(t => t.id === taskId ? { ...t, ...updates } : t) } })),
    removeTask: (taskId) => set(store => ({ state: { ...store.state, tasks: store.state.tasks.filter(t => t.id !== taskId) } })),
    abortTask: (taskId) => set(store => {
        const taskToAbort = store.state.tasks.find(t => t.id === taskId);
        if (!taskToAbort) return store;

        let newEmployees = [...store.state.employees];
        if (taskToAbort.assignedTo) {
            newEmployees = newEmployees.map(e => 
                e.id === taskToAbort.assignedTo 
                ? { ...e, status: 'Idle', assignedTaskId: null, location: 'Break Room' } 
                : e
            );
        }
        const newTasks = store.state.tasks.filter(t => t.id !== taskId);
        // Note: Does not refund hardware.
        return {
            state: { ...store.state, tasks: newTasks, employees: newEmployees }
        };
    }),
    
    // --- Task Completion Effects ---
    stageHardware: (task) => set(store => ({ state: { ...store.state, stagedHardware: [...store.state.stagedHardware, { id: `${task.onCompleteEffect.item}_${Date.now()}`, type: task.onCompleteEffect.item, location: 'Tech Room' }] } })),
    installHardware: (task, itemDetails) => set(store => {
        const newLayout = { ...store.state.dataCenterLayout };
        const newStaged = store.state.stagedHardware.filter(s => s.id !== task.requiredStaged);
        let newNextRackSlot = store.state.nextRackSlot;

        if (itemDetails.type === 'RACK') {
            const slotId = `A${store.state.nextRackSlot}`;
            newLayout[slotId] = { id: slotId, type: 'RACK', pdu: null, contents: [] };
            newNextRackSlot++;
        } else if (itemDetails.type === 'PDU' || itemDetails.type === 'CRAC') {
            const id = `${itemDetails.type}_${Date.now()}`;
            newLayout[id] = { id, type: itemDetails.type, status: 'ONLINE' };
        } else if (task.targetLocation && newLayout[task.targetLocation]) {
            newLayout[task.targetLocation].contents.push({ id: `${itemDetails.id}_${Date.now()}`, type: itemDetails.id, status: 'INSTALLED' });
        }
        
        return { state: { ...store.state, dataCenterLayout: newLayout, stagedHardware: newStaged, nextRackSlot: newNextRackSlot } };
    }),
    // Other effects would be here...
}));

export const getGameState = () => useGameStore.getState().state;
export const getGameActions = () => useGameStore.getState();

export default useGameStore;
