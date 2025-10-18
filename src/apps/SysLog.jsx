import React, { useState, useMemo } from 'react';
import useGameStore from '/src/store/gameStore.js';
import { Button } from '../components/ui/button';

const LOG_LEVEL_COLORS = {
    'INFO': 'text-gray-400',
    'PLAYER': 'text-blue-400',
    'SCRIPT': 'text-green-400',
    'DAEMON': 'text-purple-400',
    'ERROR': 'text-red-500',
    'default': 'text-gray-300'
};

const FILTERS = ['ALL', 'PLAYER', 'SCRIPT', 'DAEMON', 'ERROR'];

const SysLog = () => {
    const eventLog = useGameStore(state => state.state.eventLog);
    const [filter, setFilter] = useState('ALL');

    const filteredLog = useMemo(() => {
        if (filter === 'ALL') {
            return eventLog;
        }
        return eventLog.filter(event => event.level === filter);
    }, [eventLog, filter]);

    return (
        <div className="p-2 bg-gray-900 text-white h-full flex flex-col font-mono text-xs">
            <div className="flex-shrink-0 p-2 border-b border-gray-700 flex items-center gap-2">
                <span className="font-bold">Filter by:</span>
                {FILTERS.map(f => (
                    <Button 
                        key={f}
                        variant={filter === f ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFilter(f)}
                    >
                        {f}
                    </Button>
                ))}
            </div>
            <div className="flex-grow overflow-y-auto">
                {filteredLog.map(event => {
                    const color = LOG_LEVEL_COLORS[event.level] || LOG_LEVEL_COLORS['default'];
                    return (
                        <p key={event.id}>
                            <span className="text-gray-500">{new Date(event.time).toLocaleTimeString()}:</span> 
                            <span className={`font-bold ml-2 ${color}`}>[{event.level}]</span>
                            <span className="text-gray-300"> {event.message}</span>
                        </p>
                    )
                })}
            </div>
        </div>
    );
};

export default SysLog;
