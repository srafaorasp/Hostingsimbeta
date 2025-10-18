import React, { useState, useMemo } from 'react';
import useGameStore from '../store/gameStore.js';

const DaemonManager = () => {
    // --- FIX: Get stable actions non-reactively ---
    const { deployDaemon, removeDaemon } = useGameStore.getState();

    // --- FIX: Use granular selectors for each piece of reactive state ---
    const daemons = useGameStore(s => s.state.scripting.daemons);
    const agents = useGameStore(s => s.state.scripting.agents);
    const employees = useGameStore(s => s.state.employees);
    const dataCenterLayout = useGameStore(s => s.state.dataCenterLayout);

    const [selectedServerId, setSelectedServerId] = useState('');
    const [selectedAgent, setSelectedAgent] = useState('');
    const [rules, setRules] = useState([{ metric: 'powerDraw', condition: '>', value: '400', action: 'alert', target: 'player', command: 'alert', args: 'Power Alert,Server power draw is critical!' }]);

    const availableServers = useMemo(() => {
        const servers = [];
        Object.values(dataCenterLayout).forEach(rack => {
            if (rack && rack.contents) {
                rack.contents.forEach(item => {
                    if (item.type.includes('server') && !daemons[item.id]) {
                        servers.push(item);
                    }
                });
            }
        });
        return servers;
    }, [dataCenterLayout, daemons]);

    const handleDeploy = () => {
        if (!selectedServerId || !selectedAgent) return;
        const processedRules = rules.map(r => ({
            ...r,
            args: r.args.split(',').map(arg => arg.trim()) 
        }));
        const config = { agent: selectedAgent, rules: processedRules };
        deployDaemon(selectedServerId, config);
        setSelectedServerId('');
        setSelectedAgent('');
        setRules([{ metric: 'powerDraw', condition: '>', value: '400', action: 'alert', target: 'player', command: 'alert', args: 'Power Alert,Server power draw is critical!' }]);
    };
    
    const handleRuleChange = (index, field, value) => {
        const newRules = [...rules];
        const rule = { ...newRules[index] }; 
        rule[field] = value;
        
        if (field === 'action') {
            if (value === 'alert') {
                rule.target = 'player'; rule.command = 'alert'; rule.args = 'Alert!,Metric is out of bounds';
            } else if (value === 'log') {
                rule.target = 'system'; rule.command = 'log'; rule.args = 'Daemon alert: metric out of bounds';
            } else if (value === 'task') {
                rule.target = employees.length > 0 ? employees[0].id : ''; 
                rule.command = 'assign:task'; 
                rule.args = 'repair_hardware,' + (selectedServerId || 'self');
            }
        }
        newRules[index] = rule;
        setRules(newRules);
    };

    const addRule = () => {
        setRules([...rules, { metric: '', condition: '>', value: '', action: 'log', target: 'system', command: 'log', args: 'New rule triggered' }]);
    };

    const removeRule = (index) => {
        setRules(rules.filter((_, i) => i !== index));
    };

    return (
        <div className="p-4 bg-gray-800 text-white h-full flex flex-col space-y-4">
            <h2 className="text-xl font-bold border-b border-gray-600 pb-2">Daemon Manager</h2>
            <div className="grid grid-cols-2 gap-4 flex-grow min-h-0">
                <div className="bg-gray-900 p-3 rounded-md flex flex-col">
                    <h3 className="font-bold text-lg mb-2">Deploy New Monitoring Daemon</h3>
                    <div className="space-y-2 flex-grow overflow-y-auto pr-2">
                        <div>
                            <label className="text-sm">Target Server:</label>
                            <select value={selectedServerId} onChange={e => setSelectedServerId(e.target.value)} className="w-full p-1 bg-gray-700 rounded mt-1">
                                <option value="">Select a server...</option>
                                {availableServers.map(s => <option key={s.id} value={s.id}>{s.hostname || s.id}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-sm">Run As Agent:</label>
                            <select value={selectedAgent} onChange={e => setSelectedAgent(e.target.value)} className="w-full p-1 bg-gray-700 rounded mt-1">
                                <option value="">Select an agent...</option>
                                {Object.keys(agents).map(name => <option key={name} value={name}>{name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-sm">Rules:</label>
                            <div className="p-2 border border-gray-700 rounded mt-1 space-y-2 text-xs">
                                {rules.map((rule, index) => (
                                    <div key={index} className="bg-gray-800 p-2 rounded space-y-1">
                                        <div className="flex gap-2 items-center">
                                            <span>IF metric</span>
                                            <input value={rule.metric} onChange={e => handleRuleChange(index, 'metric', e.target.value)} placeholder="e.g., powerDraw" className="flex-grow bg-gray-700 p-1 rounded" />
                                            <select value={rule.condition} onChange={e => handleRuleChange(index, 'condition', e.target.value)} className="bg-gray-700 p-1 rounded">
                                                <option value=">">&gt;</option><option value="<">&lt;</option><option value="==">==</option><option value="!=">!=</option>
                                            </select>
                                            <input value={rule.value} onChange={e => handleRuleChange(index, 'value', e.target.value)} placeholder="value" className="w-16 bg-gray-700 p-1 rounded" />
                                        </div>
                                         <div className="flex gap-2 items-center">
                                            <span>THEN</span>
                                            <select value={rule.action} onChange={e => handleRuleChange(index, 'action', e.target.value)} className="bg-gray-700 p-1 rounded">
                                                <option value="alert">Alert Player</option><option value="log">Log to System</option><option value="task">Assign Task</option>
                                            </select>
                                            <input value={rule.target} onChange={e => handleRuleChange(index, 'target', e.target.value)} placeholder="target" className="flex-grow bg-gray-700 p-1 rounded" title="Target ID (e.g. 'system', 'player', employee ID, device ID)" />
                                            <input value={rule.command} onChange={e => handleRuleChange(index, 'command', e.target.value)} placeholder="command" className="flex-grow bg-gray-700 p-1 rounded" title="Command (e.g. 'log', 'showAlert')" />
                                        </div>
                                        <div className="flex gap-2 items-center">
                                            <span>ARGS</span>
                                            <input value={rule.args} onChange={e => handleRuleChange(index, 'args', e.target.value)} placeholder="comma, separated, args" className="flex-grow bg-gray-700 p-1 rounded" title="Comma-separated arguments" />
                                            <button onClick={() => removeRule(index)} className="text-red-500 hover:text-red-400 font-bold">X</button>
                                        </div>
                                    </div>
                                ))}
                                <button onClick={addRule} className="text-sm text-blue-400 hover:underline mt-2">+ Add Rule</button>
                            </div>
                        </div>
                    </div>
                    <button onClick={handleDeploy} disabled={!selectedServerId || !selectedAgent} className="mt-2 bg-blue-600 px-4 py-2 rounded-md font-semibold hover:bg-blue-500 disabled:bg-gray-500">Deploy Daemon</button>
                </div>
                <div className="bg-gray-900 p-3 rounded-md overflow-y-auto">
                    <h3 className="font-bold text-lg mb-2">Active Daemons</h3>
                     <div className="space-y-2">
                        {Object.keys(daemons).length === 0 ? <p className="text-gray-500">No active daemons.</p> : Object.entries(daemons).map(([serverId, config]) => {
                             const server = Object.values(dataCenterLayout).flatMap(r => r.contents || []).find(d => d.id === serverId);
                             return (
                                <div key={serverId} className="p-2 bg-gray-700 rounded">
                                    <p className="font-semibold">{server?.hostname || serverId.slice(-8)}</p>
                                    <p className="text-xs">Agent: {config.agent}</p>
                                    <p className="text-xs">Rules: {config.rules.length}</p>
                                    <button onClick={() => removeDaemon(serverId)} className="text-xs text-red-400 hover:underline mt-1">Uninstall</button>
                                </div>
                             )
                        })}
                     </div>
                </div>
            </div>
        </div>
    );
};

export default DaemonManager;

