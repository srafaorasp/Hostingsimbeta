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

            // --- 1. TIME ADVANCEMENT ---
            store.advanceTime(currentState.gameSpeed);
            const currentTime = useGameStore.getState().state.time;

            // --- 2. MONTHLY BILLING & REVENUE ---
            if (currentTime.getMonth() !== currentState.lastMonth) {
                const utilityBill = currentState.power.totalConsumedKwh * GRID_POWER_COST_PER_KWH;
                let totalRevenue = 0;
                currentState.activeContracts.forEach(contractId => {
                    const contract = CLIENT_CONTRACTS.find(c => c.id === contractId);
                    if (contract) {
                        totalRevenue += contract.monthlyRevenue;
                    }
                });
                store.processMonthlyBilling(utilityBill, totalRevenue);
            }

            // --- 3. TASK COMPLETION ---
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

            // --- 4. TASK ASSIGNMENT ---
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

            // --- 5. POWER, COOLING, AND TEMP SIMULATION ---
            let totalPowerLoad = 0;
            let totalHeatLoad = 0;
            let totalPowerCapacity = currentState.power.gridActive ? 1000000 : 0; // Assume grid is infinite for now
            let totalCoolingCapacity = 0;

            Object.values(currentState.dataCenterLayout).forEach(item => {
                const details = HARDWARE_CATALOG.find(h => h.id === item.type);
                if (!details) return;

                if (item.type === 'PDU' || item.type === 'GENERATOR' || item.type === 'CRAC') {
                    if (details.powerCapacity) totalPowerCapacity += details.powerCapacity;
                    if (details.coolingCapacity) totalCoolingCapacity += details.coolingCapacity;
                    if (item.status === 'ONLINE' && details.powerDraw) totalPowerLoad += details.powerDraw;
                }
                
                if (item.type === 'RACK' && item.contents) {
                    item.contents.forEach(device => {
                        const deviceDetails = HARDWARE_CATALOG.find(h => h.id === device.type);
                        if (deviceDetails && ['ONLINE', 'LAN_CONFIGURED', 'NETWORKED'].includes(device.status)) {
                            totalPowerLoad += deviceDetails.powerDraw || 0;
                            totalHeatLoad += deviceDetails.heatOutput || 0;
                        }
                    });
                }
            });

            // --- 6. ENVIRONMENTAL EFFECTS ---
            const tempChange = (totalHeatLoad - totalCoolingCapacity) / 5000; // Arbitrary factor for temp change speed
            const newTemp = Math.max(18, currentState.serverRoomTemp + tempChange);
            store.updateEnvironment(totalPowerLoad, totalPowerCapacity, totalHeatLoad, totalCoolingCapacity, newTemp);
            
            // --- 7. HARDWARE STATUS CHECKS (OVERLOADS) ---
            if (totalPowerLoad > totalPowerCapacity || newTemp > 35) {
                const onlineServers = [];
                 Object.values(currentState.dataCenterLayout).forEach(rack => {
                    if(rack.contents) rack.contents.forEach(item => {
                        if(['ONLINE', 'LAN_CONFIGURED', 'NETWORKED'].includes(item.status)) onlineServers.push(item);
                    })
                });

                if (onlineServers.length > 0) {
                    const serverToShutdown = onlineServers[Math.floor(Math.random() * onlineServers.length)];
                    const reason = totalPowerLoad > totalPowerCapacity ? 'OFFLINE_POWER' : 'OFFLINE_HEAT';
                    store.updateHardwareStatus(serverToShutdown.id, reason);
                    store.addEventLog(`CRITICAL: ${serverToShutdown.hostname || serverToShutdown.type} shut down due to ${reason === 'OFFLINE_POWER' ? 'power overload' : 'overheating'}.`, 'System');
                }
            }
            
            // --- 8. DAEMON/SCRIPTING EXECUTION ---
            Object.entries(currentState.scripting.daemons).forEach(([serverId, daemonConfig]) => {
                const server = Object.values(currentState.dataCenterLayout).flatMap(r => r.contents || []).find(d => d.id === serverId);
                if (!server) return;
                
                daemonConfig.rules.forEach(rule => {
                    const metricValue = server[rule.metric]; // Simplified for now
                    let conditionMet = false;
                    switch(rule.condition) {
                        case '>': if (metricValue > rule.value) conditionMet = true; break;
                        case '<': if (metricValue < rule.value) conditionMet = true; break;
                        case '==': if (metricValue == rule.value) conditionMet = true; break;
                        case '!=': if (metricValue != rule.value) conditionMet = true; break;
                    }
                    if (conditionMet) {
                        // This is a simplified direct call for now.
                        if (rule.command === 'showAlert') store.addAlert(rule.args[0], rule.args[1]);
                        if (rule.command === 'log') store.addEventLog(rule.args[0], `Agent:${daemonConfig.agent}`);
                    }
                });
            });

        }, 1000); // The loop runs once per second
        return () => clearInterval(interval);
    }, []);
};

export default useGameLoop;
