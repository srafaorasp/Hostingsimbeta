import { useEffect } from 'react';
import useGameStore from '../store/gameStore.js';
import { HARDWARE_CATALOG, PRIORITIES } from '../data.js';
import { executeScriptBlock } from '../game/scriptingEngine.js';

const useGameLoop = () => {
    useEffect(() => {
        const interval = setInterval(() => {
            const store = useGameStore.getState();
            const currentState = store.state;

            if (currentState.isPaused) return;

            store.advanceTime(currentState.gameSpeed);
            const newCurrentTime = useGameStore.getState().state.time;

            const currentMonth = newCurrentTime.getMonth();
            if (currentMonth !== currentState.lastMonth) {
                store.processMonthlyBilling();
            }

            // Record history every 30 in-game minutes
            if (newCurrentTime.getMinutes() % 30 === 0 && (newCurrentTime.getTime() - (currentState.finances.cashHistory.at(-1)?.time || 0)) > 1000 * 60 * 29) {
                 store.recordHistory();
            }

            const completedTasks = currentState.tasks.filter(t => t.status === 'In Progress' && new Date(t.completionTime) <= newCurrentTime);
            
            if (completedTasks.length > 0) {
                completedTasks.forEach(task => {
                    if (task.onCompleteEffect) {
                        const stagedItem = currentState.stagedHardware.find(s => s.id === task.requiredStaged);
                        const itemDetails = HARDWARE_CATALOG.find(h => h.id === task.onCompleteEffect.item || (stagedItem && h.id === stagedItem.type));
                        
                        switch (task.onCompleteEffect.action) {
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

            // --- Daemon Monitoring Loop ---
            Object.entries(currentState.scripting.daemons).forEach(([serverId, config]) => {
                const server = Object.values(currentState.dataCenterLayout).flatMap(r => r.contents || []).find(d => d.id === serverId);
                if (!server) return;
                
                const details = HARDWARE_CATALOG.find(h => h.id === server.type);
                const metrics = {
                    powerDraw: details?.powerDraw || 0,
                    heatOutput: details?.heatOutput || 0,
                    status: server.status,
                };

                config.rules.forEach(rule => {
                    const metricValue = metrics[rule.metric];
                    let conditionMet = false;
                    const ruleValue = isNaN(parseFloat(rule.value)) ? rule.value : parseFloat(rule.value);
                    
                    switch (rule.condition) {
                        case '>': if (metricValue > ruleValue) conditionMet = true; break;
                        case '<': if (metricValue < ruleValue) conditionMet = true; break;
                        case '==': if (metricValue == ruleValue) conditionMet = true; break;
                        case '!=': if (metricValue != ruleValue) conditionMet = true; break;
                    }

                    if (conditionMet) {
                        const commandString = `${rule.target} ${rule.command} ${rule.args.map(a => a.includes(' ') ? `"${a}"` : a).join(' ')}`;
                        executeScriptBlock(commandString, config.agent, `daemon:${server.hostname || serverId.slice(-4)}`);
                    }
                });
            });

        }, 1000); 
        
        return () => clearInterval(interval);
    }, []); 
};

export default useGameLoop;

