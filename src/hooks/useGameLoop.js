import { useEffect } from 'react';
import useGameStore from '/src/store/gameStore.js';
import { HARDWARE_CATALOG, PRIORITIES, ACHIEVEMENT_DEFINITIONS } from '/src/data.js';
import { executeScriptBlock, parseAndExecuteCommand } from '/src/game/scriptingEngine.js';

const useGameLoop = () => {
    useEffect(() => {
        const interval = setInterval(() => {
            const store = useGameStore.getState();
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

            // --- Tutorial Progression ---
            if (currentState.tutorial.isActive) {
                const currentStep = currentState.tutorial.steps[currentState.tutorial.step];
                if (currentStep) {
                    let conditionMet = false;
                    switch (currentStep.trigger.action) {
                        case 'openApp':
                            const isOpen = Object.values(currentState.ui.windows || {}).some(w => w.appId === currentStep.trigger.appId);
                            if (isOpen) conditionMet = true;
                            break;
                         case 'hireEmployee':
                            if (currentState.employees.some(e => e.id === currentStep.trigger.employeeId)) conditionMet = true;
                            break;
                        case 'purchaseItem':
                             if (currentState.stagedHardware.some(h => h.type === currentStep.trigger.itemId)) conditionMet = true;
                             break;
                        case 'createTask':
                             if (currentState.tasks.some(t => t.id.startsWith('task_') && t.description === TASK_DEFINITIONS.find(td => td.id === currentStep.trigger.taskId)?.description)) conditionMet = true;
                             break;
                    }
                    if (conditionMet) {
                        store.advanceTutorial();
                    }
                }
            }
            
            // --- Achievement Unlocking ---
            ACHIEVEMENT_DEFINITIONS.forEach(achievement => {
                if (!currentState.achievements.unlocked.includes(achievement.id)) {
                    const { stat, operator, value } = achievement.trigger;
                    const statParts = stat.split('.');
                    let currentValue = currentState;
                    for (const part of statParts) {
                        currentValue = currentValue?.[part];
                    }

                    let conditionMet = false;
                    switch (operator) {
                        case '>=': if (currentValue >= value) conditionMet = true; break;
                        case '===': if (currentValue === value) conditionMet = true; break;
                    }
                    if (conditionMet) {
                        store.unlockAchievement(achievement.id);
                    }
                }
            });

            // --- Daemon Processing ---
            Object.entries(currentState.scripting.daemons).forEach(([serverId, config]) => {
                const server = Object.values(currentState.dataCenterLayout).flatMap(r => r.contents || []).find(d => d.id === serverId);
                if (!server) return;

                const serverDetails = HARDWARE_CATALOG.find(h => h.id === server.type);
                const metrics = {
                    powerDraw: serverDetails?.powerDraw || 0,
                    heatOutput: serverDetails?.heatOutput || 0,
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
                        parseAndExecuteCommand(commandString, config.agent, `daemon:${server.hostname || serverId.slice(-4)}`);
                    }
                });
            });


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
            const idleEmployees = currentState.employees.filter(e => e.status === 'Idle');
            const pendingTasks = [...currentState.tasks].filter(t => t.status === 'Pending').sort((a, b) => (PRIORITIES[b.priority] || 0) - (PRIORITIES[a.priority] || 0));
            
            if (idleEmployees.length > 0 && pendingTasks.length > 0) {
                idleEmployees.forEach(employee => {
                    if (employee.status !== 'Idle') return; // Double-check in case they were just assigned
                    const suitableTask = pendingTasks.find(t => t.requiredSkill === employee.skill && !t.assignedTo);
                    
                    if (suitableTask) {
                        const completionTime = new Date(newCurrentTime);
                        completionTime.setSeconds(newCurrentTime.getSeconds() + suitableTask.durationMinutes * 60);
                        
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
                        if (!deviceDetails) return;
                        
                        const isOnline = ['ONLINE', 'LAN_CONFIGURED', 'NETWORKED'].includes(device.status);

                        if (isOnline) {
                            powerCalculations.totalLoad += deviceDetails.powerDraw || 0;
                            coolingCalculations.totalLoad += deviceDetails.heatOutput || 0;
                        }
                    });
                }
            });
            
            const tempDelta = (coolingCalculations.totalLoad - coolingCalculations.totalCapacity) / 50000;
            const newTemp = Math.max(20, currentState.serverRoomTemp + tempDelta);

            store.updatePowerAndCooling(powerCalculations, coolingCalculations, newTemp);
            
            // --- History Update for Analytics ---
            if(currentState.history && currentState.history.cashHistory) {
                const lastCashEntry = currentState.history.cashHistory[currentState.history.cashHistory.length - 1];
                if (!lastCashEntry || newCurrentTime.getTime() - lastCashEntry.time >= 30 * 60 * 1000) { // 30 in-game minutes
                    const { cashHistory, powerHistory, tempHistory } = currentState.history;
                    
                    cashHistory.push({ time: newCurrentTime.getTime(), cash: currentState.finances.cash });
                    powerHistory.push({ time: newCurrentTime.getTime(), load: powerCalculations.totalLoad });
                    tempHistory.push({ time: newCurrentTime.getTime(), temp: newTemp });

                    if (cashHistory.length > 200) cashHistory.shift();
                    if (powerHistory.length > 200) powerHistory.shift();
                    if (tempHistory.length > 200) tempHistory.shift();
                }
            }
            
            // --- Scripting Engine Loop ---
            const scriptsToRun = Object.values(currentState.scripting.fileSystem || {}).filter(script => 
                script.status === 'running' &&
                (!script.lastRunTime || (newCurrentTime.getTime() - new Date(script.lastRunTime).getTime()) >= script.interval * 1000)
            );

            if (scriptsToRun.length > 0) {
                scriptsToRun.forEach(script => {
                    executeScriptBlock(script.content, script.agentName, script.name);
                    store.updateFile(script.path, { lastRunTime: newCurrentTime.toISOString() });
                });
            }

        }, 1000); // Main game tick interval
        
        return () => clearInterval(interval);
    }, []); // Empty dependency array means this runs once on mount
};

export default useGameLoop;

