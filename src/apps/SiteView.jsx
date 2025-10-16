import React, { useState, useEffect, useMemo } from 'react';
import useGameStore from '/src/store/gameStore.js';

// --- Helper: Get position based on employee location ---
const getEmployeePosition = (employee, rackPositions) => {
    if (!employee) return { top: '50%', left: '50%' };

    // Waypoints for pathing
    const POSITIONS = {
        breakRoom: { top: '80%', left: '80%' },
        techRoom: { top: '25%', left: '80%' },
        hallwaySouth: { top: '70%', left: '68%' },
        hallwayNorth: { top: '30%', left: '68%' },
        dcEntrance: { top: '50%', left: '58%' },
    };

    // If assigned to a task with a specific target
    if (employee.assignedTaskId) {
        const task = useGameStore.getState().state.tasks.find(t => t.id === employee.assignedTaskId);
        if (task && task.targetLocation && rackPositions[task.targetLocation]) {
            // This is a simplified path. A real implementation might need A* pathfinding.
            const rackPos = rackPositions[task.targetLocation];
            const aislePos = { top: rackPos.top, left: '35%' };
            if (employee.location === 'Server Room') return aislePos; // Go to the aisle first
        }
    }
    
    // General room locations
    switch (employee.location) {
        case 'Break Room': return POSITIONS.breakRoom;
        case 'Tech Room': return POSITIONS.techRoom;
        case 'Server Room': return POSITIONS.dcEntrance; // Default server room position
        default: return POSITIONS.breakRoom; // Default to break room
    }
};


const SiteView = () => {
    const dataCenterLayout = useGameStore(state => state.state.dataCenterLayout);
    const employees = useGameStore(state => state.state.employees);
    const stagedHardware = useGameStore(state => state.state.stagedHardware);

    // Memoize the rack elements to prevent re-renders unless layout changes
    const rackElements = useMemo(() => {
        const elements = [];
        const rows = 4;
        const cols = 8;
        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                const slotId = `A${i * cols + j + 1}`;
                const rack = dataCenterLayout[slotId];
                let rackClass = 'bg-gray-900 border-gray-600'; // Default empty
                let contentCount = 0;

                if (rack) {
                    if (rack.pdu) {
                        rackClass = 'bg-gray-800 border-gray-500'; // Installed but offline
                        contentCount = rack.contents.filter(c => c.status === 'ONLINE' || c.status === 'NETWORKED').length;
                        if (contentCount > 0) {
                            rackClass = 'bg-green-800 border-green-500'; // Online
                        }
                        if (rack.contents.some(c => c.status && c.status.includes('OFFLINE'))) {
                            rackClass = 'bg-red-800 border-red-500'; // Has an issue
                        }
                    }
                }

                elements.push(
                    <div key={slotId} className="group relative">
                        <div className={`w-5 h-20 rounded transition-colors duration-500 ${rackClass}`}></div>
                        {rack && (
                            <div className="rack-tooltip absolute bottom-full mb-2 w-48 bg-gray-900 border border-gray-600 rounded-md p-2 text-xs z-10 pointer-events-none">
                                <p className="font-bold border-b border-gray-700 pb-1 mb-1">{slotId}</p>
                                <p>Status: {rack.pdu ? 'Powered' : 'Offline'}</p>
                                <p>Contents: {rack.contents.length}</p>
                            </div>
                        )}
                    </div>
                );
            }
        }
        return elements.reduce((acc, el, i) => {
            const rowIndex = Math.floor(i / cols);
            if (!acc[rowIndex]) acc[rowIndex] = [];
            acc[rowIndex].push(el);
            return acc;
        }, []).map((row, i) => <div key={i} className="flex flex-row space-x-2">{row}</div>);
    }, [dataCenterLayout]);


    return (
        <div className="w-full h-full bg-gray-900 border-2 border-gray-700 rounded-lg p-4 flex flex-col text-gray-200 font-sans">
            <h1 className="text-2xl font-bold border-b border-gray-600 pb-2 mb-4">
                SiteView - Facility Map
            </h1>
            
            <div id="map-area" className="flex-grow bg-gray-800 rounded-md relative overflow-hidden">
                {/* Rooms */}
                <div className="absolute top-[5%] left-[5%] w-[55%] h-[90%] bg-gray-700/50 border-2 border-gray-600 rounded-lg">
                    <span className="absolute top-2 left-3 text-lg font-semibold text-gray-400">Data Center</span>
                    <div className="absolute top-1/2 -translate-y-1/2 right-[-2px] w-2 h-16 bg-gray-600 border-y-2 border-gray-500"></div>
                    <div className="absolute inset-0 p-6 pt-16 flex flex-col justify-between">
                        {rackElements}
                    </div>
                </div>
                <div className="absolute top-[5%] left-[60%] w-[10%] h-[90%] bg-gray-700/30 border-y-2 border-gray-600">
                    <span className="absolute top-2 left-1/2 -translate-x-1/2 text-sm font-semibold text-gray-400 transform -rotate-90 origin-center translate-y-12">HALL</span>
                </div>
                <div className="absolute top-[5%] left-[70%] w-[25%] h-[42.5%] bg-gray-700/50 border-2 border-gray-600 rounded-lg">
                    <span className="absolute top-2 left-3 text-lg font-semibold text-gray-400">Tech Room</span>
                    <div className="absolute bottom-1/2 -translate-y-[-50%] left-[-2px] w-2 h-16 bg-gray-600 border-y-2 border-gray-500"></div>
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-2 bg-yellow-600 border-x-2 border-yellow-500"></div>
                    <span className="absolute top-2 left-1/2 -translate-x-1/2 text-xs text-yellow-300">Loading Bay</span>
                    <div className="absolute bottom-4 right-4 w-32 h-12 bg-yellow-900/50 border-2 border-yellow-800 rounded">
                        <span className="absolute top-1 left-2 text-xs text-yellow-300">Workbench</span>
                    </div>
                    <div className="absolute bottom-4 left-4 flex flex-wrap gap-2">
                        {stagedHardware.map(item => (
                            <div key={item.id} className="w-8 h-8 bg-gray-500 rounded" title={item.type}></div>
                        ))}
                    </div>
                </div>
                <div className="absolute bottom-[5%] left-[70%] w-[25%] h-[42.5%] bg-gray-700/50 border-2 border-gray-600 rounded-lg">
                    <span className="absolute top-2 left-3 text-lg font-semibold text-gray-400">Break Room</span>
                    <div className="absolute top-1/2 -translate-y-[-50%] left-[-2px] w-2 h-16 bg-gray-600 border-y-2 border-gray-500"></div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
                        <div className="w-16 h-16 bg-green-900/50 border-2 border-green-800 rounded-full"></div>
                    </div>
                </div>

                {/* Employee Dots */}
                {employees.map(emp => {
                    const position = getEmployeePosition(emp, {}); // Pass an empty object for now
                    const color = emp.skill === 'Network Engineer' ? 'bg-blue-500' : 'bg-orange-500';
                    return (
                        <div 
                            key={emp.id}
                            className={`absolute w-4 h-4 rounded-full border-2 border-white shadow-lg transition-all duration-1000 ease-in-out ${color} ${emp.status !== 'Idle' ? 'animate-pulse' : ''}`}
                            style={{ top: position.top, left: position.left }}
                            title={`${emp.name} (${emp.skill}) - ${emp.status}`}
                        ></div>
                    );
                })}
            </div>
        </div>
    );
};

export default SiteView;

