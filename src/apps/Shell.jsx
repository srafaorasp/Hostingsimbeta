import React, { useState, useRef, useEffect } from "react";
import useGameStore from "../store/gameStore";
import { scriptingEngine } from "../game/scriptingEngine";

const Shell = () => {
  const [input, setInput] = useState("");
  const [history, setHistory] = useState([]);
  const addLog = useGameStore((state) => state.addLog);
  const endOfHistoryRef = useRef(null);

  const scrollToBottom = () => {
    endOfHistoryRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [history]);

  const handleCommand = (command) => {
    const [cmd, ...args] = command.trim().split(" ");
    const output = { command, result: "" };

    const getState = useGameStore.getState;

    switch (cmd) {
      case "help":
        output.result =
          "Available commands: help, clear, ls, run <script_name>";
        break;
      case "clear":
        setHistory([]);
        return; // Skip adding to history
      case "ls":
        output.result = `Scripts: ${getState()
          .scripts.map((s) => s.name)
          .join(", ")}`;
        break;
      case "run":
        const scriptName = args[0];
        const script = getState().scripts.find((s) => s.name === scriptName);
        if (script) {
          const result = scriptingEngine.run(script.code, [], getState);
          output.result = `Script '${scriptName}' executed. Result: ${result}`;
        } else {
          output.result = `Error: Script '${scriptName}' not found.`;
        }
        break;
      default:
        output.result = `Command not found: ${cmd}`;
        break;
    }
    addLog({ source: "Shell", message: output.result });
    setHistory((prev) => [...prev, output]);
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleCommand(input);
      setInput("");
    }
  };

  return (
    <div className="bg-black text-green-400 font-mono text-sm h-full flex flex-col p-2">
      <div className="overflow-y-auto flex-grow">
        <p>Hosting Simulator Shell [Version 1.0.0]</p>
        <p>(c) 2025 SimuCorp. All rights reserved.</p>
        <br />
        {history.map((line, index) => (
          <div key={index}>
            <p>
              <span className="text-cyan-400">user@host</span>
              <span className="text-white">:~$</span> {line.command}
            </p>
            <p className="text-white">{line.result}</p>
          </div>
        ))}
        <div ref={endOfHistoryRef} />
      </div>
      <div className="flex">
        <span className="text-cyan-400">user@host</span>
        <span className="text-white">:~$</span>
        <input
          type="text"
          value={input}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          className="bg-transparent border-none text-green-400 focus:outline-none flex-grow ml-2"
          autoFocus
        />
      </div>
    </div>
  );
};

export default Shell;

