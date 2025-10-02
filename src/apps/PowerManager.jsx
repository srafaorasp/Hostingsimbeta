import React from 'react';
import useGameStore from '/src/store/gameStore.js';
import { HARDWARE_CATALOG } from '/src/data.js';

const PowerManager = () => {
    const toggleGridPower = useGameStore(state => state.toggleGridPower);
    const gridActive = useGameStore(state => state.state.power.gridActive);
    const layout = useGameStore(state => state.state.dataCenterLayout);
    const lastBill = useGameStore(state => state.state.finances.lastBill);

    const generators = Object.values(layout).filter(item => item.type === 'GENERATOR');

    return (
        <div className="p-4 bg-gray-800 text-white h-full flex flex-col space-y-4">
            <h2 className="text-xl font-bold border-b border-gray-600 pb-2">Power Manager</h2>
            <div className="bg-gray-900 p-4 rounded-lg">
                <h3 className="text-lg font-bold mb-2">City Power Grid</h3>
                <div className="flex items-center justify-between">
                    <p>Status: <span className={gridActive ? 'text-green-400' : 'text-red-400'}>{gridActive ? 'CONNECTED' : 'DISCONNECTED'}</span></p>
                    <button onClick={toggleGridPower} className={`px-4 py-2 rounded-md font-semibold ${gridActive ? 'bg-yellow-600 hover:bg-yellow-500' : 'bg-green-600 hover:bg-green-500'}`}>
                        {gridActive ? 'Disconnect from Grid' : 'Connect to Grid'}
                    </button>
                </div>
                 <p className="text-sm text-gray-400 mt-2">Last Month's Utility Bill: ${lastBill.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
            <div className="flex-grow bg-gray-900 p-4 rounded-lg overflow-y-auto">
                 <h3 className="text-lg font-bold mb-2">On-Site Generation</h3>
                 {generators.length === 0 ? (
                    <p className="text-gray-400">No on-site power generators installed.</p>
                 ) : (
                    <div className="space-y-4">
                        {generators.map(gen => {
                            const details = HARDWARE_CATALOG.find(h => h.id === gen.type);
                            if (!details) return null; 
                            const fuelPercent = details.fuelCapacity > 0 ? (gen.fuel / details.fuelCapacity) * 100 : 0;
                            return (
                                <div key={gen.id} className="p-3 bg-gray-700 rounded-md">
                                    <p className="font-bold">{details.name}</p>
                                    <p>Status: <span className={gen.status === 'ONLINE' ? 'text-green-400' : 'text-gray-400'}>{gen.status}</span></p>
                                    <p>Capacity: {details.powerCapacity.toLocaleString()}W</p>
                                    {details.fuelCapacity && (
                                        <div>
                                            <p>Fuel: {gen.fuel.toFixed(1)} / {details.fuelCapacity} L</p>
                                            <div className="w-full bg-gray-600 rounded-full h-2.5 mt-1">
                                                <div className="bg-yellow-400 h-2.5 rounded-full" style={{ width: `${fuelPercent}%` }}></div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                 )}
            </div>
        </div>
    );
};

export default PowerManager;

