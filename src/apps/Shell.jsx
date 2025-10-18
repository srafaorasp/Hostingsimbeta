import React, { useState, useEffect, useRef } from 'react';
import useGameStore from '/src/store/gameStore.js';
import { executeCommand } from '/src/game/scriptingEngine.js';

const Shell = () => {
    const [history, setHistory] = useState(['DataCenter OS [Version 1.0.0]', '(c) 2025 DataCenter Corp. All rights reserved.', '']);
    const [input, setInput] = useState('');
    const [commandHistory, setCommandHistory] = useState([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const endOfHistoryRef = useRef(null);

    const scrollToBottom = () => {
        endOfHistoryRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [history]);

    const handleInputChange = (e) => {
        setInput(e.target.value);
    };

    const handleCommandSubmit = async () => {
        const command = input.trim();
        if (command === '') {
            setHistory(prev => [...prev, `> `]);
            setInput('');
            return;
        }

        const newCommandHistory = [command, ...commandHistory];
        setCommandHistory(newCommandHistory);
        setHistoryIndex(-1);

        let output;
        if (command.toLowerCase() === 'clear') {
            setHistory([]);
            setInput('');
            return;
        } else {
            output = await executeCommand(command, 'player', 'shell');
        }

        setHistory(prev => [...prev, `> ${command}`, ...output.split('\n')]);
        setInput('');
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleCommandSubmit();
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (historyIndex < commandHistory.length - 1) {
                const newIndex = historyIndex + 1;
                setHistoryIndex(newIndex);
                setInput(commandHistory[newIndex]);
            }
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (historyIndex > 0) {
                const newIndex = historyIndex - 1;
                setHistoryIndex(newIndex);
                setInput(commandHistory[newIndex]);
            } else {
                setHistoryIndex(-1);
                setInput('');
            }
        }
    };

    return (
        <div className="p-2 bg-black text-green-400 h-full font-mono text-sm overflow-y-auto" onClick={() => endOfHistoryRef.current?.focus()}>
            {history.map((line, index) => (
                <p key={index} className="whitespace-pre-wrap">{line}</p>
            ))}
            <div className="flex">
                <span className="mr-2">&gt;</span>
                <input
                    ref={endOfHistoryRef}
                    type="text"
                    value={input}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    className="bg-transparent border-none text-green-400 w-full focus:outline-none"
                    autoFocus
                />
            </div>
        </div>
    );
};

export default Shell;
