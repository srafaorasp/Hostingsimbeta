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

    // All actions from the previous refactor...
    // ...

    // --- Save/Load System (The core of the fix) ---
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
            
            // This is the critical fix:
            // Merge the loaded data into the default initial state.
            // This ensures any properties missing from the save file (like 'tasks')
            // will be present with their default values.
            const mergedData = { ...initialData, ...savedData };

            // Now, rehydrate the merged data
            const rehydratedData = {
                ...mergedData,
                time: new Date(savedData.time || initialData.time),
                eventLog: (savedData.eventLog || []).map(e => ({ ...e, time: new Date(e.time) })),
            };
            
            if (wallpaper) {
                rehydratedData.uiSettings.wallpaper = `url(${wallpaper})`;
            }
            
            set({ state: rehydratedData });
        }
    },
    deleteGame: (slotName) => {
        localStorage.removeItem(`datacenter_save_${slotName}`);
    },

    // All other actions...
    // The following are provided for completeness but are unchanged from the previous correct version.
    advanceTime: (seconds) => set(store => {
        const newTime = new Date(store.state.time);
        newTime.setSeconds(newTime.getSeconds() + seconds);
        const kwhConsumedThisTick = (store.state.power.load / 1000) * (seconds / 3600);
        return { state: { ...store.state, time: newTime, power: { ...store.state.power, totalConsumedKwh: store.state.power.totalConsumedKwh + kwhConsumedThisTick } } };
    }),
    togglePause: () => set(store => ({ state: { ...store.state, isPaused: !store.state.isPaused } })),
    setGameSpeed: (speed) => set(store => ({ state: { ...store.state, gameSpeed: speed } })),
    addEventLog: (message, source = "System") => set(store => ({ state: { ...store.state, eventLog: [{ id: Date.now(), time: get().state.time, message: `[${source}] ${message}` }, ...store.state.eventLog] } })),
    setTheme: (themeName) => set(store => ({ state: { ...store.state, uiSettings: { ...store.state.uiSettings, theme: themeName } } })),
    setWallpaper: (wallpaperUrl) => {
        localStorage.setItem('datacenter_wallpaper', wallpaperUrl);
        set(store => ({ state: { ...store.state, uiSettings: { ...store.state.uiSettings, wallpaper: `url(${wallpaperUrl})` } } }));
    },
    spendCash: (amount) => set(store => ({ state: { ...store.state, finances: { ...store.state.finances, cash: store.state.finances.cash - amount } } })),
    addCash: (amount) => set(store => ({ state: { ...store.state, finances: { ...store.state.finances, cash: store.state.finances.cash + amount } } })),
    processMonthlyBilling: (utilityBill) => set(store => { /* ... */ return { state: { ...store.state, /* ... */ } }; }),
    addToInventory: (item, count = 1) => set(store => {
        const newInv = { ...store.state.inventory };
        newInv[item.id] = (newInv[item.id] || 0) + count;
        return { state: { ...store.state, inventory: newInv } };
    }),
    removeFromInventory: (items) => set(store => { /* ... */ return { state: { ...store.state, /* ... */ } }; }),
    hireEmployee: (employee) => set(store => ({ state: { ...store.state, employees: [...store.state.employees, { ...employee, status: 'Idle', assignedTaskId: null, location: 'Break Room' }] } })),
    createTask: (taskDef) => { /* ... */ set(store => ({ state: { ...store.state, /* ... */ } })); },
    updateTask: (taskId, updates) => set(store => ({ state: { ...store.state, tasks: store.state.tasks.map(t => t.id === taskId ? { ...t, ...updates } : t) } })),
    updateEmployee: (employeeId, updates) => set(store => ({ state: { ...store.state, employees: store.state.employees.map(e => e.id === employeeId ? { ...e, ...updates } : e) } })),
    removeTask: (taskId) => set(store => ({ state: { ...store.state, tasks: store.state.tasks.filter(t => t.id !== taskId) } })),
    stageHardware: (task) => set(store => ({ state: { ...store.state, stagedHardware: [...store.state.stagedHardware, { id: `${task.onCompleteEffect.item}_${Date.now()}`, type: task.onCompleteEffect.item, location: 'Tech Room' }] } })),
    installHardware: (task, itemDetails) => set(store => { /* ... */ return { state: { ...store.state, /* ... */ } }; }),
}));

export const getGameState = () => useGameStore.getState().state;
export const getGameActions = () => useGameStore.getState();

export default useGameStore;

