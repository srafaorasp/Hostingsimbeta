// This is not a React component. It's the core logic for the scripting API.
import useGameStore from '/src/store/gameStore.js';
import { HARDWARE_CATALOG, TASK_DEFINITIONS } from '/src/data.js';

// --- API Definition ---
const API = {
    'server_blade_g1': {
        'get:status': (server) => server.status,
        'get:powerDraw': (server) => (['ONLINE', 'LAN_CONFIGURED', 'NETWORKED'].includes(server.status) ? HARDWARE_CATALOG.find(h => h.id === server.type).powerDraw : 0),
        'set:power': (server, state) => { /* Logic to create a task to power on/off */ },
    },
    'system.log': {
        'log': (agent, message) => useGameStore.getState().addEventLog(message, `Agent:${agent}`),
    },
    'player.ui': {
        'showToast': (agent, title, message) => useGameStore.getState().addToast(title, message),
        'showAlert': (agent, title, message) => useGameStore.getState().addAlert(title, message),
    },
    // More device APIs would be defined here...
};

// --- Helper Functions ---
const hasPermission = (agentName, requiredPermission) => {
    const agents = useGameStore.getState().scripting.agents;
    const agent = agents[agentName];
    return agent && agent.permissions.includes(requiredPermission);
};

const findTarget = (targetId) => {
    // System endpoints
    if (targetId === 'system.log' || targetId === 'player.ui') {
        return { type: 'system', id: targetId };
    }
    // Employee endpoints
    const employee = useGameStore.getState().employees.find(e => e.id === targetId);
    if (employee) {
        return { type: 'employee', ...employee };
    }
    // Hardware endpoints
    const layout = useGameStore.getState().dataCenterLayout;
    for (const rack of Object.values(layout)) {
        if (rack.contents) {
            const device = rack.contents.find(d => d.id === targetId || d.hostname === targetId);
            if (device) return device;
        }
    }
    return null;
};

// --- Main Execution Logic ---
export function executeCall(agentName, targetId, command, ...args) {
    const [action, key] = command.split(':');
    const target = findTarget(targetId);

    if (!target) {
        throw new Error(`Target not found: ${targetId}`);
    }

    // Determine required permission
    let requiredPermission = '';
    if (target.type === 'system') {
        if (targetId === 'player.ui') requiredPermission = 'write:player:notify';
        if (targetId === 'system.log') requiredPermission = 'write:system:log';
    } else if (target.type.includes('server')) {
        requiredPermission = action === 'get' ? 'read:server' : 'write:server';
    } // ... more permission checks ...

    if (!hasPermission(agentName, requiredPermission)) {
        throw new Error(`Agent '${agentName}' lacks permission: ${requiredPermission}`);
    }

    const apiSet = API[target.type] || API[target.id];
    if (apiSet && apiSet[command]) {
        return apiSet[command](agentName, ...args); // Pass agentName for logging/context
    } else {
         throw new Error(`Invalid command '${command}' for target type '${target.type}'`);
    }
}

export function executeScript(scriptContent, agentName, logCallback) {
    // WARNING: This is a simplified and insecure way to execute scripts for game purposes.
    // Never use `new Function` with untrusted user input in a real application.
    const call = (targetId, command, ...args) => {
        try {
            const result = executeCall(agentName, targetId, command, ...args);
            logCallback(`call('${targetId}', '${command}') => ${JSON.stringify(result)}`);
            return result;
        } catch (e) {
            logCallback(e.message, 'error');
            throw e; // Stop script execution on error
        }
    };

    const scriptFunction = new Function('call', 'log', scriptContent);
    scriptFunction(call, (msg) => logCallback(msg));
}
