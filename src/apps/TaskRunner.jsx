import React, { useState, useEffect, useMemo } from 'react';
import useGameStore from '/src/store/gameStore.js';
import { TASK_DEFINITIONS, PRIORITIES, PRIORITY_COLORS } from '/src/data.js';

const TaskCreator = ({ taskDef }) => {
    const createTask = useGameStore(state => state.createTask);
    const employees = useGameStore(state => state.state.employees);
    const inventory = useGameStore(state => state.state.inventory);
    const stagedHardware = useGameStore(state => state.state.stagedHardware);
    const dataCenterLayout = useGameStore(state => state.state.dataCenterLayout);
    const tasks = useGameStore(state => state.state.tasks);
    
    const [priority, setPriority] = useState('Normal');
    const [selectedTarget, setSelectedTarget] = useState(null);
    const [targetPdu, setTargetPdu] = useState('');

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
                const pdus = Object.keys(dataCenterLayout).filter(k => dataCenterLayout[k].type === 'PDU');
                if (pdus.length === 0) break;
                targets = Object.keys(dataCenterLayout)
                    .filter(locId => dataCenterLayout[locId].type === 'RACK' && !dataCenterLayout[locId].pdu)
                    .map(locId => ({ text: `Rack at ${locId}`, locationId: locId, needsPdu: true, pdus }));
                break;
            }
            case 'RACK_POWERED':
                targets = Object.keys(dataCenterLayout)
                    .filter(locId => dataCenterLayout[locId].type === 'RACK' && dataCenterLayout[locId].pdu)
                    .map(locId => ({ text: `Rack at ${locId}`, locationId: locId }));
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
                                tempTargets.push({ text: `${item.hostname || item.type} (${item.id.slice(-4)}) in ${locId}`, locationId: locId, itemId: item.id });
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
    
    const dependencyMet = !taskDef.needsTarget || availableTargets.length > 0;

    useEffect(() => {
        const firstTarget = availableTargets.length > 0 ? availableTargets[0] : null;
        setSelectedTarget(firstTarget);
        if (firstTarget && firstTarget.needsPdu && firstTarget.pdus.length > 0) {
            setTargetPdu(firstTarget.pdus[0]);
        } else {
             setTargetPdu('');
        }
    }, [JSON.stringify(availableTargets)]);

    const canCreate = hasHardware && hasSkilledEmployee && hasStaged && dependencyMet && (!taskDef.needsTarget || selectedTarget);

    const handleSchedule = () => {
        let taskPayload = { ...taskDef, priority };

        if (taskDef.needsStaged) {
            const unreservedItem = stagedHardware.find(item => item.type === taskDef.needsStaged && !tasks.some(t => t.requiredStaged === item.id));
            if (unreservedItem) {
                taskPayload.requiredStaged = unreservedItem.id;
            } else {
                 console.error("No unreserved staged item available for task.");
                 return;
            }
        }
        
        if (taskDef.needsTarget) {
            if (selectedTarget) {
                taskPayload.targetLocation = selectedTarget.locationId;
                if (selectedTarget.itemId) {
                    taskPayload.targetItem = selectedTarget.itemId;
                }
                if(targetPdu) {
                    taskPayload.targetPdu = targetPdu;
                }
            } else {
                 console.error("Target required but not selected for task.");
                 return;
            }
        }
        createTask(taskPayload);
    };
    
    return (
        <div className="p-2 bg-gray-700 rounded-md">
            <p className="font-bold">{taskDef.description}</p>
            <p className="text-xs text-gray-400">Requires: {taskDef.requiredSkill}</p>
            {taskDef.needsTarget && (
                <div className="text-xs mt-1 space-y-1">
                    {dependencyMet ? <>
                        <select 
                            value={selectedTarget ? `${selectedTarget.locationId}-${selectedTarget.itemId || ''}` : ''} 
                            onChange={e => {
                                const val = e.target.value;
                                const target = availableTargets.find(t => `${t.locationId}-${t.itemId || ''}` === val) || null;
                                setSelectedTarget(target);
                            }} 
                            className="w-full p-1 bg-gray-800 rounded"
                        >
                            <option value="">Select a target...</option>
                            {availableTargets.map(t => <option key={`${t.locationId}-${t.itemId || ''}`} value={`${t.locationId}-${t.itemId || ''}`}>{t.text}</option>)}
                        </select>
                        {selectedTarget && selectedTarget.needsPdu && (
                            <select value={targetPdu} onChange={e => setTargetPdu(e.target.value)} className="w-full p-1 bg-gray-800 rounded">
                               {selectedTarget.pdus.map(pduId => <option key={pduId} value={pduId}>{pduId}</option>)}
                            </select>
                        )}
                    </> : <p className="text-xs text-red-400 mt-1">Dependencies not met.</p> }
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
    
    return ( 
        <div className="p-4 bg-gray-800 text-white h-full flex flex-col">
            <h2 className="text-xl font-bold mb-4 border-b border-gray-600 pb-2">TaskRunner</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-grow min-h-0">
                <div className="bg-gray-900 p-2 rounded-md overflow-y-auto"><h3 className="font-bold text-lg mb-2 sticky top-0 bg-gray-900 py-1">Available Jobs</h3><div className="mt-2 space-y-2">{TASK_DEFINITIONS.map(taskDef => <TaskCreator key={taskDef.id} taskDef={taskDef} />)}</div></div>
                <div className="bg-gray-900 p-2 rounded-md overflow-y-auto"><h3 className="font-bold text-lg mb-2 sticky top-0 bg-gray-900 py-1">Task Queue</h3><div className="mt-2 space-y-2">{tasks.length === 0 ? <p className="text-gray-400">No tasks in queue.</p> : [...tasks].sort((a,b) => (PRIORITIES[b.priority] || 0) - (PRIORITIES[a.priority] || 0)).map(task => { const emp = task.assignedTo ? employees.find(e => e.id === task.assignedTo) : null; return (<div key={task.id} className="p-2 bg-gray-700 rounded-md text-sm"><div className="flex justify-between items-start"><div><strong>Task:</strong> {task.description}</div><span className={`px-2 py-0.5 text-xs rounded-full ${PRIORITY_COLORS[task.priority]}`}>{task.priority}</span></div><div>Status: {task.status}</div>{emp && <div>Assigned: {emp.name}</div>}{task.status === 'In Progress' && task.completionTime && <div>ETA: {formatETA(task.completionTime)}</div>}<button onClick={() => abortTask(task.id)} className="mt-2 text-xs bg-red-700 px-2 py-1 rounded hover:bg-red-600">Abort</button></div>);})}</div></div>
            </div>
        </div> 
    );
};

export default TaskRunner;

