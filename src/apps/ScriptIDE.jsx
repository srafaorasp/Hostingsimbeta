import React, { useState } from 'react';
import useGameStore from '/src/store/gameStore.js';
import { SCRIPT_PERMISSIONS } from '/src/data.js';
import { executeScript } from '/src/game/scriptingEngine.js';

const ScriptIDE = () => {
    const createScriptAgent = useGameStore(state => state.createScriptAgent);
    const updateAgentPermissions = useGameStore(state => state.updateAgentPermissions);
    const deleteScriptAgent = useGameStore(state => state.deleteScriptAgent);
    const agents = useGameStore(state => state.state.scripting.agents);

    const [selectedAgent, setSelectedAgent] = useState(null);
    const [newAgentName, setNewAgentName] = useState('');
    const [scriptContent, setScriptContent] = useState('');
    const [output, setOutput] = useState([]);

    const handleRunScript = () => {
        if (!selectedAgent) {
            setOutput(prev => [{ type: 'error', message: 'No script agent selected.' }, ...prev]);
            return;
        }
        const log = (message, type = 'info') => {
            setOutput(prev => [{ type, message: String(message) }, ...prev]);
        };
        try {
            executeScript(scriptContent, selectedAgent, log);
        } catch (e) {
            log(e.message, 'error');
        }
    };

    const handlePermissionChange = (permission, isEnabled) => {
        if (!selectedAgent) return;
        const currentPermissions = agents[selectedAgent]?.permissions || [];
        let newPermissions = isEnabled
            ? [...new Set([...currentPermissions, permission])]
            : currentPermissions.filter(p => p !== permission);
        updateAgentPermissions(selectedAgent, newPermissions);
    };
    
    return (
        <div className="p-4 bg-gray-800 text-gray-200 h-full flex flex-col space-y-4">
            <h2 className="text-xl font-bold border-b border-gray-600 pb-2">ScriptIDE</h2>
            <div className="grid grid-cols-3 gap-4 flex-grow min-h-0">
                <div className="col-span-1 flex flex-col space-y-4">
                    <div className="bg-gray-900 p-3 rounded-md">
                        <h3 className="font-bold mb-2">Script Agents</h3>
                        <div className="flex gap-2">
                            <input type="text" value={newAgentName} onChange={e => setNewAgentName(e.target.value)} placeholder="New agent name..." className="flex-grow bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm" />
                            <button onClick={() => { if(newAgentName) { createScriptAgent(newAgentName); setNewAgentName(''); } }} className="bg-blue-600 text-white px-3 py-1 rounded-md text-xs font-semibold hover:bg-blue-500">+</button>
                        </div>
                        <ul className="mt-2 space-y-1">
                            {Object.values(agents).map(agent => (
                                <li key={agent.name} onClick={() => setSelectedAgent(agent.name)} className={`p-1 rounded cursor-pointer text-sm ${selectedAgent === agent.name ? 'bg-blue-600' : 'hover:bg-gray-700'}`}>
                                    {agent.name}
                                </li>
                            ))}
                        </ul>
                    </div>
                    {selectedAgent && (
                        <div className="bg-gray-900 p-3 rounded-md flex-grow overflow-y-auto">
                            <h3 className="font-bold mb-2">Permissions for <span className="text-blue-400">{selectedAgent}</span></h3>
                            <div className="space-y-2 text-sm">
                                {Object.entries(SCRIPT_PERMISSIONS).map(([key, desc]) => (
                                    <label key={key} className="flex items-center gap-2 cursor-pointer">
                                        <input type="checkbox" checked={agents[selectedAgent]?.permissions.includes(key)} onChange={(e) => handlePermissionChange(key, e.target.checked)} className="form-checkbox h-4 w-4 bg-gray-700 border-gray-600 text-blue-600 rounded focus:ring-blue-500" />
                                        <div>
                                            <p className="font-semibold">{key}</p>
                                            <p className="text-xs text-gray-400">{desc}</p>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
                <div className="col-span-2 flex flex-col gap-4">
                    <div className="flex-grow flex flex-col bg-gray-900 rounded-md overflow-hidden">
                        <textarea value={scriptContent} onChange={e => setScriptContent(e.target.value)} className="w-full h-full bg-gray-900 text-green-400 resize-none focus:outline-none p-2 font-mono" placeholder="const servers = call('system', 'get:servers'); log(servers);" />
                    </div>
                    <div className="h-1/3 flex flex-col bg-gray-900 rounded-md overflow-hidden">
                        <div className="p-2 border-b border-gray-600 flex justify-between items-center">
                            <h3 className="font-bold">Output</h3>
                            <button onClick={handleRunScript} disabled={!selectedAgent} className="bg-green-600 px-4 py-1 rounded-md text-sm font-semibold hover:bg-green-500 disabled:bg-gray-500">Run</button>
                        </div>
                        <div className="p-2 overflow-y-auto font-mono text-xs flex-grow">
                            {output.map((line, i) => <p key={i} className={line.type === 'error' ? 'text-red-400' : 'text-gray-300'}>&gt; {line.message}</p>)}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ScriptIDE;

