import useGameStore from '/src/store/gameStore.js';
import { HARDWARE_CATALOG, TASK_DEFINITIONS } from '/src/data.js';

// --- API Definition ---
const API = {
    // --- System Commands ---
    'system': {
        'list': (agent, scriptName, _target, type) => {
            const state = useGameStore.getState().state;
            let results = [];
            switch (type) {
                case 'files':
                    results = Object.keys(state.scripting.fileSystem);
                    break;
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
            return `Found ${results.length} ${type}: \n${results.join('\n')}`;
        },
        'help': () => 'Available commands: list <type>, cat <filepath>, get:metrics, get:status, set:power, assign:task, notify, alert, call, end.'
    },
    'file': {
        'cat': (agent, scriptName, _target, path) => {
            const file = useGameStore.getState().state.scripting.fileSystem[path];
            if (!file) throw new Error(`File not found: ${path}`);
            return file.content;
        }
    },
    // --- Device Commands ---
    'device': {
        'get:metrics': (agent, scriptName, device) => {
            const details = HARDWARE_CATALOG.find(h => h.id === device.type);
            return JSON.stringify({
                status: device.status,
                powerDraw: details.powerDraw || 0,
                heatOutput: details.heatOutput || 0,
            });
        },
        'get:status': (agent, scriptName, device) => device.status,
        'set:power': (agent, scriptName, device, state) => {
            if (state !== 'on' && state !== 'off') throw new Error("set:power requires 'on' or 'off'");
            useGameStore.getState().addEventLog(`Task created by ${agent}:${scriptName} to turn ${device.hostname || device.id} ${state}.`, 'Automation', 'SCRIPT');
            return `Task created to set power ${state}.`;
        },
    },
     // --- Employee Commands ---
    'employee': {
        'assign:task': (agent, scriptName, employee, taskId, targetId) => {
             const taskDef = TASK_DEFINITIONS.find(t => t.id === taskId);
             if(!taskDef) throw new Error(`Invalid task ID: ${taskId}`);
             useGameStore.getState().createTask({ ...taskDef, targetLocation: targetId, priority: 'Normal' });
             return `Task '${taskId}' assigned to target '${targetId}'.`
        }
    },
    // --- Player UI Commands ---
    'player': {
        'notify': (agent, scriptName, _target, title, message) => useGameStore.getState().addToast(title, message),
        'alert': (agent, scriptName, _target, title, message) => useGameStore.getState().addAlert(title, message),
    }
};

// --- Helper Functions ---
const findTarget = (targetId) => {
    if (['system', 'player'].includes(targetId)) return { type: 'system', id: targetId };
    
    const state = useGameStore.getState().state;
    const employee = state.employees.find(e => e.id === targetId || e.name === targetId);
    if (employee) return { ...employee, entityType: 'employee' };
    
    for (const rack of Object.values(state.dataCenterLayout)) {
        if (rack.contents) {
            const device = rack.contents.find(d => d.id === targetId || d.hostname === targetId);
            if (device) return { ...device, entityType: 'device' };
        }
    }

    if (state.scripting.fileSystem[targetId]) {
        return { entityType: 'file', id: targetId };
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

    const endpoint = parts.shift() || '';
    const command = parts.shift() || '';
    const destination = ['log', 'toast', 'alert'].includes(parts[parts.length - 1]) ? parts.pop() : 'log';
    const args = parts;

    return { endpoint, command, args, destination };
};

// --- New Parser & Executor ---

const parseScriptToAST = (scriptContent) => {
    const lines = scriptContent.split('\n').map(line => line.trim());
    const ast = [];
    let i = 0;

    while (i < lines.length) {
        const line = lines[i];
        if (line.startsWith('if ')) {
            const ifBlock = {
                type: 'if',
                condition: line.substring(3).trim(),
                thenBranch: [],
                elseBranch: []
            };
            let depth = 1;
            let inElse = false;
            i++;
            while (i < lines.length) {
                const innerLine = lines[i];
                if (innerLine.startsWith('if ')) {
                    depth++;
                } else if (innerLine === 'endif') {
                    depth--;
                    if (depth === 0) break;
                } else if (innerLine === 'else' && depth === 1) {
                    inElse = true;
                    i++;
                    continue;
                }

                if (inElse) {
                    ifBlock.elseBranch.push({ type: 'command', value: innerLine });
                } else {
                    ifBlock.thenBranch.push({ type: 'command', value: innerLine });
                }
                i++;
            }
            ast.push(ifBlock);
        } else if (line && !line.startsWith('#')) {
            ast.push({ type: 'command', value: line });
        }
        i++;
    }
    return ast;
};

const evaluateCondition = async (conditionString, agentName, scriptName) => {
    const parts = conditionString.split(' ');
    const commandPart = parts.slice(0, parts.length - 2).join(' ');
    const operator = parts[parts.length - 2];
    let value = parts[parts.length - 1];

    if (value.startsWith('"') && value.endsWith('"')) {
        value = value.substring(1, value.length - 1);
    }

    const result = await executeCommand(commandPart, agentName, scriptName);
    
    switch (operator) {
        case '==': return result == value;
        case '!=': return result != value;
        case '>': return Number(result) > Number(value);
        case '<': return Number(result) < Number(value);
        default: throw new Error(`Unsupported operator: ${operator}`);
    }
};

const executeNode = async (node, agentName, scriptName, callStack) => {
    if (node.type === 'command') {
        if (!node.value || node.value.startsWith('#')) return;
        return await executeCommand(node.value, agentName, scriptName, callStack);
    } else if (node.type === 'if') {
        const conditionMet = await evaluateCondition(node.condition, agentName, scriptName);
        const branchToExecute = conditionMet ? node.thenBranch : node.elseBranch;
        for (const innerNode of branchToExecute) {
            await executeNode(innerNode, agentName, scriptName, callStack);
        }
    }
};


export async function parseAndExecuteCommand(line, agentName, scriptName, callStack = []) {
    const { addEventLog, addToast, addAlert } = useGameStore.getState();

    if (!line || line.startsWith('#')) return { output: null, destination: 'log' };
    // Shell-specific commands
    if (line.toLowerCase() === 'ls') {
        return API.system.list(agentName, scriptName, null, 'files');
    }
    if (line.toLowerCase().startsWith('cat ')) {
        const path = line.substring(4).trim();
        return API.file.cat(agentName, scriptName, null, path);
    }
    
    const { endpoint, command, args, destination } = parseCommandString(line);

    if (command === 'end') return 'STOPPED_BY_END_COMMAND';

    if (command === 'call') {
        const targetName = args[0];
        if (!targetName) throw new Error("'call' command requires a target script or agent name.");
        if (callStack.includes(targetName)) throw new Error(`Recursive call detected: Cannot call '${targetName}'.`);

        const state = useGameStore.getState().state;
        const file = state.scripting.fileSystem[targetName];
        const targetAgent = state.scripting.agents[targetName];

        if (file) {
            return await executeScriptBlock(file.content, file.agent, targetName, [...callStack, scriptName]);
        } else if (targetAgent) {
            if (!targetAgent.isCallable) throw new Error(`Agent '${targetName}' is not marked as callable.`);
            const agentFiles = Object.entries(state.scripting.fileSystem).filter(([_, f]) => f.agent === targetName);
            for (const [path, file] of agentFiles) {
                await executeScriptBlock(file.content, file.agent, path, [...callStack, scriptName]);
            }
            return `Called ${agentFiles.length} scripts for agent '${targetName}'.`;
        } else {
            throw new Error(`Target '${targetName}' for 'call' not found.`);
        }
    }
    
    const target = findTarget(endpoint);
    if (!target) throw new Error(`Endpoint not found: '${endpoint}'`);
    
    const apiSet = API[target.entityType] || API[target.id];
    if (!apiSet || !apiSet[command]) throw new Error(`Invalid command '${command}' for endpoint type '${target.entityType || target.id}'`);
    
    // Permission check will go here...

    const result = apiSet[command](agentName, scriptName, target, ...args);
    const output = typeof result === 'object' ? JSON.stringify(result) : String(result);

    const logPrefix = destination !== 'log' ? `[${destination.toUpperCase()}] > ` : '> ';
    useGameStore.getState().addEventLog(logPrefix + output, `${agentName}:${scriptName}`, "SCRIPT");
    
    if (destination === 'toast') useGameStore.getState().addToast(scriptName, output);
    if (destination === 'alert') useGameStore.getState().addAlert(scriptName, output);

    return output;
}

// --- Main Execution Logic ---
export async function executeScriptBlock(scriptContent, agentName, scriptName, callStack = []) {
    const ast = parseScriptToAST(scriptContent);
    
    for (const node of ast) {
        try {
            const result = await executeNode(node, agentName, scriptName, callStack);
            if (result === 'STOPPED_BY_END_COMMAND') {
                useGameStore.getState().addEventLog("Script execution stopped by 'end' command.", `${agentName}:${scriptName}`, "SCRIPT");
                return 'STOPPED';
            }
        } catch (e) {
            const errorMessage = `Error in ${agentName}:${scriptName}: ${e.message}`;
            useGameStore.getState().addEventLog(errorMessage, 'ScriptError', 'ERROR');
            return 'ERROR'; // Stop execution on error
        }
    }
    return 'SUCCESS';
}


