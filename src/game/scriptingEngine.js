import useGameStore from '/src/store/gameStore.js';
import { HARDWARE_CATALOG, TASK_DEFINITIONS } from '../data.js';

// --- API Definition ---
const API = {
    'system': {
        'list': (agent, scriptName, _target, type) => {
            const state = useGameStore.getState().state;
            let results = [];
            switch (type) {
                case 'devices':
                    Object.values(state.dataCenterLayout).forEach(rack => rack.contents?.forEach(d => results.push(d.hostname || d.id)));
                    break;
                case 'servers':
                     Object.values(state.dataCenterLayout).forEach(rack => rack.contents?.filter(d => d.type.includes('server')).forEach(d => results.push(d.hostname || d.id)));
                    break;
                case 'employees':
                    results = state.employees.map(e => e.name);
                    break;
                case 'tasks':
                    results = state.tasks.map(t => t.id);
                    break;
                default:
                    throw new Error(`Unknown list type: '${type}'`);
            }
            return `Found ${results.length} ${type}: ${results.join(', ')}`;
        },
        'help': () => 'Available commands: list, get:metrics, get:status, set:power, assign:task, notify, alert, call, end, if/else/endif.'
    },
    'device': {
        'get:metrics': (agent, scriptName, device) => {
            const details = HARDWARE_CATALOG.find(h => h.id === device.type);
            return JSON.stringify({
                status: device.status,
                powerDraw: details.powerDraw || 0,
                heatOutput: details.heatOutput || 0,
            });
        },
        'get:powerDraw': (agent, scriptName, device) => {
            const details = HARDWARE_CATALOG.find(h => h.id === device.type);
            return (device.status === 'ONLINE' || device.status === 'NETWORKED') ? (details.powerDraw || 0) : 0;
        },
        'get:status': (agent, scriptName, device) => device.status,
        'set:power': (agent, scriptName, device, state) => {
            if (state !== 'on' && state !== 'off') throw new Error("set:power requires 'on' or 'off'");
            useGameStore.getState().addEventLog(`Task created by ${agent}:${scriptName} to turn ${device.hostname || device.id} ${state}.`, 'SCRIPT', 'Automation');
            return `Task created to set power ${state}.`;
        },
    },
    'employee': {
        'assign:task': (agent, scriptName, employee, taskId, targetId) => {
             const taskDef = TASK_DEFINITIONS.find(t => t.id === taskId);
             if(!taskDef) throw new Error(`Invalid task ID: ${taskId}`);
             useGameStore.getState().createTask({ ...taskDef, targetLocation: targetId, priority: 'Normal' });
             return `Task '${taskId}' assigned to target '${targetId}'.`
        }
    },
    'player': {
        'notify': (agent, scriptName, _target, title, message) => useGameStore.getState().addToast(title, message),
        'alert': (agent, scriptName, _target, title, message) => useGameStore.getState().addAlert(title, message),
    }
};

// --- Helper Functions ---
const findTarget = (targetId) => {
    if (['system', 'player'].includes(targetId)) return { type: 'system', id: targetId, entityType: targetId };
    
    const state = useGameStore.getState().state;
    const employee = state.employees.find(e => e.id === targetId || e.name === targetId);
    if (employee) return { ...employee, entityType: 'employee' };
    
    for (const rack of Object.values(state.dataCenterLayout)) {
        if (rack.contents) {
            const device = rack.contents.find(d => d.id === targetId || d.hostname === targetId);
            if (device) return { ...device, entityType: 'device' };
        }
    }
    return null;
};

const hasPermission = (agentName, requiredPermission) => {
    const agent = useGameStore.getState().state.scripting.agents[agentName];
    return agent && agent.permissions.includes(requiredPermission);
};

const parseCommandString = (line) => {
    const parts = [];
    let currentPart = '';
    let inQuote = false;
    for (const char of line) {
        if (char === ' ' && !inQuote) {
            if (currentPart) parts.push(currentPart);
            currentPart = '';
        } else if (char === '"') {
            inQuote = !inQuote;
        } else {
            currentPart += char;
        }
    }
    if (currentPart) parts.push(currentPart);
    return parts;
};

const evaluateCondition = (LHS, operator, RHS) => {
    // --- FIX FOR NUMERICAL COMPARISON ---
    const numLHS = parseFloat(LHS);
    const numRHS = parseFloat(RHS);

    if (!isNaN(numLHS) && !isNaN(numRHS)) {
        // Both are numbers, perform numerical comparison
        switch (operator) {
            case '==': return numLHS == numRHS;
            case '!=': return numLHS != numRHS;
            case '>': return numLHS > numRHS;
            case '<': return numLHS < numRHS;
            default: throw new Error(`Invalid numerical operator: ${operator}`);
        }
    } else {
         // Fallback to string comparison
        switch (operator) {
            case '==': return LHS == RHS;
            case '!=': return LHS != RHS;
            default: throw new Error(`Invalid string operator: '${operator}'. Only '==' and '!=' are supported for strings.`);
        }
    }
};

