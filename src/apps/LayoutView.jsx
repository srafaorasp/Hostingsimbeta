import React, { useState } from 'react';
import useGameStore from '/src/store/gameStore.js';
import { HARDWARE_CATALOG } from '/src/data.js';

const LayoutDetailModal = ({ slotId, rack, onClose }) => {
    if (!rack) return null;
    const itemColors = { 'SERVER': 'bg-green-500', 'NETWORKING': 'bg-blue-500', 'ROUTER': 'bg-purple-500', 'OFFLINE_POWER': 'bg-yellow-500', 'OFFLINE_HEAT': 'bg-orange-500', 'OFFLINE_FAILED': 'bg-red-500' };
    return (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onClose}>
            <div className="bg-gray-900 text-gray-200 p-6 rounded-lg shadow-lg w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center border-b border-gray-700 pb-2 mb-4">
                    <h2 className="text-2xl font-bold">Rack Detail: {slotId}</h2>
                    <button onClick={onClose} className="text-2xl hover:text-red-500">&times;</button>
                </div>
                <div>
                    <p><span className="font-semibold">PDU Connection:</span> {rack.pdu ? <span className="text-green-400">{rack.pdu}</span> : <span className="text-red-400">Not Connected</span>}</p>
                    <h3 className="font-bold text-lg mt-4 mb-2">Contents:</h3>
                    <div className="space-y-2">
                        {rack.contents.length === 0 ? <p className="text-gray-500">Empty</p> : (
                            rack.contents.map(item => {
                                const details = HARDWARE_CATALOG.find(h => h.id === item.type);
                                const statusColor = item.status.startsWith('OFFLINE') ? itemColors[item.status] : (itemColors[details?.type] || 'bg-gray-500');
                                return (
                                    <div key={item.id} className="p-3 bg-gray-800 rounded-md">
                                        <p className="font-bold">{details?.name} <span className="text-xs text-gray-400">({item.id.slice(-6)})</span></p>
                                        <p>Status: <span className={`font-semibold px-2 py-0.5 text-xs rounded-full text-white ${statusColor}`}>{item.status}</span></p>
                                        {item.hostname && <p>Hostname: <span className="font-mono">{item.hostname}</span></p>}
                                        {item.internalIp && <p>Internal IP: <span className="font-mono">{item.internalIp}</span></p>}
                                        {item.publicIp && <p>Public IP: <span className="font-mono">{item.publicIp}</span></p>}
                                    </div>
                                )
                            })
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const LayoutView = () => {
    // --- THE FIX: Select from the nested 'state' object ---
    const dataCenterLayout = useGameStore(state => state.state.dataCenterLayout);
    const [selectedSlotId, setSelectedSlotId] = useState(null);
    const gridSlots = Array.from({ length: 24 }, (_, i) => `A${i + 1}`);
    const itemColors = { 'RACK': 'border-cyan-400', 'SERVER': 'bg-green-500', 'NETWORKING': 'bg-blue-500', 'ROUTER': 'bg-purple-500', 'OFFLINE_POWER': 'bg-yellow-500', 'OFFLINE_HEAT': 'bg-orange-500', 'OFFLINE_FAILED': 'bg-red-500' };
    const handleSlotClick = (slotId) => { if (dataCenterLayout[slotId]) setSelectedSlotId(slotId); };

    return (
        <div className="p-4 bg-gray-800 text-gray-200 h-full overflow-auto">
            <h2 className="text-xl font-bold mb-4 border-b border-gray-600 pb-2">LayoutView - Server Room Floor Plan</h2>
            <div className="grid grid-cols-8 gap-4">
                {gridSlots.map(slotId => {
                    const rack = dataCenterLayout[slotId];
                    return (
                        <div
                            key={slotId}
                            onClick={() => handleSlotClick(slotId)}
                            className={`h-48 border-2 p-1 flex flex-col ${rack ? `${itemColors['RACK']} bg-gray-700 cursor-pointer hover:bg-blue-900/50` : 'border-dashed border-gray-600'}`}
                        >
                            <div className="text-sm font-bold">{slotId}</div>
                            {rack && (
                                <div className="space-y-0.5 mt-1">
                                    {rack.contents.map(item => {
                                         const details = HARDWARE_CATALOG.find(h => h.id === item.type);
                                         const statusColor = item.status.startsWith('OFFLINE') ? itemColors[item.status] : (itemColors[details?.type] || 'bg-gray-600');
                                        return <div key={item.id} className={`h-2.5 rounded-sm w-full ${statusColor}`}></div>;
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
            {selectedSlotId && <LayoutDetailModal slotId={selectedSlotId} rack={dataCenterLayout[selectedSlotId]} onClose={() => setSelectedSlotId(null)} />}
        </div>
    );
};

export default LayoutView;
