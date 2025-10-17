import React from 'react';
import useGameStore from '/src/store/gameStore.js';
import { ISP_CONTRACTS } from '/src/data.js';

const ISPConnect = () => {
    const signIspContract = useGameStore(state => state.signIspContract);
    // --- THE FIX: Select from the nested 'state' object ---
    const ispContract = useGameStore(state => state.state.network.ispContract);
    const publicIpBlock = useGameStore(state => state.state.network.publicIpBlock);
    const cash = useGameStore(state => state.state.finances.cash);

    return (
        <div className="p-4 bg-gray-800 text-white h-full flex flex-col space-y-4">
            <h2 className="text-xl font-bold border-b border-gray-600 pb-2">ISP Connect</h2>
            {ispContract ? (
                <div className="bg-gray-900 p-4 rounded-lg">
                    <h3 className="text-lg font-bold text-green-400">Active Contract</h3>
                    <p className="text-2xl font-semibold">{ispContract.name}</p>
                    <p>Bandwidth: {ispContract.bandwidthDown} Mbps Down / {ispContract.bandwidthUp} Mbps Up</p>
                    <p>Monthly Cost: ${ispContract.monthlyCost.toLocaleString()}</p>
                    {publicIpBlock && (
                        <div className="mt-2 pt-2 border-t border-gray-700">
                             <h4 className="font-semibold">Leased IP Block</h4>
                             <p className="font-mono">{publicIpBlock.cidr} ({publicIpBlock.ips.length} addresses)</p>
                             <p className="font-mono text-sm text-gray-400">{publicIpBlock.ips[0]} - {publicIpBlock.ips[publicIpBlock.ips.length - 1]}</p>
                        </div>
                    )}
                </div>
            ) : (
                 <p className="text-center text-yellow-400 bg-gray-900 p-4 rounded-lg">No active ISP contract. Your data center is offline.</p>
            )}
            <div className="flex-grow bg-gray-900 p-4 rounded-lg overflow-y-auto">
                <h3 className="text-lg font-bold mb-2">Available ISP Contracts</h3>
                <div className="space-y-4">
                    {ISP_CONTRACTS.map(contract => (
                        <div key={contract.id} className="p-3 bg-gray-700 rounded-md">
                            <p className="font-bold text-xl">{contract.name}</p>
                            <p>Bandwidth: {contract.bandwidthDown} Mbps Down / {contract.bandwidthUp} Mbps Up</p>
                            <p className="text-green-400">Monthly Cost: ${contract.monthlyCost.toLocaleString()}</p>
                            <div className="mt-2">
                                <p className="text-sm font-semibold">Lease Public IP Block:</p>
                                <div className="flex gap-2 mt-1">
                                    {contract.cidrOptions.map(cidr => (
                                        <button 
                                            key={cidr} 
                                            onClick={() => signIspContract(contract, cidr)}
                                            disabled={!!ispContract || cash < contract.monthlyCost}
                                            className="bg-blue-600 px-3 py-1 rounded-md text-sm font-semibold hover:bg-blue-500 disabled:bg-gray-500 disabled:cursor-not-allowed"
                                        >
                                            Sign & Lease {cidr}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ISPConnect;
