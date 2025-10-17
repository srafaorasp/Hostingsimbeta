import React from 'react';
import useGameStore from '/src/store/gameStore.js';

const EnviroMon = () => {
    // --- THE FIX: Select from the nested 'state' object ---
    const power = useGameStore(state => state.state.power);
    const cooling = useGameStore(state => state.state.cooling);
    const serverRoomTemp = useGameStore(state => state.state.serverRoomTemp);
    const lastBill = useGameStore(state => state.state.finances.lastBill);
    const gridActive = useGameStore(state => state.state.power.gridActive);

    const powerPercent = power.capacity > 0 ? (power.load / power.capacity) * 100 : 0;
    const coolingPercent = cooling.capacity > 0 ? (cooling.load / cooling.capacity) * 100 : 0;
    const tempColor = serverRoomTemp > 30 ? 'text-red-500' : serverRoomTemp > 26 ? 'text-yellow-500' : 'text-green-500';

    return (
        <div className="p-4 bg-gray-800 text-white h-full flex flex-col space-y-6">
            <h2 className="text-xl font-bold border-b border-gray-600 pb-2">EnviroMon: Facility Status</h2>
            <div className="flex-grow grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex flex-col items-center justify-center bg-gray-900 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-400 mb-2">Server Room Temp</h3>
                    <p className={`text-6xl font-mono font-bold ${tempColor}`}>{serverRoomTemp.toFixed(1)}°C</p>
                </div>
                <div className="bg-gray-900 p-4 rounded-lg flex flex-col">
                    <h3 className="text-lg font-semibold text-gray-400 mb-2">Power</h3>
                    <div className="w-full bg-gray-700 rounded-full h-4 relative">
                        <div className={`h-4 rounded-full ${powerPercent > 90 ? 'bg-red-500' : powerPercent > 75 ? 'bg-yellow-500' : 'bg-green-500'}`} style={{ width: `${Math.min(powerPercent, 100)}%` }}></div>
                    </div>
                    <p className="text-center mt-2 font-mono">{power.load.toLocaleString()}W / {power.capacity.toLocaleString()}W</p>
                    <div className="mt-auto pt-2 text-sm text-gray-300">
                        <p>Grid Status: <span className={gridActive ? 'text-green-400' : 'text-red-400'}>{gridActive ? 'ONLINE' : 'OFFLINE'}</span></p>
                        <p>Last Power Bill: <span className="font-mono">${lastBill.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span></p>
                    </div>
                </div>
                <div className="bg-gray-900 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-400 mb-2">Cooling</h3>
                    <div className="w-full bg-gray-700 rounded-full h-4 relative">
                        <div className={`h-4 rounded-full ${coolingPercent > 90 ? 'bg-red-500' : 'bg-blue-500'}`} style={{ width: `${Math.min(coolingPercent, 100)}%` }}></div>
                    </div>
                    <p className="text-center mt-2 font-mono">{cooling.load.toLocaleString()} BTU/hr / {cooling.capacity.toLocaleString()} BTU/hr</p>
                </div>
            </div>
        </div>
    );
};

export default EnviroMon;
