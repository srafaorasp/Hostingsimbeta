import useGameStore from '/src/store/gameStore.js';
import { HARDWARE_CATALOG, TASK_DEFINITIONS } from '/src/data.js';

// --- API Definition ---
const API = {
    // --- System Commands ---
    'system': {
        'list': (agent, scriptName, _target, type) => {
            // --- THE FIX: Access nested state object ---
            const state = useGameStore.getState().state;
            let results = [];
            switch (type) {
                case 'devices':
                    Object.values(state.dataCenterLayout).forEach(rack => rack.contents?.forEach(d => results.push(d.hostname || d.id)));
                    break;
                case 'servers':
                     Object.values(state.dataCenterLayout).forEach(rack => rack.contents?.filter(d => d.type.includes('server')).forEach(d => results.push(d.hostname || d.id)));
                    break;
                // Add other list types here...
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
        'help': () => 'Available commands: list <type>, get:metrics, get:status, set:power, assign:task, notify, alert, call, end.'
    },
    // --- Device Commands ---
    'device': {
        'get:metrics': (agent, scriptName, device) => {
            const details = HARDWARE_CATALOG.find(h => h.id === device.type);
            return {
                status: device.status,
                powerDraw: details.powerDraw || 0,
                heatOutput: details.heatOutput || 0,
            };
        },
        'get:status': (agent, scriptName, device) => device.status,
        'set:power': (agent, scriptName, device, state) => {
            if (state !== 'on' && state !== 'off') throw new Error("set:power requires 'on' or 'off'");
            // In a real implementation, this would create a task
            useGameStore.getState().addEventLog(`Task created by ${agent}:${scriptName} to turn ${device.hostname || device.id} ${state}.`, 'Automation');
            return `Task created to set power ${state}.`;
        },
    },
     // --- Employee Commands ---
    'employee': {
        'assign:task': (agent, scriptName, employee, taskId, targetId) => {
             const taskDef = TASK_DEFINITIONS.find(t => t.id === taskId);
             if(!taskDef) throw new Error(`Invalid task ID: ${taskId}`);
             // This is a simplified version. A real implementation would need more robust logic.
             useGameStore.getState().createTask({ ...taskDef, targetLocation: targetId, priority: 'Normal' });
             return `Task '${taskId}' assigned to target '${targetId}'.`
        }
    },
    // --- Player UI Commands (FIXED) ---
    'player': {
        'notify': (agent, scriptName, _target, title, message) => useGameStore.getState().addToast(title, message),
        'alert': (agent, scriptName, _target, title, message) => useGameStore.getState().addAlert(title, message),
    }
};

// --- Helper Functions ---
const findTarget = (targetId) => {
    if (['system', 'player'].includes(targetId)) return { type: 'system', id: targetId };
    
    // --- THE FIX: Access nested state object ---
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
    // --- THE FIX: Access nested state object ---
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

    const endpoint = parts.shift() || '';
    const command = parts.shift() || '';
    const destination = ['log', 'toast', 'alert'].includes(parts[parts.length - 1]) ? parts.pop() : 'log';
    const args = parts;

    return { endpoint, command, args, destination };
};


async function parseAndExecuteCommand(line, agentName, scriptName, callStack) {
    if (!line || line.startsWith('#')) return null;

    const { endpoint, command, args, destination } = parseCommandString(line);

    if (command === 'end') return 'STOPPED_BY_END_COMMAND';

    // --- Handle `call` command ---
    if (command === 'call') {
        const targetName = args[0];
        if (!targetName) throw new Error("'call' command requires a target script or agent name.");
        if (callStack.includes(targetName)) throw new Error(`Recursive call detected: Cannot call '${targetName}'.`);

        // --- THE FIX: Access nested state object ---
        const state = useGameStore.getState().state;
        const targetScript = Object.values(state.scripting.scripts).find(s => s.name === targetName);
        const targetAgent = state.scripting.agents[targetName];

        if (targetScript) {
            return await executeScriptBlock(targetScript.content, targetScript.agentName, targetScript.name, [...callStack, scriptName]);
        } else if (targetAgent) {
            if (!targetAgent.isCallable) throw new Error(`Agent '${targetName}' is not marked as callable.`);
            const agentScripts = Object.values(state.scripting.scripts).filter(s => s.agentName === targetName);
            for (const script of agentScripts) {
                await executeScriptBlock(script.content, script.agentName, script.name, [...callStack, scriptName]);
            }
            return `Called ${agentScripts.length} scripts for agent '${targetName}'.`;
        } else {
            throw new Error(`Target '${targetName}' for 'call' not found.`);
        }
    }
    
    // --- Handle all other commands ---
    const target = findTarget(endpoint);
    if (!target) throw new Error(`Endpoint not found: '${endpoint}'`);
    
    const apiSet = API[target.entityType] || API[target.id];
    if (!apiSet || !apiSet[command]) throw new Error(`Invalid command '${command}' for endpoint type '${target.entityType || target.id}'`);
    
    // Permission check will go here...

    const result = apiSet[command](agentName, scriptName, target, ...args);
    const output = typeof result === 'object' ? JSON.stringify(result) : result;

    // Universal Logging
    const logPrefix = destination !== 'log' ? `[${destination.toUpperCase()}] > ` : '> ';
    useGameStore.getState().addEventLog(logPrefix + output, `${agentName}:${scriptName}`);

    // Route to destination
    if (destination === 'toast') useGameStore.getState().addToast(scriptName, output);
    if (destination === 'alert') useGameStore.getState().addAlert(scriptName, output);

    return output;
}

// --- Main Execution Logic ---
export async function executeScriptBlock(scriptContent, agentName, scriptName, callStack = []) {
    let lines = scriptContent.trim().split('\n');
    
    const isRunOnce = lines[0].trim() === 'RunOnce';
    if (isRunOnce) lines.shift();

    for (const line of lines) {
        try {
            const result = await parseAndExecuteCommand(line.trim(), agentName, scriptName, callStack);
            if (result === 'STOPPED_BY_END_COMMAND') {
                return 'STOPPED_BY_END_COMMAND';
            }
        } catch (e) {
            const errorMessage = `Error in ${agentName}:${scriptName}: ${e.message}`;
            useGameStore.getState().addEventLog(errorMessage, 'ScriptError');
            return 'ERROR'; // Stop execution on error
        }
    }
    return 'SUCCESS';
}
