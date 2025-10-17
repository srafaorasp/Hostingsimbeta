import React, { useState } from 'react';
import useGameStore from '/src/store/gameStore.js';
import { HARDWARE_CATALOG } from '/src/data.js';

const OrderUp = () => {
    const purchaseAndStageItem = useGameStore(state => state.purchaseAndStageItem);
    const cash = useGameStore(state => state.state.finances.cash);
    const inventory = useGameStore(state => state.state.inventory);

    const [quantities, setQuantities] = useState({});

    const handleQuantityChange = (itemId, value) => {
        const quantity = Math.max(1, parseInt(value, 10) || 1);
        setQuantities(prev => ({ ...prev, [itemId]: quantity }));
    };

    const handlePurchase = (item) => {
        const quantity = quantities[item.id] || 1;
        purchaseAndStageItem(item, quantity);
    };

    return (
        <div className="p-4 bg-gray-800 text-gray-200 h-full flex flex-col">
            <h2 className="text-xl font-bold mb-4 border-b border-gray-600 pb-2">OrderUp</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-grow min-h-0">
                <div className="bg-gray-900 p-3 rounded-md overflow-y-auto">
                    <h3 className="font-bold text-lg mb-2">Catalog</h3>
                    <ul className="space-y-2">
                        {HARDWARE_CATALOG.map(item => {
                            const quantity = quantities[item.id] || 1;
                            const totalCost = item.price * quantity;
                            return (
                                <li key={item.id} className="p-2 bg-gray-700 rounded-md flex justify-between items-center gap-2">
                                    <span className="flex-grow">{item.name}</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs">Qty:</span>
                                        <input type="number" min="1" value={quantity} onChange={(e) => handleQuantityChange(item.id, e.target.value)} className="w-16 bg-gray-800 border border-gray-600 rounded px-2 py-1 text-sm text-white" />
                                        <button onClick={() => handlePurchase(item)} disabled={cash < totalCost} className="bg-green-600 px-3 py-1 rounded-md text-sm font-semibold hover:bg-green-500 disabled:bg-gray-500 w-28 text-center text-white">
                                            ${totalCost.toLocaleString()}
                                        </button>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                </div>
                <div className="bg-gray-900 p-3 rounded-md">
                    <h3 className="font-bold text-lg mb-2">Inventory</h3>
                    {Object.keys(inventory).length === 0 ? <p className="text-gray-500">Empty.</p> : (
                        <ul className="space-y-1">
                            {Object.entries(inventory).map(([itemId, count]) => {
                                const itemDetails = HARDWARE_CATALOG.find(h => h.id === itemId);
                                return (
                                    <li key={itemId} className="text-sm p-1 bg-gray-700 rounded flex justify-between">
                                        <span>{itemDetails?.name}</span>
                                        <span className="font-semibold">x {count}</span>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
};

export default OrderUp;

