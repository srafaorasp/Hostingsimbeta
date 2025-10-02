import React, { useState, useMemo, useEffect } from 'react';
import useGameStore from '/src/store/gameStore.js';
import { TASK_DEFINITIONS } from '/src/data.js';

const NetAdmin = () => {
    // Action from top level
    const createTask = useGameStore(state => state.createTask);
    
    // Data from nested state
    const dataCenterLayout = useGameStore(state => state.state.dataCenterLayout);
    const nextInternalIp = useGameStore(state => state.state.nextInternalIp);
    const publicIpBlock = useGameStore(state => state.state.network.publicIpBlock);
    const assignedPublicIps = useGameStore(state => state.state.network.assignedPublicIps);
    
    const [selectedLanDevice, setSelectedLanDevice] = useState(null);
    const [selectedWanDevice, setSelectedWanDevice] = useState(null);
    const [hostname, setHostname] = useState('');
    const [selectedPublicIp, setSelectedPublicIp] = useState('');

    const unconfiguredLanDevices = useMemo(() => {
        const devices = [];
        Object.entries(dataCenterLayout).forEach(([rackId, rack]) => {
            if (rack.contents) {
                rack.contents.forEach(item => {
                    if ((item.type.includes('server') || item.type.includes('switch') || item.type.includes('router')) && item.status === 'ONLINE') {
                        devices.push({ ...item, rackId });
                    }
                });
            }
        });
        return devices.sort((a,b) => a.id.localeCompare(b.id));
    }, [dataCenterLayout]);

    const unconfiguredWanDevices = useMemo(() => {
        const devices = [];
        Object.entries(dataCenterLayout).forEach(([rackId, rack]) => {
            if (rack.contents) {
                rack.contents.forEach(item => {
                    if (item.type.includes('server') && item.status === 'LAN_CONFIGURED' && !item.publicIp) {
                        devices.push({ ...item, rackId });
                    }
                });
            }
        });
        return devices.sort((a,b) => (a.hostname || '').localeCompare(b.hostname || ''));
    }, [dataCenterLayout]);

    const availablePublicIps = useMemo(() => {
        if (!publicIpBlock) return [];
        const assigned = Object.values(assignedPublicIps);
        return publicIpBlock.ips.filter(ip => !assigned.includes(ip));
    }, [publicIpBlock, assignedPublicIps]);

    useEffect(() => { setHostname(''); }, [selectedLanDevice]);
    useEffect(() => { setSelectedPublicIp(''); }, [selectedWanDevice]);

    const handleConfigureLan = () => {
        if (!selectedLanDevice || !hostname) return;
        const taskDef = TASK_DEFINITIONS.find(t => t.id === 'config_lan');
        createTask({ ...taskDef, priority: 'Normal', targetLocation: selectedLanDevice.rackId, targetItem: selectedLanDevice.id, ip: `10.0.0.${nextInternalIp}`, hostname: `${hostname}.local` });
        setSelectedLanDevice(null);
        setHostname('');
    };
    
    const handleConfigureWan = () => {
        if (!selectedWanDevice || !selectedPublicIp) return;
        const taskDef = TASK_DEFINITIONS.find(t => t.id === 'config_wan');
        createTask({ ...taskDef, priority: 'High', targetLocation: selectedWanDevice.rackId, targetItem: selectedWanDevice.id, publicIp: selectedPublicIp });
        setSelectedWanDevice(null);
        setSelectedPublicIp('');
    };
    
    return (
        <div className="p-4 bg-gray-800 text-white h-full flex flex-col space-y-4">
            <h2 className="text-xl font-bold border-b border-gray-600 pb-2">NetAdmin: Network Manager</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-grow min-h-0">
                <div className="bg-gray-900 p-3 rounded-lg flex flex-col">
                    <h3 className="font-bold text-lg mb-2">Internal Network (LAN)</h3>
                    <div className="mb-2">
                        <label className="block text-sm font-semibold">1. Select Device:</label>
                        <select onChange={(e) => setSelectedLanDevice(unconfiguredLanDevices.find(d => d.id === e.target.value) || null)} value={selectedLanDevice?.id || ''} className="w-full p-1 bg-gray-700 rounded mt-1">
                            <option value="">Select a device...</option>
                            {unconfiguredLanDevices.map(d => <option key={d.id} value={d.id}>{d.type} ({d.id.slice(-4)}) in {d.rackId}</option>)}
                        </select>
                    </div>
                    {selectedLanDevice && (
                         <div className="bg-gray-800 p-2 rounded">
                            <p>IP Address: <span className="font-mono">10.0.0.{nextInternalIp}</span></p>
                            <label className="block text-sm mt-2">Hostname:</label>
                            <input type="text" value={hostname} onChange={e => setHostname(e.target.value)} placeholder="web-server-01" className="bg-gray-700 p-1 rounded w-full"/>
                            <button onClick={handleConfigureLan} disabled={!hostname} className="mt-2 w-full bg-green-600 px-3 py-1 rounded hover:bg-green-500 disabled:bg-gray-500">Schedule LAN Config</button>
                        </div>
                    )}
                </div>
                 <div className="bg-gray-900 p-3 rounded-lg flex flex-col">
                    <h3 className="font-bold text-lg mb-2">External Network (WAN)</h3>
                    {!publicIpBlock ? <p className="text-yellow-400">Lease a public IP block from an ISP.</p> : (
                        <>
                             <div className="mb-2">
                                <label className="block text-sm font-semibold">1. Select Server:</label>
                                <select onChange={(e) => setSelectedWanDevice(unconfiguredWanDevices.find(d => d.id === e.target.value) || null)} value={selectedWanDevice?.id || ''} className="w-full p-1 bg-gray-700 rounded mt-1">
                                     <option value="">Select a server...</option>
                                    {unconfiguredWanDevices.map(d => <option key={d.id} value={d.id}>{d.hostname} ({d.id.slice(-4)})</option>)}
                                </select>
                            </div>
                            {selectedWanDevice && (
                                <div className="bg-gray-800 p-2 rounded">
                                    <label className="block text-sm">2. Assign Public IP:</label>
                                    <select onChange={e => setSelectedPublicIp(e.target.value)} value={selectedPublicIp} className="w-full p-1 bg-gray-700 rounded mt-1 font-mono">
                                        <option value="">Select IP...</option>
                                        {availablePublicIps.map(ip => <option key={ip} value={ip}>{ip}</option>)}
                                    </select>
                                    <button onClick={handleConfigureWan} disabled={!selectedPublicIp} className="mt-2 w-full bg-blue-600 px-3 py-1 rounded hover:bg-blue-500 disabled:bg-gray-500">Schedule WAN Config</button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default NetAdmin;

