import React from 'react';
import useGameStore from '/src/store/gameStore.js';

const SysLog = () => {
    const eventLog = useGameStore(state => state.state.eventLog);

    return (
        <div className="p-2 bg-gray-900 text-white h-full font-mono text-xs overflow-y-auto">
            {eventLog.map(event => (
                <p key={event.id}>
                    <span className="text-green-400">{new Date(event.time).toLocaleTimeString()}:</span> 
                    <span className="text-gray-300"> {event.message}</span>
                </p>
            ))}
        </div>
    );
};

export default SysLog;

