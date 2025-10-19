import React, { useState, useMemo } from 'react';
import { useGameStore } from '../store/gameStore';
import { formatGameTime } from '../lib/utils';
import { Input } from '../components/ui/input';

const SysLog = () => {
  const logs = useGameStore((state) => state.log);
  const [filter, setFilter] = useState('');

  const sourceColors = {
    System: 'text-cyan-400',
    Hardware: 'text-yellow-400',
    ISP: 'text-green-400',
    Power: 'text-orange-400',
    default: 'text-gray-400',
  };

  const filteredLogs = useMemo(() => {
    if (!filter) {
      return logs;
    }
    return logs.filter((log) =>
      log.message.toLowerCase().includes(filter.toLowerCase()) ||
      log.source.toLowerCase().includes(filter.toLowerCase())
    );
  }, [logs, filter]);

  return (
    <div className="p-2 h-full flex flex-col bg-black text-white font-mono">
      <div className="p-2">
        <Input
          type="text"
          placeholder="Filter logs..."
          className="w-full bg-gray-800 border-gray-600 text-white placeholder-gray-500"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>
      <div className="flex-grow overflow-y-auto pr-2 text-sm">
        {filteredLogs.map((log, index) => (
          <div key={index} className="whitespace-pre-wrap break-words">
            <span className="text-gray-500 mr-2">
              [{formatGameTime(log.gameTime)}]
            </span>
            <span className="text-gray-600 mr-2">
              [{new Date(log.realTime).toLocaleString()}]
            </span>
            <span className={`${sourceColors[log.source] || sourceColors.default} font-bold mr-2`}>
              [{log.source}]
            </span>
            <span>{log.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SysLog;
