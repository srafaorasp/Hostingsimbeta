import { useEffect } from 'react';
import useGameStore from '/src/store/gameStore.js';
import { HARDWARE_CATALOG, PRIORITIES } from '/src/data.js';
import { executeScriptBlock } from '/src/game/scriptingEngine.js';

const useGameLoop = () => {
    useEffect(() => {
        const interval = setInterval(() => {
            const store = useGameStore.getState();
            let currentState = store.state;

            if (currentState.isPaused) return;

            store.advanceTime(currentState.gameSpeed);
            currentState = useGameStore.getState().state; // Re-fetch state after time advance
            const newCurrentTime = currentState.time;

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
            const AMBIENT_TEMP = 21.0;
            const CRITICAL_TEMP = 35.0;
            let totalPowerLoad = 0;
            let totalHeatLoad = 0;
            const onlineServers = [];

            Object.entries(currentState.dataCenterLayout).forEach(([rackId, rack]) => {
                if (rack.contents) {
                    rack.contents.forEach(item => {
                        if (['ONLINE', 'NETWORKED'].includes(item.status)) {
                            const details = HARDWARE_CATALOG.find(h => h.id === item.type);
                            if (details) {
                                totalPowerLoad += details.powerDraw || 0;
                                totalHeatLoad += details.heatOutput || 0;
                                if (details.type === 'SERVER') {
                                    onlineServers.push({ rackId, itemId: item.id });
                                }
                            }
                        }
                    });
                }
            });

            const heatDelta = totalHeatLoad - currentState.cooling.capacity;
            let newServerRoomTemp = currentState.serverRoomTemp;

            if (heatDelta > 0) {
                newServerRoomTemp += (heatDelta / 5000) * (currentState.gameSpeed / 60);
            } else {
                newServerRoomTemp = Math.max(AMBIENT_TEMP, newServerRoomTemp + (heatDelta / 10000) * (currentState.gameSpeed / 60));
            }
            
            if (newServerRoomTemp > CRITICAL_TEMP) {
                const failureChance = (newServerRoomTemp - CRITICAL_TEMP) * 0.01;
                if (Math.random() < failureChance && onlineServers.length > 0) {
                    const serverToFail = onlineServers[Math.floor(Math.random() * onlineServers.length)];
                    store.failHardware(serverToFail.rackId, serverToFail.itemId);
                }
            }

            store.updateEnvironment({
                powerLoad: totalPowerLoad,
                coolingLoad: totalHeatLoad,
                serverRoomTemp: newServerRoomTemp,
            });

            // --- Monthly Financial Cycle ---
            const lastMonth = currentState.lastMonth;
            const currentMonth = newCurrentTime.getMonth();
            if (currentMonth !== lastMonth) {
                store.processMonthlyBilling();
            }

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

