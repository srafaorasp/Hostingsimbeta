import React, { useState, useMemo } from 'react';
import useGameStore from '/src/store/gameStore.js';

const DaemonManager = () => {
    const deployDaemon = useGameStore(state => state.deployDaemon);
    const removeDaemon = useGameStore(state => state.removeDaemon);
    const daemons = useGameStore(state => state.state.scripting.daemons);
    const agents = useGameStore(state => state.state.scripting.agents);
    const dataCenterLayout = useGameStore(state => state.state.dataCenterLayout);

    const [selectedServerId, setSelectedServerId] = useState('');
    const [selectedAgent, setSelectedAgent] = useState('');
    const [rules, setRules] = useState([{ metric: 'powerDraw', condition: '>', value: 400, action: 'alert', target: 'player.ui', command: 'showAlert', args: ['Power Alert', 'Server power draw is critical!'] }]);

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
        const config = { agent: selectedAgent, rules };
        deployDaemon(selectedServerId, config);
        setSelectedServerId('');
        setSelectedAgent('');
        setRules([{ metric: 'powerDraw', condition: '>', value: 400, action: 'alert', target: 'player.ui', command: 'showAlert', args: ['Power Alert', 'Server power draw is critical!'] }]);
    };
    
    const handleRuleChange = (index, field, value) => {
        const newRules = [...rules];
        const rule = newRules[index];
        rule[field] = value;
        if (field === 'action') {
            if (value === 'alert') {
                rule.target = 'player.ui';
                rule.command = 'showAlert';
                rule.args = ['Server Alert!', 'Metric out of bounds'];
            } else if (value === 'log') {
                rule.target = 'system.log';
                rule.command = 'log';
                rule.args = ['Server metric out of bounds'];
            }
        }
        setRules(newRules);
    };

    return (
        <div className="p-4 bg-gray-800 text-white h-full flex flex-col space-y-4">
            <h2 className="text-xl font-bold border-b border-gray-600 pb-2">Daemon Manager</h2>
            <div className="grid grid-cols-2 gap-4 flex-grow min-h-0">
                <div className="bg-gray-900 p-3 rounded-md flex flex-col">
                    <h3 className="font-bold text-lg mb-2">Deploy New Monitoring Daemon</h3>
                    <div className="space-y-2">
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
                            <div className="p-2 border border-gray-700 rounded mt-1 text-sm">
                                {rules.map((rule, index) => (
                                    <div key={index} className="flex gap-2 items-center">
                                        <span>IF</span>
                                        <input value={rule.metric} onChange={e => handleRuleChange(index, 'metric', e.target.value)} placeholder="metric" className="w-24 bg-gray-700 p-1 rounded" />
                                        <select value={rule.condition} onChange={e => handleRuleChange(index, 'condition', e.target.value)} className="bg-gray-700 p-1 rounded">
                                            <option value=">">&gt;</option>
                                            <option value="<">&lt;</option>
                                            <option value="==">==</option>
                                            <option value="!=">!=</option>
                                        </select>
                                        <input value={rule.value} onChange={e => handleRuleChange(index, 'value', e.target.value)} placeholder="value" className="w-16 bg-gray-700 p-1 rounded" />
                                        <span>THEN</span>
                                        <select value={rule.action} onChange={e => handleRuleChange(index, 'action', e.target.value)} className="bg-gray-700 p-1 rounded">
                                            <option value="alert">Alert Player</option>
                                            <option value="log">Log to System</option>
                                        </select>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    <button onClick={handleDeploy} disabled={!selectedServerId || !selectedAgent} className="mt-auto bg-blue-600 px-4 py-2 rounded-md font-semibold hover:bg-blue-500 disabled:bg-gray-500">Deploy Daemon</button>
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