export async function parseAndExecuteCommand(line, agentName, scriptName, callStack = []) {
    const { addEventLog, addToast, addAlert } = useGameStore.getState();
    if (!line || line.startsWith('#')) return { output: null, destination: 'log' };

    const parts = parseCommandString(line);
    const endpoint = parts.shift() || '';
    
    // Shell-specific commands
    if (scriptName === 'Shell') {
        if (endpoint === 'clear') return { output: 'CLEAR', destination: 'shell' };
        if (endpoint === 'ls') {
            const files = Object.keys(useGameStore.getState().state.scripting.fileSystem);
            return { output: files.join('\n') || 'No files found.', destination: 'shell' };
        }
        if (endpoint === 'cat') {
            const file = useGameStore.getState().state.scripting.fileSystem[parts[0]];
            return { output: file ? file.content : `cat: ${parts[0]}: No such file`, destination: 'shell' };
        }
    }

    const command = parts.shift() || '';
    const destination = ['log', 'toast', 'alert'].includes(parts[parts.length - 1]) ? parts.pop() : 'log';
    const args = parts;
    
    if (command === 'end') return 'STOPPED_BY_END_COMMAND';

    if (command === 'call') {
        // ... (call logic remains the same)
    }
    
    const target = findTarget(endpoint);
    if (!target) throw new Error(`Endpoint not found: '${endpoint}'`);
    
    const apiSet = API[target.entityType];
    if (!apiSet || !apiSet[command]) throw new Error(`Invalid command '${command}' for endpoint type '${target.entityType}'`);
    
    const result = apiSet[command](agentName, scriptName, target, ...args);
    const output = (result !== undefined && result !== null) ? String(result) : '';
    
    return { output, destination };
}

export async function executeScriptBlock(scriptContent, agentName, scriptName, callStack = []) {
    const { addEventLog, addToast, addAlert } = useGameStore.getState();
    const lines = scriptContent.trim().split('\n');
    let i = 0;

    const executeBlock = async (startIndex, stopKeywords) => {
        let currentIndex = startIndex;
        while (currentIndex < lines.length) {
            const line = lines[currentIndex].trim();
            if (stopKeywords && stopKeywords.includes(line)) {
                return { stoppedAt: line, nextIndex: currentIndex + 1 };
            }

            if (line.startsWith('if ')) {
                const ifResult = await handleIfBlock(currentIndex);
                currentIndex = ifResult.nextIndex -1; // -1 to account for loop increment
            } else if (!line.startsWith('#') && line.length > 0) {
                try {
                    const { output, destination } = await parseAndExecuteCommand(line, agentName, scriptName, callStack);
                    if (output) {
                         const logPrefix = destination !== 'log' ? `[${destination.toUpperCase()}] > ` : '> ';
                         addEventLog(logPrefix + output, 'SCRIPT', `${agentName}:${scriptName}`);
                         if (destination === 'toast') addToast(scriptName, output);
                         if (destination === 'alert') addAlert(scriptName, output);
                    }
                } catch (e) {
                    const errorMessage = `Error in ${agentName}:${scriptName} (line ${currentIndex + 1}): ${e.message}`;
                    addEventLog(errorMessage, 'ERROR', 'ScriptEngine');
                    return { stoppedAt: 'error', nextIndex: lines.length }; // Stop execution on error
                }
            }
            currentIndex++;
        }
        return { stoppedAt: null, nextIndex: currentIndex };
    };

    const handleIfBlock = async (startIndex) => {
        const ifLine = lines[startIndex].trim();
        const conditionParts = parseCommandString(ifLine.substring(3)); // remove "if "
        const conditionEndpoint = conditionParts.shift();
        const conditionCommand = conditionParts.shift();
        const operator = conditionParts.shift();
        const RHS = conditionParts.shift();
        
        // Execute the command part of the if statement
        const conditionCmdLine = `${conditionEndpoint} ${conditionCommand}`;
        const { output: LHS } = await parseAndExecuteCommand(conditionCmdLine, agentName, scriptName, callStack);

        const conditionMet = evaluateCondition(LHS, operator, RHS);

        if (conditionMet) {
            // Execute the 'then' block
            const thenBlockResult = await executeBlock(startIndex + 1, ['else', 'endif']);
            if (thenBlockResult.stoppedAt === 'else') {
                 // Skip the 'else' block
                 const elseSkipResult = await executeBlock(thenBlockResult.nextIndex, ['endif']);
                 return { nextIndex: elseSkipResult.nextIndex };
            }
            return { nextIndex: thenBlockResult.nextIndex };
        } else {
            // Skip the 'then' block
            const thenSkipResult = await executeBlock(startIndex + 1, ['else', 'endif']);
            if (thenSkipResult.stoppedAt === 'else') {
                // Execute the 'else' block
                const elseBlockResult = await executeBlock(thenSkipResult.nextIndex, ['endif']);
                return { nextIndex: elseBlockResult.nextIndex };
            }
            return { nextIndex: thenSkipResult.nextIndex };
        }
    };
    
    await executeBlock(0, null);
    return 'SUCCESS';
}

