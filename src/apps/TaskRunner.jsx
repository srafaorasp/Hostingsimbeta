import React, { useState, useEffect, useMemo } from 'react';
import useGameStore from '/src/store/gameStore.js';
import { TASK_DEFINITIONS, PRIORITIES, PRIORITY_COLORS } from '/src/data.js';

const TaskCreator = ({ taskDef }) => {
    const createTask = useGameStore(state => state.createTask);

    // --- THE FIX: Select each piece of state individually to prevent re-renders ---
    const employees = useGameStore((s) => s.state.employees);
    const inventory = useGameStore((s) => s.state.inventory);
    const stagedHardware = useGameStore((s) => s.state.stagedHardware);
    const dataCenterLayout = useGameStore((s) => s.state.dataCenterLayout);
    const tasks = useGameStore((s) => s.state.tasks);
    
    const [priority, setPriority] = useState('Normal');
    const [selectedTarget, setSelectedTarget] = useState({ location: '', item: '', pdu: '' });

    const hasHardware = useMemo(() => 
        taskDef.requiredHardware ? Object.entries(taskDef.requiredHardware).every(([itemId, count]) => (inventory[itemId] || 0) >= count) : true
    , [inventory, taskDef.requiredHardware]);
    
    const hasSkilledEmployee = useMemo(() => 
        employees.some(e => e.skill === taskDef.requiredSkill)
    , [employees, taskDef.requiredSkill]);
    
    const hasStaged = useMemo(() => {
        if (!taskDef.needsStaged) return true;
        const availableCount = stagedHardware.filter(h => h.type === taskDef.needsStaged).length;
        const reservedCount = tasks.filter(t => ['Pending', 'In Progress'].includes(t.status) && t.needsStaged === taskDef.needsStaged).length;
        return availableCount > reservedCount;
    }, [stagedHardware, tasks, taskDef.needsStaged]);
    
    const availableTargets = useMemo(() => {
        if (!taskDef.needsTarget) return [];

        let targets = [];
        switch (taskDef.needsTarget) {
            case 'RACK_UNPOWERED': {
                const pdus = Object.values(dataCenterLayout).flatMap(r => r.contents || []).filter(c => c.type.includes('PDU')).map(p => p.id);
                if (pdus.length === 0) break;
                targets = Object.keys(dataCenterLayout)
                    .filter(locId => dataCenterLayout[locId].type === 'RACK' && !dataCenterLayout[locId].pdu)
                    .map(locId => ({ text: `Rack at ${locId}`, value: { location: locId, pdu: pdus[0] } }));
                break;
            }
             case 'RACK':
                targets = Object.keys(dataCenterLayout)
                    .filter(locId => dataCenterLayout[locId].type === 'RACK')
                    .map(locId => ({ text: `Rack at ${locId}`, value: { location: locId } }));
                break;
            case 'RACK_POWERED':
                targets = Object.keys(dataCenterLayout)
                    .filter(locId => dataCenterLayout[locId].type === 'RACK' && dataCenterLayout[locId].pdu)
                    .map(locId => ({ text: `Rack at ${locId}`, value: { location: locId } }));
                break;
            case 'SERVER_INSTALLED':
            case 'SERVER_ONLINE':
            case 'SERVER_FAILED':
            case 'SERVER_LAN_CONFIGURED': {
                const tempTargets = [];
                const requiredStatus = {
                    'SERVER_INSTALLED': 'INSTALLED',
                    'SERVER_ONLINE': 'ONLINE',
                    'SERVER_LAN_CONFIGURED': 'LAN_CONFIGURED'
                }[taskDef.needsTarget];

                Object.entries(dataCenterLayout).forEach(([locId, rack]) => {
                    if (rack.contents) {
                        rack.contents.forEach(item => {
                            let statusMatch = (taskDef.needsTarget === 'SERVER_FAILED')
                                ? item.status?.startsWith('OFFLINE')
                                : item.status === requiredStatus;
                            
                            if ((item.type.includes('server') || item.type.includes('switch') || item.type.includes('router')) && statusMatch && rack.pdu) {
                                tempTargets.push({ text: `${item.hostname || item.type} (${item.id.slice(-4)}) in ${locId}`, value: { location: locId, item: item.id } });
                            }
                        });
                    }
                });
                targets = tempTargets;
                break;
            }
        }
        return targets.sort((a, b) => a.text.localeCompare(b.text));
    }, [dataCenterLayout, taskDef.needsTarget]);
    
    useEffect(() => {
        if (availableTargets.length > 0) {
            setSelectedTarget(availableTargets[0].value);
        } else {
            setSelectedTarget({ location: '', item: '', pdu: '' });
        }
    }, [JSON.stringify(availableTargets)]);

    const canCreate = hasHardware && hasSkilledEmployee && hasStaged && (!taskDef.needsTarget || selectedTarget.location);

    const handleSchedule = () => {
        let taskPayload = { ...taskDef, priority, targetLocation: selectedTarget.location, targetItem: selectedTarget.item, targetPdu: selectedTarget.pdu };
        if (taskDef.needsStaged) {
            const unreservedItem = stagedHardware.find(item => item.type === taskDef.needsStaged && !tasks.some(t => t.requiredStaged === item.id));
            if (unreservedItem) taskPayload.requiredStaged = unreservedItem.id;
            else return;
        }
        createTask(taskPayload);
    };

    const handleTargetChange = (e) => {
        const selectedValue = e.target.value;
        const target = availableTargets.find(t => JSON.stringify(t.value) === selectedValue);
        if (target) {
            setSelectedTarget(target.value);
        }
    };
    
    return (
        <div className="p-2 bg-gray-700 rounded-md">
            <p className="font-bold">{taskDef.description}</p>
            <div className="text-xs mt-1 space-y-1">
                {!hasSkilledEmployee && <p className="text-red-400">Missing skill: {taskDef.requiredSkill}</p>}
                {!hasHardware && <p className="text-red-400">Missing items in inventory.</p>}
                {!hasStaged && <p className="text-red-400">No staged hardware available.</p>}
                {taskDef.needsTarget && availableTargets.length === 0 && <p className="text-red-400">No valid targets available.</p>}
            </div>
            
            {taskDef.needsTarget && availableTargets.length > 0 && (
                <div className="text-xs mt-1 space-y-1">
                    <select value={JSON.stringify(selectedTarget)} onChange={handleTargetChange} className="w-full p-1 bg-gray-800 rounded">
                        {availableTargets.map((t, i) => <option key={i} value={JSON.stringify(t.value)}>{t.text}</option>)}
                    </select>
                </div>
            )}
            <div className="flex justify-between items-center mt-2">
                <div className="flex space-x-1">{Object.keys(PRIORITIES).map(p => <button key={p} onClick={() => setPriority(p)} className={`px-1 py-0.5 text-xs rounded ${priority === p ? PRIORITY_COLORS[p] : 'bg-gray-600'}`}>{p.charAt(0)}</button>)}</div>
                <button onClick={handleSchedule} disabled={!canCreate} className="bg-blue-600 px-3 py-1 rounded-md text-sm font-semibold hover:bg-blue-500 disabled:bg-gray-500 disabled:cursor-not-allowed"> Schedule </button>
            </div>
        </div>
    );
};

