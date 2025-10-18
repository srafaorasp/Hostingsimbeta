import React, { useState, useMemo } from 'react';
import useGameStore from '/src/store/gameStore.js';
import { SCRIPT_PERMISSIONS } from '/src/data.js';
import { shallow } from 'zustand/shallow';
import Editor from '@monaco-editor/react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { File, X, Play, Pause, Trash2, PlusCircle } from 'lucide-react';

const ScriptIDE = () => {
    // --- State Management ---
    const { agents, fileSystem } = useGameStore(
        (s) => ({
            agents: s.state.scripting.agents,
            fileSystem: s.state.scripting.fileSystem,
        }),
        shallow
    );
    const { 
        createFile, updateFileContent, deleteFile, updateFileMetadata,
        createScriptAgent, updateAgentPermissions, deleteScriptAgent, setAgentCallable
    } = useGameStore.getState();

    // --- Local UI State ---
    const [selectedAgentName, setSelectedAgentName] = useState('system');
    const [openTabs, setOpenTabs] = useState(['/home/system/welcome.js']);
    const [activeTab, setActiveTab] = useState('/home/system/welcome.js');
    const [newAgentName, setNewAgentName] = useState('');
    const [newFileName, setNewFileName] = useState('');

    const selectedAgent = agents[selectedAgentName];
    const agentFiles = useMemo(() => 
        Object.keys(fileSystem).filter(path => fileSystem[path].agentName === selectedAgentName)
    , [fileSystem, selectedAgentName]);
    const activeFile = fileSystem[activeTab];

    // --- Event Handlers ---
    const handleCreateAgent = () => {
        if (newAgentName && !agents[newAgentName]) {
            createScriptAgent(newAgentName);
            setNewAgentName('');
        }
    };
    
    const handleCreateFile = () => {
        if (newFileName && selectedAgentName) {
            const path = `/home/${selectedAgentName}/${newFileName}.js`;
            if (!fileSystem[path]) {
                createFile(path, { agentName: selectedAgentName, status: 'paused', interval: 60, lastRunTime: null });
                setNewFileName('');
                if (!openTabs.includes(path)) setOpenTabs([...openTabs, path]);
                setActiveTab(path);
            } else {
                alert('A file with this name already exists for this agent.');
            }
        }
    };
    
    const handleOpenFile = (path) => {
        if (!openTabs.includes(path)) {
            setOpenTabs([...openTabs, path]);
        }
        setActiveTab(path);
    };

    const handleCloseTab = (path) => {
        const newTabs = openTabs.filter(t => t !== path);
        setOpenTabs(newTabs);
        if (activeTab === path) {
            setActiveTab(newTabs.length > 0 ? newTabs[0] : null);
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
        <div className="p-2 bg-gray-800 text-gray-200 h-full flex space-x-2 font-sans">
            {/* --- Left Column: Agents & File Explorer --- */}
            <div className="w-1/4 flex flex-col space-y-2 min-w-[200px]">
                {/* Agents Panel */}
                <div className="bg-gray-900 p-2 rounded-md">
                    <h3 className="font-bold mb-2 text-sm">Agents</h3>
                    <div className="flex gap-2">
                        <input type="text" value={newAgentName} onChange={e => setNewAgentName(e.target.value)} placeholder="New agent..." className="flex-grow bg-gray-700 rounded px-2 py-1 text-xs" />
                        <button onClick={handleCreateAgent} className="bg-blue-600 px-2 py-1 rounded text-xs font-semibold hover:bg-blue-500"><PlusCircle size={14}/></button>
                    </div>
                    <ul className="mt-2 space-y-1">
                        {Object.values(agents).map(agent => (
                            <li key={agent.name} onClick={() => { setSelectedAgentName(agent.name); setActiveTab(null); }} className={`p-1 rounded cursor-pointer text-xs ${selectedAgentName === agent.name ? 'bg-blue-600' : 'hover:bg-gray-700'}`}>
                                {agent.name}
                            </li>
                        ))}
                    </ul>
                </div>

                {/* File Explorer Panel */}
                {selectedAgent && (
                    <div className="bg-gray-900 p-2 rounded-md flex-grow overflow-y-auto">
                        <h3 className="font-bold mb-2 text-sm">Files for <span className="text-blue-400">{selectedAgentName}</span></h3>
                        <div className="flex gap-2">
                            <input type="text" value={newFileName} onChange={e => setNewFileName(e.target.value)} placeholder="New file..." className="flex-grow bg-gray-700 rounded px-2 py-1 text-xs" />
                            <button onClick={handleCreateFile} className="bg-green-600 px-2 py-1 rounded text-xs font-semibold hover:bg-green-500"><PlusCircle size={14}/></button>
                        </div>
                        <ul className="mt-2 space-y-1">
                           {agentFiles.map(path => (
                                <li key={path} onClick={() => handleOpenFile(path)} className={`p-1 rounded cursor-pointer text-xs flex justify-between items-center ${activeTab === path ? 'bg-blue-700' : 'hover:bg-gray-700'}`}>
                                    <span className="flex items-center gap-1"><File size={12}/> {path.split('/').pop()}</span>
                                    <span className={`w-2 h-2 rounded-full ${fileSystem[path].status === 'running' ? 'bg-green-500' : 'bg-gray-500'}`}></span>
                                </li>
                           ))}
                        </ul>
                    </div>
                )}
            </div>
            
            {/* --- Right Column: Editor & Permissions --- */}
            <div className="w-3/4 flex flex-col">
                {activeTab && activeFile ? (
                    // Script Editor View
                    <div className="bg-gray-900 rounded-md flex-grow flex flex-col">
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
                            <div className="flex justify-between items-center p-2 border-b border-gray-700">
                                <TabsList>
                                    {openTabs.map(path => (
                                        <TabsTrigger key={path} value={path} className="text-xs px-2 py-1 relative">
                                            {path.split('/').pop()}
                                            <button onClick={(e) => { e.stopPropagation(); handleCloseTab(path); }} className="absolute top-0 right-0 p-0.5 hover:bg-red-500 rounded-full"><X size={10}/></button>
                                        </TabsTrigger>
                                    ))}
                                </TabsList>
                                <div className="flex items-center gap-2">
                                    <label className="text-xs">Interval(s):</label>
                                    <input type="number" min="1" value={activeFile.interval} onChange={e => updateFileMetadata(activeTab, { interval: parseInt(e.target.value, 10) || 1 })} className="w-16 bg-gray-700 rounded px-2 py-1 text-xs" />
                                    <button onClick={() => updateFileMetadata(activeTab, { status: activeFile.status === 'running' ? 'paused' : 'running' })} className={`p-2 rounded ${activeFile.status === 'running' ? 'bg-yellow-600 hover:bg-yellow-500' : 'bg-green-600 hover:bg-green-500'}`}>
                                        {activeFile.status === 'running' ? <Pause size={14}/> : <Play size={14}/>}
                                    </button>
                                    <button onClick={() => { if (confirm('Delete this script?')) { handleCloseTab(activeTab); deleteFile(activeTab); } }} className="p-2 bg-red-600 rounded hover:bg-red-500"><Trash2 size={14}/></button>
                                </div>
                            </div>
                            <div className="flex-grow">
                                <Editor
                                    height="100%"
                                    theme="vs-dark"
                                    language="javascript"
                                    path={activeTab}
                                    value={activeFile.content}
                                    onChange={(value) => updateFileContent(activeTab, value)}
                                    options={{ minimap: { enabled: false }, fontSize: 14 }}
                                />
                            </div>
                        </Tabs>
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
                        <p>Select an agent to manage its files and permissions.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ScriptIDE;
