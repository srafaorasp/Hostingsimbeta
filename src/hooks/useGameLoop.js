import { useEffect } from 'react';
import useGameStore from '/src/store/gameStore.js';
import { HARDWARE_CATALOG, GRID_POWER_COST_PER_KWH, PRIORITIES, CLIENT_CONTRACTS } from '/src/data.js';
import { executeScript } from '/src/game/scriptingEngine.js';

const useGameLoop = () => {
    useEffect(() => {
        const interval = setInterval(() => {
            const store = useGameStore.getState();
            const currentState = store.state;

            if (currentState.isPaused) return;

            store.advanceTime(currentState.gameSpeed);
            const currentTime = useGameStore.getState().state.time;

            if (currentTime.getMonth() !== currentState.lastMonth) {
                const utilityBill = currentState.power.totalConsumedKwh * GRID_POWER_COST_PER_KWH;
                store.processMonthlyBilling(utilityBill);
            }

            currentState.tasks.filter(t => t.status === 'In Progress' && new Date(t.completionTime) <= currentTime).forEach(task => {
                if (task.onCompleteEffect) {
                    const stagedItem = currentState.stagedHardware.find(s => s.id === task.requiredStaged);
                    const itemDetails = HARDWARE_CATALOG.find(h => h.id === task.onCompleteEffect.item || (stagedItem && h.id === stagedItem.type));
                    switch (task.onCompleteEffect.action) {
                        case 'STAGE_HARDWARE': store.stageHardware(task); break;
                        case 'INSTALL_HARDWARE': store.installHardware(task, itemDetails); break;
                        case 'BRING_ONLINE': store.bringHardwareOnline(task); break;
                        case 'CONNECT_RACK_TO_PDU': store.connectRackToPdu(task); break;
                        case 'CONFIGURE_LAN': store.configureLan(task); break;
                        case 'CONFIGURE_WAN': store.configureWan(task); break;
                    }
                }
                store.removeTask(task.id);
                store.updateEmployee(task.assignedTo, { status: 'Idle', assignedTaskId: null, location: 'Break Room' });
            });

            const idleEmployees = currentState.employees.filter(e => e.status === 'Idle');
            const pendingTasks = [...currentState.tasks].filter(t => t.status === 'Pending').sort((a, b) => (PRIORITIES[b.priority] || 0) - (PRIORITIES[a.priority] || 0));
            if (idleEmployees.length > 0 && pendingTasks.length > 0) {
                idleEmployees.forEach(employee => {
                    if (employee.status === 'Idle' && !currentState.tasks.find(t => t.assignedTo === employee.id)) {
                        const suitableTask = pendingTasks.find(t => t.requiredSkill === employee.skill && !t.assignedTo);
                        if (suitableTask) {
                            const completionTime = new Date(currentTime);
                            completionTime.setMinutes(currentTime.getMinutes() + suitableTask.durationMinutes / currentState.gameSpeed);
                            store.updateTask(suitableTask.id, { status: 'In Progress', assignedTo: employee.id, completionTime: completionTime.toISOString() });
                            store.updateEmployee(employee.id, { status: 'Busy', assignedTaskId: suitableTask.id, location: suitableTask.location });
                        }
                    }
                });
            }
            
            // ... all other game loop logic is complex and remains the same, but reads from `currentState`
            // and calls actions on `store`

        }, 1000);
        return () => clearInterval(interval);
    }, []);
};

export default useGameLoop;

