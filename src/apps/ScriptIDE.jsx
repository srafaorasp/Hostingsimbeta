import React, { useState, useMemo } from 'react';
import useGameStore from '/src/store/gameStore.js';
import { SCRIPT_PERMISSIONS } from '/src/data.js';

const ScriptIDE = () => {
    // Zustand actions
    const { 
        createScriptAgent, updateAgentPermissions, deleteScriptAgent, setAgentCallable,
        createScript, updateScript, deleteScript
    } = useGameStore.getState();
    
    // --- THE FIX: Select from the nested 'state' object ---
    const agents = useGameStore(state => state.state.scripting.agents);
    const scripts = useGameStore(state => state.state.scripting.scripts);

    // Local UI state
    const [selectedAgentName, setSelectedAgentName] = useState('system');
    const [selectedScriptId, setSelectedScriptId] = useState(null);
    const [newAgentName, setNewAgentName] = useState('');
    const [newScriptName, setNewScriptName] = useState('');

    const selectedAgent = agents[selectedAgentName];
    const agentScripts = useMemo(() => 
        Object.values(scripts).filter(s => s.agentName === selectedAgentName)
    , [scripts, selectedAgentName]);
    const selectedScript = scripts[selectedScriptId];

    const handleCreateAgent = () => {
        if (newAgentName && !agents[newAgentName]) {
            createScriptAgent(newAgentName);
            setNewAgentName('');
        }
    };
    
    const handleCreateScript = () => {
        if (newScriptName && selectedAgentName) {
            createScript(selectedAgentName, newScriptName);
            setNewScriptName('');
        }
    };

    const handlePermissionChange = (permission, isEnabled) => {
        if (!selectedAgent) return;
        const currentPermissions = selectedAgent.permissions || [];
        const newPermissions = isEnabled
            ? [...new Set([...currentPermissions, permission])]
            : currentPermissions.filter(p => p !== permission);
        updateAgentPermissions(selectedAgentName, newPermissions);
    };

    return (
        <div className="p-4 bg-gray-800 text-gray-200 h-full flex space-x-4">
            {/* --- Left Column: Agents & Scripts --- */}
            <div className="w-1/3 flex flex-col space-y-4">
                {/* Agents Panel */}
                <div className="bg-gray-900 p-3 rounded-md">
                    <h3 className="font-bold mb-2">Script Agents</h3>
                    <div className="flex gap-2">
                        <input type="text" value={newAgentName} onChange={e => setNewAgentName(e.target.value)} placeholder="New agent..." className="flex-grow bg-gray-700 rounded px-2 py-1 text-sm" />
                        <button onClick={handleCreateAgent} className="bg-blue-600 px-3 py-1 rounded text-xs font-semibold hover:bg-blue-500">+</button>
                    </div>
                    <ul className="mt-2 space-y-1">
                        {Object.values(agents).map(agent => (
                            <li key={agent.name} onClick={() => { setSelectedAgentName(agent.name); setSelectedScriptId(null); }} className={`p-1 rounded cursor-pointer text-sm ${selectedAgentName === agent.name ? 'bg-blue-600' : 'hover:bg-gray-700'}`}>
                                {agent.name}
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Scripts Panel */}
                {selectedAgent && (
                    <div className="bg-gray-900 p-3 rounded-md flex-grow overflow-y-auto">
                        <h3 className="font-bold mb-2">Scripts for <span className="text-blue-400">{selectedAgentName}</span></h3>
                        <div className="flex gap-2">
                            <input type="text" value={newScriptName} onChange={e => setNewScriptName(e.target.value)} placeholder="New script..." className="flex-grow bg-gray-700 rounded px-2 py-1 text-sm" />
                            <button onClick={handleCreateScript} className="bg-green-600 px-3 py-1 rounded text-xs font-semibold hover:bg-green-500">+</button>
                        </div>
                        <ul className="mt-2 space-y-1">
                           {agentScripts.map(script => (
                                <li key={script.id} onClick={() => setSelectedScriptId(script.id)} className={`p-1 rounded cursor-pointer text-sm flex justify-between items-center ${selectedScriptId === script.id ? 'bg-blue-700' : 'hover:bg-gray-700'}`}>
                                    <span>{script.name}</span>
                                    <span className={`w-2 h-2 rounded-full ${script.status === 'running' ? 'bg-green-500' : 'bg-gray-500'}`}></span>
                                </li>
                           ))}
                        </ul>
                    </div>
                )}
            </div>
            
            {/* --- Right Column: Editor & Permissions --- */}
            <div className="w-2/3 flex flex-col space-y-4">
                {selectedScript ? (
                    // Script Editor View
                    <div className="bg-gray-900 p-3 rounded-md flex-grow flex flex-col">
                        <div className="flex justify-between items-center mb-2 pb-2 border-b border-gray-700">
                             <input type="text" value={selectedScript.name} onChange={e => updateScript(selectedScript.id, { name: e.target.value })} className="font-bold text-lg bg-transparent" />
                             <div className="flex items-center gap-2">
                                <label className="text-sm">Interval (s):</label>
                                <input type="number" min="1" value={selectedScript.interval} onChange={e => updateScript(selectedScript.id, { interval: parseInt(e.target.value, 10) || 1 })} className="w-16 bg-gray-700 rounded px-2 py-1 text-sm" />
                                <button onClick={() => updateScript(selectedScript.id, { status: selectedScript.status === 'running' ? 'paused' : 'running' })} className={`${selectedScript.status === 'running' ? 'bg-yellow-600' : 'bg-green-600'} px-3 py-1 rounded text-sm font-semibold`}>
                                    {selectedScript.status === 'running' ? 'Pause' : 'Run'}
                                </button>
                                <button onClick={() => { if (confirm('Delete this script?')) deleteScript(selectedScript.id); }} className="bg-red-600 px-3 py-1 rounded text-sm font-semibold">Delete</button>
                             </div>
                        </div>
                        <textarea value={selectedScript.content} onChange={e => updateScript(selectedScript.id, { content: e.target.value })} className="w-full flex-grow bg-gray-800 text-green-400 resize-none focus:outline-none p-2 font-mono rounded" />
                    </div>
                ) : selectedAgent ? (
                    // Agent Permissions View
                    <div className="bg-gray-900 p-3 rounded-md flex-grow overflow-y-auto">
                        <div className="flex justify-between items-center">
                            <h3 className="font-bold text-lg mb-2">Permissions for <span className="text-blue-400">{selectedAgentName}</span></h3>
                            {selectedAgentName !== 'system' && <button onClick={() => { if(confirm('Delete agent and all its scripts?')) deleteScriptAgent(selectedAgentName)}} className="text-red-400 text-xs hover:underline">Delete Agent</button>}
                        </div>
                        {selectedAgentName !== 'system' && (
                            <label className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-gray-700">
                                <input type="checkbox" checked={selectedAgent.isCallable} onChange={(e) => setAgentCallable(selectedAgentName, e.target.checked)} className="form-checkbox h-4 w-4 bg-gray-700 border-gray-600 text-blue-600 rounded focus:ring-blue-500" />
                                <div>
                                    <p className="font-semibold">Allow this agent to be `call`ed</p>
                                    <p className="text-xs text-gray-400">Makes this agent's scripts executable by other scripts.</p>
                                </div>
                            </label>
                        )}
                        <div className="space-y-2 text-sm mt-4">
                            {Object.entries(SCRIPT_PERMISSIONS).map(([key, desc]) => (
                                <label key={key} className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-gray-700">
                                    <input type="checkbox" checked={selectedAgent.permissions.includes(key)} onChange={(e) => handlePermissionChange(key, e.target.checked)} disabled={selectedAgentName === 'system'} className="form-checkbox h-4 w-4 bg-gray-700 border-gray-600 text-blue-600 rounded focus:ring-blue-500 disabled:opacity-50" />
                                    <div>
                                        <p className="font-semibold">{key}</p>
                                        <p className="text-xs text-gray-400">{desc}</p>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="bg-gray-900 p-6 rounded-md flex-grow flex items-center justify-center text-gray-500">
                        <p>Select an agent to manage its scripts and permissions.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ScriptIDE;