const TaskRunner = () => {
    const abortTask = useGameStore(state => state.abortTask);
    
    const tasks = useGameStore(state => state.state.tasks);
    const employees = useGameStore(state => state.state.employees);
    const time = useGameStore(state => state.state.time);
    
    const formatETA = (completionTime) => { 
        if (!completionTime) return 'N/A';
        const diff = new Date(completionTime).getTime() - time.getTime(); 
        if (diff <= 0) return 'Complete'; 
        const totalMinutes = Math.floor(diff / 60000); 
        const hours = Math.floor(totalMinutes/60);
        const minutes = totalMinutes % 60;
        return `${hours > 0 ? `${hours}h ` : ''}${minutes}m`; 
    };
    
    // Memoize the list of available jobs so it doesn't re-render on every time change
    const availableJobs = useMemo(() => (
        <div className="mt-2 space-y-2">
            {TASK_DEFINITIONS.map(taskDef => <TaskCreator key={taskDef.id} taskDef={taskDef} />)}
        </div>
    ), []);

    return ( 
        <div className="p-4 bg-gray-800 text-white h-full flex flex-col">
            <h2 className="text-xl font-bold mb-4 border-b border-gray-600 pb-2">TaskRunner</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-grow min-h-0">
                <div className="bg-gray-900 p-2 rounded-md overflow-y-auto">
                    <h3 className="font-bold text-lg mb-2 sticky top-0 bg-gray-900 py-1">Available Jobs</h3>
                    {availableJobs}
                </div>
                <div className="bg-gray-900 p-2 rounded-md overflow-y-auto"><h3 className="font-bold text-lg mb-2 sticky top-0 bg-gray-900 py-1">Task Queue</h3><div className="mt-2 space-y-2">{tasks.length === 0 ? <p className="text-gray-400">No tasks in queue.</p> : [...tasks].sort((a,b) => (PRIORITIES[b.priority] || 0) - (PRIORITIES[a.priority] || 0)).map(task => { const emp = task.assignedTo ? employees.find(e => e.id === task.assignedTo) : null; return (<div key={task.id} className="p-2 bg-gray-700 rounded-md text-sm"><div className="flex justify-between items-start"><div><strong>Task:</strong> {task.description}</div><span className={`px-2 py-0.5 text-xs rounded-full ${PRIORITY_COLORS[task.priority]}`}>{task.priority}</span></div><div>Status: {task.status}</div>{emp && <div>Assigned: {emp.name}</div>}{task.status === 'In Progress' && task.completionTime && <div>ETA: {formatETA(task.completionTime)}</div>}<button onClick={() => abortTask(task.id)} className="mt-2 text-xs bg-red-700 px-2 py-1 rounded hover:bg-red-600">Abort</button></div>);})}</div></div>
            </div>
        </div> 
    );
};

export default TaskRunner;

