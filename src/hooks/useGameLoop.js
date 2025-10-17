import { useEffect } from 'react';
import useGameStore from '/src/store/gameStore.js';
import { HARDWARE_CATALOG, GRID_POWER_COST_PER_KWH, PRIORITIES } from '/src/data.js';
import { executeScriptBlock } from '/src/game/scriptingEngine.js';

const useGameLoop = () => {
    useEffect(() => {
        const interval = setInterval(() => {
            const store = useGameStore.getState();
            // --- THE FIX: Now accessing the nested state object ---
            const currentState = store.state;

            if (currentState.isPaused) return;

            // --- Time Progression ---
            store.advanceTime(currentState.gameSpeed);
            const newCurrentTime = useGameStore.getState().state.time;

            // --- Monthly Billing Cycle ---
            const currentMonth = newCurrentTime.getMonth();
            if (currentMonth !== currentState.lastMonth) {
                store.processMonthlyBilling();
            }

            // --- Task completion logic ---
            const completedTasks = currentState.tasks.filter(t => t.status === 'In Progress' && new Date(t.completionTime) <= newCurrentTime);
            
            if (completedTasks.length > 0) {
                completedTasks.forEach(task => {
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
                    if (task.assignedTo) {
                        store.updateEmployee(task.assignedTo, { status: 'Idle', assignedTaskId: null, location: 'Break Room' });
                    }
                });
            }


            // --- Task Assignment Logic ---
            const idleEmployees = useGameStore.getState().state.employees.filter(e => e.status === 'Idle');
            const pendingTasks = [...useGameStore.getState().state.tasks].filter(t => t.status === 'Pending').sort((a, b) => (PRIORITIES[b.priority] || 0) - (PRIORITIES[a.priority] || 0));
            
            if (idleEmployees.length > 0 && pendingTasks.length > 0) {
                idleEmployees.forEach(employee => {
                    const suitableTask = pendingTasks.find(t => t.requiredSkill === employee.skill && !t.assignedTo && !useGameStore.getState().state.tasks.some(runningTask => runningTask.assignedTo === employee.id));
                    if (suitableTask) {
                        const completionTime = new Date(newCurrentTime);
                        completionTime.setMinutes(newCurrentTime.getMinutes() + suitableTask.durationMinutes / currentState.gameSpeed);
                        store.updateTask(suitableTask.id, { status: 'In Progress', assignedTo: employee.id, completionTime: completionTime.toISOString() });
                        store.updateEmployee(employee.id, { status: 'Busy', assignedTaskId: suitableTask.id, location: suitableTask.location });
                    }
                });
            }

            // --- Physical Environment Simulation ---
            const powerCalculations = { totalLoad: 0, totalCapacity: 0 };
            const coolingCalculations = { totalLoad: 0, totalCapacity: 0 };

            Object.values(currentState.dataCenterLayout).forEach(item => {
                const details = HARDWARE_CATALOG.find(h => h.id === item.type);
                if (!details) return;

                if (item.type.includes('crac') && item.status === 'ONLINE') {
                    coolingCalculations.totalCapacity += details.coolingCapacity || 0;
                    powerCalculations.totalLoad += details.powerDraw || 0;
                }

                if (item.contents) {
                    item.contents.forEach(device => {
                        const deviceDetails = HARDWARE_CATALOG.find(h => h.id === device.type);
                        if (device.status === 'ONLINE' || device.status === 'LAN_CONFIGURED' || device.status === 'NETWORKED') {
                            powerCalculations.totalLoad += deviceDetails.powerDraw || 0;
                            coolingCalculations.totalLoad += deviceDetails.heatOutput || 0;
                        }
                    });
                }
            });
            
            const tempDelta = (coolingCalculations.totalLoad - coolingCalculations.totalCapacity) / 5000;
            const newTemp = Math.max(20, currentState.serverRoomTemp + tempDelta);

            store.updatePowerAndCooling(powerCalculations, coolingCalculations, newTemp);
            
            // --- Scripting Engine Loop ---
            const scriptsToRun = Object.values(currentState.scripting.scripts).filter(script => 
                script.status === 'running' &&
                (!script.lastRunTime || (newCurrentTime.getTime() - new Date(script.lastRunTime).getTime()) >= script.interval * 1000)
            );

            if (scriptsToRun.length > 0) {
                scriptsToRun.forEach(script => {
                    executeScriptBlock(script.content, script.agentName, script.name);
                    store.updateScript(script.id, { lastRunTime: newCurrentTime.toISOString() });
                });
            }

        }, 1000); // Main game tick interval
        
        return () => clearInterval(interval);
    }, []); // Empty dependency array means this runs once on mount
};

export default useGameLoop;

