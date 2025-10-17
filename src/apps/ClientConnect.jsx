import React from 'react';
import useGameStore from '/src/store/gameStore.js';
import { CLIENT_CONTRACTS, HARDWARE_CATALOG } from '/src/data.js';

const ClientConnect = () => {
    const acceptContract = useGameStore(state => state.acceptContract);
    // --- THE FIX: Select from the nested 'state' object ---
    const activeContracts = useGameStore(state => state.state.activeContracts);
    const dataCenterLayout = useGameStore(state => state.state.dataCenterLayout);

    const checkRequirements = (reqs) => {
        const networkedServers = {};
        Object.values(dataCenterLayout).forEach(rack => {
            if(rack.contents) rack.contents.forEach(item => {
                if(item.status === 'NETWORKED') {
                    const typeId = item.type;
                    networkedServers[typeId] = (networkedServers[typeId] || 0) + 1;
                }
            })
        });
        return Object.entries(reqs).every(([typeId, count]) => (networkedServers[typeId] || 0) >= count);
    };

    return (
        <div className="p-4 bg-gray-800 text-white h-full flex flex-col space-y-4">
            <h2 className="text-xl font-bold border-b border-gray-600 pb-2">ClientConnect: Contract Marketplace</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-grow min-h-0">
                <div className="bg-gray-900 p-2 rounded-md overflow-y-auto">
                    <h3 className="font-bold mb-2">Available Contracts</h3>
                    <div className="space-y-2">
                    {CLIENT_CONTRACTS.filter(c => !activeContracts.includes(c.id)).map(contract => {
                        const canAccept = checkRequirements(contract.requirements);
                        return (
                            <div key={contract.id} className="p-2 bg-gray-700 rounded">
                                <p className="font-bold">{contract.name}</p>
                                <ul className="text-xs list-disc list-inside">
                                    {Object.entries(contract.requirements).map(([typeId, count]) => {
                                        const itemDetails = HARDWARE_CATALOG.find(h=>h.id===typeId);
                                        return <li key={typeId}>{itemDetails?.name} x{count}</li>
                                    })}
                                </ul>
                                <p className="text-xs mt-1">Bandwidth: {contract.bandwidthLoad} Gbps</p>
                                <p className="text-green-400 font-bold mt-1">${contract.monthlyRevenue.toLocaleString()}/mo</p>
                                <button onClick={() => acceptContract(contract.id)} disabled={!canAccept} className="w-full mt-2 bg-blue-600 px-3 py-1 rounded text-sm hover:bg-blue-500 disabled:bg-gray-500 disabled:cursor-not-allowed">Accept</button>
                            </div>
                        )
                    })}
                    </div>
                </div>
                <div className="bg-gray-900 p-2 rounded-md overflow-y-auto">
                    <h3 className="font-bold mb-2">Active Contracts</h3>
                     <div className="space-y-2">
                        {activeContracts.length === 0 ? <p className="text-gray-500">No active contracts.</p> : activeContracts.map(contractId => {
                            const contract = CLIENT_CONTRACTS.find(c => c.id === contractId);
                            if (!contract) return null;
                            return <div key={contractId} className="p-2 bg-green-900/50 rounded">{contract.name} (+${contract.monthlyRevenue.toLocaleString()}/mo)</div>
                        })}
                     </div>
                </div>
            </div>
        </div>
    );
};

export default ClientConnect;
